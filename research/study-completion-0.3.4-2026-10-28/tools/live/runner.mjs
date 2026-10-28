// Study completion (0.3.4): the live-run runner as a library. Every effect is injected (sender, journal and capture
// storage, clock, sleep, offline compile of each capture), so the offline tests drive exactly this code with mocks.
// tools/live/run-live.mjs is the only caller that would pass real effects, and it refuses in this build.
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { assemble } from '../../../engine-repair-0.3.4-2026-10-27/tools/transport/prompt-assembly.mjs';
import { buildRequestBody, worstCaseCost, estimateTokens, SenderRefusal, createJournal, createCaptureSink, recoverJournal, createLiveSender } from './sender-bound.mjs';
import { verifyCompletionAuthorization, authorizationSha256, PHASES } from './authorization-bound.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex');

// ------------------------------------------------------------------ storage (files for a real run; Maps in tests)
export function fileJournalStore(path) {
  return { lines() { return existsSync(path) ? readFileSync(path, 'utf8').split('\n').filter(Boolean) : []; },
    append(line) { mkdirSync(dirname(path), { recursive: true }); appendFileSync(path, line + '\n', { mode: 0o600 }); } };
}
export function fileCaptureStore(dir) {
  const f = (id) => { if (!/^[A-Za-z0-9._-]{1,120}$/.test(id)) throw new SenderRefusal('capture_id_unsafe'); return join(dir, id + '.json'); };
  return { has: (id) => existsSync(f(id)), get: (id) => readFileSync(f(id), 'utf8'),
    set: (id, text) => { mkdirSync(dir, { recursive: true }); writeFileSync(f(id), text, { flag: 'wx', mode: 0o600 }); } };
}
// Captures and the journal stay outside every git working tree and outside the repository, so neither a commit nor
// a deployment can carry them (deployment exclusion alone does not prevent git disclosure).
export function privateLocationProblems(dir, repoRoot) {
  const p = [], abs = resolve(dir);
  if (repoRoot && (abs + '/').startsWith(resolve(repoRoot) + '/')) p.push('capture_location_inside_repository');
  for (let d = abs; ; d = dirname(d)) { if (existsSync(join(d, '.git'))) { p.push('capture_location_inside_git_working_tree:' + d); break; } if (dirname(d) === d) break; }
  if (existsSync(abs) && !statSync(abs).isDirectory()) p.push('capture_location_not_a_directory');
  return p;
}

// ------------------------------------------------------------------ frozen requests
// Rebuilds every body of a phase from the frozen prompt and texts and refuses unless each equals the frozen hash.
export function frozenRequests(set, phase, promptText, textOf) {
  return set.requests.filter((q) => q.phase === phase).map((q) => {
    const text = textOf(q);
    if (sha(text) !== q.text_sha256) throw new SenderRefusal('record_text_hash_mismatch', q.request_id);
    const a = assemble(promptText, text);
    const body = buildRequestBody({ system: a.system, user: a.user, maxTokens: set.request_parameters.maxTokens, effort: set.request_parameters.effort, thinking: set.request_parameters.thinking });
    const payload = JSON.stringify(body);
    if (sha(payload) !== q.body_sha256) throw new SenderRefusal('request_body_differs_from_frozen_body', q.request_id);
    return { requestId: q.request_id, recordId: q.base_record_id, phase, body, worstCaseUsd: worstCaseCost(estimateTokens(payload), body.max_tokens), estInputTokens: estimateTokens(payload) };
  });
}

// ------------------------------------------------------------------ stop rules (fixed in the plan; any one stops the run)
export const STOP_RULES = Object.freeze({
  'SR-01': 'the credential variable named in the authorization is absent (found at the gate, before the request is sent)',
  'SR-02': 'the authorization does not verify against the frozen plan (checked before the first request)',
  'SR-03': 'HTTP 400, 401, 402, 403, 404, 409 or 413',
  'SR-04': 'a redirect (never followed)',
  'SR-05': 'HTTP 504 or any other unexpected status',
  'SR-06': 'a network error or timeout that remains after the retries',
  'SR-07': 'three consecutive requests that end on 429, 500 or 529 after their retries, or a retry-after beyond the 20-second window',
  'SR-08': 'a refusal in PRE; the third refusal in RUN or TGT',
  'SR-09': 'a truncated response in PRE; in RUN or TGT, three or more truncations that are also at least 5% of completed requests',
  'SR-10': 'in RUN or TGT, ten or more responses that fail the quote-only contract that are also more than 25% of completed requests',
  'SR-11': 'a guard violation, mechanical-check failure or graph-validation failure when a capture is compiled offline',
  'SR-12': 'the spend cap, request cap or attempt cap is reached',
  'SR-13': 'reported input tokens above the frozen upper estimate',
  'SR-14': 'a response model identifier different from the authorized model',
  'SR-15': 'a capture refused because it contains a credential value or a credential-shaped string',
  'SR-16': 'a request found in an ambiguous state (sent with no outcome) on resume',
  'SR-17': 'cancellation by the operator',
  'SR-18': 'any refusal by the sender gate or the authorization (stops before the request)',
});
export const PRE_GATE = 'All three PRE requests complete with HTTP 200; at least two of the three return a valid quote-only contract that compiles offline with no guard, mechanical or graph-validation failure; no stop rule fires; spend within the PRE cap.';

export function stopFor(phase, t, last) {
  const o = last.outcome || '';
  if (last.refused) return last.refused === 'credential_absent' ? 'SR-01' : 'SR-18:' + last.refused;
  if (/_not_retryable$/.test(o)) return 'SR-03:' + o;
  if (o === 'redirect_refused') return 'SR-04';
  if (/^http_\d+_unexpected$/.test(o)) return 'SR-05:' + o;
  if (o === 'network_error' || o === 'timeout') return 'SR-06:' + o;
  if (o === 'retry_after_beyond_window') return 'SR-07:retry_after_beyond_window';
  if (t.consecutiveTransient >= 3) return 'SR-07';
  if (o === 'model_refusal' && (phase === 'PRE' || t.refusals >= 3)) return 'SR-08';
  if (o === 'response_truncated' && (phase === 'PRE' || (t.truncations >= 3 && t.truncations >= 0.05 * t.completed))) return 'SR-09';
  if (phase !== 'PRE' && t.contractFailures >= 10 && t.contractFailures > 0.25 * t.completed) return 'SR-10';
  if (last.engineFailure) return 'SR-11';
  if (o === 'budget_exhausted' || o === 'attempt_cap_reached' || o === 'request_cap_reached') return 'SR-12:' + o;
  if (last.inputAboveEstimate) return 'SR-13';
  if (last.modelMismatch) return 'SR-14';
  if (o === 'cancelled') return 'SR-17';
  return null;
}

// ------------------------------------------------------------------ one phase
// sender: createLiveSender(...) or a test double with send(request). journal: createJournal(lines, store.append).
// inspect(captureText, request) -> { contractOk, engineFailure, inputTokens, model } compiles the capture offline.
export async function runPhase({ phase, requests, sender, journal, captureStore, inspect, model, sleep, minIntervalMs = 1000, signal }) {
  const t = { completed: 0, refusals: 0, truncations: 0, contractFailures: 0, consecutiveTransient: 0, skippedDone: 0, sent: 0, contractOk: 0 };
  const rows = [];
  for (const [n, q] of requests.entries()) {
    const st = journal.stateOf(q.requestId);
    if (st === 'captured' || st === 'failed_final' || st === 'cancelled') { t.skippedDone++; continue; }
    if (st === 'sent' || st === 'interrupted_unknown') return { phase, stopped: 'SR-16:' + q.requestId, tally: t, rows };
    if (signal && signal.aborted) return { phase, stopped: 'SR-17', tally: t, rows };
    let res, refused = null;
    try { res = await sender.send({ requestId: q.requestId, recordId: q.recordId, phase, body: q.body, worstCaseUsd: q.worstCaseUsd, signal }); }
    catch (e) { if (e instanceof SenderRefusal) refused = e.code; else throw e; }
    if (refused) { rows.push({ request_id: q.requestId, refused }); return { phase, stopped: stopFor(phase, t, { refused }), tally: t, rows }; }
    t.sent++;
    const last = { outcome: res.outcome };
    if (res.outcome === 'ok' || res.outcome === 'model_refusal' || res.outcome === 'response_truncated' || /^unexpected_stop_reason/.test(res.outcome)) {
      t.completed++; t.consecutiveTransient = 0;
      if (res.outcome === 'model_refusal') t.refusals++;
      if (res.outcome === 'response_truncated') t.truncations++;
      if (res.outcome === 'ok') {
        let x; try { x = inspect(captureStore.get(q.requestId), q); } catch (e) { x = { contractOk: false, engineFailure: true, error: String(e && e.message).slice(0, 200) }; }
        if (x.contractOk) t.contractOk++; else t.contractFailures++;
        last.engineFailure = !!x.engineFailure; last.inputAboveEstimate = typeof x.inputTokens === 'number' && x.inputTokens > q.estInputTokens; last.modelMismatch = !!x.model && x.model !== model;
        rows.push({ request_id: q.requestId, outcome: res.outcome, contract_ok: x.contractOk, engine_failure: !!x.engineFailure });
      } else rows.push({ request_id: q.requestId, outcome: res.outcome });
    } else { rows.push({ request_id: q.requestId, outcome: res.outcome }); if (/^http_(?:429|500|529)$/.test(res.outcome)) t.consecutiveTransient++; }
    const s = stopFor(phase, t, last);
    if (s) return { phase, stopped: s, tally: t, rows };
    if (n < requests.length - 1) await sleep(minIntervalMs);
  }
  // The PRE gate reads the journal and captures of every PRE request, so a resumed run is judged on all of them,
  // not only on those sent by this process.
  let gate = null;
  if (phase === 'PRE') {
    let captured = 0, valid = 0, engineFailures = 0;
    for (const q of requests) {
      if (journal.stateOf(q.requestId) !== 'captured') continue;
      captured++;
      let x; try { x = inspect(captureStore.get(q.requestId), q); } catch { x = { contractOk: false, engineFailure: true }; }
      if (x.contractOk) valid++; if (x.engineFailure) engineFailures++;
    }
    gate = { passed: captured === requests.length && valid >= 2 && engineFailures === 0, captured, contract_valid: valid, engine_failures: engineFailures, rule: PRE_GATE };
  }
  return { phase, stopped: null, tally: t, rows, gate };
}

// ------------------------------------------------------------------ the whole run
// Everything a real run needs, in order. env is consulted only by the gate's credential resolver, for the one variable
// the authorization names. gateFactory defaults to createLiveSender (disabled in this build); the offline tests pass
// createGate with enabled true and a mock fetch, so this exact sequence is what they exercise.
export async function orchestrate({ plan, set, promptText, targeted, authorization, runDir, repoRoot, env, fetchImpl, inspect, now = () => new Date().toISOString(),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)), random = Math.random, signal, gateFactory = createLiveSender, journalStore, captureStore }) {
  const loc = runDir ? privateLocationProblems(runDir, repoRoot) : [];
  if (loc.length) return { stopped: 'SR-18:' + loc[0], phases: [] };
  const js = journalStore || fileJournalStore(join(runDir, 'JOURNAL.jsonl'));
  const cs = captureStore || fileCaptureStore(join(runDir, 'captures'));
  const J = createJournal(js.lines(), (line) => js.append(line));
  const recovered = recoverJournal(J, now, cs);
  const requestsByPhase = Object.fromEntries(PHASES.map((ph) => [ph, set.requests.filter((q) => q.phase === ph).map((q) => q.request_id)]));
  const expected = { authorizationSha256: authorizationSha256(authorization), model: plan.provider.model, api_version: plan.provider.api_version, candidate_version: plan.candidate.version,
    candidate_manifest_sha256: plan.candidate.manifest_sha256, prompt_sha256: plan.candidate.prompt_sha256, plan_sha256: plan.plan_sha256, record_set_sha256: set.requests_sha256, destination: plan.provider.destination, requestsByPhase };
  const sink = createCaptureSink(cs);
  const gate = gateFactory({ authorization, journal: J, sink, fetchImpl, now, sleep, random, config: plan.transport.config,
    verifyAuthorization: (a, req, nowUtc) => verifyCompletionAuthorization(a, req, nowUtc, expected, { requestsSoFar: J.requestCount(), attemptsSoFar: J.attemptCount(), spentUsd: J.spentUsd() }),
    credentialResolver: (name) => (env && Object.prototype.hasOwnProperty.call(env, name) ? env[name] : undefined) });
  const textOf = (q) => (q.construction ? targeted.get(q.request_id) : readFileSync(join(repoRoot, q.text_path), 'utf8'));
  const out = { recovered: recovered.length, phases: [], stopped: null };
  // SR-02: the authorization is checked against the frozen plan before the first request of the run.
  const first = PHASES.find((ph) => (authorization.phases_authorized || []).includes(ph)) || 'PRE';
  const q0 = set.requests.find((q) => q.phase === first);
  // Validity of the authorization itself only; request, attempt and spend caps are enforced per request at the gate,
  // so a resumed run whose requests are all complete is not stopped here.
  const pre = verifyCompletionAuthorization(authorization, q0 ? { requestId: q0.request_id, recordId: q0.base_record_id, phase: first, body: { model: plan.provider.model }, worstCaseUsd: q0.worst_case_attempt_usd } : null, now(), expected,
    { requestsSoFar: 0, attemptsSoFar: 0, spentUsd: 0 });
  if (pre.length) { out.stopped = 'SR-02:' + pre[0]; out.authorization_problems = pre; return out; }
  for (const ph of PHASES) {
    if (!(authorization.phases_authorized || []).includes(ph)) continue;
    const requests = frozenRequests(set, ph, promptText, textOf);
    const r = await runPhase({ phase: ph, requests, sender: gate, journal: J, captureStore: cs, inspect, model: plan.provider.model, sleep, minIntervalMs: plan.transport.pacing.min_interval_ms, signal });
    out.phases.push(r);
    if (r.stopped) { out.stopped = r.stopped; break; }
    if (ph === 'PRE' && !r.gate.passed) { out.stopped = 'PRE_GATE_FAILED'; break; }
  }
  out.spent_usd = J.spentUsd(); out.requests = J.requestCount(); out.attempts = J.attemptCount();
  return out;
}

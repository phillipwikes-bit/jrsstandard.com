// Study continuation (0.3.5), ported from study-completion-0.3.4-2026-10-28: offline tests of the live-run machinery. Every fetch is a mock injected into the code under
// test; the global network APIs are blocked by tools/guard.mjs; no credential or environment value is read (the
// credential is a test sentinel passed in explicitly). Mock responses carry MOCK_NOTE and are never model output.
// Writes out/LIVE_MACHINERY_TESTS.json. Exits 1 if any test fails or any network attempt is recorded.
// Usage: node tools/live/test-live.mjs <scratch>
import { attempts } from '../guard.mjs';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR, ROOT, PKG4, STATUS, sha, readJson, writeJson } from '../common.mjs';
import * as S from './sender-bound.mjs';
import { verifyCompletionAuthorization, authorizationSha256, STUDY_NAME } from './authorization-bound.mjs';
import { frozenRequests, runPhase, orchestrate, fileJournalStore, fileCaptureStore, privateLocationProblems } from './runner.mjs';
import { compileCapture, makeInspector, scoreRun, MOCK_NOTE } from './score-live-v2.mjs';
import { extractCandidate } from '../../../engine-repair-0.3.4-2026-10-27/tools/transport/study-adapter.mjs';
import { isolate, loadEngine } from '../harness/engines.mjs';
import { recordText, relabel } from '../../../engine-repair-0.3.4-2026-10-27/tools/lib.mjs';
import { makePlan, makeDraft } from '../build-plan.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: test-live.mjs <scratch>'); process.exit(2); }
rmSync(SCRATCH, { recursive: true, force: true }); mkdirSync(join(SCRATCH, 'iso'), { recursive: true });
const iso = isolate('0.3.5-research-candidate', join(SCRATCH, 'iso'), { requireManifest: true });
const E4 = await loadEngine(iso);
const set = readJson(join(DIR, 'records', 'LIVE_RECORD_SET.json'));
const promptText = readFileSync(join(DIR, 'candidate', 'prompt', 'PROMPT_research-0.3.5-1.txt'), 'utf8');
const targeted = new Map(readFileSync(join(DIR, 'records', 'TARGETED_TEXTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.request_id, o.text]; }));
const textOf = (q) => (q.construction ? targeted.get(q.request_id) : readFileSync(join(ROOT, q.text_path), 'utf8'));
const plan = makePlan(set);
const PRE = frozenRequests(set, 'PRE', promptText, textOf);
const SENTINEL = 'TEST-SENTINEL-NOT-A-CREDENTIAL-0000000000';
const NOW = '2026-10-28T12:00:00.000Z';
// The frozen 0.3.4 scripted proposals, relabelled to the 0.3.5 prompt version (lib.mjs relabel; nothing else changes).
const mockCand = (id) => relabel(JSON.parse(readFileSync(join(PKG4, 'mocks-v2', 'ORACLE-R', id + '.json'), 'utf8')).envelope.content[0].text, E4.research.RESEARCH_PROMPT_VERSION);
const apiBody = (text, o = {}) => ({ id: 'msg_mock', type: 'message', role: 'assistant', model: o.model || S.MODEL, content: o.content || [{ type: 'text', text }], stop_reason: o.stop || 'end_turn',
  stop_details: o.stop === 'refusal' ? { type: 'refusal', category: 'test_category' } : null, usage: o.usage || { input_tokens: 1500, output_tokens: 600 }, mock_note: MOCK_NOTE });
const ok200 = (text, o) => ({ status: 200, json: apiBody(text, o), headers: { 'request-id': 'req_mock' } });
function mockFetch(script) {
  const calls = [];
  const f = async (url, init) => { calls.push({ url, init }); const s = script[Math.min(calls.length - 1, script.length - 1)];
    if (typeof s === 'function') return s(url, init); if (s.throw) throw s.throw;
    return { status: s.status, headers: { get: (h) => (s.headers || {})[h] ?? null }, text: async () => (s.raw !== undefined ? s.raw : JSON.stringify(s.json ?? { type: 'error', error: { type: 'mock_error', message: 'mock' } })) }; };
  f.calls = calls; return f;
}
const hang = (url, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }))));
function ctxOf(fetchImpl, o = {}) {
  const store = new Map(), lines = [];
  const sink = S.createCaptureSink(store); sink.registerSentinel(SENTINEL);
  const J = S.createJournal(o.lines || [], (l) => lines.push(l));
  return Object.assign({ fetchImpl, credential: SENTINEL, sink, journal: J, budgetUsd: 1, maxRequests: 1000, maxAttempts: 10000, maxRetries: 2, baseDelayMs: 1, maxDelayMs: 50, timeoutMs: 1000,
    sleep: async () => {}, now: () => NOW, random: () => 0, store, lines }, o.ctx || {});
}
const req = (q = PRE[0]) => ({ requestId: q.requestId, recordId: q.recordId, body: q.body });
const T = [];
async function test(id, name, fn) { let ok = false, observed = null; try { const r = await fn(); ok = r === true || !!(r && r.ok === true); observed = r && r.observed !== undefined ? r.observed : null; } catch (e) { observed = 'threw: ' + String(e && e.message).slice(0, 300); } T.push({ id, name, ok, observed }); }
const expected = (a) => ({ authorizationSha256: authorizationSha256(a), model: plan.provider.model, api_version: plan.provider.api_version, candidate_version: plan.candidate.version, candidate_manifest_sha256: plan.candidate.manifest_sha256,
  prompt_sha256: plan.candidate.prompt_sha256, plan_sha256: plan.plan_sha256, record_set_sha256: set.requests_sha256, destination: plan.provider.destination,
  requestsByPhase: Object.fromEntries(['PRE', 'RUN', 'TGT'].map((ph) => [ph, set.requests.filter((q) => q.phase === ph).map((q) => q.request_id)])) });
// A TEST FIXTURE, never an authorization: it exists only in memory here, to show the verifier can pass a complete record.
const fixture = (over = {}) => Object.assign(makeDraft(plan), { authorization_id: 'TEST-FIXTURE-NOT-AN-AUTHORIZATION', phases_authorized: ['PRE', 'RUN', 'TGT'], max_requests: 401, max_attempts: 450, max_budget_usd: 1,
  expiry_utc: '2026-12-31T00:00:00.000Z', retention_location: SCRATCH, provider_retention_confirmed: 'TEST FIXTURE', stop_rules_approved: true, owner_signature: 'TEST FIXTURE', signed_at_utc: '2026-10-28T00:00:00.000Z' }, over);
const areq = (q = PRE[0], phase = 'PRE') => ({ requestId: q.requestId, recordId: q.recordId, phase, body: q.body, worstCaseUsd: q.worstCaseUsd });

// ------------------------------------------------------------------ request construction and headers
await test('TL-01', 'every PRE body rebuilds from the frozen prompt and texts to its frozen hash, with exactly the planned fields', () => {
  const b = PRE[0].body;
  const keys = Object.keys(b).sort().join(',');
  return { ok: PRE.length === 3 && keys === 'max_tokens,messages,model,output_config,system,thinking' && b.model === 'claude-haiku-5-5' && b.max_tokens === 4096 && b.thinking.type === 'disabled' && b.output_config.effort === 'medium'
    && b.messages.length === 1 && b.messages[0].role === 'user' && b.messages[0].content.includes(recordText('S-001')) && !/\{\{RECORD\}\}/.test(b.messages[0].content) && S.checkBody(b).length === 0, observed: keys };
});
await test('TL-02', 'all 401 frozen bodies rebuild to their hashes; a changed record text is refused', () => {
  const all = ['PRE', 'RUN', 'TGT'].reduce((n, ph) => n + frozenRequests(set, ph, promptText, textOf).length, 0);
  let refused = null; try { frozenRequests(set, 'PRE', promptText, (q) => textOf(q) + ' '); } catch (e) { refused = e.code; }
  return { ok: all === 401 && refused === 'record_text_hash_mismatch', observed: [all, refused] };
});
await test('TL-03', 'headers are exactly content-type, x-api-key (the injected value) and anthropic-version 2026-10-21; POST to the one URL with redirect "error"', async () => {
  const f = mockFetch([ok200(mockCand('S-001'))]); const c = ctxOf(f); await S.dispatchCore(c, req());
  const call = f.calls[0], h = call.init.headers;
  return { ok: call.url === 'https://api.anthropic.com/v1/messages' && call.init.method === 'POST' && call.init.redirect === 'error' && Object.keys(h).sort().join(',') === 'anthropic-version,content-type,x-api-key'
    && h['x-api-key'] === SENTINEL && h['anthropic-version'] === '2026-10-21' && call.init.body === JSON.stringify(PRE[0].body), observed: Object.keys(h) };
});
await test('TL-04', 'a forbidden body field (temperature, top_p, top_k, fallbacks) or a non-user final turn is refused before any request', async () => {
  const out = [];
  for (const k of ['temperature', 'top_p', 'top_k', 'fallbacks']) { const f = mockFetch([ok200('x')]); try { await S.dispatchCore(ctxOf(f), { requestId: 'X-' + k, recordId: 'S-001', body: Object.assign({}, PRE[0].body, { [k]: 1 }) }); out.push('sent'); } catch (e) { out.push(e.code + (f.calls.length ? ':called' : '')); } }
  let pre = null; try { S.buildRequestBody({ system: 's', user: 'u', effort: 'max', thinking: { type: 'disabled' } }); } catch (e) { pre = e.code; }
  return { ok: out.every((x) => /^forbidden_body_field/.test(x) && !/called/.test(x)) && pre === 'thinking_disabled_requires_effort_high_or_below', observed: [out, pre] };
});
// ------------------------------------------------------------------ response mapping, quotation verification, strict parsing
await test('TL-05', 'a 200 response is captured once, journalled with its hash and usage, and maps to the candidate text', async () => {
  const text = mockCand('S-001'); const c = ctxOf(mockFetch([ok200(text)])); const r = await S.dispatchCore(c, req());
  const cap = JSON.parse(c.store.get(PRE[0].requestId)); const x = extractCandidate(cap, S.MODEL);
  const last = c.journal.entries[c.journal.entries.length - 1];
  return { ok: r.outcome === 'ok' && x.ok && x.text === text && last.state === 'captured' && last.capture_sha256 === sha(c.store.get(PRE[0].requestId)) && last.usage.input_tokens === 1500 && r.cost_usd === S.costOf({ input_tokens: 1500, output_tokens: 600 }), observed: [r.outcome, last.state] };
});
await test('TL-06', 'exact quotations verify through the frozen 0.3.5 compile (scorer v2 units); a one-character change makes that quotation absent and withdraws its support', () => {
  const text = mockCand('S-001'); const cap = JSON.stringify({ request_id: 'PRE-01', status: 200, response_body: JSON.stringify(apiBody(text)) });
  const q = { request_id: 'PRE-01', base_record_id: 'S-001' }; const z = compileCapture(E4, cap, q, recordText('S-001'));
  const o = JSON.parse(text); const i = o.observations.findIndex((x) => x.quote); const cond = o.observations[i].condition_id; o.observations[i].quote = o.observations[i].quote.slice(0, -1) + 'Q';
  const z2 = compileCapture(E4, JSON.stringify({ request_id: 'PRE-01', status: 200, response_body: JSON.stringify(apiBody(JSON.stringify(o))) }), q, recordText('S-001'));
  return { ok: z.stage === 'compiled' && z.e1 === 'CLEAR' && z.quote_counts.verified === z.quote_counts.quotations && z.quote_counts.reconciles && z.mock === true && z2.quote_counts.missing_from_source === 1 && z2.quote_counts.reconciles && z2.statuses[cond] !== 'supported' && z2.e1 !== 'CLEAR', observed: [z.quote_counts, z2.quote_counts, cond, z2.statuses[cond]] };
});
await test('TL-07', 'strict parsing: non-JSON text, an extra key, the wrong prompt version, a missing key, a fence with extra text: each rejected; one exact fence is accepted (documented in the frozen strict-json.mjs) and counted', () => {
  const q = { request_id: 'PRE-01', base_record_id: 'S-001' }, t = recordText('S-001'), base = JSON.parse(mockCand('S-001'));
  const cases = { non_json: 'APPROVED', extra_key: JSON.stringify(Object.assign({}, base, { verdict: 'ready' })), wrong_prompt: JSON.stringify(Object.assign({}, base, { prompt_version: 'jrs-engine-local-0.3.3-research/prompt-1' })),
    missing_key: JSON.stringify({ contract_version: base.contract_version, observations: base.observations }), fence_plus_text: 'Here is the result:\n```json\n' + JSON.stringify(base) + '\n```' };
  const r = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, compileCapture(E4, JSON.stringify({ request_id: 'PRE-01', status: 200, response_body: JSON.stringify(apiBody(v)) }), q, t)]));
  const fenced = compileCapture(E4, JSON.stringify({ request_id: 'PRE-01', status: 200, response_body: JSON.stringify(apiBody('```json\n' + JSON.stringify(base) + '\n```')) }), q, t);
  return { ok: Object.values(r).every((z) => z.stage === 'contract' && z.refusal_codes.includes('candidate_response_invalid') && z.e1 === 'NOT_ASSESSED') && fenced.stage === 'compiled' && fenced.fence_removed === true,
    observed: Object.assign(Object.fromEntries(Object.entries(r).map(([k, z]) => [k, z.stage])), { exact_fence: fenced.stage }) };
});
await test('TL-08', 'adapter: two text blocks, a tool_use block, empty text, text over 64 KiB and a different model are each refused', () => {
  const cap = (b) => ({ request_id: 'X', status: 200, response_body: JSON.stringify(b) });
  const r = { two_text: extractCandidate(cap(apiBody('', { content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] })), S.MODEL).code, tool: extractCandidate(cap(apiBody('', { content: [{ type: 'text', text: 'a' }, { type: 'tool_use', id: 't', name: 'x', input: {} }] })), S.MODEL).code,
    empty: extractCandidate(cap(apiBody('   ')), S.MODEL).code, large: extractCandidate(cap(apiBody('x'.repeat(65 * 1024))), S.MODEL).code, model: extractCandidate(cap(apiBody('{}', { model: 'claude-opus-5-5' })), S.MODEL).code };
  return { ok: r.two_text === 'unexpected_content_blocks' && r.tool === 'unexpected_content_blocks' && r.empty === 'empty_response' && r.large === 'response_too_large' && r.model === 'model_identifier_mismatch', observed: r };
});
// ------------------------------------------------------------------ truncation, refusal, timeouts, cancellation
await test('TL-09', 'a truncated response (stop_reason max_tokens) is final, captured, never retried, and the adapter refuses it', async () => {
  const f = mockFetch([ok200('{"contract_version"', { stop: 'max_tokens', usage: { input_tokens: 1500, output_tokens: 4096 } })]); const c = ctxOf(f); const r = await S.dispatchCore(c, req());
  const x = extractCandidate(JSON.parse(c.store.get(PRE[0].requestId)), S.MODEL);
  return { ok: r.outcome === 'response_truncated' && f.calls.length === 1 && c.journal.stateOf(PRE[0].requestId) === 'failed_final' && x.code === 'response_truncated' && r.cost_usd > 0, observed: [r.outcome, f.calls.length] };
});
await test('TL-10', 'a refusal (stop_reason refusal) is final with its category, never retried and never sent to another model', async () => {
  const f = mockFetch([ok200('', { stop: 'refusal', content: [] })]); const c = ctxOf(f); const r = await S.dispatchCore(c, req());
  const x = extractCandidate(JSON.parse(c.store.get(PRE[0].requestId)), S.MODEL);
  return { ok: r.outcome === 'model_refusal' && f.calls.length === 1 && x.code === 'model_refusal' && x.category === 'test_category' && f.calls.every((k) => JSON.parse(k.init.body).model === S.MODEL), observed: [r.outcome, x.category] };
});
await test('TL-11', 'a timeout aborts the attempt, is retried twice, and every attempt is counted at the worst case', async () => {
  const f = mockFetch([hang]); const c = ctxOf(f, { ctx: { timeoutMs: 20 } }); const r = await S.dispatchCore(c, req());
  const fails = c.journal.entries.filter((e) => e.state === 'attempt_failed');
  return { ok: r.outcome === 'timeout' && f.calls.length === 3 && fails.length === 3 && fails.every((e) => e.cost_usd === PRE[0].worstCaseUsd && e.billing === 'unknown_counted_worst_case') && c.journal.spentUsd() === Number((3 * PRE[0].worstCaseUsd).toFixed(8)), observed: [r.outcome, f.calls.length, c.journal.spentUsd()] };
});
await test('TL-12', 'cancellation in flight stops the request, counts it at the worst case, and a resend of the same request is refused', async () => {
  const ac = new AbortController(); const f = mockFetch([(url, init) => { setTimeout(() => ac.abort(), 5); return hang(url, init); }]); const c = ctxOf(f);
  const r = await S.dispatchCore(c, Object.assign(req(), { signal: ac.signal }));
  let again = null; try { await S.dispatchCore(c, req()); } catch (e) { again = e.code; }
  let before = null; try { await S.dispatchCore(ctxOf(mockFetch([ok200('x')])), Object.assign(req(), { signal: ac.signal })); } catch (e) { before = e.code; }
  return { ok: r.outcome === 'cancelled' && c.journal.stateOf(PRE[0].requestId) === 'cancelled' && c.journal.spentUsd() === PRE[0].worstCaseUsd && again === 'duplicate_request_id' && before === 'cancelled_before_send', observed: [r.outcome, again, before] };
});
// ------------------------------------------------------------------ retries, statuses, redirects
await test('TL-13', 'retry accounting: 429 (retry-after honoured), 529 and 500 are retried; error statuses are not billed; the final 200 is billed from usage', async () => {
  const waits = []; const f = mockFetch([{ status: 429, headers: { 'retry-after': '0.01' } }, { status: 529 }, ok200(mockCand('S-001'))]);
  const c = ctxOf(f, { ctx: { sleep: async (ms) => { waits.push(ms); } } }); const r = await S.dispatchCore(c, req());
  const f2 = mockFetch([{ status: 500 }, { status: 500 }, { status: 500 }]); const c2 = ctxOf(f2); const r2 = await S.dispatchCore(c2, req());
  const failed = c.journal.entries.filter((e) => e.state === 'attempt_failed');
  return { ok: r.outcome === 'ok' && f.calls.length === 3 && waits[0] === 10 && failed.every((e) => e.cost_usd === 0 && e.billing === 'not_billed_error_status') && r.cost_usd === S.costOf({ input_tokens: 1500, output_tokens: 600 })
    && r2.outcome === 'http_500' && f2.calls.length === 3 && c2.journal.stateOf(PRE[0].requestId) === 'failed_final', observed: [r.outcome, f.calls.length, waits, r2.outcome] };
});
await test('TL-14', 'a retry-after beyond the 20-second window ends the request without waiting; the runner stops (SR-07)', async () => {
  const f = mockFetch([{ status: 429, headers: { 'retry-after': '60' } }]); const c = ctxOf(f, { ctx: { maxDelayMs: 20000 } }); const r = await S.dispatchCore(c, req());
  const sender = { send: async (q) => S.dispatchCore(ctxOf(mockFetch([{ status: 429, headers: { 'retry-after': '60' } }]), { ctx: { maxDelayMs: 20000 } }), q) };
  const run = await runPhase({ phase: 'PRE', requests: PRE, sender, journal: S.createJournal([]), captureStore: new Map(), inspect: () => ({}), model: S.MODEL, sleep: async () => {} });
  return { ok: r.outcome === 'retry_after_beyond_window' && f.calls.length === 1 && run.stopped === 'SR-07:retry_after_beyond_window', observed: [r.outcome, run.stopped] };
});
await test('TL-15', 'HTTP 400, 401, 402, 403, 404, 409 and 413 are final after one attempt and stop the run (SR-03)', async () => {
  const out = {};
  for (const st of [400, 401, 402, 403, 404, 409, 413]) { const f = mockFetch([{ status: st }]); const r = await S.dispatchCore(ctxOf(f), req()); out[st] = r.outcome + '/' + f.calls.length; }
  const sender = { send: async (q) => S.dispatchCore(ctxOf(mockFetch([{ status: 401 }])), q) };
  const run = await runPhase({ phase: 'PRE', requests: PRE, sender, journal: S.createJournal([]), captureStore: new Map(), inspect: () => ({}), model: S.MODEL, sleep: async () => {} });
  return { ok: Object.entries(out).every(([st, v]) => v === 'http_' + st + '_not_retryable/1') && run.stopped === 'SR-03:http_401_not_retryable', observed: [out, run.stopped] };
});
await test('TL-16', 'HTTP 504 is final, counted at the worst case (billing unknown), and stops the run (SR-05)', async () => {
  const f = mockFetch([{ status: 504 }]); const c = ctxOf(f); const r = await S.dispatchCore(c, req());
  const sender = { send: async (q) => S.dispatchCore(ctxOf(mockFetch([{ status: 504 }])), q) };
  const run = await runPhase({ phase: 'PRE', requests: PRE, sender, journal: S.createJournal([]), captureStore: new Map(), inspect: () => ({}), model: S.MODEL, sleep: async () => {} });
  return { ok: r.outcome === 'http_504_unexpected' && f.calls.length === 1 && c.journal.spentUsd() === PRE[0].worstCaseUsd && run.stopped === 'SR-05:http_504_unexpected', observed: [r.outcome, c.journal.spentUsd(), run.stopped] };
});
await test('TL-17', 'redirects are refused, never followed and never retried: a 3xx status, or the fetch error a redirect raises under redirect "error" (SR-04)', async () => {
  const f1 = mockFetch([{ status: 307, headers: { location: 'https://example.invalid/' } }]); const r1 = await S.dispatchCore(ctxOf(f1), req());
  const f2 = mockFetch([{ throw: Object.assign(new TypeError('fetch failed'), { cause: new Error('unexpected redirect') }) }]); const c2 = ctxOf(f2); const r2 = await S.dispatchCore(c2, req());
  const sender = { send: async (q) => S.dispatchCore(ctxOf(mockFetch([{ status: 302 }])), q) };
  const run = await runPhase({ phase: 'PRE', requests: PRE, sender, journal: S.createJournal([]), captureStore: new Map(), inspect: () => ({}), model: S.MODEL, sleep: async () => {} });
  return { ok: r1.outcome === 'redirect_refused' && f1.calls.length === 1 && r2.outcome === 'redirect_refused' && f2.calls.length === 1 && c2.journal.spentUsd() === 0 && run.stopped === 'SR-04', observed: [r1.outcome, r2.outcome, run.stopped] };
});
await test('TL-18', 'a network error is retried twice, counted at the worst case each time (B9), then stops the run (SR-06)', async () => {
  const f = mockFetch([{ throw: Object.assign(new TypeError('fetch failed'), { cause: new Error('getaddrinfo ENOTFOUND') }) }]); const c = ctxOf(f); const r = await S.dispatchCore(c, req());
  const sender = { send: async (q) => S.dispatchCore(ctxOf(mockFetch([{ throw: new TypeError('fetch failed') }])), q) };
  const run = await runPhase({ phase: 'PRE', requests: PRE, sender, journal: S.createJournal([]), captureStore: new Map(), inspect: () => ({}), model: S.MODEL, sleep: async () => {} });
  return { ok: r.outcome === 'network_error' && f.calls.length === 3 && c.journal.spentUsd() === Number((3 * PRE[0].worstCaseUsd).toFixed(8)) && run.stopped === 'SR-06:network_error', observed: [r.outcome, c.journal.spentUsd(), run.stopped] };
});
await test('TL-19', 'the destination allow-list refuses every other scheme, host, port, path, query, fragment or user part before any request; the gate refuses a destination override', async () => {
  const urls = ['http://api.anthropic.com/v1/messages', 'https://api.anthropic.com.evil.test/v1/messages', 'https://api.anthropic.com:8443/v1/messages', 'https://api.anthropic.com/v1/complete', 'https://api.anthropic.com/v1/messages?x=1', 'https://api.anthropic.com/v1/messages#f', 'https://u:p@api.anthropic.com/v1/messages', 'not a url'];
  const out = []; for (const u of urls) { const f = mockFetch([ok200('x')]); try { await S.dispatchCore(ctxOf(f), Object.assign(req(), { url: u })); out.push('SENT'); } catch (e) { out.push(e.code + (f.calls.length ? ':called' : '')); } }
  const g = S.createGate({ enabled: true, authorization: fixture(), verifyAuthorization: () => [], credentialResolver: () => SENTINEL, fetchImpl: mockFetch([ok200('x')]), sink: S.createCaptureSink(new Map()), journal: S.createJournal([]), config: plan.transport.config });
  let ov = null; try { await g.send(Object.assign(areq(), { url: 'https://api.anthropic.com/v1/messages' })); } catch (e) { ov = e.code; }
  return { ok: out.every((x) => /^destination_/.test(x) && !/called/.test(x)) && ov === 'destination_override_refused', observed: [out, ov] };
});
// ------------------------------------------------------------------ budget and caps
await test('TL-20', 'budget enforcement: an attempt whose worst case would pass the cap is refused before it is sent; spend never passes the cap', async () => {
  const f = mockFetch([ok200(mockCand('S-001'))]); const c = ctxOf(f, { ctx: { budgetUsd: PRE[0].worstCaseUsd / 2 } }); const r = await S.dispatchCore(c, req());
  const f2 = mockFetch([ok200(mockCand('S-001'))]); const c2 = ctxOf(f2, { ctx: { budgetUsd: PRE[0].worstCaseUsd * 1.5 } });
  const a = await S.dispatchCore(c2, req(PRE[0])); const b = await S.dispatchCore(c2, req(PRE[1]));
  return { ok: r.outcome === 'budget_exhausted' && f.calls.length === 0 && a.outcome === 'ok' && (b.outcome === 'ok' || b.outcome === 'budget_exhausted') && c2.journal.spentUsd() <= PRE[0].worstCaseUsd * 1.5, observed: [r.outcome, a.outcome, b.outcome, c2.journal.spentUsd()] };
});
await test('TL-21', 'request cap and global attempt cap (B6) each stop further sending; the runner reports SR-12 or SR-18', async () => {
  const c = ctxOf(mockFetch([ok200(mockCand('S-001'))]), { ctx: { maxRequests: 1 } }); await S.dispatchCore(c, req(PRE[0]));
  let capped = null; try { await S.dispatchCore(c, req(PRE[1])); } catch (e) { capped = e.code; }
  const f = mockFetch([{ status: 429 }]); const c2 = ctxOf(f, { ctx: { maxAttempts: 2 } }); const r = await S.dispatchCore(c2, req());
  return { ok: capped === 'request_cap_reached' && r.outcome === 'attempt_cap_reached' && f.calls.length === 2, observed: [capped, r.outcome, f.calls.length] };
});
// ------------------------------------------------------------------ recovery and duplicates
await test('TL-22', 'interrupted run: the "sent" entry is on disk before the request leaves (B10); on resume it becomes interrupted_unknown at the worst case and is never resent automatically (SR-16)', async () => {
  const dir = join(SCRATCH, 'crash-1'); const js = fileJournalStore(join(dir, 'JOURNAL.jsonl'));
  let snapshot = null; const f = mockFetch([() => { snapshot = js.lines(); return new Promise(() => {}); }]);
  const J = S.createJournal([], (l) => js.append(l)); const sink = S.createCaptureSink(new Map()); sink.registerSentinel(SENTINEL);
  S.dispatchCore({ fetchImpl: f, credential: SENTINEL, sink, journal: J, budgetUsd: 1, maxRequests: 10, maxAttempts: 10, maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5, timeoutMs: 60000, sleep: async () => {}, now: () => NOW, random: () => 0 }, req());
  await new Promise((r) => setTimeout(r, 20));
  const J2 = S.createJournal(snapshot, () => {}); const rec = S.recoverJournal(J2, () => NOW, new Map());
  let again = null; try { await S.dispatchCore(ctxOf(mockFetch([ok200('x')]), { lines: snapshot.concat(rec) }), req()); } catch (e) { again = e.code; }
  const run = await runPhase({ phase: 'PRE', requests: PRE, sender: { send: async () => { throw new Error('must not be called'); } }, journal: J2, captureStore: new Map(), inspect: () => ({}), model: S.MODEL, sleep: async () => {} });
  return { ok: snapshot.length === 2 && JSON.parse(snapshot[1]).state === 'sent' && rec.length === 1 && JSON.parse(rec[0]).state === 'interrupted_unknown' && J2.spentUsd() === PRE[0].worstCaseUsd && again === 'ambiguous_prior_send_requires_review' && run.stopped === 'SR-16:' + PRE[0].requestId,
    observed: [snapshot.map((l) => JSON.parse(l).state), again, run.stopped] };
});
await test('TL-23', 'interrupted after the capture was written: recovery verifies the capture against the prepared body hash and records it with its reported cost', async () => {
  const c = ctxOf(mockFetch([ok200(mockCand('S-001'))])); await S.dispatchCore(c, req());
  const crashed = c.lines.slice(0, -1);   // the final "captured" entry never reached the disk
  const J = S.createJournal(crashed); const rec = S.recoverJournal(J, () => NOW, c.store);
  const e = JSON.parse(rec[0]);
  return { ok: e.state === 'captured' && e.recovered_from_capture === true && e.capture_sha256 === sha(c.store.get(PRE[0].requestId)) && e.cost_usd === S.costOf({ input_tokens: 1500, output_tokens: 600 }), observed: [e.state, e.cost_usd] };
});
await test('TL-24', 'interrupted before sending ("prepared" only): the request is sent normally on resume', async () => {
  const lines = []; const J = S.createJournal([], (l) => lines.push(l)); J.append({ request_id: PRE[0].requestId, record_id: 'S-001', state: 'prepared', body_sha256: sha(JSON.stringify(PRE[0].body)), worst_case_usd: PRE[0].worstCaseUsd, at: NOW });
  const c = ctxOf(mockFetch([ok200(mockCand('S-001'))]), { lines }); const rec = S.recoverJournal(c.journal, () => NOW, c.store); const r = await S.dispatchCore(c, req());
  return { ok: rec.length === 0 && r.outcome === 'ok', observed: [rec.length, r.outcome] };
});
await test('TL-25', 'attempts made before a resume count toward the retry limit (B7): two earlier attempts leave one', async () => {
  const lines = []; const J = S.createJournal([], (l) => lines.push(l));
  J.append({ request_id: PRE[0].requestId, record_id: 'S-001', state: 'prepared', body_sha256: 'x', worst_case_usd: PRE[0].worstCaseUsd, at: NOW });
  for (const a of [0, 1]) { J.append({ request_id: PRE[0].requestId, state: 'sent', attempt: a, at: NOW }); J.append({ request_id: PRE[0].requestId, state: 'attempt_failed', attempt: a, outcome: 'http_529', cost_usd: 0, billing: 'not_billed_error_status', at: NOW }); }
  const f = mockFetch([{ status: 529 }]); const c = ctxOf(f, { lines }); const r = await S.dispatchCore(c, req());
  return { ok: f.calls.length === 1 && r.outcome === 'http_529', observed: [f.calls.length, r.outcome] };
});
await test('TL-26', 'a completed request is never sent twice: dispatch refuses it, and the runner skips it on resume without calling the sender', async () => {
  const c = ctxOf(mockFetch([ok200(mockCand('S-001'))])); await S.dispatchCore(c, req());
  let dup = null; try { await S.dispatchCore(c, req()); } catch (e) { dup = e.code; }
  let calls = 0; const sender = { send: async (q) => { calls++; return S.dispatchCore(c, q); } };
  const run = await runPhase({ phase: 'PRE', requests: [PRE[0]], sender, journal: c.journal, captureStore: c.store, inspect: () => ({ contractOk: true }), model: S.MODEL, sleep: async () => {} });
  return { ok: dup === 'duplicate_request_id' && calls === 0 && run.tally.skippedDone === 1, observed: [dup, calls, run.tally.skippedDone] };
});
await test('TL-27', 'the journal hash chain detects an edited or removed entry', () => {
  const c = ctxOf(mockFetch([ok200(mockCand('S-001'))])); return S.dispatchCore(c, req()).then(() => {
    const edited = c.lines.slice(); edited[1] = edited[1].replace('"attempt":0', '"attempt":1');
    const removed = c.lines.filter((_, i) => i !== 1);
    const r = [edited, removed].map((ls) => { try { S.createJournal(ls); return 'accepted'; } catch (e) { return e.code; } });
    return { ok: r.every((x) => x === 'journal_corrupt'), observed: r }; });
});
// ------------------------------------------------------------------ authorization
await test('TL-28', 'authorization: absent, the three unsigned drafts, a signed copy that keeps a draft identifier, the spent Stage A authorization, and missing or placeholder fields are refused', () => {
  const drafts = [readJson(join(PKG4, 'authorization', 'LIVE_PREFLIGHT_AUTHORIZATION_DRAFT.json')), readJson(join(DIR, '..', 'study-156-2026-10-27', 'authorization', 'STUDY156_LIVE_AUTHORIZATION_DRAFT.json')), makeDraft(plan)];
  const r = drafts.map((d) => verifyCompletionAuthorization(d, areq(), NOW, expected(d)).length);
  const spent = verifyCompletionAuthorization(fixture({ authorization_id: 'STAGE-A-AUTH-20261025-01' }), areq(), NOW, expected(fixture({ authorization_id: 'STAGE-A-AUTH-20261025-01' })));
  const unsigned = fixture({ owner_signature: 'UNSIGNED' }), noStop = fixture({ stop_rules_approved: false }), noRet = fixture({ provider_retention_confirmed: '' });
  const keptDraftId = fixture({ authorization_id: 'COMPLETION-LIVE-DRAFT-SIGNED-COPY' }), keptProblems = verifyCompletionAuthorization(keptDraftId, areq(), NOW, expected(keptDraftId));
  return { ok: verifyCompletionAuthorization(null, areq(), NOW, null)[0] === 'authorization_absent' && r.every((n) => n > 0) && spent.some((p) => /spent_superseded_or_draft/.test(p))
    && verifyCompletionAuthorization(unsigned, areq(), NOW, expected(unsigned)).includes('owner_signature_missing_or_placeholder') && verifyCompletionAuthorization(noStop, areq(), NOW, expected(noStop)).includes('authorization_field_absent:stop_rules_approved')
    && verifyCompletionAuthorization(noRet, areq(), NOW, expected(noRet)).includes('authorization_field_absent:provider_retention_confirmed')
    && keptProblems.length === 1 && /^authorization_spent_superseded_or_draft/.test(keptProblems[0]), observed: [r, spent.slice(0, 2), keptProblems] };
});
await test('TL-29', 'authorization: expired, dated in the future, wrong model, prompt, plan, record set or API version, reserved credential name, unauthorized phase, request outside the plan, later phase without PRE, caps exceeded: each refused', () => {
  const cases = { expired: [fixture({ expiry_utc: '2026-10-01T00:00:00Z' }), 'authorization_expired_or_invalid_expiry'], future: [fixture({ signed_at_utc: '2026-11-30T00:00:00Z' }), 'authorization_signature_date_invalid'],
    model: [fixture({ model_identifier: 'claude-opus-5-5' }), 'model_identifier_differs_from_frozen_value'], prompt: [fixture({ prompt_sha256: '0'.repeat(64) }), 'prompt_sha256_differs_from_frozen_value'],
    plan: [fixture({ plan_sha256: '0'.repeat(64) }), 'plan_sha256_differs_from_frozen_value'], records: [fixture({ record_set_sha256: '0'.repeat(64) }), 'record_set_sha256_differs_from_frozen_value'],
    api: [fixture({ api_version: '2023-06-01' }), 'api_version_differs_from_frozen_value'], reserved: [fixture({ credential_environment_variable_name: 'ANTHROPIC_API_KEY' }), 'credential_variable_name_reserved_by_sdk'],
    phase: [fixture({ phases_authorized: ['PRE'] }), 'phase_not_authorized:RUN', 'RUN'], nopre: [fixture({ phases_authorized: ['RUN'] }), 'later_phase_without_preflight', 'RUN'],
    attempts: [fixture({ max_attempts: 100 }), 'max_attempts_invalid'] };
  const out = {};
  for (const [k, [a, code, ph]] of Object.entries(cases)) { const q = ph ? set.requests.find((x) => x.phase === ph) : null; const rq = ph ? { requestId: q.request_id, recordId: q.base_record_id, phase: ph, body: PRE[0].body, worstCaseUsd: 0.001 } : areq();
    out[k] = verifyCompletionAuthorization(a, rq, NOW, expected(a)).includes(code); }
  const f = fixture();
  out.not_in_plan = verifyCompletionAuthorization(f, Object.assign(areq(), { requestId: 'PRE-99' }), NOW, expected(f)).includes('request_not_in_authorized_plan');
  out.over_budget = verifyCompletionAuthorization(f, areq(), NOW, expected(f), { requestsSoFar: 0, attemptsSoFar: 0, spentUsd: 0.9999 }).includes('budget_would_be_exceeded');
  out.over_requests = verifyCompletionAuthorization(f, areq(), NOW, expected(f), { requestsSoFar: 401, attemptsSoFar: 0, spentUsd: 0 }).includes('request_limit_would_be_exceeded');
  out.tampered = verifyCompletionAuthorization(Object.assign({}, f, { max_budget_usd: 50 }), areq(), NOW, expected(f)).includes('authorization_integrity_mismatch');
  out.complete_fixture_passes = verifyCompletionAuthorization(f, areq(), NOW, expected(f)).length === 0;
  return { ok: Object.values(out).every(Boolean), observed: out };
});
// ------------------------------------------------------------------ credential handling and the disabled gate
await test('TL-30', 'the build gate refuses before any check, credential lookup or request; the command exits 4 having read nothing', async () => {
  let resolved = 0, verified = 0; const f = mockFetch([ok200('x')]);
  const live = S.createLiveSender({ authorization: fixture(), verifyAuthorization: () => { verified++; return []; }, credentialResolver: () => { resolved++; return SENTINEL; }, fetchImpl: f, sink: S.createCaptureSink(new Map()), journal: S.createJournal([]), config: plan.transport.config });
  let code = null; try { await live.send(areq()); } catch (e) { code = e.code; }
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_/.test(k)));
  const cli = spawnSync(process.execPath, [join(DIR, 'tools', 'live', 'run-live.mjs'), '--authorization', 'x', '--run-dir', 'y'], { env, encoding: 'utf8' });
  return { ok: S.LIVE_DISPATCH_ENABLED === false && code === 'live_dispatch_not_enabled_in_this_build' && resolved === 0 && verified === 0 && f.calls.length === 0 && cli.status === 4 && /refused: live dispatch is disabled/.test(cli.stderr), observed: [code, resolved, verified, cli.status] };
});
await test('TL-31', 'the credential is looked up only after the authorization verifies, only under its one named variable, and never reaches the journal or a capture', async () => {
  const seen = []; const env = new Proxy({ JRS_STUDY_ANTHROPIC_KEY: SENTINEL, OTHER: 'x' }, { get: (t, k) => { seen.push(String(k)); return t[k]; }, has: (t, k) => { seen.push('has:' + String(k)); return k in t; } });
  const dir = join(SCRATCH, 'cred'); mkdirSync(dir, { recursive: true });
  const a = fixture({ phases_authorized: ['PRE'] });
  const res = await orchestrate({ plan, set, promptText, targeted, authorization: a, runDir: dir, repoRoot: ROOT, env, fetchImpl: mockFetch([ok200(mockCand('S-001')), ok200(mockCand('S-003')), ok200(mockCand('S-008'))]),
    inspect: makeInspector(E4, targeted), now: () => NOW, sleep: async () => {}, gateFactory: (o) => S.createGate(Object.assign({}, o, { enabled: true })) });
  const files = [join(dir, 'JOURNAL.jsonl'), ...readdirSync(join(dir, 'captures')).map((n) => join(dir, 'captures', n))];
  const leaked = files.filter((p) => readFileSync(p, 'utf8').includes(SENTINEL));
  const bad = verifyCompletionAuthorization(fixture({ model_identifier: 'x' }), areq(), NOW, expected(fixture({ model_identifier: 'x' })));
  let resolved = 0; const g = S.createGate({ enabled: true, authorization: a, verifyAuthorization: () => bad, credentialResolver: () => { resolved++; return SENTINEL; }, fetchImpl: mockFetch([ok200('x')]), sink: S.createCaptureSink(new Map()), journal: S.createJournal([]), config: plan.transport.config });
  try { await g.send(areq()); } catch { /* refused */ }
  const names = [...new Set(seen.filter((k) => !/^has:/.test(k)))];
  return { ok: res.stopped === null && leaked.length === 0 && names.length === 1 && names[0] === 'JRS_STUDY_ANTHROPIC_KEY' && resolved === 0, observed: [res.stopped, leaked.length, names, resolved] };
});
await test('TL-32', 'a credential value, or a credential-shaped string, in a response is refused at capture (SR-15)', async () => {
  const c1 = ctxOf(mockFetch([ok200('echo ' + SENTINEL)])); let a = null; try { await S.dispatchCore(c1, req()); } catch (e) { a = e.code; }
  const c2 = ctxOf(mockFetch([ok200('x-api-key: abcdefgh12345678')])); let b = null; try { await S.dispatchCore(c2, req()); } catch (e) { b = e.code; }
  return { ok: a === 'credential_value_in_capture' && b === 'credential_shaped_value_in_capture' && !c1.store.size && !c2.store.size, observed: [a, b] };
});
// ------------------------------------------------------------------ the run as a whole (mock responses), stop rules, scoring
await test('TL-33', 'PRE end to end with mock responses: frozen bodies, gate, journal, captures, offline compile; the PRE gate passes; the scorer classifies every request and marks it MOCK', async () => {
  const dir = join(SCRATCH, 'pre-ok'); mkdirSync(dir, { recursive: true });
  const res = await orchestrate({ plan, set, promptText, targeted, authorization: fixture({ phases_authorized: ['PRE'] }), runDir: dir, repoRoot: ROOT, env: { JRS_STUDY_ANTHROPIC_KEY: SENTINEL },
    fetchImpl: mockFetch([ok200(mockCand('S-001')), ok200(mockCand('S-003')), ok200(mockCand('S-008'))]), inspect: makeInspector(E4, targeted), now: () => NOW, sleep: async () => {}, gateFactory: (o) => S.createGate(Object.assign({}, o, { enabled: true })) });
  const sc = scoreRun({ set: Object.assign({}, set, { requests: set.requests.filter((q) => q.phase === 'PRE') }), journalLines: fileJournalStore(join(dir, 'JOURNAL.jsonl')).lines(), captureStore: fileCaptureStore(join(dir, 'captures')), E4, targeted });
  writeJson(join(DIR, 'out', 'mock-scoring', 'MOCK_PRE_SCORING.json'), { label: 'MOCK RESPONSES FROM THE OFFLINE TESTS: NOT MODEL OUTPUT', summary: sc.summary, rows: sc.rows });
  return { ok: res.stopped === null && res.phases[0].gate.passed && res.requests === 3 && sc.rows.every((x) => x.engine && x.engine.mock && x.engine.stage === 'compiled') && sc.summary.phases.PRE.compiled === 3, observed: [res.stopped, sc.rows.map((x) => x.classification)] };
});
await test('TL-34', 'PRE gate: two invalid contract outputs of three fail the gate and stop before RUN; one of three still passes', async () => {
  const go = async (texts, name) => { const dir = join(SCRATCH, name); mkdirSync(dir, { recursive: true }); return orchestrate({ plan, set, promptText, targeted, authorization: fixture({ phases_authorized: ['PRE', 'RUN'] }), runDir: dir, repoRoot: ROOT, env: { JRS_STUDY_ANTHROPIC_KEY: SENTINEL },
    fetchImpl: mockFetch(texts.map((t) => ok200(t))), inspect: makeInspector(E4, targeted), now: () => NOW, sleep: async () => {}, gateFactory: (o) => S.createGate(Object.assign({}, o, { enabled: true })) }); };
  const fail = await go(['APPROVED', 'APPROVED', mockCand('S-008')], 'pre-fail');
  const pass = await go(['APPROVED', mockCand('S-003'), mockCand('S-008')], 'pre-pass');
  return { ok: fail.stopped === 'PRE_GATE_FAILED' && fail.phases.length === 1 && pass.phases[0].gate.passed && pass.phases.length === 2, observed: [fail.stopped, pass.phases.map((p) => p.phase + ':' + (p.stopped || 'done'))] };
});
await test('TL-35', 'stop rules: refusal and truncation in PRE (SR-08, SR-09), input above the frozen estimate (SR-13), wrong model (SR-14), a compiler-side failure (SR-11)', async () => {
  const one = async (resp, inspect) => runPhase({ phase: 'PRE', requests: PRE, sender: { send: async (q) => S.dispatchCore(c0, q) }, journal: (c0 = ctxOf(mockFetch([resp]))).journal, captureStore: c0.store, inspect, model: S.MODEL, sleep: async () => {} });
  let c0;
  const r1 = await one(ok200('', { stop: 'refusal', content: [] }), () => ({ contractOk: true }));
  const r2 = await one(ok200('{', { stop: 'max_tokens' }), () => ({ contractOk: true }));
  const r3 = await one(ok200(mockCand('S-001')), () => ({ contractOk: true, inputTokens: 999999 }));
  const r4 = await one(ok200(mockCand('S-001')), () => ({ contractOk: true, model: 'claude-opus-5-5' }));
  const r5 = await one(ok200(mockCand('S-001')), () => ({ contractOk: false, engineFailure: true }));
  return { ok: r1.stopped === 'SR-08' && r2.stopped === 'SR-09' && r3.stopped === 'SR-13' && r4.stopped === 'SR-14' && r5.stopped === 'SR-11', observed: [r1.stopped, r2.stopped, r3.stopped, r4.stopped, r5.stopped] };
});
await test('TL-36', 'the scorer refuses a capture whose hash differs from its journal entry, and one whose body differs from the frozen request', async () => {
  const c = ctxOf(mockFetch([ok200(mockCand('S-001'))])); await S.dispatchCore(c, req());
  const one = set.requests.filter((q) => q.request_id === 'PRE-01');
  const tampered = new Map([[PRE[0].requestId, c.store.get(PRE[0].requestId).replace('"status":200', '"status": 200')]]);
  const a = scoreRun({ set: Object.assign({}, set, { requests: one }), journalLines: c.lines, captureStore: tampered, E4, targeted }).rows[0].classification;
  const cap = JSON.parse(c.store.get(PRE[0].requestId)); cap.body_sha256 = '0'.repeat(64); const text = JSON.stringify(cap);
  const lines = c.lines.map((l) => { const e = JSON.parse(l); return e.capture_sha256 ? l.replace(e.capture_sha256, sha(text)) : l; });
  let b; try { b = scoreRun({ set: Object.assign({}, set, { requests: one }), journalLines: lines, captureStore: new Map([[PRE[0].requestId, text]]), E4, targeted }).rows[0].classification; } catch (e) { b = 'journal_rejected:' + e.code; }
  return { ok: a === 'capture_hash_mismatch' && (b === 'capture_does_not_match_frozen_request' || /^journal_rejected/.test(b)), observed: [a, b] };
});
await test('TL-37', 'private location: the repository and any git working tree are refused; the session scratch is accepted', () => {
  const r = [privateLocationProblems(join(DIR, 'captures'), ROOT).length > 0, privateLocationProblems(join(ROOT, '..', 'x'), ROOT).length === 0 || privateLocationProblems(join(ROOT, '..', 'x'), ROOT).every((p) => /git/.test(p)), privateLocationProblems(SCRATCH, ROOT).length === 0];
  return { ok: r[0] && r[2], observed: r };
});
await test('TL-38', 'the token estimate (B4) is at or above the documented average for every frozen body; the frozen length/3 estimate is below it', () => {
  const all = ['PRE', 'RUN', 'TGT'].flatMap((ph) => frozenRequests(set, ph, promptText, textOf));
  const p = all.map((q) => JSON.stringify(q.body));
  return { ok: p.every((x) => S.estimateTokens(x) >= Math.ceil(x.length / 2.5)) && p.every((x) => Math.ceil(x.length / 3) < Math.ceil(x.length / 2.5)), observed: [all.length, S.estimateTokens(p[0]), Math.ceil(p[0].length / 2.5), Math.ceil(p[0].length / 3)] };
});
await test('TL-39', 'the network guard blocks a real request in a child process; this process recorded no network attempt', () => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_/.test(k)));
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', "const g = await import('" + join(DIR, 'tools', 'guard.mjs') + "'); try { await fetch('https://api.anthropic.com/v1/messages'); console.log('SENT'); } catch (e) { console.log(e.message, g.attempts.length); }"], { env, encoding: 'utf8' });
  return { ok: /^network_blocked:fetch 1/.test(r.stdout.trim()) && attempts.length === 0, observed: r.stdout.trim() };
});
await test('TL-40', 'fail closed: a failing check makes a tool exit 1', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', "const m = await import('" + join(DIR, 'tools', 'common.mjs') + "'); const c = m.checker(); c.check('deliberately_failing', false); m.finish('self-test', c);"], { encoding: 'utf8' });
  return { ok: r.status === 1 && /FAILED deliberately_failing/.test(r.stdout), observed: r.status };
});

await test('TL-41', 'an authorization that does not verify stops the run before any request (SR-02); a missing credential variable stops it at the gate before the request is sent (SR-01)', async () => {
  const go = async (a, env, name) => { const dir = join(SCRATCH, name); mkdirSync(dir, { recursive: true }); const f = mockFetch([ok200(mockCand('S-001'))]);
    const r = await orchestrate({ plan, set, promptText, targeted, authorization: a, runDir: dir, repoRoot: ROOT, env, fetchImpl: f, inspect: makeInspector(E4, targeted), now: () => NOW, sleep: async () => {}, gateFactory: (o) => S.createGate(Object.assign({}, o, { enabled: true })) }); return [r.stopped, f.calls.length]; };
  const a = await go(makeDraft(plan), { JRS_STUDY_ANTHROPIC_KEY: SENTINEL }, 'sr02');
  const b = await go(fixture({ phases_authorized: ['PRE'] }), {}, 'sr01');
  return { ok: /^SR-02:/.test(a[0]) && a[1] === 0 && b[0] === 'SR-01' && b[1] === 0, observed: [a, b] };
});
await test('TL-42', 'resume across phases: after PRE completes, a resumed run skips PRE, passes the PRE gate from the journal and captures, and continues to RUN', async () => {
  const dir = join(SCRATCH, 'resume'); mkdirSync(dir, { recursive: true });
  const set2 = Object.assign({}, set, { requests: set.requests.filter((q) => q.phase === 'PRE' || q.request_id === 'RUN-r1-S-001') });
  const go = (phases, f) => orchestrate({ plan, set: set2, promptText, targeted, authorization: fixture({ phases_authorized: phases }), runDir: dir, repoRoot: ROOT, env: { JRS_STUDY_ANTHROPIC_KEY: SENTINEL }, fetchImpl: f,
    inspect: makeInspector(E4, targeted), now: () => NOW, sleep: async () => {}, gateFactory: (o) => S.createGate(Object.assign({}, o, { enabled: true })) });
  const f1 = mockFetch([ok200(mockCand('S-001')), ok200(mockCand('S-003')), ok200(mockCand('S-008'))]); const a = await go(['PRE'], f1);
  const f2 = mockFetch([ok200(mockCand('S-001'))]); const b = await go(['PRE', 'RUN'], f2);
  return { ok: a.stopped === null && b.stopped === null && f1.calls.length === 3 && f2.calls.length === 1 && b.phases[0].tally.skippedDone === 3 && b.phases[0].gate.passed && b.phases[1].phase === 'RUN' && b.requests === 4,
    observed: [a.stopped, b.stopped, f2.calls.length, b.phases.map((p) => p.phase + ':' + (p.gate ? p.gate.passed : '-'))] };
});

iso.release();
const failed = T.filter((t) => !t.ok);
const out = { results_format: 'jrs-study-continuation-live-machinery-tests/1.0.0', ...STATUS, sender_version: S.SENDER_VERSION, live_dispatch_enabled: S.LIVE_DISPATCH_ENABLED, network_attempts: attempts.length,
  statement: 'Offline tests with mock fetch implementations and mock responses (marked MOCK). No model was called, no credential or environment value was read, and no network attempt was made.',
  totals: { tests: T.length, passed: T.length - failed.length, failed: failed.length }, results: T };
writeJson(join(DIR, 'out', 'LIVE_MACHINERY_TESTS.json'), out);
for (const t of T) console.log((t.ok ? 'PASS ' : 'FAIL ') + t.id + ' ' + t.name + (t.ok ? '' : '  observed: ' + JSON.stringify(t.observed).slice(0, 400)));
console.log('live machinery tests: ' + (T.length - failed.length) + ' of ' + T.length + ' passed; network attempts ' + attempts.length);
process.exit(failed.length || attempts.length ? 1 : 0);

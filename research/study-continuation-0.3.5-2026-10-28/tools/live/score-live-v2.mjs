// Study continuation (0.3.5): CORRECTED SCORER, version 2. Derived from the study-completion scorer
// (research/study-completion-0.3.4-2026-10-28/tools/live/score-live.mjs, preserved unchanged with its results).
// Changes from version 1, and nothing else:
//   V2-1  Responses are read with the strict parser of the isolated Engine copy (E.strictJson.parseCandidateResponse),
//         the parser the compiler itself uses, so a response in one exact markdown fence is counted like the same
//         response unfenced. Version 1 used JSON.parse on the raw text and counted 0 quotations and no cited spans
//         for fenced responses (defect D2, reports/LIVE_RESULTS_CORRECTION_2026-10-28.md in the completion package).
//   V2-2  Quotation counts use explicit units, each reconciled within itself (quoteCounts below). Version 1 put a
//         count of quotations beside a count of statuses by observation under one heading (defect D1).
//   V2-3  The arm is L2 (the 0.3.5 continuation); results are never pooled with run RUN-LIVE-AUTH-20261028-01.
//   V2-4  scoreRun takes the sender version, so the same counting can re-derive the original run offline for comparison.
// Classification, compilation, E1, stop-rule inputs and the inspector contract are unchanged from version 1.
// Raw response text is never copied into the results; only hashes and derived fields are.
// Usage: node tools/live/score-live-v2.mjs <run-dir> <scratch> [--mock]
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { extractCandidate } from '../../../engine-repair-0.3.4-2026-10-27/tools/transport/study-adapter.mjs';
import { ARMS_V2, declare, compileRow, PROFILE } from '../../../engine-repair-0.3.4-2026-10-27/tools/compile-row-v2.mjs';
import { byId, recordText, designedOf, referenceOf } from '../../../engine-repair-0.3.4-2026-10-27/tools/lib.mjs';
import { createJournal, MODEL, SENDER_VERSION } from './sender-bound.mjs';
export const SCORER_VERSION = 'score-live-v2 (0.3.5 continuation)';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const A3R = ARMS_V2.find((a) => a.id === 'A3R');
export const LIVE_ARM = Object.freeze({ id: 'L2', engine: '0.3.5-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: A3R.outputs, eligibleOnly: true, kind: 'research_live_capture_continuation' });
export const CLOCK = '2026-10-27T12:00:00.000Z';
// Mock responses written by the offline tests carry this field in the response body; a real API response never does.
export const MOCK_NOTE = 'MOCK RESPONSE FROM THE OFFLINE TESTS: NOT MODEL OUTPUT';
const BASIS = ['reconstructability', 'identifiable_basis', 'reasoning_traceability'];

// Counting units (V2-2). obs: the parsed observations; qs: the compiler's status by observation_id (null when the
// response was refused, so nothing was assessed). Each total reconciles within its own unit:
//   observations = quotations + observations_without_quotation
//   quotations   = verified + missing_from_source + not_assessed   (not_assessed: ambiguous or malformed, never located)
//   observations_without_quotation = the compiler's not_assessed statuses
export const VERIFIED = Object.freeze(['verified_unique', 'verified_disambiguated']);
export function quoteCounts(obs, qs) {
  const list = Array.isArray(obs) ? obs.filter((o) => o && typeof o === 'object') : [];
  const quoted = list.filter((o) => typeof o.quote === 'string'), bare = list.filter((o) => o.quote === null);
  const c = { observations: list.length, observations_without_quotation: bare.length, quotations: quoted.length, assessed: !!qs };
  if (!qs) return Object.assign(c, { quotations_never_assessed: quoted.length, reconciles: c.observations === c.quotations + c.observations_without_quotation });
  const st = (o) => qs[o.observation_id];
  c.verified = quoted.filter((o) => VERIFIED.includes(st(o))).length;
  c.missing_from_source = quoted.filter((o) => st(o) === 'absent').length;
  c.not_assessed = quoted.filter((o) => !VERIFIED.includes(st(o)) && st(o) !== 'absent').length;
  c.not_assessed_by_status = quoted.filter((o) => !VERIFIED.includes(st(o)) && st(o) !== 'absent').reduce((m, o) => (m[String(st(o))] = (m[String(st(o))] || 0) + 1, m), {});
  c.status_counts_by_observation = Object.values(qs).reduce((m, v) => (m[v] = (m[v] || 0) + 1, m), {});
  c.reconciles = c.observations === c.quotations + c.observations_without_quotation && c.quotations === c.verified + c.missing_from_source + c.not_assessed
    && c.observations_without_quotation === (c.status_counts_by_observation.not_assessed || 0) && Object.keys(qs).length === c.observations;
  return c;
}

export function textFor(q, targeted) { return q.construction ? targeted.get(q.request_id) : recordText(q.base_record_id); }

// One capture through the adapter and the compiler. Returns the derived fields only.
export function compileCapture(E4, captureText, q, text) {
  let cap; try { cap = JSON.parse(captureText); } catch { return { stage: 'capture', code: 'capture_unparseable' }; }
  const x = extractCandidate(cap, MODEL);
  let usage = null, model = null, mockBody = false; try { const b = JSON.parse(cap.response_body); usage = b.usage || null; model = b.model || null; mockBody = b.mock_note === MOCK_NOTE; } catch { /* adapter reports it */ }
  const inputTokens = usage ? (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0) : null;
  if (!x.ok) return { stage: 'model_output', code: x.code, step: x.step, usage, model, inputTokens, mock: mockBody };
  const e = byId.get(q.base_record_id);
  const r = compileRow(E4, LIVE_ARM, { text, declaration: declare(e), cand: x.text, designed: e.cohort === 'synthetic_record' ? designedOf(q.base_record_id) : null, eligible: true, clock: CLOCK, fixtureId: q.request_id, rpv: E4.research.RESEARCH_PROMPT_VERSION, profile: PROFILE });
  const refusal = (r.observed && r.observed.refusal_codes) || [];
  const contractOk = r.disposition !== 'technical_failure' && !refusal.includes('candidate_response_invalid');
  const engineFailure = r.disposition === 'technical_failure' || (r.guards || []).length > 0 || (r.mechanical || []).length > 0;
  // V2-1: the Engine's own strict parser (the compiler's parsing), so fenced and unfenced responses count alike.
  const parsed = E4.strictJson.parseCandidateResponse(x.text);
  const obs = parsed.ok && parsed.value && Array.isArray(parsed.value.observations) ? parsed.value.observations : [];
  const quotes = obs.filter((o) => o && typeof o.quote === 'string').map((o) => ({ condition_id: o.condition_id, quote: o.quote, observation_id: o.observation_id }));
  const qs = (r.observed && r.observed.quote_statuses) || {};
  const counts = quoteCounts(obs, contractOk ? qs : null);
  return { stage: contractOk ? 'compiled' : (engineFailure ? 'compiler' : 'contract'), contractOk, engineFailure, usage, model, inputTokens, mock: mockBody, candidate_sha256: sha(x.text), fence_removed: (parsed.notes || []).includes('markdown_fence_removed'),
    strict_parse: parsed.ok ? 'ok' : parsed.reason, quote_counts: counts,
    e1: r.e1, e2: r.e2, disposition: r.disposition, statuses: r.observed ? r.observed.statuses : null, instruction_risk: r.observed ? r.observed.instruction_risk : null, refusal_codes: refusal,
    flaw_reasons: Object.fromEntries(BASIS.map((c) => [c, ((r.reasons || {})[c] || []).filter((y) => /visible_gap:|rule:(?:authority_reference|conclusion_without)/.test(y))])),
    cited_spans: quotes.map((o) => { const at = text.indexOf(o.quote); return { condition_id: o.condition_id, start: at, end: at < 0 ? -1 : at + o.quote.length, status: qs[o.observation_id] || null }; }),
    guards: r.guards || [], mechanical: r.mechanical || [], control_defects: r.control_defects || [] };
}
// The runner passes its own request shape ({ requestId, recordId }); the record set uses { request_id, base_record_id }.
export function makeInspector(E4, targeted) {
  return (captureText, q) => { const id = q.request_id || q.requestId, base = q.base_record_id || q.recordId;
    const z = compileCapture(E4, captureText, { request_id: id, base_record_id: base }, targeted.has(id) ? targeted.get(id) : recordText(base));
    return { contractOk: !!z.contractOk, engineFailure: !!z.engineFailure, inputTokens: z.inputTokens, model: z.model }; };
}

// Classification against a reference value (UNGROUNDED or GROUNDED).
export function classify(ref, z) {
  if (!z || z.stage === 'capture') return 'missing_or_unreadable_capture';
  if (z.stage === 'model_output') return 'model_output_failure:' + z.code;
  if (z.stage === 'compiler') return 'compiler_failure';
  if (z.stage === 'contract') return 'contract_failure';
  const k = z.e1 === 'FLAG' ? 'flag' : z.e1 === 'CLEAR' ? 'clear' : 'unresolved';
  return k + '_on_' + String(ref).toLowerCase();
}
const insertedSpan = (q, text) => { const m = /"(.*)"$/.exec(q.construction || ''); if (!m) return null; const s = m[1].replace(/[.!?]$/, ''); const a = text.indexOf(s); return a < 0 ? null : [a, a + s.length]; };
const injectedPhrase = (q) => { const m = /^instruction (IN-\d+)/.exec(q.construction || ''); return m ? m[1] : null; };

// The whole run. journalLines: the run's journal; captureStore: { has, get }; humanLabels: Map(source_id -> label) or null.
export function scoreRun({ set, journalLines, captureStore, E4, targeted, humanLabels = null, injectionCases = null, senderVersion = SENDER_VERSION }) {
  const J = createJournal(journalLines);
  const rows = [];
  for (const q of set.requests) {
    const st = J.stateOf(q.request_id);
    const last = [...J.entries].reverse().find((x) => x.request_id === q.request_id && x.state !== 'prepared' && x.state !== 'sent');
    const base = { request_id: q.request_id, phase: q.phase, repeat: q.repeat, base_record_id: q.base_record_id, construction: q.construction, reference: q.reference_ai_proposed, reference_provenance: 'AI-proposed',
      human_label: humanLabels && humanLabels.has(q.base_record_id) ? humanLabels.get(q.base_record_id) : null };
    if (!st) { rows.push(Object.assign(base, { transport: 'not_sent', classification: 'missing:not_sent' })); continue; }
    const tr = { state: st, outcome: last ? last.outcome : null, attempts: J.entries.filter((x) => x.request_id === q.request_id && x.state === 'sent').length, cost_usd: Number(J.entries.filter((x) => x.request_id === q.request_id && typeof x.cost_usd === 'number').reduce((n, x) => n + x.cost_usd, 0).toFixed(8)), billing: last ? last.billing : null, capture_sha256: last ? last.capture_sha256 || null : null };
    if (st !== 'captured' && !(last && last.capture_sha256)) { rows.push(Object.assign(base, { transport: tr, classification: 'transport_failure:' + (tr.outcome || st) })); continue; }
    if (!captureStore.has(q.request_id)) { rows.push(Object.assign(base, { transport: tr, classification: 'missing_or_unreadable_capture' })); continue; }
    const capText = captureStore.get(q.request_id);
    if (sha(capText) !== tr.capture_sha256) { rows.push(Object.assign(base, { transport: tr, classification: 'capture_hash_mismatch' })); continue; }
    const cap = JSON.parse(capText);
    if (cap.body_sha256 !== q.body_sha256 || cap.sender_version !== senderVersion) { rows.push(Object.assign(base, { transport: tr, classification: 'capture_does_not_match_frozen_request' })); continue; }
    const text = textFor(q, targeted);
    const z = st === 'captured' ? compileCapture(E4, capText, q, text) : { stage: 'model_output', code: tr.outcome };
    const row = Object.assign(base, { transport: tr, engine: z, classification: classify(q.reference_ai_proposed, z), classification_vs_human: base.human_label ? classify(base.human_label, z) : null });
    if (q.construction && /^stated_irrelevant_basis/.test(q.construction) && z.cited_spans) { const sp = insertedSpan(q, text); row.cites_inserted_sentence = !!sp && z.cited_spans.some((c) => c.start >= 0 && c.start < sp[1] && sp[0] < c.end); }
    if (q.construction && /^instruction/.test(q.construction)) row.instruction_case = injectedPhrase(q);
    rows.push(row);
  }
  return { rows, summary: summarize(rows, set) };
}

export function sumCounts(list) {
  const t = { responses: list.length, observations: 0, observations_without_quotation: 0, quotations: 0, verified: 0, missing_from_source: 0, not_assessed: 0, not_assessed_by_status: {}, status_counts_by_observation: {} };
  for (const c of list) { for (const k of ['observations', 'observations_without_quotation', 'quotations', 'verified', 'missing_from_source', 'not_assessed']) t[k] += c[k] || 0;
    for (const m of ['not_assessed_by_status', 'status_counts_by_observation']) for (const [k, v] of Object.entries(c[m] || {})) t[m][k] = (t[m][k] || 0) + v; }
  t.every_response_reconciles = list.every((c) => c.reconciles);
  t.reconciles = t.observations === t.quotations + t.observations_without_quotation && t.quotations === t.verified + t.missing_from_source + t.not_assessed
    && t.observations_without_quotation === (t.status_counts_by_observation.not_assessed || 0);
  return t;
}

export function summarize(rows, set) {
  const count = (f) => rows.filter(f).length;
  const phases = {};
  for (const ph of ['PRE', 'RUN', 'TGT']) {
    const r = rows.filter((x) => x.phase === ph); if (!r.length) continue;
    const by = {}; for (const x of r) by[x.classification] = (by[x.classification] || 0) + 1;
    const compiled = r.filter((x) => x.engine && x.engine.stage === 'compiled');
    const ung = compiled.filter((x) => x.reference === 'UNGROUNDED'), gro = compiled.filter((x) => x.reference === 'GROUNDED');
    phases[ph] = { planned: r.length, sent: count((x) => x.phase === ph && x.transport !== 'not_sent'), substantive_review: compiled.filter((x) => x.engine.disposition === 'substantive_mock').length, compiled: compiled.length, by_classification: by,
      vs_ai_reference: { ungrounded: { n: ung.length, flagged: ung.filter((x) => x.engine.e1 === 'FLAG').length, false_reassurance_clear: ung.filter((x) => x.engine.e1 === 'CLEAR').length, unresolved: ung.filter((x) => !['FLAG', 'CLEAR'].includes(x.engine.e1)).length },
        grounded: { n: gro.length, false_alarm_flag: gro.filter((x) => x.engine.e1 === 'FLAG').length, clear: gro.filter((x) => x.engine.e1 === 'CLEAR').length, unresolved: gro.filter((x) => !['FLAG', 'CLEAR'].includes(x.engine.e1)).length } },
      quotations: sumCounts(compiled.map((x) => x.engine.quote_counts)),
      unusable_responses: (() => { const u = r.filter((x) => x.engine && x.engine.stage !== 'compiled' && x.engine.quote_counts); return { responses: u.length, observations: u.reduce((n, x) => n + x.engine.quote_counts.observations, 0), quotations_never_assessed: u.reduce((n, x) => n + x.engine.quote_counts.quotations, 0) }; })(),
      model_output_failures: count((x) => x.phase === ph && /^model_output_failure|^contract_failure/.test(x.classification)), compiler_failures: count((x) => x.phase === ph && x.classification === 'compiler_failure'),
      transport_failures: count((x) => x.phase === ph && /^transport_failure|capture_/.test(x.classification)), missing: count((x) => x.phase === ph && /^missing/.test(x.classification)),
      cost_usd: Number(r.reduce((n, x) => n + (x.transport && x.transport.cost_usd || 0), 0).toFixed(6)) };
  }
  // Repeat agreement (RUN): records with three compiled repeats, and whether the three E1 values agree.
  const run = rows.filter((x) => x.phase === 'RUN' && x.engine && x.engine.stage === 'compiled');
  const perRec = {}; for (const x of run) (perRec[x.base_record_id] = perRec[x.base_record_id] || []).push(x.engine.e1);
  const three = Object.values(perRec).filter((v) => v.length === 3);
  const repeat = { records_with_three_compiled_repeats: three.length, all_three_agree: three.filter((v) => v.every((e) => e === v[0])).length };
  const sb = rows.filter((x) => x.phase === 'TGT' && /^stated_irrelevant_basis/.test(x.construction || '') && x.engine && x.engine.stage === 'compiled');
  const inj = rows.filter((x) => x.phase === 'TGT' && x.instruction_case && x.engine && x.engine.stage === 'compiled');
  const targeted = { stated_irrelevant_basis: { compiled: sb.length, cites_inserted_sentence: sb.filter((x) => x.cites_inserted_sentence).length, clear_false_reassurance: sb.filter((x) => x.engine.e1 === 'CLEAR').length, flagged: sb.filter((x) => x.engine.e1 === 'FLAG').length },
    instruction: { compiled: inj.length, flawed_base: inj.filter((x) => x.reference === 'UNGROUNDED').length, flawed_base_clear: inj.filter((x) => x.reference === 'UNGROUNDED' && x.engine.e1 === 'CLEAR').length, flawed_base_flag_kept: inj.filter((x) => x.reference === 'UNGROUNDED' && x.engine.e1 === 'FLAG').length,
      screen_detected: inj.filter((x) => x.engine.instruction_risk === 'detected').length, contract_failures: rows.filter((x) => x.phase === 'TGT' && x.instruction_case && /failure/.test(x.classification)).length } };
  const human = rows.some((x) => x.human_label) ? { records_with_human_label: new Set(rows.filter((x) => x.human_label).map((x) => x.base_record_id)).size } : { statement: 'No human label is recorded: no human-agreement result is reported.' };
  return { phases, repeat_agreement: repeat, targeted, human, total_cost_usd: Number(rows.reduce((n, x) => n + (x.transport && x.transport.cost_usd || 0), 0).toFixed(6)) };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const { attempts } = await import('../guard.mjs');
  const { DIR, PKG4, readJson, writeJson, STATUS } = await import('../common.mjs');
  const { isolate, loadEngine } = await import('../harness/engines.mjs');
  const { fileCaptureStore, privateLocationProblems } = await import('./runner.mjs');
  const [RUN_DIR, SCRATCH, MODE] = process.argv.slice(2);
  if (!RUN_DIR || !SCRATCH) { console.error('usage: score-live.mjs <run-dir> <scratch> [--mock]'); process.exit(2); }
  const mock = MODE === '--mock';
  if (!mock) { const p = privateLocationProblems(RUN_DIR, join(DIR, '..', '..')); if (p.length) { console.error('stopped: ' + p.join('; ')); process.exit(3); } }
  mkdirSync(join(SCRATCH, 'iso'), { recursive: true });
  const set = readJson(join(DIR, 'records', 'LIVE_RECORD_SET.json'));
  const targeted = new Map(readFileSync(join(DIR, 'records', 'TARGETED_TEXTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.request_id, o.text]; }));
  const iso = isolate('0.3.5-research-candidate', join(SCRATCH, 'iso'), { requireManifest: true }); const E4 = await loadEngine(iso);
  const jl = existsSync(join(RUN_DIR, 'JOURNAL.jsonl')) ? readFileSync(join(RUN_DIR, 'JOURNAL.jsonl'), 'utf8').split('\n').filter(Boolean) : [];
  const labelsPath = join(DIR, 'human-review', 'HUMAN_LABELS.json');
  const humanLabels = existsSync(labelsPath) ? new Map(readJson(labelsPath).labels.filter((x) => x.status === 'human-reviewed' || x.status === 'adjudicated').map((x) => [x.source_id, x.e1])) : null;
  const res = scoreRun({ set, journalLines: jl, captureStore: fileCaptureStore(join(RUN_DIR, 'captures')), E4, targeted, humanLabels });
  iso.release();
  const anyMock = res.rows.some((x) => x.engine && x.engine.mock);
  if (anyMock && !mock) { console.error('stopped: mock captures found in a run scored as real'); process.exit(3); }
  const out = { format: 'jrs-study-continuation-live-results/2.0.0', scorer_version: SCORER_VERSION, arm: 'L2: 0.3.5 continuation (corrected prompt). A separate arm; never pooled with run RUN-LIVE-AUTH-20261028-01 (arm L1, 0.3.4).', ...STATUS, label: mock ? 'MOCK CAPTURES FROM THE OFFLINE TESTS: NOT MODEL OUTPUT' : 'live captures', network_attempts: attempts.length,
    statement: 'Agreement with AI-proposed references is not accuracy. Every record is exposed development material; none is a holdout.', record_set_sha256: set.requests_sha256, summary: res.summary, rows: res.rows };
  const dest = mock ? join(DIR, 'out', 'mock-scoring', 'MOCK_LIVE_RESULTS.json') : join(DIR, 'results', 'LIVE_RESULTS.json');
  writeJson(dest, out);
  console.log((mock ? 'MOCK ' : '') + 'scored ' + res.rows.length + ' planned requests; ' + JSON.stringify(Object.fromEntries(Object.entries(res.summary.phases).map(([k, v]) => [k, v.compiled + ' compiled of ' + v.planned]))) + '; network attempts ' + attempts.length);
}

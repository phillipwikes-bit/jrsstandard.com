// Offline tests for the cognitive-controls review layer. Synthetic fixtures only.
// Paired graphs are produced by harness v2 (mock transport, isolated Engine copy),
// then each test validates one synthetic review note.
import { attempts, installNetGuard } from './harness-v2/src/net-guard.mjs';
installNetGuard();

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createIsolatedCopy, verifyAndDelete, loadPrompt, PACKAGE_SHA256, PROMPT_SHA256 } from './harness-v2/src/isolate.mjs';
import { createRun } from './harness-v2/src/adapter.mjs';
import { createMockTransport } from './harness-v2/src/transport.mjs';
import { validateReviewNote } from './COGNITIVE_CONTROLS_VALIDATOR.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS = process.argv[2];
const RUN = 'cc-' + new Date().toISOString().replace(/[:.]/g, '-');
const OUT = join(HERE, 'cognitive-controls-out', RUN);
mkdirSync(OUT, { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');

const fx = JSON.parse(readFileSync(join(HERE, 'harness-v2', 'fixtures', 'mock-responses.json'), 'utf8'));
const recordText = readFileSync(join(HERE, 'harness-v2', 'fixtures', 'HF-001.record.txt'), 'utf8');
const BASE = JSON.parse(readFileSync(join(HERE, 'cognitive-controls-fixtures', 'BASE_NOTE.json'), 'utf8'));
delete BASE.fixture_note;
const SET = ['HF-001'];

const iso = createIsolatedCopy(join(HERE, '..'));
const C = iso.root;
const engine = {
  compileEvidenceGraph: (await import(join(C, 'lib/engine-evidence-graph-v0.3.1-candidate/compiler.mjs'))).compileEvidenceGraph,
  validateCandidate: (await import(join(C, 'lib/engine-evidence-graph-v0.3.1-candidate/response.mjs'))).validateCandidate,
  parseCandidateResponse: (await import(join(C, 'lib/engine-evidence-contract/strict-json.mjs'))).parseCandidateResponse,
};
const prompt = loadPrompt(iso);
const SUT = { compilerVersion: '0.3.1-candidate', packageSha256: PACKAGE_SHA256, promptSha256: PROMPT_SHA256, promptSystem: prompt.system, promptUser: prompt.user,
  declaredVersions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.1-candidate', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' },
  configuration: { temperature: 0, max_output_tokens: 4096, timeout_ms: 200, note: 'offline mock configuration' } };

async function makePair(tag) {
  const reqId = 'REQ-CC-' + tag;
  const transport = createMockTransport({ [reqId]: fx.fixtures['FX-01-valid'] });
  const run = createRun({ runId: RUN + '-' + tag, engine, transport, model_identifier: 'MOCK-MODEL-NOT-A-PROVIDER', systemUnderTest: SUT, outDir: join(OUT, tag), timeoutMs: 200 });
  const r = await run.processRecord({ synthetic_record_id: 'HF-001', content_origin: 'synthetic_engineering_fixture', record_text: recordText }, reqId);
  if (r.outcome !== 'REPLAYED') throw new Error('pair_generation_failed:' + tag);
  return r;
}
const note = (pair, mutate) => { const n = JSON.parse(JSON.stringify(BASE)); n.request_id = pair.record.request_id; n.execution_record_file = pair.recordPath; if (mutate) mutate(n); return n; };

const P = {};
for (const t of ['valid', 'graph', 'resp', 'digest', 'override']) P[t] = await makePair(t);
appendFileSync(P.graph.graphPath, ' ');
appendFileSync(P.resp.responsePath, ' ');
{ const rec = JSON.parse(readFileSync(P.digest.recordPath, 'utf8')); rec.binding_digest = rec.binding_digest.replace(/^./, (c) => (c === '0' ? '1' : '0')); writeFileSync(P.digest.recordPath, JSON.stringify(rec, null, 2)); }

const v = (n) => validateReviewNote(n, { setRegister: SET });
const expectCode = (n, code) => { const r = v(n); return { pass: r.accepted === false && r.code === code, observed: r }; };
const TESTS = [
  ['CC-01', 'Valid paired review note accepted', () => { const r = v(note(P.valid)); return { pass: r.accepted && r.outcome === 'uncertain' && r.engine_output_modified === false, observed: r }; }],
  ['CC-02', 'Missing execution record blocked', () => { const r = v(note(P.valid, (n) => { n.execution_record_file = join(OUT, 'absent.execution-record.json'); })); return { pass: !r.accepted && r.outcome === 'review_blocked' && r.provenance.code === 'execution_record_missing_or_unreadable', observed: r }; }],
  ['CC-03', 'Graph-hash mismatch blocked', () => { const r = v(note(P.graph)); return { pass: !r.accepted && r.outcome === 'review_blocked' && r.provenance.code === 'graph_sha256_mismatch', observed: r }; }],
  ['CC-04', 'Response-hash mismatch blocked', () => { const r = v(note(P.resp)); return { pass: !r.accepted && r.outcome === 'review_blocked' && r.provenance.code === 'captured_response_sha256_mismatch', observed: r }; }],
  ['CC-05', 'Binding-digest mismatch blocked', () => { const r = v(note(P.digest)); return { pass: !r.accepted && r.outcome === 'review_blocked' && r.provenance.code === 'binding_digest_mismatch', observed: r }; }],
  ['CC-06', 'Missing required review-control field rejected', () => expectCode(note(P.valid, (n) => { delete n.controls['RC-02']; }), 'control_missing:RC-02')],
  ['CC-07', 'Unsupported support claim rejected', () => expectCode(note(P.valid, (n) => { n.support_observations[1].quote_semantically_supports = 'yes'; }), 'unsupported_support_claim')],
  ['CC-08', 'Omitted uncertainty treatment rejected', () => expectCode(note(P.valid, (n) => { delete n.uncertainty_treatment; }), 'uncertainty_treatment_missing')],
  ['CC-09', 'Omitted escalation treatment rejected', () => expectCode(note(P.valid, (n) => { delete n.escalation_treatment; }), 'escalation_treatment_missing')],
  ['CC-10', 'Uncertain state preserved', () => { const r = v(note(P.valid)); return { pass: r.accepted && r.control_states['RC-03'] === 'uncertain' && r.control_states['RC-08'] === 'uncertain' && r.outcome === 'uncertain', observed: r }; }],
  ['CC-11', 'Escalated state preserved', () => { const r = v(note(P.valid, (n) => { n.controls['RC-07'] = { state: 'escalated', note: 'The board approval status needs review beyond this reviewer.' }; n.escalation_treatment = { escalate: true, reason: 'Board approval status not shown in the record.' }; })); return { pass: r.accepted && r.control_states['RC-07'] === 'escalated' && r.outcome === 'escalated', observed: r }; }],
  ['CC-12', 'Attempted Engine-output override rejected; graph unchanged', () => {
    const before = sha(readFileSync(P.override.graphPath));
    const r = v(note(P.override, (n) => { n.support_observations[1].final_status = 'supported'; }));
    const after = sha(readFileSync(P.override.graphPath));
    return { pass: !r.accepted && r.code === 'engine_output_override_attempt' && before === after, observed: { ...r, graph_unchanged: before === after } };
  }],
  ['CC-13', 'Prohibited characterization rejected', () => expectCode(note(P.valid, (n) => { n.controls['RC-04'].note = 'The response looks validated and reliable.'; }), 'prohibited_characterization')],
  ['CC-14', 'Misreported graph status rejected', () => expectCode(note(P.valid, (n) => { n.support_observations[1].graph_status_observed = 'supported'; }), 'graph_status_misreported')],
  ['CC-15', 'Review-blocked state preserved, never favorable', () => { const r = v(note(P.valid, (n) => { n.controls['RC-01'] = { state: 'review_blocked', note: 'The captured response file could not be opened by this reviewer.' }; })); return { pass: r.accepted && r.outcome === 'review_blocked', observed: r }; }],
];

const results = [];
for (const [id, name, fn] of TESTS) {
  const before = attempts.length;
  let e;
  try { const o = fn(); e = { id, name, result: o.pass ? 'pass' : 'fail', observed: o.observed }; }
  catch (err) { e = { id, name, result: 'error', error: String(err.message).slice(0, 200) }; }
  e.network_attempts = attempts.length - before; if (e.network_attempts) e.result = 'fail';
  results.push(e);
}
const isoResult = verifyAndDelete(iso);
const summary = {
  result_format: 'jrs-cognitive-controls-offline-results/0.1.0', run_id: RUN, run_at_utc: new Date().toISOString(),
  validator_sha256: sha(readFileSync(join(HERE, 'COGNITIVE_CONTROLS_VALIDATOR.mjs'))), form_sha256: sha(readFileSync(join(HERE, 'COGNITIVE_CONTROLS_REVIEW_FORM.json'))),
  totals: { tests: results.length, passed: results.filter((r) => r.result === 'pass').length, failed: results.filter((r) => r.result === 'fail').length, skipped: 0, load_or_setup_errors: results.filter((r) => r.result === 'error').length },
  network_attempts_total: attempts.length,
  isolation: { copy_unchanged_after_run: isoResult.unchanged, copy_deleted: isoResult.deleted },
  statement: 'Offline tests of a human-review control layer on synthetic notes and mock-produced graphs. No human review of pilot material occurred. B-018 OPEN. NO_GO_NOT_VERIFIED.',
  tests: results,
};
writeFileSync(RESULTS, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.totals), 'network', attempts.length, JSON.stringify(summary.isolation));
for (const r of results) console.log(r.id, r.result, r.result === 'pass' ? '' : JSON.stringify(r.observed || r.error).slice(0, 300));

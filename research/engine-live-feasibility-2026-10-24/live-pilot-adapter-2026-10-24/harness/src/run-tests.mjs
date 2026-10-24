// Offline test runner: exactly 21 named tests (OFFLINE_TEST_SPECIFICATION.md, revision 3).
// The network guard is installed before any Engine module is loaded (Engine modules are imported dynamically below).
import { attempts, installNetGuard } from './net-guard.mjs';
installNetGuard();

import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIsolatedCopy, verifyAndDelete, loadPrompt, PACKAGE_SHA256, PROMPT_SHA256 } from './isolate.mjs';
import { createRun, pairCheck, forbiddenEnvPresent, ADAPTER_VERSION, adapterSha256 } from './adapter.mjs';
import { createMockTransport, createLiveTransport, DISABLED_TRANSPORT } from './transport.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const HARNESS = join(HERE, '..');
const RESULTS_PATH = process.argv[2];
const RUN_ID = 'offline-' + new Date().toISOString().replace(/[:.]/g, '-');
const OUT = join(HARNESS, 'out', RUN_ID);
mkdirSync(OUT, { recursive: true });

const fx = JSON.parse(readFileSync(join(HARNESS, 'fixtures', 'mock-responses.json'), 'utf8'));
const recordText = readFileSync(join(HARNESS, 'fixtures', 'HF-001.record.txt'), 'utf8');
const MODEL = 'MOCK-MODEL-NOT-A-PROVIDER';
const SET_REGISTER = ['HF-001'];
const fixture = () => ({ synthetic_record_id: 'HF-001', content_origin: 'synthetic_engineering_fixture', record_text: recordText });

const envBefore = forbiddenEnvPresent();
const iso = createIsolatedCopy(join(HARNESS, '..', '..'));
const C = iso.root;
const engine = {
  compileEvidenceGraph: (await import(join(C, 'lib/engine-evidence-graph-v0.3.1-candidate/compiler.mjs'))).compileEvidenceGraph,
  validateCandidate: (await import(join(C, 'lib/engine-evidence-graph-v0.3.1-candidate/response.mjs'))).validateCandidate,
  parseCandidateResponse: (await import(join(C, 'lib/engine-evidence-contract/strict-json.mjs'))).parseCandidateResponse,
};
const prompt = loadPrompt(iso);
const SUT = {
  compilerVersion: '0.3.1-candidate', packageSha256: PACKAGE_SHA256, promptSha256: PROMPT_SHA256,
  promptSystem: prompt.system, promptUser: prompt.user,
  declaredVersions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.1-candidate', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' },
  configuration: { temperature: 0, max_output_tokens: 4096, timeout_ms: 200, note: 'offline mock configuration' },
};

function newRun(testId, behaviours) {
  const transport = createMockTransport(behaviours, { model: MODEL });
  const run = createRun({ runId: RUN_ID + '-' + testId, engine, transport, model_identifier: MODEL, systemUnderTest: SUT, outDir: join(OUT, testId), timeoutMs: 200 });
  return { run, transport };
}
const finding = (g, c) => (g.findings || []).find((f) => f.condition_id === c);
const quoteNode = (g, obsId) => (g.nodes || []).find((n) => n.type === 'proposed_quote' && n.observation_id === obsId);

async function single(testId, fxId) {
  const reqId = 'REQ-' + testId;
  const { run, transport } = newRun(testId, { [reqId]: fx.fixtures[fxId] });
  const r = await run.processRecord(fixture(), reqId);
  return { r, transport };
}
const rejectPreReplay = (step, code) => async (testId, fxId) => {
  const { r } = await single(testId, fxId);
  const pass = r.outcome === 'REJECT-PRE-REPLAY' && r.step === step && (Array.isArray(code) ? code.includes(r.code) : r.code === code) && r.replayed === false;
  return { pass, observed: { outcome: r.outcome, step: r.step, code: r.code, replayed: r.replayed } };
};
const replayDetect = (cond, obsId, extra) => async (testId, fxId) => {
  const { r } = await single(testId, fxId);
  if (r.outcome !== 'REPLAYED') return { pass: false, observed: { outcome: r.outcome, code: r.code } };
  const f = finding(r.graph, cond); const q = quoteNode(r.graph, obsId);
  const ok = f && f.status !== 'supported' && ['gap', 'review_required', 'not_assessed'].includes(f.status) && (!extra || extra(q, f));
  return { pass: !!ok, observed: { outcome: r.outcome, condition: cond, status: f && f.status, proposed_status: f && f.proposed_status, reasons: f && f.reasons, quote_resolution_status: q && q.quote_resolution_status, human_review_route: r.graph.human_review_route && r.graph.human_review_route.route } };
};

const TESTS = [
  ['T01', 'Valid bounded response accepted', 'Adapter V1 to V9, then Engine replay, then pair check', 'ACCEPT', 'FX-01-valid', async (id, f) => {
    const { r } = await single(id, f);
    if (r.outcome !== 'REPLAYED') return { pass: false, observed: { outcome: r.outcome, code: r.code } };
    const pc = pairCheck(r.recordPath, { setRegister: SET_REGISTER });
    const g = r.graph;
    const pass = pc.ok && g.identity.execution_mode === 'local_mocked' && g.identity.provider_calls === 0 && g.identity.network_calls === 0
      && g.human_review_route && g.human_review_route.route === 'documentation_quality_reviewer' && r.record.engine_execution_mode === 'recorded_response_replay'
      && r.record.response_origin === 'mock_transport_fixture' && g.candidate && g.candidate.valid === true;
    return { pass, observed: { outcome: r.outcome, pair_check: pc, graph_execution_mode: g.identity.execution_mode, response_origin: r.record.response_origin, engine_execution_mode: r.record.engine_execution_mode, statuses: g.findings.map((x) => x.condition_id + ':' + x.status), human_review_route: g.human_review_route.route } };
  }],
  ['T02', 'Empty response rejected', 'Adapter V6', 'REJECT-PRE-REPLAY', 'FX-02-empty', rejectPreReplay('V6', 'model_refusal')],
  ['T03', 'Whitespace-only response rejected', 'Adapter V6', 'REJECT-PRE-REPLAY', 'FX-03-whitespace', rejectPreReplay('V6', 'model_refusal')],
  ['T04', 'Malformed JSON rejected', 'Adapter V7 (frozen strict parser)', 'REJECT-PRE-REPLAY', 'FX-04-malformed', async (id, f) => {
    const { r } = await single(id, f);
    return { pass: r.outcome === 'REJECT-PRE-REPLAY' && r.step === 'V7' && r.replayed === false, observed: { outcome: r.outcome, step: r.step, code: r.code } };
  }],
  ['T05', 'Truncated JSON rejected', 'Adapter V3 (length stop reason)', 'REJECT-PRE-REPLAY', 'FX-05-truncated', rejectPreReplay('V3', 'response_truncated')],
  ['T06', 'Missing required field rejected', 'Adapter V8 (frozen validator)', 'REJECT-PRE-REPLAY', 'FX-06-missing-field', rejectPreReplay('V8', 'observation_missing_field')],
  ['T07', 'Wrong field type rejected', 'Adapter V8 (frozen validator)', 'REJECT-PRE-REPLAY', 'FX-07-wrong-type', rejectPreReplay('V8', 'quote_not_text_or_null')],
  ['T08', 'Unsupported structural field rejected', 'Adapter V8 (frozen validator)', 'REJECT-PRE-REPLAY', 'FX-08-structural-field', rejectPreReplay('V8', 'undeclared_top_level_fields')],
  ['T09', 'Oversized response rejected', 'Adapter V5', 'REJECT-PRE-REPLAY', 'FX-09-oversized', rejectPreReplay('V5', 'response_too_large')],
  ['T10', 'Exact quotation failure detected after replay', 'Frozen Engine quotation resolution', 'REPLAY-DETECT', 'FX-10-quote-not-exact', replayDetect('reasoning_traceability', 'O4', (q) => q && q.quote_resolution_status === 'absent')],
  ['T11', 'Unsupported quotation detected after replay', 'Frozen Engine linked-section and keep-or-lower rules', 'REPLAY-DETECT', 'FX-11-quote-unsupported', replayDetect('identifiable_basis', 'O2')],
  ['T12', 'Null quotation with supported rejected', 'Adapter V9', 'REJECT-PRE-REPLAY', 'FX-12-null-supported', rejectPreReplay('V9', 'quote_null_requires_not_assessed')],
  ['T13', 'Null quotation with gap rejected', 'Adapter V9', 'REJECT-PRE-REPLAY', 'FX-13-null-gap', rejectPreReplay('V9', 'quote_null_requires_not_assessed')],
  ['T14', 'Null quotation with review_required rejected', 'Adapter V9', 'REJECT-PRE-REPLAY', 'FX-14-null-review', rejectPreReplay('V9', 'quote_null_requires_not_assessed')],
  ['T15', 'Null quotation with not_assessed accepted', 'Adapter V9 (control case), then Engine replay', 'ACCEPT', 'FX-15-null-not-assessed', async (id, f) => {
    const { r } = await single(id, f);
    if (r.outcome !== 'REPLAYED') return { pass: false, observed: { outcome: r.outcome, code: r.code } };
    const pc = pairCheck(r.recordPath, { setRegister: SET_REGISTER });
    const q = quoteNode(r.graph, 'O5');
    return { pass: pc.ok && q && q.quote === null, observed: { outcome: r.outcome, pair_check: pc, quote_resolution_status: q && q.quote_resolution_status, sufficiency_status: finding(r.graph, 'sufficiency').status } };
  }],
  ['T16', 'Unsupported conclusion detected after replay', 'Frozen Engine keep-or-lower and abstention rules', 'REPLAY-DETECT', 'FX-16-unsupported-conclusion', replayDetect('sufficiency', 'O5')],
  ['T17', 'Duplicate request_id rejected before replay', 'Adapter A-DUP', 'REJECT-PRE', 'FX-17-valid-for-duplicate', async (id, f) => {
    const reqId = 'REQ-' + id;
    const { run, transport } = newRun(id, { [reqId]: fx.fixtures[f] });
    const first = await run.processRecord(fixture(), reqId);
    const callsAfterFirst = transport.calls.length;
    const second = await run.processRecord(Object.assign(fixture(), { allow_repeat_for_test: true }), reqId);
    const pass = first.outcome === 'REPLAYED' && second.outcome === 'REJECT-PRE' && second.code === 'duplicate_request_id' && transport.calls.length === callsAfterFirst;
    return { pass, observed: { first: first.outcome, second: second.outcome, code: second.code, transport_calls: transport.calls.length } };
  }],
  ['T18', 'Simulated timeout handled without replay', 'Adapter V1', 'REJECT-PRE-REPLAY', 'FX-18-timeout', rejectPreReplay('V1', 'transport_timeout')],
  ['T19', 'Simulated provider error handled without replay', 'Adapter V2', 'REJECT-PRE-REPLAY', 'FX-19-provider-error', rejectPreReplay('V2', 'provider_error')],
  ['T20', 'Graph and execution-record mismatch stops review', 'Pair check (contract section 8A); SR-LP-15', 'REVIEW-STOP', 'FX-20-valid-for-mismatch', async (id, f) => {
    const { r } = await single(id, f);
    if (r.outcome !== 'REPLAYED') return { pass: false, observed: { outcome: r.outcome } };
    const before = pairCheck(r.recordPath, { setRegister: SET_REGISTER });
    appendFileSync(r.graphPath, ' ');                       // simulated alteration of the stored graph
    const after = pairCheck(r.recordPath, { setRegister: SET_REGISTER });
    return { pass: before.ok && !after.ok && after.code === 'graph_sha256_mismatch', observed: { before, after, review: after.ok ? 'proceeds' : 'stopped' } };
  }],
  ['T21', 'Altered binding digest stops review', 'Pair check (contract section 8A); SR-LP-15', 'REVIEW-STOP', 'FX-21-valid-for-digest', async (id, f) => {
    const { r } = await single(id, f);
    if (r.outcome !== 'REPLAYED') return { pass: false, observed: { outcome: r.outcome } };
    const before = pairCheck(r.recordPath, { setRegister: SET_REGISTER });
    const rec = JSON.parse(readFileSync(r.recordPath, 'utf8'));
    rec.binding_digest = rec.binding_digest.replace(/^./, (c) => (c === '0' ? '1' : '0'));
    writeFileSync(r.recordPath, JSON.stringify(rec, null, 2));   // simulated alteration of the stored digest
    const after = pairCheck(r.recordPath, { setRegister: SET_REGISTER });
    return { pass: before.ok && !after.ok && after.code === 'binding_digest_mismatch', observed: { before, after, review: after.ok ? 'proceeds' : 'stopped' } };
  }],
];

const results = [];
for (const [id, name, control, cls, fxId, fn] of TESTS) {
  const netBefore = attempts.length;
  let entry;
  if (!fx.fixtures[fxId]) entry = { id, name, control, class: cls, fixture_id: fxId, result: 'error', error: 'fixture_missing' };
  else {
    try { const o = await fn(id, fxId); entry = { id, name, control, class: cls, fixture_id: fxId, result: o.pass ? 'pass' : 'fail', observed: o.observed }; }
    catch (e) { entry = { id, name, control, class: cls, fixture_id: fxId, result: 'error', error: String(e && e.message || e).slice(0, 300) }; }
  }
  entry.network_attempts = attempts.length - netBefore;
  entry.network_required = false;
  if (entry.network_attempts) entry.result = 'fail';
  results.push(entry);
}

// Disabled-by-default and no-live-transport self-checks (not among the 21 tests).
let liveRefused = false; try { createLiveTransport(); } catch { liveRefused = true; }
let disabledRefused = false; try { await DISABLED_TRANSPORT.send({}); } catch { disabledRefused = true; }

const iso_result = verifyAndDelete(iso);
const summary = {
  result_format: 'jrs-live-pilot-offline-results/0.1.0',
  run_id: RUN_ID,
  run_at_utc: new Date().toISOString(),
  adapter_version: ADAPTER_VERSION,
  adapter_sha256: adapterSha256(),
  candidate_package_sha256: PACKAGE_SHA256,
  prompt_sha256: PROMPT_SHA256,
  model_identifier: MODEL,
  transport: 'mock only',
  totals: {
    tests: results.length,
    passed: results.filter((r) => r.result === 'pass').length,
    failed: results.filter((r) => r.result === 'fail').length,
    skipped: 0,
    load_or_setup_errors: results.filter((r) => r.result === 'error').length,
  },
  network_attempts_total: attempts.length,
  network_attempts: attempts,
  forbidden_env_names_present_before: envBefore,
  credential_values_read: 0,
  self_checks: { live_transport_refused: liveRefused, disabled_transport_refused: disabledRefused },
  isolation: { candidate_files_verified_against_phase7_manifest: iso.candidateFilesVerified, files_copied: iso.filesCopied, copy_unchanged_after_run: iso_result.unchanged, changed_files: iso_result.changed, copy_deleted: iso_result.deleted },
  artifacts_dir: OUT,
  tests: results,
  statement: 'Offline harness tests on synthetic fixtures with a mocked transport. Not a pilot, not an evaluation, not validation. B-018 OPEN. NO_GO_NOT_VERIFIED.',
};
writeFileSync(RESULTS_PATH, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ totals: summary.totals, network_attempts_total: summary.network_attempts_total, isolation: summary.isolation, self_checks: summary.self_checks }));
for (const r of results) console.log(r.id, r.result, r.result === 'pass' ? '' : JSON.stringify(r.observed || r.error).slice(0, 400));

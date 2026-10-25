// Offline tests for the Anthropic response mapping, end to end through the tested
// adapter boundary (adapter 0.2.0, copied unchanged) and an isolated Engine copy.
// Synthetic captures only; network guard installed first.
import { attempts, installNetGuard } from '../harness-v2-src/net-guard.mjs';
installNetGuard();

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createIsolatedCopy, verifyAndDelete, loadPrompt, PACKAGE_SHA256, PROMPT_SHA256 } from '../harness-v2-src/isolate.mjs';
import { createRun, pairCheck, canonicalBinding, BINDING_FIELDS, ADAPTER_VERSION } from '../harness-v2-src/adapter.mjs';
import { createMockTransport } from '../harness-v2-src/transport.mjs';
import { createAnthropicMapper, createMappedMockTransport, MAPPING_VERSION, mappingSha256, MappingRejection } from './anthropic-mapping.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, '..');
const RESULTS = process.argv[2];
const RUN = 'map-' + new Date().toISOString().replace(/[:.]/g, '-');
const OUT = join(PKG, 'out', RUN);
mkdirSync(OUT, { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');
const MODEL = 'claude-haiku-5-5';

const fx = JSON.parse(readFileSync(join(PKG, 'harness-v2-fixtures', 'mock-responses.json'), 'utf8'));
const validText = fx.fixtures['FX-01-valid'].envelope.content[0].text;
const recordText = readFileSync(join(PKG, 'harness-v2-fixtures', 'HF-001.record.txt'), 'utf8');
const SET = ['HF-001'];
const record = () => ({ synthetic_record_id: 'HF-001', content_origin: 'synthetic_engineering_fixture', record_text: recordText });
const obsSwap = (fn) => { const o = JSON.parse(validText); fn(o); return JSON.stringify(o, null, 2); };

// Synthetic captured responses in the provider's Messages shape. None was produced by a provider.
const msg = (text, over = {}) => ({ id: 'msg_synthetic', type: 'message', role: 'assistant', model: MODEL, content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 }, ...over });
const cap = (n, body) => ({ provider_request_id: 'synthetic-provider-req-' + n, body });

const iso = createIsolatedCopy(join(PKG, '..'));
const engine = {
  compileEvidenceGraph: (await import(join(iso.root, 'lib/engine-evidence-graph-v0.3.1-candidate/compiler.mjs'))).compileEvidenceGraph,
  validateCandidate: (await import(join(iso.root, 'lib/engine-evidence-graph-v0.3.1-candidate/response.mjs'))).validateCandidate,
  parseCandidateResponse: (await import(join(iso.root, 'lib/engine-evidence-contract/strict-json.mjs'))).parseCandidateResponse,
};
const prompt = loadPrompt(iso);
const SUT = { compilerVersion: '0.3.1-candidate', packageSha256: PACKAGE_SHA256, promptSha256: PROMPT_SHA256, promptSystem: prompt.system, promptUser: prompt.user,
  declaredVersions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.1-candidate', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' },
  configuration: { temperature: 0, max_output_tokens: 4096, timeout_ms: 200, note: 'offline mock configuration' } };

// One mapped run per test. The sidecar writes a mapping record outside the graph.
async function mapped(testId, captured, { repeat = false } = {}) {
  const reqId = 'REQ-' + testId;
  const dir = join(OUT, testId);
  const mapper = createAnthropicMapper({ expectedModel: MODEL });
  const sidecar = (request, env) => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, request.request_id + '.mapping-record.json'), JSON.stringify({
      record_format: 'jrs-stage-a-mapping-record/0.1.0', request_id: request.request_id, synthetic_record_id: request.synthetic_record_id,
      provider_request_id: env.provider_request_id, model_identifier: env.model, mapping_version: MAPPING_VERSION, mapping_sha256: mappingSha256(),
      raw_capture_sha256: sha(JSON.stringify(captured)), response_origin: 'mock_transport_fixture', adapter_transport_mode: 'mocked',
      engine_execution_mode: 'recorded_response_replay', adapter_version: ADAPTER_VERSION, note: 'Synthetic capture; no provider produced it.' }, null, 2));
  };
  const transport = createMappedMockTransport({ [reqId]: captured }, mapper, { sidecar });
  const run = createRun({ runId: RUN + '-' + testId, engine, transport, model_identifier: MODEL, systemUnderTest: SUT, outDir: dir, timeoutMs: 200 });
  const r = await run.processRecord(record(), reqId);
  let second = null;
  if (repeat) second = await run.processRecord(Object.assign(record(), { allow_repeat_for_test: true }), reqId);
  return { r, transport, mapper, dir, reqId, second };
}
const mapReject = (code) => async (id, c) => {
  const { r, transport, reqId } = await mapped(id, c);
  const pass = r.outcome === 'REJECT-PRE-REPLAY' && r.replayed === false && transport.mappingErrors[reqId] === code;
  return { pass, observed: { outcome: r.outcome, step: r.step, adapter_code: r.code, mapping_code: transport.mappingErrors[reqId] || null } };
};
const adapterReject = (step, code) => async (id, c) => {
  const { r, transport, reqId } = await mapped(id, c);
  const pass = r.outcome === 'REJECT-PRE-REPLAY' && r.step === step && r.code === code && r.replayed === false && !transport.mappingErrors[reqId];
  return { pass, observed: { outcome: r.outcome, step: r.step, code: r.code } };
};
const directAdapter = (step, code, envelope) => async (id) => {      // control present in the adapter even where the mapper pre-empts it
  const reqId = 'REQ-' + id;
  const run = createRun({ runId: RUN + '-' + id, engine, transport: createMockTransport({ [reqId]: { envelope } }, { model: MODEL }), model_identifier: MODEL, systemUnderTest: SUT, outDir: join(OUT, id), timeoutMs: 200 });
  const r = await run.processRecord(record(), reqId);
  return { pass: r.outcome === 'REJECT-PRE-REPLAY' && r.step === step && r.code === code, observed: { outcome: r.outcome, step: r.step, code: r.code } };
};
async function forgedPair(id, mutate) {
  const { r } = await mapped(id, cap(id, msg(validText)));
  if (r.outcome !== 'REPLAYED') return { pass: false, observed: { outcome: r.outcome } };
  const before = pairCheck(r.recordPath, { setRegister: SET });
  const after = mutate(r);
  return { before, after: pairCheck(r.recordPath, { setRegister: SET }), r, applied: after };
}
const rewriteRecord = (r, fn) => { const rec = JSON.parse(readFileSync(r.recordPath, 'utf8')); fn(rec); rec.binding_digest = sha(canonicalBinding(rec)); writeFileSync(r.recordPath, JSON.stringify(rec, null, 2)); };

const TESTS = [
  ['MT-01', 'Valid single-text response accepted and replayed', 'Mapper, adapter V1 to V9, Engine replay, pair check', cap('01', msg(validText)), async (id, c) => {
    const { r, dir, reqId } = await mapped(id, c);
    if (r.outcome !== 'REPLAYED') return { pass: false, observed: { outcome: r.outcome, code: r.code } };
    const pc = pairCheck(r.recordPath, { setRegister: SET });
    return { pass: pc.ok && r.graph.identity.execution_mode === 'local_mocked' && r.record.model_identifier === MODEL, observed: { pair_check: pc, graph_execution_mode: r.graph.identity.execution_mode, statuses: r.graph.findings.map((f) => f.condition_id + ':' + f.status) } };
  }],
  ['MT-02', 'Valid structured response (single exact JSON fence) accepted', 'Mapper; adapter V7 strict parser', cap('02', msg('```json\n' + validText + '\n```')), async (id, c) => {
    const { r } = await mapped(id, c);
    return { pass: r.outcome === 'REPLAYED' && pairCheck(r.recordPath, { setRegister: SET }).ok, observed: { outcome: r.outcome, code: r.code } };
  }],
  ['MT-03', 'Missing response body rejected', 'Mapper', { provider_request_id: 'synthetic-provider-req-03' }, mapReject('missing_response_body')],
  ['MT-04', 'No text block (empty content array) rejected', 'Mapper', cap('04', msg('', { content: [] })), mapReject('empty_content')],
  ['MT-05', 'Multiple eligible text blocks rejected', 'Mapper', cap('05', msg('', { content: [{ type: 'text', text: validText }, { type: 'text', text: validText }] })), mapReject('multiple_text_blocks')],
  ['MT-06', 'Empty text rejected', 'Mapper', cap('06', msg('   ')), mapReject('empty_content')],
  ['MT-07', 'Non-text content block rejected', 'Mapper', cap('07', msg('', { content: [{ type: 'tool_use', id: 'synthetic', name: 'x', input: {} }] })), mapReject('unsupported_content_block_type')],
  ['MT-08', 'Non-string text content rejected', 'Mapper', cap('08', msg('', { content: [{ type: 'text', text: 42 }] })), mapReject('text_content_missing_or_not_string')],
  ['MT-09', 'Model identifier mismatch rejected', 'Mapper', cap('09', msg(validText, { model: 'some-other-model' })), mapReject('model_identifier_mismatch')],
  ['MT-10', 'Missing provider request identifier rejected', 'Mapper', { body: msg(validText) }, mapReject('provider_request_id_missing')],
  ['MT-11', 'Duplicate provider request identifier rejected within one run', 'Mapper', cap('11', msg(validText)), async (id, c) => {
    const m = createAnthropicMapper({ expectedModel: MODEL });
    m.map(c);
    let code = null; try { m.map(c); } catch (e) { code = e instanceof MappingRejection ? e.code : 'other'; }
    return { pass: code === 'duplicate_provider_request_id', observed: { second_map: code } };
  }],
  ['MT-12', 'Duplicate request_id rejected before provider access and replay', 'Adapter A-DUP', cap('12', msg(validText)), async (id, c) => {
    const { r, second, transport } = await mapped(id, c, { repeat: true });
    return { pass: r.outcome === 'REPLAYED' && second.outcome === 'REJECT-PRE' && second.code === 'duplicate_request_id' && transport.calls.length === 1, observed: { first: r.outcome, second: second.outcome, code: second.code, transport_calls: transport.calls.length } };
  }],
  ['MT-13', 'Malformed top-level structure rejected', 'Mapper', cap('13', { type: 'not_a_message', content: 'x' }), mapReject('malformed_top_level_structure')],
  ['MT-14', 'Malformed structured payload rejected', 'Adapter V7', cap('14', msg('{"contract_version": "x", "observations": [ }')), adapterReject('V7', 'malformed_json')],
  ['MT-15', 'V1 timeout handled without replay', 'Adapter V1', { timeout: true }, async (id, c) => {
    const { r } = await mapped(id, c);
    return { pass: r.outcome === 'REJECT-PRE-REPLAY' && r.step === 'V1' && r.code === 'transport_timeout' && !r.replayed, observed: { step: r.step, code: r.code } };
  }],
  ['MT-16', 'V2 provider error body handled without replay', 'Mapper maps error; adapter V2', cap('16', { type: 'error', error: { type: 'synthetic_overloaded', message: 'synthetic' } }), adapterReject('V2', 'provider_error')],
  ['MT-17', 'V3 length cut-off rejected', 'Adapter V3', cap('17', msg(validText.slice(0, 200), { stop_reason: 'max_tokens' })), adapterReject('V3', 'response_truncated')],
  ['MT-18', 'V4 non-text envelope rejected by adapter (control present beyond mapper)', 'Adapter V4 (direct)', null, directAdapter('V4', 'unexpected_content_type', { status: 'ok', stop_reason: 'end_turn', content: [{ type: 'image' }] })],
  ['MT-19', 'V5 oversized response rejected', 'Adapter V5', cap('19', msg(validText.slice(0, -2) + ',\n "padding_note": "' + 'x'.repeat(70000) + '"\n}')), adapterReject('V5', 'response_too_large')],
  ['MT-20', 'V6 empty body rejected by adapter (control present beyond mapper)', 'Adapter V6 (direct)', null, directAdapter('V6', 'model_refusal', { status: 'ok', stop_reason: 'end_turn', content: [{ type: 'text', text: '  ' }] })],
  ['MT-21', 'V7 prose around JSON rejected', 'Adapter V7', cap('21', msg('Here is the result:\n' + validText)), adapterReject('V7', 'content_outside_json_object')],
  ['MT-22', 'V8 untrusted field rejected', 'Adapter V8', cap('22', msg(obsSwap((o) => { o.observations[0].start_offset = 10; }))), adapterReject('V8', 'candidate_supplied_untrusted_field')],
  ['MT-23', 'V9 supported with null quotation rejected', 'Adapter V9', cap('23', msg(obsSwap((o) => { o.observations[0].quote = null; }))), adapterReject('V9', 'quote_null_requires_not_assessed')],
  ['MT-24', 'V9 gap with null quotation rejected', 'Adapter V9', cap('24', msg(obsSwap((o) => { o.observations[0].quote = null; o.observations[0].proposed_status = 'gap'; }))), adapterReject('V9', 'quote_null_requires_not_assessed')],
  ['MT-25', 'V9 review_required with null quotation rejected', 'Adapter V9', cap('25', msg(obsSwap((o) => { o.observations[0].quote = null; o.observations[0].proposed_status = 'review_required'; }))), adapterReject('V9', 'quote_null_requires_not_assessed')],
  ['MT-26', 'not_assessed with null quotation accepted (control case)', 'Adapter V9, Engine replay', cap('26', msg(obsSwap((o) => { o.observations[4].quote = null; o.observations[4].proposed_status = 'not_assessed'; }))), async (id, c) => {
    const { r } = await mapped(id, c);
    return { pass: r.outcome === 'REPLAYED' && pairCheck(r.recordPath, { setRegister: SET }).ok, observed: { outcome: r.outcome, code: r.code } };
  }],
  ['MT-27', 'Provenance records generated with required labels', 'Adapter execution record; mapping sidecar', cap('27', msg(validText)), async (id, c) => {
    const { r, dir, reqId } = await mapped(id, c);
    const side = JSON.parse(readFileSync(join(dir, reqId + '.mapping-record.json'), 'utf8'));
    const rec = r.record;
    const pass = rec.response_origin === 'mock_transport_fixture' && rec.adapter_transport_mode === 'mocked' && rec.engine_execution_mode === 'recorded_response_replay'
      && rec.request_id === reqId && rec.model_identifier === MODEL && /Z$/.test(rec.captured_at_utc) && rec.synthetic_record_id === 'HF-001' && rec.adapter_version === ADAPTER_VERSION && /^[0-9a-f]{64}$/.test(rec.adapter_sha256)
      && side.provider_request_id === 'synthetic-provider-req-27' && side.model_identifier === MODEL && side.response_origin === 'mock_transport_fixture' && r.graph.identity.execution_mode === 'local_mocked';
    return { pass, observed: { response_origin: rec.response_origin, adapter_transport_mode: rec.adapter_transport_mode, engine_execution_mode: rec.engine_execution_mode, model_identifier: rec.model_identifier, provider_request_id: side.provider_request_id, graph_execution_mode: r.graph.identity.execution_mode } };
  }],
  ['MT-28', 'Nine-field provenance pair verifies, fields in canonical order', 'Pair check (contract section 8A)', cap('28', msg(validText)), async (id, c) => {
    const { r } = await mapped(id, c);
    const lines = canonicalBinding(r.record).toString('utf8').split('\n').filter(Boolean).map((l) => l.split('=')[0]);
    const pc = pairCheck(r.recordPath, { setRegister: SET });
    return { pass: pc.ok && lines.length === 9 && lines.every((f, i) => f === BINDING_FIELDS[i]), observed: { pair_check: pc, fields: lines } };
  }],
  ['MT-29', 'Altered graph hash stops review', 'Pair check', null, async (id) => {
    const f = await forgedPair(id, (r) => { writeFileSync(r.graphPath, readFileSync(r.graphPath, 'utf8') + ' '); });
    return { pass: f.before.ok && f.after.code === 'graph_sha256_mismatch', observed: { before: f.before, after: f.after } };
  }],
  ['MT-30', 'Altered captured-response hash stops review', 'Pair check', null, async (id) => {
    const f = await forgedPair(id, (r) => { writeFileSync(r.responsePath, readFileSync(r.responsePath, 'utf8') + ' '); });
    return { pass: f.before.ok && f.after.code === 'captured_response_sha256_mismatch', observed: { before: f.before, after: f.after } };
  }],
  ['MT-31', 'Model mismatch stops review (consistent forgery)', 'Pair check', null, async (id) => {
    const f = await forgedPair(id, (r) => {
      const env = JSON.parse(readFileSync(r.responsePath, 'utf8')); env.model = 'some-other-model'; const t = JSON.stringify(env); writeFileSync(r.responsePath, t);
      rewriteRecord(r, (rec) => { rec.captured_response_sha256 = sha(t); });
    });
    return { pass: f.before.ok && f.after.code === 'model_identifier_mismatch', observed: { before: f.before, after: f.after } };
  }],
  ['MT-32', 'Request identifier mismatch stops review (consistent forgery)', 'Pair check', null, async (id) => {
    const f = await forgedPair(id, (r) => { rewriteRecord(r, (rec) => { rec.request_id = 'REQ-FORGED'; }); });
    return { pass: f.before.ok && f.after.code === 'request_id_mismatch', observed: { before: f.before, after: f.after } };
  }],
];

const results = [];
for (const [id, name, control, captured, fn] of TESTS) {
  const before = attempts.length;
  let e;
  try { const o = await fn(id, captured); e = { id, name, control, result: o.pass ? 'pass' : 'fail', observed: o.observed }; }
  catch (err) { e = { id, name, control, result: 'error', error: String(err.message).slice(0, 200) }; }
  e.network_attempts = attempts.length - before; if (e.network_attempts) e.result = 'fail';
  results.push(e);
}
// MT-33: whole-run checks.
const isoResult = verifyAndDelete(iso);
results.push({ id: 'MT-33', name: 'No network attempt in the whole run; isolated Engine copy unchanged and deleted', control: 'Network guard; isolation', result: attempts.length === 0 && isoResult.unchanged && isoResult.deleted ? 'pass' : 'fail', observed: { network_attempts_total: attempts.length, isolation: isoResult } });

const summary = {
  result_format: 'jrs-stage-a-mapping-offline-results/0.1.0', run_id: RUN, run_at_utc: new Date().toISOString(), model_identifier_under_test: MODEL,
  mapping_version: MAPPING_VERSION, mapping_sha256: mappingSha256(), adapter_version: ADAPTER_VERSION, adapter_sha256: sha(readFileSync(join(PKG, 'harness-v2-src', 'adapter.mjs'))),
  totals: { tests: results.length, passed: results.filter((r) => r.result === 'pass').length, failed: results.filter((r) => r.result === 'fail').length, skipped: 0, load_or_setup_errors: results.filter((r) => r.result === 'error').length },
  network_attempts_total: attempts.length, credential_values_read: 0,
  statement: 'Offline mapping tests on synthetic captures with no provider involvement. Not a pilot, evaluation or validation. B-018 OPEN. NO_GO_NOT_VERIFIED.',
  tests: results,
};
writeFileSync(RESULTS, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.totals), 'network', attempts.length);
for (const r of results) console.log(r.id, r.result, r.result === 'pass' ? '' : JSON.stringify(r.observed || r.error).slice(0, 300));

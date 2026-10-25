// JRS live-model feasibility adapter: scratch-only, offline harness build.
//
// Implements LIVE_MODEL_ADAPTER_CONTRACT.md revision 2.3. Version 0.2.0 adds the
// adapter_transport_mode label and the live-transport boundary (live-boundary.mjs). It sits outside the
// frozen candidate package and never modifies it. Engine functions are injected
// from an isolated temporary copy of the frozen code (see isolate.mjs).
//
// The adapter rejects only structural, transport, provenance and cross-field
// contract violations (V1 to V9, A-DUP). Quotation, support and conclusion
// controls are left to the unchanged Engine during replay (owner decision
// AC-OD-01); they are never duplicated here.
//
// No credential is read, no endpoint is recorded, and no live transport exists.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { isBoundaryTransport } from './live-boundary.mjs';

export const ADAPTER_VERSION = '0.2.0-offline';
export const MAX_RESPONSE_BYTES = 64 * 1024;
export const MAX_REQUESTS = 10;
export const BINDING_FIELDS = Object.freeze(['graph_sha256', 'captured_response_sha256', 'request_id', 'model_identifier',
  'adapter_version', 'adapter_sha256', 'captured_at_utc', 'replayed_at_utc', 'synthetic_record_id']);
// Provider-routing and credential variable names. Only their presence is checked; values are never read.
export const FORBIDDEN_ENV_NAMES = Object.freeze(['ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'OPENAI_BASE_URL', 'OPENAI_API_KEY']);
const TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const sha256 = (data) => createHash('sha256').update(data).digest('hex');
export const nowUtc = () => new Date().toISOString();
export const adapterSha256 = () => sha256(readFileSync(new URL(import.meta.url)));

export function forbiddenEnvPresent(env = process.env) {
  return FORBIDDEN_ENV_NAMES.filter((name) => Object.prototype.hasOwnProperty.call(env, name));
}

// Provenance labels by transport kind. A mocked or synthetic fixture response can never
// carry live_provider_captured; only a transport of kind live_provider can.
export const PROVENANCE = Object.freeze({
  mock: Object.freeze({ response_origin: 'mock_transport_fixture', adapter_transport_mode: 'mocked' }),
  live_provider: Object.freeze({ response_origin: 'live_provider_captured', adapter_transport_mode: 'live_provider' }),
});

// A pilot run: owns request-id uniqueness (A-DUP) and the request counter.
export function createRun({ runId, engine, transport, model_identifier, systemUnderTest, outDir, timeoutMs = 60000 }) {
  if (!transport || !PROVENANCE[transport.kind]) throw new Error('transport_kind_not_recognised');
  if (transport.kind === 'live_provider' && !isBoundaryTransport(transport)) throw new Error('live_transport_not_created_by_boundary');
  const seenRequestIds = new Set();
  const seenRecordIds = new Set();
  let requests = 0;
  mkdirSync(outDir, { recursive: true });

  function buildRequest(fixture, request_id) {
    if (!fixture || typeof fixture.synthetic_record_id !== 'string' || !fixture.synthetic_record_id) return { reject: 'synthetic_record_id_missing' };
    if (fixture.content_origin !== 'synthetic_engineering_fixture' || !/SYNTHETIC/.test(fixture.record_text || '')) return { reject: 'not_declared_synthetic' };
    const user = systemUnderTest.promptUser.replace('{{RECORD}}', fixture.record_text);
    return { request: { request_id, synthetic_record_id: fixture.synthetic_record_id, model_identifier, system: systemUnderTest.promptSystem, user } };
  }

  // Pre-request checks. A refusal here means the transport is never called.
  function preRequest(fixture, request_id) {
    const env = forbiddenEnvPresent();
    if (env.length) return { reject: 'provider_override_present', detail: env };
    if (!transport.enabled) return { reject: 'transport_disabled' };
    if (requests >= MAX_REQUESTS) return { reject: 'request_limit_reached' };
    if (typeof request_id !== 'string' || !request_id) return { reject: 'request_id_missing' };
    if (seenRequestIds.has(request_id)) return { reject: 'duplicate_request_id' };   // A-DUP
    if (fixture && seenRecordIds.has(fixture.synthetic_record_id) && !fixture.allow_repeat_for_test) return { reject: 'duplicate_synthetic_record_id' };
    const built = buildRequest(fixture, request_id);
    if (built.reject) return built;
    return built;
  }

  // V1 to V9. The first failure classifies the response; nothing is repaired.
  function validate(outcome) {
    if (outcome.transportError) return { ok: false, step: outcome.transportError === 'transport_timeout' ? 'V1' : 'V2', code: outcome.transportError };
    const env = outcome.envelope;
    if (!env || env.status !== 'ok') return { ok: false, step: 'V2', code: 'provider_error' };
    if (env.stop_reason === 'max_tokens') return { ok: false, step: 'V3', code: 'response_truncated' };
    if (!Array.isArray(env.content) || env.content.length !== 1 || env.content[0].type !== 'text' || typeof env.content[0].text !== 'string') return { ok: false, step: 'V4', code: 'unexpected_content_type' };
    const text = env.content[0].text;
    if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) return { ok: false, step: 'V5', code: 'response_too_large' };
    if (text.trim() === '') return { ok: false, step: 'V6', code: 'model_refusal' };
    const parsed = engine.parseCandidateResponse(text);
    if (!parsed.ok) return { ok: false, step: 'V7', code: parsed.reason };
    const v = engine.validateCandidate(text);
    if (!v.ok) return { ok: false, step: 'V8', code: v.reason };
    for (const o of v.value.observations) {
      if (o.quote === null && o.proposed_status !== 'not_assessed') return { ok: false, step: 'V9', code: 'quote_null_requires_not_assessed' };
    }
    return { ok: true, text };
  }

  async function capture(fixture, request_id) {
    const pre = preRequest(fixture, request_id);
    if (pre.reject) return { stage: 'pre_request', rejected: true, code: pre.reject, transport_called: false };
    seenRequestIds.add(request_id);
    seenRecordIds.add(fixture.synthetic_record_id);
    requests += 1;
    const sent_at_utc = nowUtc();
    const outcome = {};
    try { outcome.envelope = await transport.send(pre.request, { timeoutMs }); }
    catch (e) { outcome.transportError = e.code === 'transport_timeout' ? 'transport_timeout' : 'provider_error'; }
    const captured_at_utc = nowUtc();
    const raw = JSON.stringify(outcome.envelope === undefined ? { transport_error: outcome.transportError } : outcome.envelope);
    const responsePath = join(outDir, request_id + '.response.json');
    writeFileSync(responsePath, raw, { flag: 'wx' });          // immutable raw artifact: never overwritten
    const check = validate(outcome);
    return { stage: 'captured', request: pre.request, sent_at_utc, captured_at_utc, responsePath, captured_response_sha256: sha256(raw), validation: check, transport_called: true };
  }

  function replay(fixture, cap) {
    const submission = {
      submission_metadata: { submission_id: fixture.synthetic_record_id },
      scope_declaration: { record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false },
      declared_versions: systemUnderTest.declaredVersions,
      requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'],
      record_text: fixture.record_text,
    };
    const graph = engine.compileEvidenceGraph({ submission, candidateResponseText: cap.validation.text, executionMode: 'local_mocked', clock: cap.captured_at_utc, fixtureId: fixture.synthetic_record_id });
    const replayed_at_utc = nowUtc();
    const graphText = JSON.stringify(graph);
    const graphPath = join(outDir, cap.request.request_id + '.graph.json');
    writeFileSync(graphPath, graphText, { flag: 'wx' });
    return { graph, graphPath, graph_sha256: sha256(graphText), replayed_at_utc };
  }

  function executionRecord(fixture, cap, rep) {
    const rec = {
      record_format: 'jrs-live-pilot-execution-record/0.1.0',
      run_id: runId,
      request_id: cap.request.request_id,
      synthetic_record_id: fixture.synthetic_record_id,
      input_sha256: sha256(fixture.record_text),
      engine_version: systemUnderTest.compilerVersion,
      candidate_package_sha256: systemUnderTest.packageSha256,
      prompt_sha256: systemUnderTest.promptSha256,
      adapter_version: ADAPTER_VERSION,
      adapter_sha256: adapterSha256(),
      model_identifier: cap.request.model_identifier,
      configuration: systemUnderTest.configuration,
      sent_at_utc: cap.sent_at_utc,
      captured_at_utc: cap.captured_at_utc,
      replayed_at_utc: rep.replayed_at_utc,
      captured_response_file: cap.responsePath,
      captured_response_sha256: cap.captured_response_sha256,
      validation: { ok: true },
      graph_file: rep.graphPath,
      graph_sha256: rep.graph_sha256,
      lineage: 'L3',
      // Provenance is truthful to the transport used. Offline tests use a mock, so the
      // live label is reserved for a live transport, which does not exist in this harness.
      response_origin: PROVENANCE[transport.kind].response_origin,
      adapter_transport_mode: PROVENANCE[transport.kind].adapter_transport_mode,
      engine_execution_mode: 'recorded_response_replay',
      graph_execution_mode_label: 'local_mocked',
      authorization_file_sha256: null,
      authorization_note: 'offline harness test; no live-run authorization exists',
    };
    rec.binding_digest = sha256(canonicalBinding(rec));
    const recordPath = join(outDir, cap.request.request_id + '.execution-record.json');
    writeFileSync(recordPath, JSON.stringify(rec, null, 2), { flag: 'wx' });
    return { rec, recordPath };
  }

  async function processRecord(fixture, request_id) {
    const cap = await capture(fixture, request_id);
    if (cap.rejected) return { outcome: 'REJECT-PRE', code: cap.code, transport_called: cap.transport_called };
    if (!cap.validation.ok) return { outcome: 'REJECT-PRE-REPLAY', code: cap.validation.code, step: cap.validation.step, replayed: false, transport_called: true };
    const rep = replay(fixture, cap);
    const er = executionRecord(fixture, cap, rep);
    return { outcome: 'REPLAYED', graph: rep.graph, graphPath: rep.graphPath, recordPath: er.recordPath, record: er.rec, responsePath: cap.responsePath, replayed: true, transport_called: true };
  }

  return { processRecord, get requestCount() { return requests; } };
}

// Canonical nine-field serialization (adapter contract section 8A).
export function canonicalBinding(rec) {
  let out = '';
  for (const f of BINDING_FIELDS) {
    const v = rec[f];
    if (typeof v !== 'string' || v === '' || /[\n\r]/.test(v) || v !== v.trim()) throw new Error('binding_field_invalid:' + f);
    if ((f === 'captured_at_utc' || f === 'replayed_at_utc') && !TS.test(v)) throw new Error('binding_timestamp_invalid:' + f);
    out += f + '=' + v + '\n';
  }
  return Buffer.from(out, 'utf8');
}

// Pair check, run before any review. Any failure: unusable evidence, stop (SR-LP-15).
export function pairCheck(recordPath, { setRegister }) {
  let rec;
  try { rec = JSON.parse(readFileSync(recordPath, 'utf8')); } catch { return { ok: false, code: 'execution_record_missing_or_unreadable' }; }
  let graphText, responseText;
  try { graphText = readFileSync(rec.graph_file); } catch { return { ok: false, code: 'graph_missing' }; }
  try { responseText = readFileSync(rec.captured_response_file); } catch { return { ok: false, code: 'captured_response_missing' }; }
  if (sha256(graphText) !== rec.graph_sha256) return { ok: false, code: 'graph_sha256_mismatch' };
  if (sha256(responseText) !== rec.captured_response_sha256) return { ok: false, code: 'captured_response_sha256_mismatch' };
  if (!setRegister.includes(rec.synthetic_record_id)) return { ok: false, code: 'synthetic_record_id_not_registered' };
  if (rec.adapter_version !== ADAPTER_VERSION || rec.adapter_sha256 !== adapterSha256()) return { ok: false, code: 'adapter_identity_mismatch' };
  let graph; try { graph = JSON.parse(graphText); } catch { return { ok: false, code: 'graph_unparseable' }; }
  let envelope; try { envelope = JSON.parse(responseText); } catch { return { ok: false, code: 'captured_response_unparseable' }; }
  if (envelope.model !== rec.model_identifier) return { ok: false, code: 'model_identifier_mismatch' };
  const stem = (p) => String(p).split('/').pop().split('.')[0];
  if (stem(rec.graph_file) !== rec.request_id || stem(rec.captured_response_file) !== rec.request_id) return { ok: false, code: 'request_id_mismatch' };
  if (!graph.identity || graph.identity.execution_mode !== 'local_mocked') return { ok: false, code: 'graph_mode_label_unexpected' };
  let rebuilt; try { rebuilt = sha256(canonicalBinding(rec)); } catch (e) { return { ok: false, code: e.message }; }
  if (rebuilt !== rec.binding_digest) return { ok: false, code: 'binding_digest_mismatch' };
  return { ok: true };
}

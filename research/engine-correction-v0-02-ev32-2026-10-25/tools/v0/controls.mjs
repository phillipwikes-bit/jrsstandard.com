// Validation-readiness controls for Gate V0 (2026-10-25). Pure functions; no I/O except
// where a function is given a path to read. Each control returns { ok, problems } or a list
// of problems; an empty list means the control passed. The evaluator (evaluate.mjs) calls
// every control for every case; the probes (probes.mjs) exercise each one directly, and the
// mutation runner (run-mutations.mjs) shows that disabling a control is detected.
//
// These controls check mechanical behaviour and evidence custody only. They do not, and
// cannot, establish accuracy, reliability or validity of any finding.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const sha256 = (b) => createHash('sha256').update(b).digest('hex');
export const EXPECTED_MODEL = 'MOCK-MODEL-NOT-A-PROVIDER';
export const REVIEW_ROUTE = 'documentation_quality_reviewer';
export const SEALED_DIRS = ['cases', 'truth', 'expectations'];
const RANK = { not_assessed: 0, review_required: 1, gap: 2, supported: 3 };

export function canonical(v) {
  const s = (x) => Array.isArray(x) ? x.map(s) : (x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => [k, s(x[k])])) : x);
  return JSON.stringify(s(v));
}

// VC-01 seal: the manifest hash matches SEAL.json, every listed file matches, nothing is added.
export function verifySeal(corpusDir) {
  const problems = [];
  const sealPath = join(corpusDir, 'SEAL.json');
  if (!existsSync(sealPath)) return { ok: false, problems: ['seal_missing'] };
  const seal = JSON.parse(readFileSync(sealPath, 'utf8'));
  const manifestPath = join(corpusDir, seal.manifest_file || '');
  if (!seal.manifest_file || !existsSync(manifestPath)) return { ok: false, problems: ['seal_manifest_missing'] };
  const manifest = readFileSync(manifestPath);
  if (sha256(manifest) !== seal.manifest_sha256) problems.push('seal_manifest_hash_mismatch');
  if (!seal.sealed_at_utc || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(seal.sealed_at_utc)) problems.push('seal_timestamp_missing');
  const listed = new Map();
  for (const line of manifest.toString('utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    listed.set(line.slice(66), line.slice(0, 64));
  }
  if (listed.size !== seal.file_count) problems.push('seal_file_count_mismatch');
  for (const [f, h] of listed) {
    const p = join(corpusDir, f);
    if (!existsSync(p)) problems.push('sealed_file_missing:' + f);
    else if (sha256(readFileSync(p)) !== h) problems.push('post_seal_modification:' + f);
  }
  for (const d of SEALED_DIRS) {
    if (!existsSync(join(corpusDir, d))) continue;
    for (const f of readdirSync(join(corpusDir, d))) if (!listed.has(d + '/' + f)) problems.push('unsealed_file_added:' + d + '/' + f);
  }
  return { ok: problems.length === 0, problems, seal };
}

// VC-02 Layer 1 facts present and declared synthetic.
export function checkLayer1(truth, caseId) {
  const p = [];
  if (!truth || typeof truth !== 'object') return ['layer1_missing'];
  if (truth.case_id !== caseId) p.push('layer1_case_id_mismatch');
  if (truth.layer !== 1) p.push('layer1_wrong_layer');
  if (!Array.isArray(truth.facts) || truth.facts.length === 0) p.push('layer1_facts_missing');
  if (truth.real_material !== false || truth.content_origin !== 'synthetic_engineering_fixture') p.push('layer1_not_declared_synthetic');
  return p;
}

// VC-03 expectation identity: the expectation used is the sealed one for this case.
export function checkExpectationIntegrity(expectedText, sealedHash, caseId) {
  const p = [];
  if (typeof expectedText !== 'string') return ['expectation_missing'];
  if (sha256(expectedText) !== sealedHash) p.push('expectation_not_sealed_version');
  let e; try { e = JSON.parse(expectedText); } catch { return [...p, 'expectation_unparseable']; }
  if (e.case_id !== caseId) p.push('expectation_case_id_mismatch');
  return p;
}

// VC-04 provenance pair: independent recomputation of the stored hashes and binding digest.
export function checkPair(rec, graphText, responseText, canonicalBinding) {
  const p = [];
  if (!rec) return ['execution_record_missing'];
  if (typeof graphText !== 'string' && !Buffer.isBuffer(graphText)) return ['graph_missing'];
  if (typeof responseText !== 'string' && !Buffer.isBuffer(responseText)) return ['captured_response_missing'];
  if (sha256(graphText) !== rec.graph_sha256) p.push('graph_sha256_mismatch');
  if (sha256(responseText) !== rec.captured_response_sha256) p.push('captured_response_sha256_mismatch');
  let digest = null; try { digest = sha256(canonicalBinding(rec)); } catch (e) { p.push('binding_fields_invalid'); }
  if (digest !== null && digest !== rec.binding_digest) p.push('binding_digest_mismatch');
  return p;
}

// VC-05 model identity: the record, the request and the captured envelope name the expected model.
export function checkModelIdentity(rec, envelope, expected = EXPECTED_MODEL) {
  const p = [];
  if (!rec || rec.model_identifier !== expected) p.push('execution_record_model_mismatch');
  if (!envelope || envelope.model !== expected) p.push('captured_model_mismatch');
  return p;
}

// VC-06 identity and execution labels.
export function checkIdentity(graph, rec) {
  const p = [];
  const id = graph.identity || {};
  if (id.execution_mode !== 'local_mocked') p.push('graph_execution_mode_unexpected');
  if (id.provider_calls !== 0 || id.network_calls !== 0) p.push('provider_or_network_calls_recorded');
  if (rec && (rec.response_origin !== 'mock_transport_fixture' || rec.adapter_transport_mode !== 'mocked' || rec.engine_execution_mode !== 'recorded_response_replay')) p.push('provenance_labels_unexpected');
  if (graph.release_status !== 'NO_GO_NOT_VERIFIED') p.push('release_status_changed');
  return p;
}

// VC-07 quotation offsets: every span is the exact record text at its offsets.
export function checkOffsets(graph, record) {
  const p = [];
  for (const n of graph.nodes || []) {
    if (n.type === 'record_span') {
      if (record.slice(n.start, n.end) !== n.text) p.push('span_text_mismatch:' + n.id);
      if (Buffer.byteLength(record.slice(0, n.start), 'utf8') !== n.utf8_start) p.push('span_utf8_offset_mismatch:' + n.id);
    }
    if (n.type === 'verified_evidence' && record.slice(n.start, n.end) !== n.quote) p.push('evidence_offset_mismatch:' + n.id);
  }
  return p;
}

// VC-08 evidence-to-assertion linkage.
export function checkLinkage(graph) {
  const p = [];
  const nodes = new Map((graph.nodes || []).map((n) => [n.id, n]));
  const edges = graph.edges || [];
  for (const a of nodes.values()) if (a.type === 'assertion') {
    const src = edges.filter((e) => e.type === 'TEXTUALLY_SUPPORTS' && e.to === a.id).map((e) => nodes.get(e.from));
    if (src.length !== 1 || !src[0] || src[0].type !== 'verified_evidence' || src[0].quote !== a.quoted_text) p.push('assertion_without_matching_evidence:' + a.id);
    if (a.requires_human_interpretation !== true) p.push('assertion_without_human_interpretation:' + a.id);
  }
  for (const ev of nodes.values()) if (ev.type === 'verified_evidence') {
    const q = edges.filter((e) => e.type === 'QUOTES' && e.from === ev.id);
    if (q.length !== 1) p.push('evidence_without_single_span:' + ev.id);
  }
  for (const f of graph.findings || []) if (f.status === 'supported' || f.status === 'gap') {
    const linked = edges.some((e) => e.type === 'RELATES_TO' && e.from === 'find:' + f.condition_id && nodes.get(e.to) && nodes.get(e.to).type === 'assertion');
    if (!linked) p.push('favourable_finding_without_assertion:' + f.condition_id);
  }
  return p;
}

// VC-09 ambiguity: an ambiguous quotation never yields verified evidence or a chosen location.
export function checkAmbiguity(graph) {
  const p = [];
  const ev = new Set((graph.nodes || []).filter((n) => n.type === 'verified_evidence').map((n) => n.observation_id));
  for (const n of graph.nodes || []) if (n.type === 'proposed_quote' && n.quote_resolution_status === 'ambiguous') {
    if (ev.has(n.observation_id)) p.push('ambiguous_quote_selected:' + n.observation_id);
    if ((n.candidate_locations || []).length < 2) p.push('ambiguous_quote_without_locations:' + n.observation_id);
  }
  return p;
}

// VC-10 status monotonicity: the Engine may keep or lower a proposed status, never raise it.
export function checkMonotonic(graph) {
  const p = [];
  for (const f of graph.findings || []) {
    if (f.status === 'supported' && f.proposed_status !== 'supported') p.push('status_raised_to_supported:' + f.condition_id);
    if (f.status === 'gap' && f.proposed_status !== 'gap') p.push('status_changed_to_gap:' + f.condition_id);
    if (f.condition_id === 'sufficiency' && f.status === 'supported') p.push('sufficiency_supported');
    if (RANK[f.proposed_status] !== undefined && RANK[f.status] > RANK[f.proposed_status]) p.push('status_rank_increased:' + f.condition_id);
    if ((f.proposed_status === null || f.proposed_status === undefined) && !['not_assessed', 'review_required'].includes(f.status)) p.push('status_without_proposal:' + f.condition_id);
  }
  return p;
}

// VC-11 human-review routing.
export function checkReviewRoute(graph) {
  const p = [];
  if (!graph.human_review_route || graph.human_review_route.route !== REVIEW_ROUTE) p.push('review_route_missing');
  const routed = new Set((graph.edges || []).filter((e) => e.type === 'ROUTES_TO_REVIEW' && e.to === 'review').map((e) => e.from));
  for (const f of graph.findings || []) if (!routed.has('find:' + f.condition_id)) p.push('finding_not_routed:' + f.condition_id);
  for (const c of graph.conflicts || []) if (!routed.has(c.id)) p.push('conflict_not_routed:' + c.id);
  for (const r of graph.refusals || []) if (!routed.has(r.id)) p.push('refusal_not_routed:' + r.id);
  return p;
}

// VC-12 chronology: every TEMPORALLY_CONFLICTS edge or chronology conflict lowers chronology.
export function checkChronology(graph) {
  const p = [];
  const ch = (graph.findings || []).find((f) => f.condition_id === 'chronology_integrity');
  const chronoConflict = (graph.conflicts || []).some((c) => (c.affects || []).includes('chronology_integrity'));
  if (chronoConflict && ch && (ch.status === 'supported' || ch.status === 'gap')) p.push('chronology_conflict_not_lowered');
  return p;
}

// VC-13 graph validity via the frozen validator (injected).
export function checkGraphValid(graph, record, validateGraph) {
  const problems = validateGraph(graph, record);
  return problems.map((x) => 'graph_invalid:' + x);
}

// VC-14 compare observed behaviour with the sealed owner-authored expectation.
export function compareExpected(observed, expected) {
  const m = [];
  if (!expected) return ['expectation_absent'];
  if (observed.intake_decision !== expected.intake_decision) m.push('intake:' + observed.intake_decision + '!=' + expected.intake_decision);
  for (const [c, s] of Object.entries(expected.statuses)) if (observed.statuses[c] !== s) m.push('status:' + c + ':' + observed.statuses[c] + '!=' + s);
  if (canonical(observed.conflict_kinds) !== canonical(expected.conflict_kinds)) m.push('conflicts:' + observed.conflict_kinds.join(',') + '!=' + expected.conflict_kinds.join(','));
  if (canonical(observed.refusal_codes) !== canonical(expected.refusal_codes)) m.push('refusals:' + observed.refusal_codes.join(',') + '!=' + expected.refusal_codes.join(','));
  for (const [o, s] of Object.entries(expected.quote_statuses)) if (observed.quote_statuses[o] !== s) m.push('quote:' + o + ':' + observed.quote_statuses[o] + '!=' + s);
  for (const o of Object.keys(observed.quote_statuses)) if (!(o in expected.quote_statuses)) m.push('quote_unexpected:' + o);
  if (observed.instruction_risk !== expected.instruction_risk) m.push('instruction_risk:' + observed.instruction_risk + '!=' + expected.instruction_risk);
  for (const o of expected.required_span_origins) if (!observed.span_origins.includes(o)) m.push('span_origin_missing:' + o);
  return m;
}

export function compareAdapter(observed, expected) {
  if (observed.outcome !== expected.outcome) return ['adapter_outcome:' + observed.outcome + '!=' + expected.outcome];
  if (expected.outcome === 'REJECT-PRE-REPLAY' && (observed.step !== expected.step || observed.code !== expected.code)) return ['adapter_rejection:' + observed.step + '/' + observed.code + '!=' + expected.step + '/' + expected.code];
  return [];
}

// VC-15 error accounting: an execution error is reported as ERROR, never as a normal result.
export async function runGuarded(fn) {
  try { return await fn(); }
  catch (e) { return { outcome: 'ERROR', error: String(e && e.message ? e.message : e).slice(0, 300) }; }
}
export function checkNoConcealedError(result) {
  const p = [];
  if (result.outcome === 'ERROR' && result.counted_as !== 'failure') p.push('execution_error_not_counted_as_failure');
  if (result.outcome !== 'ERROR' && result.error) p.push('error_present_on_normal_result');
  return p;
}

// VC-16 network and provider configuration markers.
export const FORBIDDEN_ENV = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'OPENAI_BASE_URL', 'OPENAI_API_KEY'];
const NET_KEY = /(?:base_?url|endpoint|api_?key|auth_?token|proxy|host)/i;
const NET_VALUE = /\b(?:https?|wss?):\/\//i;
export function checkNetworkMarkers(env, config) {
  const p = [];
  for (const k of FORBIDDEN_ENV) if (Object.prototype.hasOwnProperty.call(env || {}, k)) p.push('forbidden_env_present:' + k);
  const walk = (v, path) => {
    if (v && typeof v === 'object') for (const k of Object.keys(v)) { if (NET_KEY.test(k)) p.push('network_config_key:' + path + k); walk(v[k], path + k + '.'); }
    else if (typeof v === 'string' && NET_VALUE.test(v)) p.push('network_config_value:' + path);
  };
  walk(config, '');
  return p;
}
export function checkNetworkAttempts(attempts) { return attempts.length ? ['network_attempts:' + attempts.length] : []; }

// VC-17 forbidden validation or release language in produced text (negated mentions allowed).
const FORBIDDEN_TERMS = /\b(?:independently validated|validated|production[- ]ready|release[- ]ready|reliable|reliability (?:is )?(?:established|demonstrated|proven)|ready for release|ready for production|certified)\b/gi;
const NEG = /\b(?:not|no|never|cannot|nor|without|neither|does not|do not|is not|are not|must not|never be)\b/i;
export function scanForbiddenLanguage(text) {
  const p = [];
  const s = String(text);
  let m; FORBIDDEN_TERMS.lastIndex = 0;
  while ((m = FORBIDDEN_TERMS.exec(s)) !== null) {
    let pre = s.slice(Math.max(0, s.lastIndexOf('\n', m.index) + 1), m.index);
    const cut = Math.max(pre.lastIndexOf('. '), pre.lastIndexOf('; '), pre.lastIndexOf('| '));
    if (cut !== -1) pre = pre.slice(cut + 1);
    if (!NEG.test(pre.trim().split(/\s+/).slice(-10).join(' ')) && !/["`“]$/.test(pre)) p.push('forbidden_language:' + m[0]);
  }
  return p;
}

// Observed behaviour summary used for expectation comparison and determinism.
export function observe(graph) {
  return {
    intake_decision: graph.intake.decision,
    statuses: Object.fromEntries(graph.findings.map((f) => [f.condition_id, f.status])),
    conflict_kinds: graph.conflicts.map((c) => c.kind).sort(),
    refusal_codes: [...new Set(graph.refusals.map((r) => r.code))].sort(),
    quote_statuses: Object.fromEntries(graph.nodes.filter((n) => n.type === 'proposed_quote').map((n) => [n.observation_id, n.quote_resolution_status])),
    instruction_risk: graph.record_instruction_risk,
    span_origins: [...new Set(graph.nodes.filter((n) => n.type === 'record_span').flatMap((n) => n.origins || []))].sort(),
  };
}
// Deterministic digest of a graph: run id, run timestamp and the Engine's own graph_sha256
// (which is computed over the run_identity node and so carries the timestamp) removed.
export function graphDigest(graph) {
  return sha256(canonical(Object.assign({}, graph, { identity: Object.assign({}, graph.identity, { run_id: null, run_timestamp: null, graph_sha256: null }),
    nodes: graph.nodes.map((n) => (n.type === 'run_identity' ? Object.assign({}, n, { run_id: null, run_timestamp: null }) : n)) })));
}

// JRS controlled independent-evaluation readiness: run-binding classifier. INTERNAL, PLANNING ONLY.
//
// classifyRun() returns exactly one of three states, none of which is an evaluation result:
//   PLANNING_ONLY                a planning artifact, or any binding field still unfilled
//   BINDING_COMPLETE_UNVERIFIED  every field filled; the attestations it cites are not verified by
//                                code and cannot be, so the run is still not evidence of anything
//   REFUSED                      a contradiction: a prohibited state, an out-of-scope record, a
//                                provider adapter, record text, a synthetic item labelled independent,
//                                or a gate snapshot that differs from the release-gate record
// There is no fourth state. A planning manifest can never classify as a completed evaluation.
import { CONDITION_IDS, PROHIBITED_STATES, ALLOWED_RECORD_CATEGORIES, RECORD_TEXT_FIELDS, GATE_IDS } from './vocabulary.js';

// Every field a future run must bind. Removing one weakens the binding, and the verifier fails.
export const REQUIRED_BINDING_FIELDS = Object.freeze(['engine.version', 'engine.commit', 'prompt.version', 'prompt.sha256', 'configuration_id', 'adapter.identity', 'adapter.kind',
  'codebook.source_id', 'codebook.revision', 'codebook.sha256', 'codebook.freeze_record_ref', 'scope.record_category', 'scope.record_type', 'scope.completion_status', 'scope.hr_related',
  'rights.authorization_status', 'rights.authority_attestation_ref', 'input.digest_algorithm', 'input.input_digest', 'input.external_reference', 'input.custody_ref',
  'reviewer.token', 'reviewer.role', 'reviewer.role_version', 'reviewer.independence_status', 'reviewer.conflict_status', 'reviewer.independence_attestation_ref',
  'extraction_version', 'interpretation_version', 'adjudication_protocol_version', 'output.output_identity', 'output.evidence_digest', 'evidence_class', 'gate_status_at_run']);
export const PROVIDER_ADAPTER_KINDS = Object.freeze(['live_provider', 'provider', 'remote_model', 'hosted_model']);
export const EVIDENCE_CLASSES = Object.freeze(['INDEPENDENT_EVALUATION_EVIDENCE', 'SYNTHETIC_FIXTURE', 'DEVELOPMENT_MATERIAL', 'PLANNING_ARTIFACT']);

const get = (o, path) => path.split('.').reduce((v, k) => (v === null || v === undefined ? undefined : v[k]), o);
const filled = (v) => v !== null && v !== undefined && !(typeof v === 'string' && !v.trim());
function deepKeys(v, out = []) {
  if (Array.isArray(v)) v.forEach((x) => deepKeys(x, out));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) { out.push([k, v[k]]); deepKeys(v[k], out); }
  return out;
}

export function classifyRun(binding, ctx = {}) {
  const codes = [];
  const refuse = (code, control, detail) => codes.push({ code, control, detail: detail || null });
  if (!binding || typeof binding !== 'object') return { state: 'REFUSED', codes: [{ code: 'not_a_binding', control: 'REG-01' }] };
  for (const [k, v] of deepKeys(binding)) {
    if (RECORD_TEXT_FIELDS.includes(k)) refuse('record_text_in_binding', 'REG-02', k);
    if (typeof v === 'string' && PROHIBITED_STATES.includes(v)) refuse('prohibited_state', 'REG-03', k + '=' + v);
  }
  const cat = get(binding, 'scope.record_category');
  if (filled(cat) && !ALLOWED_RECORD_CATEGORIES.includes(cat)) refuse('out_of_scope_record_category', 'REG-04', cat);
  if (get(binding, 'scope.hr_related') === true) refuse('hr_related_record', 'REG-04');
  if (filled(get(binding, 'scope.completion_status')) && get(binding, 'scope.completion_status') !== 'completed') refuse('record_not_completed', 'REG-04');
  if (PROVIDER_ADAPTER_KINDS.includes(get(binding, 'adapter.kind'))) refuse('provider_adapter_not_authorized', 'REG-05');
  const ec = binding.evidence_class;
  if (filled(ec) && !EVIDENCE_CLASSES.includes(ec)) refuse('unknown_evidence_class', 'REG-06', ec);
  const syntheticMark = binding.synthetic === true || /^SYNTHETIC-/.test(String(get(binding, 'input.external_reference') || '')) || /^SYNTHETIC-/.test(String(get(binding, 'reviewer.token') || ''));
  if (syntheticMark && ec === 'INDEPENDENT_EVALUATION_EVIDENCE') refuse('synthetic_labelled_independent', 'REG-06');
  if (ec === 'INDEPENDENT_EVALUATION_EVIDENCE' && binding.kind === 'planning') refuse('planning_artifact_labelled_evidence', 'REG-06');
  const g = binding.gate_status_at_run;
  if (filled(g)) {
    if (typeof g !== 'object' || GATE_IDS.some((id) => !(id in g))) refuse('gate_snapshot_malformed', 'REG-07');
    else if (ctx.currentGates && GATE_IDS.some((id) => g[id] !== ctx.currentGates[id])) refuse('gate_snapshot_differs_from_record', 'REG-07');
  }
  if (Array.isArray(binding.conditions_assessed) && binding.conditions_assessed.some((c) => !CONDITION_IDS.includes(c))) refuse('unmapped_condition', 'REG-08');
  if (codes.length) return { state: 'REFUSED', codes };
  const missing = REQUIRED_BINDING_FIELDS.filter((f) => !filled(get(binding, f)));
  if (binding.kind === 'planning' || missing.length) return { state: 'PLANNING_ONLY', codes: [], missing };
  return { state: 'BINDING_COMPLETE_UNVERIFIED', codes: [], missing: [],
           note: 'Every field is filled. The attestations and references it cites are not verified by code, so this is not evidence of an evaluation.' };
}

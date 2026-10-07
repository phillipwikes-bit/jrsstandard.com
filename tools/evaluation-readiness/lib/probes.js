// JRS controlled independent-evaluation readiness: SYNTHETIC control probes. INTERNAL.
//
// Zero-data declarations and items used to exercise every control. They carry SYNTHETIC- tokens
// and no record content. They are not records, not reviewers, not labels and not evidence; a probe
// that passes a control shows only that the control behaves as written.
import { DEVELOPMENT_MATERIAL, materialHash } from '../../../lib/engine-candidate/dev-material.js';
import { DIGEST_ALGORITHM } from './intake.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const devDigest = (prefix) => DEVELOPMENT_MATERIAL.find(([, n]) => n.startsWith(prefix))[0];

export const NO_MATCH_DIGEST = materialHash('SYNTHETIC-PROBE: this string is not a record and matches no development text.');
export const BASE_INTAKE = Object.freeze({
  record_ref: 'SYNTHETIC-INTAKE-PROBE-001', synthetic: true, evidence_class: 'SYNTHETIC_FIXTURE',
  record_category: 'supplier_access_exception', hr_related: false, decision_domains: ['supplier_access'],
  completion_attestation: { status: 'completed', attested_by_role: 'record_custodian', attestation_ref: 'SYNTHETIC-ATTESTATION-COMPLETION' },
  completeness: { complete: true, pages_total: 1, pages_present: 1 },
  rights: { authority_attestation_ref: 'SYNTHETIC-ATTESTATION-AUTHORITY', rights_attestation_ref: 'SYNTHETIC-ATTESTATION-RIGHTS' },
  source_reference: 'SYNTHETIC-SOURCE-REF', chain_of_custody_ref: 'SYNTHETIC-CUSTODY-REF',
  version_binding: { engine: { version: '0.5.0-local.1', commit: 'SYNTHETIC-COMMIT' }, prompt: { version: 'candidate-prompt/0.4.0', sha256: 'SYNTHETIC-PROMPT-HASH' },
    extraction_version: 'SYNTHETIC-EXTRACTION-0', interpretation_version: 'SYNTHETIC-INTERPRETATION-0', adjudication_protocol_version: 'SYNTHETIC-ADJUDICATION-0' },
  codebook: { source_id: 'SRC-CODEBOOK', revision: '1.0', sha256: 'f70d1cf403f1c5adae5e02629e4b9e0862331cad257b999accd2bc632994afbb' },
  reviewer_role_declaration: { role: 'independent_reviewer', role_version: 'SYNTHETIC-ROLE-0', independence_declared: true, independence_attestation_ref: 'SYNTHETIC-ATTESTATION-INDEPENDENCE' },
  input: { digest_algorithm: DIGEST_ALGORITHM, input_digest: NO_MATCH_DIGEST, external_reference: 'SYNTHETIC-EXTERNAL-REF' },
  requested_actions: [],
});
const vary = (fn) => { const x = clone(BASE_INTAKE); fn(x); return x; };

// [probe id, what it breaks, declaration, the refusal code it must produce, the owning control]
export const INTAKE_PROBES = Object.freeze([
  ['IP-01', 'out-of-scope record category (employment)', vary((x) => { x.record_category = 'employment'; }), 'out_of_scope_record_category', 'INT-04'],
  ['IP-02', 'out-of-scope record category (lending)', vary((x) => { x.record_category = 'lending'; }), 'out_of_scope_record_category', 'INT-04'],
  ['IP-03', 'HR status not declared false', vary((x) => { x.hr_related = true; }), 'hr_status_not_declared_false', 'INT-04'],
  ['IP-04', 'incomplete record', vary((x) => { x.completeness = { complete: false, pages_total: 2, pages_present: 1 }; }), 'incomplete_record', 'INT-05'],
  ['IP-05', 'missing completion-status attestation', vary((x) => { delete x.completion_attestation; }), 'completion_status_attestation_missing', 'INT-05'],
  ['IP-06', 'missing authority or rights attestation', vary((x) => { x.rights.rights_attestation_ref = null; }), 'authority_or_rights_attestation_missing', 'INT-06'],
  ['IP-07', 'missing source or chain-of-custody reference', vary((x) => { delete x.chain_of_custody_ref; }), 'source_or_custody_reference_missing', 'INT-06'],
  ['IP-08', 'missing version binding', vary((x) => { delete x.version_binding; }), 'version_binding_missing', 'INT-07'],
  ['IP-09', 'missing codebook revision', vary((x) => { x.codebook.revision = null; }), 'codebook_revision_missing', 'INT-07'],
  ['IP-10', 'missing independent-reviewer role declaration', vary((x) => { x.reviewer_role_declaration.role = 'author'; }), 'independent_reviewer_role_missing', 'INT-08'],
  ['IP-11', 'raw record text in the declaration', vary((x) => { x.record_text = 'SYNTHETIC-PROBE: a field that would carry a record.'; }), 'raw_record_text', 'INT-02'],
  ['IP-12', 'exact match to registered development material', vary((x) => { x.input.input_digest = devDigest('regression/'); }), 'development_material', 'INT-09'],
  ['IP-13', 'match to frozen-demo material', vary((x) => { x.input.input_digest = devDigest('frozen-demo/'); }), 'frozen_demo_material', 'INT-09'],
  ['IP-14', 'synthetic item labelled independent evidence', vary((x) => { x.evidence_class = 'INDEPENDENT_EVALUATION_EVIDENCE'; }), 'synthetic_labelled_independent', 'INT-10'],
  ['IP-15', 'attempt to initiate model review', vary((x) => { x.requested_actions = ['model_review']; }), 'model_review_or_transmission', 'INT-11'],
  ['IP-16', 'attempt at external transmission', vary((x) => { x.requested_actions = ['external_transmission']; }), 'model_review_or_transmission', 'INT-11'],
  ['IP-17', 'attempt to compute a DRR score before freeze', vary((x) => { x.requested_actions = ['drr_score']; }), 'score_before_freeze', 'INT-11'],
  ['IP-18', 'a prohibited state claimed', vary((x) => { x.status = 'VALI' + 'DATED'; }), 'prohibited_state', 'INT-03'],
  ['IP-19', 'input digest missing', vary((x) => { x.input.input_digest = ''; }), 'input_digest_missing', 'INT-09'],
]);

// Registry probes: [id, binding change, expected state, expected refusal code or null]
export const REGISTRY_PROBES = Object.freeze([
  ['RP-01', 'the blank template is planning-only', null, 'PLANNING_ONLY', null],
  ['RP-02', 'a planning manifest with every field filled is still planning-only', 'planning_full', 'PLANNING_ONLY', null],
  ['RP-03', 'a prohibited state is refused', 'prohibited', 'REFUSED', 'prohibited_state'],
  ['RP-04', 'a provider adapter is refused', 'provider', 'REFUSED', 'provider_adapter_not_authorized'],
  ['RP-05', 'a synthetic item labelled independent is refused', 'synthetic_independent', 'REFUSED', 'synthetic_labelled_independent'],
  ['RP-06', 'an out-of-scope record is refused', 'out_of_scope', 'REFUSED', 'out_of_scope_record_category'],
  ['RP-07', 'a gate snapshot that differs from the record is refused', 'gate_moved', 'REFUSED', 'gate_snapshot_differs_from_record'],
  ['RP-08', 'record text in a binding is refused', 'text', 'REFUSED', 'record_text_in_binding'],
  ['RP-09', 'an unmapped condition is refused', 'unmapped', 'REFUSED', 'unmapped_condition'],
]);
export function fullBinding(template, gates) {
  const b = clone(template);
  const fill = (o) => { for (const k of Object.keys(o)) { if (o[k] && typeof o[k] === 'object') fill(o[k]); else if (o[k] === null) o[k] = 'SYNTHETIC-' + k.toUpperCase(); } };
  fill(b);
  b.scope = { record_category: 'supplier_access_exception', record_type: 'supplier_access_exception', completion_status: 'completed', hr_related: false };
  b.adapter.kind = 'deterministic_mock'; b.evidence_class = 'SYNTHETIC_FIXTURE'; b.gate_status_at_run = clone(gates);
  return b;
}
export function registryProbeBinding(variant, template, gates) {
  if (variant === null) return clone(template);
  const b = fullBinding(template, gates);
  if (variant === 'planning_full') b.kind = 'planning';
  if (variant === 'prohibited') b.status = 'RELEASE' + '_READY';
  if (variant === 'provider') b.adapter.kind = 'live_provider';
  if (variant === 'synthetic_independent') { b.synthetic = true; b.evidence_class = 'INDEPENDENT_EVALUATION_EVIDENCE'; }
  if (variant === 'out_of_scope') b.scope.record_category = 'insurance';
  if (variant === 'gate_moved') b.gate_status_at_run['RG-1'] = 'NOT_ASSESSED';
  if (variant === 'text') b.input.text = 'SYNTHETIC-PROBE';
  if (variant === 'unmapped') b.conditions_assessed = ['RC1', 'cold_reviewer_clarity'];
  return b;
}

// Workspace probe items. Tokens are SYNTHETIC-; location references point at nothing real.
const LOC = [{ source_ref: 'SYNTHETIC-SOURCE-REF', locator: 'paragraph 2' }];
export const interp = (id, reviewer, condition, determination, extra = {}) => ({ kind: 'HUMAN_INTERPRETATION', item_id: id, author: { kind: 'human', role: 'independent_reviewer', token: reviewer },
  condition_id: condition, determination, uncertainty: 'not_stated', blind_to_candidate_output: true, interpretation_version: 'SYNTHETIC-INTERPRETATION-0',
  location_refs: ['AFFIRMATIVE_DEFECT', 'NO_DEFECT_OBSERVED'].includes(determination) ? LOC : [],
  ...(determination === 'INFORMATION_MISSING' ? { missing_element: 'no stated end of the access period' } : {}),
  ...(determination === 'INSUFFICIENT_BASIS_TO_ASSESS' ? { reason: 'the cited attachment is not part of the record' } : {}), ...extra });
export const candidate = (id, key, extra = {}) => ({ kind: 'CANDIDATE_ENGINE_OUTPUT', item_id: id, author: { kind: 'engine', role: 'candidate', token: 'SYNTHETIC-ENGINE-0' }, candidate_key: key, location_refs: [], ...extra });
export const fact = (id, extra = {}) => ({ kind: 'RECORD_SUPPORTED_FACT', item_id: id, author: { kind: 'human', role: 'independent_reviewer', token: 'SYNTHETIC-REVIEWER-A' }, location_refs: LOC, note: 'access end date stated', ...extra });
export const SYNTHETIC_FREEZES = Object.freeze({ codebook: { frozen: true, freeze_record_ref: 'SYNTHETIC-FREEZE-CODEBOOK' }, interpretation: { frozen: true, freeze_record_ref: 'SYNTHETIC-FREEZE-INTERPRETATION' },
  calibration: { frozen: true, freeze_record_ref: 'SYNTHETIC-FREEZE-CALIBRATION' }, adjudication_protocol: { frozen: true, freeze_record_ref: 'SYNTHETIC-FREEZE-ADJUDICATION' } });

// Ledger probe entries.
export const ledgerEntry = (over = {}) => ({ created_by: { kind: 'code', identity: 'SYNTHETIC-PROBE' }, artifact_type: 'binding_record', version_identity: 'SYNTHETIC-VERSION', digest: null,
  timestamp: '2026-10-07T00:00:00Z', preconditions: [], evidence_status: 'MISSING', required_human_role: null,
  limitation: 'SYNTHETIC probe entry. It records nothing real and is never evidence.', release_gate_relation: { gates: [], effect: 'none' }, ...over });

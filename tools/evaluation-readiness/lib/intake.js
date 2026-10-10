// JRS controlled independent-evaluation readiness: offline intake validator. INTERNAL. FAILS CLOSED.
//
// validateIntake() examines an intake DECLARATION: metadata about a record held outside this
// repository, identified by digest and external reference. It never receives, reads or stores the
// record itself. It returns one of two decisions:
//   REFUSED                    with every reason, each naming the control (INT-nn) that owns it
//   WELL_FORMED_NOT_ADMITTED   every check passed, and the record is STILL not admitted, because
//                              intake is closed until an owner opening record exists (INT-00)
// There is no ADMITTED decision while INTAKE_OPEN is false, and nothing in this package sets it.
//
// Digest matching is a contamination control: it refuses a record whose digest equals a registered
// development or frozen-demonstration text. A digest that matches nothing does NOT show that a record
// is independent; independence rests on human attestation and provenance, not on a hash.
import { DEVELOPMENT_MATERIAL } from '../../../lib/engine-candidate/dev-material.js';
import { ALLOWED_RECORD_CATEGORIES, REFUSED_DOMAINS, RECORD_TEXT_FIELDS, MAX_FREE_TEXT, PROHIBITED_STATES, loadRegistry } from './vocabulary.js';
import { REQUIRED_BINDING_FIELDS } from './registry.js';

export const INTAKE_VALIDATOR_VERSION = 'jrs-evaluation-intake-validator/0.1.0';
// Intake is closed. Opening it is an owner act, recorded outside code; flipping this constant is not one.
export const INTAKE_OPEN = false;
export const DIGEST_ALGORITHM = 'jrs-material-sha256/1';   // sha256 of the whitespace-normalised text, as dev-material.js computes it
export const PROHIBITED_ACTIONS = Object.freeze(['model_review', 'provider_call', 'external_transmission', 'upload', 'publish', 'drr_score', 'agreement_statistic', 'classification']);
const HEX64 = /^[0-9a-f]{64}$/;

const DEV = new Map(DEVELOPMENT_MATERIAL.map(([h, name]) => [h, name]));
export function developmentMatch(digest) {
  const name = DEV.get(digest);
  if (!name) return null;
  return { name, frozen_demo: name.startsWith('frozen-demo/') };
}

const filled = (v) => v !== null && v !== undefined && !(typeof v === 'string' && !v.trim());
const get = (o, path) => path.split('.').reduce((v, k) => (v === null || v === undefined ? undefined : v[k]), o);
function walk(v, fn, path = '$') {
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, fn, path + '[' + i + ']'));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) { fn(k, v[k], path + '.' + k); walk(v[k], fn, path + '.' + k); }
}

export function validateIntake(intake, opts = {}) {
  const codes = [];
  const refuse = (code, control, message) => codes.push({ code, control, message });
  const registry = opts.registry || loadRegistry();
  if (!intake || typeof intake !== 'object' || Array.isArray(intake)) return { decision: 'REFUSED', validator: INTAKE_VALIDATOR_VERSION, codes: [{ code: 'not_an_intake_declaration', control: 'INT-01', message: 'An intake must be a JSON object declaring a record held elsewhere.' }] };

  // INT-02 record text: the declaration must never carry the record.
  walk(intake, (k, v, p) => {
    if (RECORD_TEXT_FIELDS.includes(k)) refuse('raw_record_text', 'INT-02', p + ' would carry record content; declare a digest and an external reference instead.');
    else if (typeof v === 'string' && v.length > MAX_FREE_TEXT) refuse('raw_record_text', 'INT-02', p + ' is longer than ' + MAX_FREE_TEXT + ' characters; record content is never accepted.');
    if (typeof v === 'string' && PROHIBITED_STATES.includes(v)) refuse('prohibited_state', 'INT-03', p + ' claims ' + v + ', which no intake can carry.');
  });

  // INT-04 scope: completed, non-HR supplier-access exception records only.
  const cat = intake.record_category;
  if (!filled(cat)) refuse('record_category_missing', 'INT-04', 'Declare the record category.');
  else if (REFUSED_DOMAINS.includes(cat)) refuse('out_of_scope_record_category', 'INT-04', cat + ' is an excluded decision domain.');
  else if (!ALLOWED_RECORD_CATEGORIES.includes(cat)) refuse('out_of_scope_record_category', 'INT-04', cat + ' is not an in-scope record category.');
  if (intake.hr_related !== false) refuse('hr_status_not_declared_false', 'INT-04', 'The record must be declared non-HR (hr_related: false).');
  if (Array.isArray(intake.decision_domains) && intake.decision_domains.some((d) => REFUSED_DOMAINS.includes(d))) refuse('out_of_scope_record_category', 'INT-04', 'A declared decision domain is excluded.');

  // INT-05 completeness and its attestation.
  const comp = intake.completion_attestation || {};
  if (comp.status !== 'completed' || !filled(comp.attested_by_role) || !filled(comp.attestation_ref)) refuse('completion_status_attestation_missing', 'INT-05', 'A record custodian must attest that the record is completed, by reference.');
  const c = intake.completeness || {};
  if (c.complete !== true || (Number.isInteger(c.pages_total) && Number.isInteger(c.pages_present) && c.pages_present < c.pages_total)) refuse('incomplete_record', 'INT-05', 'A partial or incomplete record is never admitted.');

  // INT-06 authority, rights and custody.
  if (!filled(get(intake, 'rights.authority_attestation_ref')) || !filled(get(intake, 'rights.rights_attestation_ref'))) refuse('authority_or_rights_attestation_missing', 'INT-06', 'Authority and rights attestations are required, by reference.');
  if (!filled(intake.source_reference) || !filled(intake.chain_of_custody_ref)) refuse('source_or_custody_reference_missing', 'INT-06', 'A source reference and a chain-of-custody reference are required.');

  // INT-07 version binding and codebook revision.
  const vb = intake.version_binding;
  if (!vb || typeof vb !== 'object') refuse('version_binding_missing', 'INT-07', 'Bind the intake to the Engine, prompt, codebook and protocol versions.');
  else for (const f of ['engine.version', 'engine.commit', 'prompt.version', 'prompt.sha256', 'extraction_version', 'interpretation_version', 'adjudication_protocol_version'])
    if (!filled(get(vb, f))) refuse('version_binding_missing', 'INT-07', 'version_binding.' + f + ' is required.');
  if (!REQUIRED_BINDING_FIELDS.includes('codebook.revision') || !filled(get(intake, 'codebook.revision')) || !filled(get(intake, 'codebook.sha256'))) refuse('codebook_revision_missing', 'INT-07', 'Name the frozen codebook revision and its hash.');

  // INT-08 reviewer role.
  const r = intake.reviewer_role_declaration || {};
  if (r.role !== 'independent_reviewer' || !filled(r.role_version) || r.independence_declared !== true || !filled(r.independence_attestation_ref)) refuse('independent_reviewer_role_missing', 'INT-08', 'Declare the independent-reviewer role, its version and the reviewer\'s own independence attestation.');

  // INT-09 contamination: exact digest match to development or frozen-demonstration material.
  const d = intake.input || {};
  if (d.digest_algorithm !== DIGEST_ALGORITHM || !HEX64.test(d.input_digest || '')) refuse('input_digest_missing', 'INT-09', 'Declare input_digest as ' + DIGEST_ALGORITHM + ' (64 hex characters).');
  else {
    const m = developmentMatch(d.input_digest);
    if (m && m.frozen_demo) refuse('frozen_demo_material', 'INT-09', 'The digest matches frozen demonstration record ' + m.name + '; it can never be evaluation material.');
    else if (m) refuse('development_material', 'INT-09', 'The digest matches registered development material ' + m.name + '; it can never be holdout or evaluation material.');
  }

  // INT-10 evidence labelling.
  const synthetic = intake.synthetic === true || /^SYNTHETIC-/.test(String(intake.record_ref || '')) || /^SYNTHETIC-/.test(String(intake.source_reference || ''));
  if (synthetic && intake.evidence_class === 'INDEPENDENT_EVALUATION_EVIDENCE') refuse('synthetic_labelled_independent', 'INT-10', 'A synthetic item is never independent evaluation evidence.');
  if (intake.evidence_class !== undefined && !['INDEPENDENT_EVALUATION_EVIDENCE', 'SYNTHETIC_FIXTURE'].includes(intake.evidence_class)) refuse('unknown_evidence_class', 'INT-10', 'Unknown evidence class.');

  // INT-11 actions an intake can never request.
  const asked = Array.isArray(intake.requested_actions) ? intake.requested_actions : [];
  for (const a of asked) if (PROHIBITED_ACTIONS.includes(a)) refuse(a === 'drr_score' || a === 'agreement_statistic' || a === 'classification' ? 'score_before_freeze' : 'model_review_or_transmission', 'INT-11', 'An intake cannot request ' + a + '.');
  if ('drr_score' in intake || 'agreement' in intake) refuse('score_before_freeze', 'INT-11', 'No score or agreement figure is accepted before the interpretation and calibration freezes.');

  if (codes.length) return { decision: 'REFUSED', validator: INTAKE_VALIDATOR_VERSION, codes };
  // INT-00 intake is closed: even a well-formed declaration is not admitted.
  if (!INTAKE_OPEN || registry.intake.state !== 'INTAKE_OPEN' || !filled(registry.intake.opening_record_ref)) {
    return { decision: 'WELL_FORMED_NOT_ADMITTED', validator: INTAKE_VALIDATOR_VERSION, codes: [{ code: 'intake_closed', control: 'INT-00', message: 'Intake is closed until an owner opening record exists. Nothing was admitted.' }] };
  }
  return { decision: 'REFUSED', validator: INTAKE_VALIDATOR_VERSION, codes: [{ code: 'intake_admission_not_implemented', control: 'INT-00', message: 'This package implements no admission path.' }] };
}

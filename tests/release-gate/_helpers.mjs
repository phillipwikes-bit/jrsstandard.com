// Shared helpers for the internal release-gate tests. Local only, no network.
// JRS_RG_LIB lets the mutation run point the suite at a mutated copy of lib/release-gate/.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const LIB = process.env.JRS_RG_LIB || ROOT + 'lib/release-gate/';
export const RECORD_PATH = ROOT + 'lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json';
export const REPORT_PATH = ROOT + 'docs/architecture/CURRENT_RELEASE_GATE_REPORT.md';

export const net = { calls: 0 };
globalThis.fetch = async () => { net.calls++; throw new Error('network access is prohibited in release-gate tests'); };

export const V = await import(LIB + 'vocabulary.js');
export const { validateRecord, conclusion } = await import(LIB + 'validator.js');
export const { renderReport, reportProblems } = await import(LIB + 'report.js');
export const { schemaErrors, SCHEMA } = await import(LIB + 'schema-check.js');

let pass = 0, fail = 0;
export const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
export const done = () => { console.log(`\n${pass + fail} checks, ${fail} failed`); process.exit(fail ? 1 : 0); };

export const clone = (o) => JSON.parse(JSON.stringify(o));
export const currentRecord = () => JSON.parse(readFileSync(RECORD_PATH, 'utf8'));
export const gate = (r, id) => r.gates.find((g) => g.gate_id === id);
export const subc = (r, id) => gate(r, id.split('.')[0]).sub_controls.find((s) => s.control_id === id);
export const ev = (r, id) => r.evidence.find((e) => e.evidence_id === id);
// Rejected with at least one error matching re.
export const rejects = (r, re, opts) => { const v = validateRecord(r, opts); return !v.valid && v.errors.some((e) => re.test(e)); };
export const errorsOf = (r, opts) => validateRecord(r, opts).errors;

// ---- synthetic all-pass fixture ---------------------------------------------------------------
// VALIDATOR FIXTURE, NOT EVIDENCE. It exists only to prove that the PASS rules can be met, so
// that a validator rejecting everything would be caught. Every identity in it is fictitious and
// visibly so (Engine "fixture-engine-0.0.0", package dated 2000-01-01, external:fixture/ refs),
// and it is built in memory here: it is never written to lib/release-gate/records/.
const KIND_FOR = { CONSTRUCTED_FIXTURE: 'constructed_dataset' };
export function passingFixture() {
  const engine = { engine_version: 'fixture-engine-0.0.0', candidate_source_commit: 'f'.repeat(39) + 'e', prompt_version: 'fixture-prompt/0.0.0', prompt_sha256: hash('fixture-prompt'), configuration_identity: 'VALIDATOR FIXTURE configuration' };
  const evidence = [];
  let n = 0;
  const add = (cls, kind, applies) => {
    const id = 'E-' + String(++n).padStart(3, '0');
    evidence.push({ evidence_id: id, description: 'VALIDATOR FIXTURE item ' + id + ', not evidence', evidence_class: cls, provenance: V.EVIDENCE_CLASSES[cls].provenance,
      artifact_kind: kind || KIND_FOR[cls], reference: 'external:fixture/' + id, sha256: hash(id), evidence_date: '2000-01-1' + (n % 9), applies_to_engine_version: applies, limitation: 'Fixture limitation for ' + id + '.' });
    return id;
  };
  const gates = V.GATES.map((def) => {
    const refs = [];
    const sub_controls = def.sub_controls.map((sd) => { const id = add(sd.satisfied_by[0], sd.kinds[0], engine.engine_version); refs.push(id); return { control_id: sd.id, name: sd.name, status: 'PASS', evidence_refs: [id], missing_dependencies: [], not_applicable_reason: null }; });
    const g = { gate_id: def.id, gate_name: def.name, engine_version: engine.engine_version, candidate_source_commit: engine.candidate_source_commit,
      prompt_identity: def.prompt_applicable ? { prompt_version: engine.prompt_version, prompt_sha256: engine.prompt_sha256 } : null,
      status: 'PASS', status_basis: 'Fixture basis.', acceptance_criterion: 'Fixture criterion for ' + def.id + '.', actual_result: 'Fixture result for ' + def.id + '.',
      evidence_date: '2000-01-31', evidence_refs: refs, missing_dependencies: [], limitation_statement: 'Fixture gate limitation for ' + def.id + '.',
      owner_decision: null, independent_reviewer: def.independent_reviewer_required ? { identity: 'Fixture Reviewer ' + def.id, role: 'fixture role', organisation: 'Fixture Org', independence_statement: 'Fixture independence statement.' } : null,
      sub_controls, per_condition_results: null };
    if (def.per_condition_results_required) g.per_condition_results = [{ condition_key: 'basis_identification', result: 'fixture', uncertainty: 'fixture interval', evidence_id: sub_controls.find((s) => s.control_id === 'RG-1.5').evidence_refs[0] }];
    if (def.owner_decision_required) g.owner_decision = { decision: 'release_authorized', decided_by: 'Fixture Owner', decision_date: '2000-01-31', evidence_id: sub_controls[0].evidence_refs[0] };
    return g;
  });
  return { schema_version: V.RECORD_SCHEMA_VERSION,
    release_package: { package_id: 'JRS-RGP-20000101-FIXTURE', package_version: '0.0.1', record_kind: 'internal_release_gate_record', is_public_manifest: false, distinct_from: 'jrs-decision-reconstruction-manifest' },
    as_of: '2000-02-01', record_author: 'VALIDATOR FIXTURE author', engine, evidence, gates,
    package_limitations: ['VALIDATOR FIXTURE: synthetic, not evidence of anything.'],
    authorizations_created: { production: false, licensing: false, sale: false, evaluation: false, real_record_use: false } };
}
export function hash(s) { return createHash('sha256').update(String(s)).digest('hex'); }
// Add an evidence item to a record and return its id.
export function addEvidence(r, cls, kind, provenance, applies) {
  const id = 'E-' + String(900 + r.evidence.length).padStart(3, '0');
  r.evidence.push({ evidence_id: id, description: 'injected ' + id, evidence_class: cls, provenance: provenance || (V.EVIDENCE_CLASSES[cls] ? V.EVIDENCE_CLASSES[cls].provenance : 'local'), artifact_kind: kind,
    reference: 'external:fixture/' + id, sha256: hash(id), evidence_date: '2000-01-20', applies_to_engine_version: applies || r.engine.engine_version, limitation: 'injected' });
  return id;
}
// Replace a sub-control's evidence with one injected item of the given class and kind.
export function supportWith(r, controlId, cls, kind, provenance) {
  const id = addEvidence(r, cls, kind, provenance);
  const g = gate(r, controlId.split('.')[0]);
  const s = g.sub_controls.find((x) => x.control_id === controlId);
  g.evidence_refs.push(id);
  s.evidence_refs = [id];
  return r;
}

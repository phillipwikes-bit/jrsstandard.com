// Readiness contract, registry and codebook mapping (verifier sections A, B and C).
import { t, done, json, read, M, has, clone } from './_helpers.mjs';
import { sha256 } from '../../lib/engine-candidate/source-prep.js';

const C = json('tools/evaluation-readiness/readiness-contract.json'), R = json('tools/evaluation-readiness/readiness-registry.json'), MAP = json('tools/evaluation-readiness/codebook-mapping.json');
const STATES = { CURRENT_IMPLEMENTATION: 'VERIFIED_IN_REPOSITORY', TARGET_ARCHITECTURE: 'TARGET_ONLY', SYNTHETIC_FIXTURE: 'DEVELOPMENT_ONLY', INDEPENDENT_EVALUATION_EVIDENCE: 'NOT_PRESENT', HUMAN_ATTESTATION: 'REQUIRED_UNFILLED', RELEASE_AUTHORIZATION: 'ABSENT', EXTERNAL_COUNSEL_DETERMINATION: 'ABSENT' };
for (const [k, s] of Object.entries(STATES)) t('contract: ' + k + ' is ' + s, C.categories[k] && C.categories[k].state === s);
t('contract: the treatments are those the brief requires', C.categories.CURRENT_IMPLEMENTATION.treatment === 'Verified from current source and tests' && C.categories.TARGET_ARCHITECTURE.treatment === 'Clearly labeled future-state design'
  && C.categories.SYNTHETIC_FIXTURE.treatment === 'Constructed development material only' && C.categories.INDEPENDENT_EVALUATION_EVIDENCE.treatment === 'Not yet present'
  && C.categories.HUMAN_ATTESTATION.treatment === 'Required but unfilled' && C.categories.RELEASE_AUTHORIZATION.treatment === 'Owner-controlled and absent' && C.categories.EXTERNAL_COUNSEL_DETERMINATION.treatment === 'Required but absent');
t('contract: independent evaluation evidence holds no item', C.categories.INDEPENDENT_EVALUATION_EVIDENCE.items.length === 0);
t('contract: every human attestation is unfilled and owned by a human role', C.categories.HUMAN_ATTESTATION.items.length === 6 && C.categories.HUMAN_ATTESTATION.items.every((a) => a.value === null && M.voc.HUMAN_ROLES.includes(a.required_role)));
t('contract: release authorization and counsel determination are absent', C.categories.RELEASE_AUTHORIZATION.owner_record_ref === null && C.categories.EXTERNAL_COUNSEL_DETERMINATION.determination_ref === null);
t('contract: every current-implementation item names sources that exist and the command that verifies it', C.categories.CURRENT_IMPLEMENTATION.items.every((i) => i.source_paths.length && i.source_paths.every((p) => { try { read(p); return true; } catch { return false; } }) && /^node tests\//.test(i.verified_by)));
t('contract: the synthetic fixtures cover the development sets and the frozen demo, and say none is evidence', /tests\/engine-candidate/.test(JSON.stringify(C.categories.SYNTHETIC_FIXTURE)) && /frozen-demo\/corpus/.test(JSON.stringify(C.categories.SYNTHETIC_FIXTURE)) && /No synthetic fixture is independent evaluation evidence/.test(C.categories.SYNTHETIC_FIXTURE.rule));
t('contract: every material limitation is stated', M.verify.REQUIRED_LIMITATIONS.every((k) => C.limitations[k] && C.limitations[k].length > 30));
t('contract: the package has no release-gate relationship and is planning-only', C.relationship_to_release_gates === 'none' && C.package_status === 'PLANNING_ONLY');

// Registry.
t('registry: PLANNING_ONLY, intake closed, no opening record, empty run list', R.status === 'PLANNING_ONLY' && R.intake.state === 'INTAKE_CLOSED' && R.intake.opening_record_ref === null && R.runs.length === 0);
t('registry: all four freezes are absent and owner-controlled', M.voc.FREEZES.every((k) => R.freezes[k].frozen === false && R.freezes[k].freeze_record_ref === null && R.freezes[k].authority === 'owner'));
const get = (o, p) => p.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);
t('registry: the binding template carries every required field unfilled (' + M.reg.REQUIRED_BINDING_FIELDS.length + ')', M.reg.REQUIRED_BINDING_FIELDS.every((f) => get(R.run_binding_template, f) === null));
t('registry: every binding the brief names is required', M.verify.BRIEF_BINDING_FIELDS.every((f) => M.reg.REQUIRED_BINDING_FIELDS.includes(f)));
t('registry: input identity is a digest or external reference, never content', ['input.input_digest', 'input.external_reference', 'input.digest_algorithm', 'input.custody_ref'].every((f) => M.reg.REQUIRED_BINDING_FIELDS.includes(f)) && !M.reg.REQUIRED_BINDING_FIELDS.some((f) => /text|content|body/.test(f)));
for (const [id, what, variant, state, code] of M.probes.REGISTRY_PROBES) {
  const r = M.reg.classifyRun(M.probes.registryProbeBinding(variant, R.run_binding_template, M.verify.EXPECTED_GATES), { currentGates: M.verify.EXPECTED_GATES });
  t('registry probe ' + id + ': ' + what, r.state === state && (!code || has(r, code)), r.state + ' ' + JSON.stringify(r.codes));
}
const full = M.probes.fullBinding(R.run_binding_template, M.verify.EXPECTED_GATES);
t('registry: a fully filled synthetic binding is only BINDING_COMPLETE_UNVERIFIED, never a result', M.reg.classifyRun(full, { currentGates: M.verify.EXPECTED_GATES }).state === 'BINDING_COMPLETE_UNVERIFIED');
t('registry: classifyRun can return only three states, none a result', (() => { const seen = new Set(); for (const v of [null, 'planning_full', 'prohibited', 'provider']) seen.add(M.reg.classifyRun(M.probes.registryProbeBinding(v, R.run_binding_template, M.verify.EXPECTED_GATES)).state); seen.add(M.reg.classifyRun(full).state); return [...seen].every((s) => ['PLANNING_ONLY', 'BINDING_COMPLETE_UNVERIFIED', 'REFUSED'].includes(s)); })());
t('registry: every omitted binding field keeps a run PLANNING_ONLY', M.reg.REQUIRED_BINDING_FIELDS.every((f) => { const b = clone(full); const ks = f.split('.'); let o = b; for (const k of ks.slice(0, -1)) o = o[k]; o[ks[ks.length - 1]] = null; return M.reg.classifyRun(b, { currentGates: M.verify.EXPECTED_GATES }).state === 'PLANNING_ONLY'; }));
t('registry: refusals name their owning control', has(M.reg.classifyRun(M.probes.registryProbeBinding('provider', R.run_binding_template, M.verify.EXPECTED_GATES)), 'provider_adapter_not_authorized', 'REG-05'));

// Codebook mapping.
const std = json('standard/jrs-conditions.json');
t('mapping: exactly RC1 to RC5, under the canonical names of standard/jrs-conditions.json', MAP.conditions.map((c) => c.condition_id).join() === 'RC1,RC2,RC3,RC4,RC5' && MAP.conditions.every((c) => std.conditions.find((s) => s.id === c.condition_id).name === c.canonical_name));
t('mapping: the brief\'s five labels resolve to the five IDs', Object.entries(M.verify.ASSIGNMENT_LABELS).every(([l, id]) => M.voc.resolveCondition(l) === id));
t('mapping: canonical names and IDs resolve to themselves', MAP.conditions.every((c) => M.voc.resolveCondition(c.canonical_name) === c.condition_id && M.voc.resolveCondition(c.condition_id) === c.condition_id));
t('mapping: no candidate key resolves to a condition (D-2, D-3)', MAP.candidate_keys_not_conditions.keys.length === 5 && MAP.candidate_keys_not_conditions.keys.every((k) => M.voc.resolveCondition(k) === null) && MAP.candidate_keys_not_conditions.correspondence === 'not_asserted');
t('mapping: unmapped and substitute labels are refused', ['Clarity', 'Defensibility', 'Accountability', 'reconstructability', 'Basis', ''].every((l) => M.voc.resolveCondition(l) === null));
t('mapping: bound to codebook.html v1.0 by its current hash, and the methodology register agrees', sha256(read('codebook.html')) === MAP.codebook_source.sha256 && read('tools/methodology-integrity/lib/sources.js').includes(MAP.codebook_source.sha256));
t('mapping: the codebook is not frozen for evaluation, and only the owner can freeze it', MAP.codebook_source.freeze_for_evaluation === 'NOT_FROZEN' && MAP.codebook_source.freeze_record_ref === null && MAP.codebook_source.freeze_authority === 'owner');
t('mapping: four determinations, separating missing information from an affirmative defect, and allowing insufficient basis', Object.keys(MAP.determinations).join() === 'AFFIRMATIVE_DEFECT,INFORMATION_MISSING,NO_DEFECT_OBSERVED,INSUFFICIENT_BASIS_TO_ASSESS' && /absence/i.test(MAP.determinations.INFORMATION_MISSING));
t('mapping: scoring, agreement statistics and classification are NOT_PERMITTED', ['drr_score', 'agreement_statistics', 'drr_classification'].every((k) => MAP.scoring[k] === 'NOT_PERMITTED'));
done();

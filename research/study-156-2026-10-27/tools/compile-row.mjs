// 156-record study: the arms, the scope declarations and one compile with its scored row. Shared by the record
// runner (run-study.mjs) and the variant runner (run-variants.mjs) so both score with the same code. No I/O.
// Arms (all offline; none is a model run):
//   A0   0.3.1 engine of record, deterministic, truthful study declaration           (refusal test)
//   A0b  0.3.2 candidate, same                                                        (refusal test)
//   A1   0.3.1, deterministic, COUNTERFACTUAL supplier-access declaration, findings only (lexical backstop test)
//   A2   0.3.3 + research profile, deterministic, truthful declaration              (structure, conflicts, controls)
//   A3-A5 0.3.3 + research profile, mock ORACLE / OVERCLAIM / UNDERCLAIM (heuristic quotations), eligible records only
//   A3R, A4R the same with rule-aligned quotations (ORACLE-R, OVERCLAIM-R): a ceiling, circular by design
//   A6   0.3.2 default profile, COUNTERFACTUAL supplier-access declaration, mock ORACLE (default prompt), eligible only
import { createHash } from 'node:crypto';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { classifyE1, e2, guards, controlMechanics } from './scoring.mjs';
import { PROFILE } from './research-probes.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const ALL = ['condition_findings', 'evidence_graph', 'cognitive_controls'];
export const ARMS = Object.freeze([
  { id: 'A0', engine: '0.3.1-candidate', mode: 'local_deterministic', decl: 'truthful', profile: false, outputs: ALL, eligibleOnly: false, kind: 'default_refusal_test' },
  { id: 'A0b', engine: '0.3.2-candidate', mode: 'local_deterministic', decl: 'truthful', profile: false, outputs: ALL, eligibleOnly: false, kind: 'default_refusal_test' },
  { id: 'A1', engine: '0.3.1-candidate', mode: 'local_deterministic', decl: 'supplier_counterfactual', profile: false, outputs: ['condition_findings'], eligibleOnly: false, kind: 'lexical_backstop_test' },
  { id: 'A2', engine: '0.3.3-research-candidate', mode: 'local_deterministic', decl: 'truthful', profile: true, outputs: ALL, eligibleOnly: false, kind: 'research_no_candidate' },
  { id: 'A3', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ALL, eligibleOnly: true, mock: 'ORACLE', kind: 'research_mock' },
  { id: 'A4', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ALL, eligibleOnly: true, mock: 'OVERCLAIM', kind: 'research_mock' },
  { id: 'A5', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ALL, eligibleOnly: true, mock: 'UNDERCLAIM', kind: 'research_mock' },
  { id: 'A3R', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ALL, eligibleOnly: true, mock: 'ORACLE-R', kind: 'research_mock' },
  { id: 'A4R', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ALL, eligibleOnly: true, mock: 'OVERCLAIM-R', kind: 'research_mock' },
  { id: 'A6', engine: '0.3.2-candidate', mode: 'local_mocked', decl: 'supplier_counterfactual', profile: false, outputs: ALL, eligibleOnly: true, mock: 'ORACLE-default', kind: 'default_counterfactual_mock' },
]);
export const SUPPLIER = Object.freeze({ record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false });
// The truthful declaration for an inventory entry.
export function declare(e) {
  if (e.cohort === 'synthetic_record') return { record_type: 'study_decision_record', record_state: 'completed_record', content_origin: 'synthetic_study_record', hr_content: false, regulated_decision_content: false };
  const base = { record_type: 'study_decision_record', record_state: 'completed_record', content_origin: 'constructed_study_vignette' };
  if (e.scope_class === 'NOT_EXCLUDED') return Object.assign(base, { hr_content: false, regulated_decision_content: false });
  if (e.scope_class === 'EXCLUDED') return Object.assign(base, { hr_content: e.scope_domain === 'employment', regulated_decision_content: true });
  return Object.assign(base, { hr_content: /employment/.test(e.scope_domain || '') ? 'not_established' : false, regulated_decision_content: 'not_established' });
}
// Conflict kinds with the affected condition named for cited-evidence conflicts (the form the variant relations read).
export const conflictKinds = (g) => g.conflicts.map((k) => (k.kind === 'cited_evidence_conflict' ? 'cited_evidence_conflict:' + (k.affects.includes('chronology_integrity') ? 'chronology_integrity' : k.affects.join('+')) : k.kind));

// The graph digest without the compiler source hash, so two code versions that behave the same give the same value.
export const behaviourDigest = (g) => V.graphDigest(Object.assign({}, g, { identity: Object.assign({}, g.identity, { compiler_sha256: null }) }));

// One compile. x: { text, declaration, cand, designed, eligible, clock, fixtureId, rpv }. Returns the scored fields.
export function compileRow(Ex, a, x) {
  const dv = a.profile ? Object.assign({}, Ex.declaredVersions, { prompt_version: x.rpv }) : Ex.declaredVersions;
  const submission = { submission_metadata: { submission_id: x.fixtureId }, scope_declaration: a.decl === 'truthful' ? x.declaration : SUPPLIER, declared_versions: dv, requested_outputs: a.outputs, record_text: x.text };
  const t = process.hrtime.bigint();
  let g = null, err = null;
  try { g = Ex.compiler.compileEvidenceGraph({ submission, candidateResponseText: x.cand, executionMode: a.mode, clock: x.clock, fixtureId: x.fixtureId, researchProfile: a.profile ? PROFILE : undefined }); }
  catch (e) { err = String(e && e.message).slice(0, 300); }
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  if (!g) return { engine: a.engine, disposition: 'technical_failure', error: err, ms };
  const mech = [...V.checkOffsets(g, x.text), ...V.checkLinkage(g), ...V.checkAmbiguity(g), ...V.checkMonotonic(g), ...V.checkReviewRoute(g), ...V.checkChronology(g), ...V.checkGraphValid(g, x.text, Ex.graphValidate.validateGraph)];
  const gd = a.profile ? guards(g) : [];
  let disposition;
  if (mech.length || gd.length) disposition = 'technical_failure';
  else if (g.intake.decision !== 'proceed') disposition = a.kind === 'lexical_backstop_test' ? (g.intake.decision === 'refuse' ? 'backstop_refused' : 'backstop_escalated')
    : (a.profile ? (x.eligible ? 'incorrect_refusal' : 'correct_refusal') : 'correct_refusal');
  else if (a.kind === 'lexical_backstop_test') disposition = 'backstop_passed';
  else if ((a.profile && !x.eligible) || (!a.profile && a.decl === 'truthful')) disposition = 'scope_leak';
  else if (a.mode === 'local_deterministic') disposition = 'not_assessed:no_candidate';
  else { const basis = g.findings.filter((f) => ['reconstructability', 'identifiable_basis', 'reasoning_traceability'].includes(f.condition_id)); disposition = basis.some((f) => f.status === 'not_assessed') ? 'partial' : 'substantive_mock'; }
  return { engine: a.engine, mode: a.mode, mock: a.mock || null, disposition, ms: Number(ms.toFixed(3)),
    intake: g.intake.decision, triggers: g.intake.triggers.map((y) => y.code + (y.category && y.category.startsWith('excluded_domain') ? ':' + y.category : '')),
    observed: (({ span_origins, ...o }) => o)(V.observe(g)), reasons: Object.fromEntries(g.findings.map((f) => [f.condition_id, f.reasons])), proposed: Object.fromEntries(g.findings.map((f) => [f.condition_id, f.proposed_status])),
    e1: classifyE1(g), e2: e2(g, x.designed), guards: gd, mechanical: mech, controls: controlMechanics(g, x.text), control_defects: g.cognitive_controls.map((c) => c.defect),
    conflicts_detail: conflictKinds(g), graph_digest: V.graphDigest(g), behaviour_digest: behaviourDigest(g), candidate_sha256: x.cand ? sha(x.cand) : null };
}

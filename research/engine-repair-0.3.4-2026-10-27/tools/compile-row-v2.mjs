// 0.3.4 repair package: compile-row 2.0. A copy of the study's compile-row 1.0
// (research/study-156-2026-10-27/tools/compile-row.mjs, unchanged there) with two changes:
//   1. The research profile passed to the compiler is a parameter. 1.0 hard-coded the study's profile, whose
//      authorization reference names the 156-record study; 0.3.4 runs pass this package's own reference.
//   2. The arm list adds the 0.3.4 arms. The study arms for 0.3.1 and 0.3.2 are carried over unchanged.
// Scoring (E1, E2, guards, control mechanics) is the study's frozen scoring.mjs, imported unchanged. No I/O.
// Arms (all offline; none is a model run):
//   A0, A0b, A1, A6   the study's arms for 0.3.1 and 0.3.2, unchanged
//   A0c  0.3.4 with the research profile OFF, truthful declaration, deterministic (refusal test; equal to A0b)
//   A6c  0.3.4 with the profile OFF, counterfactual supplier declaration, mock ORACLE-default (equal to A6)
//   A2   0.3.4 + research profile, deterministic
//   A3, A4, A5  0.3.4 + research profile, heuristic mocks ORACLE, OVERCLAIM, UNDERCLAIM (mocks-v2)
//   A3R, A4R    0.3.4 + research profile, rule-aligned mocks on 0.3.4 units (circular, a ceiling only)
//   ADV         0.3.4 + research profile, adversarial over-claiming citer (tests/paired-suite.mjs advCandidate)
import { createHash } from 'node:crypto';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { classifyE1, e2, guards, controlMechanics } from '../../study-156-2026-10-27/tools/scoring.mjs';
import { ARMS as STUDY_ARMS, SUPPLIER, declare, conflictKinds, behaviourDigest } from '../../study-156-2026-10-27/tools/compile-row.mjs';

export { SUPPLIER, declare, conflictKinds, behaviourDigest };
const sha = (s) => createHash('sha256').update(s).digest('hex');
const ALL = ['condition_findings', 'evidence_graph', 'cognitive_controls'];
export const CANDIDATE = '0.3.4-research-candidate';
export const PROFILE = Object.freeze({ profile_id: 'jrs-study-research-profile/1', enabled: true, authorization_ref: '0.3.4 repair assignment; offline research use only' });
const study = (id) => STUDY_ARMS.find((a) => a.id === id);
const research = (id, extra = {}) => Object.assign({}, study(id), { engine: CANDIDATE }, extra);
export const ARMS_V2 = Object.freeze([
  study('A0'), study('A0b'), study('A1'), study('A6'),
  { id: 'A0c', engine: CANDIDATE, mode: 'local_deterministic', decl: 'truthful', profile: false, outputs: ALL, eligibleOnly: false, kind: 'default_refusal_test', equals: 'A0b' },
  { id: 'A6c', engine: CANDIDATE, mode: 'local_mocked', decl: 'supplier_counterfactual', profile: false, outputs: ALL, eligibleOnly: true, mock: 'ORACLE-default', kind: 'default_counterfactual_mock', equals: 'A6' },
  research('A2'), research('A3'), research('A4'), research('A5'), research('A3R'), research('A4R'),
  research('A4R', { id: 'ADV', mock: 'ADV' }),
]);
export const RESEARCH_ARM_IDS = Object.freeze(['A2', 'A3', 'A4', 'A5', 'A3R', 'A4R', 'ADV']);

// The default-path normalization of the differential (tools/run-differential-v2.mjs): version labels, the compiler
// and pack content hashes, and the identifiers derived from them. Anything else that differs is a difference.
const VERS = /0\.3\.[234](?:-research)?-candidate/g;
export function normalizeDefaultGraph(g) {
  const x = JSON.parse(JSON.stringify(g).replace(VERS, '<COMPILER_VERSION>'));
  x.identity.compiler_sha256 = null; x.identity.run_id = null; x.identity.graph_sha256 = null;
  x.rule_packs.packs = x.rule_packs.packs.map((p) => ({ pack_id: p.pack_id, pack_version: p.pack_version }));
  for (const n of x.nodes) if (n.type === 'run_identity') n.run_id = null;
  return JSON.stringify(x);
}
export const normalizeError = (e) => (e ? e.replace(VERS, '<V>') : e);

// One compile. x: { text, declaration, cand, designed, eligible, clock, fixtureId, rpv, profile?, normalize? }. Returns the
// scored fields of 1.0, plus default_normalized_sha256 when x.normalize is set (arms compared on the default path).
export function compileRow(Ex, a, x) {
  const dv = a.profile ? Object.assign({}, Ex.declaredVersions, { prompt_version: x.rpv }) : Ex.declaredVersions;
  const submission = { submission_metadata: { submission_id: x.fixtureId }, scope_declaration: a.decl === 'truthful' ? x.declaration : SUPPLIER, declared_versions: dv, requested_outputs: a.outputs, record_text: x.text };
  const t = process.hrtime.bigint();
  let g = null, err = null;
  try { g = Ex.compiler.compileEvidenceGraph({ submission, candidateResponseText: x.cand, executionMode: a.mode, clock: x.clock, fixtureId: x.fixtureId, researchProfile: a.profile ? (x.profile || PROFILE) : undefined }); }
  catch (e) { err = String(e && e.message).slice(0, 300); }
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  if (!g) return { engine: a.engine, disposition: 'technical_failure', error: err, error_normalized: normalizeError(err), ms };
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
    conflicts_detail: conflictKinds(g), graph_digest: V.graphDigest(g), behaviour_digest: behaviourDigest(g), candidate_sha256: x.cand ? sha(x.cand) : null,
    default_normalized_sha256: x.normalize ? sha(normalizeDefaultGraph(g)) : null };
}

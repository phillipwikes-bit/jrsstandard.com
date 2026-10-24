// JRS PHASE 8: owner-decision register. Questions only; nothing here is decided or recommended.

export const DECISION_FIELDS = Object.freeze(['id', 'question', 'basis', 'status', 'raised_on', 'blocks', 'decided_by']);

export const PHASE8_DECISIONS = Object.freeze([
  { id: 'P8-OD-01', question: 'Whether to authorize a separately scoped Engine fix for the deferred issues (AR-040 person-directed contract language, invalid calendar dates, AR-035 legal-conclusion note, wider negation, duration, control and employment forms).', basis: 'Phase 7 backlog P7B-010, P7B-011, P7B-014; P7-OD-03, P7-OD-05, P7-OD-06.', blocks: 'Any further candidate version.', carries: ['P7-OD-03', 'P7-OD-05', 'P7-OD-06'] },
  { id: 'P8-OD-02', question: 'How to handle the declared cross-package compatibility conditions CPC-01 to CPC-04: keep them visible as they are, or authorize a redesign of the earlier file-ownership checks under a recorded change.', basis: 'governance/COMPATIBILITY_MANIFEST.json; execution-record/WORKTREE_RUN_RECORD.json.', blocks: 'Any edit to a Phase 4, Phase 6 or Phase 7 test.', carries: ['P7-OD-04'] },
  { id: 'P8-OD-03', question: 'Whether to preserve or commit the local Phase 6, Phase 7 and Phase 8 work, and in what private location.', basis: 'All three packages are local and uncommitted by instruction.', blocks: 'Any commit, push or transfer of the local packages.', carries: ['P7-OD-08'] },
  { id: 'P8-OD-04', question: 'Whether any future independent evaluation is authorized, and if so who fills each role and which material classes are permitted (Gate A).', basis: 'INDEPENDENT_EVALUATION_PROTOCOL.md (execution-disabled).', blocks: 'Gates A to F; any statement about performance.', carries: ['P7-OD-07'] },
  { id: 'P8-OD-05', question: 'Whether the v0.3.1 candidate becomes a proposal for a successor local Engine version, remains a parked candidate, or is discarded.', basis: 'CANDIDATE_QUALIFICATION_RECORD.md.', blocks: 'Any change of the candidate status.', carries: ['P7-OD-01', 'P7-OD-02'] },
  { id: 'P8-OD-06', question: 'Whether the change-impact and rollback model is adopted as the rule for future Engine proposals.', basis: 'CHANGE_IMPACT_AND_ROLLBACK_MODEL.md.', blocks: 'Treating the model as binding.', carries: [] },
  { id: 'P8-OD-07', question: 'How the three B-018 controlling source files will be made available for a read-only reconciliation, given they are held outside this container.', basis: 'B-018 OPEN; source files absent from the repository and container.', blocks: 'B-018 reconciliation; any statement depending on the source-aligned records.', carries: [] },
  { id: 'P8-OD-08', question: 'Whether to ratify the retroactive later-package registry entries for Phase 6, Phase 7 and Phase 8, whose owner-decision references point to recorded assignment evidence rather than to a formal decision record.', basis: 'governance/LATER_PACKAGE_REGISTRY.json (seeded_retroactively entries).', blocks: 'Treating the seeded entries as formally admitted.', carries: [], raised_on: '2026-10-20' },
  { id: 'P8-OD-09', question: 'Whether the later-package registry, dual-context result model and future-package admission gate are adopted as the rule for any future local package.', basis: 'TEST_GOVERNANCE_SCALABILITY_MODEL.md; FUTURE_PACKAGE_ADMISSION_GATE.md.', blocks: 'Admitting any future package.', carries: [], raised_on: '2026-10-20' },
].map((d) => Object.assign({ status: 'open', raised_on: '2026-10-19', decided_by: 'owner (not yet decided)' }, d)));

// Owner authorizations recorded for future local package reservations (Phase 8.2). Recording one creates no reservation.
export const AUTHORIZATION_SCOPE_KEYS = Object.freeze(['local_package_construction', 'independent_evaluation', 'provider_calls', 'deployment', 'public_use', 'commercial_licensing_or_release', 'real_record_processing']);
export const OWNER_AUTHORIZATIONS = Object.freeze([
  { id: 'OWNER_WORK_ASSIGNMENT_2026-10-20_PHASE9_HUMAN_ADJUDICATION_LAYER', status: 'decided', raised_on: '2026-10-20', decided_by: 'owner',
    question: 'Reference for a future local package reservation: a human evidence adjudication and review dossier layer around the v0.3.1 candidate.',
    basis: 'Owner work assignment of 2026-10-20 (Phase 9), cited again in the Phase 8.2 authorization.', decision_record: 'Owner instruction in session, 2026-10-20: record this exact reference as an owner decision for a future local package reservation.',
    blocks: 'Nothing; it is required by, and does not replace, the admission gate.',
    scope: { local_package_construction: true, independent_evaluation: false, provider_calls: false, deployment: false, public_use: false, commercial_licensing_or_release: false, real_record_processing: false },
    reservation_created: false },
]);
export function validateAuthorization(a) {
  const p = [];
  if (!a || a.status !== 'decided' || !a.decision_record) p.push('authorization not recorded as decided with a decision record');
  const sc = (a && a.scope) || {};
  for (const k of AUTHORIZATION_SCOPE_KEYS) if (typeof sc[k] !== 'boolean') p.push('scope missing: ' + k);
  if (sc.local_package_construction !== true) p.push('authorization does not cover local package construction');
  for (const k of AUTHORIZATION_SCOPE_KEYS.slice(1)) if (sc[k] !== false) p.push('authorization exceeds local construction: ' + k);
  if (a && a.reservation_created !== false) p.push('recording an authorization must not create a reservation');
  return p;
}
// References the admission gate may accept: decided authorizations whose scope is valid.
export const decidedReferences = (list = OWNER_AUTHORIZATIONS) => new Set(list.filter((a) => validateAuthorization(a).length === 0).map((a) => a.id));

export const CARRIED_PHASE7 = Object.freeze(['P7-OD-01', 'P7-OD-02', 'P7-OD-03', 'P7-OD-04', 'P7-OD-05', 'P7-OD-06', 'P7-OD-07', 'P7-OD-08']);

export function validateDecisionRegister(list) {
  const p = [];
  if (!Array.isArray(list) || !list.length) return ['register empty'];
  const ids = new Set();
  for (const d of list) {
    for (const k of DECISION_FIELDS) if (!d || d[k] === undefined || d[k] === null || String(d[k]).trim() === '') p.push((d && d.id ? d.id : '(unnamed)') + ': missing ' + k);
    if (!d) continue;
    if (ids.has(d.id)) p.push(d.id + ': duplicate'); ids.add(d.id);
    if (d.status !== 'open' && !d.decision_record) p.push(d.id + ': closed without a decision record');
    if (/recommend/i.test(JSON.stringify(d))) p.push(d.id + ': contains a recommendation');
  }
  const carried = new Set(list.flatMap((d) => d.carries || []));
  for (const c of CARRIED_PHASE7) if (!carried.has(c)) p.push('Phase 7 decision not carried: ' + c);
  return p;
}

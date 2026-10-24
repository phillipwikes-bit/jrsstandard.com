// Owner decisions still required after Phase 6. Questions only; no decision is recorded here.
export const DECISIONS = [
  { id: 'OD-01', question: 'Authorize, or decline, a separately scoped Engine change for P6-RT-07 (a motive note makes the v0.3 compiler fail its own self-validation, so no graph and no review route is produced).',
    basis: 'Knowledge register P6K-009; regression library first run. v0.3 was not changed in Phase 6.' },
  { id: 'OD-02', question: 'Decide how to treat the Phase 4 preservation check that fails because the Phase 6 assignment required a new file under tools/ (cross-package compatibility conflict).',
    basis: 'tests/engine-adaptive-reliability/run.mjs check "tools unchanged since 5d5374b"; PHASE6_HANDOFF.md section on cross-package checks.' },
  { id: 'OD-03', question: 'Decide whether the router should keep failing closed when a new intake refusal supersedes earlier quotation refusals and presence limitations (more conservative after state).',
    basis: 'Knowledge register P6K-011; stability transform P6-ST-18.' },
  { id: 'OD-04', question: 'Decide whether any reproduced open failure (P6K-001 to P6K-008) should become a proposed Engine change, a documented permanent boundary, or remain open.',
    basis: 'Regression library results; earlier Phase 4 entries RKB-041, RKB-042, RKB-044, RKB-046.' },
  { id: 'OD-05', question: 'Decide whether the baseline should obtain the intake gate for the five v0.2 long-record cases, which needs a change to the frozen v0.2 replay.',
    basis: 'Knowledge register P6K-012.' },
  { id: 'OD-06', question: 'Decide whether, when and where Phase 6 material is committed, given that the repository is public and the work stays local pending review.',
    basis: 'Assignment boundary: no commit, push or PR activity in Phase 6.' },
  { id: 'OD-07', question: 'Decide which future independent evaluation, if any, should test the boundaries flagged as needing it (P6K-001, P6K-002, P6K-008). Phase 6 provides no independent evidence.',
    basis: 'future_independent_evaluation_required flags in the knowledge register.' },
];

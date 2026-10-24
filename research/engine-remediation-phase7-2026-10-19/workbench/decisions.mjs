// Owner decisions still required after Phase 7. Questions only; nothing here is decided.
export const DECISIONS = [
  { id: 'P7-OD-01', question: 'Whether the v0.3.1 candidate should become a proposal for a successor local Engine version, remain a parked candidate, or be discarded. No release or deployment is implied either way.', basis: 'Differential qualification; NO_GO_NOT_VERIFIED unchanged.' },
  { id: 'P7-OD-02', question: 'Whether the Phase 4 ST-06 degradation (a rationale moved into the residual-risk section is now routed to review by RP-EVL-01) is acceptable over-review.', basis: 'Intended change set; over-refusal table.' },
  { id: 'P7-OD-03', question: 'The scope boundary for person-directed contract language such as Phase 4 AR-040 ("contract will not be renewed"). Deferred: it cannot be separated lexically from supplier-contract wording.', basis: 'Backlog P7B-010 (DEFERRED_PENDING_OWNER_DECISION).' },
  { id: 'P7-OD-04', question: 'How to treat the declared cross-package conflicts: the Phase 4 check on tools/ (from Phase 6) and the Phase 6 check that every new file is a Phase 6 file (from Phase 7).', basis: 'PRIOR_SUITE_RESULTS.json in the execution record.' },
  { id: 'P7-OD-05', question: 'Whether any rule should be widened (more negation forms, other duration units, other control or employment paraphrases); each widening needs a new sealed scenario set.', basis: 'Rule-pack owner_decision_for_expansion fields.' },
  { id: 'P7-OD-06', question: 'Whether invalid calendar dates and the AR-035 legal-conclusion note should enter a later remediation set.', basis: 'Backlog P7B-011, P7B-014.' },
  { id: 'P7-OD-07', question: 'Which future independent evaluation, if any, should examine the abstention and scope rules before any stronger statement is made (P6K-001, P6K-002, P6K-008).', basis: 'Backlog independent-evaluation flags.' },
  { id: 'P7-OD-08', question: 'Whether, when and where Phase 6 and Phase 7 material is committed in a public repository.', basis: 'Assignment boundary: no commit or push.' },
];

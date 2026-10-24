# Owner Decision Register

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

## Decisions taken during Phase 7

| Date | Decision | Effect | Record |
|---|---|---|---|
| 2026-10-19 | After MX-02, MX-40, MX-59 and MX-61 survived, the owner authorized four direct test repairs and a full mutation rerun, continuing only if every mutation was caught. Candidate logic, sealed expectations, v0.3, PR #40, B-018 and public surfaces were not to change. | Four probes added. All 79 mutations killed. | `execution-record/POST_STOP_REPAIR_RECORD.json` |
| 2026-10-19 | After the rerun, the coverage check found no mutation labelled for RP-NEG-01. The owner chose to relabel MX-14 (it already disables and tests that trigger) rather than add a duplicate MX-80. The owner also asked for the blocked first attempt to be disclosed. | Label changed only; full mutation group rerun at 84 of 84. | `execution-record/LABEL_CORRECTION_RECORD.json`, `execution-record/FIRST_ATTEMPT_DISCLOSURE.json` |

## Decisions still required

These are questions only. Nothing here is decided. The same list appears on `workbench/decisions.html`.

| Decision | Question | Basis |
|---|---|---|
| P7-OD-01 | Whether the v0.3.1 candidate should become a proposal for a successor local Engine version, remain a parked candidate, or be discarded. No release or deployment is implied either way. | Differential qualification; `NO_GO_NOT_VERIFIED` unchanged. |
| P7-OD-02 | Whether the Phase 4 ST-06 degradation (a rationale moved into the residual-risk section is now routed to review by RP-EVL-01) is acceptable over-review. | Intended change set; over-refusal table. |
| P7-OD-03 | The scope boundary for person-directed contract language such as Phase 4 AR-040 ("contract will not be renewed"). | Backlog P7B-010, `DEFERRED_PENDING_OWNER_DECISION`. |
| P7-OD-04 | How to treat the declared cross-package conflicts: the Phase 4 check on `tools/` (from Phase 6) and the Phase 6 check that every new file is a Phase 6 file (from Phase 7). | `execution-record/PRIOR_SUITE_RESULTS.json` |
| P7-OD-05 | Whether any rule should be widened (more negation forms, other duration units, other control or employment paraphrases). Each widening needs a new sealed scenario set. | Rule-pack `owner_decision_for_expansion` fields. |
| P7-OD-06 | Whether invalid calendar dates and the AR-035 legal-conclusion note should enter a later remediation set. | Backlog P7B-011, P7B-014. |
| P7-OD-07 | Which future independent evaluation, if any, should examine the abstention and scope rules before any stronger statement is made (P6K-001, P6K-002, P6K-008). | Backlog independent-evaluation flags. |
| P7-OD-08 | Whether, when and where Phase 6 and Phase 7 material is committed in a public repository. | Assignment boundary: no commit or push. |

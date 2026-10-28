# Owner Decision Register

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Open decisions are questions only. The recorded owner authorizations are decided and limited to their stated scope. Nothing here is recommended. Source: `decisions/OWNER_DECISIONS.json`.

## Phase 8 decisions

| Decision | Question | Basis | Blocks | Carries | Status |
|---|---|---|---|---|---|
| P8-OD-01 | Whether to authorize a separately scoped Engine fix for the deferred issues (AR-040 person-directed contract language, invalid calendar dates, AR-035 legal-conclusion note, wider negation, duration, control and employment forms). | Phase 7 backlog P7B-010, P7B-011, P7B-014; P7-OD-03, P7-OD-05, P7-OD-06. | Any further candidate version. | P7-OD-03, P7-OD-05, P7-OD-06 | open |
| P8-OD-02 | How to handle the declared cross-package compatibility conditions CPC-01 to CPC-04: keep them visible as they are, or authorize a redesign of the earlier file-ownership checks under a recorded change. | governance/COMPATIBILITY_MANIFEST.json; execution-record/WORKTREE_RUN_RECORD.json. | Any edit to a Phase 4, Phase 6 or Phase 7 test. | P7-OD-04 | open |
| P8-OD-03 | Whether to preserve or commit the local Phase 6, Phase 7 and Phase 8 work, and in what private location. | All three packages are local and uncommitted by instruction. | Any commit, push or transfer of the local packages. | P7-OD-08 | open |
| P8-OD-04 | Whether any future independent evaluation is authorized, and if so who fills each role and which material classes are permitted (Gate A). | INDEPENDENT_EVALUATION_PROTOCOL.md (execution-disabled). | Gates A to F; any statement about performance. | P7-OD-07 | open |
| P8-OD-05 | Whether the v0.3.1 candidate becomes a proposal for a successor local Engine version, remains a parked candidate, or is discarded. | CANDIDATE_QUALIFICATION_RECORD.md. | Any change of the candidate status. | P7-OD-01, P7-OD-02 | open |
| P8-OD-06 | Whether the change-impact and rollback model is adopted as the rule for future Engine proposals. | CHANGE_IMPACT_AND_ROLLBACK_MODEL.md. | Treating the model as binding. | none | open |
| P8-OD-07 | How the three B-018 controlling source files will be made available for a read-only reconciliation, given they are held outside this container. | B-018 OPEN; source files absent from the repository and container. | B-018 reconciliation; any statement depending on the source-aligned records. | none | open |
| P8-OD-08 | Whether to ratify the retroactive later-package registry entries for Phase 6, Phase 7 and Phase 8, whose owner-decision references point to recorded assignment evidence rather than to a formal decision record. | governance/LATER_PACKAGE_REGISTRY.json (seeded_retroactively entries). | Treating the seeded entries as formally admitted. | none | open |
| P8-OD-09 | Whether the later-package registry, dual-context result model and future-package admission gate are adopted as the rule for any future local package. | TEST_GOVERNANCE_SCALABILITY_MODEL.md; FUTURE_PACKAGE_ADMISSION_GATE.md. | Admitting any future package. | none | open |

## Phase 7 decisions carried (still open)

| Decision | Question | Status |
|---|---|---|
| P7-OD-01 | Whether the v0.3.1 candidate should become a proposal for a successor local Engine version, remain a parked candidate, or be discarded. No release or deployment is implied either way. | open |
| P7-OD-02 | Whether the Phase 4 ST-06 degradation (a rationale moved into the residual-risk section is now routed to review by RP-EVL-01) is acceptable over-review. | open |
| P7-OD-03 | The scope boundary for person-directed contract language such as Phase 4 AR-040 ("contract will not be renewed"). Deferred: it cannot be separated lexically from supplier-contract wording. | open |
| P7-OD-04 | How to treat the declared cross-package conflicts: the Phase 4 check on tools/ (from Phase 6) and the Phase 6 check that every new file is a Phase 6 file (from Phase 7). | open |
| P7-OD-05 | Whether any rule should be widened (more negation forms, other duration units, other control or employment paraphrases); each widening needs a new sealed scenario set. | open |
| P7-OD-06 | Whether invalid calendar dates and the AR-035 legal-conclusion note should enter a later remediation set. | open |
| P7-OD-07 | Which future independent evaluation, if any, should examine the abstention and scope rules before any stronger statement is made (P6K-001, P6K-002, P6K-008). | open |
| P7-OD-08 | Whether, when and where Phase 6 and Phase 7 material is committed in a public repository. | open |

## Recorded owner authorizations

| Reference | Status | Scope | Not authorized | Reservation created |
|---|---|---|---|---|
| OWNER_WORK_ASSIGNMENT_2026-10-20_PHASE9_HUMAN_ADJUDICATION_LAYER | decided | local package construction only | independent evaluation, provider calls, deployment, public use, commercial licensing or release, real record processing | no |

Recording an authorization creates no registry reservation. A future package still has to pass the admission gate before any of its files exist.

## Decisions taken during Phase 8

| Date | Decision | Record |
|---|---|---|
| 2026-10-19 | Proceed with Phase 8 as specified, including the tools/ replay path; declare four compatibility conditions (CPC-01 to CPC-04) in a manifest defined before Phase 8 code; never label them a pass. | governance/COMPATIBILITY_MANIFEST.json |
| 2026-10-19 | After MG-14 survived, repair three qualification probes to re-hash and assert specific reasons; rerun the full mutation group. | execution-record/POST_STOP_REPAIR_RECORD.json |
| 2026-10-19 | After the read-only audit finding, rebuild the process-execution and provider safeguards in the test harness and correct the records. | execution-record/AUDIT_REMEDIATION_RECORD.json |
| 2026-10-20 | Phase 8.2 governance amendment: generalize registry membership, add Phase 8 as a governed historical package, classify Phase 8 scope from the registry, record the Phase 9 owner reference (no reservation, no Phase 9 file). | PHASE8_2_EXECUTION_RECORD.md |
| 2026-10-20 | Phase 8.1 governance repair: replace the finite compatibility list with a later-package registry, dual-context results, isolated historical replay, a future-package admission gate and an execution-disabled evaluation handoff freeze, inside the existing Phase 8 locations. | PHASE8_1_EXECUTION_RECORD.md |

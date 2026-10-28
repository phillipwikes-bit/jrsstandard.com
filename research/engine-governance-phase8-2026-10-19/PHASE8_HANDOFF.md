# Phase 8 Handoff: Candidate Preservation, Test Governance and Independent Evaluation Readiness

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Release status: `NO_GO_NOT_VERIFIED`, unchanged. Date: 2026-10-19. All Phase 8 work is local and uncommitted.

**Language rule.** Earlier package results remain historically recorded results for their sealed package scope. A later whole-worktree run may show a declared compatibility condition without establishing a defect in the earlier package.

## 1. Package preservation

All seven earlier packages (v1-historical 1, v0.1-assurance 183, v0.2-evidence-contract 235, v0.3-evidence-graph 218, phase4-change-control 277, phase6-reliability 139, phase7-candidate 147 files) are byte-identical to their recorded manifests, before and after the whole-worktree run. No tracked file differs from `428c307`.

## 2. Phase 7 manifest

Complete (147 files, SHA-256 each), package hash `sha256:815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3`, reproducible byte-for-byte. The Phase 7 seal verifies and no Phase 7 file was modified after its final handoff.

## 3. Cross-package governance

Verdict `declared_conditions_only`: the only failing checks are CPC-01 to CPC-04, each tripped only by declared later files.

| Package | Historically recorded result (sealed package scope) | Recorded | Whole-worktree result (2026-10-20) | Declared conditions visible |
|---|---|---|---|---|
| v1-historical | no suite of its own | n/a | no suite | n/a |
| v0.1-assurance | 148/148 | 2026-10-17 | 148/148 | none |
| v0.2-evidence-contract | 123/123 | 2026-10-17 | 123/123 | none |
| v0.3-evidence-graph | 140/140 | 2026-10-17 | 140/140 | none |
| phase4-change-control | 269/269 | 2026-10-17 | 268/269 | CPC-01 |
| phase6-reliability | 316/316 | 2026-10-19T11:13:53.182Z | 315/316 | CPC-02 |
| phase7-candidate | 328/328 | 2026-10-19T13:57:52.546Z | 326/328 | CPC-03, CPC-04 |

## 3a. Audit finding and remediation

A read-only audit found that the first harness correction had weakened the process-execution check and that the record overstated it. Both safeguards were rebuilt as static scanners, the inaccurate statement is corrected in `EXECUTION_RECORD.md`, and the history is preserved there and in `MUTATION_TEST_RECORD.md`.

## 3b. Phase 8.1 test-governance scalability and handoff freeze

The finite list CPC-01 to CPC-04 is now derived from a hash-bound later-package registry (`LATER_PACKAGE_REGISTRY.md`). Results are reported in separate contexts, never merged (`DUAL_CONTEXT_RESULT_MODEL.md`). Phase 4, Phase 6 and Phase 7 were replayed in isolation, giving their historical results (`ISOLATED_HISTORICAL_REPLAY_PROTOCOL.md`). Future packages pass an admission gate that never authorizes work (`FUTURE_PACKAGE_ADMISSION_GATE.md`). The independent-evaluation handoff is frozen and execution-disabled (`INDEPENDENT_EVALUATION_HANDOFF_FREEZE.md`). See `TEST_GOVERNANCE_SCALABILITY_MODEL.md` and `PHASE8_1_EXECUTION_RECORD.md`.

## 3c. Phase 8.2 governance amendment

Phase 8.2 amends local governance only. It does not alter any Engine conclusion, any external evaluation status (none is authorized or conducted) or the release status. The registry distinguishes retroactive seeds from admitted future packages and derives its counts; Phase 8 is now a governed historical package (historical 370/370, isolated replay 370/370, current composition reported separately); Phase 8 scope is classified from the registry; the Phase 9 owner reference is recorded without creating a reservation. See `PHASE8_2_GOVERNANCE_AMENDMENT.md`.

## 4. Phase 8 tests

474 of 474 checks passed (246 direct, 130 negative or adversarial, 98 mutation). Mutations: 98 of 98 caught directly, 0 load failures.

## 5. Independent-evaluation readiness

A sealed, execution-disabled protocol (`JRS-IEP-0.1-draft`) defines six question areas, six roles, four material classes, blinding and contamination controls, eight measures (none calculated), seven stop conditions and gates A to F. An evaluation could be authorized without rebuilding the protocol. None has been authorized or conducted.

## 6. Change control

Ten change classes each have an evidence, regression, rollback, versioning, evaluation-invalidation, owner-decision and counsel-review path.

## 7. Unresolved owner decisions

- **P8-OD-01.** Whether to authorize a separately scoped Engine fix for the deferred issues (AR-040 person-directed contract language, invalid calendar dates, AR-035 legal-conclusion note, wider negation, duration, control and employment forms).
- **P8-OD-02.** How to handle the declared cross-package compatibility conditions CPC-01 to CPC-04: keep them visible as they are, or authorize a redesign of the earlier file-ownership checks under a recorded change.
- **P8-OD-03.** Whether to preserve or commit the local Phase 6, Phase 7 and Phase 8 work, and in what private location.
- **P8-OD-04.** Whether any future independent evaluation is authorized, and if so who fills each role and which material classes are permitted (Gate A).
- **P8-OD-05.** Whether the v0.3.1 candidate becomes a proposal for a successor local Engine version, remains a parked candidate, or is discarded.
- **P8-OD-06.** Whether the change-impact and rollback model is adopted as the rule for future Engine proposals.
- **P8-OD-07.** How the three B-018 controlling source files will be made available for a read-only reconciliation, given they are held outside this container.
- **P8-OD-08.** Whether to ratify the retroactive later-package registry entries for Phase 6, Phase 7 and Phase 8, whose owner-decision references point to recorded assignment evidence rather than to a formal decision record.
- **P8-OD-09.** Whether the later-package registry, dual-context result model and future-package admission gate are adopted as the rule for any future local package.
- Phase 7 decisions P7-OD-01 to P7-OD-08 remain open and are carried.

## 8. Confirmation

No commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker or ledger update, public change or branch change occurred in Phase 8.

## Records

| Record | Description |
|---|---|
| VERSION_REGISTRY.md | Packages, manifests, recorded results |
| CROSS_PACKAGE_TEST_GOVERNANCE.md | Conditions and classification |
| CANDIDATE_QUALIFICATION_RECORD.md | Unified local record |
| INDEPENDENT_EVALUATION_PROTOCOL.md | Execution-disabled protocol |
| EVALUATION_MEASUREMENT_DICTIONARY.md | Measure definitions |
| CHANGE_IMPACT_AND_ROLLBACK_MODEL.md | Change classes |
| KNOWN_LIMITATIONS_AND_OPEN_ISSUES.md | Limitations and active issues |
| OWNER_DECISION_REGISTER.md | Open decisions |
| EXECUTION_RECORD.md | Execution and disclosures |
| MUTATION_TEST_RECORD.md | Mutation evidence |
| PHASE8_FILE_MANIFEST_SHA256.txt | SHA-256 of every Phase 8 file |

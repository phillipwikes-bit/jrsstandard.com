# Independent Evaluation Protocol (draft, execution-disabled)

**Gate V0, 2026-10-25. Draft for future owner review. Not approved, not active.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Question it would answer

Under a frozen configuration and on material none of the builders has seen, how often does the Engine route records in a way independent adjudicators agree with? The measures are fixed in `MEASUREMENT_PLAN.md`. It would not answer whether any decision documented in a record was correct.

## 2. Preconditions (all NOT SATISFIED at 2026-10-25)

| # | Required before any credible independent validation claim | Status |
|---|---|---|
| 1 | Independent evaluator roles filled by people who did not build the candidate, the corpus or the expectations | NOT SATISFIED |
| 2 | Corpus construction and adjudication done by separate roles, neither of them a builder | NOT SATISFIED |
| 3 | Frozen Engine version, prompt, adapter, model identifier and environment, recorded by hash before material is selected | NOT SATISFIED (offline tuple recorded; no live configuration exercised) |
| 4 | Measures, thresholds and analysis fixed in writing before results are known | NOT SATISFIED (draft only) |
| 5 | A protected holdout meeting `FUTURE_HOLDOUT_ADMISSION_CRITERIA.md`, held by a custodian outside the build team | NOT SATISFIED (none exists) |
| 6 | Every record admitted through `DATA_AND_RIGHTS_ADMISSION_GATE.md`, with rights and data controls documented | NOT SATISFIED |
| 7 | Counsel review wherever real, personal, employment, regulated or third-party material is proposed | NOT SATISFIED (not triggered: no such material is proposed) |
| 8 | Blinded review under `EVALUATOR_BLINDING_PLAN.md` | NOT SATISFIED |
| 9 | Error and abstention accounting: every refusal, not-assessed result, adapter rejection and execution error counted, never dropped | NOT SATISFIED (method exists offline only) |
| 10 | False-reassurance measurement: rate of supported findings that adjudicators judge unsupported | NOT SATISFIED |
| 11 | Inter-rater agreement between independent adjudicators, reported before any Engine comparison | NOT SATISFIED |
| 12 | Sample-size rationale written before selection (`MEASUREMENT_PLAN.md` section 4) | NOT SATISFIED |
| 13 | Release-gate evidence: operational controls (access, retention, recovery, logging, stop) demonstrated, plus a separate owner release decision | NOT SATISFIED |
| 14 | B-018 closed by the owner, and NO_GO_NOT_VERIFIED lifted only by a separate decision | NOT SATISFIED |

## 3. Sequence (planning only)

1. Owner decision V0-03 to begin planning, after B-018, rights, data-admission and role-separation conditions are addressed.
2. Appoint independent roles (plan section 2), with no builder in an evaluation role.
3. Freeze the configuration and record it by hash.
4. Fix the measures and the sample-size rationale; deposit them with the custodian.
5. Construct and admit the holdout through the gates, held by the custodian.
6. Adjudicators label blind; inter-rater agreement is computed and reported.
7. Run the Engine once on the frozen configuration; preserve every output, paired.
8. Compare under the pre-specified analysis; report every error, abstention and disagreement.
9. Owner review of the evidence, before any external-use or release decision.

## 4. Stop conditions

- Any precondition found unsatisfied after work starts.
- Contamination (`ROLE_SEPARATION_AND_CONTAMINATION_PLAN.md`).
- A change to the frozen configuration.
- Any unadmitted material.
- Any credential exposure.
- Any result being described as more than the protocol establishes.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

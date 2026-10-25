# Measurement Plan (draft, to be fixed before any run)

**Gate V0, 2026-10-25. Draft; no measure is approved and no threshold is set.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Unit

One admitted record, processed once by the frozen configuration. The outcome is the five condition statuses, the conflict and refusal records, and the human-review route.

## 2. Measures (all reported; none dropped)

| Measure | Definition |
|---|---|
| Agreement with adjudicated reference, per condition | Proportion of records where the Engine status matches the resolved adjudicator label, with a confidence interval |
| False reassurance | Among Engine `supported` findings, the proportion adjudicators judge unsupported. This is reported first and is the primary safety measure |
| Missed visible gaps | Among records adjudicators judge to have a visible gap, the proportion the Engine leaves supported |
| Over-refusal | Among benign in-scope records, the proportion refused or escalated at intake |
| Abstention | Rate of not-assessed results, refusals and adapter rejections, each counted separately |
| Errors | Execution errors, pair-check failures and contract failures; each is a failure, never excluded |
| Inter-rater agreement | Agreement between independent adjudicators (for example, Cohen's kappa per condition), reported before any Engine comparison |
| Reproducibility | Normalized-output identity across repeated runs; for a live model, the empirically measured variation (CLAUDE.md section 21) |

## 3. Pre-specification rule

Measures, thresholds, the analysis script and the handling of ties and missing data are written, hashed and deposited with the custodian before the holdout is constructed. Any change after that point voids the run.

## 4. Sample-size rationale (to be completed before selection)

The size must be justified from the precision needed on the false-reassurance rate, the rarest measure. As an illustration only, not a target: an observed rate near 5% with a 95% interval of about ±3 percentage points needs on the order of 200 supported findings. A study too small for its stated precision must say so and claim nothing beyond it. Ten records, as in the stopped Stage A pilot, support feasibility observations only.

## 5. Reporting limits

Results apply to the frozen configuration, the admitted record type and the holdout composition. They say nothing about other record types, real decisions, other models or other conditions. No result is described as validation unless every precondition in the protocol draft is satisfied.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

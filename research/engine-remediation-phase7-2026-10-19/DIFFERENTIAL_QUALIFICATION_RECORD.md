# Differential Qualification Record

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

Frozen v0.3 against the v0.3.1 candidate on identical synthetic inputs. Local deterministic behaviour only. Source: `results/QUALIFICATION_RESULTS.json`, produced by `build-artifacts.mjs` at the fixed clock 2026-10-19T00:00:00Z.

## Method

Every input is compiled twice, once by frozen v0.3 and once by the candidate, with the same submission and the same mocked response. The unchanged Phase 6 differ compares the two graphs; `tooling/qualify.mjs` assigns one class. A difference is accepted only where `INTENDED_CHANGE_SET.json` (sealed before candidate logic existed) or the scenario's sealed differential expectation predicts it, and only towards the sealed outcome. A version label and recomputed offsets are recorded as presentation.

## Counts

| Input set | Total | Classes |
|---|---|---|
| Existing v0.3-family inputs (v0.3 fixtures, Phase 4 corpus and stability, Phase 6 library and stability) | 194 | `no_behavioral_difference` 171, `intended_safe_degradation` 19, `intended_refusal` 3, `intended_safe_routing` 1 |
| Phase 7 scenarios | 50 | `intended_safe_degradation` 24, `no_behavioral_difference` 18, `intended_safe_routing` 4, `intended_refusal` 4 |

No input is classed `unintended_regression`, `favorable_transition_requiring_human_review`, `limitation_loss`, `evidence_integrity_defect` or `scope_boundary_defect`. The pre-scan predicted 23 triggered existing inputs; the candidate changed exactly those inputs.

## Existing inputs that changed

| Input | Family | Rules | v0.3 outcomes | Candidate outcomes | Class |
|---|---|---|---|---|---|
| GC-004 | v0.3-fixture | RP-CHR-01 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| AR-009 | phase4-corpus | RP-CHR-04 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| AR-010 | phase4-corpus | RP-CHR-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| AR-011 | phase4-corpus | RP-CHR-02 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| AR-025 | phase4-corpus | RP-CON-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| ST-06 | phase4-stability | RP-EVL-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| ST-14 | phase4-stability | RP-SCO-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_refusal` |
| LB-02 | phase4-stability | RP-CHR-01 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-CH-02 | phase6-library | RP-CHR-04 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-CH-06 | phase6-library | RP-CHR-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-CH-07 | phase6-library | RP-CHR-02 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-CH-09 | phase6-library | RP-CHR-03 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-CH-10 | phase6-library | RP-CHR-04 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-RT-07 | phase6-library | RP-STR-01 |  | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_routing` |
| P6-SP-02 | phase6-library | RP-EVL-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:review_required, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-SP-04 | phase6-library | RP-EVL-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-SP-06 | phase6-library | RP-EVL-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| P6-SP-07 | phase6-library | RP-NEG-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| P6-SU-07 | phase6-library | RP-CON-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-XD-03 | phase6-library | RP-SCO-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_refusal` |
| P6-ST-12 | phase6-stability | RP-CHR-03 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-ST-14 | phase6-stability | RP-CHR-04 | reconstructability:supported, identifiable:review_required, chronology:review_required, reasoning:supported, sufficiency:review_required | reconstructability:supported, identifiable:review_required, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P6-ST-17 | phase6-stability | RP-SCO-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_refusal` |

Every change keeps or lowers a status, adds a conflict or gap, or refuses. None raises a status.

## Phase 7 scenarios

| Scenario | Rules | Candidate outcomes | Class |
|---|---|---|---|
| P7-CHR-01 | RP-CHR-01 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CHR-02 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-CHR-03 | RP-CHR-01 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_safe_degradation` |
| P7-CHR-04 | RP-CHR-01 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CHR-05 | RP-CHR-02 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CHR-06 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-CHR-07 | RP-CHR-02 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_safe_degradation` |
| P7-CHR-08 | RP-CHR-02, RP-CHR-04 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CHR-09 | RP-CHR-03 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CHR-10 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-CHR-11 | RP-CHR-03 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_safe_degradation` |
| P7-CHR-12 | RP-CHR-03 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CHR-13 | RP-CHR-04 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CHR-14 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-CHR-15 | RP-CHR-04 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_safe_degradation` |
| P7-CHR-16 | RP-CHR-04 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CON-01 | RP-CON-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CON-02 | RP-CON-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-CON-03 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-CON-04 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-CON-05 | RP-CON-01 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_safe_degradation` |
| P7-CON-06 | RP-CON-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-EVL-01 | RP-EVL-01 | reconstructability:supported, identifiable:review_required, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-EVL-02 | RP-EVL-01 | reconstructability:supported, identifiable:supported, chronology:review_required, reasoning:supported, sufficiency:review_required | `intended_safe_degradation` |
| P7-EVL-03 | RP-EVL-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| P7-EVL-04 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-EVL-05 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-EVL-06 | none | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `no_behavioral_difference` |
| P7-EVL-07 | RP-EVL-01 | reconstructability:review_required, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| P7-EVL-08 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-NEG-01 | RP-NEG-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| P7-NEG-02 | RP-NEG-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| P7-NEG-03 | RP-NEG-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| P7-NEG-04 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-NEG-05 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-NEG-06 | RP-NEG-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_degradation` |
| P7-NEG-07 | none | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `no_behavioral_difference` |
| P7-NEG-08 | none | reconstructability:review_required, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `no_behavioral_difference` |
| P7-R07-01 | RP-STR-01 | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_routing` |
| P7-R07-02 | RP-STR-01 | reconstructability:supported, identifiable:review_required, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_routing` |
| P7-R07-03 | RP-STR-01 | reconstructability:review_required, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `intended_safe_routing` |
| P7-R07-04 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-R07-05 | none | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `no_behavioral_difference` |
| P7-R07-06 | RP-STR-01 | reconstructability:supported, identifiable:review_required, chronology:supported, reasoning:review_required, sufficiency:review_required | `intended_safe_routing` |
| P7-SCO-01 | RP-SCO-01 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_refusal` |
| P7-SCO-02 | RP-SCO-01 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_refusal` |
| P7-SCO-03 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-SCO-04 | none | reconstructability:supported, identifiable:supported, chronology:supported, reasoning:supported, sufficiency:review_required | `no_behavioral_difference` |
| P7-SCO-05 | RP-SCO-01 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_refusal` |
| P7-SCO-06 | RP-SCO-01 | reconstructability:not_assessed, identifiable:not_assessed, chronology:not_assessed, reasoning:not_assessed, sufficiency:not_assessed | `intended_refusal` |

## Phase 6 library on the candidate (informational)

Phase 6 sealed expectations describe safe behaviour; Phase 6 known open failures that the candidate now handles appear as known_open_failure_not_reproduced. Informational; Phase 6 artifacts are unchanged. Counts: `as_expected` 52, `known_open_failure_not_reproduced` 10.

## Post-seal harness correction (disclosed)

On P7-SCO-05 an intake refusal supersedes a response refusal. The unchanged Phase 6 differ reports this as two scope findings ("candidate response refusal lost", "refusal lost: candidate_response_invalid"). `tooling/qualify.mjs` was corrected after the seal to accept exactly those two findings, and only when the complete refusal state holds and the candidate response was not read, as sealed contract rule 3 already requires. No sealed expectation changed. See `EXECUTION_RECORD.md`.

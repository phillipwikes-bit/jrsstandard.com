# Synthetic Corpus Expansion Protocol

Local ID: ARC-DOC-07 (NON-CANONICAL). Code: `lib/engine-change-control/corpus-protocol.mjs`, `corpus-replay.mjs`. Generator: `corpus-expansion/generate_corpus.py`. Register: `corpus-expansion/FIXTURE_REGISTER.json`.

## Local engineering claim
A new synthetic fixture is admitted only with a complete provenance and purpose record traced to a knowledge entry or a documented coverage gap. Fifty fixtures, AR-001 to AR-050, were added under this protocol.

## Local evidence
- Admission: 50 of 50 admitted (`ADMISSION_RESULTS.json`).
- Replay against the frozen v0.3 compiler: 45 of 50 match the expected safe result. Open failures AR-010, AR-011, AR-025, AR-035, AR-040 (`OPEN_FAILURES.json`); four of them are in the unsafe direction.
- Executable expectation fields across the 50 fixtures: 501; descriptive expectations labelled `descriptive_expectation_not_executed`: 1 (AR-011 control defect: v0.3 has no conflict kind for distinct expiry dates).
- Probes `cp.*` (6), `cr.*` (9); mutations MA-45 to MA-47, MA-50, MB-33 to MB-35.

## Admission fields
fixture_id (AR-nnn, unique), authoring_source (`synthetic_engineering` only), trigger (a knowledge ID or coverage gap), scope_classification, expected_condition_result, expected_graph_structure, expected_limitation, expected_refusal (required for excluded-domain fixtures), regression_purpose, mutation_relationship, independence_statement (exactly: "Synthetic engineering fixture. Not independent, real-world, or holdout material.").

## Coverage
| Gap | Area | Fixtures |
|---|---|---|
| CG-01 | incomplete reasoning chains | AR-001 to AR-004 |
| CG-02 | weak authority references | AR-005 to AR-008 |
| CG-03 | timing conflicts | AR-009 to AR-012 |
| CG-04 | missing risk-to-decision linkage | AR-013 to AR-015 |
| CG-05 | multiple linked decisions | AR-016 to AR-019 |
| CG-06 | repeated quotations | AR-020 to AR-023 |
| CG-07 | conflicting control statements | AR-024 to AR-027 |
| CG-08 | partial source references | AR-028 to AR-031 |
| CG-09 | unsupported certainty wording | AR-032 to AR-035 |
| CG-10 | layered prompt-injection attempts | AR-036 to AR-039 |
| CG-11 | reworded excluded-domain terminology | AR-040 to AR-043 |
| CG-12 | Cognitive Controls neutrality pressure | AR-044 to AR-047 |
| CG-13 | cross-version compatibility pressure | AR-048 to AR-050 |

## Executable expectations (0.4.1-local)
Every fixture's expected file now executes: gate, instruction risk, candidate validity, statuses, conflict kinds, refusal codes (exact set), quote statuses (every observation), Cognitive Control defects (exact set, except one labelled descriptive), limitation kinds per condition (presence, sufficiency, conflict, instruction, refusal), and graph properties (conflict node count, TEXTUALLY_SUPPORTS edge count, one limitation and one review route per finding). These were authored from the v0.3 rules before the run that checks them; all held for the 45 passing fixtures, and none was corrected.

## Expectation discipline
Expected results describe the expected safe behaviour and were authored before the first run. Where v0.3 differs, the case is an open failure; the expectation is not edited to match. The suite fails if the set of failing cases changes in either direction, so a new failure or a silent change in behaviour is visible. No corpus expectation was corrected after the run.

## Interpretation
The corpus turned five lexical or structural blind spots of v0.3 into named, reproducible cases with proposals attached.

## Limitation
All fifty fixtures derive from one synthetic base record family. They are not independent, real-world or holdout material, and they share near-duplicate structure with v0.1 to v0.3 fixtures (RKB-049).

## External evidence still required
Authorised, independently sourced records for any statement beyond this synthetic corpus.

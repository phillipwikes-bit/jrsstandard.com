# Behavioral Drift Ledger Specification (0.4.1-local)

Local ID: ARC-DOC-06 (NON-CANONICAL). Code: `lib/engine-change-control/drift-ledger.mjs`, `observed-change.mjs`. Output: `drift-ledger/DRIFT_LEDGER.json`, `proposals/OBSERVED_CHANGES.json`.

## Local engineering claim
The ledger records every observed output difference between the frozen baseline and an isolated patched copy over the same 85 synthetic fixtures, and fails closed on specified material or unsafe differences. No request field can mark a difference acceptable: there is no expected-drift input. It applies nothing. Automated controls identify specified local risks; human review remains required, and unrecognised drift outside the fixtures is not seen.

## Local evidence
13 isolated runs. Selected results:

| Run | Rows | Violations | Outcome |
|---|---|---|---|
| R-01 (employment-outcome patterns) | 5 (AR-040) | 0 | proposal awaiting human review |
| R-02 (assessment-to-decision pair) | 5 (AR-010) | 0 | proposal awaiting human review |
| X-02 (refusal pattern disabled) | 5 (GC-023) | 11 | rejected |
| Y-02 (keyword removed, declared as tidying) | 5 | 9 | rejected (observed refusal removal) |
| Y-03 (expiry gap removed, declared neutral) | 15 | 1 favourable (AR-047) | blocked pending human disposition |
| Y-04 (duplicate quotations accepted) | 30 | 8 | rejected (observed refusal removal) |
| Y-07 (presence limitation shortened) | 365 | 335 | rejected (observed limitation removal) |

Probes `dl.*` (18); mutations MA-33 to MA-41, MB-26 to MB-31.

## Row fields
baseline_version, candidate_version, fixture_id, condition, prior_outcome, candidate_outcome, observed_change, evidence_graph_difference (structure with run identity excluded), changed_limitation, changed_refusal_behavior, classification (`material_unsafe_until_human_disposition`, `material` or `non_material`), human_review_required (always true), human_disposition (always `not_recorded`; only a person records one, outside this system). Each run carries complete run identity (package hashes, patch hash, fixture hashes, command, run id, execution mode, `synthetic_local_only`).

## Fail conditions
- Favourable transitions: review_required to supported, review_required to gap, gap to supported, not_assessed to supported, not_assessed to gap.
- A refusal code disappears; an excluded-domain record stops being refused.
- A limitation disappears or weakens on a finding that is still assessed (a finding withdrawn under a refusal carries the refusal boundary instead; MA-38 guards that exemption).
- An edge meaning changes to proof language; a conflict stops routing to review.
- A synthetic fixture carries a label such as `independent`, `adjudicated`, `externally_validated` or `holdout`.
- A fixture is missing from either run.

## Interpretation
A reviewer sees exactly which fixtures a patch moved, and a favourable or boundary-loosening change cannot be labelled acceptable by its author.

## Limitation
Only the 85 fixtures are compared. A structural change that alters every graph produces many non-material rows (Y-09: 315). Lowering transitions (for example supported to review_required) are material but not violations.

## External evidence still required
A person's disposition on every material row before any implementation.

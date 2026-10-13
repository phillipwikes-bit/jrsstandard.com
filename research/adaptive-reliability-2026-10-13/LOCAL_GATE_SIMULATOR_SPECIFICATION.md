# Local Release Candidate Gate Simulator Specification

Local ID: ARC-DOC-09 (NON-CANONICAL). Code: `lib/engine-change-control/gate-simulator.mjs`. Output: `gate-simulator/GATE_SIMULATION.json`.

**Presence of a local artifact does not satisfy an external release gate.**

## Local engineering claim
The simulator reports which internal engineering artifacts exist for a future review, category by category. It is non-production and non-authorising.

## Local evidence
Probes `gs.*` (7); mutations MA-42 to MA-44. Current output (18 categories):

| Category | State |
|---|---|
| version_identity, fixture_integrity, prompt_identity, contract_identity, graph_integrity, failure_mode_record, change_impact_analysis, regression_coverage, mutation_coverage, drift_record, evaluation_separation_controls, operator_control_evidence | present_local_artifact (as of the final build; see `PHASE_4_HANDOFF.md`) |
| counsel_review, independent_holdout, independent_labeling, adjudication, production_qa | external_evidence_required |
| owner_release_authorization | not_authorized |

## Rules
- States: present_local_artifact, missing_local_artifact, external_evidence_required, not_assessed, not_authorized.
- External categories are external_evidence_required whatever the input says; owner release authorization is always not_authorized.
- No score, green light, release recommendation, readiness determination or production conclusion. Production status is reported as NO_GO_NOT_VERIFIED.

The Operator Review Console shows `present_local_artifact` as "local file present (not a gate result)" in a neutral treatment, so it cannot reasonably be read as ready, passed or approved.

## Interpretation
The simulator shows that the local engineering side is documented and that every gate a release would actually need remains outside it.

## Limitation
"Present" means a file exists, not that its content is adequate.

## External evidence still required
Counsel review, independent holdout, independent labeling, adjudication, production QA and owner release authorization.

# Change Impact Analysis Protocol (0.4.1-local)

Local ID: ARC-DOC-04 (NON-CANONICAL). Code: `lib/engine-change-control/impact-analyzer.mjs`. Output: `proposals/IMPACT_ANALYSES.json`.

## Local engineering claim
For behavioural proposals with a verified observed-change record, the impact class is derived from what was observed; declared descriptors can only raise it. Behavioural proposals without a verified record are `not_assessed`. The analyzer never clears a proposal.

## Local evidence
Probes `ia.*` (13); mutations MA-24 to MA-28, MB-40, MB-41. Results for all 32 requests, each marked `classified_from` either `observed_change_record` or `declared_non_behavioural_change`.

## Classification
| Class | When |
|---|---|
| not_assessed | Malformed proposal, or behavioural without a verified record |
| no_behavioral_change | Not behavioural, and no favourable, limitation or refusal effect declared |
| local_behavioral_change | Behavioural; or any favourable, limitation or refusal effect |
| evidence_standard_change | Observed favourable transitions, or a declared evidence change |
| scope_boundary_change | Observed excluded-domain fixtures no longer refused, or a declared scope change |
| release_control_change | evaluation_factory affected (such proposals are also refused by the compiler) |

Each analysis also states: historical outputs (v1, v0.1, v0.2 frozen), fixtures to replay, graph rules and Cognitive Controls affected, refusal behaviour (observed or declared), favourability, limitation effect, documentation and version-identity needs, and whether the evaluation protocol must change. `human_review_required` is always true.

## Interpretation
A reviewer sees the class the patch earned on the fixtures, not the class its author chose.

## Limitation
The component-to-fixture map is hand-authored. Observation is limited to the corpus.

## External evidence still required
None for local classification.

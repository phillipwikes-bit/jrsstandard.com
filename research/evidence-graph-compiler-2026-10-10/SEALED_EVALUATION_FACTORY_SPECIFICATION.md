# Sealed Evaluation Factory Specification

Local ID: EGC-DOC-07 (NON-CANONICAL). Code: `lib/engine-evidence-graph/evaluation/factory.mjs`. Artifacts: `sealed-evaluation-factory/`.

## Claim
The factory prepares, and refuses, evaluation packages. It cannot authorise or run an evaluation. Its best possible decision is `not_authorized_to_execute`.

## Local engineering evidence
- `REGISTRY.jsonl`: one hash-chained entry, EVAL-LW-001, status `not_authorized_to_execute`; `validateRegistry` reports 0 problems.
- `PROTOCOL_TEMPLATE.md`: fifteen required sections; states that no evaluation was authorised or conducted.
- `AUTHORITY_MATRIX.json`: eight roles.
- `example-packages/P-00` to `P-11` and `SEPARATION_CHECK_RESULTS.json`: all twelve refused.
- Suite section F; factory mutations in section H.

## Registry
Permitted statuses: draft_protocol_only, awaiting_owner_decision, blocked_by_missing_permissions, not_authorized_to_execute, superseded. Any completion, validation or approval wording in `current_status` or `note` is rejected. Each entry carries the previous entry's hash; any edit breaks the chain.

## Separation checks
missing_version_identity, missing_codebook_hash, missing_owner_authorization (including placeholder identifiers), unapproved_data_classification, placeholder_adjudication_authority, synthetic_presented_as_holdout, development_sealed_overlap (content hash matches any development fixture), label_independence_not_supported (labels from the engineering process), raw_records_in_tracked_directory, component_changed_after_freeze (prompt, codebook or compiler hash differs from the freeze), missing_freeze_record, status_claim_not_permitted, template_only_material.

## Interpretation
The factory makes contamination and missing authority visible before any evaluation could start.

## Limitation
It checks the fields it is given. It cannot verify that a named person exists, is independent, or authorised anything. No holdout, label or adjudication exists.

## External evidence still required
Recorded owner authorisation, counsel review, named independent labelers and adjudicator, an authorised data source.

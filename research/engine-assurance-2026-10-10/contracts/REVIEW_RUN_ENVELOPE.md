# Review Run Envelope 0.1.0: Explanatory Notes

**Schema:** `review-run-envelope.schema.json` (pinned in `SCHEMA_PIN.txt`) · **Validator:** `lib/engine-assurance/envelope.mjs` · **Status:** private, local, unpublished.

The envelope is the identity and result record for one local run of the JRS Review Engine candidate. It is **not** the public API contract (`openapi.json`) and **not** the Decision Reconstruction Manifest. It never states deployment, independent validation, approval, production readiness or legal compliance; the validator rejects an envelope that does.

## Fields

| Field | Meaning |
|---|---|
| `schema_version` | `jrs-review-run-envelope/0.1.0`. Any other value is rejected. |
| `engine_version` | Version label of the candidate code executed: `0.1.0-validation` (see audit section 2 for the conflict with `openapi.json`). |
| `codebook_version` | `1.0`. |
| `assurance_layer_version` | `0.1.0-local`. |
| `condition_vocabulary` | Always `review_engine_keys`. Engine keys are not Codebook conditions. |
| `fixture_id` | Register identifier, e.g. `SAE-001`. |
| `fixture_content_hash` | SHA-256 over the canonical JSON of the record, request and provider-response hashes. |
| `run_id` | `run_` plus 24 hex characters, derived from the fixture hash, code-hash identity and run timestamp. Same inputs, same code and same clock give the same `run_id`. |
| `run_timestamp` | RFC 3339. Wall clock unless the harness is given `--clock`. |
| `execution_mode` | `local_mocked`, `local_deterministic`, or `external_not_authorized`. The third is a recognised value that only ever describes a refused run. |
| `provider_mode` | `mocked` or `not_used`. |
| `provider_invocations` | 0 or 1. |
| `source_identity_status` | `candidate_core_matches_git_history` when the candidate core is byte-identical to the historical v1 blob; otherwise `candidate_core_provenance_not_verified`. |
| `source_identity` | Candidate path, commit and blob; repository HEAD and working-tree state at run time. |
| `test_or_demo_status` | `synthetic_engineering_test` or `synthetic_demonstration`. |
| `release_status` | Always `NO_GO_NOT_VERIFIED`. |
| `limitations` | L-01 to L-07, all required (L-06 differs by mode). |
| `human_review_required` | Always `true`. |
| `gate` | Pre-analysis decision (`proceed`, `refuse`, `escalate`) and the trigger codes. |
| `findings.condition_findings` | Exactly five, one per Engine key. See below. |
| `findings.record_controls` | Cognitive Controls detections (detect, reflect, correct, learn). |
| `refusals` | Every refusal, escalation or withholding, with stage, disposition, category and a neutral boundary statement. |
| `manifest_reference` | `{produced:false, reason}` or the identity of a Manifest produced by the existing adapter from unmodified v1 output. |
| `artifact_hashes` | Record, request, provider response, normalised output, and every code file executed. |

### Condition finding

`outcome` is one of `supported`, `gap`, `review_required`, `not_assessed`. `outcome_basis` says why. `candidate_status` is the v1 status (`pass`, `review`, `gap`) or `none`. `source_spans` carry the exact quotation, `start` and `end` in UTF-16 code units, the occurrence count, and `verification: exact_match_record_presence_only`. `evidence_classification` is `contains_record`, `derived_record_content` or `no_verified_record_support`. `limitation` always contains the span limitation verbatim. `what_would_change_this_finding` says what record change would alter the outcome.

## Cross-field rules (enforced by `validateSemantics`)

| Rule | Requirement |
|---|---|
| R1 | `local_mocked` requires `provider_mode: mocked`; `local_deterministic` requires `not_used`; `not_used` requires zero invocations. |
| R2 | `external_not_authorized` requires an `execution_mode_not_authorized` refusal, no assessed condition and no invocation. |
| R3 | A `refuse` or `escalate` gate requires every condition `not_assessed`, no invocation, no Manifest, no record controls, and a `pre_analysis` refusal entry. A `pre_analysis` refusal under `proceed` is rejected. |
| R4 | Exactly the five Engine keys, once each. |
| R5 | `supported` or `gap` requires at least one span, `contains_record`, basis `candidate_status_with_verified_span`, candidate status `pass` or `gap` respectively, and a candidate explanation. |
| R6 | A candidate `review` can only be `review_required` or `not_assessed`. |
| R7 | `not_assessed` carries no spans and `no_verified_record_support`. |
| R8 | Every finding carries the span limitation text unaltered. |
| R9 | When the record is supplied, every span (findings and record controls) is re-sliced from the record and compared. |
| R10 | Versions supported; a produced Manifest's engine, codebook, Manifest and JRS versions agree with the envelope, and the Manifest passed offline schema and integrity checks. |
| R11 | L-01 to L-07 present; `human_review_required` true. |
| R12 | No status-claim key (production, ready, certified, compliant, approved, validated, guarantee, licence, sale) anywhere; no unnegated claim term in any string except verbatim record quotations; `release_status` is `NO_GO_NOT_VERIFIED`. |

## Normalisation and hashing

`normalizeEnvelope` removes `run_id`, `run_timestamp`, `artifact_hashes`, repository HEAD and working-tree state, and the Manifest's id and hash, then serialises with keys sorted recursively (`jrs-dev-canon-1`, the existing Manifest canonicalisation). Two runs of the same fixture on the same code therefore produce the same normalised output regardless of key order or run time. `tests/engine-assurance/run.mjs` section F demonstrates this and the positive control that a content change does change the output.

## Negative tests

`tests/engine-assurance/run.mjs` section B rejects: unknown engine, codebook, schema and layer versions; unsupported execution and provider modes; missing or malformed hashes; empty code-hash map; contradictory mode fields; a refused gate with assessed conditions; an envelope carrying a `production-ready` marker by field, by status value, or by wording alongside human review required; `human_review_required: false`; a nested status-claim key; a malformed timestamp. Each is paired with the positive control that the unmodified SAE-001 envelope is valid.

## Changing this contract

Any change to the schema changes its SHA-256 and fails the pin test (section G). Update `SCHEMA_PIN.txt` only together with a `CHANGELOG.md` entry that states the change, the reason and the regression evidence, and bump `schema_version` for any change that alters accepted or emitted content.

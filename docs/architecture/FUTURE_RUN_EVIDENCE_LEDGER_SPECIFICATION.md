# Future run evidence ledger specification (internal)

**Package `JRS-EVAL-READINESS-20261007-PR39`. Status `PLANNING_ONLY`.** Ledger: `tools/evaluation-readiness/ledger/future-run-ledger.json`. Enforcement: `lib/ledger.js` (LED-01 to LED-07).

## Current implementation, target and absent evidence
- **Current implementation:** an append-only, hash-chained ledger holding one genesis planning record.
- **Target:** every future artifact (declaration, binding, extraction, interpretation, candidate output, disagreement, adjudication, attestation, authorization or QA report) is entered as it is created.
- **Absent:** no evaluation artifact, attestation, counsel determination, owner authorization or QA report has been entered.

## Entry fields
| Field | Meaning |
|---|---|
| `seq`, `prev_digest`, `entry_digest` | position and chain: each entry names the digest of the one before |
| `created_by` | `{ kind, identity }`; kind is `human`, `code`, `test_fixture` or `generated` |
| `artifact_type` | one of the listed types |
| `version_identity`, `digest` | what the artifact is, and its digest where one exists |
| `timestamp` | supplied by the caller (UTC, ISO 8601); the ledger reads no clock |
| `preconditions` | what had to be true first |
| `evidence_status` | `VERIFIED`, `ASSERTED`, `MISSING` or `NOT_APPLICABLE` |
| `required_human_role` | the role whose act the artifact needs, if any |
| `limitation` | an explicit statement of what the entry does not show |
| `release_gate_relation` | `{ gates, effect }`; effect is `none`, `informs` or `required_for`, never an advance |

## Rules
- **Append-only.** `appendEntry` returns a new ledger in which every earlier entry is byte-identical. An edit, insertion or removal breaks the chain and fails `verifyLedger` (LED-07). The tests also check that the committed ledger extends the version at `HEAD`.
- **No role substitution.** A reviewer, adjudicator, custodian, counsel, owner or independent-QA artifact can only be created by a person in that role. If a code path, a test fixture or generated text tries, the entry is refused as role substitution (LED-04). Code cannot mark human-role evidence `VERIFIED`.
- **No gate movement.** No entry can claim to advance a release gate (LED-06).
- **No content.** Entries hold digests and references, never record text.

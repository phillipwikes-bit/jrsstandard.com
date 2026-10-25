# Stage A Pilot Decision Rule

**Fixed 2026-10-24, before any live request. Outside the repository. Not effective until
approved on the signature page of `STAGE_A_OWNER_AUTHORIZATION_FINAL_DRAFT.md`.** This
rule may not be changed after the first live request. Any change requires a new owner
decision and a new pilot. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

These are feasibility decision rules, not statistical validation thresholds.

## 1. Execution discipline

- Exactly one request per approved record, SDR-01 to SDR-10, in that order. At most ten requests in total.
- No retries, no reruns, no replacement records, and no prompt or configuration change during the pilot.
- A transport failure (for example a timeout or provider error) uses up that record's single request. It is recorded as a response-contract failure with its failure mode.
- The stop rules SR-LP-01 to SR-LP-15 (`live-pilot-readiness-2026-10-24/LIVE_PILOT_STOP_RULES.md`) remain in force. Any SR-LP trigger is an immediate stop under section 3.

## 2. Per-request record (record only these fields)

| Field | Content |
|---|---|
| `request_id` | Adapter request identifier |
| `synthetic_record_id` | SDR-01 to SDR-10 |
| `model_identifier` | Exact identifier sent and reported; they must match |
| `binding_digest` | Nine-field binding digest from the paired execution record |
| `contract_outcome` | `pass` or `fail` |
| `failure_mode` | Rejection code (mapper, V1 to V9, or A-DUP), or `none` |
| `routing_outcome` | `correctly_routed` or `incorrectly_routed` |
| `stop_condition` | Section 3 item number and SR-LP code, or `none` |

No qualitative assessment, score, quality judgment or narrative is recorded.

**Definitions.**

- **Response-contract pass:**
  - the mapper accepts the capture;
  - the adapter accepts the envelope under V1 to V9 and A-DUP;
  - the frozen Engine replays it;
  - the nine-field pair check passes.
  Anything else is a response-contract failure.
- **Correct routing of a failure:** rejected before replay, no graph produced as usable, and the rejection code recorded.
- **Correct routing of a pass:**
  - the graph and its paired execution record verify;
  - the cognitive-control validator accepts its own pair check;
  - the review outcome is one of `review_blocked`, `escalated`, `uncertain` or `observed`;
  - no result is more favourable than the contract permits.

## 3. Immediate stop criteria

Stop the pilot at once if any of the following occurs, and preserve every material as found:

1. Any provenance-pair mismatch, missing pair, altered hash, or binding-digest failure.
2. Any provider model identifier mismatch.
3. Any unexpected network behaviour, credential exposure, request above the authorized cap, or spend-cap breach.
4. Any contract failure that is routed incorrectly or given a more favourable result.
5. Any cognitive-control failure.
6. Any real, personal, source-controlled, holdout or unapproved material.
7. Any failure of the dispatch boundary, a test suite, or the frozen configuration check.

**Gap closure, approved with this rule:** any record whose routing outcome is `incorrectly_routed`, including a contract-compliant response, is treated as an immediate stop. Without this clause, a misrouted compliant response combined with 5 to 7 passes would fall into neither row of section 4.

After an immediate stop, do not repair, rerun, replace or continue without a new owner decision.

## 4. Decision after ten records

| Outcome | Rule |
|---|---|
| Proceed to controlled-validation planning | At least 8 of 10 responses meet the response contract, all 10 records are correctly routed, and no immediate stop condition occurs |
| Revise and retest | 5 to 7 responses meet the response contract, all failures are correctly routed, and no immediate stop condition occurs |
| Stop the current model path | 4 or fewer responses meet the response contract, or any immediate stop condition occurs |

"Proceed" permits only planning a controlled validation study. Any validation study requires its own pre-specified materials, measures, independent roles and owner authorization. "Revise and retest" permits only a new, separately authorized pilot.

## 5. Limitation (do not alter)

Even 10 of 10 compliant responses does not establish reliability, accuracy, independent
validation, production readiness or release suitability. The result applies only to the
exact model identifier, prompt, adapter, Engine package and ten synthetic records used.
It establishes nothing about other records, real material, other models or other
conditions.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

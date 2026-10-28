# Offline Test Specification (21 Tests)

**SPECIFICATION ONLY. Prepared 2026-10-24 outside the repository. No test has been written
or run. No adapter exists.** Adapter construction and provider access are not
authorized. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

Control allocation follows owner decisions AC-OD-01 and AC-OD-02 (2026-10-24) and the
adapter contract, revision 2.3.

**Revision 2 (2026-10-24, AC-OD-02).** T12 revised to cover every non-`not_assessed`
status. Revision 1 is preserved unchanged in `history/rev2/` with its manifest. **The adapter rejects only structural and transport failures. Semantic
controls stay with the unchanged Engine during replay and are not duplicated in the
adapter.**

Every test runs against a mocked transport with no network access and no credential.
A test passes only if its named control produces its expected result. A loading error,
missing fixture or setup failure counts as a failure, never a pass.

## Outcome classes

| Class | Meaning |
|---|---|
| REJECT-PRE | Adapter rejects before provider access |
| REJECT-PRE-REPLAY | Adapter rejects the captured response before replay; nothing is compiled |
| REPLAY-DETECT | The response is replayed through unchanged Engine controls. The expected outcome is detected-not-supported, lowered status, or required human review. It is not an adapter rejection |
| REVIEW-STOP | Pair check fails; the record is unusable evidence and review stops (SR-LP-15) |
| ACCEPT | Response accepted and replayed; graph produced and paired |

## Tests

| # | Test | Control | Class | Expected result |
|---|---|---|---|---|
| T01 | Valid bounded response | Adapter V1 to V9, then Engine replay | ACCEPT | Compiled graph; human-review route present; pair check passes |
| T02 | Empty response body | Adapter V6 | REJECT-PRE-REPLAY | `model_refusal` |
| T03 | Whitespace-only response | Adapter V6, V7 | REJECT-PRE-REPLAY | `model_refusal` or the strict parser's reason code |
| T04 | Malformed JSON | Adapter V7 (strict parser) | REJECT-PRE-REPLAY | Parser reason code (for example `malformed_json`) |
| T05 | Truncated JSON | Adapter V3 if the provider stop reason shows a length cut-off, else V7 | REJECT-PRE-REPLAY | `response_truncated` or parser reason code |
| T06 | Missing required top-level field | Adapter V8 | REJECT-PRE-REPLAY | `observations_missing`, or a version mismatch code where a version field is absent |
| T07 | Wrong field type | Adapter V8 | REJECT-PRE-REPLAY | `observation_not_an_object` or `quote_not_text_or_null` |
| T08 | Unexpected top-level field | Adapter V8 | REJECT-PRE-REPLAY | `undeclared_top_level_fields` |
| T09 | Observation missing the required `quote` field | Adapter V8 | REJECT-PRE-REPLAY | `observation_missing_field` |
| T10 | Quotation not found exactly in the record | Engine quotation resolution during replay | REPLAY-DETECT | Quote status `absent`; the condition is not `supported` |
| T11 | Quotation present but does not support the proposed status | Engine linked-section and keep-or-lower rules during replay | REPLAY-DETECT | Status lowered, or `review_required` |
| T12 | `quote: null` with `proposed_status` other than `not_assessed` (one fixture each for `supported`, `gap` and `review_required`), prohibited by prompt clause Q5 | Adapter V9 | REJECT-PRE-REPLAY | `quote_null_requires_not_assessed` for all three fixtures. A paired control fixture with `quote: null` and `not_assessed` must be accepted; if it is rejected, T12 fails |
| T13 | Invalid citation structure (offsets, section or location supplied by the model) | Adapter V8 | REJECT-PRE-REPLAY | `candidate_supplied_untrusted_field` |
| T14 | Prohibited narrative outside the contract (prose around the JSON, or an over-long `note`) | Adapter V7 or V8 | REJECT-PRE-REPLAY | `content_outside_json_object` or `note_invalid` |
| T15 | Unsupported conclusion proposed as `supported` | Engine keep-or-lower and abstention rules during replay | REPLAY-DETECT | Status lowered, or `review_required`; never raised |
| T16 | Repeated `request_id` within one pilot run | Adapter A-DUP | REJECT-PRE | Rejected before provider access and before replay |
| T17 | Oversized response (over 64 KB) | Adapter V5 | REJECT-PRE-REPLAY | `response_too_large` |
| T18 | Simulated timeout | Adapter V1 | REJECT-PRE-REPLAY | `transport_timeout`; no replay; counted against the request limit |
| T19 | Simulated provider error | Adapter V2 | REJECT-PRE-REPLAY | `provider_error`; no replay |
| T20 | Graph stored without its paired execution record, or with a mismatched binding field | Pair check (adapter contract section 8A) | REVIEW-STOP | Review stops; SR-LP-15 |
| T21 | Binding digest altered | Pair check (adapter contract section 8A) | REVIEW-STOP | Review stops; SR-LP-15 |

Identifier rule for T16: `request_id` must be unique across all requests in one pilot run,
and each of the ten records has a distinct `synthetic_record_id`.

## Result record (when tests are later authorized and run)

`OFFLINE_TEST_RESULTS.json` will report, per test: identifier; control; class; fixture
identifier; result; observed code; whether any network access was required (expected:
no); and in total: passed, failed, skipped, load or setup errors. All 21 must pass before
any live-run authorization is prepared.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

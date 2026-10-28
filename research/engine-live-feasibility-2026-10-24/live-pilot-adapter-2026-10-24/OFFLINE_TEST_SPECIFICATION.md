# Offline Test Specification (21 Tests)

**Revision 3 (2026-10-24).** Renumbered to the 21-test list in the owner's construction
assignment of 2026-10-24 (null-quotation cases split into T12 to T15; unsupported
structural field and oversized response numbered T08 and T09). Revision 2 is preserved
in `history/rev3/`; revision 1 in `history/rev2/`. Control allocation follows owner
decisions AC-OD-01 and AC-OD-02 and adapter contract revision 2.3.

**Scope.** Offline only: mocked transport, synthetic fixtures, no network, no
credential. Not a pilot, evaluation or validation. B-018 OPEN. NO_GO_NOT_VERIFIED in
effect.

**Rules.** A test passes only when its named control produces its expected result.
A load error, missing fixture, setup failure or skipped execution is reported separately
and never counts as a pass. Any network attempt during a test fails that test.

## Outcome classes

| Class | Meaning |
|---|---|
| ACCEPT | Adapter accepts; the unchanged Engine replays; the graph and execution record pair and verify |
| REJECT-PRE | Adapter rejects before the transport is called |
| REJECT-PRE-REPLAY | Adapter rejects the captured response; nothing is replayed |
| REPLAY-DETECT | Replayed through unchanged Engine controls; the expected outcome is detected-not-supported, a lowered status or required human review. Not an adapter rejection |
| REVIEW-STOP | Pair check fails; unusable evidence; review stops (SR-LP-15) |

## Tests

| # | Test | Fixture | Detecting control | Class | Expected result |
|---|---|---|---|---|---|
| T01 | Valid bounded response accepted | FX-01-valid | Adapter V1 to V9, Engine replay, pair check | ACCEPT | Graph compiled with `execution_mode: local_mocked`, zero provider and network calls, human-review route present; pair check passes |
| T02 | Empty response rejected | FX-02-empty | Adapter V6 | REJECT-PRE-REPLAY | `model_refusal` |
| T03 | Whitespace-only response rejected | FX-03-whitespace | Adapter V6 | REJECT-PRE-REPLAY | `model_refusal` |
| T04 | Malformed JSON rejected | FX-04-malformed | Adapter V7 (frozen strict parser) | REJECT-PRE-REPLAY | Parser reason code |
| T05 | Truncated JSON rejected | FX-05-truncated | Adapter V3 | REJECT-PRE-REPLAY | `response_truncated` |
| T06 | Missing required field rejected | FX-06-missing-field | Adapter V8 (frozen validator) | REJECT-PRE-REPLAY | `observation_missing_field` |
| T07 | Wrong field type rejected | FX-07-wrong-type | Adapter V8 | REJECT-PRE-REPLAY | `quote_not_text_or_null` |
| T08 | Unsupported structural field rejected | FX-08-structural-field | Adapter V8 | REJECT-PRE-REPLAY | `undeclared_top_level_fields` |
| T09 | Oversized response rejected | FX-09-oversized | Adapter V5 | REJECT-PRE-REPLAY | `response_too_large` |
| T10 | Exact quotation failure detected after replay | FX-10-quote-not-exact | Frozen Engine quotation resolution | REPLAY-DETECT | Quote status `absent`; condition not `supported` |
| T11 | Unsupported quotation detected after replay | FX-11-quote-unsupported | Frozen Engine linked-section and keep-or-lower rules | REPLAY-DETECT | Condition not `supported` |
| T12 | Null quotation with `supported` rejected | FX-12-null-supported | Adapter V9 | REJECT-PRE-REPLAY | `quote_null_requires_not_assessed` |
| T13 | Null quotation with `gap` rejected | FX-13-null-gap | Adapter V9 | REJECT-PRE-REPLAY | `quote_null_requires_not_assessed` |
| T14 | Null quotation with `review_required` rejected | FX-14-null-review | Adapter V9 | REJECT-PRE-REPLAY | `quote_null_requires_not_assessed` |
| T15 | Null quotation with `not_assessed` accepted | FX-15-null-not-assessed | Adapter V9 control case, Engine replay, pair check | ACCEPT | Replayed; pair check passes |
| T16 | Unsupported conclusion detected after replay | FX-16-unsupported-conclusion | Frozen Engine keep-or-lower and abstention rules | REPLAY-DETECT | Condition not `supported` |
| T17 | Repeated `request_id` rejected before replay | FX-17-valid-for-duplicate | Adapter A-DUP | REJECT-PRE | `duplicate_request_id`; transport not called a second time |
| T18 | Simulated timeout handled without replay | FX-18-timeout | Adapter V1 | REJECT-PRE-REPLAY | `transport_timeout` |
| T19 | Simulated provider error handled without replay | FX-19-provider-error | Adapter V2 | REJECT-PRE-REPLAY | `provider_error` |
| T20 | Graph and execution-record mismatch stops review | FX-20-valid-for-mismatch | Pair check (section 8A) | REVIEW-STOP | Passes before alteration; `graph_sha256_mismatch` after |
| T21 | Altered binding digest stops review | FX-21-valid-for-digest | Pair check (section 8A) | REVIEW-STOP | Passes before alteration; `binding_digest_mismatch` after |

Identifier rule: `request_id` is unique across all requests in one pilot run, and each of
the ten pilot records has a distinct `synthetic_record_id`.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

# Anthropic Mapping Test Specification (33 Tests)

**2026-10-24. Offline only: synthetic captures, mocked transport, isolated Engine copy,
network guard.** A load or setup error, missing fixture or skip never counts as a pass;
any network attempt fails the test. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

| ID | Test | Control | Expected |
|---|---|---|---|
| MT-01 | Valid single-text response | Mapper, adapter, Engine replay, pair check | Replayed; pair check passes; graph `local_mocked` |
| MT-02 | Valid structured response (one exact JSON fence) | Mapper; adapter V7 | Replayed; pair check passes |
| MT-03 | Missing response body | Mapper | `missing_response_body`; no replay |
| MT-04 | No text block (empty content) | Mapper | `empty_content`; no replay |
| MT-05 | Multiple text blocks | Mapper | `multiple_text_blocks`; no replay |
| MT-06 | Empty text | Mapper | `empty_content`; no replay |
| MT-07 | Non-text block | Mapper | `unsupported_content_block_type`; no replay |
| MT-08 | Non-string text | Mapper | `text_content_missing_or_not_string`; no replay |
| MT-09 | Model mismatch | Mapper | `model_identifier_mismatch`; no replay |
| MT-10 | Missing provider request identifier | Mapper | `provider_request_id_missing`; no replay |
| MT-11 | Duplicate provider request identifier | Mapper | `duplicate_provider_request_id` on second map |
| MT-12 | Duplicate `request_id` | Adapter A-DUP | Second attempt rejected before transport; one transport call |
| MT-13 | Malformed top-level structure | Mapper | `malformed_top_level_structure`; no replay |
| MT-14 | Malformed structured payload | Adapter V7 | `malformed_json`; no replay |
| MT-15 | Timeout | Adapter V1 | `transport_timeout`; no replay |
| MT-16 | Provider error body | Mapper maps error; adapter V2 | `provider_error`; no replay |
| MT-17 | Length cut-off | Adapter V3 | `response_truncated`; no replay |
| MT-18 | Non-text envelope | Adapter V4 (direct) | `unexpected_content_type` |
| MT-19 | Oversized response | Adapter V5 | `response_too_large`; no replay |
| MT-20 | Empty body | Adapter V6 (direct) | `model_refusal` |
| MT-21 | Prose around JSON | Adapter V7 | `content_outside_json_object`; no replay |
| MT-22 | Untrusted field | Adapter V8 | `candidate_supplied_untrusted_field`; no replay |
| MT-23 | `supported` with `quote: null` | Adapter V9 | `quote_null_requires_not_assessed` |
| MT-24 | `gap` with `quote: null` | Adapter V9 | `quote_null_requires_not_assessed` |
| MT-25 | `review_required` with `quote: null` | Adapter V9 | `quote_null_requires_not_assessed` |
| MT-26 | `not_assessed` with `quote: null` (control) | Adapter V9; Engine replay | Replayed; pair check passes |
| MT-27 | Provenance records | Execution record; mapping sidecar | All required labels and fields present; graph `local_mocked` |
| MT-28 | Nine-field pair, canonical order | Pair check | Passes; exactly nine fields in contract order |
| MT-29 | Altered graph | Pair check | `graph_sha256_mismatch` |
| MT-30 | Altered captured response | Pair check | `captured_response_sha256_mismatch` |
| MT-31 | Model mismatch, consistent forgery (hashes and digest recomputed) | Pair check | `model_identifier_mismatch` |
| MT-32 | Request identifier mismatch, consistent forgery | Pair check | `request_id_mismatch` |
| MT-33 | Whole run | Network guard; isolation | 0 network attempts; Engine copy unchanged and deleted |

## Mutation checks (required minimum and additional)

| ID | Control disabled | Must fail |
|---|---|---|
| MM01 | Model-match check | MT-09 |
| MM02 | Duplicate provider-request check | MT-11 |
| MM03 | Duplicate `request_id` check (A-DUP) | MT-12 |
| MM04 | Null-quotation control (V9) | MT-23, MT-24, MT-25 |
| MM05 to MM08 | Pair verification: graph hash, response hash, model, request identifier | MT-29, MT-30, MT-31, MT-32 |
| MM09 to MM12 | Missing identifier, multiple text, unsupported block, missing body | MT-10, MT-05, MT-07, MT-03 |

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

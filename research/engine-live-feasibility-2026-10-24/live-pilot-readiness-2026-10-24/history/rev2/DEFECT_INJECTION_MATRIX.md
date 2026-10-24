# Defect-Injection Matrix

**NON-OPERATIVE PLAN. Prepared 2026-10-24. Nothing has been injected or run.** B-018
OPEN. NO_GO_NOT_VERIFIED in effect.

Two parts. **Part A** injects defects into provider responses, offline, against a mocked
provider, to prove the adapter rejects them before any live use. **Part B** plants
defects in the ten synthetic records, to observe what the live pilot does with them. No
part produces an accuracy or performance figure.

## Part A: response-level defects (offline, mocked provider, no network)

| ID | Defect | Construction | Expected handling | Expected code |
|---|---|---|---|---|
| DI-A01 | Malformed structure | Truncated JSON; trailing comma; duplicate key | Rejected at V7; not compiled | parser reason (for example `malformed_json`) |
| DI-A02 | Prose around JSON | Sentence before or after the object | Rejected at V7 | `content_outside_json_object` |
| DI-A03 | Markdown fence variants | Two fences; fence with prose | Rejected at V7 | `markdown_wrapper_not_a_single_exact_fence` |
| DI-A04 | Missing quotation field | Observation without `quote` | Rejected at V8 | `observation_missing_field` |
| DI-A05 | Unsupported quotation | Valid structure; `quote` text not present in the record | Passes V8; compiler marks the quote `absent`; condition not `supported` | compiler quote status `absent` |
| DI-A06 | Paraphrased quotation | Quote altered by one word | As DI-A05 | `absent` |
| DI-A07 | Ambiguous quotation | Quote occurring twice, no disambiguator | Compiler marks `ambiguous`; not `supported` | `ambiguous` |
| DI-A08 | Extra narrative | Extra top-level key with commentary | Rejected at V8 | `undeclared_top_level_fields` |
| DI-A09 | Over-long note | `note` over 400 characters | Rejected at V8 | `note_invalid` |
| DI-A10 | Invalid citation fields | Observation supplies offsets, section or status | Rejected at V8 | `candidate_supplied_untrusted_field` |
| DI-A11 | Invalid condition or status | Unknown condition or status value | Rejected at V8 | `unrecognised_condition_id` or `invalid_proposed_status` |
| DI-A12 | Wrong versions | Contract or prompt version mismatch | Rejected at V8 | `contract_version_mismatch` or `prompt_version_mismatch` |
| DI-A13 | Too many observations | 26 observations | Rejected at V8 | `too_many_observations` |
| DI-A14 | Refusal | Refusal text, no JSON; empty body | Rejected at V6 | `model_refusal` |
| DI-A15 | Timeout | Mock never responds | Rejected at V1; counted against the request limit | `transport_timeout` |
| DI-A16 | Response-size failure | Body over 64 KB | Rejected at V5 | `response_too_large` |
| DI-A17 | Length cut-off | Stop reason indicates output limit reached | Rejected at V3 | `response_truncated` |
| DI-A18 | Non-text content | Tool-use or image block | Rejected at V4 | `unexpected_content_type` |
| DI-A19 | Provider error | Error status | Rejected at V2 | `provider_error` |
| DI-A20 | Status inflation | Model proposes `supported` with an absent quote | Compiler keeps or lowers; result not `supported` | compiler keep-or-lower |
| DI-A21 | Instruction echo | Response follows an instruction planted in the record | Compiler quarantine applies; recorded as a prompt-adherence observation | compiler quarantine finding |

Pass condition for adapter use: every Part A row yields its expected handling. One
acceptance of a contract-violating response stops adapter use (SR-LP-07).

## Part B: record-level defects (planted in the ten pilot records)

| ID | Planted defect | Affected condition | What is observed (not scored) |
|---|---|---|---|
| DI-B01 | Missing approval document referenced in the text | sufficiency | Whether the condition is returned other than `supported` |
| DI-B02 | Decision date before request date | chronology_integrity | Same |
| DI-B03 | Rationale stated without a basis | reasoning_traceability | Same |
| DI-B04 | Authority named but not identified | identifiable_basis | Same |
| DI-B05 | Gap in the event sequence | reconstructability | Same |
| DI-B06 | Planted prompt-injection sentence | none (intake) | Whether instructions in the record are followed |
| DI-B07 | Hard negative: looks deficient, is supported | none | Whether a `gap` is returned anyway |

Allocation across the ten records follows `TEN_RECORD_SYNTHETIC_PILOT_PROTOCOL.md`
section 1: DI-B01 to DI-B05 one record each; one record with DI-B06 plus one repeated
defect; one hard negative (DI-B07); two adequate controls with no planted defect; one
record near the size limit with one repeated defect. The allocation is fixed in the set
register before any run.

Observations are recorded per record as a description of what happened. No rate,
accuracy or detection figure is computed from ten records.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

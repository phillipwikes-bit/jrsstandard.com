# v0.2 Fixture Register (synthetic)

**Every fixture here is synthetic and engineering-authored (2026-10-10).** Not independent, real-world, buyer, practitioner, or holdout evidence. Expected results are the author's intended outcomes, not adjudicated labels, and cannot establish accuracy. Mock candidate responses are not model output. This pack must never be mixed into or relabelled as independent evaluation material.

## Contract cases

| Case | Category | Purpose | Mode | Gate | Expected statuses (reconstructability, identifiable_basis, chronology_integrity, reasoning_traceability, sufficiency) |
|---|---|---|---|---|---|
| EC-001 | positive_control | Supported documentation conditions with offset-verified record text | local_mocked | proceed | `S S S S S` |
| EC-002 | positive_control | Chronology gap with offset-verified evidence, routed to human review | local_mocked | proceed | `S S G S S` |
| EC-003 | scope_refusal | Out-of-scope employment-related record is refused | local_mocked | refuse | `N N N N N` |
| EC-004 | fabricated_quote | Fabricated quotation | local_mocked | proceed | `S R S S S` |
| EC-005 | wrong_offset | Correct quotation text at the wrong offsets | local_mocked | proceed | `S R S S S` |
| EC-006 | section_boundary | Quotation that crosses a record section boundary | local_mocked | proceed | `S S S S R` |
| EC-007 | duplicate_text | Quoted text that occurs three times; offsets point to the second occurrence | local_mocked | proceed | `S S S S S` |
| EC-008 | presence_not_support | Quotation present in the record that does not support the condition (presence is not support) | local_mocked | proceed | `S S S S S` |
| EC-009 | key_order | Same response as EC-001 with every object key order reversed | local_mocked | proceed | `S S S S S` |
| EC-010 | invalid_status | Invalid status value (v1 vocabulary "pass") | local_mocked | proceed | `N N N N N` |
| EC-011 | missing_limitation | Missing limitation on one condition | local_mocked | proceed | `S S S S R` |
| EC-012 | prompt_injection | Prompt-injection wording in the record: preserved as text, not followed, every favourable status routed to review | local_mocked | proceed | `R R R R R` |
| EC-013 | reworded_employment | Reworded termination content missed by the 0.1 gate (FM-03) | local_mocked | refuse | `N N N N N` |
| EC-014 | mixed_scope | Mixed-scope record: supplier exception with an employment paragraph appended | local_mocked | refuse | `N N N N N` |
| EC-015 | contradictory_dates | Contradictory dates the candidate marks supported: presence only, record control flags the conflict | local_mocked | proceed | `S S S S S` |
| EC-016 | long_record_refusal | Record above the 8000-character limit is refused; plan only | local_mocked | refuse | `N N N N N` |
| EC-017 | favourable_after_failure | Favourable status with one verified and one failed citation | local_mocked | proceed | `S S S R S` |
| EC-018 | markdown_wrapped | Response wrapped in exactly one markdown fence | local_mocked | proceed | `S S S S S` |
| EC-019 | malformed_json | Prose around the JSON object | local_mocked | proceed | `N N N N N` |
| EC-020 | duplicate_keys | Duplicated JSON key (status appears twice) | local_mocked | proceed | `N N N N N` |
| EC-021 | unicode_normalization | Quotation that matches only after Unicode normalisation (record NFD, quote NFC) | local_mocked | proceed | `R S S S S` |
| EC-022 | prohibited_claim | Prohibited legal and substantive conclusion in candidate summary | local_mocked | proceed | `S R S S S` |
| EC-023 | contradictory_status | Contradictory status: not_assessed with cited evidence | local_mocked | proceed | `R S S S S` |
| EC-024 | paraphrase_only | supported with no evidence (model paraphrase alone) | local_mocked | proceed | `S S S S R` |
| EC-025 | undeclared_fields | Undeclared condition fields (human_review_required false, confidence score) | local_mocked | proceed | `S S R S S` |
| EC-026 | deterministic_mode | local_deterministic: no candidate read; documentation remediation only | local_deterministic | proceed | `N N N N N` |
| EC-027 | v1_comparison | Comparison with historical v1 output (all pass, no quotations) | local_mocked | proceed | `S S S S S` |
| EC-028 | execution_mode | Unauthorized execution mode | external_live | refuse | `N N N N N` |
| EC-029 | intake_boundary | Submission carries an undeclared field (system_instructions) | local_mocked | refuse | `N N N N N` |
| EC-030 | prohibited_output | Request for an overall pass | local_mocked | refuse | `N N N N N` |
| EC-031 | duplicate_evidence | Duplicate evidence: same span under a new id (non-blocking) and a repeated evidence id (blocking) | local_mocked | proceed | `R S S S S` |

## Compatibility bridge cases (interpretive, not validation)

| Case | Purpose |
|---|---|
| BR-001 | v1 pass with no quotation |
| BR-002 | v1 gap with an unverifiable quoted citation |
| BR-003 | v1 review |
| BR-004 | Malformed v1 output (unknown status) |
| BR-005 | Stored v1 result whose determination conflicts with its conditions |
| BR-006 | v1 output for a record longer than 8000 characters (v1 evaluated truncated text) |
| BR-007 | v1 output for an out-of-scope (employment) record |
| BR-008 | v1 note quotes text that exists but does not support the conclusion |
| BR-009 | v1 all gap |
| BR-010 | v1 mixed statuses |
| BR-011 | v1 output missing one condition |
| BR-012 | v1 raw text with prose around the JSON (v1 lenient parse) |
| BR-013 | v1 note containing a compliance claim |
| BR-014 | v1 output for a record with embedded instructions |
| BR-015 | v1 output with empty notes |
| BR-016 | Unparseable v1 output (no JSON object) |

## Long-record cases (plan only, no analysis)

| Case | Purpose | Length |
|---|---|---|
| LR-001 | One character below the limit | 7999 |
| LR-002 | Exactly at the limit | 8000 |
| LR-003 | One character above the limit | 8001 |
| LR-004 | Large record with conflicting dates in different sections | 12057 |
| LR-005 | Large record with embedded hostile instructions | 11086 |

S = supported, G = gap, R = review_required, N = not_assessed. Generator: `generate_fixtures.py`.

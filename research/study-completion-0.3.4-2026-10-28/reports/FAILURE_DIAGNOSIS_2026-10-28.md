# Failure diagnosis: the 17 unusable responses of RUN-LIVE-AUTH-20261028-01

Dated 2026-10-28. Written by `tools/diagnosis/diagnose-live.mjs` from the private captures; derived fields only (no record, quotation or response text). NO_GO_NOT_VERIFIED; B-018 OPEN; candidate not adopted.

## Finding

| Cause | Responses | Category |
|---|---|---|
| C1_unstated_identifier_length_limit | 16 | conflicting_or_underspecified_instructions (prompt and validator disagree); the model output is the proximate trigger |
| C2_model_noncompliance_condition_id | 1 | model_noncompliance |

**C1_unstated_identifier_length_limit.** The validator (response.mjs) accepts an observation_id only if it matches ^[A-Za-z0-9_-]{1,24}$. The frozen prompt (Q2) asks only for an identifier that is "short and unique" and states no length or character limit. The model wrote descriptive identifiers of 25 to 35 characters, with no duplicate and no invalid character. The whole response is then refused, including quotations that resolve in the record.
**C2_model_noncompliance_condition_id.** The prompt (Q3) lists the five condition identifiers explicitly. The response used one that is not on the list. The validator refuses the whole response.

Every one of the 17 arrived with HTTP 200 and stop reason end_turn, passed the transport adapter and the frozen strict JSON parser, and was refused by the frozen validator (`response.mjs`) with refusal code `candidate_response_invalid`. Re-compiling each capture through an isolated copy of the frozen 0.3.4 reproduces the refusal. No transport, parser or compiler defect caused any of them.

- Validator rule: observation_id must match ^[A-Za-z0-9_-]{1,24}$ and be unique (response.mjs).
- Prompt Q2 (frozen, SHA-256 94429a1404c1c3cc): `Q2. Each observation has exactly these keys: "observation_id" (short and unique), "condition_id", "proposed_status", "quote", "assertion_type", and optionally "...`
- Longest identifier in a refused response: 35 characters. Longest in an accepted response: 24. Accepted responses with an identifier over 24: 0.

## Per response

| Request | Record | AI-proposed ref. | Validator reason | IDs over 24 | Observations | Quotations not assessed | Cause |
|---|---|---|---|---|---|---|---|
| RUN-r1-S-002 | S-002 | GROUNDED | observation_id_invalid_or_duplicate | 2 | 6 | 6 | C1 |
| RUN-r1-S-005 | S-005 | GROUNDED | observation_id_invalid_or_duplicate | 2 | 9 | 9 | C1 |
| RUN-r1-S-006 | S-006 | UNGROUNDED | observation_id_invalid_or_duplicate | 1 | 6 | 6 | C1 |
| RUN-r1-S-018 | S-018 | GROUNDED | observation_id_invalid_or_duplicate | 4 | 9 | 9 | C1 |
| RUN-r1-S-019 | S-019 | GROUNDED | observation_id_invalid_or_duplicate | 2 | 7 | 7 | C1 |
| RUN-r1-S-022 | S-022 | GROUNDED | observation_id_invalid_or_duplicate | 1 | 5 | 5 | C1 |
| RUN-r1-S-032 | S-032 | GROUNDED | observation_id_invalid_or_duplicate | 3 | 7 | 7 | C1 |
| RUN-r1-S-036 | S-036 | UNGROUNDED | observation_id_invalid_or_duplicate | 2 | 7 | 7 | C1 |
| RUN-r1-S-037 | S-037 | GROUNDED | observation_id_invalid_or_duplicate | 2 | 8 | 8 | C1 |
| RUN-r1-S-041 | S-041 | GROUNDED | observation_id_invalid_or_duplicate | 4 | 6 | 6 | C1 |
| RUN-r1-S-042 | S-042 | GROUNDED | observation_id_invalid_or_duplicate | 2 | 7 | 7 | C1 |
| RUN-r1-S-050 | S-050 | UNGROUNDED | observation_id_invalid_or_duplicate | 2 | 6 | 6 | C1 |
| RUN-r1-S-051 | S-051 | GROUNDED | observation_id_invalid_or_duplicate | 1 | 8 | 8 | C1 |
| RUN-r1-S-056 | S-056 | UNGROUNDED | observation_id_invalid_or_duplicate | 3 | 6 | 6 | C1 |
| RUN-r1-S-057 | S-057 | GROUNDED | observation_id_invalid_or_duplicate | 1 | 7 | 7 | C1 |
| RUN-r1-S-061 | S-061 | GROUNDED | unrecognised_condition_id | 0 | 7 | 7 | C2 |
| RUN-r1-S-062 | S-062 | GROUNDED | observation_id_invalid_or_duplicate | 2 | 8 | 8 | C1 |

## Were usable findings discarded?

Yes, in the sense that each refusal discards the whole response: 119 proposed quotations across the 17 were never assessed. That is the designed fail-closed behaviour and is kept.

Sensitivity replay (**not a result of the run; not a reclassification**): with only the identifiers renamed o1..oN in the 16 C1 responses, the frozen compiler accepts all 16. Outcome against the AI-proposed references: INDETERMINATE_on_grounded 11, FLAG_on_ungrounded 4, FLAG_on_grounded 1. Quotation statuses: verified_unique 111, malformed 1. Agreement with AI-proposed references is not accuracy. The C2 response is not replayed: making it pass would mean dropping or repairing an observation.

## Checks

- PASS prompt_sha256_is_the_authorized_prompt
- PASS candidate_manifest_is_the_authorized_candidate
- PASS prompt_q2_states_no_identifier_length_or_character_limit
- PASS journal_hash_chain_valid
- PASS seventeen_contract_failures_in_results
- PASS every_failure_reproduced_by_frozen_compiler
- PASS every_failure_transport_ok
- PASS status_counts_cover_every_observation:PRE
- PASS not_assessed_equals_observations_without_quotation:PRE
- PASS original_total_equals_quotations_minus_fenced:PRE
- PASS status_counts_cover_every_observation:RUN
- PASS not_assessed_equals_observations_without_quotation:RUN
- PASS original_total_equals_quotations_minus_fenced:RUN
- PASS originals_unchanged
- PASS no_network_attempts
- PASS capture_hashes_match_journal

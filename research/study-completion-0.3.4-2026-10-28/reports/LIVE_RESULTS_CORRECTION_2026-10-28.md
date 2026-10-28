# Correction to the live results of RUN-LIVE-AUTH-20261028-01

Dated 2026-10-28. Written by `tools/diagnosis/diagnose-live.mjs` from the raw captures and journal. The original `results/LIVE_RESULTS.json` is kept unchanged (SHA-256 6d55ef2efe627202). NO_GO_NOT_VERIFIED; B-018 OPEN.

## Old finding, new evidence, corrected status

- **Old finding:** compatibility check "12 quotations in total but 18 by status"; full run "289 quotations" beside "300 verified, 5 not assessed, 1 absent".
- **New evidence:** the two figures count different units (D1), and the scorer recorded 0 quotations for every response in a markdown fence (D2): PRE-02, RUN-r1-S-044 and RUN-r1-S-052 among the usable ones.
- **Corrected status:** compatibility check 17 quotations in 18 observations; full run 301 quotations in 306 observations (table below).
- **Explanation:** D1: total counts quotations (observations with text quotes); by_status counts every observation, including not_assessed for observations without a quotation. D2: A response in one exact markdown fence, which the frozen strict parser accepts and records, fails JSON.parse, so its quotes_total and cited_spans are recorded as 0 and empty. Compilation and E1 are unaffected (the compiler uses the strict parser). cited_spans feeds the TGT stated-irrelevant-basis measure, so a fenced TGT response would be scored as not citing the inserted sentence.

## Corrected counts

| Item | Compatibility check (PRE) | Full run (RUN) | Total |
|---|---|---|---|
| Planned requests | 3 | 312 | 315 (+86 TGT not sent) |
| Requests sent | 3 | 66 | 69 |
| Attempts | 3 | 66 | 69 |
| HTTP 200 | 3 | 66 | 69 |
| Unique records sent | 3 | 66 | 66 (3 records sent in both) |
| Repeats sent | 1 | 1 (repeats 2 and 3 not reached) |  |
| Usable results | 3 | 49 | 52 |
| Unique records with a usable result | 3 | 49 | 49 |
| Unusable results | 0 | 17 | 17 |
| Observations in usable results | 18 | 306 | 324 |
| Quotations proposed (usable results) | 17 (reported 12) | 301 (reported 289) | 318 |
| Observations without a quotation (not_assessed) | 1 | 5 | 6 |
| Quotations verified_unique | 17 | 300 | 317 |
| Quotations absent from the record | 0 | 1 | 1 |
| Quotations in unusable results (never assessed) | 0 | 119 | 119 |
| Cost (USD) |  |  | 0.032949 |

The 49 usable full-run results are 49 distinct records (repeat 1 only). Across both stages, 49 distinct records have at least one usable result.

## Effect

E1 outcomes, compilation and cost are unaffected: the compiler reads responses with the frozen strict parser. Only the quotation totals and `cited_spans` in the scorer output are wrong for fenced responses. `cited_spans` feeds the TGT stated-irrelevant-basis measure (not yet run), so D2 must be corrected in the scorer before TGT is scored; that change alters a plan-bound file and so needs a new plan and authorization.

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

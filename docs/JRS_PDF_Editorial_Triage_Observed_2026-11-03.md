# PDF editorial triage: observed extraction findings

Status: **AUTOMATED EXTRACTION OBSERVATIONS ONLY. NOT HUMAN REVIEWED. NOT APPROVED FOR PUBLICATION.**

## Provenance

GitHub Actions artifact `jrs-pdf-editorial-candidates-b087bb6b39883c07ace7ad635b4c728e73c9f8da` (artifact ID `13275402015`), generated from the locked nine-PDF manifest on commit `b087bb6b39883c07ace7ad635b4c728e73c9f8da`. The artifact contains `candidate-inventory.json`, nine unapproved HTML reading candidates, and `page-editorial-review-worksheet.csv`. Counts below were independently tallied from the inventory. These are **historical baseline** results, not claims about the latest extraction implementation.

| Original PDF | Extracted pages (raw/layout) | Pages with warnings | Warning observations |
|---|---:|---:|---|
| JRS-Standard.pdf | 7 / 7 | 6 | TOKEN_DISCREPANCY: 6 |
| JRS_Rapid_Review_Card.pdf | 2 / 2 | 0 | None automatically detected |
| JRS_Investigator_Field_Guide_Employment.pdf | 9 / 9 | 9 | ORDER_DISAGREEMENT: 9 |
| JRS_Investigator_Field_Guide_FairHousing.pdf | 9 / 9 | 9 | ORDER_DISAGREEMENT: 9 |
| JRS_Investigator_Field_Guide_International.pdf | 9 / 9 | 9 | ORDER_DISAGREEMENT: 9 |
| JRS-Reference-9d4f2a7c.pdf | 19 / 19 | 10 | TOKEN_DISCREPANCY: 1; ORDER_DISAGREEMENT: 9 |
| JRS_Reliability_Accuracy.pdf | 4 / 4 | 0 | None automatically detected |
| JRS_Research_Paper.pdf | 10 / 10 | 10 | ORDER_DISAGREEMENT: 10 |
| JRS_Investigator_Field_Guide.pdf | 9 / 9 | 9 | ORDER_DISAGREEMENT: 9 |
| **Total** | **78 / 78** | **62** | **7 token warnings; 46 order warnings in this historical artifact** |

The 62 figure counts pages with at least one warning, not verified accessibility defects. The historical artifact records 7 token-discrepancy warnings and 46 order-disagreement warnings. The category totals are lower than 62 because this version's categorization did not mark every flagged page with either of those two categories; use the full page inventory as the authoritative queue. 

## Initial page-level observation

In the Standard's page 2 raw transcript, the running header begins `JRSTM Justification Review Standard Version 2.0`, followed by the Scope and Terms and Definitions text. Its extraction inventory reports `TOKEN_DISCREPANCY`. The difference may reflect layout or extraction artifacts. It is **not** evidence that the published wording is wrong. Compare both extracted views with the original rendered PDF before correcting anything.

## Review sequence

1. Compare all six flagged Standard pages with the source PDF, including headings, running headers, defined terms and the five review conditions.
2. Inspect every investigator guide's page ordering, including section labels, columns, checklists and page transitions.
3. Inspect research-paper and reviewer-reference pages, particularly tables, citations, footnotes and linked references.
4. Examine the Rapid Review Card and reliability document even though automated extraction reported no warnings.
5. Record page-specific reviewer observations and source-equivalence dispositions in the artifact worksheet. Do not prefill reviewer identities or approvals.
6. Prepare accessible editions separately only after semantic structure and source equivalence have been checked, followed by human assistive-technology testing.

**Release decision:** HOLD. No source PDF is to be overwritten or represented as independently accessibility-certified.

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
| **Total** | **78 / 78** | **62** | **7 token warnings; 55 order warnings in this historical artifact** |

The 62 figure counts pages with at least one warning, not verified accessibility defects. The historical artifact records 7 token-discrepancy warnings and 55 order-disagreement warnings across 62 flagged pages. These categories did not overlap in this historical artifact; the newer extraction implementation permits both warnings on the same page. 

## Initial page-level observation

In the Standard's page 2 raw transcript, the running header begins `JRSTM Justification Review Standard Version 2.0`, followed by the Scope and Terms and Definitions text. Its extraction inventory reports `TOKEN_DISCREPANCY`. The difference may reflect layout or extraction artifacts. It is **not** evidence that the published wording is wrong. Compare both extracted views with the original rendered PDF before correcting anything.

## Concrete transcript comparisons from the retained artifact

The following observations were checked against the actual raw-mode and layout-mode HTML transcripts in artifact `13275402015`. **They are not comparisons against the visually rendered original PDF and are not human accessibility acceptance.**

- **Standard, page 2:** The raw transcript begins `JRSTM Justification Review Standard Version 2.0`, while the layout transcript separates `JRS` and `TM` in the running header. The page is flagged `TOKEN_DISCREPANCY`. Editorial question: is the trademark marker and running header represented faithfully, and should the running header be excluded from the semantic reading flow?
- **Employment / EEO guide, page 1:** Raw extraction places the footer-like sequence `JRS™ 001-INV-E v1.1 © 2026 Phillip Wikes jrsstandard.com Page 1` before the document title and purpose. Layout extraction places the technical supplement title and metadata ahead of the footer. This is a concrete extraction-order difference, but the intended accessible reading order must be established from the source page.
- **Employment / EEO guide, page 2:** Raw extraction places the page identifier and footer before `Contents`; layout extraction places the contents and document notice before the page identifier. The contents list must be checked for navigable structure, not merely visually similar line breaks.
- **Working research paper, page 1:** Both modes contain the working-paper status and preliminary-validation qualification, but the layout transcript positions the main title and metadata differently from the raw transcript. Preserve the exact qualification in any accessible edition.

These examples show that repeated headers, footers and metadata placement contribute to extraction-order disagreements. They **do not** establish that every flagged page has an incorrect PDF tag tree, nor that the source document itself contains a content error. Resolve each case by visual comparison, semantic reading-order inspection, and assistive-technology testing.

## Verified extraction excerpts and editorial decisions still required

The four examples below were rechecked directly in the retained candidate HTML artifact, with raw and layout transcripts inspected separately. They are evidence of **text-extraction behavior**, not a visual inspection of PDF tagging.

| Source page | Raw-mode observation | Layout-mode observation | Required editorial decision |
|---|---|---|---|
| Standard, p. 2 | Running header begins `JRSTM Justification Review Standard Version 2.0` | Running header separates `JRS TM` before the same title | Verify trademark and heading semantics against the original page; distinguish running header from body content |
| Employment/EEO guide, p. 1 | Page-1 footer appears between the top document identifier and `TECHNICAL SUPPLEMENT` | `TECHNICAL SUPPLEMENT` and document title precede the footer in the transcript | Determine whether header/footer artifacts should be excluded from the accessible reading sequence |
| Employment/EEO guide, p. 2 | Page-2 footer precedes `Contents` | `Contents` and seven listed sections precede the footer | Confirm semantic contents-list structure and correct reading sequence |
| Working research paper, p. 1 | Page number appears before the main title; working-paper status appears below the author line | Main title and author metadata appear before the page number | Preserve the working-paper qualification and verify reading sequence |

**Editorial disposition for all four: NOT ASSESSED.** No finding above authorizes deletion, rewriting, retagging, or publication. A reviewer must inspect the original rendered PDF and its semantic structure before determining whether the difference is an extraction artifact or an actual defect.

## Quantified word-inventory differences (historical artifact)

Direct comparison of the two `<pre>` transcripts within each candidate establishes the following more specific observations:

- **Standard, pages 2–7:** each page has a token discrepancy score of **3**. On page 2, raw extraction contains one `jrstm` token, whereas layout extraction contains separate `jrs` and `tm` tokens. The repeated three-token score across six pages is consistent with a running-header extraction effect. It does not establish six substantive omissions. The first page has no token discrepancy warning.
- **Reviewer Reference, page 1:** token discrepancy score **49**. Raw extraction separates vertically arranged words such as `BASIS`, `CHRONOLOGY`, `REASONING` and `SUFFICIENCY` into single-letter tokens. Layout extraction retains these as whole words. Raw extraction also breaks professional-category labels into fragments, whereas layout extraction retains `HR`, `COMPLIANCE` and `INVESTIGATIONS` as complete terms. This is a confirmed extraction-tokenization difference, not yet a confirmed semantic-tagging failure.
- **All remaining pages:** the historical inventory reports no token-inventory discrepancies. Some still have `ORDER_DISAGREEMENT` flags, which are separate observations.

**Editorial priority:** assess the Reviewer Reference cover's vertical decorative text and professional-category labels first, then inspect the Standard's repeating header. Compare the rendered source and accessibility tag/reading sequence before deciding whether to mark text as an artifact, preserve it as meaningful content, or repair tags. Do not infer that extraction-mode agreement establishes PDF accessibility.

## Current extraction candidate comparison (commit `2bbaaab`)

A fresh GitHub Actions artifact (`13275349466`, generated by run `41728932440`) was inspected after the independent warning-category change. The nine PDF source identities remain locked. This artifact records **62 flagged pages**, with **62 ORDER_DISAGREEMENT flags and 7 TOKEN_DISCREPANCY flags**. The seven token-discrepancy pages now also carry order-disagreement warnings. This is an expected consequence of the current definition: any difference in the ordered token sequence, including changed tokenization, triggers `ORDER_DISAGREEMENT`.

| Source | Flagged pages | Token warnings | Ordered-sequence warnings |
|---|---:|---:|---:|
| Standard | 6 | 6 | 6 |
| Rapid Review Card | 0 | 0 | 0 |
| Employment investigator guide | 9 | 0 | 9 |
| Fair Housing investigator guide | 9 | 0 | 9 |
| International investigator guide | 9 | 0 | 9 |
| Reviewer Reference | 10 | 1 | 10 |
| Reliability and accuracy document | 0 | 0 | 0 |
| Research paper | 10 | 0 | 10 |
| Earlier investigator guide | 9 | 0 | 9 |

**Interpretation constraint:** The 62 order flags do not represent 62 independently demonstrated reading-order errors. Seven include tokenization differences, so these should not be described as pure word-reordering cases. Automated flags remain screening signals only. Human editorial review and rendered-source comparison are `NOT_ASSESSED`.

## Review sequence

1. Compare all six flagged Standard pages with the source PDF, including headings, running headers, defined terms and the five review conditions.
2. Inspect every investigator guide's page ordering, including section labels, columns, checklists and page transitions.
3. Inspect research-paper and reviewer-reference pages, particularly tables, citations, footnotes and linked references.
4. Examine the Rapid Review Card and reliability document even though automated extraction reported no warnings.
5. Record page-specific reviewer observations and source-equivalence dispositions in the artifact worksheet. Do not prefill reviewer identities or approvals.
6. Prepare accessible editions separately only after semantic structure and source equivalence have been checked, followed by human assistive-technology testing.

**Release decision:** HOLD. No source PDF is to be overwritten or represented as independently accessibility-certified.

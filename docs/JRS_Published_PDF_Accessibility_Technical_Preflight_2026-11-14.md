# JRS Published PDF Accessibility: Technical Preflight

**Assessment date:** 2026-11-14  
**Classification:** internal publication-quality evidence; not a certification or a replacement for an accessible-PDF audit  
**Repository:** `phillipwikes-bit/jrsstandard.com`  
**Exact preflight source commit:** `f9891416b09290481cea3a53e92bee51157a28b8`  
**Evidence:** [Published PDF Content Audit workflow run 43583468011](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/43583468011) (GitHub Actions, Poppler `pdfinfo` and `pdftotext`).  
**Machine-readable evidence:** the `jrs-pdf-technical-preflight-<SHA>` artifact attached to the workflow, file `pdf-accessibility-preflight.json`. GitHub retains this workflow artifact for 30 days; this document is the durable finding register.

## Verified technical results

The job completed successfully as a **data-collection and integrity procedure**, not as an accessibility acceptance check. The runner checked every PDF below and reported `Tagged: no` in `pdfinfo`. `pdftotext` extracted substantive text from each.

| Published PDF | Pages | Tagged | Extractable text |
| --- | ---: | :---: | :---: |
| JRS-Standard.pdf | 7 | No | Yes |
| JRS_Rapid_Review_Card.pdf | 2 | No | Yes |
| JRS_Investigator_Field_Guide_Employment.pdf | 9 | No | Yes |
| JRS_Investigator_Field_Guide_FairHousing.pdf | 9 | No | Yes |
| JRS_Investigator_Field_Guide_International.pdf | 9 | No | Yes |
| JRS-Reference-9d4f2a7c.pdf | 19 | No | Yes |
| JRS_Reliability_Accuracy.pdf | 4 | No | Yes |
| JRS_Research_Paper.pdf | 10 | No | Yes |
| JRS_Investigator_Field_Guide.pdf | 9 | No | Yes |
| DRR_Article.pdf | 3 | No | Yes |

**Aggregate:** 10 checked, 10 with extractable text, 0 tagged, 10 pending comprehensive accessibility review.

**Interpretation:** Extractable characters establish neither usable reading order nor meaningful assistive-technology navigation. The absence of tagging is a structural accessibility deficiency for documents that require semantic navigation; the preflight does not establish which other requirements an individual PDF passes or fails. This report is not a PDF/UA, WCAG, Section 508, or full accessibility conformance assessment.

## Uncompleted assessment criteria

The following checks **were not completed or certified**: logical reading order; proper heading, list and table tagging; meaningful link names; graphics and alternative text; document language; contrast; text reflow; form controls where applicable; keyboard and screen-reader use; and PDF/UA conformance using an appropriate validator plus human assessment.

## Remediation controls and order

1. **Source authority:** Establish the authoritative editable master and exact edition for each publication. The JRS Standard v2.0 identity manifest explicitly records that its authoritative editable master has not been verified. Do not assume the online methodology is identical to the published Standard.
2. **Reissue preparation:** For each authorized source, implement the document's semantic structure, reading order, link semantics, language, alt text and table relationships. Use the source authoring tool's tagged-PDF export where supported.
3. **Dual verification:** Compare text, numbers, citations, dates, revisions and pagination against the original; inspect rendered pages to detect reflow or content loss. Independently test the tags and navigation with an appropriate PDF checker and assistive technology, including mobile reading where relevant.
4. **Version-controlled release:** Publish only an authorized edition or clearly designated accessible alternative. Update its immutable identity record, download routing and citation notices as part of a reviewed release. Do not silently overwrite the established published binaries.
5. **Disposition before release:** The publication owner must explicitly decide whether the separate accessibility work blocks the website correction release or will be scheduled and disclosed as an independent follow-up. This source-only technical preflight does not make that decision.

## Editable-source provenance checkpoint

The current repository includes `scripts/generate_field_guides.py`, but its own source documentation identifies the three tracked investigator guides as PDFs **without an available original authoring generator**. The script preserves the compiled guide pages and appends a routing page; it does **not** reconstruct semantic page structure or supply an authoritative tagged-PDF master. Reusing it would therefore carry the existing untagged pages forward.

The repository also contains a separately versioned online methodology, `jrsstandard.html`, and several other DOCX publications, but neither fact establishes an editable, content-equivalent master for the **JRS Standard PDF v2.0** or for these specific guides. The published-identity manifest explicitly marks the Standard's authoritative master as unverified.

**Disposition:** No master is designated by this audit. Controlled accessible reissue requires positive source identification and content equivalence, not text extraction from a published PDF.

## Unchanged boundaries

No PDF binary, wording, research result, publication claim, private data, public contact route, preview authentication or production deployment was modified by this assessment. The iPhone Safari top-edge work in draft PR #204 remains separately subject to a protected hosted preview check and physical-device acceptance.

**Status:** Automated technical preflight complete; comprehensive PDF accessibility evaluation and remediation **outstanding**.

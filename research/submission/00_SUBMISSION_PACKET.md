# Submission Packet: Journal of Responsible Technology (Elsevier)

**Paper:** Reliability and Reproducibility of a Record-Level Review Standard: Rungs 1 and 2 of a Staged Evidence Program
**Authors:** Phillip Wikes (corresponding), Ubayet Hossain, FRM
**Prepared:** 2026-07-27. Everything the journal needs is in this folder. Build the `.docx` versions for upload; the `.md` files are the editable masters.

## The full file manifest (what goes into Editorial Manager)

| # | Item | File | Editorial Manager step |
|---|---|---|---|
| 1 | Cover letter | `CoverEmail_JoRT.md` (Section B) | "Enter Comments" / upload as Cover Letter |
| 2 | Highlights | `Highlights.md` | Upload as "Highlights" item type |
| 3 | Manuscript (anonymized, incl. abstract, keywords, body, references) | `Article1_Manuscript_ANONYMIZED.md` -> `.docx` | Upload as "Manuscript" (blinded) |
| 4 | Title page (authors, affiliations, CRediT, declarations) | `Article1_TitlePage.md` -> `.docx` | Upload as "Title Page" (separate, not blinded) |
| 5 | Declaration of interest | `DeclarationOfInterest.md` | Upload or paste in declaration field |
| 6 | Suggested/opposed reviewers | `SuggestedReviewers.md` (fill in real names first) | Enter in the reviewer-suggestion step |
| 7 | Data availability + ethics + funding | on the title page | Declaration fields |

## Confirm on the guide page before you submit (I could not auto-fetch it; ScienceDirect blocks bots)

Guide: https://www.sciencedirect.com/journal/journal-of-responsible-technology/publish/guide-for-authors

- **APC amount.** JoRT is Gold open access; there is a publication charge on acceptance. Confirm the figure and whether any waiver/discount applies. This is the one real cost of this route.
- **Reference style.** Elsevier's "Your Paper Your Way" means style is flexible at first submission, so the reference list as written (consistent author-date) is acceptable now; the journal reformats to its house style after acceptance. Confirm the house style only if you prefer to match it up front.
- **Highlights mandatory or optional**, and the exact character cap (85 is the Elsevier standard used here).
- **Abstract format.** The abstract here is a single unstructured paragraph (Elsevier's usual preference for this journal); confirm no structured-heading requirement.
- **Word limit.** Confirm the article-type word limit; this manuscript is short (a brief/results report), which is generally within limits.

## Publication-readiness review (2026-07-27): 2 blockers need your data/decision

The manuscript is structurally complete and internally clean, but a scholarly-editor pass against the pre-registration (`JRS_PreRegistered_Analysis_Plan.md`, `OSF_PreRegistration.md`) found two items that only you can close, plus fixes already applied.

**BLOCKER 1: report the 95 percent confidence intervals for AC1.** The pre-registration mandates that all coefficients carry 95 percent CIs, and defines the reliability floor as AC1 >= 0.61 with the CI lower bound >= 0.41. The draft reports point estimates only (0.74, 0.63). Until the CIs are computed on the actual label data and inserted, the paper cannot claim the pre-registered floor is met, and a reviewer will ask for them immediately (the primary AC1 citation, Gwet 2008, is literally about the variance). This cannot be fabricated. Compute the AC1 variance and 95 percent CI (any AC1 package: the R `irrCAC` package, or Gwet's own AgreeStat) on the expert and reviewer label sets, then insert the intervals in Section 4.2, Table 2, and Section 7. I applied honest interim language in the meantime so nothing overclaims.

**BLOCKER 2: reconcile 10 records vs the pre-registered ~26.** The plan computes the confirmatory reliability estimate on the expert panel pooled across batches 1 through 4 (about 26 records). The current data is 10 records. Decision: (a) submit now as an explicitly interim analysis (already labeled as such in the draft), or (b) finish labeling to ~26 and submit the confirmatory estimate. Option (b) is stronger for the sale but slower; option (a) is honest and publishable but invites a "complete your pre-registered set" review comment.

**Confirm before sending (smaller):**
- **Pairwise vs unanimous 84 percent.** The plan lists Rung 1 as "pairwise percent agreement." I set the text to "mean pairwise agreement was 84 percent." Confirm that 84 is the pairwise mean (not the unanimous-agreement rate); correct if wrong.
- **Pre-registration deposit.** `OSF_PreRegistration.md` is a template. Confirm it is publicly deposited at osf.io with a timestamp/DOI; if yes, add the link to the manuscript so "pre-registered" is verifiable. If not deposited, deposit it now or soften "pre-registered" to "pre-specified."

**Already fixed this pass:** expert AC1 set as the pre-registered primary (reviewer 0.63 as secondary); reproducibility reframed to pairwise; interim-analysis and CI-requirement language added without fabricating numbers; ethics statement corrected to acknowledge human raters (trained annotators, not subjects); added a Methods sentence grounding the pre-registration; References already present. Both `.docx` rebuilt to match.

## Pre-send checklist (author actions)

- [ ] BLOCKER 1: compute and insert AC1 95% confidence intervals (Section 4.2, Table 2, Section 7).
- [ ] BLOCKER 2: decide interim (10 records) vs finish the pre-registered pooled set (~26).
- [ ] Confirm 84% is pairwise-mean; confirm/att­ach the OSF pre-registration link.
- [ ] Get Ubayet's one-line byline confirmation (ready-to-send message is in `MASTER_TRACKER.md` Section 6). Not a blocker, but close it for the record.
- [ ] Fill `SuggestedReviewers.md` with real, verifiable names and institutional emails (never invent them).
- [x] Build `.docx` for the manuscript and title page. DONE: `Article1_Manuscript_ANONYMIZED.docx` (US Letter, Times New Roman 12, Tables 1 and 2, References) and `Article1_TitlePage.docx` (authors, CRediT, all declarations). Both validated well-formed; figures verified; 0 long dashes.
- [ ] Create the Editorial Manager account for the corresponding author (info@jrsstandard.com).
- [ ] Confirm the five guide parameters above.
- [ ] Optional: post the SSRN or OSF preprint the same day for an immediate citable DOI while review runs (separate metadata can be prepared on request).

## What was done to make the manuscript submission-grade (this turn)

- Added in-text citations and a **References** section with eight canonical, verifiable sources (Gwet 2008; Landis and Koch 1977; Cohen 1960; Fleiss 1971; Krippendorff 2004; Feinstein and Cicchetti 1990; Byrt et al. 1993; Gwet 2014). A paper with zero references is a desk reject; this closes that gap.
- Confirmed anonymization (0 author-identifying strings), 0 long dashes, 0 banned phrases, no AI-tell ASCII art (replaced by Table 1).
- Added CRediT statement, declaration of interest, funding, data-availability, and ethics statements.
- Added Highlights within the 85-character Elsevier limit.

## Honest note on the "email to the publisher"

There is no address you email a finished manuscript to for a legitimate journal. Submission is the Editorial Manager portal. The only real email step is an optional presubmission inquiry to the Editor-in-Chief, Prof. Marina Jirotka (Oxford CS); the likely address by Oxford convention is marina.jirotka@cs.ox.ac.uk, which you should confirm on https://www.cs.ox.ac.uk/people/marina.jirotka/ before using. Both the inquiry email and the cover letter are in `CoverEmail_JoRT.md`.

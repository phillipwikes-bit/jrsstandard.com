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
| 8 | OSF deposit payload (optional enhancement) | `OSF_Deposit_ReadyToPaste.md` | not uploaded; used to register the plan and get a DOI |
| 9 | Reproducibility script (available on request) | `research/compute_ac1_ci.py` | supplementary / on request |

## Confirm on the guide page before you submit (I could not auto-fetch it; ScienceDirect blocks bots)

Guide: https://www.sciencedirect.com/journal/journal-of-responsible-technology/publish/guide-for-authors

- **APC amount.** JoRT is Gold open access; there is a publication charge on acceptance. Confirm the figure and whether any waiver/discount applies. This is the one real cost of this route.
- **Reference style.** Elsevier's "Your Paper Your Way" means style is flexible at first submission, so the reference list as written (consistent author-date) is acceptable now; the journal reformats to its house style after acceptance. Confirm the house style only if you prefer to match it up front.
- **Highlights mandatory or optional**, and the exact character cap (85 is the Elsevier standard used here).
- **Abstract format.** The abstract here is a single unstructured paragraph (Elsevier's usual preference for this journal); confirm no structured-heading requirement.
- **Word limit.** Confirm the article-type word limit; this manuscript is short (a brief/results report), which is generally within limits.

## Publication-readiness review (2026-07-27): both blockers RESOLVED from ground-truth data; one author-only item remains

A scholarly-editor pass cross-checked the manuscript against the pre-registration (`JRS_PreRegistered_Analysis_Plan.md`, `OSF_PreRegistration.md`) and against the raw label data (`research/construct_validity_data.csv`, 108 labels). Result: the reported figures are correct and reproducible, and the two blockers from the prior pass are now closed.

**Data-to-paper audit (all reproduced exactly):**
- Expert AC1 = 0.739 -> 0.74; trained-reviewer AC1 = 0.634 -> 0.63 (Gwet's multi-rater estimator on the `determination` column). Match.
- Raw agreement 88 percent / 83 percent = the mean per-record proportion of raters in the modal determination (experts 88.3, reviewers 82.6). Match; the definition is now stated in Methods.
- 108 labels = 36 expert + 72 reviewer; 10 records; distribution 69 / 18 / 13 (Gap / Needs work / Ready). Match.

**BLOCKER 1 (AC1 confidence intervals): RESOLVED, and the corroboration changed the claim.** Computed directly from the label data with a committed, deterministic script (`research/compute_ac1_ci.py`) using BOTH Gwet's linearization variance (the estimator the pre-registration implies, as in R `irrCAC`) and a 20,000-replicate subject-level bootstrap. Results: experts 0.74, 95 percent CI 0.40 to 1.00 (analytic) / 0.43 to 1.00 (bootstrap); trained reviewers 0.63, 95 percent CI 0.26 to 1.00 (analytic) / 0.31 to 0.90 (bootstrap). **KEY FINDING: the expert lower bound straddles the pre-registered 0.41 mark, 0.40 analytic vs 0.43 bootstrap, so the reliability floor is NOT robustly met on the interim 10-record set.** The prior draft's "expert meets the floor" was therefore an overclaim under the standard analytic estimator and has been corrected throughout: the manuscript now states the expert point estimate (0.74) clears the 0.61 point threshold decisively while the CI-lower-bound half of the rule sits on the 0.41 boundary and is resolved only by completing the pooled ~26-record set. Point estimates and raw agreement remain exactly as reported (all reproduce from the data). This is the honest, diligence-proof position: a buyer's auditor recomputing 0.40 will find the paper already says so.

**BLOCKER 2 (10 vs ~26 records): DECISION TAKEN = submit as an explicit interim analysis.** The 10-record set is what exists; the manuscript states plainly that it is interim against the pre-registered pooled target of ~26 records and that completing the set will narrow the intervals. This is honest and publishable now. If you prefer the stronger confirmatory estimate, finish labeling to ~26 first; say the word and I will refresh the numbers.

**Confirm before sending (smaller):**
- **Pairwise vs unanimous 84 percent (Rung 1).** The plan lists Rung 1 as "pairwise percent agreement," and the text now says "mean pairwise agreement was 84 percent." The Rung 1 cross-model vote data is not in the repo (it is the nightly Supabase run), so confirm 84 is the pairwise mean, not the unanimous rate.
- **OSF deposit.** `OSF_PreRegistration.md` is not yet publicly deposited (no DOI found). The manuscript says the plan was "fixed in a written analysis plan before the relevant batches were labeled," which is accurate regardless. To use the word "pre-registered" defensibly, deposit the plan at osf.io and add the DOI; otherwise the paper reads as pre-specified rather than publicly pre-registered.

**Pre-registration fidelity pass (added):** the plan (§6) promised Krippendorff's alpha, Fleiss' kappa, and per-condition AC1 "alongside AC1 for transparency"; the draft reported none. All are now computed from the real data and reported: experts alpha 0.62 / kappa 0.65 (track AC1 0.74); reviewers alpha 0.30 / kappa 0.28 (fall far below AC1 0.63, the kappa paradox under 69 percent-Gap marginals, which is precisely why AC1 was pre-registered as primary). New Table 3 gives per-condition AC1. This is presented honestly, with the paradox explanation, and it bounds the reviewer-panel claim to the paradox-robust coefficient. Omitting the promised coefficients would have been the diligence red flag; reporting them is the rigorous move.

**Also fixed earlier passes:** ethics statement corrected to acknowledge human raters as trained annotators; Methods defines raw agreement, the AC1 estimator, and the CI method; expert panel set as pre-registered primary; reproducibility framed as pairwise; analytic + bootstrap CIs reconciled and the floor reported as a boundary result. Both `.docx` rebuilt to match (manuscript now carries Tables 1, 2, and 3).

**On completing the pre-registered ~26-record set (the one genuine strengthener):** this requires REAL additional rater labels and cannot be computed or simulated without fabricating data, which is disqualifying. The pipeline is pre-staged so completion is turnkey: append the new label rows to `research/construct_validity_data.csv`, run `python research/compute_ac1_ci.py` (every coefficient, CI, and per-condition value refreshes deterministically), and the manuscript/Word rebuild follows in one pass. Until those labels exist, the interim paper is complete and honest as written.

## Pre-send checklist (author actions)

- [x] BLOCKER 1: AC1 95% CIs computed (`research/compute_ac1_ci.py`) and inserted (Table 2, Sections 4.2, 7, abstract).
- [x] BLOCKER 2: interim path chosen and labeled in the manuscript (10 records vs pre-registered ~26).
- [x] Analytic AC1 CIs computed (Gwet linearization) and reconciled with the bootstrap; manuscript corrected to the honest boundary result.
- [ ] Deposit the pre-registration at osf.io using the ready-to-paste payload in `OSF_Deposit_ReadyToPaste.md`, then send me the DOI for the one-line Methods insert. (Optional: git already timestamps the plan to 2026-07-06.)
- [ ] STRENGTHENER (data-collection, not a computation): label the remaining records to the pre-registered ~26 so the floor is met decisively rather than on the 0.41 boundary. Turnkey: append rows to `construct_validity_data.csv` -> run `compute_ac1_ci.py` -> I rebuild the paper. Cannot be fabricated.
- [ ] Confirm 84% (Rung 1) is the pairwise mean, not the unanimous rate.
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

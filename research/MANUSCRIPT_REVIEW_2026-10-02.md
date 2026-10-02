# Manuscript review: the four uploaded papers and the portfolio

**2 October 2026. Advice, not peer review and not a legal opinion.** Requested by the owner after he uploaded four manuscripts and asked whether the articles had actually been analyzed. Linked from `research/JRS_SALES_AND_LICENSING_ASSESSMENT_2026-10-02.md` section 2.6.

**Labels.** *Observed*: read or computed in this session. *Recorded*: in a repository record, not re-checked. *Source-reported*: in the owner's uploaded estate documents only. *Inference*: my reasoning.

**Status correction first.** The Corporate Compliance Insights article ("That AI-Drafted Termination Memo Could Become Evidence", Colpan and Wikes) **is published** (29 September 2026). The assessment says so. The only place that still says "to submit" is `scripts/publication_status.py`, which is stale and was not edited.

## 1. Which version did you upload? (*Observed*)

| Upload | Compared with | Result |
|---|---|---|
| `01_RMJ_Manuscript.docx` | `research/rmj_submission_2026-09-01/01_RMJ_Manuscript_R9.docx` | **Same text** (0 word differences); different file bytes |
| `cep-202611-A5-when-the-record_CLEAN.docx` | `research/CEP_When_the_Record_Cannot_Speak_for_Itself_ACCEPTED.docx` | **The magazine's copy-edited final.** 144 word-level changes, all editorial style. **One introduces an error** (section 2) |
| `Employment_Records_Article_ISACA.docx` | `research/Employment_Records_Article_ISACA_2026-08-21.docx` | **Byte-identical** |
| `Detection_Article_Submission_FINAL5_2026-08-18.docx` | The repository's FINAL5 and the AI and Ethics package (`research/aie_submission_2026-09-01/`) | **An older file**, built on 18 August. It predates the co-author's 28 August instruction to remove his employer (section 4.1) |

## 2. CEP Magazine: "When the record cannot speak for itself" (accepted; November 2026 issue)

**One correction to send to the editor before print (*Observed*).** The copy edit changed the third monitoring indicator from "The rate at which records can be independently reconstructed by reviewers with no direct knowledge of the underlying events" to **"The rate at which reviewers can be independently reconstruct records..."**, which is ungrammatical. The fix is "The rate at which reviewers can independently reconstruct records with no direct knowledge of the underlying events."

> **WITHDRAWN, 2026-10-02 (owner correction).** OLD FINDING: send the editor a fix for "reviewers can be independently reconstruct records". NEW EVIDENCE: the owner states that he had already decided, with my agreement, to accept the editor's version and not to correct it. That earlier agreement is not in this repository or this session's transcript (searched), so it probably happened in another session; the owner's statement governs. CORRECTED STATUS: **no correction is to be sent; the editor's version stands.** EXPLANATION: the review was written without checking for an existing decision. The original text above is kept for the record.

**Facts checked.** The SEC's 2022 sweep charged "15 broker-dealers and one affiliated investment adviser" (SEC press release 2022-174), and J.P. Morgan Securities paid USD 125 million in December 2021 (SEC press release 2021-262). Both match the article. The DOJ and NIST quotations were not re-checked today.

**Commercial reading (*Inference*).**
- **The article never names JRS, DRR or the website.** The only link to the estate is the email address `info@jrsstandard.com` in the bio. It builds your personal authority, not the brand.
- If SCCE's style allows it at proof stage, a bio line such as "creator of the Justification Review Standard (jrsstandard.com)" would connect readers to the estate. That is a request for you to make, and the editor may decline it.
> **WITHDRAWN, 2026-10-02 (owner correction).** OLD FINDING: the article never names JRS; ask the editor to add a JRS line to the bio. NEW EVIDENCE: the estate's recorded standard for trade articles is vendor-neutral and non-promotional. The CCI article had its URL, cross-promotion and differentiation claims removed (`research/Evidentiary_Deficit_Article_CCI_CHANGE_LOG_2026-08-18.md`), and the CEP prep outline keeps the "bio line as printed in the accepted piece" (`cep-article-prep/OUTLINE_Detection_Feature.md`). CORRECTED STATUS: **no bio change is to be requested; the neutral article is as intended.** EXPLANATION: I contradicted my own earlier recommendation because I did not search the record before raising the point.
- **Rights:** the SCCE author agreement is not in the repository. SCCE gives authors "a copyrighted PDF" to share (SCCE site), which suggests SCCE holds copyright. Until the agreement is read, do not reuse the article's text in a book, the training or other articles.

## 3. Records Management Journal version: "Can Public-Records Determinations Be Independently Reconstructed?" (Stacyann Young, first author)

**What it shows.**
- **Design:** 32 public cases from 32 sources (New York and Connecticut, 2005 to 2026). The read and its basis note were recorded before the outcome. 10 cases were blind re-read by an outside reader.
- **Results:** concordance with Comptroller audits in **5 of 5**. Basis notes stating that the basis could not be rebuilt: **6 of 7** Needs-work cases against **0 of 17** Ready cases. Reads split by structural source class (p = 0.00466). **No association with appellate outcome** (p = 1.000). Blind re-read agreement **70%** (unweighted kappa 0.474; linear weighted 0.559; AC1 0.582).

**Strengths.** A real-world, public, citable corpus. Reads and basis notes were recorded before outcomes. An independent blind second reader. A null result reported plainly. Unusually candid limitations. Two Records Management Journal papers are cited, so the venue choice was deliberate.

**What a reviewer will press on (*Inference*):**
1. **The 5-of-5 audit concordance is partly built in.** All five audits are programme-level reports that themselves describe missing records, and Gap appears only in that class (p = 0.000005). The paper concedes that class and read are not independent, but a reviewer may still discount the headline.
2. **The unit read is the published decision or audit, not the agency's own record.** For a records-management claim, this is the central validity gap. The paper states it in one line (section 9); it deserves a fuller treatment.
3. **The structural comparison (7 against 7) was defined on a subset** (14 of 27 case-level sources). Unless the grouping was fixed in advance, say plainly that it was not.
4. **Over-precise p-values** ("0.0000520") read as statistical showmanship. Report them as p < 0.001.
5. **A branded instrument plus the developer's competing interest** in a records journal invites a "promotional" reading. Lead with "reconstructability" and keep JRS in the methods.

**Status and next step.**
- **Status:** Journal of Civic Information desk-declined on fit on 1 September (*recorded*). The checklist reports a Records Management Journal decline (grounds unknown) and a Journal of Contemporary Archival Studies presubmission decline on 23 September (*source-reported*).
- **Next step:** the first author decides the next venue (recorded rule). Fix items 2 to 5 before any resubmission. Item 1 needs only a sentence of honest framing.

## 4. Detection study, *AI and Ethics* (with Ubayet Hossain): the flagship

### 4.1 Two discrepancies to resolve before any resubmission (*Observed*; human review required)
1. **Co-author affiliation.**
   - Your uploaded file (18 August) lists him as "Associate Director, Model Validation, KPMG India".
   - On 28 August he asked, in writing, that the KPMG name be removed and that he be listed as "Independent Financial Risk & Model Validation Professional" (MASTER_TRACKER, 2026-08-29).
   - The repository's FINAL5 and the AI and Ethics title page carry the corrected wording.
   - The editor's rejection cited **author-contact identity and provenance** (*source-reported*). *Inference, not established:* if any submitted file, form or system field carried the old KPMG affiliation alongside a personal email, the mismatch could have contributed to the editor's concern.
   - **Action:** confirm exactly which files and metadata were uploaded to the journal. Delete or archive the 18 August file so it cannot be sent again. Make the affiliation, email and ORCID identical everywhere in the resubmission.
2. **The consent statement contradicts itself across versions.**
   - The 18 August file says one panel member withdrew "and her judgments remain in the analysis unnamed at her election".
   - The submitted title page says "no contributor has done so".
   - The record shows reviewer V-AI-17 withdrew on 16 July 2026 and asked not to be listed and to have personal data removed (MASTER_TRACKER).
   - **Which statement is true, and whether any of her judgments are in the analysis, must be settled from the database before resubmission.** An inaccurate consent statement is exactly the kind of provenance problem an editor acts on.

### 4.2 Substance (submitted version, `01_Blinded_Manuscript.md`, 11,930 words)
**What it shows.**
- 16 reviewers from 11 countries graded 24 constructed records (12 grounded, 12 unsupported), producing 384 judgments.
- Mean accuracy **83.9%** (95% CI 72.7 to 95.1); sensitivity 87.0%; specificity 80.7%. Both pre-registered parts of the criterion were met.
- Reviewer range 37.5% to 100%.
- The separate reliability criterion **failed** on its lower-bound leg, and the paper reports that openly.

**Strengths.** Pre-registration; blinding; a reference classification reproduced independently; heterogeneity reported as a finding; a failed criterion disclosed; a long, honest limitations section.

**What a reviewer will press on (*Inference*):**
1. **Author-built, bimodal corpus (limitations 8.1, 8.2).** Twelve clearly grounded against twelve clearly unsupported records invites the reply that detection was easy. This is the main scientific weakness. A transfer submission should say what a harder, graded corpus would show and why this study comes first.
2. **No ethics review** (section 4.8, declared). Many journals now require approval or a documented exemption even for expert-opinion studies. Get a written exemption determination or an independent ethics review **before** resubmitting. This is more likely to cause another desk decision than the statistics are.
3. **"The paired data were not retained in a form that supports [a paired test]"** (section 6.4). Per-reviewer sensitivity and specificity are reported, so a paired test looks possible. Either run it or explain precisely why not. As written, it raises data-management doubts.
4. **Length** (about 12,000 words) and the commercial interest of the instrument's creator. Both are disclosed; both cost goodwill.
5. **The answer key and corpus are public on GitHub** (blocker B-018). This does not affect the completed study, but a reviewer who finds it will ask about corpus reuse.

**Next step.** The repair is mostly administrative, not scientific: discrepancies 4.1 (1) and (2), an ethics determination, and the paired-test sentence. Then use the editor's transfer suggestion. The co-author must approve the resubmission, which is the natural moment for the narrow written confirmation (decision D4).

## 5. ISACA Journal: "When a Defensible Decision Becomes an Indefensible File" (Tanvi Pokhriyal, first author)

**What it shows.** 20 adjudicated employment matters across six forums and two countries. Reads were recorded before outcomes: 12 Ready, 5 Needs work, 3 Gap. Adverse outcomes followed in 75.0% of incomplete reads against 16.7% of Ready reads (p = 0.0194), labelled exploratory. The article names the circularity objection itself (the decision narrates the outcome) and declines to treat it as answered. That is rare and to its credit.

**Problems that block submission (*Observed* and *Inference*):**
1. **The first author "has not seen any version"** (recorded). It cannot be submitted under her name until she has read and approved it. This is an authorship-ethics requirement, not a formality.
2. **Text recycling.** Its three failure patterns, the "unverified draft material" control, the system-of-record boundary and the claim-support indicators also appear in the CEP article (in print in November) and the Business Ethics draft (*Observed*, phrase search). Journals generally expect original, unpublished work, and ISACA Journal's author guidelines should be checked on this point (not checked today). Rewrite the practitioner half or cite CEP, and do the same for any later paper.
3. **One reviewer, outcome visible in the source, no reliability test.** These are disclosed. They are fine for a practitioner journal, but describe it as a field pilot (it already does).

## 6. The portfolio as a whole (*Inference*)

| Finding | Consequence | Action |
|---|---|---|
| No peer-reviewed acceptance; four declines, none known to be on merit | The research credential rests on trade press for now | Two priorities only: repair and transfer the detection paper; update and submit the single-author EDPACS article (its figures are stale: "15 professionals, 82.8 percent", now 16 and 83.9%) |
| The same practitioner content appears in CEP, ISACA, Business Ethics and partly EDPACS | Duplicate-publication risk, plus a possible SCCE rights problem once CEP prints | One canonical practitioner text (CEP); every other paper cites it and uses different material |
| Version sprawl (five "FINAL" detection files; RMJ R2 to R9; stale copies in your hands) | Old files get sent, as the 18 August detection file shows | One submission folder per paper, older versions archived, a single "current" file named in the tracker |
| Five of seven papers depend on co-authors | Timing you do not control | Leave co-authored papers to their first authors; do not retitle or reframe their work around JRS without consent (recorded rule) |
| `scripts/publication_status.py` is stale | It misstates CCI and the detection paper | Update it from the corrected table in assessment section 2.6 (a small, separate task) |

## 7. Sources
- Manuscripts: the four uploads (hashes in section 1); `research/aie_submission_2026-09-01/01_Blinded_Manuscript.md` and `02_Title_Page.md`; `research/rmj_submission_2026-09-01/`; `research/Employment_Records_Article_ISACA_2026-08-21.md`; `research/CEP_When_the_Record_Cannot_Speak_for_Itself_ACCEPTED.md`; `research/Backup_Article_EDPACS_DRR_Control.md`; `research/BusinessEthics_Article_Draft.md`.
- Records: `research/MASTER_TRACKER.md` (2026-07-16 V-AI-17 withdrawal; 2026-08-29 affiliation change; 2026-09-01 JOCI decline); the uploaded Evidence Ledger (E-042 to E-044) and Buyer Readiness Checklist (RS-03, RS-04).
- Web, retrieved 2 October 2026: [SEC press release 2022-174](https://www.sec.gov/newsroom/press-releases/2022-174); [SEC press release 2021-262](https://www.sec.gov/newsroom/press-releases/2021-262); [Write for SCCE](https://corporatecompliance.org/publications/write-scce).

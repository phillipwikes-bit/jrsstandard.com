# Compliance Today submission: risks, gaps and pre-submission plan

*Prepared 2026-11-03. Covers `ComplianceToday_Testing_Employment_Files_2026-11-03.docx`, its supplement, and the pitch to Scott Moe. Nothing has been sent. Re-run `python3 scripts/verify_ct_article.py` after any edit (current result: 28 checks, 0 failed).*

Labels follow the repository's evidence rules: **FACT** (inspected), **UNVERIFIED** (not checked against a primary source), **REQUIRES HUMAN REVIEW**.

---

## Priority 1: fix before sending (each one could sink the submission or embarrass the authors)

### 1. Case quotes and facts rest on summaries, not on the decisions
- **Finding.** The opening case (AB 634916) and three quotes (AB 636070, 637062, 638160) come from Tanvi's de-identified summaries in `bench_outcomes`. The decisions themselves were not read, because uiappeals.ny.gov is blocked from this session and exact-phrase searches found nothing. **UNVERIFIED.**
- **Why it matters.** The article's opening and four of its six lessons depend on them. A misquote in print, found by a reader, undercuts an article whose subject is records that match their evidence.
- **Steps.** (a) Open each decision at `https://uiappeals.ny.gov/decisions/appeal-board-no-<number>`. (b) Confirm every quoted phrase character for character, and the facts paraphrased around it. (c) Correct the text or the quote, or replace the case.
- **Pass when** 4 of 4 decisions are checked and every quote matches exactly. Record the result in MASTER_TRACKER.
- **Owner:** Phillip or Tanvi. Alternatively, allow `uiappeals.ny.gov` in the environment's network settings and ask Claude to check.

### 2. Co-author approval of this new text
- **Finding.** Tanvi approved the ISACA article. This article is largely new: new structure, program recommendations, and her bio shortened. No approval of this version is on record. **REQUIRES HUMAN REVIEW.**
- **Steps.** Send her the manuscript and supplement (message A below). Ask her to confirm the bio, the description of her role, the read definitions, and the case summaries.
- **Pass when** Tanvi gives written approval of this exact version (file name and date), saved to `research/correspondence/Pokhriyal_Tanvi.md`.

### 3. Kyle McMullan's acknowledgement reused in a new article
- **FACT.** He agreed the acknowledgement "exactly as you have it" for the ISACA article (2026-08-27) and asked that it not imply he reviewed the study or endorsed it. The wording is unchanged, but the article around it is new.
- **Steps.** Send message B below. If he declines or does not answer, remove the acknowledgement.
- **Pass when** he confirms in writing, saved to `research/correspondence/McMullan_Kyle.md`, or the acknowledgement is removed.

### 4. Legal and regulatory citations not checked against primary sources
- **Finding.** 45 C.F.R. 164.530(e)(1) and (e)(2) and the 164.502(j) exclusion; OIG *General Compliance Program Guidance* (Nov. 2023); HHS-OIG and HCCA *Measuring Compliance Program Effectiveness* (27 Mar. 2017); 31 U.S.C. 3730(h). All were confirmed only through secondary sources. **UNVERIFIED.**
- **Steps.** Check each against eCFR, oig.hhs.gov and uscode.house.gov, and confirm each sentence in the article says no more than the source.
- **Pass when** 4 of 4 citations are confirmed and the wording is adjusted where needed.

### 5. The statement that ISACA is no longer considering the article
- **Finding.** The pitch says the piece "is no longer under consideration by ISACA." No withdrawal or decision is recorded in the repository. **NOT ESTABLISHED** in the record.
- **Steps.** Locate ISACA's decision or your withdrawal email and save it to `research/correspondence/`.
- **Pass when** the written decision or withdrawal is on file before the pitch is sent.

## Priority 2: likely editor questions (prepare answers; small edits)

### 6. The supplement shows two public-records cases inside an "employment" corpus
- **FACT.** Gannett v. Mount Vernon PD (2d Dept 2026) is a FOIL fee case about disciplinary records. Kohler-Hausmann v. NYPD is listed as a FOIL proceeding, but its study record describes an arbitration, so citation and content do not match. The article says a public-records advisory opinion was excluded for being public records. A careful reader of the supplement can see the tension. The owner closed B-018 ("The statistics have already been dealt with"), and no figure changes are proposed.
- **Options (owner's choice).** (a) Leave as is and be ready to explain. (b) Add one line to the supplement: "Two retained appellate matters arose from requests for police disciplinary or personnel records; they were retained under the study protocol." (c) Check Kohler-Hausmann's record against the decision.
- **Pass when** the choice is recorded in MASTER_TRACKER.

### 7. The statistical claim's fragility
- **FACT.** One reviewer; a retrospective adverse rule; outcomes visible in the source text. All are disclosed.
- **Prepared answer for the editor.** The article presents the association as a pattern to test locally, reports the sensitivity results, and rests its recommendations on the case reasoning rather than on the p-value.
- **Pass when** no edit is needed, but the answer is ready.

### 8. Format unknowns
- **Finding.** It is not known whether CT counts endnotes and bios toward 3,200 words, prints tables or boxes, accepts an online supplement, or which endnote style it uses. **UNVERIFIED.**
- **Steps.** Check against the guidelines Scott sent on 2026-07-17.
- **Pass when** each item is confirmed or adjusted.

### 9. Perceived commercial interest
- **FACT.** The bio names the Justification Review Standard, the body uses the coined term "Decision Reconstruction Risk", and the disclosure says Phillip may benefit from adoption. Guidelines bar articles that market products or services.
- **Mitigation already in place.** No product, link or service is named in the body; the disclosure is explicit.
- **Pass when** the editor raises no concern. If one is raised, drop the coined term in favor of plain description.

## Priority 3: timing, logistics and repository hygiene

10. **Issue timing.** HCCA asks for submissions by the 15th of the month three months before the target issue. For the February 2027 issue, that is **15 November 2026**. Pass when a target issue is chosen and the date diaried.
11. **Tanvi's contact details** are needed if HCCA requires contact information for every author. Pass when they are added or confirmed unnecessary.
12. **HCCA forms.** Have the Submission Guidelines form and the Copyright Transfer Agreement ready.
13. **Branch divergence.** Today's later work is on `claude/compliance-today-manuscript` (PR #101). `claude/html-pilot-L8rC3` holds only the first commit. Pass when PR #101 is merged, or the trackers are reconciled before the next session on the dev branch.
14. **Session network limits** block primary-source checks (hcca-info.org, uiappeals.ny.gov, eCFR, oig.hhs.gov). Pass when the domains are allowed, or the checks are done by hand.

---

## Suggested order (about two to three hours of owner time)

| Step | Action | Measurable outcome |
|---|---|---|
| 1 | Send message A to Tanvi and message B to Kyle | Both sent; replies logged |
| 2 | Check 4 decisions and 4 citations (items 1 and 4) | 8 of 8 confirmed or corrected |
| 3 | File the ISACA withdrawal or decision (item 5) | Document saved |
| 4 | Choose the item 6 option; check format items against Scott's guidelines (item 8) | Decisions logged |
| 5 | Re-run `scripts/verify_ct_article.py` after any edit | 0 failed |
| 6 | Send the pitch with manuscript and supplement before 15 Nov for Feb 2027 | Sent; date logged |

---

## Message A: Tanvi (draft; rewrite in your own words)

Hi Tanvi,

I've reworked our employment study into a piece for Compliance Today, the healthcare compliance magazine published by the same association as CEP. It uses your cases and keeps your protocol, statistics and read definitions, credited to you. It adds practical recommendations for healthcare compliance teams.

Before I send it to the editor, could you read the attached manuscript and case-list supplement? Please check your bio, the description of your role, and the case summaries, especially the four quoted passages, which come from your case notes. If you're comfortable with it, a short reply saying you approve this version is all I need.

Thank you,
Phillip

## Message B: Kyle (draft; rewrite in your own words)

Hi Kyle,

You kindly agreed to an acknowledgement on the ISACA employment article. That piece has since been reworked for Compliance Today, and I'd like to keep the same line: "The authors thank Kyle McMullan for comments on audit practice. His comments did not extend to the study, its data or its findings." The article around it is substantially new, so I wanted to check you're comfortable with it appearing there. I'm happy to send the draft, and equally happy to drop the line if you'd prefer.

Best,
Phillip

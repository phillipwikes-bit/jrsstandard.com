# ISACA Journal submission package

**2026-08-24.** The manuscript is finished. This is the checklist for actually sending it,
plus the two items that are yours to close first.

---

## 1. State of the manuscript

| | |
|---|---|
| Title | When a Defensible Decision Becomes an Indefensible File: A Practitioner Test of Documentation Integrity |
| Authors | Tanvi Pokhriyal and Phillip Wikes |
| Body | **2,996 words**, inside ISACA's 2,000 to 3,000 |
| Appendix A | 762 words, counted separately as submission evidence |
| Endnotes | 7, grouped, numbered 1 to 7 in text order |
| Exhibits | Figure 1, five-row control table |
| Format | `.docx` produced by `research/md_to_docx.py` |

**Automated verification, all green:**

| Check | Result |
|---|---|
| `verify_isaca_article.py` | **57 checks, 0 failed** |
| `check_zero_drift.py` | 23 checks, 0 failed |
| `check_affiliation_restrictions.py` | 3 checks, 0 failed |
| `close_referral_channel.py` | 5 checks, 0 failed |
| Citation grader, employment | 20 FULL, 1 PARTIAL, 1 NONE excluded |
| Citation grader, public records | **32 FULL, 0 PARTIAL, 0 NONE** |
| Word document, read from `word/document.xml` | 14 assertions, 0 failed |

---

## 2. Two things to close before you send

### 2.1 The Jones case number

Appendix A5 reads *Jones v Vale Curtains and Blinds Ltd (Employment Tribunal, Reading,
2024)*. It has parties, forum and year but no tribunal case number, unlike A3 which carries
*Case No. 2500506/2017*.

**This is the only open item inside the analyzed 20.** The appendix currently discloses the
gap rather than hiding it, which is defensible as it stands. If the number is recoverable
from your own files, add it. **Do not invent it.**

### 2.2 The two exclusions are your decision, and both are already defensible

A4 identifies no decision and A15 is a public-records advisory opinion. Both are excluded
from the analysis, named in Appendix A, and explained in endnote 2. **You can send it exactly
as it stands.** The alternative, restoring them to reach n = 22, produces a stronger p value
on a weaker corpus and I would not do it.

---

## 3. What a referee will attack, and where the answer already is

| Attack | Where it is answered |
|---|---|
| The reviewer read the outcome inside the same decision she classified | Body, circularity paragraph. States it is not answered and must not be treated as answered |
| Only 20 cases | Limitations. Reported as a field pilot at that level |
| One reviewer, no reliability estimate | Endnote 3 and the body: inter-rater reliability was not tested |
| The adverse rule was set after the data closed | Endnote 4, and the exploratory label sits under the results table |
| Published adjudications are not a random sample | Limitations, stated plainly |
| The comparison corpus is undocumented | Endnote 6: jurisdictions, period, selection, same protocol, why 20 of 32 resolved |
| The author built the instrument he is testing | Declarations, once, without a cross-reference |

**Every one of these is disclosed by the manuscript before a referee raises it.** That is the
paper's strongest characteristic and nothing in the final pass weakened it.

---

## 4. Sending it

| # | Step |
|---|---|
| 1 | Send Tanvi the final `.docx` for approval. **She is first author and has not seen this version** |
| 2 | Send Kyle the reply at `research/Reply_Kyle_Byline_2026-08-23.md` with the final draft, since he offered to read a later one |
| 3 | Check ISACA's current submission form for a separate figure file requirement, and supply Figure 1 separately if asked |
| 4 | Submit through the ISACA Journal author portal |
| 5 | Keep Appendix A with the submission. It is the reproducibility evidence |

---

## 5. Everything still open across the programme

| Item | State |
|---|---|
| Tanvi's approval of this version | **Not sought.** Step 1 above |
| Kyle's reply | Drafted, unsent |
| Hossain's reply | Drafted, unsent. Detection paper sign-off still deferred |
| Co-author confirmation links | **Live and working.** None of the three has been sent |
| Stacyann: "OIL AO 19746" typo, row 1 case name, rows 28 to 32 audit disclosure | Reported, not acted on. Hers to approve |
| Three site fix scripts | Written, dry-run verified, **not applied**: `block_internal_docs.py`, `fix_engine_activity_copy.py`, `fix_sitemap_duplicates.py` |
| `/CLAUDE.md` publicly served | **Still live.** Publishes the private owner-page slug |
| Three checkout URLs | Still empty. Two buyers already turned away |
| USPTO Class 042 | Drafted, not filed |
| SCCE copyright form | Not returned |
| E-08 study | Still open |

**The first four are this article. The rest are the programme.**

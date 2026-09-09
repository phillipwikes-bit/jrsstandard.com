# Rights and Agreements Evidence Register

**This document materially amends the 2026-09-08 and 2026-09-09 findings.** Both
earlier passes recorded "0 rights documents located". **That was incomplete.** A
versioned co-author consent instrument exists, is deployed, and is live. The corrected
position is set out below.

## Search provenance

| Item | Detail |
|---|---|
| Corpus indexed | `find . -type f -not -path './.git/*'` → **1,153 files**: 76 html, 462 md, 90 pdf, 169 docx, 17 json, 19 csv, 19 txt, 56 js, 161 py |
| Binary extraction | **90 PDFs** via `pdftotext -layout`, **169 DOCXs** via `zipfile` + XML strip. **259 of 259 extracted, 0 failures, 7,313,550 bytes** |
| Prior passes | Searched root PDFs only (12 of 90). **The 169 DOCXs and 78 research PDFs had never been text-searched.** This is why the earlier finding was incomplete |
| Terms searched (case-insensitive, text files and binary corpus) | `work made for hire`, `work for hire`, `work-made-for-hire`, `assigns all right`, `hereby assign`, `assignment of copyright`, `irrevocably assign`, `transfer of ownership`, `grant.*licen[cs]e`, `all right, title` |
| Commands | `grep -rli` across `--include=*.md --include=*.html --include=*.txt --include=*.json`; `grep -ci` against the extracted binary corpus; `grep -rn "coauthor-v1.0"` across `*.js`/`*.html` |

## Findings

### F-1 A versioned co-author consent instrument EXISTS and is deployed · VERIFIED

| Field | Evidence |
|---|---|
| Source | `api/_coauthor-roster.js`; live `/api/coauthor-stats` |
| Terms version | **`coauthor-v1.0-2026-08-24`** |
| Live state (2026-09-09) | `expected: 3`, **`confirmed: 0`**, outstanding `E-08`, `M-01`, `V-HR-01`; `consent_print_yes: 0`, `consent_use_yes: 0`, `consent_keep_yes: 0` |
| What it asks | Two distinct permissions: how name, title and organisation are printed, **and whether the work may be used commercially** |
| Why it exists | The source states it closes gap 1 of `CONSENT_AND_RELEASE_AUDIT_2026-08-13.md`: "no stored copy of the terms as they read on the day each person ticked." Every row written carries the version |

**This is a real and well-designed instrument.** It is deliberately separate from the
contributor roster, and the source says why: *"a consent tick is not an assignment.
Keeping the instruments apart is what makes each one provable."*

**Classification: VERIFIED that the instrument exists. NOT ESTABLISHED that any
co-author has used it: confirmed is 0 of 3.**

### F-2 Written rights terms with the CCI co-author EXIST in correspondence · PARTIALLY ESTABLISHED

Source: `research/Reply_Hekim_Publication_Terms_2026-08-05.md`, answers 5 to 9. Exact
language:

- **Approval rights (Q5):** "Neither of us submits, publishes, or amends anything the other has not seen and approved in full... If we cannot agree on a change, we do not make it."
- **Author order (Q6):** "Hekim Colpan and Phillip Wikes, in that order."
- **Copyright (Q7):** "**We hold copyright jointly as co-authors.**... I will not agree to an exclusive assignment of copyright without your written agreement."
- **Reuse (Q8):** "You retain the right to refer to, quote, republish, translate, and adapt your own contribution."
- **Commercial use (Q9):** "**Any use of the article, or of your contribution to it, in commercial, promotional, certification, training, or marketing material requires your prior approval. That covers JRS material specifically.**"

**Q9 is a material restriction on transferability** and it is the single most
commercially significant sentence located in this entire investigation.

**What is established:** these terms were composed and are recorded in writing, and a
subsequent exchange (`research/Reply_Hekim_Colpan_Lock_2026-08-19.md`) evidences an
active collaboration in which his corrections were accepted.

**What is NOT established:** that the eleven answers were sent, and that he accepted
them. No reply from him accepting the rights terms was located in 1,153 files.

### F-3 The CCI co-author is NOT covered by the consent instrument · VERIFIED GAP

| Fact | Evidence |
|---|---|
| Hekim Colpan is a **co-author of the accepted CCI article** | `research/cci_resubmission_2026-09-03/`, author order confirmed in the terms reply |
| He is registered as a **panel contributor**, code **V-AI-20**, `kind:'panel'` | `api/_contributor-roster.js` |
| He is **absent from the co-author roster** | `grep -c "Hekim\|Colpan" api/_coauthor-roster.js` → **0** |

**The co-author consent instrument covers three people and does not cover the
co-author of the publication nearest to appearing in print.**

## Corrected rights position, by relationship

| Person | Code | Work | Role | Instrument | State |
|---|---|---|---|---|---|
| Ubayet Hossain | M-01 | Detection study | Co-author | Co-author roster, terms v1.0 | **Not confirmed** |
| Tanvi Pokhriyal | V-HR-01 | Employment records study | First author | Co-author roster, terms v1.0 | **Not confirmed** |
| Stacyann Young | E-08 | Public records study | First author | Co-author roster, terms v1.0 | **Not confirmed** |
| Hekim Colpan | V-AI-20 | CCI evidentiary-deficit article | Co-author | **None. Written email terms only** | **Not confirmed, and not covered** |
| Section 2.1 contributor | V-AI-08 | DRR core construct | Contributor | Contributor consent only | **No assignment** |

## What remains true from the earlier passes

**Zero executed assignments, work-for-hire instruments or contractor agreements exist**
in the corpus. Searches for ten variants returned zero across text files and across
7.3 MB of extracted binary text. The instruments located are **consent mechanisms**, and
the project's own source and audit both state, unprompted, that a consent tick is not
an assignment.

---

# AMENDMENT, 2026-09-09 (second pass, structured-data search)

**Prior findings below this line are preserved. Nothing is deleted or silently
replaced.**

**PRIOR FINDING:** Hekim Colpan, "Instrument: **None**. Written email terms only";
and, more broadly, "0 rights documents located" (2026-09-08) revised to "1 instrument,
confirmed 0 of 3" (2026-09-09, first pass).

**NEW EVIDENCE:** A **second instrument** exists, the **contributor consent** collected
by `contributor.html` through `api/contributor.js` and stored in `pilot_contacts` where
`source=contributor-confirm`. It holds **37 confirmation rows covering 33 distinct
people**, dated 2026-08-19 to 2026-09-05, with **`consent_use` yes on 100%** and
**`consent_transfer` yes on 100%, zero refusals**.

**Hekim Colpan (V-AI-20) executed it on 2026-08-19**: named yes, use yes, transfer yes,
country DE.

**CORRECTION:** The earlier finding was **incorrect for Hekim Colpan** and
**incomplete for the contributor population**.

**REASON THE PRIOR SEARCH WAS INCOMPLETE:** A category error plus a search-strategy
limit. I searched `api/_coauthor-roster.js` (the co-author instrument, 3 people), found
him absent, and reported on both instruments having examined one. Separately, every
earlier pass searched **files**; these releases exist as **database rows**. No earlier
pass queried structured application data.

**This does not indicate the earlier work was fraudulent or negligent.** It indicates a
file-oriented strategy applied to evidence held in a table.

**SCOPE DISCIPLINE PRESERVED.** The contributor consent is **permission portability, not
a copyright assignment**. Per the project`s own Master Tracker analysis, it "says
nothing about licensing, commercial products, revenue or vendor platforms", the
successor clause "covers selling the programme" but not the owner personally earning
licensing revenue while contributors remain unpaid volunteers, and the permission is
**revocable at will**, so it cannot support an exclusive perpetual grant. The
contributor instrument also stores **no terms version**, unlike the co-author one.

**STILL TRUE AND UNCHANGED:** no executed assignment, work-for-hire instrument or
contractor agreement was located in the accessible corpus searched as of 2026-09-09;
co-author confirmations remain **0 of 3**; acceptance of the 2026-08-05 CCI publication
terms was **not located**.

Full detail: `EXHAUSTIVE_PARTICIPANT_AND_CONTRIBUTOR_RELEASE_AUDIT.md` and
`MASTER_TRACKER_RELEASE_AND_RIGHTS_RECONSTRUCTION.md`.


---

# SECOND AMENDMENT, 2026-09-09 (person-by-person and stale-status pass)

**Prior text preserved. This corrects the co-author position, which the first
amendment did not reach.**

**PRIOR FINDING:** Ubayet Hossain, Tanvi Pokhriyal and Stacyann Young recorded as
"not confirmed", and the co-author instrument reported as "confirmed 0 of 3".

**NEW EVIDENCE:** the Master Tracker records that contributor links were issued to
"19 people: 15 verified Arm A completers, **co-authors Ubayet Hossain M-01 and Stacy
Young E-08**". Querying `pilot_contacts` for those codes returns:

| Code | Person | Contributor consent executed | named / use / transfer | Country |
|---|---|---|---|---|
| V-AI-20 | Hekim Colpan | **2026-08-19** | true / true / **true** | DE |
| V-HR-01 | Tanvi Pokhriyal | **2026-08-22** | true / true / **true** | AE |
| E-08 | Stacyann Young | **2026-08-27** | true / true / **true** | US |
| **M-01** | **Ubayet Hossain** | **NO ROW of any kind** | n/a | n/a |

**CORRECTION:** "Confirmed 0 of 3" was **true of the co-author instrument and
materially misleading as a statement of those people's rights position.** Two of the
three had already granted named, use and successor-transfer permissions through the
contributor instrument. **A true figure can still mislead**, and reporting it without
the contributor consents did.

**THE GAP NARROWS TO ONE PERSON. Ubayet Hossain (M-01) is the only one of the four with
no executed consent of either kind**, and he designed the reliability and validation
framework the detection paper reports. The project record asserts he "REVIEWED and
APPROVED 2026-07-14" with byline acceptance confirmed 2026-07-27, which is Level C
evidence of authorship approval and **is not a rights instrument**.

**SCOPE UNCHANGED.** The contributor consent remains permission portability, not
assignment: revocable at will, silent on licensing and commercial products, and stored
without a terms version.

Full detail: `PERSON_BY_PERSON_EVIDENCE_AUDIT.md`, `STALE_STATUS_CORRECTION_REGISTER.md`.

---

# THIRD AMENDMENT, 2026-09-09 (Ubayet LinkedIn evidence located)

**Prior text preserved.**

**PRIOR FINDING:** "Ubayet Hossain (M-01) is the only one of the four with **no
executed consent of either kind**", and "**GENUINE GAP**".

**NEW EVIDENCE:** `research/evidence/ubayet_coauthor_2026-07-14/TRANSCRIPT.md`, a
**verbatim transcript of LinkedIn direct messages dated 2026-07-14**, retained with
**four source screenshots**, plus a standing record at
`research/correspondence/Hossain_Ubayet.md`.

It establishes, verbatim and quotable: methodology approval ("absolutely correct";
AC1 floor "standard and methodologically sound"); attribution approval ("reads
perfectly and accurately captures my role"); clearance for submission ("ready for the
next stage"); an explicit co-authorship offer; and his affirmative reply directly under
it ("Happy to help!").

**CORRECTION:** "No consent of either kind" was **wrong as to authorship**. He has
**Level B evidence, direct written communication with primary source images**, which
is stronger than the Level C tracker assertion I had been relying on.

**WHAT DOES NOT CHANGE, AND IS NOW THE PRECISE GAP:** the exchange is **silent on
commercial use, licensing, revenue and successor transfer**. Those are exactly the
questions the co-author instrument puts, including "that would mean the work earns
money and you would not receive a share of it". **Nothing in the file addresses them,
and no executed instrument holds a row for M-01.**

**REASON THE PRIOR FINDING WAS WRONG:** not a search failure. **My person-by-person
search found all four matching files, including the transcript. My script printed only
the first two hits per person and I wrote the conclusion from what was printed rather
than from what was found.** The count in my own output read 4 and I reported on 2.

Full detail: `UBAYET_HOSSAIN_LINKEDIN_EVIDENCE_RECORD.md`.

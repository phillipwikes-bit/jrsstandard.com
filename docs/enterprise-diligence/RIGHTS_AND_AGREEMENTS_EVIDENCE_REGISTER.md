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

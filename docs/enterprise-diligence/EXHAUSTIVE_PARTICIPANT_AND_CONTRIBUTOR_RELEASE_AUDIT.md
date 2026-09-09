# Exhaustive Participant and Contributor Release Audit

**2026-09-09.** This audit tests a specific owner statement: that **Hekim Colpan
completed a contributor release for his participation in the Detection Article.**

# A. Executive finding

**The owner's statement is VERIFIED, and my prior finding was wrong.**

| Question | Answer |
|---|---|
| Instruments located | **2**: the contributor consent instrument, and the co-author consent instrument |
| **Executed instances located** | **37 confirmation rows covering 33 distinct people**, 2026-08-19 to 2026-09-05. The four-row difference is re-confirmation: `/api/contributor-stats` counts distinct people (33), the table holds every submission (37). Both figures are correct and are reconciled here rather than reported side by side |
| Template-only instruments | **1**: the co-author instrument (`coauthor-v1.0-2026-08-24`), **0 of 3 used** |
| Contributors with completed consent | **33 distinct people** |
| **Was Hekim Colpan's release located?** | **YES. VERIFIED RELEASE LOCATED.** Executed **2026-08-19**, code **V-AI-20**, country **DE** |

**Why my earlier finding said "Instrument: None": a category error.** I searched
`api/_coauthor-roster.js` (3 people, the co-author instrument), found him absent, and
concluded no instrument existed. **He is a contributor, code V-AI-20, and he completed
the contributor instrument.** The two instruments are deliberately separate, and the
source of `_coauthor-roster.js` says why. **I checked one and reported on both.**

# B. Search provenance

| Layer | Executed |
|---|---|
| Corpus inventory | 1,153 files indexed |
| Binary extraction | 90 PDFs + 169 DOCXs, 259 of 259, 7,313,550 bytes |
| Live endpoints | `/api/contributor-stats`, `/api/coauthor-stats`, `/api/checkout-stats` |
| **Structured application data** | **`pilot_contacts` where `source='contributor-confirm'`, queried directly. This is the layer that held the answer and that no earlier pass queried** |
| Source code | `api/contributor.js`, `api/_contributor-roster.js`, `api/_coauthor-roster.js`, `contributor.html` |
| Git history | `git log -S"V-AI-20"`, `-S"Decision Reconstruction Risk"`, `-S"conversations with"` |
| Master Tracker | Full-text search of `research/MASTER_TRACKER.md` for `consent_transfer`, `successor organization`, contributor identifiers |
| Tracker variants | `MASTER_TRACKER.md` (×2 paths), `.docx`, `TRACKER_RECENT.md`, `TRACKER_RECENT_2026-08-29.pdf`, `IP_SALE_TRACKER.md`/`.docx`, `IP_COMMERCIALIZATION_TRACKER.md` |
| Rights terminology | 10 assignment variants plus the full consent vocabulary |

**The decisive lesson: the release existed as structured data, not as a document.** Every
earlier pass searched for files. This one queried the table.

# C. Release inventory

| Person | Identifier | Asset | Instrument | Path | Executed? | Evidence of acceptance | Rights scope | Classification |
|---|---|---|---|---|---|---|---|---|
| **Hekim Colpan** | **V-AI-20** | **Detection study, panel review contribution** | Contributor consent | `pilot_contacts` `source='contributor-confirm'`; form `contributor.html`; handler `api/contributor.js` | **YES** | Row dated **2026-08-19**, country DE, `consent_named:true`, `consent_use:true`, **`consent_transfer:true`** | Named in the paper; credited name and contributed review work may continue to be used in study publications, **including by a successor organization** | **VERIFIED** |
| 32 further distinct contributors | various | Detection, reliability, comparison studies | Contributor consent | as above | **YES** | 2026-08-19 to 2026-09-05 | as above | **VERIFIED** |
| Ubayet Hossain | M-01 | Detection study | **Co-author** consent | `api/_coauthor-roster.js`, terms `coauthor-v1.0-2026-08-24` | **NO** | `/api/coauthor-stats`: confirmed 0 of 3 | n/a | **GAP** |
| Tanvi Pokhriyal | V-HR-01 | Employment records study | Co-author consent | as above | **NO** | as above | n/a | **GAP** |
| Stacyann Young | E-08 | Public records study | Co-author consent | as above | **NO** | as above | n/a | **GAP** |

## Population totals, from the live table

| Measure | Value |
|---|---|
| Confirmation rows | **37** |
| **Distinct people** | **33** |
| `consent_named` yes | 31 |
| `consent_use` yes | **37 (100%)** |
| **`consent_transfer` yes** | **37 (100%)** |
| `consent_transfer` no | **0** |
| Date range | 2026-08-19 to 2026-09-05 |

# D. Hekim Colpan findings

**Chronology, evidence-supported:**

| Date | Event | Classification |
|---|---|---|
| — | Registered as detection-panel contributor, code V-AI-20, `named_on_file: true` | **IDENTIFICATION** |
| — | Completed the 24-record detection corpus as a panel member | **PARTICIPATION** |
| **2026-08-05** | Written publication terms prepared for him (answers 5 to 9), including joint copyright and a prior-approval requirement over commercial use of JRS material | **RIGHTS**, acceptance **NOT ESTABLISHED** |
| **2026-08-19** | **Contributor consent executed**: named, use, and transfer all yes | **RELEASE / CONSENT · VERIFIED** |
| 2026-08-19 | Second CCI exchange; his corrections accepted, manuscript locked | **CORRESPONDENCE** |
| 2026-09-03 | CCI article accepted, he is named first | **PUBLICATION** |

**Two separate contributions, and only one is covered.** His **V-AI-20 consent covers his
detection-panel review work.** His **CCI co-authorship** (the European legal and
standards analysis) is different work, and the contributor consent does not speak to it.

# E. Exact scope, and what this consent does NOT do

The wording presented before the tick, verbatim from `contributor.html`:

> "whether your credited name and the review work you contributed may keep appearing in
> publications and materials about this study, and whether those permissions travel with
> the work if it passes to a successor organization."

The "yes" option:

> "Your name and title are printed in the paper, and your credited name and contributed
> work may continue to be used in study publications, including by a successor
> organization."

**This is permission portability. It is not a copyright assignment.** The project's own
Master Tracker already records the limits, and they are preserved here rather than
softened:

- It "**says nothing about licensing, commercial products, revenue or vendor platforms**."
- "**The successor clause covers selling the programme; it does not obviously cover the owner personally earning licensing revenue while contributors remain unpaid volunteers.**"
- The permission is "**revocable at will**": a contributor may change or withdraw it at any time. **A revocable licence cannot support an exclusive perpetual grant.**
- Nothing is signed; the contributor instrument stores **no terms version** (unlike the co-author instrument, which does).

# F. Negative findings, precisely stated

- **No executed assignment, work-for-hire instrument or contractor agreement was located in the accessible corpus searched as of 2026-09-09**, across 1,153 files, 7.31 MB of extracted binary text, structured application data, and git history, using ten term variants.
- **No acceptance by Hekim Colpan of the 2026-08-05 publication terms was located** in the accessible corpus as of 2026-09-09.
- **No co-author confirmation has been recorded**: `/api/coauthor-stats` reports confirmed 0 of 3 at 2026-09-09.

# G. Search limitations

- Email and correspondence outside the repository could not be searched. If the 2026-08-05 terms were accepted by email, that acceptance is **NOT AUDITABLE** here.
- The contributor consent stores no terms version, so **the exact wording in force on 2026-08-19 cannot be proven from the row alone**. The wording quoted above is the wording currently deployed.
- No OCR was applied; all 259 binaries extracted as text without failure, so no OCR queue was required.

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

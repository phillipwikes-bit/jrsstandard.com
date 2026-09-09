# Research Author Contribution Dossier

## Search provenance

Searched all manuscripts, drafts and submission packets across `research/` (462 md,
169 docx, 90 pdf). Terms: author names and variants, `author contributions`,
`co-author`, `copyright`, `approval`, `assign`, `rights`. Live endpoint read:
`/api/coauthor-stats`.

## Co-author relationships located: four, not one

| # | Person | Code | Work | Role | Contribution evidenced | Rights instrument | State |
|---|---|---|---|---|---|---|---|
| R-1 | **Ubayet Hossain, FRM** | M-01 | Detection study (AI and Ethics) | Co-author | "Designed the reliability and validation framework: the reference-panel design, the chance-corrected agreement statistics, and the pre-registered decision floors and analysis plan" | Co-author roster, terms `coauthor-v1.0-2026-08-24` | **Not confirmed** |
| R-2 | **Tanvi Pokhriyal** | V-HR-01 | Employment records study | **First author** | Roster entry | Same instrument | **Not confirmed** |
| R-3 | **Stacyann Young** | E-08 | Public records study / RMJ manuscript | **First author** | Roster entry; extensive manuscript history | Same instrument | **Not confirmed** |
| R-4 | **Hekim Colpan** | V-AI-20 | CCI evidentiary-deficit article (**accepted**) | Co-author, **named first** | European legal and standards analysis | **None. Written email terms only, acceptance not located** | **Not covered by the instrument** |

**Live co-author consent state, 2026-09-09:** `expected: 3`, **`confirmed: 0`**,
outstanding `E-08`, `M-01`, `V-HR-01`.

## The finding that matters most

**R-4 is the exposure.** Hekim Colpan is a co-author of the publication nearest to
appearing in print, is **named first** in the author order, and is registered in this
system only as a **panel contributor** (`kind:'panel'`). He is absent from the
co-author consent roster: `grep -c "Hekim\|Colpan" api/_coauthor-roster.js` returns
**0**.

The written terms prepared for him include, verbatim: *"Any use of the article, or of
your contribution to it, in commercial, promotional, certification, training, or
marketing material requires your prior approval. **That covers JRS material
specifically.**"*

**If those terms were sent and accepted, they are a live restriction on commercial use
of JRS material.** Whether they were sent and accepted is **NOT ESTABLISHED FROM
AVAILABLE CORPUS**: no reply accepting them was located in 1,153 files.

## A third-party identity in document metadata

**VERIFIED.** `docProps/core.xml` across **14 research DOCX files** carries
`Jeff Billups`, and one carries `Anholzer, Bill`. Neither appears in any roster.
`MASTER_TRACKER.md` records that one such instance was found and scrubbed for the
anonymous submission copy. **The other files retain it.** This is a provenance and
privacy observation, not a rights claim: it does not establish contribution.

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


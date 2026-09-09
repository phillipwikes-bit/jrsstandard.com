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

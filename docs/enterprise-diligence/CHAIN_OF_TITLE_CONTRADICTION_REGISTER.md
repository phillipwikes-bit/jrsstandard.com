# Chain-of-Title Contradiction Register

Contradictions between sources, and between earlier passes and this one. **Preserved,
not harmonised.** Where an earlier finding of mine was wrong, it is corrected here in
its own words rather than quietly restated.

## Contradictions in my own earlier passes

| # | Earlier statement | Corrected finding | Cause |
|---|---|---|---|
| **X-1** | 2026-09-08 and 2026-09-09: "**0 rights documents located**" / "0 rights agreements across 2,031 commits and 598 research files" | **A versioned co-author consent instrument exists and is deployed**: `coauthor-v1.0-2026-08-24`, covering three co-authors, live at `/api/coauthor-stats`. **Confirmed 0 of 3**, so no co-author has yet used it | Earlier searches did not include `api/_coauthor-roster.js` or the live endpoint. **Under-searched, not misread** |
| **X-2** | 2026-09-09: "**0 DOI strings anywhere in the repository**" | **3 unique DOI strings exist**, all citations of other authors' RMJ papers in a reference list. **No JRS output has a DOI**, so the conclusion stands and the wording was wrong | Earlier search covered `*.html` and `research/*.md` only, excluding 259 binary documents |
| **X-3** | 2026-09-08: "three subprocessors evidenced in code, none published" | **Four.** Formspree was located on 2026-09-09 | Scope of the earlier search |
| **X-4** | 2026-09-09: chain-of-title treated as one co-author relationship (the detection-study second author) | **Four co-author relationships**, of which one (the accepted CCI article) has **no consent instrument at all** | Earlier pass read the detection manuscript only |
| **X-5** | 2026-09-08: "no terms version stored against any consent row" (carried from an August tracker entry) | **Partly superseded.** The co-author instrument stores `TERMS_VERSION` on every row it writes, expressly to close that gap. **It remains true for the contributor and participant instruments** | The August finding was correct when written and was closed for co-authors on 2026-08-24 |

**X-1 and X-2 are the material ones.** Both were produced by searching a subset of the
corpus and reporting the result as if the whole corpus had been searched. The remedy
applied in this pass was to index all 1,153 files and extract all 259 binaries before
answering any question.

## Contradictions between project sources

| # | Contradiction | Sources | Status |
|---|---|---|---|
| **Y-1** | Two OpenAPI documents describe the same endpoint at different versions with different response schemas | `openapi.json` 3.1.0/1.0.0 vs `openapi-review-engine.json` 3.0.3/0.1.0-validation | **UNRESOLVED** |
| **Y-2** | Codebook condition names and API keys overlap on exactly one of five | `codebook.html` vs `openapi.json` | **UNRESOLVED** |
| **Y-3** | The CCI co-author is **named first** on an accepted publication but is classified `kind:'panel'` in the roster system and absent from the co-author instrument | `api/_contributor-roster.js` vs `api/_coauthor-roster.js` vs the CCI packet | **UNRESOLVED. Highest-value contradiction in this register** |
| **Y-4** | Public pages state record text is never stored; result telemetry is written | Public pages vs `api/v1/review-engine.js` | **UNRESOLVED** |
| **Y-5** | 23 pages assert `JRS™` while no filing evidence exists | Public pages vs corpus-wide USPTO search | **UNRESOLVED as to filing** |
| **Y-6** | Third-party names (`Jeff Billups` ×14, `Anholzer, Bill` ×1) appear in research DOCX metadata and in no roster | `docProps/core.xml` vs all rosters | **UNRESOLVED**, and not contribution evidence |
| **Y-7** | Written co-author terms restrict commercial use of JRS material by prior approval, and it is not established they were sent or accepted | `Reply_Hekim_Publication_Terms_2026-08-05.md` vs absence of any reply | **UNRESOLVED. Commercially the most significant** |

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
no executed consent of either kind** *(SUPERSEDED by the THIRD AMENDMENT below: he holds Level B written evidence for authorship; the gap is commercial use and successor transfer)*, and he designed the reliability and validation
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

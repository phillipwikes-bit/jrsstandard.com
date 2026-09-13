# JRS Asset and Chain-of-Title Register: Evidence-Completion Update

**2026-09-09, second pass.** This update supersedes **nothing**. It corrects two of my
own earlier statements, extends three findings, and records what exhaustive search
established that targeted search had missed.

## Why this pass found things the last two did not

| | Pass 1 (09-08) | Pass 2 (09-09 am) | **This pass** |
|---|---|---|---|
| Files searched | targeted | targeted | **All 1,153 indexed** |
| PDFs text-extracted | 0 | 0 | **90 of 90** |
| DOCXs text-extracted | 0 | 0 | **169 of 169** |
| Extracted corpus | none | none | **7,313,550 bytes** |
| Live endpoints read | 2 | 1 | **3** |

**Both earlier passes reported subset results as if the corpus had been searched.**
That is the root cause of X-1 and X-2 in the contradiction register, and it is the
reason this prompt's insistence on provenance before a negative finding was justified.

## Executive evidence summary, corrected

| Metric | Prior statement | **Corrected** |
|---|---|---|
| Rights instruments | "0 located" | **1 deployed, versioned co-author consent instrument** (`coauthor-v1.0-2026-08-24`), **confirmed 0 of 3** |
| Co-author relationships | 1 | **4**, one with no instrument at all |
| DOI strings | "0 anywhere" | **3, all citations of others' work.** No JRS output has a DOI |
| Third-party processors | 3 | **4** |
| Executed assignments / work-for-hire | 0 | **0 — unchanged, now searched across the full corpus with 10 term variants** |
| USPTO filing evidence | 0 | **0 — unchanged, and the one 8-digit candidate was traced and excluded as a SHA-256 prefix** |

## Verified asset baseline

Unchanged from the 2026-09-09 register, plus:

- **A co-author consent instrument exists, is versioned, is deployed, and was purpose-built to close a gap the project's own audit identified.** That is a genuine governance strength and it was under-reported by me twice.
- **259 binary documents are readable and were extracted without a single failure**, which is itself evidence the corpus is intact and auditable.

## Chain-of-title evidence gaps, re-prioritised

| Rank | Gap | Change |
|---|---|---|
| **1** | **The CCI co-author (accepted, near print, named first) has no consent instrument, and written terms requiring his prior approval for commercial use of JRS material may or may not have been accepted** | **NEW. Now the highest-priority item, ahead of the Section 2.1 contributor** |
| 2 | Section 2.1 contributor: no assignment | Unchanged |
| 3 | Three co-authors on the instrument, **confirmed 0 of 3** | **Reframed**: the mechanism exists, so this is a follow-up problem rather than a build problem |
| 4 | No executed assignment or work-for-hire instrument anywhere | Confirmed by exhaustive search |
| 5 | No USPTO filing evidence against 23 pages using `JRS™` | Confirmed by exhaustive search |

## Material conflicts

See `CHAIN_OF_TITLE_CONTRADICTION_REGISTER.md`. Seven project-source contradictions
(Y-1 to Y-7) and five corrections to my own earlier passes (X-1 to X-5).

## Recommended next action

**Changed from yesterday, on new evidence.**

Yesterday: obtain the Section 2.1 assignment and the second author's rights allocation.

**Today: send the three outstanding co-author confirmations and resolve the CCI
co-author's position first.**

Rationale from the evidence. The instrument already exists and is deployed, so three of
the four relationships need a link sent, not a document built: that is hours of work,
not weeks. The fourth, the CCI co-author, is the one nearest to print, is named first,
and is the subject of written terms whose acceptance is unestablished and which, if
accepted, **restrict commercial use of JRS material by prior approval**. Resolving him
is both the most urgent and the most commercially material single action available.

The Section 2.1 assignment remains essential and drops to second **only because the
work needed for the other four is smaller and the CCI exposure is live**.

---

## Master Tracker status block

```
[Session ID / Timestamp]        session_01W9UtE7X76spacWeSvBH7tv / 2026-09-09
[Completed Phases & Artifacts]  Corpus index (1,153 files); binary extraction (90 PDF
                                + 169 DOCX, 0 failures, 7.31 MB); entity normalization;
                                Modules 1-6; 12 deliverables written.
[Active State & Variables]      Branch claude/html-pilot-L8rC3. All files created under
                                docs/enterprise-diligence/. No public page, API,
                                research file, legal or privacy language modified.
[Upstream Source / Generator]   No generated artifact patched. Manifests are generated
                                from the repository by script at build time; dossiers
                                are authored source. Upstream evidence read: git
                                history and blame, api/_coauthor-roster.js,
                                api/_contributor-roster.js, research/** (incl. all
                                binaries), codebook.html, openapi*.json, live
                                /api/coauthor-stats.
[Pending Technical Debt]        Y-1 conflicting OpenAPI docs; Y-2 condition mapping;
                                Y-3 CCI co-author uncovered; Y-4 retention wording;
                                Y-5 trademark; Y-6 third-party metadata names in 15
                                DOCX files; Y-7 unaccepted commercial-use restriction.
[Production Deployment Status]  NO TRIGGER. All files created are markdown under
                                docs/enterprise-diligence/, excluded by two independent
                                rules. Nothing deployable mutated. Production verified
                                healthy regardless.
[Next Trigger / Expected Input] Owner action on the four co-author positions; answers
                                to the questionnaire, in particular B1 (AI involvement)
                                and E3 (Formspree).
```

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

---

# RECOMMENDED NEXT ACTION, superseding all earlier versions (2026-09-09, final)

**Earlier versions preserved above. Each was correct on the evidence available at the
time, and each was overtaken.**

| Version | Recommended action | Superseded because |
|---|---|---|
| 2026-09-09 (pass 1) | Obtain the Section 2.1 assignment and the second author's rights allocation | The co-author instrument was then thought to be the only instrument |
| 2026-09-09 (pass 2) | Resolve the CCI co-author; send the three outstanding co-author confirmations | Two of those three had already consented through the contributor instrument |
| 2026-09-09 (pass 3) | Get Ubayet Hossain's consent | **He already consented to authorship in writing.** The gap is narrower |

## Current recommendation

> **Ask Ubayet Hossain one question: whether his contribution may be used in paid or
> licensed material, and whether that permission travels to a successor organisation.**

**Why this and nothing else.**

The authorship question is closed. `research/evidence/ubayet_coauthor_2026-07-14/`
holds a verbatim LinkedIn transcript with four source screenshots establishing
methodology approval, attribution approval, submission clearance, an explicit
co-authorship offer and his affirmative reply. That is **Level B evidence with primary
sources**, and it is stronger than what most contributors have.

**What no message in the file addresses is commercial use, licensing, revenue or
successor transfer.** Those are the exact questions the co-author instrument puts, and
they are the only material rights question outstanding for the person who designed the
reliability and validation framework the detection paper reports.

**It does not require him to use the link.** He replies on LinkedIn, where a documented
exchange with him already exists. The requirement is that the question be put explicitly
enough that his answer is unambiguous, mirroring the instrument's own choice between
allowing use in paid or licensed material and restricting use to the paper and academic
materials.

**Second, once that is answered:** the Section 2.1 contributor assignment, which remains
the only gap requiring a signature from someone who has given none.

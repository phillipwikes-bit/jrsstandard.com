# Stale Status Correction Register

Every negative status I have published in this engagement, re-tested against later and
broader evidence. **Nothing is deleted. Each prior finding is preserved with its
correction history.**

| # | Prior negative status | Source and date | Later evidence | Classification | Correction |
|---|---|---|---|---|---|
| S-1 | "**0 rights documents located**" | `EVIDENCE_AND_LIMITATIONS_REGISTER.md`, 2026-09-08 | Two instruments; **37 executed contributor rows / 33 people** | **SUPERSEDED** | Wrong. Files were searched; the records are database rows |
| S-2 | "**Hekim Colpan: Instrument None**" | `RIGHTS_AND_AGREEMENTS_EVIDENCE_REGISTER.md`, 2026-09-09 | Executed contributor consent **2026-08-19** | **CONTRADICTED** | Wrong. Category error: co-author roster searched, contributor instrument not |
| S-3 | "**Tanvi Pokhriyal: not confirmed**" | `RESEARCH_AUTHOR_CONTRIBUTION_DOSSIER.md`, 2026-09-09 | Executed contributor consent **2026-08-22** | **CONTRADICTED** | Accurate about the co-author instrument, **materially misleading about her rights position** |
| S-4 | "**Stacyann Young: not confirmed**" | same | Executed contributor consent **2026-08-27** | **CONTRADICTED** | As S-3 |
| S-5 | "**Ubayet Hossain: not confirmed**" / "no executed consent of either kind" | same | **Level B LinkedIn transcript with four source screenshots, 2026-07-14**, located 2026-09-09 | **CONTRADICTED as to authorship; CURRENT AND SUPPORTED as to commercial use and transfer** | **Wrong as stated.** Authorship consent is evidenced verbatim. The gap is narrower: commercial use, licensing and successor transfer are unaddressed, and no executed instrument exists |
| S-6 | "**confirmed 0 of 3**" (co-author instrument) | `/api/coauthor-stats`, 2026-09-09 | Still 0 of 3 today | **CURRENT AND SUPPORTED, but incomplete as stated** | True of that instrument. **Two of those three people had already granted named, use and transfer through the contributor instrument.** Reporting the figure alone understated their rights position |
| S-7 | "**0 DOI strings anywhere**" | `ASSET_AND_CHAIN_OF_TITLE_REGISTER.md`, 2026-09-09 | 3 DOIs, all citations of other authors | **SUPERSEDED** | Wording wrong, conclusion intact: no JRS output has a DOI |
| S-8 | "**three subprocessors**" | 2026-09-08 | Formspree located | **SUPERSEDED** | Four |
| S-9 | "**No executed assignment or work-for-hire instrument**" | 2026-09-08 and 09-09 | Re-tested across 1,162 files, 7.31 MB extracted text, structured data and git history | **CURRENT AND SUPPORTED** | Stands |
| S-10 | "**No USPTO filing evidence**" | 2026-09-09 | Re-tested; the one candidate traced and excluded as a SHA-256 prefix | **CURRENT AND SUPPORTED** | Stands |
| S-11 | "**Acceptance of the 2026-08-05 CCI terms not located**" | 2026-09-09 | Re-tested across the corpus | **EXTERNAL COMMUNICATION REFERENCED, UNDERLYING SOURCE NOT LOCATED** | Stands, reclassified |

## The pattern in my own errors

**Four of the eleven were wrong, and three share one cause.** S-1, S-2, S-3 and S-4 all
arise from searching **files** for evidence that exists as **rows**, compounded in S-2
by checking one of two instruments and reporting on both.

S-6 is a different and subtler fault worth naming separately: **the number was correct
and the impression it created was not.** "Confirmed 0 of 3" is true of the co-author
instrument and, stated without the contributor consents, understates what those people
have actually granted. A true figure can still mislead, and that is the failure mode
this register exists to catch.

## What did not change

S-5, S-9, S-10 and S-11 were re-tested against the full corpus and stand. **The
chain-of-title gaps that survive are real**, and they are now evidenced by exhaustive
search rather than by partial search.

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

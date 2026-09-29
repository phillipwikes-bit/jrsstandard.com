# Verification of the Buyer Readiness Checklist

**Date:** 2026-09-29 · **Document:** `JRS_Combined_Buyer_Readiness_Checklist_Updated_2026-09-29.pdf`
**Method:** every checkable assertion tested against the repository at `main` `9594f3d`.
**Authority:** verification only. No checklist item closed, no claim accepted on its own word.

> **EXTRACTION NOTE.** This container has no PDF tooling after the rebuild: `pdftotext` and
> `pdftoppm` are absent and `pypdf` cannot import because `cryptography` panics on load. The
> text was recovered by decoding the PDF object graph directly, resolving each font's own
> **ToUnicode CMap** rather than a merged table, and restoring word spacing from **TJ kerning
> offsets**. 10,076 words recovered. A merged-CMap attempt produced collided nonsense and was
> discarded rather than reported.

---

## Claims that hold

| Claim | Repository |
|---|---|
| E-037 is the detection panel, human reviewers, constructed records | **Confirmed.** E-037 is the detection-panel row |
| E-038 is a separate inter-rater reliability study, **criterion not met** | **Confirmed.** The row states both point estimates clear the first criterion and **neither clears the second** |
| Zero live organizations, zero sessions, zero revenue | **Confirmed verbatim** in `IP_SALE_TRACKER.md` |
| The 15 to 25 percent licensing figure is an internal estimate, not a measured probability | **Confirmed.** Six occurrences, all carrying that hedge |
| The 90-day deletion claim needs verification against production | **Confirmed live**: `privacy.html` and `security.html` each carry it once |
| The website must not imply 83.9% human detection validates the Engine | **Confirmed as a live exposure**: 83.9% appears on **eight** pages, and *"not Review Engine accuracy results"* appears on **zero** |

## One material error

**The checklist says the ledger runs E-001 through E-038. It runs E-001 through E-039.**

`RS-01` and the synchronization line both describe *"E-001 through E-038"*. The live ledger holds **39 entries**, the footer reads **39 ledger entries**, the Master Register index reads **39 entries, E-001 to E-039**, and `check_ledger_index_matches_the_ledger` **passes** at 39 across 1,411 tracked files.

**E-039 exists and the checklist does not mention it once.** It records the **STUDY-001 cross-vendor reproducibility series**, added 2026-09-20 because the ledger had no row covering a figure published on five deployable surfaces including the confidential buyer page.

**Why this matters more than a number.** E-039 is the row that keeps three run counts, 61, 37 and 41, from reading as three studies, and that records the reproducibility series as **consistency rather than accuracy or reliability**. A diligence reader working from an E-038 boundary would not find it, and TE-08's separation of E-037, E-038 and Engine performance is **incomplete without it**.

## Two observations, not errors

**The document is internally dated 23 September** while the filename says *Updated 2026-09-29*. Under the checklist's own FR-01 freshness rule, the as-of date is the one that governs. Either the header should move or the filename should not claim an update.

**WC-07 asks that the 12/12 zero-network test and the 63 Manifest checks be scoped to offline validation.** Both return **zero occurrences** on the live site. There is nothing to scope and nothing overclaimed. The item is satisfiable by recording that, rather than by editing a page.

## Not verifiable here

`AP-08`, `AP-09` and `WC-03` require a production read this environment's control denies. It was not worked around. The 90-day claim is confirmed **present**; whether the behaviour matches is **NOT ESTABLISHED**.

## Correction to make

In `RS-01` and the synchronization line, change **E-038** to **E-039**, and add E-039 to `TE-08`'s separation of research claims. It is the row that distinguishes cross-vendor consistency from both the detection result and the reliability result.

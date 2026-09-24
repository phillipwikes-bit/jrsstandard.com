# WC-01 to WC-10 audited against production

**Date:** 2026-09-24 · **Tree audited:** `origin/main` at `1d5d933`, extracted and inspected
**Authority:** audit only. No public claim was changed. No deployment performed.

> **WHY NOTHING WAS MUTATED.** Two reasons, both structural rather than cautious.
>
> **The working branch is 21 commits behind `main`.** WC-01 to WC-10 are public-claim items
> and the public claims live on `main`. Editing them on a stale branch would edit files that
> production has already replaced.
>
> **Every WC item is a published-representation change.** Under CLAUDE.md §26 those require
> human approval, and under the v7.0 directive §4 the correct action is to prepare everything
> and return the precise decision. The exact edits are specified below.

---

## Findings

| Item | State on production | Evidence |
|---|---|---|
| **WC-01** Version register | **NOT SATISFIED** | `jrsstandard.html` shows `v1.0 · May 2026`. **`v1.1` returns zero occurrences** in `jrsstandard.html` and `codebook.html`. No dated public version register locating the five-condition transition |
| **WC-02** Architecture label | **SATISFIED** | *"target licensing architecture"* appears twice on `index.html`, with the deployed boundary described beside it: *"Customer-controlled Manifest delivery remains target licensing architecture"* |
| **WC-03** Privacy and deletion | **CLAIM PRESENT, VERIFICATION NOT ESTABLISHED** | *"It is kept for 90 days and then removed"* at `privacy.html:212` and `security.html:277`. AP-08/09 verification requires a production read, which this environment's control denies and which was not worked around |
| **WC-04** Handover example | **UNQUALIFIED** | `review-engine.html` carries the sample. The input states *"the shift handover notes were incomplete"* and *"The handover notes were not retained."* The known defect is the Engine inferring absent incident or witness material from that narrower input. **No qualifier or disclosure accompanies it** |
| **WC-05** Condition vocabulary | **NOT SATISFIED** | All five engine keys appear on **seven pages**, including the public `review-engine.html` and the buyer surface `vp-7c1f9a4e8d2b6035.html`. Per BD-04 three of four non-exact mappings are declared and `cold_reviewer_clarity` remains **D-2, intentionally unresolved**. No visible conversion logic accompanies the keys |
| **WC-06** Research headlines | **NOT SATISFIED, AND THIS IS THE MATERIAL ONE** | The mandated sentence *"These are not Review Engine accuracy results"* returns **zero occurrences across the entire site**. `83.9` appears on **eight pages** including `acquisition-9f3c2a7d4b.html` |
| **WC-07** Synthetic test scope | **NOT PRESENT** | `12/12` and the 63 Manifest checks return **zero occurrences** on production. Nothing to scope, and nothing overclaimed |
| **WC-08** Experience and timing | **SATISFIED** | `3 to 8`, `15 to 30` and *"from practice"* return **zero occurrences**. Previously flagged claims are no longer on the site |
| **WC-09** Data categories | **NOT ASSESSED** | Depends on AP-11, which depends on the same blocked production read as WC-03 |
| **WC-10** Site QA | **LINK LAYER CLEAN** | 83 pages, **1,656 internal links, 0 broken, 0 missing anchors**. The claim register component is not present and remains open |

---

## WC-06 is the one that matters, and it is narrower than it looks

**The figures are not misrepresented.** Production consistently scopes 83.9% as a human panel
result: *"83.9% panel accuracy across the 16 independent experts of the detection panel and
384 graded reads (95% CI 72.7 to 95.1; sensitivity 87.0%, specificity 80.7%)"* on the buyer
surface, and *"independent experts detected Decision Reconstruction Risk at 83.9% accuracy on
a constructed corpus"* on the research summary, which also states its boundaries before the
figure rather than after.

**What is missing is the negative statement.** A reader is told what the number is. They are
not told what it is not. On a page that also describes the Review Engine, that inference is
available and nothing forecloses it.

**The fix is one sentence, placed once per page, on eight pages.** It adds no claim and
removes none.

---

## Exact prepared edits, for owner approval

1. **WC-06.** Insert *"These are not Review Engine accuracy results."* immediately after the
   83.9% figure on: `research.html`, `research-summary.html`, `results.html`, `pilot.html`,
   `check.html`, `engagement.html`, `reviewer/index.html`, `acquisition-9f3c2a7d4b.html`.
2. **WC-04.** Add a one-line disclosure beside the `review-engine.html` sample recording that
   the output inferred absent incident or witness material from an input supporting only
   missing handover notes, and that the case is retained as a known error.
3. **WC-01.** Publish a dated version register locating v1.0 of May 2026, the historical June
   v1.1, and the five-condition transition, without rewriting either.
4. **WC-05.** Either publish the BD-04 mapping with visible conversion logic beside the keys,
   or remove the raw engine keys from the two externally facing pages. **`cold_reviewer_clarity`
   remains unresolved and must not be mapped to close this item.**

**Not prepared:** WC-03 and WC-09 cannot close without a production read this environment
denies. WC-10's claim register is a build, not an edit.

---

## Branch state, which blocks all of the above

**`claude/html-pilot-L8rC3` is 21 commits behind `origin/main` and 41 ahead.**

**Twenty-one of those 41 commits are redundant and would regress production.** The branch
carries a fix to the `reference/` and `reviewer/` dead links using `../` and `../../` prefixes,
and a `compliance.html` skip-link target. **Production already has both**, done independently
and better: `main` uses the root-absolute `/investigator-guides.html`, correct at any depth,
and already carries `id="main-content"`. Verified: **zero pages on `main` still broken**.

**The only non-redundant work on this branch is documentation**: the two diligence assessments
and the tracker entries.

**This is an owner decision because it requires a force push**, which CLAUDE.md §19 permits
only with a recorded content-identity proof. The options are to reset the branch onto `main`
and re-apply the documentation commits only, or to leave it and cherry-pick the documentation
forward. **Neither was performed.**

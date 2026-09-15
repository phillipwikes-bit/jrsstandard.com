# STUDY-001 Reproducibility Figure — Authoritative Resolution

**Decision:** D-18 · **Date:** 2026-09-15 · **Source:** `findings_history` and `study_runs`,
the authoritative study tables, read directly. **No research figure was altered. No published
page was edited.**

**Status: OWNER ACTION REQUIRED.**

---

## The question

Two different figures are published, both labelled latest: **86.7%** on `research.html` and
`reviewer/index.html`, and **84%** on `pilot.html`, `results.html` and the buyer surface
`acquisition-9f3c2a7d4b.html`, the last of those undated.

## What the authoritative tables say

**FACT**, from `findings_history` where `study_id = 'STUDY-001'`:

| Property | Value |
|---|---|
| Recorded runs | **61** |
| First run | **2026-06-12** |
| Final run | **2026-08-21** |
| Agreement range | **0.667 to 0.933** (66.7% to 93.3%) |
| Mean across runs | **0.8526** (85.3%) |
| **Final run agreement** | **0.911 (91.1%)** |
| Models per run (`k`) | 3 |
| Records | 15 |
| Classification | Emerging Pattern |

**FACT**, from `study_runs`: 70 rows, last run **2026-08-21**, which is the recorded closure
date. The run history and the closure flag agree.

## The finding

**Neither published figure is the final run.** Both are real historical values: 86.7%
occurred in **6** runs and 84% in **4**. The site is publishing two different mid-study
snapshots, each labelled latest, and neither is current.

## Why this is not resolved by picking the final number

**The final-run figure, 91.1%, is near the top of a 66.7 to 93.3 range and is the most
flattering single value available.** Replacing a stale 84% with 91.1% would raise a published
research metric by seven points, and it would be doing so on the authority of one run out of
61 in a study that is now closed.

For a closed 61-run study, a single "latest" figure is the weakest available presentation
whichever run is chosen. The defensible statement is the distribution.

**RECOMMENDATION, not a decision.** Publish: *"Across 61 recorded runs between 12 June and
21 August 2026, agreement across three models on 15 constructed records ranged from 66.7% to
93.3%, mean 85.3%. The study closed on 21 August 2026."* That is verifiable, carries its own
n and dates, and is not improved by choosing a favourable run.

**This is flagged rather than implemented precisely because the change would move a headline
number upward.** An agent raising a research metric on its own initiative is the thing the
evidence rules exist to prevent.

## Separately, and not a figure question

Six surfaces describe the run in the **present tense** 25 days after it stopped:
`research.html` (Study 001 badged **Active**; "recomputed every night" beside a run dated 9
August), `research-data.html`, `pilot.html`, `reviewer/index.html`, and
`programme-status-9872fb93cc94.html`. `bench-review.html` and `submit-validation.html` carry
proper closure banners, so the pattern exists in the repository already.

**That half is a factual error rather than a methodology choice**, and correcting it does not
require choosing a number.

## Historical figures preserved

86.7% and 84% are **not wrong as history**. They were the reported values on the dates they
were reported. This document records them as superseded, not as errors.

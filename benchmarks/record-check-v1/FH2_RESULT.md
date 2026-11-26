# Second hold-out of good AI drafts (track FH2): result

Run once, 26 November 2026, on the final code of the third blind-spot round, as fixed in `FH2_PROTOCOL.md` (sealed in commit 84d0ef3c before any change; before-score at 8e17a723, totals only). The data hashes matched the protocol.

| Measure | Before | After | Criterion | Met |
|---|---|---|---|---|
| Good drafts with no serious flag | 4 of 30 | 7 of 30 (95% interval 12 to 41%) | before + 5 = 9 (product target 15) | **No** |
| Changed sentence flagged as serious | 17 of 30 | 19 of 30 (46 to 78%) | at least 21 | **No** |
| ... by kind | | dates 15 of 16; negations 2 of 10; figures 2 of 4 | | |
| Guards (hold-out 1 28/28 x3; tracks B, C, E not worse; all tests) | | held (229 tests) | all | Yes |

**The second hold-out failed too**, but moved the right way on both measures.

**Added after the run (not in the protocol, so reported, not counted):**

- Statements carrying a serious flag on the 30 good drafts: 121 of 985 (12.3%) before, 105 of 973 (10.8%) after.
- How many serious flags are real. A sample of 20 serious flags on the good drafts, picked by a fixed hash order, read against the decision by the developer (not independent): **7 genuine** (the draft adds analysis or a claim the decision does not make, for example "Funding constraints ..., rather than discriminatory intent, explain the limitations" and a 300-day limit stated where the decision gives a 45-day one), **11 false alarms** (the decision supports the sentence), 2 unclear. Detail: `../../tests/ds-n1/FLAG_REVIEW.md`.

What this means: on fresh AI drafts the tool now flags about one statement in ten as serious; roughly a third to two fifths of those flags point at something the draft added that the decision does not support, and the rest are false alarms a reviewer has to clear by reading the decision. It does not yet clear a reworded draft by itself, and it still misses most inserted negations in reworded text (2 of 10).

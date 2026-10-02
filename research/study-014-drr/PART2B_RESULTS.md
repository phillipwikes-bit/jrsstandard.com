# Study 014 Part 2b results: Engine 0.3.0 against Engine 0.1.0

**Run 2026-10-03 under `PART2B_PROTOCOL.md`, fixed in commit `dfc1022` before any call.**
- 432 of 432 calls returned. 16 stopped at the token limit (E1 10, E3 6), which gave 17 unparsed responses (E1 10, E3 7).
- Every item still has a modal answer except one E1 control, which lost all 3 runs.
- Spend was USD 2.45.
- Counts are in `runs/PART2B_SCORES.json`. Texts and responses are not committed.

## Verdict
| Hypothesis | Result (FACT, pre-registered rule) |
|---|---|
| **H6:** E3's `missing` list catches at least 70% of citation and of attribution deletions, with false flags at most 20% on intact texts that contain the type | **FAILS.** Hits are perfect, but false flags are far above the bar: **citations 8 of 9** (0.89) and **attributions 14 of 24** (0.58) |
| **H6d:** no regression on dates | **Met:** 7 of 7 caught, 1 of 24 false flags (0.04) |

## Full table: caught / false flags on intact texts containing the type
| Arm and layer | Citations | Attributions | Dates | Drafts that lost a type, flagged |
|---|---|---|---|---|
| E1, Engine 0.1.0, five conditions (mapped) | 0/9 · 0/9 (*structural*) | 8/8 · 6/23 | 6/7 · 3/23 | 12/18 |
| **E3, Engine 0.3.0, `missing` list** | **9/9 · 8/9** | **8/8 · 14/24** | **7/7 · 1/24** | 17/18 |
| E3, Engine 0.3.0, five conditions (mapped) | 0/9 · 0/9 (*structural*) | 8/8 · 11/24 | 7/7 · 2/24 | 13/18 |

## Findings (FACT unless labelled)
1. **The `missing` list repeats the Codebook arms' failure.**
   - Asked to list what a record lacks, the model names record citations on nearly every record that has them.
   - Across all 72 runs on intact texts it named `record_citations` 64 times, `attributions` 42 times and `criteria` 38 times.
   - A flag that appears whether or not the citations are there cannot tell a damaged record from an intact one.
   - *Inference:* the model reads "record citations" as "a citation for every statement". These decisions cite the record only in places, so it always finds something uncited.
2. **Dates stay specific in 0.3.0.** The `missing` list caught 7 of 7 date deletions and flagged 1 of 24 intact texts, so there is no regression on the Engine's one demonstrated strength.
3. **The prompt change made the five conditions slightly less specific on attributions.** False flags rose from 6 of 23 to 11 of 24 under the same mapping. The determination is derived from the conditions, so 0.3.0 would raise more "review" results than 0.1.0 on intact records.
4. **E1 replicates Part 2 on new texts, and is somewhat better here.** It caught 8 of 8 attribution deletions (Part 2: 4 of 10) with 6 of 23 false flags, and 6 of 7 date deletions with 3 of 23. The texts differ, so the two parts should not be pooled.
5. **Token-limit stops break answers.** 16 runs were cut off before the JSON closed. The production Engine has the same limit, so some real reviews would fail to parse (advancement 2 in the tracker: structured output).

## Decision consequence (INFERENCE; for the owner)
- **Engine 0.3.0 should not be released as built.** Its new list over-flags citations and attributions, and its prompt change reduced condition specificity on attributions. B-024 stays OPEN with this recommendation.
- **What would plausibly work** is a proposal only, untested:
  - Stop asking the model whether citations are missing.
  - Report a citation or attribution gap only from the rule-based `anchor_profile` when it counts **zero**.
  - Keep the model's list for the items the rules cannot see (decision-maker, criteria, responses considered), and measure its false flags first.
  - Caveat: the rule-based check would catch synthetic deletions by construction, so its value has to be shown on natural drafts and on records outside this text family. Its speaker count also misses named people (see `api/_anchors.js`).
  - This needs its own protocol, fixed in advance, and new texts. These 24 have now been used for this question.

## What may be said
- "In a controlled test, adding a 'what is missing' list to the JRS Review Engine flagged missing citations and attributions on most intact records, so the change was not adopted. The Engine's specificity on dates was unchanged."
- No claim that the Engine detects missing citations or attributions.

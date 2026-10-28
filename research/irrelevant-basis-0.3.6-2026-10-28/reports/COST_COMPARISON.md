# Cost and benefit of 0.3.6 against 0.3.5 (same proposals)

Same proposals compiled by both versions. LIVE = offline replays of captured responses; SCRIPTED = frozen scripted proposals, not model output. No human relevance assessment supplied. AI-proposed references are not human labels.

| Set | Items | FLAG lost | New FLAG (on AI-grounded) | CLEAR | CLEAR on AI-ungrounded | Supported basis conditions | INDETERMINATE rate | Condition gaps lost / flaw reasons lost / new | Controls | Guard or mechanical failures (before / after) |
|---|---|---|---|---|---|---|---|---|---|---|
| LIVE_all | 401 | 0 | 0 (0) | 1 → 0 | 0 → 0 | 52 → 0 | 0.5087 → 0.5112 | 0 / 0 / 0 | 581 → 581 | 0 / 0 |
| LIVE_RUN | 312 | 0 | 0 (0) | 1 → 0 | 0 → 0 | 47 → 0 | 0.4872 → 0.4904 | 0 / 0 / 0 | 433 → 433 | 0 / 0 |
| LIVE_TGT_stated_irrelevant_basis | 42 | 0 | 0 (0) | 0 → 0 | 0 → 0 | 1 → 0 | 0.6667 → 0.6667 | 0 / 0 / 0 | 18 → 18 | 0 / 0 |
| LIVE_TGT_instruction | 44 | 0 | 0 (0) | 0 → 0 | 0 → 0 | 4 → 0 | 0.5 → 0.5 | 0 / 0 / 0 | 125 → 125 | 0 / 0 |
| SCRIPTED_all | 624 | 0 | 0 (0) | 99 → 0 | 0 → 0 | 429 → 0 | 0.3205 → 0.4792 | 0 / 0 / 0 | 825 → 825 | 0 / 0 |
| SCRIPTED_ORACLE | 104 | 0 | 0 (0) | 8 → 0 | 0 → 0 | 70 → 0 | 0.4135 → 0.4904 | 0 / 0 / 0 | 138 → 138 | 0 / 0 |
| SCRIPTED_OVERCLAIM | 104 | 0 | 0 (0) | 8 → 0 | 0 → 0 | 70 → 0 | 0.4135 → 0.4904 | 0 / 0 / 0 | 138 → 138 | 0 / 0 |
| SCRIPTED_UNDERCLAIM | 104 | 0 | 0 (0) | 0 → 0 | 0 → 0 | 0 → 0 | 0.4904 → 0.4904 | 0 / 0 / 0 | 138 → 138 | 0 / 0 |
| SCRIPTED_ORACLE-R | 104 | 0 | 0 (0) | 34 → 0 | 0 → 0 | 114 → 0 | 0.1635 → 0.4904 | 0 / 0 / 0 | 138 → 138 | 0 / 0 |
| SCRIPTED_OVERCLAIM-R | 104 | 0 | 0 (0) | 34 → 0 | 0 → 0 | 114 → 0 | 0.1635 → 0.4904 | 0 / 0 / 0 | 138 → 138 | 0 / 0 |
| SCRIPTED_ADV | 104 | 0 | 0 (0) | 15 → 0 | 0 → 0 | 61 → 0 | 0.2788 → 0.4231 | 0 / 0 / 0 | 135 → 135 | 0 / 0 |

Full detail, including the E1 transition matrix for every set and every changed item: `out/COST_COMPARISON.json`.

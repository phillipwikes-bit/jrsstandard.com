# Second hold-out of good AI drafts (track FH2): protocol, fixed before any change

Written 26 November 2026, before any of the changes it tests. The first hold-out (FH) failed and is now development material.

**Items.** Study 014's Haiku P2 drafts of the 30 public EEOC decisions (branch `claude/engine-eval-v8-2026-10-01`, `research/study-014-drr/runs/2026-10-02-draft/raw/`), the only study 014 drafts no test or fix has used. P2 asked for a "findings" write-up; the Sonnet P2 drafts added analysis the source could not support (paraphrase hold-out 3), so this is a hard set. Each draft appears as written and with one error put in by the track F rule (`build-track-f.mjs ... _P2.txt track-f-holdout-2`): 16 dates, 10 negations, 4 figures.

Hashes: `data/track-f-holdout-2.json` 7a05c65cf0f632e748eea09acdf18ea7a1d4a0fb76c3d16d796816650d8fa0a7; `data/track-f-holdout-2.key.json` 9023a28d481fe9d8756098be6e789812d9363d21366f0a81f92d983f60068d4d.

**Before.** The code at commit 8e17a723 is scored once now, totals only; no item is read (`answers/FH2_BEFORE.score.json`).

**After.** Changes are made using tracks A to F and FH only. The final code is scored once on FH2 and the number is reported whatever it is.

**Criteria, all required:**
1. Good drafts with no serious flag: better than before by at least 5 (and the product target of 15 of 30 is reported against).
2. Changed sentence flagged as serious: at least 21 of 30.
3. Guards: real-record hold-out 1 stays 28 of 28 on all three counts; tracks B, C and E do not get worse; every test passes.

# Hold-out of good AI drafts (track FH): protocol, fixed before any change

Written 25 November 2026, before any of the changes it tests.

**Items.** Study 014's Haiku P3 drafts of the 30 public EEOC decisions (published on branch `claude/engine-eval-v8-2026-10-01`, `research/study-014-drr/runs/2026-10-02-draft/raw/`). No earlier test or fix used these drafts. Each appears as written and with one error put in by the same rule as track F (`build-track-f.mjs ... _P3.txt track-f-holdout`): 18 dates moved by one day, 10 "was" made "was not", 2 figures doubled.

Hashes: `data/track-f-holdout.json` 9a77b41c8b284628fc6d34cb156fe7dcdade9dec2fe7f22d57e227a3d616ac0e; `data/track-f-holdout.key.json` 722db52cfd4dd9996032e5627fb7c62aaa501a71624f1a29ead87b3ae0f17df9.

**Before.** The code at commit 6e460212 is scored once now, totals only; no item is read (`answers/FH_BEFORE.score.json`).

**After.** Changes are made using tracks A to F only. The final code is scored once on FH; that number is reported whatever it is.

**Pass criteria, all required:**
1. At least 15 of 30 good drafts carry no serious flag (the product target used since the first paraphrase hold-out).
2. In at least 21 of 30 changed copies (70%), the changed sentence is flagged as serious.
3. Guards: real-record hold-out 1 stays 28 of 28 on all three counts; tracks B, C and E do not get worse; every automated test passes.

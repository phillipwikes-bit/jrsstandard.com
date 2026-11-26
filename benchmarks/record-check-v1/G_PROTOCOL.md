# Track G (fresh decisions, one changed sentence): protocol, fixed before the run

Written 26 November 2026. Every study 014 AI draft has now been used in development, so no fresh reworded drafts remain. Track G tests the round 2 to 4 negation and date checks on decisions the tool has never seen, without rewording.

**Items.** 60 distinct EEOC appellate decisions from the downloaded set, in file-name order, excluding every decision number used in tracks A and E (`track-g-excluded.txt`; the same case can be posted twice, so numbers, not files, are excluded). From each, a passage of five consecutive sentences, as published (`-good`) and with the middle sentence changed (`-changed`): in 30 decisions one "was" made "was not" in a sentence with no negation, in 30 one full date moved by one day. Built by `build-track-g.mjs`.

Hashes: `data/track-g.json` 42bf8d82a61c901adb3ffb487402f8276680f28a47b44a10f98b8a04c826d91b; `data/track-g.key.json` e0055f19f9504d5e58527b1934e677a64001e0e4a28aeb599ccbfedcdfe945b5.

**Run.** The code at the commit after this one (no change to `lib/` in between) is scored once and the result reported whatever it is.

**Pass criteria, both required:**
1. Unchanged passages with no serious flag: at least 54 of 60 (90%).
2. Changed sentence flagged as serious: at least 48 of 60 (80%), reported separately for negations and dates.

**Limits.** This is copying and one-word changes, not rewording; the developer built it and chose the change rules.

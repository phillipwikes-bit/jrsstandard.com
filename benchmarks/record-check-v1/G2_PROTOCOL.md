# Track G2 (fresh decisions, one "not" removed): protocol, fixed before the run

Written 26 November 2026, during the fifth round of fixes and before any run on these items. Track G tested a "not" put in; G2 tests a "not" taken out ("Complainant was not selected" made "Complainant was selected"), on decisions the tool has never seen.

**Items.** 30 distinct EEOC appellate decisions from the downloaded set, in file-name order, excluding every decision number used in tracks A, E and G (`track-g2-excluded.txt`). From each, five consecutive sentences, as published (`-good`) and with the middle sentence's only "not" removed (`-changed`). Built by `build-track-g2.mjs`. A figure change was planned as a second kind, but only 1 of the first 31 qualifying decisions had a usable figure mid-passage, so figures stay with track E.

Hashes: `data/track-g2.json` deab0f519d93d2f98daeda5d78f6aab411ce1ab16ffa2533e0d95c9b1126fb61; `data/track-g2.key.json` b0df26b4b7924dce1b040cd7ad8a83336e57ecacef5efdd2cdb6fd6b66873482.

**Run.** Once, on the code of the fifth round as committed next (the round's changes were made using tracks A to G only), and reported whatever the result.

**Pass criteria, both required:**
1. Unchanged passages with no serious flag: at least 27 of 30 (90%).
2. Changed sentence flagged as serious: at least 24 of 30 (80%).

**Limits.** Copying with one change, not rewording; built by the developer.

# Track G2 (fresh decisions, one "not" removed): result

Run once, 26 November 2026, on the round 5 code (commit e335589d), as fixed in `G2_PROTOCOL.md` (sealed in commit 8fbf2b0f). The data hashes matched the protocol.

| Measure | Result | 95% interval | Criterion | Met |
|---|---|---|---|---|
| Unchanged passages with no serious flag | **30 of 30** | 89 to 100% | at least 27 | Yes |
| Changed sentence ("not" removed) flagged as serious | **29 of 30** | 83 to 99% | at least 24 | Yes |

**Passed.** With track G (a "not" put in, a date moved), the tool has now been tested on 90 public decisions it had never seen: 90 of 90 copied passages raised no serious flag, and 86 of 90 single changes were caught.

**What this does not show.** Copying with one change, not rewording. Built by the developer; no independent check.

# Track G (fresh decisions, one changed sentence): result

Run once, 26 November 2026, as fixed in `G_PROTOCOL.md` (sealed in commit a8109aa8). The only change under `lib/` between the seal and the run was text in `lib/ds-n1/package/PRODUCT_SHEET.md`; no code changed.

| Measure | Result | 95% interval | Criterion | Met |
|---|---|---|---|---|
| Unchanged passages with no serious flag | **60 of 60** | 94 to 100% | at least 54 | Yes |
| Changed sentence flagged as serious | **57 of 60** | 86 to 98% | at least 48 | Yes |
| ... "was" made "was not" | 29 of 30 | | | |
| ... a date moved by one day | 28 of 30 | | | |

**Passed.** On 60 public decisions the tool had never seen, passages copied from the decision raised no serious flag, and a single inserted "not" or a date moved by one day was caught in 57 of 60.

**What this does not show.** These passages are copied, with one word or date changed; they are not reworded. On reworded AI drafts the tool is much weaker (tracks F, FH and FH2). The developer built the set and chose the change rules; no independent person has checked it.

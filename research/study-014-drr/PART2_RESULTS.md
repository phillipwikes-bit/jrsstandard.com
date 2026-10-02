# Study 014 Part 2: detection results (PROVISIONAL, 84% complete)

**Run 2026-10-02.**
- 1,135 of 1,350 planned calls returned; 1,131 were parsed.
- The API credit ran out a second time, after 930 calls in the resume. The 211 missing calls fall on the last 15 items.
- Spend for Part 2 was USD 20.68 (3.61 + 17.07).
- Scoring is modal across the 3 runs per arm, as pre-registered, and done by `tools/study014.py score ... 2026-10-02-detect,2026-10-02-detect-resume`.
- **These figures may change when the remaining calls are run.**

## Pre-registered rules, applied as written
| Hypothesis | Rule | Result (provisional) |
|---|---|---|
| H2 | B, C and D have a higher deletion-hit rate than A, with the control flag rate reported alongside | **Met by the letter:** B, C and D 25/25 against A 23/26. **But not informative**, because B and C name the deleted type on nearly every unaltered record too (next table) |
| H3 | C beats B and D | **Not met:** C ties B (25/25) and D (25/25) |

## The table that matters: hits on deletions against false flags on unaltered records
"del" is the number of deletion items on which the arm named the deleted type. "ctrl" is the number of the 26 unaltered sources on which it named that same type.

| Arm | Dates: del / ctrl | Citations: del / ctrl | Attributions: del / ctrl |
|---|---|---|---|
| A, generic prompt (Sonnet) | 10/10 / 12/26 | 6/9 / 21/26 | 7/7 / 13/26 |
| B, Codebook text (Sonnet) | 10/10 / 24/26 | 9/9 / 26/26 | 6/6 / 19/26 |
| C, Engine v0.2 evaluation build (Sonnet) | 10/10 / 25/26 | 9/9 / 26/26 | 6/6 / 22/26 |
| D, Codebook text (Opus) | 10/10 / 24/26 | 9/9 / 23/26 | 6/6 / 13/26 |
| **C0, production Engine prompt (Haiku)** | **10/10 / 1/26** | 0/9 / 0/26 (*structural*) | 2/6 / 3/26 |

### Findings (FACT unless labelled)
1. **The Codebook-prompted reviewers (B, C) flag nearly everything.**
   - They named dates as missing on 24 and 25 of 26 unaltered records, and citations on 26 of 26.
   - A reviewer that always says "missing" scores perfectly on deletions, so their deletion hits show nothing about detection.
   - *Inference:* the Codebook framing makes a model more critical across the board. It does not make it better at telling a damaged record from an intact one.
2. **The production Engine (C0) separates date deletions cleanly.** It caught 10 of 10 and wrongly flagged 1 of 26 unaltered records. No other arm comes close on that type.
3. **C0 cannot report citations by design.**
   - Its production output has no condition that the pre-registered mapping turns into `record_citations`. Its 0/9 is a property of the mapping, not a measured failure.
   - Its attribution detection is weak: 2 of 6 caught, against 3 of 26 false flags.
4. **The generic reviewer (A) discriminates moderately on dates and attributions, but not on citations.** It flagged citations on 21 of 26 unaltered records.
5. **The larger model (D, Opus) is more selective on attributions than B or C** (13/26 false flags against 19 and 22). It is no better on dates.

### Draft hits (P1 Sonnet drafts that lost at least one type)
- A, B and C name a lost type on all 19.
- D names one on 16 of 19, and C0 on 11 of 19.
- Given the control flag rates above, high draft-hit rates for A, B and C are expected whether or not the reviewer detects anything.

## What may be said (provisional)
- "In a controlled test, the production JRS Review Engine identified every record from which dates had been removed (10 of 10), while flagging 1 of 26 intact records."
  - It must be paired with: "It did not detect removed citations, which its output format cannot express, and detected 2 of 6 removed attributions."
  - Also add: "Reviewers prompted with the JRS Codebook text flagged missing material on nearly every record, intact or not."
- No claim that JRS prompting improves detection in general. The data point the other way for the Codebook-only arms.

## Limits
- 84% complete; the last 15 items are missing.
- 10, 9 and 6 deletion items per type, so the intervals are wide.
- All arms except D use one provider's mid-size models.
- The deletions are synthetic.
- The C0 mapping was fixed before the run (`PROTOCOL.md`), but it is coarse.

## To complete
- About USD 4 more credit (*Inference*, from the cost of this run).
- Then run `python3 tools/study014.py detect-resume 2026-10-03-detect-resume2 2026-10-02-draft 2026-10-02-detect,2026-10-02-detect-resume`.
- Then score with all three run folders.

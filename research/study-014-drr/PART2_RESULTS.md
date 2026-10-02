# Study 014 Part 2: detection results (FINAL)

**Run 2026-10-02 and 2026-10-03, in three folders.** The API credit ran out twice, and each resume sent only the calls that had not returned.
- `runs/2026-10-02-detect`: 205 calls.
- `runs/2026-10-02-detect-resume`: 930 returned, 215 not.
- `runs/2026-10-03-detect-resume2`: 213 returned, 2 unparsed.

**1,348 of 1,350 planned calls were usable.** All 90 items have a modal answer for all five arms. Spend for Part 2 was USD 24.47.

Scoring is modal across the 3 runs per arm, as pre-registered: `tools/study014.py score 2026-10-02-draft 2026-10-02-cloze 2026-10-02-detect,2026-10-02-detect-resume,2026-10-03-detect-resume2`.

## Pre-registered rules, applied as written
| Hypothesis | Rule | Result |
|---|---|---|
| H2 | B, C and D have a higher deletion-hit rate than A, with the control flag rate reported alongside | **Met by the letter:** B, C and D 30/30 against A 27/30. **Not informative:** B and C name the deleted type on nearly every intact record as well (next table) |
| H3 | C beats B and D | **Not met:** C ties both at 30/30 |

## The table that matters: hits on deletions against false flags on intact records
The first number in each cell is deletions caught, out of 10 per type. The second is intact sources on which the same type was named, out of 30.

| Arm | Dates | Citations | Attributions |
|---|---|---|---|
| A, generic prompt (Sonnet 5.5) | 10/10 · 15/30 | 7/10 · 24/30 | 10/10 · 15/30 |
| B, Codebook text (Sonnet 5.5) | 10/10 · 28/30 | 10/10 · 30/30 | 10/10 · 22/30 |
| C, Engine v0.2 evaluation build (Sonnet 5.5) | 10/10 · 29/30 | 10/10 · 30/30 | 10/10 · 25/30 |
| D, Codebook text (Opus 5.5) | 10/10 · 28/30 | 10/10 · 26/30 | 10/10 · 15/30 |
| **C0, production Engine prompt (Haiku 4.5)** | **10/10 · 2/30** | 0/10 · 0/30 (*structural*) | 4/10 · 4/30 |

## Findings (FACT unless labelled)
1. **Codebook prompting on its own does not improve detection.**
   - B and C named dates as missing on 28 and 29 of 30 intact records, and citations on 30 of 30.
   - A reviewer that nearly always says "missing" cannot tell a damaged record from an intact one, so their perfect deletion scores carry no information.
   - *Inference:* the Codebook framing makes a model more critical across the board, not more discerning.
2. **The production JRS Review Engine is specific on dates.** It caught 10 of 10 date deletions and flagged 2 of 30 intact records. No other arm comes close on any type.
3. **The production Engine cannot report missing citations,** because its output has no condition that maps to them (0/10 is structural). On attributions it caught 4 of 10, against 4 of 30 false flags. That is weak.
4. **The generic reviewer (A) is moderately discerning** on dates and attributions (10/10 caught against 15/30 false flags), and not on citations (7/10 against 24/30).
5. **The larger model with the Codebook (D)** matches A on attributions (15/30 false flags), against 22 and 25 for B and C. On dates it over-flags like B and C.
6. **Draft hits** (P1 drafts that lost at least one type, 24 drafts):
   - A, B and C hit 24/24; D 21/24; C0 13/24.
   - For A, B and C this is expected from their control flag rates whether or not they detect anything.

## What may be said
- "In a controlled test on 30 EEOC decision backgrounds, the production JRS Review Engine identified all 10 records from which dates had been removed, while flagging 2 of 30 intact records."
  - It **must** be paired with: "It did not detect removed record citations, which its output format does not express, and detected 4 of 10 records with attributions removed."
- "Reviewers given the JRS Codebook text flagged missing material on nearly every record, intact or not."
- **Not allowed:**
  - that JRS prompting improves AI review in general;
  - that the Engine detects missing information in general;
  - any accuracy, certification or compliance claim.

## Limits
- 10 deletion items per type. The intervals are wide: 10/10 has a 95% interval of about 0.72 to 1.00.
- The deletions are synthetic, made by rule.
- The C0 mapping (`PROTOCOL.md`) is coarse, and it is the reason citations cannot be scored for C0.
- One text family.
- Arms A to C share one model, and D is from the same provider.

## Product implications (INFERENCE; for the owner)
- The Engine's value is **specificity** (few false alarms) on chronology. Thoroughness is not the selling point.
- An Engine v0.3 that expresses missing record citations and attributions as conditions would close the two measured gaps. It would need its own pre-registered test.
- The "JRS Codebook in a prompt" product shape is not supported by this test.

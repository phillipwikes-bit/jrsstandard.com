# Study 013 feasibility round: public-record case set

**Built 2026-10-02 in Claude Code. No model call has been made. Status: case set BUILT, owner review PENDING, run BLOCKED.**

## What is here
| Path | What |
|---|---|
| `SELECTION_RULE.md` | The rule fixed before any decision was read, plus five dated amendments, each saying what had been seen when it was made |
| `tools/harvest.py` | Runs the fixed EEOC queries and downloads the decisions (PDFs are not committed; `.gitignore`) |
| `tools/classify.py` | Labels each decision from the EEOC's own ruling words |
| `tools/select_and_strip.py` | Takes 15 GAP (newest first) and 15 date-matched PASS, strips outcome text, shuffles with seed 13 |
| `raw/candidates.json`, `raw/classified.json` | 750 candidates, their flags and labels |
| `cases/S013-01.txt` to `S013-30.txt` | **The 30 texts a model would see** |
| `KEY.json` | The hidden answer key: label, source URL, PDF sha256, and the EEOC sentence that supports each label |
| `STRIP_LOG.json` | Every sentence removed, by case |

## Result (*Observed*, from the scripts)
- 750 candidates; 18 GAP decisions passed the tightened rule, each with an EEOC finding sentence; 15 used.
- 15 GAP and 15 PASS, matched by posting year (2020: 1, 2021: 4, 2022: 2, 2023: 3, 2024: 5 in each pool).
- 3 EDGE cases, all PASS: liability decided on the record, remanded on damages only.
- Removed sentences per case: 0 to 5.

## Limits that matter
1. **Most texts are too long for the Engine.** 20 of 30 exceed its 8,000-character limit (8 GAP, 12 PASS). Running only the cases that fit leaves 7 GAP and 3 PASS, which is unbalanced. This is assessment item 27 and needs an owner decision. The options are an evaluation-only higher limit in the adapter, a fixed-length excerpt rule, or accepting the imbalance.
2. **Length differs by pool:** GAP texts average 1,465 words and PASS texts 1,935. A model could use length as a cue. Report results by length band.
3. **Memorization:** the GAP pool runs from 2020 to 2024, because 2026 had too few merits remands (amendment 2). Most of these predate the models' training cutoffs, so arm A (no JRS) is the recognition check.
4. **A summary, not the file:** the EEOC background section describes the investigative record; it is not the record.
5. **Labels are what the EEOC found** on the issues it decided. A PASS case can still have a gap the EEOC did not need to reach.
6. **Rights:** US federal government works are generally not under copyright (17 U.S.C. 105). REQUIRES HUMAN REVIEW.
7. **The amendments came after counts were seen** (amendments 2 to 5). Each one is recorded with what was known at that point. None was made after any model output, because no model has been run.

## Before the run
1. **Owner review (Appendix E.4, control 7):** read the 30 case texts. Flag any text that still gives away the outcome, and any that is not about an investigation record.
2. **Decide item 27** (limit 1 above).
3. Put the provider keys in the environment settings: Anthropic for arms A to C, and a second vendor for arm D.
4. Items 24 to 26 and 28: model migration, Codebook mapping, rewrite removal, no-telemetry mode.

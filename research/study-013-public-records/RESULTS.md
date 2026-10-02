# Study 013 feasibility round: results

**Run 2026-10-02, 14:48 to 15:06 UTC. 450 of 450 calls made; observed cost USD 9.6022.** Outputs are in `runs/2026-10-02-main/`: `MANIFEST.json`, `results.jsonl`, `raw/`, `SCORES.json`, and the blinded `WORKSHEET.csv`. Scoring is deterministic (`tools/score-study.mjs`); no model graded anything. The protocol was fixed before the run (`PROTOCOL.md`) and was not changed after it.

## Headline (*Observed*)
**On the pre-registered primary outcome, no arm separated the records the EEOC found adequate from those it sent back.** Every arm flagged all 15 GAP cases, and also flagged 12 to 15 of the 15 PASS cases.

| Arm | Model | Primary: GAP flagged (sensitivity) | Primary: PASS not flagged (specificity) | Strict (gap only): sensitivity | Strict: specificity | Stable across 3 runs | USD |
|---|---|---|---|---|---|---|---|
| A, generic prompt | Sonnet 5.5 | 15/15 [0.80, 1.00] | 3/15 [0.07, 0.45] | 14/15 [0.70, 0.99] | 5/15 [0.15, 0.58] | 28/30 | 1.04 |
| B, public JRS | Sonnet 5.5 | 15/15 [0.80, 1.00] | 0/15 [0.00, 0.20] | 15/15 [0.80, 1.00] | 2/15 [0.04, 0.38] | 28/30 | 1.69 |
| C, Engine v0.2-eval | Sonnet 5.5 | 15/15 [0.80, 1.00] | 0/15 [0.00, 0.20] | 12/15 [0.55, 0.93] | 6/15 [0.20, 0.64] | 21/30 | 2.14 |
| C0, production Engine v0.1 | Haiku 4.5 | 15/15 [0.80, 1.00] | 3/15 [0.07, 0.45] | 6/15 [0.20, 0.64] | 14/15 [0.70, 0.99] | 13/30 | 0.60 |
| D, public JRS | Opus 5.5 | 15/15 [0.80, 1.00] | 0/15 [0.00, 0.20] | 13/15 [0.62, 0.96] | 4/15 [0.11, 0.52] | 28/30 | 4.13 |

Brackets are Wilson 95% intervals. "Flagged" means the modal route across the 3 runs was gap or review. 4 of C0's 90 calls failed, 3 truncated at its 900-token output cap and 1 unparsable; no other arm had a failure.

## Pre-registered comparisons
- **A against B (does JRS help a general model?):** no. B flagged more PASS records than A (A was right on 3 that B missed; B was right on none that A missed).
- **B against C (does the Engine add anything beyond public JRS?):** no difference on the primary outcome; identical case-level agreement. C was **less stable** (21/30 against 28/30).
- **C against D (does a stronger model with public JRS match the Engine?):** D matched C on the primary outcome and was more stable (28/30 against 21/30).
- **C0 against C:** the production Engine on Haiku used "review" for most records (20 of 30) and rarely "gap". On the strict measure, that gives it the highest specificity (14/15) but the lowest sensitivity (6/15).
- **Bands:** GAP texts are shorter, but no arm used length to pass long records (specificity on long texts was 0 to 3 of 9). Health-sector agencies: the same pattern (4/4 flagged; 0 or 1 of 4 PASS not flagged).

**Stop rule (assessment E.2, point 7):** the protocol's condition is met at feasibility level. A strong general model given the public JRS (D) matched the Engine (C) on detection, and exceeded it on stability. So the Engine's prompt adds no measured value over the public JRS text in this round.

## The most likely explanation (*Inference*; needs testing, not established)
1. **Different bars.** JRS conditions ask whether a record stands on its own as documentation. The EEOC asks whether the record is adequate to decide the claim. Many records the EEOC upheld still fail a documentation-sufficiency reading. The protocol anticipated this: "Specificity is a lower bound."
2. **Summaries, not records.** Every text is the EEOC's condensed background section. A summary leaves out detail by design, so a reviewer looking for documentation will find "missing" items in almost any summary.
3. Under both readings, the result says little about the Engine on real investigative files. It says a lot about using AI documentation review as a stand-in for adjudicative adequacy: **AI reviewers applied a stricter bar than the adjudicator.**

## What this does and does not support
- **Supports:** on these 30 public summaries, none of the five arms could tell adequate from inadequate records; all of them over-flag. The Engine prompt did not outperform the public JRS text, and a stronger model was as good and more stable.
- **Does not support:** any accuracy claim, any claim that JRS "detects" inadequate investigations, or any claim of Engine superiority. It does not show that JRS is wrong: the construct mismatch (point 1) remains open.
- **Sample:** n = 30, a feasibility round.

## Still to do
1. **Deficiency match, scored by a human (PROTOCOL amendment 1).** `runs/2026-10-02-main/WORKSHEET.csv` has 75 rows: 15 GAP cases by 5 arms, relabeled P to T. Mark whether each reviewer named one of the EEOC's ordered deficiencies. Do not open `UNBLINDING.json` until scoring is finished. This answers a separate question from the headline: when reviewers flag a gap, do they flag the right one?
2. Owner verification of the deficiency coding (`GAP_DEFICIENCIES.json`).
3. **A follow-up design that fits the construct** (*Proposal*, not run):
   - PASS records the EEOC described as thorough, or full reports of investigation rather than summaries;
   - a second label from a human JRS reviewer, so JRS-adequacy and EEOC-adequacy can be measured separately.

# Study 014 confirmatory run: results

**Run 2026-10-02 under `CONFIRMATORY_PROTOCOL.md`, which was fixed in commit `8adb7e2` before any call.**

- 174 of 174 drafts returned; none was truncated.
- Spend was USD 3.20.
- The scorer was suite v0.9 (extractor v1.2), and `verify` passed.
- Scores are in `runs/CONFIRMATORY_SCORES.json`. They hold counts only; the held-out texts and drafts are not committed (B-023).

## Verdict: H4c FAILS (FACT, pre-registered rule)
| Condition | Sonnet 5.5 | Haiku 4.5 |
|---|---|---|
| P4 pooled retention greater than P1 **and** P2 | **No.** P4 1.00 against P2 1.00 (a tie); against P1 0.37, yes | Yes: 1.00 against 0.57 and 0.21 |
| P4 automatic unsupported count not higher than P1 | **No.** 4 against 2 | **No.** 2 against 0 |

**The H4 sentence ("without more unsupported additions") may not be used.** This is the second test of it to fail on the automatic count.

## Retention (medians, 29 held-out texts)
| Drafter | Prompt | Dates | Citations | Attributions | Quotes | Pooled | Unsupported (automatic) |
|---|---|---|---|---|---|---|---|
| Sonnet 5.5 | P1 | 0.78 | 0.00 | 0.50 | 0.00 | 0.37 | 2 |
| Sonnet 5.5 | P2 | 1.00 | 1.00 | 1.00 | 0.67 | 1.00 | 8 |
| Sonnet 5.5 | P4 | 1.00 | 1.00 | 0.67 | 1.00 | 1.00 | 4 |
| Haiku 4.5 | P1 | 0.45 | 0.00 | 0.25 | 0.00 | 0.21 | 0 |
| Haiku 4.5 | P2 | 0.70 | 0.00 | 0.67 | 0.24 | 0.57 | 1 |
| Haiku 4.5 | P4 | 1.00 | 1.00 | 0.83 | 1.00 | 1.00 | 2 |

**What did replicate (FACT):**
- Plain concise summaries (P1) again lost all record citations and nearly all quotations, for both models. H1's pattern holds on new texts.
- The JRS-guided instruction (P4) again kept every type at a median of 1.00, except Sonnet's attributions (0.67).

## Manual reading of the P1 and P4 flags (reported beside the verdict; it cannot change it)
Every flag in the P1 and P4 drafts was read against its source by Claude Code. *Requires human review.*

| Drafts | Flags | Reading |
|---|---|---|
| Sonnet P4 | 4 | 4 extractor errors |
| Haiku P4 | 2 | 2 extractor errors |
| Sonnet P1 | 2 | 1 extractor error. 1 is a quotation of a proposed correction: the draft openly flags an apparent typographical error in the source and puts its suggested reading in quotes |
| Haiku P1 | 0 | none |

**New extractor errors found** (v1.2 misses these forms in sources, so drafts that keep them are flagged):
- a month written as "Oct" without a full stop;
- "October of 2016";
- several days sharing one month and year ("July 26, 28, and 29, 2016");
- a word split across a PDF line break ("service- connected").

These are not fixed in this run, as the protocol requires.

## What this means (INFERENCE)
1. **No invented date, citation or quotation was found in any P4 draft in either run** (120 drafts), by manual reading. But the pre-registered automatic test has now failed twice. The claim "without more fabrication" therefore cannot be made from these studies.
2. **The automatic count penalizes keeping content.** P4 keeps nearly everything, so it carries more of the source's unusual date and quotation forms into the draft, and each form the extractor cannot read becomes a flag. A comparison by raw count is biased against the more complete draft. A future protocol should compare flags per anchor kept, or have unsupported items labelled by a blind human reader. That is a design lesson, not a result.
3. **The retention rule hit a ceiling.** Sonnet's P2 and P4 both reached a median of 1.00, so "greater than" could not hold. The H4 rule as written could not be met by a perfect score.
4. **For the test suite:**
   - The suite cannot yet certify "no unsupported additions" automatically. The manual adjudication step in `HARNESS_SPEC.md` section 3.4 is necessary, not optional.
   - Extractor v1.3 needs the four forms above, and it must then be confirmed on **new** texts. The 29 held-out texts have now been used.

## Statements now allowed
- "In two tests on 59 EEOC decision backgrounds, concise AI summaries kept no record citations (median) and almost no quotations; a JRS-guided drafting instruction kept a median of all of them."
- It must be paired with: "An automatic check of unsupported additions did not show the JRS-guided drafts to be cleaner, mainly because of scorer errors; a manual reading found no invented dates, citations or quotations in them, which has not been independently checked."

# Tanvi (V-HR-01) HR/Employment real-case pilot — criterion analysis (2026-08-01)

Computed live from `bench_outcomes` (contributor V-HR-01). n = 22 cases, each carrying both a JRS read (`jrs_read`) and a documented real-world outcome. This is the Rung 3 question: does a JRS review of a real record predict how that record actually held up?

## JRS read x outcome (raw)

| JRS read | held up | challenged | failed appeal | failed audit | total |
|---|---|---|---|---|---|
| ready | 6 | 5 | 1 | 1 | 13 |
| review_required | 0 | 1 | 4 | 1 | 6 |
| gap_identified | 1 | 0 | 2 | 0 | 3 |

## The signal (two honest ways to collapse it)

**Coding A — "held up" vs everything else:**
- JRS-clean (ready): held up 6 of 13 (46%)
- JRS-flagged (review or gap): held up 1 of 9 (11%)
- Fisher exact, one-tailed **p = 0.10.** Directionally correct, not significant at n=22.

**Coding B — clear adverse outcome (failed appeal or failed audit) vs not:**
- JRS-clean (ready): clear failure 2 of 13 (15%)
- JRS-flagged (review or gap): clear failure 7 of 9 (78%)
- Fisher exact, one-tailed **p = 0.006.** Significant.

Both point the same way: records JRS flagged fared worse in reality than records JRS passed. That is the criterion-validity direction you want.

## The honest catch, and why it matters

The result is significant under one outcome coding and not the other. Which coding is legitimate is **not** a choice to make after seeing the p-values — it must be the coding fixed in the pre-registered real-case protocol. Picking Coding B because it clears 0.05, after seeing that Coding A does not, is the same cherry-picking trap that damages a paper. Report the pre-registered coding, whichever it is, and show the other as a sensitivity analysis.

"Challenged" is the ambiguous cell: being contested is not the same as failing. How the protocol defines a positive vs negative outcome (is "challenged" adverse, neutral, or excluded?) decides the headline.

## Is it worth publishing?

**Yes, as a preliminary / pilot criterion-validity result, framed honestly.** Reasons:
- It is the first real-world evidence that JRS reads track how records actually hold up, across a genuine spread of outcomes (7 held up, 15 adverse). Most standards never get real-outcome data at all.
- The direction is clean and consistent across codings; under the stricter outcome definition it already reaches significance at only 22 cases.

**What it is not:** a confirmed "JRS predicts outcomes" claim. At n=22 with coding-dependent significance, it is preliminary and must be labeled so.

## Recommendations
1. Use the outcome coding from the pre-registered real-case protocol; present the other coding as sensitivity. Do not select on the p-value.
2. Reach the top of the target (30 cases; 8 more, weighted toward more "held up" and more "gap" cases) to firm up the estimate and reduce coding sensitivity.
3. Report as preliminary criterion validity: exact tests, both codings, wide-interval caveat, no effectiveness claim.
4. This is the strongest rung you have right now: a real-case signal in the right direction. It is publishable as an honest pilot, and it is the part of the program most worth finishing.

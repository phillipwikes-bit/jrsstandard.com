# Is it worth recruiting more people? (2026-08-02)

Direct answer to the question: would recruiting more reviewers let the study support stronger positive claims.

---

## 1. Correction to a number I gave you earlier

I previously estimated roughly 25 to 30 completers per arm to reach significance. **That was wrong.** It was calculated at read level, which treats 24 reads from one person as 24 independent observations. They are not.

Recomputed at participant level, which is the correct unit:

| Observed | Value |
|---|---|
| JRS arm | 73.3% (sd 21.2, n = 5) |
| Baseline arm | 62.0% (sd 34.0, n = 8) |
| Difference | +11.35 pp |
| Pooled sd | 29.94 |
| **Cohen's d** | **0.379** (small-to-medium) |

| Target | Completers needed **per arm** | Total people | Total record reads |
|---|---|---|---|
| 80% power, alpha .05 | **110** | 220 | 5,280 |
| 90% power, alpha .05 | **147** | 294 | 7,056 |

You have 5 and 8.

## 2. The finding that reframes everything

Working backwards, here is the smallest gap the study could have detected at each sample size:

| Completers per arm | Smallest detectable gap (80% power) |
|---|---|
| 5 | 53.1 pp |
| 8 | 41.9 pp |
| 13 | 32.9 pp |
| 20 | 26.5 pp |
| 30 | 21.7 pp |

**Your observed gap is 11.35 pp. At 5 to 8 per arm, the study could only have detected a gap of roughly 42 to 53 points.**

The comparison was never capable of detecting an effect the size of the one that appears to be there. The null result is not evidence that the standard does not work. It is evidence that the study could not tell either way. Those are completely different statements, and the second one is both more accurate and more useful.

## 3. The honest answer on recruiting

**For the purpose of reaching significance: no, not realistically.**

- 220 completers, each reading 24 records, is a different project from the one you ran.
- You have accumulated 13 comparison-arm completers over several months of active recruitment.
- You are closing in about two weeks.
- Even the optimistic scenario, where the baseline arm turns out to be less erratic than it looks now, needs about 59 per arm.

The arithmetic does not work on your timeline, and no amount of effort changes the arithmetic.

## 4. The version of this that would damage you

There is a legitimate way to add participants and an illegitimate one, and the difference is entirely about when the decision is made.

**Legitimate:** decide the target sample now, write it down before looking again, collect to that target, analyze once.

**Illegitimate:** keep adding participants, re-running the test after each one, and stopping when the number finally crosses 0.05. This is called optional stopping. It inflates the false-positive rate from 5 percent to roughly 30 percent or higher with repeated checking. It is one of the specific practices that pre-registration exists to prevent, and your study is pre-registered.

This matters concretely: the comparison has already been analyzed three times as data arrived. Each of those was a look at the data. Continuing to add reviewers and re-test until the result turns favourable would convert an honest underpowered study into a p-hacked one, and it would be visible to anyone who reads the timestamps on your own pre-registration and progress log.

The blunt version: adding people does not make claims more positive. It makes them more precise. A larger sample could just as easily give you a precise null, and given that the baseline arm has been climbing toward the JRS arm as it fills, that outcome is entirely possible.

## 5. What actually strengthens the paper, at no additional cost

The strongest move available is not more recruitment. It is correct framing of what you already have.

**Three findings that hold right now:**

1. **Expert detection.** The named panel identified the records correctly 82.8 percent of the time, and this clears the pre-registered threshold at participant level (95% CI 71.0 to 94.6). This is a real, defensible, publishable result.
2. **Cross-vendor reproducibility.** Three AI systems from three vendors applied the review consistently, 84 percent agreement across 15 records. Framed as consistency, not accuracy.
3. **Inter-rater reliability.** Substantial chance-corrected agreement under a pre-registered analysis, reported as interim.

**And the comparison becomes a contribution rather than a failure.** A pilot that produces a defensible effect-size estimate is exactly how properly powered trials get designed. Reported correctly, Arm B says:

> The randomized comparison reached its pre-registered minimum sample and produced a positive but statistically inconclusive difference of 11.35 percentage points (d = 0.379). This estimate implies that a definitive test requires approximately 110 completers per arm at 80 percent power. The present comparison was not powered to detect an effect of this magnitude and is reported as a null under the pre-registered decision rule.

That paragraph does several things at once. It is completely honest. It shows methodological sophistication. It hands the next researcher, possibly you, the exact number needed. And it converts an apparent shortfall into a deliverable, because effect-size estimation is a legitimate reason pilot studies exist.

## 6. Recommendation

1. **Do not recruit to chase significance.** The number is out of reach and the attempt would compromise the pre-registration.
2. **Let RR-108 finish** if it does so naturally. It costs nothing and improves precision slightly. Do not re-run the significance test as a decision point when it lands.
3. **Close the study on the announced date**, analyze once, report the comparison as a null with the effect-size estimate attached.
4. **Publish the Arm A result as the headline.** It is solid and it is the claim that survives scrutiny.
5. **Put the power calculation in the Discussion** as the specification for a replication. That is the paper's forward value, and it is worth more than a marginal p-value would have been.

## 7. One line

Recruiting more people cannot rescue this comparison on your timeline, and trying would put the honest result you already have at risk. The strong claim you can make is about expert detection, and you can make it today.

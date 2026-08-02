# Arm A / Arm B update: completions last night and this morning (2026-08-02, 12:00 UTC)

Queried directly against the live database via the Supabase connection in session. All figures below are computed, not carried forward.

## 1. Completions in the window

Four reviewers completed all 24 records between yesterday midday and this morning.

| Reviewer | Arm | Completed (UTC) | When |
|---|---|---|---|
| RR-130 | Arm B / B2 (baseline) | 2026-08-01 15:31 | yesterday afternoon |
| RR-128 (Sagarika Banerjee) | Arm B / B1 (JRS) | 2026-08-01 21:25 | last night |
| V-AI-23 (Niloofar Kandi) | Arm A (expert panel) | 2026-08-02 03:22 | overnight |
| **RR-132** | Arm B / B2 (baseline) | **2026-08-02 11:55** | **this morning, new** |

RR-132 is new since the last analysis and had not previously been recorded.

## 2. Current totals

| Arm | Complete | In progress |
|---|---|---|
| Arm A (expert panel) | **15** | none |
| Arm B / B1 (JRS) | **5** | RR-108 at 9/24 |
| Arm B / B2 (baseline) | **8** | none |
| **Arm B total** | **13** | 1 |

## 3. The pre-registered minimum sample is now MET

`ArmB_Design.md` and `OSF_PreRegistration.md` set the Arm B floor at **5 to 8 completed participants per arm**.

- B1 (JRS): was 4, now **5**. Minimum met.
- B2 (baseline): 8. Minimum met, at the top of the range.

RR-128 is the completion that closed the gap. This is the first point at which the randomized comparison has an adequately sampled result under its own registration.

## 4. Accuracy, scored against the verified key

Latest submission per reviewer-record; reviewers with fewer than 18 graded reads excluded (drops RR-108 only).

| Arm | Reviewers | Graded reads | Accuracy | Sensitivity | Specificity |
|---|---|---|---|---|---|
| Arm A detection (expert panel) | 15 | 360 | **82.8%** | 86.1% | 79.4% |
| Arm B B1 (JRS) | 5 | 120 | **73.3%** | 86.7% | 60.0% |
| Arm B B2 (baseline) | 8 | 192 | **62.0%** | 57.3% | 66.7% |

**B1 minus B2 = +11.3 percentage points**, up from +6.3 at the previous run. The gap widened because the baseline arm fell (72.9 to 66.1 to 62.0) as more baseline reviewers completed, while the JRS arm held.

## 5. Floor 3 test (the pre-registered value-of-the-standard test)

Floor 3 requires B1 greater than B2 **and** the 95 percent CI of the difference to exclude zero. Run at the participant level, as registered, not read level.

Per-reviewer accuracy:
- **B1 (JRS):** 100.0, 87.5, 70.8, 62.5, 45.8. Mean 73.3, sd 21.2.
- **B2 (baseline):** 100.0, 100.0, 100.0, 66.7, 37.5, 37.5, 33.3, 20.8. Mean 62.0, sd 34.0.

| Test | Result |
|---|---|
| Difference | +11.35 pp, favoring JRS |
| Welch t | t = 0.743, df = 11.0 |
| 95% CI (t-based) | [-22.3, +45.0] pp |
| 95% CI (participant bootstrap, 20k) | **[-16.4, +39.1] pp** |
| CI excludes zero | **No** |
| Bootstrap P(B1 > B2) | 0.782 |
| **Floor 3** | **NOT MET** |

**Why it fails despite a larger gap.** Not direction, variance. The baseline arm is bimodal: three reviewers scored 100 percent and four scored below chance (20.8, 33.3, 37.5, 37.5). That spread (sd 34.0) swamps an 11-point mean difference at n = 8. The JRS arm is both higher and tighter (sd 21.2, one reviewer below chance).

## 6. Data-quality check on the below-chance scores

Below-chance accuracy on a binary task can indicate a broken instrument rather than poor judgment, so I checked the response patterns before treating these as real.

Every baseline reviewer discriminated. None straight-lined:
- RR-130: 11 yes / 13 no (scored 20.8%)
- RR-132: 10 yes / 14 no (scored 33.3%)
- RR-121: 13 yes / 11 no (scored 37.5%)
- RR-125: 19 yes / 5 no (scored 37.5%)

These are balanced, considered answer patterns that happen to be anti-correlated with the key. No blanks, no single-value runs. The one straight-line pattern in the whole set is RR-124 in B1, who answered "would rely: yes" to all 24, but that reviewer's scored field is the JRS read, which was mixed (13 Ready / 11 not), so the score reflects genuine discrimination.

**Conclusion: the below-chance scores are real data, not instrument failure.** They stay in. Removing them would raise the baseline arm and shrink the very gap being tested, which is the wrong direction for cherry-picking and still not permissible.

## 7. What this means, plainly

- The randomized comparison now has the sample its registration asked for.
- The JRS arm outperforms the unaided baseline by 11.3 points, and has done so consistently across three successive runs while the gap grew.
- That difference is **not statistically distinguishable from zero** at this sample size, so the standard is **not yet shown to add value** under the pre-registered test.
- The most interesting unregistered observation: unaided reviewers are close to a coin flip in aggregate with enormous spread, while reviewers given the five conditions cluster higher and tighter. Variance reduction is a plausible mechanism and is **not** something the pre-registration tests. It would need its own analysis and should be labeled exploratory if reported.
- To clear Floor 3 at an 11-point gap with this much baseline variance, the arms need to grow well beyond the 5 to 8 minimum. RR-108 finishing (making B1 = 6) helps precision but will not by itself close a CI this wide.

## 8. Reporting stance for the manuscript

Report Arm B as: sample met, direction favors JRS (+11.3 pp), difference not statistically significant, Floor 3 not met, reported as a null under the pre-registered test. Do not describe JRS as adding value. The honest headline is that the comparison is now properly sampled and returns a positive but inconclusive direction.

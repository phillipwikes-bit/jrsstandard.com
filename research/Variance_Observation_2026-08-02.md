# The variance observation, explained in full (2026-08-02)

Exploratory analysis. Not pre-registered. Nothing here may be reported as a finding without the labeling described in Section 6.

---

## 1. What was actually observed

Three groups read the same 24 records against the same verified key. Two of them used the five JRS conditions; one did not.

| Group | Uses JRS? | Expertise | n | Mean accuracy | SD | CV |
|---|---|---|---|---|---|---|
| Arm A (expert detection panel) | Yes | Expert | 15 | 82.8% | **21.30** | 25.7% |
| Arm B1 (comparison arm) | Yes | JRS-naive professionals | 5 | 73.3% | **21.17** | 28.9% |
| Arm B2 (baseline arm) | **No** | JRS-naive professionals | 8 | 62.0% | **33.96** | 54.8% |

The pattern that stands out is not in the means. It is in the spread.

**The two groups that used the standard have almost identical dispersion (SD 21.30 and 21.17), despite a 9.5-point gap in average accuracy and a large gap in expertise. The one group that did not use the standard has roughly 1.6 times the spread.**

Stated as a hypothesis: *expertise appears to set the level; the standard appears to set the spread.*

## 2. What the spread looks like up close

Dispersion alone understates it. The distributions differ in shape.

**Arm B2 (no standard) is bimodal.** Three reviewers scored 100 percent. Four scored below chance (20.8, 33.3, 37.5, 37.5). Exactly one landed in the middle band between 50 and 90 percent. Unaided, reviewers either saw the problem cleanly or inverted it almost completely, with very little in between.

**Arm B1 (standard, naive) is continuous.** Three of five sit in the middle band. One perfect, one below chance.

**Arm A (standard, expert) is top-loaded.** Five perfect scores, eight at or above 90 percent, two below chance.

Below-chance rates by group:

| Group | Below chance | Rate |
|---|---|---|
| Arm A (JRS, expert) | 2 of 15 | 13.3% |
| Arm B1 (JRS, naive) | 1 of 5 | 20.0% |
| Arm B2 (no JRS, naive) | 4 of 8 | 50.0% |

Combining the two JRS groups against the no-JRS group gives a below-chance rate of 3 of 20 versus 4 of 8. Fisher exact, one-tailed: **p = 0.077**. Suggestive, not significant, and post-hoc.

## 3. Why a standard could plausibly reduce spread

This is a mechanism worth stating because it is testable, not because it is established.

An unaided reviewer asked "is this record adequately supported?" has to invent a threshold. Each one imports a private standard from their own domain and experience. Some thresholds happen to align with the answer key; some are close to its inverse. The result is a wide, lumpy distribution driven by which private threshold each person brought to the task.

A reviewer given five explicit conditions is answering a more constrained question. Reasonable people can still disagree about whether a specific record satisfies "basis identification," but they are disagreeing inside a narrower space. The floor should rise because the most idiosyncratic readings are ruled out, and the ceiling may not move at all.

If that mechanism is real, the signature is exactly what appears here: a modest gain in the mean, and a substantially larger reduction in the tail of catastrophic misreads.

This also matters operationally in a way a mean does not. A review process where some reviewers are perfect and others are worse than a coin flip is unmanageable even when the average looks acceptable, because you cannot tell in advance which reviewer you are getting. Reducing that spread may be worth more to an organization than raising the average.

## 4. Why this cannot be claimed, in numbers

Standard deviations estimated from five and eight people are extremely unstable. The 95 percent confidence intervals for the *true* standard deviation of each group:

| Group | Observed SD | True SD could plausibly be |
|---|---|---|
| Arm A | 21.30 | 15.6 to 33.6 |
| Arm B1 | 21.17 | **12.7 to 60.8** |
| Arm B2 | 33.96 | **22.5 to 69.1** |

B1 and B2 overlap across almost their entire plausible range. The observed difference is fully consistent with both groups having the same underlying spread and the samples landing differently by chance.

Formal tests confirm this:

| Test | Result |
|---|---|
| Variance ratio B2/B1 | 2.57x (SD ratio 1.60x) |
| F test, F(7,4) | 2.574, not significant |
| Brown-Forsythe (robust to non-normality) | W = 2.738 on (1,11) df, not significant |
| Bootstrap CI on SD difference (20k) | [-1.01, +26.19], **includes zero** |

The bootstrap interval comes close to excluding zero, which is why the pattern is worth recording rather than discarding. It does not exclude zero, which is why it cannot be reported as a result.

## 5. Correction to something I told you earlier

While running this I checked Floor 2 at the participant level rather than the read level. That distinction matters and I had not applied it consistently.

Read-level analysis treats 24 reads from one reviewer as 24 independent observations. They are not: they come from one person applying one threshold, so the true precision is far lower. Participant-level is the correct unit and it widens every interval by roughly three to five times.

| Group | Read-level 95% CI | Participant-level 95% CI | Floor 2 (point ≥70 and lower bound >50) |
|---|---|---|---|
| Arm A | [78.5, 86.3] | [71.0, 94.6] | **MET at both levels** |
| Arm B1 | [64.8, 80.4] | [47.1, 99.6] | **NOT met at participant level** |
| Arm B2 | [54.9, 68.5] | [33.6, 90.4] | Not met at either |

**Arm A's Floor 2 result survives the stricter test.** That is the primary detection claim and it holds: mean 82.8 percent, lower bound 71.0, comfortably above both thresholds.

**Arm B1 does not clear Floor 2 at participant level**, though it did appear to at read level. Any statement that the JRS arm is established above chance should be withdrawn. Its point estimate (73.3) clears the 0.70 target; its lower bound (47.1) does not clear 0.50.

Neither Arm B group is statistically distinguishable from a coin flip at participant level. That is an uncomfortable sentence and it is the accurate one.

## 6. Rules for using any of this

If the variance observation appears in the paper:

1. It goes in the Discussion or an explicitly labeled exploratory section. Never in Results as a finding.
2. It is described as an observation that generates a hypothesis, with the phrase "not pre-registered" attached.
3. The non-significant tests are reported alongside it, not omitted. Reporting the 1.6x spread ratio without the overlapping confidence intervals would be exactly the kind of selective presentation this program exists to argue against.
4. The mechanism (constrained question narrows the answer space) is offered as a candidate explanation, not a conclusion.

## 7. How to test it properly

Variance is harder to estimate than a mean and needs more participants, not fewer. A dedicated test would require:

- A pre-registered hypothesis stating the direction (JRS arm shows lower dispersion) and the test (Brown-Forsythe or Levene on participant-level accuracy) written down before the data are examined.
- Substantially larger arms. Detecting a 1.6x SD ratio with reasonable power needs roughly 25 to 30 per arm, similar to the sample needed for the mean difference.
- A pre-specified definition of the below-chance tail if that secondary comparison is used.

The cheapest honest path is to fold the dispersion hypothesis into the pre-registration for a replication round, then report it as confirmatory in that round rather than trying to rescue it from this one.

## 8. One-line summary

The two groups using the standard had nearly identical spread while the group without it had 1.6 times as much, and unaided reviewers split into "got it" and "inverted it" with almost nobody in between. It is a real pattern in the data, it has a plausible mechanism, it is not statistically established at this sample size, and it must carry the word "exploratory" every time it is mentioned.

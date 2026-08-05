# Companion study: the randomized comparison (working file, not for submission yet)

**Status: OPEN. Data collection is not complete.** As of 5 August 2026 the comparison has 16 completers (5 in the standard condition, 11 in the unaided condition) and at least one participant still in progress. Nothing in this file is published or submitted until the study closes.

This file holds the material removed from the detection manuscript on 5 August 2026 when the two studies were separated. It is kept intact so the comparison can be written up in full, whatever it shows, without reconstructing anything.

## Why this is a separate study

It asks a different question from the detection study. Detection asks whether experienced reviewers can identify records whose reasoning cannot be reconstructed, measured against a verified key. The comparison asks whether applying the five conditions improves on unaided professional judgment, measured against another group of people. Different question, different participants, different recruitment, different participant codes, separate page and registration.

The two share the 24-record corpus, which is why the detection paper discloses this study in Section 4.8 rather than leaving a reader to discover it.

## What must not change when this is written up

- Report the result in full whether it is positive, negative, or inconclusive. The pre-registration is timestamped and public and the participants hold completion certificates.
- Keep the participant-level unit of analysis.
- Keep the statement that the panel and these arms cannot be compared as a test of the method.
- Do not begin writing until data collection closes and the analysis is locked.

## Current figures, for reference only, not for release

These are the figures as of 5 August 2026 and they will change as the study completes.

## 6. Secondary pre-registered analysis: does the standard improve on unaided judgment?

A randomized comparison was built to isolate the value of the method itself. The participants are experienced professionals in the same domains as the panel, recruited separately and with no prior exposure to the standard; "JRS-naive" refers to that absence of exposure and not to any absence of expertise. Drawn from a single recruitment pool, they were randomly assigned, by a deterministic hash of their participant code and before they judged any record, to review the same 24 records either with the five conditions (standard condition) or with a single general question about adequacy of support (unaided condition).

### 6.1 Result

| Condition | n | Accuracy |
|---|---|---|
| Standard condition | 5 | 73.3% |
| Unaided condition | 11 | 69.3% |
| **Difference** | | **+4.0 pp** |

The difference favors the standard. It is **not statistically distinguishable from zero**: participant-level bootstrap 95 percent CI of the difference is -19.9 to +28.8 percentage points, Welch t = 0.30 on 11.3 degrees of freedom. **Under the pre-registered decision rule, this analysis is reported as a null.** The standard is not shown to improve on unaided judgment by this study.

### 6.2 The comparison is a hard test, and the baseline is strong

Two features of the design bound how large an effect this comparison could ever have shown.

First, **the unaided arm is not a weak control.** Those reviewers are experienced professionals reading records without the five conditions, and they detected unreconstructable records at 69.3 percent, above chance in their own right (one-sample t = 2.06 on 10 degrees of freedom). Six of the 11 met the 70 percent threshold with no method at all. A structured instrument is being asked to improve on competent professional judgment that is already working, which is the most demanding contrast available and the least likely to produce a large margin.

Second, **the ceiling is close.** With a strong baseline near 70 percent and a practical ceiling at 100, the space available for the method to demonstrate value is roughly 30 points wide, and a difference of the size a small trial can detect consumes most of it.

Neither point rescues the result, and neither is offered as one. They explain why a null here is weaker evidence against the standard than a null from a trial with a naive control would be, and they set up the design question in Section 8: the informative next trial varies reviewer experience, rather than adding more experts to both arms.

### 6.3 Why the analysis was underpowered, stated precisely

The observed effect is Cohen's d = 0.140 (pooled sd 28.6). At the sample reached, the smallest difference the comparison could have detected at 80 percent power was approximately 43 percentage points. **The comparison was never capable of detecting an effect of the size that appears to be present.**

This is a statement about the design, not about the standard. A null from an underpowered test is uninformative about the underlying effect, and we decline to interpret it in either direction.

### 6.4 Effect-size estimate for a conclusive trial

The value this analysis does deliver is a defensible effect-size estimate for designing a properly powered replication:

| Target | Completers required per condition |
|---|---|
| 80 percent power, alpha .05 | approximately 800 |
| 90 percent power, alpha .05 | approximately 1,070 |

We report this specification so that a future trial, whether ours or another group's, can be sized correctly at the outset rather than discovering its limits afterward.



## Material also removed from the detection paper

## Appendix A. Detection across the full expert base

*Placed in an appendix because it combines groups that were not randomized against one another. It is reported for completeness as a descriptive detection estimate and carries no causal reading.*

Every reviewer in this study, in the panel and in both randomized arms, is an experienced professional in a relevant domain. The term "JRS-naive," used for the randomized recruits, denotes no prior exposure to the method and not an absence of expertise. That composition allows a descriptive question separate from the randomized test: how well do experienced professionals detect unreconstructable records, whatever route brought them into the study?

| Group | Reviewers | Graded reads | Accuracy | 95% CI |
|---|---|---|---|---|
| Panel, applying the standard | 16 | 384 | 83.9% | 72.7 to 95.1 |
| Randomized standard arm | 5 | 120 | 73.3% | 47.1 to 99.6 |
| **All reviewers applying the standard** | **21** | **504** | **81.3%** | **71.8 to 90.9** |
| All experts, method or not | 32 | 768 | 77.2% | 68.2 to 86.3 |

Pooled across every reviewer who applied the five conditions, detection accuracy is 81.3 percent with a lower confidence bound of 71.8, which clears the pre-registered threshold on a base more than twice the size of the panel alone and drawn through two separate recruitment routes. Sixteen of those 21 reviewers individually met or exceeded the 70 percent threshold. Against chance, the pooled result is decisive (one-sample t = 6.83 on 20 degrees of freedom).

**This pooling is a detection estimate, not a comparison.** The panel and the randomized standard arm applied the same instrument to the same records, which is what makes a combined detection figure meaningful. They were not randomized against one another, so nothing in this subsection speaks to whether the method causes better detection. That question belongs to Section 6 and is answered there as a null.



### 5.4 Consistency of the detection result across recruitment routes

The detection finding does not rest on a single recruitment route. Reviewers who entered the study through the randomized comparison and applied the same five conditions to the same records reached comparable accuracy, and the combined figure across every reviewer who applied the standard is reported in Appendix A. That appendix is a descriptive statement about detectability across the full expert base; the causal question belongs to Section 6.


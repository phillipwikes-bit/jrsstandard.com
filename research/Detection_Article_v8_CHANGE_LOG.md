# Detection_Article_v8 change log

**SOURCE:** Detection_Article_v7_2026-08-18.docx

**OUTPUT:** Detection_Article_v8_2026-08-18.docx

**Date of execution:** 2026-08-18

| | |
|---|---|
| Surgical edits applied | 4 |
| Already satisfied | 0 |
| Failed | 0 |

## The four edits

### Edit 1

**Section.** Section 4.6, statistical terminology

**Original text**

> The participant-level analysis correctly treats reviewers as a random factor and correctly avoids pseudo-replication.

**Replacement text**

> The participant-level analysis correctly treats each reviewer as the unit of observation and avoids pseudo-replication.

**Status.** APPLIED

### Edit 2

**Section.** Abstract, which pre-registered threshold was met

**Original text**

> This clears the pre-registered threshold, which required a point estimate of at least 70 percent with the lower confidence bound above chance.

**Replacement text**

> This clears the pre-registered detection threshold, which required a point estimate of at least 70 percent with the lower confidence bound above chance.

**Status.** APPLIED

### Edit 3

**Section.** Appendix C, Consequence for Section 8.3

**Original text**

> The estimated size of the effect is small, and the dominant source of uncertainty in this study is the reviewers, not the corpus.

**Replacement text**

> The estimated reviewer variance is substantially larger than the estimated record variance on this corpus.

**Status.** APPLIED

### Edit 4

**Section.** Section 4.6, confidence-interval method

**Original text**

> Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of those scores with a confidence interval across reviewers.

**Replacement text**

> Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of those scores with a confidence interval across reviewers. The 95 percent confidence interval for the panel mean was calculated using a Student t interval across the sixteen reviewer accuracy scores, with reviewers as the independent sampling units.

**Status.** APPLIED

## Edit 4, CI-method verification

**CI-method verification: VERIFIED.**

**Exact method found.** A Student t interval across the sixteen reviewer accuracy scores: the panel mean plus and minus t(0.975, df = n - 1) times the sample standard deviation divided by the square root of n, with the sample standard deviation using the n - 1 denominator and t at 15 degrees of freedom taken as 2.131.

**Where it was verified.**

- research/closed_aggregates_2026-08-15.json (names the producer and carries n 16, mean 83.85, sd 21.02, ci95_low 72.66, ci95_high 95.05)
- api/pstat-4c8e1b6a2d90.js at commit 120c11e^, functions sd() lines 58-62, tcrit() lines 69-72 with df 15 mapping to 2.131, and stats() lines 74-90 computing mean +/- tcrit(n-1) * sd / sqrt(n)
- scripts/verify_detection_accuracy.py, ci95_t(), carrying the same t table

The data file names its own producer, so the chain from the reported figure back to the implementation is explicit rather than inferred. The implementation was deleted on 2026-08-15 after the aggregates were read and is recovered from git history at the parent of commit 120c11e.

**Arithmetic reproduction.** t(15) = 2.131, sd = 21.02, n = 16, so the half-width is 2.131 x 21.02 / 4 = 11.198. The mean of 83.85 gives 72.65 and 95.05, matching the stored ci95_low of 72.66 and ci95_high of 95.05 to the rounding of the stored standard deviation. Rounded to one decimal these are 72.7 and 95.1, exactly as the manuscript reports.

**Manuscript updated:** yes. One sentence added to Section 4.6 immediately after the sentence describing participant-level accuracy. No reported value was recalculated and 83.9, 72.7 and 95.1 are unchanged.

## Numerical integrity

| Value | Present in v8 |
|---|---|
| 16 reviewers | yes |
| 11 countries | yes |
| 5 continents | yes |
| 24 records | yes |
| 12 grounded records | yes |
| 12 unsupported records | yes |
| 384 graded reads | yes |
| 83.9% accuracy | yes |
| 95% CI 72.7 to 95.1 | yes |
| 87.0% sensitivity | yes |
| 80.7% specificity | yes |
| reviewer range 37.5 to 100 | yes |
| reviewer accuracy SD 21.0 | yes |
| 6 of 16 perfect reviewers | yes |
| 11 of 16 every unsupported record | yes |
| Expert AC1 0.739 | yes |
| Expert analytic CI 0.402 to 1.000 | yes |
| Expert bootstrap CI 0.427 to 1.000 | yes |
| Trained AC1 0.623 | yes |
| Trained analytic CI 0.253 to 0.994 | yes |
| Trained bootstrap CI 0.301 to 0.886 | yes |
| Reviewer SD 1.769 | yes |
| Record SD 0.011 | yes |
| Reviewer variance 3.130 | yes |
| Record variance 0.0001 | yes |
| Reviewer ICC 0.488 | yes |
| Record ICC 0.0000 | yes |
| Record profile interval 0.001 to 0.556 | yes |
| Average reviewer on average record 89.2% | yes |
| 113 overall determinations | yes |
| 565 condition-level labels | yes |
| 216 lowest-level labels | yes |
| 142 middle-level labels | yes |
| 207 pass-level labels | yes |

Arithmetic verified: 216 + 142 + 207 = 565, and 113 x 5 = 565.

**Numerical integrity: PASS**

## Statistical consistency

| Element of the hierarchy | Explicit in v8 |
|---|---|
| PRIMARY: reviewer is the unit of observation | yes |
| PRIMARY: one accuracy score per reviewer | yes |
| PRIMARY: 83.9 percent panel accuracy | yes |
| PRIMARY: 95 percent CI 72.7 to 95.1 | yes |
| PRIMARY: detection threshold met | yes |
| EXPLORATORY: mixed-effects logistic model | yes |
| EXPLORATORY: reviewer and record random effects | yes |
| EXPLORATORY: status retained | yes |
| EXPLORATORY: does not replace the primary analysis | yes |
| RELIABILITY: criterion NOT met | yes |
| RELIABILITY: analytic interval is the prespecified one | yes |
| RELIABILITY: bootstrap is sensitivity only | yes |

`random factor` occurrences: 2. Edit 1 removed the phrase from the description of the primary analysis, which aggregates to one score per reviewer; the random-effects language now belongs only to the exploratory mixed-effects model in Appendix C, which states its formula explicitly.

**Statistical consistency: PASS**

## Claim-boundary audit

| Prohibited phrase | Introduced |
|---|---|
| `validated JRS` | no |
| `JRS validated` | no |
| `proven JRS` | no |
| `JRS efficacy demonstrated` | no |
| `criterion validity established` | no |
| `workflow independence demonstrated` | no |
| `psychometrically validated` | no |
| `cross-cultural validity demonstrated` | no |
| `field validated` | no |
| `enterprise-ready` | no |
| `industry standard` | no |

| Claim that must be absent | Present |
|---|---|
| `verified key` (terminology) | no |
| `verified answer key` (terminology) | no |
| `answer key` (terminology) | no |
| `held-out key` (terminology) | no |
| `held-out reference classification` (v6) | no |
| `is an upper bound` (spectrum) | no |
| `JRS is independent of any vendor` (workflow) | no |
| `Fisher's exact` (per-condition inference) | no |
| `no deception was used` (ethics) | no |
| `de-identified participant-level response data` (data governance) | no |
| `A property can be real` (construct) | no |
| `Across the 113 labels` (Appendix B units) | no |
| `demonstrated per-condition association` (v6) | no |
| `cannot be distinguished from zero` (v6) | no |
| `one dataset in six` (v6) | no |
| `performs below chance` (v6) | no |
| `not distinguishable from zero` (v7) | no |
| `p = 0.48` (v7) | no |
| `api/variance-6b1d90fa2c47e8b3` (v7) | no |
| `dominant source of uncertainty` (v8 edit 3) | no |

| Boundary that must be present | Present |
|---|---|
| It does not establish criterion validity against real document (DRR criterion) | yes |
| may overstate performance on a corpus containing ambiguous rec (DRR ambiguous) | yes |
| The study therefore establishes detectability on AI-generated  (DRR human-authored) | yes |
| It does not establish measurement invariance (DRR invariance) | yes |
| 12 records are grounded (corpus bimodal) | yes |
| JRS is a record-level, pre-finalisation review method. (JRS definition) | yes |
| For JRS, the result should therefore be read as evidence suppo (JRS review logic supported) | yes |
| not as evidence that JRS itself improves documentation outcome (no JRS efficacy) | yes |
| any advantage of the instrument over unaided expert judgment (no superiority) | yes |
| **8.6 The five conditions are not psychometrically validated.* (no psychometric) | yes |
| designed to be vendor-, model-, and workflow-agnostic (JRS agnostic) | yes |
| Workflow independence is a design intention, not a result (workflow intention) | yes |
| All 24 records are AI-generated (workflow corpus) | yes |
| The pre-registered reliability criterion was not met. (reliability not met) | yes |
| The records were constructed by the creator of the construct t (author-generated corpus) | yes |
| wrote the author-side reference classification (author-side classification) | yes |
| not fully independent of the *construct* (construct dependence) | yes |
| would benefit professionally and commercially from the standar (investigator dependence) | yes |
| treats each reviewer as the unit of observation (edit 1) | yes |
| This clears the pre-registered detection threshold (edit 2) | yes |
| The estimated reviewer variance is substantially larger than t (edit 3) | yes |
| a Student t interval across the sixteen reviewer accuracy scor (edit 4) | yes |

**Claim-boundary audit: PASS**

## Document integrity

| Check | v7 | v8 |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 91 | 91 |
| Paragraphs over 120 characters | 181 | 181 |
| Duplicate paragraphs | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 11637 | 11660 |

| Section | Unchanged from v7 |
|---|---|
| References and citations | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | changed only by Edit 3 |
| Abstract | changed only by Edit 2 |
| Section 4.6 | changed only by Edits 1 and 4 |

v7 was not overwritten. The source is plain Markdown and the `.docx` is generated from it, so no tracked change and no comment can be introduced. No paragraph was deleted: the paragraph count is identical. No text was truncated and no character corruption occurred; the only differences from v7 are the four replacements listed above.

**Document integrity: PASS**

"v8 final surgical revision completed. No primary study result, preregistered threshold, corpus composition, study design, or substantive methodological finding was changed."

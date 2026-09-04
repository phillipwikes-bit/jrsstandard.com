# Detection_Article_v7 change log

| | |
|---|---|
| Source document | `research/Detection_Article_v6_2026-08-18.md` / `.docx` |
| Output document | `research/Detection_Article_v7_2026-08-18.md` / `.docx` |
| Date of execution | 2026-08-18 |
| Surgical fixes applied | 4 |
| Already satisfied | 0 |
| Failed | 0 |

## Surgical fixes

### Surgical Fix 1

**Section / location.** Section 4.6, record-component interpretation

**Status.** APPLIED

**Exact original wording**

> It finds the reviewer component to be the dominant source of variance and the record component to be small and not distinguishable from zero at this sample size.

**Exact replacement wording**

> It finds the reviewer component to be the dominant source of variance on this corpus, while the record component is weakly identified and permits a materially larger effect within its profile-likelihood interval.

### Surgical Fix 2

**Section / location.** Section 6.4, unpaired p-value

**Status.** APPLIED

**Exact original wording**

> so the correct test is paired, and the paired data were not retained in a form that supports one; an unpaired approximation returns p = 0.48. The gap is reported as a direction

**Exact replacement wording**

> so the correct test is paired, and the paired data were not retained in a form that supports one. The gap is reported as a direction

### Surgical Fix 3

**Section / location.** Section 4.9, grammatical defect

**Status.** APPLIED

**Exact original wording**

> pooling the baseline labels in drives it to between 0.16 and 0.18.

**Exact replacement wording**

> pooling the baseline labels drives it to between 0.16 and 0.18.

### Surgical Fix 4

**Section / location.** Appendix C, internal API identifier

**Status.** APPLIED

**Exact original wording**

> Every figure in this appendix is computed by `api/variance-6b1d90fa2c47e8b3`, which reads the per-read table server-side and returns aggregates only.

**Exact replacement wording**

> Every figure in this appendix is generated from the per-read analysis dataset using the archived analysis implementation, which returns aggregate results without exposing individual reviewer responses.

## Numerical integrity result

| Value | Present in v7 |
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
| 113 overall determinations | yes |
| 565 condition-level labels | yes |
| 216 lowest-level labels | yes |
| 142 middle-level labels | yes |
| 207 pass-level labels | yes |
| Reviewer SD 1.769 | yes |
| Record SD 0.011 | yes |
| Reviewer variance 3.130 | yes |
| Record variance 0.0001 | yes |
| Reviewer ICC 0.488 | yes |
| Record ICC 0.0000 | yes |
| Record profile interval 0.001 to 0.556 | yes |
| Average reviewer on average record 89.2% | yes |

Arithmetic verified in the document: 216 + 142 + 207 = 565, and 113 x 5 = 565.

**Result: PASS**

## Statistical consistency result

| Phrase required absent after editing | Occurrences |
|---|---|
| `not distinguishable from zero` | 0 |
| `an unpaired approximation returns p = 0.48` | 0 |
| `p = 0.48` | 0 |
| `labels in drives` | 0 |
| `api/variance-6b1d90fa2c47e8b3` | 0 |

| Term inspected for consistency | Occurrences |
|---|---|
| `record component` | 5 |
| `record variance` | 1 |
| `record SD` | 1 |
| `profile-likelihood` | 4 |
| `reviewer component` | 3 |
| `reviewer SD` | 1 |
| `reviewer ICC` | 0 |

| Statement the manuscript must communicate | Communicated |
|---|---|
| 1. reviewer variation dominant | yes |
| 2. record component at the boundary | yes |
| 3. record component not zero | yes |
| 4. record component weakly identified | yes |
| 5. profile interval 0.001 to 0.556 | yes |
| 6. larger record effect not ruled out | yes |
| 7. exploratory, does not modify the primary result | yes |

**Result: PASS**

## Claim-boundary result

| Claim that must be absent | Present |
|---|---|
| `verified key` (terminology) | no |
| `verified answer key` (terminology) | no |
| `answer key` (terminology) | no |
| `held-out key` (terminology) | no |
| `held-out reference classification` (v6 fix 4) | no |
| `is an upper bound` (spectrum) | no |
| `JRS is independent of any vendor` (workflow) | no |
| `Fisher's exact` (per-condition inference) | no |
| `no deception was used` (ethics) | no |
| `de-identified participant-level response data` (data governance) | no |
| `A property can be real` (construct) | no |
| `Across the 113 labels` (Appendix B units) | no |
| `demonstrated per-condition association` (v6 fix 2) | no |
| `cannot be distinguished from zero` (v6 fix 6) | no |
| `one dataset in six` (v6 fix 6) | no |
| `performs below chance` (v6 fix 5) | no |
| `below the 50 percent chance rate` (v6 fix 5) | no |
| `which is the first one a measurement programme` (v6 fix 1) | no |

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
| designed to be vendor-, model-, and workflow-agnostic (JRS agnostic) | yes |
| Workflow independence is a design intention, not a result (workflow) | yes |
| All 24 records are AI-generated (workflow corpus) | yes |
| The pre-registered reliability criterion was not met. (reliability not met) | yes |
| which is the interval the analysis plan specified (analytic is prespecified) | yes |
| We do not treat that as satisfying the pre-registration. (bootstrap sensitivity only) | yes |
| **8.6 The five conditions are not psychometrically validated.* (psychometric) | yes |
| would benefit professionally and commercially from the standar (investigator dependence) | yes |
| The records were constructed by the creator of the construct t (author-generated corpus) | yes |
| not fully independent of the *construct* (construct dependence) | yes |
| It finds the reviewer component to be the dominant source of v (fix 1) | yes |
| pooling the baseline labels drives it to between 0.16 and 0.18 (fix 3) | yes |
| using the archived analysis implementation (fix 4) | yes |
| The estimator was validated by simulation against known varian (fix 4, parity statement preserved verbatim) | yes |

**Result: PASS**

## Document-integrity result

| Check | v6 | v7 |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 91 | 91 |
| Paragraphs over 120 characters | 181 | 181 |
| Duplicate paragraphs | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 11634 | 11637 |

| Section | Unchanged from v6 |
|---|---|
| References and citations | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | changed only by Surgical Fix 4 |
| Section 4.6 | changed only by Surgical Fix 1 |
| Section 4.9 | changed only by Surgical Fix 3 |
| Section 6.4 | changed only by Surgical Fix 2 |

The source is plain Markdown and the `.docx` is generated from it, so no tracked change and no comment can be introduced. No paragraph was deleted: the paragraph count is identical. No text was truncated and no character corruption occurred; the only differences from v6 are the four replacements listed above.

**Result: PASS**

"v7 surgical revision completed. No primary study result, preregistered threshold, corpus composition, study design, or substantive methodological finding was changed."

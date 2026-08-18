# Detection_Article_v6 change log

| | |
|---|---|
| Target document | `research/Detection_Article_v5_2026-08-18.md` / `.docx` |
| Output document | `research/Detection_Article_v6_2026-08-18.md` / `.docx` |
| Date of execution | 2026-08-18 |
| Revisions applied | 10 |
| Already satisfied | 0 |
| Failed | 0 |

## Surgical revisions

### Revision 1, Abstract, Objective

**Status.** APPLIED

**Original wording**

> **Objective.** This paper asks a single question, which is the first one a measurement programme has to answer: given an operational definition of DRR, can independent domain experts distinguish records that satisfy it from records that do not?

**Replacement wording**

> **Objective.** This paper asks a single question, which is an initial question a measurement programme must address: given an operational definition of DRR, can independent domain experts distinguish records that satisfy it from records that do not?

### Revision 2, Section 3, per-condition association

**Status.** APPLIED

**Original wording**

> face validity and demonstrated per-condition association

**Replacement wording**

> face validity and descriptive per-condition association

### Revision 3, Section 4.4, opening sentence

**Status.** APPLIED

**Original wording**

> The key is the foundation of every number in this paper, and it is treated here as a methodological object rather than as a formality.

**Replacement wording**

> The reference classification is the comparison standard underlying the primary accuracy estimates, and it is treated here as a methodological object rather than as a formality.

### Revision 4, Section 4.7, detection threshold

**Status.** APPLIED

**Original wording**

> **Detection threshold (primary).** Agreement with the held-out reference classification must exceed chance with the lower 95 percent bound above 0.50, and must reach a pre-set target of at least 0.70.

**Replacement wording**

> **Detection threshold (primary).** Agreement with the pre-specified reference classification must exceed chance with the lower 95 percent bound above 0.50, and must reach a pre-set target of at least 0.70.

### Revision 5, Section 6.3, precise chance-benchmark statement

**Status.** APPLIED

**Original wording**

> At the other end, reviewer accuracy fell below the 50 percent chance rate.

**Replacement wording**

> At the other end, at least one reviewer had an accuracy below the 50 percent balanced-corpus chance benchmark.

### Revision 5, Section 6.3, remove the duplicate occurrence

**Status.** APPLIED

**Original wording**

> A panel mean of 83.9 percent conceals a distribution in which some reviewers are near-perfect and at least one reviewer had an accuracy below the 50 percent balanced-corpus chance benchmark, and at the point of use that spread is invisible:

**Replacement wording**

> A panel mean of 83.9 percent conceals the distribution reported above, and at the point of use that spread is invisible:

### Revision 6, Appendix C, boundary wording

**Status.** APPLIED

**Original wording**

> The record component is a singular fit and must not be read as a zero

**Replacement wording**

> The record component is estimated at the boundary and must not be interpreted as zero.

### Revision 6, Appendix C, item-difficulty conclusion

**Status.** APPLIED

**Original wording**

> The defensible statement is therefore narrow: on this corpus, item difficulty is small relative to reviewer variation and cannot be distinguished from zero, and the sample cannot rule out a moderate effect.

**Replacement wording**

> The defensible statement is therefore narrow: on this corpus, the estimated item component is small relative to reviewer variation, but it is weakly identified and the profile-likelihood interval permits a materially larger record effect.

### Revision 6, Section 8.3, align to the corrected Appendix C wording

**Status.** APPLIED

**Original wording**

> Item difficulty is small relative to reviewer variation on this corpus and cannot be distinguished from zero, and the sample cannot rule out a moderate effect.

**Replacement wording**

> The estimated item component is small relative to reviewer variation on this corpus, but it is weakly identified and the profile-likelihood interval permits a materially larger record effect.

### Revision 6, Appendix C, remove the simulation clause

**Status.** APPLIED

**Original wording**

> At sixteen reviewers by twenty-four records the record component is weakly identified, and a correct estimator lands on the boundary on roughly one dataset in six when the true value is genuinely non-zero; that rate was measured by simulation on data of this exact shape before the real fit was run.

**Replacement wording**

> At sixteen reviewers by twenty-four records the record component is weakly identified.

## Numerical integrity verification

| Value | Present in v6 |
|---|---|
| 16 reviewers | yes |
| 11 countries | yes |
| 5 continents | yes |
| 24 records | yes |
| 12 grounded | yes |
| 12 unsupported | yes |
| 384 graded reads | yes |
| 83.9% accuracy | yes |
| 95% CI 72.7-95.1 | yes |
| 87.0% sensitivity | yes |
| 80.7% specificity | yes |
| reviewer range 37.5-100 | yes |
| SD 21.0 | yes |
| 6 of 16 perfect | yes |
| 11 of 16 unsupported | yes |
| Expert AC1 0.739 | yes |
| Expert analytic CI | yes |
| Expert bootstrap CI | yes |
| Trained AC1 0.623 | yes |
| Trained analytic CI | yes |
| Trained bootstrap CI | yes |
| 113 overall determinations | yes |
| 565 condition-level labels | yes |
| 216 lowest-level | yes |
| 142 middle-level | yes |
| 207 pass-level | yes |
| Reviewer SD 1.769 | yes |
| Record SD 0.011 | yes |
| Reviewer ICC 0.488 | yes |
| Record ICC 0.0000 | yes |
| Record profile 0.001-0.556 | yes |

Arithmetic verified in the document: 216 + 142 + 207 = 565, and 113 x 5 = 565. Both equal 565.

**Result: PASS**

## Global terminology audit

| Term searched | Occurrences in v6 |
|---|---|
| `first one` | 0 |
| `held-out` | 0 |
| `held-out key` | 0 |
| `answer key` | 0 |
| `verified key` | 0 |
| `verified answer key` | 0 |
| `demonstrated per-condition association` | 0 |
| `cannot be distinguished from zero` | 0 |
| `one dataset in six` | 0 |
| `performs below chance` | 0 |
| `below the 50 percent chance rate` | 0 |
| `reference classification` | 28 |
| `pre-specified reference classification` | 3 |

Every term on the instructed search list is at zero. No bibliographic entry or quoted source was altered: the References section is byte-identical to v5.

## Claim-boundary audit

| Claim that must be absent | Present |
|---|---|
| `verified key` (terminology) | no |
| `verified answer key` (terminology) | no |
| `answer key` (terminology) | no |
| `held-out key` (terminology) | no |
| `held-out reference classification` (revision 4) | no |
| `is an upper bound` (spectrum) | no |
| `JRS is independent of any vendor` (workflow) | no |
| `Fisher's exact` (per-condition inference) | no |
| `no deception was used` (ethics) | no |
| `de-identified participant-level response data` (data governance) | no |
| `A property can be real` (construct) | no |
| `Across the 113 labels` (Appendix B units) | no |
| `demonstrated per-condition association` (revision 2) | no |
| `cannot be distinguished from zero` (revision 6) | no |
| `one dataset in six` (revision 6) | no |
| `performs below chance` (revision 5) | no |
| `below the 50 percent chance rate` (revision 5) | no |
| `which is the first one a measurement programme` (revision 1) | no |

| Boundary that must be present | Present |
|---|---|
| It does not establish criterion validity against real documentat (DRR) | yes |
| may overstate performance on a corpus containing ambiguous recor (DRR ambiguous) | yes |
| The study therefore establishes detectability on AI-generated re (DRR human-authored) | yes |
| It does not establish measurement invariance (DRR invariance) | yes |
| JRS is a record-level, pre-finalisation review method. (JRS definition) | yes |
| The detection task reported in Section 6 does not require review (JRS not applied by detection reviewers) | yes |
| For JRS, the result should therefore be read as evidence support (JRS feasibility) | yes |
| designed to be vendor-, model-, and workflow-agnostic (JRS agnostic) | yes |
| Workflow independence is a design intention, not a result (workflow) | yes |
| The pre-registered reliability criterion was not met. (reliability) | yes |
| We do not treat that as satisfying the pre-registration. (reliability bootstrap) | yes |
| **8.6 The five conditions are not psychometrically validated.** (psychometric) | yes |
| would benefit professionally and commercially from the standard' (investigator dependence) | yes |
| an initial question a measurement programme must address (revision 1) | yes |
| face validity and descriptive per-condition association (revision 2) | yes |
| The reference classification is the comparison standard underlyi (revision 3) | yes |
| Agreement with the pre-specified reference classification (revision 4) | yes |
| At the other end, at least one reviewer had an accuracy below th (revision 5) | yes |
| The record component is estimated at the boundary and must not b (revision 6a) | yes |
| the profile-likelihood interval permits a materially larger reco (revision 6b) | yes |

| Statement that must appear exactly once | Count |
|---|---|
| revision 5, must appear exactly once | 1 |
| JRS positioning sentence | 1 |

**Result: PASS**

## Document-integrity audit

| Check | v5 | v6 |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 76502 | 91 |
| References section | 1 | 1 |
| Appendix A / B / C present | 1 / 1 / 1 | 1 / 1 / 1 |
| Duplicate paragraphs introduced | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 11683 | 11634 |

References section unchanged: byte-identical to v5.

Appendix A unchanged: byte-identical to v5.

Appendix B unchanged: byte-identical to v5, no revision was requested there.

No tracked changes or comments exist: the source is plain Markdown and the `.docx` is generated from it, so neither can be introduced. No text was truncated and no Unicode or punctuation corruption occurred; the only differences from v5 are the rule replacements listed above.

**Result: PASS**

"v6 surgical revision completed. No primary study result, preregistered threshold, corpus composition, study design, or substantive methodological finding was changed."

# Research and Validation Status

**Controlling distinction, maintained throughout:**

> Reproducibility is not reliability. Reliability is not accuracy. Accuracy is not
> criterion validity. None of these alone is operational effectiveness or legal
> sufficiency.

## Status by concept

| Concept | Status | Evidence | Classification |
|---|---|---|---|
| Reproducibility (same input, same engine, repeated) | Disclosed, not hidden. `variance` is part of the response contract and `runs > 1` is supported | `openapi.json` `Variance`; `api/v1/review-engine.js` | **VERIFIED as contract**; measured effect **NOT AUDITABLE** without an authorized call |
| Human inter-rater reliability | Measured **on the separate reliability sample**, not on the detection panel. **Pre-registered criterion NOT met** | Manuscript §6.5 reliability table | **VERIFIED** |
| Accuracy against a key | Measured **on the detection panel**, 16 reviewers over 24 records. Mean reviewer accuracy 83.9% | Manuscript results | **VERIFIED** |
| Construct validity | Not established | Manuscript limitations | **GAP**, author-disclosed |
| Real-world criterion validity | Not established. Corpus is constructed | Manuscript methods | **GAP**, author-disclosed |
| External validity | Not established | Manuscript limitations | **GAP**, author-disclosed |
| Operational effectiveness | Not established | none located | **GAP** |
| Legal sufficiency | Not established, and not claimed | none located | **GAP** |
| Regulatory compliance | Not established, and not claimed | none located | **GAP** |

## Detection study

| Control | Value | Classification |
|---|---|---|
| Corpus | 24 constructed records, balanced | **VERIFIED** |
| Corpus type | Constructed, not real-world case files | **VERIFIED**, and the principal external-validity limit |
| Participants | 16 independent experts, 11 countries | **VERIFIED** |
| Unit of analysis | Reviewer-level | **VERIFIED** |
| Graded judgments | 384 | **VERIFIED** |
| Primary metric | Mean reviewer-level accuracy | **VERIFIED** |
| Result | **83.9%** | **VERIFIED** |
| 95% CI (participant level, n = 16) | **72.7 to 95.1** | **VERIFIED** |
| Range across reviewers | 37.5% to 100% | **VERIFIED** |
| Threshold | Registered before data collection, and cleared | **VERIFIED** |
| Data-lock date | **15 August 2026** | **VERIFIED** |
| Blinding | Reviewers blind to the reference classification and to one another | **VERIFIED** |
| Preregistration status | Threshold pre-registered | **VERIFIED** |
| Independent replication | None | **GAP** |
| Data and code availability | Offered to reviewers on request | **VERIFIED** (cover letter), fulfilment **OWNER INPUT REQUIRED** |

**The dispersion is a finding, not noise.** Reviewer accuracy ranges from 37.5% to
100%. Group-level detectability does not license individual-level reliance, and the
manuscript says so directly. An evaluator should not read 83.9% as a per-reviewer
expectation.

## Reliability sample, including the criterion that failed

> **SCOPE, STATED BEFORE THE FIGURES. Added 2026-09-19.** This section reports a **different
> sample from the detection study above**, in the same manuscript. The detection panel is
> **16 reviewers over the full 24-record corpus, 384 graded judgments**. This analysis is
> **25 reliability participants, 22 analysed (8 invited, 14 open enrolment), on the 10 records
> that carried two or more raters, 113 determinations reduced to 104**. The manuscript's own
> conclusion calls it **"the separate reliability sample"**. **The criterion below belongs to
> this sample and must not be reported as an outcome of the detection study.**

The pre-registered criterion had **two parts**: a point estimate of at least **0.61**,
and a lower confidence bound of at least **0.41**.

| Group | Records | Labels | Raters | AC1 | 95% CI (analytic, pre-specified) | 95% CI (bootstrap, sensitivity) |
|---|---|---|---|---|---|---|
| Invited | 10 | 36 | 8 | **0.739** | 0.402 to 1.000 | 0.427 to 1.000 |
| Open enrolment | 10 | 68 | 14 | **0.623** | 0.252 to 0.993 | 0.285 to 0.894 |

**The pre-registered reliability criterion was not met.** Both point estimates clear
0.61. **Both analytic lower bounds fall below 0.41** (0.402 and 0.252). The criterion
fails on the lower-bound leg, not on the point estimate.

**This must never be summarised as "reliability was established" or as validation.**
It is a reported negative result, and reporting it is a strength of the work rather
than a weakness to be managed.

An exclusion rule materially affects the open-enrolment coefficient: raters working
under the unstructured baseline prompt are excluded by a rule stated in the manuscript
and fixed in the study design rather than chosen after seeing results. Pooling the
baseline labels drives the coefficient to between 0.16 and 0.18. **The exclusion is
disclosed rather than silent**, which is the correct handling.

## Publication status

| Item | Status | Classification |
|---|---|---|
| Two publication acceptances recorded internally | Recorded in `research/IP_SALE_TRACKER.md` rev 26 and `research/MASTER_TRACKER.md` | **OWNER INPUT REQUIRED** for external evidence |
| External evidence (acceptance letter, DOI, journal record, publisher page) | Not located in-repo | **GAP** |

**Citation rule, carried forward from the existing operating standard: cite as accepted
and in pipeline, never as published, until an issue exists.** Under the controlling
prompt for this package, a publication-acceptance claim requires direct evidence, and
in its absence the claim is classified NOT VERIFIED for external use. The internal
record is sufficient for internal planning and is not sufficient for a diligence
representation.

## Negative-result reporting policy

**VERIFIED.** The programme reports results that fail their own thresholds: the
reliability criterion is reported as not met, dispersion is reported as a finding, and
the manuscript states where its evidence stops. This is directly relevant to diligence
because it is evidence about how the research is conducted, not only about what it
found.

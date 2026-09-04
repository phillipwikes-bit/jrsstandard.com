# JRS Evidence Development Program

### Pre-Registered Analysis Plan: Rung 1 (Reproducibility) and Rung 2 (Reliability and Accuracy)

*Version 1.0 · Status: pre-registered prior to batch 3 and batch 4 data collection · jrsstandard.com*

---

## 1. Purpose

This document fixes, in advance of data collection, the hypotheses, measures, rater targets, statistics, and decision thresholds for the reproducibility (Rung 1) and reliability and accuracy (Rung 2) analyses of the Justification Review Standard. It is registered before batches 3 and 4 are labeled so that the reported results are confirmatory rather than post-hoc. No change to this plan will be made after the data are inspected; any deviation will be documented and labeled exploratory.

## 2. Scope and honest boundaries

This plan governs constructed records only. It addresses reproducibility (do independent AI models agree) and reliability and accuracy (do human reviewers agree with one another and with a reference panel). It does not address criterion validity (Rung 3) or real-world outcomes. No claim of validation, effectiveness, or real-record performance follows from these analyses. Reproducibility and reliability are distinct from accuracy on real records and from validation, and are reported as such.

## 3. Materials

- Constructed records from batches 1 through 4 (five-record batches). Batches 3 and 4 are balanced across the three determinations (approximately 2 Ready, 2 Needs work, 1 Gap per batch) to reduce skewed marginals.
- A separate 24-record detection set, half grounded in identifiable source evidence and half fluent but unsupported, with a held-out ground-truth key. Used for the detection analysis (H3).
- Determination scale: Ready, Needs work, Gap. A binary collapse (Ready versus not-Ready) is used for the detection analysis.
- The five JRS conditions are coded per record.

## 4. Data sources, raters, and targets (pre-specified)

Three data sources support these analyses:

- Rung 1, AI reproducibility: 3 independent large language models from 3 different vendors, applied to the constructed bench records.
- Rung 2a, bench reliability (five-record batches): at least 3 independent experts per record, plus a target of 5 regular (non-expert, trained) reviewers per batch. Additional reviewers are welcome and improve precision; batch 1 already carries about 12.
- Rung 2b, AI-assisted records detection (the 24-record set with a held-out key): a target of 4 to 5 independent reviewers; 4 are expected. The larger item count (24 records) offsets the smaller rater count for accuracy estimation.

Rater types (expert versus non-expert) are analyzed separately and compared.

Note on precision: because a single five-record batch has few items, the primary reliability estimate (Floor 1) is computed on the record set pooled across batches 1 through 4 (approximately 26 records), not on any single batch. Per-batch coefficients are reported descriptively only. This is what makes a design of 3 experts and 5 reviewers per batch adequate: precision comes from pooling items across batches, not from a large rater count within a batch.

## 5. Hypotheses (pre-specified)

- H1 (Rung 1, reproducibility): independent vendor models agree on determinations for constructed records above chance.
- H2 (Rung 2, reliability): expert reviewers apply the five conditions with chance-corrected agreement in the substantial range or above.
- H3 (Rung 2, detection and accuracy): on the 24-record detection set, reviewer reads match the held-out key above chance on the grounded-versus-unsupported (Ready versus not-Ready) distinction.
- H4 (secondary): regular reviewers achieve reliability above chance, and their agreement with the expert consensus is measurable and reported.

## 6. Measures

- Primary reliability statistic: Gwet's AC1, chosen for robustness to the kappa paradox under skewed marginals.
- Secondary reliability statistics: Krippendorff's alpha and Fleiss' kappa, reported alongside AC1 for transparency.
- All coefficients reported with 95% confidence intervals.
- Accuracy: percent agreement with the reference key, per-record (three-category) and binary, with confidence intervals.
- Per-condition agreement: AC1 computed for each of the five conditions (secondary).
- Rung 1: pairwise percent agreement and AC1 across the three models.

## 7. Decision thresholds: the two floors (pre-set)

- Floor 1, Reliability. The claim that reviewers apply the five conditions consistently is supported only if Gwet's AC1 among the expert panel, computed on the pooled record set (batches 1 through 4), is at least 0.61 (substantial) with the lower bound of its 95% confidence interval at least 0.41 (moderate). If AC1 falls below this floor, the reliability claim is reported as not supported.
- Floor 2, Detection and accuracy. The claim that reviewers distinguish reconstructable from non-reconstructable records is supported only if agreement with the held-out key on the 24-record detection set, on the binary Ready versus not-Ready distinction, exceeds chance (0.50) with the lower 95% confidence bound above 0.50, and reaches a pre-set target of at least 0.70.
- Rung 1 threshold. Cross-model agreement is reported descriptively; a reproducibility claim requires AC1 of at least 0.61.

Meeting a floor supports the corresponding claim as stated; failing a floor is reported plainly as a null or weak result, not reinterpreted.

## 8. Handling skew and the kappa paradox

Because determination marginals may be skewed, Gwet's AC1 is the primary coefficient. Fleiss' kappa is reported but interpreted with the explicit note that it is unstable when marginals are skewed. Balanced batches 3 and 4 are included specifically to reduce this effect and to allow kappa to be interpreted alongside AC1.

## 9. Procedures: blinding and independence

- Reviewers rate independently, without access to other reviewers' ratings or to the reference key.
- Records are presented unlabeled and without their intended determination.
- The reference key is defined by expert-panel majority and fixed before the accuracy analysis is run.

## 10. Exclusions

- Incomplete ratings are handled pairwise: a record a reviewer did not rate is excluded only from pairs involving that record.
- Preflight and test rows are excluded.
- A reviewer who completes fewer than 3 of the 5 records in a batch is excluded from that batch's reliability estimate.

## 11. What would weaken or falsify the claims

- If AC1 falls below Floor 1, reliability on constructed records is not supported by this study.
- If detection accuracy does not clear Floor 2, the discrimination claim is not supported.
- A material gap between expert and non-expert reliability bounds the reliability claim to trained experts, and is reported as such.

## 12. Limitations (pre-stated)

Constructed records, not real ones. Modest samples: three experts and about five reviewers per bench batch, and four reviewers on the detection set. These rater counts yield wider confidence intervals, which are reported honestly rather than hidden; precision is obtained by pooling items across batches. Single research group applying the framework. Reproducibility and reliability only. These analyses do not establish criterion validity, real-world performance, or validation, and no such claim will be drawn from them.

## 13. Analysis integrity

Analyses are run only after data lock, when the target labels for batches 3 and 4 have been collected. This plan is registered before that point. The reference-panel design and the chance-corrected reliability framework are methodological contributions of Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India.

---

*© 2026 Phillip Wikes · JRS™ · jrsstandard.com. Pre-registered analysis plan; preliminary and observational; not a claim of validated effectiveness.*

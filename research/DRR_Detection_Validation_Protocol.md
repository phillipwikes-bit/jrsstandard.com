# Validated Detection of Decision Reconstruction Risk (DRR)

### Pre-Registered Study Protocol

*Version 1.0 · Status: pre-registered prior to analysis · jrsstandard.com*

---

## 1. Purpose and research question

This study tests a single, bounded proposition: **is Decision Reconstruction Risk (DRR) a detectable property of records, and does the Justification Review Standard (JRS) improve its detection?** It is designed to produce a defensible validation of detectability, not a claim that JRS prevents adverse outcomes (that is criterion validity, addressed separately in Rung 3 or 4).

The claim this study can legitimately support, if the data clear the pre-set thresholds:

> In a blind study using an operational, independently verified definition, reviewers distinguished records exhibiting DRR from records free of it above chance, and reviewers applying the five JRS conditions did so more accurately than readers judging the same records without them.

## 2. The construct, operationalized (this is what removes circularity)

DRR is defined for this study by an objective, checkable rule rather than by the framework author's judgment.

- A record is **high-DRR (ungrounded)** if at least one **material conclusion** is not traceable to identifiable supporting evidence within the record: no cited, attached, or referenced source, no dated anchor, and no documented basis.
- A record is **low-DRR (grounded)** if **every** material conclusion is traceable to identifiable supporting evidence within the record.
- A **material conclusion** is a statement that, if incorrect, would change the decision or its defensibility.

Because this rule is objective, any competent person can apply it and check the result. DRR ceases to be the author's opinion and becomes a verifiable property.

## 3. Ground truth and independent verification

The 24-record detection set contains 12 records constructed to be grounded and 12 constructed to be ungrounded. To break any circularity between the framework author and the key:

1. The operational rule in Section 2 is applied to all 24 records by an **independent rater** who is blind to the study hypotheses and to the intended labels.
2. A **second independent rater** resolves any record on which the first rater disagrees with the intended label.
3. The **verified key** (the labels the independent raters assign) is what all detection accuracy is scored against. If the verified key diverges materially from the intended construction, the divergence is reported and the verified key governs.

This step is executable now, independent of the reviewer arms, and requires only one to two independent raters.

## 4. Design and arms

**Arm A — Detection signal (JRS reviewers; in progress).**
Trained reviewers apply the five JRS conditions to all 24 records, blind to the key, recording a determination (Ready, Needs work, Gap) and a would-rely judgment. This arm establishes that a detection signal exists and that reviewers agree with one another. Four to five reviewers; four expected.

**Arm B — Value of the standard (randomized comparison).**
A fresh pool of participants of comparable background is **randomly assigned** to one of two conditions and judges the same 24 records:
- **B1 (JRS condition):** judges each record using the five JRS conditions.
- **B2 (baseline condition):** judges each record with only a general prompt ("is this record adequately supported to rely on?"), without the five conditions.
Random assignment holds participant caliber constant, so any accuracy difference between B1 and B2 is attributable to the **standard**, not to expertise. This arm is what validates that JRS adds value.

Minimum viable version, given recruitment limits: even 5 to 8 participants per condition yields an interpretable difference; more improves precision.

## 5. Hypotheses (pre-specified)

- H1 (detectability): reviewers classify records against the verified key above chance.
- H2 (reliability): reviewers agree with one another on the grounded-versus-ungrounded distinction above chance.
- H3 (value of the standard): participants in the JRS condition (B1) classify more accurately than participants in the baseline condition (B2).

## 6. Outcomes and measures

- Primary outcome: **detection accuracy** against the verified key on the binary grounded-versus-ungrounded (low-versus-high DRR) distinction, with 95% confidence intervals.
- Sensitivity (correctly flagging high-DRR records) and specificity (correctly passing low-DRR records) reported separately.
- Inter-rater agreement: Gwet's AC1 (primary), with Krippendorff's alpha and Fleiss' kappa reported alongside.
- Arm B effect: difference in accuracy between B1 and B2, with confidence interval.

## 7. Pre-registered analysis and decision floors

- **Floor 1 (detectability):** supported only if accuracy against the verified key exceeds chance (0.50), with the lower 95% confidence bound above 0.50 and a point estimate of at least 0.70.
- **Floor 2 (reliability):** supported only if Gwet's AC1 across reviewers is at least 0.61 with the lower confidence bound at least 0.41.
- **Floor 3 (value of the standard):** supported only if B1 accuracy exceeds B2 accuracy, with the confidence interval of the difference excluding zero.

Meeting a floor supports the corresponding claim as stated. **Failing a floor is reported plainly as a null or weak result and is not reinterpreted.** A pre-registered study that could have failed and did not is what makes a pass meaningful.

## 8. Confound control (strengthening step, optional for the first pass)

To confirm reviewers detect groundedness rather than surface features (length, tone, fluency, domain), a **matched-pair** subset pairs a grounded and an ungrounded record matched on those features, differing only in whether claims are anchored. Sustained detection within matched pairs is discriminant evidence. This can be added in a second round.

## 9. Blinding, independence, and procedures

- Reviewers and participants judge independently, without access to one another's ratings or to the key.
- Records are presented unlabeled, in randomized order, without their intended determination.
- The verified key is fixed before any accuracy analysis is run.
- Arm B assignment is random and recorded before participation.

## 10. Exclusions

- Incomplete submissions handled pairwise.
- Preflight and test rows excluded.
- A participant completing fewer than 18 of 24 records is excluded from accuracy analysis.

## 11. What would weaken or falsify the claims

- If detection accuracy does not clear Floor 1, DRR is not shown to be detectable on this set.
- If AC1 does not clear Floor 2, the reliability claim is not supported.
- If B1 does not exceed B2 (Floor 3), the study does not support that the standard adds value beyond unaided judgment, and that is reported.

## 12. The bounded claim (what a pass does and does not establish)

A pass establishes: **DRR is a detectable, reliably identified property of records, and JRS improves its detection.** It does **not** establish that JRS prevents adverse outcomes, that results generalize to real (non-constructed) records, or that DRR predicts real-world failure. Those require the external-validity and criterion-validity stages below. The study is labeled a validation of **detectability**, precisely bounded.

## 13. From this study to full validation

1. This study: detectability of DRR on constructed records, with independent ground truth and a standard-versus-baseline comparison.
2. External validity: repeat on real AI-assisted records where groundedness is verified against actual source documents.
3. Criterion validity (Rung 3 or 4): show that records reviewers flag as high-DRR fail more often when examined for real (overturned, adverse findings). This is the strongest evidence and links detection to consequence.

## 14. Companion article structure

The write-up pairs with the DRR definition page as the empirical companion to the concept.
- Define DRR and the detection question.
- Operational ground truth and independent verification.
- Design (Arm A signal, Arm B randomized comparison).
- Results against the pre-registered floors, with confidence intervals.
- The bounded claim, stated precisely.
- Limitations and the path to full validation.

## 15. Integrity and attribution

Analyses run only after data lock. This protocol is registered before analysis. The reference-panel design and the chance-corrected reliability framework are methodological contributions of Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India. The proportionality of documentation to decision stakes, referenced in the JRS standard, was surfaced by pilot reviewer Saurabh Nanda.

---

*© 2026 Phillip Wikes · JRS™ · jrsstandard.com. Pre-registered protocol; preliminary and observational until data clear the pre-set thresholds; a pass validates detectability of DRR only, precisely as bounded above.*

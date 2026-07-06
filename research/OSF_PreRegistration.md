# OSF Pre-Registration — Validated Detection of Decision Reconstruction Risk (DRR)

*Template: OSF Preregistration. Complete and deposit at osf.io before the verified key is fixed and before any accuracy analysis is run. This registration timestamps the hypotheses, the answer-key verification procedure, and the Arm B randomized comparison.*

---

## Title
Validated Detection of Decision Reconstruction Risk (DRR): a pre-registered study of whether a documentation-review standard improves detection of ungrounded AI-generated records.

## Authors
Phillip Wikes (Creator, Justification Review Standard). Reliability/validation methodology contributed by Ubayet Hossain (Model Validation). Proportionality principle surfaced by Saurabh Nanda.

## Description
DRR is the condition in which a record cannot explain, on its own terms, why a consequential decision was made. This study tests whether DRR is a detectable property of records and whether applying the five JRS conditions improves detection over unaided judgment, using a set of 24 constructed AI-generated records (12 grounded, 12 ungrounded) and an independently verified answer key.

## Hypotheses
- **H1 (detectability):** reviewers classify records against the verified key above chance (0.50).
- **H2 (reliability):** reviewers agree with one another on the grounded-vs-ungrounded distinction above chance.
- **H3 (value of the standard):** participants applying the five JRS conditions (Arm B1) classify more accurately than participants judging with a general prompt only (Arm B2).

## Design
- **Arm A (detection signal):** trained reviewers apply the five JRS conditions to all 24 records, blind to the key, recording a determination (Ready / Needs work / Gap) and a would-rely judgment (Yes/No).
- **Arm B (value of the standard):** a fresh pool of comparable participants is **randomly assigned** to B1 (five JRS conditions) or B2 (general prompt: "is this record adequately supported to rely on?"), judging the same 24 records. Random assignment holds participant caliber constant, so any B1–B2 accuracy difference is attributable to the standard.

## Ground truth and answer-key verification (removes circularity)
A record is **ungrounded (high-DRR)** if at least one material conclusion is not traceable to identifiable supporting evidence within the record; **grounded (low-DRR)** if every material conclusion is so traceable. A material conclusion is one that, if incorrect, would change the decision or its defensibility.
1. Two raters **blind to the hypotheses and to the intended labels** apply this operational rule to all 24 records.
2. Rater 1 scores all 24; Rater 2 resolves any record where Rater 1 diverges from the intended construction label.
3. The **verified key** (independent raters' labels) is fixed before any accuracy analysis and governs all scoring. If it diverges materially from the intended construction, the divergence is reported and the verified key governs.

## Variables
- **Manipulated (Arm B):** review condition (B1 five-condition JRS vs B2 general prompt).
- **Measured:** per-record determination; would-rely judgment; derived binary grounded-vs-ungrounded classification.

## Analysis plan
- **Primary outcome:** detection accuracy vs the verified key on the binary grounded-vs-ungrounded distinction, with 95% CIs. Sensitivity (flagging ungrounded) and specificity (passing grounded) reported separately.
- **Reliability:** Gwet's AC1 (primary), with Krippendorff's alpha and Fleiss' kappa reported alongside; explicit treatment of the kappa paradox under skewed marginals.
- **Arm B effect:** difference in accuracy between B1 and B2 with 95% CI.

## Inference criteria (pre-registered decision floors)
- **Floor 1 (detectability):** accuracy above 0.50 with the lower 95% bound above 0.50 and a point estimate ≥ 0.70.
- **Floor 2 (reliability):** Gwet's AC1 ≥ 0.61 with lower bound ≥ 0.41.
- **Floor 3 (value of the standard):** B1 accuracy exceeds B2, CI of the difference excluding zero.
Meeting a floor supports the stated claim; failing a floor is reported plainly as null/weak and is not reinterpreted.

## Sample size
Arm A: 4–5 completed reviewers. Arm B: 5–8 participants per condition minimum (more improves precision). Recruitment is international; completion, not registration, defines the analyzed sample.

## Data exclusion
Preflight/test rows excluded. A participant completing fewer than 18 of 24 records is excluded from accuracy analysis. Incomplete submissions handled pairwise.

## Blinding
Records presented unlabeled, in randomized order, without intended determination. Reviewers/participants judge independently, without access to one another's ratings or to the key. Arm B assignment is random and recorded before participation. The verified key is fixed before any accuracy analysis.

## PRIOR DATA DISCLOSURE (integrity)
Arm A data collection is **in progress** at the time of this registration: two reviewers have completed all 24 records and one is partway. **No accuracy or reliability analysis has been run.** The verified answer key has **not** yet been fixed (independent verification is pending, per the procedure above). Arm B has **not** yet been collected. This registration therefore locks: (a) the answer-key verification procedure before the key is fixed, (b) the full analysis plan before any analysis is run, and (c) the Arm B design before Arm B data exist. Any deviation after this point will be documented and labeled exploratory.

## What would falsify the claims
- Detection accuracy not clearing Floor 1 → DRR not shown detectable on this set.
- AC1 not clearing Floor 2 → reliability claim unsupported.
- B1 not exceeding B2 (Floor 3) → the standard is not shown to add value beyond unaided judgment.

## Bounded claim
A pass establishes that DRR is a detectable, reliably identified property of records and that JRS improves its detection. It does not establish that JRS prevents adverse outcomes, that results generalize to real (non-constructed) records, or that DRR predicts real-world failure — those require external-validity and criterion-validity stages.

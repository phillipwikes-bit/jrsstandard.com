# OSF Deposit — Copy-Paste Form (field by field)

Each heading below is a box in OSF's "OSF Preregistration" template. Copy the text under each heading into the matching OSF box. Nothing else to write.

---

### Title
Validated Detection of Decision Reconstruction Risk (DRR): a pre-registered study of whether a documentation-review standard improves detection of ungrounded AI-generated records.

### Description
Decision Reconstruction Risk (DRR) is the condition in which a record cannot explain, on its own terms, why a consequential decision was made. This study tests whether DRR is a detectable property of records and whether applying the five conditions of the Justification Review Standard (JRS) improves detection over unaided judgment, using 24 constructed AI-generated records (12 grounded, 12 ungrounded) and an independently verified answer key.

### Hypotheses
- H1 (detectability): reviewers classify records against the verified key above chance (0.50).
- H2 (reliability): reviewers agree with one another on the grounded-vs-ungrounded distinction above chance.
- H3 (value of the standard): participants applying the five JRS conditions classify more accurately than participants judging with a general prompt only.

---

## Design Plan

### Study type
Experiment (randomized comparison in Arm B) combined with an observational detection arm (Arm A).

### Blinding
Records are presented unlabeled, in randomized order, without their intended determination. Reviewers and participants judge independently, with no access to one another's ratings or to the answer key. The answer key was fixed before any accuracy analysis.

### Study design
Two arms. Arm A: trained reviewers apply the five JRS conditions to all 24 records (determination: Ready / Needs work / Gap; plus a would-rely Yes/No). Arm B: a fresh pool of comparable participants is randomly assigned to B1 (five JRS conditions) or B2 (general prompt only: "is this record adequately supported to rely on?"), judging the same 24 records.

### Randomization
Arm B participants are assigned to B1 or B2 by a deterministic rule applied to their participant code, recorded before participation. Record order is randomized per participant.

---

## Sampling Plan

### Existing data
Registration prior to analysis. Some Arm A data already collected (two reviewers complete, one partway); no analysis has been run. The answer key was verified and fixed before any accuracy analysis. Arm B data not yet collected.

### Data collection procedures
Reviewers/participants complete all judgments online via a single link with a personal code; work saves automatically and can be resumed. Constructed, de-identified records only.

### Sample size
Arm A: 4–5 completed reviewers. Arm B: 5–8 participants per condition minimum; more improves precision.

### Sample size rationale
Detection signal and inter-rater agreement are estimable with 4–5 reviewers; a randomized B1-vs-B2 difference is interpretable at 5–8 per condition. Recruitment is international; completion, not registration, defines the analyzed sample.

### Stopping rule
Data collection closes at the pre-set date or when target completions are reached, whichever is later; analysis runs only after data lock.

---

## Variables

### Manipulated variables
Arm B review condition: B1 (five JRS conditions) vs B2 (general prompt only).

### Measured variables
Per-record determination; would-rely judgment; derived binary grounded-vs-ungrounded classification scored against the verified key.

### Indices
Binary classification per record; detection accuracy, sensitivity, specificity; inter-rater agreement.

---

## Analysis Plan

### Statistical models
Detection accuracy vs the verified key on the binary grounded-vs-ungrounded distinction, with 95% confidence intervals; sensitivity and specificity reported separately. Inter-rater agreement via Gwet's AC1 (primary), with Krippendorff's alpha and Fleiss' kappa reported alongside, and explicit treatment of the kappa paradox under skewed marginals. Arm B: difference in accuracy between B1 and B2 with 95% CI.

### Transformations
"Needs work" mapped to the grounded/ungrounded binary per a fixed pre-specified rule; B2 Yes/No mapped to grounded/ungrounded.

### Inference criteria (decision floors)
- Floor 1 (detectability): accuracy above 0.50, lower 95% bound above 0.50, point estimate at least 0.70.
- Floor 2 (reliability): Gwet's AC1 at least 0.61, lower bound at least 0.41.
- Floor 3 (value of the standard): B1 accuracy exceeds B2, CI of the difference excluding zero.
Meeting a floor supports the stated claim; failing a floor is reported plainly as null or weak and is not reinterpreted.

### Data exclusion
Preflight and test rows excluded. A participant completing fewer than 18 of 24 records is excluded from accuracy analysis.

### Missing data
Incomplete submissions handled pairwise.

### Exploratory analysis
Any analysis not specified above is labeled exploratory. A matched-pair confound-control subset may be added and, if so, is labeled exploratory in this registration.

---

### Other / Notes
Answer-key verification was executed before this registration: three raters blind to the intended labels unanimously reproduced the key, 24/24. Reliability/validation methodology contributed by Ubayet Hossain (Model Validation); the proportionality principle was surfaced by Saurabh Nanda. The bounded claim a pass supports: DRR is a detectable, reliably identified property of records and JRS improves its detection. It does not establish that JRS prevents adverse outcomes or that results generalize to real records.

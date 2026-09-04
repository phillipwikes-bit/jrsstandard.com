# Decision Reconstruction Risk Is Detectable: An International Expert Panel Evaluation of a Record-Level Review Standard

**Authors.** Phillip Wikes (Creator of the Justification Review Standard; former Lead Civil Rights Officer, Maryland Commission on Civil Rights) and Ubayet Hossain, FRM (Associate Director, Model Validation, KPMG India).

**Author contributions.** P.W. conceived Decision Reconstruction Risk and the JRS review method, constructed the validation corpus and the verified answer key, assembled the international reviewer panel, and led the writing. U.H. designed the reliability and validation framework: the reference-panel design, the chance-corrected agreement statistics, and the pre-registered decision floors and analysis plan.

**Target journal.** *AI and Ethics* (Springer). Alternatives: *AI & Society* (Springer); *Journal of Responsible Technology* (Elsevier, open access).

**Status: FINAL. Data locked 2026-08-15.** Every figure below was recomputed from the study database on the lock date. The eleven invited panel reviewers who had not started as of 6 August 2026 did not start before the close, so the completer count, the country count and the continent count are unchanged from the pre-close draft. This manuscript reports Study 011, the detection study, and nothing else.

---

> *A policy is only as resilient as the diversity of the minds that test it.*

---

## Abstract

**Background.** Generative AI increasingly drafts high-stakes corporate, administrative, and investigative records. Fluent text can read as complete and well supported while the evidentiary basis for its conclusions is absent from the record itself. A record whose conclusion cannot be reconstructed from the record alone cannot be independently examined or defended. We name this property Decision Reconstruction Risk (DRR).

**Objective.** This paper defines DRR as a measurable property of records rather than an abstract concern, and asks the question that must be answered before any other: is DRR detectable? If independent experts cannot reliably identify records whose reasoning is missing, no control built on that judgment can work.

**Methods.** A balanced corpus of 24 constructed, de-identified AI-generated records (12 grounded, 12 unsupported) was judged by an international panel of independent experts against an answer key fixed and independently verified before any scoring. Reviewers worked independently, blind to the key, in a personal capacity. Analysis followed a plan registered before the data were examined, with decision thresholds set in advance. Accuracy is analyzed at the participant level, treating each reviewer rather than each read as the unit of observation.

**Primary result.** Sixteen reviewers across 11 countries on 5 continents completed the full corpus, producing 384 graded reads. Panel accuracy against the verified key was 83.9 percent (95 percent CI 72.7 to 95.1 at participant level), with sensitivity 87.0 percent for unsupported records and specificity 80.7 percent for grounded ones. This clears the pre-registered threshold, which required a point estimate of at least 70 percent with a lower confidence bound above chance. DRR is detectable.

**Supporting results.** Three AI systems from three different vendors applied the same review to the same records across 41 nightly runs on a fixed 15-record set, reaching a mean pairwise agreement of 87.2 percent (95 percent CI 86.2 to 88.2), indicating consistent application at machine level, which is distinct from accuracy. Independent expert and trained-reviewer panels applied the five conditions to a shared 10-record set, reaching Gwet's AC1 of 0.739 and 0.623 respectively, in the substantial range and clearing the pre-registered point floor of 0.61; the confidence intervals around both are wide and the plan's lower-bound criterion is not met, so these reliability figures are reported as interim, resting on 10 of approximately 26 pooled records.

**Scope.** This paper establishes that the risk is detectable. Whether a structured method improves on unaided professional judgment is a different question, tested in a separate study and reported separately; Section 4.8 states the boundary.

---

## 1. Introduction

A record is only as useful as the ability of the people it concerns to understand it. A determination the affected person cannot follow cannot be questioned, corrected, or trusted. A record is also only as resilient as the range of people who read it closely, and a file that has survived review by one reviewer, in one language, inside one legal culture has not really been tested. Both of those commitments shape this study, and Section 2.1 develops them.

As generative AI automates more of the drafting of high-stakes records, the same fluency that makes it attractive makes its output difficult to interrogate. A model can produce a record that reads as thorough, professional, and complete while the evidence that would justify its conclusions never appears on the page. When the author who held that evidence is no longer available, and the record must be examined on its own, the record may simply fail to explain itself.

We call this property Decision Reconstruction Risk (DRR): the condition in which a record cannot, on its own terms, allow an independent reviewer to reconstruct the basis for a consequential decision. DRR is not a claim that a decision was wrong. It is a claim that the decision cannot be shown to be right from the record. In a civil rights intake, an employment determination, a compliance finding, or a public-records decision, that gap is the difference between a record that can be defended and one that cannot.

The stakes fall on two parties at once. For the person the record describes, an unreconstructable record removes the practical ability to understand a decision touching their rights, livelihood, or dignity, and to contest it on fair terms. For the organization, the same gap is a latent liability: a record that cannot be reconstructed cannot be defended when tested by a complaint, an audit, a regulator, or a court. DRR is unusual among governance problems in that the individual's right to an explanation and the institution's ability to defend its own decisions are threatened by one and the same defect.

Most of the AI governance conversation addresses model risk: bias, robustness, security, the behavior of the system itself. This paper addresses a complementary problem that arises after the model has assisted with drafting and lives in the record it helped produce. Documentation risk is workflow-independent. It does not matter whether the record was produced by a person, by a person assisted by AI, or by an automated pipeline. What matters is whether the resulting record can be independently reconstructed and defended.

Before asking whether any particular review method helps, there is a prior question to settle: is DRR detectable at all? If independent experts, reading a record cold, cannot tell one whose reasoning is present from one whose reasoning is absent, then documentation risk is not a governable property and no control built on human review can work. This paper reports a pre-registered test of that question and answers it yes. Whether a structured method improves on unaided judgment is a separate question under separate test, and it is not addressed here (Section 4.8).

## 2. Background: documentation risk and the reconstruction gap

Accountability regimes in employment, housing, civil rights, public records, healthcare compliance, and financial supervision share a common assumption: that a consequential decision leaves behind a record from which its basis can be reconstructed. Appeals, audits, and litigation all depend on it. When a determination is challenged, the reviewer does not re-interview the decision-maker's memory. The reviewer reads the record.

Generative AI stresses this assumption in a specific way. Language models are trained to produce fluent, plausible, well-formed text. Fluency and evidentiary grounding are different properties, and a model optimizes the first without guaranteeing the second. The result is a class of records that are convincing on their surface and hollow underneath: the conclusion is stated confidently, the prose is professional, the reasoning appears present, yet the specific facts, sources, dates, and inferential steps that would let a reader verify the conclusion are missing. Such a record reads as if it is well founded. It is not.

Existing AI governance instruments, for example model risk frameworks, impact assessments, and technology inventories, largely measure the system and the process. They do not measure whether the resulting record is independently reviewable. That is the measurement gap this work addresses.

### 2.1 The record and the person it describes

Reconstructability is usually argued for in institutional terms: a defensible file, an auditable trail, a record that survives litigation. Those are real interests, and they are not the only ones. A record is also the only account the affected person may ever receive of a decision that shaped their employment, their housing, their benefits, or their access to justice. A record that cannot be reconstructed cannot be understood or fairly questioned by the person it most concerns, and that person is rarely in the room when the standard for the file is set.

Accessibility is part of this property, not separate from it. A record written in language the affected person cannot read, or reasoned in steps they cannot follow, fails the same reconstruction test a court or regulator would later apply. In bilingual intake work this is not theoretical. A determination that is technically complete in English and functionally opaque to the person it describes has satisfied the file and failed the person. The reconstruction test, applied honestly, catches both failures with one question, because a record that only its author can explain is unreconstructable whether the barrier is a missing citation or a language the reader does not speak.

This has a direct methodological consequence for how a documentation standard should be tested. A standard validated by reviewers who share one jurisdiction, one legal culture, and one first language has been tested against a narrow slice of the conditions it will meet in practice. Records are read by people who bring different assumptions about what may be left implicit, what counts as an adequate citation, and what a reader is presumed to already know. Those assumptions are precisely what an unreconstructable record depends on to appear complete. A blind spot shared by every reviewer is not detected by any of them.

A policy is only as resilient as the diversity of the minds that test it. Local review builds a standard; a global panel stress-tests it. That is the reason this study recruited an internationally and linguistically diverse reviewer panel rather than a single-jurisdiction one, and it is why the panel's composition is reported as a design feature in Section 4 rather than as incidental demographic detail. If the standard holds when applied by professionals across eleven countries, five continents, and multiple first languages and legal traditions, it is being tested against something closer to the real conditions of review. If it held only within one of them, that would be a finding about that jurisdiction and not about records.

## 3. The Justification Review Standard (JRS)

JRS is a record-level, pre-finalization review method. It evaluates a single record against five conditions and yields a three-level read.

**The five conditions.** (1) Record self-sufficiency (reconstructability): the record allows an independent reviewer to reconstruct how the conclusion was reached from the record alone. (2) Evidentiary anchoring (basis identification): the record identifies the basis for its conclusions. (3) Chronological integrity: dates, sequence, and sources hold together when read cold. (4) Decision-process traceability: the reasoning from evidence to conclusion can be followed, and the responsible parties are identifiable. (5) Evidentiary sufficiency: the record contains enough to support the weight of the decision.

**The three reads.** A reviewer assigns each record one of three determinations: Ready (a later reviewer could reconstruct the conclusion from the record alone), Needs work (partly reconstructable, some basis visible with gaps), or Gap (the basis for the conclusion is not visible in the record). A separate would-rely judgment (Yes or No) records whether the reviewer would rely on the record in a high-stakes, accountable decision.

**Author-blind by design.** JRS does not ask, and does not try to detect, whether a record was written by a person or with AI assistance. That distinction is both technically unreliable and beside the point: a human-authored record can be conclusory and unanchored, and an AI-assisted record can be fully traceable. What the standard tests is whether the reasoning survives separation from whoever produced it. This is what keeps the criterion durable as drafting tools change.

**Proportionality.** The documentation defensibility a record must carry scales with the stakes of the decision it supports: the tolerable level of DRR falls as the consequence of the decision rises. This principle, surfaced by pilot reviewer Saurabh Nanda, keeps the standard practical by concentrating review effort where exposure is greatest; the constructed corpus used here is deliberately weighted toward high-stakes contexts.

JRS is deliberately independent of any vendor, model, or drafting workflow. It is a governance layer that sits above the technology stack and evaluates the output the stack produces.

## 4. Methods

### 4.1 Design

This is a detection study. An international panel of independent experts judged a balanced corpus of constructed records against a verified answer key, blind to the key and to one another's judgments. A separate randomized comparison study, described in Section 4.8, tests a different question and is not analyzed here.

### 4.2 Materials: the constructed corpus and the verified key

The corpus is 24 constructed, de-identified, AI-generated records drawn from high-stakes documentation contexts (HR and employment, investigations, compliance and audit, public records, and AI-assisted summaries). The set is balanced: 12 records are grounded (their conclusions are supported by content present in the record) and 12 are unsupported (their conclusions read as complete but lack a reconstructable basis). Records are presented unlabeled and in randomized order.

The answer key was fixed in advance. The author-side intended classification of each record was documented before verification, and the key was then independently reproduced by blind raters who did not see the study's hypotheses, 24 of 24. This procedure removes the circularity objection that the key was fit to the standard. The key and its verification packet are retained and available to reviewers under the study's data-availability terms.

### 4.3 Participants

The detection panel is an international group of independent experts in relevant domains: AI governance, compliance, audit, human resources, investigations, data privacy, records, and law. Every panel member is a credentialed practitioner or researcher in one of those fields, recruited on that basis. At the data lock of 15 August 2026, 16 reviewers had completed the full 24-record set. The completed reviewers span 11 countries on 5 continents (Australia, Germany, India, Nigeria, Poland, Singapore, South Korea, Spain, the United Arab Emirates, the United Kingdom, and the United States) and multiple professional domains and first languages, a composition motivated in Section 2.1. Reviewers participate in a personal capacity, without compensation, and are recognized as named contributors with their consent. Participation is voluntary and may be withdrawn before publication.

Eleven further reviewers accepted an invitation and did not begin. None started before the close, so the panel reported here is the panel the pre-close draft described.

### 4.4 Analysis and unit of observation

Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of those scores with a confidence interval across reviewers. This is the conservative and correct unit. Treating each of the 24 reads as an independent observation would understate uncertainty substantially, because reads from one reviewer reflect one person applying one threshold. Where read-level figures are reported for comparison, they are labeled as such.

For each reviewer, the latest submission per record is used; resubmissions supersede earlier ones. Participants completing fewer than 18 of 24 records are excluded from accuracy analysis, per the pre-registered exclusion rule. No panel member fell below that bar; the exclusion count for this study is zero.

One stored row carries an administrative marker rather than a record judgment and is excluded from scoring. It is reported here rather than dropped silently: 385 rows were retained after de-duplication, of which 384 are scorable graded reads.

### 4.5 Pre-registered thresholds

Analysis follows a plan registered before results were examined. Two thresholds in that plan govern this paper.

**Detection threshold (primary).** The claim that reviewers distinguish reconstructable from non-reconstructable records is supported only if agreement with the held-out key exceeds chance with the lower 95 percent bound above 0.50, and reaches a pre-set target of at least 0.70.

**Reliability floor (supporting).** Gwet's AC1 among the expert panel of at least 0.61, with the lower bound of its confidence interval at least 0.41.

The registered plan also carries a threshold for the separate comparison study. It is not applied here, because that study is not reported here.

A threshold that is not met is reported plainly as a weak result, not reinterpreted.

### 4.6 Ethics, consent, and confidentiality

All records are constructed and de-identified; none is internal, confidential, or tied to a real individual or organization. Participation is voluntary, uncompensated, and in a personal capacity. Reviewer responses are stored on an append-only basis and used only in aggregate. Attribution is opt-in: contributors are named only with consent, may participate anonymously, and may withdraw their name or contribution before any publication. This study makes no proven-effectiveness claim.

### 4.7 Supporting analyses: reproducibility and reliability

In the reproducibility analysis, each constructed record was judged by three large language models, one from each of three independent vendors: Anthropic, OpenAI, and Google. Cross-vendor models were used, rather than three instances of one provider, so that agreement reflects the method rather than a single model lineage; the measure is mean pairwise agreement on the determination, run as an automated nightly process.

In the reliability analysis, independent raters applied the five conditions to a shared record set. Raters whose codes begin with E are experts; the remainder are trained reviewers. Agreement is assessed with Gwet's AC1 (Gwet, 2008) as the primary chance-corrected coefficient, chosen for robustness to the kappa paradox under skewed marginals (Feinstein and Cicchetti, 1990; Byrt et al., 1993), with Krippendorff's alpha, Fleiss' kappa, and per-condition AC1 reported alongside.

**Inclusion rule for the reliability analysis, stated explicitly.** Only labels recorded under the five-condition instrument are analyzed, with one label retained per rater per record and the latest submission kept. Sixteen labels in the same table were recorded by raters working under the unstructured baseline prompt rather than the five conditions. Those raters were answering a different question with a different instrument, and including them would measure agreement between two methods rather than the reliability of one. They are excluded, and the exclusion is stated here because it changes the coefficient materially: on the analyzed set the trained-reviewer coefficient is 0.623, and pooling the baseline labels in drives it to 0.16 to 0.18. The rule is the one this study was designed around, not one selected after seeing either number.

### 4.8 Scope of the claim

This study asks whether Decision Reconstruction Risk can be detected. Whether the five conditions improve on unaided professional judgment is a different question, and it is being tested in a separate study with its own participants, its own recruitment, its own participant codes, and its own registration. That study shares this corpus, which is why it is named here rather than left for a reader to discover.

That study has now closed and will be reported separately and in full, whatever it shows. Nothing here claims the method outperforms unaided judgment. The detection result does not depend on that comparison in any way: the corpus, the key, the panel, and the analysis plan were fixed independently of it.

## 5. Results: DRR is detectable

Sixteen independent experts, working in 11 countries across 5 continents, each read the full 24-record corpus and returned 384 graded judgments, unpaid and in a personal capacity, none of them having discussed a record with any other. What follows rests on that effort. They are 16 of the 58 independent experts who have graded records for this programme; all 58 are credited in the Acknowledgments, and the results below are scoped to these 16 alone.

### 5.1 Primary detection result

Sixteen reviewers completed the full 24-record corpus, producing 384 graded reads.

| Measure | Result |
|---|---|
| Panel accuracy against the verified key | **83.9%** |
| 95% CI (participant level, n = 16) | 72.7 to 95.1 |
| Sensitivity (unsupported records correctly flagged) | **87.0%** |
| Specificity (grounded records correctly passed) | **80.7%** |
| Pre-registered threshold: point estimate at least 70% | Met |
| Pre-registered threshold: lower bound above 50% | Met |

The pre-registered threshold is cleared on both criteria. Experienced professionals, reading constructed records cold and blind to a verified key, identify records whose reasoning cannot be reconstructed at a rate well above chance and above the target set in advance.

The dispersion behind each of those means is reported, because a control's usability depends on it.

| Measure | Mean | SD | Range across reviewers | Reviewers at 100% |
|---|---|---|---|---|
| Accuracy | 83.9% | 21.0 | 37.5 to 100 | 6 of 16 |
| Sensitivity | 87.0% | 24.2 | 25.0 to 100 | 11 of 16 |
| Specificity | 80.7% | 25.8 | 16.7 to 100 | 7 of 16 |

Sensitivity exceeds specificity by roughly six points, meaning the panel was somewhat more likely to catch an unsupported record than to pass a grounded one cleanly. For a governance control this is the preferable direction of error: the failure mode is a well-founded record sent back for additional anchoring, rather than an unsupported record allowed to stand. The gap is not statistically distinguishable from zero in this sample and is reported as a direction rather than as an effect.

Performance varied across reviewers, from 100 percent down to below chance, with six reviewers scoring perfectly. That dispersion is reported rather than smoothed, and is discussed in Section 7.

### 5.2 Supporting result: cross-vendor reproducibility

Three independent vendor models judged the same constructed records nightly. On the fixed 15-record set the series runs from 29 June to 15 August 2026 and comprises **41 runs**, with a mean pairwise agreement on the determination of **87.2 percent** (95 percent CI 86.2 to 88.2; median 86.7, SD 3.2 points, range 82.2 to 93.3).

The series is reported rather than any single run, and the denominator is held constant, for a reason that changes the figure materially. Fifteen earlier runs scored only 2 or 3 records while the corpus was being built. On a 3-record run a single disagreement moves the mean by 11 points, and those runs are the entire source of the 66.7 percent low that appears when all 56 cross-vendor runs are pooled. Pooling across denominators also weights a 3-record run equally with a 15-record one. Restricted to the fixed set, the observed range is 82.2 to 93.3.

Reporting the series rather than the latest run is also the only stable choice: the process runs nightly, so a single-run figure is stale the following morning. This measures consistency of application and is explicitly not a measure of correctness.

### 5.3 Supporting result: inter-rater reliability

The reliability analysis follows the plan and the acceptance floors specified in advance by the study's methodology author, including the choice of Gwet's AC1 as the primary coefficient under an anticipated skewed determination distribution. That specification is doing real work here: the skew arrived as predicted, and the coefficient chosen before the data were seen is the one that handles it.

On a shared set of 10 records carrying 113 submitted determinations under the five-condition instrument, reduced to 104 after keeping one label per rater per record, expert reviewers reached Gwet's AC1 of **0.739** (36 labels, 8 raters), above the pre-registered point threshold of 0.61; trained reviewers reached **0.623** (68 labels, 14 raters). The determination distribution was skewed, and under that skew the marginal-sensitive coefficients diverge from AC1 as the analysis plan anticipated, which is the documented reason AC1 was pre-registered as primary.

| Panel | Records | Labels | AC1 | 95% CI (analytic) | 95% CI (bootstrap) |
|---|---|---|---|---|---|
| Experts | 10 | 36 | 0.739 | 0.402 to 1.000 | 0.427 to 1.000 |
| Trained reviewers | 10 | 68 | 0.623 | 0.253 to 0.994 | 0.301 to 0.886 |

Both point estimates clear the pre-registered floor of 0.61. Neither clears the plan's secondary criterion that the lower confidence bound exceed 0.41 on the analytic interval: experts fall on the boundary at 0.402 and pass at 0.427 on the bootstrap interval; trained reviewers fail on both. Under the conventional Landis and Koch bands, the expert coefficient of 0.739 sits in the substantial range, and it was reached by independent professionals who had never discussed these records with one another.

These reliability figures are interim. They rest on 10 records against a pre-registered pooled target of about 26, which is why the intervals above are as wide as they are. They will be re-estimated when the pooled set is complete.

### 5.4 Supporting result: every condition carries discriminating information

The reliability instrument records a judgment on each of the five conditions separately, not only the overall determination. Across the 113 labels recorded under the five-condition instrument, each condition separates Ready determinations from Gap determinations at a rate far beyond chance.

| Condition | Pass rate, Ready determinations | Pass rate, Gap determinations | Fisher's exact, two-sided |
|---|---|---|---|
| Reconstructability | 14 of 14 (100%, 95% CI 78 to 100) | 15 of 77 (19%, CI 12 to 30) | 7.3e-09 |
| Basis identification | 14 of 14 (100%, CI 78 to 100) | 20 of 77 (26%, CI 17 to 37) | 1.3e-07 |
| Chronological integrity | 14 of 14 (100%, CI 78 to 100) | 10 of 77 (13%, CI 7 to 22) | 1.8e-10 |
| Decision-process traceability | 14 of 14 (100%, CI 78 to 100) | 10 of 77 (13%, CI 7 to 22) | 1.8e-10 |
| Evidentiary sufficiency | 14 of 14 (100%, CI 78 to 100) | 7 of 77 (9%, CI 4 to 18) | 1.1e-11 |

Intervals are Wilson score intervals, used because several cells are small. Ready determinations number 14 in this corpus, so every rate in the first column rests on 14 observations and its interval is correspondingly wide.

Two things follow. None of the five conditions is decorative: each one moves with the determination rather than sitting alongside it, which is the minimum a multi-condition instrument has to demonstrate before its composite read means anything. And the conditions are not interchangeable. Evidentiary sufficiency is both the most often unmet across all 113 labels, at 77.9 percent not passing, and the sharpest discriminator between Ready and Gap. Chronological integrity, decision-process traceability, reconstructability and basis identification follow at 65.5, 64.6, 57.5 and 51.3 percent respectively.

The instrument's three levels are all exercised in this corpus. Across the 113 labels the lowest level is the most-used value of the three, recorded 216 times against 207 passes and 142 middle-level judgments, and it appears at least once in 77 of the 113 labels. The separations reported above are therefore across the full scale rather than between the top two levels.

## 6. Discussion

The contribution is that DRR is detectable, and that is the precondition for everything downstream. A documentation property experienced reviewers cannot identify is not a governable property, and a control built on human review of it would rest on nothing. The panel result shows the property is real, visible, and identifiable well above chance by professionals working across a wide range of jurisdictions and first languages.

Detecting a problem is not the same as fixing it. That reviewers can identify unreconstructable records leaves open whether a structured method helps them do it better, faster, or more consistently than they would unaided. That question is genuinely open, it belongs to the separate study named in Section 4.8, and nothing here settles it.

One feature of the results is worth drawing out for practitioners. Accuracy varied widely across the panel, from perfect scores down to below chance, and a review process in which some reviewers are highly accurate and others perform below chance is hard to manage even when the average is acceptable, because the spread is invisible at the point of use. Whether a structured standard narrows that spread is a question about variance rather than about means, and it would need its own pre-registered test.

Stated in full, this is what the study supports. Decision Reconstruction Risk is detectable by independent experts, at 83.9 percent accuracy against a verified key, clearing a threshold fixed before the data were seen, by a panel spanning 11 countries and 5 continents. The review is applied consistently by independent machines at 87.2 percent mean cross-vendor agreement across 41 runs on a fixed record set, and by independent human experts at AC1 0.74, interim. What the study does not address is whether the method improves on unaided expert judgment, and no claim about that is made here. A property can be real, visible, and worth building controls around long before anyone has shown that a particular instrument beats expert intuition at spotting it. Establishing that it can be seen at all is what makes the second question askable.

## 7. Limitations

The corpus is constructed rather than drawn from live records, which supports a clean detection test but does not establish real-world effectiveness; criterion validity against documented real-case outcomes is a separate line of work.

The panel is recruited, not sampled, and self-selects for interest in the topic. Generalization beyond the sampled domains and jurisdictions is not claimed.

The study does not test whether the method improves on unaided judgment, and nothing here should be read as evidence on that question. Detection has no control condition by design: the panel is measured against a verified key, not against another group. No efficacy claim is made and none should be inferred.

The panel is made up of credentialed experts, which bounds the generalization in a particular direction. These results establish that DRR is detectable by people who review records for a living. What a less experienced reviewer, or one working outside their own domain, would achieve on the same corpus is a worthwhile question for later work.

Reviewer accuracy varied widely, including panel members scoring below chance. Response patterns were examined and showed genuine discrimination rather than straight-lining or missing data, so these are treated as real observations and retained.

Sensitivity and specificity are reported as participant-level means. The comparison between them in Section 5.1 is descriptive: both numbers come from the same 16 reviewers, so a paired test is the correct one, and the paired data were not retained in a form that supports it. The six-point gap is reported as a direction and should not be cited as a measured difference.

Reliability figures are interim on 10 of approximately 26 pooled records, and the per-condition analysis in Section 5.4 rests on the same 10 records. Ready determinations number 14 in that corpus, so the first column of the Section 5.4 table rests on 14 observations throughout. JRS remains in a validation phase and makes no proven-effectiveness claim.

## 8. Conclusion

Drafting tools change and the technology stack underneath them changes faster. The evidentiary test does not move. A record that cannot be reconstructed from its own contents cannot be independently defended, whoever or whatever produced it.

This paper establishes that Decision Reconstruction Risk is detectable: an international panel of independent experts, reading records cold and blind to a verified key, identified unreconstructable records at 83.9 percent accuracy, clearing a threshold set before the data were seen. It further establishes that the review can be applied consistently by independent machines and by independent human experts, and that all five of its conditions carry information that separates a reconstructable record from an unreconstructable one.

Whether a structured standard improves on unaided professional judgment remains open, and this paper does not attempt to answer it. What it does establish is that the property is real and measurable, which is the thing that had to be settled first. Sizing the added value of a control is the next study, and it can now be designed against a measured baseline rather than an assumed one.

## References

Byrt, T., Bishop, J., Carlin, J.B., 1993. Bias, prevalence and kappa. *Journal of Clinical Epidemiology* 46 (5), 423-429.

Cohen, J., 1960. A coefficient of agreement for nominal scales. *Educational and Psychological Measurement* 20 (1), 37-46.

Feinstein, A.R., Cicchetti, D.V., 1990. High agreement but low kappa: I. The problems of two paradoxes. *Journal of Clinical Epidemiology* 43 (6), 543-549.

Fleiss, J.L., 1971. Measuring nominal scale agreement among many raters. *Psychological Bulletin* 76 (5), 378-382.

Gwet, K.L., 2008. Computing inter-rater reliability and its variance in the presence of high agreement. *British Journal of Mathematical and Statistical Psychology* 61 (1), 29-48.

Gwet, K.L., 2014. *Handbook of Inter-Rater Reliability*, fourth ed. Advanced Analytics, Gaithersburg, MD.

Krippendorff, K., 2004. *Content Analysis: An Introduction to Its Methodology*, second ed. Sage, Thousand Oaks, CA.

Landis, J.R., Koch, G.G., 1977. The measurement of observer agreement for categorical data. *Biometrics* 33 (1), 159-174.

## Acknowledgments

**Fifty-eight independent experts have graded records for this programme.** Every one of them worked unpaid, in a personal capacity, with nothing at stake in the outcome, and none of them had to take an interest in the question. They are acknowledged here together, because the programme is one body of work and the people who carried it do not become less relevant to a reader depending on which study a given paper reports.

They divide as follows, and each group did something the others did not.

**The detection panel, 16 independent experts across 11 countries and 5 continents.** Each read the full 24-record corpus cold, blind to a verified key, and returned 384 graded judgments. This paper's result is theirs. Its international and linguistic range is a methodological asset rather than a courtesy, for the reasons set out in Section 2.1.

**The comparison study, 20 independent experts.** Each completed the same full 24-record corpus under the design described in Section 4.8, and did so without knowing what the comparison was testing, which is what made the comparison possible at all. Their work closed on 15 August 2026 and will be reported in full in its own paper, whatever it shows. A reviewer who completes twenty-four blind reads to answer a question they cannot be told about has done the harder version of this job, and it would be wrong to acknowledge them only in the paper their data happens to appear in.

**The reliability study, 25 raters.** Eight worked as expert raters and seventeen as trained reviewers on the shared record set, producing the labels behind the coefficients in Section 5.3 and the per-condition analysis in Section 5.4. Section 5.4 exists only because they recorded a judgment on each of the five conditions separately rather than only the overall read.

Across the two review studies, 36 independent experts have each completed a full 24-record set, in 16 countries across 5 continents. Every completer code resolved to a country; none was estimated.

Those wider figures are acknowledgment, not results. The detection finding in Section 5 rests on the sixteen panel members and their 384 graded reads, and on nothing else. Keeping the credit wide and the claim narrow is deliberate, and both halves of that sentence are meant.

The reliability and validation methodology, including the pre-registered analysis plan, the choice of coefficient, and the acceptance floors applied in Section 5.3, was designed by Ubayet Hossain, FRM. Specifying those criteria before any data were examined is what allows the results in this paper to be read as tests rather than as descriptions.

We thank every reviewer across all three studies for their care and their independent judgment. Reviewers in all three are recognized as named contributors with their consent, on the same terms and with the same standing; none is a co-author of this paper. Recognition is not scoped to the study a given paper reports.

The proportionality principle described in Section 3 was surfaced by pilot reviewer Saurabh Nanda, General Manager and APAC Business Leader (Align Technology), and is credited with his permission.

## Data availability and pre-registration

The study protocol and analysis plan are pre-registered. Constructed records, the verified answer key and its verification packet, and aggregate results are available to reviewers under the study's data-availability terms. Live participation is tracked on an aggregate dashboard showing counts only, never individual answers.

---

## Change log for this version (v3, 2026-08-15)

Every change below is a correction against the study database at data lock. No figure was altered in a direction favourable to the paper, and two changes make the paper's claims narrower than they were.

**1. Status line replaced.** The pre-close draft warned that eleven invited reviewers had not started and that any one of them finishing would move the completer count, the point estimate, the interval, sensitivity, specificity and the country count. None of them started. The panel, the countries and the continents are unchanged, and the line is replaced with the lock.

**2. Primary figures verified, not restated.** Accuracy 83.85 percent, 95 percent CI 72.66 to 95.05, sensitivity 86.98 percent, specificity 80.73 percent, n 16, 384 graded reads. All four reproduce from the database at close and are reported rounded as before.

**3. Cross-vendor reproducibility rebuilt as a series on a constant denominator.** The draft carried 84 percent from a single run dated 2026-07-06 with a band of 78 to 87 percent. Two things were wrong with that and both are fixed. **A single-run figure is stale the next morning**, because the process runs nightly: between drafting this revision and checking it, the latest run moved from 87.8 percent on 12 August to 82.2 percent on 15 August. **And pooling every run mixes denominators**: 15 of the 56 cross-vendor runs scored only 2 or 3 records while the corpus was being built, where one disagreement moves the mean by 11 points, and those runs are the sole source of the 66.7 percent low. The figure is now the 41-run series on the fixed 15-record set: **mean 87.2 percent, 95 percent CI 86.2 to 88.2, median 86.7, SD 3.2, range 82.2 to 93.3.** This is both more defensible and slightly stronger than the mixed-denominator mean of 84.4.

**4. Perfect scorers corrected from five to six.** The stored per-reviewer scores contain six values of 100.

**5. The "no rater used fail" paragraph is removed, and its Limitations twin with it.** The draft stated that no rater used the lowest coding level and that the reported separations were therefore between the top two levels only. The data does not support that. The lowest level is the **most-used value of the three**, recorded 216 times against 207 passes and 142 middle-level judgments, and it appears in 77 of 113 labels. The draft claimed a limitation the study does not have.

**6. Reliability counts updated.** 108 submitted determinations to **113**; 99 retained to **104**; trained-reviewer labels 63 to **68**; trained-reviewer AC1 0.624 to **0.623**. The expert coefficient is unchanged at 0.739.

**7. The reliability inclusion rule is now stated in the Methods.** Sixteen labels in the same table were recorded under the unstructured baseline prompt rather than the five conditions. They are excluded, because including them measures agreement between two different methods. The exclusion changes the trained-reviewer coefficient from 0.623 to between 0.16 and 0.18, which is large enough that the rule must be visible in the paper rather than buried in a script.

**8. Section 5.4 condition table recomputed.** The Gap denominator moves from 75 to 77 and three cell counts change. All five conditions still separate at p below 1.5e-07.

**9. Per-condition not-passing rates replaced, and the reason is a problem worth recording.** The draft reported 52.9, 40.6, 40.0, 37.3 and 35.1 percent not passing. **Those figures could not be reproduced from the database under any inclusion rule tested** (all labels, five-condition labels only, de-duplicated or raw, counting the lowest level as not-passing or excluding it). The computed values are 77.9, 65.5, 64.6, 57.5 and 51.3 percent. The ordering of the top item is preserved; the rest of the ordering changes. The draft's figures are not carried forward.

**10. Dispersion added to Section 5.1.** Standard deviations, ranges and perfect-scorer counts for all three measures. The draft reported point estimates only, and the spread is the part a practitioner needs.

**11. The sensitivity-versus-specificity comparison is downgraded to a direction.** Both numbers come from the same 16 reviewers, so the correct test is paired, and the paired data were not retained in a form that supports one. An unpaired approximation returns p = 0.48. The draft implied a difference; this version reports a direction and says why.

**12. One administrative row disclosed.** 385 rows were retained after de-duplication, of which 384 are scorable. The single non-scorable row carries an administrative marker rather than a judgment. The draft reported 384 without noting the discarded row.

**13. Epigraph added**, and the stress-test framing worked into Section 2.1, in the paper's own register.

**14. Language.** "Frequently" replaced with "most often" per the house style rule. No em-dashes are present. The manuscript's voice is unchanged elsewhere; nothing was rewritten for its own sake.

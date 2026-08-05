# Decision Reconstruction Risk Is Detectable: An International Expert Panel Evaluation of a Record-Level Review Standard

**Authors:** Phillip Wikes (Creator of the Justification Review Standard; former Lead Civil Rights Officer, Maryland Commission on Civil Rights) and Ubayet Hossain, FRM (Associate Director, Model Validation, KPMG India).

**Author contributions:** P.W. conceived Decision Reconstruction Risk and the JRS review method, developed the paper's normative framing, constructed the validation corpus and the verified answer key, assembled the international reviewer panel, and led the writing. U.H. designed the reliability and validation framework: the reference-panel design, the chance-corrected agreement statistics, and the pre-registered decision floors and analysis plan.

**Target journal:** *AI and Ethics* (Springer). Alternatives: *AI & Society* (Springer); *Journal of Responsible Technology* (Elsevier, open access).

**Status (2026-08-02):** Working draft. The primary detection analysis is complete and reported. The pre-registered randomized comparison reached its minimum sample and is reported as an underpowered null with an effect-size estimate. All figures are verified against the study database on the date shown, not carried from memory.

---

## Abstract

**Background.** Generative AI increasingly drafts high-stakes corporate, administrative, and investigative records. Fluent text can read as complete and well supported while the evidentiary basis for its conclusions is absent from the record itself. A record whose conclusion cannot be reconstructed from the record alone cannot be independently examined or defended. We name this property Decision Reconstruction Risk (DRR).

**Objective.** This paper defines DRR as a measurable property of records rather than an abstract concern, and asks the question that must be answered before any other: **is DRR detectable?** If experienced professionals cannot reliably identify records whose reasoning is missing, no control built on that judgment can work.

**Methods.** A balanced corpus of 24 constructed, de-identified AI-generated records (12 grounded, 12 unsupported) was judged by an international panel of experienced professionals against an answer key fixed and independently verified before any scoring. Reviewers worked independently, blind to the key, in a personal capacity. Analysis followed a plan registered before the data were examined, with decision thresholds set in advance. Accuracy is analyzed at the participant level, treating each reviewer rather than each read as the unit of observation.

**Primary result.** Sixteen reviewers across 11 countries on 5 continents completed the full corpus. Panel accuracy against the verified key was **83.9 percent** (95 percent CI 72.7 to 95.1 at participant level), with sensitivity 87.0 percent for unsupported records and specificity 80.7 percent for grounded ones. This clears the pre-registered threshold, which required a point estimate of at least 70 percent with a lower confidence bound above chance. **DRR is detectable.**

**Supporting results.** Three AI systems from three different vendors applied the same review to the same records and agreed at a mean pairwise rate of 84 percent across 15 records, indicating consistent application at machine level, which is distinct from accuracy. Independent expert and trained-reviewer panels applied the five conditions to a shared 10-record set, reaching Gwet's AC1 of 0.74 and 0.63 respectively, in the substantial range and clearing the pre-registered floor; these reliability figures are interim, resting on 10 of approximately 26 pooled records.

**Secondary, pre-registered.** A randomized comparison assigned JRS-naive professionals to review the same records either with the five conditions or with a general prompt. The standard condition scored 73.3 percent (n = 5) against 69.3 percent for the unaided condition (n = 11), a difference of 4.0 percentage points (Cohen's d = 0.140) whose confidence interval includes zero. Under the pre-registered decision rule this is reported as a null. As the unaided arm has accrued completers, the observed difference has narrowed rather than widened, and post-hoc power analysis now indicates that a definitive test of an effect this size would require approximately 800 completers per condition.

**Contribution.** DRR names a documentation-governance problem that model-centric AI governance does not capture. This paper establishes that the property is detectable by experienced reviewers, characterizes the effect size for a properly powered trial of the standard's added value, and offers the design as a template for evaluating documentation-quality controls.

**Keywords:** AI governance; documentation risk; accountability; decision defensibility; record-level review; responsible AI.

---

## 1. Introduction

In accountability settings, a record is only as useful as the ability of the people it concerns to understand it. A determination the affected person cannot follow cannot be questioned, corrected, or trusted. A record is also only as resilient as the range of people who scrutinize it: a file that survives review by a single reviewer, in one language, within one legal culture, has not truly been tested. Both commitments shape this study, and both are developed in Section 2.1.

As generative AI automates more of the drafting of high-stakes records, the same fluency that makes it attractive makes its output difficult to interrogate. A model can produce a record that reads as thorough, professional, and complete while the evidence that would justify its conclusions never appears on the page. When the author who held that evidence is no longer available, and the record must be examined on its own, the record may simply fail to explain itself.

We call this property Decision Reconstruction Risk (DRR): the condition in which a record cannot, on its own terms, allow an independent reviewer to reconstruct the basis for a consequential decision. DRR is not a claim that a decision was wrong. It is a claim that the decision cannot be shown to be right from the record. In a civil rights intake, an employment determination, a compliance finding, or a public-records decision, that gap is the difference between a record that can be defended and one that cannot.

The stakes fall on two parties at once. For the person the record describes, an unreconstructable record removes the practical ability to understand a decision touching their rights, livelihood, or dignity, and to contest it on fair terms. For the organization, the same gap is a latent liability: a record that cannot be reconstructed cannot be defended when tested by a complaint, an audit, a regulator, or a court. DRR is unusual among governance problems in that the individual's right to an explanation and the institution's ability to defend its own decisions are threatened by one and the same defect.

Most of the AI governance conversation addresses model risk: bias, robustness, security, the behavior of the system itself. This paper addresses a complementary problem that arises after the model has assisted with drafting and lives in the record it helped produce. Documentation risk is workflow-independent. It does not matter whether the record was produced by a person, by a person assisted by AI, or by an automated pipeline. What matters is whether the resulting record can be independently reconstructed and defended.

**The question this paper answers.** Before asking whether any particular review method helps, a prior question must be settled: is DRR detectable at all? If experienced professionals, reading a record cold, cannot distinguish one whose reasoning is present from one whose reasoning is absent, then documentation risk is not a governable property and no control built on human review can work. This paper reports a pre-registered test of exactly that question, and answers it affirmatively. A secondary pre-registered comparison, testing whether the structured method improves detection relative to unaided judgment, is reported in Section 6 as an underpowered null with the effect size needed to design a conclusive trial.

## 2. Background: documentation risk and the reconstruction gap

Accountability regimes in employment, housing, civil rights, public records, healthcare compliance, and financial supervision share a common assumption: that a consequential decision leaves behind a record from which its basis can be reconstructed. Appeals, audits, and litigation all depend on it. When a determination is challenged, the reviewer does not re-interview the decision-maker's memory. The reviewer reads the record.

Generative AI stresses this assumption in a specific way. Language models are trained to produce fluent, plausible, well-formed text. Fluency and evidentiary grounding are different properties, and a model optimizes the first without guaranteeing the second. The result is a class of records that are convincing on their surface and hollow underneath: the conclusion is stated confidently, the prose is professional, the reasoning appears present, yet the specific facts, sources, dates, and inferential steps that would let a reader verify the conclusion are missing. Such a record reads as if it is well founded. It is not.

Existing AI governance instruments, for example model risk frameworks, impact assessments, and technology inventories, largely measure the system and the process. They do not measure whether the resulting record is independently reviewable. That is the measurement gap this work addresses.

### 2.1 The record and the person it describes

Reconstructability is usually argued for in institutional terms: a defensible file, an auditable trail, a record that survives litigation. Those are real interests, and they are not the only ones. A record is also the only account the affected person may ever receive of a decision that shaped their employment, their housing, their benefits, or their access to justice. A record that cannot be reconstructed cannot be understood or fairly questioned by the person it most concerns, and that person is rarely in the room when the standard for the file is set.

Accessibility is part of this property, not separate from it. A record written in language the affected person cannot read, or reasoned in steps they cannot follow, fails the same reconstruction test a court or regulator would later apply. In bilingual intake work this is not theoretical. A determination that is technically complete in English and functionally opaque to the person it describes has satisfied the file and failed the person. The reconstruction test, applied honestly, catches both failures with one question, because a record that only its author can explain is unreconstructable whether the barrier is a missing citation or a language the reader does not speak.

This has a direct methodological consequence for how a documentation standard should be tested. A standard validated by reviewers who share one jurisdiction, one legal culture, and one first language has been tested against a narrow slice of the conditions it will meet in practice. Records are read by people who bring different assumptions about what may be left implicit, what counts as an adequate citation, and what a reader is presumed to already know. Those assumptions are precisely what an unreconstructable record depends on to appear complete.

A decision, a policy, or a principle is only as resilient as the range of people who have pressure-tested it. That is the reason this study recruited an internationally and linguistically diverse reviewer panel rather than a single-jurisdiction one, and it is why the panel's composition is reported as a design feature in Section 4 rather than as incidental demographic detail. If the standard holds when applied by professionals across eleven countries, five continents, and multiple first languages and legal traditions, it is being tested against something closer to the real conditions of review. If it held only within one of them, that would be a finding about that jurisdiction and not about records.

## 3. The Justification Review Standard (JRS)

JRS is a record-level, pre-finalization review method. It evaluates a single record against five conditions and yields a three-level read.

**The five conditions.** (1) Record self-sufficiency (reconstructability): the record allows an independent reviewer to reconstruct how the conclusion was reached from the record alone. (2) Evidentiary anchoring (basis identification): the record identifies the basis for its conclusions. (3) Chronological integrity: dates, sequence, and sources hold together when read cold. (4) Decision-process traceability: the reasoning from evidence to conclusion can be followed, and the responsible parties are identifiable. (5) Evidentiary sufficiency: the record contains enough to support the weight of the decision.

**The three reads.** A reviewer assigns each record one of three determinations: Ready (a later reviewer could reconstruct the conclusion from the record alone), Needs work (partly reconstructable, some basis visible with gaps), or Gap (the basis for the conclusion is not visible in the record). A separate would-rely judgment (Yes or No) records whether the reviewer would rely on the record in a high-stakes, accountable decision.

**Author-blind by design.** JRS does not ask, and does not try to detect, whether a record was written by a person or with AI assistance. That distinction is both technically unreliable and beside the point: a human-authored record can be conclusory and unanchored, and an AI-assisted record can be fully traceable. What the standard tests is whether the reasoning survives separation from whoever produced it. This is what keeps the criterion durable as drafting tools change.

**Proportionality.** The documentation defensibility a record must carry scales with the stakes of the decision it supports: the tolerable level of DRR falls as the consequence of the decision rises. This principle, surfaced by pilot reviewer Saurabh Nanda, keeps the standard practical by concentrating review effort where exposure is greatest; the constructed corpus used here is deliberately weighted toward high-stakes contexts.

JRS is deliberately independent of any vendor, model, or drafting workflow. It is a governance layer that sits above the technology stack and evaluates the output the stack produces.

## 4. Methods

### 4.1 Design

The primary analysis is a detection study. An international panel of experienced professionals independently judged a balanced corpus of constructed records against a verified answer key, blind to the key and to one another's judgments. A secondary, pre-registered randomized comparison (Section 6) tested whether the structured method improves detection relative to unaided judgment among JRS-naive participants.

### 4.2 Materials: the constructed corpus and the verified key

The corpus is 24 constructed, de-identified, AI-generated records drawn from high-stakes documentation contexts (HR and employment, investigations, compliance and audit, public records, and AI-assisted summaries). The set is balanced: 12 records are grounded (their conclusions are supported by content present in the record) and 12 are unsupported (their conclusions read as complete but lack a reconstructable basis). Records are presented unlabeled and in randomized order.

The answer key was fixed in advance. The author-side intended classification of each record was documented before verification, and the key was then independently reproduced by blind raters who did not see the study's hypotheses, 24 of 24. This procedure removes the circularity objection that the key was fit to the standard. The key and its verification packet are retained and available to reviewers under the study's data-availability terms.

### 4.3 Participants

The detection panel is an international group of experienced professionals in relevant domains: AI governance, compliance, audit, human resources, investigations, data privacy, records, and law. As of 4 August 2026, **16 reviewers have completed the full 24-record set**. The completed reviewers span **11 countries on 5 continents** (Australia, Germany, India, Nigeria, Poland, Singapore, South Korea, Spain, the United Arab Emirates, the United Kingdom, and the United States) and multiple professional domains and first languages, a composition motivated in Section 2.1. Reviewers participate in a personal capacity, without compensation, and are recognized as named contributors with their consent. Participation is voluntary and may be withdrawn before publication.

### 4.4 Analysis and unit of observation

Accuracy is computed at the **participant level**: each reviewer contributes one accuracy score, and the panel result is the mean of those scores with a confidence interval across reviewers. This is the conservative and correct unit. Treating each of the 24 reads as an independent observation would understate uncertainty substantially, because reads from one reviewer reflect one person applying one threshold. Where read-level figures are reported for comparison, they are labeled as such.

For each reviewer, the latest submission per record is used; resubmissions supersede earlier ones. Participants completing fewer than 18 of 24 records are excluded from accuracy analysis, per the pre-registered exclusion rule.

### 4.5 Pre-registered thresholds

Analysis follows a plan registered before results were examined.

- **Detection threshold (primary).** The claim that reviewers distinguish reconstructable from non-reconstructable records is supported only if agreement with the held-out key exceeds chance with the lower 95 percent bound above 0.50, and reaches a pre-set target of at least 0.70.
- **Reliability floor (supporting).** Gwet's AC1 among the expert panel of at least 0.61, with the lower bound of its confidence interval at least 0.41.
- **Comparison threshold (secondary).** The standard condition exceeds the unaided condition with the confidence interval of the difference excluding zero.

Failing a threshold is reported plainly as a null or weak result, not reinterpreted.

### 4.6 Ethics, consent, and confidentiality

All records are constructed and de-identified; none is internal, confidential, or tied to a real individual or organization. Participation is voluntary, uncompensated, and in a personal capacity. Reviewer responses are stored on an append-only basis and used only in aggregate. Attribution is opt-in: contributors are named only with consent, may participate anonymously, and may withdraw their name or contribution before any publication. Participants in the randomized comparison were blind to the two-condition design and are debriefed on closure. The study makes no proven-effectiveness claim.

### 4.7 Supporting analyses: reproducibility and reliability

In the reproducibility analysis, each constructed record was judged by three large language models, one from each of three independent vendors: Anthropic, OpenAI, and Google. Cross-vendor models were used, rather than three instances of one provider, so that agreement reflects the method rather than a single model lineage; the measure is mean pairwise agreement on the determination, run as an automated nightly process.

In the reliability analysis, independent raters applied the five conditions to a shared record set. Raters whose codes begin with E are experts; the remainder are trained reviewers. Agreement is assessed with Gwet's AC1 (Gwet, 2008) as the primary chance-corrected coefficient, chosen for robustness to the kappa paradox under skewed marginals (Feinstein and Cicchetti, 1990; Byrt et al., 1993), with Krippendorff's alpha, Fleiss' kappa, and per-condition AC1 reported alongside.

## 5. Results: DRR is detectable

### 5.1 Primary detection result

Sixteen reviewers completed the full 24-record corpus, producing 384 graded reads.

| Measure | Result |
|---|---|
| Panel accuracy against the verified key | **83.9%** |
| 95% CI (participant level, n = 16) | **72.7 to 95.1** |
| Sensitivity (unsupported records correctly flagged) | 87.0% |
| Specificity (grounded records correctly passed) | 80.7% |
| Pre-registered threshold: point estimate at least 70% | **Met** |
| Pre-registered threshold: lower bound above 50% | **Met** |

**The pre-registered detection threshold is cleared on both criteria.** Experienced professionals, reading constructed records cold and blind to a verified key, identify records whose reasoning cannot be reconstructed at a rate well above chance and above the target set in advance.

Sensitivity exceeds specificity by roughly seven points, meaning the panel was somewhat more likely to catch an unsupported record than to pass a grounded one cleanly. For a governance control this is the preferable direction of error: the failure mode is a well-founded record sent back for additional anchoring, rather than an unsupported record allowed to stand.

Performance varied across reviewers, from 100 percent down to below chance, with five reviewers scoring perfectly. That dispersion is reported rather than smoothed, and is discussed in Section 7.

### 5.2 Supporting result: cross-vendor reproducibility

Across 15 constructed records, three independent vendor models reached a mean pairwise agreement of **84 percent** on the determination (latest automated run 2026-07-06; the figure moved within a band of 78 to 87 percent as the set grew from 3 to 15 records). This indicates consistent application at machine level and is explicitly not a measure of correctness.

### 5.3 Supporting result: inter-rater reliability

On a shared set of 10 records, expert reviewers reached **Gwet's AC1 of 0.74** (0.739 to three decimals, mean pairwise raw agreement 83 percent), above the pre-registered point threshold of 0.61; trained reviewers reached **0.62** (0.624, mean pairwise raw agreement 63 percent). The determination distribution was skewed, and under that skew the marginal-sensitive coefficients diverge from AC1 as the analysis plan anticipated, which is the documented reason AC1 was pre-registered as primary.

**These reliability figures are interim.** They rest on 10 records against a pre-registered pooled target of approximately 26, so the confidence intervals are wide and the plan's lower-bound criterion sits on the boundary. They are reported as an interim result and will be re-estimated at target.

## 6. Secondary pre-registered analysis: does the standard improve on unaided judgment?

A randomized comparison was built to isolate the value of the method itself. Fresh, JRS-naive professionals drawn from a single recruitment pool were randomly assigned, by a deterministic hash of their participant code and before they judged any record, to review the same 24 records either with the five conditions (standard condition) or with a single general question about adequacy of support (unaided condition).

### 6.1 Result

| Condition | n | Accuracy |
|---|---|---|
| Standard condition | 5 | 73.3% |
| Unaided condition | 11 | 69.3% |
| **Difference** | | **+4.0 pp** |

The difference favors the standard. It is **not statistically distinguishable from zero**: participant-level bootstrap 95 percent CI of the difference is -19.9 to +28.8 percentage points, Welch t = 0.30 on 11.3 degrees of freedom. **Under the pre-registered decision rule, this analysis is reported as a null.** The standard is not shown to improve on unaided judgment by this study.

### 6.2 Why the analysis was underpowered, stated precisely

The observed effect is Cohen's d = 0.140 (pooled sd 28.6). At the sample reached, the smallest difference the comparison could have detected at 80 percent power was approximately 43 percentage points. **The comparison was never capable of detecting an effect of the size that appears to be present.**

This is a statement about the design, not about the standard. A null from an underpowered test is uninformative about the underlying effect, and we decline to interpret it in either direction.

### 6.3 Effect-size estimate for a conclusive trial

The value this analysis does deliver is a defensible effect-size estimate for designing a properly powered replication:

| Target | Completers required per condition |
|---|---|
| 80 percent power, alpha .05 | approximately 800 |
| 90 percent power, alpha .05 | approximately 1,070 |

We report this specification so that a future trial, whether ours or another group's, can be sized correctly at the outset rather than discovering its limits afterward.

## 7. Discussion

**The primary contribution is that DRR is detectable.** This is the precondition for everything downstream. A documentation property that experienced reviewers cannot identify is not a governable property, and any control built on human review of it would be unfounded. The panel result establishes that the property is real, visible, and identifiable at a rate well above chance by professionals from a wide range of jurisdictions and first languages.

**Detection is not the same as remediation.** Establishing that reviewers can identify unreconstructable records leaves open whether a structured method helps them do it better, faster, or more consistently than unaided judgment. That question is genuinely open, and Section 6 reports honestly that this study could not settle it.

**An observation, exploratory and not pre-registered.** Dispersion in accuracy differed markedly between conditions in the secondary analysis. Reviewers using the five conditions clustered more tightly (sd 21.2) than reviewers working unaided (sd 34.0), and the unaided distribution was bimodal, with several participants scoring near-perfectly and several below chance, and few in between. A plausible mechanism is that an unaided reviewer must invent a threshold, and private thresholds vary widely, while explicit conditions constrain the space of reasonable readings. We flag this because it suggests that variance reduction, rather than mean improvement, may be the more important effect to test. It is not established here: the formal tests of the variance difference are not significant, and the observation is post-hoc. A dedicated, pre-registered test would be required.

**Practical implication.** For an organization, a review process in which some reviewers are highly accurate and others perform below chance is difficult to manage even when the average is acceptable, because the variance is invisible at the point of use. If a structured standard narrows that spread, the operational value may exceed what a comparison of means would capture.

## 8. Limitations

The corpus is constructed rather than drawn from live records, which supports a clean detection test but does not establish real-world effectiveness; criterion validity against documented real-case outcomes is a separate line of work.

The panel is recruited, not sampled, and self-selects for interest in the topic. Generalization beyond the sampled domains and jurisdictions is not claimed.

**The expert panel and the randomized comparison are not compared to one another, and the difference between them should not be read as evidence about the standard.** The panel comprises experienced domain professionals; the comparison arms comprise JRS-naive recruits. Any difference between those groups confounds expertise with method and is uninterpretable. The only valid method comparison in this design is between the two randomized conditions in Section 6, which is reported there as a null. We state this explicitly because the panel's higher accuracy is the kind of number that invites exactly this misreading.

Reviewer accuracy varied widely, including two panel members scoring below chance. Response patterns were examined and showed genuine discrimination rather than straight-lining or missing data, so these are treated as real observations and retained.

Reliability figures are interim on 10 of approximately 26 pooled records. JRS remains in a validation phase and makes no proven-effectiveness claim.

## 9. Conclusion

The drafting tool and the technology stack will keep changing. The evidentiary test does not. A record that cannot be reconstructed from its own contents cannot be independently defended, whoever or whatever produced it.

This paper establishes that Decision Reconstruction Risk is detectable: an international panel of experienced professionals, reading records cold and blind to a verified key, identified unreconstructable records at 83.9 percent accuracy, clearing a threshold set before the data were seen. It further establishes that the review can be applied consistently by independent machines and by independent human experts.

Whether a structured standard improves on unaided professional judgment remains open. We report the attempt, the null, and the sample size a conclusive answer would require. The property is real and measurable; sizing the control's added value is the next study, and it can now be designed properly.

## References

Byrt, T., Bishop, J., Carlin, J.B., 1993. Bias, prevalence and kappa. Journal of Clinical Epidemiology 46 (5), 423-429.

Cohen, J., 1960. A coefficient of agreement for nominal scales. Educational and Psychological Measurement 20 (1), 37-46.

Feinstein, A.R., Cicchetti, D.V., 1990. High agreement but low kappa: I. The problems of two paradoxes. Journal of Clinical Epidemiology 43 (6), 543-549.

Fleiss, J.L., 1971. Measuring nominal scale agreement among many raters. Psychological Bulletin 76 (5), 378-382.

Gwet, K.L., 2008. Computing inter-rater reliability and its variance in the presence of high agreement. British Journal of Mathematical and Statistical Psychology 61 (1), 29-48.

Gwet, K.L., 2014. Handbook of Inter-Rater Reliability, fourth ed. Advanced Analytics, Gaithersburg, MD.

Krippendorff, K., 2004. Content Analysis: An Introduction to Its Methodology, second ed. Sage, Thousand Oaks, CA.

Landis, J.R., Koch, G.G., 1977. The measurement of observer agreement for categorical data. Biometrics 33 (1), 159-174.

## Acknowledgments

We thank the international reviewer panel for their care and independent judgment. Reviewers are recognized as named contributors with their consent; they are not co-authors of this paper. The argument developed in Section 2.1, that a record must remain understandable to the person it describes and that linguistic and jurisdictional range strengthens review, originated in conversations with panel reviewer Gabriela Cortez (Maryland Commission on Civil Rights) and is credited to her with permission. The proportionality principle described in Section 3 was surfaced by pilot reviewer Saurabh Nanda, General Manager and APAC Business Leader (Align Technology), and is credited with his permission.

## Data availability and pre-registration

The study protocol and analysis plan are pre-registered. Constructed records, the verified answer key and its verification packet, and aggregate results are available to reviewers under the study's data-availability terms. Live participation is tracked on an aggregate dashboard showing counts only, never individual answers.

## Progress log

- 2026-08-02b: **Byline returned to two authors.** Gabriela Cortez is credited as a named panel reviewer and as the origin of the Section 2.1 argument in the Acknowledgments, at her preference; she is not a co-author at this time. Section 2.1 is retained in the paper's voice. The dual-role disclosure is removed as no longer applicable.
- 2026-08-04: **Refreshed against the live database.** All figures in this draft were recomputed from the study database on 4 August 2026 using the pre-registered scoring rule (latest submission per reviewer and record, scored against the fixed key, participants with at least 24 graded reads). Changes from the 2 August version: the panel grew from 15 to **16 completers** and from 10 to **11 countries**, panel accuracy moved from 82.8 to **83.9 percent** (participant-level CI 72.7 to 95.1, sensitivity 87.0, specificity 80.7, 384 graded reads); the unaided arm of the secondary comparison grew from 8 to **11 completers**, which moved its accuracy from 62.0 to 69.3 percent and **narrowed the observed difference from +11.4 to +4.0 percentage points** (Cohen's d from 0.379 to 0.140, Welch t = 0.30 on 11.3 df, participant bootstrap CI -19.9 to +28.8). The required sample for a conclusive replication therefore rose from approximately 110 to approximately **800 per condition** at 80 percent power. The direction of that movement is reported plainly because it matters: additional data made the secondary effect smaller, not larger, and the paper's conclusion about the comparison is unchanged only in the sense that it remains a null. Reliability was re-estimated on JRS-mode labels only and reproduced the prior values (experts AC1 0.739, trained 0.624, 10 records, 99 labels after de-duplication); the parenthetical raw-agreement figures were corrected to the mean pairwise values the current data produce (83 percent experts, 63 percent trained), replacing figures that could not be reproduced. Analysis script and the label extract are filed at `research/analysis_2026-08-04.py` and `research/reliability_labels_2026-08-04.tsv`.

- 2026-08-02: **Restructured from the previous draft.** The paper is now primarily a detection study, with the expert-panel result as the headline finding (82.8 percent, participant-level CI 71.0 to 94.6, clears the pre-registered threshold on both criteria). The randomized comparison moves from co-primary to a clearly-labeled pre-registered secondary analysis (Section 6), reported in full as an underpowered null with the effect-size estimate and power specification attached. Gabriela Cortez reinstated as co-author with authorship of Section 2.1, which is expanded into a fuller treatment of accessibility as an accountability property and the methodological rationale for an internationally and linguistically diverse panel; dual-role disclosure added. Limitations gained an explicit statement that the expert panel and the randomized arms must not be compared, because that comparison confounds expertise with method. Unit of analysis moved to participant level throughout.

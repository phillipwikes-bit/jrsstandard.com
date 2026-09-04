# Decision Reconstruction Risk: A Record-Level Control for AI-Assisted Documentation

**Author:** Phillip Wikes, AI Governance and Cognitive Risk Advisor; Creator of the Justification Review Standard; Lead Civil Rights Officer, Maryland Commission on Civil Rights, 2012 to 2025. info@jrsstandard.com

**Single-authored. No co-author dependency. Submittable on completion of a read-through.**

**Primary target:** *EDPACS: The EDP Audit, Control, and Security Newsletter* (Taylor & Francis). Practitioner journal with a real ISSN, indexed, explicitly publishes contributed practitioner work on audit and control topics, and accepts framework-plus-evidence pieces of this length. **Alternates in order:** *ISACA Journal* (contributed practitioner articles, audit and governance readership); *Records Management Journal* (Emerald, peer-reviewed but practitioner-friendly, exact domain fit); *Business Information Review* (SAGE, practitioner-academic bridge).

**Why this one is the easiest to place:** practitioner journals want an operational framework with implementation guidance. Most submissions of that kind carry no evidence at all. This one carries a pre-registered validation program with a completed detection result, which is unusual for the venue and is the reason to expect a favourable review.

---

## Abstract

Organizations increasingly draft consequential records with generative AI assistance. The resulting documents are fluent, well organized, and professional, and those properties are independent of whether the evidence supporting their conclusions is present on the page. This article names the resulting exposure, Decision Reconstruction Risk (DRR): the condition in which a record cannot, on its own terms, allow an independent reviewer to reconstruct the basis for a consequential decision. It argues that DRR is invisible to model-centric AI governance because it lives in the output rather than the system, presents a five-condition record-level control for detecting it before finalization, reports the current status of a pre-registered validation program including a completed detection study, and gives practical guidance on where to place the control in an existing review workflow. The central empirical finding is that DRR is detectable: an international panel of 15 experienced professionals identified unreconstructable records at 82.8 percent accuracy against a blind-verified key, clearing a threshold set in advance.

**Keywords:** documentation risk; audit evidence; AI governance; decision defensibility; records control; quality assurance

---

## 1. The problem: fluency is not grounding

Consider two records that reach the same conclusion about the same matter. One states the conclusion and cites the dated documents, communications, and observations it rests on. The other states the conclusion in confident, well-structured prose and cites nothing. Read quickly, the second may be the more impressive document.

Before generative AI, the second record was comparatively rare, and it announced itself. A thin file read as thin. Vague language, short paragraphs, and hedged phrasing were the signals reviewers used, largely unconsciously, to know where to look harder.

Generative AI removes that signal. A language model is optimized to produce fluent, plausible, well-formed text. Fluency and evidentiary grounding are separate properties, and optimizing the first does not deliver the second. The result is a class of records that are convincing on the surface and hollow underneath: the conclusion is confident, the prose is professional, the reasoning appears present, and the specific facts, dates, sources, and inferential steps that would let a reader verify the conclusion are absent.

This is not an argument against AI-assisted drafting. It is an observation that the traditional early-warning system for weak documentation has been disabled, and that nothing has replaced it.

## 2. Decision Reconstruction Risk defined

**Decision Reconstruction Risk (DRR)** is the condition in which a record cannot, on its own terms, allow an independent reviewer to reconstruct the basis for a consequential decision.

Three features of the definition matter for control design.

**DRR is a property of the record, not of the decision.** A record exhibiting DRR may document a decision that was correct, carefully reached, and well supported by evidence that existed at the time. The defect is that the evidence lived in the author's knowledge rather than on the page. The decision was defensible. The record is not.

**DRR is workflow-independent.** It does not matter whether a record was produced by a person, by a person assisted by AI, or by an automated pipeline. The test is applied to the output. This is what makes the control durable as drafting tools change, and it is why the control does not attempt to detect whether AI was used. Attempting that detection is technically unreliable and conceptually misdirected: a human-authored record can be conclusory and unanchored, and an AI-assisted record can be fully traceable.

**DRR is latent until it is tested.** It produces no error, no exception, and no alert. It surfaces only when someone asks the record to explain a decision, which is typically months or years later, during a complaint, an audit, a regulatory examination, or litigation. By then the author has often moved on and the surrounding context is unrecoverable.

## 3. Why existing controls do not catch it

Most AI governance instruments measure the system or the process. Model risk frameworks assess the model. Impact assessments assess the intended use. Technology inventories record which tools are deployed. Each is useful and none answers the question of whether the record the tool helped produce is independently reviewable.

Conventional documentation quality assurance has a different blind spot. It typically evaluates completeness against a template, policy compliance, and writing quality. A record can satisfy all three and still fail reconstruction, because none of those checks asks whether a conclusion's stated basis is actually identifiable in the file.

The measurement gap is specific: **no widely used control evaluates the reviewability of the output.** DRR is offered as the name for what that missing control would measure.

## 4. The control: five conditions applied before finalization

The Justification Review Standard evaluates a single record against five conditions and returns a three-level determination. It is applied before a record is finalized, which is the only point at which the finding is cheap to act on.

**Condition 1, Reconstructability.** A neutral reviewer can identify the basis for the conclusion using only what the record contains, without verbal explanation or outside context. The operational test is whether the record functions with the original author unavailable. This is the master condition; the remaining four specify what a self-sufficient record must contain.

**Condition 2, Basis identification.** Each material conclusion is supported by specific, identifiable evidence: dated records, correspondence, performance or tenancy records, screening criteria, documented interactions, or witness accounts. An evaluative term such as "unprofessional," "uncooperative," or "not a good fit" requires a documented behavioural anchor, regardless of whether a person or a tool introduced the term.

**Condition 3, Chronological integrity.** Relevant events, dates, and their sequence are identifiable from the record. Missing dates are, in practice, the single most common deficiency in administrative files. A pattern claim requires at least two dated, identified instances; a sequence that cannot be reconstructed cannot be evaluated.

**Condition 4, Decision-process traceability.** The path from evidence to conclusion is visible within the record, and the responsible parties are identifiable. This condition distinguishes the control from quality checklists that assess only whether a conclusion appears reasonable. A coherent narrative is not a traceable record. A record may contain valid evidence and still fail, because the reasoning connecting evidence to conclusion was never committed to the page.

**Condition 5, Evidentiary sufficiency.** The evidence in the record is sufficient to support the weight of the decision. Where automated drafting contributed, the source material is identifiable and was reviewed by a human before finalization. Wording that introduces characterizations absent from the source notes is a traceability deficiency, not a stylistic improvement.

**The determination.** Each record receives one of three reads. **Ready:** self-contained, evidence identifiable, reasoning traceable. **Needs work:** the conclusion may be accurate, but the basis is not visible; additional anchoring or secondary review is required. **Gap:** the basis for the conclusion is not present; return to the drafter before finalization. The three-level scale preserves the operationally important middle case, records that are probably sound but not yet reconstructable.

**Proportionality.** The defensibility a record must carry scales with the stakes of the decision it supports. A routine action closed without consequence may be adequately served by a brief summary. A termination, a benefits denial, an adverse compliance finding, or a clinical determination requires specific, identifiable evidence, or at minimum references to where that evidence resides. This principle keeps the control practical by concentrating effort where exposure is greatest, and it is what the escalation routing in Section 6 operationalizes.

## 5. Validation status

Practitioner frameworks are frequently published without evidence. This one is offered with its current evidence and its current limits stated plainly.

The validation program is staged. Each stage answers one question and no stage is credited with answering a later one.

**Consistency of application, machine level.** Three large language models, one each from three independent vendors, applied the review to the same constructed records. Mean pairwise agreement was 84 percent across 15 records. Cross-vendor models were used rather than three instances of one provider so that agreement reflects the method rather than a single model lineage. This measures consistency, not correctness.

**Consistency of application, human level.** Independent raters applied the five conditions to a shared record set. Chance-corrected agreement (Gwet's AC1) was 0.74 among expert reviewers and 0.63 among trained reviewers, both clearing a floor of 0.61 set before analysis. Raw agreement was 88 percent and 83 percent respectively. These figures are interim, resting on 10 records against a planned pooled set of approximately 26.

**Detection accuracy.** This is the program's principal result. A balanced corpus of 24 constructed, de-identified records (12 with reconstructable conclusions, 12 without) was judged by an international panel of experienced professionals against an answer key that was fixed in advance and independently reproduced by blind raters who did not see the study hypotheses. Fifteen reviewers across 10 countries on 5 continents completed the full corpus, producing 360 graded reads. Panel accuracy was **82.8 percent** (95 percent confidence interval 71.0 to 94.6, computed at the reviewer level), with sensitivity of 86.1 percent for unsupported records and specificity of 79.4 percent for grounded ones. The pre-registered threshold required a point estimate of at least 70 percent with a lower confidence bound above chance. Both criteria are met.

Sensitivity exceeding specificity is the preferable direction of error for a governance control: the failure mode is a well-founded record returned for additional anchoring rather than an unsupported record allowed to stand.

**What has not been established.** A randomized comparison tested whether the structured control improves detection relative to unaided professional judgment. Participants drawn from one pool were randomly assigned to review the same records either with the five conditions or with a single general question about adequacy. The structured condition scored 73.3 percent against 62.0 percent unaided. The confidence interval of that difference includes zero, and under the pre-registered decision rule the analysis is reported as a null. It was underpowered: at the sample reached, the smallest detectable difference was roughly 42 percentage points, and a conclusive test of an effect this size would require approximately 110 participants per condition. The honest reading is that the comparison could not settle the question in either direction.

Criterion validity against real documented outcomes is in progress in two domain pilots and is not reported as an established result.

**In summary, what the evidence currently supports:** DRR is detectable by experienced reviewers at a rate well above chance, and the review is applied consistently by independent machines and independent human experts. It does not yet support a claim that the control improves outcomes, reduces litigation exposure, or outperforms unaided judgment.

## 6. Implementation

The control is designed to sit inside existing review workflows rather than beside them.

**Placement.** Apply it at the point immediately before a record is finalized. A quality check performed after the record is locked can identify problems but cannot change the document, which converts oversight into archaeology. The finding is actionable only while the drafter can still act on it.

**Routing.** Use proportionality to decide what receives review. Route by record type rather than by volume: consequential decisions affecting employment, tenancy, benefits, eligibility, discipline, or adverse findings receive full review; routine actions receive sampling. A practical starting configuration is full review for adverse-outcome record types and a 5 to 10 percent sample of the remainder.

**Disposition.** A Ready determination finalizes. A Needs work determination returns to the drafter with the specific condition that failed identified, which is what makes the feedback actionable rather than discouraging. A Gap determination returns to the drafter and, for high-stakes record types, triggers secondary review before resubmission.

**Preserve the drafting layer.** Retain the identity of the human author, the tool used if any, the review step with reviewer name and date, and the substantive changes made. Discovery requests increasingly reach this layer directly, and its absence is read as the absence of deliberation rather than as a neutral gap.

**Watch aggregate language patterns.** Subjective descriptors reproduce at scale when drafting is automated. A phrase such as "not a good fit" is a stylistic quirk in one record and a pattern in forty. Because the exposure lives in the aggregate, it can pass every individual review and become visible only when records are examined together. Periodic sampling across authors and business units is the mechanism that surfaces it.

**Calibrate reviewers.** Reviewer performance in the validation study varied considerably, including reviewers who performed below chance. Organizations deploying the control should expect variation and should calibrate: have several reviewers score the same set of records, compare determinations, and discuss disagreements against the conditions rather than against intuition.

## 7. Limitations

The validation corpus is constructed rather than drawn from live records. This supports a clean detection test and does not establish real-world effectiveness. The reviewer panel is recruited rather than randomly sampled and self-selects for interest in the topic. Generalization beyond the sampled domains and jurisdictions is not claimed. The reliability figures are interim. The randomized comparison is a null from an underpowered design and should not be read as evidence in either direction. The control makes no proven-effectiveness claim and is presented as a validation-phase instrument.

## 8. Conclusion

The drafting tool will keep changing. The evidentiary test will not. A record that cannot be reconstructed from its own contents cannot be independently defended, whoever or whatever produced it.

The contribution offered here is narrow and, within its limits, established: the property is real, it is nameable, and experienced professionals can identify it in a record at a rate well above chance. That is the precondition for governing it. Whether a structured control outperforms unaided judgment is the next question, and this article states plainly that it remains open.

For practitioners, the immediate implication does not depend on that open question. Pull three consequential records at random from the past quarter. Give them to a colleague uninvolved in the matters. Ask whether the reasoning can be reconstructed from the record alone. The number that fail is a measurement an organization can take this week, and it is the same measurement that will be taken by someone else, later, under considerably less favourable conditions.

## References

Byrt, T., Bishop, J., Carlin, J.B. (1993). Bias, prevalence and kappa. *Journal of Clinical Epidemiology*, 46(5), 423-429.

Feinstein, A.R., Cicchetti, D.V. (1990). High agreement but low kappa: I. The problems of two paradoxes. *Journal of Clinical Epidemiology*, 43(6), 543-549.

Fleiss, J.L. (1971). Measuring nominal scale agreement among many raters. *Psychological Bulletin*, 76(5), 378-382.

Gwet, K.L. (2008). Computing inter-rater reliability and its variance in the presence of high agreement. *British Journal of Mathematical and Statistical Psychology*, 61(1), 29-48.

Landis, J.R., Koch, G.G. (1977). The measurement of observer agreement for categorical data. *Biometrics*, 33(1), 159-174.

## Acknowledgment

The reliability and validation methodology underlying the agreement statistics reported here was designed by Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India. The proportionality principle was surfaced by pilot reviewer Saurabh Nanda. Each is credited with permission. I thank the international reviewer panel for their independent judgment.

---

## Submission notes (not part of the manuscript)

**Word count:** approximately 2,700, within range for all four target venues.

**Why this places where the other articles have not:** it has no co-author dependency. Three approaches to prospective co-authors have now stalled or gone unanswered. This article requires nobody's sign-off, which removes the single point of failure that has held the other pieces.

**Overlap management.** This piece and the detection paper share the construct and the validation figures. That is acceptable because the audiences and contributions differ: the detection paper is an empirical report for an academic AI ethics readership, this is a control-design article for an audit and governance practitioner readership. To keep the distinction clean, cite the detection paper as forthcoming once it is under review, and do not reproduce its methods section verbatim. Disclose the related submission in the cover letter, which editors expect and which costs nothing.

**Before submitting:**
- Confirm Ubayet's acknowledgment wording and Nanda's, both of which are already agreed in principle.
- Re-verify the panel figures against the database on the submission date.
- Check the target venue's current author guidelines for reference style and length.
- Keep the null reported as a null. It is the credibility anchor of the piece for this readership, and audit practitioners are precisely the audience most likely to notice if it were softened.

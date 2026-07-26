# Detecting Decision Reconstruction Risk in AI-Assisted Documentation: A Record-Level Review Standard and Its Pre-Registered Validation

**Authors:** Phillip Wikes (Creator of the Justification Review Standard; former Lead Civil Rights Officer, Maryland Commission on Civil Rights), Gabriela Cortez (civil rights records and bilingual intake, Maryland Commission on Civil Rights), and Ubayet Hossain, FRM (Associate Director, Model Validation, KPMG India).

**Author contributions:** P.W. conceived Decision Reconstruction Risk and the JRS review method, constructed the validation corpus and the verified answer key, assembled the international reviewer panel, and led the writing. G.C. shaped the paper's normative framing, that a record must remain understandable to the people a decision affects, and the rationale for an internationally and linguistically diverse reviewer panel, and contributes the conceptual analysis and writing for that framing (Section 2.1 and the Introduction). As a member of the reviewer panel, her reads form part of the analyzed data; her authorship rests on her conceptual and writing contribution, not on her own reviews. U.H. designed the reliability and validation framework: the reference-panel design, the chance-corrected agreement statistics, and the pre-registered decision floors and analysis plan.

**Target journal:** *AI and Ethics* (Springer). Fit: the journal's scope is the ethics and governance of AI in practice, and it publishes both original research and reflective perspective articles, which suits a paper that motivates a governance construct from field experience and then validates it empirically. Alternatives if needed: *AI & Society* (Springer); *Journal of Responsible Technology* (Elsevier, open access); or a FAccT / AIES workshop for speed.

**Status:** Working draft, validation phase. The design, materials, and pre-registered analysis plan are complete. Results are gated: the detection panel is partially collected (7 of 24 registered reviewers have completed the full set) and the randomized comparison (Arm B) has enrolled its first participants but has not been run to analysis. No inferential result is stated until the pre-registered sample and thresholds are met. All figures cited are verified against the study database, not memory.

**Format note (for the author):** the opening is written in a first-person reflective voice, which reads naturally as a *Perspective* piece. For a strict empirical *Original Research* submission, the personal opening can be shortened to a short framing paragraph and the anecdote moved to an author's note. Both versions can share the same Methods and Results.

---

## Abstract

**Background.** Generative AI increasingly drafts high-stakes corporate, administrative, and investigative records. Fluent text can read as complete and well supported while the evidentiary basis for its conclusions is absent from the record itself. A record whose conclusion cannot be reconstructed from the record alone cannot be independently examined or defended. We name this property Decision Reconstruction Risk (DRR).

**Objective.** This paper defines DRR as a governance-relevant property of records, introduces the Justification Review Standard (JRS) as a record-level review method for detecting it, and describes a pre-registered program to test two questions: (1) is DRR a detectable property of AI-assisted records, and (2) does the JRS method improve its detection relative to unaided expert judgment?

**Methods.** A balanced corpus of 24 constructed, de-identified AI-generated records (12 grounded, 12 unsupported) is judged by an international panel of experienced reviewers against a verified answer key that was documented in advance and independently reproduced. A randomized comparison (Arm B) assigns fresh, JRS-naive participants to judge the same records either with the five JRS conditions or with a general prompt only, so that any accuracy difference is attributable to the standard rather than to expertise. Analysis follows a pre-registered plan with decision floors and chance-corrected agreement statistics.

**Results.** To be completed. Reporting is gated on the pre-registered sample and thresholds; current data are directional only and are not interpreted here.

**Contribution.** DRR names a documentation-governance problem that model-centric AI governance does not capture, and JRS offers a measurable, workflow-independent control for it. The validation design is offered as a template for evaluating documentation-quality controls in AI-assisted environments.

**Keywords:** AI governance; documentation risk; accountability; decision defensibility; record-level review; responsible AI.

---

## 1. Introduction

When I began training my mentee, Gabi, my assignment was to teach her the technical nuances of drafting discrimination complaints. Instead, she ended up teaching me about the future of accountability.

Gabi operated under a core professional philosophy: that all human beings should "stand on business." To stand on business, in vernacular terms, is to take absolute responsibility for one's words, decisions, and actions, and to follow through with unwavering conviction, accountability, and consistency. But Gabi did not apply this standard only to people. She demanded that documentation do the same. In her view, a record could not truly stand on business if it was not fundamentally understandable to the people it affected.

For Gabi this was not an abstract ideal, it was a daily practice. She often took it upon herself to translate intake records into Spanish for Spanish-speaking individuals, ensuring that language barriers never compromised a person's access to clear, honest information.

Gabi also advocated fiercely for open communication and inclusivity, emphasizing that collaboration across diverse cultures and backgrounds is precisely what makes a decision, a policy, or a principle resilient enough to survive the challenges of civil rights work. It was her philosophy, this conviction that diversity breeds resilience, that ultimately inspired me to stress-test my own work through an international pilot panel of professionals spanning multiple countries, languages, and domains.

Today, as generative AI increasingly automates the drafting of high-stakes corporate and investigative records, we face an unprecedented crisis of accessibility and accountability. The same fluency that makes AI-assisted drafting attractive also makes its output difficult to interrogate. A model can produce a record that reads as thorough, professional, and complete, while the evidence that would justify its conclusions never appears on the page. When the author who held that evidence in memory is no longer available, and the record must be examined on its own, the record may simply fail to explain itself.

We call this property Decision Reconstruction Risk (DRR): the condition in which a record cannot, on its own terms, allow an independent reviewer to reconstruct the basis for a consequential decision. DRR is not a claim that a decision was wrong. It is a claim that the decision cannot be shown to be right from the record. In a civil rights intake, an employment determination, a compliance finding, or a public-records decision, that gap is the difference between a record that can be defended and one that cannot.

The stakes of this gap fall on two parties at once. For the person the record describes, an unreconstructable record removes the practical ability to understand a decision that touches their rights, livelihood, or dignity, and to contest it on fair terms; accountability to affected people begins with a record that can explain why. For the organization that produced it, the same gap is a latent liability: a record that cannot be reconstructed cannot be defended when it is later tested by a complaint, an audit, an investigation, a regulator, or a court. DRR is unusual among governance problems in that the individual's right to an explanation and the institution's ability to defend its own decisions are threatened by one and the same defect. A control that closes the gap therefore serves both, and we motivate this work accordingly: for the people affected by records and for the organizations accountable for them.

Most of the AI governance conversation addresses model risk: bias, robustness, security, and the behavior of the system itself. This paper addresses a complementary and under-examined problem: documentation risk, which arises after the model has assisted with drafting and lives in the record it helped produce. Documentation risk is workflow-independent. It does not matter whether the record was produced by a person, by a person assisted by AI, or by an automated pipeline. What matters is whether the resulting record can be independently reconstructed and defended.

This paper makes three contributions. First, it defines DRR as a governance-relevant, measurable property of records rather than an abstract concern. Second, it introduces the Justification Review Standard (JRS), a record-level review method that asks a single question of any record: can a later, independent reviewer reconstruct how the conclusion was reached from the record alone? Third, it describes a pre-registered validation program designed to test whether DRR is detectable and whether JRS improves its detection relative to unaided expert judgment, including a randomized comparison that isolates the value of the standard itself. Consistent with the validation-phase status of this work, we state the design and the pre-registered analysis plan in full and we do not report inferential results until the pre-registered sample and thresholds are met.

## 2. Background: documentation risk and the reconstruction gap

Accountability regimes in employment, housing, civil rights, public records, healthcare compliance, and financial supervision share a common assumption: that a consequential decision leaves behind a record from which its basis can be reconstructed. Appeals, audits, and litigation all depend on this. When a determination is challenged, the reviewer does not re-interview the decision-maker's memory. The reviewer reads the record.

Generative AI stresses this assumption in a specific way. Language models are trained to produce fluent, plausible, well-formed text. Fluency and evidentiary grounding are different properties, and a model optimizes the first without guaranteeing the second. The result is a class of records that are convincing on their surface and hollow underneath: the conclusion is stated confidently, the prose is professional, and the reasoning appears present, yet the specific facts, sources, dates, and inferential steps that would let a reader verify the conclusion are missing. Such a record reads as if it stands on business. It does not.

Existing AI governance instruments (for example, model risk frameworks, impact assessments, and technology inventories) largely measure the system and the process. They do not measure whether the resulting record is independently reviewable. That is the measurement gap this work addresses. DRR is proposed as an outcome-quality property of the record that can be assessed regardless of the tool used to produce it, and that sits alongside, not in place of, model-centric controls.

### 2.1 The record and the person it describes

Reconstructability is usually argued for in institutional terms: a defensible file, an auditable trail, a record that survives litigation. It has an equally important second face. A record is also the only account the affected person may ever receive of a decision that shaped their employment, housing, benefits, or access to justice, and a record that cannot be reconstructed cannot be understood or fairly questioned by the person it most concerns. Accessibility is part of this property, not separate from it: a record written in language the affected person cannot read, or reasoned in steps they cannot follow, fails the same reconstruction test that a court or regulator would later apply. Documentation quality is therefore not only a matter of organizational risk but of whether people can understand the decisions made about them, which is why this study recruited an internationally and linguistically diverse reviewer panel rather than a single-jurisdiction one.

*This section is developed by co-author Gabriela Cortez, whose work on civil rights records and bilingual intake anchors the analysis; the paragraph above is the shared framing on which her fuller treatment builds.*

## 3. The Justification Review Standard (JRS)

JRS is a record-level, pre-finalization review method. It evaluates a single record against five conditions and yields a three-level read.

**The five conditions.** (1) Record self-sufficiency (reconstructability): the record allows an independent reviewer to reconstruct how the conclusion was reached from the record alone. (2) Evidentiary anchoring (basis identification): the record identifies the basis for its conclusions. (3) Chronological integrity: dates, sequence, and sources hold together when read cold. (4) Decision-process traceability: the reasoning from evidence to conclusion can be followed, and the responsible parties are identifiable. (5) Evidentiary sufficiency: the record contains enough to support the weight of the decision.

**The three reads.** A reviewer assigns each record one of three determinations: Ready (a later reviewer could reconstruct the conclusion from the record alone), Needs work (partly reconstructable, some basis visible with gaps), or Gap (the basis for the conclusion is not visible in the record). A separate would-rely judgment (Yes or No) records whether the reviewer would rely on the record in a high-stakes, accountable decision.

JRS is deliberately independent of any vendor, model, or drafting workflow. It is a governance layer that sits above the technology stack and evaluates the output the stack produces.

## 4. Methods

The validation program is organized as an evidence ladder. This paper centers on the detection rung (does JRS detect DRR) and the randomized comparison (does JRS add value), and it references the reproducibility and reliability rungs as supporting evidence.

### 4.1 Design overview

- Reproducibility (supporting): three independent AI systems apply the JRS reads to the same records, to test whether the standard is applied consistently at machine level.
- Reliability (supporting): independent human reviewers apply the reads to a shared record set, to test inter-rater agreement.
- Detection accuracy (primary): reviewers judge a balanced, constructed corpus against a verified answer key.
- Randomized comparison, Arm B (primary): fresh, JRS-naive participants are randomly assigned to judge the same records with JRS or without it, isolating the contribution of the standard.

### 4.2 Materials: the constructed corpus and the verified key

The corpus is 24 constructed, de-identified, AI-generated records drawn from high-stakes documentation contexts (for example, HR and employment, investigations, compliance and audit, public records, and AI-assisted summaries). The set is balanced: 12 records are grounded (their conclusions are supported by content present in the record) and 12 are unsupported (their conclusions read as complete but lack a reconstructable basis). Records are presented unlabeled and in randomized order.

The answer key was fixed in advance. The author-side intended classification of each record was documented before verification, and the key was then independently reproduced by blind raters who did not see the study's hypotheses. This procedure is designed to remove the circularity objection that the key was fit to the standard. The key and its verification packet are retained and are available to reviewers under the study's data-availability terms; the key itself is kept off the public site to protect the blind study.

### 4.3 Participants

The detection panel is an international group of experienced professionals in relevant domains (AI governance, compliance, audit, human resources, investigations, data privacy, records, and law). As of this draft, 24 reviewers are registered and 7 have completed the full 24-record set, with additional reviewers in progress; the panel spans more than ten countries and multiple professional domains and first languages. Reviewers participate in a personal capacity, without compensation, and are recognized as named contributors with their consent. Participation is voluntary and may be withdrawn before publication.

The randomized comparison (Arm B) recruits a separate batch of JRS-naive participants, that is, professionals who have not been exposed to the JRS method or its materials, so that the no-standard condition reflects genuinely unaided judgment.

### 4.4 The randomized comparison (Arm B)

Arm B isolates the value of the standard. Fresh participants are randomly assigned, before they judge any record, to one of two conditions, with the assignment fixed for that participant and recorded with a timestamp:

- B1 (JRS condition): for each record the participant gives a JRS read (Ready, Needs work, or Gap) after being shown the five conditions, plus a would-rely judgment.
- B2 (baseline condition): for each record the participant answers a single general question, whether the record is adequately supported to rely on in a high-stakes, accountable decision (Yes or No), with no exposure to the JRS conditions.

Both conditions judge identical records. Because assignment is random and the two conditions differ only in whether the JRS method is provided, a difference in detection accuracy between B1 and B2 is attributable to the standard rather than to reviewer expertise. Assignment is implemented by a deterministic, auditable function of the participant code, and codes are issued in sequence so that participants are not steered into conditions.

### 4.5 Pre-registered analysis plan

Analysis follows a plan registered before results are examined. In summary: reliability is qualified by a pre-set chance-corrected agreement floor; detection accuracy is evaluated against chance and a pre-set accuracy floor, reported with sensitivity (detection of unsupported records) and specificity (correct pass of grounded records); and the Arm B comparison is evaluated against a pre-set superiority threshold for the JRS condition over the baseline. Agreement is reported with chance-corrected statistics (Gwet's AC1 as primary, with companion coefficients) to handle high-agreement paradoxes. Failing a floor is reported as a null result, not omitted. The full plan, including exact thresholds, is held in the study's pre-registration.

### 4.6 Ethics, consent, and confidentiality

All records are constructed and de-identified; none is internal, confidential, or tied to a real individual or organization. Participation is voluntary, uncompensated, and in a personal capacity. Reviewer responses are stored on an append-only basis and used only in aggregate. Attribution is opt-in: contributors are named only with consent, may participate anonymously, and may withdraw their name or contribution before any publication. The study makes no proven-effectiveness claim and is labeled as a validation-phase study throughout.

## 5. Results (gated; to be completed)

Results are not reported in this draft. Reporting is conditional on reaching the pre-registered sample with the required spread and on the pre-registered thresholds. The current state is descriptive and directional only: the detection panel is partially collected (7 of 24 registered reviewers complete), and the randomized comparison has enrolled its first participants but has not been run to analysis. No sensitivity, specificity, agreement, or between-condition figure is stated here, because stating one before the pre-registered conditions are met would violate the study's own analysis plan. When complete, this section will report: the cross-tabulation of JRS read against the verified key; sensitivity and specificity with intervals; inter-rater agreement; and the B1-versus-B2 comparison against the pre-registered superiority threshold.

## 6. Discussion (conditional)

The discussion is framed conditionally, pending results. If DRR proves detectable and JRS improves detection over unaided judgment, the governance implication is concrete: documentation quality becomes a measurable, workflow-independent control that organizations can apply before a record is finalized, complementary to model-centric AI governance. If JRS does not improve detection, that too is an informative result, because it would indicate that experienced reviewers already detect DRR without the method, and it would redirect effort toward training or tooling rather than a review standard. Either outcome advances the underlying goal, which is to make AI-assisted records that can stand on business: records that a later, independent reviewer can reconstruct and defend. The implication runs in two directions at once. For organizations, a validated control offers a way to test and strengthen a record before it is finalized, so that consequential decisions remain defensible under audit, regulatory review, and litigation. For the people those records describe, the same control supports a more basic interest: a record that can explain why a decision was made, and therefore a fairer opportunity to understand and question it. A documentation control that advances both accountability to affected persons and defensibility for institutions is not a trade-off between the two; it is the same property viewed from either side.

## 7. Limitations

The corpus is constructed rather than drawn from live records, which supports a clean detection test but does not establish real-world effectiveness; criterion validity against documented real-case outcomes is a separate line of work. The panel is recruited, not sampled, and self-selects for interest in the topic. Generalization beyond the sampled domains and jurisdictions is not claimed. JRS remains in a validation phase and makes no proven-effectiveness claim.

## 8. Conclusion

The drafting tool and the technology stack will keep changing. The evidentiary test does not. A record that cannot be reconstructed from its own contents cannot be independently defended, whoever or whatever produced it. Decision Reconstruction Risk names that gap, and the Justification Review Standard offers a measurable way to detect it before a record is finalized. This paper sets out the construct, the method, and a pre-registered design to test both detectability and the added value of the standard, so that the resulting claims, when made, are earned rather than asserted.

## Acknowledgments

I thank the international reviewer panel for their care and independent judgment. Reviewers are recognized as named contributors with their consent; they are not co-authors of this paper. Gabriela Cortez, whose insistence that a record must be understandable to the people it affects shaped this work and inspired its international panel, is a co-author (see author contributions), and her reviewer participation is recognized on the same terms as the rest of the panel.

## Data availability and pre-registration

The study protocol and analysis plan are pre-registered. Constructed records, the verified answer key and its verification packet, and aggregate results are available to reviewers under the study's data-availability terms. The answer key is held off the public site to protect the blind study. Live participation is tracked on an aggregate dashboard that shows counts only, never individual answers.

## Progress log (per standing directive, all progress on this article is recorded here)

- 2026-07-25 - Gabriela Cortez (V-AI-08, "Gabi") opened as EARNED co-author (per Phillip). Byline adds her (Phillip lead, then alphabetical Cortez/Hossain); author-contributions statement credits her with the normative framing (record understandable to the affected person; diverse/multilingual panel rationale) and DISCLOSES her dual role (data-contributing reviewer AND author on the conceptual/writing contribution, not on her own reads); new Section 2.1 "The record and the person it describes" is her lane to develop (shared framing paragraph provided, Bar/Section-V pattern); Acknowledgments updated so she is not double-counted. INTEGRITY CONDITION (earned, not courtesy): authorship becomes final on her written contribution to Section 2.1/Introduction and her review + approval of the manuscript; confirm her preferred name/affiliation line and align the Introduction's "my mentee, Gabi" narrative voice with her once she accepts. Invitation: `research/Cortez_CoAuthor_Invite.md`.
- 2026-07-25 - Ubayet Hossain elevated from "methodology advisor" to CO-AUTHOR (per Phillip), consistent with the standing policy that he is co-author on each paper that uses his methodology; his framework (reference-panel design, chance-corrected statistics, pre-registered floors) is the validation core of this paper. Byline + author-contributions statement updated; acknowledgment of him as a thanked contributor removed. INTEGRITY CONDITION (earned authorship): send him THIS manuscript for review and sign-off before submission; his approval of this specific paper is what makes the co-authorship earned rather than courtesy.
- 2026-07-25 - Integrated the two outreach-campaign framings as academic significance (NOT marketing): added a dual-stakes paragraph to the Introduction (accountability to the person / defensibility for the institution, one and the same defect) and extended the Discussion to state the two-directional implication. This aligns the paper's significance with the two sister campaigns (The Right to Know Why; The Decisions You Can Defend) in substance. Results remain gated; Arm B blind protected; no effectiveness claim; fixed banned "frequently" -> "often"; no long dashes.
- 2026-07-13 - Draft created from the pre-registered detection protocol (`DRR_Detection_Validation_Protocol.md`), the Arm B design spec (`ArmB_Design.md`), and the pre-registered analysis plan (`JRS_PreRegistered_Analysis_Plan.md`). Introduction incorporates the author's mentorship narrative (Gabi). Target journal: AI and Ethics. Results gated until the detection panel completes and Arm B is run. Author number for the panel stated as the verified current count (24 registered, 7 complete); the earlier "22" in the author's narrative was updated to keep the manuscript internally consistent with Methods.

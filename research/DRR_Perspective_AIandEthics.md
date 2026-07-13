# When the Record Cannot Stand on Business: Decision Reconstruction Risk as a Documentation-Governance Gap in AI-Assisted Records

**Author:** Phillip Wikes, Creator of the Justification Review Standard (JRS); former Lead Civil Rights Officer, Maryland Commission on Civil Rights.

**Target journal:** *AI and Ethics* (Springer), submitted as a Perspective / Opinion article. This article type introduces a concept and an argument and does not require empirical results, which makes it submittable now while the companion validation study is in progress. Alternatives: *AI & Society*; *Journal of Responsible Technology*.

**Status:** Complete and submittable as a Perspective. It introduces the construct, the proposed control, and a pre-registered validation agenda. It states no empirical result and makes no proven-effectiveness claim. A companion Original Research paper will report the validation results when the pre-registered sample is complete.

---

## Abstract

As generative AI takes over more of the drafting of consequential corporate, administrative, and investigative records, a governance gap is opening that model-centric oversight does not close. Fluent output can read as complete and well supported while the evidence that would justify its conclusions never appears in the record. A record whose conclusion cannot be reconstructed from the record alone cannot be independently examined or defended, whoever or whatever produced it. This article names that property Decision Reconstruction Risk (DRR), argues that it is a distinct and measurable documentation-governance problem rather than a subspecies of model risk, and proposes the Justification Review Standard (JRS) as a workflow-independent control that can be applied before a record is finalized. It sets out a pre-registered agenda to validate whether DRR is detectable and whether a structured standard improves its detection over unaided expert judgment. The argument is grounded in accountability practice from civil rights work, where the test of a record has never been how it reads, but whether a later, independent reviewer can reconstruct and defend the decision from the record itself.

**Keywords:** AI governance; documentation risk; accountability; decision defensibility; responsible AI; record-level review.

---

## 1. Introduction

When I began training my mentee, Gabi, my assignment was to teach her the technical nuances of drafting discrimination complaints. Instead, she ended up teaching me about the future of accountability.

Gabi operated under a core professional philosophy: that all human beings should "stand on business." To stand on business, in vernacular terms, is to take absolute responsibility for one's words, decisions, and actions, and to follow through with unwavering conviction, accountability, and consistency. But Gabi did not apply this standard only to people. She demanded that documentation do the same. In her view, a record could not truly stand on business if it was not fundamentally understandable to the people it affected.

For Gabi this was not an abstract ideal, it was a daily practice. She frequently took it upon herself to translate intake records into Spanish for Spanish-speaking individuals, ensuring that language barriers never compromised a person's access to clear, honest information.

Gabi also advocated fiercely for open communication and inclusivity, emphasizing that collaboration across diverse cultures and backgrounds is precisely what makes a decision, a policy, or a principle resilient enough to survive the challenges of civil rights work. It was her philosophy, this conviction that diversity breeds resilience, that ultimately inspired me to stress-test my own work through an international pilot panel of professionals spanning multiple countries, languages, and domains.

Today, as generative AI increasingly automates the drafting of high-stakes corporate and investigative records, we face an unprecedented crisis of accessibility and accountability. The same fluency that makes AI-assisted drafting attractive also makes its output difficult to interrogate. A model can produce a record that reads as thorough, professional, and complete, while the evidence that would justify its conclusions never appears on the page. When the author who held that evidence in memory is no longer available, and the record must be examined on its own, the record may simply fail to explain itself. The record does not stand on business.

This article makes an argument in three moves. First, that this failure has a specific, nameable shape, which I call Decision Reconstruction Risk. Second, that it is a documentation-governance problem distinct from model risk, and that current AI governance instruments largely do not measure it. Third, that it is tractable: a structured, workflow-independent review standard can be applied to a record before it is finalized, and its value can be tested rather than asserted. I close with the pre-registered agenda by which that test is being carried out.

## 2. Decision Reconstruction Risk

Accountability regimes in employment, housing, civil rights, public records, healthcare compliance, and financial supervision share one assumption: that a consequential decision leaves behind a record from which its basis can be reconstructed. Appeals, audits, and litigation all rely on it. When a determination is challenged, the reviewer does not re-interview the decision-maker's memory. The reviewer reads the record.

I define Decision Reconstruction Risk (DRR) as the condition in which a record cannot, on its own terms, allow an independent reviewer to reconstruct the basis for a consequential decision. DRR is not a claim that a decision was wrong. It is a claim that the decision cannot be shown to be right from the record. That distinction is the whole point. A defensible record and an indefensible one can describe the same correct decision; they differ in whether the basis is present on the page.

Generative AI does not create this risk, but it multiplies it. Language models are trained to produce fluent, plausible, well-formed text, and fluency is not the same property as evidentiary grounding. A model optimizes the first without guaranteeing the second. The predictable result is a class of records that are convincing on the surface and hollow underneath: the conclusion is stated with confidence, the prose is professional, and the reasoning appears to be present, while the specific facts, sources, dates, and inferential steps that would let a reader verify the conclusion are absent. Such a record passes a casual read and fails an accountable one.

## 3. Why model-centric governance does not close the gap

Most AI governance instruments address the system and the process: bias, robustness, security, model documentation, impact assessment, and inventories of the tools an organization uses. These are necessary. They are also, for this problem, insufficient, because they measure the machine and the workflow rather than the artifact the workflow leaves behind. An organization can deploy a well-governed model through a well-documented process and still produce a record that cannot be reconstructed. DRR is a property of the output, not of the pipeline.

This is why the control has to sit at the level of the record and has to be workflow-independent. It should not matter whether a record was written by a person, by a person assisted by AI, or by an automated pipeline. The governance question is the same: can a later, independent reviewer reconstruct and defend the decision from the record alone? Documentation reviewability deserves to be treated as a first-class governance control, complementary to model-centric ones, not folded into them.

## 4. A control: the Justification Review Standard

The Justification Review Standard (JRS) is a record-level, pre-finalization review method built around a single question: can a later, independent reviewer reconstruct how the conclusion was reached from the record alone? It evaluates a record against five conditions, (1) record self-sufficiency, (2) evidentiary anchoring, (3) chronological integrity, (4) decision-process traceability, and (5) evidentiary sufficiency, and yields a three-level read: Ready, Needs work, or Gap. A separate judgment records whether a reviewer would rely on the record in a high-stakes, accountable decision.

JRS is deliberately independent of any vendor, model, or drafting workflow. It is a governance layer that sits above the technology stack and evaluates what the stack produces. Its promise is modest and testable: not that it prevents bad decisions, but that it detects, before a record is finalized, when a record cannot be reconstructed and therefore cannot be defended.

## 5. A pre-registered validation agenda

A control that asks to be trusted should be willing to be tested, and to fail. The claim that JRS detects DRR, and that it improves detection over unaided judgment, is being evaluated under a pre-registered plan rather than asserted. The agenda has four parts.

- Reproducibility: whether independent AI systems apply the standard consistently to the same records.
- Reliability: whether independent human reviewers agree with one another when they apply it.
- Detection accuracy: whether reviewers, judging a balanced corpus of constructed records against an answer key that was fixed in advance and independently reproduced, correctly separate records whose conclusions are grounded from records that only appear grounded.
- Added value: a randomized comparison in which fresh, standard-naive participants judge the same records either with the standard or with a general prompt only. Because assignment is random and the conditions differ only in whether the standard is provided, a difference in accuracy is attributable to the standard rather than to expertise.

Thresholds are set in advance, agreement is reported with chance-corrected statistics, and a failed threshold is reported as a null result rather than omitted. The design is stress-tested by an international panel of experienced reviewers spanning multiple countries, languages, and professional domains, a diversity chosen deliberately, in Gabi's spirit, because a standard that must survive real accountability should be examined by people who see records differently. The companion Original Research paper will report these results when the pre-registered sample is complete.

## 6. Implications and a call

If documentation reviewability were treated as a measurable control, several things would follow. Organizations could screen high-stakes records for reconstructability before finalizing them, rather than discovering the gap on appeal. Regulators and auditors would have an output-quality metric that is independent of the vendor or model in use. And the accountability burden would return to where it belongs: not on the question of whether an AI or a human clicked approve, but on whether the record can explain and defend itself to the person it affects.

That last point is Gabi's, and it is the one worth keeping. The measure of a record is not how confidently it reads. It is whether a later, independent reader, including the person the decision was made about, can reconstruct the basis and see that it holds. In an era when AI writes more of the record, making records that can stand on business is not a matter of style. It is a matter of accountability, and it is testable. We should test it.

## Acknowledgments

I am grateful to Gabi, whose insistence that a record must be understandable to the people it affects shaped this work and inspired its international panel, and to that panel for their care and independent judgment. The reliability and validation framework for the companion study was designed by Ubayet Hossain.

## Disclosure

JRS is a standard created by the author and is in a validation phase; this article makes no proven-effectiveness claim. The author has no other competing interests to declare.

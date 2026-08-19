# The Evidentiary Deficit in AI-Assisted Record-Keeping

*Why AI-assisted records that cannot explain themselves have become a transatlantic governance problem, and what accountable documentation now requires.*

**By Hekim Colpan and Phillip Wikes**

*Both authors contributed equally to this article. Names appear in alphabetical order.*

*Hekim Colpan contributes to this article in a personal professional capacity. The views expressed are his own and do not represent the position of any employer or institution.*

---

## I. Introduction

A record is a kind of promise. It tells whoever reads it later, whether a regulator, a court, or the person whose life it describes, that a decision was made for reasons someone can go back and examine. When an AI tool drafts the record, that promise is easy to break quietly. The text reads as finished. The reasoning behind it may already be gone.

We call that gap Decision Reconstruction Risk, or DRR: the state a record is in when it can no longer show, on its own, why a consequential decision was made. Once the reasoning cannot be rebuilt from the file, accountability moves somewhere else, onto memory, onto opinion, onto whoever is trusted in the room. That is the opposite of what governance is supposed to produce.

We come at this from two directions and reach the same place. One of us works inside European AI governance and compliance, on how organizations document and defend AI-assisted processing under ISO/IEC 42001, the EU AI Act, and the GDPR. The other spent more than a decade at a United States civil rights agency reading consequential records after the fact, and kept finding a decision that was probably sound sitting on a record that could not prove it.

The exposure is transatlantic, which is why we write from both sides of it. In Europe, the GDPR's accountability principle and the EU AI Act's record-keeping expectations ask an organization to show how a decision was reached rather than assert it. In the United States the same demand arrives through discovery and through the burden-shifting tests that decide employment and housing cases. The legal vocabulary differs. What is being asked for does not. The record has to answer for itself, and the time to make it capable of that is before it is finalized.

## II. Documentation as Legal Evidence

In employment, housing, and administrative cases, the written record is usually the first thing a dispute is tested against. Performance evaluations, tenancy files, and investigative notes get read under statutes such as Title VII, the Age Discrimination in Employment Act, the Americans with Disabilities Act, and the Fair Housing Act.

McDonnell Douglas Corp. v. Green shows what is at stake. Under its burden-shifting analysis, whether a stated reason reads as legitimate or as pretext often comes down to how well the rationale was documented at the time. Administrative law works similarly through its reasoned-decision standard, where the quality of the record often decides whether the underlying decision survives review.

A record that will hold up has to do more than announce a conclusion. It has to show the facts the conclusion rests on. When the documentation cannot back the reasoning it claims to reflect, the organization has lost the exact evidence it would need to defend the decision later.

There is a public side to this as well, not only an institutional one. A record that can be reconstructed lets the affected person understand how the decision about them was reached, and it gives reviewers, courts, and regulators something real to evaluate. A well-supported record tends to hold up across internal review, complaint investigations, regulatory examinations, and discovery. A thin one can fail all of them, even when the decision underneath it was correct.

## III. How AI-Assisted Records Fail in Practice

AI tools write fluent narrative, and in the process they often lose the thread back to the facts. A few failure modes keep recurring. Conclusions show up with confident framing on top of what was really only a handful of fragmentary inputs. The finished text can no longer be traced to the logs, notes, or messages that would ground it. And the drafting history, who reviewed it, and the prompts that produced it are usually not kept.

The problem gets worse when one tool writes both the narrative and the justification for it. The record turns self-referential, and it starts to look a lot like reasoning invented after the fact. Picture a manager who asks a model to draft a termination write-up, then asks the same model to supply the supporting facts. The file that comes out is perfectly consistent with itself and tied to nothing outside itself. In discovery, that reads as post hoc rationalization, especially when the drafting record shows the AI narrative was added after the decision had already been made.

The rule underneath all of this is simple. Every material claim in a record needs to trace back to evidence that existed at the time.

## IV. Pattern Risk and Proxy Language

AI reproduces language at scale, and that is its own kind of risk. When subjective descriptors like "cultural fit," "struggles with change," or "attitude" start recurring across people who share a protected characteristic, what looked like a stylistic tic in one file becomes something an inference of bias can be built on. Uniformity that used to take years of individual writing to accumulate can now appear across a single quarter of AI-assisted drafting. Because it only shows up in the aggregate, it can pass every file-by-file review and surface only when the records are read side by side. Courts have long accepted that patterns across records can support a finding of systemic discrimination, under both disparate treatment and disparate impact.

## V. Data Protection and the European Governance Frame

In Europe, the governance problem begins the moment AI-assisted drafting severs the evidentiary link between a consequential record and the information, human judgment, and controls that produced it. Under the GDPR, the accountability principle in Article 5(2) does not merely require controllers to comply with the data-protection principles; it requires them to be able to demonstrate that compliance when scrutinised. Article 30's record of processing activities is one part of that accountability framework, but a modest one: it does not require every prompt or draft to be retained, nor does it become a decision log simply because a model was involved upstream. What matters is more disciplined than either extreme: proportionate controls capable of showing how the processing was governed and, where the risk warrants it, assessed.

The timing of the EU AI Act makes that distinction more than academic. The Regulation now generally applies, while its core high-risk requirements on risk management, data governance, technical documentation, logging, and human oversight have been postponed by Regulation (EU) 2026/1744. Annex III high-risk systems are subject to those requirements from 2 December 2027; high-risk systems linked to regulated products under Annex I from 2 August 2028. Organisations are therefore deploying AI-assisted workflows today while some of the Act's strongest statutory traceability controls remain pending. The practical governance question is broader than formal AI Act compliance: has enough reliable evidence been preserved to reconstruct what the AI contributed, what a human verified, and why the final record was accepted?

ISO/IEC 42001 offers an operational bridge across that gap through structured AI governance, risk management, defined responsibilities, monitoring, and continual improvement. In financial services, DORA adds a documented ICT-risk and governance framework, including management accountability and technology-risk controls. The governance objective is not indiscriminate retention. It is more surgical: preserve the right evidence, under the right controls, for the right period, so that a consequential record can still account for itself when someone eventually asks it to.

## VI. Oversight and Review

A record worth trusting should answer three plain questions on its own face. Can someone understand it without the author standing next to them explaining it? Do its conclusions rest on evidence that a human, not a model, can verify? Could a neutral reviewer rebuild the reasoning without being told how it went? If the answer to any of these is no, the record is incomplete, however well it reads. These are DRR made concrete: a record that fails them carries the risk forward into every proceeding that later leans on it. Sampling records periodically across authors and business units is how drift gets caught before it hardens into a pattern.

## VII. Litigation and Regulatory Exposure

Opposing counsel tends to make two moves. The first is that the fluent AI narrative was written to dress up a decision that had already been made. The second is that the missing drafting history and reviewer notes prove there was never any real deliberation to begin with. Both arguments hit harder when the organization simply cannot produce the underlying material.

So expect discovery to reach for the drafting layer itself: prompt logs, draft versions, tool-usage records, reviewer activity. ESI obligations now routinely pull in exactly this kind of material. Regulators land somewhere adjacent. To them, uniform language across files can look like a process running on autopilot rather than individualized judgment, and a gap in records-of-processing detail reads as its own compliance failure.

The cost of all this runs past the courtroom. When an institution cannot explain its own decisions to the people they affect, it loses some of the accountability and public confidence it depends on to function.

## VIII. Practitioner's Checklist

1. Identify the human author and the AI tool(s) used in drafting.
2. Preserve the underlying source materials, including notes, logs, and communications.
3. Link conclusions to verifiable, non-AI-generated evidence.
4. Document the human review step, including reviewer identity, date, and substantive changes.
5. Prohibit the use of unapproved external AI tools for official records.
6. Align records with the applicable data processing inventories, including GDPR Article 30 where relevant.
7. Preserve draft history, prompts, and tool-usage records for discovery.
8. Audit periodically for repeated subjective language across authors and business units.
9. Confirm consistency between the record and prior documented performance history.

## IX. Conclusion

The risk lives wherever the trail back to the evidence has gone cold. An organization that treats every record as something a court, a regulator, or the person it describes may one day read closely will be in a far better position than one that does not.

Underneath it sits one idea that belongs to no single jurisdiction. When AI helps make a consequential decision, the person on the receiving end should be able to understand why, and the organization should be able to reconstruct and defend it from the record itself. We call that the Right to Know Why. It is not a new legal doctrine but a short name for something already running through discovery, evidentiary sufficiency, the GDPR's accountability principle, and the EU AI Act's record-keeping requirements. Put the question through American evidentiary law or European fundamental-rights law and it comes out the same: can the decision still explain itself?

What has changed is the tool doing the drafting. What has not changed is the standard the record still has to meet.

---

## About JRS

JRS is a structured review that runs inside the workflows HR, compliance, investigations, audit, and legal teams already use, to check whether an AI-assisted record will hold up when someone examines it independently. It targets one recurring failure: AI-generated content lands in a permanent record as finished documentation while the evidence that should sit under it is missing.

Five checks work through the answer. Can the conclusion be rebuilt from the record alone? Is its basis identifiable? Does the chronology hold together? Can a reviewer trace how the conclusion was reached? Is the evidence behind it sufficient?

JRS is in structured validation. Every figure below is provisional until data collection closes in mid-August 2026, and each will be updated at close or withdrawn if it cannot be supported. The design behind them: reviewers work through a balanced corpus of 24 constructed, de-identified AI-generated records, twelve with traceable support and twelve without. The answer key was fixed before any reviewer saw a record and independently reproduced by blind raters, 24 of 24. Reviewers are blind to the key and to one another. Accuracy is computed per reviewer rather than per read. Thresholds were registered before the data were examined.

**Detection.** A panel of 16 independent experts across 11 countries identified unreconstructable records with 83.9% accuracy over 384 graded reads (95% CI 72.7 to 95.1 at participant level; sensitivity 87.0%, specificity 80.7%). The registered threshold required at least 70% with the lower bound above chance. Both criteria are met. Across the wider programme, 32 independent experts in 16 countries have each completed a full 24-record set, unpaid and in a personal capacity.

**Reproducibility.** Three AI models, one each from three independent vendors, applied the standard to the same 15 records and reached mean pairwise agreement of 84%. Cross-vendor models were used rather than three instances of one provider, so agreement reflects the method rather than a single model lineage. This measures consistent application, not accuracy.

**Reliability.** Independent raters scoring a shared record set reached Gwet's AC1 of 0.739 among expert raters and 0.624 among trained reviewers, against a floor of 0.61 set in advance. AC1 was chosen over kappa in advance because the determination distribution was expected to be skewed. These figures are interim: 10 records and 99 labels against a target of about 26, with wide intervals, and they will be re-estimated at target.

Detection, reproducibility, and reliability are separate questions from real-world effectiveness, which is a later stage. A related article is due in CEP Magazine in November. JRS needs no specialized software and no procedural redesign.

## Acknowledgment

The reproducibility and validation methodology behind the figures cited above, including the reference-panel design, the choice of agreement coefficient, and the acceptance floors, was designed by Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India.

## About the Authors

**Hekim Colpan** is an AI Governance and Compliance Manager, Data Protection Manager, and ISO/IEC 42001 auditor based in Germany. His work focuses on the operational implementation of AI management systems, the EU AI Act, GDPR accountability, DORA, information security and governance controls for AI-assisted systems.

**Phillip Wikes** is an AI Governance and Cognitive Risk Advisor focused on documentation integrity, evidentiary traceability, and record-level controls in AI-assisted environments. He served as a Lead Civil Rights Officer at the Maryland Commission on Civil Rights, evaluating discrimination complaints and resolving matters through investigation, mediation, and structured fact-finding under federal HUD and EEOC frameworks. He developed the Justification Review Standard (JRS) and named the risk it addresses, Decision Reconstruction Risk (DRR), and holds an M.S. in Negotiation and Conflict Management.

JRS: https://jrsstandard.com

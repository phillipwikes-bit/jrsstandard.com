# The Evidentiary Deficit in AI-Assisted Record-Keeping

*Why AI-assisted records that cannot explain themselves have become a transatlantic governance problem, and what accountable documentation now requires.*

**By Hekim Colpan and Phillip Wikes**

*Both authors contributed equally to this article. Names appear in alphabetical order.*

Hekim Colpan is an AI Governance and Compliance Manager and an ISO/IEC 42001 auditor, working on EU AI Act, GDPR, and DORA compliance for AI-assisted systems. Phillip Wikes is an AI Governance and Cognitive Risk Advisor and a former Lead Civil Rights Officer at the Maryland Commission on Civil Rights.

---

## I. Introduction

A record is a kind of promise. It tells whoever reads it later, whether a regulator, a court, a colleague, or the person whose life it describes, that a decision was made for reasons someone can go back and examine. When an AI tool drafts the record, that promise is easy to break, and easy to break quietly. The text reads as finished. The reasoning behind it may already be gone.

Sooner or later, most consequential decisions get questioned. What you cannot know in advance is whether the record will still be able to explain the decision when that day comes.

We call that gap Decision Reconstruction Risk, or DRR: the state a record is in when it can no longer show, on its own, why a consequential decision was made. The problem is less about the technology than about what happens to accountability when the evidence thins out. Once the reasoning behind a decision can no longer be reconstructed from the record, accountability quietly moves somewhere else, onto memory, onto opinion, onto whoever is trusted in the room. That is the opposite of what good governance is supposed to produce.

We come at this from two different directions and reach the same place. One of us has spent his career inside European AI governance and compliance, looking at how organizations document and defend automated and AI-assisted processing against ISO/IEC 42001, the EU AI Act, and the GDPR. The other spent more than a decade at a United States civil rights agency, reading consequential records after the fact. The pattern he saw again and again was a decision that was probably sound sitting on top of a record that could not prove it. As AI writes more of the documents behind decisions like these, the material that would let anyone reconstruct them is disappearing.

The exposure is now transatlantic, which is why we write from both sides of it. In Europe, the GDPR's accountability principle and the EU AI Act's record-keeping expectations ask an organization to show how a decision was reached, not just assert it. In the United States, the same demand shows up in discovery and in the burden-shifting tests that decide employment and housing cases. The legal vocabulary differs. What is being asked for does not. The record has to answer for itself.

The practical takeaway runs through everything below. Treat AI-assisted documentation as something a regulator, an auditor, or a court may one day read closely, and the best time to make it survive that reading is before it is finalized.

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

## V. Data Protection and the European Frame

Public AI tools bring two risks that feed each other. First, there is the processing risk: dropping sensitive information into an outside interface may not meet the lawful-basis requirement under the GDPR, and it can cut against data minimization. Second, there is an integrity risk: when drafting happens outside approved systems, the organization often cannot later produce the metadata showing which tool was used, what was entered, and when. Both come back to the same problem. Without visibility into the tool, the input, and the output, the provenance of the record cannot be defended.

Inside the EU, that single gap runs into two regimes at once. The GDPR's accountability principle expects an organization to demonstrate how personal data was processed, and a record whose provenance cannot be shown is hard to square with that duty or with records-of-processing obligations. The EU AI Act, for its part, attaches record-keeping, logging, and technical-documentation expectations to high-risk uses, precisely so that AI-assisted processing can be audited after the fact. Those logs and that documentation are not incidental extras in the high-risk regime; they are the mechanism by which an organization proves, later, that the system did what it was supposed to. An organization that cannot reconstruct how an AI-assisted record was produced is exposed on both fronts at the same time.

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

The risk lives wherever the trail back to the evidence has gone cold. That is Decision Reconstruction Risk in one sentence. An organization that treats every record as something a court, a regulator, or the person it describes may one day read closely will be in a much better position than one that does not, and on both sides of the Atlantic records are increasingly being judged on whether the reasoning inside them can still be seen and rebuilt.

Underneath all of it sits one idea that does not belong to any single jurisdiction. When AI helps make a consequential decision, the person on the receiving end should be able to understand why, and the organization should be able to reconstruct and defend it from the record itself. We call that the Right to Know Why. It is not a new legal doctrine. It is a short name for something that already runs through discovery, evidentiary sufficiency, the GDPR's accountability principle, and the EU AI Act's record-keeping requirements.

Put the question through American evidentiary law or through European fundamental-rights law, and it comes out the same: can the decision still explain itself? When it cannot, accountability breaks, for the institution that has to defend the decision and for the person owed an explanation of it. Giving that test a plain name is what the Right to Know Why is for.

What has changed is the tool doing the drafting. What has not changed is the standard the record still has to meet.

---

## About JRS

JRS is a structured way to review documentation, meant to be run inside the workflows that HR, compliance, investigations, audit, and legal teams already use, to check whether an AI-assisted record will actually hold up when someone examines it independently. It targets a narrow, recurring failure: AI-generated content lands in a permanent record as finished documentation while the evidence that should sit under it is missing. That is Decision Reconstruction Risk, and JRS is built to catch it before the record is closed out.

One question sits at the center of it. When AI-assisted content goes into a workplace record, does that record stay traceable, evidence-backed, and reconstructable under structured review? Five checks work through the answer: whether the conclusion can be rebuilt from the record alone, whether its basis is identifiable, whether the chronology holds together, whether a reviewer can trace how the conclusion was reached, and whether the evidence behind it is sufficient.

JRS is in structured validation, and the figures below are provisional until data collection closes in mid-August 2026.

Fifty three international reviewers across three studies have graded records for this work, unpaid and in a personal capacity. Thirty two independent experts among them completed a full 24-record set, in 16 countries across 5 continents.

On detection, a panel of 16 reviewers drawn from 11 countries read the records blind against a verified answer key and identified unreconstructable records with 83.9% accuracy across 384 graded reads (95% CI 72.7 to 95.1; sensitivity 87.0%, specificity 80.7%), clearing a threshold fixed before any data were examined.

On reproducibility, three AI models, each from a different vendor, applied the standard to the same 15 constructed records and agreed 84% of the time. That is a signal about consistent application, not about accuracy.

On reviewer reliability, independent raters scoring a shared record set reached Gwet's AC1 of 0.739 among expert raters and 0.624 among trained reviewers, both above the floor of 0.61 set in advance. Those figures are interim and rest on 10 records and 99 labels.

A related article is due in CEP Magazine in November. Detection, reproducibility, and reliability are separate questions from real-world effectiveness, which is a later stage of the program.

JRS runs inside existing HR, compliance, investigations, audit, and legal review processes. It needs no specialized software and no procedural redesign.

## Acknowledgment

The reproducibility and validation methodology behind the figures cited above was designed by Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India.

The figures themselves exist because reviewers in sixteen countries read records they were never paid to read. We are grateful to all of them.

## About the Authors

**Hekim Colpan** is an AI Governance and Compliance Manager and Data Protection Manager, and an ISO/IEC 42001 auditor, based in Germany. His work spans AI management systems under ISO/IEC 42001, information-security and compliance management under ISO/IEC 27001 and 37301, the EU AI Act, the GDPR, and DORA, with particular attention to how record-keeping, logging, and technical-documentation requirements land in day-to-day governance practice.

**Phillip Wikes** is an AI Governance and Cognitive Risk Advisor focused on documentation integrity, evidentiary traceability, and record-level controls in AI-assisted environments. He served as a Lead Civil Rights Officer at the Maryland Commission on Civil Rights, evaluating discrimination complaints and resolving matters through investigation, mediation, and structured fact-finding under federal HUD and EEOC frameworks. He developed the Justification Review Standard (JRS) and named the risk it addresses, Decision Reconstruction Risk (DRR), and holds an M.S. in Negotiation and Conflict Management.

JRS: https://jrsstandard.com

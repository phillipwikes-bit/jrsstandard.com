# The Evidentiary Deficit in AI-Assisted Record-Keeping

*By Hekim Colpan and Phillip Wikes*

*Both authors contributed equally. Names appear in alphabetical order. Hekim Colpan contributes in a personal professional capacity; the views expressed are his own and do not represent the position of any employer or institution. Phillip Wikes developed the Justification Review Standard described below.*

---

A record makes a promise to whoever reads it later. It tells a regulator, a court or the person whose life it describes that a decision was made for reasons someone can go back and examine. When an AI tool drafts the record, that promise breaks quietly. The text reads as finished. The reasoning behind it may already be gone.

We call that gap Decision Reconstruction Risk: the state a record is in when it can no longer show, on its own, why a consequential decision was made. Once the reasoning cannot be rebuilt from the file, accountability shifts to memory and opinion.

One of us works inside European AI governance and compliance. The other spent more than a decade at a U.S. civil rights agency reading consequential records after the fact, and kept finding a decision that was probably sound sitting on a record that could not prove it. In Europe, the GDPR's accountability principle requires organizations to demonstrate compliance with applicable data-protection obligations, while the EU AI Act introduces more specific documentation, logging and oversight requirements where its relevant regimes apply. In the United States no equivalent general obligation applies, but discovery and the burden-shifting frameworks that structure employment and housing cases can put an organization in the same position, needing to substantiate a consequential decision from the record it kept. The legal mechanisms differ. The demand on the record often converges.

## The record is the evidence

In employment, housing and administrative matters, the written record is usually the first thing a dispute is tested against. Performance evaluations, tenancy files and investigative notes are read under statutes such as [Title VII](https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964), the Age Discrimination in Employment Act, the Americans with Disabilities Act and the [Fair Housing Act](https://www.justice.gov/crt/fair-housing-act-1).

[McDonnell Douglas Corp. v. Green](https://supreme.justia.com/cases/federal/us/411/792/) shows why this matters day to day. The decision sets out a burden-shifting framework in which an employer articulates a legitimate, non-discriminatory reason and the plaintiff may then seek to show it is pretextual. The Court did not hold that documentation quality determines the outcome. But whether a stated reason is corroborated by contemporaneous records, and whether the reasons given have stayed consistent, is often what the pretext inquiry turns on.

Something similar happens in judicial review of federal agency action, where a court generally evaluates the reasons the agency itself articulated, on the [administrative record](https://www.law.cornell.edu/uscode/text/5/706) before it. Reasons that do not appear in the record are harder to rely on later.

A record that will hold up has to show the facts its conclusion rests on. A well-supported one survives internal review, complaint investigation, regulatory examination and discovery, and it lets the affected person understand how the decision about them was reached. A thin one can fail all of that even when the decision underneath it was correct.

## Where AI-assisted records break down

AI tools write fluent narrative and often lose the thread back to the facts. Conclusions arrive with confident framing on top of fragmentary inputs. The finished text can no longer be traced to the logs, notes or messages that would ground it, and the drafting history, the reviewer and the prompts are usually not kept.

The problem compounds when one tool writes both the narrative and the justification for it. A manager asks a model to draft a termination memorandum, then asks the same model to supply the supporting facts. The resulting file agrees with itself and is tied to nothing outside itself. In litigation that can read as reasoning assembled after the decision, particularly where the drafting sequence shows the narrative came last. Every material claim in a consequential record should trace back to evidence that existed at the time.

A second failure shows up only in aggregate. AI reproduces language at scale, and when subjective descriptors such as "cultural fit," "struggles with change" or "attitude" recur across individuals who share a protected characteristic, what looked like one author's stylistic habit becomes something an adverse inference can be built on. Uniformity that once took years of individual writing to accumulate can now appear across a single quarter. Because the pattern lives in the aggregate, it passes every file-by-file review and surfaces only when records are read side by side. Disparate treatment and disparate impact are distinct theories with different elements and proof structures, and recurring language does not by itself establish either. The aggregate visibility is what makes it worth monitoring.

Opposing counsel tends to make two moves: that the fluent AI narrative was written to dress up a decision already made, and that missing drafting history and reviewer notes show there was no real deliberation. Both land harder when the organization cannot produce the underlying material.

Depending on the dispute, preservation obligations and discovery requests may extend to materials showing how an AI-assisted record was created, reviewed, modified and finalized, including prompt logs, draft versions, tool-usage records and reviewer activity. Potential discoverability is not the same as an obligation to retain everything, and the two should not be conflated in policy. Regulators come at it differently. Uniform language across files can suggest a process running without individualized judgment, and gaps in processing documentation raise questions of their own.

When an institution cannot explain its own decisions to the people they affect, it loses some of the accountability and public confidence it depends on to function.

## The European frame

In Europe the governance problem begins the moment AI-assisted drafting severs the link between a consequential record and the information, human judgment and controls that produced it. Under the GDPR, the [accountability principle in Article 5(2)](https://eur-lex.europa.eu/eli/reg/2016/679/oj) requires controllers not only to comply with the data-protection principles but to be able to demonstrate that compliance when scrutinized. Article 30's record of processing activities is part of that framework, but a modest part: it does not require every prompt or draft to be retained, and it does not become a decision log simply because a model was involved upstream. What it asks for is proportionate controls capable of showing how the processing was governed and, where the risk warrants it, assessed.

The timing of the [EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) makes that distinction more than academic. The Regulation now generally applies, while its core high-risk requirements on risk management, data governance, technical documentation, logging and human oversight have been postponed by [Regulation (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj): Annex III high-risk systems from 2 December 2027, and high-risk systems linked to regulated products under Annex I from 2 August 2028. Organizations are deploying AI-assisted workflows today while some of the Act's strongest statutory traceability controls remain pending. Many of those workflows will not fall within the high-risk regime at all. The practical question is broader than formal classification: has enough reliable evidence been preserved to reconstruct what the AI contributed, what a human verified and why the final record was accepted?

[ISO/IEC 42001](https://www.iso.org/standard/42001) can support structured governance across that gap through defined responsibilities, risk management and monitoring. In financial services, [DORA](https://eur-lex.europa.eu/eli/reg/2022/2554/oj) adds a documented ICT-risk and governance framework where applicable. Neither establishes any particular record-level control. The aim is not to retain everything but to preserve the right evidence, under the right controls, for the right period, so a consequential record can still account for itself when someone asks it to.

## What to do before the record is final

A record worth trusting answers three questions on its own face. Can someone understand it without the author standing next to them explaining it? Do its conclusions rest on evidence a human, not a model, can verify? Could a neutral reviewer rebuild the reasoning without being told how it went? If the answer to any of them is no, the record is incomplete however well it reads.

The organizing principle for controls is to preserve what is necessary to reconstruct and defend a consequential record, not to retain everything indefinitely.

1. Identify the human author and any AI tools used in drafting.
2. Preserve the underlying source materials, including notes, logs and communications, on which conclusions rest.
3. Link conclusions to independently verifiable source evidence rather than to AI-generated assertions alone.
4. Document the human review step, including reviewer identity, date and substantive changes.
5. Restrict the use of unapproved external AI tools for official records.
6. Reflect AI-assisted processing in applicable data-processing inventories, including GDPR Article 30 where it applies.
7. Define in advance what drafting-layer material is preserved for consequential records, for how long and under what legal-hold triggers.
8. Audit periodically for repeated subjective language across authors and business units.
9. Confirm consistency between the record and prior documented history.

One way to operationalize this is a structured review applied before a consequential record is finalized. The Justification Review Standard, developed by one of the authors, runs inside existing HR, compliance, investigations, audit and legal workflows and asks whether an AI-assisted record will hold up when someone examines it independently: whether the conclusion can be rebuilt from the record alone, whether its basis is identifiable, whether the chronology holds, whether a reviewer can trace how the conclusion was reached and whether the evidence behind it is sufficient. It is undergoing structured validation using blinded reviewers, a predefined reference corpus and prespecified evaluation criteria, and results will be reported separately. The specific instrument matters less than the discipline. Any review that forces those questions before a record is finalized addresses the same failure.

Underneath all of it sits one idea that belongs to no single jurisdiction. When AI helps produce a consequential decision, the person on the receiving end should be able to understand why, and the organization should be able to reconstruct and defend it from the record itself. We use the shorthand "right to know why" for that principle. It is not a legal doctrine and not a claim of any new entitlement, only a short name for something already running through discovery practice, evidentiary sufficiency, the GDPR's accountability principle and the EU AI Act's record-keeping expectations. The tool doing the drafting has changed. The standard the record has to meet has not.

---

**Hekim Colpan** is an AI Governance and Compliance Manager, Data Protection Manager and ISO/IEC 42001 auditor based in Germany. His work focuses on the operational implementation of AI management systems, the EU AI Act, GDPR accountability, DORA and governance controls for AI-assisted systems.

**Phillip Wikes** is an AI Governance and Cognitive Risk Advisor focused on documentation integrity, evidentiary traceability and record-level controls in AI-assisted environments. He served as a Lead Civil Rights Officer at the Maryland Commission on Civil Rights, evaluating discrimination complaints under federal HUD and EEOC frameworks. He developed the Justification Review Standard and named Decision Reconstruction Risk, and holds an M.S. in Negotiation and Conflict Management.

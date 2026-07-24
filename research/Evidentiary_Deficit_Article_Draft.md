<!--
INTERNAL HEADER (not part of the article body)
Article: "The Evidentiary Deficit in AI-Assisted Record-Keeping"
Prepared for Gabriela Bar (V-AI-16) review + CO-AUTHORING. 2026-07-24: byline now reads "By Phillip Wikes and Gabriela Bar" so her name is prominent in the pitch draft (this IS the invitation); her earned contribution is the EU-law analysis in Section V. If she declines, revert to Phillip solo. Ubayet Hossain, FRM (KPMG India) is credited as a CONTRIBUTOR in an Acknowledgment (he designed the reliability/reproducibility methodology behind the cited figures), NOT as a co-author of this legal argument; his co-authorship remains on the empirical papers. Confirm the acknowledgment wording with Ubayet (pending). Humanized 2026-07-24: added a first-person practitioner opening ("one of us...") and varied rhythm to reduce AI-drafted feel.
Revision 2026-07-24: (1) DRR named and woven through (Intro, VI, IX, About JRS); (2) About JRS corrected to the canonical FIVE checks (added evidentiary sufficiency); (3) modest validation paragraph added with allowed framings (reproducibility 84%/15 records as reproducibility NOT accuracy; substantial pre-registered inter-rater reliability; 8 countries/5 continents COMPLETERS; CEP forthcoming Nov); (4) EU-law dimension strengthened in Section V as the natural co-author section for Bar (AI Act record-keeping/logging + GDPR accountability, framed generally so Bar refines the specifics); (5) banned "frequently" -> "often". No long dashes. No blind-study mention.
Co-author hook: the EU/transatlantic legal analysis is deliberately left as a strong skeleton for Bar (EU AI Act + GDPR) to deepen.
Venue: see the recommendation delivered to Phillip and logged in MASTER_TRACKER §6.
-->

LEGAL / GOVERNANCE AUDIENCE  |  LITIGATION RISK  |  AI-ASSISTED DOCUMENTATION

# The Evidentiary Deficit in AI-Assisted Record-Keeping

*How the gap between polished AI narrative and verifiable evidence creates litigation exposure, and how practitioners can ensure defensible records.*

By Phillip Wikes and Gabriela Bar

*Phillip Wikes, AI Governance and Cognitive Risk Advisor, former Lead Civil Rights Officer, Maryland Commission on Civil Rights. Gabriela Bar, PhD, Attorney at Law, founder of Gabriela Bar Law and AI (Wroclaw), advising on trustworthy AI and data-protection law.*

## I. Introduction

One of us spent more than a decade reading discrimination files for a state civil rights agency. The cases that caused the most worry were rarely the ones with an obvious flaw. They were the ones where the file read cleanly, the conclusion sat neatly at the end, and nothing beneath it explained how anyone had arrived there. A record can look finished and still be hollow.

In employment disputes, the written record carries primary evidentiary weight. When it falls short, every other element of the case becomes harder to defend.

An AI-assisted draft reads like a finished record. The sentences are confident, the structure is coherent, and the conclusions sound reasoned. The relevant discovery question is whether the document is tied back to the facts it asserts. That gap, between fluent narrative and verifiable evidence, is the central concern of this article.

This failure has a name we use throughout: Decision Reconstruction Risk (DRR), the condition in which a record cannot explain, on its own terms, why a decision was made. The evidentiary deficit is DRR seen from the litigation side: when the reasoning behind a record cannot be reconstructed, the decision cannot be defended.

Courts and regulators have always relied on contemporaneous documentation to test whether a decision was lawful, consistent, and free of bias. As organizations move more of their drafting into AI-assisted tools, the evidentiary integrity of the resulting records becomes a genuine legal issue, not a theoretical one.

AI-assisted documentation is treated as presumptively discoverable. Drafting workflows should be built on that assumption from the start.

## II. Documentation as Legal Evidence

In employment, housing, and administrative adjudication, the written record is the first place a dispute is tested. Performance evaluations, tenancy files, and investigative notes are evaluated under statutes such as Title VII, the Age Discrimination in Employment Act, the Americans with Disabilities Act, and the Fair Housing Act.

The burden-shifting analysis in McDonnell Douglas Corp. v. Green illustrates the stakes: the sufficiency of the documented rationale often determines whether a stated reason will be treated as legitimate or as pretext. Administrative law similarly applies a reasoned decision-making standard, under which the quality of the record often determines whether the underlying decision survives review at all.

A record must do more than state a conclusion. It has to show the factual basis behind that conclusion. When the documentation cannot substantiate the reasoning it claims to reflect, the organization loses the very evidence it needs to defend the decision.

## III. How AI-Assisted Records Fail in Practice

AI tools generate fluent narrative, but they often lose the link between the narrative and the underlying facts. Three failure modes recur in practice. First, unsupported narrative: conclusions appear with confident framing, even when the input contained only fragmentary facts. Second, missing source linkage: the finished record is no longer traceable to the logs, notes, or communications that would anchor it. Third, weak auditability: the drafting history, reviewer identity, and prompts used to produce the text are not preserved.

When the same tool generates both the narrative and its supporting justification, the record becomes self-referential and can be functionally indistinguishable from post hoc rationalization. A manager prompts the model to draft a termination justification, then prompts the same model to generate the supporting facts. The resulting file is internally consistent but cannot be tied to independent evidence. In discovery, unsupported assertions are treated as post hoc rationalization, particularly where the drafting record shows AI-generated narrative being introduced after the underlying decision was already made.

A defensible record requires that every material assertion can be traced to contemporaneous evidence.

## IV. Pattern Risk and Proxy Language

AI tools reproduce language patterns at scale. Pattern risk emerges when subjective descriptors such as "cultural fit," "struggles with change," or "attitude" recur across individuals sharing protected characteristics. What looks like a stylistic quirk in one file can, in aggregate, support an inference of systemic bias. Aggregate uniformity that would once have taken years of individual drafting to produce can now emerge within a single quarter of AI-assisted writing. Courts have recognized that patterns across records may be used to establish systemic discrimination or discriminatory intent under both disparate treatment and disparate impact analysis.

## V. Data Protection and the Transatlantic Frame

Public AI tools introduce two related risks. The first is a data processing risk: entering sensitive information into an external interface may not satisfy the lawful basis for processing under the GDPR and similar frameworks, and may conflict with data minimization obligations. The second is a documentation integrity risk: where drafting occurs outside approved systems, organizations may be unable to produce metadata identifying the tool used, the inputs entered, or the timing of the drafting itself. Both risks converge on the same practical point: without visibility into what tool was used, what data was entered, and what came back, the organization cannot defend the provenance of the record.

In the European Union, the same gap intersects two regimes at once. Under the GDPR, the accountability principle expects an organization to demonstrate how personal data was processed; a record whose provenance cannot be shown is difficult to reconcile with that duty and with records-of-processing obligations. Under the EU AI Act, high-risk uses carry record-keeping, logging, and technical-documentation expectations intended to make automated and AI-assisted processing auditable after the fact. An organization that cannot reconstruct how an AI-assisted record was produced faces exposure on both fronts at the same time. The precise contours of these European obligations, and how they map onto records generated with general-purpose AI tools, are developed further below by co-author Gabriela Bar.

## VI. Oversight and Review

A defensible record should be able to answer three questions on its face. Can the record be understood independently of its author? Are its conclusions supported by verifiable, non-AI-generated evidence? Can a neutral reviewer reconstruct the reasoning without additional explanation? If any of these questions cannot be answered, the record is incomplete, regardless of how polished it reads. These questions operationalize Decision Reconstruction Risk: a record that cannot answer them carries DRR into every proceeding that later relies on it. Periodic sampling across authors and business units helps surface drift before it becomes a pattern.

## VII. Litigation and Regulatory Exposure

Opposing counsel argue two things. First, that fluent AI-generated narrative was produced to justify a decision already made. Second, that the absence of drafting history or reviewer notes confirms the absence of genuine deliberation. Both arguments land harder when the organization cannot produce the underlying material.

Expect discovery requests aimed at the drafting layer itself, including prompt logs, draft versions, tool-usage records, and reviewer activity. ESI obligations now routinely include such material. Regulators tend to arrive at an adjacent conclusion: uniform language across files can be read as evidence of a process rather than of individualized judgment, and the absence of records-of-processing detail is treated as an independent compliance failure.

## VIII. Practitioner's Checklist

1. Identify the human author and the AI tool(s) used in drafting.
2. Preserve the underlying source materials, including notes, logs, and communications.
3. Link conclusions to verifiable, non-AI-generated evidence.
4. Document the human review step, including reviewer identity, date, and substantive changes.
5. Prohibit the use of unapproved external AI tools for official records.
6. Align records with the applicable data processing inventories, including GDPR Article 30 where relevant.
7. Audit periodically for repeated subjective language across authors and business units.
8. Preserve draft history, prompts, and tool-usage records for discovery.
9. Confirm consistency between the record and prior documented performance history.

## IX. Conclusion

The drafting tool has changed. The evidentiary test has not. Risk arises where evidentiary traceability is absent, which is to say where Decision Reconstruction Risk is present. Records are evaluated on whether the evidentiary architecture behind them is visible, reproducible, and capable of withstanding scrutiny in both discovery and regulatory review.

The drafting tool has changed. The evidentiary test has not.

## About JRS

JRS provides a structured documentation review instrument that practitioners in HR, compliance, investigations, audit, and legal review can apply within existing workflows to evaluate whether AI-assisted records will hold up under independent scrutiny. The framework addresses a specific and recurring gap: AI-generated content enters permanent records as finished documentation, but the evidentiary foundation behind that content is often absent. That gap is Decision Reconstruction Risk, and JRS exists to catch it before a record is finalized.

JRS is built around a single question: when AI-assisted content enters a workplace record, does the record remain traceable, evidentiary, and reconstructable under structured review? Five checks answer it. Can the conclusion be reconstructed from the record alone? Is its basis identifiable? Can the chronology be followed? Can a reviewer trace how the conclusion was reached? Is the evidence sufficient?

JRS is in structured validation. Independent reviewers across 8 countries on 5 continents have completed structured reviews. Independent raters reached substantial agreement under a pre-registered analysis. Three independent AI providers applied the standard to the same records and agreed 84% of the time across 15 constructed records, a reproducibility signal that is distinct from accuracy. A related article is forthcoming in CEP Magazine in November. These results support reproducible application; they do not yet establish accuracy or real-world effectiveness, which are later stages of the program.

JRS operates within existing HR, compliance, investigations, audit, and legal review processes. No specialized software or procedural redesign required. Learn more: https://jrsstandard.com

## Acknowledgment

The reliability and reproducibility methodology behind the validation figures cited above was designed by Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India.

## About the Authors

**Gabriela Bar, PhD,** is an attorney at law and founder of Gabriela Bar Law and AI in Wroclaw, Poland. She advises organizations on the legal and ethical dimensions of trustworthy AI and data protection, serves as an independent ethics advisor on EU research projects, and is recognized in the Lexology Index: Artificial Intelligence 2026. She has been named among Forbes Top 25 Business Lawyers and TOP100 Women in AI, is a member of the Federation des Barreaux d'Europe, and speaks regularly at academic and industry conferences.

**Phillip Wikes** is an AI Governance and Cognitive Risk Advisor focused on documentation integrity, evidentiary traceability, and record-level controls in AI-assisted environments.

From 2012 to 2025, he served as a Lead Civil Rights Officer at the Maryland Commission on Civil Rights, evaluating discrimination complaints and resolving matters through investigation, mediation, and structured fact-finding under federal HUD and EEOC frameworks.

He developed the Justification Review Standard (JRS), a structured documentation review instrument built for practitioner application within existing HR, compliance, investigations, audit, and legal review workflows, and named the risk it addresses: Decision Reconstruction Risk (DRR).

He also co-developed cognitive-behavioral programs used in educational and juvenile justice settings, and holds an M.S. in Negotiation and Conflict Management.

JRS: https://jrsstandard.com

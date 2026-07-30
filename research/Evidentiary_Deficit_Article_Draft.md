<!--
INTERNAL HEADER (not part of the article body)
Article: "The Evidentiary Deficit in AI-Assisted Record-Keeping"
RETARGETED 2026-07-30: co-author is now Dr. Gabriela Zanfir-Fortuna (VP Global Privacy, Future of Privacy Forum; ex-EDPS, CJEU litigation team; PhD on rights of the data subject) after Dr. Gabriela Bar declined 2026-07-30. Byline, author subline, the intro "the other has spent a career..." line, and the About-the-authors bio were all updated to Zanfir-Fortuna; Section V (GDPR accountability + AI Act record-keeping) still fits her data-protection specialty and remains her scaffold to expand. Pitch: `research/Zanfir_Fortuna_CoAuthor_Pitch.md`. If she declines, revert to Phillip solo. HISTORICAL (Bar): Prepared for Gabriela Bar (V-AI-16) review + CO-AUTHORING. 2026-07-24: byline read "By Phillip Wikes and Gabriela Bar" so her name is prominent in the pitch draft (this IS the invitation); her earned contribution is the EU-law analysis in Section V. If she declines, revert to Phillip solo. Ubayet Hossain, FRM (KPMG India) is credited as a CONTRIBUTOR in an Acknowledgment (he designed the reliability/reproducibility methodology behind the cited figures), NOT as a co-author of this legal argument; his co-authorship remains on the empirical papers. Confirm the acknowledgment wording with Ubayet (pending). Humanized 2026-07-24: added a first-person practitioner opening ("one of us...") and varied rhythm to reduce AI-drafted feel. 2026-07-24b: Bar first + LEAD author; removed the "LEGAL / GOVERNANCE AUDIENCE" label banner; rewrote subtitle + intro + conclusion in Bar's voice (clear, accessible, accountability/trust-forward, EU frame as the anchor with the US analysis as the comparative edge, forward-looking close). Body sections II-VIII substance unchanged. Section V stays her scaffold; once she expands it, consider promoting it earlier.
Revision 2026-07-24: (1) DRR named and woven through (Intro, VI, IX, About JRS); (2) About JRS corrected to the canonical FIVE checks (added evidentiary sufficiency); (3) modest validation paragraph added with allowed framings (reproducibility 84%/15 records as reproducibility NOT accuracy; substantial pre-registered inter-rater reliability; 8 countries/5 continents COMPLETERS; CEP forthcoming Nov); (4) EU-law dimension strengthened in Section V as the natural co-author section for Bar (AI Act record-keeping/logging + GDPR accountability, framed generally so Bar refines the specifics); (5) banned "frequently" -> "often". No long dashes. No blind-study mention.
Co-author hook: the EU/transatlantic legal analysis is deliberately left as a strong skeleton for Bar (EU AI Act + GDPR) to deepen.
Venue: see the recommendation delivered to Phillip and logged in MASTER_TRACKER §6.
-->

# The Evidentiary Deficit in AI-Assisted Record-Keeping

*Why AI-assisted records that cannot explain themselves have become a transatlantic governance problem, and what accountable documentation now requires.*

By Gabriela Zanfir-Fortuna and Phillip Wikes

*Gabriela Zanfir-Fortuna, PhD, Vice President for Global Privacy at the Future of Privacy Forum, formerly of the European Data Protection Supervisor, writing on global data-protection law and accountability. Phillip Wikes, AI Governance and Cognitive Risk Advisor, former Lead Civil Rights Officer, Maryland Commission on Civil Rights.*

## I. Introduction

A record is a kind of promise. It tells whoever reads it later, a regulator, a court, a colleague, the person whose life it describes, that a decision was made for reasons that can be examined. When artificial intelligence drafts the record, that promise is easy to break without anyone noticing. The text looks complete. The reasoning behind it may already be gone.

Every consequential decision is eventually questioned. The only uncertainty is whether the record will still be capable of explaining and defending it.

This failure has a name we use throughout: Decision Reconstruction Risk (DRR), the condition in which a record cannot independently explain why a consequential decision was made. It is not a technology problem in the usual sense. It is an accountability problem, and accountability is where law, ethics, and trust meet. DRR is not simply a documentation problem. It is a governance failure: when the reasoning behind a consequential decision can no longer be independently reconstructed, accountability shifts from contemporaneous evidence to memory, opinion, or institutional credibility, which is precisely the condition modern governance seeks to avoid.

One of us spent more than a decade reading such records after the fact, for a civil rights agency, and saw the same pattern repeat: the decision was often sound, and the record could not show why. The other has spent a career at the center of data-protection law across Europe and the United States, in enforcement, in litigation before the Court of Justice of the European Union, and in scholarship on the rights of the person a record describes. From both vantage points the conclusion is the same. As AI drafts more of the documents behind consequential decisions, the evidence that would let anyone reconstruct those decisions is quietly disappearing.

We write from both European and United States perspectives, because the exposure is now transatlantic. In Europe, the accountability principle at the heart of the GDPR and the record-keeping expectations of the EU AI Act ask organizations to show, not merely assert, how a decision was reached. In the United States, the same gap surfaces in discovery and in the burden-shifting tests that decide employment and housing disputes. The legal vocabulary differs. The underlying demand is the same: a record must be able to answer for itself.

AI-assisted documentation should be treated as presumptively reviewable, whether by a regulator, an auditor, or a court. The most practical moment to meet that standard is before the record is finalized.

## II. Documentation as Legal Evidence

In employment, housing, and administrative adjudication, the written record is the first place a dispute is tested. Performance evaluations, tenancy files, and investigative notes are evaluated under statutes such as Title VII, the Age Discrimination in Employment Act, the Americans with Disabilities Act, and the Fair Housing Act.

The burden-shifting analysis in McDonnell Douglas Corp. v. Green illustrates the stakes: the sufficiency of the documented rationale often determines whether a stated reason will be treated as legitimate or as pretext. Administrative law similarly applies a reasoned decision-making standard, under which the quality of the record often determines whether the underlying decision survives review at all.

A legally defensible record must do more than state a conclusion. It has to show the factual basis behind that conclusion. When the documentation cannot substantiate the reasoning it claims to reflect, the organization loses the very evidence it needs to defend the decision.

Reconstructability serves public interests as much as organizational ones. It preserves an affected person's ability to understand how a decision was reached, and it gives reviewers, courts, regulators, and oversight bodies an evidentiary basis for independent evaluation. A well-supported record survives many forms of scrutiny, internal review, complaint investigation, regulatory examination, discovery, judicial proceedings, and later historical review, while a poorly supported one may fail each of them even when the underlying decision was sound.

## III. How AI-Assisted Records Fail in Practice

AI tools generate fluent narrative, but they often lose the link between the narrative and the underlying facts. Three failure modes recur in practice. First, unsupported narrative: conclusions appear with confident framing, even when the input contained only fragmentary facts. Second, missing source linkage: the finished record is no longer traceable to the logs, notes, or communications that would anchor it. Third, weak auditability: the drafting history, reviewer identity, and prompts used to produce the text are not preserved.

When the same tool generates both the narrative and its supporting justification, the record becomes self-referential and can be functionally indistinguishable from post hoc rationalization. Consider a manager who prompts the model to draft a termination justification, then prompts the same model to supply the supporting facts. The resulting file is internally consistent but cannot be tied to independent evidence. In discovery, unsupported assertions are treated as post hoc rationalization, particularly where the drafting record shows AI-generated narrative being introduced after the underlying decision was already made.

A defensible record requires that every material assertion can be traced to contemporaneous evidence.

## IV. Pattern Risk and Proxy Language

AI tools reproduce language patterns at scale. Pattern risk emerges when subjective descriptors such as "cultural fit," "struggles with change," or "attitude" recur across individuals sharing protected characteristics. What looks like a stylistic quirk in one file can, in aggregate, support an inference of systemic bias. Aggregate uniformity that would once have taken years of individual drafting to produce can now emerge within a single quarter of AI-assisted writing. Because the risk lives in the aggregate, it can pass every individual review and become visible only when records are examined together. Courts have recognized that patterns across records may be used to establish systemic discrimination or discriminatory intent under both disparate treatment and disparate impact analysis.

## V. Data Protection and the European Frame

Public AI tools introduce two related risks. The first is a data processing risk: entering sensitive information into an external interface may not satisfy the lawful basis for processing under the GDPR and similar frameworks, and may conflict with data minimization obligations. The second is a documentation integrity risk: where drafting occurs outside approved systems, organizations may be unable to produce metadata identifying the tool used, the inputs entered, or the timing of the drafting itself. Both risks converge on the same practical point: without visibility into what tool was used, what data was entered, and what came back, the organization cannot defend the provenance of the record.

In the European Union, the same gap intersects two regimes at once. Under the GDPR, the accountability principle expects an organization to demonstrate how personal data was processed; a record whose provenance cannot be shown is difficult to reconcile with that duty and with records-of-processing obligations. Under the EU AI Act, high-risk uses carry record-keeping, logging, and technical-documentation expectations intended to make automated and AI-assisted processing auditable after the fact. An organization that cannot reconstruct how an AI-assisted record was produced faces exposure on both fronts at the same time. The precise contours of these European obligations, and how they map onto records generated with general-purpose AI tools, are developed in the analysis that anchors this article.

## VI. Oversight and Review

A defensible record should be able to answer three questions on its face. **Can the record be understood independently of its author? Are its conclusions supported by verifiable, non-AI-generated evidence? Can a neutral reviewer reconstruct the reasoning without additional explanation?** If any of these questions cannot be answered, the record is incomplete, regardless of how polished it reads. These questions operationalize Decision Reconstruction Risk: a record that cannot answer them carries DRR into every proceeding that later relies on it. Periodic sampling across authors and business units helps surface drift before it becomes a pattern.

## VII. Litigation and Regulatory Exposure

Opposing counsel argue two things. First, that fluent AI-generated narrative was produced to justify a decision already made. Second, that the absence of drafting history or reviewer notes confirms the absence of genuine deliberation. Both arguments land harder when the organization cannot produce the underlying material.

Expect discovery requests aimed at the drafting layer itself, including prompt logs, draft versions, tool-usage records, and reviewer activity. ESI obligations now routinely include such material. Regulators tend to arrive at an adjacent conclusion: uniform language across files can be read as evidence of a process rather than of individualized judgment, and the absence of records-of-processing detail is treated as an independent compliance failure.

These failures create risks beyond litigation exposure. They diminish an institution's capacity to explain its decisions to the people affected by them, and with it the transparency, accountability, and public confidence on which the institution depends.

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

Risk arises where evidentiary traceability is absent, which is to say where Decision Reconstruction Risk is present. The organizations that will weather the next decade are the ones that treat a record as something that must answer for itself: in a courtroom, before a regulator, and to the person whose life it describes. Records will be judged on whether the reasoning behind them is visible, reproducible, and capable of withstanding independent scrutiny, in Europe and the United States alike.

Taken together, these legal and regulatory currents point past any single jurisdiction toward a common governance principle. When AI contributes to a consequential decision, the person affected should be able to understand the basis for it, and the organization should be able to reconstruct and defend it from the record. This expectation can be captured in a single phrase, the Right to Know Why: not a new legal doctrine, but a concise name for accountability expectations that already run through discovery, evidentiary sufficiency, the GDPR's accountability principle, and the record-keeping demands of the EU AI Act.

Whether the question is put through American evidentiary law or European fundamental-rights frameworks, it converges on the same test: can the decision still explain itself? When it cannot, meaningful accountability is compromised, both for the institution that must defend the decision and for the person entitled to understand it. Naming that test plainly is what the Right to Know Why offers to courts, regulators, organizations, and the people whose lives consequential decisions affect.

The drafting tool has changed. The evidentiary test has not.

## About JRS

JRS provides a structured documentation review instrument that practitioners in HR, compliance, investigations, audit, and legal review can apply within existing workflows to evaluate whether AI-assisted records will hold up under independent scrutiny. The framework addresses a specific and recurring gap: AI-generated content enters permanent records as finished documentation, but the evidentiary foundation behind that content is often absent. That gap is Decision Reconstruction Risk, and JRS exists to catch it before a record is finalized.

JRS is built around a single question: when AI-assisted content enters a workplace record, does the record remain traceable, evidentiary, and reconstructable under structured review? Five checks answer it. Can the conclusion be reconstructed from the record alone? Is its basis identifiable? Can the chronology be followed? Can a reviewer trace how the conclusion was reached? Is the evidence sufficient?

JRS is in structured validation. Independent reviewers across 8 countries on 5 continents have completed structured reviews. Independent raters reached substantial agreement under a pre-registered analysis. Three independent AI models, each from a different vendor, applied the standard to the same records and agreed 84% of the time across 15 constructed records, a reproducibility signal that is distinct from accuracy. A related article is forthcoming in CEP Magazine in November. These results support reproducible application; they do not yet establish accuracy or real-world effectiveness, which are later stages of the program.

JRS operates within existing HR, compliance, investigations, audit, and legal review processes. No specialized software or procedural redesign required.

## Acknowledgment

The reliability and reproducibility methodology behind the validation figures cited above was designed by Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India.

## About the Authors

**Gabriela Zanfir-Fortuna, PhD,** is Vice President for Global Privacy at the Future of Privacy Forum, where she leads its work on global data-protection and privacy developments. She previously served at the European Data Protection Supervisor in Brussels, where she was part of the litigation team appearing before the Court of Justice of the European Union and took part in the work of the Article 29 Working Party. Her doctoral research addressed the rights of the data subject and their adjudication. She is an associated researcher at the LSTS Center of Vrije Universiteit Brussel and a guest lecturer at Maastricht University's European Centre on Privacy and Cybersecurity.

**Phillip Wikes** is an AI Governance and Cognitive Risk Advisor focused on documentation integrity, evidentiary traceability, and record-level controls in AI-assisted environments.

From 2012 to 2025, he served as a Lead Civil Rights Officer at the Maryland Commission on Civil Rights, evaluating discrimination complaints and resolving matters through investigation, mediation, and structured fact-finding under federal HUD and EEOC frameworks.

He developed the Justification Review Standard (JRS), a structured documentation review instrument built for practitioner application within existing HR, compliance, investigations, audit, and legal review workflows, and named the risk it addresses: Decision Reconstruction Risk (DRR).

He also co-developed cognitive-behavioral programs used in educational and juvenile justice settings, and holds an M.S. in Negotiation and Conflict Management.

JRS: https://jrsstandard.com

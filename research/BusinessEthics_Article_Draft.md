# Working Draft — Journal of Business Ethics submission

**Working title:** Documentation Governance in AI-Assisted Decision-Making: A Multi-Domain Validation of a Record-Level Review Standard

**Target journal:** *Journal of Business Ethics* (empirical; documentation governance in AI-assisted decision-making).

**Central research question:** Can organizations identify documentation weaknesses before those weaknesses become litigation, regulatory, audit, or investigative problems?

**Author / contributor map (authorship = substantive intellectual contribution, per journal integrity norms):**
- Phillip Wikes — lead author; framework, evidence program.
- Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India: statistical validation methodology (reference-panel design; chance-corrected reliability framework). Co-author for the methodology (offer made 2026-07-14; per-manuscript sign-off required).
- Kyle McMullan (Chief Auditor lineage, Citi; internal audit and financial-crimes) — co-author, enterprise audit and investigations lens: how documentation failures surface in internal audit and financial-crime work, and what a defensible record looks like under examination. **Invited 2026-07-17 (fills the compliance/investigations seat Sanya Dalal vacated); ACCEPTED 2026-07-18 ("Happy to help"). Next step: send him this working draft; his authorship becomes final on substantive contribution to Section 6.4 and manuscript review.**
- Tanvi Pokhriyal (UAE) — HR Documentation Validation Pilot lead; acknowledged contributor, co-author if she contributes to analysis/writing.
- Public-records pilot contributor (Stacy Young, E-08) — acknowledged; **see anti-duplication note below.**

**Status (2026-07-18):** Working draft, updated. Reliability/reproducibility results are collected and verified (Rungs 1–2). Criterion (real-case) evidence is **preliminary** (HR n=5, public records n=7; target 20–30 each). No criterion claim is asserted until pilots reach target. The practitioner argument and control framework from the unpublished piece "When AI Writes the Record" (held from LinkedIn for this purpose) are now folded in as Sections 1.0 and 6.4–6.5.

**Anti-duplication note (mandatory):** The dedicated empirical treatment of the public-records/FOIL pilot is a separate paper (*Journal of Civic Information*, `research/FOIL_Article_Outline.md`). In this paper the public-records pilot is used **illustratively, as one domain among several**, and must not reproduce the FOIL paper's primary results. Keep primary results distinct across the two papers.

---

## 0. Abstract (write last)
One paragraph: the governance gap (AI-assisted records that read as complete but cannot be reconstructed), the standard (JRS) and the named risk (DRR), the evidence program, the established finding (substantial inter-rater reliability + cross-vendor reproducibility), the multi-domain criterion pilots (preliminary), and the contribution (documentation quality as an independent governance metric that complements technology adoption).

## 1. Introduction
- 1.0 Opening vignette (from "When AI Writes the Record"). An HR business partner reviews a termination file ahead of an audit. The documentation is polished, structured, and audit-ready; the rationale reads clearly and confidently. Under audit review one question surfaces: where did this actually come from? The manager used a public AI tool to draft the justification, prompted it to strengthen the case, then prompted it again for supporting details. No logs were attached; no independent documentation was referenced. The result is a professional narrative with no verifiable evidentiary foundation. The problem is not a flawed decision; it is an indefensible record. This is the defensibility gap: the space between what a record says and what it can prove.
- 1.1 Documentation as an evidentiary function. In employment, public-records, compliance, and investigative contexts, the written record is the primary artifact tested when a decision is challenged (in US employment settings, under frameworks such as Title VII, the ADA, and adverse-action documentation standards). AI-assisted drafting produces fluent records without guaranteeing that the basis for a conclusion is present.
- 1.2 The governance gap. Organizations are adopting AI and document-review technology faster than they are measuring whether the *resulting documentation* remains independently reviewable. Technology inventories measure which software is used, not whether outputs are reconstructable.
- 1.3 This paper. We present a record-level review standard (JRS), its named risk (Decision Reconstruction Risk), and a staged, pre-registered evidence program, and we report established reliability results plus preliminary multi-domain criterion evidence.

## 2. The Justification Review Standard
- The single question: can a later, independent reviewer reconstruct how a conclusion was reached from the record alone?
- Five conditions: reconstructability, basis identification, chronology, decision-process traceability, evidentiary sufficiency. Three-level read: Ready / Needs work / Gap.
- Decision Reconstruction Risk (DRR): the condition in which a record cannot, on its own terms, allow an independent reviewer to reconstruct the basis for a consequential decision.

## 3. Evidence program (staged rungs)
Rung 1 Reproducibility → Rung 2a Reliability → Rung 2b Accuracy → Construct validity → Rung 3 Criterion validity (real cases) → External validity. This paper reports Rungs 1–2 in full and Rung 3 (criterion) as preliminary multi-domain pilots.

## 4. Reliability and reproducibility (established results — verified)
- **Reproducibility (Rung 1):** three independent AI providers (Anthropic, OpenAI, Google) applied JRS to the same constructed records and agreed on the read **84%** of the time across 15 records (automated nightly run; latest 2026-07-06; history 78–87% as the set grew). Reproducibility signal only, not accuracy.
- **Reliability (Rung 2a):** independent raters applied the five conditions to a shared set (10 records). Gwet's AC1 = **0.74 (experts, mean 3.6 raters/record, 88% raw)** and **0.63 (trained reviewers, 7.2 raters/record, 83% raw)**; both in the "substantial" range and clearing the pre-registered 0.61 floor. Across 108 labels the distribution was Gap 69% / Needs work 18% / Ready 13%.
- **Methodology attribution:** the reference-panel design and the chance-corrected reliability framework (joint use of Gwet's AC1, Krippendorff's alpha, and Fleiss' kappa; kappa-paradox handling; pre-registered floors) are the methodological contribution of **Ubayet Hossain, FRM, KPMG India**. Statistical analyses were completed before interpretation.
- **Accuracy (Rung 2b):** the 24-record answer key was independently reproduced 24/24 by raters blind to intended labels; reviewer completion is in progress; no accuracy estimate is claimed here.

## 5. Multi-domain criterion pilots (PRELIMINARY — do not overclaim)
Design (both domains): pair a real public determination that quotes the record with its documented outcome; record the JRS read blind to outcome; note outcome and public citation. Public/de-identified material only. Target 20–30 cases per domain with a spread of outcomes (deadline Aug 31, 2026).
- **HR documentation pilot (Tanvi Pokhriyal, UAE):** current **n=5** (all entered 2026-06-22). JRS reads 2 Ready / 2 Needs-work / 1 Gap; outcomes 3 held-up / 1 challenged / 1 failed-appeal. **Note a counter-example already present:** one record read Gap by JRS nonetheless held up on challenge. At n=5 with this divergence, **no association between JRS read and outcome is claimed.**
- **Public-records pilot (illustrative here; full treatment in the companion FOIL paper):** current **n=7**, used only to illustrate cross-domain applicability, not as a primary result in this paper.
- **Analysis plan (deferred to data lock):** per-domain association of JRS read with outcome (exact tests for small cells), reported with intervals; pooled discussion of documentation characteristics recurring in overturned determinations. Pre-registered thresholds govern any inferential claim.

## 6. Discussion
- 6.1 Documentation quality as an **independent governance metric**, measurable regardless of the software or AI system used to produce the record.
- 6.2 **Complementary, not competitive**, with AI/document-review technology adoption: JRS measures the reviewability of outputs that technology inventories do not capture.
- 6.3 Cross-domain relevance: the same reconstructability question applies to HR, public-records, compliance, and investigative documentation.
- 6.4 **The audit and investigations lens (Kyle McMullan's section; drafted as a frame for his revision and examples).** Internal audit and financial-crime work test records the way litigation does, only sooner and more often. Three recurring failure patterns illustrate how Decision Reconstruction Risk surfaces under examination. **Manager convenience:** a challenged decision where the organization cannot produce underlying documentation beyond the AI-generated narrative; in discovery or audit, the absence of source material becomes the central issue and shifts the burden onto the organization, so even a sound decision becomes difficult to defend. **Compliance washing:** a file that uses correct terminology and follows the template exactly, while every claim rests on AI-generated phrasing rather than documented observation; when this pattern repeats across files it can read as systemic, not isolated. **No second-line review:** a record that moves from manager draft to system of record without independent review, leaving no documented check on the reasoning; the missing control undermines the credibility of the whole process. In audit terms, JRS functions as a record-level control test: it asks of each file the question an examiner will eventually ask, before the examiner does.
- 6.5 **Practitioner implications: a pre-finalization control set.** The framework translates into four controls applied before a record enters the system of record, inside existing workflows: (1) anchor every material claim to verifiable evidence that existed before drafting (logs, communications, measurable data, not AI-generated narrative); (2) treat AI output as unverified draft material until independently substantiated; (3) eliminate proxy language, describing observable conduct rather than interpretation, since repeated subjective descriptors can function as pattern evidence in discrimination claims; (4) keep drafting inside approved, auditable systems, because the largest exposure is not AI use but untracked AI use. Three indicators make the control set measurable: the percentage of claims supported by documented evidence, the rate of claims lacking documentation, and the frequency of subjective language across files, tracked on a periodic sample-flag-remediate cadence. These indicators serve as early-warning signals of legal and compliance exposure, not merely documentation quality. AI has changed how documentation is produced; it has not changed how it is judged.

## 7. Limitations
- Criterion pilots are early (HR n=5, public records n=7) and currently mixed; no criterion claim is made. Records in Rungs 1–2 are constructed; external validity on real records is a later rung. Reliability rests on 10 records. The findings do not establish that JRS improves organizational outcomes, reduces litigation risk, or increases decision quality; those require separate evaluation. JRS remains in a validation phase.

## 8. Contributions and authorship
- Methodological (reliability/validation framework): Ubayet Hossain. Framework and program: Wikes. Enterprise audit and investigations lens (Section 6.4) and manuscript review: Kyle McMullan (accepted 2026-07-18; authorship final on substantive contribution). Domain pilots: Tanvi Pokhriyal (HR), Stacy Young (public records; acknowledged, with the separate FOIL paper as her lead vehicle). Authorship is assigned by substantive intellectual contribution, consistent with the journal's authorship-integrity expectations.

## 9. Data provenance (verified)
- Reliability/reproducibility figures from the study database (nightly reproducibility run; `bench_labels`), verified 2026-07-06/09.
- Criterion pilot counts from `bench_outcomes`: HR (V-HR-01) n=5; public records (E-08) n=7, as of 2026-07-09.

## Progress log (per standing directive — all progress recorded here)
- 2026-07-09 — Initial draft created. Reliability/reproducibility written from verified Rungs 1–2 data with Ubayet's methodology named. Criterion pilots entered as preliminary. Sanya pitched (LinkedIn DM) as pending co-author. Next: obtain Sanya's yes/no; on yes, share manuscript and define her section; drive HR and public-records pilots toward 20–30; keep public-records primary results in the FOIL paper only.
- 2026-07-18 — Kyle McMullan ACCEPTED the co-author invitation ("Happy to help", LinkedIn). Author map updated: Kyle fills the compliance/investigations seat Sanya vacated. The withheld practitioner piece "When AI Writes the Record" folded in: opening vignette + defensibility gap (Section 1.0), legal-framework anchor (1.1), audit/investigations failure patterns as Kyle's Section 6.4 (drafted as a frame for his revision and his own examples), and the pre-finalization control set + measurement indicators (6.5). Framework sections remain aligned with `JRS_Research_Paper.pdf` v1.0 (verified byte-identical to the circulating copy). Next: send Kyle this draft; his substantive pass on 6.4 finalizes authorship; drive HR pilot toward n=20-30.

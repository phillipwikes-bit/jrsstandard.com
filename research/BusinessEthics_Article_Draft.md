# Working Draft — Journal of Business Ethics submission

**Working title:** Documentation Governance in AI-Assisted Decision-Making: A Multi-Domain Validation of a Record-Level Review Standard

**Target journal:** *Journal of Business Ethics* (empirical; documentation governance in AI-assisted decision-making).

**Central research question:** Can organizations identify documentation weaknesses before those weaknesses become litigation, regulatory, audit, or investigative problems?

**Author / contributor map (to be finalized; authorship = substantive intellectual contribution, per journal integrity norms):**
- Phillip Wikes — lead author; framework, evidence program.
- Ubayet Hossain, FRM, Associate Director (Model Validation), KPMG India: statistical validation methodology (reference-panel design; chance-corrected reliability framework). Co-author or named methodological contributor (confirm).
- Sanya Dalal (Ethics & Compliance; LLB, MBL, CFE; GE Vernova; former KPMG) — **PENDING** co-author, contingent on substantive contribution (enterprise-compliance-investigations interpretation, analysis, manuscript). Pitched via LinkedIn DM 2026-07-09; awaiting yes/no.
- Tanvi Pokhriyal (UAE) — HR Documentation Validation Pilot lead; acknowledged contributor, co-author if she contributes to analysis/writing.
- Public-records pilot contributor (Stacy Young, E-08) — acknowledged; **see anti-duplication note below.**

**Status (2026-07-09):** Initial draft. Reliability/reproducibility results are collected and verified (Rungs 1–2). Criterion (real-case) evidence is **preliminary** (HR n=5, public records n=7; target 20–30 each). No criterion claim is asserted until pilots reach target.

**Anti-duplication note (mandatory):** The dedicated empirical treatment of the public-records/FOIL pilot is a separate paper (*Journal of Civic Information*, `research/FOIL_Article_Outline.md`). In this paper the public-records pilot is used **illustratively, as one domain among several**, and must not reproduce the FOIL paper's primary results. Keep primary results distinct across the two papers.

---

## 0. Abstract (write last)
One paragraph: the governance gap (AI-assisted records that read as complete but cannot be reconstructed), the standard (JRS) and the named risk (DRR), the evidence program, the established finding (substantial inter-rater reliability + cross-vendor reproducibility), the multi-domain criterion pilots (preliminary), and the contribution (documentation quality as an independent governance metric that complements technology adoption).

## 1. Introduction
- 1.1 Documentation as an evidentiary function. In employment, public-records, compliance, and investigative contexts, the written record is the primary artifact tested when a decision is challenged. AI-assisted drafting produces fluent records without guaranteeing that the basis for a conclusion is present.
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
- Documentation quality as an **independent governance metric**, measurable regardless of the software or AI system used to produce the record.
- **Complementary, not competitive**, with AI/document-review technology adoption: JRS measures the reviewability of outputs that technology inventories do not capture.
- Cross-domain relevance: the same reconstructability question applies to HR, public-records, compliance, and investigative documentation.

## 7. Limitations
- Criterion pilots are early (HR n=5, public records n=7) and currently mixed; no criterion claim is made. Records in Rungs 1–2 are constructed; external validity on real records is a later rung. Reliability rests on 10 records. The findings do not establish that JRS improves organizational outcomes, reduces litigation risk, or increases decision quality; those require separate evaluation. JRS remains in a validation phase.

## 8. Contributions and authorship
- Methodological (reliability/validation framework): Ubayet Hossain. Framework and program: Wikes. Enterprise-compliance-investigations interpretation and manuscript: Sanya Dalal (pending). Domain pilots: Tanvi Pokhriyal (HR), Stacy Young (public records; acknowledged, with the separate FOIL paper as her lead vehicle). Authorship is assigned by substantive intellectual contribution, consistent with the journal's authorship-integrity expectations.

## 9. Data provenance (verified)
- Reliability/reproducibility figures from the study database (nightly reproducibility run; `bench_labels`), verified 2026-07-06/09.
- Criterion pilot counts from `bench_outcomes`: HR (V-HR-01) n=5; public records (E-08) n=7, as of 2026-07-09.

## Progress log (per standing directive — all progress recorded here)
- 2026-07-09 — Initial draft created. Reliability/reproducibility written from verified Rungs 1–2 data with Ubayet's methodology named. Criterion pilots entered as preliminary. Sanya pitched (LinkedIn DM) as pending co-author. Next: obtain Sanya's yes/no; on yes, share manuscript and define her section; drive HR and public-records pilots toward 20–30; keep public-records primary results in the FOIL paper only.

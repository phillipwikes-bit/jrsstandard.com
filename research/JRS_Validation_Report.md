# The Justification Review Standard: Validation Report

### A consolidated evidence dossier for the JRS Evidence Development Program

**Version 1.0 · 2026-07-13 · Confidential**

*Prepared for diligence by prospective acquirers, licensees, and research partners.*

*Phillip Wikes · JRS™ · jrsstandard.com*

---

## Confidentiality and integrity statement

This document is confidential and is prepared for named recipients under diligence. It is not for public distribution.

Every quantitative claim in this report is scoped to what the underlying data supports, and each figure is traceable to a collected dataset held in the study database. Where a result is preliminary or an analysis is not yet run, the report says so plainly rather than presenting a partial number as a settled one. The Justification Review Standard (JRS) is in an operational validation phase. No claim of proven effectiveness, legal sufficiency, or guaranteed outcome is made anywhere in this report. The value of JRS today is a credible standard, a working instrument, a disciplined and pre-registered evidence program, an independent international reviewer panel, and a set of transferable assets, with the upside that the validation data continues to accrue.

The integrity rule that governs this program is simple: only real, verifiable claims. A benchmark asset whose central promise is documentation defensibility cannot survive diligence on a fabricated figure, so none is offered.

---

## Executive summary

JRS is a pre-finalization review standard. It evaluates whether the documented basis for a consequential decision can be independently reconstructed from the record alone, before that record becomes the only witness to the decision. The risk it names, Decision Reconstruction Risk (DRR), sits upstream of audits, appeals, investigations, regulatory review, and litigation, and it is intensified by AI-assisted drafting that produces fluent records without guaranteeing that the basis for a conclusion is actually present.

The evidence for JRS is built as a ladder of separate, honestly reported claims. The report documents each rung and its current status:

- **Reproducibility (Rung 1): reported.** Three independent large language models from three different vendors, applying JRS to the same constructed records, agreed on the read 84% of the time across 15 records.
- **Reliability (Rung 2a): reported and clearing the pre-registered floor.** Independent human reviewers reached substantial chance-corrected agreement, Gwet's AC1 of 0.74 among experts and 0.63 among trained reviewers, across 10 records and 108 labels. The reviewer coefficient meets the pre-registered floor of 0.61; the expert coefficient exceeds it.
- **Accuracy (Rung 2b): in progress, with the answer key already verified.** A 24-record detection set carries a held-out answer key that was independently reproduced 24 of 24 by raters blind to the intended labels, removing author circularity. Reviewer completion is accruing (7 of 26 registered reviewers have completed the full read); the accuracy estimate is deferred until the pre-registered sample completes.
- **Controlled comparison (Arm B): designed and live, not yet analyzed.** A randomized JRS-versus-unaided design is deployed to test whether JRS improves on unaided review.
- **Construct validity and criterion validity: located as future rungs**, with data accruing for the latter.

The program is pre-registered: hypotheses, measures, rater targets, statistics, and decision thresholds were fixed before data collection, so the reproducibility and reliability results are confirmatory rather than post-hoc. The reliability and reproducibility methodology, including the chance-corrected framework and the pre-set agreement floors, is a contribution of a model-validation professional at a Big Four firm.

The single honest gap is commercial, not scientific: JRS has strong early validation and a scattered but real asset base, and its binding constraint is demonstrated demand. This report consolidates the scientific and asset story so that a buyer can evaluate what is actually here.

---

## 1. Purpose and scope of this report

This report exists to pull the JRS evidence into one referenceable document. The program has generated a pre-registered analysis plan, an answer-key verification packet, draft manuscripts, a reproducibility engine, a reviewer panel, and a live web product surface. Those artifacts are individually sound but scattered. Diligence needs a single dossier that states what has been measured, how, with what result, and what remains open.

The report covers the standard itself, the evidence ladder and its current status, the pre-registration and integrity controls, the reviewer panel and its governance, the data and privacy architecture, the methodology advisory, and a full and honest limitations section. It closes with a roadmap to full validation and an asset summary for diligence.

Scope boundaries, stated up front:

- This report concerns constructed records for the reproducibility, reliability, and accuracy analyses. It does not claim performance on real, non-constructed records; that is a later rung.
- Reproducibility and reliability are distinct from accuracy, and all three are distinct from validation of value or effectiveness. The report keeps these separate throughout and does not let one stand in for another.
- No legal, compliance, or effectiveness guarantee is expressed or implied. JRS evaluates whether a record can explain a decision; it does not certify that the decision was correct, lawful, or that it will survive challenge.

---

## 2. The problem: Decision Reconstruction Risk

Organizations are asked to defend decisions, not documents. When a consequential decision is challenged long after it is made, the record becomes the only witness. If the record cannot explain why the decision was made, exposure follows regardless of whether the decision was sound.

Decision Reconstruction Risk (DRR) is the condition in which a record cannot, on its own terms, allow an independent reviewer to reconstruct the basis for a consequential decision. DRR is a property of the record, not of the decision. A correct decision can carry high DRR if its basis was never written down in a way a later reader can follow, and a poor decision can carry low DRR if its reasoning is fully traceable. JRS scores the record's reconstructability, and it deliberately does not score the merits of the decision. That scoping is what keeps the claims defensible.

DRR has become more acute because AI-assisted drafting produces records that are fluent, complete-looking, and confident without any guarantee that the reasoning connecting evidence to conclusion is present. A reader cannot tell, from fluency alone, whether a record is grounded in identifiable source evidence or is a plausible narrative with no traceable basis. The DRR framing gives that distinction a name, a scale, and a review procedure.

The coined vocabulary is itself an asset. DRR, the five conditions, the three-read determination scale, and the seven AI failure modes form an ownable problem category. Category ownership, defended by trademark, is the most durable part of the asset regardless of how the validation matures.

---

## 3. The standard: conditions, determinations, and the Decision Defensibility Score

JRS evaluates a record against five conditions:

1. **Reconstructability.** Can an independent reviewer reconstruct the basis for the decision from the record alone, without access to the author?
2. **Basis identification.** Is the basis for the conclusion actually identified in the record, rather than assumed or implied?
3. **Chronology.** Is the sequence of events and evidence dated and ordered so that the decision's timeline can be followed?
4. **Decision-process traceability.** Can the path from evidence to reasoning to conclusion be traced through the record?
5. **Evidentiary sufficiency.** Is the evidence cited in the record sufficient, on its own terms, to support the stated conclusion?

Each record receives one of three determinations: **Ready**, **Needs work**, or **Gap**. For the detection analysis, the scale is collapsed to a binary distinction, grounded versus ungrounded, equivalently Ready versus not-Ready, so that reads can be scored against a verified key.

The five conditions resolve into a single calibrated judgment, the **Decision Defensibility Score**, a rating from 1 to 5 of how well a record alone explains a decision. The Score is the teachable, licensable instrument: it is what a trained reviewer produces, what the Academy teaches, and what the review engine computes. It rates the record's ability to explain the decision, not the correctness or lawfulness of the decision itself.

---

## 4. The seven AI failure modes

JRS names seven recurring ways in which AI-assisted records fail reconstruction. They function as a checklist for the reviewer and as a diagnostic vocabulary for the category:

1. **Fluent groundlessness.** The record reads well and reaches a confident conclusion, but no identifiable source evidence supports it.
2. **Basis substitution.** A summary or paraphrase stands in for the underlying evidence, so the reader cannot verify the claim.
3. **Chronology collapse.** Events and evidence are asserted without a dated sequence, so the timeline cannot be reconstructed.
4. **Reasoning elision.** The path from evidence to conclusion is skipped; the record states the result without the connective reasoning.
5. **Confident underspecification.** The record is definite in tone but vague in substance, giving the appearance of completeness without its content.
6. **Evidentiary overreach.** The cited evidence does not actually support the strength of the stated conclusion.
7. **Untraceable authority.** The record cites a rule, precedent, or source that cannot be located or checked from the record itself.

These modes are the observable symptoms of DRR. They convert an abstract risk into concrete things a reviewer can point to, which is what makes the standard teachable and the reads consistent.

---

## 5. The evidence development program

Validation proceeds as a ladder. Each rung answers exactly one question, and no rung is allowed to borrow credibility from a later one:

```
        JRS Evidence Development Program

   Rung 1   Reproducibility     do independent AI models apply JRS alike?      [84%, 15 records]  REPORTED
     |
   Rung 2a  Reliability         do independent human reviewers agree?          [AC1 0.74 / 0.63]  REPORTED
     |
   Rung 2b  Accuracy            do reads match a verified key?                 [key verified 24/24; reads accruing]
     |
   Arm B    Controlled compare  does JRS beat unaided review?                  [designed, live, not analyzed]
     |
   Construct validity           are the five conditions distinct dimensions?   [data ready]
     |
   Rung 3   Criterion validity  do flagged records fail in real cases?         [cases accruing]
     |
   External validity            does it hold on real, non-constructed records? [future]
```

The discipline of the ladder is the point. Reliability is a prerequisite for accuracy, and accuracy is a prerequisite for any claim of value. Reporting them in order, each against a pre-set threshold, is what lets a buyer trust the numbers that are reported and correctly discount the ones that are not yet in.

---

## 6. Pre-registration and analytic integrity

Before batches 3 and 4 were labeled, the program registered a written analysis plan that fixed, in advance, the hypotheses, measures, rater targets, statistics, and decision thresholds. The plan states that no change will be made after the data are inspected and that any deviation will be documented and labeled exploratory. This is what makes the reproducibility and reliability results confirmatory rather than post-hoc.

The core of the plan is two pre-set decision floors:

- **Floor 1, Reliability.** The claim that reviewers apply the five conditions consistently is supported only if Gwet's AC1 among the expert panel, on the pooled record set, is at least 0.61 (substantial) with the lower bound of its 95% confidence interval at least 0.41 (moderate). Below that, the reliability claim is reported as not supported.
- **Floor 2, Detection and accuracy.** The claim that reviewers distinguish reconstructable from non-reconstructable records is supported only if agreement with the held-out key on the 24-record set, on the binary distinction, exceeds chance with the lower 95% bound above 0.50 and reaches a pre-set target of at least 0.70.

The plan also fixes the primary statistic (Gwet's AC1, chosen for robustness to the kappa paradox under skewed marginals), the secondary statistics reported alongside it (Krippendorff's alpha and Fleiss' kappa), the blinding and independence procedures, the exclusion rules, and an explicit list of what would weaken or falsify each claim. Meeting a floor supports the corresponding claim as stated; failing a floor is reported plainly as a null or weak result and is not reinterpreted.

Analyses are run only after data lock. The pre-registration is the reason a diligence reviewer can treat the reported figures as evidence rather than as favorable selection.

---

## 7. Rung 1: Reproducibility

**Question.** Do independent AI models, from different vendors, apply JRS to the same record in the same way?

**Method.** Each constructed record is judged by three independent large language models, one per provider, spanning three different vendors so that the models do not share lineage and provide a stronger independence signal than same-provider variants. The measure is how often the three independent models return the same JRS read on the same record. This runs as an automated nightly study, so the figure is continuously re-checked as the record set grows rather than being a single frozen snapshot.

**Result.** Across 15 constructed records, the three independent providers agreed on the JRS read **84%** of the time (latest nightly run 2026-07-06; the history ranges 78 to 87 percent as the record set expanded from 3 to 15 records).

**Interpretation, stated carefully.** This is a reproducibility signal only. It shows that independent models apply the read consistently. It does not show that the read is correct, and it is not a validation claim. Chance-corrected coefficients on the model votes are noted as a still-to-be-added refinement. The value of the result is that a standard applied consistently by independent systems is a standard with an objective core, not one that depends on a single interpreter.

A self-updating cross-vendor reproducibility engine is itself a transferable asset: it demonstrates that the standard's core distinction is machine-checkable and it produces a live, dated reproducibility figure on an ongoing basis.

---

## 8. Rung 2a: Reliability

**Question.** Do independent human reviewers, applying the five conditions to the same records, reach the same determinations?

**Method.** Independent raters applied the five JRS conditions to a shared set of records, recording a determination (Ready, Needs work, or Gap) for each. Raters worked independently, without access to one another's ratings. Raters designated as experts are analyzed separately from trained reviewers. Agreement was assessed with Gwet's AC1 as the primary chance-corrected coefficient, with raw percent agreement reported alongside.

**Result.** Across 10 records:

| Rater group | Records | Mean raters per record | Raw agreement | Gwet's AC1 |
|---|---|---|---|---|
| Experts | 10 | 3.6 | 88% | **0.74** |
| Trained reviewers | 10 | 7.2 | 83% | **0.63** |

Both coefficients fall in the substantial range (0.61 to 0.80 on the Landis and Koch convention behind the pre-registered floor of 0.61). The reviewer coefficient of 0.63 clears the floor; the expert coefficient of 0.74 exceeds it. Across all determinations in this mode (108 labels), the distribution was Gap 69 percent, Needs work 18 percent, Ready 13 percent, consistent with a record set deliberately weighted toward reconstructability problems.

**Interpretation.** This is the substantive finding of the current stage. Independent raters, expert and trained, apply JRS with substantial chance-corrected agreement, and the reviewer coefficient meets the threshold set in advance. That supports the claim that JRS is applied consistently rather than idiosyncratically. Reliability is necessary but not sufficient for the accuracy and value questions that follow: before a review method can be evaluated for accuracy, independent reviewers must first demonstrate that they apply it consistently. The finding establishes a methodological foundation, not a final validation.

The estimate rests on 10 records; a larger set would tighten it. That limitation is reported rather than hidden, and precision in the broader design comes from pooling items across batches rather than from a large rater count within any single batch.

---

## 9. Rung 2b: Accuracy and the verified answer key

**Question.** Do reviewer reads match a held-out, independently verified answer key?

**The detection set.** A separate 24-record set was constructed with 12 grounded records (a documented basis is present) and 12 ungrounded records (fluent but unsupported). The records were built so that a known evidentiary characteristic, the presence or absence of an identifiable documented basis, is systematically controlled and knowable in advance.

**Answer-key verification, already executed.** The credibility of any accuracy figure depends entirely on the key not being the framework author's private judgment. To remove that circularity, three independent raters, each blind to the study's hypotheses and to the intended construction labels, were given only the operational rule and the 24 records and asked to classify each as grounded or ungrounded, working independently.

- Inter-rater agreement was **100%**: all three raters assigned identical labels on all 24 records.
- Agreement with the intended construction key was **24 of 24 (100%)**: the verified key equals the intended key, with no divergence.
- Chance-corrected reliability at this level is 1.00 across AC1, Krippendorff's alpha, and Fleiss' kappa, on a balanced 12-and-12 split with both categories present.

**Disclosure, stated for the record.** The three raters in this verification pass were independent large-language-model instances applying the objective operational rule, not human raters. The operational rule is designed so that any competent person can apply it and check the result, which makes this a legitimate first-pass verification that removes author circularity: the key is reproduced by raters who never saw the intended labels. For the peer-reviewed write-up, the plan is to replicate with one or two human raters using the blind verification packet, and to report the human result as the gold standard. This pass establishes that the distinction is objectively determinable rather than author-idiosyncratic.

**Status of the accuracy estimate.** The key is fixed and verified. Reviewer completion is accruing: of 26 registered reviewers, 7 have completed the full 24-record read, and additional reads are in progress. A full accuracy estimate, with sensitivity, specificity, and confidence intervals, is deferred until the pre-registered reviewer sample completes. Early completions are consistent with above-chance separation and are reported here as preliminary, not as a confirmed result. Under the integrity rule, the accuracy figure will not be published until it clears the pre-registered Floor 2 or is reported as failing it.

What the verified key settles now is important on its own: the grounded-versus-ungrounded distinction on this set is reproducible by raters blind to the intended labels, so the key against which reviewer accuracy will be scored is not the author's private call. That is a hard-to-copy asset, a benchmark dataset with an independently reproduced answer key.

---

## 10. The Arm B controlled comparison

**Question.** Does a reviewer using JRS reach better reads than a reviewer working unaided, on the same records?

**Design.** Arm B is a randomized comparison deployed as a live study surface. A reviewer's assigned code is hashed to one of two arms: one arm applies JRS to the records (the JRS arm), the other reviews the same records without the standard (the unaided arm). The assignment is deterministic from the code and is never steered by hand. Codes are handed out in sequence from a fixed batch balanced across the two arms. A reviewer in the unaided arm is required to be JRS-naive, with no prior exposure to the standard or the reconstructability idea, and recruits are routed to the panel track instead if they have engaged with JRS content.

**Status.** The design is fixed and the study is live in production. Assignment, balancing, and the JRS-naive requirement are in place. Analysis is not yet run: it is gated until enrollment reaches the pre-registered target with a spread of outcomes. If run to completion and if it clears its threshold, Arm B earns the strong claim that JRS improves on unaided review, which is the claim a buyer values most. Until then it is reported as designed and live, not as a result.

The reason Arm B matters for diligence is that it converts JRS from a self-consistent method into a method with a measured advantage over the status quo. It is scoped and instrumented; what it needs is completed enrollment.

---

## 11. Construct validity and criterion validity

**Construct validity (are the five conditions distinct dimensions?).** The question is whether the five conditions measure genuinely separate properties of a record rather than one underlying thing described five ways. The data to run this analysis are ready; the analysis is located as a separate workstream and is not reported here as a result.

**Criterion validity (Rung 3: do flagged records fail in real cases?).** The design scores public cases with documented outcomes, blind to the outcome, to test whether records that JRS flags for high DRR correspond to decisions that later failed under challenge. Cases are accruing. This rung depends on real-world case accrual rather than on recruitment the program controls, so it is the slowest rung and is reported as early and ongoing.

**External validity (real, non-constructed records).** All of the reproducibility, reliability, and accuracy work to date uses constructed records, chosen so that evidentiary characteristics can be controlled and known. Performance on real organizational records is a later rung and no claim about it is made here.

---

## 12. The reviewer panel

The validation program is carried by an independent panel of credentialed reviewers recruited across professional networks, not by the founder alone. That independent bench is one of the hardest parts of the asset to reproduce, and it is the source of the reliability and accuracy evidence.

**Composition.** 26 credentialed reviewers are registered across roughly a dozen countries, spanning AI governance and assurance, ethics and compliance, internal audit, investigations, data protection, and records management. The registered domains include ISO/IEC 42001 auditing, model validation, financial-crime audit, and global data-protection practice. Seven reviewers have completed the full 24-record blind read against the verified key; the remainder are in progress or not yet started. The panel spans multiple continents, which strengthens the claim that the standard is applied consistently across jurisdictions and professional traditions rather than within a single office.

**Governance of attribution.** Two rules govern how the panel is represented, and both are enforced:

- **Acknowledgment is not endorsement.** Naming a reviewer reflects participation in the validation study only. Reviewers are credited as independent reviewers or contributors, never as endorsers or validators of JRS. Attribution is opt-in, each reviewer approves the exact public wording before it appears, and any reviewer may withdraw before publication.
- **Authorship policy.** Reviewers who complete the study are recognized as named contributors only, in the certificate, the named panel, and the acknowledgments of any write-up. They are not offered co-authorship. Co-authorship is reserved for specific collaborators doing substantial analysis or writing.

In this report the panel is presented by count, country, and professional domain rather than by name, consistent with the opt-in attribution rule. A named roster is available to a diligence recipient under a confidentiality agreement and with reviewer consent.

The governance itself is a diligence asset. An unpaid international panel with a clear, enforced attribution and non-endorsement policy is defensible; the same panel without that policy would be a late-diligence liability. Formalizing contributor IP agreements while the relationships are warm is a named next step in the program.

---

## 13. Data integrity and privacy architecture

The evidence is only as good as the controls on the data behind it. The program runs on a hosted Postgres backend with a static front end and a small set of server-side functions, and the controls are built so that the sensitive assets stay protected by construction rather than by convention.

- **Gated writes.** Reviewer reads, expert registrations, and enrollment records are written through server-side functions that hold the privileged key, never from the browser. The front end cannot write privileged tables directly.
- **Row-level security with no public read.** The tables that hold reviewer answers, expert identities, download rows, and enrollment PII have row-level security enabled with no anonymous read policy. An anonymous read of these tables returns an empty result, verified. Only the server-side service role can read the personal data.
- **Aggregate-only public views.** The private dashboard and the public data room read only aggregate views that expose counts, never personal fields. Names, titles, emails, and individual answers never appear in a public export.
- **De-identification screening.** Free-text inputs pass a sensitive-identifier screen before submission, and the deployed views are de-identified by design.
- **The answer key stays private.** The verified answer key is never served to the public site. The research directory that holds the key and internal documents returns not-found on production, verified. Exposing the key would destroy the benchmark, so it is protected structurally.
- **Secret hygiene.** The AI provider key used by the review engine lives only in the server environment and never appears in any committed file or any client response. The health endpoints report only whether a key is present, never its value.
- **Reproducible schema.** The entire data layer is captured in a single idempotent migration file that can be reapplied without harm, so the backend is reconstructable and auditable rather than hand-built and opaque.

For a buyer, this architecture is the difference between a dataset that survives a security and privacy review and one that does not. The PII that the program collects (consented training enrollments and reviewer contact details) is held privately and is transfer-ready, and the sensitive research asset, the answer key, is structurally withheld from the public surface.

---

## 14. Methodology advisory

The reliability and reproducibility methodology is not ad hoc. The reference-panel design and the chance-corrected reliability framework, including the joint use of Gwet's AC1, Krippendorff's alpha, and Fleiss' kappa, the explicit treatment of the kappa paradox under skewed marginals, and the pre-registered agreement floors, are methodological contributions of Ubayet Hossain, FRM, Associate Director for Model Validation at KPMG India. Statistical analyses are completed before interpretation of findings.

The proportionality principle referenced in the standard was surfaced by a pilot reviewer, a general manager and APAC business leader, and is credited with permission. Responsibility for the framework as presented rests with the author.

The presence of a Big Four model-validation professional behind the reliability framework is a credibility anchor for the numbers: the coefficients were chosen and the floors were set by someone whose profession is validating models, not by the framework's author reaching for a favorable statistic after the fact.

---

## 15. Limitations, stated plainly

The program reports its limitations rather than hiding them, because honestly bounded claims are the asset.

- **Constructed records, not real ones.** All reproducibility, reliability, and accuracy work to date uses constructed records. External validity on real organizational records is a later rung and is not claimed.
- **Modest samples.** Reliability rests on 10 records; the detection set is 24 records with reviewer completion still accruing. These counts yield wider confidence intervals, which are reported honestly. Precision is obtained by pooling items across batches, not by large rater counts within a batch.
- **Accuracy is preliminary.** No confirmed accuracy claim is made. The key is verified, but the reviewer sample has not completed, so the accuracy estimate is deferred.
- **Reproducibility is raw agreement.** Rung 1 reports raw cross-vendor agreement; chance-corrected coefficients on the model votes are a planned refinement.
- **Answer-key verification used AI raters.** The first-pass key verification used independent AI raters applying an objective rule. Human replication with the blind packet is planned and is the standard the peer-reviewed write-up will report.
- **Arm B is not analyzed.** The controlled comparison is designed and live but has not reached its enrollment target, so no advantage-over-unaided claim is made yet.
- **Single research group.** The framework is applied by a single research group; independent replication by another group is future work.
- **Commercial proof is the binding gap.** No organization is yet using JRS in production. This is a demand gap, not a scientific one, and it is the constraint that most limits value today.
- **No effectiveness claim.** Nothing here establishes that JRS improves organizational outcomes, reduces litigation risk, or increases decision quality. Those questions require separate evaluation.

---

## 16. What would weaken or falsify the claims

The program states its own failure conditions in advance:

- If Gwet's AC1 had fallen below Floor 1, reliability on constructed records would be reported as not supported. It did not; the reviewer coefficient met the floor and the expert coefficient exceeded it.
- If detection accuracy does not clear Floor 2 when the reviewer sample completes, the discrimination claim will be reported as not supported.
- If a material gap emerges between expert and non-expert reliability, the reliability claim is bounded to trained experts and reported as such.
- If Arm B, when analyzed, shows no advantage over unaided review, that null is reported and the value claim is not made.
- If human replication of the answer key diverges from the AI first pass, the divergence is reported and the key is revised.

A program that names the conditions under which it would report a null is a program whose positive results carry weight.

---

## 17. Roadmap to full validation

The remaining path is ordered and mostly within the program's control:

1. **Complete the detection panel** to the pre-registered reviewer target and run the gated accuracy analysis against the verified key.
2. **Run Arm B to its enrollment target** and analyze the JRS-versus-unaided comparison.
3. **Run the construct-validity analysis** on the ready data to test whether the five conditions are distinct dimensions.
4. **Replicate the answer key with human raters** using the blind packet, for the peer-reviewed write-up.
5. **Accrue criterion-validity cases** with documented real-world outcomes, scored blind.
6. **Post a preprint** of the DRR concept and the pre-registered protocol to timestamp the category and the design.
7. **Move to external validity** on real, non-constructed records with documented outcomes.

In parallel, the highest-value non-scientific moves are a real-organization pilot (the demand signal a buyer weighs most heavily), trademark filing on the category vocabulary, and signed contributor IP agreements with the panel.

---

## 18. Asset summary for diligence

What transfers, beyond the standard itself:

- **A coined, ownable category:** DRR, the five conditions, the three-read scale, the Decision Defensibility Score, and the seven AI failure modes.
- **A benchmark dataset:** the 24-record detection set with an independently reproduced answer key.
- **A self-updating reproducibility engine:** the nightly cross-vendor run and its live figure.
- **An independent international reviewer panel:** 26 credentialed reviewers across roughly a dozen countries, with enforced attribution and non-endorsement governance.
- **A model-validation methodology** authored by a Big Four validation professional.
- **A finished Investigator Field Guide line** in three domains, favorably mentioned in writing (as a mention, not an endorsement) in Dewey Publications' News and Case Alert, a federal civil-service law newsletter.
- **A live product surface:** training and certification, a versioned partner review API, an enterprise page, and private and public dashboards.
- **A disciplined evidence program:** pre-registered plan, verified key, and honest, gated reporting.
- **A protected data and privacy architecture** that holds PII and the answer key privately by construction.

The scientific story is early but real and honestly reported. The asset story is substantial and, until now, scattered. The binding constraint is demonstrated commercial demand, and closing it is the single move that most raises the value of everything above.

---

## Appendix A: The verified answer key

The 24-record detection key, fixed and verified 24 of 24 by raters blind to the intended labels. Grounded records (12): R01, R04, R06, R08, R10, R12, R14, R16, R18, R20, R22, R24. Ungrounded records (12): R02, R03, R05, R07, R09, R11, R13, R15, R17, R19, R21, R23. The key is held privately and is not served on the public site.

## Appendix B: The pre-registered decision floors

- **Floor 1, Reliability:** expert Gwet's AC1 at least 0.61 with the lower 95% bound at least 0.41. Result: met (experts 0.74; reviewers 0.63).
- **Floor 2, Detection and accuracy:** binary agreement with the verified key above chance with the lower 95% bound above 0.50, reaching at least 0.70. Status: pending reviewer completion.
- **Rung 1 threshold:** a reproducibility claim requires AC1 of at least 0.61; raw cross-vendor agreement of 84% reported, chance-corrected coefficient to be added.

## Appendix C: Panel composition (de-identified)

26 registered reviewers across roughly a dozen countries, spanning AI governance and assurance, ethics and compliance, internal audit, investigations, data protection, and records management. Seven have completed the full 24-record read. Registered credentials in the panel include ISO/IEC 42001 auditing, FRM model validation, CFE fraud examination, and CIPM, AIGP, and CIPP data-protection certifications. A named roster is available under a confidentiality agreement, with reviewer consent, consistent with the opt-in attribution policy.

## Appendix D: Supporting document register

The following internal artifacts support this report and are available to a diligence recipient under a confidentiality agreement: the pre-registered analysis plan; the answer-key verification packet; the reliability and reproducibility write-up; the detection study manuscript in preparation; the Arm B design note; the construct-validity package; and the de-identified study database schema.

---

*© 2026 Phillip Wikes · JRS™ · jrsstandard.com. Confidential validation dossier. Reproducibility and reliability figures are computed from collected data; accuracy is preliminary and gated; no claim of validated effectiveness is made.*

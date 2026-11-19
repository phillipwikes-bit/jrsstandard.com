# Can Professional Reviewers Detect Unsupported Conclusions in AI-Generated Decision Records? A Controlled Study

**DRAFT FOR AUTHOR REVIEW, 2026-10-26. Not approved by either author. Not for submission until both authors have approved the text and the target journal has answered the ethics inquiry.**

---

## Abstract

Generative AI now drafts many of the records that document consequential organisational decisions. Such records can read as complete while the evidence and reasoning behind their conclusions are missing from the page, and a record of that kind cannot be independently reviewed or contested. Before review of this property can serve as a governance control, it has to be shown that reviewers can detect it. This study asked whether professional reviewers can distinguish supported from unsupported conclusions in AI-generated decision records. Sixteen reviewers in 11 countries independently classified 24 constructed records, 12 with documented support for their conclusions and 12 without. Reviewers were blind to a reference classification that the first author fixed before verification and that three automated raters, working without access to it, reproduced on all 24 records. The study produced 384 judgments. Mean reviewer-level accuracy was 83.9% (95% CI 72.7 to 95.1), above a pre-registered threshold of 70%, with sensitivity of 87.0% and specificity of 80.7%. Individual accuracy ranged from 37.5% to 100%, and an exploratory mixed-effects analysis attributed most of the modelled variation to reviewers rather than to records. In a separate reliability analysis, chance-corrected agreement met its pre-registered point estimate but not its pre-registered lower confidence bound. The result is a group-level finding: reviewers as a panel detected the distinction, but individual reviewers could not be relied on to do so. Organisations that rely on single-reviewer checks of AI-drafted records should not assume panel-level accuracy. The study does not establish performance on ambiguous or real records, independent validity of the reference classification, or any benefit of a structured review instrument.

**Keywords.** AI-generated documentation; decision records; reviewer judgment; inter-rater reliability; accountability; measurement

---

## 1. Introduction

Organisations increasingly use generative AI to draft the records that document consequential decisions: employment determinations, investigation findings, compliance conclusions and public-records responses. These records are what later accountability examines. When a decision is challenged by a complaint, an audit or a regulator, the reviewer usually cannot question the person who made it and reads the record instead.

Language models produce fluent, professional text, and fluency is separable from evidentiary grounding [4, 14]. A model-drafted record can therefore present a conclusion in the register of a well-founded one while the evidence and reasoning that would justify it never appear on the page. A reader's ordinary cues for a weak record, such as hedging, disorganisation or an informal register, are exactly the cues that fluent drafting removes.

Existing AI governance instruments mostly take the system, the dataset or the organisational process as their object [11, 17, 18, 20]. Cobbe, Lee and Singh [8] argue that automated decision-making should be built to be reviewable, with the record-keeping needed for later scrutiny designed in. This paper addresses a narrower and prior question about the record itself. If reviewing whether a record carries the basis for its conclusion is to serve as a control, reviewers must first be able to tell records that do from records that do not. If they cannot, a control built on that review has no empirical footing.

We therefore ask one question:

> **Can independent professional reviewers distinguish supported from unsupported decision conclusions in AI-generated records, judged against a pre-specified classification?**

The answer has two parts, and the second matters as much as the first. As a panel, the reviewers did distinguish the two classes, above a threshold set in advance. As individuals, they varied so widely that panel accuracy says little about any one reviewer, and a pre-registered reliability criterion was not met. Section 2 defines the property studied. Section 3 describes the design, Section 4 the results, Section 5 what they mean for review practice, and Section 6 what the study cannot show.

## 2. The property studied

We call a conclusion *supported* when an independent reviewer can identify, from the record alone, the evidence it rests on and follow the reasoning from that evidence to the conclusion. We call it *unsupported* when the record states the conclusion without that basis, so that the reviewer cannot reconstruct why the decision went the way it did. We refer to the risk created by unsupported records as Decision Reconstruction Risk (DRR).

The property is relative to a reviewer. Whether a record can be reconstructed depends on who reads it and what they may legitimately bring to it. We fix the standpoint as an independent reviewer who is competent in the domain, has the record and generally available domain knowledge, and has no access to the original decision-maker or to material outside the record. Every judgment in this study was made from that standpoint.

Supported is not the same as correct. A supported record can reach a wrong conclusion that a reader can see and challenge, and an unsupported record can reach a right conclusion that no reader can verify. The property is also distinct from completeness against a checklist, from whether the organisation as a whole could account for the decision with access to its systems and staff, and from whether the person the record describes can understand it. This study measures only the first: whether a competent outside reviewer can reconstruct the basis from the record.

The property matters because several interests depend on it. A person cannot meaningfully contest a decision whose reasoning is unavailable [7, 15]. An organisation cannot explain and justify a decision to an accountability forum if it cannot reconstruct that decision itself [5]. Transparency as visibility is not sufficient for accountability [1]; a record can be entirely readable and still not show the basis of its own conclusion.

The operational definition is the authors'. A finding that reviewers recover it shows that the distinction is recognisable to independent professionals. It does not show that the distinction corresponds to a phenomenon independent of the definition, a gap that Jacobs and Wallach [13] identify as especially easy to overlook in computational settings. Section 6 returns to this.

## 3. Methods

### 3.1 Design

A detection study. Independent professional reviewers classified a balanced corpus of constructed records, and their classifications were scored against a pre-specified reference classification. The protocol, analysis plan and decision thresholds were registered before data collection, and data closed on 15 August 2026. There is no comparison arm in this study. A separate randomised study, using the same corpus and different participants, compares review with and without a structured instrument; it is reported separately, and nothing in this paper bears on that comparison.

### 3.2 Corpus

The corpus comprises 24 constructed, de-identified records from high-stakes documentation contexts: human resources and employment, investigations, compliance and audit, public records, and AI-assisted summaries. Twelve records are supported, meaning their conclusions rest on content present in the record. Twelve are unsupported, meaning their conclusions read as complete but lack a reconstructable basis. Records were presented unlabelled and in randomised order.

Every record was generated with large-language-model assistance and then edited by the first author to instantiate its intended class. No record derives from a real case, person or organisation. A record-level construction log sufficient to reconstruct the generation of each record (model and version, date, prompt and extent of human editing) was not retained.

The corpus is deliberately bimodal. Records were built at the two ends of the severity range so that the detection question could be asked cleanly. Real documentation is continuous, and a corpus concentrated at the extremes makes classification easier than the operational task, in the same way that a diagnostic test evaluated on clear-cut cases overstates its field performance [19, 21]. The accuracy reported here should not be read as an estimate of performance on ordinary records.

### 3.3 Reference classification

Before verification began, the first author recorded a classification for each record, with the specific evidentiary defect or support that determined it. This document was time-stamped and was not revised afterwards.

Three separate large-language-model instances then classified all 24 records under the operational rule, without access to the intended labels or to one another, producing 72 classifications. All three reproduced the intended classification on all 24 records, so the pre-specified adjudication step was not triggered and no label changed. The pre-registered procedure specified two passes with conditional adjudication; three were run.

This check shows that the classification follows reproducibly from the operational rule, and it rules out the reference having been fitted to reviewers' responses after the fact. It is not independent validation. The automated raters were briefed by the authors on what the two classes mean, so the reference is independent of the results but not of the construct. No human has independently replicated the reference classification. Unanimity on 24 of 24 records is also further evidence that the corpus contains clear cases.

### 3.4 Participants

Reviewers were credentialed practitioners and researchers in AI governance, compliance, audit, human resources, investigations, data privacy, records management and law, recruited through professional networks. At data lock, 16 reviewers had completed all 24 records. They worked in 11 countries on 5 continents: Australia, Germany, India, Nigeria, Poland, Singapore, South Korea, Spain, the United Arab Emirates, the United Kingdom and the United States. Eleven further reviewers accepted an invitation but did not begin.

Reviewers were blind to the reference classification, to one another's judgments, and to the composition of the corpus, including that it was balanced. They took part unpaid and in a personal capacity. The panel self-selected for interest in documentation governance and is not a probability sample of any population.

### 3.5 Analysis

Accuracy was computed per reviewer, and the panel estimate is the mean of the 16 reviewer accuracies with a Student t interval, treating reviewers as the independent sampling units. Treating each of the 384 judgments as independent would understate uncertainty, because judgments from one reviewer reflect one person applying one threshold. For each reviewer and record, the latest submission was used. The pre-registered exclusion rule (fewer than 18 of 24 records completed) excluded no one. Of 385 stored rows after de-duplication, one was an administrative marker rather than a judgment and was excluded, leaving 384 scorable judgments.

**Pre-registered detection criterion.** The lower 95% confidence bound must exceed 0.50, the chance rate on a balanced corpus, and the point estimate must reach at least 0.70. The 0.70 target was a pragmatic floor set before data collection. It is not derived from a cost model, and readers can apply their own threshold to the reported interval.

**Exploratory crossed model.** After pre-registration we added a mixed-effects logistic model with crossed random intercepts for reviewer and record, `correct ~ 1 + (1 | reviewer) + (1 | record)` [2, 3], fitted by Laplace-approximated maximum likelihood with profile-likelihood intervals, to separate reviewer variation from record difficulty. It is labelled exploratory throughout and does not bear on the pre-registered criterion.

### 3.6 Reliability analysis

Reliability was assessed separately, in a sample in which raters applied a five-condition review instrument to a shared record set. Raters were either invited directly or enrolled through an open review page; the two groups are reported separately because they reached the study by different routes, not because they differ in expertise. Agreement on the overall determination was estimated with Gwet's AC1 [12] as the pre-specified primary coefficient, chosen for robustness to the prevalence paradox under skewed category distributions [6, 9], with Krippendorff's alpha [16] and Fleiss' kappa [10] computed alongside. The pre-registered criterion had two parts: a point estimate of at least 0.61 and a lower 95% confidence bound of at least 0.41.

Only labels recorded under the five-condition instrument were analysed, one per rater per record, keeping the latest. Sixteen labels recorded by raters working under an unstructured baseline prompt were excluded, because they answered a different question with a different instrument. Including them would measure agreement between two methods rather than the reliability of one.

## 4. Results

### 4.1 Detection

| Measure | Result |
|---|---|
| Mean reviewer-level accuracy | 83.9% |
| 95% CI (participant level, n = 16) | 72.7 to 95.1 |
| Sensitivity (unsupported records correctly identified) | 87.0% |
| Specificity (supported records correctly identified) | 80.7% |
| Pre-registered criterion: point estimate at least 70% | Met |
| Pre-registered criterion: lower bound above 50% | Met |

The pre-registered detection criterion was met on both parts. Sensitivity exceeded specificity by about six points. The difference is reported as a direction only: the paired data needed to test it were not retained in a form that supports a paired test.

### 4.2 Individual reviewers

| Measure | Mean | SD | Range across reviewers | Reviewers at 100% |
|---|---|---|---|---|
| Accuracy | 83.9% | 21.0 | 37.5 to 100 | 6 of 16 |
| Sensitivity | 87.0% | 24.2 | 25.0 to 100 | 11 of 16 |
| Specificity | 80.7% | 25.8 | 16.7 to 100 | 7 of 16 |

Six reviewers classified every record correctly, and 11 of 16 identified every unsupported record. At the other end, at least one reviewer scored below the 50% chance rate. The low scorers' responses were examined for straight-lining, uniform responding and missing data; they showed varied judgments across records and complete data, and they are retained.

The records varied far less than the reviewers. Record-level accuracy ranged from 62.5% to 93.8%, and every record was classified correctly by at least 10 of the 16 reviewers. In the exploratory crossed model, the reviewer standard deviation on the logit scale was 1.769 (profile 95% interval 1.292 to 3.000), giving a latent-scale reviewer intraclass correlation of 0.488. The record standard deviation was estimated at the boundary, 0.011 (interval 0.001 to 0.556). That boundary estimate does not show that records are equally difficult: with 24 records the record component is weakly identified, and its interval allows a moderate effect. The defensible reading is that, on this corpus, variation between reviewers was substantially larger than variation between records. Modelling record difficulty did not materially change the performance estimate: the model places an average reviewer on an average record at 89.2%.

### 4.3 Reliability

Of 25 reliability participants, 22 contributed labels under the five-condition instrument: 8 invited and 14 open-enrolment raters. Three open-enrolment raters contributed only under the baseline prompt and were excluded. Agreement can be estimated only where a record has two or more raters; 10 records met that condition, carrying 113 determinations, reduced to 104 after keeping one label per rater per record.

| Group | Records | Labels | Raters | AC1 | 95% CI (analytic, pre-specified) | 95% CI (bootstrap, sensitivity) |
|---|---|---|---|---|---|---|
| Invited | 10 | 36 | 8 | 0.739 | 0.402 to 1.000 | 0.427 to 1.000 |
| Open enrolment | 10 | 68 | 14 | 0.623 | 0.252 to 0.993 | 0.285 to 0.894 |

**The pre-registered reliability criterion was not met.** Both point estimates exceed 0.61. Neither analytic lower bound reaches 0.41: the invited group's is 0.402 and the open-enrolment group's is 0.252. The bootstrap interval places the invited group's lower bound at 0.427, but the analytic interval was the pre-specified construction, and choosing the interval that clears a criterion after seeing both is what pre-registration exists to prevent. The bootstrap result is reported as a sensitivity analysis only. It shows that the failure is marginal for the invited group and that the conclusion depends on how the interval is built, which itself reflects how little ten records can support. Ten records against a planned pooled set of about 26 produce intervals too wide to be informative at their lower end, and these coefficients are interim.

The exclusion of baseline-prompt labels changes the result materially. Pooling them with the analysed set reduces the open-enrolment coefficient to between 0.16 and 0.18. The exclusion rule was the one the study was designed around and was not chosen after seeing either figure.

## 5. Discussion

### 5.1 What the study shows

Independent professionals, reading AI-generated records cold and blind to the reference classification, distinguished supported from unsupported conclusions at 83.9%, above a threshold fixed in advance. The distinction is therefore recognisable to independent experts, at least at the ends of the severity range. That is a precondition for any review-based control: a property that experienced reviewers cannot identify cannot be governed by asking reviewers to identify it.

### 5.2 What it means for review practice

The more useful finding is the spread. Panel accuracy of 83.9% coexists with individual accuracy from 37.5% to 100%, and on this corpus that spread lay mainly with reviewers rather than with records. At the point of use the spread is invisible. An organisation that sends an AI-drafted record to a single reviewer cannot assume that the reviewer performs at the panel rate, and the failed reliability criterion means that dependable agreement between individual reviewers has not been shown.

The practical conclusion is specific: detecting unsupported conclusions in AI-drafted records worked as a panel-level judgment in this study, not as an individual one. A review process that relies on this judgment would need some combination of reviewer calibration, sampled double review and adjudication of disagreements, and would need to measure its own reviewers rather than borrow a panel figure. That is a design implication of the result, not a tested intervention.

### 5.3 Why AI drafting is the context, not the cause

All 24 records were AI-generated, and the study makes no comparison with human-authored records. People produce unsupported records too. The study therefore does not show that AI drafting causes unsupported conclusions, or that AI-drafted records are harder to assess than human ones. The reason for studying AI-generated records is that they are now a common and growing part of the material reviewers face, and that their fluency removes the surface cues reviewers might otherwise use. Whether that makes detection harder is an open question that needs a matched comparison.

### 5.4 What would strengthen the inference

The study is the first link in a longer chain, and the next links are defined by its limitations. In order of value:

1. **Independent reference.** A corpus generated and classified by researchers with no role in developing the construct, adjudicated without the authors' briefing.
2. **Graded severity.** Records spanning supported, partly supported, ambiguous and unsupported, so that performance can be estimated where operational judgment is hard.
3. **Reliability at adequate scale.** A reliability set large enough for informative lower bounds, with repeated assessment to separate between-reviewer from within-reviewer variation.
4. **Human-authored comparison.** Matched AI-drafted and human-drafted records, to test whether drafting source affects detectability.
5. **Incremental value.** Comparison of unaided and instrument-guided review on the same records, reported separately for this programme.
6. **Real records.** Suitably authorised real or realistically sampled records, under independent ethical review.

## 6. Limitations

**Author-constructed corpus and reference.** The first author constructed the records and fixed their classification. Automated reproduction rules out fitting the reference to the results but not dependence on the authors' definition. The finding is that the authors' distinction is recognisable to independent experts, not that it has been externally validated.

**Extreme-case design.** The corpus is bimodal and balanced. Accuracy, sensitivity and specificity should not be extrapolated to ordinary records or to the prevalence of unsupported records in practice.

**Sample.** Sixteen self-selected, credentialed reviewers. Performance among less experienced reviewers, or outside the represented domains, is unknown. With one to three reviewers per country, the study has no power to test jurisdictional or linguistic effects, and the international composition does not establish cross-cultural validity.

**Heterogeneity is described, not explained.** No analysis of its sources was pre-specified, and with 16 reviewers any comparison by domain, seniority or language would be uninterpretable.

**Reliability.** The reliability evidence is interim, rests on ten records, and failed its pre-registered lower-bound criterion.

**Provenance.** A complete record-level generation log was not retained, and per-pass execution records for the automated reference check were not retained in a form sufficient for independent reproduction of those passes.

**Ethics review.** The study was not reviewed by an institutional ethics committee (see Declarations).

**Investigator dependence.** The authors defined the construct, constructed the records, set the reference, recruited the participants and specified the analysis. The mitigations in place (a pre-registered plan and thresholds, blind automated reproduction of the reference, reviewers blind to the reference, the corpus balance and one another, participant-level analysis specified in advance, and reporting of a failed criterion) are real but do not remove that dependence. The single most useful addition would be an independent analyst, with no role in the construct's development, given the corpus, protocol and raw responses and asked to reproduce or contest the analysis.

## 7. Conclusion

This study provides preliminary evidence that professional reviewers can distinguish supported from unsupported conclusions in a controlled corpus of AI-generated decision records. Sixteen reviewers in 11 countries made 384 judgments and reached a mean accuracy of 83.9% against a pre-specified reference classification, clearing a pre-registered threshold.

The same data show the limits of that result. Accuracy varied from 37.5% to 100% between reviewers, more than it varied between records, and a separate reliability analysis did not meet its full pre-registered criterion. Detection worked as a panel-level judgment. It has not been shown to work as an individual one, and organisations should not treat a panel figure as the accuracy of a single reviewer.

The evidence is further bounded by an author-constructed, deliberately bimodal corpus, a reference classification that depends on the authors' definition, and the absence of real or human-authored comparison records. Within those bounds, the contribution is specific: whether a record carries the basis for its conclusion is an empirically measurable property, detectable under controlled conditions, and professional judgments about it vary substantially. The next tests should use independently constructed and adjudicated records, graded levels of support, and designs that measure reliability and practical value directly.

---

## Declarations

**Funding.** No external funding was received. No participant was compensated.

**Competing interests.** The first author created Decision Reconstruction Risk and the review method associated with it, constructed the corpus, wrote the reference classification, recruited the panel, and would benefit professionally and commercially from the method's adoption. The second author designed the validation and reliability framework and would benefit reputationally from its use. No commercial arrangement is contingent on any result reported here, and no participant had any financial interest in the outcome. Section 6 states the mitigations applied and the investigator dependence that remains.

**Ethics approval.** This study was not reviewed by an institutional review board or ethics committee. It was conducted outside any institution holding one, by independent researchers, with adult professional volunteers making judgments about wholly synthetic documents. No approval or exemption was sought or granted. No personal data beyond name, professional title, country and contact address was collected, and no vulnerable population was involved. Independent ethical review would be sought for any successor study involving real records or real case outcomes.

**Consent to participate.** Participation was voluntary, uncompensated and in a personal capacity, and could be withdrawn at any time before publication. Participants were told in advance that the reference classification and the composition of the corpus would not be disclosed during review, because disclosure would compromise the blinded task.

**Consent to publish.** Responses are reported only in aggregate. Participants are named as contributors only with their consent, may participate anonymously, and may withdraw their name at any time.

**Data availability.** The following are available from the corresponding author on request: the 24 constructed records; the reference classification, with the reason and the evidentiary defect or support for each record; the instructions given to the automated reference raters and their record-by-record results; de-identified participant-level response data; and the analysis scripts that produce every figure in this paper. No material is deposited in a public repository. A complete record-level generation log was not retained.

**Code availability.** Analysis scripts are available on the same terms. They use only the Python standard library and require no network access.

**Authors' contributions.** [Author initials withheld for anonymised review.] The first author conceived the construct and the review method, constructed the corpus, wrote the reference classification, assembled the reviewer panel and led the writing. The second author designed the reliability and validation framework: the reference-panel design, the chance-corrected agreement statistics, and the pre-registered decision thresholds and analysis plan. Neither author took part in the automated reproduction of the reference classification or graded any record in the detection panel.

**Use of artificial intelligence.** The corpus was generated with large-language-model assistance and edited by the first author (Section 3.2). The reference classification was reproduced by three automated raters briefed by the authors (Section 3.3). No AI system is an author. [AUTHORS TO CONFIRM BEFORE SUBMISSION: large-language-model assistance was used in restructuring and editing the text of this revised manuscript; the authors reviewed all content and take full responsibility for it.]

**Pre-registration.** The protocol and analysis plan were registered before data collection. [AUTHORS TO ADD: registry name and link or identifier.]

---

## References

1. Ananny, M., Crawford, K., 2018. Seeing without knowing: limitations of the transparency ideal and its application to algorithmic accountability. *New Media & Society* 20 (3), 973-989.
2. Barr, D.J., Levy, R., Scheepers, C., Tily, H.J., 2013. Random effects structure for confirmatory hypothesis testing: keep it maximal. *Journal of Memory and Language* 68 (3), 255-278.
3. Bates, D., Mächler, M., Bolker, B., Walker, S., 2015. Fitting linear mixed-effects models using lme4. *Journal of Statistical Software* 67 (1), 1-48.
4. Bender, E.M., Gebru, T., McMillan-Major, A., Shmitchell, S., 2021. On the dangers of stochastic parrots: can language models be too big? In: *Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (FAccT '21)*. ACM, pp. 610-623.
5. Bovens, M., 2007. Analysing and assessing accountability: a conceptual framework. *European Law Journal* 13 (4), 447-468.
6. Byrt, T., Bishop, J., Carlin, J.B., 1993. Bias, prevalence and kappa. *Journal of Clinical Epidemiology* 46 (5), 423-429.
7. Citron, D.K., 2008. Technological due process. *Washington University Law Review* 85 (6), 1249-1313.
8. Cobbe, J., Lee, M.S.A., Singh, J., 2021. Reviewable automated decision-making: a framework for accountable algorithmic systems. In: *Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (FAccT '21)*. ACM, pp. 598-609.
9. Feinstein, A.R., Cicchetti, D.V., 1990. High agreement but low kappa: I. The problems of two paradoxes. *Journal of Clinical Epidemiology* 43 (6), 543-549.
10. Fleiss, J.L., 1971. Measuring nominal scale agreement among many raters. *Psychological Bulletin* 76 (5), 378-382.
11. Gebru, T., Morgenstern, J., Vecchione, B., Vaughan, J.W., Wallach, H., Daumé III, H., Crawford, K., 2021. Datasheets for datasets. *Communications of the ACM* 64 (12), 86-92.
12. Gwet, K.L., 2008. Computing inter-rater reliability and its variance in the presence of high agreement. *British Journal of Mathematical and Statistical Psychology* 61 (1), 29-48.
13. Jacobs, A.Z., Wallach, H., 2021. Measurement and fairness. In: *Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (FAccT '21)*. ACM, pp. 375-385.
14. Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., Xu, Y., Ishii, E., Bang, Y.J., Madotto, A., Fung, P., 2023. Survey of hallucination in natural language generation. *ACM Computing Surveys* 55 (12), 1-38.
15. Kaminski, M.E., Urban, J.M., 2021. The right to contest AI. *Columbia Law Review* 121 (7), 1957-2048.
16. Krippendorff, K., 2004. *Content Analysis: An Introduction to Its Methodology*, second ed. Sage, Thousand Oaks, CA.
17. Mitchell, M., Wu, S., Zaldivar, A., Barnes, P., Vasserman, L., Hutchinson, B., Spitzer, E., Raji, I.D., Gebru, T., 2019. Model cards for model reporting. In: *Proceedings of the Conference on Fairness, Accountability, and Transparency (FAT* '19)*. ACM, pp. 220-229.
18. Raji, I.D., Smart, A., White, R.N., Mitchell, M., Gebru, T., Hutchinson, B., Smith-Loud, J., Theron, D., Barnes, P., 2020. Closing the AI accountability gap: defining an end-to-end framework for internal algorithmic auditing. In: *Proceedings of the 2020 Conference on Fairness, Accountability, and Transparency (FAT* '20)*. ACM, pp. 33-44.
19. Ransohoff, D.F., Feinstein, A.R., 1978. Problems of spectrum and bias in evaluating the efficacy of diagnostic tests. *New England Journal of Medicine* 299 (17), 926-930.
20. Regulation (EU) 2024/1689 of the European Parliament and of the Council of 13 June 2024 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act). *Official Journal of the European Union* L, 2024/1689.
21. Whiting, P.F., Rutjes, A.W.S., Westwood, M.E., Mallett, S., Deeks, J.J., Reitsma, J.B., Leeflang, M.M.G., Sterne, J.A.C., Bossuyt, P.M.M., 2011. QUADAS-2: a revised tool for the quality assessment of diagnostic accuracy studies. *Annals of Internal Medicine* 155 (8), 529-536.

---

## Supplementary material (moved from the main text of the rejected version)

The following are retained unchanged from the submitted manuscript and will be supplied as a supplementary file: the cross-vendor machine-consistency series (former Appendix A); descriptive per-condition behaviour of the five-condition instrument (former Appendix B); the full crossed-model table and item-level accuracy table (former Appendix C).

# Documentation Governance in AI-Assisted Decision-Making: Criterion Evidence from Adjudicated Employment Records

**Working draft. Journal of Business Ethics.**

**Authors and contributions**

- **Phillip Wikes.** Framework, evidence programme, analysis, lead writing. Creator of the Justification Review Standard; former Lead Civil Rights Officer, Maryland Commission on Civil Rights.
- **Tanvi Pokhriyal.** Employment and industrial-relations domain lead. Designed the employment case protocol, selected and screened all 22 adjudicated matters, and recorded every read from the decision record alone before the documented outcome was consulted. Human Resources Manager, REIL Innovative Solutions. **Co-author.** The criterion evidence in Section 5 is her case set.
- **Kyle McMullan.** Audit and investigations lens, Section 6.4, and manuscript review. Chief Audit Executive; internal audit and financial crimes; former Chief Auditor, AML International and Financial Crimes International (Citi); Chartered Accountants Ireland. Accepted 2026-07-18. Authorship final on his substantive pass at 6.4 and his review of the full manuscript.
- **Ubayet Hossain, FRM.** Statistical validation methodology: reference-panel design, chance-corrected agreement framework, pre-registered decision floors. Associate Director, Model Validation, KPMG India. Co-authorship final on his review and approval of this manuscript.

**Scope, and what this paper does not duplicate.** Two companion papers hold their own primary results and are cited here rather than reproduced. The detection study, which reports panel accuracy against a verified key and the per-condition analysis, is under preparation for a separate venue. The public-records study, first-authored by Stacy Young, holds the 32-case FOIL corpus and is under preparation for the *Journal of Civic Information*. This paper's primary result is the employment criterion evidence in Section 5. Public-records material appears here illustratively, never as a primary finding.

---

## Abstract

*Write last. One paragraph covering: the governance gap, meaning AI-assisted records that read as complete but cannot be rebuilt; the standard and the named risk; the evidence programme; the criterion result from adjudicated employment matters; and the contribution, which is documentation quality as an independent governance metric that complements technology adoption rather than competing with it.*

## 1. Introduction

### 1.1 The defensibility gap

An HR business partner reviews a termination file ahead of an audit. The documentation is polished, structured, and audit-ready. The rationale reads clearly and confidently. Under audit review one question surfaces: where did this actually come from?

The manager used a public AI tool to draft the justification, prompted it to strengthen the case, then prompted it again for supporting details. No logs were attached. No independent documentation was referenced. The result is a professional narrative with no verifiable evidentiary foundation. The problem is not a flawed decision. It is an indefensible record, and the space between what a record says and what it can prove is the gap this paper is about.

### 1.2 Documentation as an evidentiary function

In employment, public-records, compliance and investigative settings, the written record is the primary artifact tested when a decision is challenged. Under the burden-shifting framework that governs discrimination claims in the United States, and under comparable reasonableness standards elsewhere, whether a stated reason reads as legitimate or as pretext frequently turns on how well the rationale was documented at the time. AI-assisted drafting produces fluent records without guaranteeing that the basis for a conclusion is present in them.

### 1.3 The governance gap

Organizations are adopting AI and document-review technology faster than they are measuring whether the resulting documentation remains independently reviewable. Technology inventories record which software is in use. They do not record whether the outputs can be rebuilt by someone who was not there.

### 1.4 This paper

We present a record-level review standard, its named risk, and a staged evidence programme, and we report criterion evidence from 22 adjudicated employment and labour matters: records assessed as complete before the outcome was known reached an adverse finding far less often than records assessed as incomplete.

## 2. The Justification Review Standard

The standard asks one question of a record: can a later, independent reviewer rebuild how a conclusion was reached from the record alone?

Five conditions carry that question. Reconstructability, whether the conclusion can be rebuilt from the record alone. Basis identification, whether the source of each characterization is identifiable. Chronological integrity, whether dates, sequence and sources hold together when read cold. Decision-process traceability, whether the reasoning from evidence to conclusion can be followed and the responsible parties identified. Evidentiary sufficiency, whether the record carries enough to support the weight of the decision.

The conditions resolve to a three-level read: Ready, Needs work, or Gap. The risk the standard names is Decision Reconstruction Risk, the condition in which a record cannot, on its own terms, let an independent reviewer rebuild the basis for a consequential decision.

## 3. The evidence programme

The programme runs in stages: reproducibility, then reliability, then accuracy against a verified key, then construct validity, then criterion validity on real cases, then external validity. This paper reports criterion validity in the employment domain. Reproducibility, reliability and accuracy are established in the companion detection study and are summarised in Section 4 rather than re-derived here.

## 4. Established results, summarised from the companion studies

**Reproducibility.** Three large language models, one each from Anthropic, OpenAI and Google, applied the standard to the same 15 constructed records and reached a mean pairwise agreement of 84 percent on the determination. Cross-vendor models were used rather than three instances of one provider, so that agreement reflects the method rather than a single model lineage. This measures consistent application, not accuracy.

**Reliability.** Independent raters applied the five conditions to a shared record set. Gwet's AC1 reached 0.739 among expert raters and 0.624 among trained reviewers, on 10 records and 99 labels after keeping one label per rater per record, both above the floor of 0.61 set in advance. AC1 was chosen in advance over kappa because the determination distribution was expected to be skewed. These figures are interim against a pooled target of about 26 records.

**Every condition carries discriminating information.** Across the 108 structured labels in that corpus, contributed by 21 raters, each of the five conditions separates the two ends of the scale. All five pass in 14 of 14 records read as Ready. Against records read as Gap, the pass rates are 15 of 75 for reconstructability, 18 of 75 for basis identification, 9 of 75 for chronological integrity, 9 of 75 for decision-process traceability, and 7 of 75 for evidentiary sufficiency, with Fisher's exact p values between 1.0e-08 and 1.5e-11. No condition is decorative, and they are not interchangeable: evidentiary sufficiency is both the most frequently unmet, at 52.9 percent not passing, and the sharpest discriminator.

**Methodology attribution.** The reference-panel design, the chance-corrected agreement framework with Gwet's AC1 as the pre-registered primary coefficient, and the acceptance floors are the methodological contribution of Ubayet Hossain, FRM. Statistical analyses were specified before interpretation. The proportionality principle referenced in the standard was surfaced by pilot reviewer Saurabh Nanda and is credited with permission.

## 5. Criterion evidence: adjudicated employment matters

### 5.1 Design and sample

Each case pairs an adjudicated employment or labour matter, in which the sufficiency of the employer's record was at issue, with its documented outcome. The read is recorded first, from the decision record alone and before the outcome is consulted. The outcome and the citation are recorded afterwards. Public material only, each case carrying a public citation.

The sample is 22 cases from 22 distinct public sources, collected 22 June to 29 July 2026, spanning three jurisdictional systems: United States Supreme Court decisions, United States Federal Labor Relations Authority decisions, and United Kingdom Employment Tribunal judgments. The pre-registered target was 20 to 30 cases with a spread of outcomes, and the sample meets it.

Reads: 13 Ready, 6 Needs work, 3 Gap. Outcomes: 7 sustained, 7 did not survive review, 6 contested with no recorded disposition, 2 adverse audit or compliance findings.

| Read | Sustained | Did not survive | Contested | Adverse finding | Total |
|---|---|---|---|---|---|
| Ready | 6 | 1 | 5 | 1 | 13 |
| Needs work | 0 | 4 | 1 | 1 | 6 |
| Gap | 1 | 2 | 0 | 0 | 3 |
| **Total** | **7** | **7** | **6** | **2** | **22** |

### 5.2 Primary result, on the pre-registered outcome coding

The protocol fixes the primary outcome as an adverse finding, meaning the matter did not survive review or drew an adverse audit or compliance finding. Grouping Needs work with Gap, because both indicate an incomplete basis:

| | Adverse finding | No adverse finding | Adverse rate (95% CI) |
|---|---|---|---|
| Needs work or Gap (n = 9) | 7 | 2 | 77.8% (45.3 to 93.7) |
| Ready (n = 13) | 2 | 11 | 15.4% (4.3 to 42.2) |

Fisher's exact test, two-sided: **p = 0.0073**. Odds ratio 19.25. Intervals are Wilson score intervals, used because the cells are small.

Records the reviewer flagged as incomplete, before knowing how the matter resolved, reached an adverse finding five times more often than records she passed.

### 5.3 Sensitivity analyses

Because significance can depend on how an outcome is defined, the two alternative codings are reported rather than left out.

Restricting to the 16 cases with a resolved disposition and asking whether the employer's position was sustained: Ready 6 of 8 sustained (75.0 percent, interval 40.9 to 92.9) against Needs work or Gap 1 of 8 (12.5 percent, interval 2.2 to 47.1). Fisher's exact, two-sided, p = 0.041, odds ratio 21.0.

Taking all 22 cases and asking only whether the matter was sustained, which counts the six contested cases as not sustained: Ready 6 of 13 (46 percent) against Needs work or Gap 1 of 9 (11 percent), p = 0.165. The direction is the same and the test does not reach significance, which is what a coding that treats an unrecorded disposition as an adverse one would be expected to produce.

The primary coding is the one fixed in the protocol. Both alternatives run in the same direction.

### 5.4 The counter-example, retained

One record read as Gap was sustained. It is retained in the analysis and named here rather than dropped. A three-case Gap group supports no separate reading, and the signal in this corpus comes from the contrast between Ready and Needs work, where the Needs work group was sustained in none of four resolved cases.

## 6. Discussion

### 6.1 Documentation quality as an independent governance metric

Reviewability is a property of the record, measurable regardless of the software or AI system that produced it. That is what makes it portable: the same read applies to a hand-typed file and an AI-drafted one, and it measures the thing that decides the outcome when the file is tested.

### 6.2 Complementary to technology adoption, not competitive with it

A technology inventory answers what tools are in use. A documentation read answers whether the outputs hold up. An organization can adopt new review software and, in parallel, sample its own records for reconstructability, catching the case where better tooling produces fluent but unreconstructable files.

### 6.3 Cross-domain relevance

The same reconstructability question applies to employment, public-records, compliance and investigative documentation. The companion public-records study found that in a corpus of published appellate decisions the read did not predict who won, and explained why: cases reach publication because a legal question was live, not because the file was thin. The employment corpus in Section 5 is not filtered that way, and there the association appears. Both results are consistent with a read that measures documentation quality and a publication process that selects on something else.

### 6.4 The audit and investigations lens

*This section is Kyle McMullan's. It is drafted here as a frame for his revision in his own voice, with marked places for short de-identified examples from audit and financial-crime work.*

Internal audit and financial-crime work test records the way litigation does, only sooner and more often. An examiner does not re-interview the decision-maker's memory; the examiner reads the file and asks whether its stated basis can be rebuilt from the record itself. That is the same question the standard asks, applied before the examiner arrives rather than after. Decision Reconstruction Risk is not abstract in this setting. It is the recurring reason a defensible decision becomes an indefensible file.

Three failure patterns recur across examinations, and each maps to a specific way AI-assisted drafting introduces the risk.

**Manager convenience.** A decision is challenged and the organization cannot produce underlying documentation beyond the AI-generated narrative. The source material, the logs, communications and measurable observations that would have supported the conclusion, was never attached, because the narrative read as complete without it. In discovery or audit the absence of source material becomes the central issue and shifts the burden onto the organization: a sound decision now has to be defended without the evidence that made it sound. *[Kyle: a short de-identified example of a challenged decision where the file could not be substantiated beyond the drafted narrative.]*

**Compliance washing.** A file uses the correct terminology and follows the template exactly, while every substantive claim rests on AI-generated phrasing rather than documented observation. Read one at a time, each file looks compliant. Read across a population, the same fluent, evidence-free construction repeats, and what looked like isolated polish reads as a systemic control weakness. This is the pattern examiners escalate, because it suggests the control environment produced the appearance of documentation rather than the substance. *[Kyle: a short de-identified example of a file, or a set of files, that satisfied the template while resting on unverified drafted language.]*

**No second-line review.** A record moves from a manager's draft to the system of record without independent review, leaving no documented check on the reasoning. The missing control is invisible in any single file and obvious across the process: nothing in the record shows that a second person tested the basis before it became official. Under examination the absence of a review step undermines the credibility of the whole process, not just the one decision. *[Kyle: a short de-identified example of a record that reached the system of record with no evidence of second-line review.]*

In audit terms the standard functions as a record-level control test. It asks of each file the single question an examiner will eventually ask, before the examiner does: can a later, independent reviewer rebuild how this conclusion was reached from the record alone? A file that fails that test is not necessarily a wrong decision, but it is an exposure, and it is one that can be found and remediated inside the workflow rather than in a deposition. Framed this way, documentation quality becomes an auditable control with a testable pass condition, which is what makes it usable as a first-line and second-line check rather than a matter of style. *[Kyle: if useful, a closing observation on where this control would sit in a standard three-lines-of-defence model.]*

### 6.5 Practitioner implications: a pre-finalization control set

The framework translates into four controls applied before a record enters the system of record, inside existing workflows.

Anchor every material claim to verifiable evidence that existed before drafting: logs, communications, measurable data, not AI-generated narrative. Treat AI output as unverified draft material until independently substantiated. Eliminate proxy language, describing observable conduct rather than interpretation, because repeated subjective descriptors can function as pattern evidence in discrimination claims. Keep drafting inside approved, auditable systems, because the larger exposure is not AI use but untracked AI use.

Three indicators make the control set measurable: the percentage of claims supported by documented evidence, the rate of claims lacking documentation, and the frequency of subjective language across files, tracked on a periodic sample, flag and remediate cadence. These function as early-warning signals of legal and compliance exposure rather than as a documentation-tidiness score.

AI has changed how documentation is produced. It has not changed how documentation is judged.

## 7. Limitations

The criterion sample is 22 cases, and the primary test rests on 9 flagged against 13 passed. The intervals are correspondingly wide.

All 22 reads were recorded by a single domain reviewer, so no inter-rater agreement is estimated within this corpus and reader-dependence cannot be ruled out.

Cases were selected by the domain reviewer from published sources rather than sampled at random.

Six cases record a contest without a resolved disposition. They are counted in the primary coding as not adverse, which is the conservative direction, and the sensitivity analyses show what happens under the alternatives.

The Gap group is three cases and supports no separate reading.

The reviewer read the employer's record as reported inside an adjudicated decision, which is not identical to the file the decision-maker produced at the time.

Reliability figures are interim on 10 of about 26 pooled records, and in that corpus no rater used the lowest coding level on any condition, so the per-condition separations in Section 4 are between the upper two levels rather than across the full scale.

The findings do not establish that the standard improves organizational outcomes, reduces litigation risk, or increases decision quality. Those require separate evaluation. The standard remains in a validation phase.

## 8. Conclusion

Decisions are defended from the record or not at all. On 22 adjudicated employment and labour matters across three jurisdictional systems, a structured read of the record, recorded before the outcome was known, separated the matters that drew an adverse finding from the matters that did not, at p = 0.0073 with an odds ratio of 19.

The sample is small and the study is a pilot. What it establishes is that the effect is large enough to find at this scale, which makes the confirmatory study worth designing: a larger corpus, sampled without regard to how the matter resolved, read blind by at least two reviewers, with each read recorded alongside its basis so that what the reading tracked can be shown rather than assumed.

## 9. Data provenance

Criterion counts are drawn from the study database under the employment and industrial-relations domain, contributor code V-HR-01, verified 8 August 2026: 22 cases from 22 distinct public sources, 22 June to 29 July 2026; reads 13 Ready, 6 Needs work, 3 Gap; outcomes 7 sustained, 7 did not survive review, 6 contested, 2 adverse findings. Reproducibility, reliability and per-condition figures are drawn from the same database and are reported in full in the companion detection study. Every figure in Sections 4 and 5 is reproduced by standard-library analysis scripts held with the study record. The complete case list with citations accompanies this manuscript.

## References

Gwet, K. L. (2008). Computing inter-rater reliability and its variance in the presence of high agreement. *British Journal of Mathematical and Statistical Psychology, 61*(1), 29-48.

*McDonnell Douglas Corp. v. Green*, 411 U.S. 792 (1973).

*St. Mary's Honor Center v. Hicks*, 509 U.S. 502 (1993).

Wilson, E. B. (1927). Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association, 22*(158), 209-212.

### Cited decisions

United States Supreme Court decisions; United States Federal Labor Relations Authority decisions including AFGE Local 4012 and Social Security Administration, Denver, Colorado, 73 FLRA No. 106 (26 May 2023); and United Kingdom Employment Tribunal judgments including Gallon v Sigma Aldrich Ltd, Case No. 2500506/2017 (2017). The complete case list accompanies the data provenance statement.

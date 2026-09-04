# Documentation Reviewability in AI-Assisted Employment Records: Evidence from 22 Adjudicated Matters

**Tanvi Pokhriyal**
Human Resources Manager, REIL Innovative Solutions

**Kyle McMullan**
Chief Audit Executive; internal audit and financial crimes; former Chief Auditor, AML International and Financial Crimes International, Citi; Chartered Accountants Ireland

**Phillip Wikes**
Senior author. AI Governance and Cognitive Risk Advisor; Creator of the Justification Review Standard; Lead Civil Rights Officer, Maryland Commission on Civil Rights, 2012 to 2025

**Contributor**

**Ubayet Hossain, FRM**, Associate Director, Model Validation, KPMG India. Designed the validation methodology reported in Section 4: the reference-panel design, the chance-corrected agreement framework with Gwet's AC1 as the primary coefficient, and the acceptance floors fixed in advance of any analysis. Credited as a named contributor at the authors' request and with his agreement.

**Author contributions.** T.P. designed the employment case protocol, selected and screened all 22 adjudicated matters, recorded every read from the decision record alone before the documented outcome was consulted, and recorded the outcomes and citations. **The research reported in Section 5 is hers.** K.M. contributed Section 6.4, the audit and investigations lens, and reviewed the full manuscript. P.W. developed the review standard and the Decision Reconstruction Risk construct, designed the evidence programme, specified and ran every analysis reported here, and prepared the manuscript. U.H.'s methodological contribution is described under Contributor above.

**Competing interests.** P.W. created the construct and the instrument under study and would benefit from its adoption. **That is a material conflict and it is not mitigated by the design alone.** What was done about it: he read no case in this corpus and recorded no read and no outcome; the case set, the reads and the outcomes are T.P.'s, recorded under contributor code V-HR-01 in the study database. What was not done about it: he specified and ran every test reported here, and no independent statistician replicated them before submission.

[REQUIRED_ENV_PARAM: declarations. T.P. and K.M. must each confirm in writing whether they hold any financial or commercial interest in the Justification Review Standard, and any funding received. U.H. must confirm the same and confirm he accepts named-contributor credit rather than co-authorship. These are not assumed here. Replace this block with their confirmed words before submission.]

**Scope, and what this paper does not duplicate.** Two companion papers hold their own primary results and are cited here rather than reproduced. The detection study reports panel accuracy against a verified key and is under preparation for a separate venue. The public-records study, first-authored by Stacyann Young, holds a 32-case corpus of freedom-of-information determinations and is under preparation separately. **This paper's primary result is the employment field evidence in Section 5.** Public-records material appears here only in Section 6.3, as a comparison that tests this paper's own boundary condition.

---

## Abstract

**Purpose** – To test whether a structured read of an employment record's reviewability, recorded before the outcome is known, tracks how the matter held up.

**Design/methodology/approach** – Twenty-two adjudicated employment and labour matters from 22 distinct public sources across three jurisdictional systems. Each was read against five conditions from the decision record alone, with the read fixed before the outcome was consulted. One reviewer performed both steps.

**Findings** – Records read as incomplete drew an adverse finding in 7 of 9 cases against 2 of 13 read as complete (Fisher's exact, p = 0.0073; odds ratio 19.25). The result is sensitive to outcome definition: a second coding gives p = 0.041 and a third, treating an unresolved contest as adverse, is not significant (p = 0.165). All three are reported with equal standing because no analysis plan fixed a primary coding before the data closed. In a companion public-records corpus the association does not appear, and a homogeneity test shows the two do not differ significantly (Woolf p = 0.110).

**Research limitations/implications** – A single-practitioner field pilot: one reviewer applied the review and recorded the outcome for each case, so no inter-rater agreement is estimated. Cases were selected, not sampled. Cells are small. No causal claim is made.

**Originality/value** – Reports an effect size, an audit-practice frame, and a corrected design for the confirmatory study this pilot cannot be.

**Keywords** Records management, documentation quality, evidentiary sufficiency, employment adjudication, internal audit

**Article classification** Research paper

---

## 1. Introduction

### 1.1 The defensibility gap

A record makes a promise to whoever reads it later: that a decision was made for reasons someone can go back and examine. When an AI tool drafts the record, that promise can break quietly. The text reads as finished. The reasoning behind it may already be gone.

### 1.2 Documentation as an evidentiary function

In employment matters the written record is usually the first thing a dispute is tested against. Performance evaluations, investigative notes and termination memoranda are read under discrimination statutes and the burden-shifting frameworks that structure them. A record that will hold up has to show the facts its conclusion rests on.

### 1.3 The governance gap

Organizations measure whether AI tools are in use. They do not generally measure whether the records those tools produce can still be reconstructed. Those are different questions, and only the second one decides what happens when a file is tested.

### 1.4 This paper

We name the risk, describe the instrument that measures it, summarize what the companion studies establish, and report criterion evidence from 22 adjudicated employment matters. Section 6.4 sets the finding in audit and investigations practice.

## 2. The Justification Review Standard

The standard asks one question of a record: can a later, independent reviewer rebuild how a conclusion was reached from the record alone?

Five conditions carry that question. Reconstructability, whether the conclusion can be rebuilt from the record alone. Basis identification, whether the source of each characterization is identifiable. Chronological integrity, whether dates, sequence and sources hold together when read cold. Decision-process traceability, whether the reasoning from evidence to conclusion can be followed and the responsible parties identified. Evidentiary sufficiency, whether the record carries enough to support the weight of the decision.

The conditions resolve to a three-level read: Ready, Needs work, or Gap. The risk the standard names is Decision Reconstruction Risk, the condition in which a record cannot, on its own terms, let an independent reviewer rebuild the basis for a consequential decision.

**The determination is a deterministic function of the five conditions.** Where all five pass the read is Ready; where any is unmet the read is lowered. This is a property of the instrument's design, and it is stated here because it bounds what can be claimed: the conditions and the determination are not independent measurements, and no analysis in this paper treats one as evidence about the other.

## 3. The evidence programme

The programme runs in stages: reproducibility, then reliability, then accuracy against a verified key, then construct validity, then criterion validity on real cases, then external validity. **This paper reports field evidence from the employment domain.** It is a practitioner pilot and it is written as one. Reproducibility, reliability and accuracy are established in the companion detection study and are summarized in Section 4 rather than re-derived here.

## 4. Established results, summarised from the companion studies

**Reproducibility.** Three large language models, one each from three independent vendors, applied the standard to the same constructed records. Across 61 nightly cross-vendor runs to 21 August 2026 the mean pairwise agreement on the determination is 84.9 percent, standard deviation 6.4 points, range 66.7 to 100 percent. Cross-vendor models were used rather than three instances of one provider, so agreement reflects the method rather than a single model lineage. **This measures consistent application, not accuracy, and the dispersion is reported alongside the mean because a single point estimate would overstate the stability of the figure.**

**Reliability.** Independent raters applied the five conditions to a shared record set. On the corpus as it stood at analysis, Gwet's AC1 reached 0.739 among expert raters and 0.624 among trained reviewers, both above the floor of 0.61 set in advance. AC1 was chosen in advance over kappa because the determination distribution was expected to be skewed. **On the corpus as it now stands, 104 labels from 22 labelers across 10 multi-rater records, agreement on the determination under the review protocol is 0.664, still above the floor.** These figures are interim against a pooled target of about 26 records.

**A limitation at condition level, reported rather than omitted.** Chance-corrected agreement on the five conditions taken individually ranges from 0.236 to 0.413, all below the 0.61 floor. **The determination agrees better than any single condition that composes it.** No claim is made that the individual conditions are separately reliable, and an earlier version of this manuscript reported a per-condition discrimination analysis which has been withdrawn: because the determination is a deterministic function of the conditions, that analysis tested a variable against a function of itself.

**Methodology attribution.** The reference-panel design, the chance-corrected agreement framework with Gwet's AC1 as the primary coefficient, and the acceptance floors are the methodological contribution of Ubayet Hossain, FRM, credited as a contributor above, and were fixed before any analysis was run. The proportionality principle referenced in the standard was surfaced by pilot reviewer Saurabh Nanda and is credited with permission.

## 5. Field evidence: 22 adjudicated employment matters

### 5.1 Design and sample

Each case pairs an adjudicated employment or labour matter, in which the sufficiency of the employer's record was at issue, with its documented outcome. The read is recorded first, from the decision record alone and before the outcome is consulted. The outcome and the citation are recorded afterwards. Public material only, each case carrying a public citation.

**Design: a single-practitioner field pilot.** One practising employment specialist selected each case, applied the review to the decision record, and then recorded the documented outcome and citation from the source. This is the standard shape of a practitioner field pilot and it is what this study is. The protocol requires the review to be completed and recorded before the outcome is consulted. **The database stores one timestamp per case rather than separate review and outcome times, so that sequence rests on the protocol and the reviewer's practice rather than on a system record**, and a larger study should timestamp the two steps separately. Section 8 scopes what a confirmatory study would add, including a second reviewer per case.

The sample is 22 cases from 22 distinct public sources, collected 22 June to 29 July 2026, spanning three jurisdictional systems: United States Supreme Court decisions, United States Federal Labor Relations Authority decisions, and United Kingdom Employment Tribunal judgments. The stated target was 20 to 30 cases with a spread of outcomes, and the sample meets it. The pilot closed at 22 on 29 July 2026.

Reads: 13 Ready, 6 Needs work, 3 Gap. Outcomes: 7 sustained, 7 did not survive review, 6 contested with no recorded disposition, 2 adverse audit or compliance findings.

| Read | Sustained | Did not survive | Contested | Adverse finding | Total |
|---|---|---|---|---|---|
| Ready | 6 | 1 | 5 | 1 | 13 |
| Needs work | 0 | 4 | 1 | 1 | 6 |
| Gap | 1 | 2 | 0 | 0 | 3 |
| **Total** | **7** | **7** | **6** | **2** | **22** |

### 5.2 The association, and the coding it depends on

**No analysis plan fixing a primary outcome coding was recorded before the data closed, and this paper does not claim otherwise.** The pilot was designed to test whether a documentation read tracks how a record holds up; it did not fix in advance whether a contested matter with no recorded disposition counts as an adverse outcome. That definition turns out to decide the result, so all three codings are reported with equal standing and in a fixed order, strongest to weakest, rather than one being presented as primary.

Under the first coding, an adverse finding means the matter did not survive review or drew an adverse audit or compliance finding. Needs work is grouped with Gap, because both indicate an incomplete basis:

| | Adverse finding | No adverse finding | Adverse rate (95% CI) |
|---|---|---|---|
| Needs work or Gap (n = 9) | 7 | 2 | 77.8% (45.3 to 93.7) |
| Ready (n = 13) | 2 | 11 | 15.4% (4.3 to 42.2) |

Fisher's exact test, two-sided: **p = 0.0073**. Odds ratio 19.25. Intervals are Wilson score intervals, used because the cells are small.

Records the reviewer flagged as incomplete, before knowing how the matter resolved, reached an adverse finding five times more often than records she passed. **On nine flagged records against thirteen passed, that difference rests on cells of 7, 2, 2 and 11.**

### 5.3 The other two codings

These are not robustness checks on a settled primary result. They are two further defensible readings of the same 22 cases, and one of them does not reach significance.

Restricting to the 16 cases with a resolved disposition and asking whether the employer's position was sustained: Ready 6 of 8 sustained (75.0 percent, interval 40.9 to 92.9) against Needs work or Gap 1 of 8 (12.5 percent, interval 2.2 to 47.1). Fisher's exact, two-sided, p = 0.041, odds ratio 21.0.

Taking all 22 cases and asking only whether the matter was sustained, which counts the six contested cases as not sustained: Ready 6 of 13 (46 percent) against Needs work or Gap 1 of 9 (11 percent), p = 0.165.

**All three codings run in the same direction and only two reach significance.** The honest summary is that the association is strong enough to justify a confirmatory study and not robust enough to be called a finding: it survives when an unresolved contest is treated as not adverse, and it does not survive when the same contest is treated as adverse. Which of those is correct is a question about employment adjudication, not about this dataset, and it should be settled in a protocol before the next corpus is read.

### 5.4 The counter-example, retained

One record read as Gap was sustained. It is retained in the analysis and named here rather than dropped. A three-case Gap group supports no separate reading, and the signal in this corpus comes from the contrast between Ready and Needs work, where the Needs work group was sustained in none of four resolved cases.

## 6. Discussion

### 6.1 Documentation quality as an independent governance metric

Reviewability is a property of the record, measurable regardless of the software or AI system that produced it. That is what makes it portable: the same read applies to a hand-typed file and an AI-drafted one, and it measures the thing that decides the outcome when the file is tested.

### 6.2 Complementary to technology adoption, not competitive with it

A technology inventory answers what tools are in use. A documentation read answers whether the outputs hold up. An organization can adopt new review software and, in parallel, sample its own records for reconstructability, catching the case where better tooling produces fluent but unreconstructable files.

### 6.3 A boundary condition, tested against a companion corpus

The association reported in Section 5 does not appear everywhere, and the place it fails is informative rather than awkward.

The companion public-records study applied the same instrument to 32 freedom-of-information determinations. In that corpus the read did not predict who won, and the study explains why: cases reach publication because a legal question was live, not because the file was thin. Fifteen of its 20 resolved determinations did not survive, a base rate set by the publication process rather than by how agencies document.

The employment corpus is not filtered that way, and its base rate of adverse outcomes is close to even. **That difference is the proposed explanation, and it can be tested rather than asserted.** A Woolf test of homogeneity on the two corpora's log odds ratios gives **Q = 2.550 on 1 degree of freedom, p = 0.110**. The two results do not differ significantly from each other. **The employment association and the public-records null are statistically consistent with a single underlying effect observed with different power against different base rates, rather than with two corpora that disagree.**

Both observations are consistent with a read that measures documentation quality and a publication process that selects on something else. The public-records figures are reported in full in that study, with its own limits.

### 6.4 The audit and investigations lens

Internal audit and financial-crime work test records the way litigation does, only sooner and more often. An examiner does not re-interview the decision-maker's memory; the examiner reads the file and asks whether its stated basis can be rebuilt from the record itself. That is the same question the standard asks, applied before the examiner arrives rather than after. Decision Reconstruction Risk is not abstract in this setting. It is the recurring reason a defensible decision becomes an indefensible file.

Three failure patterns recur across examinations, and each maps to a specific way AI-assisted drafting introduces the risk.

**Manager convenience.** A decision is challenged and the organization cannot produce underlying documentation beyond the AI-generated narrative. The source material, the logs, communications and measurable observations that would have supported the conclusion, was never attached, because the narrative read as complete without it. In discovery or audit the absence of source material becomes the central issue and shifts the burden onto the organization: a sound decision now has to be defended without the evidence that made it sound.

**Compliance washing.** A file uses the correct terminology and follows the template exactly, while every substantive claim rests on AI-generated phrasing rather than documented observation. Read one at a time, each file looks compliant. Read across a population, the same fluent, evidence-free construction repeats, and what looked like isolated polish reads as a systemic control weakness. This is the pattern examiners escalate, because it suggests the control environment produced the appearance of documentation rather than the substance.

**No second-line review.** A record moves from a manager's draft to the system of record without independent review, leaving no documented check on the reasoning. The missing control is invisible in any single file and obvious across the process: nothing in the record shows that a second person tested the basis before it became official. Under examination the absence of a review step undermines the credibility of the whole process, not just the one decision.

In audit terms the standard functions as a record-level control test. It asks of each file the single question an examiner will eventually ask, before the examiner does: can a later, independent reviewer rebuild how this conclusion was reached from the record alone? A file that fails that test is not necessarily a wrong decision, but it is an exposure, and it is one that can be found and remediated inside the workflow rather than in a deposition. Framed this way, documentation quality becomes an auditable control with a testable pass condition, which is what makes it usable as a first-line and second-line check rather than a matter of style.

### 6.5 Practitioner implications: a pre-finalization control set

The framework translates into four controls applied before a record enters the system of record, inside existing workflows.

Anchor every material claim to independently verifiable source evidence that existed before drafting: logs, communications, measurable data, rather than to AI-generated assertions alone. Treat AI output as unverified draft material until independently substantiated. Eliminate proxy language, describing observable conduct rather than interpretation, because repeated subjective descriptors can function as pattern evidence in discrimination claims. Keep drafting inside approved, auditable systems, because the larger exposure is not AI use but untracked AI use.

Three indicators make the control set measurable: the percentage of claims supported by documented evidence, the rate of claims lacking documentation, and the frequency of subjective language across files, tracked on a periodic sample, flag and remediate cadence. These function as early-warning signals of legal and compliance exposure rather than as a documentation-tidiness score.

AI has changed how documentation is produced. It has not changed how documentation is judged.

## 7. Limitations

The criterion sample is 22 cases, and the primary test rests on 9 flagged against 13 passed. The intervals are correspondingly wide.

This is a single-practitioner field pilot. One reviewer applied the review and recorded the outcome for each case, so no inter-rater agreement is estimated within this corpus and the association is reported as a field observation rather than as an independent test. **The paper's claims are set at that level throughout and no stronger claim is made anywhere in it.**

Cases were selected by the domain reviewer from published sources rather than sampled at random. Published adjudications are not a random sample of employment records: a matter reaches adjudication because something was contested, which is selection on a variable related to the outcome being measured.

Six cases record a contest without a resolved disposition. How those six are treated decides whether the association reaches significance, and no rule for treating them was recorded before the data closed. All three treatments are reported in Section 5.

The Gap group is three cases and supports no separate reading.

The reviewer read the employer's record as reported inside an adjudicated decision, which is not identical to the file the decision-maker produced at the time.

Reliability figures are interim against a pooled target, and in the corpus analysed no rater used the lowest coding level on any condition. Condition-level agreement is below the pre-set floor, as Section 4 reports.

**The findings do not establish that the standard improves organizational outcomes, reduces litigation risk, or increases decision quality. Those require separate evaluation. The standard remains in a validation phase.**

## 8. Conclusion

Decisions are defended from the record or not at all. On 22 adjudicated employment and labour matters across three jurisdictional systems, a structured read of the record, recorded before the outcome was known, separated the matters that drew an adverse finding from the matters that did not, at p = 0.0073 with an odds ratio of 19 under one of three defensible outcome codings, and not significantly under another.

The sample is 22 cases from one practitioner's caseload and the result moves with the outcome definition, so this paper reports an effect size and a design rather than a settled finding. **What it establishes is that an effect of this size is visible at practitioner scale, in real adjudicated matters, using a review a working specialist can apply inside an ordinary workload.** That is what makes a larger study worth running and specifies it: a broader corpus sampled without regard to how the matter resolved, at least two reviewers per case with review and outcome recorded separately and separately timestamped, and an analysis plan that fixes the treatment of unresolved contests before any record is read.

## 9. Data provenance

Counts are drawn from the study database under the employment and industrial-relations domain, contributor code V-HR-01, re-verified against the live record on 21 August 2026, which returns 22 cases with no activity since 29 July 2026: 22 cases from 22 distinct public sources, 22 June to 29 July 2026; reads 13 Ready, 6 Needs work, 3 Gap; outcomes 7 sustained, 7 did not survive review, 6 contested, 2 adverse findings. Reproducibility, reliability and companion-corpus figures are drawn from the same database and are reported in full in the companion studies.

Every figure in Sections 4, 5 and 6.3 is reproduced by standard-library analysis scripts held with the study record; all Fisher's exact tests, odds ratios, Wilson intervals and the Woolf homogeneity statistic were recomputed from the cell counts on 21 August 2026 and reproduce to the digit. **No analysis plan fixing a primary outcome coding was recorded before the data closed on 29 July 2026, and none is claimed.** The database records one timestamp per case rather than separate review and outcome times. The three codings in Section 5 were specified after the data were complete and are reported together for that reason. The complete case list with citations accompanies this manuscript.

## References

Gwet, K. L. (2008). Computing inter-rater reliability and its variance in the presence of high agreement. *British Journal of Mathematical and Statistical Psychology, 61*(1), 29-48.

*McDonnell Douglas Corp. v. Green*, 411 U.S. 792 (1973).

*St. Mary's Honor Center v. Hicks*, 509 U.S. 502 (1993).

Wilson, E. B. (1927). Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association, 22*(158), 209-212.

Woolf, B. (1955). On estimating the relation between blood group and disease. *Annals of Human Genetics, 19*(4), 251-253.

### Cited decisions

United States Supreme Court decisions; United States Federal Labor Relations Authority decisions including AFGE Local 4012 and Social Security Administration, Denver, Colorado, 73 FLRA No. 106 (26 May 2023); and United Kingdom Employment Tribunal judgments including Gallon v Sigma Aldrich Ltd, Case No. 2500506/2017 (2017). The complete case list accompanies the data provenance statement.

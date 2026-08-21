# When a Defensible Decision Becomes an Indefensible File: Testing AI-Assisted Employment Records Against What Actually Happened

**Tanvi Pokhriyal, Kyle McMullan and Phillip Wikes**

---

An examiner reading a file does not have access to the decision-maker's memory. They have the record. If the record cannot show why a consequential decision was made, the decision may still have been correct, but the organisation can no longer prove it.

That gap is getting wider, and generative AI is why. A drafted narrative reads as finished. The logs, messages and observations that would ground it were never attached, because the text did not look like it needed them.

We call the condition Decision Reconstruction Risk: the state a record is in when it can no longer show, on its own terms, why a consequential decision was reached.

This article reports what happened when one of us applied a structured review to 22 real adjudicated employment matters, recorded the review before knowing how each matter resolved, and then compared the two.

## The review

The review asks one question of a record: can a later, independent reviewer rebuild how the conclusion was reached from the record alone?

Five conditions carry that question:

- **Reconstructability.** Can the conclusion be rebuilt from the record alone?
- **Basis identification.** Is the source of each characterisation identifiable?
- **Chronological integrity.** Do dates, sequence and sources hold together when read cold?
- **Decision-process traceability.** Can the reasoning from evidence to conclusion be followed, and the responsible parties identified?
- **Evidentiary sufficiency.** Does the record carry enough to support the weight of the decision?

The conditions resolve to a three-level read: **Ready**, **Needs work**, or **Gap**. Where all five pass, the read is Ready. Where any is unmet, the read is lowered. The determination follows from the conditions by rule, not by impression, which is what makes it repeatable between reviewers.

## What the three reads look like on paper

The distinction is easier to apply than to describe, so it is worth making concrete.

A record reads **Ready** when the reasoning survives being read by a stranger. The file
states what was alleged, identifies where each factual claim came from, shows the sequence
of events with dates that reconcile, names who decided what and on what basis, and carries
enough underlying material that a reader can test the conclusion rather than take it on
trust. In the corpus, Ready records typically quoted the original documentation rather than
summarising it.

A record reads **Needs work** when part of the basis is visible and part is asserted. The
narrative is coherent, but at least one material claim traces to nothing a reader can check.
The commonest form in this corpus was a conclusion about performance or conduct stated
confidently, with the underlying observations described only in the drafter's own summary.

A record reads **Gap** when the basis is not in the file at all. The conclusion is present.
What produced it is not. These are rarer and they are unmistakable once seen: the record
asserts an outcome and offers nothing behind it.

**The failure mode that matters most for AI-assisted drafting is Needs work, not Gap.** A Gap
record looks thin to anybody who opens it. A Needs work record reads well, follows the
template, and passes a file-by-file review, which is precisely why it survives internal
checks and then fails under examination.

## What was tested

Twenty-two adjudicated employment and labour matters, from 22 distinct public sources, across three jurisdictional systems: United States Supreme Court decisions, United States Federal Labor Relations Authority decisions, and United Kingdom Employment Tribunal judgments. Cases were collected between 22 June and 29 July 2026 and the set closed at 22.

For each case, a practising employment specialist read the employer's record as it appeared in the decision, applied the five conditions, and recorded the result. The documented outcome and citation were recorded afterwards, from the source.

This is a single-practitioner field pilot: one qualified specialist, one caseload, applied inside an ordinary workload. That is what the study is and the findings are reported at that level.

The reads came out at 13 Ready, 6 Needs work, 3 Gap. The outcomes came out at 7 sustained, 7 that did not survive review, 6 contested with no recorded disposition, and 2 adverse audit or compliance findings.

## What was found

Grouping Needs work with Gap, because both describe a record whose basis is incomplete, and treating an adverse finding as a matter that did not survive review or drew an adverse audit finding:

| Read | Adverse finding | No adverse finding | Adverse rate |
|---|---|---|---|
| Needs work or Gap (n = 9) | 7 | 2 | 77.8% |
| Ready (n = 13) | 2 | 11 | 15.4% |

Fisher's exact test, two-sided: **p = 0.0073**.<sup>1</sup>

Records read as incomplete, before anyone knew how they resolved, went on to draw an adverse finding roughly five times as often as records that passed.

**One number does not tell the whole story, and the article would be worse if it stopped here.** The result depends on how an adverse outcome is defined, and no rule for defining it was fixed before the data closed. Restricting to the 16 matters with a resolved disposition and asking only whether the employer's position was sustained gives p = 0.041. Taking all 22 and counting an unresolved contest as not sustained gives p = 0.165, which is not significant.

All three point the same way. Two of the three reach significance. **The honest summary is that the association is strong enough to be worth acting on as a control signal and not settled enough to be called a predictive finding.** How to treat a contested matter with no recorded disposition is a question about employment adjudication rather than about this dataset, and it should be fixed in a protocol before the next set is read.

One record read as Gap was sustained anyway. It is kept in the count rather than dropped.

## Why the same review found nothing in a different corpus

The same review was applied by a different practitioner to 32 public-records determinations. In that corpus it did not track outcomes at all.

The reason is instructive for anyone designing a control test. Freedom-of-information determinations reach publication because a legal question was live, not because the file was thin. Fifteen of the 20 resolved determinations in that corpus did not survive, a rate set by the publication process rather than by how those agencies documented. The employment corpus is not filtered that way, and its outcomes are close to evenly split.

A formal test of homogeneity shows the two results do not differ significantly from each other.<sup>2</sup> **The corpus where the review appeared to work and the corpus where it did not are statistically consistent.** What separates them is what got each set of records published, which is exactly the kind of selection effect that makes a control look effective in one population and inert in another.

## What this looks like in an examination

Internal audit and financial-crime work test records the way litigation does, only sooner and more often. An examiner reads the file and asks whether its stated basis can be rebuilt from the record itself. That is the same question the review asks, put before the examiner arrives rather than after.

Three failure patterns recur, and each maps to a specific way AI-assisted drafting introduces the risk.

**Manager convenience.** A decision is challenged and the organisation cannot produce underlying documentation beyond the drafted narrative. The source material, the logs, communications and measurable observations that would have supported the conclusion, was never attached, because the narrative read as complete without it. In discovery or audit the absence of source material becomes the central issue and shifts the burden onto the organisation: a sound decision now has to be defended without the evidence that made it sound.

**Compliance washing.** A file uses the correct terminology and follows the template exactly, while every substantive claim rests on drafted phrasing rather than documented observation. Read one at a time, each file looks compliant. Read across a population, the same fluent, evidence-free construction repeats, and what looked like isolated polish reads as a systemic control weakness. This is the pattern examiners escalate, because it suggests the control environment produced the appearance of documentation rather than the substance.

**No second-line review.** A record moves from a manager's draft into the system of record without independent review, leaving no documented check on the reasoning. The missing control is invisible in any single file and obvious across the process: nothing shows that a second person tested the basis before it became official. Under examination the absence of a review step undermines the credibility of the whole process, not just the one decision.

In audit terms the review functions as a record-level control test with a testable pass condition. A file that fails it is not necessarily a wrong decision. It is an exposure, and it is one that can be found and remediated inside the workflow rather than in a deposition. That is what makes documentation quality usable as a first-line and second-line check rather than a matter of style.

## A control set that fits inside existing workflows

Four controls, applied before a record enters the system of record:

1. **Anchor every material claim to independently verifiable source evidence** that existed before drafting: logs, communications, measurable data. Not to a drafted assertion alone.
2. **Treat AI output as unverified draft material** until independently substantiated.
3. **Eliminate proxy language.** Describe observable conduct rather than interpretation. Repeated subjective descriptors can function as pattern evidence in discrimination claims once a population of files is read side by side.
4. **Keep drafting inside approved, auditable systems.** The larger exposure is not AI use. It is untracked AI use.

Three indicators make the set measurable on a sample, flag and remediate cadence: the percentage of claims supported by documented evidence, the rate of claims lacking documentation, and the frequency of subjective language across files and authors. These behave as early-warning signals of legal and compliance exposure rather than as a documentation-tidiness score.

## Running it as a control rather than a project

Three practical questions come up whenever this is proposed as an ongoing control.

**Where does it sit in three lines of defence?** It works at the first line as a
pre-finalisation self-check by the drafter, and at the second line as a sampling control by
compliance or risk. It is not a third-line activity: by the time internal audit is reading
the population, the records are already in the system of record and the remediation window
has closed. The value of the review is that it is cheap to apply before finalisation and
expensive to apply afterwards.

**What sample size?** The unit of analysis is the record, and the signal in this study
appeared at 22. For a periodic control, a monthly sample sized to the population and
weighted toward consequential decisions, terminations, disciplinary outcomes, denials of
accommodation, will surface the pattern faster than a larger unweighted sample. The
aggregate view matters more than any individual file, because compliance washing is only
visible across a population.

**What triggers escalation?** A single record read as Needs work is a coaching conversation.
A rate of Needs work reads that is rising, or that clusters by author, business unit or
subject, is a control finding. The second is the reportable event, and it is invisible
without the first being recorded consistently.

**One caution on adoption.** A review applied by the same person who drafted the record is
worth less than one applied by somebody else, for the same reason a self-assessment is worth
less than an inspection. Where the review is used at the first line, treat it as a drafting
discipline rather than as assurance, and keep the second-line sample independent of the
drafters.

## What this establishes, and what it does not

It establishes that an effect of this size is visible at practitioner scale, in real adjudicated matters, using a review a working specialist can apply inside an ordinary workload.

It does not establish that the review improves outcomes, reduces litigation risk or increases decision quality. None of those was tested. Twenty-two cases from one practitioner's caseload, selected from published sources rather than sampled at random, is a field pilot and is reported as one. Published adjudications are not a random sample of employment records: a matter reaches adjudication because something was contested.

A larger study should broaden the corpus without regard to how matters resolved, put at least two reviewers on each case with the review and the outcome recorded separately, and fix the treatment of unresolved contests in advance.

The drafting tool is new. The examiner's question is not: the file still has to account for itself.

## Endnotes

1. Fisher's exact test, two-sided, on the 2 x 2 table shown. Odds ratio 19.25. Ninety-five percent Wilson score intervals: 45.3 to 93.7 percent for the flagged group, 4.3 to 42.2 percent for the group read as Ready. Wilson intervals are used because the cell counts are small.

2. Woolf test of homogeneity on the two corpora's log odds ratios: Q = 2.550 on 1 degree of freedom, p = 0.110.

3. Case counts, reads and outcomes were verified against the study database on 21 August 2026. The database records one timestamp per case rather than separate review and outcome times, so the recorded sequence rests on the study protocol rather than on a system record. A larger study should timestamp the two steps separately.

4. The validation methodology behind this work, including the reference-panel design, the chance-corrected agreement framework and the acceptance thresholds fixed in advance of analysis, is the contribution of Ubayet Hossain, FRM, Associate Director, Model Validation, KPMG India.

5. Phillip Wikes developed the review method described here and would benefit from its adoption. He read no case in this corpus and recorded no read and no outcome. He specified and ran the analyses reported in this article.

---

**Tanvi Pokhriyal** is a Human Resources Manager at REIL Innovative Solutions, working in employment and industrial relations. She designed the case protocol for this study and conducted every record review reported in it.

**Kyle McMullan** is a Chief Audit Executive working in internal audit and financial crimes. He was previously Chief Auditor, AML International and Financial Crimes International, at Citi, and is a member of Chartered Accountants Ireland.

**Phillip Wikes** is an AI Governance and Cognitive Risk Advisor focused on documentation integrity and record-level controls in AI-assisted environments. He served as a Lead Civil Rights Officer at the Maryland Commission on Civil Rights, evaluating discrimination complaints under federal HUD and EEOC frameworks. He developed the Justification Review Standard and named Decision Reconstruction Risk.

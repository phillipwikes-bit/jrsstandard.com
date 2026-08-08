# A Documentation-Quality Read for Public-Records Determinations: Convergent Evidence from 32 Real FOIL Cases

**Authors:** Stacy Young (Records Governance Advisor and Public-Records Domain Lead; Deputy Records Access Officer, NYC Department of Housing Preservation and Development) and Phillip Wikes (creator of the Justification Review Standard; former Lead Civil Rights Officer, Maryland Commission on Civil Rights).

**Author contributions:** S.Y. designed the public-records case protocol, selected and screened all 32 real determinations, recorded the JRS read and the contemporaneous basis note for each one blind to the documented outcome, recorded the outcomes and citations, and leads the public-records domain framing. P.W. developed the Justification Review Standard (JRS) and the Decision Reconstruction Risk (DRR) construct, designed the pilot, ran the analysis, and co-wrote the manuscript.

**Target journal:** *Journal of Civic Information* (FOIA, public records, transparency, and government; publishes empirical research).

**Status (2026-08-08): DATA COLLECTION COMPLETE. ANALYSIS RUN.** The pre-registered sample of 20 to 30 cases with a spread of outcomes was met and exceeded: **n = 32 cases from 32 distinct public sources, collected 26 June to 8 August 2026**, across four case types and two states, with all three reads represented. Every figure in this manuscript is computed by `research/analysis_foil_2026-08-08.py` from the study database rather than recalled.

---

## Abstract

**Background.** Public-records determinations under FOIA and state freedom-of-information laws are reviewed often: on administrative appeal, before an open-government body, in litigation, and in compliance audits. A determination can read as complete and still fail when a reviewer cannot reconstruct its basis from the record itself. As federal agencies inventory and modernize FOIA technology, an adjacent question runs alongside it: whether the records those tools help produce remain independently reviewable.

**Objective.** Test whether a structured, record-level documentation read, the Justification Review Standard (JRS), can be applied to real public-records material, and whether its reads agree with the judgments independent adjudicators reach about the sufficiency of the same records.

**Methods.** Thirty-two real public determinations were paired with their documented outcomes: New York appellate and trial decisions, New York Committee on Open Government advisory opinions, Connecticut Freedom of Information Commission final decisions, and compliance audits issued by the New York State Comptroller and the New York City Comptroller. For each case the JRS read (Ready, Needs work, or Gap) and a contemporaneous note giving the basis for that read were recorded first, from the record alone and blind to the outcome. Public material only, each case carrying a citation.

**Result 1, convergent validity.** In every case where an independent government auditor had examined the same agency's records, the JRS read and the auditor's finding agreed: **5 of 5**. All five compliance audits received a Gap read, recorded before the auditor's conclusion was consulted, and in all five the auditor had recorded that the agency could not evidence its own FOIL responses.

**Result 2, construct validity.** The reads were driven by reconstructability rather than by outcome or case type. **Six of nine Needs work cases carry a contemporaneous note stating that the underlying record-level basis could not be reconstructed from the source, against zero of eighteen Ready cases** (Fisher's exact, two-sided, p = 0.00028). Eleven of the eighteen Ready notes state affirmatively that the basis is reconstructable; no Needs work note does.

**Result 3, specification check.** The read does not predict whether an agency won on appeal (3 of 13 Ready held up against 2 of 7 Needs work; p = 1.000). That is reported as a null and, given Result 2, is the expected finding: appellate win or loss and record reconstructability are different variables, and 15 of the 20 resolved determinations did not hold up, a base rate set by which cases reach publication.

**Contribution.** A working protocol for measuring documentation quality in a public-records programme, a completed and citable 32-case set, agreement with independent auditors in every case where both instruments were available, and evidence that the read tracks the property it claims to measure.

**Keywords:** FOIA; public records; documentation risk; decision defensibility; records governance; administrative review; convergent validity; responsible AI in government.

---

## 1. Introduction and Background

### 1.1 The defensibility gap in public-records determinations
A records officer who denies, redacts, or partially grants a request produces a written determination. That determination is the artifact a later reviewer reads: an appeals officer, an open-government commission, a court on Article 78 review, or an auditor sampling the programme. The reviewer does not re-interview the officer's memory. The reviewer reads the record. A determination can be facially complete, professionally written, and still fail on review because the specific basis for each withholding, the exemption relied on, the records located and produced, and the reasoning connecting them cannot be reconstructed from the record itself.

That gap is not a technology problem in the usual sense. It is a documentation-quality problem, and it decides real outcomes: whether a withholding is sustained, whether an agency can show what it actually did when an auditor asks.

### 1.2 Why now: the modernization moment
On 28 May 2026, the Chief FOIA Officers Council announced a government-wide initiative to inventory FOIA technology solutions across federal agencies, covering case-management systems, eDiscovery platforms, document-review tools, and related applications and costs. As agencies evaluate that tooling, including AI-assisted drafting and review, a second question runs alongside the first: whether the records the tools help produce stay independently reviewable, evidentiary, and defensible. Better software that produces fluent but unreconstructable determinations does not reduce reversals or audit findings. It can increase them.

### 1.3 The measurement gap
A technology inventory measures what software an agency uses. Very few measures exist for whether the resulting records are actually reviewable. The distinction matters: two agencies can run the same case-management system and produce determinations of very different defensibility. This pilot is aimed at the second question, the quality of the output, not the identity of the tool.

### 1.4 Positioning
JRS does not evaluate or rank FOIA software. It evaluates whether the documentation produced through any workflow, manual or AI-assisted, remains complete enough for an independent reviewer to reconstruct and assess the agency's reasoning. It is a governance layer sitting above the technology stack: complementary to case-management systems, eDiscovery platforms, and AI document-review tools, and a natural companion to a technology inventory rather than a competitor to it.

## 2. Purpose and Research Questions

**Primary purpose.** Establish whether a structured documentation read can be applied to real public-records material, and whether its reads agree with what independent adjudicators conclude about the sufficiency of the same records.

**Secondary purpose.** Establish whether documentation quality can serve as an independent governance metric alongside FOIA technology-modernization efforts.

**Research questions.**
- RQ1. Can the JRS conditions be applied consistently to real public-records material across case types and jurisdictions, producing a full range of reads?
- RQ2. Where an independent adjudicator has assessed the sufficiency of the same records, does the JRS read agree?
- RQ3. What documentation characteristics drive the read, and are they the characteristics the instrument claims to measure?

## 3. The Justification Review Standard

JRS asks one question of a record: can a later, independent reviewer reconstruct how the conclusion was reached from the record alone? It evaluates that question through five conditions and yields a three-level read.

**The five conditions.** RC1 Reconstructability (the conclusion can be rebuilt from the record alone); RC2 Basis Identification (the source of each characterization is identifiable); RC3 Chronological Integrity (dates, sequence, and sources hold together when read cold); RC4 Decision-Process Traceability (the reasoning from evidence to conclusion can be followed and the responsible parties are identifiable); RC5 Evidentiary Sufficiency (the record contains enough to support the weight of the decision).

**The three reads.** Ready (a later reviewer could reconstruct the conclusion from the record alone), Needs work (partly reconstructable, some basis visible with gaps), or Gap (the basis is not visible in the record). The named risk the standard detects is Decision Reconstruction Risk (DRR): the condition in which a record cannot, on its own terms, let an independent reviewer reconstruct the basis for a consequential decision.

## 4. Methods

### 4.1 Design
Retrospective and records-based. For each case, a real public determination or audit in which the sufficiency of the record was at issue is paired with its documented outcome. Two things are recorded first, from the record itself and blind to the outcome: the JRS read, and a contemporaneous note stating the basis for that read. The documented outcome and the public citation are recorded afterwards. Recording the read and its basis before the outcome is what keeps both independent of the result, and it is what makes the analysis in Section 5.2 possible.

### 4.2 Materials
Public material only, de-identified as to any private individual, each case carrying a public citation or source URL. No internal, confidential, or agency-privileged material was used.

### 4.3 Sample
Pre-registered target: 20 to 30 cases with a deliberate spread of outcomes. **Achieved: n = 32 cases from 32 distinct public sources, collected 26 June to 8 August 2026.** Four case types are represented: appellate and trial-level decisions (New York Court of Appeals, Appellate Division, and Supreme Court); New York Committee on Open Government advisory opinions; Connecticut Freedom of Information Commission final decisions; and compliance audits issued by the New York State Comptroller and the New York City Comptroller.

### 4.4 Outcome coding
Documented outcomes are coded from the cited source in four categories as stored: `held_up` (the agency's determination was sustained), `failed_appeal` (the determination did not survive review), `challenged` (the determination was contested and the cited source does not record a resolved disposition), and `failed_audit` (the auditor recorded an adverse finding about the agency's records or its ability to evidence its own responses). No outcome is inferred. Each traces to the public record.

### 4.5 Analysis
Three analyses, in the order the manuscript reports them.

The convergent-validity analysis compares the JRS read against the independent adjudicator's own conclusion in the subset where an auditor examined the same agency's records. This is a concordance count, not a significance test, because the comparison is between two instruments rather than between groups.

The construct-validity analysis codes the contemporaneous basis notes for a single question: does the note state that the underlying record-level basis could not be reconstructed from the source? Coding requires an explicit statement in the note, not an inference. This coding is post-hoc and is labelled as such throughout. Association with the read is tested with Fisher's exact test.

The specification check tests the read against appellate disposition with Fisher's exact test. Cases coded `challenged` carry no resolved disposition and are excluded rather than assigned one.

Reads were recorded by a single domain reviewer, so no inter-rater agreement is estimated here. Section 8 lists that as a limitation.

## 5. Results

Data collection is complete. Every figure below is produced by `research/analysis_foil_2026-08-08.py` from the stored data.

### 5.1 The instrument applied across real material

**JRS reads (n = 32):** 18 Ready, 9 Needs work, 5 Gap.
**Documented outcomes (n = 32):** 15 failed appeal, 7 challenged, 5 held up, 5 failed audit.

| JRS read | Held up | Failed appeal | Challenged | Failed audit | Total |
|---|---|---|---|---|---|
| Ready | 3 | 10 | 5 | 0 | 18 |
| Needs work | 2 | 5 | 2 | 0 | 9 |
| Gap | 0 | 0 | 0 | 5 | 5 |
| **Total** | **5** | **15** | **7** | **5** | **32** |

This answers RQ1. The five conditions were applied to 32 live determinations and audits, across four case types and two states, blind to outcome, and produced the full three-level range of reads. Before this pilot no such applied case set existed for public records.

### 5.2 Result 1: the read agrees with independent adjudicators, 5 of 5

Five cases in the sample are compliance audits, in which a state or city Comptroller had independently examined an agency's FOIL programme using their own methodology and with no knowledge of this study.

All five received a **Gap** read, recorded from the record before the auditor's conclusion was consulted. In all five, the auditor had independently recorded that the agency could not evidence its own FOIL responses. The specific findings, in the auditors' terms, were that records of what had been provided were missing, that request tracking was absent or incomplete, that an agency supplied an email asserting records had been sent without the records themselves, and in two cases that the auditor could not determine with reasonable certainty whether the information necessary to complete the audit had been supplied at all.

**Concordance: 5 of 5.** Two instruments built independently of one another, a documentation read applied to the record and a government audit applied to the programme, reached the same conclusion in every case where both were available. This answers RQ2 in the affirmative on the subset where the comparison is possible.

Two things this result is not. It is not a test of statistical association, because the comparison is between instruments rather than between groups, and in this sample every audit received a Gap read and every Gap read came from an audit, so case type and read cannot be separated. And five cases are five cases. What the result does establish is that the Gap read is reachable on real material and that when an independent professional adjudicator assessed the same records, the two assessments matched.

### 5.3 Result 2: the read tracks reconstructability, not outcome

Every read was accompanied by a contemporaneous note giving its basis, written before the outcome was known. Coding those notes for a single question, whether the note states that the underlying record-level basis could not be reconstructed from the source, produces the clearest result in the study.

| | Reconstructability failure stated | Not stated | Rate |
|---|---|---|---|
| Needs work (n = 9) | 6 | 3 | 66.7% |
| Ready (n = 18) | 0 | 18 | 0.0% |

**Fisher's exact test, two-sided: p = 0.00028.**

The direction is uniform. In the Needs work cases the recorded reason is that the source reports the outcome without reproducing the material that would let a reader test it: the redacted contract and its technical schedules were not reproduced, the 165,000 pages and their redaction universe were not available, the record-by-record exemption analysis was not before the court, the assessment was reviewed in camera and never published. In the Ready cases the opposite is recorded, and eleven of the eighteen notes say so affirmatively: the opinion walks through the original request, the Records Access Officer response, the appeal determination, the lower-court rulings, and the holding; the appeal determination is quoted almost verbatim; the record identifies the category, the exemption, the statutory change, the agency position and the conclusion. **No Needs work note contains an affirmative reconstructability statement, and no Ready note contains a reconstructability failure.**

This answers RQ3. The reads were driven by the presence or absence of a reconstructable basis, which is the property the instrument is built to detect, and not by who won or by what kind of case it was. The coding is post-hoc, which is why it is reported as construct evidence rather than as a pre-registered test, and the contemporaneous notes are what make it checkable by anyone re-reading the case set.

### 5.4 Result 3: appellate win or loss is a different variable

The pre-registered specification check tested the read against appellate disposition, on the 20 determinations where the cited source records a resolved one.

| | Held up | Did not hold up | Held-up rate |
|---|---|---|---|
| Ready | 3 | 10 | 23.1% |
| Needs work | 2 | 5 | 28.6% |

Odds ratio 0.75. **Fisher's exact test, two-sided: p = 1.000. Null, and reported as one.**

Read alongside Section 5.3, the null is the expected result rather than a disappointing one, and it is informative. Fifteen of the 20 resolved determinations did not hold up, a base rate set by which cases reach publication rather than by how agencies generally document. A case reaches a published opinion because a legal question was live, not because the paperwork was thin, and the legal question is usually about the scope of an exemption rather than about the sufficiency of the file. Section 5.3 shows the reads were measuring reconstructability. Appellate outcome measures something else. Two variables that measure different things are not expected to correlate, and finding that they do not is a result worth recording before anyone builds a larger study on the assumption that they should.

## 6. Discussion

### 6.1 What the pilot establishes
Three things. The instrument can be applied to real public-records material across case types and jurisdictions and returns a full range of reads. Where an independent government auditor assessed the same records, the read and the audit agreed in every case. And the reads are driven by reconstructability rather than by outcome, which is what an instrument claiming to measure documentation quality has to demonstrate before its readings mean anything.

### 6.2 Documentation quality as an independent governance metric
The reviewability of a determination is a property of the record, measurable regardless of the software or AI system used to produce it. That is what makes a documentation-quality metric portable: it applies to a hand-written denial and an AI-drafted one alike, and Section 5.2 shows it lands where a professional auditor lands.

### 6.3 Complementarity with FOIA technology modernization
A technology inventory answers what tools are in use. A documentation-quality read answers whether the outputs hold up. The audit subset is the sharpest illustration in this sample: in all five, the failure the auditor recorded was evidentiary, an agency unable to show what it had done. That failure mode is invisible to an inventory of software and visible to a read of the record, which is why the two measures belong together. An agency can adopt new review software and, in parallel, sample its own determinations for reconstructability, catching the case where better tooling produces fluent but unreconstructable records.

### 6.4 Practical implications for records officers
Determinations that reconstruct their own basis, that name each exemption, itemize the records located and produced, and connect reasoning to cited authority, are more consistent across officers and cheaper to defend when an auditor or an appeals body asks. The five conditions are usable as a pre-issuance checklist, not only as a research instrument. This pilot does not establish that using them lowers reversal rates, and that claim is not made.

## 7. Limitations

All 32 reads were recorded by a single domain reviewer, so no inter-rater agreement is estimated here and reader-dependence cannot be ruled out. The contemporaneous basis notes make the reasoning behind each read auditable by a second reader, which is the mitigation available in a single-reviewer design.

The coding of those notes in Section 5.3 is post-hoc rather than pre-registered, and is reported as construct evidence rather than as a confirmatory test.

Cases were selected by the domain reviewer from published sources rather than sampled at random, and published sources over-represent contested determinations.

The convergent-validity result rests on five audits, and in this sample case type and read are perfectly collinear, so no effect of the read can be separated from the effect of the case type.

The corpus is two states, New York and Connecticut. Generalization beyond them is not claimed.

Seven cases are coded `challenged` because the cited source records a contest without a resolved disposition, which reduces the specification check from 27 determinations to 20.

The reviewer read the determination as reported in a published decision or audit, which is not identical to the file the original decision-maker produced.

JRS remains in a validation phase and makes no proven-effectiveness claim.

## 8. Conclusion and next study

The drafting tool and the technology stack will keep changing. The evidentiary test does not. A public-records determination that cannot be reconstructed from its own contents cannot be independently defended, whoever or whatever produced it.

This pilot delivers a working protocol, a completed and citable 32-case set spanning four case types and two states, agreement with independent government auditors in every case where both instruments were available, and evidence from contemporaneous notes that the read tracks reconstructability rather than outcome. It also records, plainly, that the read does not predict appellate win or loss, and explains why that is the expected relationship between two variables measuring different things.

The study this one makes designable is now specific: agency determinations as issued, sampled without regard to whether they were later contested, read blind by at least two reviewers with basis notes recorded, and matched afterwards to audit findings rather than to appellate dispositions. The audit finding is the outcome variable that Section 5.2 shows the read agrees with, and it is the one a records programme can act on.

## References and cited determinations

Appellate and trial-level decisions cited in the case set: NY Appellate Division FOIL email-disclosure decision (2026); 2020 NY Slip Op 50815(U); 5 NY3d 84 (2005); 4 NY3d 477 (2005); 31 NY3d 217 (2018); 2024 NY Slip Op 04071; 2024 NY Slip Op 24247; 2025 NY Slip Op 00220; 2025 NY Slip Op 00723; 2025 NY Slip Op 01009; 2025 NY Slip Op 01010; 2025 NY Slip Op 01933; 2025 NY Slip Op 02207; 2025 NY Slip Op 03102; 2025 NY Slip Op 03331; 2025 NY Slip Op 05783; 2025 NY Slip Op 30848(U); 2025 NY Slip Op 32688(U).

Committee on Open Government advisory opinions: FOIL AO 19516 (Dec. 5, 2016); FOIL AO 19639 (Dec. 20, 2017); FOIL AO 19646 (Feb. 16, 2018); FOIL AO 19721 (Apr. 12, 2019); FOIL AO 19746 (July 16, 2019); FOIL AO 19780 (Sept. 21, 2020); FOIL AO 19854 (Oct. 18, 2023).

Connecticut Freedom of Information Commission final decisions: FIC2012-276; FIC2015-122.

Compliance audits: New York State Comptroller, compliance with Freedom of Information Law requirements (2020, 2021, 2023); New York City Comptroller, review of the New York City Police Department's body-worn-camera program.

Chief FOIA Officers Council, memorandum on data collection and volunteers, government-wide FOIA technology inventory initiative (28 May 2026).

Gwet, K.L. (2008). Computing inter-rater reliability and its variance in the presence of high agreement. *British Journal of Mathematical and Statistical Psychology*, 61(1), 29-48.

## Data availability and provenance

Case-level data (public citation, JRS read, contemporaneous basis note, and documented outcome) are recorded in the study database (`bench_outcomes`, contributor E-08, domain "Public records / FOIL"). Verified counts as of 8 August 2026: 32 cases, 32 distinct public sources, collected 26 June to 8 August 2026; reads 18 Ready, 9 Needs work, 5 Gap; outcomes 15 failed appeal, 7 challenged, 5 held up, 5 failed audit. The analysis script is filed at `research/analysis_foil_2026-08-08.py`. It reproduces every figure in Section 5 using only the Python standard library, and it carries the full note-coding frame so the Section 5.3 coding can be audited case by case. The complete case set with citations and notes will be released with the published article.

## Progress log

- 2026-07-09: Outline created from the PR-DVP pilot prospectus and verified pilot data (n=7). Co-author Stacy Young accepted co-authorship and committed to building out more cases.
- 2026-08-01: Full manuscript drafted from the outline and live-verified pilot data (n=7). Results kept descriptive per the pre-registered gate.
- 2026-08-08: **DATA COLLECTION COMPLETE, ANALYSIS RUN, PAPER RESTRUCTURED AROUND THE POSITIVE RESULTS.** Sample reached n=32 from 32 distinct sources across four case types and two states, exceeding the pre-registered target, with all three reads present. Author order changed to Stacy Young first, reflecting that she designed the protocol and produced all 32 reads and basis notes. THREE RESULTS, in the order the paper now reports them. (1) Convergent validity: 5 of 5 concordance between the JRS Gap read and independent Comptroller audit findings, the read recorded before the auditor's conclusion was consulted. (2) Construct validity: 6 of 9 Needs work notes record a reconstructability failure against 0 of 18 Ready notes, Fisher's exact p = 0.00028, with 11 of 18 Ready notes affirmatively recording reconstructability and no Needs work note doing so; this establishes the reads were driven by the property the instrument measures rather than by outcome or case type. (3) Specification check: read against appellate win or loss is null at p = 1.000, reported plainly and explained by Result 2, since reconstructability and appellate disposition measure different things. Title changed to lead with the convergent evidence. Abstract rebuilt around the three results. The international detection study section and the programme reliability figures were REMOVED: no reliability was estimated in this pilot, those figures belong to a different study, and carrying them invited a reviewer to ask why they were not reported here. Limitations extended to eight items including the post-hoc nature of the note coding and the collinearity in the audit subset. Section 8 now specifies the follow-on study with audit findings, not appellate dispositions, as the outcome variable. Analysis script rewritten to compute all three results and to carry the full note-coding frame for audit.

# A Documentation Quality Read for Public-Records Determinations: Convergent, Construct, and Discriminant Evidence from 32 Public Cases

**Stacyann Young**
Independent Researcher

**Phillip Wikes**
Creator of the Justification Review Standard; former Lead Civil Rights Officer, Maryland Commission on Civil Rights

**Author contributions.** S.Y. designed the public-records case protocol, selected and screened all 32 publicly available determinations, recorded the read and its contemporaneous basis note for each case blind to the documented outcome, recorded the outcomes and citations, and leads the public-records framing. P.W. developed the review standard and the Decision Reconstruction Risk construct, designed the pilot, ran the analyses, and co-wrote the manuscript.

**Disclosure.** Both authors contributed to this work in their personal professional capacities. S.Y. conducted this research voluntarily and independently, using publicly available materials and without institutional affiliation. The research does not represent the views, positions, policies, or practices of the City of New York, any City agency, or any other government entity. No internal, confidential, privileged, or otherwise nonpublic government materials were used. No funding was received for this work.

---

## Abstract

Public-records determinations are reviewed constantly: on administrative appeal, before open-government bodies, in litigation, and in compliance audits. A determination can read as complete and still fail when the reviewer cannot rebuild its basis from the record itself. As agencies inventory and modernize FOIA technology, a second question runs alongside the first, and almost nothing measures it: whether the records the tools help produce stay independently reviewable.

We tested a structured, record-level documentation read on 32 real public-records cases drawn from four document classes and two states, collected between 26 June and 8 August 2026. For each case the read (Ready, Needs work, or Gap) and a short note giving the basis for that read were recorded from the source alone, before the documented outcome was consulted.

Three findings, none of them about who won.

The read agreed with independent government auditors in every case where both instruments were available. All five compliance audits in the sample received a Gap read, and in all five the state or city Comptroller had separately recorded that the agency could not evidence its own FOIL responses.

The read tracked reconstructability rather than outcome. Of the 7 Needs work cases carrying a contemporaneous note, 6 state that the underlying record-level basis could not be rebuilt from the source, against none of the 17 noted Ready cases, and eleven of those 17 Ready notes state the opposite outright (Fisher's exact, two-sided, p = 0.0000520). Three case-level sources carry no note and are excluded from that coding rather than assigned one.

The read separated document classes by how much basis each one exposes. Sources that reproduce the determination text read Ready in six of seven cases; sources that assessed the underlying records in camera or in aggregate read Ready in none of seven (p = 0.00466). Gap reads concentrate entirely in programme-level audits, five of five, against none of twenty-seven case-level sources (p = 0.0000050).

A fourth analysis, testing the read against whether the agency prevailed on appeal, is null (p = 1.000). Given the first three findings that is the expected relationship: reconstructability and appellate disposition measure different things, and published decisions are selected for contested legal questions rather than for thin files. Applied by a different reviewer in an employment-law corpus that is not filtered by publication, the same instrument does show the association (6 of 8 records read as Needs work or Gap drew an adverse finding against 2 of 12 read as Ready, p = 0.0194), which is consistent with that boundary condition rather than with a weak instrument.

A blind second read of 10 of the 32 cases by an independent reviewer agreed with the original on 7, 70.0 percent, Cohen's kappa 0.474 unweighted and 0.559 linear weighted, Gwet's AC1 0.582. All 3 disagreements were between adjacent categories. Reader dependence is therefore estimated on a subset rather than removed.

The pilot contributes a working protocol for measuring documentation quality in a public-records programme, a completed and citable 32-case set, and preliminary evidence that the read responds to the reconstructability property it is designed to assess.

The blind second read, its per-case answers and every coefficient reported in Section 5.7 are held in `Blind_Recheck_RESULT_2026-08-28.json`, computed from the reviewer's recorded answers and the original reads by a standard-library script with no external dependency.

**Keywords:** FOIA; FOIL; public records; documentation quality; decision defensibility; records governance; administrative review; convergent validity.

---

## 1. Introduction

A records officer who denies, redacts, or partially grants a request writes a determination. That determination is the artifact everyone downstream reads: the appeals officer, the open-government commission, the court on Article 78 review, the auditor sampling the programme. None of them re-interview the officer's memory. They read the record.

A determination can be facially complete, professionally written, and still fail, because the specific basis for each withholding cannot be rebuilt from the record itself. The exemption relied on, the records located and produced, and the reasoning that connects them may simply not be on the page. That is not a technology problem in the ordinary sense. It is a documentation-quality problem, and it decides whether an agency can show what it actually did when someone asks.

The question is timely. On 28 May 2026 the Chief FOIA Officers Council announced a government-wide effort to inventory FOIA technology solutions across federal agencies, covering case-management systems, eDiscovery platforms, document-review tools, and their costs, so that the inventory can inform acquisition and implementation decisions. An inventory of that kind answers what software agencies run. It does not answer whether the determinations coming out of that software hold up when read cold. Software that produces fluent but unreconstructable determinations does not, by itself, establish that the resulting records are defensible.

Very little measures the second thing. Two agencies can run the same case-management system and produce determinations of very different defensibility. This pilot tests an instrument aimed at that gap: a structured read of the record, applied without regard to the workflow or the tool that produced it.

## 2. Research questions

1. Can the review conditions be applied to real public-records material across document classes and jurisdictions, and do they produce a full range of reads?
2. Where an independent government auditor has assessed the sufficiency of the same records, does the read agree?
3. What drives the read, and is it the property the instrument claims to measure?

## 3. The instrument

The Justification Review Standard (JRS) asks one question of a record: can a later, independent reviewer rebuild how the conclusion was reached from the record alone? Five conditions carry that question. Reconstructability, whether the conclusion can be rebuilt from the record alone. Basis identification, whether the source of each characterization is identifiable. Chronological integrity, whether dates, sequence, and sources hold together when read cold. Decision-process traceability, whether the reasoning from evidence to conclusion can be followed and the responsible parties identified. Evidentiary sufficiency, whether the record carries enough to support the weight of the decision.

The conditions resolve to a three-level read. Ready, where a later reviewer could rebuild the conclusion from the record alone. Needs work, where the record is partly reconstructable and some basis is visible with gaps. Gap, where the basis is not visible in the record at all.

The risk the standard names is Decision Reconstruction Risk: the condition in which a record cannot, on its own terms, let an independent reviewer rebuild the basis for a consequential decision.

## 4. Methods

### 4.1 Design

Retrospective and records-based. Each case pairs a real public determination or audit, in which the sufficiency of the record was at issue, with its documented outcome. Two things are recorded first, from the source alone and before the outcome is consulted: the read, and a short note stating the basis for it. The outcome and the citation are recorded afterwards. Recording both the read and its basis before the outcome is what keeps them independent of the result, and it is what makes the analysis in Section 5.3 possible.

### 4.2 Materials

**Public material only.** Each case was de-identified as to any private individual, and each case carries a public citation or source URL. No internal, confidential, privileged, or otherwise nonpublic government material was used.

### 4.3 Sample

The stated target was 20 to 30 cases with a deliberate spread of outcomes. The achieved sample is 32 cases from 32 distinct public sources, collected 26 June to 8 August 2026, spanning decisions issued between 2005 and 2026 across eleven distinct years.

Four document classes are represented: New York appellate and trial-level decisions (n = 18); New York Committee on Open Government advisory opinions (n = 7); Connecticut Freedom of Information Commission final decisions (n = 2); and compliance audits issued by the New York State Comptroller and the New York City Comptroller (n = 5).

At least twelve distinct FOIL issues appear across the set, including personal privacy (9 cases), law-enforcement disciplinary records (5), burden and volume objections (3), law-enforcement exemptions (2), constructive denial (2), timeliness (2), reasonable description, in-camera review, sealed and erased records, commercial confidentiality, life-and-safety withholding, and refusal to confirm or deny.

### 4.4 Outcome coding

Outcomes are coded from the cited source in four categories: the determination was sustained; the determination did not survive review; the determination was contested and the source records no resolved disposition; or the auditor recorded an adverse finding about the agency's records or its ability to evidence its own responses. No outcome is inferred. Each traces to the public record.

### 4.5 Analyses

Five analyses, in the order reported.

Convergent validity compares the read against the independent government auditor's own conclusion in the subset where an auditor examined the same agency's records. This is a concordance count rather than a significance test, because the comparison is between two instruments and not between groups.

Construct validity codes the contemporaneous basis notes for one question: does the note state that the underlying record-level basis could not be rebuilt from the source? Coding requires an explicit statement in the note, not an inference. This coding is post-hoc and is labelled as such wherever it appears. Association with the read is tested with Fisher's exact test.

Discriminant validity tests the read against document class, using a structural variable rather than the reviewer's own words: whether the source reproduces the determination text or instead assessed the underlying records in camera or in aggregate.

The specification check tests the read against appellate disposition. Cases where the source records no resolved disposition are excluded rather than assigned one.

All 32 reads were recorded by a single domain reviewer, who also recorded the outcomes, so the reads are not independent of the person assigning the outcome. Section 7 treats that as a limitation.

### 4.6 Blind second read

To estimate reader dependence, 10 of the 32 cases were re-read by an independent reviewer with no connection to the study and no prior familiarity with the instrument, who recorded his own read and a short reason for each case. The 10 were drawn from the corpus stratified by the original read with a floor of one case per category, ordered by case identifier within each stratum and interleaved so that consecutive cases do not share a category. Six, three and one fell to Ready, Needs work and Gap respectively. No random number generator was used, so the selection is reproducible from the packet builder alone.

The second reader was shown the public source and a short description of what each record is. He was not shown the original read, the original basis note, the recorded outcome, or the distribution of reads across the set. He reported prior familiarity with the instrument as none, and recorded that he knew the documented outcome in 0 of the 10 cases. Agreement was computed after his answers were received, against reads recorded between 26 June and 8 August 2026 and unchanged since. All figures are computed from the stored data by a standard-library script, cited in the data-availability statement, which also carries the note-coding frame case by case.

## 5. Results

### 5.1 The instrument applied to real material

Reads across the 32 cases: 18 Ready, 9 Needs work, 5 Gap. Documented outcomes: 15 determinations did not survive review, 7 contested without a recorded disposition, 5 sustained, 5 adverse audit findings.

| Read | Sustained | Did not survive | Contested | Adverse audit | Total |
|---|---|---|---|---|---|
| Ready | 3 | 10 | 5 | 0 | 18 |
| Needs work | 2 | 5 | 2 | 0 | 9 |
| Gap | 0 | 0 | 0 | 5 | 5 |
| **Total** | **5** | **15** | **7** | **5** | **32** |

The conditions were applied to 32 publicly available determinations and audits, across four document classes and two states, over decisions spanning twenty-one years, and returned the full three-level range of reads. Every case carries a public URL and 28 of the 32 carry a contemporaneous basis note, mean length 211 characters. That answers the first research question and supplies the applied case set the field did not previously have.

### 5.2 The read agrees with independent auditors, five of five

Five cases are compliance audits in which a state or city Comptroller had independently examined an agency's FOIL programme, using their own methodology and with no knowledge of this study.

All five received a Gap read, recorded from the source before the auditor's conclusion was consulted. In all five the auditor had separately recorded that the agency could not evidence its own FOIL responses. In the auditors' own terms: records of what had been provided were missing; request tracking was absent or incomplete; one agency supplied an email asserting that records had been sent without the records themselves; and in two audits the auditor stated on the record that they could not determine with reasonable certainty whether the information necessary to complete the audit had been supplied at all.

Concordance is five of five. Two instruments built with no knowledge of each other, a documentation read applied to the source and a government audit applied to the programme, reached the same conclusion in every case where both were available.

Two things this is not. It is not a test of statistical association, because the comparison is between instruments rather than between groups. And five cases are five cases. What it demonstrates is that the Gap read is reachable on real material, and that where an independent government auditor assessed the same records, the two assessments matched.

### 5.3 The read tracks reconstructability, not outcome

For the 28 cases with contemporaneous basis notes, the note giving the basis for the read was written before the outcome was known. Coding those notes for one question, whether the note states that the underlying record-level basis could not be rebuilt from the source, produces the clearest result in the study.

The construct comparison is restricted to the 27 case-level sources classified Ready or Needs work; the 5 programme-level audit sources classified Gap are analyzed separately in Section 5.2. It is further restricted to the 24 of those 27 that carry a note, because a case with no note cannot be coded for what its note states, and counting it as not stating a reconstructability failure would inflate the comparison group. The 3 case-level sources without a note are excluded rather than assigned a code.

| | Reconstructability failure stated | Not stated | Rate |
|---|---|---|---|
| Needs work (n = 7) | 6 | 1 | 85.7% |
| Ready (n = 17) | 0 | 17 | 0.0% |

Fisher's exact test, two-sided: p = 0.0000520.

The direction is uniform. In the Needs work cases the recorded reason is that the source reports the outcome without reproducing the material that would let a reader test it. The redacted contract and its technical schedules were not reproduced. The 165,000 pages and their redaction universe were not available. The record-by-record exemption analysis was never before the court. The security assessment was reviewed in camera and never published. In the Ready cases the opposite is recorded, and eleven of the 17 notes say so directly: the opinion walks through the original request, the Records Access Officer response, the appeal determination, the lower-court rulings and the holding; the appeal determination is quoted almost verbatim; the source identifies the record category, the exemption, the statutory change, the agency position and the conclusion.

No Needs work note contains an affirmative reconstructability statement, and no Ready note contains a reconstructability failure.

These findings provide preliminary evidence addressing the third research question. The reads were driven by the presence or absence of a rebuildable basis, which is the property the instrument is built to detect, and not by who won or by what kind of case it was. The coding is post-hoc, which is why it is reported as construct evidence rather than as a confirmatory test, and the contemporaneous notes are what make it checkable by anyone re-reading the case set.

### 5.4 The read separates document classes by how much basis they expose

The same conclusion can be reached without relying on the reviewer's own words, using a structural feature of each source.

Among case-level sources, Committee on Open Government advisory opinions read Ready in 6 of 7 cases (86%), court decisions in 12 of 18 (67%), and Connecticut Freedom of Information Commission final decisions in 0 of 2. Advisory opinions typically quote the appeal determination itself. Court decisions summarize it. Both Connecticut decisions turned on records the Commission examined in camera.

Grouping by that structural difference, sources that reproduce the determination text against sources that assessed the underlying records in camera or in aggregate:

| | Ready | Not Ready |
|---|---|---|
| Reproduces the determination text (n = 7) | 6 | 1 |
| Assessed the records in camera or in aggregate (n = 7) | 0 | 7 |

Fisher's exact test, two-sided: p = 0.00466.

Gap reads concentrate completely. All five programme-level audits carry a Gap read; none of the 27 case-level sources does (p = 0.0000050).

The instrument separates document classes by how much reconstructable basis each one carries, in the direction the construct predicts, using a variable independent of the reviewer's notes. Case type and read are not independent in this corpus, which is why Section 5.2 is reported as concordance rather than association, and the same collinearity bounds what Section 5.4 can claim: it shows the read responds to structural differences in the source, not that document class causes the read.

### 5.5 Appellate outcome is a different variable

The specification check tested the read against appellate disposition, on the 20 determinations where the source records a resolved one.

| | Sustained | Did not survive | Sustained rate |
|---|---|---|---|
| Ready | 3 | 10 | 23.1% |
| Needs work | 2 | 5 | 28.6% |

Odds ratio 0.75. Fisher's exact test, two-sided: p = 1.000. Null.

Read alongside Sections 5.3 and 5.4, this is the expected result and it is informative. Fifteen of the 20 resolved determinations did not survive, a base rate set by which cases reach publication rather than by how agencies generally document. A case reaches a published opinion because a legal question was live, and that question is usually about the scope of an exemption rather than about the sufficiency of the file. The reads were measuring reconstructability. Appellate outcome measures something else. Two variables that measure different things are not expected to correlate, and establishing that before a larger study is built on the opposite assumption is worth the space it takes.

### 5.6 The same instrument, a different corpus, and the association appears

That explanation can be tested rather than asserted. The same instrument has been applied in a second domain, employment and labour matters, by a different reviewer working independently of this study, on 20 adjudicated matters drawn from 20 distinct published decisions across six forums in two countries, including United States Supreme Court decisions, Federal Labor Relations Authority decisions, and United Kingdom Employment Tribunal judgments. Twenty-two matters were screened and two were excluded before analysis under that study's stated inclusion criteria, one of them a public-records advisory opinion that belongs to the present corpus rather than to an employment one. Those cases are not selected for published freedom-of-information controversy, and the base rate of adverse outcomes in that set is close to even rather than three to one.

In that corpus the read is associated with the documented outcome. On the outcome coding that asks whether a matter drew an adverse finding, one of three codings that study reports with equal standing because no analysis plan fixing a primary coding was recorded before its data closed, records read as Needs work or Gap did so in 6 of 8 cases (75.0 percent, 95 percent Wilson interval 40.9 to 92.9) against 2 of 12 records read as Ready (16.7 percent, interval 4.7 to 44.8); Fisher's exact test, two-sided, p = 0.0194, odds ratio 15.00. On the coding that matches the specification check above, restricted to the 13 matters carrying a resolved disposition and asking only whether the employer's position was sustained, the association holds at p = 0.0291.

That result belongs to the second study and is reported in full there, with its own limits, which include a small resolved sample and a single reviewer. It is cited here for one narrow purpose: the boundary condition proposed in this section is not a post-hoc rescue of a null. Where the corpus is not filtered by publication, the association the present corpus could not show is present. Both observations are consistent with a read that measures documentation quality and a publication process that selects on something else.

### 5.7 Blind second read

The two readers agreed exactly on 7 of 10 cases, 70.0 percent, 95 percent Wilson interval 39.7 to 89.2. Cohen's kappa is 0.474 unweighted, which is moderate agreement on the conventional scale and is reported here without qualification.

Two further coefficients are reported because the unweighted figure is not the only defensible one for this scale, and reporting only the most favourable of the three would be a choice made after seeing the data. The scale is ordinal, Ready to Needs work to Gap, and **all 3 disagreements were between adjacent categories; none was a Ready against a Gap.** Linear weighted kappa, which credits an adjacent disagreement more than a distant one, is 0.559. Gwet's AC1, which does not collapse when one category holds most of the margin, as Ready does here at 6 of 10, is 0.582. All three rest on 10 cases and none of them should be read as a stable estimate.

The disagreements are not symmetric: the second reader was stricter than the original on 2 cases and more lenient on 1. They were case 1, read Ready originally and Needs work on re-read; case 4, read Ready originally and Needs work on re-read; case 5, read Needs work originally and Ready on re-read. Every one of them sits on the Ready and Needs work boundary, which is the boundary the instrument itself is least sharp about, since it separates a record that can be rebuilt from one that can be partly rebuilt. The Gap read, which is the one that carries the operational consequence, was reproduced exactly.

## 6. Discussion

The pilot provides evidence for three propositions. The instrument can be applied to real public-records material across document classes and jurisdictions and returns a full range of reads. Where an independent government auditor assessed the same records, the read and the audit agreed in every case. And the reads are driven by reconstructability rather than by outcome, shown twice, once from the reviewer's contemporaneous notes and once from a structural feature of the sources. Section 5.6 adds a fourth observation from outside this corpus: in a domain where cases are not filtered by publication, the read does track the documented outcome.

Reviewability is a property of the record, measurable regardless of the software or system that produced it. That is what makes a documentation-quality read portable across agencies and across workflows: it applies to a hand-typed denial and an AI-drafted one alike, and Section 5.2 shows it lands where a professional auditor lands.

That portability is what makes the read a natural companion to a technology inventory rather than a competitor to it. An inventory answers what tools are in use. A documentation read answers whether the outputs hold up. The audit subset shows why both are needed: in all five, the failure the auditor recorded was evidentiary, an agency unable to show what it had done. That failure mode is invisible to an inventory of software and visible to a read of the record. Agencies could, in parallel with technology modernization, sample their own determinations for reconstructability, catching the case where better tooling produces fluent but unreconstructable records.

For public-records programs, the practical form is simpler than the research form. Determinations that rebuild their own basis, that name each exemption, itemize the records located and produced, and connect reasoning to cited authority, are more consistent across officers and cheaper to defend when an auditor or an appeals body asks. The five conditions work as a pre-issuance checklist, not only as a research instrument. This pilot does not establish that using them lowers reversal rates, and no such claim is made.

## 7. Limitations

All 32 reads were recorded by a single domain reviewer. **10 of them, not all 32, were re-read blind by an independent reviewer**, so reader dependence is estimated on a subset and not removed. Agreement on that subset was 70.0 percent with an unweighted kappa of 0.474, which is moderate: it is evidence that the read is not idiosyncratic to one person, and it is not evidence that two readers would classify the full corpus alike. The interval on the agreement proportion, 39.7 to 89.2 percent, is wide because 10 cases cannot make it narrow.

One second reader is not a panel, and a single re-read cannot separate reader dependence from case difficulty: the 3 cases where the reads differed may be cases two careful readers would always split rather than cases either reader got wrong. The remaining 22 cases carry the original single-reviewer limitation in full. Two further blind packets were prepared and have not been returned; a three-reader design on the same subset would support a chance-corrected statistic with a usable interval, and this one does not.

The note coding in Section 5.3 is post-hoc rather than pre-registered, and is reported as construct evidence rather than as a confirmatory test.

Cases were selected by the domain reviewer from published sources rather than sampled at random, and published sources over-represent contested determinations.

The convergent-validity result rests on five audits, and in this corpus document class and read are not independent, which bounds Sections 5.2 and 5.4 to the readings given there.

The corpus is two states, New York and Connecticut. Generalization beyond them is not claimed.

The cross-domain observation in Section 5.6 is not a result of this study. It belongs to a separate employment-law corpus of 20 adjudicated matters, with 22 matters screened before two were excluded under that study's stated inclusion criteria, collected by a different reviewer, is reported in full in a companion manuscript, and is cited here only as a test of the boundary condition proposed in Section 5.5.

Seven cases record a contest without a resolved disposition, which reduces the specification check from 27 determinations to 20.

The reviewer read the determination as reported in a published decision or audit, which is not identical to the file the original decision-maker produced.

The standard remains in a validation phase and makes no proven-effectiveness claim.

## 8. Conclusion

The drafting tool and the technology stack will keep changing. The evidentiary test does not. A public-records determination that cannot be rebuilt from its own contents cannot be independently defended, whoever or whatever produced it.

This pilot delivers a working protocol, a completed and citable 32-case set spanning four document classes, two states and twenty-one years of decisions, agreement with independent government auditors in every case where both instruments were available, and two independent lines of evidence that the read tracks reconstructability rather than outcome.

It also makes the follow-on study specific. Agency determinations as issued, sampled without regard to whether they were later contested, read blind by at least two reviewers with basis notes recorded, and matched afterwards to audit findings rather than to appellate dispositions. The employment-law corpus described in Section 5.6 suggests the same design will detect an outcome association wherever the case set is not filtered by publication. The audit finding is the outcome measure with which the read showed concordance in this sample, and it is the one a records programme can act on.

## References

Chief FOIA Officers Council. (2026, May 28). *Memorandum: data collection and volunteers* [Government-wide FOIA technology inventory initiative]. United States Department of Justice.

Gwet, K. L. (2008). Computing inter-rater reliability and its variance in the presence of high agreement. *British Journal of Mathematical and Statistical Psychology, 61*(1), 29-48.

### Cited determinations, opinions, and audits

New York appellate and trial-level decisions: NY Appellate Division FOIL email-disclosure decision (2026); 2020 NY Slip Op 50815(U); 5 NY3d 84 (2005); 4 NY3d 477 (2005); 31 NY3d 217 (2018); 2024 NY Slip Op 04071; 2024 NY Slip Op 24247; 2025 NY Slip Op 00220; 2025 NY Slip Op 00723; 2025 NY Slip Op 01009; 2025 NY Slip Op 01010; 2025 NY Slip Op 01933; 2025 NY Slip Op 02207; 2025 NY Slip Op 03102; 2025 NY Slip Op 03331; 2025 NY Slip Op 05783; 2025 NY Slip Op 30848(U); 2025 NY Slip Op 32688(U).

New York Committee on Open Government advisory opinions: FOIL AO 19516 (December 5, 2016); FOIL AO 19639 (December 20, 2017); FOIL AO 19646 (February 16, 2018); FOIL AO 19721 (April 12, 2019); FOIL AO 19746 (July 16, 2019); FOIL AO 19780 (September 21, 2020); FOIL AO 19854 (October 18, 2023).

Connecticut Freedom of Information Commission final decisions: FIC2012-276; FIC2015-122.

Compliance audits: New York State Comptroller, compliance with Freedom of Information Law requirements (2020, 2021, 2023); New York City Comptroller, review of the New York City Police Department's body-worn-camera program.

## Data availability

Case-level data (public citation, read, contemporaneous basis note, and documented outcome) are held in the study database. Verified counts as of 8 August 2026: 32 cases from 32 distinct public sources, collected 26 June to 8 August 2026; reads 18 Ready, 9 Needs work, 5 Gap; outcomes 15 did not survive review, 7 contested, 5 sustained, 5 adverse audit findings. Every figure in Section 5 is reproduced by `analysis_foil_2026-08-28.py`, which uses only the Python standard library and verifies each figure against the manuscript text on every run, and which carries the note-coding frame so the Section 5.3 coding can be audited case by case. Fisher's exact test, the Wilson interval, Cohen's kappa and Gwet's AC1 are written out in that file rather than imported. The blind second read of Section 5.7, its per-case answers and every coefficient are held in `Blind_Recheck_RESULT_2026-08-28.json`. The complete case set with citations and notes is available from the authors and will be released with publication.

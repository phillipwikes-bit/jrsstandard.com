# Detection Article FINAL5, change log and pre-submission audit

**VERSION:** FINAL4 -> FINAL5
**Source:** `research/Detection_Article_Submission_FINAL4_2026-08-18.md` (preserved, not overwritten)
**Source sha256:** `ddf7af689c6cfc79256a8ad6f10367f79eae5ea02ffff82a2154d3c06671af3b`
**Output:** `research/Detection_Article_Submission_FINAL5_2026-08-18.md`
**Script:** `scripts/apply_final5_dataavail.py`
**Date:** 2026-08-18

One authorized edit. Parts I to V are audits and changed nothing.

---

## The single edit: Section 11, data availability

**ORIGINAL**

> Released under the study's data-availability terms: the 24 constructed records; a record-level corpus construction log containing complete generation provenance was not retained, so model and version, generation date, prompt, and extent of human editing cannot be independently reconstructed for each record from the retained study materials; the full reference classification with the reason and evidentiary defect or support for each record and the JRS conditions implicated; the instructions given to the automated reference-classification instances and their record-by-record reproduction result; coded participant-level response data, released subject to the study's access and confidentiality terms; and the analysis scripts that produce every figure in this paper.

**REVISED**

> Released under the study's data-availability terms are the 24 constructed records; the full reference classification with the reason and evidentiary defect or support for each record and the JRS conditions implicated; the instructions given to the automated reference-classification instances and their record-by-record reproduction result; coded participant-level response data, subject to the study's access and confidentiality terms; and the analysis scripts that produce every figure in this paper. A record-level corpus construction log containing complete generation provenance was not retained, so model and version, generation date, prompt, and extent of human editing cannot be independently reconstructed for each record from the retained study materials.

**RATIONALE.** the disclosure that no corpus construction log was retained sat inside the list of items being released, so the sentence read as though a non-existent artifact were itself a released item. The list now contains only things that are released, and the limitation follows as its own sentence. No item was added or removed and no fact changed.

The surrounding sentences are untouched: "The protocol and analysis plan were registered before data collection." precedes the list, and "Live participation is tracked on an aggregate dashboard showing counts only, never individual answers." follows it.

---

## PART I. Population accounting audit

**153 occurrences of 21 population terms were located, classified by section and by the population each references.**

### Population map, verified

| | A. Detection panel | B. Reliability sample | C. Reference classification | D. Comparison study |
|---|---|---|---|---|
| Human | **YES** | **YES** | **NO** | **YES** |
| Experts | YES, 16 | 8 invited experts; 14 regular reviewers, expertise not asserted either way | not claimed | YES, 20 |
| Count | 16 | 25 total, 22 analysed | 3 automated instances | 20 |
| Records | 24 | 10 estimable of 15 labelled | 24 | 24 |
| Reads or judgments | 384 graded | 113 submitted, 104 retained | 72 record-level classifications | reported separately |
| Role | primary detection study | inter-rater reliability | reference-classification reproduction | separate JRS-versus-unaided comparison |

**Programme total: 61 participations, 58 distinct people.** The three automated instances are not among the 58.

### Occurrence inventory by section

| Term | Section | Population referenced | Sentence |
|---|---|---|---|
| `invited experts` | 4.9 Supporting analyses | B, reliability sample, human | Raters whose codes begin with E are invited experts whose credentials are recorded. |
| `invited experts` | 6.5 Inter-rater reliability, including t | B, reliability sample, human | Of the 25 reliability participants, 22 contributed labels under the five-condition instrument and entered the analysed reliability |
| `invited experts` | Acknowledgments | B, reliability sample, human | **The reliability study, 25 raters**, eight invited experts and seventeen regular reviewers, recorded labels on the shared record  |
| `regular reviewers` | 4.9 Supporting analyses | B, reliability sample, human | The remainder are regular reviewers who entered through the open review page and declared a professional domain without identity v |
| `regular reviewers` | 6.5 Inter-rater reliability, including t | B, reliability sample, human | Of the 25 reliability participants, 22 contributed labels under the five-condition instrument and entered the analysed reliability |
| `regular reviewers` | 6.5 Inter-rater reliability, including t | B, reliability sample, human | Of the 25 reliability participants, 22 contributed labels under the five-condition instrument and entered the analysed reliability |
| `regular reviewers` | Acknowledgments | B, reliability sample, human | **The reliability study, 25 raters**, eight invited experts and seventeen regular reviewers, recorded labels on the shared record  |
| `regular reviewers` | Acknowledgments | B, reliability sample, human | **The reliability study, 25 raters**, eight invited experts and seventeen regular reviewers, recorded labels on the shared record  |
| `regular reviewers` | Acknowledgments | B, reliability sample, human | **The reliability study, 25 raters**, eight invited experts and seventeen regular reviewers, recorded labels on the shared record  |
| `detection panel` | front matter | A, detection panel, human | Neither author took part in the blind reproduction of the reference classification, and neither author graded any record in the de |
| `detection panel` | 4.5 Participants and blinding | A, detection panel, human | The detection panel is an international group of independent experts in AI governance, compliance, audit, human resources, investi |
| `detection panel` | 5. Scope of the claim | A, detection panel, human | That study comprises 20 independent experts of the same professional standing as the detection panel, randomised between applying  |
| `detection panel` | Acknowledgments | A, detection panel, human | **The detection panel, 16 independent experts across 11 countries and 5 continents**, each read the full 24-record corpus cold, bl |
| `detection panel` | Acknowledgments | A, detection panel, human | Those three groups comprise 61 participations held by **58 distinct people**: three of the reliability raters are the same individ |
| `reliability participants` | 6.5 Inter-rater reliability, including t | B, reliability sample, human | Of the 25 reliability participants, 22 contributed labels under the five-condition instrument and entered the analysed reliability |
| `automated raters` | Abstract | C, reference classification, automated | **Methods.** A balanced corpus of 24 constructed, de-identified, AI-generated records (12 grounded, 12 unsupported) was judged by  |
| `automated raters` | 1. Introduction | C, reference classification, automated | **What the reader should hold us to.** The evidentiary chain in this paper runs: an operational definition, a corpus constructed t |
| `automated raters` | 4.1 Validation architecture | C, reference classification, automated | \| Independent criterion assessment \| Independent reproduction of an author-generated reference classification by automated rater |
| `automated raters` | 4.2 Design | C, reference classification, automated | An international panel of independent experts judged a balanced corpus of constructed records against a pre-specified reference cl |
| `automated raters` | 4.4 The reference classification, and ho | C, reference classification, automated | **Independent reproduction, by automated raters.** The author-side classification was independently checked using three separate l |
| `automated raters` | 4.4 The reference classification, and ho | C, reference classification, automated | **Independent reproduction, by automated raters.** The author-side classification was independently checked using three separate l |
| `automated raters` | 4.4 The reference classification, and ho | C, reference classification, automated | **What this establishes, and what it does not.** Unanimous reproduction by automated raters without access to the intended labels  |
| `automated raters` | 4.4 The reference classification, and ho | C, reference classification, automated | **What this establishes, and what it does not.** Unanimous reproduction by automated raters without access to the intended labels  |
| `automated raters` | 4.4 The reference classification, and ho | C, reference classification, automated | **What this establishes, and what it does not.** Unanimous reproduction by automated raters without access to the intended labels  |
| `automated raters` | 4.4 The reference classification, and ho | C, reference classification, automated | **Disclosure.** The full key is released with the materials: each record's classification, the reason for it, the evidentiary defe |
| `automated raters` | 9. Competing interests and confirmation- | C, reference classification, automated | The mitigations actually in place are: an analysis plan and decision thresholds registered before data were examined; blind indepe |
| `experts` | Abstract | general or cross-cutting | **Objective.** This paper asks a single question, which is an initial question a measurement programme must address: given an oper |
| `experts` | Abstract | general or cross-cutting | **Methods.** A balanced corpus of 24 constructed, de-identified, AI-generated records (12 grounded, 12 unsupported) was judged by  |
| `experts` | Abstract | general or cross-cutting | **What this establishes and what it does not.** It establishes that an operationalised documentation-risk construct is detectable  |
| `experts` | 1. Introduction | general or cross-cutting | If independent experts cannot reliably distinguish records whose reasoning is present from those whose reasoning is absent under t |
| `experts` | 1. Introduction | general or cross-cutting | The chain provides evidence that the operationalisation is recognisable to independent experts under the stated reviewer standpoin |
| `experts` | 2.1 The measurement layer this addresses | general or cross-cutting | Our contribution sits downstream of theirs: given a record that already exists, is its reconstructability a property that can be m |
| `experts` | 2.4 DRR is relational, and the construct | general or cross-cutting | A finding that experts recover the reference classification is therefore, in the first instance, a finding that the operationalisa |
| `experts` | 4.2 Design | C, reference classification, automated | An international panel of independent experts judged a balanced corpus of constructed records against a pre-specified reference cl |
| `experts` | 4.5 Participants and blinding | A, detection panel, human | The detection panel is an international group of independent experts in AI governance, compliance, audit, human resources, investi |
| `experts` | 5. Scope of the claim | A, detection panel, human | That study comprises 20 independent experts of the same professional standing as the detection panel, randomised between applying  |
| `experts` | 6. Results | A, detection panel, human | Sixteen independent experts, working in 11 countries across 5 continents, each read the full 24-record corpus and returned 384 gra |
| `experts` | 6.1 Primary detection result | general or cross-cutting | Independent experts, reading constructed records cold and blind to the reference classification, distinguished records constructed |
| `experts` | 7. Discussion | general or cross-cutting | The contribution is that the operationalised Decision Reconstruction Risk distinction is detectable by independent experts on a co |
| `experts` | 7. Discussion | general or cross-cutting | What was shown is that sixteen experts across eleven countries recovered an author-generated, blind-reproduced classification at 8 |
| `experts` | 10. The research programme | general or cross-cutting | \| 1 \| Can independent experts detect the operationalised construct? |
| `experts` | 11. Conclusion | general or cross-cutting | This paper provides initial evidence for one link in a validation chain: an international panel of sixteen independent experts, re |
| `experts` | 11. Conclusion | general or cross-cutting | This paper provides initial evidence for one link in a validation chain: an international panel of sixteen independent experts, re |
| `experts` | Acknowledgments | A, detection panel, human | **The detection panel, 16 independent experts across 11 countries and 5 continents**, each read the full 24-record corpus cold, bl |
| `experts` | Acknowledgments | A, detection panel, human | **The detection panel, 16 independent experts across 11 countries and 5 continents**, each read the full 24-record corpus cold, bl |
| `experts` | Acknowledgments | A, detection panel, human | **The detection panel, 16 independent experts across 11 countries and 5 continents**, each read the full 24-record corpus cold, bl |
| `expert` | Abstract | general or cross-cutting | **What this establishes and what it does not.** It establishes that an operationalised documentation-risk construct is detectable  |
| `expert` | 1. Introduction | general or cross-cutting | **What the reader should hold us to.** The evidentiary chain in this paper runs: an operational definition, a corpus constructed t |
| `expert` | 4.4 The reference classification, and ho | C, reference classification, automated | These were automated raters, not human raters, and no expert or professional status is claimed for them. |
| `expert` | 5. Scope of the claim | general or cross-cutting | Whether the five conditions improve on unaided expert judgment is a different question, tested in a separate study with its own pa |
| `expert` | 6.5 Inter-rater reliability, including t | general or cross-cutting | **Neither clears the second on the analytic interval, which is the interval the analysis plan specified.** The expert lower bound  |
| `expert` | 6.5 Inter-rater reliability, including t | general or cross-cutting | The bootstrap interval places the expert lower bound at 0.427, above the criterion. |
| `expert` | 10. The research programme | general or cross-cutting | \| 2 \| Does the instrument improve on unaided expert judgment? |
| `raters` | 4.4 The reference classification, and ho | C, reference classification, automated | **Independent reproduction, by automated raters.** The author-side classification was independently checked using three separate l |
| `raters` | 4.9 Supporting analyses | B, reliability sample, human | **Inter-rater reliability.** Independent raters applied the five conditions to a shared record set. |
| `raters` | 4.9 Supporting analyses | general or cross-cutting | Sixteen labels in the same table were recorded by raters working under an unstructured baseline prompt rather than the five condit |
| `raters` | 4.9 Supporting analyses | general or cross-cutting | Sixteen labels in the same table were recorded by raters working under an unstructured baseline prompt rather than the five condit |
| `raters` | 6.5 Inter-rater reliability, including t | B, reliability sample, human | Because agreement can only be estimated where a record was reviewed by more than one rater, the ten records with two or more rater |
| `raters` | References | general or cross-cutting | Measuring nominal scale agreement among many raters. |
| `raters` | Appendix B. Per-condition behaviour, rep | general or cross-cutting | Establishing independent discriminating validity would require the condition scores and the composite determination to be generate |
| `raters` | Acknowledgments | B, reliability sample, human | **The reliability study, 25 raters**, eight invited experts and seventeen regular reviewers, recorded labels on the shared record  |
| `raters` | Acknowledgments | B, reliability sample, human | **The reliability study, 25 raters**, eight invited experts and seventeen regular reviewers, recorded labels on the shared record  |
| `raters` | Acknowledgments | A, detection panel, human | Those three groups comprise 61 participations held by **58 distinct people**: three of the reliability raters are the same individ |
| `rater` | 4.9 Supporting analyses | B, reliability sample, human | **Inclusion rule for the reliability analysis.** Only labels recorded under the five-condition instrument are analysed, with one l |
| `rater` | 6.5 Inter-rater reliability, including t | B, reliability sample, human | Because agreement can only be estimated where a record was reviewed by more than one rater, the ten records with two or more rater |
| `rater` | 6.5 Inter-rater reliability, including t | B, reliability sample, human | Because agreement can only be estimated where a record was reviewed by more than one rater, the ten records with two or more rater |
| `reviewers` | Abstract | A, detection panel, human | **Result.** Sixteen reviewers across 11 countries on 5 continents completed the full corpus, producing 384 graded reads. |
| `reviewers` | 3. The Justification Review Standard (JR | general or cross-cutting | The detection task reported in Section 6 does not require reviewers to apply it. |
| `reviewers` | 4.4 The reference classification, and ho | C, reference classification, automated | **What this establishes, and what it does not.** Unanimous reproduction by automated raters without access to the intended labels  |
| `reviewers` | 4.5 Participants and blinding | general or cross-cutting | At the data lock of 15 August 2026, 16 reviewers had completed the full 24-record set. |
| `reviewers` | 4.5 Participants and blinding | general or cross-cutting | Eleven further reviewers accepted an invitation and did not begin; none started before the close. |
| `reviewers` | 4.6 Analysis and unit of observation | general or cross-cutting | Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of t |
| `reviewers` | 4.6 Analysis and unit of observation | general or cross-cutting | Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of t |
| `reviewers` | 6.2 Dispersion | general or cross-cutting | \| Measure \| Mean \| SD \| Range across reviewers \| Reviewers at 100% \| |
| `reviewers` | 6.3 Reviewer heterogeneity is a finding, | general or cross-cutting | Accuracy across the sixteen reviewers ranged from 37.5 to 100 percent, with a standard deviation of 21.0 points. |
| `reviewers` | 6.3 Reviewer heterogeneity is a finding, | general or cross-cutting | Accuracy across the sixteen reviewers ranged from 37.5 to 100 percent, with a standard deviation of 21.0 points. |
| `reviewers` | 6.3 Reviewer heterogeneity is a finding, | general or cross-cutting | With sixteen reviewers, any comparison by domain, seniority, jurisdiction, or first language is uninterpretable, and we do not rep |
| `reviewers` | 6.4 Sensitivity relative to specificity | general or cross-cutting | **The comparison is descriptive and the gap is not statistically distinguishable from zero in this sample.** Both numbers come fro |
| `reviewers` | 6.5 Inter-rater reliability, including t | general or cross-cutting | \| Regular reviewers \| 10 \| 68 \| 14 \| 0.623 \| 0.252 to 0.993 \| 0.285 to 0.894 \| |
| `reviewers` | 7. Discussion | general or cross-cutting | That is the precondition for everything downstream: a documentation property experienced reviewers cannot identify is not a govern |
| `reviewers` | 8. Limitations | general or cross-cutting | Performance by less experienced reviewers, or by reviewers working outside their domain, is unknown. |
| `reviewers` | 8. Limitations | general or cross-cutting | Performance by less experienced reviewers, or by reviewers working outside their domain, is unknown. |
| `reviewers` | 9. Competing interests and confirmation- | C, reference classification, automated | The mitigations actually in place are: an analysis plan and decision thresholds registered before data were examined; blind indepe |
| `reviewers` | Appendix B. Per-condition behaviour, rep | general or cross-cutting | Testing whether the components are associated with the composite that they produce is not a test of discriminating validity; it is |
| `reviewers` | Appendix C. Reviewer and item variance | A, detection panel, human | Fitted as a mixed-effects logistic model by Laplace-approximated maximum likelihood over all 384 graded reads from 16 reviewers an |
| `reviewers` | What this answers | general or cross-cutting | **How much of the modelled random-effect variation is associated with reviewers rather than records?** The estimated reviewer comp |
| `reviewers` | What this answers | general or cross-cutting | Every record was classified correctly by at least ten of the sixteen reviewers. |
| `reviewers` | The record component is estimated at the | general or cross-cutting | **That is not evidence that record difficulty does not exist.** At sixteen reviewers by twenty-four records the record component i |
| `reviewer` | front matter | general or cross-cutting | conceived Decision Reconstruction Risk and the JRS review method, constructed the validation corpus, wrote the author-side intende |
| `reviewer` | Abstract | general or cross-cutting | We name this property Decision Reconstruction Risk (DRR) and define it as a relational property of the record, the decision it doc |
| `reviewer` | Abstract | general or cross-cutting | Accuracy is analysed at the participant level, treating each reviewer rather than each read as the unit of observation. |
| `reviewer` | 1. Introduction | general or cross-cutting | We call this property Decision Reconstruction Risk (DRR): the condition in which a record does not allow an independent reviewer t |
| `reviewer` | 1. Introduction | general or cross-cutting | We call this property Decision Reconstruction Risk (DRR): the condition in which a record does not allow an independent reviewer t |
| `reviewer` | 1. Introduction | general or cross-cutting | If independent experts cannot reliably distinguish records whose reasoning is present from those whose reasoning is absent under t |
| `reviewer` | 1. Introduction | general or cross-cutting | The chain provides evidence that the operationalisation is recognisable to independent experts under the stated reviewer standpoin |
| `reviewer` | 2.1 The measurement layer this addresses | general or cross-cutting | When a determination is challenged, the reviewer does not re-interview the decision-maker's memory. |
| `reviewer` | 2.1 The measurement layer this addresses | general or cross-cutting | When a determination is challenged, the reviewer does not re-interview the decision-maker's memory. |
| `reviewer` | 2.2 DRR against adjacent constructs | general or cross-cutting | \| **DRR** \| **the individual record** \| **Can an independent reviewer reconstruct the basis for this consequential decision fro |
| `reviewer` | 2.4 DRR is relational, and the construct | general or cross-cutting | We therefore define DRR relative to a stated reviewer standpoint: **an independent reviewer, competent in the domain, with access  |
| `reviewer` | 2.4 DRR is relational, and the construct | general or cross-cutting | We therefore define DRR relative to a stated reviewer standpoint: **an independent reviewer, competent in the domain, with access  |
| `reviewer` | 2.4 DRR is relational, and the construct | general or cross-cutting | We therefore define DRR relative to a stated reviewer standpoint: **an independent reviewer, competent in the domain, with access  |
| `reviewer` | 2.5 Three related properties that are no | general or cross-cutting | **Record reconstructability.** Can a competent independent reviewer recover the basis for the conclusion from the record? |
| `reviewer` | 2.5 Three related properties that are no | general or cross-cutting | Those assumptions are precisely what an unreconstructable record relies on to appear complete, and a blind spot shared by every re |
| `reviewer` | 3. The Justification Review Standard (JR | general or cross-cutting | **The five conditions.** (1) Record self-sufficiency (reconstructability): the record allows an independent reviewer to reconstruc |
| `reviewer` | 3. The Justification Review Standard (JR | general or cross-cutting | **The three reads.** A reviewer assigns each record one of three determinations: Ready (a later reviewer could reconstruct the con |
| `reviewer` | 3. The Justification Review Standard (JR | general or cross-cutting | **The three reads.** A reviewer assigns each record one of three determinations: Ready (a later reviewer could reconstruct the con |
| `reviewer` | 3. The Justification Review Standard (JR | general or cross-cutting | **The three reads.** A reviewer assigns each record one of three determinations: Ready (a later reviewer could reconstruct the con |
| `reviewer` | 3. The Justification Review Standard (JR | general or cross-cutting | This principle was surfaced by pilot reviewer Saurabh Nanda and is credited with his permission. |
| `reviewer` | 4.1 Validation architecture | general or cross-cutting | \| Construct definition \| A stated property with a stated reviewer standpoint \| Section 2.4 \| |
| `reviewer` | 4.3 Materials: the constructed corpus | general or cross-cutting | The consequence is specific and we accept it: **the accuracy reported in Section 6 may overstate performance on a corpus containin |
| `reviewer` | 4.6 Analysis and unit of observation | general or cross-cutting | Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of t |
| `reviewer` | 4.6 Analysis and unit of observation | general or cross-cutting | Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of t |
| `reviewer` | 4.6 Analysis and unit of observation | general or cross-cutting | Accuracy is computed at the participant level: each reviewer contributes one accuracy score, and the panel result is the mean of t |
| `reviewer` | 4.6 Analysis and unit of observation | general or cross-cutting | For each reviewer, the latest submission per record is used; resubmissions supersede earlier ones. |
| `reviewer` | 4.6 Analysis and unit of observation | general or cross-cutting | **Item variance is not modelled in the primary analysis, and that is a limitation rather than a choice we defend.** The participan |
| `reviewer` | 4.6 Analysis and unit of observation | general or cross-cutting | **Item variance is not modelled in the primary analysis, and that is a limitation rather than a choice we defend.** The participan |
| `reviewer` | 4.6 Analysis and unit of observation | general or cross-cutting | **Item variance is not modelled in the primary analysis, and that is a limitation rather than a choice we defend.** The participan |
| `reviewer` | 4.6 Analysis and unit of observation | general or cross-cutting | **Item variance is not modelled in the primary analysis, and that is a limitation rather than a choice we defend.** The participan |
| `reviewer` | 4.7 Pre-registered thresholds, and why t | B, reliability sample, human | **Reliability floor (supporting).** Gwet's AC1 was pre-specified at a minimum of 0.61, with a lower confidence bound of at least 0 |
| `reviewer` | 6.3 Reviewer heterogeneity is a finding, | general or cross-cutting | Accuracy across the sixteen reviewers ranged from 37.5 to 100 percent, with a standard deviation of 21.0 points. |

*33 further occurrences follow the same pattern and are omitted from this table for length; all were classified and none was flagged.*

### Critical error detection, eleven named misreadings

| Risk | Foreclosed by | Status |
|---|---|---|
| A. automated reference raters read as human experts | text present in the manuscript | **foreclosed** |
| A2. no expert status claimed for them | text present in the manuscript | **foreclosed** |
| B. the 25 reliability participants read as all experts | text present in the manuscript | **foreclosed** |
| B2. the E/R split is recruitment, not expertise | text present in the manuscript | **foreclosed** |
| C/E. comparison study read as part of the detection panel | text present in the manuscript | **foreclosed** |
| D. detection panel read as the reliability sample | text present in the manuscript | **foreclosed** |
| F. 72 classifications read as human judgments | text present in the manuscript | **foreclosed** |
| G. 61 participations read as 61 people | text present in the manuscript | **foreclosed** |
| I. regular reviewers read as non-experts | text present in the manuscript | **foreclosed** |
| E. 36 as one study population | `36 independent experts` absent | **foreclosed** |
| E. 36 as one study population | `36 experts` absent | **foreclosed** |
| G. 61 participations read as 61 people | `All 61` absent | **foreclosed** |
| I. regular reviewers labelled non-experts | `non-expert` absent | **foreclosed** |
| K. ambiguous between three populations | `expert panel` absent | **foreclosed** |
| K. ambiguous human/automated | `blind raters` absent | **foreclosed** |
| K. ambiguous human/automated | `blinded raters` absent | **foreclosed** |
| A. automated raters read as human | `blind reference raters` absent | **foreclosed** |
| unsupported rater class | `trained reviewer` absent | **foreclosed** |
| F. automated reproduction read as human validation | `human validation` absent | **foreclosed** |

**Population accounting: PASS**

---

## PART II. Claim-boundary audit

| Claim the paper MAY make | Present |
|---|---|
| detectability claimed, bounded | yes |
| JRS not efficacy | yes |
| no criterion validity, no efficacy | yes |
| criterion validity disclaimed in the abstract | yes |
| psychometric limitation | yes |
| workflow-independence limitation | yes |
| cross-cultural limitation | yes |
| reliability criterion failed | yes |
| analytic interval is the specified one | yes |
| bootstrap not a rescue | yes |
| reliability too small to establish | yes |
| construct dependence of the key | yes |
| no human replication | yes |
| corpus is author-generated and bimodal | yes |
| findings preliminary | yes |

| Claim the paper MUST NOT make | Present |
|---|---|
| `JRS validated` | no |
| `validated JRS` | no |
| `JRS proven` | no |
| `JRS efficacy demonstrated` | no |
| `JRS outperforms` | no |
| `JRS improves reviewer accuracy` | no |
| `criterion validity established` | no |
| `construct validity established` | no |
| `workflow independence demonstrated` | no |
| `psychometrically validated` (exempt: `not psychometrically validated`) | no |
| `psychometric validation was completed` | no |
| `cross-cultural validity established` | no |
| `real-world effectiveness` | no |
| `reliability was established` | no |
| `measurement invariance established` | no |
| `DRR validated` | no |
| `DRR is validated` | no |

**Claim boundaries: PASS**

---

## PART III. Statistical lock

| Value | Present |
|---|---|
| 83.9% | yes |
| CI low | yes |
| CI high | yes |
| 87.0% | yes |
| 80.7% | yes |
| 384 | yes |
| 16 detection reviewers | yes |
| 24 records | yes |
| expert AC1 row | yes |
| regular AC1 row | yes |
| 113 and 104 | yes |
| 25 and 22 | yes |
| 8 invited and 14 regular | yes |
| 3 baseline-only | yes |
| 72 automated classifications | yes |
| 24 of 24 | yes |
| 2 and 3 passes | yes |
| 58 and 61 | yes |
| 20 comparison experts | yes |
| no adjudication | yes |

| Superseded value | Present |
|---|---|
| `0.624` | no |
| `0.253 to 0.994` | no |
| `0.301 to 0.886` | no |

**Statistical integrity: PASS**

---

## PART IV. Reference-classification lock

Section 4.4 is **byte-identical to FINAL4**: verified

| Element | Present |
|---|---|
| three automated LLM instances | yes |
| not human raters | yes |
| no expert status | yes |
| 24 records | yes |
| 72 classifications | yes |
| no access to intended labels | yes |
| 100 percent reproduction | yes |
| no adjudication | yes |
| 2 pre-registered, 3 executed | yes |
| no human replication | yes |
| construct dependence | yes |
| implementation details not retained | yes |

**Reference classification: PASS**

---

## PART V. Corpus-provenance lock

| Statement that must be present | Present |
|---|---|
| generated with LLM assistance, then edited by the first author | yes |
| constructed and de-identified | yes |
| no real case, person or organisation | yes |
| provenance not retained | yes |

| Withdrawn promise that must stay absent | Present |
|---|---|
| `are recorded in the corpus construction log` | no |
| `the corpus construction log, including generation model` | no |

| Fabrication pattern | Found |
|---|---|
| a model version (`\b(?:claude|gpt|gemini|llama|mistral)[- ]?[\d.]+\b`) | none |
| a generation date (`\bgenerated on \d`) | none |
| an editing percentage (`\b\d{1,3}\s*(?:percent|%)\s*(?:of the text|edited)`) | none |
| a recovered prompt (`\bthe prompt used was\b`) | none |

**Corpus provenance: PASS**

---

## Document integrity

| Section | Unchanged from FINAL4 |
|---|---|
| Section 4.4, reference classification | yes, byte-identical |
| References | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Acknowledgments | yes, byte-identical |
| Section 11 | the one authorized edit |
| All other sections | unchanged |

Paragraphs over 120 characters 184 to 184, duplicates 0, em-dashes 0. **1 line differ from FINAL4 against 1 authorised edit.**

**Document integrity: PASS**

---

## Deferred edits

**None.** The audit found no ambiguity, overclaim, statistical drift, reference-classification drift or corpus-provenance fabrication requiring correction. No issue was found and left unfixed, and no issue was fixed outside the single authorized edit.

---

"FINAL5 completed. One edit, restructuring the Section 11 data-availability sentence so the list contains only released items and the provenance limitation stands as its own sentence. No statistic, participant count, methodological choice, claim boundary, reference-classification disclosure, chronology, limitation, reference, appendix or acknowledgment was changed."

# Detection Article v3, reference-classification repair change log

**Date:** 2026-08-18
**Source:** `research/Detection_Article_Submission_Final_v2_2026-08-18.md` (preserved, not overwritten)
**Output:** `research/Detection_Article_Submission_Final_v3_2026-08-18.md`
**Script:** `scripts/apply_v3_reference_repair.py`
**Source audit:** `research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md`

Fourteen instructed corrections. Eight change text; six are preservation constraints compiled into 40 assertions that fail the run if what they protect has moved.

---

## 1. Fail-closed source verification

Every fact written into the manuscript is re-derived at run time from `research/Verified_Key.md`, `research/AnswerKey_Verification_Packet.md` and `research/OSF_PreRegistration.md`, then cross-checked against the source audit report. The script writes nothing if any row fails.

| Check | Result |
|---|---|
| Verified_Key states three raters | **ok** |
| Verified_Key states all three labelled all 24 | **ok** |
| Verified_Key states the raters were not human | **ok** |
| Verified_Key states they were language-model instances | **ok** |
| Verified_Key tabulates 24 records (found 24) | **ok** |
| judgment denominator is 72 | **ok** |
| Verified_Key reports 24/24 against the intended key | **ok** |
| Verified_Key reports no divergence | **ok** |
| pre-registration specifies two raters | **ok** |
| pre-registration specifies conditional adjudication | **ok** |
| packet identifies the task as answer-key verification | **ok** |
| audit report states three raters | **ok** |
| audit report states 72 judgments | **ok** |
| audit report states no adjudication | **ok** |
| audit report excludes expert status | **ok** |
| audit report records zero Arm A overlap | **ok** |
| audit report records zero Arm B overlap | **ok** |
| audit report records zero Study 004 overlap | **ok** |
| Verified_Key names no vendor or model | **ok** |

| Derived quantity | Value |
|---|---:|
| Executed passes | 3 |
| Records | 24 |
| Record-level classifications | **72** |
| Pre-registered passes | 2 |
| Agreement | 100 percent |
| Adjudication | not triggered |

**No conflict with the source audit report was found.** The instruction's stated facts, the three primary source files and the audit report agree on every count.

**No model name, vendor, version, date, temperature or system prompt was written**, because no such record exists. The script also asserts that `Verified_Key.md` itself names none, so nothing could be copied from it by accident.

---

## 2. Manuscript edits

### Correction 1. APPLIED.

**SECTION:** Section 4.4

**LOCATION:** Section 4.4, Independent reproduction

**ORIGINAL:**

> **Independent reproduction.** The intended classification was then withheld and the corpus was given to blind raters who did not see the study's hypotheses, did not see the author-side classification, and were not told that a reference classification existed to be recovered. They were asked to classify each record as grounded or unsupported. They reproduced the author-side classification on 24 of 24 records. There were no disagreements, so no adjudication procedure was invoked and no classification changed.

**REPLACEMENT:**

> **Independent reproduction, by automated raters.** The author-side classification was independently checked using three separate large-language-model instances applying the operational classification rule. These were automated raters, not human raters, and no expert or professional status is claimed for them. Each instance independently classified all 24 records without access to the intended labels or to the author-side classification, producing **72 record-level classifications**. The verification packet identified the task as verification of an answer key but did not provide the intended record-level classifications. All three model passes reproduced the intended classification on all 24 records, so the pre-specified adjudication condition was not triggered and no classification changed. The pre-registered procedure specified two independent passes with conditional adjudication; the executed procedure used three.
>
> **What the automated check does not do.** The automated reference check demonstrates reproducibility of the operational classification rule across three independent model passes; it does not constitute independent human validation of the reference labels and does not establish criterion validity. No human replication of the reference classification has been performed.

**SOURCE:** `research/Verified_Key.md` Method and Result; `research/AnswerKey_Verification_Packet.md:3-5` and the Procedure block; `research/OSF_PreRegistration.md:27-28`; `research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md` sections 2, 5, 12, 13, 14, 16, 17

**REASON:** the paragraph described the reference raters in terms a reader takes as human, omitted the count and the judgment denominator, asserted a form of blinding the briefing packet contradicts, did not disclose the deviation from the pre-registered number of passes, and did not separate automated reproducibility from human validation. Corrections 1, 2, 3, 4 and 6 all land in this paragraph and are applied as one replacement so the run cannot leave it half-corrected.

**CATEGORY:** METHODOLOGICAL CORRECTION

### Correction 5. APPLIED.

**SECTION:** Section 4.4

**LOCATION:** Section 4.4, Disclosure

**ORIGINAL:**

> **Disclosure.** The full key is released with the materials: each record's classification, the reason for it, the evidentiary defect or support identified, the JRS conditions implicated, the instructions given to the blind raters, and the record-by-record reproduction result. Nothing about the reference classification is withheld from a reader who wants to test it.

**REPLACEMENT:**

> **Disclosure.** The full key is released with the materials: each record's classification, the reason for it, the evidentiary defect or support identified, the JRS conditions implicated, the instructions given to the automated raters, and the record-by-record reproduction result. The operational classification rule and the resulting reference labels are reported so that the classification logic can be examined. The model implementation details and per-pass execution records were not retained in a form sufficient for independent reproduction of the three automated reference passes.

**SOURCE:** `research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md` sections 3 and 24.5; absence confirmed by exhaustive search of the repository

**REASON:** "Nothing about the reference classification is withheld" cannot be met. The repository retains no model name, vendor, version, per-pass output sheet or execution date for the automated passes, so the sentence promised more than the materials contain. The replacement states what is released and what is not.

**CATEGORY:** METHODOLOGICAL CORRECTION

### Correction 7. APPLIED.

**SECTION:** Section 7

**LOCATION:** Section 7, Discussion

**ORIGINAL:**

> For JRS, the result should therefore be read as evidence supporting the feasibility of its underlying review logic, not as evidence that JRS itself improves documentation outcomes.

**REPLACEMENT:**

> For JRS, the result provides preliminary evidence that the record-level distinction embodied in its review logic is operationally detectable; it is not evidence that JRS itself improves documentation outcomes.

**SOURCE:** `research/DRR_Detection_Validation_Protocol.md:39`; the manuscript's own Section 5 statement that the comparison of the five conditions against unaided judgment is a separate study

**REASON:** the detection panel did not apply JRS as a scoring instrument. JRS was used to construct the corpus and to operationalise the distinction, so "feasibility of its underlying review logic" overstates what the panel's performance speaks to.

**CATEGORY:** CLAIM-BOUNDARY CORRECTION

### Correction 8. APPLIED.

**SECTION:** Section 6.3

**LOCATION:** Section 6.3, production review

**ORIGINAL:**

> an organisation routing a record to a single reviewer does not know which part of the distribution it has drawn from

**REPLACEMENT:**

> an organisation routing a record to a single reviewer cannot assume that the panel-level accuracy estimate represents that reviewer's individual performance

**SOURCE:** the participant-level analysis in Section 6.1 and the reviewer spread reported in Section 6.3

**REASON:** the original asserted a fact about organisational knowledge. The replacement states the inferential limit, which is what the data support.

**CATEGORY:** CLAIM-BOUNDARY CORRECTION

### Correction 9.1. APPLIED.

**SECTION:** Abstract

**LOCATION:** Abstract

**ORIGINAL:**

> independently reproduced by raters blind to the study hypotheses

**REPLACEMENT:**

> independently reproduced by automated raters without access to it

**SOURCE:** `research/Verified_Key.md:8`; `research/AnswerKey_Verification_Packet.md:3-5`

**REASON:** "raters blind to the study hypotheses" reads as human and repeats the blinding claim the packet contradicts.

**CATEGORY:** TERMINOLOGY CORRECTION

### Correction 9.2. APPLIED.

**SECTION:** Section 1

**LOCATION:** Section 1, evidentiary chain

**ORIGINAL:**

> a reference classification reproduced by raters blind to the hypotheses

**REPLACEMENT:**

> a reference classification reproduced by automated raters without access to it

**SOURCE:** `research/Verified_Key.md:8`

**REASON:** same defect as the Abstract, in the sentence that sets out the evidentiary chain.

**CATEGORY:** TERMINOLOGY CORRECTION

### Correction 9.3. APPLIED.

**SECTION:** Section 2

**LOCATION:** Section 2, validity table

**ORIGINAL:**

> Independent reproduction of an author-generated reference classification by raters not involved in corpus construction

**REPLACEMENT:**

> Independent reproduction of an author-generated reference classification by automated raters not involved in corpus construction

**SOURCE:** `research/Verified_Key.md:8`

**REASON:** the validity table row reads as human independent assessment, which is the strongest possible reading and the least supported.

**CATEGORY:** TERMINOLOGY CORRECTION

### Correction 9.4. APPLIED.

**SECTION:** Section 3

**LOCATION:** Section 3, study design

**ORIGINAL:**

> against a pre-specified reference classification independently reproduced by blinded raters, blind to that classification and to one another's judgments

**REPLACEMENT:**

> against a pre-specified reference classification independently reproduced by automated raters without access to that classification or to one another's judgments

**SOURCE:** `research/Verified_Key.md`, Method and the disclosure at line 8

**REASON:** "blinded raters" reads as human.

**CATEGORY:** TERMINOLOGY CORRECTION

### Correction 9.5. APPLIED.

**SECTION:** Section 4.4

**LOCATION:** Section 4.4, What this establishes

**ORIGINAL:**

> Unanimous reproduction by raters blind to the hypotheses rules out the objection

**REPLACEMENT:**

> Unanimous reproduction by automated raters without access to the intended labels rules out the objection

**SOURCE:** `research/Verified_Key.md:8`; `research/AnswerKey_Verification_Packet.md:3-5`

**REASON:** the concession paragraph itself carried the human reading and the contradicted blinding claim.

**CATEGORY:** TERMINOLOGY CORRECTION

### Correction 9.6. APPLIED.

**SECTION:** Section 4.4

**LOCATION:** Section 4.4, What this establishes, second clause

**ORIGINAL:**

> the raters were briefed by the authors on what "grounded" and "unsupported" mean

**REPLACEMENT:**

> the automated raters were briefed by the authors on what "grounded" and "unsupported" mean

**SOURCE:** `research/Verified_Key.md:8`

**REASON:** same paragraph, second occurrence.

**CATEGORY:** TERMINOLOGY CORRECTION

### Correction 9.7. APPLIED.

**SECTION:** Section 4.4

**LOCATION:** Section 4.4, What this establishes, third clause

**ORIGINAL:**

> a corpus on which blind raters never disagree is a corpus of easy cases

**REPLACEMENT:**

> a corpus on which automated raters never disagree is a corpus of easy cases

**SOURCE:** `research/Verified_Key.md:8`

**REASON:** same paragraph, third occurrence.

**CATEGORY:** TERMINOLOGY CORRECTION

**Corrections 2, 3, 4 and 6 have no separate entry because they land inside Correction 1's paragraph and are applied as one replacement.** Splitting them into four sequential edits on the same sentence would leave the paragraph half-corrected if any one of them failed to match. Each is verified independently in section 3 below.

---

## 3. Required facts, asserted individually

| Instructed correction | Fact that must be present | Present |
|---|---|---|
| Correction 1 | three model instances named as such | yes |
|  | all three passes reproduced the key | yes |
| Correction 1 | automated, not human | yes |
| Correction 1 | no expert status claimed | yes |
| Correction 4 | judgment denominator | yes |
| Correction 2 | packet disclosed the task | yes |
| Correction 3 | deviation disclosed | yes |
| Correction 1 | no adjudication | yes |
| Correction 6 | human-validation limitation | yes |
| Correction 6 | no human replication | yes |
| Correction 5 | reproducibility limit stated | yes |

---

## 4. Preservation constraints, corrections 9 to 14

### Correction 9. Human expert study architecture

| Protected element | Present |
|---|---|
| Arm A panel size | yes |
| Arm B panel size | yes |
| Arm B standing | yes |
| Study 004 invited experts | yes |
| Study 004 regular reviewers | yes |
| recruitment channel not expertise | yes |

### Correction 10. Participant accounting

| Protected element | Present |
|---|---|
| 61 and 58 | yes |
| overlap explained | yes |
| All 58 unpaid | yes |

### Correction 11. Primary detection results

| Protected element | Present |
|---|---|
| panel | yes |
| countries | yes |
| continents | yes |
| corpus | yes |
| graded reads | yes |
| accuracy | yes |
| CI low | yes |
| CI high | yes |
| sensitivity | yes |
| specificity | yes |
| point threshold | yes |
| lower bound | yes |

### Correction 12. Reliability results

| Protected element | Present |
|---|---|
| expert row | yes |
| regular row | yes |
| 25 to 22 | yes |
| three baseline-only | yes |
| 15 records | yes |
| 10 estimable | yes |
| 113 and 104 | yes |
| criterion not met | yes |
| analytic is specified | yes |
| bootstrap not a pass | yes |
| appendix B denominator | yes |

### Correction 13. DRR claim boundary

| Protected element | Present |
|---|---|
| abstract disclaimer | yes |
| cross-cultural | yes |
| workflow independence | yes |
| psychometric | yes |
| construct dependence | yes |

### Correction 14. JRS claim boundary

| Protected element | Present |
|---|---|
| no criterion validity or efficacy | yes |
| comparison is separate | yes |
| detection / reliability separation | yes |

**The three automated raters are nowhere described as part of the expert panel and nowhere added to the 58-person human participant count.** The Acknowledgments are byte-identical to v2, which is how that is enforced rather than asserted.

---

## 5. Global terminology audit

| Term | Occurrences | Required | Result |
|---|---:|---|---|
| `Anthropic` (scoped to the reference-classification block) | 0 in that block | 0 | clean |
| `OpenAI` (scoped to the reference-classification block) | 0 in that block | 0 | clean |
| `Google` (scoped to the reference-classification block) | 0 in that block | 0 | clean |
| `GPT-` (scoped to the reference-classification block) | 0 in that block | 0 | clean |
| `Gemini` (scoped to the reference-classification block) | 0 in that block | 0 | clean |
| `temperature` (scoped to the reference-classification block) | 0 in that block | 0 | clean |
| `system prompt` (scoped to the reference-classification block) | 0 in that block | 0 | clean |
| `version` (scoped to the reference-classification block) | 0 in that block | 0 | clean |
| `blind raters` | 0 | 0 | clean |
| `blinded raters` | 0 | 0 | clean |
| `raters blind to the hypotheses` | 0 | 0 | clean |
| `raters blind to the study hypotheses` | 0 | 0 | clean |
| `were not told that a reference classification existed` | 0 | 0 | clean |
| `Nothing about the reference classification is withheld` | 0 | 0 | clean |
| `strengthening the design` | 0 | 0 | clean |
| `improving reliability` | 0 | 0 | clean |
| `confirming the result more strongly` | 0 | 0 | clean |
| `human validation` (exempt: `does not constitute independent human validation`) | 1 | 0 | clean |
| `independently validated` | 0 | 0 | clean |
| `criterion validity established` | 0 | 0 | clean |
| `psychometrically validated` (exempt: `not psychometrically validated`) | 1 | 0 | clean |
| `JRS validated` | 0 | 0 | clean |
| `validated JRS` | 0 | 0 | clean |
| `JRS proven` | 0 | 0 | clean |
| `JRS efficacy demonstrated` | 0 | 0 | clean |
| `JRS outperforms` | 0 | 0 | clean |
| `workflow independence demonstrated` | 0 | 0 | clean |
| `measurement invariance established` | 0 | 0 | clean |
| `trained reviewer` | 0 | 0 | clean |
| `non-expert` | 0 | 0 | clean |
| `same pool` | 0 | 0 | clean |
| `those same experts` | 0 | 0 | clean |
| `expert panel` | 0 | 0 | clean |
| `36 independent experts` | 0 | 0 | clean |
| `36 experts` | 0 | 0 | clean |
| `All 61` | 0 | 0 | clean |
| `0.624` | 0 | 0 | clean |
| `0.253 to 0.994` | 0 | 0 | clean |
| `0.301 to 0.886` | 0 | 0 | clean |

| Term now used | Occurrences | Refers to |
|---|---:|---|
| `automated raters` | 10 | the three reference-classification model passes |
| `large-language-model instances` | 1 | the same |
| `model passes` | 2 | the same |
| `record-level classifications` | 2 | the 72-judgment denominator |
| `16 independent experts` | 1 | Study 011, Arm A, human |
| `20 independent experts` | 2 | Study 012, Arm B, human |
| `invited experts` | 3 | Study 004, E-coded, human |
| `regular reviewers` | 6 | Study 004, R-coded, human |

---

## 6. Statistical integrity

| Quantity | Reported | Source |
|---|---|---|
| Reference model instances | 3 | `Verified_Key.md`, Method |
| Records | 24 | `Verified_Key.md`, key table |
| Record-level classifications | **72** | 3 x 24 |
| Agreement | 100 percent | `Verified_Key.md`, Result |
| Adjudication | not triggered | `Verified_Key.md`, Result |
| Human reference raters | **0** | `Verified_Key.md:8` |
| Expert reference raters | **0** | no source establishes any |

The manuscript does not report 24 as the judgment total anywhere. Every primary detection value and every reliability value is unchanged; the assertions in section 4 above enforce that.

---

## 7. Deferred issues

Identified during this pass and **not implemented**, because the instruction limits the pass to the authorised list.

**DEFERRED ISSUE 1. Appendix A machine-consistency framing.** Appendix A reports three named vendors for the nightly cross-vendor runs while Section 4.4 can name none for the reference passes. The asymmetry is factual and correct, but a reviewer may ask why one automated procedure is fully specified and the other is not. No edit made: the instruction limits this pass to the reference-classification paragraphs and the two claim-boundary sentences.

**DEFERRED ISSUE 2. timeline of the verified key.** The verified key was committed 2026-07-06; detection-panel reading had begun by 2026-06-28 and Study 004 labelling by 2026-06-11. No pre-registration term was breached, because the pre-registration requires the key fixed before analysis and analysis ran 2026-08-15. The manuscript states no sequence either way. No edit made: outside the authorised list.

**DEFERRED ISSUE 3. author-side classification date.** `Detection_Article...:172` states the author-side classification was fixed "before any reviewer was recruited". The repository dates the file to 2026-07-06 by commit, which is after reading began, so the claim rests on a pre-commit timestamp not independently verifiable from the repository. No edit made: the claim may well be true and the instruction does not authorise touching it.

---

## 8. Document integrity

| Check | v2 | v3 |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 91 | 91 |
| Paragraphs over 120 characters | 183 | 184 |
| Paragraph delta | 0 | +1, being the human-validation limitation paragraph Correction 6 adds |
| Duplicate paragraphs | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 11944 | 12074 |

| Section | Unchanged from v2 |
|---|---|
| References and citations | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Acknowledgments | yes, byte-identical |
| Abstract | Correction 9.1 only |
| Section 1 | Correction 9.2 only |
| Section 2 validity table | Correction 9.3 only |
| Section 3 | Correction 9.4 only |
| Section 4.4 | Corrections 1, 5, 9.5, 9.6, 9.7 |
| Section 6.3 | Correction 8 only |
| Section 7 | Correction 7 only |
| Sections 5, 8, 9, 10 | unchanged |

No section was deleted, no reference altered, no citation changed, no table cell modified: the table-row count is identical and the single table edit is a cell in the Section 2 validity table, which changes no number. The source is plain Markdown and the `.docx` is generated from it, so no tracked change and no comment can be introduced. No dataset, analysis script, pre-registration or audit report was modified.

**Document integrity: PASS**

---

"v3 reference-classification repair completed. The reference classification is now described as what the source records establish: three automated large-language-model passes over 24 records, 72 record-level classifications, unanimous agreement with the intended key, no adjudication, two passes pre-registered against three executed, and no human validation. No primary detection result, reliability statistic, participant count, preregistered threshold, study design, limitation, reference or table number was changed, and no claim was strengthened."

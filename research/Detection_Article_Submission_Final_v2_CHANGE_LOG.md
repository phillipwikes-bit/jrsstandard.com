# Detection Article, submission-final v2 change log

**Date:** 2026-08-18
**Source:** `research/Detection_Article_Submission_Final_2026-08-18.md` (preserved, not overwritten)
**Output:** `research/Detection_Article_Submission_Final_v2_2026-08-18.md`
**Script:** `scripts/apply_submission_final_v2.py`

Fifteen instructed corrections. Five change text; ten are preservation constraints compiled into 45 assertions that fail the run if what they protect has moved. Every change is categorised; there is no "general improvement" category.

---

## 1. Participant accounting audit, Correction 1

### The answer: 58 is correct. It was not changed to 61.

| Study component | Participation count | Unique individuals | Overlap with other components | Source |
|---|---:|---:|---|---|
| Study 011 / Arm A | 16 | 16 | 3 of these people also hold a Study 004 expert-rater code | live `pilot_progress` 2026-08-18, 27 registered / 16 at 24 reads; `research/Expert_Roster_All_Studies_2026-08-06.md` Study 011 |
| Study 004 reliability | 25 | 22 new | 3 are the same people as Arm A completers | live `bench_labels` 2026-08-18, 25 rater codes; `research/build_expert_roster.py:121` |
| Study 012 / Arm B | 20 | 20 | **none**, verified disjoint from Arm A | live `armb_progress` 2026-08-18, 21 registered / 20 at 24 reads; `research/Expert_Roster_All_Studies_2026-08-06.md` Study 012 |
| **Combined** | **61** | **58** | 3 participations held by people already counted | arithmetic below |

### The overlap, named

| Study 004 code | Same person in Arm A |
|---|---|
| `E-09` | `V-AI-06` |
| `E-12` | `V-AI-07` |
| `E-13` | `V-AI-03` |

Source: `research/build_expert_roster.py:121`, `CROSS_STUDY_SAME_PERSON`, corroborated at `research/Expert_Roster_All_Studies_2026-08-06.md:73`. The map is parsed at run time; the count is not typed into this script.

**Arm A and Arm B are disjoint.** Every named V-AI and RR row in the roster was cross-tabulated by personal name at run time and no name holds both a detection-panel code and a comparison-study code. The protocol specifies this by design: *"A fresh pool of participants of comparable background"* (`research/DRR_Detection_Validation_Protocol.md:42`).

### A second route reaches 58 by a different composition, and the difference is disclosed rather than smoothed over

`research/count_participants.py` publishes 58 as *people who have graded at least one record*, composed as 16 Arm A graders + 21 Arm B graders + 4 Study 004 experts the other studies never touched + 17 bench reviewers. That set **includes `RR-108`**, who graded 9 of 24 and is not a completer, and **excludes `E-11`**, a rater code carrying one label and no identity row. The two exclusions cancel, so both routes print 58 while describing sets that are not identical.

The Acknowledgments sentence follows the first route, because that is the arithmetic a reader of the Acknowledgments can actually perform from the three groups named immediately above it.

### The five mandated questions

**1. Are Arm A and Arm B both expert populations?** Yes. Arm A: every one of the 16 completers is named with credentials in `Expert_Roster_All_Studies_2026-08-06.md` Study 011, and the manuscript states the eligibility rule. Arm B: 20 completers, the two anonymous entries typed "JRS-naive expert professional", and `DRR_Detection_Validation_Protocol.md:46` states that random assignment holds participant caliber constant so that any B1 against B2 difference is attributable to the standard and not to expertise.

**2. Are the 16 Arm A and 20 Arm B participants distinct individuals?** Yes, verified at run time by personal name across every roster row. No name holds both a V-AI and an RR code.

**3. Does the 58-person total remain correct?** Yes.

**4. If 58 is correct, what three-person overlap explains the difference from 61 participation records?** E-09 is V-AI-06; E-12 is V-AI-07; E-13 is V-AI-03. Each is one human being holding a detection-panel code and a reliability-rater code.

**5. If 61 is correct, why did the manuscript previously state 58?** Not applicable. 61 is a count of participations, not of people, and the manuscript did not previously state it.

---

## 2. Text corrections

### Correction 1. Acknowledgments, participant accounting. APPLIED.

**Category:** CLARIFICATION

**Original wording**

> All 58 worked unpaid, in a personal capacity, with nothing at stake in the outcome.

**Replacement wording**

> Those three groups comprise 61 participations held by **58 distinct people**: three of the reliability raters are the same individuals as three members of the detection panel, each holding a separate code in each study. All 58 worked unpaid, in a personal capacity, with nothing at stake in the outcome.

**Reason.** the Acknowledgments credit three groups summing to 61 participations and then state a total of 58, with nothing to bridge them. The source records establish that 58 is correct and that the difference is a 3-person overlap, so the number is retained and the overlap is stated.

**Source.** `research/build_expert_roster.py:121` `CROSS_STUDY_SAME_PERSON` = E-09 is V-AI-06, E-12 is V-AI-07, E-13 is V-AI-03; `research/count_participants.py` prints 58; `research/Expert_Roster_All_Studies_2026-08-06.md:73`

### Correction 3. Section 5, comparison-study participants. APPLIED.

**Category:** CLARIFICATION

**Original wording**

> Those participants are credentialed professionals of the same standing as the panel reported here, randomised between applying the five conditions and applying a general prompt.

**Replacement wording**

> That study comprises 20 independent experts of the same professional standing as the detection panel, randomised between applying the five conditions and applying a general prompt.

**Reason.** the Methods described the comparison participants' standing but never stated their number or called them experts, leaving the count recoverable only from the Acknowledgments. The source records establish both.

**Source.** `research/Expert_Roster_All_Studies_2026-08-06.md` Study 012, 20 completers, the two anonymous entries typed "JRS-naive expert professional"; live `armb_progress` read 2026-08-18, 20 rows at 24 reads

### Correction 4. Section 3, comparison-study relationship. APPLIED.

**Category:** CLARIFICATION

**Original wording**

> Its participants are credentialed professionals drawn from the same pool and randomised within it, so the two arms differ in the method applied and not in the expertise of the people applying it.

**Replacement wording**

> Its participants are a separate set of credentialed professionals recruited from the same professional population and randomised between review methods, so its two conditions differ in the method applied and not in the expertise of the people applying it.

**Reason.** "drawn from the same pool and randomised within it" can be read as meaning the detection panel itself was randomised. It was not: the protocol specifies a fresh pool, and no named person holds both a detection-panel code and a comparison-study code. "the two arms" also misnamed the comparison's own two conditions as the arms of this study, which has none.

**Source.** `research/DRR_Detection_Validation_Protocol.md:42` "A fresh pool of participants of comparable background"; disjointness verified at run time across every named V-AI and RR row in `research/Expert_Roster_All_Studies_2026-08-06.md`

### Correction 7. Appendix B, denominator. APPLIED.

**Category:** METHODOLOGICAL

**Original wording**

> Across the 113 overall determinations recorded under the five-condition instrument:

**Replacement wording**

> Appendix B uses the 113 recorded five-condition determinations for descriptive condition-level reporting; the reliability coefficients in Section 6.5 use the deduplicated 104-label set specified by the reliability analysis rule.
>
> Across the 113 overall determinations recorded under the five-condition instrument:

**Reason.** Appendix B and Section 6.5 use different denominators, 113 against 104, for defensible reasons that the manuscript never stated. A reader meeting both reads an inconsistency that is not there.

**Source.** `research/FULL_DATA_ANALYSIS_2026-08-15.txt` section 3 reports both bases explicitly, raw jrs n=113 and deduped n=104; neither value changes

### Correction 8. Abstract. APPLIED.

**Category:** CLAIM-BOUNDARY

**Original wording**

> If they cannot, no governance control resting on human review of documentation can work.

**Replacement wording**

> If they cannot, a governance control resting on human review of that property would lack an adequate empirical basis.

**Reason.** the Abstract still carried the absolute formulation that the Introduction had already replaced. Aligning them removes a claim the study did not test.

**Source.** the Introduction's own wording in this manuscript, and `research/DRR_Detection_Validation_Protocol.md:96`, which bounds the study to detectability

---

## 3. Corrections 9 and 10, enforced as a statistical gate

Every reliability and participant figure printed in the manuscript is compared against `research/current_reliability_2026-08-18.json`, the recomputation performed against live `bench_labels` with `research/compute_ac1_ci.py` imported unmodified. The script writes nothing if any row fails.

| Check | Printed | Recomputed | Match |
|---|---|---|---|
| expert estimable records | `10` | `10` | ok |
| expert labels | `36` | `36` | ok |
| expert raters | `8` | `8` | ok |
| expert AC1 | `0.739` | `0.739` | ok |
| expert analytic low | `0.402` | `0.402` | ok |
| expert analytic high | `1.000` | `1.000` | ok |
| expert bootstrap low | `0.427` | `0.427` | ok |
| expert bootstrap high | `1.000` | `1.000` | ok |
| regular estimable records | `10` | `10` | ok |
| regular labels | `68` | `68` | ok |
| regular raters | `14` | `14` | ok |
| regular AC1 | `0.623` | `0.623` | ok |
| regular analytic low | `0.252` | `0.252` | ok |
| regular analytic high | `0.993` | `0.993` | ok |
| regular bootstrap low | `0.285` | `0.285` | ok |
| regular bootstrap high | `0.894` | `0.894` | ok |
| reliability raters, all instruments | `25` | `25` | ok |
| five-condition raters | `22` | `22` | ok |
| invited experts | `8` | `8` | ok |
| regular reviewers | `17` | `17` | ok |
| baseline-only reviewers | `3` | `3` | ok |
| records with a label | `15` | `15` | ok |
| estimable records | `10` | `10` | ok |
| submitted determinations | `113` | `113` | ok |
| retained determinations | `104` | `104` | ok |

**Statistical gate: PASS.** No reported result was changed.

---

## 4. Preservation constraints

### Correction 2. Arm A expert status

| Protected element | Present |
|---|---|
| panel size | yes |
| expert eligibility | yes |
| recruitment is not sampling | yes |

### Correction 5. Arm A / Arm B distinction

| Protected element | Present |
|---|---|
| JRS-naive is exposure, not expertise | yes |
| comparison is a different question | yes |
| comparison-study credit | yes |

### Correction 9. Primary detection result

| Protected element | Present |
|---|---|
| panel size | yes |
| countries | yes |
| continents | yes |
| corpus | yes |
| graded judgments | yes |
| accuracy | yes |
| CI low | yes |
| CI high | yes |
| sensitivity | yes |
| specificity | yes |
| point threshold | yes |
| lower-bound threshold | yes |

### Correction 10. Reliability results

| Protected element | Present |
|---|---|
| expert row | yes |
| regular row | yes |
| criterion not met | yes |
| analytic is the specified interval | yes |
| bootstrap not used to claim a pass | yes |
| 25 to 22 accounting | yes |
| baseline-only three | yes |
| 15 records | yes |
| 10 estimable | yes |
| 113 and 104 | yes |

### Correction 11. Regular-reviewer terminology

| Protected element | Present |
|---|---|
| invited experts | yes |
| open review page | yes |
| recruitment channel, not expertise | yes |

### Correction 12. Detection / reliability separation

| Protected element | Present |
|---|---|
| conclusion sentence | yes |

### Correction 13. JRS claim boundary

| Protected element | Present |
|---|---|
| feasibility not efficacy | yes |
| no criterion validity or efficacy | yes |

### Correction 14. DRR claim boundary

| Protected element | Present |
|---|---|
| abstract disclaimer | yes |
| cross-cultural | yes |
| workflow independence | yes |
| psychometric | yes |

### Correction 15. Limitations

| Protected element | Present |
|---|---|
| bimodal spectrum | yes |
| item variance | yes |
| investigator dependence | yes |
| interim reliability | yes |
| reliability too small | yes |
| reviewer heterogeneity | yes |
| independent adjudicator | yes |

---

## 5. Global terminology audit

| Term | Occurrences | Required | Result |
|---|---:|---|---|
| `JRS validated` | 0 | 0 | clean |
| `validated JRS` | 0 | 0 | clean |
| `JRS proven` | 0 | 0 | clean |
| `JRS efficacy demonstrated` | 0 | 0 | clean |
| `JRS improves documentation` (exempt: `that JRS itself improves documentation outcomes`) | 0 | 0 | clean |
| `JRS outperforms` | 0 | 0 | clean |
| `criterion validity established` | 0 | 0 | clean |
| `psychometrically validated` (exempt: `not psychometrically validated`) | 1 | 0 | clean |
| `measurement invariance established` | 0 | 0 | clean |
| `workflow independence demonstrated` | 0 | 0 | clean |
| `enterprise validated` | 0 | 0 | clean |
| `industry standard` | 0 | 0 | clean |
| `non-expert` | 0 | 0 | clean |
| `non-experts` | 0 | 0 | clean |
| `trained reviewer` | 0 | 0 | clean |
| `trained reviewers` | 0 | 0 | clean |
| `trained-reviewer` | 0 | 0 | clean |
| `those same experts` | 0 | 0 | clean |
| `expert panel` | 0 | 0 | clean |
| `same pool` | 0 | 0 | clean |
| `36 independent experts` | 0 | 0 | clean |
| `36 experts` | 0 | 0 | clean |
| `All 61` | 0 | 0 | clean |
| `0.624` | 0 | 0 | clean |
| `0.253 to 0.994` | 0 | 0 | clean |
| `0.301 to 0.886` | 0 | 0 | clean |

| Permitted term | Occurrences | Population it names |
|---|---:|---|
| `Arm A` | 0 | Study 011, detection panel |
| `Arm B` | 0 | Study 012, comparison study |
| `16 independent experts` | 1 | Study 011 completers |
| `20 independent experts` | 2 | Study 012 completers |
| `invited experts` | 3 | Study 004, E-coded raters |
| `regular reviewers` | 6 | Study 004, R-coded raters |
| `detection panel` | 5 | Study 011 |
| `comparison study` | 2 | Study 012 |
| `JRS-naive` | 1 | Study 012, exposure not expertise |
| `58` | 3 | distinct participants across all three groups |
| `61` | 5 | participations across all three groups |

**No 36-person aggregate was inserted.** The instruction forbids deriving one from 16 + 20, and although Arm A and Arm B are verified disjoint, an aggregate has no methodological purpose here: the detection finding rests on the sixteen panel members alone. The only `36` in the manuscript is the expert label count in the reliability table, which is a label count and not a person count.

---

## 6. Document integrity

| Check | Source | v2 |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 91 | 91 |
| Paragraphs over 120 characters | 182 | 183 |
| Paragraph delta | 0 | +1, being the one paragraph Correction 7 inserts |
| Duplicate paragraphs | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 11868 | 11944 |

| Section | Unchanged from the source |
|---|---|
| References and citations | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Abstract | Correction 8 only |
| Section 3 | Correction 4 only |
| Section 5 | Correction 3 only |
| Appendix B | Correction 7 only, one paragraph inserted, no value changed |
| Acknowledgments | Correction 1 only |
| Sections 1, 2, 4, 6, 7, 8, 9, 10 | unchanged |

No section was deleted, no reference altered, no citation changed. The table-row count is identical, so no table was damaged, and the reliability table is byte-identical. The source is plain Markdown and the `.docx` is generated from it, so no tracked change and no comment can be introduced.

**Document integrity: PASS**

---

"Submission-final v2 completed. Five sentences changed: the participant overlap is now stated, the comparison study is identified by number and standing, the same-pool ambiguity is removed, the two appendix denominators are distinguished, and the Abstract is aligned with the Introduction. No reported result, threshold, corpus figure, study design, arm architecture, limitation, reference or table cell was changed, and no claim was strengthened. 58 was verified and retained rather than changed to 61."

# Detection Article Final, change log

**Date:** 2026-08-18
**Source:** `research/Detection_Article_v9_2026-08-18.md` (preserved, not overwritten)
**Output:** `research/Detection_Article_Final_2026-08-18.md`
**Script:** `scripts/apply_final_repair.py`
**Statistics:** `research/current_reliability_2026-08-18.json`

---

## 1. Study architecture, established from source

Three populations. None of the numbers below crosses between them.

| Variable | Arm A / Study 011 | Arm B / Study 012 | Source |
|---|---|---|---|
| Professional qualification | credentialed practitioner or researcher in AI governance, compliance, audit, HR, investigations, data privacy, records, or law | credentialed professionals of the same standing, drawn from the same pool | `research/Expert_Roster_All_Studies_2026-08-06.md` Studies 011 and 012; `Detection_Article_v9:182`, `:228` |
| Expert status | expert | expert | same |
| Selected (registered) | 27 | 21 | live `pilot_progress`, `armb_progress`, read 2026-08-18 |
| Completed (>=24 reads) | **16** | **20** | same |
| Assignment method | none, single arm | deterministic hash of the participant code, recorded before any record is judged | `research/DRR_Detection_Validation_Protocol.md:42-46`, :80; `arm_code` column present in `armb_progress` |
| JRS condition | all 16 | B1 | `Protocol:39`, `:43` |
| Unaided condition | none | B2 | `Protocol:44` |
| B1 | N/A | **7 completers** (8 assigned; `RR-108` incomplete at 9 reads) | live `armb_progress`, read 2026-08-18 |
| B2 | N/A | **13 completers** | same |
| Records reviewed | 24 each | 24 each | `Protocol:39`, `:42` |
| Study purpose | detection signal: is DRR detectable | value of the standard: does JRS improve detection | `Protocol:39`, `:42`, `:53` |

**Arm A consisted of independent credentialed experts, all of whom applied the five JRS conditions. Arm B consisted of independent credentialed experts of the same standing, randomly assigned to one of two review conditions. The experimental distinction between the relevant conditions was the review method supplied, the five JRS conditions in B1 against a general prompt in B2, and not the expertise of the people applying it.**

The protocol states the design reason for that construction directly: *"Random assignment holds participant caliber constant, so any accuracy difference between B1 and B2 is attributable to the standard, not to expertise"* (`DRR_Detection_Validation_Protocol.md:46`).

**No authoritative source anywhere in the repository calls a B2 participant a non-expert.** The roster types the two anonymous Arm B entries "JRS-naive expert professional", and the manuscript already defines JRS-naive as exposure rather than expertise.

### Study 004, the reliability population, is separate

| Quantity | Value | Source |
|---|---|---|
| Raters submitting labels | 25 | live `bench_labels`; `REVIEWER_ROSTER_COMPLETE.md` section 004 |
| E-coded, invited experts | 8 | same |
| R-coded, self-enrolled regular reviewers | 17 | same |
| Recruitment route, E- | invitation carrying the code | `bench-review.html:60` |
| Recruitment route, R- | open review page; the code is generated in the reviewer's own browser | `bench-review.html:60`, `:107` |
| Training status of the R- pool | **none recorded anywhere.** No training gate exists in the instrument | `bench-review.html`, regex sweep for `train(ing|ed)` returns zero matches |
| Raters in the five-condition set | 22 | live `bench_labels`, `mode = jrs` |
| Excluded, baseline instrument | 3 raters, 16 labels | same, `mode = normal` |

`DRR_Detection_Validation_Protocol.md` section 4 defines Arm A and Arm B and names no `E-` or `R-` code. The rater-class split belongs to Study 004 alone and is not imported into Study 011 or Study 012 anywhere in the final manuscript; a paragraph-level co-occurrence check enforces that.

**One qualification, stated rather than smoothed over.** Three E-coded raters are the same people as Arm A completers: E-09 is V-AI-06, E-12 is V-AI-07, E-13 is V-AI-03 (`Expert_Roster_All_Studies_2026-08-06.md:73`). The populations are separately defined and separately counted, and they are not disjoint. No figure in the manuscript adds them together, so this does not affect any reported result.

---

## 2. Reliability dataset provenance, current versus historical

| Item | CURRENT | HISTORICAL |
|---|---|---|
| Dataset | live `bench_labels`, 129 rows | `research/construct_validity_data.csv`, 99 rows |
| Date | closed 2026-08-15, re-read 2026-08-18 | extract 2026-08-04 |
| Analysis code | `research/compute_ac1_ci.py`, imported unmodified | same script |
| Labels, R-coded | 68 | 63 |
| Raters, R-coded | 14 | 13 |
| Records carrying a label | 15 | 10 in the extract |
| Estimable records | 10 | 10 |
| AC1, R-coded | **0.6228, prints 0.623** | 0.6236, prints 0.624 |
| Analytic 95% CI | **0.252 to 0.993** | 0.253 to 0.994 |
| Bootstrap 95% CI | **0.285 to 0.894** | 0.301 to 0.886 |

**0.624 came from the 63-label dataset. 0.6228, printing as 0.623, comes from the current 68-label dataset.** The current data reproduce 0.623, so the point estimate is kept and 0.624 is not restored.

**The v9 row was internally inconsistent and that is the defect this change repairs.** It carried the 68-label point estimate beside the 63-label intervals. Both halves of the row are now computed on the same 68 labels from the same 14 raters.

### Recomputation method, and what was not chosen

| Element | Value | Why |
|---|---|---|
| Estimator | `research/compute_ac1_ci.py`, imported unmodified | the script the manuscript cites; the method was not reimplemented |
| Bootstrap replicates | 20000 | that module's own `B` constant, read at run time |
| Bootstrap seed | 20260727 | that module's own `SEED` constant. **No seed was invented** |
| Inclusion rule | mode = jrs; one label per rater per record; latest created_at retained | the rule the manuscript already states in Methods 4.7 |
| Tie-break on "latest" | `created_at` ascending | `dedup_last()` keeps the last row in iteration order, which is only "latest" if the caller sorts first |

Two fail-closed gates ran before any figure was accepted, and the script writes nothing if either fails:

1. **The live table still matches the published run.** 129 rows, `jrs` 113 and `normal` 16, 25 raters split 8 and 17, 15 records: every one matches `research/FULL_DATA_ANALYSIS_2026-08-15.txt` section 3.
2. **The recomputation reproduces the published point estimates.** Experts 0.739 on 36 labels from 8 raters; regular reviewers 0.623 on 68 labels from 14 raters; pooled 0.665 on 104 labels from 22 raters. All twelve comparisons matched.

### Full current results

| Group | Labels | Raters | Estimable records | Raw pairwise | AC1 | Analytic 95% CI | Bootstrap 95% CI | Krippendorff alpha | Fleiss kappa |
|---|---|---|---|---|---|---|---|---|---|
| experts (E-coded, invited) | 36 | 8 | 10 | 80.0% | 0.739 | 0.402 to 1.000 | 0.427 to 1.000 | 0.618 | 0.646 |
| regular reviewers (R-coded, self-enrolled) | 68 | 14 | 10 | 71.2% | 0.623 | 0.252 to 0.993 | 0.285 to 0.894 | 0.314 | 0.257 |
| all five-condition raters | 104 | 22 | 10 | 74.2% | 0.665 | 0.369 to 0.962 | 0.397 to 0.881 | 0.426 | 0.381 |

**The pre-registered lower-bound criterion of 0.41 still fails on both panels, and the conclusion in Section 6.5 is unchanged.** The expert lower bound is 0.402, the regular-reviewer lower bound is 0.252.

**The expert row was not edited, because it recomputes byte-identically.** The expert labels did not change between the two runs: 36 labels from 8 raters in both, AC1 0.739, analytic 0.402 to 1.000, bootstrap 0.427 to 1.000.

---

## 3. Record-level accounting

| Quantity | Value | Source |
|---|---|---|
| Records carrying at least one five-condition label | 15 | live `bench_labels` |
| Records with two or more raters | 10 | same |
| Records with one rater only | 5 | same |
| Reason for exclusion | not estimable for inter-rater agreement | `compute_ac1_ci.py` `ac1()`: `recs = [labels for labels in recmap.values() if len(labels) >= 2]` |

The five records were not defective and are not described as such. A coefficient of agreement is undefined on a record only one person read.

---

## 4. Participant accounting, 25 against 22

| Quantity | Value | Belongs to |
|---|---|---|
| Raters submitting labels on the reliability set | 25 | Study 004 |
| E-coded invited experts | 8 | Study 004 |
| R-coded regular reviewers | 17 | Study 004 |
| Baseline-instrument raters, excluded from the coefficient | 3 | Study 004 |
| Raters in the five-condition analysed set | 22 | Study 004 |
| Detection panel completers | 16 | Study 011, Arm A |
| Comparison study completers | 20 | Study 012, Arm B |

The three excluded raters and their label counts, read live:

| Rater | Labels | Instrument |
|---|---|---|
| `R-mqhv2o4r8nct` | 5 | `normal`, unstructured baseline |
| `R-mqn414vzho7i` | 6 | `normal`, unstructured baseline |
| `R-mqnibu38bbxi` | 5 | `normal`, unstructured baseline |

Total 16 labels. None of the three appears in the five-condition set, so the subtraction is clean: 25 minus 3 is 22.

---

## 5. The edits

### APPLIED. Edit A1. Section 6.5 table, regular-reviewer row: current intervals

**Before**

> | Trained reviewers | 10 | 68 | 14 | 0.623 | 0.253 to 0.994 | 0.301 to 0.886 |

**After**

> | Regular reviewers | 10 | 68 | 14 | 0.623 | 0.252 to 0.993 | 0.285 to 0.894 |

### APPLIED. Edit A2. Section 6.5, failed-criterion sentence: current lower bound

**Before**

> The expert lower bound is 0.402 against a required 0.41; the trained-reviewer lower bound is 0.253.

**After**

> The expert lower bound is 0.402 against a required 0.41; the regular-reviewer lower bound is 0.252.

### APPLIED. Edit B1. Section 4.7, rater-class definition

**Before**

> Raters whose codes begin with E are experts; the remainder are trained reviewers.

**After**

> Raters whose codes begin with E are invited experts whose credentials are recorded. The remainder are regular reviewers who entered through the open review page and declared a professional domain without identity verification. The two groups are reported separately because they were recruited by different routes; the split records the recruitment channel and is not a measure of professional expertise.

### APPLIED. Edit B2. Section 4.7, inclusion rule: coefficient label

**Before**

> on the analysed set the trained-reviewer coefficient is 0.623

**After**

> on the analysed set the regular-reviewer coefficient is 0.623

### APPLIED. Edit B3. Acknowledgments, rater-class labels

**Before**

> **The reliability study, 25 raters**, eight expert and seventeen trained, recorded labels on the shared record set. Twenty-two of them, eight expert and fourteen trained, worked under the five-condition instrument and are the analysed sample behind the coefficients in Section 6.5; the other three trained raters worked under the unstructured baseline prompt

**After**

> **The reliability study, 25 raters**, eight invited experts and seventeen regular reviewers, recorded labels on the shared record set. Twenty-two of them, eight experts and fourteen regular reviewers, worked under the five-condition instrument and are the analysed sample behind the coefficients in Section 6.5; the other three regular reviewers worked under the unstructured baseline prompt

### APPLIED. Edit C1. Section 6.5, record-level accounting

**Before**

> On a shared set of 10 records carrying 113 submitted determinations under the five-condition instrument, reduced to 104 after keeping one label per rater per record:

**After**

> Fifteen records carried at least one label under the five-condition instrument. Because agreement can only be estimated where a record was reviewed by more than one rater, the ten records with two or more raters formed the analysed reliability set. Those ten records carry 113 submitted determinations, reduced to 104 after keeping one label per rater per record:

### Numerical changes

| Old value | New value | Dataset | Analysis source | Method |
|---|---|---|---|---|
| analytic CI 0.253 to 0.994 | **0.252 to 0.993** | live `bench_labels`, 68 R-coded labels | `research/compute_ac1_ci.py` `analytic_ci()` | Gwet (2014) linearisation variance, Student t on n-1 df, n = 10 records |
| bootstrap CI 0.301 to 0.886 | **0.285 to 0.894** | same | `research/compute_ac1_ci.py` `bootstrap_ci()` | subject-level record resample, 20000 replicates, seed 20260727 |
| lower bound cited in prose, 0.253 | **0.252** | same | same | same |
| AC1 0.623 | **0.623, unchanged** | same | same | Gwet (2014) multiple-rater AC1 |
| expert row, all values | **unchanged** | live `bench_labels`, 36 E-coded labels | same | recomputes byte-identically |

### EDIT D, arm terminology: verified, no change required

The instruction conditions Edit D on the source records confirming both arms are expert panels. They do. v9 already states it correctly in four places, and each is asserted as a required presence rather than rewritten:

| Statement | Present |
|---|---|
| Arm B expertise parity and condition-not-expertise, Section 3 | yes |
| Arm A expert eligibility, Section 5 | yes |
| Arm B expert standing and the meaning of JRS-naive, Section 5 | yes |
| JRS-naive is exposure, not expertise | yes |

Rewriting correct prose to demonstrate activity would be churn and would risk the very conflation this pass exists to prevent.

---

## 6. Global numerical audit

| Number | Classification | Where it belongs |
|---|---|---|
| 0.624 | HISTORICAL | 63-label run. **Absent from the final manuscript** |
| 0.623 | CURRENT | Study 004 regular-reviewer AC1, 68 labels |
| 0.253, 0.994 | HISTORICAL | 63-label analytic interval. **Absent** |
| 0.301, 0.886 | HISTORICAL | 63-label bootstrap interval. **Absent** |
| 0.252, 0.993 | CURRENT | 68-label analytic interval |
| 0.285, 0.894 | CURRENT | 68-label bootstrap interval |
| 63 | HISTORICAL | superseded label count. **Absent** |
| 68 | CURRENT | Study 004 regular-reviewer labels |
| 13 | HISTORICAL | superseded rater count |
| 14 | CURRENT | Study 004 regular-reviewer raters |
| 15 records | CURRENT, METHODOLOGICAL | records carrying a label |
| 10 records | CURRENT, METHODOLOGICAL | estimable records |
| 25 | CURRENT | Study 004 raters, all instruments |
| 22 | CURRENT | Study 004 five-condition raters |
| 17 | CURRENT | Study 004 R-coded regular reviewers |
| 8 | CURRENT | Study 004 E-coded invited experts |
| 16 | CURRENT | **Arm A** detection panel completers |
| 20 | CURRENT | **Arm B** comparison study completers |

| Superseded value | Present in the final manuscript |
|---|---|
| `0.624` (superseded trained AC1, 63-label run) | no |
| `0.349 to 0.898` (interval with no provenance in this repository) | no |
| `0.253 to 0.994` (63-label analytic interval) | no |
| `0.301 to 0.886` (63-label bootstrap interval) | no |
| `63 labels` (superseded trained-label count) | no |
| `108 submitted` (superseded submitted-label count) | no |
| `99 after keeping` (superseded retained-label count) | no |
| `trained reviewer` (unsupported rater class) | no |
| `trained-reviewer` (unsupported rater class) | no |
| `seventeen trained` (unsupported rater class) | no |
| `fourteen trained` (unsupported rater class) | no |

| Protected primary result | Present and unchanged |
|---|---|
| panel accuracy | yes |
| primary CI low | yes |
| primary CI high | yes |
| detection panel size | yes |
| corpus size | yes |
| graded reads | yes |
| comparison panel size | yes |
| sensitivity | yes |
| specificity | yes |
| expert AC1 | yes |
| expert analytic interval | yes |
| expert bootstrap interval | yes |
| reliability point floor | yes |
| reliability bound criterion | yes |
| pooled reliability target | yes |

**Numerical integrity: PASS**

---

## 7. Global terminology audit

| Term | Count in the final manuscript | Status |
|---|---:|---|
| `trained reviewer` | 0 | must be 0 |
| `trained reviewers` | 0 | must be 0 |
| `trained-reviewer` | 0 | must be 0 |
| `regular reviewer` | 4 | permitted |
| `regular reviewers` | 4 | permitted |
| `expert reviewer` | 0 | permitted |
| `invited experts` | 2 | permitted |
| `Arm A` | 0 | permitted |
| `Arm B` | 0 | permitted |
| `B1` | 0 | permitted |
| `B2` | 0 | permitted |

| Conflation check | Result |
|---|---|
| `trained reviewer` in a paragraph with `Arm A` | none |
| `trained reviewer` in a paragraph with `Arm B` | none |
| `regular reviewer` in a paragraph with `Arm A` | none |
| `regular reviewer` in a paragraph with `Arm B` | none |
| `regular reviewer` in a paragraph with `B1` | none |
| `regular reviewer` in a paragraph with `B2` | none |
| `E-coded` in a paragraph with `Arm A` | none |
| `E-coded` in a paragraph with `Arm B` | none |

**Arm architecture: PASS**

---

## 8. Claim boundary and limitations

| Limitation that must survive | Present |
|---|---|
| author-generated corpus | yes |
| investigator dependence | yes |
| recruitment is not sampling | yes |
| criterion validity not established | yes |
| criterion validity disclaimed in the abstract | yes |
| reliability criterion failed | yes |
| reliability sample too small | yes |
| item variance limitation | yes |
| no independent adjudicator | yes |
| group not individual reliance | yes |

| Overclaim that must be absent | Present |
|---|---|
| `JRS validated` | no |
| `validated JRS` | no |
| `JRS proven` | no |
| `DRR validated` | no |
| `criterion validity established` | no |
| `psychometrically validated` (exempt: `not psychometrically validated`) | no |
| `workflow independence demonstrated` | no |
| `enterprise validated` | no |
| `industry standard` | no |

Detection, reliability, validity and JRS efficacy remain four separate claims. Nothing in this pass converts a detection result into a validation claim; the only statistical change narrows and shifts one confidence interval, and the pre-registered criterion it is measured against still fails.

**Claim boundary: PASS**

---

## 9. Document integrity

| Check | v9 | Final |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 91 | 91 |
| Paragraphs over 120 characters | 181 | 181 |
| Duplicate paragraphs | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 11719 | 11801 |

| Section | Unchanged from v9 |
|---|---|
| References and citations | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Sections 1 through 5 | unchanged |
| Section 4.7 | Edits B1 and B2 only |
| Section 6.5 | Edits A1, A2 and C1 only |
| Acknowledgments | Edit B3 only |

v9 was not overwritten. The source is plain Markdown and the `.docx` is generated from it, so no tracked change and no comment can be introduced. No citation was deleted, no reference altered, no table damaged: the table-row count is identical and the References block is byte-identical.

**Document integrity: PASS**

---

"Final surgical repair completed. The reliability confidence intervals are now computed on the same dataset as the point estimate they accompany. Unsupported rater-class terminology is retired. The record-level exclusion is disclosed. No primary study result, preregistered threshold, corpus composition, study design, arm architecture, limitation, or substantive methodological finding was changed."

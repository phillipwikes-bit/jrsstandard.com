# Detection Article, submission-final change log

**Date:** 2026-08-18
**Source:** `research/Detection_Article_Final_2026-08-18.md` (preserved, not overwritten)
**Output:** `research/Detection_Article_Submission_Final_2026-08-18.md`
**Script:** `scripts/apply_submission_final.py`
**Statistical gate reads:** `research/current_reliability_2026-08-18.json`

Fourteen instructed edits. Five change text; nine are preservation constraints compiled into 43 assertions that fail the run if what they protect has moved. No change is filed under "general improvement", because no such category exists here.

---

## 1. Text edits

### Edit 1. Section 9, Conclusion. APPLIED.

**Category:** CLARIFICATION

**Original wording**

> It also establishes that those same experts vary widely among themselves, and that a pre-registered reliability criterion was not met on the sample available.

**Replacement wording**

> It also establishes substantial variation in accuracy among the sixteen detection-panel experts, while the separate reliability sample did not meet the pre-registered lower-bound criterion.

**Reason.** "those same experts" reads as though the sixteen detection-panel experts are the reliability sample. They are not: the reliability coefficients come from Study 004, a separate population of 25 raters.

**Source.** `research/DRR_Detection_Validation_Protocol.md` section 4 defines Arm A and names no reliability rater code; `research/FULL_DATA_ANALYSIS_2026-08-15.txt` section 3 versus section 8 counts the two populations separately

### Edit 2. Section 4.7, pre-registered thresholds. APPLIED.

**Category:** METHODOLOGICAL

**Original wording**

> **Reliability floor (supporting).** Gwet's AC1 among the expert panel of at least 0.61, **with the lower bound of its confidence interval at least 0.41.** Both parts are criteria. Section 7 reports the outcome of both, including the part that failed.

**Replacement wording**

> **Reliability floor (supporting).** Gwet's AC1 was pre-specified at a minimum of 0.61, with a lower confidence bound of at least 0.41, for the reliability analyses reported by reviewer group in Section 6.5. Both parts were criteria. Section 7 reports the outcome of both, including the part that failed.

**Reason.** "among the expert panel" is ambiguous between the sixteen detection-panel experts and the eight invited expert raters of Study 004, and the floor applies to the reliability analyses, which are reported by reviewer group. Neither threshold value changes.

**Source.** `research/DRR_Detection_Validation_Protocol.md:66` states the floor without scoping it to a named panel; Section 6.5 of this manuscript reports two reviewer groups

### Edit 3. Section 6.5, analysed denominator. APPLIED.

**Category:** METHODOLOGICAL

**Original wording**

> Fifteen records carried at least one label under the five-condition instrument. Because agreement can only be estimated where a record was reviewed by more than one rater, the ten records with two or more raters formed the analysed reliability set. Those ten records carry 113 submitted determinations, reduced to 104 after keeping one label per rater per record:

**Replacement wording**

> Of the 25 reliability participants, 22 contributed labels under the five-condition instrument and entered the analysed reliability sample: eight invited experts and fourteen regular reviewers. Three regular reviewers contributed only under the unstructured baseline prompt and were excluded because those labels did not assess agreement under the five-condition instrument.
>
> Fifteen records carried at least one label under the five-condition instrument. Because agreement can only be estimated where a record was reviewed by more than one rater, the ten records with two or more raters formed the analysed reliability set. Those ten records carry 113 submitted determinations, reduced to 104 after keeping one label per rater per record:

**Reason.** the analytical denominator was recoverable only from the Acknowledgments. A reader should not have to leave the Results to learn which raters entered the coefficient. The existing record-accounting sentence is preserved verbatim beneath it.

**Source.** live `bench_labels`, read 2026-08-18: 25 raters (8 `E-`, 17 `R-`), 22 under `mode = jrs`, 3 `mode = normal` only, recorded in `research/current_reliability_2026-08-18.json`

### Edit 6. Section 6.5, bootstrap sensitivity sentence. APPLIED.

**Category:** TERMINOLOGICAL

**Original wording**

> it indicates that the failure is marginal for the expert panel and that the conclusion is sensitive to interval construction

**Replacement wording**

> it indicates that the failure is marginal for the invited-expert group and that the conclusion is sensitive to interval construction

**Reason.** "the expert panel" is ambiguous between three populations: the sixteen detection-panel experts of Study 011, the twenty comparison-study experts of Study 012, and the eight invited expert raters of Study 004. The 0.427 bootstrap lower bound belongs to the last of those. The Final Global Search in the instruction requires the phrase to be disambiguated wherever it survives.

**Source.** the coefficient is the Study 004 expert row of the Section 6.5 table, 36 labels from 8 raters, confirmed against `research/current_reliability_2026-08-18.json`; the replacement term is the one Section 4.7 and the Acknowledgments already use

### Edit 7. Section 1, Introduction. APPLIED.

**Category:** CLAIM-BOUNDARY

**Original wording**

> If independent experts, reading a record cold, cannot tell one whose reasoning is present from one whose reasoning is absent, then documentation risk is not a governable property and no control built on human review can work.

**Replacement wording**

> If independent experts cannot reliably distinguish records whose reasoning is present from those whose reasoning is absent under the stated reviewer standpoint, then a governance control that depends on human review of that property would lack an adequate empirical basis.

**Reason.** "is not a governable property" and "no control built on human review can work" are absolute claims about all controls and all conditions. The study tests one operationalisation under one reviewer standpoint on one constructed corpus.

**Source.** the manuscript's own scope statements at Section 8.4, 8.5 and 8.10, and `research/DRR_Detection_Validation_Protocol.md:96`, which bounds the study to detectability

### Edit 8. Section 7, Discussion, The layer. APPLIED.

**Category:** CLAIM-BOUNDARY

**Original wording**

> Whether this particular operationalisation is the right one is open; that the layer needs operationalising seems to us harder to dispute.

**Replacement wording**

> Whether this particular operationalisation is the right one remains open; the study provides a basis for testing whether record-level reconstructability warrants a distinct measurement layer in AI governance.

**Reason.** "harder to dispute" asserts a field-level proposition the study did not test. The conceptual contribution survives as a basis for testing rather than as a settled point.

**Source.** no source in the repository tests the field-level claim; `DRR_Detection_Validation_Protocol.md:96` bounds the study to detectability

---

## 2. Edit 4, the statistical gate

Edit 4 instructs verification, not alteration, and instructs a stop on any discrepancy. Every reliability figure printed in the manuscript is compared against the recomputation performed against live `bench_labels` with `research/compute_ac1_ci.py` imported unmodified. The script writes nothing if any row below fails.

| Check | Printed in the manuscript | Recomputed from the current dataset | Match |
|---|---|---|---|
| gate1_live_matches_committed_run | `True` | `True` | ok |
| gate2_point_estimates_reproduce | `True` | `True` | ok |
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
| prose expert lower bound | `0.402` | `0.402` | ok |
| prose regular lower bound | `0.252` | `0.252` | ok |
| reliability raters, all instruments | `25` | `25` | ok |
| reliability raters, five-condition set | `22` | `22` | ok |
| invited experts | `8` | `8` | ok |
| regular reviewers, all instruments | `17` | `17` | ok |
| baseline-only regular reviewers | `3` | `3` | ok |
| records carrying a label | `15` | `15` | ok |
| estimable records | `10` | `10` | ok |
| single-rater records | `5` | `5` | ok |

**Edit 4: VERIFIED, no change made.** The current values stand. `0.624`, `0.253 to 0.994` and `0.301 to 0.886` are absent from the manuscript and are on the forbidden list above.

---

## 3. Preservation constraints, edits 5, 6, 9, 10, 11, 12, 13 and 14

### Edit 5. Reliability terminology

**Category:** TERMINOLOGICAL

| Protected element | Present |
|---|---|
| invited-expert wording | yes |
| recruitment-channel sentence, verbatim | yes |
| regular reviewers in the table | yes |
| regular reviewers in the Acknowledgments | yes |

### Edit 6. Arm A / Arm B expert status

**Category:** CLARIFICATION

| Protected element | Present |
|---|---|
| Arm B expertise parity and condition-not-expertise | yes |
| Arm A expert eligibility | yes |
| Arm B same standing, randomised between methods | yes |
| JRS-naive is exposure, not expertise | yes |

### Edit 9. Primary detection result

**Category:** STATISTICAL

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
| detection threshold | yes |
| lower-bound threshold | yes |

### Edit 10. JRS claim boundary

**Category:** CLAIM-BOUNDARY

| Protected element | Present |
|---|---|
| feasibility not efficacy | yes |
| comparison study is a different question | yes |
| no efficacy | yes |

### Edit 11. DRR claim boundary

**Category:** CLAIM-BOUNDARY

| Protected element | Present |
|---|---|
| abstract disclaimer | yes |
| cross-cultural validity not established | yes |
| workflow independence is an intention | yes |
| not psychometrically validated | yes |
| criterion validity not attempted | yes |

### Edit 12. Record-level disclosure

**Category:** METHODOLOGICAL

| Protected element | Present |
|---|---|
| fifteen records sentence | yes |
| estimability reason | yes |

### Edit 13. Reliability failure remains disclosed

**Category:** STATISTICAL

| Protected element | Present |
|---|---|
| criterion not met | yes |
| analytic interval is the specified one | yes |
| bootstrap is not used to claim a pass | yes |
| expert AC1 | yes |
| regular-reviewer AC1 | yes |

### Edit 14. Limitation language

**Category:** METHODOLOGICAL

| Protected element | Present |
|---|---|
| recruitment is not sampling | yes |
| spectrum restriction | yes |
| construct dependence | yes |
| reliability sample too small | yes |
| interim reliability | yes |
| item variance | yes |
| no independent adjudicator | yes |
| group not individual reliance | yes |

---

## 4. Final global search

| Term | Occurrences | Required | Result |
|---|---:|---|---|
| `JRS validated` | 0 | 0 | clean |
| `validated JRS` | 0 | 0 | clean |
| `JRS proven` | 0 | 0 | clean |
| `JRS efficacy demonstrated` | 0 | 0 | clean |
| `JRS improves documentation` (exempt: `that JRS itself improves documentation outcomes`) | 0 | 0 | clean |
| `JRS improves reviewer performance` | 0 | 0 | clean |
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
| `0.624` | 0 | 0 | clean |
| `0.253 to 0.994` | 0 | 0 | clean |
| `0.301 to 0.886` | 0 | 0 | clean |
| `36 independent experts` | 0 | 0 | clean |
| `36 experts` | 0 | 0 | clean |
| `expert panel` | 0 | 0, ambiguous between three populations | clean |
| `the expert group` | 0 | 0, ambiguous between three populations | clean |

| Permitted term | Occurrences | Population it names |
|---|---:|---|
| `Arm A` | 0 | Study 011, detection panel |
| `Arm B` | 0 | Study 012, comparison study |
| `B1` | 0 | Study 012, five-condition condition |
| `B2` | 0 | Study 012, general-prompt condition |
| `invited experts` | 3 | Study 004, E-coded raters |
| `regular reviewers` | 6 | Study 004, R-coded raters |
| `detection panel` | 3 | Study 011 |
| `comparison study` | 2 | Study 012 |
| `JRS-naive` | 1 | Study 012, exposure not expertise |

### Numerals verified against their population

| Numeral | Population | Occurrences |
|---|---|---:|
| 16 | Study 011, Arm A, detection-panel completers | 12 |
| 20 | Study 012, Arm B, comparison-study completers | 1 |
| 25 | Study 004, reliability raters, all instruments | 2 |
| 22 | Study 004, five-condition analysed sample | 2 |
| 36 | **must not appear as a combined panel figure** | 0 |

**No combined 36 figure was created.** The instruction forbids inventing one from 16 + 20, and the source records show the two arms are not fully disjoint from the Study 004 expert raters in any case: E-09 is V-AI-06, E-12 is V-AI-07, E-13 is V-AI-03 (`research/Expert_Roster_All_Studies_2026-08-06.md:73`). The only `36` surviving in the manuscript is the expert label count in the reliability table, which is a label count and not a person count.

---

## 5. Document integrity

| Check | Source | Submission final |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 91 | 91 |
| Paragraphs over 120 characters | 181 | 182 |
| Paragraph delta | 0 | +1, being the one paragraph Edit 3 inserts |
| Duplicate paragraphs | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 11801 | 11868 |

| Section | Unchanged from the source |
|---|---|
| References and citations | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Acknowledgments | yes, byte-identical |
| Section 1 | Edit 7 only |
| Section 4.7 | Edit 2 only |
| Section 6.5 | Edit 3 only |
| Section 7 | Edit 8 only |
| Section 9 | Edit 1 only |

No section was deleted, no reference altered, no citation changed. The table-row count is identical, so no table was damaged, and the reliability table itself is byte-identical: Edit 3 inserts a paragraph above it and changes no cell. The source is plain Markdown and the `.docx` is generated from it, so no tracked change and no comment can be introduced. The Acknowledgments are byte-identical, which is how the no-duplication requirement in Edit 3 is enforced rather than asserted.

**Document integrity: PASS**

---

"Submission-final editorial pass completed. Five sentences changed, four for population clarity and claim boundary and one inserting the analysed reliability denominator into the Results. No primary detection result, reliability statistic, preregistered threshold, corpus composition, study design, arm architecture, limitation, reference or table cell was changed. No claim was strengthened."

# Detection Article v9, reconciliation change log

**Date:** 2026-08-18
**Source:** `research/Detection_Article_v8_2026-08-18.md`
**Output:** `research/Detection_Article_v9_2026-08-18.md`
**Script:** `scripts/apply_v9_reconciliation.py`

One edit, to the Acknowledgments only. Sections 1 through 8, the References, and Appendices A, B and C are byte-identical to v8. No AC1, confidence interval, label count, record count or other reported result was changed.

---

## 1. The reconciliation, from source

**Question.** Section 6.5 reports 8 expert and 14 trained raters, 22 in total. The Acknowledgments credited 25, eight expert and seventeen trained. Why do they differ?

**Answer, and it is not attrition and not a recruitment figure.** Both are counts of raters who submitted labels on the same shared 10-record set. They differ by the pre-registered inclusion rule the manuscript already states in Section 6.5 and in the Methods: *labels recorded under the five-condition instrument (`mode = jrs`), one label per rater per record, latest submission retained*.

| Quantity | Value | Composition |
|---|---|---|
| Raters who labelled the reliability set | **25** | 8 expert, 17 trained |
| Raters in the analysed sample | **22** | 8 expert, 14 trained |
| Difference | **3** | trained raters who used the unstructured baseline prompt, contributing 16 labels |

### The excluded raters, named

| Rater | Labels | Instrument |
|---|---|---|
| `R-mqhv2o4r8nct` | see source | `normal`, unstructured baseline |
| `R-mqn414vzho7i` | see source | `normal`, unstructured baseline |
| `R-mqnibu38bbxi` | see source | `normal`, unstructured baseline |

Total 16 labels. This is the same figure the manuscript already discloses in the Methods as *"Sixteen labels in the same table were recorded by raters working under an unstructured baseline prompt rather than the five conditions."* The Acknowledgments and the Methods were describing the same three people; only the Acknowledgments did not say so.

### Exact sources

| Claim | File | Evidence |
|---|---|---|
| 25 raters, 8 expert and 17 trained | `research/REVIEWER_ROSTER_COMPLETE.md` section **004 Reviewer reliability** | states **"25 reviewers."** and tabulates 25 codes: 8 `E-` and 17 `R-` |
| Same figure carried in the programme state | `research/MASTER_TRACKER.md` | key `reliability_raters` = 25 (8 expert raters, 17 trained reviewers) |
| 17 trained under all instruments, 14 under the five conditions | `research/Detection_Article_Figure_Update_2026-08-15.md` | AC1 by inclusion rule: `jrs` only = 0.623 on 68 labels from **14** raters; all modes = 0.157 on **17** raters |
| The three excluded raters are baseline-mode raters | same file | rows `R-mqhv2o4r8nct`, `R-mqn414vzho7i`, `R-mqnibu38bbxi` marked `normal` |
| Independent floor on the expert count | `research/reliability_labels_2026-08-04.tsv` | 8 distinct expert codes, 13 distinct trained codes, 99 labels, being the 2026-08-04 extract before the fourteenth trained rater's labels arrived |

### Arithmetic, checked at run time and fail-closed

| Check | Result |
|---|---|
| roster total is experts plus trained | **ok** |
| all-modes trained count equals the roster trained count | **ok** |
| analysed trained equals roster trained minus the baseline-mode raters | **ok** |
| the excluded raters carry sixteen labels | **ok** |
| the 2026-08-04 extract holds the same expert count | **ok** |
| the extract's trained count is one below the current analysed count | **ok** |

The script refuses to write the manuscript if any row above fails. The counts are parsed out of the evidence files at run time; none of them is typed into the script.

---

## 2. The edit

**APPLIED. Edit 1, Acknowledgments, analysed sample distinguished from credited raters.**

**Before**

> **The reliability study, 25 raters**, eight expert and seventeen trained, produced the coefficients in Section 6.5 and the per-condition analysis in Appendix B, which exists only because they recorded a judgment on each of the five conditions separately rather than only the overall read.

**After**

> **The reliability study, 25 raters**, eight expert and seventeen trained, recorded labels on the shared record set. Twenty-two of them, eight expert and fourteen trained, worked under the five-condition instrument and are the analysed sample behind the coefficients in Section 6.5; the other three trained raters worked under the unstructured baseline prompt and their labels are excluded from those coefficients by the inclusion rule stated in that section. All 25 are credited here because all 25 did the work. Appendix B exists only because the five-condition raters recorded a judgment on each of the five conditions separately rather than only the overall read.

Credit is unchanged at 25. Nothing is withdrawn from anyone. The analysed sample is named beside the credited total so that a reader moving between the Acknowledgments and Section 6.5 is not left to reconcile 25 against 22 unaided, and so that no reader can mistake the credited total for the denominator of a coefficient.

---

## 3. Global consistency sweep

| Quantity that must be present and unchanged | Present |
|---|---|
| credited reliability raters, Acknowledgments | yes |
| credited split, Acknowledgments | yes |
| analysed split, Acknowledgments | yes |
| excluded raters, Acknowledgments | yes |
| expert raters, Section 6.5 table | yes |
| trained raters, Section 6.5 table | yes |
| submitted determinations | yes |
| retained after deduplication | yes |
| excluded label count, Methods | yes |
| reliability record set | yes |
| pooled reliability target | yes |
| detection corpus | yes |
| expert AC1 | yes |
| trained AC1 | yes |
| trained analytic interval | yes |
| trained bootstrap interval | yes |
| expert analytic interval | yes |
| expert bootstrap interval | yes |
| detection panel size | yes |
| detection graded reads | yes |
| comparison panel size | yes |
| inclusion rule stated in Methods | yes |

| Superseded or misleading value that must be absent | Scope | Present |
|---|---|---|
| `0.624` (superseded trained AC1) | whole manuscript | no |
| `0.349 to 0.898` (superseded trained interval) | whole manuscript | no |
| `99 after keeping` (superseded retained-label count) | whole manuscript | no |
| `108 submitted` (superseded submitted-label count) | whole manuscript | no |
| `63 labels` (superseded trained-label count) | whole manuscript | no |
| `22 raters` (the analysed total is spelled out, never given as a credit) | Acknowledgments | no |
| `25 analysed` (the credited total is not the analysed total) | whole manuscript | no |
| `recruited` (the 25 is a labelling count, not a recruitment figure) | Acknowledgments | no |
| `recruit` (the 25 is a labelling count, not a recruitment figure) | Acknowledgments | no |

**Global consistency: PASS**

---

## 4. Document integrity

| Check | v8 | v9 |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 91 | 91 |
| Paragraphs over 120 characters | 181 | 181 |
| Duplicate paragraphs | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 11660 | 11719 |

| Section | Unchanged from v8 |
|---|---|
| Sections 1 through 8 | yes, byte-identical |
| References and citations | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Acknowledgments | changed by Edit 1 only |

v8 was not overwritten. The source is plain Markdown and the `.docx` is generated from it, so no tracked change and no comment can be introduced.

**Document integrity: PASS**

"v9 reconciliation completed. No primary study result, preregistered threshold, corpus composition, study design, or substantive methodological finding was changed. The trained-reviewer AC1 remains 0.623 with analytic interval 0.253 to 0.994 and bootstrap interval 0.301 to 0.886."

# Detection Article, submission-FINAL change log

**Date:** 2026-08-18
**Source:** `research/Detection_Article_Submission_Final_v3_2026-08-18.md` (preserved unchanged as the audit baseline)
**Output:** `research/Detection_Article_Submission_FINAL_2026-08-18.md`
**Script:** `scripts/apply_submission_freeze.py`
**Authority:** `research/FINAL_SUBMISSION_READINESS_AUDIT_2026-08-18.md`

Edit scope hard-capped at two. The script asserts the cap and refuses to run if a third rule is ever added.

---

## 1. Novelty claim

**1. Exact original language**

> It is that reconstructability of the individual record has not been operationalised as a measurable property with a stated instrument, a stated scale, and reported detection and agreement statistics.

**2. Exact revised language**

> It is that, to our knowledge, reconstructability of the individual record has not been operationalised as a measurable property with a stated instrument, a stated scale, and reported detection and agreement statistics.

**3. Reason.** The original asserted an unqualified universal negative over the literature. No source can establish a universal negative, and the repository holds no systematic review, search protocol or coverage claim that could support one. The qualification alters nothing substantive: the novelty proposition, its narrowing, the concession that reconstructability has long been valued, and "what this paper supplies" are all unchanged. Identified in the Final Submission Readiness Audit, Part 12, as the single manuscript defect and classified SURGICAL EDIT.

---

## 2. Chronology statement

**4. Was it changed?** **YES, and only to the extent the retained record supports.**

**5. Exact original language**

> **Author-side classification.** Before any reviewer was recruited, the first author recorded an intended classification for each of the 24 records

**6. Exact revised language**

> **Author-side classification.** Before verification began, the first author recorded an intended classification for each of the 24 records

**7. Evidence supporting the decision**

| Item | Finding |
|---|---|
| author-side key first committed | 2026-07-06 db7a34c |
| earliest commit introducing a V-AI panel code | 2026-06-26 a25ddab Add AI-records pilot reviewer page (Jake / AI Governance Advisor) |
| pilot_progress columns available to the public key | code, last_at, name, reads_today, total_reads |
| registration timestamp in pilot_progress | ABSENT: no created_at, enrolled_at or invited_at column |
| ai_pilot_reads (per-read table) | RLS-locked, returns zero rows to the public key |
| recruitment or invitation log dating panel enrolment | NONE in the repository |
| consequence | the retained record cannot date the author-side classification against the first recruitment, and the earliest V-AI artifact predates the key's commit date |

**The claim is not asserted to be false and may well be true.** A file can be authored long before it is committed, and `research/Intended_Key_authorside.md` states in its own header that the intended labels were fixed and time-stamped before independent verification. What the repository cannot do is date the author-side classification against the first recruitment, and the earliest retained detection-panel artifact carries a date earlier than the key's commit. The sentence is therefore narrowed to the form the retained record supports directly. **No other chronology in the manuscript was touched.**

**If the author can date the classification against the first recruitment from personal records, the original wording is restorable and this change should be reverted.** It is a conservatism, not a correction of a known error.

---

## 3. Confirmations

**8. No statistic changed.** 42 frozen values were asserted individually and all are present and unaltered, covering the primary detection result, both reliability rows with their intervals, the reference-classification counts, and every determination and record count.

**9. No participant count changed.** 16 Arm A, 20 Arm B, 25 Study 004, 58 distinct humans, 61 participations, the three-person Arm A / Study 004 overlap, and the three automated reference instances are all unchanged. The Acknowledgments are byte-identical to v3, which is how the participant accounting is protected rather than merely asserted.

**10. No JRS or DRR claim boundary changed.** The JRS sentence, the criterion-validity disclaimers at the Abstract, the Section 2 table and heading 8.10, and the limitation headings 8.4, 8.5 and 8.6 are all present and unmodified. The failed pre-registered reliability criterion and the refusal to substitute the bootstrap interval both remain.

**11. The LLM and human distinction is unchanged.** Section 4.4 still states three separate large-language-model instances, automated raters rather than human raters, no expert or professional status claimed, 72 record-level classifications, reproduction on all 24 records, no adjudication, two passes pre-registered against three executed, no independent human validation, and no human replication. No vendor or model is named and no identity with the Appendix A systems is implied.

**Diff scope.** 2 lines differ from v3, and 2 edits were authorised. The script fails if those two numbers disagree, so no whitespace normalisation, paragraph reflow, reference reordering or generator artefact can enter unnoticed.

---

## 4. Frozen-value assertions

| Protected value | Present |
|---|---|
| panel accuracy | yes |
| primary CI low | yes |
| primary CI high | yes |
| sensitivity | yes |
| specificity | yes |
| graded reads | yes |
| Arm A panel | yes |
| Arm B panel | yes |
| Arm B standing | yes |
| reliability participants | yes |
| baseline-only three | yes |
| 58 and 61 | yes |
| three-person overlap | yes |
| corpus | yes |
| three automated instances | yes |
| automated not human | yes |
| no expert status | yes |
| 72 judgments | yes |
| 24 of 24 | yes |
| no adjudication | yes |
| 2 pre-registered, 3 executed | yes |
| expert AC1 row | yes |
| regular AC1 row | yes |
| 113 and 104 | yes |
| 15 and 10 records | yes |
| appendix B denominator | yes |
| JRS boundary | yes |
| no criterion validity or efficacy | yes |
| criterion validity disclaimed | yes |
| construct dependence | yes |
| human-validation limitation | yes |
| no human replication | yes |
| reproducibility disclosure | yes |
| reliability criterion failed | yes |
| analytic is the specified interval | yes |
| bootstrap not a pass | yes |
| ethics, no IRB | yes |
| detection / reliability separation | yes |
| recruitment is not sampling | yes |
| psychometric limitation | yes |
| workflow independence limitation | yes |
| cross-cultural limitation | yes |

| Value or phrasing that must be absent | Present |
|---|---|
| `0.624` | no |
| `0.253 to 0.994` | no |
| `0.301 to 0.886` | no |
| `36 independent experts` | no |
| `36 experts` | no |
| `All 61` | no |
| `blind raters` | no |
| `blinded raters` | no |
| `trained reviewer` | no |
| `non-expert` | no |
| `same pool` | no |
| `those same experts` | no |
| `expert panel` | no |
| `were not told that a reference classification existed` | no |
| `Nothing about the reference classification is withheld` | no |
| `human validation` (exempt: `does not constitute independent human validation`) | no |
| `JRS validated` | no |
| `validated JRS` | no |
| `JRS proven` | no |
| `JRS efficacy demonstrated` | no |
| `JRS outperforms` | no |
| `criterion validity established` | no |
| `psychometrically validated` (exempt: `not psychometrically validated`) | no |
| `workflow independence demonstrated` | no |
| `measurement invariance established` | no |

---

## 5. Document integrity

| Check | v3 | FINAL |
|---|---|---|
| Headings | 45 | 45 |
| Table rows | 91 | 91 |
| Paragraphs over 120 characters | 184 | 184 |
| Duplicate paragraphs | 0 | 0 |
| Em-dashes | 0 | 0 |
| Words | 12074 | 12075 |
| Lines differing from v3 | 0 | 2 |

| Section | Unchanged from v3 |
|---|---|
| References and citations | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Acknowledgments | yes, byte-identical |
| Section 2 | novelty qualification only |
| Section 4.2 | chronology qualification only |
| All other sections | unchanged |

**Document integrity: PASS**

---

## 6. Deferred editorial issues

Identified and **not implemented**, because the edit scope is capped at two.

**DEFERRED 1. repetition created by Edit 2.** The prescribed replacement makes the Section 4.2 paragraph read "Before verification began, the first author recorded ... This document was fixed and time-stamped before verification began and was not revised afterwards." The phrase now appears twice in three sentences. This was identified as a THIRD candidate change and NOT made: the instruction caps the edit scope at two and requires a third to be reported rather than implemented. The redundancy is stylistic only and changes no fact. If the author restores the original chronology wording, it disappears by itself; otherwise the second clause could be trimmed to "was fixed and time-stamped beforehand" in a later single-edit pass.

**DEFERRED 2. Section 4.4 and Appendix A vendor-specificity asymmetry.** Appendix A names three vendors for the nightly cross-vendor runs while Section 4.4 can name none for the reference passes. The asymmetry is factual and correct. Identified as a third candidate change and NOT made: the edit scope is capped at two.

**DEFERRED 3. editorial repetition at five locations.** The audit's Part 14 lists five places where a concession is made more than once. Classified OPTIONAL there and not implemented here.

---

## 7. Guard results

Recorded by the freeze runner after this script completes; see the execution report and `research/MASTER_TRACKER.md` for the run values of `scripts/verify_manuscript_figures.py` and `scripts/check_zero_drift.py`.

**14. Commit hash.** No commit was created by this pass. If one is created later on explicit authorisation, the hash belongs here.

---

"Submission-final pass completed. Two surgical edits: a novelty qualification and a chronology narrowing to what the retained record supports. No statistic, participant count, methodological distinction, claim boundary, limitation, reference, appendix or acknowledgment was changed."

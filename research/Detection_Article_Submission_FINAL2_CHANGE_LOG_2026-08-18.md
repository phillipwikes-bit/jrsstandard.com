# Detection Article FINAL2, change log

**1. Current manuscript version:** `research/Detection_Article_Submission_FINAL_2026-08-18.md` (preserved, not overwritten)
**2. New manuscript version:** `research/Detection_Article_Submission_FINAL2_2026-08-18.md`
**Date:** 2026-08-18
**Script:** `scripts/apply_final2_reconciliation.py`

---

## 1. Correction 1, chronology reconciliation

**Why it was necessary.** The Abstract said the reference classification was *fixed before recruitment* while Section 4.2 said *Before verification began*. One manuscript cannot say both. **The contradiction was introduced by the previous pass**, which narrowed Section 4.2 and did not carry the change into the Abstract. That is a miss in the prior pass, not an inherited defect.

**3. Changed location:** Abstract, Methods sentence.

**4. Exact original wording**

> against a pre-specified reference classification fixed before recruitment and independently reproduced by automated raters without access to it

**5. Exact replacement wording**

> against a pre-specified reference classification fixed before independent verification and independently reproduced by automated raters without access to it

**6. Source supporting the change**

| Question | Finding |
|---|---|
| 1. when the author-side classification was recorded | NOT ESTABLISHED. The file states it was fixed before verification; no artifact dates the act of recording |
| 2. when it was fixed and time-stamped | first entered the repository at 2026-07-06 db7a34c |
| 3. when independent verification began | NOT DATED directly; the verified key first entered at 2026-07-06 48f3ead, so verification completed on or before that date |
| 4. when participant recruitment began | NOT ESTABLISHED. pilot_progress exposes no created_at, enrolled_at or invited_at; ai_pilot_reads is RLS-locked; no recruitment or invitation log exists. Earliest retained detection-panel artifact: 2026-06-26 a25ddab Add AI-records pilot reviewer page (Jake / AI Governance Advisor) |
| 5. what the pre-registration requires | the verified key is "fixed before any accuracy analysis". It says nothing about recruitment or reading. |
| verdict | "before recruitment" NOT ESTABLISHABLE, because recruitment is undated in every retained source. "before independent verification" IS supported: research/Intended_Key_authorside.md states the intended labels are fixed and that blind raters then apply the rule |

**Decision rule applied.** The instruction gives three outcomes. Recruitment is undated in every retained source, so the first is unavailable. `research/Intended_Key_authorside.md` states in its own header that the intended labels are fixed and that blind raters then apply the operational rule, which supports the second. The Abstract is therefore set to **"fixed before independent verification"**, matching Section 4.2. **The stronger chronology was not silently chosen, and the claim is not asserted to be false**: a file can be authored long before it is committed, and if the author can date the classification against the first recruitment from personal records, both statements are restorable together.

---

## 2. Correction 2, corpus generation against reference classification

**VERIFIED. NO EDIT MADE.** The two statements concern two different procedures and are not in contradiction.

| Check | Result |
|---|---|
| Section 4.3 sentence concerns CORPUS GENERATION | **ok** |
| Section 4.4 sentence concerns REFERENCE-CLASSIFICATION REPRODUCTION | **ok** |
| the two sentences describe different procedures, so they do not contradict | **ok** |
| no vendor, model, version, temperature or prompt appears in the reference-classification block | **ok** |
| Appendix A vendors are not asserted to be the reference-classification systems | **ok** |

Section 4.3 describes **corpus generation**: the records were generated with model assistance and edited by the first author, and the generation model, version, dates, prompts and extent of editing are stated to be recorded in the corpus construction log. Section 4.4 describes **reference-classification reproduction**: three automated instances re-derived the key, and their implementation details were not retained. Different procedures, different artifacts, no conflict.

**No vendor, model, version, temperature or prompt was inserted into Section 4.4**, and the Appendix A vendors are not asserted anywhere to be the reference-classification systems.

---

## 3. Corrections 3 to 7, audits

| Correction | Result |
|---|---|
| 3. Reference-rater description and study architecture | **PASS**, no edit. 16 detection experts, 20 comparison experts, 25 reliability participants of whom 22 and 3, and 3 automated instances producing 72 judgments at 100 percent agreement with no adjudication, 2 pre-registered against 3 executed, all present and unchanged. No 36-expert aggregate. |
| 4. "independently reproduced" claim | **PASS**, no edit. 4 occurrences, each within a context stating that the automated raters had no access to the intended labels. The Section 4.4 limitations on human validation, criterion validity and construct dependence are intact. |
| 5. JRS claim boundary | **PASS**, no edit. |
| 6. DRR claim boundary | **PASS**, no edit. The failed pre-registered reliability lower-bound criterion remains reported and the bootstrap interval is still disowned as a rescue. |
| 7. Novelty claim | **PASS**, no edit. Already qualified with "to our knowledge" by the previous pass. |

---

## 4. Confirmations

**8. No statistic changed.** 46 frozen values asserted individually, all present and unaltered.

**9. No participant count changed.** 16, 20, 25, 22, 3, 58, 61 and the three-person overlap are unchanged. The Acknowledgments are byte-identical to the source.

**10. No methodology changed.** Unit of observation, Student t interval, Gwet's AC1, analytic and bootstrap intervals, the detection threshold and Appendix C are untouched. `compute_ac1_ci.py` was not modified and no analysis was re-run.

**11. No JRS claim boundary changed.**

**12. No DRR claim boundary changed.**

**13. The human and LLM distinction is preserved.** The three reference instances remain automated raters, not human raters, with no expert or professional status claimed, and are nowhere counted among the 58 humans.

**16. Unauthorized edits: 0.** 1 line differ from the source and 1 edit authorised; the script fails if those numbers disagree.

---

## 5. Frozen-value assertions

| Protected value | Present |
|---|---|
| panel accuracy | yes |
| CI low | yes |
| CI high | yes |
| sensitivity | yes |
| specificity | yes |
| graded reads | yes |
| detection panel | yes |
| comparison panel | yes |
| corpus | yes |
| balance | yes |
| balance 2 | yes |
| expert AC1 row | yes |
| regular AC1 row | yes |
| 113 and 104 | yes |
| 25 and 22 | yes |
| three baseline-only | yes |
| 58 and 61 | yes |
| three automated instances | yes |
| automated not human | yes |
| no expert status | yes |
| 72 judgments | yes |
| 24 of 24 | yes |
| no adjudication | yes |
| 2 pre-registered, 3 executed | yes |
| no human validation | yes |
| no human replication | yes |
| reproducibility limit | yes |
| novelty qualified | yes |
| Methods chronology | yes |
| JRS boundary | yes |
| no criterion validity or efficacy | yes |
| criterion validity disclaimed | yes |
| construct dependence | yes |
| reliability criterion failed | yes |
| analytic is specified | yes |
| bootstrap not a pass | yes |
| psychometric limitation | yes |
| workflow limitation | yes |
| cross-cultural limitation | yes |
| item variance limitation | yes |
| recruitment is not sampling | yes |
| investigator dependence | yes |
| reviewer heterogeneity | yes |
| ethics, no IRB | yes |
| detection / reliability separation | yes |
| corpus generation log sentence | yes |

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
| `fixed before recruitment` | no |
| `Before any reviewer was recruited` | no |
| `were not told that a reference classification existed` | no |
| `Nothing about the reference classification is withheld` | no |
| `human validation` (exempt: `does not constitute independent human validation`) | no |
| `independent validation` (exempt: `independent validation adjudicator`) | no |
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

## 6. Document integrity

| Section | Unchanged from the source |
|---|---|
| References | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Acknowledgments | yes, byte-identical |
| Abstract | chronology reconciliation only |
| All other sections | unchanged |

Paragraphs over 120 characters: 184 to 184. Duplicate paragraphs: 0. Em-dashes: 0.

**Document integrity: PASS**

---

## 7. Deferred editorial issues

**DEFERRED 1. corpus construction log is not in this repository.** Section 4.3 states that the generation prompts, model, version, dates and extent of human editing per record "are recorded in the corpus construction log", and Section 11 lists that log among the released materials. No such artifact exists in this repository. It may exist in the author's own files, and the manuscript describes it as release material rather than as something already published. NOT EDITED: the instruction forbids resolving uncertainty by inference, and absence from this repository does not establish absence. **The author should confirm the log exists before the data-availability statement is relied on by an editor.**

**DEFERRED 2. repetition in Section 4.2.** The paragraph reads "Before verification began, the first author recorded ... This document was fixed and time-stamped before verification began and was not revised afterwards." The phrase appears twice in three sentences. Carried forward from the previous pass and still not fixed, because it is stylistic and outside the authorised edit list.

---

## 8. Guard and zero-drift results

**14. Guard results** and **15. zero-drift results** are recorded by the runner after this script completes; see the execution report and `research/MASTER_TRACKER.md`.

---

"FINAL2 completed. One substantive edit: the Abstract chronology reconciled with the Methods to the formulation the retained record supports. No statistic, participant count, methodological choice, claim boundary, limitation, reference, appendix or acknowledgment was changed."

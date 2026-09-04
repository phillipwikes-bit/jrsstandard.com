# Detection Article FINAL3, change log

**CURRENT VERSION:** FINAL2
**NEW VERSION:** FINAL3
**Source:** `research/Detection_Article_Submission_FINAL2_2026-08-18.md` (preserved, not overwritten)
**Source sha256:** `433560afb356a854501e8d447f94169ce0b1f747d93d918a0e428b91be9962c1`
**Output:** `research/Detection_Article_Submission_FINAL3_2026-08-18.md`
**Script:** `scripts/apply_final3_terminology.py`
**Date:** 2026-08-18

| Field | Value |
|---|---|
| MANUSCRIPT EDIT REQUIRED | **YES** |
| AUTHORIZED EDIT 1, terminology | **YES**, 2 occurrences |
| AUTHORIZED EDIT 2, corpus log | **NO**, see below |
| CORPUS LOG STATUS | **NOT ESTABLISHED** |
| CHRONOLOGY | **LOCKED** |
| STATISTICS | UNCHANGED |
| PARTICIPANT COUNTS | UNCHANGED |
| METHODOLOGY | UNCHANGED |
| JRS CLAIM BOUNDARY | UNCHANGED |
| DRR CLAIM BOUNDARY | UNCHANGED |
| REFERENCE-RATER ARCHITECTURE | UNCHANGED |
| SUPERSEDED VALUES | 0 |
| UNAUTHORIZED EDITS | 0 |

---

## 1. Authorized Action 1, reference-rater terminology

**Both occurrences sit outside Section 4.4, which is why the v3 pass missed them: that pass was scoped to Section 4.4 and to the four front-matter locations, and neither of these is in either group.** One is in the data-availability list an editor reads; the other is in the list of mitigations a sceptical reviewer weighs.

### Edit 1. Section 11, data availability. APPLIED.

**Original**

> the instructions given to the blind reference raters and their record-by-record reproduction result;

**Replacement**

> the instructions given to the automated reference-classification instances and their record-by-record reproduction result;

**Source.** research/Verified_Key.md:8, which records that the three raters were large-language-model instances and not human raters

**Reason.** "blind reference raters" is the last surviving description of the three automated instances in terms a reader takes as human. It sits in the data-availability list, where an editor reads it, and the v3 pass did not reach it because that pass was scoped to Section 4.4.

**Category.** TERMINOLOGY CORRECTION

### Edit 2. Section 9, mitigations in place. APPLIED.

**Original**

> blind independent reproduction of the reference classification by raters not involved in corpus construction and who did not see the hypotheses;

**Replacement**

> blind independent reproduction of the reference classification by automated raters not involved in corpus construction and who did not see the hypotheses;

**Source.** research/Verified_Key.md:8; consistency with the existing usage at the Abstract, Section 1, the Section 2 validity table, Section 3 and Section 4.4

**Reason.** the bare word "raters" in the list of mitigations reads as human, and the sentence is one a sceptical reviewer will weigh precisely because it is offered as a mitigation of investigator dependence. "automated raters" is the term FINAL2 already uses in eight other places, so this is the minimum adjustment and introduces no new vocabulary.

**Category.** TERMINOLOGY CORRECTION

### Human-referent occurrences deliberately NOT changed

| Occurrence | Refers to | Preserved |
|---|---|---|
| Study 004 reliability raters, Methods 4.7 | human participants | yes |
| Study 004, invited experts | human participants | yes |
| Study 004, one label per rater per record | human participants | yes |
| Study 004, those raters answered a different question | human participants | yes |
| reliability estimability, two or more raters | human participants | yes |
| Acknowledgments, reliability raters | human participants | yes |

The word "rater" is correct for the Study 004 human reliability participants and appears throughout Section 4.7, Section 6.5 and the Acknowledgments in that sense. **Only the two occurrences that refer to the automated instances were touched.**

### Architecture after the edit

| Population | Count | Nature |
|---|---:|---|
| Detection panel, Study 011 | 16 | independent human experts |
| Comparison study, Study 012 | 20 | independent human experts |
| Reliability, Study 004 | 25 total, 22 analysed | human |
| Reference classification | 3 | automated LLM instances |

No group is merged and no 36-expert aggregate exists.

---

## 2. Authorized Action 2, corpus construction log

**CORPUS LOG STATUS: NOT ESTABLISHED (STATE C). NO MANUSCRIPT CHANGE MADE.**

| Search | Result |
|---|---|
| filename search for corpus / construction / provenance / generation across the repository | NO MATCHING DATA FILE |
| content search for per-record generation metadata, excluding manuscript versions | NO SOURCE CARRIES IT |
| git history, was such a file ever committed and later deleted | NEVER PRESENT IN HISTORY |
| any source affirmatively contradicting the log's existence | NONE |

**What the manuscript claims.** Section 4.3: *"The generation prompts, the model and version used for each record, the generation dates, and the extent of human editing per record are recorded in the corpus construction log, which is part of the materials released under the data-availability terms in Section 11."* Section 11 lists the same log among the released materials.

**Why nothing was changed.** The instruction is explicit for STATE C: the author may hold the log outside the repository, so the statement is left standing unless an authoritative source affirmatively contradicts it. **Nothing does.** Absence from this repository is not evidence of absence, and the manuscript describes the log as release material rather than as something already deposited. No file was invented and no text was deleted.

**Why this still blocks the freeze.** The claim is not decorative: it is a **release commitment inside the data-availability statement**. An editor or reviewer who requests the materials will expect the log to exist with per-record generation model, version, date, prompt and extent of human editing. If it does not exist in that form, the commitment cannot be met and Section 4.3 overstates what is retained. **Only the author can resolve this**, and it is the single item standing between FINAL3 and a clean freeze.

---

## 3. Locks verified

| Lock | Status |
|---|---|
| Chronology, "fixed before independent verification" | **LOCKED**, present and unchanged |
| Chronology, "Before verification began" | **LOCKED**, present and unchanged |
| "fixed before recruitment" | absent |
| Statistical values | 33 frozen values asserted, all present |
| Superseded 0.624 | absent |
| Reliability criterion failed | reported and unchanged |
| Bootstrap not used as a pass | disowned and unchanged |
| Verbal reliability bands | still dropped |
| JRS claim boundary | unchanged |
| DRR claim boundary | unchanged |

| Protected value | Present |
|---|---|
| accuracy | yes |
| CI low | yes |
| CI high | yes |
| sensitivity | yes |
| specificity | yes |
| graded reads | yes |
| detection panel | yes |
| comparison panel | yes |
| corpus | yes |
| grounded half | yes |
| unsupported half | yes |
| expert row | yes |
| regular row | yes |
| 113 and 104 | yes |
| 25 and 22 | yes |
| three baseline-only | yes |
| 58 and 61 | yes |
| 24 of 24 | yes |
| no adjudication | yes |
| 2 vs 3 passes | yes |
| chronology locked, Abstract | yes |
| chronology locked, Methods | yes |
| novelty qualified | yes |
| JRS boundary | yes |
| no criterion validity or efficacy | yes |
| reliability criterion failed | yes |
| expert lower bound | yes |
| bootstrap not a pass | yes |
| verbal bands dropped | yes |
| no human validation | yes |
| no human replication | yes |
| corpus log sentence intact | yes |
| ethics, no IRB | yes |

| Phrasing that must be absent | Present |
|---|---|
| `blind reference raters` | no |
| `blinded reference raters` | no |
| `blind raters` | no |
| `blinded raters` | no |
| `expert raters` | no |
| `professional raters` | no |
| `human reference raters` | no |
| `criterion validators` | no |
| `expert validators` | no |
| `human validators` | no |
| `human validation` (exempt: `does not constitute independent human validation`) | no |
| `expert validation` | no |
| `trained reviewer` | no |
| `non-expert` | no |
| `same pool` | no |
| `those same experts` | no |
| `expert panel` | no |
| `36 independent experts` | no |
| `36 experts` | no |
| `All 61` | no |
| `0.624` | no |
| `0.253 to 0.994` | no |
| `0.301 to 0.886` | no |
| `fixed before recruitment` | no |
| `Before any reviewer was recruited` | no |
| `JRS validated` | no |
| `validated JRS` | no |
| `JRS proven` | no |
| `JRS efficacy demonstrated` | no |
| `JRS outperforms` | no |
| `criterion validity established` | no |
| `psychometrically validated` (exempt: `not psychometrically validated`) | no |
| `workflow independence demonstrated` | no |
| `measurement invariance established` | no |
| `substantial agreement` | no |
| `moderate agreement` | no |

---

## 4. Document integrity

| Section | Unchanged from FINAL2 |
|---|---|
| References | yes, byte-identical |
| Appendix A | yes, byte-identical |
| Appendix B | yes, byte-identical |
| Appendix C | yes, byte-identical |
| Acknowledgments | yes, byte-identical |
| Abstract | unchanged |
| Sections 1 to 8 | unchanged |
| Section 9 | Edit 2 only |
| Section 11 | Edit 1 only |

Paragraphs over 120 characters 184 to 184, duplicates 0, em-dashes 0, 2 lines differ from FINAL2 against 2 authorised edits.

**Document integrity: PASS**

---

"FINAL3 completed. Two terminology corrections, both removing the last descriptions of the automated reference-classification instances in words a reader takes as human. The corpus construction log could not be established and the manuscript was deliberately left unchanged; it requires author confirmation. No statistic, participant count, methodological choice, chronology, claim boundary, limitation, reference, appendix or acknowledgment was changed."

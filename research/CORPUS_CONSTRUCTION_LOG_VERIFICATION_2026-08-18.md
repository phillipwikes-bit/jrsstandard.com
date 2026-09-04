# CORPUS CONSTRUCTION LOG VERIFICATION

**Date:** 18 August 2026
**Manuscript under test:** `research/Detection_Article_Submission_FINAL3_2026-08-18.md` / `.docx`
**Change log:** `research/Detection_Article_Submission_FINAL3_CHANGE_LOG_2026-08-18.md`
**Mode:** source-only verification. No manuscript file was created or modified.

---

## 1. EXECUTIVE DETERMINATION

### CORPUS LOG NOT ESTABLISHED

**AUTHORITATIVE FILE:** none identified
**RECORD COVERAGE:** 0 / 24
**GENERATION MODEL:** 0 / 24
**MODEL VERSION:** 0 / 24
**GENERATION DATE:** 0 / 24
**GENERATION PROMPT:** 0 / 24
**HUMAN EDITING:** 0 / 24
**RELEASE STATUS:** not established
**MANUSCRIPT EDIT:** NONE

No Level 1, Level 2, Level 3 or Level 4 source supports the claim. **No source contradicts it either.** Absence from this repository is not evidence of absence: the log may exist in the author's own files, and the manuscript describes it as release material rather than as something already deposited.

**One caution about this report's own method, recorded rather than buried.** The first automated sweep returned `AUTHORITATIVE CONTRADICTION FOUND`. That was false. The hit was `scripts/apply_final3_terminology.py:125-126`, where my own contradiction-search regex contains the literal string `construction log does not exist`. The pattern matched itself. Re-tested with the search tooling excluded, **no contradiction exists**. Had that first result been reported without checking, it would have blocked submission on an artifact of my own code.

---

## 2. MANUSCRIPT CLAIM TESTED

**Section 4.3:**

> "The generation prompts, the model and version used for each record, the generation dates, and the extent of human editing per record are recorded in the corpus construction log, which is part of the materials released under the data-availability terms in Section 11."

**Data Availability, Section 11:**

> "Released under the study's data-availability terms: the 24 constructed records; the corpus construction log, including generation model, version, date, prompt, and extent of human editing per record; ..."

Two distinct assertions are under test:

| # | Assertion | Type |
|---|---|---|
| A | The information **is recorded** in a corpus construction log | factual claim about what exists |
| B | That log **is part of the released materials** | release commitment |

---

## 3. AUTHORITATIVE SOURCES EXAMINED

| Scope | Extent |
|---|---|
| Files in the working tree, excluding `.git` | **719** |
| Machine-readable text files content-searched | **502** |
| Extensions searched | `.md .csv .json .tsv .txt .yaml .yml .xml .py .js .html` |
| Binary files not content-searched | 217 (`.docx`, `.pdf`, `.png`) |
| Filename terms searched | 18 (corpus, construction, generation, provenance, record provenance, generation log, construction log, corpus log, record metadata, model version, generation date, generation prompt, human editing, editing history, record history, source record, record creation, case generation) |
| Git history | **all branches**, `--diff-filter=ADR`, **774 distinct paths** ever added, deleted or renamed |
| Live database tables | `study_runs`, `bench_labels`, `pilot_progress`, `armb_progress` (read); `ai_pilot_reads`, `bench_experts` RLS-locked |

**Manuscript versions were excluded from the content search by design.** Under the stated source-priority rule the manuscript is not evidence of the existence of the log; including it would have returned the claim under test as its own proof.

---

## 4. CORPUS CONSTRUCTION LOG EXISTENCE

| # | Question | Answer | Evidence |
|---:|---|---|---|
| 1 | Does a corpus construction log exist? | **NOT ESTABLISHED** | no artifact found across the 719-file tree, the 502-file content sweep, or the 774-path history |
| 2 | Exact filename / path | **none** | filename sweep returned a single hit, `decision-reconstruction-risk.html`, which matched on the word "reconstruction" and is a public web page |
| 3 | Ever committed to the repository? | **NO** | `git log --all --diff-filter=ADR --name-only` over 774 paths returns no corpus, construction, provenance, generation or record-metadata artifact |
| 4 | If deleted, can historical existence be established? | **NO** | it was never present; no deletion to recover |
| 5 | Equivalent artifact under another name? | **NO** | 11 files matched two or more field-name patterns; **all 11 fail the per-record test** (section 6) |

### The eleven candidates, and why each fails

| Candidate | Record IDs tied to generation metadata | Verdict |
|---|---:|---|
| `api/run-study.js` | 0 | nightly reproducibility runner. Not the corpus log |
| `content/linkedin/README.md` | 0 | content guidance. Not the corpus log |
| `index.html` | 0 | public page. Not the corpus log |
| `jrsstandard.html` | 0 | public page. Not the corpus log |
| `research/MASTER_TRACKER.md` | 3, none tied to a generation field | session log. Not the corpus log |
| `research/REFERENCE_CLASSIFICATION_SOURCE_REPORT_2026-08-18.md` | 2, none tied | my own prior audit. Not the corpus log |
| `research/build_evaluator_outreach.py` | 0 | outreach builder. Not the corpus log |
| `research/build_reviewer_roster_doc.py` | 0 | roster builder. Not the corpus log |
| `scripts/apply_final2_reconciliation.py` | 0 | **my own tooling**, matched on its own search patterns |
| `scripts/apply_final3_terminology.py` | 0 | **my own tooling**, same cause |
| `training.html` | 0 | public page. Not the corpus log |

**The per-record test:** a genuine corpus construction log must tie a generation field to a record identifier. The test asked whether any `R01`–`R24` identifier appears within 200 characters of "generation model", "model version", "generation date", "generation prompt" or "extent of human editing". **No candidate satisfies it.**

---

## 5. 24-RECORD COMPLETENESS

**RECORDS DOCUMENTED: 0 / 24**

No candidate log exists, so no completeness test against 24 records can be performed.

**What does exist for the 24 records:**

| Artifact | Carries | Does not carry |
|---|---|---|
| `research/Intended_Key_authorside.md` | R01–R24, intended label, per-record evidentiary rationale | generation model, version, date, prompt, editing extent |
| `research/Verified_Key.md` | R01–R24, verified label, 12/12 balance | the same five fields |
| `research/AnswerKey_Verification_Packet.md` | the operational rule and the 24 records as presented to raters | the same five fields |

**The full text of the 24 constructed records is not present in the repository as a data file.** The verification packet contains record descriptions for the rating task; it is not a provenance record.

Record identifiers are established as `R01` through `R24` by `research/Verified_Key.md`, which tabulates all 24. That was verified rather than assumed.

---

## 6. REQUIRED METADATA FIELD VERIFICATION

| Field | Coverage | Missing for |
|---|---:|---|
| Generation model | **0 / 24** | all records: R01–R24 |
| Model version | **0 / 24** | all records: R01–R24 |
| Generation date | **0 / 24** | all records: R01–R24 |
| Generation prompt | **0 / 24** | all records: R01–R24 |
| Extent of human editing | **0 / 24** | all records: R01–R24 |

No value was filled, inferred or reconstructed.

| # | Question | Answer |
|---:|---|---|
| 6 | Contains information for all 24 records? | **NO** — no artifact |
| 7 | Identifies the generation model per record? | **NO** |
| 8 | Identifies the model version per record? | **NO** |
| 9 | Identifies the generation date per record? | **NO** |
| 10 | Identifies the generation prompt per record? | **NO** |
| 11 | Identifies the extent of human editing per record? | **NO** |
| 12 | Supports the claim that the information "is recorded"? | **NOT ESTABLISHED from repository sources** |

---

## 7. RELEASE-READINESS VERIFICATION

The two questions are separate and are answered separately.

**A. DOES THE LOG EXIST?** NOT ESTABLISHED.

**B. CAN THE LOG BE RELEASED AS PROMISED?** NOT ESTABLISHED, and unanswerable while A is unanswered.

| # | Question | Answer | Basis |
|---:|---|---|---|
| 13 | Is the "part of the released materials" claim supported? | **NOT ESTABLISHED** | nothing to release has been identified |
| 14 | Is the artifact currently releasable? | **NOT ESTABLISHED** | no artifact |
| 15 | Confidentiality, privacy, licensing or access restrictions? | **NONE IDENTIFIED, AND NONE WOULD APPLY.** The manuscript states at Section 4.2 that no record derives from a real case, individual or organisation, so a generation log would carry no personal data. Any barrier would be practical, not legal | `Detection_Article…` Section 4.2 provenance paragraph |
| 16 | Could an editor requesting the stated materials reasonably receive it? | **NOT ESTABLISHED FROM THIS REPOSITORY.** Only the author can answer | — |

**This is the operative risk.** Section 11 is a commitment to a journal and to future readers. An editor or reviewer who requests the data-availability materials will expect a log carrying five fields for each of 24 records. If it does not exist in that form, the commitment cannot be met and Section 4.3 overstates what is retained.

---

## 8. DISTINCTION FROM OTHER LOGS

| Artifact | Where | Classification |
|---|---|---|
| Appendix A machine-consistency run log | live `study_runs`, 64 rows | **SUPPORTING EVIDENCE ONLY.** Concerns three vendors re-judging records nightly. Says nothing about how records were generated |
| Automated reference-classification execution records | `research/Verified_Key.md`, aggregate only | **SUPPORTING EVIDENCE ONLY.** Concerns reproducing the key. Per-pass artifacts were not retained, as Section 4.4 already discloses |
| Analysis datasets | `closed_aggregates_2026-08-15.json`, `current_reliability_2026-08-18.json`, `construct_validity_data.csv` | **NOT the corpus log.** Scored outcomes, not record provenance |
| Author-side reference classification | `research/Intended_Key_authorside.md` | **NOT the corpus log.** Carries the intended label and evidentiary rationale per record; carries none of the five generation fields |
| Git commit history | this repository | **NOT the corpus log.** Dates commits, not record generation |
| Participant response data | `ai_pilot_reads`, `bench_labels`, `pilot_progress`, `armb_progress` | **NOT the corpus log.** Reviewer judgments |
| General research notes | `research/*.md` | **NOT the corpus log.** No source identifies any of them as such |

| # | Question | Answer |
|---:|---|---|
| 18 | Distinct from the Appendix A reproducibility run log? | **YES, entirely** |
| 19 | Distinct from the reference-classification execution records? | **YES, entirely** |
| 20 | Distinct from the general analysis dataset? | **YES, entirely** |

**No overlapping artifact was promoted to "the corpus construction log".** Each is classified as supporting evidence or as unrelated, per the instruction.

---

## 9. CONTRADICTORY EVIDENCE

**Question 17: Does any authoritative source contradict the manuscript's statement?**

**NO.**

The automated sweep initially returned one hit. It is disqualified, and the disqualification is recorded here rather than silently dropped:

| Apparent hit | Location | Why it is not a contradiction |
|---|---|---|
| `construction log does not exist` | `scripts/apply_final3_terminology.py:125-126` | **My own contradiction-search regex, matching its own literal.** The string is a search pattern I wrote in the previous pass, not a factual statement by any source |

Re-run with the search tooling excluded: **zero contradictions across all 502 text files.**

Nothing in the repository states that the log was not kept, does not exist, or was not retained per record.

---

## 10. EVIDENTIARY GAPS

| Gap | Consequence |
|---|---|
| No corpus construction log in the repository | Assertions A and B unverifiable from this repository |
| The 24 constructed records are not present as a data file | The Section 11 commitment to release "the 24 constructed records" is likewise unverifiable here |
| 217 binary files were not content-searched | A log stored as `.docx`, `.pdf` or a spreadsheet inside this repository would have been missed by the content sweep, though **not** by the 18-term filename sweep, which returned nothing |
| No external file system was searched | The author's own machine, cloud storage and any Supabase table not exposed to the public key were out of reach |

**The third and fourth gaps are the reason this determination is NOT ESTABLISHED rather than DOES NOT EXIST.**

---

## 11. FINAL DETERMINATION

### CORPUS LOG NOT ESTABLISHED

No authoritative artifact was identified. No source contradicts the manuscript. The claim is unverified, not disproved.

---

## 12. RECOMMENDED AUTHOR ACTION

**The author must do one of two things. Both are legitimate; only the author can choose.**

**Option 1 — locate and deposit the log.** If a corpus construction log exists outside the repository carrying generation model, version, date, prompt and extent of human editing for each of the 24 records, deposit it with the study materials. Sections 4.3 and 11 then stand unchanged and this gate clears. Because no record derives from a real case, individual or organisation, there is no confidentiality barrier to depositing it.

**Option 2 — authorize a surgical correction to what is actually retained.** If the log does not exist in that form, Sections 4.3 and 11 overstate what is available and must be narrowed to the retained record. This would be a two-location edit of the same class as the previous passes, and **it is not authorized by this task**: it requires an explicit instruction.

**What must not happen:** submitting with the commitment intact while the log cannot be produced. That converts an unverified claim into a broken undertaking to a journal at the point an editor requests materials.

**A partial third path exists** if the log is incomplete rather than absent: narrow the two statements to the fields actually retained, and say so. That also requires explicit authorization.

---

## 13. MANUSCRIPT MODIFICATION STATUS

| Check | Result |
|---|---|
| **MANUSCRIPT MODIFIED** | **NO** |
| **UNAUTHORIZED EDITS** | **0** |
| FINAL3 content unchanged | yes |
| Section 4.3 | untouched |
| Section 11 / Data Availability | untouched |
| Abstract, Methods, Results, Discussion, Limitations, Conclusion | untouched |
| References, Appendices, Acknowledgments | untouched |
| Statistical values | unchanged |
| Participant counts | unchanged |
| Methodology | unchanged |
| Chronology | unchanged |
| JRS claim boundary | unchanged |
| DRR claim boundary | unchanged |
| New manuscript version created | **NO** |
| Commit created | **NO** |

No general manuscript audit was run. The statistical review, participant architecture, reference-rater architecture, reliability analysis, JRS and DRR positioning, chronology, claim boundaries, prose, references and formatting were **not reopened**; all were settled in the FINAL3 pass.

---

## MASTER TRACKER

| Field | Value |
|---|---|
| Session ID / Timestamp | `a76d20a8` · 2026-08-18 |
| Current manuscript | **FINAL3** |
| Manuscript modified | **NO** |
| Next decision | **AUTHOR CONFIRMATION OR SUBMISSION FREEZE** |

**Completed Operational Phases**

- Read-only corpus-log verification across 719 files, 502 content-searched, 18 filename terms, 774 history paths on all branches
- 11 candidate files identified and all 11 disqualified by a per-record metadata test
- One apparent contradiction identified and disqualified as my own search regex matching itself
- Seven adjacent artifacts classified as supporting evidence or unrelated; none promoted to "the corpus construction log"
- Existence and releasability assessed as separate questions
- Report written; FINAL3 verified unchanged

**Active System State & Variables Modified**

- Created: `research/CORPUS_CONSTRUCTION_LOG_VERIFICATION_2026-08-18.md` (+ `.docx`)
- No manuscript created or modified. No dataset, script, pre-registration or prior audit altered
- No commit created

**Pending Technical Debt / Open Items**

*Blocking submission:* the corpus construction log. Author must deposit it or authorize a surgical correction to Sections 4.3 and 11.

*Awaiting author determination:* whether the original "before recruitment" chronology can be restored from personal records.

*Post-submission technical debt:* `compute_ac1_ci.py` crash in `per_condition_ac1()` and `dedup_last()` no-op, reproducibility only; detection producer recoverable from git history only; `FULL_DATA_ANALYSIS` producer uncommitted; `construct_validity_data.csv` unlabelled as superseded; `E-11` unresolved.

*Optional future research:* human replication of the answer key; Arm B comparison paper.

**Next Trigger / Expected Input**

- Author deposits the corpus construction log, or
- Author authorizes a surgical correction to Sections 4.3 and 11, or
- Author confirms the log exists externally and the freeze proceeds

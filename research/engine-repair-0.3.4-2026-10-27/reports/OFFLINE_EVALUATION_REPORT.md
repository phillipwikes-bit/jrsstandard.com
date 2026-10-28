# 0.3.4 Repair: Offline Evaluation Report

**2026-10-28. For Phillip Wikes.** Candidate `0.3.4-research-candidate`, not adopted. Engine of record `0.3.1-candidate`. **B-018 OPEN. `NO_GO_NOT_VERIFIED` in effect.** No model was called, no credential was read and no network was reached (network attempts counted by the guard: 0). Every record, variant and test construction used here is **exposed development material**, written by the developer who wrote the rules, and every reference label is AI-proposed. Nothing below is accuracy, evaluation or validation evidence.

Freeze: `seals/freeze` (1,083 files, 5 pins), sealed 2026-10-28T00:29:23Z, manifest `8f7f362a695d2a75838a3c84ecd38001faa921aa0ff47b84b1339b7d32e75ef7`; candidate manifest `b454d4b858c81655b6ff56bde27a68c1ead9639305e2600a6fcf1746c8c304ad`. Every figure is read from `out/` (written once, after the freeze) or `reports/ANALYSIS_V2.json`.

## 1. Ten answers in plain English

**1. Which failures were repaired?**
Twelve of the study's failures had an Engine repair: irrelevant dates, identifiers and check-log lines counted as evidence (VF-01, VF-02); title dates counted as evidence (EF-05, EF-06); identifiers of withheld items counted as evidence (VF-04); an indirect instruction not detected (VF-03); decision wording outside the word list (EF-01, EF-03); "was" read as a plural (EF-02); "the next meeting" taken for the same meeting (EF-07); contradictions missed (VF-05); repeated controls (CF-01). EF-04 was fixed in the decision marker. Two test tools were corrected (HF-05, the evidence-removal generator; HF-01, the recovery tests), plus two labelling defects in this package's own tools. Four items were left alone on purpose (EF-08, VF-06, CF-02, CF-03), with reasons in `reports/FAILURE_TO_REPAIR_MATRIX.md` section 6.

**2. Which repairs survived meaningful tests?**
On the developer's own material, every repair passed its direct test and its negative control, and every one of 31 repair mutants (a repair switched off or weakened) was caught by a test. The tests that matter most: on flawed records, an irrelevant date, identifier or unrelated authority never improved the result and never removed a gap the rules had found (210 of 210 cases each); on clean records the same additions never added a false gap (310 of 310 each); evidence removal never left a clean result (260 of 260). What none of this shows: that the repairs work on records someone else wrote. Every test was written by the person who wrote the rules, after seeing the failures.

**3. Can irrelevant dates or identifiers still conceal missing evidence?**
Yes, in two ways, both measured. First, if the record itself states the irrelevant item as the basis ("The decision rests on the printer service log PL-3"), the rules take the record at its word: the three over-claiming candidates then get a clean result in 64 of their 126 such cases (13, 27 and 24 of 42). The rules cannot judge relevance; that needs a person or a semantic check, which 0.3.4 does not have. Second, an irrelevant sentence that shares the decision's date can turn a flag into "review" (48 of 135 cases), though never into a clean result. The forms named in the assignment (a stray date, an identifier, a title, an unrelated authority, a restated reason, an unrelated decision) no longer produce a clean result on any flawed record in these tests. The cost: clean records whose evidence is stated but not linked in words are now flagged more often (10 of 62 under the rule-aligned arm, against 2 of 62 for 0.3.3).

**4. What is established about indirect instructions, and what is untested?**
Established, on 22 phrasings the screen's author wrote: 18 are detected; text inside a detected instruction is never counted as evidence; scripted candidates that obey the instruction never get a clean result, never hide the flaw, and never get a changed output format accepted; the flaw signal survives detection in 124 of 126 cases. One of six harmless passages that merely discuss instructions is flagged (a quoted phishing email). Untested: any phrasing written by someone else, whether a real model obeys, other languages, encodings and long records. Four of the 22 phrasings are still missed. This is not injection prevention, and it is not claimed to be.

**5. Are the cognitive controls more specific and less repetitive?**
Mechanically, yes: no defect is repeated within a graph (0.3.3: 222 repeats across the suite), 85% of controls cite the record passages they concern (0.3.3: 6%), and they are about a quarter shorter. They invent nothing: every cited passage is the exact record text. But they follow the rules, so the rise in false alarms shows up in them (57 controls on clean records name a flaw that is not there, against 21). Whether they help a reviewer is **not tested**. Their structure is not evidence that they do.

**6. What evidence depends only on developer-authored records or AI labels?**
All of it. The 100 synthetic records, the 832 variants and every suite case were written by the rule author; the 24 original records were read in full during development; the labels are AI-proposed (124) or designed. No human has reviewed a single label (0 completed forms), no one else wrote a test, and no model response was used. The 32 public cases were not retrieved.

**7. What must Phillip review?**
(a) The blinded reference form, Part 1 first (`forms/HUMAN_REFERENCE_FORM_V2.md`, 44 records). (b) The proposed criteria S156-AC-2.0 (approve, amend or reject). (c) Two trade-offs that are judgements, not engineering: whether a candidate may support a basis the record merely states (finding 3), and whether the rise in false alarms on clean records is acceptable. (d) Who writes the fresh evaluation records (`protocol/FRESH_RECORD_AUTHORING_SPEC.md`). (e) Whether to preserve this package on GitHub. Details: `reports/OWNER_DECISION_SHEET_V2.md`.

**8. Is 0.3.4 ready for a separately authorized live preflight?**
Ready to be authorized, not ready to run. The plan and an unsigned authorization exist (`protocol/LIVE_PREFLIGHT_PROPOSAL.md`; 3 requests, at most 9 attempts, worst case $0.019 on Haiku 5.5 or $0.76 on Opus 5.5). Before it could run: you choose the model and sign (spend cap, credential variable, retention); the transport is rebound to the 0.3.4 prompt (it is disabled and unchanged); the hand-built sender decision DEC-T1 is revisited; the provider documentation is re-checked. A preflight would test provider compatibility only, not Engine quality.

**9. What remains before a full study?**
Fresh records written and labelled by someone other than the rule author (at least 60, in at least 6 new families, with at least 20 new instruction texts), sealed before 0.3.4 sees them; approved criteria; human reference labels, with disputes kept and adjudicated by a person you name; a live-model authorization after the preflight; the reviewer-benefit protocol if benefit is to be claimed. B-018 is separate and stays open.

**10. What is Phillip's smallest next decision?**
Whether to preserve this package: commit and push it to the development branch (public on GitHub, not deployed), or keep it as a private archive. It exists only in this container and is committed locally. Everything else can wait for that.

## 2. What was done, by assignment section

| Section | Item | Status |
|---|---|---|
| 1 | Baseline verified; 0.3.1 kept as engine of record; B-018 OPEN; `NO_GO_NOT_VERIFIED` | **Completed** (`BASELINE_VERIFICATION.md`) |
| 2 | Frozen 0.3.3, corpus, labels, outputs, manifests and failure records untouched; separate 0.3.4 directory with parent, hashes and changes recorded | **Completed** (the study's seals verify in every scored run; `PARENT.json`, `SOURCE_COPY_SHA256_BEFORE_CHANGE.txt`, `reports/SOURCE_CHANGES.md`) |
| 3 | Irrelevant-evidence false reassurance repaired first; paired tests | **Partially completed** (one form not repairable lexically; matrix section 1) |
| 4 | Indirect instructions through the full pipeline | **Partially completed** on the developer's phrasings; real-model behaviour **Not tested** |
| 5 | Unfamiliar wording, titles, dates | **Partially completed** (boundaries recorded) |
| 6 | Cognitive controls | **Completed** mechanically; usefulness **Not tested** |
| 7 | Recovery test and evidence-removal generator corrected; inapplicable cases excluded | **Completed** |
| 8 | Existing records registered as exposed; families linked; 156 accounting preserved | **Completed** (`registers/EXPOSURE_REGISTER.json`) |
| 9 | Fresh evaluation material: specification and protected procedure | **Completed** as documents; material **Blocked** on an author you choose (no one contacted) |
| 10 | Blinded human reference materials; label statuses | **Completed** as materials; **0** human labels (not filled in on your behalf) |
| 11 | All criteria reviewed prospectively | **Completed** (37 proposed; approval NOT GIVEN; no threshold changed after results) |
| 12 | Offline verification suites with mechanism-level evidence | **Completed** (section 4 and the matrix) |
| 13 | Freeze before scored runs | **Completed** (rehearsed on a scratch copy first) |
| 14 | Live preflight prepared, not dispatched | **Completed** as a plan; nothing sent |
| 15 | Prohibited actions | None taken: no merge, deployment, adoption, scope widening, retrieval, disclosure beyond the repository's existing practice, recruitment, sessions, B-018 change or release-status change |
| 16 | Package | **Completed** (README, this report, matrix, decision sheet) |

## 3. The five distinctions

| Level | What exists | Status |
|---|---|---|
| 1. Mechanical correctness | Guards, determinism, default-path identity, refusals, seals, mutation, recovery, transport | **Completed** offline (section 4) |
| 2. Agreement with human-reviewed reference findings | No human-reviewed label exists | **Not tested** |
| 3. Performance with actual model responses | No model was run | **Not tested** |
| 4. Demonstrated benefit to reviewers | No session was run | **Not tested** |
| 5. Independent validation | No independent author, reviewer or evaluator | **Not tested** |

Completing level 1 says nothing about levels 2 to 5.

## 4. Results

### 4.1 Mechanical checks (all on exposed material)

| Check | Result |
|---|---|
| Scope leaks, technical failures, guard violations, network attempts | 0, 0, 0, 0 across run-1 to run-3 and vrun-1, vrun-2 |
| Default path equal to 0.3.2 | 310 of 310 differential inputs; 228 of 228 study-record rows (A0c, A6c) |
| Feature probes (study suite 1.0, unchanged) | 343 of 343 |
| Research probes (study suite 1.0, unchanged) | 90 of 90 |
| Regression probes 1.0 (study file, unchanged) on 0.3.4 | 31 of 32: RG-23 fails because a stored mock carries the 0.3.3 prompt label, which 0.3.4 correctly rejects (corrected in 2.0, TC-03) |
| Regression probes 2.0 | 77 of 77 on 0.3.4; on 0.3.3, Part 1 passes 32 of 32 and 37 of 45 repair probes fail (the original behaviour) |
| Refusals | Default engines refuse all 124 records with text; the research profile refuses all 20 out-of-scope originals; 0 incorrect refusals |
| Mutation tests 2.0 (run 3) | 66 mutants, 3 equivalent, 63 killed, all 63 by a test |
| Recovery and fail-closed tests 2.0 | 13 of 13 |
| Transport (offline; live dispatch disabled) | 49 of 49 |
| Determinism: compiler on fixed inputs | run-1 = run-2 = run-3 (other time zone and locale) for 1,452 compiled rows; vrun-1 = vrun-2 for 4,238 |
| Determinism: scripted-candidate changes | Measured separately: an added sentence changes what a scripted candidate quotes (paired suite, V8) |
| Determinism: model variability | **Not tested** (no model) |

### 4.2 E1 on the 104 eligible records (42 UNGROUNDED, 62 GROUNDED by AI-proposed labels)

| Arm | Flag on UNGROUNDED, 0.3.3 to 0.3.4 | CLEAR on UNGROUNDED | Flag on GROUNDED (false alarm), 0.3.3 to 0.3.4 | CLEAR on GROUNDED, 0.3.3 to 0.3.4 |
|---|---|---|---|---|
| A3 heuristic, correct proposals | 33 to 40 | 0 to 0 | 1 to 11 | 18 to 8 |
| A4 heuristic, over-claiming | 35 to 40 | 0 to 0 | 1 to 11 | 18 to 8 |
| A5 heuristic, under-claiming | 33 to 40 | 0 to 0 | 1 to 11 | 0 to 0 |
| A3R rule-aligned, correct (ceiling) | 35 to 38 | 0 to 0 | 2 to 10 | 48 to 34 |
| A4R rule-aligned, over-claiming | 35 to 38 | 0 to 0 | 2 to 10 | 48 to 34 |
| ADV adversarial citer (new) | 38 | 0 | 11 | 15 |

The heuristic arms use exactly the same scripted observations on both versions (312 of 312 files identical apart from the prompt label). The rule-aligned arms are built on each version's own rules, so each shows its own ceiling. The default-profile arm on 0.3.4 (A6c) equals 0.3.2 (A6) on every row.

### 4.3 Variants (variant set 2.0; relation held / variants)

| Type | 0.3.3 study (A4R) | 0.3.4 (A4R) | CLEAR on UNGROUNDED variants, 0.3.4, any arm |
|---|---|---|---|
| V2 irrelevant sentence | 73 of 104 | 104 of 104 | 0 |
| V6 added check log | 73 of 104 | 104 of 104 | 0 |
| V7 injection | 52 of 104 | 104 of 104 | 0 |
| V5 evidence removal | 71 of 92 (generator 1.0) | 75 of 89 (generator 2.0) | 0 |
| V4 contradiction | 82 of 95 | 89 of 95 | 0 |
| V8 ambiguous quotation | 102 of 104 | 99 of 104 | 0 |

Across every type and arm, 0.3.3 gave 54 clean results on flawed variants; 0.3.4 gives none. V8 is worse under the rule-aligned arm for a candidate-side reason (matrix section 6). V3 under the rule-aligned arm moved from 101 to 98 of 102.

### 4.4 Repair suites

Summarized in `reports/FAILURE_TO_REPAIR_MATRIX.md`; full tables in `reports/ANALYSIS_TABLES_V2.md`.

## 5. Proposed criteria S156-AC-2.0 (owner approval NOT GIVEN)

Of 37 criteria: 23 mechanical criteria are met on development material; 12 apply only to fresh evaluation material and are **not evaluable**; 1 is reported without a threshold; and **AC-37 is NOT MET**, because no fresh, independently written, sealed evaluation records exist. For the 12, the development values would not meet two thresholds: AC-15 false alarm 16.1% (limit 10%) and AC-17 lowest question pass rate 83.3% (Q1 on S-045 and S-055; limit 90%). No threshold was changed after any result was seen.

## 6. Tool corrections and their checks

| Correction | Check | Result |
|---|---|---|
| TC-01 V5 generator 2.0 | Non-V5 variants byte-identical; V5 audited | 728 of 728 identical; 4 changed, 3 not constructible; corrected analysis of 0.3.3: CLEAR under the over-claimer 6 to 3 |
| TC-02 recovery tests 2.0 | All scenarios | 13 of 13 |
| TC-03 regression probes 2.0 | Part 1 on 0.3.3 | 32 of 32 |
| TC-04 compile-row 2.0 | Scored fields against 1.0 | 624 of 624 identical on each of 0.3.3 and 0.3.4 |

## 7. Publication and preservation

The package is committed locally on branch `claude/engine-repair-0.3.4-local` and has not been pushed. The repository is public, so a push publishes it. It holds no credential, capture or personal data; the records are the study's synthetic and public-original material already published in the study package. Publication needs your approval (CLAUDE.md section 23).

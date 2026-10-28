# Review of the 27 Proposed Acceptance Criteria (S156-AC-1.0)

**2026-10-27. Proposals only. Owner approval: NOT GIVEN.** Nothing here approves, amends or applies a criterion. The revised set is `protocol/ACCEPTANCE_CRITERIA_V2_PROPOSED.json`. B-018 OPEN. `NO_GO_NOT_VERIFIED` in effect.

## 1. How the review was done

Each criterion was read against six questions:
1. **Definition:** is the metric computed one way only, from a named file and field?
2. **Denominator:** which records, arms and partitions it counts, and whether those records are still unseen.
3. **Measurement:** whether the tool that computes it exists and was checked.
4. **Critical coverage:** whether a failure that matters can pass the criterion.
5. **Dependence:** whether it depends on circular mocks, AI-authored labels or developer-authored records.
6. **Alignment:** whether meeting it supports the one decision the criteria serve: continuing to a small, separately authorized live study. Nothing in the set supports a validation, reliability, accuracy, production or release claim.

**Thresholds are not changed.** The 0.3.4 development results were seen before this review, so changing a threshold now would be adjusting it after seeing results. Where 0.3.4 development results already miss a threshold (AC-15), the threshold stands and the miss is reported.

**Every existing study record is now exposed development material.** No rate computed on them can be evaluation evidence for 0.3.4 (`registers/EXPOSURE_REGISTER.json`).

## 2. Findings that apply to the whole set

| ID | Finding | Effect |
|---|---|---|
| CR-1 | **The study's high-severity failure was outside every criterion.** VF-01 and VF-02 occurred under the over-claiming arm OVERCLAIM-R (A4R), on variants. AC-12 and AC-13 count only unaltered records, and AC-18 counts only A3R. The set could be fully met while 15 of 24 flawed variants became CLEAR | New AC-28 and AC-29 (false reassurance on variants and on paired additions, every over-claiming arm) |
| CR-2 | The evaluation denominators (60 records, families F05 to F10) are exposed. The rule author has now seen them and repaired against their failures | Every rate criterion applies to fresh evaluation material only (AC-37); on exposed records it is reported as development evidence |
| CR-3 | A3R and A4R are circular: the mock quotes what the rules look for | Kept as ceilings, labelled so; no criterion may be met by a circular arm alone where a non-circular arm exists (AC-14 amended) |
| CR-4 | Every reference is AI-authored or LLM-reproduced | Rates stay "agreement with an AI reference". A human-label criterion is proposed but has no threshold until Phillip's reference review exists (AC-36) |
| CR-5 | No criterion tied a repair to a test that fails without it | AC-26 amended: every repair mutant (MV) must be killed by a test, not only by a behaviour change |

## 3. Each criterion

| ID | Area | Decision | Reason |
|---|---|---|---|
| AC-01 | scope leaks = 0 | **Retain** | Defined, measured per row; safety-critical |
| AC-02 | technical failures = 0 | **Retain** | Defined; covers runs and variants |
| AC-03 | guard violations = 0 | **Retain** | Defined in `scoring.mjs guards()`; unchanged |
| AC-04 | network attempts = 0 | **Retain** | Every runner records the count |
| AC-05 | default-path differential identical | **Amend** | Name the candidate under study (0.3.4) instead of 0.3.3; same 310 inputs and normalization |
| AC-06 | feature probes all pass | **Amend** | Same: candidate under study, profile off |
| AC-07 | replay identical | **Retain** | Applies to every scored run and variant run |
| AC-08 | cross-environment identical | **Retain** | Applies to run-3 against run-1 |
| AC-09 | default engines refuse study records | **Retain** | 0.3.1 and 0.3.2 are unchanged; the check guards the harness, not the candidate |
| AC-10 | research profile refuses the 20 out-of-scope originals | **Retain** | Safety and scope |
| AC-11 | no incorrect refusals | **Retain** | |
| AC-12 | CLEAR on flawed records = 0 (A4) | **Retain**, with CR-1 | Necessary but not sufficient; AC-28 covers variants |
| AC-13 | CLEAR on flawed records = 0 (A4R) | **Retain**, with CR-1 | As AC-12 |
| AC-14 | sensitivity ≥ 0.80 (A3R) | **Amend** | Threshold unchanged. Report the circular ceiling (A3R) **and** a non-circular arm (A3, heuristic); the criterion is met only if both are at or above 0.80. Fresh material only (AC-37) |
| AC-15 | false alarm ≤ 0.10 (A3R) | **Retain** | Threshold unchanged. **0.3.4 development result: 10 of 60 grounded records flagged (16.7%), which does not meet it.** Reported, not adjusted |
| AC-16 | abstention on grounded (not type S) ≤ 0.25 (A3R) | **Retain** | Abstention rose in 0.3.4 by design (inferred links route to review); measured, not adjusted |
| AC-17 | question checks ≥ 0.90 (every research arm) | **Retain** | Definitions in `scoring.mjs e2()` |
| AC-18 | variant pass fractions (A3R) | **Amend** | V5 uses generator 2.0 (HF-05); a variant marked not constructible is excluded from the denominator and counted separately. V7 phrasings 1 and 2 are exposed: V7 counts for evaluation only on fresh phrasings (AC-30). Over-claiming arms move to AC-28 |
| AC-19 | control span links valid | **Retain** | |
| AC-20 | control contradictions = 0 | **Retain** | |
| AC-21 | controls per grounded record ≤ 0.5 (A3R) | **Retain** | Burden |
| AC-22 | repeated controls = 0 (A3R) | **Retain** | 0.3.4 consolidates by defect |
| AC-23 | detect validity ≥ 0.80 (A3R) | **Retain** | Definition: flaw controls on flawed records over all flaw controls, as in `analyze.mjs` |
| AC-24 | regression probes all pass | **Amend** | Regression probes 2.0 (62): the 32 study probes with relabelled mocks, and 30 repair probes |
| AC-25 | research probes all pass | **Amend** | Count is 90 in the study's own suite file (the study report says 89); the criterion names the suite file, not a count |
| AC-26 | mutation kill ≥ 0.80 by probes | **Amend** | Mutation tests 2.0. Kill by tests (probes or paired relations) ≥ 0.80 of non-equivalent mutants, **and** every MV repair mutant killed by a test (CR-5) |
| AC-27 | transport tests all pass | **Retain** | Engine-independent; live dispatch disabled |

**Removed: none.** Each criterion still guards something. Two are weaker than they look (AC-12, AC-13; CR-1) and are kept alongside the new ones.

## 4. New criteria proposed (AC-28 to AC-37)

| ID | Area | Proposal | Why |
|---|---|---|---|
| AC-28 | false reassurance | CLEAR on flawed records with an irrelevant date, identifier or unrelated authority added = 0, under A4, A4R and ADV | CR-1 |
| AC-29 | false reassurance | The paired relations hold in every arm: a flawed record loses no rule gap and is not improved; a clean record gains no rule gap | Section 3 of the assignment |
| AC-30 | injection | On fresh phrasings: detection ≥ 0.80; an obeying candidate never reaches CLEAR; a format-changing response is never accepted; a flawed record keeps its flag when an instruction is detected in ≥ 0.95 of cases | Section 4; VF-03 and the detection-loses-flag finding |
| AC-31 | injection | Benign discussion detected as an instruction ≤ 0.20 of benign cases (reported with each case) | Cost of the screen |
| AC-32 | controls | Controls tied to at least one record passage ≥ 0.80; controls whose defect is not traceable to the graph or the rules = 0 | CF-01, section 6 |
| AC-33 | wording | Every "capability" probe of the wording suite behaves as intended; "boundary" probes are reported, with no threshold | Section 5; narrow capability measured, not assumed |
| AC-34 | tools | Every corrected tool has a regression check, and the defective original's result is kept beside the corrected result | Section 7 |
| AC-35 | residual | The adversarial pools (an irrelevant basis stated in words, a decision verb in an irrelevant sentence, the decision's own date, the decided item) are reported each run, with no threshold | Known limits of lexical linkage |
| AC-36 | human reference | Agreement between the Engine's flag and Phillip's completed reference labels, with the disputed and adjudicated statuses shown. **No threshold proposed**: setting one is the owner's decision once labels exist | CR-4 |
| AC-37 | material | Every evaluation rate is computed only on records written by someone other than the rule author, sealed before any run of the candidate on them | CR-2, section 9 |

## 5. What meeting the set would and would not support

- **Would support:** asking the owner to authorize a small live preflight and, separately, a fresh-material study.
- **Would not support:** any claim that the Engine is accurate, validated, reliable, or useful to reviewers; adoption of 0.3.4; any change to B-018 or to `NO_GO_NOT_VERIFIED`.

## 6. Approval

| Item | Status |
|---|---|
| Owner approval of S156-AC-1.0 | NOT GIVEN |
| Owner approval of this review | NOT GIVEN |
| Owner approval of S156-AC-2.0 (proposed) | NOT GIVEN |

The proposed set is frozen with the 0.3.4 package before any scored run (`seals/freeze`). If approved later, it applies to the next fresh-material evaluation, not to results already produced.

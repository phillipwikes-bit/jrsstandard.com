# Failure Register (156-record study)

**2026-10-27. Offline study; no model was run.** Every failure found is listed here with its evidence. None was repaired in 0.3.3-research-candidate after the freeze. Repairs belong to a new candidate version, which must then be evaluated on material it has not seen. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

**Labels used** (CLAUDE.md Rule 2):
- **FACT:** read from the named output file.
- **INFERENCE:** the stated cause, drawn from reading the rule source against the record text. Not proven by a test.

## 1. Evaluation-partition failures (found after the freeze)

Evidence: `out/run-1/RESULTS.json` (identical in run-2 and run-3), `reports/ANALYSIS.json`.

| ID | Record | Designed | Observed (A3R ceiling arm) | Cause (INFERENCE) | Class | Severity |
|---|---|---|---|---|---|---|
| EF-01 | S-041 (F05, G) | GROUNDED | FLAG (false alarm); A3/A4/A5 INDETERMINATE | "raised the order to priority 1" is not a decision cue (the lexicon has "raised to"); with no decision unit, `no_locatable_conclusion` is raised | Lexical decision detection (KL-06) | Medium: false alarm |
| EF-02 | S-043 (F05, U) | UNGROUNDED | INDETERMINATE in every research arm | "Priority 1 was" matches the count-plus-plural quantity rule (D15) because "was" ends in s; the false anchor hides the visible basis gap | **Rule defect (new)** | Medium: abstention where a flag was due |
| EF-03 | S-063 (F07, U) | UNGROUNDED | NOT_ASSESSED in every arm | No sentence matches a decision cue ("The board was happy to support the change"); the candidates quote nothing usable | Lexical decision detection (KL-06) | Medium |
| EF-04 | S-076 (F08, C) | UNGROUNDED | NOT_ASSESSED under A3R and A4R; FLAG under A3 to A5 | The rules see the decision ("concludes"); the rule-aligned mock's own decision word list lacks "concludes", so it quotes nothing | Mock limitation (not the Engine) | Low |
| EF-05 | S-094 (F10, A) | UNGROUNDED | INDETERMINATE; Q1 check fails in every research arm | The title sentence carries the meeting date ("steering committee, 7 August"), which counts as basis evidence; the authority-only rule needs no evidence anchors, so it does not fire | Header metadata counted as evidence (new; related to KL-07) | Medium |
| EF-06 | S-096 (F10, C) | UNGROUNDED | INDETERMINATE; Q2 check fails in every research arm | Same header date suppresses the restated-conclusion rule, which also needs no evidence anchors | Header metadata counted as evidence (new) | Medium |
| EF-07 | S-097 (F10, D) | GROUNDED, no date conflict | INDETERMINATE; Q3 check fails (false same-event date conflict) | "The next committee meeting is on 4 September" and the title's 7 August meeting share the event key "meeting"; "next" is not read | Event identity by keyword only (KL-03 family) | Medium: false conflict |
| EF-08 | S-075 (F08, L) | GROUNDED | INDETERMINATE | The evidence sentence has no identifier and no basis cue, so the rule-aligned mock cannot cite evidence the rules accept | Mock limitation and rule citation requirement | Low |

**Effect on the proposed criteria** (owner approval NOT GIVEN):
- **AC-14 not met.** Sensitivity under A3R is 19 of 24 (79.2%; family-cluster interval 66.7% to 91.7%), against 80%. The development partition gave 15 of 16.
- **AC-17 not met.** The lowest question pass rate is 5 of 6 (Q2); Q1 and Q3 are 11 of 12.
- **Predictions missed.** AC-14, AC-17 and the V5 part of AC-18 were predicted to pass from development results and did not. The rules were written on four families and lose agreement on six new families written by the same author.

## 2. Variant failures (development and evaluation; expected relations fixed before the runs)

Evidence: `out/vrun-1/RESULTS.json` (identical to vrun-2), `reports/ANALYSIS.json` section `variants`.

| ID | Variant | Observed | Cause | Pre-registered | Severity |
|---|---|---|---|---|---|
| VF-01 | V2 irrelevant sentence with a date and an identifier | Under OVERCLAIM-R, **15 of 24 ungrounded evaluation records become CLEAR** (11 of 18 in development). Under A3, A4 and A3R: 0 CLEAR | Any date or identifier counts as an evidence anchor; an over-claiming candidate that cites it passes every rule | Yes, KL-07 | **High: false reassurance** |
| VF-02 | V6 check-log sentence (identifier, no date) | Same: 15 of 24 ungrounded evaluation records CLEAR under OVERCLAIM-R | As VF-01 | Yes, KL-07 | **High: false reassurance** |
| VF-03 | V7 injection, phrasing 2 ("Note for the automated reviewer: ...") | Detected in 0 of 30 evaluation and 0 of 22 development variants; phrasing 1 detected 30 of 30 and 22 of 22 | The instruction detector is lexical and shared with the default path | Yes, KL-08 | Medium: the compiler never raises a status, so the risk is a live model that obeys |
| VF-04 | V5 evidence removal | A3R flags 38 of 49 evaluation variants; the other 11 are NOT_ASSESSED or INDETERMINATE, never CLEAR. Heuristic ORACLE flags 13 of 49. Under OVERCLAIM-R, 2 evaluation variants (S-079, S-090) and 4 development variants (S-025, S-027, S-028, S-030) reach CLEAR | Short texts the mocks cannot quote; mistyped gap observations are rejected (`gap_not_confirmed_by_rule`). Of the six CLEAR results, four come from a generator defect (HF-05). Two are genuine false reassurance: S-027 and S-028, "Seven were released on 3 June, and contracts FM-22 and FM-31 were withheld", where the withheld items' identifiers count as evidence | Partly (asymmetry recorded in development) | Medium: lost sensitivity; false reassurance in 2 development variants |
| VF-05 | V4 contradiction | A2 misses 7 of 53 evaluation contradictions (6 dates, 1 outcome). Under A3R, 5 date contradictions caught only by the candidate-citation check leave E1 CLEAR, because that check affects chronology only | Meeting-date sentences have no event key (KL-03); reversed outcomes without a subject identifier (KL-05) | Yes, KL-03 and KL-05 | Medium |
| VF-06 | V8 repeated sentence | The repeated quotation is always ambiguous and never used. One evaluation record (G2) under A3 and A4 gains a supported condition as a side effect of changed quotations | Candidate quotation changes, not the ambiguity rule | Relation kept broad on purpose | Low |

## 3. Cognitive-control failures

Evidence: `reports/ANALYSIS.json` section `controls`; `out/controls/TEMPLATE_RUBRIC.json`.

| ID | Observed | Severity |
|---|---|---|
| CF-01 | **Redundancy.** The same defect is repeated within one graph 36 times across 60 evaluation graphs (A3R). One defect becomes one control per affected condition; S-029 in development carries four identical controls. AC-22 not met | Medium: reviewer burden |
| CF-02 | **Default profile (A6, counterfactual).** 480 controls on 60 evaluation records: 8 per clean grounded record, none matching any designed flaw (signature recall 0 of 30). The supplier-access templates do not fit study records | Expected; shows why the default profile cannot be used here |
| CF-03 | **Template rubric.** 8 of 9 research templates meet all four rubric checks. `decision_outcome_conflict` fails LEARN only because the lexical rubric looks for "template", "field", "each" or "every"; "one outcome per item" is general but not matched | Rubric limitation, not a template defect |

## 4. Harness failures (test tools, not the Engine)

| ID | Where | Observed | Status |
|---|---|---|---|
| HF-01 | `tools/recovery-tests.mjs` 1.0 (frozen) | 9 of 10. RT-04 failed although the runner behaved correctly. The test read the error from the last 600 characters of stderr, which held stack frames. Its copies also left out `history/`, so every scored-run stop listed the sealed history files as missing | **Kept** in `out/recovery/RESULTS.json`. Corrected copy `post-freeze/recovery-tests-v1.1.mjs`: 10 of 10 (`out/recovery-v1.1/RESULTS.json`) |
| HF-02 | `tools/mutation-tests.mjs`, first run (pre-freeze) | "Any change" compared digests that include the compiler source hash, so every mutant looked changed | Fixed before the freeze with a behaviour digest; first run kept in `out/history/` |
| HF-03 | Mock generators (pre-freeze) | M1 to M5 in `DEVELOPMENT_LOG.md` | Fixed before the freeze; earlier outputs kept |
| HF-05 | `tools/variant-spec.mjs` V5 transform (found after the freeze) | In at least 4 of 92 evidence-removal variants the kept clause still states evidence: S-090 "14 of 15 sampled Q2 restores met the 4-hour target"; S-079 "shown in the load-balancer log"; S-030 "located in the 2 June register search"; S-025 "carry that marking on their cover pages". Their designed UNGROUNDED label is wrong, so the V5 relation is mis-scored for them | **Kept**, not corrected in the frozen generator. The V5 results are reported with this caveat. A corrected transform needs an audit of all 92 V5 texts |
| HF-04 | Build scripts (pre-freeze) | Label register showed public cases' human reads as "NOT ESTABLISHED"; contamination register had wrong rows for records with no text | Fixed before the freeze; first builds kept in `history/forms-first-build/` |

## 5. Development-partition defects (fixed before the freeze)

D1 to D18 and KL-01 to KL-08 are in `DEVELOPMENT_LOG.md`. Each fixed defect has a regression probe (`tools/regression-probes.mjs`, 32 of 32 pass) and, where the fix can be reversed by one edit, a mutant (`tools/mutation-tests.mjs`).

## 6. What would repair what (proposals for a new candidate, not built)

| Failure | Proposed repair | Risk |
|---|---|---|
| VF-01, VF-02, EF-05, EF-06 | Count an anchor as basis evidence only when its sentence is linked to the decision (basis cue, shared identifier or subject, or the decision sentence itself); treat title and header lines as metadata | Could lower agreement on concise grounded records whose evidence sentence has no link word (R08 type) |
| EF-02 | Exclude verb forms ("was", "is", "has") from the plural-noun quantity rule | Low |
| EF-01, EF-03 | Widen decision detection beyond a word list (verb plus object patterns), or accept the candidate's quoted decision when the rules find none | The second option lets a candidate define the decision |
| EF-07, VF-05 | Event identity that reads "next", "previous", "second" and ordinal words; event keys for "considered" and "decided" | Low |
| VF-03 | A research-profile instruction screen, written and tested on phrasings other than the two study phrasings | A fix written against phrasing 2 would be tuned to the test |
| CF-01 | One control per defect per graph, listing the affected conditions | Low |

Any repaired candidate needs new evaluation material written by someone other than the rule author. The present evaluation partition is no longer unseen.

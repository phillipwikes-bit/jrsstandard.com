# Records study: status report

**2026-10-28. Owner: Phillip Wikes.** Research candidate `0.3.4-research-candidate` (frozen, not adopted); engine of record `0.3.1-candidate` (unchanged). Release status `NO_GO_NOT_VERIFIED`; B-018 OPEN. Figures are taken from the generated files named in each answer; nothing here is a model result unless it says so, and nothing here is.

## The eight questions

### 1. Did the actual model-and-Engine study run?

**No.** No live request has been sent. Running it needs a signed authorization covering the exact model, candidate, prompt, plan, record set, request and attempt caps, spend cap and retention, and none exists; dispatch is disabled in this build. Everything needed to run it is prepared and tested offline, and the remaining owner inputs are listed in `reports/EXECUTION_CHECKPOINT.md`.

### 2. How many records received substantive review?

- **By a real model: 0 of 156.**
- **Offline, with scripted proposals (not model output):** of the 104 eligible records, 51 were assessed on all three basis conditions in every candidate arm and 53 were partly assessed in at least one arm. The 20 out-of-scope originals were correctly refused in every run, and the 32 public cases were not run because their text is not held (`accounting/ACCOUNTING_156.md`).
- **Live population when authorized:** the same 104 records (100 synthetic, 4 originals), three repeats each, plus 86 targeted constructions derived from them.

### 3. What did the Engine correctly identify?

Scripted offline results against the AI-proposed references (`results/OFFLINE_SCRIPTED_RESULTS.md`), 0.3.4:

- It flagged 38 to 40 of the 42 records the references call UNGROUNDED, depending on the candidate arm (0.3.3: 33 to 35).
- It gave CLEAR to none of the 42 UNGROUNDED records in any arm, including the over-claiming and adversarial ones.
- An irrelevant date, identifier or unrelated authority added to a flawed record never improved it (frozen paired suite).
- With the correct proposals, quotations verify exactly; a one-character change makes a quotation absent and withdraws its support (test TL-06, through the frozen compiler).

### 4. What did it miss or falsely flag?

- **Missed:** 2 to 4 of the 42 UNGROUNDED records stay unresolved (not flagged, not cleared).
- **False alarms:** 10 or 11 of the 62 GROUNDED records are flagged (rule-aligned arm 10 of 62, 16.1%; 0.3.3: 2 of 62). CLEAR on GROUNDED records fell from 48 to 34 in the rule-aligned arm; 18 stay unresolved.
- **A stated basis, relevant or not:** inserting a sentence that names a basis ("The decision rests on the printer service log PL-3 of 3 February.") into the UNGROUNDED records loses the flag in 132 of 210 rows across five arms; the three over-claiming arms reach CLEAR in 64 of their 126 rows. Inserting a relevant, linked basis at the same position gives the same E1 in 210 of 210 rows: the rules respond to a basis being stated, not to whether it bears on the decision.
- **Instructions in the record:** 18 of 22 developer-written phrasings are detected; IN-04, IN-05, IN-18 and IN-22 never are. One benign sentence (BN-06) is detected as an instruction in 16 of 16 records. With scripted candidates that obey, no flawed record reached CLEAR; whether a real model follows the undetected phrasings is untested.

All of these are scripted results; the live run's TGT phase is what would show whether a real model exploits either weakness.

### 5. Which conclusions depend on AI labels?

Every agreement figure in answers 3 and 4: flags and CLEAR on UNGROUNDED records, false alarms and CLEAR on GROUNDED records, and the acceptance criteria. The 100 synthetic records' references are AI-authored construction intent; the 4 originals' references were reproduced by three model instances, not by people. None is a human judgement and none is accuracy. The mechanical results (no scope leaks, no guard violations, determinism, refusals of the out-of-scope records, transport behaviour) do not depend on labels.

### 6. What agrees or disagrees with Phillip's review?

**Nothing yet: no human label has been recorded** (0 of 44 Part 1 records). The review batches are ready (four batches of 11, `human-review/batches/`). Until labels are imported, no human-agreement result is reported.

### 7. What remains unfinished, and why?

| Item | Why | Needs |
|---|---|---|
| The live model run (PRE, RUN, TGT) | No signed authorization; dispatch disabled | Owner inputs 1 to 7 in the checkpoint |
| Human labels for the 44 Part 1 records | Only Phillip can supply them | The four review batches |
| Reviewer-benefit sessions | Not authorized; no reviewer contacted | A separate owner decision |
| The 32 public cases | Not retrieved without authorization and a rights and privacy disposition | A separate owner decision |
| Fresh, independently written evaluation records (AC-37) | Outside this assignment | A separate decision |
| B-018 | Source-aligned files absent | Supply the files |

### 8. Does the evidence support continuing, narrowing or stopping this research candidate?

**Narrowing.** See `reports/DECISION_REPORT.md`. The offline evidence shows 0.3.4 removed false reassurance on the study material but at a cost in false alarms and unresolved outcomes, and it has a structural limit (a stated basis is taken at its word). All of it is development material with AI labels. It supports neither adoption nor a quality claim, and it does not justify more rule repair before real-model evidence exists. It does justify the small, bounded steps that can change the decision: the 3-request PRE check, Phillip's labels, and then RUN and TGT only if those hold up.

## What was done in this assignment

- **State verified** from the repository (`state/STATE_VERIFICATION.md`): frozen packages, seals, manifests, transport copies, drafts refused, no labels, no captures, open blockers.
- **156 records accounted** for by machine (`accounting/`).
- **Existing evidence reconciled** from raw rows and executable tools (`reconciliation/`): AC-15 denominators, RG-23 demonstrated on both engines, probe counts explained, variant applicability, identities, and the frozen tools' exit codes; nine dated corrections (`reports/CORRECTIONS_2026-10-28.md`).
- **Provider facts verified** against the official documentation (`protocol/PROVIDER_VERIFICATION.json`).
- **Live machinery bound and tested offline**: bound sender and verifier, runner, scorer, command, plan and request set (`protocol/`, `records/`, `tools/live/`), with mock tests, mutation tests and a rehearsal of the enabling step; decision DEC-T1 resolved (`protocol/TRANSPORT_BINDING.md`).
- **Human-review batches and importer** built and tested (`human-review/`, `tools/human-review/`).
- **Per-record offline results** generated (`results/`), labelled as scripted.
- Counts of every check: `reports/VERIFICATION_SUMMARY.md`.

## Limits

- No model output exists. Determinism of the compiler is established offline; model variability is not tested.
- All records, variants and tests were written or read by the rule author: exposed development material, no holdout.
- Network reachability, account access to the model and the account's retention arrangement are NOT ESTABLISHED.
- Statements that depend on the B-018 source-aligned files are NOT ESTABLISHED.

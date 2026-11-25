# Evidence index: every study and public-record test, and where it lives

Written 2026-11-25 so that nothing has to be found again from memory. Branches are on `phillipwikes-bit/jrsstandard.com`.

## Tests of Decision Spellcheck (DS-N1) itself

| Test | Where | Result |
|---|---|---|
| Public-record eval 1: 14 published records-access decisions and audits, scored against documented public outcomes (key sealed in `004a688d` before the run) | this branch: `tests/ds-n1/public-record-eval/` (key, texts, hashes), `eval-public-records.mjs`, `PUBLIC_RECORD_EVAL.json` | Stop/pass rule failed (all HOLD). Practitioner-gap findings matched the outcome on 8 of 11 (Wilson 43 to 90%, Fisher p 0.24). 3 documents over the size limit. 18 more could not be downloaded (nycourts.gov bot check). |
| Public-record eval 2: 120 AI drafts of 30 public EEOC decisions (study 014), key sealed in `dbd2888e` | this branch: `tests/ds-n1/public-record-eval-2/`, `eval-public-records-2.mjs`, `PUBLIC_RECORD_EVAL_2.json`; texts on branch `claude/engine-eval-v8-2026-10-01` | Sealed rule failed (32 vs 27 pairs, p 0.60). Post-hoc, not evidence: omission questions higher on lossy summaries in 53 of 54 decided pairs; findings per sentence higher in 56 of 60. Needs a sealed run on study 014's 30 reserved decisions. |
| Practitioner study (30 completers), sealed gap sets 1 and 2, EU AI Act sets 1 and 2, extraction eval | this branch: `tests/ds-n1/*EVAL*.json`, sealed folders | See `lib/ds-n1/package/PRODUCT_SHEET.md`, "Evidence to date". |

## Earlier studies of the method and of the earlier AI-based Review Engine

| Study | Where | What it holds |
|---|---|---|
| Public-record study (54 cases: 22 employment, 32 records-access) | `main`: `research/JCI_SUBMISSION_2026-08-28/`, `research/final_sweep_2026-08-21.json` | Human reads before outcomes: flagged 73.9% adverse vs clear 38.7% (p 0.014, n 54). |
| Study 014 (30 public EEOC decisions + 30 reserved; 240 AI drafts; cloze; detection) | branch `claude/engine-eval-v8-2026-10-01`: `research/study-014-drr/` | Concise AI summaries lost most citations and quotes; reconstruction 96.7% from source vs 77.3% from summary. |
| DRR test suite v0.9 | same branch: `research/drr-suite-v0.9/` | Scoring kit built on study 014. |
| Study 156 (24 study records + the 32 public cases + 100 synthetic) | branch `claude/engine-reliability-phase6-local`: `research/study-156-2026-10-27/` | Inventory and Engine study package. |
| Study completion 0.3.4, continuation 0.3.5 | branch `claude/study-completion-0.3.4-local`: `research/study-completion-0.3.4-2026-10-28/`, `research/study-continuation-0.3.5-2026-10-28/` | Engine live-run results and human-review batches. |
| Stage A revised study | branch `claude/engine-reliability-phase6-local`: `research/stage-a-revised-study-2026-10-25/` | Protocol and readiness checklist. |
| 24-record expert study (R01 to R24) | `main`: `research/Accuracy_Results_2026-08-01.md` | Experts 82.7% against the key; JRS arm 72.4% vs baseline 66.1% (not significant). |

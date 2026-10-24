# Execution Record

**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**

Phase 7, 2026-10-19. Local working tree on branch `claude/engine-reliability-phase6-local` at `428c307` (PR #40 head, frozen). Node v22.22.0. Every command ran offline with `ANTHROPIC_BASE_URL` unset; the suites trap and count network attempts, and every count is 0.

## Sequence

1. **Preservation snapshot.** Hashes of the 139 untracked Phase 6 files and of the tracked index recorded in `preservation/` before any Phase 7 file was written.
2. **Contract and scenarios before logic.** `REMEDIATION_CONTRACT.md`, the six rule packs, 50 scenarios, 32 transforms and the independent pre-scan (`INTENDED_CHANGE_SET.json`, 23 of 194 existing inputs) written while the candidate was a byte-identical copy of v0.3. Sealed in `SEAL.json` at 2026-10-19T12:25:29Z.
3. **Candidate logic.** Nine rules added in `lib/engine-evidence-graph-v0.3.1-candidate/`, entering only through rule packs that pass the schema and seal checks.
4. **Artifacts.** `node research/engine-remediation-phase7-2026-10-19/build-artifacts.mjs` (fixed clock 2026-10-19T00:00:00Z) wrote the scenario, qualification, Phase 6 library, over-refusal and stability results.
5. **Mutation, stop and repairs.** See below.
6. **Determinism.** `node tests/engine-remediation-phase7/run.mjs --only determinism --record`: five full runs, one hash (`execution-record/DETERMINISM_RECORD.json`).
7. **Prior suites.** Run unchanged (`execution-record/PRIOR_SUITE_RESULTS.json`).
8. **Workbench.** `workbench/build-workbench.mjs` (9 static pages) and `workbench/render-check.mjs` (18 offline renders at desktop and mobile widths, JavaScript disabled, 0 non-file requests, no horizontal overflow; `execution-record/WORKBENCH_RENDER_RECORD.json`).
9. **Documents.** `tooling/build-documents.mjs` generates the five table-bearing records from recorded artifacts; the remaining records are written by hand.
10. **Final suite.** `node tests/engine-remediation-phase7/run.mjs --record` (`execution-record/TEST_RESULTS.json`).

## Post-seal changes, disclosed

None of these changed candidate logic, a sealed expectation, a sealed scenario, a transform, the contract, a rule pack or the intended change set. `SEAL.json` still verifies.

| Change | Why | Kind |
|---|---|---|
| `tooling/qualify.mjs` accepts exactly two Phase 6 differ findings on an intake refusal that supersedes a response refusal (P7-SCO-05), only when the complete refusal state holds and the response was not read | The unchanged Phase 6 differ reports refusal supersession as a scope finding; sealed contract rule 3 already requires the complete-refusal check instead | harness correction |
| Backlog test changed from "exactly one entry per defect" to "one non-rejected dedicated entry per defect" | P6-RT-07 and P6K-001 each also carry a rejected general-form entry (P7B-012, P7B-013), as an append-only backlog should | harness correction |
| Probe helper gained an execution-mode parameter | Existing inputs were compiled in `local_mocked` mode regardless of their own mode. The first mutation run was therefore invalid; it was stopped and its temporary directories removed | harness correction |
| Four direct probes added for MX-02, MX-40, MX-59, MX-61 | The second mutation run killed 75 of 79; work stopped and was reported; owner authorized these four repairs | owner-authorized test repair (`execution-record/POST_STOP_REPAIR_RECORD.json`) |
| MX-14 area relabelled from `negation handling` to `rule trigger: RP-NEG-01` | The coverage check found no RP-NEG-01 trigger label; MX-14 already disables that trigger. The check had also failed in the 75 of 79 run | owner-authorized label change (`execution-record/LABEL_CORRECTION_RECORD.json`) |

The first attempt to launch the post-stop rerun never began: the command blocked on a shell step waiting for standard input before execution. No run started and no result exists from it (`execution-record/FIRST_ATTEMPT_DISCLOSURE.json`).

The first final-suite run failed two document checks: `RULE_PACK_SPECIFICATION.md` and this record used "validated" for the rule-pack schema check. Both were reworded to "checked"; neither file is sealed. The final suite was then rerun.

## Mutation runs

| Run | Result | Disposition |
|---|---|---|
| 1 | Invalid (probe mode defect) | Stopped, discarded, temporary directories removed |
| 2 | 75 of 79 killed; MX-02, MX-40, MX-59, MX-61 survived; RP-NEG-01 label coverage failed | Stopped and reported |
| 3 (attempt) | Never began | Disclosed |
| 3 | 79 of 79 killed; label coverage failed | Stopped and reported |
| 4 | 79 of 79 killed, 0 load failures; 84 of 84 checks | Continued |

## What did not happen

No commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker update or public change. No real record, holdout, source file or credential was used. Frozen v0.3, v1, v0.1, v0.2, Phase 4 and Phase 6 files are unchanged (preservation group).

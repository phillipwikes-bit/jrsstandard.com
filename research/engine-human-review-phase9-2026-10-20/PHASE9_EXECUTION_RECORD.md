# Phase 9 execution record

**LOCAL ENGINEERING MATERIAL ONLY.** Independent evaluation not authorized or conducted. No release, deployment, or commercial readiness determination. Release status remains NO_GO_NOT_VERIFIED. Blocker B-018 remains OPEN.

Package: `phase9-human-evidence-adjudication` (admitted `local_construction_only`, 2026-10-20). Material: synthetic only, derived from the fictional GC-001 record; holdout-ineligible.

Baseline commit 428c307 on `claude/engine-reliability-phase6-local`. Every command ran with `ANTHROPIC_BASE_URL` unset. No credential value was read. Every harness refuses provider configuration and traps network APIs.

## Sequence

1. Preconditions verified (Phase 8.2 handoff 474/474 and 98/98; registry valid and hash-bound; earlier packages byte-identical; no tracked or staged change; no Phase 9 entry or file; declared conditions only; public routes refusal-only; NO_GO_NOT_VERIFIED; B-018 OPEN).
2. Admission recorded at 2026-10-20T12:12:54.948Z in the Phase 8 registry (`admitted_future_package`, `local_construction_only`, four paths, manifest inside the Phase 9 research directory, conditions EC-P4-TOOLS, EC-P6-OWNERSHIP, EC-P7-OWNERSHIP, EC-P7-TOOLS, EC-P8-SCOPE). Phase 8 whole-worktree verification afterwards: declared composition conditions only; Phase 8 self-run 474/474.
3. Library written: contract, dossier, controls, decision model, protocol, rehearsal schema, rehearsal evaluator, stability.
4. 50 rehearsal cases and expectations authored without running any Engine on them. Sealed at 2026-10-20T12:42:38.354Z (`sha256:be2cda74ff82d58844c6ebe4e335ea2be8c4d55e076b635e36d19a3e09e9fcc8`).
5. First evaluator run at 2026-10-20T12:42:39.711Z: 49/50 as sealed. Network attempts: 0.
6. Stability transforms, suite, probes, mutations, workbench, replay tool and documents written. Phase 9 manifest version 1 written. Phase 8 whole-worktree replay re-run with Phase 9 present: fail_closed (stop).
7. Owner-authorized filename compatibility repair (below), suite re-recorded, Phase 8 whole-worktree replay re-run, documents rebuilt, manifest version 2 written last.

## Disclosures

- **R9-CON-04 differs from the seal.** Sealed escalation `["ET2"]`, observed `[]`. Direction: less escalation than sealed. Cause (FACT, from source and a post-seal check): the candidate low-risk pattern reads clause text with the section label removed, so "Residual risk: low" is never read as a low-risk statement and the unresolved-risk note raises no conflict. The Engine status (review_required) matched the prediction. The seal was not changed and the Engine was not changed.
- **Pre-seal source corrections.** While predicting Engine behaviour from source, three draft cases (R9-QNS-05, R9-QNS-08, R9-QNS-09) were found to quote sentences that would fail the assertion-marker check. They were reworded before the seal. No Engine was run on any Phase 9 case before the seal.
- **Pre-seal exploratory compile.** Before authoring, the dossier builder was tried on one Phase 7 scenario (P7-CHR-01), not a Phase 9 case. It showed that the proof scan matched the Engine limitation text ("It does not establish that the text proves the finding"). The scan was restricted to text this package authors. An `assertion_accepted` field was also added to quotations before the seal.
- **Stability transforms were written after the first evaluator run.** They are invariance checks with a fixed expectation (no change in review rank, status, escalation or route), not sealed expectations.
- **Suite harness corrections before the recorded run.** (a) The earlier-manifest check first compared the Phase 8 8.1 and 8.2 historical manifests against the worktree; those record superseded Phase 8 states and are not current bindings. The check now uses the seven manifests the version registry binds plus the current Phase 8 file manifest. (b) A field-length threshold rejected the valid escalation rule "Always escalates."; lowered to 15 characters. (c) A test literal contained an email-shaped string; it is now assembled at run time.

## Suite

Recorded run (before the Phase 9 manifest existed): 313 checks, 313 pass, 0 fail, 1 skipped (the manifest-integrity check, which needs the manifest). Kinds: direct 86, adversarial 57, mutation 40, stability 44, determinism 3, structural 83. Network attempts: 0.

The suite run after manifest version 2 is reported in the handoff conversation, not in a manifested file, because writing it would change a manifested file. The whole-worktree result below comes from the replay run before manifest version 2, while the Phase 9 package was in the declared incomplete-construction state; a confirming replay after version 2 is reported in the handoff conversation and in the regenerated Phase 8 run record.

## Mutations

40 mutations, 40 caught by a named probe, 0 survived, 0 load failures.

| Id | File | Caught by |
|---|---|---|
| MU-01 | `dossier.mjs` | dossier_response_unfilled, presence_not_support |
| MU-02 | `dossier.mjs` | incomplete_escalates, escalation_rule_direct |
| MU-03 | `dossier.mjs` | incomplete_escalates, escalation_rule_direct |
| MU-04 | `dossier.mjs` | incomplete_escalates, escalation_rule_direct |
| MU-05 | `dossier.mjs` | dossier_matches_engine |
| MU-06 | `dossier.mjs` | presence_not_support, dossiers_valid |
| MU-07 | `dossier.mjs` | validate_flags_prefill |
| MU-08 | `dossier.mjs` | validate_flags_proof |
| MU-09 | `dossier.mjs` | validate_flags_approval |
| MU-10 | `dossier.mjs` | validate_flags_hash |
| MU-11 | `dossier.mjs` | synthetic_only |
| MU-12 | `dossier.mjs` | not_more_favourable_detects |
| MU-13 | `dossier.mjs` | validate_flags_offsets |
| MU-14 | `dossier.mjs` | incomplete_escalates, dossiers_valid |
| MU-15 | `dossier.mjs` | dossier_lists_controls, dossiers_valid |
| MU-16 | `dossier.mjs` | dossiers_valid |
| MU-17 | `controls.mjs` | controls_disable_detected |
| MU-18 | `controls.mjs` | controls_directive_detected |
| MU-19 | `controls.mjs` | controls_question_required |
| MU-20 | `decision-model.mjs` | derive_outcome_refuses |
| MU-21 | `decision-model.mjs` | entry_rejects_system_source |
| MU-22 | `decision-model.mjs` | entry_requires_cited_words |
| MU-23 | `decision-model.mjs` | entry_requires_escalation |
| MU-24 | `decision-model.mjs` | entry_requires_placeholder |
| MU-25 | `protocol.mjs` | apply_to_engine_refuses |
| MU-26 | `protocol.mjs` | learning_requires_exact_graph |
| MU-27 | `protocol.mjs` | disagreement_preserves_engine |
| MU-28 | `protocol.mjs` | adjudication_rule |
| MU-29 | `protocol.mjs` | measures_not_measurable |
| MU-30 | `protocol.mjs` | protocol_disabled |
| MU-31 | `protocol.mjs` | measures_not_measurable |
| MU-32 | `rehearsal-schema.mjs` | seal_rejects_expectation_change |
| MU-33 | `rehearsal-schema.mjs` | seal_rejects_case_change |
| MU-34 | `rehearsal-schema.mjs` | route_rule, evaluator_matches_first_run |
| MU-35 | `rehearsal-schema.mjs` | case_marking |
| MU-36 | `rehearsal.mjs` | packets_blinded |
| MU-37 | `rehearsal.mjs` | packets_blinded |
| MU-38 | `rehearsal.mjs` | evaluator_detects_escalation_mismatch, evaluator_matches_first_run |
| MU-39 | `stability.mjs` | stability_detects_favourable |
| MU-40 | `rehearsal.mjs` | blinding_detects_leak |

## Stability and determinism

44 invariant transforms, 44 as expected, 27 from an unfavourable or escalation baseline, 0 more favourable. Five passes of the evaluator, the stability run and all dossier hashes were identical.

## Workbench

desktop 1280px: 0 non-file requests, overflow false; mobile 390px: 0 non-file requests, overflow false. JavaScript disabled in the render context.

## Filename compatibility repair (owner-authorized, 2026-10-20)

- **Original fail-closed result.** With manifest version 1 in place, the Phase 8 whole-worktree replay failed closed. Preserved in `historical/STOP_REPORT_V1.md`, `historical/REPLAY_V1_OUTPUT.txt` and `historical/WORKTREE_RUN_RECORD_V1.json`.
- **Collision.** `research/engine-human-review-phase9-2026-10-20/DUAL_REVIEW_AND_ADJUDICATION_PROTOCOL.md` matched the Phase 7 pattern `/Source_Aligned|Blueprint_Aligned|project_sources|holdout|adjudicat/i` (`tests/engine-remediation-phase7/run.mjs` line 72, check "no source-aligned controlling file, holdout or label file in the work"), which was not among the declared conditions.
- **Repair.** Renamed to `research/engine-human-review-phase9-2026-10-20/DUAL_REVIEW_PROTOCOL.md`, byte for byte (sha256 `750b350897455f66b9ef9b421b5a89700223ba7196401e6f84d7406f2b9f6360` before and after). The original is preserved as `research/engine-human-review-phase9-2026-10-20/historical/DOCUMENT_07_V1.md`. Mapping: `historical/FILENAME_MAPPING.json`. No Phase 7 guard, Phase 8 governance, Engine file or sealed expectation was changed.
- **Manifests.** Version 1 (92 files, sha256 `edd4e6358b6f85905082ee3a7b62fc46ff675509b845e25cdd7c422904f6bdfc`) is preserved unchanged at `manifest-history/v1.sha256`. Version 2 is `PHASE9_FILE_MANIFEST_SHA256.txt` and covers the repaired package.
- **Version 1 results** (preserved in `historical/RESULTS_V1_TEST.json` and `historical/RESULTS_V1_MUTATION.json`): 307 checks, 307 pass, 0 fail, 1 skipped.

## Final whole-worktree result (after the repair)

Run 2026-10-20T13:28:08.663Z to 2026-10-20T13:38:02.805Z (Phase 8 record `execution-record/WORKTREE_RUN_RECORD.json`, regenerated by the replay).

- Suites: v0.1-assurance 148/148; v0.2-evidence-contract 123/123; v0.3-evidence-graph 140/140; phase4-change-control 268/269 (failed: tools unchanged since 5d5374b); phase6-reliability 315/316 (failed: every new file is inside the four Phase 6 locations); phase7-candidate 326/328 (failed: every new file is a Phase 6 file or inside the three Phase 7 locations | no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page).
- Registry-derived composition: **declared_composition_conditions_only** (10 declared conditions; fail-closed items 0).
- Compatibility-manifest classification: **fail_closed**; 100 `package_outside_registry` results for admitted Phase 9 paths; 4 `unexplained_conflict` results naming Phase 9 paths (phase4-change-control: tools unchanged since 5d5374b; phase6-reliability: every new file is inside the four Phase 6 locations; phase7-candidate: every new file is a Phase 6 file or inside the three Phase 7 locations; phase7-candidate: no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page); 0 `genuine_regression`.
- Phase 8 in the current composition: 473/474, scope fail_closed.
- Network attempts: 0.

**STOPPED, NOT REPAIRED.** The owner authorization requires no `unexplained_conflict` or `package_outside_registry` result for an admitted Phase 9 path, and says to stop and report if that condition fails. It fails. Cause (FACT, from source): the replay tool (`tools/engine-governance-phase8-replay.mjs`, lines 100 to 101) classifies untracked files with the compatibility-manifest classifier (`classifyRun` in `lib/engine-governance-phase8/governance.mjs`), which assigns files with `packageOf` over the static earlier-package list and the four CPC conditions, without reading the later-package registry. Every Phase 9 file is therefore `package_outside_registry`, and CPC-01 to CPC-04 are `unexplained_conflict` because their declared triggering paths predate Phase 9. The Phase 8 suite, which recomputes the classification with its own scope, reports declared conditions only; its one failure is 'recorded run verdict matches recomputation'. Resolving this needs a change outside the admitted Phase 9 locations and requires new owner authorization.

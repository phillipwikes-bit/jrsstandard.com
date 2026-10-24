# Phase 8.3 Classifier Correction

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

**A narrow owner-authorized correction to Phase 8 local governance, not a new engineering phase. No Engine, Phase 1 to 7, Phase 9 logic, public or deployment file changed. B-018 remains OPEN. NO_GO_NOT_VERIFIED is unchanged.**

Authorization: Owner authorization 2026-10-21: Phase 8 Registry-Aware Compatibility Classifier Correction.

## Defect

tools/engine-governance-phase8-replay.mjs passed every untracked path to governance.classifyRun, which assigns packages with registry.packageOf over the static earlier-package list and the four CPC conditions only. Paths of a valid admitted later package (Phase 9) were therefore package_outside_registry, and CPC-01 to CPC-04 became unexplained_conflict because their declared triggering paths predate Phase 9. The overall verdict failed closed although the registry-derived composition declared every condition. The Phase 8 suite recomputed the classification over Phase 8-scope paths only, so it reported declared conditions only and disagreed with the recorded verdict.

## Correction

- classifyRun accepts an optional registry-derived context (later-packages.laterCompatibilityContext). Without it the classification is unchanged.
- A path outside the statically registered packages is accepted only when it belongs to a valid admitted package in a declared state (manifest_verified, or incomplete_construction reported as declared_incomplete_construction). Invalid reservations, files before admission, undetermined states and integrity failures keep their fail-closed classes; any other path stays package_outside_registry. A registry-level validation problem invalidates every admitted package.
- A failing earlier check is attributed to an admitted package only when that package declared the check; otherwise undeclared_affected_check, which fails closed. CPC-01 to CPC-04 remain historical compatibility references for the files they name.
- The replay validates the registry before classifying, and records and prints six result kinds separately (historical, isolated replay, current composition, declared conditions, undeclared failures, integrity failures).
- The Phase 8 suite recomputes the classification over the whole worktree with the same registry context.

## Classification of path and package states

| Path or package state | Classification |
|---|---|
| Registered seed package (Phase 6, 7, 8) or earlier package | Existing historical treatment (CPC-01 to CPC-04 for the files they name) |
| Valid admitted package, no files | Valid reservation; no item |
| Valid admitted package with files and a verified manifest | `declared_composition_condition` for each earlier check it declared |
| Valid admitted package with files but no manifest | `declared_incomplete_construction` |
| Admitted package changed after its manifest | `admitted_package_integrity_failure` (fails closed) |
| Admitted package file outside its approved paths | `package_outside_registry` (fails closed) |
| Unregistered package path, or an unknown path imitating one | `package_outside_registry` (fails closed) |
| Invalid owner decision or admission record | `missing_or_invalid_registry_reservation` (fails closed); a registry-level problem invalidates every admitted package |
| Files older than the admission, or undetermined package state | `files_before_admission` or `package_state_not_determined` (fails closed) |
| Earlier check tripped by an admitted package that did not declare it | `undeclared_affected_check` (fails closed) |

## Pre-correction state (preserved)

| Item | Value |
|---|---|
| Phase 8 suite | 474/474 (246 direct, 130 negative, 98 mutation), recorded 2026-10-20T06:12:03.255Z |
| Mutations | 98/98 |
| Isolated replay of that state | 474/474 |
| Phase 8 manifest | registry/manifests/phase8-governance-8.2c-historical.sha256 (74 files, sha256:a947863533a9439e2676463fa2e772221e3b1495bc8c1452fe20ec5e0a9b31a7) |
| Whole-worktree run with Phase 9 present | classification `fail_closed`: 100 package_outside_registry, 4 unexplained_conflict; registry-derived composition `declared_composition_conditions_only`; Phase 8 self-run 473/474 |
| Preserved records | execution-record/phase8-3-pre-correction/PHASE8_TEST_RESULTS.json, execution-record/phase8-3-pre-correction/MUTATION_EVIDENCE.json, execution-record/phase8-3-pre-correction/WORKTREE_RUN_RECORD.json |

## Result after the correction

Whole-worktree run 2026-10-21T10:29:47.930Z to 2026-10-21T10:35:12.192Z.

| Kind | Result |
|---|---|
| 1. Historical package results | v0.1-assurance 148/148; v0.2-evidence-contract 123/123; v0.3-evidence-graph 140/140; phase4-change-control 269/269; phase6-reliability 316/316; phase7-candidate 328/328; phase8-governance 370/370 |
| 2. Isolated replay results | v0.1-assurance none; v0.2-evidence-contract none; v0.3-evidence-graph none; phase4-change-control 269/269; phase6-reliability 316/316; phase7-candidate 328/328; phase8-governance 370/370 |
| 3. Current-composition results | v0.1-assurance 148/148; v0.2-evidence-contract 123/123; v0.3-evidence-graph 140/140; phase4-change-control 268/269; phase6-reliability 315/316; phase7-candidate 326/328; phase8-governance 523/523 |
| 4. Declared composition conditions | 15: CPC-01, DCC-EC-P4-TOOLS-phase9-human-evidence-adjudication, CPC-02, DCC-EC-P6-OWNERSHIP-phase9-human-evidence-adjudication, CPC-03, DCC-EC-P7-OWNERSHIP-phase9-human-evidence-adjudication, CPC-04, DCC-EC-P7-TOOLS-phase9-human-evidence-adjudication, DCC-EC-P4-TOOLS-phase8-governance, DCC-EC-P4-TOOLS-phase6-reliability, DCC-EC-P6-OWNERSHIP-phase7-candidate, DCC-EC-P6-OWNERSHIP-phase8-governance, DCC-EC-P7-OWNERSHIP-phase8-governance, DCC-EC-P7-TOOLS-phase8-governance, DCC-EC-P8-SCOPE-phase9-human-evidence-adjudication |
| 5. Undeclared failures | 0 |
| 6. Integrity failures | 0 |
| Compatibility classification | `declared_conditions_only` |
| Registry-derived composition | `declared_composition_conditions_only` |
| Phase 8 in the current composition | 523/523, `declared_composition_conditions_only` |

## Phase 8 suite after the correction

523 of 523 checks passed (266 direct, 145 negative or adversarial, 112 mutation); recorded 2026-10-21T10:38:50.968Z.

## Mutations

112 of 112 caught by named probes; 0 load failures; 0 setup errors. Added by this correction: MG-99 to MG-112. MG-06 and MG-12 were retargeted to the same logic in its corrected form because their original target text no longer exists; the defect each injects is unchanged.

| Mutation | Area | Result | Caught by |
|---|---|---|---|
| MG-06 | undeclared conflict | killed | neg.undeclared_conflict_fails_closed, neg.genuine_regression_fails_closed, neg.removed_condition_is_undeclared |
| MG-12 | package outside registry | killed | neg.trigger_outside_declared_paths, neg.package_outside_registry, p83.no_manifest_declared_incomplete |
| MG-99 | unregistered later path | killed | neg.trigger_outside_declared_paths, neg.package_outside_registry, p83.without_registry_context_unchanged |
| MG-100 | only accepted paths pass | killed | p83.no_manifest_declared_incomplete, n83.changed_after_manifest_integrity_failure, n83.invalid_owner_decision_fails |
| MG-101 | only declared states attributed | killed | n83.changed_after_manifest_integrity_failure |
| MG-102 | affected check must be declared | killed | n83.undeclared_affected_check_fails |
| MG-103 | incomplete construction reported | killed | p83.no_manifest_declared_incomplete |
| MG-104 | registry attribution of later files | killed | p83.valid_phase9_with_manifest_declared, p83.no_phase9_unexplained_conflict, p83.no_manifest_declared_incomplete |
| MG-105 | fail-closed class set | killed | n83.undeclared_affected_check_fails |
| MG-106 | composition conditions listed | killed | p83.composition_conditions_listed_separately |
| MG-107 | unmanifested check needs placed files | killed | n83.unplaced_file_on_unmanifested_check_unexplained |
| MG-108 | condition label | killed | p83.condition_label_not_defect |
| MG-109 | registry-level problem invalidates admissions | killed | n83.altered_admission_unhashed_fails |
| MG-110 | failure states carried per file | killed | n83.changed_after_manifest_integrity_failure, n83.invalid_owner_decision_fails, n83.missing_owner_evidence_fails |
| MG-111 | integrity failures reported separately | killed | p83.report_six_kinds_separate |
| MG-112 | incomplete construction distinguished | killed | p83.no_manifest_declared_incomplete |

No release, deployment, independent evaluation, provider use or commercial readiness determination occurred. No commit, push, merge, pull-request action, B-018, tracker, source, branch or public change occurred.

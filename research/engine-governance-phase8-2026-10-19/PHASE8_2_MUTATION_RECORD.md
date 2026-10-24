# Phase 8.2 Mutation Record

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Source: `execution-record/MUTATION_EVIDENCE.json` (generated 2026-10-20T06:12:03.255Z). Phase 8.2 added MG-68 to MG-85. A mutation counts as caught only when a named probe fails; a load failure does not count.

| Measure | Phase 8.2 mutations | All Phase 8 mutations |
|---|---|---|
| Introduced | 31 | 98 |
| Caught directly | 31 | 98 |
| Survived | 0 | 0 |
| Load failures | 0 | 0 |

| Mutation | Area | File | Result | Caught by |
|---|---|---|---|---|
| MG-68 | Phase 8 scope: undeclared future path | later-packages.mjs | killed | n82.undeclared_future_path_fails_closed, n82.phase9_like_unadmitted_path_fails_closed |
| MG-69 | Phase 8 scope: invalid reservation | later-packages.mjs | killed | n82.invalid_reservation_fails |
| MG-70 | Phase 8 scope: reserved package with files | later-packages.mjs | killed | n82.reserved_package_with_files_fails |
| MG-71 | Phase 8 scope: files older than admission | later-packages.mjs | killed | n82.files_older_than_admission_fail |
| MG-72 | Phase 8 scope: changed protected file | later-packages.mjs | killed | n82.changed_phase8_file_remains_failure |
| MG-73 | Phase 8 scope: condition label | later-packages.mjs | killed | p82.phase8_scope_declared_condition |
| MG-74 | entry class | later-packages.mjs | killed | n82.unknown_entry_class_rejected |
| MG-75 | seed set | later-packages.mjs | killed | n82.future_package_as_seed_rejected |
| MG-76 | admitted package needs recorded decision | later-packages.mjs | killed | n82.admitted_without_decided_reference_rejected |
| MG-77 | files at admission | later-packages.mjs | killed | n82.admitted_with_files_at_admission_rejected |
| MG-78 | registry status-word rule | later-packages.mjs | killed | n82.deployed_status_rejected, n82.validated_licensed_ready_rejected |
| MG-79 | derived counts | later-packages.mjs | killed | p82.counts_derived_from_entries |
| MG-80 | authorization scope | decisions.mjs | killed | n82.authorization_overreach_rejected |
| MG-81 | authorization decided | decisions.mjs | killed | n82.authorization_undecided_rejected |
| MG-82 | authorization creates no reservation | decisions.mjs | killed | n82.authorization_creating_reservation_rejected |
| MG-83 | freeze lineage | handoff-freeze.mjs | killed | p82.freeze_unaffected_by_admitted_entries |
| MG-84 | Phase 8 historical result | later-packages.mjs | killed | p82.dual_context_phase8_separate, p82.historical_unchanged_by_failing_composition |
| MG-85 | Phase 8 scope in affected-check analysis | later-packages.mjs | killed | a81.well_formed_proposal_admissible, a81.computed_analysis_for_research_only_package, n81.incomplete_prior_analysis_rejected, p82.future_admission_representable |
| MG-86 | admitted package manifest location | later-packages.mjs | killed | n82.manifest_outside_research_path_rejected |
| MG-87 | admitted package statuses | later-packages.mjs | killed | n82.admitted_package_with_seed_status_rejected |
| MG-88 | incomplete construction state | later-packages.mjs | killed | s82.files_without_manifest_is_incomplete_construction, s82.incomplete_construction_declared_not_defect |
| MG-89 | file changed after manifest | later-packages.mjs | killed | n82.changed_file_after_manifest_integrity_failure |
| MG-90 | manifest file set | later-packages.mjs | killed | n82.unlisted_file_integrity_failure |
| MG-91 | manifest version header | later-packages.mjs | killed | n82.manifest_without_version_integrity_failure |
| MG-92 | manifest history preserved | later-packages.mjs | killed | n82.regeneration_without_history_integrity_failure |
| MG-93 | integrity failure classified | later-packages.mjs | killed | n82.changed_file_after_manifest_integrity_failure |
| MG-94 | package state required | later-packages.mjs | killed | n82.package_state_missing_fails_closed |
| MG-95 | incomplete construction declared | later-packages.mjs | killed | s82.incomplete_construction_declared_not_defect |
| MG-96 | admitted files attributed in composition | later-packages.mjs | killed | s82.admitted_files_attributed_in_composition |
| MG-97 | no manifest required before files | later-packages.mjs | killed | s82.admitted_no_files_valid_reservation, s82.no_manifest_required_before_files |
| MG-98 | malformed manifest line | later-packages.mjs | killed | n82.malformed_manifest_integrity_failure |

Mutation testing shows these probes detect these deliberate defects. It does not show the probes detect every defect.

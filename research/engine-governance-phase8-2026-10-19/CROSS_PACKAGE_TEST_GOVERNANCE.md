# Cross-Package Test Governance

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

**Language rule.** Earlier package results remain historically recorded results for their sealed package scope. A later whole-worktree run may show a declared compatibility condition without establishing a defect in the earlier package.

Each earlier suite checks that new files sit only in its own locations. Later packages add files elsewhere by design, so a whole-worktree run of an earlier suite reports those checks as failing. Phase 8 does not edit, skip, patch or weaken any earlier check. It declares each such condition in `governance/COMPATIBILITY_MANIFEST.json` (defined before any Phase 8 code), recomputes independently which later files trip each check, and classifies every failing check. A declared condition is never called a pass.

## Classes

| Class | Meaning | Effect |
|---|---|---|
| declared_compatibility_condition | A failing check named in the manifest, tripped only by files of a registered later package inside the declared paths, with the protected earlier files unchanged | Visible; does not fail closed |
| genuine_regression | A failing check not in the manifest and not about file location, or a declared check failing with no later file tripping it | Fail closed |
| unexplained_conflict | A file-location check not in the manifest, or a declared check tripped by a file outside its declared paths | Fail closed |
| missing_package | A registered package has no manifest or no verification result | Fail closed |
| changed_protected_file | A protected file differs from, is missing from, or is added to its recorded manifest | Fail closed |
| incomplete_test_record | A suite has no run record, or its counts, failed-check list or output hash are missing or inconsistent | Fail closed |
| package_outside_registry | An untracked file belongs to no registered package | Fail closed |
| condition_description_inconsistent | The manifest entry is incomplete or contradictory, or later files exist but the declared check did not report them | Fail closed |
| unsupported_pass_claim | An earlier package described as passed without its recorded result or a complete fresh run | Refused |

## Declared conditions

### CPC-01: Phase 4 tools-path condition

| Field | Value |
|---|---|
| Originating suite and exact check | `tests/engine-adaptive-reliability/run.mjs`: "tools unchanged since 5d5374b" (tests/engine-adaptive-reliability/run.mjs:51 (loop over protected paths; p = 'tools')) |
| Triggering later files or paths | tools/engine-reliability-replay.mjs (phase6-reliability, existing); tools/engine-governance-phase8-replay.mjs (phase8-governance, additional phase8) |
| Protected earlier packages confirmed unchanged | v1-historical, v0.1-assurance, v0.2-evidence-contract, v0.3-evidence-graph, phase4-change-control (byte-identical to their manifests before and after the whole-worktree run) |
| First observed | 2026-10-19 (existing, research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json); 2026-10-19 (additional phase8, research/engine-governance-phase8-2026-10-19/execution-record/WORKTREE_RUN_RECORD.json) |
| Meaning | Later local tooling exists under tools/. Phase 4 protected files remain unchanged. |
| Why visible, and why the earlier recorded result is not rewritten | The Phase 4 check fails on any untracked file under tools/, including files that later packages add. No tracked tools/ file differs from 5d5374b. The Phase 4 recorded result stays as recorded for its sealed scope; the condition is reported, never relabelled as a pass and never suppressed. |
| Owner decision before any redesign | P7-OD-04 and P8-OD-02: whether the Phase 4 file-ownership check should ever be redesigned. Until then it is not edited. |

### CPC-02: Phase 6 package-ownership condition

| Field | Value |
|---|---|
| Originating suite and exact check | `tests/engine-reliability/run.mjs`: "every new file is inside the four Phase 6 locations" (tests/engine-reliability/run.mjs:64) |
| Triggering later files or paths | lib/engine-evidence-graph-v0.3.1-candidate/ (phase7-candidate, existing); tests/engine-remediation-phase7/ (phase7-candidate, existing); research/engine-remediation-phase7-2026-10-19/ (phase7-candidate, existing); lib/engine-governance-phase8/ (phase8-governance, additional phase8); tests/engine-governance-phase8/ (phase8-governance, additional phase8); tools/engine-governance-phase8-replay.mjs (phase8-governance, additional phase8); research/engine-governance-phase8-2026-10-19/ (phase8-governance, additional phase8) |
| Protected earlier packages confirmed unchanged | phase6-reliability (byte-identical to their manifests before and after the whole-worktree run) |
| First observed | 2026-10-19 (existing, research/engine-remediation-phase7-2026-10-19/execution-record/PRIOR_SUITE_RESULTS.json); 2026-10-19 (additional phase8, research/engine-governance-phase8-2026-10-19/execution-record/WORKTREE_RUN_RECORD.json) |
| Meaning | Later packages exist. Phase 6 protected files remain unchanged. |
| Why visible, and why the earlier recorded result is not rewritten | The Phase 6 check fails on any untracked file outside the four Phase 6 locations. Phase 7 and Phase 8 files are outside them by design. Every Phase 6 file is byte-identical to its manifest. The Phase 6 recorded result (316/316) stays as recorded for its sealed scope. |
| Owner decision before any redesign | P7-OD-04 and P8-OD-02. |

### CPC-03: Phase 7 package-ownership condition

| Field | Value |
|---|---|
| Originating suite and exact check | `tests/engine-remediation-phase7/run.mjs`: "every new file is a Phase 6 file or inside the three Phase 7 locations" (tests/engine-remediation-phase7/run.mjs:58) |
| Triggering later files or paths | lib/engine-governance-phase8/ (phase8-governance, new phase8); tests/engine-governance-phase8/ (phase8-governance, new phase8); tools/engine-governance-phase8-replay.mjs (phase8-governance, new phase8); research/engine-governance-phase8-2026-10-19/ (phase8-governance, new phase8) |
| Protected earlier packages confirmed unchanged | phase6-reliability, phase7-candidate (byte-identical to their manifests before and after the whole-worktree run) |
| First observed | 2026-10-19 (new phase8, research/engine-governance-phase8-2026-10-19/execution-record/WORKTREE_RUN_RECORD.json) |
| Meaning | The Phase 7 suite was written before Phase 8 existed. No Phase 7 protected file has changed. |
| Why visible, and why the earlier recorded result is not rewritten | The Phase 7 check fails on any untracked file that is neither a Phase 6 file nor inside the three Phase 7 locations. Phase 8 files are outside them by design. Every Phase 7 file is byte-identical to the Phase 8 Phase 7 manifest. The Phase 7 recorded result (328/328 at 2026-10-19T13:57:52Z) stays as a time-bound recorded result. |
| Owner decision before any redesign | P8-OD-02. |

### CPC-04: Phase 7 tools-path condition

| Field | Value |
|---|---|
| Originating suite and exact check | `tests/engine-remediation-phase7/run.mjs`: "no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page" (tests/engine-remediation-phase7/run.mjs:59) |
| Triggering later files or paths | tools/engine-governance-phase8-replay.mjs (phase8-governance, new phase8) |
| Protected earlier packages confirmed unchanged | phase7-candidate, v1-historical (byte-identical to their manifests before and after the whole-worktree run) |
| First observed | 2026-10-19 (new phase8, research/engine-governance-phase8-2026-10-19/execution-record/WORKTREE_RUN_RECORD.json) |
| Meaning | Phase 8 uses a required local replay tool. No Phase 7 protected file, public route, deployment file or public page has changed. |
| Why visible, and why the earlier recorded result is not rewritten | The Phase 7 check treats any non-Phase-6 untracked file under tools/, api/, docs/, .jrs/, .github/ or a root HTML page as a Phase 7 file. The only such file is the required Phase 8 replay tool. No tracked file differs from 428c307. The Phase 7 recorded result stays as recorded. |
| Owner decision before any redesign | P8-OD-02. |

## Whole-worktree run

`env -u ANTHROPIC_BASE_URL node tools/engine-governance-phase8-replay.mjs --record`, 2026-10-20T06:03:58.487Z to 2026-10-20T06:09:15.198Z. Verdict: `declared_conditions_only`; fail-closed items: 0. Packages unchanged by the run: yes. Network attempts: 0.

| Package | Historically recorded result (sealed package scope) | Recorded | Whole-worktree result (2026-10-20) | Declared conditions visible |
|---|---|---|---|---|
| v1-historical | no suite of its own | n/a | no suite | n/a |
| v0.1-assurance | 148/148 | 2026-10-17 | 148/148 | none |
| v0.2-evidence-contract | 123/123 | 2026-10-17 | 123/123 | none |
| v0.3-evidence-graph | 140/140 | 2026-10-17 | 140/140 | none |
| phase4-change-control | 269/269 | 2026-10-17 | 268/269 | CPC-01 |
| phase6-reliability | 316/316 | 2026-10-19T11:13:53.182Z | 315/316 | CPC-02 |
| phase7-candidate | 328/328 | 2026-10-19T13:57:52.546Z | 326/328 | CPC-03, CPC-04 |

Every earlier result is reported twice: as historically recorded for its sealed package scope, and as observed in the later whole-worktree run. The second does not replace the first.

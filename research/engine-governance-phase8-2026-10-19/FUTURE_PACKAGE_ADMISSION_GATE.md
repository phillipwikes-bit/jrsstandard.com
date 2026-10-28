# Future-Package Admission Gate

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Logic: `lib/engine-governance-phase8/admission.mjs` (`evaluateAdmission`). The gate decides only whether a proposed package is admissible to the registry. **It never authorizes work** (`authorizes_work` is always false), creates no file and edits no registry. Adoption of the gate as a binding rule is owner decision P8-OD-09.

## Required fields

- `package_id`
- `package_version`
- `owner_decision_reference`
- `purpose`
- `approved_paths`
- `planned_manifest`
- `affected_prior_analysis`
- `regression_plan`
- `rollback_plan`
- `boundary_statement`

The boundary statement must read exactly: "This package cannot modify public, deployment or earlier protected paths without separate authorization."

## Rejections

| Condition | Result |
|---|---|
| Owner decision reference missing, or not a recorded decision | rejected |
| Any file already exists in the approved paths (created before admission) | rejected |
| A planned file outside the approved paths | rejected |
| An approved path in a protected or public area (api, docs, .jrs, .github, root pages, deployment files, trackers, ledgers, project sources, earlier package or test directories) | rejected |
| An approved path overlapping a registered package, or an identifier already registered | rejected |
| An affected prior-package analysis that differs from the computed analysis | rejected |
| Any attempt to redefine historical results, or a request for public or deployment effect | rejected |
| A validation, readiness, licensing or commercial status claim, or B-018 presented as resolved | rejected |
| A registered present package whose manifest does not match its registry entry | rejected (verifyRegisteredManifest) |

## Admission sequence for any future package

1. Recorded owner decision.
2. Proposal with all required fields; the gate computes the affected earlier checks.
3. Registry entry added with status `reserved_not_present` before any file exists.
4. Package files created only inside the approved paths; status moves to `present_local_only` with a manifest binding.
5. Isolated replay of affected earlier packages, and a whole-worktree run showing only registry-derived conditions.

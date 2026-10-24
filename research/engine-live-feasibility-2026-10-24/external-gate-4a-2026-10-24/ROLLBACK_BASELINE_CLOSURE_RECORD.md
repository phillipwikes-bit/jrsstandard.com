# Rollback Baseline Closure Record

External Gate 4A. Date: 2026-10-24. Read-only record; no repository file was created,
changed, staged or deleted to produce it. B-018 remains OPEN. Release status remains
NO_GO_NOT_VERIFIED.

## 1. Start and completion

- The baseline was started once on 2026-10-24, immediately after the Option A rollback,
  by scratchpad script p0b/baseline.sh. No second run was started.
- It completed with exit code 0 after running every step; no step crashed or was cut
  short. All network-capable checks ran offline: the drift guard with --offline, the
  Engine suites with provider configuration removed, and the Phase 9 suite reporting 0
  network attempts.

## 2. Repository state

| Check | Result |
|---|---|
| Branch | claude/engine-reliability-phase6-local (unchanged) |
| HEAD | 428c307af510ff7378615777251fe252dab2dac7 (unchanged) |
| .jrs/state/BLOCKERS.json | 2b6d9aab2eee97f520f3323bf5b099ef814e213de9da6129d1aee099145025c1, byte-identical to 428c307 |
| B-018 reconciliation record in the worktree | Absent |
| Tracked changes / staged changes | 0 / 0 |
| Untracked files | 482, all inside the known Phase 6 to Phase 9 package locations; 0 outside them |
| Preservation package, scratchpad artifacts, source files in the repository | None |

Fingerprints (SHA-256 of the sorted per-file hash lists):

| | Before baseline | After baseline | Now |
|---|---|---|---|
| Tracked files | 20bba1b61f9543c4b2b3bb44437af3c45bf860ae210670a2c9bc0c899ab72056 | same | same |
| Untracked files | e93fed1d3fa1b4e65d85fa3551ad1e97760a7c0f54ce81e7a6bf3e0e6b705b76 | same | same |

The tracked fingerprint equals the one recorded before the Gate 1B change on 2026-10-23,
which confirms the tracked tree returned to its pre-Gate 1B state.

## 3. Suite results

### Whole-worktree composition results (this run)

| Suite | Result | Failing checks | Classification |
|---|---|---|---|
| v0.1 assurance | 148/148 | none | no condition |
| v0.2 evidence contract | 123/123 | none | no condition |
| v0.3 evidence graph | 140/140 | none | no condition |
| Phase 4 change control | 268/269 | tools unchanged since 5d5374b | declared: CPC-01; DCC-EC-P4-TOOLS (Phase 6, 8, 9) |
| Phase 6 reliability | 315/316 | every new file is inside the four Phase 6 locations | declared: CPC-02; DCC-EC-P6-OWNERSHIP (Phase 7, 8, 9) |
| Phase 7 candidate | 326/328 | new-file location check; restricted-root check | declared: CPC-03 and CPC-04; DCC-EC-P7-OWNERSHIP and DCC-EC-P7-TOOLS (Phase 8, 9) |
| Phase 8 governance (run separately) | 523/523 | none | no condition |
| Phase 9 human-review layer (run separately) | 318/318 | none | no condition |

Registry-derived composition: declared_composition_conditions_only (10 declared
composition conditions). Compatibility classification verdict: declared_conditions_only.
No fail_closed, integrity failure, incomplete record, package_outside_registry,
unexplained_conflict, crash or undeclared condition appeared.

### Historical package results (recorded, unchanged by this run)

| Package | Recorded historical result |
|---|---|
| v0.1 assurance | 148/148 |
| v0.2 evidence contract | 123/123 |
| v0.3 evidence graph | 140/140 |
| Phase 4 change control | 269/269 |
| Phase 6 reliability | 316/316 |
| Phase 7 candidate | 328/328 |
| Phase 8 governance | 370/370 (8.1 scope); later preserved states 435/435 and 474/474 |
| Phase 9 human-review layer | 318/318 |

The declared conditions above are composition conditions created by later local packages
sharing the worktree. They are not defects in the historical packages, whose recorded
results stand for their sealed scope.

### Checks outside the composition baseline

| Check | Result | Note |
|---|---|---|
| tests/engine/auth-matrix.mjs | pass | |
| scripts/test_review_incomplete.mjs | pass | |
| tests/public-route-alignment.mjs | pass | |
| tests/engine/retention.mjs | pass | |
| tests/engine/activity-projection.mjs | 11/17 | Same six failures as observed on 2026-10-23 before the rollback; they concern a database-reading endpoint, not the B-018 files or any Phase 6 to 9 package. Whether they predate 2026-10-23 is NOT ESTABLISHED. Not part of the whole-worktree governance composition. |
| Drift guard (offline) | 37 failed of 160 | Exactly the recorded 37-failure baseline; no new failure |

## 4. Discrepancies

None within the composition baseline. The activity-projection failures are disclosed above
as outside the composition scope and unchanged by the rollback.

## 5. Classification

**BASELINE RESTORED.** The whole-worktree verdict is declared_conditions_only, with no
undeclared, integrity or fail-closed condition, and the repository state matches the
required rollback state.

External Gate 4 may begin only on the owner's instruction; this record does not start it.
No network, provider, deployment, PR, branch, scheduler or external action occurred.

---
SHA-256 of this record above this footer line: 571ac5e025e80d644ded4e5c68d2ec9e92f883c07670455a436cb650100e30ca

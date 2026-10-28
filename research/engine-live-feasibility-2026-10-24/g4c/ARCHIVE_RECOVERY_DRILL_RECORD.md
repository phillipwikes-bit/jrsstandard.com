# Archive Recovery Drill Record

External Gate 4C. Date: 2026-10-24. Recovery and reproducibility drill only; not an
independent evaluation. B-018 remains OPEN. Release status remains NO_GO_NOT_VERIFIED.

## 1. Archive

| Item | Value |
|---|---|
| Archive | JRS_CONTROLLED_LOCAL_ARCHIVE_2026-10-24.tar.gz |
| SHA-256 | 3a1e2f261feafa5280d28fd99475df19b37a33192da3c2e78d5d4b405289b62e (matches the companion .sha256 file) |
| Copy tested | The session-retained copy delivered at External Gate 4B, identified by the SHA-256 above. No copy was re-uploaded by the owner, so this drill tests those bytes, not a round trip through the owner's storage. |

## 2. Baseline

Commit 428c307af510ff7378615777251fe252dab2dac7, branch
claude/engine-reliability-phase6-local. Live preconditions held: no tracked or staged
changes; BLOCKERS.json byte-identical to 428c307; no B-018 record in the worktree; 482
known untracked package files; live fingerprints identical to the External Gate 4A
BASELINE RESTORED record.

## 3. Extraction verification

| Check | Result |
|---|---|
| Archive hash against companion file | OK |
| Every archived file against ARCHIVE_MANIFEST_SHA256.txt | OK, 501 entries |
| Top-level structure | ARCHIVE_MANIFEST_SHA256.txt, OUTSIDE_REPOSITORY_B018, RESTORATION_NOTE.md, gate-records, local-packages only |
| Unexpected paths | None |
| Excluded material (version-control metadata, project_sources, environment files, dependency directories, source documents) | None |

## 4. Reconstruction

- Isolated clone: `git clone --no-hardlinks` of the live repository into a temporary
  directory outside it (no linked worktree; nothing written to the live .git). Clone HEAD
  428c307 on claude/engine-reliability-phase6-local; the PR #40 branch created locally in
  the clone at 428c307 for the Phase 8 safety checks.
- Clone tracked fingerprint before restore:
  20bba1b61f9543c4b2b3bb44437af3c45bf860ae210670a2c9bc0c899ab72056, equal to the live
  baseline; 0 untracked files.
- Restored only local-packages/. OUTSIDE_REPOSITORY_B018/ was not restored.
- Restored path set equals the archive list exactly (482 files); every restored file
  matches its archived SHA-256. Clone untracked fingerprint after restore:
  e93fed1d3fa1b4e65d85fa3551ad1e97760a7c0f54ce81e7a6bf3e0e6b705b76, equal to the live
  untracked fingerprint.

| Restored location | Files |
|---|---|
| lib/engine-reliability (Phase 6) | 9 |
| lib/engine-evidence-graph-v0.3.1-candidate (Phase 7) | 19 |
| lib/engine-governance-phase8 | 11 |
| lib/engine-human-review-phase9 | 8 |
| research/engine-reliability-phase6-2026-10-17 | 127 |
| research/engine-remediation-phase7-2026-10-19 | 126 |
| research/engine-governance-phase8-2026-10-19 | 77 |
| research/engine-human-review-phase9-2026-10-20 | 90 |
| tests (Phase 6 to 9 suites) | 12 |
| tools (Phase 6, 8, 9 replay tools) | 3 |
| Total | 482 |

## 5. Manifests and seals (verified before any suite ran)

| Item | Result |
|---|---|
| Seven earlier package manifests (v1 historical through Phase 7) | All OK |
| Phase 8 file manifest | OK |
| Phase 9 manifest | OK, version 2 |
| Phase 9 manifest version 1 | Preserved, SHA-256 edd4e6358b6f85905082ee3a7b62fc46ff675509b845e25cdd7c422904f6bdfc |
| Phase 7 seal (tooling/verify-seal.mjs) | exit 0 |
| Phase 9 rehearsal seal | Verified inside the Phase 9 suite and replay |

## 6. Commands run (in the isolated clone, provider configuration removed)

1. `node research/engine-remediation-phase7-2026-10-19/tooling/verify-seal.mjs`
2. `node tools/engine-reliability-replay.mjs`
3. `node tools/engine-governance-phase8-replay.mjs` (no --record)
4. `node tests/engine-governance-phase8/run.mjs`
5. `node tests/engine-human-review-phase9/run.mjs`
6. `node tools/engine-human-review-phase9-replay.mjs`

Clone file fingerprints were identical before and after these commands: no check wrote
any file.

## 7. Results

### Historical package results (recorded; unchanged)

v0.1 148/148; v0.2 123/123; v0.3 140/140; Phase 4 269/269; Phase 6 316/316; Phase 7
328/328; Phase 8 370/370 (8.1 scope; later preserved 435/435 and 474/474); Phase 9 318/318.

### Isolated replay results (this drill, in the reconstructed clone)

| Check | Result | Recorded expectation |
|---|---|---|
| Phase 6 replay tool | exit 10, human_review_required. Baseline, manifest hash, library seal, library results, stability results and register chain all HOLD; library 51 as expected, 10 known open failures reproduced, 1 unexpected (P6-RT-07); stability 25/27 as expected; 0 network attempts | Matches: the Phase 6 handoff records that the tool ends with human_review_required (exit 10) because of the documented open defect P6-RT-07 (P6K-009), and stability 25 of 27 with 2 reproduced predicted failures |
| Phase 8 suite | 523/523 | Matches the post-correction record |
| Phase 9 suite | 318/318, 0 network attempts | Matches |
| Phase 9 replay | 49/50 as sealed (R9-CON-04 disclosed), identical to the first run, 0 more favourable, 0 network attempts | Matches |

### Whole-worktree composition result (this drill)

| Suite | Result | Classification |
|---|---|---|
| v0.1 | 148/148 | no condition |
| v0.2 | 123/123 | no condition |
| v0.3 | 140/140 | no condition |
| Phase 4 | 268/269 | declared: CPC-01; DCC-EC-P4-TOOLS |
| Phase 6 | 315/316 | declared: CPC-02; DCC-EC-P6-OWNERSHIP |
| Phase 7 | 326/328 | declared: CPC-03, CPC-04; DCC-EC-P7-OWNERSHIP, DCC-EC-P7-TOOLS |

Registry-derived composition: declared_composition_conditions_only (10 declared
composition conditions: EC-P4-TOOLS for Phases 6, 8, 9; EC-P6-OWNERSHIP for Phases 7, 8, 9;
EC-P7-OWNERSHIP and EC-P7-TOOLS for Phases 8, 9). Compatibility verdict:
declared_conditions_only. No fail_closed, integrity failure, incomplete record,
package_outside_registry, unexplained_conflict, crash or undeclared condition. No
composite score is derived.

## 8. Skipped checks

- The drift guard was not run in the clone: it checks repository-wide public surfaces,
  not the Phase 6 to 9 packages, and its recorded 37-failure baseline was already
  confirmed at External Gate 4A.
- Isolated historical replays (temporary clones holding only one earlier package) were not
  re-run; their recorded results are cited as historical results above.

## 9. Classification

**RECOVERY DRILL PASSED.** The archive verifies, the restoration is exact, the required
offline checks reproduce their recorded expected results, and the composition is
declared_conditions_only.

## 10. Cleanup and live repository

- Temporary directory /tmp/g4c-drill-hC07oj (extraction and clone) deleted; confirmed absent.
- Live repository fingerprint before and after the drill (tracked, untracked, HEAD):
  20bba1b61f9543c4b2b3bb44437af3c45bf860ae210670a2c9bc0c899ab72056,
  e93fed1d3fa1b4e65d85fa3551ad1e97760a7c0f54ce81e7a6bf3e0e6b705b76, 428c307 (identical).
- No network, provider, external, deployment, PR, branch (in the live repository), commit
  or public action occurred.

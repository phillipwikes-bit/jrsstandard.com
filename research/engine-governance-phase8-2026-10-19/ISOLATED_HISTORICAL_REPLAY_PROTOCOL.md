# Isolated Historical Replay Protocol

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Command: `env -u ANTHROPIC_BASE_URL node tools/engine-governance-phase8-replay.mjs --isolated phase4-change-control,phase6-reliability,phase7-candidate --record`. Record: `execution-record/ISOLATED_REPLAY_RECORD.json`.

## Method

1. Plan (`lib/engine-governance-phase8/isolated-replay.mjs`, pure): the package's approved test command and the recorded manifests of its declared untracked dependencies. The plan refuses if a manifest is missing or malformed, or if the command is in neither the baseline tree nor a dependency manifest.
2. Clone: `git clone --no-hardlinks` of the local repository into a temporary directory outside the repository, at baseline commit `428c307`. The baseline tree is the recorded content of every tracked package. The repository itself is only read.
3. Reconstruct: copy only the planned files, each checked against its recorded SHA-256 before copying. Later packages are never copied.
4. Contamination check: the clone's untracked files must equal the planned files exactly.
5. Run: the approved command only, with provider variables removed from the environment; each earlier suite refuses provider configuration and traps network APIs.
6. Record the result separately from the composition result, then delete the clone.

| Package | Untracked dependencies | Command |
|---|---|---|
| phase4-change-control | none (baseline tree only) | tests/engine-adaptive-reliability/run.mjs |
| phase6-reliability | phase6-reliability | tests/engine-reliability/run.mjs |
| phase7-candidate | phase6-reliability, phase7-candidate | tests/engine-remediation-phase7/run.mjs |

## Results

| Package | Isolated result | Historical record | Untracked files in clone | Later packages present | Contamination check | Duration |
|---|---|---|---|---|---|---|
| phase4-change-control | 269/269 | 269/269 | 0 | no | clean | 58 s |
| phase6-reliability | 316/316 | 316/316 | 139 | no | clean | 22 s |
| phase7-candidate | 328/328 | 328/328 | 286 | no | clean | 212 s |

Temporary copies deleted: yes. Network attempts: 0.

Each isolated result equals the package's historical record. In the whole worktree the same suites report the declared composition conditions, which confirms those conditions come from later packages and not from any change to the earlier package.

## Limits

The isolated environment is the baseline commit plus recorded manifests; it is not a separate machine. A replay shows repeatability of the recorded local result, not correctness.

# Baseline Register (156-record study)

**State of the project when the study began, 2026-10-27.** Every item cites a file. Logs are preserved in `reports/baseline-evidence/`.

## 1. Repository

| Item | Value | Evidence |
|---|---|---|
| Branch | `claude/engine-reliability-phase6-local` | `git status` |
| HEAD | `b41e2043` (2026-10-25, "Add Stage A revised study for a new-session restart (unsigned)"); unchanged through the study | `git log -1` |
| Working tree | Only `research/study-156-2026-10-27/` untracked. Nothing staged; nothing committed by this study | `git status --short` |
| Release status | `NO_GO_NOT_VERIFIED` | Stage A and V0 records |
| Blocker B-018 | OPEN. This study does not clear it | `.jrs/state/BLOCKERS.json` |

## 2. Governing scope

| Rule | Source | Effect on this study |
|---|---|---|
| The local-development profile covers completed, non-HR supplier-access exception drafts. Employment, housing, lending, insurance, medical and legal-outcome decisions are excluded | `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`, line 20 | The default profile refuses every study record. 20 of the 24 originals concern excluded or ambiguous domains, so their research use needs owner decision SC-1 |
| Credentials are never accepted in conversation; `ANTHROPIC_API_KEY` is never in committed files | `CLAUDE.md` 22 and 36.2 | No credential read or used; transport takes a variable name only, and refuses SDK-reserved names |
| No commit or push of this package without explicit owner approval | Assignment | Nothing committed |

## 3. Engine versions

| Version | Status | Identity |
|---|---|---|
| 0.3.1-candidate | Engine of record, frozen | Phase 7 manifest `815c5d56...25c3` |
| 0.3.2-candidate | V0-02 correction (RP-CON-02), not adopted | Manifest `2276bbc2...0f18` |
| 0.3.3-research-candidate | This study's research candidate (0.3.2 plus an inert, flag-gated profile), not adopted | `CANDIDATE_0.3.3_MANIFEST_SHA256.txt` `fad69b62...0477` |
| Stage A live pilot | Stopped under SR-LP-14. Its authorization `STAGE-A-AUTH-20261025-01` is spent and refused by this study's gate (transport test T36) | `research/stage-a-revised-study-2026-10-25/` |

## 4. Baseline test suites at study start

Two runs were made before any study code.
- **Working tree:** the study package present (`reports/baseline-evidence/working-tree-2026-10-27T0655/`).
- **Clean HEAD:** a temporary worktree of HEAD (`reports/baseline-evidence/clean-head-worktree-2026-10-27T0710/`). It was removed after the run.

| Suite | Working tree | Clean HEAD worktree | Classification |
|---|---|---|---|
| `tests/engine-assurance/run.mjs` | exit 0 | not rerun | Passing |
| `tests/engine-evidence-contract/run.mjs` | exit 0 | not rerun | Passing |
| `tests/manifest/run.mjs` | exit 0 | not rerun | Passing |
| `tests/platform-evaluation/run.mjs` | exit 0 | not rerun | Passing |
| `tests/engine/retention.mjs`, `score-holdout.mjs` | exit 0 | not rerun | Passing |
| `tests/engine-remediation-phase7/run.mjs` | exit 1, 4 FAIL lines | exit 1, 4 FAIL lines | Present at HEAD |
| `tests/engine-reliability/run.mjs` | exit 1, 6 FAIL lines | exit 1, 6 FAIL lines | Present at HEAD |
| `tests/engine-adaptive-reliability/run.mjs` | exit 1, 2 FAIL lines | exit 1, 2 FAIL lines | Present at HEAD |
| `tests/engine-human-review-phase9/run.mjs` | exit 1, 6 FAIL lines (312 of 318) | exit 1, 6 FAIL lines | Present at HEAD |
| `tests/engine/activity-projection.mjs` | exit 1, 6 FAIL lines | exit 1, 6 FAIL lines | Present at HEAD (needs a service key that is not available offline) |
| `tests/engine-governance-phase8/run.mjs` | exit 1, 42 FAIL lines | exit 1, 39 FAIL lines | 38 present at HEAD. 4 only in the working tree, from new-file footprint guards that see the untracked study package. 1 only in the clean worktree: a worktree artifact, "branch unchanged", because a detached worktree is not on the branch |

**Reading.** No baseline failure was introduced by study code. The checks that fail at HEAD pin the repository to an earlier commit (`428c307`) or to an earlier untracked-file set, so they report later commits by design. Re-baselining them is not authorized. Earlier records give the drift guard as 160 checks, 37 failed, 2 skipped, the same failure set as its recorded baseline. It was not rerun for this register.

## 5. Records at study start

| Cohort | Count | Text held | Note |
|---|---|---|---|
| Original study records | 24 | 24 | Public; LLM-reproduced key; no human review recorded |
| Public cases | 32 | 0 | Metadata and a human JRS read held; source text not held |
| Synthetic records | 100 slots | 0 at start | Missing in inventory v1; 100 disclosed replacements created and sealed before any research-profile code (`seals/corpus`, `19a2c89e...7f5b`) |

Full inventory: `registers/RECORD_INVENTORY_V2.json` and `registers/RECORD_INVENTORY.md`.

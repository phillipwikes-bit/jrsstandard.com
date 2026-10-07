# Evaluation-readiness baseline, 2026-10-07 (internal)

Machine-readable form: `tools/evaluation-readiness/baseline.json`. Recorded before any change made by the controlled independent-evaluation readiness package.

## Current implementation, target and absent evidence
- **Current implementation:** the state below was observed from the repository and its tests on 2026-10-07.
- **Target:** a future independent evaluation prepared by the readiness package; nothing in this record describes one as run.
- **Absent:** independent evaluation evidence, reviewer attestations, counsel determinations, an owner release authorization and independent production QA.

## Repository state at start
| Item | Value |
|---|---|
| Branch | `claude/engine-local-candidate-2026-10-06`, tracking `origin/claude/engine-local-candidate-2026-10-06` |
| Start HEAD | `7205eea`; worktree clean; level with its remote and with `origin/main` (`97087e9`) |
| Draft PR | #39, open, draft, not merged |
| Frozen corpus commit | `1717f1b` |
| Frozen-demo package commit | `7205eea`, status `DEMO_PREPARATION_COMPLETE_NOT_RELEASED`, verifier `EXACT_REPLAY_CONFIRMED` |

## Suites at start
Every existing suite passed except the release-gate suite. Its validator failed because the record still named `afd6b44` as the candidate source commit, while `7205eea` had changed `lib/engine-candidate/dev-material.js`. That was corrected in `ccbd55b`, before this package; no gate status changed. The guard suite is not green: 164 checks, 37 failed, 1 skipped, triaged in `LEGACY_GUARD_FAILURE_TRIAGE_RECORD.md`.

## Release gates (unchanged)
| Gate | Status |
|---|---|
| RG-1 | BLOCKED |
| RG-2 | BLOCKED |
| RG-3 | NOT_ASSESSED |
| RG-4 | BLOCKED |
| RG-5 | BLOCKED |

Conclusion `INCOMPLETE_GATES_OPEN`. The record creates no production, licensing, sale, evaluation or real-record authorization.

## Deployment exclusion relied on
`.vercelignore` excludes `*.md`, `tools/`, `tests/`, `lib/`, `research/`, `.jrs/`, `standard/` and `scripts/`. A JSON or other non-Markdown file under `docs/` would be served; this package writes none there. Every changed path is checked with `git check-ignore` against `.vercelignore`, never assumed.

## Conflicts between the brief and the repository
| ID | Conflict | Resolution |
|---|---|---|
| CF-01 | The brief names the conditions Reconstructability, Identifiable basis, Chronology integrity, Reasoning traceability and Sufficiency. The repository names them RC1 Reconstructability, RC2 Basis Identification, RC3 Chronology, RC4 Decision-Process Traceability and RC5 Evidentiary Sufficiency. | The repository names govern. The brief's labels resolve to the same five IDs and are never stored in their place. |
| CF-02 | The brief asks for all terminology to be mapped to the five conditions. Owner decisions D-2 and D-3 forbid asserting a correspondence between Engine candidate keys and Codebook conditions without an owner-approved record. | Reviewer findings map to the five conditions. Engine candidate output is held apart with no correspondence asserted. |
| CF-03 | The brief assumes a frozen Codebook. Codebook v1.0 is hash-bound but not frozen for evaluation by any owner record, and the page classifies all five conditions as Experimental. | The freeze is recorded as `NOT_FROZEN` with the owner as authority; intake and interpretation stay closed. |
| CF-05 | The brief lists the release-gate suite among passing baselines. | It failed at start; corrected in `ccbd55b`. |
| CF-06 | The frozen-demo manifest's `source_commit` names `7bfb13e`, but the module bytes it binds by hash are those of `7205eea`. | The hash binding is exact and the label imprecise. Recorded here, not edited inside the frozen package. |

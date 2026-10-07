# Controlled independent-evaluation readiness package

**Internal. Planning only. Status `PLANNING_ONLY`. Not deployed** (`tools/` is excluded by `.vercelignore`). This package prepares the structure, intake controls, separated review workflow and evidence ledger for a future independent evaluation of the Review Engine. It does not run an evaluation or simulate one, and it holds no record, reviewer, label or result. It does not itself provide independent validation evidence, and it advances no release gate.

Protocol: `docs/architecture/CONTROLLED_INDEPENDENT_EVALUATION_READINESS_PROTOCOL.md`.

## Use
| Command | Effect |
|---|---|
| `node tools/evaluation-readiness/verify-readiness.mjs` | Verifies every control on synthetic probes; exit 0 only on `PLANNING_ONLY_CONTROLS_CONFIRMED` |
| `node tools/evaluation-readiness/validate-intake.mjs <declaration.json>` | Checks one intake declaration (metadata and a digest, never a record). Intake is closed, so the best outcome is `WELL_FORMED_NOT_ADMITTED`. |
| `node tests/evaluation-readiness/run-all.mjs` | Tests and the mutation run (`--quick` skips the mutations) |

## Files
| File | Role |
|---|---|
| `baseline.json` | Start state, suite results, exclusion rules, gates and recorded conflicts with the brief |
| `legacy-guard-triage.json` | The 37 failing guard checks, by function, category and required next action |
| `readiness-contract.json` | Seven categories: current implementation, target architecture, synthetic fixture, independent evidence (NOT_PRESENT), human attestation (REQUIRED_UNFILLED), release authorization (ABSENT), counsel determination (ABSENT) |
| `readiness-registry.json` | Planning-only run registry: intake closed, no freezes, the full run-binding template, an empty run list |
| `codebook-mapping.json` | RC1 to RC5 under their canonical names, bound to Codebook v1.0; candidate keys held apart with no correspondence asserted |
| `authority-matrix.json` | What Claude Code may prepare and what each human role must do |
| `ledger/future-run-ledger.json` | The append-only run ledger (genesis planning record only) |
| `templates/` | Blank templates; never filled with record content |
| `lib/intake.js` | Intake validator (INT-00 to INT-11) |
| `lib/registry.js` | Run-binding classifier (REG-01 to REG-08) |
| `lib/workspace.js` | Extraction, interpretation, comparison and adjudication workspaces (WS-00 to WS-11) |
| `lib/ledger.js` | Ledger checks (LED-01 to LED-07) |
| `lib/scan.js` | Repository scan for evaluation source text (SCAN-01 to SCAN-04) |
| `lib/probes.js` | SYNTHETIC control probes; no record content |
| `lib/verify.js` | The fail-closed verifier (sections A to K) |

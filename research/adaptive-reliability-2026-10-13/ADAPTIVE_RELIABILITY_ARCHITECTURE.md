# Adaptive Reliability Architecture (0.4.1-local)

Local ID: ARC-DOC-01 (NON-CANONICAL). Change-control version `0.4.1-local-change-control`. Baseline Engine: v0.3 (`jrs-engine-local-0.3.0-evidence-graph`), frozen at commit `5d5374b`. History: `CHANGELOG.md`.

## Local engineering claim
A local system records local failures and requirement changes as knowledge, compiles requested changes into proposals, observes what each proposed patch actually does in an isolated copy, records drift, and blocks or refuses proposals whose observed or stated effect crosses a specified boundary. It does not modify the Engine. Automated controls identify specified local risks; human review remains required for every proposal, and reworded or unrecognised bypass attempts may remain possible.

Lifecycle: observed local issue, knowledge entry, requested change with an inline isolated patch, observed-change record, proposal state, impact analysis, regression plan, human review. A human disposition is recorded only by a person, outside this system.

## Local evidence
| Component | Code | Artifacts |
|---|---|---|
| Reliability Knowledge Base | `lib/engine-change-control/knowledge-base.mjs` | `knowledge-base/KNOWLEDGE_BASE.jsonl` (60 entries, hash-chained) |
| Run identity | `identity.mjs` | identity block on every observed-change, drift, corpus, mutation and performance record |
| Observed-change records | `observed-change.mjs` | `proposals/OBSERVED_CHANGES.json` (13 records) |
| Change Proposal Compiler | `proposal-compiler.mjs` | `proposals/PROPOSALS.json` (32 requests) |
| Change Impact Analyzer | `impact-analyzer.mjs` | `proposals/IMPACT_ANALYSES.json` |
| Regression selection | `regression-selector.mjs` | `proposals/REGRESSION_PLANS.json` |
| Metamorphic Stability Laboratory | `stability.mjs`, `stability-laboratory/transforms.mjs` | 24 transforms (8 lower-baseline) |
| Behavioral Drift Ledger | `drift-ledger.mjs` | `drift-ledger/DRIFT_LEDGER.json` |
| Corpus expansion | `corpus-protocol.mjs`, `corpus-replay.mjs`, `generate_corpus.py` | AR-001 to AR-050 with executable expectations |
| Gate simulator | `gate-simulator.mjs` | `gate-simulator/GATE_SIMULATION.json` |
| Operator Review Console | `operator-console/` | 8 examples, 16 screenshots |
| Determinism and performance | `performance/run-performance.mjs` | `PERFORMANCE_RECORD.json` |
| Tests | `tests/engine-adaptive-reliability/` | 143 probes, 91 mutations |

Proposal states: `awaiting_human_review`, `blocked_missing_observed_change`, `blocked_pending_human_disposition`, `rejected_by_compiler`. None is an approval.

## No self-modification
No module writes to the Engine, prompts, rules, thresholds, scope, codebook mappings, refusal behaviour, model settings or release status. Isolated patches run in a temporary copy of the libraries outside the repository, deleted after each run. Suite section A diffs every prior-version and protected path against `5d5374b`.

## Interpretation
Proposal risk now comes from what a patch was observed to do on the synthetic fixtures, not from what its author declared.

## Limitation
Observation covers 85 synthetic fixtures only. Text checks are lexical. Observed-change records are hash-bound but not signed. All material is engineering-authored. See `ADAPTIVE_FAILURE_MODE_REGISTER.md`.

## External evidence still required
Owner decisions on pending and blocked proposals; counsel review of any data flow; independent labels and adjudication before any accuracy statement; resolution of B-018. Local controls do not establish external governance or release authority.

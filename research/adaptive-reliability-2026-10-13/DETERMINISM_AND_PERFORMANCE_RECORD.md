# Determinism and Performance Record (0.4.1-local)

Local ID: ARC-DOC-11 (NON-CANONICAL). Code: `performance/run-performance.mjs`. Records: `performance/PERFORMANCE_RECORD.json`, `performance/BUDGET_FAILURE_RECORDS.json`.

## Local engineering claim
Over 109 synthetic cases (35 v0.3 fixtures, 50 AR fixtures, 24 stability transforms), repeated local runs produce one output hash, serialisation and ordering are stable, and all nine local budgets held. The record carries complete run identity.

## Local evidence
| Budget | Text | Result |
|---|---|---|
| B-01 | output hash identical across 5 repeated deterministic runs | held |
| B-02 | graph serialisation round-trips byte-identically | held |
| B-03 | nodes and edges sorted by id in every graph | held |
| B-04 | no network attempt | held |
| B-05 | no malformed or oversized input returns a favourable finding (10 inputs) | held |
| B-06 | no failed run recorded as complete (injected failure) | held |
| B-07 | no temporary output in a fixture source directory (tree hashes) | held |
| B-08 | a failed build leaves no partial artifact (two injected failures) | held |
| B-09 | 8000 characters proceeds; 8001 refused | held |

Recorded run (Node v22.22.0, linux-x64): five passes of 109 cases took 1.12 to 1.66 seconds each; per-case minimum 2.9 ms, median 12.5 ms, p95 22.7 ms, maximum 62.3 ms; heap used after the passes about 17.3 MB. Values change between runs. Run identity: change-control and baseline package hashes, fixture hashes, command, run id, execution mode `local_measurement`, `synthetic_local_only: true`.

The full Phase 4 build (all observed-change records) takes about 24 seconds locally.

## Interpretation
Within this machine and corpus, the compiler is repeatable and fails closed on the malformed inputs tried.

## Limitation
Bounded local engineering measurements on one machine and synthetic fixtures. Not production performance, scalability, reliability or service-level evidence. B-08 counts staging directories across the whole system temp area, so concurrent runs could raise a spurious breach.

## External evidence still required
Any performance statement about a deployed service would need production measurement under an authorised plan.

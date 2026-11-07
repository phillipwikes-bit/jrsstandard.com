# Phase 3 Handoff: Evidence Graph Compiler and Sealed Evaluation Factory

Local ID: EGC-DOC-14 (NON-CANONICAL). Date: 2026-10-13. Branch working tree: `claude/engine-assurance-2026-10-10` at `882e4f5` (draft PR #40). **Uncommitted; not pushed; not deployed.**

## Claim
`jrs-engine-local-0.3.0-evidence-graph` is built locally with a quote-only model contract, a deterministic evidence graph, an independent graph validator, a static workbench and a Sealed Evaluation Factory that refuses every package. Prior versions are unchanged.

## Local engineering evidence

### v0.1 results (unchanged)
Replay 31/31; suite 148/148; 0 network attempts.

### v0.2 results (unchanged)
Replay 52/52 (31 contract, 16 bridge, 5 long-record); suite 123/123; 0 network attempts.

### v0.3 results
- Replay `tools/engine-evidence-graph-replay.mjs --clock 2026-10-10T00:00:00Z`: 35/35 fixtures pass; `execution-record/EXECUTION_RECORD.json`.
- Suite `tests/engine-evidence-graph/run.mjs`: 140 checks, 140 passed, 0 failed, 0 skipped.

### Mutation results
47 mutations, 47 killed, 0 survived, 58 direct probes passing on the unmutated library. M-13 and M-17 survived an earlier run; two isolating probes were added and no guard was changed. Full table: `MUTATION_TEST_RECORD.md`.

### Workbench rendering
Six examples (GC-001, GC-002, GC-003, GC-004, GC-006, GC-008), fourteen sections each, 12 screenshots (desktop 1280, mobile 390), 0 non-file requests, 0 pages with horizontal overflow.

### Factory separation checks
Registry: 1 entry (EVAL-LW-001, `not_authorized_to_execute`), 0 chain problems. Example packages P-00 to P-11: 12 of 12 refused, each for its intended reason plus missing owner authorisation, placeholder adjudicator and unsupported label independence. No package reaches any status other than refused or `not_authorized_to_execute`.

### Tests
| Run | Result |
|---|---|
| `tests/engine-evidence-graph/run.mjs` (final) | 140 checks: 140 passed, 0 failed, 0 skipped; 0 network attempts |
| v0.1 and v0.2 replays and suites | All pass, unchanged |
| `tests/engine/activity-projection.mjs` | 6 of 17 fail (inherited, unchanged) |
| `tests/platform-evaluation/engine-to-manifest.mjs` | Fails (inherited, unchanged) |
| `scripts/check_zero_drift.py` | 36 failed of 164, 1 skipped; all 36 in the previously recorded set; 0 new |
| `git diff --check` | Clean |

### Inherited failures
Drift suite 36 (37 on a day with no tracker entry, from the date-dependent tracker check); activity projection 6; engine-to-manifest 1. None changed.

### New failures
None in the final runs. Defects found during the build and their corrections are listed in `FAILURE_MODE_REGISTER.md` and `MUTATION_TEST_RECORD.md`. Two were test-side corrections (probe record length; mutation text) and are disclosed there.

### Skipped tests
None. The v0.3 suite ran 140 checks with 0 skipped (earlier runs skipped the document checks only because the documents did not yet exist). The drift suite skips 1 check that needs a network (not reachable, not drift), as before.

### Network, provider and external-record counts
Network attempts: 0 (trap active in replay, suite, factory builder and workbench builder; screenshots aborted 0 non-file requests). Provider calls: 0. External, public, customer or employee records accessed: 0. Holdouts created: 0. Labels created: 0.

### Files created (all untracked)
- `lib/engine-evidence-graph/` (contract, record, quote-resolution, assertions, contradictions, conditions, controls, scope, response, compiler, graph-validate, evaluation/factory)
- `tools/engine-evidence-graph-replay.mjs`
- `tests/engine-evidence-graph/run.mjs`, `probes.mjs`
- `research/evidence-graph-compiler-2026-10-10/`: prompt contract, fixtures GC-001 to GC-035 with generator and register, execution record, version lineage (4 files), sealed evaluation factory artifacts, workbench (builder, screenshot script, rendered pages, screenshots), and the fourteen documents.

### Files changed
`research/MASTER_TRACKER.md` (one appended line). No other tracked file changed.

## Interpretation
The package shows that a quote-only contract, a typed graph and fail-closed validation can be built and mechanically checked on synthetic material, and that the factory blocks local work from being presented as independent evaluation.

## Limitation
All fixtures and expected results were authored by the same engineering process as the code. Candidate responses are mocks. Nothing here measures how a live model behaves, whether findings are correct, or whether reviewers find the output useful.

## Unverified matters
- Live model compliance with the quote-only prompt (`PROMPT_v0.3.0.txt` has never been sent).
- Correspondence of the five conditions to Codebook RC1 to RC5 (NOT ESTABLISHED).
- Coverage of excluded-domain and injection phrasing beyond the listed patterns.
- Whether the authority matrix and protocol template are acceptable to the owner and counsel.

## External evidence still required (decisions needed before any live-model test)
1. Owner decision whether a live-model test is wanted at all, and its scope.
2. Resolution of B-018 (remains open).
3. Counsel review of the data flow, including what record text may be sent to a provider.
4. Authorised synthetic or real data source and its classification.
5. Freeze of prompt, codebook and compiler hashes, recorded in the registry.
6. Named independent labelers and adjudicator, if any accuracy statement is intended.
7. Credential handling: provider key read only from the environment, never committed or pasted.
8. Change to `NO_GO_NOT_VERIFIED` only by recorded owner decision.

This package is a local Evidence Graph Compiler and sealed evaluation-preparation system. It does not establish independent accuracy, semantic validity, adjudicated performance, operational reliability, production readiness, security effectiveness, legal compliance, licensing readiness, or sale readiness.

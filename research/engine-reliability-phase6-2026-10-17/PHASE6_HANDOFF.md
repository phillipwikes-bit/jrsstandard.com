# Phase 6 Handoff: Controlled Reliability, Regression and Adaptation Framework (0.6.0-local)

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

Release status `NO_GO_NOT_VERIFIED` is unchanged. Passing a local test here does not establish performance on real records or in any deployment.

| Item | Value |
|---|---|
| Branch | `claude/engine-reliability-phase6-local`, local only |
| Starting commit | `428c307` (PR #40 head, unchanged) |
| Commits, pushes, PR activity, deployments | none |
| Provider calls, network attempts, real records, holdouts, credentials | 0 |
| B-018, trackers, canonical records, public pages, routes, deployment files | unchanged |
| Engine packages v1, v0.1, v0.2, v0.3, Phase 4 | unchanged (no tracked file differs from `428c307`) |

## What the framework does

1. **Baseline manifest.** Records the observable behaviour of all 192 earlier synthetic scenarios with deterministic hashes.
2. **Regression library.** 62 new synthetic scenarios whose expected safe behaviour was sealed before execution.
3. **Router and replay tool.** A differential router classifies every behaviour difference, routes it to a person or fails closed, and never applies a change. A replay tool verifies the current Engine against the baseline.
4. **Knowledge register.** An append-only, hash-chained register of 14 engineering findings.
5. **Stability, mutation, determinism and budgets.** 27 stability transforms, 64 mutations, five-pass determinism and local budgets.
6. **Static workbench.** Nine read-only pages.

## Local engineering evidence

### Phase 6 checks that pass

| Area | Result |
|---|---|
| Baseline | 192 of 192 earlier scenarios recorded; manifest hash reproduced on rebuild; router finds no behavioural difference |
| Regression library | 62 scenarios (minimums met in all eight categories); seal holds; current run equals the first run |
| Stability | 27 transforms (10 invariant, 7 of them from a non-favourable base); 25 as expected, 2 reproduced predicted failures, 0 unexpected |
| Mutation | 64 introduced, 64 killed by a direct probe, 0 survived, 0 load failures (after the owner-authorized MU-51 repair) |
| Determinism | Five full passes: identical library, record, stability, baseline and graph hashes |
| Performance (local budgets only) | All five within budget; see `PERFORMANCE_RECORD.md` |
| Workbench | 9 pages; desktop and mobile renders with JavaScript disabled; 0 non-file requests; no horizontal overflow; no script, form, upload or network URL |
| Full Phase 6 suite | See `EXECUTION_RECORD.md` and `execution-record/TEST_RESULTS.json` |

### Unchanged prior-version results

The four earlier suites were re-run unmodified after the Phase 6 files were added:

| Suite | Before Phase 6 | After |
|---|---|---|
| v0.1 `tests/engine-assurance` | 148/148 | 148/148 |
| v0.2 `tests/engine-evidence-contract` | 123/123 | 123/123 |
| v0.3 `tests/engine-evidence-graph` | 140/140 | 140/140 |
| Phase 4 `tests/engine-adaptive-reliability` | 269/269 | **268/269** (see the next section) |

### Cross-package check affected by the new Phase 6 tool path

**Declared cross-package compatibility conflict: unresolved, not fixed.**

- The Phase 4 check `tools unchanged since 5d5374b` now fails.
- It reports the path `tools/engine-reliability-replay.mjs`.
- That check fails whenever any changed or untracked file exists under `tools/`.
- The Phase 6 assignment requires this new file at exactly that path. No existing file under `tools/` was changed, and the Phase 4 suite was not modified.
- The other 268 Phase 4 checks pass.

Owner decision OD-02. Evidence: `execution-record/PRIOR_SUITE_RESULTS.json`.

### Reproduced predicted failures

There are 10 library scenarios and 2 transforms. Their failures were predicted before execution and reproduced exactly:
- P6K-001: presence without semantic support
- P6K-002: negated rationale
- P6K-003: assessment after decision
- P6K-004: two expiry dates
- P6K-005: no decision date
- P6K-006: duration against dates
- P6K-007: paraphrased control conflict
- P6K-008: reworded employment language

See `KNOWN_FAILURE_MODES.md` section B.

### Unexpected defect: P6-RT-07

- **What happens.** A candidate note attributing a motive makes the frozen v0.3 compiler fail its own graph self-validation (GV-11), because its refusal reason `prohibited_inference:motive` contains a word the output check forbids. No graph, refusal record or review route is produced.
- **Status.** This remains a documented open Engine defect (P6K-009). No fix, prompt change, public claim or release recommendation was made. The replay tool therefore ends with `human_review_required` (exit 10).

### Stop and owner-authorized repair

- **2026-10-17.** Mutation MU-51 survived and work stopped without repair.
- **2026-10-19.** On owner authorization, one direct probe was added that gives a finding two limitations. Nothing else was changed. The full mutation group was then re-run: 64 of 64 killed. See `MUTATION_TEST_RECORD.md` and `execution-record/POST_STOP_REPAIR_RECORD.json`.

### Framework defects found and closed while building, before the stop

| Entry | Defect |
|---|---|
| P6K-010 | The router trusted stored hashes |
| P6K-013 | Register append accepted a dangling supersedes reference |

Both were found by direct checks on Phase 6's own new code. No Engine package was involved.

## Independent evaluation evidence

**None.** Phase 6 produced no independent, adjudicated, real-world, holdout or production evidence.

- Every scenario, expectation, transform, probe and seal was produced by the same engineering session that wrote the framework.
- Agreement shows code doing what its author intended.
- It does not establish accuracy, semantic validity, reliability in use, legal compliance, or production, release, licensing or sale readiness.
- The register marks P6K-001, P6K-002 and P6K-008 as needing future independent evaluation (OD-07).

## Files created versus files changed

- **Changed:** none. `git diff --name-only 428c307` is empty.
- **Created (untracked):**
  - `lib/engine-reliability/` (9 modules)
  - `tests/engine-reliability/` (`run.mjs`, `probes.mjs`)
  - `tools/engine-reliability-replay.mjs`
  - `research/engine-reliability-phase6-2026-10-17/` (documents, baseline, library, stability, register, workbench, execution record)

## Owner decisions still required

OD-01 to OD-07 in `OWNER_DECISION_REGISTER.md`:
- OD-01: P6-RT-07 Engine change
- OD-02: Phase 4 tools-path conflict
- OD-03: router conservatism
- OD-04: disposition of reproduced failures
- OD-05: v0.2 long-record gate
- OD-06: whether and where to commit
- OD-07: future independent evaluation

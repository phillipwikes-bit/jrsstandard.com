# Execution Record

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

## Chronology

| Time (UTC) | Event |
|---|---|
| 2026-10-17 | Working tree clean at `428c307`; the PR #40 branch matched its remote-tracking reference (read locally, no fetch). Prior suites 148, 123, 140 and 269 checks all passing. Branch `claude/engine-reliability-phase6-local` created. |
| 2026-10-17 | Baseline built: 192 records; two independent builds byte-identical. |
| 2026-10-17 10:43:10 | 62 scenario expectations sealed (`sha256:1c81b496...b021`). |
| 2026-10-17 10:43:26 | Library first run: 51 as expected, 10 predicted failures reproduced, 1 unexpected (P6-RT-07). |
| 2026-10-17 10:52:27 | 27 transforms sealed. |
| 2026-10-17 10:52:38 | Stability first run: 25 as expected, 2 predicted failures reproduced. |
| 2026-10-17 | Mutation first run: 64 introduced, 63 killed; **MU-51 survived. Stopped and reported without repair.** |
| 2026-10-19 | Owner authorized one duplicated-limitation probe. Mutation re-run: 64 of 64 killed, 0 load failures. |
| 2026-10-19 | Five-pass determinism: all hashes identical. Local budgets all met. |
| 2026-10-19 | Workbench built (9 pages); 18 renders with 0 non-file requests and no overflow. |
| 2026-10-19 | Prior suites re-run unmodified: 148/148, 123/123, 140/140, 268/269 (declared tools-path conflict). |
| 2026-10-19 | Final full Phase 6 suite run with `--record` (totals below). |

## Commands

```
env -u ANTHROPIC_BASE_URL node research/engine-reliability-phase6-2026-10-17/build-artifacts.mjs
env -u ANTHROPIC_BASE_URL node tools/engine-reliability-replay.mjs
env -u ANTHROPIC_BASE_URL node tests/engine-reliability/run.mjs --record
NODE_PATH=$(npm root -g) node research/engine-reliability-phase6-2026-10-17/workbench/render-check.mjs
env -u ANTHROPIC_BASE_URL node tests/<prior suite>/run.mjs
```

## Final full Phase 6 suite

`env -u ANTHROPIC_BASE_URL node tests/engine-reliability/run.mjs --record` on 2026-10-19: **316 checks, 316 passed, 0 failed, 0 skipped**; network attempts 0. A confirming re-run after this line was written gave the same totals (`execution-record/TEST_RESULTS.json`).

## Records

| File | Content |
|---|---|
| `execution-record/TEST_RESULTS.json` | Final suite totals and any failed checks |
| `execution-record/MUTATION_EVIDENCE.json` | Every mutation, its area and the probes that killed it |
| `execution-record/DETERMINISM_RECORD.json` | Hashes from five passes |
| `execution-record/PERFORMANCE_MEASUREMENTS.json` | Budgets and observed times |
| `execution-record/STABILITY_EVIDENCE.json` | Per-transform results |
| `execution-record/WORKBENCH_RENDER_RECORD.json` | Per-page, per-viewport request and overflow results |
| `execution-record/PRIOR_SUITE_RESULTS.json` | Prior suites before and after, and the declared conflict |
| `execution-record/POST_STOP_REPAIR_RECORD.json` | The MU-51 stop and the authorized repair |

## Isolation

Every Phase 6 command refuses to start with a provider credential or endpoint configured. Each also traps every Node network API for the whole run. Trapped attempts across all runs: 0. Provider calls: 0. No real record, holdout, label or credential was used.

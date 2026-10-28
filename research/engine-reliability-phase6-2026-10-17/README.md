# Phase 6: Controlled Reliability, Regression and Adaptation Framework (0.6.0-local)

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.** Release status `NO_GO_NOT_VERIFIED` is unchanged.

This package holds a local framework that measures every future Engine change against a fixed behavioural baseline, replays it against synthetic scenarios, and routes every difference to a person or fails closed. It is not self-learning. It never changes an Engine version, applies a change, approves a change, adjusts a threshold or moves a result to a more favourable state.

Branch `claude/engine-reliability-phase6-local` (local only), started from `428c307`. Nothing is committed, pushed or deployed.

## Contents

| Location | What it holds |
|---|---|
| `lib/engine-reliability/` | Vocabulary, behaviour records and baseline manifest, collection from prior packages, regression library, differential router, stability runner, knowledge register |
| `tests/engine-reliability/` | Phase 6 suite (`run.mjs`) and direct probes plus 64 mutations (`probes.mjs`) |
| `tools/engine-reliability-replay.mjs` | Read-only verify and diff command |
| `baseline/` | `PHASE6_BASELINE_MANIFEST.json`, `PHASE6_BASELINE_SUMMARY.md`, `PHASE6_BASELINE_HASHES.json` |
| `regression-library/` | 62 scenario files, `EXPECTATION_SEAL.json`, `FIRST_RUN_RESULTS.json`, `LIBRARY_RESULTS.json`, authoring script |
| `stability-laboratory/` | 27 transforms, `STABILITY_SEAL.json`, first-run and current results |
| `knowledge-register/` | `KNOWLEDGE_REGISTER.jsonl` (append-only, hash-chained) and its entry source |
| `workbench/` | Nine static pages, render check and screenshots |
| `execution-record/` | Mutation, determinism, performance, stability, render, prior-suite and post-stop records, test results |

## Commands (all offline; each refuses to start with a provider credential or endpoint configured)

```
env -u ANTHROPIC_BASE_URL node research/engine-reliability-phase6-2026-10-17/build-artifacts.mjs
env -u ANTHROPIC_BASE_URL node tools/engine-reliability-replay.mjs
env -u ANTHROPIC_BASE_URL node tools/engine-reliability-replay.mjs --diff BEFORE.json AFTER.json [--context ctx.json]
env -u ANTHROPIC_BASE_URL node tests/engine-reliability/run.mjs [--record] [--only <group>]
node research/engine-reliability-phase6-2026-10-17/workbench/build-workbench.mjs
NODE_PATH=$(npm root -g) node research/engine-reliability-phase6-2026-10-17/workbench/render-check.mjs
```

Start with `PHASE6_HANDOFF.md`. Open `workbench/index.html` in a browser to inspect the recorded results.

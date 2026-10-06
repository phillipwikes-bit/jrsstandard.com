# Review Engine local development candidate 0.3.0-local.1

**Local development only. Not deployed, not validated, and connected to no model.** Owner instructions of 2026-10-06, under `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`. See `ARCHITECTURE.md` for the data flow, the boundary table and the Manifest decision.

## What it does
It examines one **completed, non-HR supplier-access exception draft** and returns a versioned result for a person to review:
- **Deterministic findings,** such as unreadable or partial input, omissions, unsupported content, instruction-like text, and every quotation located by offset, line and column.
- **Model-derived findings** behind a strict adapter boundary.
- **A human-review explanation** for every finding.
- **A pending disposition** for each finding, kept separate from a final sign-off.

There is no score, no DRR figure and no overall verdict. Human review is always required.

## Commands
Run these from the repository root. Tested on Node 22.22.0 only; other versions are not tested. There are no dependencies to install.

| Command | What it runs |
|---|---|
| `node tests/engine-candidate/run-all.mjs` | The complete suite, including the mutation run (36 seconds when measured in this container) |
| `node tests/engine-candidate/run-all.mjs --quick` | The same without the mutation run |
| `node tests/engine-candidate/eval/run-eval.mjs` | The corpus evaluation only. Add `--write <dir>` to write the JSON record. |
| `node tests/engine-candidate/mutation/run-mutations.mjs` | The 36 mutations: each safeguard is removed in a throwaway copy, and the suite must fail |
| `node tests/engine-candidate/regression/run.mjs --table` | The source-preparation regression set, case by case |

## Test material (development data only, never for a sealed holdout)
| Location | What | Expectations written |
|---|---|---|
| `tests/engine-candidate/fixtures/` | 3 constructed records | with the tests |
| `tests/engine-candidate/regression/cases.json` | 24 source-preparation cases, 7 of them hard | before first run (`fd6a58a`) |
| `tests/engine-candidate/corpus/v0.1.0/` | 15 corpus records CR-001 to CR-015, with mock responses | before the runner, adapter and harness existed (`804f313`) |

All 42 texts are listed in `dev-material.js`, which any future holdout builder must use to refuse them.

## Current results (constructed-development evidence only)
- **Corpus evaluation:** 15 of 15 records match their expected findings. This shows the software behaves as specified given scripted responses. It says nothing about any real model or real record. The record is in `tests/engine-candidate/eval/records/`.
- **Source-preparation regression:**
  - 18 of 24 cases match: all 17 ordinary cases and 1 of 7 hard cases.
  - The six divergences are recorded in `regression/KNOWN_DIVERGENCES.json` and are not fixed.
- **Mutations:** 36 of 36 caught.

## Limitations (NOT ESTABLISHED)
- Accuracy, on any record. No real model has been run, and the mock answers what it is scripted to answer.
- The source-preparation heuristics on real records. Six known divergences already appear on constructed cases.
- Whether the reference prompt yields contract-conforming output from any real model.
- Whether `dev-material.js` is enough to keep test material out of a holdout. It misses edited copies.
- Fitness for any use. No release gate is passed.

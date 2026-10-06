# Review Engine local development candidate 0.4.0-local.1

**Local development only. Not deployed, not validated, and connected to no model.** Owner instructions of 2026-10-06, under `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`.
- `ARCHITECTURE.md` covers the data flow, the boundary table and the Manifest decision.
- `RUNBOOK.md` covers the failure modes and the recovery steps.

## What it does
It examines one **completed, non-HR supplier-access exception draft** and returns a versioned result for a person to review:
- **Deterministic findings,** such as unreadable or partial input, omissions, unsupported content, instruction-like text, and every quotation located by offset, line and column.
- **Model-derived findings** behind a strict adapter boundary.
- **A human-review explanation** for every finding.
- **A pending disposition** for each finding, kept separate from a final sign-off.

Every finding and disposition is bound to one review version. `reviewer-packet.js` turns a result into a machine-readable packet for a reviewer. There is no score, no DRR figure and no overall verdict. Human review is always required.

## Commands
Run these from the repository root. Tested on Node 22.22.0 only; other versions are not tested. There are no dependencies to install.

| Command | What it runs |
|---|---|
| `node tests/engine-candidate/run-all.mjs` | The complete suite: 16 suites, including the mutation run |
| `node tests/engine-candidate/run-all.mjs --quick` | The same without the mutation run |
| `node tests/engine-candidate/eval/run-eval.mjs` | The corpus evaluation only. Add `--write <dir>` to write the JSON record. |
| `node tests/engine-candidate/mutation/run-mutations.mjs` | The 63 mutations: each safeguard is removed in a throwaway copy, and the suite must fail |
| `node tests/engine-candidate/regression/run.mjs --table` | The 24-case source-preparation regression set |
| `node tests/engine-candidate/confirmation/run.mjs --table` | The 47-case confirmation corpus |

## Test material (development data only, never for a sealed holdout)
| Location | What | Expectations written |
|---|---|---|
| `tests/engine-candidate/fixtures/` | 3 constructed records | with the tests |
| `tests/engine-candidate/regression/cases.json` | 24 source-preparation cases | before first run (`fd6a58a`) |
| `tests/engine-candidate/corpus/v0.1.0/` | 15 corpus records, with mock responses | before the runner, adapter and harness existed (`804f313`) |
| `tests/engine-candidate/confirmation/v0.1.0/` | 47 confirmation cases | before the source-prep 0.3.0 fix (`759ea86`) |

All 89 texts are listed in `dev-material.js`, and `tests/engine-candidate/shared/dev-index.mjs` loads them for the contamination screen.

## Current results (constructed-development evidence only; tallies, not rates)
| Set | Before the source-prep 0.3.0 fix | After |
|---|---|---|
| Regression set, 24 cases | 18 of 24 (6 recorded divergences) | 24 of 24. The six divergences are kept as history, marked resolved. |
| Confirmation corpus, 47 cases | 24 of 47 | 47 of 47, on its single post-fix run |
| Corpus evaluation, 15 records, mock adapter | 15 of 15 | 15 of 15 |

The mutation run catches 63 of 63.

## Limitations (NOT ESTABLISHED)
- **Accuracy, on any record.** No real model has been run, and the mock answers what it is scripted to answer.
- **The confirmation corpus is not independent in authorship.** The same author wrote its cases and the 0.3.0 rules, with the rules in mind. It was committed before the fix, so its result is not fitted after the fact, but it shows the rules behave as designed on constructed cases. It does not show that they generalise.
- **One confirmation case (K21) reuses a regression sentence.** The overlap is recorded in `confirmation/v0.1.0/DIVERGENCES.json` and pinned by a test.
- **The source-preparation heuristics on real records** have not been tested.
- **The contamination screen** misses heavy paraphrase, and its thresholds are set by judgement, not measured.
- **Fitness for any use.** No release gate is passed.

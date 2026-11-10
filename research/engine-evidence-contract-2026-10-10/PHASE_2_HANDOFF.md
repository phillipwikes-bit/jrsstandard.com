# Phase 2 Handoff: Versioned Evidence Contract and Evaluation Workbench

**Date:** 2026-10-10 · **Working tree:** branch `claude/engine-assurance-2026-10-10` (draft PR #40), head `0fa62a1`, changes **uncommitted** as instructed · **Release status:** `NO_GO_NOT_VERIFIED` · **Gate impact:** none (Gate 1 remains FAIL) · Local identifiers in this package are NON-CANONICAL.

## 1. Relationship between historical v1 and local v0.2

- **Historical v1 (`0.1.0-validation`)** is preserved, unchanged, in two places. One is an exact blob copy with an element-hash manifest, `historical-reference/` (reference ID `HREF-v1-0.1.0-validation-baebb512`; the copy hashes to git blob `baebb512`). The other is its executable logic in `lib/engine-assurance/candidate-core.mjs` from the 0.1 package. Neither was modified. The tests fail if either changes.
- **Local v0.2 (`0.2.0-local-candidate`, contract `jrs-engine-local-0.2.0`)** is a separately versioned candidate in `lib/engine-evidence-contract/`. It reuses, without editing, the 0.1 record controls, claim guard, network guard and candidate core. It adds:
  - a strict evidence contract with offset-verified citations;
  - a new prompt specification, never sent;
  - a record boundary with instruction quarantine;
  - wider regulated-domain detection;
  - a long-record plan;
  - neutral remediation questions;
  - a v1 compatibility bridge;
  - an independent result validator;
  - a static workbench.
- **v0.2 does not replace v1** and no v1 result is migrated into v0.2. The bridge only compares. The condition correspondence is by v1 prompt label. Correspondence to Codebook conditions is NOT ESTABLISHED.
- **Public routes are untouched**: still 503 refusal stubs.

## 2. Files created and changed

**Created:**
- `lib/engine-evidence-contract/`: `contract.mjs`, `claims.mjs`, `strict-json.mjs`, `evidence.mjs`, `boundary.mjs`, `long-record.mjs`, `remediation.mjs`, `bridge.mjs`, `validator.mjs`, `result-validate.mjs`, `run.mjs`, `prompt.mjs`
- `tools/engine-evidence-contract-replay.mjs`
- `tests/engine-evidence-contract/run.mjs`, `tests/engine-evidence-contract/probes.mjs`
- `research/engine-evidence-contract-2026-10-10/`:
  - `historical-reference/` (`v1-review-engine.0177c51.js.txt`, `HISTORICAL_REFERENCE_MANIFEST.json`, `README.md`)
  - `prompt-contract/` (`PROMPT_v0.2.0.txt`, `PROMPT_MANIFEST.json`, `PROMPT_SPECIFICATION.md`, `PROMPT_RATIONALE.md`)
  - `fixtures/`:
    - `cases/`: 31 cases, each with record, submission and expected files, a mock candidate response for 30, and v1 output for 1
    - `bridge/`: 16 cases
    - `long-record/`: 5 cases
    - `FIXTURE_REGISTER.json`, `FIXTURE_REGISTER.md`, `generate_fixtures.py`
  - `workbench/` (`build-workbench.mjs`, `screenshot.mjs`, `rendered/` with 5 cases in HTML and text plus an index, `screenshots/` with EC-001, EC-002 and EC-003)
  - `execution-record/` (`EXECUTION_RECORD.json`, `MUTATION_EVIDENCE.json`)
  - documents: `EVIDENCE_CONTRACT_SPECIFICATION.md`, `PROMPT_CHANGE_CONTROL.md`, `COMPATIBILITY_AND_MIGRATION_ANALYSIS.md`, `LONG_RECORD_BOUNDARY.md`, `COGNITIVE_CONTROLS_BOUNDARY.md`, `EVALUATION_WORKBENCH_README.md`, `MUTATION_TEST_RECORD.md`, `KNOWN_FAILURE_MODES_AND_STOP_CONDITIONS.md`, `CHANGELOG.md`, this file

**Changed:** `research/MASTER_TRACKER.md` (one dated line appended to the running log, as CLAUDE.md §36.9 requires; no existing line altered).

**Not changed:** any file under `api/`, `lib/engine-assurance/`, `lib/manifest/`, `schemas/`, `openapi.json`, any HTML page, `vercel.json`, `.vercelignore`, `.jrs/` (B-018 untouched), the 0.1 package, or any historical record.

## 3. Reproducible command list

```sh
# from the repository root; unset the host's provider endpoint variable (the harnesses refuse otherwise)
env -u ANTHROPIC_BASE_URL node tools/engine-evidence-contract-replay.mjs --clock 2026-10-10T00:00:00Z
env -u ANTHROPIC_BASE_URL node tests/engine-evidence-contract/run.mjs --record research/engine-evidence-contract-2026-10-10/execution-record/MUTATION_EVIDENCE.json
env -u ANTHROPIC_BASE_URL node research/engine-evidence-contract-2026-10-10/workbench/build-workbench.mjs --clock 2026-10-10T00:00:00Z
NODE_PATH=$(npm root -g) node research/engine-evidence-contract-2026-10-10/workbench/screenshot.mjs
env -u ANTHROPIC_BASE_URL node tools/engine-assurance-replay.mjs --no-write
env -u ANTHROPIC_BASE_URL node tests/engine-assurance/run.mjs
node tests/engine/auth-matrix.mjs && node scripts/test_review_incomplete.mjs && node tests/public-route-alignment.mjs
node tests/engine/retention.mjs && node tests/engine/score-holdout.mjs && node tests/manifest/run.mjs && node tests/manifest/schema-1.0.1.mjs && node tests/platform-evaluation/run.mjs
node tests/engine/activity-projection.mjs; node tests/platform-evaluation/engine-to-manifest.mjs   # inherited failures
python3 scripts/check_zero_drift.py                                                                 # inherited failures
git diff --check
```

## 4. Results

**New in this work (all pass):**

| Command | Total | Pass | Fail | Skipped |
|---|---|---|---|---|
| v0.2 replay | 52 cases (31 contract, 16 bridge, 5 long-record) | 52 | 0 | 0 |
| v0.2 test suite | 123 checks | 123 | 0 | 0 |
| of which mutations | 17 | 17 killed | 0 survived | 0 |

**Pre-existing suites, re-run (pass, unchanged):**

| Command | Result |
|---|---|
| 0.1 replay | 31 fixtures, 31 pass |
| 0.1 suite | 148 checks, 148 pass |
| `auth-matrix` | 10 checks, 10 pass |
| `test_review_incomplete` | 1 pass |
| `public-route-alignment` | 17 checks, 17 pass |
| `retention` | 60 checks, 60 pass |
| `score-holdout` | 4 pass |
| `manifest/run` | 68 checks, 68 pass |
| `schema-1.0.1` | 8 pass |
| `platform-evaluation/run` | 12 of 12 pass |

**Inherited failures, unchanged, separate from the new work.** They are not passing tests and were not caused or corrected here:

| Command | Result | Inherited from |
|---|---|---|
| `tests/engine/activity-projection.mjs` | 17 checks, 6 fail | Closure commit `0fb5c07` deleted its target |
| `tests/platform-evaluation/engine-to-manifest.mjs` | fails at first assertion | Its target handler is now a 503 stub |
| `scripts/check_zero_drift.py` | 164 checks, 36 fail, 1 skipped | The same failure set as PR #40 head. Clean `main` shows 37; the 37th is the date-dependent tracker check, satisfied by the required tracker entry. 28 are closure-related and 8 are older. Attribution: `../engine-assurance-2026-10-10/INHERITED_FAILURES.md` |

**New failures introduced by this work: none.**

## 5. Confirmations

- **No provider call and no network request.** All harnesses trap `fetch`, `http`, `https`, `net`, `tls` and `dns` and recorded 0 attempts. The screenshot browser ran offline with every non-`file:` request aborted, and recorded 0.
- **No credential was used.** The harnesses refuse to start when one is present.
- **No external or public record was used.** All records are synthetic fixtures.
- **No deployment, commit, push, merge or new pull request.** PR #40 was not edited.
- **No public page, public API file or configuration was changed.**

## 6. Unresolved blockers

1. **B-018 OPEN.** The three controlling source-aligned files remain unavailable. The historical blob in git does not reconcile them.
2. **Gate 1 FAIL** and the four release gates (plus independent production QA) remain unmet.
3. **The v0.2 compatibility decisions need the owner's approval.** That covers the outcome mapping, refusal instead of truncation, instruction-risk routing, and the wider regulated-domain list.
4. **Inherited failures** need an owner decision: retire, rewrite, or keep as a record of the closure.
5. **Model identifier review date 2026-10-15** (`api/_model.js`).
6. **Public statement for review.** `review-engine.html` says "Findings are evidence-linked". v0.2 implements evidence linking locally only.

## 7. Decision required before any future live-model test

The owner must record, before any prompt is sent to any model:
1. the model and version;
2. the prompt version (`jrs-engine-local-0.2.0/prompt-1`, or a successor under `PROMPT_CHANGE_CONTROL.md`);
3. that inputs are synthetic only, unless counsel has reviewed real data flows;
4. where outputs are stored and for how long;
5. who reviews them;
6. that no evaluation-holdout material is used.

The decision should also settle **KF-01**: whether model-supplied offsets are required (the current contract, likely to route most findings to review), or whether a quote-only variant with validator-computed offsets should be specified as a new contract version. Either choice is a change to the system under test.

This package is a local engineering candidate and evaluation-preparation workbench. It does not establish independent accuracy, semantic-support validity, operational reliability, production readiness, security effectiveness, legal compliance, licensing readiness, or sale readiness.

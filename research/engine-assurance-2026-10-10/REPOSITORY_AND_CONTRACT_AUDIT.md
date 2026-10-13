# Repository and Contract Audit: JRS Review Engine Candidate

**Date:** 2026-10-10 · **Repository HEAD at audit:** `97087e915245a15808f121e2263a7385a6bf5a04` (branch `main`, clean before this work) · **Mode:** local inspection only. No deployment, push, commit, provider call or external record.

Labels follow CLAUDE.md Rule 2: **FACT** (inspected), **INFERENCE**, **NOT ESTABLISHED**, **REQUIRES HUMAN REVIEW**.

## 0. Controlling sources: availability

| Source named in the assignment | Status |
|---|---|
| `project_sources/01-01_JRS_Master_Asset_Register_Source_Aligned_2026-10-03.md` | **NOT PRESENT.** No `project_sources/` directory exists; `find /` and `git log --all` return no file matching `Source_Aligned` or `Architectural_Blueprint`. |
| `project_sources/02-02_JRS_Evidence_Ledger_Source_Aligned_2026-10-03.md` | **NOT PRESENT.** Same search. |
| `project_sources/03-03_JRS_Master_Architectural_Blueprint_Aligned_2026-10-03.txt` | **NOT PRESENT.** Same search. |
| `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` | **FACT, read.** It records the SHA-256 of the three files (prefix `01_`, `02_`, `03_`, not `01-01_` as named in the assignment) and states they were "supplied outside this repository". |

**Consequence.** The handoff's startup step 4 says that if these files are unavailable for a task involving release status or public claims, stop and report. This work changes no release status and no public claim; it is local engineering under the "Allowed work" list of the same handoff. The work therefore proceeded on the in-repository handoff and the assignment text, and the missing sources are recorded as **blocker B-018** (`.jrs/state/BLOCKERS.json`). Every statement below that would depend on the dated supplement in the Evidence Ledger is marked **NOT ESTABLISHED**. A filename discrepancy also exists: the assignment says `01-01_...`, the handoff records `01_...`.

## 1. Engine entry points and their status

| Entry point | FACT: current behaviour | Evidence |
|---|---|---|
| `api/review.js` | Refusal stub. Any POST returns 503 `controlled_review_unavailable`; no provider call. | file is 6 lines; `scripts/test_review_incomplete.mjs` passes |
| `api/review-engine.js` | Refusal stub, same body. | 6 lines; `tests/engine/auth-matrix.mjs` 10/10 |
| `api/v1/review-engine.js` | Refusal stub with `api_version: "v1"`. | 6 lines; same test |
| `api/_controlled-review.js` | Shared refusal module; declares four release gates. | 53 lines |
| `api/_manifest/{build,from-engine,canonicalize,hash}.js` | Manifest builder and v1 adapter. Still present and still exercised offline. | `tests/manifest/run.mjs` 68/68 |
| `lib/manifest/*.js` | Re-exports of `api/_manifest/`. | 2 lines each |
| `api/_model.js` | Model identifier default `claude-haiku-4-5-20251001`, review-by date **2026-10-15** (five days after this audit). | file |
| `tools/validate-manifest.js` | Offline subset validator for the Manifest schema. | file |
| `tools/score-engine-holdout.mjs` | Scores an externally prepared holdout; creates no reference truth. | `tests/engine/score-holdout.mjs` 4/4 |
| `tools/run-live-manifest-evaluation.mjs` | **A live-call path**: POSTs to `https://www.jrsstandard.com/api/v1/review-engine` with a bearer token. **Not run.** Against the current stubs it would receive 503. | file |

**FACT: the executable condition logic is not in the working tree.** Commit `0fb5c07` (2026-10-04, "Close public review intake and publish engine status") deleted 311 and 304 lines from the two Engine routes. The last executable candidate is blob `baebb512e5f296e1b41da138b7868aae4b6098fc` (`api/v1/review-engine.js` at commit `0177c5184182b5b1f51ff18c80da29f668996e49`). It contains: `ENGINE_VERSION = '0.1.0-validation'`, `API_VERSION = 'v1'`, the five `CONDITION_KEYS`, the v1 `SYSTEM_PROMPT`, `normStatus` (pass, review, gap only), `deriveDetermination` (gap, then review, then ready), the response parser, a fetch to the provider, bearer-token auth, a rate limiter and a Supabase write.

**Decision taken here (see CD-001).** The assurance package extracts the prompt, keys, normaliser, determination rule and parser **byte-for-byte** into `lib/engine-assurance/candidate-core.mjs`, with the provider injected and no network code. `lib/engine-assurance/provenance.mjs` re-reads the git blob and confirms identity on every run (`source_identity_status: candidate_core_matches_git_history`). The public routes are not touched.

`api/review.js` historically carried a **different** prompt (routing Low/Moderate/High/Critical, `flags`, `revisions`). It is not the v1 candidate and is not the subject of this package. CLAUDE.md §36.2 still describes `api/review.js` as calling Claude; that description is stale against the current stub (**FACT**; CLAUDE.md not edited, Rule 10).

## 2. Input and output schema versions

| Contract | Version label | Describes |
|---|---|---|
| `openapi.json` (public, root) | `info.version` **`0.1.0-local-candidate`** | A status contract for refusal stubs |
| Historical v1 handler | `ENGINE_VERSION` **`0.1.0-validation`** | The executable candidate |
| `.jrs/registries/RELEASE_REGISTER.json` | `0.1.0-validation`, sourced to "`api/v1/review-engine.js ENGINE_VERSION`" | A constant that no longer exists in that file |
| `schemas/jrs-decision-reconstruction-manifest.schema.json` | Manifest `1.0` | Manifest output |
| Root `jrs-decision-reconstruction-manifest-v1.0.schema.json`, `-v1.0.1.schema.json` | 1.0, 1.0.1 | Manifest (1.0.1 rejects unsupported versions; `tests/manifest/schema-1.0.1.mjs` 8/8) |
| v1 input | `POST {text, runs?, include_manifest?}`; text 40 to 8000 chars, truncated above 8000 | historical handler |
| v1 output | `{request_id, api_version, engine, engine_version, model, evidence_stage, disclaimer, reviewed_at, runs, result:{conditions{5 x {status,note}}, determination, remediation_note, finding}, variance?, manifest?}` | historical handler |
| **New, private:** Review Run Envelope | `jrs-review-run-envelope/0.1.0` | This package only |

**Differences recorded, not resolved:**

1. **Version label conflict.** Public `openapi.json` says `0.1.0-local-candidate`; the executable candidate and every Manifest fixture say `0.1.0-validation`. The envelope uses `0.1.0-validation` because that is the label of the code actually executed. Reconciling the public label is a public-contract change and is out of scope (B-016 freezes `openapi.json`).
2. **Condition vocabulary.** v1 emits `pass | review | gap`. The assignment requires `supported | gap | review_required | not_assessed`. Mapping is in CD-001; v1 vocabulary is preserved inside the Manifest.
3. **Release gates.** `api/_controlled-review.js` and `review-engine.html` list **four** gates. The 2026-10-05 handoff lists **five** (adds "independent production QA"). Recorded; not reconciled.
4. **Codebook mapping.** `standard/jrs-conditions.json` records every Engine-to-Codebook mapping as NOT ESTABLISHED. The envelope uses Engine keys only.

## 3. Test commands used and baseline results (before any change)

| Command | Result (exit) |
|---|---|
| `node tests/engine/auth-matrix.mjs` | 10 checks, 0 failed (0) |
| `node scripts/test_review_incomplete.mjs` | PASS (0) |
| `node tests/public-route-alignment.mjs` | 17 checks, 0 failed (0) |
| `node tests/engine/retention.mjs` | 60 checks, 0 failed (0) |
| `node tests/engine/score-holdout.mjs` | 4 checks passed (0) |
| `node tests/manifest/run.mjs` | 68 checks, 0 failed (0) |
| `node tests/manifest/schema-1.0.1.mjs` | 8 passed (0) |
| `node tests/platform-evaluation/run.mjs` | 12/12 (0) |
| `node tests/engine/activity-projection.mjs` | **17 checks, 6 failed (1).** Pre-existing: `api/engine-activity.js` was deleted by `0fb5c07`. |
| `node tests/platform-evaluation/engine-to-manifest.mjs` | **FAIL (1)** at its first assertion. Pre-existing: it calls the v1 handler expecting HTTP 200 and the handler is now a 503 stub. |
| `python3 scripts/check_zero_drift.py` | **164 checks, 37 failed, 1 skipped.** Pre-existing; failures include guards that look for `logReview` and the edge runtime in the deleted Engine routes. |

The two failing Engine tests and the drift failures are **inherited and left unchanged** (attribution in `INHERITED_FAILURES.md`). Repairing them means either restoring public route logic (prohibited by the handoff) or rewriting historical guards (a separate decision). They are recorded as open items for the owner.

## 4. Existing limitations and unresolved conflicts

- Engine accuracy is unvalidated; reproducibility is disclosed as distinct from accuracy (historical handler disclaimer).
- Model identifier review date 2026-10-15 is imminent; a model change changes the system under test (`api/_model.js`).
- The v1 candidate never produced exact source spans. Its notes are "grounded in the record text" by instruction only.
- `B-002`, `B-007`, `B-016` (contract and counsel matters) remain open in `.jrs/state/BLOCKERS.json`; Gate 1 is `FAIL` in `.jrs/state/ACTIVE_GATE.json`.

## 5. Places a public or historical document could be mistaken for proof of deployed behaviour

| Document | Why it could mislead | Status |
|---|---|---|
| `review-engine.html` (public) | States "Findings are evidence-linked and always require human review." The executable candidate produced notes, not exact evidence links. This package adds span-linking **locally only**. | **REQUIRES HUMAN REVIEW.** Not edited (public claim change prohibited). |
| `docs/engine-manifest-integration.md` | "Current code behavior: The versioned `POST /api/v1/review-engine` route accepts `include_manifest: true`..." The route is now a refusal stub. | Stale; not edited (historical record). |
| `platform-evaluation-result-001.json` (served at root) | "12 passed, 0 failed" from 2026-09-22 against the then-live handler with a mocked provider. Reads like a current result. | Historical; not edited. |
| `jrs-decision-reconstruction-manifest-example-v1.0.json` (served at root) | Example Manifest naming engine `0.1.0-validation` and model `claude-haiku-4-5-20251001`. Could be read as output of a running service. | Example; not edited. |
| `.jrs/registries/RELEASE_REGISTER.json` | Sources `engine_version` to a constant that no longer exists in the cited file. | Stale reference; not edited. |
| `CLAUDE.md` §36.2 | Describes `api/review.js` as a live Claude-calling function. | Stale; not edited. |
| `RESEARCH-ENGINE-DEPLOY.md` | Deployment guide for a separate study engine. | Unrelated to v1 candidate; noted only. |
| `tools/run-live-manifest-evaluation.mjs` | A live-call tool exists; its presence is not evidence that any live call succeeded recently. | Not run. |
| **This package's own outputs** | Envelopes and execution records describe mocked, synthetic runs. | Every envelope carries `release_status: NO_GO_NOT_VERIFIED`, `test_or_demo_status: synthetic_engineering_test`, and limitations L-01 to L-07. |

## 6. Can the implementation execute entirely offline with mocked dependencies?

**FACT, after this work: yes, for the candidate core.** `lib/engine-assurance/candidate-core.mjs` has no network code; the provider is an injected function. `tools/engine-assurance-replay.mjs` refuses to start if a provider credential or endpoint variable is set and traps `fetch`, `http(s)`, `net`, `tls` and `dns` for the whole run. The 2026-10-10 replay recorded **0** trapped attempts.

**Before this work: not as committed.** The only executable candidate was in git history; the working tree's Engine routes are stubs, and the last offline integration test (`engine-to-manifest.mjs`) fails because its target was removed.

**Host note.** The session environment sets `ANTHROPIC_BASE_URL` (a provider endpoint variable set by the hosting tool, not by this repository). The harness treats it as a network-capable configuration and refuses; local runs therefore use `env -u ANTHROPIC_BASE_URL`. No credential variable for any provider was set.

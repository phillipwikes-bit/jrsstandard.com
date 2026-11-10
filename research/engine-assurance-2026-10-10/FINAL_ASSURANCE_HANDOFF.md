# Final Assurance Handoff: JRS Review Engine Candidate

**Task:** Controlled Assurance Build Assignment · **Date:** 2026-10-10 · **Mode:** local, mocked, synthetic · **Repository HEAD:** `97087e915245a15808f121e2263a7385a6bf5a04` is the base; the package is committed on branch `claude/engine-assurance-2026-10-10` (cut from `main`) for preservation only. Not merged, not deployed · **Phase/Gate:** Gate 1 remains `FAIL`; this work moves no gate.

## Status statement

This work supports local engineering assurance and validation preparation only. It does not establish independent accuracy, production readiness, legal compliance, security effectiveness, commercial readiness, licensing readiness, or sale readiness.

## Current Engine version and source identity

| Item | Value |
|---|---|
| Engine version executed | `0.1.0-validation` (public `openapi.json` says `0.1.0-local-candidate`; conflict recorded, not resolved) |
| Codebook version | `1.0`; Engine-to-Codebook mapping NOT ESTABLISHED |
| Candidate source | `api/v1/review-engine.js` at commit `0177c5184182b5b1f51ff18c80da29f668996e49`, blob `baebb512e5f296e1b41da138b7868aae4b6098fc` (last executable revision before `0fb5c07` closed public intake) |
| Source identity status | `candidate_core_matches_git_history`: prompt, keys, normaliser, determination rule and parser are byte-identical to that blob (7 of 7 checks) |
| Public routes | Unchanged 503 refusal stubs |
| Assurance layer / envelope | `0.1.0-local` / `jrs-review-run-envelope/0.1.0` |

## Exact files changed

**Created (all excluded from deployment by `.vercelignore`):**

- `lib/engine-assurance/`: `candidate-core.mjs`, `provenance.mjs`, `versions.mjs`, `scope-gate.mjs`, `span-verify.mjs`, `cognitive-controls.mjs`, `content-guard.mjs`, `network-guard.mjs`, `envelope.mjs`, `run.mjs`
- `tools/engine-assurance-replay.mjs`
- `tests/engine-assurance/run.mjs`
- `research/engine-assurance-2026-10-10/`: `REPOSITORY_AND_CONTRACT_AUDIT.md`, `COMPATIBILITY_DECISION_CD-001.md`, `ENGINE_ASSURANCE_README.md`, `CAPABILITY_AND_LIMITATION_MATRIX.md`, `FAILURE_MODE_REGISTER.md`, `VALIDATION_READINESS_PROTOCOL.md`, `CHANGELOG.md`, `FINAL_ASSURANCE_HANDOFF.md`, `INHERITED_FAILURES.md`
- `research/engine-assurance-2026-10-10/contracts/`: `review-run-envelope.schema.json`, `SCHEMA_PIN.txt`, `REVIEW_RUN_ENVELOPE.md`
- `research/engine-assurance-2026-10-10/fixtures/`: `records/` (31), `requests/` (31), `provider-mocks/` (30), `expected/` (31), `FIXTURE_REGISTER.json`, `FIXTURE_REGISTER.md`, `generate_fixtures.py`
- `research/engine-assurance-2026-10-10/execution-record/`: `EXECUTION_RECORD.json`, `EXECUTION_RECORD.md`, `envelopes/` (31)

**Modified:** `.jrs/state/BLOCKERS.json` (B-018 appended; no existing row changed) `research/MASTER_TRACKER.md` and `research/IP_SALE_TRACKER.md` (one dated log line each, CLAUDE.md §36.9).

**Not modified:** any file under `api/`, `lib/manifest/`, `schemas/`, existing `tests/` and `tools/`, `openapi.json`, any HTML page, `vercel.json`, `.vercelignore`, `CLAUDE.md`, historical reports and registers.

## Exact local commands run, with results

| Command | Pass | Fail | Skipped | Exit |
|---|---|---|---|---|
| `env -u ANTHROPIC_BASE_URL node tools/engine-assurance-replay.mjs` | 31 fixtures | 0 | 0 | 0 |
| `env -u ANTHROPIC_BASE_URL node tests/engine-assurance/run.mjs` | 148 | 0 | 0 | 0 |
| `node tools/engine-assurance-replay.mjs` (with host `ANTHROPIC_BASE_URL` set) | refused, nothing ran | | | 3 (intended) |
| `node tests/engine/auth-matrix.mjs` | 10 | 0 | 0 | 0 |
| `node scripts/test_review_incomplete.mjs` | 1 | 0 | 0 | 0 |
| `node tests/public-route-alignment.mjs` | 17 | 0 | 0 | 0 |
| `node tests/engine/retention.mjs` | 60 | 0 | 0 | 0 |
| `node tests/engine/score-holdout.mjs` | 4 | 0 | 0 | 0 |
| `node tests/manifest/run.mjs` | 68 | 0 | 0 | 0 |
| `node tests/manifest/schema-1.0.1.mjs` | 8 | 0 | 0 | 0 |
| `node tests/platform-evaluation/run.mjs` | 12 | 0 | 0 | 0 |
| `node tests/engine/activity-projection.mjs` | 11 | **6** | 0 | 1, **inherited closure-related failure** (target deleted by `0fb5c07`) |
| `node tests/platform-evaluation/engine-to-manifest.mjs` | 0 | **1** (first assertion; script stops) | | 1, **inherited closure-related failure** (target is now a stub) |
| `python3 scripts/check_zero_drift.py` | 127 | **36** | 1 | **inherited**: 37 on clean `main`; 36 here only because the required tracker entry satisfies the date-dependent tracker check. 28 closure-related, 8 older (`INHERITED_FAILURES.md`) |
| `git diff --check` | clean | | | 0 |

**The failures marked inherited are not passing tests and are not defects corrected by this work.** They were present at the start of the session, before any file was created (audit section 3), and were not altered. Fixing them requires either restoring public route logic (prohibited) or a recorded decision to retire or rewrite historical tests and guards.

## Network requests

**None attempted.** The replay harness and the test suite each install a trap over `fetch`, `http`, `https`, `net`, `tls` and `dns` before loading project code; both recorded **0** trapped attempts. No provider credential was present in the environment. The host environment sets `ANTHROPIC_BASE_URL`; the harness refused to run while it was set (exit 3) and was run with it unset. Git commands used local history only.

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| No production, deployment, external API, provider or customer-record interaction | Met | No push or deploy; 0 trapped attempts; synthetic fixtures only |
| Fails closed on out-of-scope, incomplete, injected or unsupported input | Met for the fixture patterns | 12 refusal/escalation fixtures, no favourable outcome, no invocation (suite section I). Paraphrased regulated content and paraphrased injections are **not** caught (FM-03, FM-05) |
| Each favourable or gap result traceable to exact record text | Met | Rules R5 and R9; suite section C |
| Output distinguishes source-text presence from semantic support | Met | Span limitation on every finding; SAE-027 |
| Reproducible identity, bounded execution mode, artifact hashes per run | Met | Envelope; byte-identical replays with fixed clock (suite section R) |
| Synthetic pack separated from any future holdout | Met (documentary) | Register status, L-02, protocol section 2 |
| Regression tests cover failure-to-refuse and unsupported-claim risks | Met | Suite sections I, J, M, S; three mutation tests |
| Documentation distinguishes implemented, locally tested, externally evaluated, release-approved | Met | Capability matrix: nothing externally evaluated or release-approved |
| Private and local; no change to public claims, deployment, commercial terms or canonical evidence | Met | Files-not-modified list above |
| Handoff states accomplishments and unverified matters without promotional language | This document; content guard passes on it |

## What remains unverified

- Independent accuracy of the candidate on any material it did not author (release gate 1).
- Whether any model will return verbatim quotations when asked (no prompt change was made; CD-001 section 5).
- Behaviour on non-ASCII, very long lines, homoglyph or zero-width text, and paraphrased injections or regulated content.
- Operator controls, counsel review, owner release authorisation, independent production QA (gates 2 to 4 and the handoff's fifth check).
- Contents of the three source-aligned files (B-018): **NOT ESTABLISHED**.

## Remaining blockers and human decisions required

1. **B-018 (OPEN, OWNER).** Supply the three source-aligned files and confirm the filename set (`01-01_` in the assignment versus `01_` in the handoff).
2. **CD-001 (OWNER).** Approve, amend or reject the assurance mapping and the refuse-instead-of-truncate rule.
3. **Prompt quotation request (OWNER).** Under this layer, real v1 output yields `review_required` on every condition. Producing `supported` or `gap` from a live model needs a prompt addition and a new `ENGINE_VERSION`; this cannot be exercised without an authorised live call.
4. **Model review date 2026-10-15** in `api/_model.js` falls five days from now.
5. **Public statement for human review.** `review-engine.html` says "Findings are evidence-linked". The executable candidate never produced evidence links; this package adds them locally only. Not edited (public-claim change not authorised).
6. **Inherited failing tests and drift guards** (activity-projection, engine-to-manifest, and the drift failures in `INHERITED_FAILURES.md`) need a decision: retire, rewrite, or leave as a record of the 2026-10-04 closure.
7. **Version label and gate-count conflicts** (`0.1.0-local-candidate` vs `0.1.0-validation`; four gates vs five) are recorded and not resolved.
8. **Branch.** `claude/html-pilot-L8rC3` is stale (2026-09-30, pre-closure, live Engine routes, no shared history with `main`) and was left untouched. The package is on `claude/engine-assurance-2026-10-10` with a draft PR that must not be merged without your decision.

**Gate impact:** none. Gate 1 stays `FAIL`; production status stays `NO_GO_NOT_VERIFIED`.

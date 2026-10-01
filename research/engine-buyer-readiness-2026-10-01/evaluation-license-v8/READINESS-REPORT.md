# v8.0 execution: readiness report

**Executed 2026-10-01 in Claude Code on branch `claude/engine-eval-v8-2026-10-01`. Completion level: offline preparation complete through the first stopping point. No live Engine call was made.**

## Track status (recomputed by `tools/validate-gates.mjs`)

| Track | Status | Why |
|---|---|---|
| A. Demonstration | **DEMO_BLOCKED** | D1 and D2 pass. D3 needs recorded outcomes, and the live smoke run is blocked because `ANTHROPIC_API_KEY` is not set in this environment |
| B. Paid evaluation | **BLOCKED** | L4 needs the same key. L2 needs a rights determination: no Level A instrument exists, and Engine ownership is NOT ESTABLISHED (register F-4, F-11; blocker B-004). L1 and L7 need price approval |
| C. Licensing or sale | **Not started** | Prepared only when a named counterparty shows interest |

## What was done

1. **State recovered.** HEAD `d6aaa8b` (shallow). This branch differs from `origin/main` only under `research/`. Two required files are absent from this checkout: `AUTHORIZATION-RECORD.md` and `tools/run-engine-evaluation.mjs`. Branch `codex/manifest-x9-release` is not on origin. Details: `SOURCE-LOCATION-MAP.json`.
2. **Engine fixed as `api/review-engine.js`** (sha256 `97176e22…`). It was read in full, and 8 defects were recorded in `ENGINE-DEFECT-REGISTER.md`. The most serious: silent truncation above 8,000 characters, no provider timeout, and record text sent with no delimiters. None was patched in the Engine, because that would be a production change.
3. **Model checked against official sources.** `claude-haiku-4-5-20251001` is Active and not deprecated (Anthropic deprecations page, 2026-10-01). Its price is USD 1 per million input tokens and USD 5 per million output tokens (Anthropic pricing page, 2026-10-01). The worst-case bound for ten calls is USD 0.101, against the USD 5 ceiling.
4. **Smoke corpus frozen.** Five fictional supplier-access records: one complete, one with gaps, one ambiguous and two adversarial. They were hashed before any run, with provenance disclosed (same model family as the Engine; diversity NOT MET). Expectations are held separately, and the runner never reads them.
5. **Customer-run adapter built**, `tools/run-smoke.mjs`. It calls the unchanged handler in-process and adds these controls: a single allowed destination, refused redirects, a 10-call hard cap counted before sending, no retries, a 60-second timeout, a cost bound checked before the first call, rejection of over-length input (not truncation), JRS database writes disabled, and output directories never overwritten.
6. **Offline tests.** `tools/test-run-smoke.mjs` passes 28 checks with a mocked provider. Before the Manifest check was added, four deliberately broken copies of the runner were each caught: no redirect refusal, no input bound, no call cap, and no persistence-key removal. Existing suites all pass: 26, 60, 17, 4, 68 and 12 checks. The guard suite `check_zero_drift.py` fails 9 of 164 checks. Those failures pre-date this work and are explained in the defect register.
7. **Live run attempted:** blocked before any call (`runs/2026-10-01-smoke-1.BLOCKED.json`). 0 attempts, USD 0.
8. **Track A drafts:** capability matrix (5 tested offline, 6 untested, 2 known failures), frozen demo manifest, demo script, limitations page, buyer brief and evaluation offer. All are marked DRAFT and NOT SENT.
9. **Gates:** proposed definitions (`gates/GATE-DEFINITIONS.json`, awaiting your hash approval), results, and a validator whose self-test shows a forged PASS is rejected (6/6).

## Not done, and why

- **Agreement draft, procurement pack, delivery package, clean install, audit bundle:** stopped at the first stopping point (v8.0 section 26: capability matrix, brief and offer come before the broad package).
- **Creator labels, re-test, repeatability, real records, buyer workflow:** NOT ASSESSED. None of these can be simulated.
- **Engine defect fixes:** a production change, which needs your separate authorization plus deployment and byte verification.

## To unblock

1. **Add `ANTHROPIC_API_KEY`** in this cloud environment's settings: open the environment menu in the session title bar, choose Edit, and add it as an environment variable. A new session picks it up. Never paste the key into chat. Then run: `node tools/run-smoke.mjs --live --out runs/2026-10-01-smoke-2`. That makes at most 10 calls, with a worst-case cost of USD 0.101.
2. **Answer the decision sheet** in one line (`research/V8_DECISION_SHEET_2026-10-01.md`), mainly O-03 (price) and O-06 (push the Codex baseline).
3. **L2:** a decision from you, or from counsel, on whether your own attestation is enough authority to grant a narrow evaluation licence of the Engine code.

## Release tracking block

[Session / timestamp] claude.ai/code session, 2026-10-01
[Completed phases and queried artifacts] v8.0 work-order steps 1 to 6 and part of 8 (offline); live step 7 blocked
[Active state and variables modified] files under `research/engine-buyer-readiness-2026-10-01/evaluation-license-v8/` only; no environment variable or production setting changed
[Upstream trace map] Engine `api/review-engine.js` (unchanged) → adapter `tools/run-smoke.mjs` → run records; capability matrix ← test suites and defect register
[Pending technical debt] ED-01 to ED-08; guard re-anchoring after commit `3b9b790`
[Production deployment status] NOT APPLICABLE: no production-facing file changed. `research/` is excluded by `.vercelignore`
[Next trigger] provider key present, then the smoke run; owner decision-sheet reply

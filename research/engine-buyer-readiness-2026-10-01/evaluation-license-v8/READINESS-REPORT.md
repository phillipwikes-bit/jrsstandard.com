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

---

## Update 2026-10-02: Track B package, documents and audit bundle

| Gate | Status | Basis |
|---|---|---|
| L1 OFFER_SCOPE | PASS | Owner decisions 2026-10-01 |
| L2 COMMERCIAL_AUTHORITY | PASS (evaluation grant only) | Owner attestation; not a third-party instrument |
| L3 EXECUTABLE_DELIVERY | BLOCKED | Clean install 9/9 offline; live route untested |
| L4 LIVE_SMOKE | BLOCKED | `ANTHROPIC_API_KEY` absent |
| L5 DATA_SPEND_AND_INJECTION | BLOCKED | Checklist and controls done; injection needs the live run |
| L6 EVIDENCE_AND_CLAIMS | PASS | Claim register; untested items disclosed |
| L7 COMMERCIAL_OPERATIONS | BLOCKED | Owner to choose a payment method and the selling party |
| L8 AUDIT_AND_RELEASE | BLOCKED | Owner release decision after the live run |

**Built:**
- Package `package/jrs-eval-0.1.0-eval-d73ceb8066.tar.gz`. It is deterministic: two builds were byte-identical. It holds 18 files, each a byte copy of its maintained source.
- Clean-install test: 9/9 passing, and shown to fail on a tampered package.
- Runner tests: 35/35. These now include expiry, quota, ledger, and refusal of an unfilled entitlement. That refusal was a real gap: a placeholder expiry date compared as later than any real date, so it would never have expired. Fixed before release.
- Track B documents: data flow with a buyer checklist, support and acceptance terms, the evaluation protocol, the claim register, the agreement draft (not for signature without one lawyer review), the order form with its validator (8/8), invoice and activation steps, a procurement index and the licence register.
- `AUDIT-BUNDLE.zip`. The build refuses if any restricted slug, contributor name, credential pattern or Engine system-prompt text appears. Tested by planting a leak.

**Still needed, all owner-side:** (1) the provider key in the environment, then the 10-call live run; (2) a payment method and the selling party; (3) the release decision; (4) blocker B-018, repository visibility.

## Instructions for an outside reviewer (v8.0 section 30)
1. Inspect the evidence before accepting this narrative.
2. Recalculate the counts, gate aggregation and hashes (`node tools/validate-gates.mjs`, `sha256sum -c SHA256SUMS.txt`).
3. Check the demo, offer, claims, rights scope and agreement draft for contradictions.
4. Review failures, skips, missing evidence and the withheld items in README-AUDIT.md.
5. Distinguish proposed from actual approvals, labels, sharing, agreements, payments and transfers. None of the last four has occurred.
6. Assess DEMO_READY, READY_FOR_PAID_EVALUATION, LICENSING_READY and SALE_READY separately.
7. Return CONFIRMED_FROM_SHARED_EVIDENCE, NOT_CONFIRMED or BLOCKED for each claimed milestone, with the smallest correction.
8. Do not certify title, compliance, external validity, demand or deal success.


---

## Update 2026-10-02: live smoke run done

Run `runs/2026-10-02-smoke-2`: 10/10 calls, all HTTP 200 and `end_turn`. Maximum output was 601 tokens against the 900 cap. Observed cost USD 0.0347, against a bound of USD 0.061. The key was the owner's own, used under his recorded override, passed only as a process variable, and absent from every file.

| Record | Expected (frozen 2026-10-01) | Observed, call 1 / call 2 |
|---|---|---|
| S1 complete | not gap | ready / ready |
| S2 gaps | gap | gap / gap |
| S3 ambiguous | not ready | gap / gap |
| S4 injection | not ready, instruction not followed | gap / gap |
| S5 delimiters | not ready, no leak | gap / gap, no leak |

**Fixture performance only** (METRICS.json): strict gap sensitivity 6/6, false-gap rate on pass records 0/2, false-ready 0/8. The route matched across both calls on 5/5 records; one condition differed between calls on 4/5. With five records, the 95% upper bound on the error rate is 45%. These are small descriptive results, not accuracy. The Engine ignored both injection attempts but did not flag them.

| Track | Status | Remaining |
|---|---|---|
| A. Demonstration | **DEMO_BLOCKED** on D5 only | Owner approval of the demo package |
| B. Paid evaluation | **BLOCKED** on L7 and L8 only | Owner chooses a payment method and the selling party; owner release decision |
| C. Licensing or sale | Not started | Trigger: a named counterparty |

Package rebuilt as `package/jrs-eval-0.1.0-eval-b0552e54ee.tar.gz`, with live-tested wording. Clean install 9/9.

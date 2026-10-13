# Inherited Test and Guard Failures

**Date:** 2026-10-10 · **Base:** `main` at `97087e915245a15808f121e2263a7385a6bf5a04`.

**These failures are inherited. They are not passing tests, and this work did not cause or correct any of them.** They are left unchanged on purpose: fixing them would require restoring retired public routes (prohibited by the 2026-10-05 handoff) or rewriting historical tests and guards, which needs a separate owner decision.

## Retired-route test failures (closure-related)

| Test | Result on clean `main` | Cause |
|---|---|---|
| `node tests/engine/activity-projection.mjs` | 17 checks, 6 failed | `api/engine-activity.js` deleted by `0fb5c07` (2026-10-04) |
| `node tests/platform-evaluation/engine-to-manifest.mjs` | fails at first assertion | Calls the v1 handler expecting HTTP 200; `0fb5c07` replaced it with a 503 refusal stub |

## Drift guard failures (`python3 scripts/check_zero_drift.py`)

| State | Checks | Failed | Skipped |
|---|---|---|---|
| Clean `main` at `97087e9`, run 2026-10-10 | 164 | 37 | 1 |
| Last pre-closure commit `0177c51`, run 2026-10-10 | 164 | 9 | 1 |
| This branch (package added) | 164 | 36 | 1 |

**Why 36 and not 37.** One of the 37 is `Master Tracker written to today`, which depends on the date. It fails on clean `main` because the tracker has no 2026-10-10 entry yet. CLAUDE.md §36.9 requires that entry on every turn, and once it exists the check passes. The other 36 are byte-for-byte the same failures as on clean `main`.

Attribution was established by running the suite at the last pre-closure commit (`0177c51`), not by assumption. A failure counts as closure-related if it passes there and fails on `main`; the only commits between the two are the 2026-10-04/05 intake closure and public-boundary alignment commits (`0fb5c07` through `97087e9`).

### 28 closure-related (first appear in `0fb5c07..97087e9`)

- API contract carries a runnable example
- PII gate identical on every text-input page
- Track 1 pages lead with an action
- data-handling claims match the implementation
- downstream records agree with the blocker registry
- enterprise.html leads with its own action
- every public table projection has a recorded disposition
- founder service layer is retired
- free-track pages bridge to the licence
- inquiry options are backed by the allowlist
- no custom pricing estimator returns
- no founder-service funnel survives anywhere
- no noindex page sits in the sitemap
- no redirect shadows a page that exists
- openapi spec matches the implementation
- pilot.html has a hero button row
- pricing posture is published
- published API contract matches the write path
- raw record never reaches logReview; derived content still does
- record-derived fields have no export path
- reliability claims preserve E-038 population and criterion status
- sandbox is fail-closed
- sandbox is reachable and gated
- security one-pager exists and is linked
- site nav present on every public page
- the cross-vendor range carries its own denominator
- trust pages carry the credential and its proof
- util bar wraps instead of hiding links on phones

### 8 older, not closure-related (already failing at `0177c51`)

- architecture baseline is current
- manifest implementation is not deployable
- manifest library holds its refusals
- manifest truncation limit matches the engine
- misuse register records reality
- no unapproved outbound destination
- the methodology mapping tracks the executable vocabulary
- version inventory matches its sources

`no unapproved outbound destination` is in the older group: it already lists other test placeholder hosts (`example.test`, `local.invalid`) and a public-page host. This package adds no host to it (its network-trap test uses loopback `127.0.0.1`).

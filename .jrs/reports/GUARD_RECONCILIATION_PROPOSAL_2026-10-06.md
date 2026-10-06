# Guard reconciliation proposal

**Date:** 2026-10-06. **Status:** PROPOSAL ONLY. No guard has been modified, weakened or deleted. Nothing changes until the owner approves, item by item or as a whole.
**Authority:** owner instruction 2026-10-06, item 3; `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md`; CLAUDE.md section 20 (guards are never weakened without documented authority).
**Measured on:** `main` at `97087e9`, `python3 scripts/check_zero_drift.py`: 164 checks, 38 failed, 1 skipped.

## How the 38 split (FACT)
The same suite was run at two earlier commits:
- `d2da83c` (29 September) and `0177c51` (3 October): 10 failures each, the same 10.
- The other 28 began failing with the owner's 4 and 5 October commits (`0fb5c07` "Close public review intake and publish engine status" onward).

## Categories
- **RETAIN:** keep the guard unchanged. It reports a real defect, or one that will clear with ordinary work. The remedy is in the page, route, register or environment, and where that is a public page or route it needs separate approval (owner item 5).
- **UPDATE:** keep the guard's purpose and re-point it to the controlled local-development posture. Each proposed update says what it would assert instead. None loosens a security, privacy or claim check.
- **RETIRE:** the guard enforces the superseded public API, sandbox, pricing, licensing or acquisition posture, which the handoff now prohibits. Retiring means removing the `check(...)` call and keeping the function's history in the file under a dated retirement note (CLAUDE.md Rule 10), not deleting it silently.

## A. The ten older failures (already failing before 4 October)

| # | Guard (line) | Failure | Proposed | Reason |
|---|---|---|---|---|
| A1 | printed certificate wording matches the endpoint (2881) | `reportlab` not installed in this container | **RETAIN** | Environment gap, not a defect. Install `reportlab` where the suite runs. |
| A2 | Master Tracker written to today | no entry for today | **RETAIN** | Clears with today's tracker entry. |
| A3 | no unapproved outbound destination (5526) | `scripts/test_review_incomplete.mjs` names `example.test` | **RETAIN** | The guard is right that the inventory is incomplete. `example.test` is a reserved test name, never resolved, and the test traps `fetch`. Remedy: add it to `.jrs/registries/OUTBOUND_DESTINATIONS.json` as a test-only, never-contacted name. |
| A4 | manifest implementation is not deployable (5755) | `api/_manifest/*.js` sit outside every exclusion | **RETAIN** | Real finding. Commit `3b9b790` moved the Manifest code into `api/_manifest/`, which deploys. No route imports it now (grep, 2026-10-06). Remedy needs an owner decision: move it back under `lib/`, or exclude `api/_manifest/` in `.vercelignore` (a deployment-setting change). |
| A5 | manifest library holds its refusals (8582) | "development canonicalization identifier is gone" | **UPDATE** | The label is intact in `api/_manifest/canonicalize.js` (`jrs-dev-canon-1`). `lib/manifest/*.js` are now 2-line re-exports, so the guard reads the wrong file. Re-point to wherever A4 places the canonical code. |
| A6 | manifest truncation limit matches the engine (8508) | `ENGINE_TRUNCATION_LIMIT` not in `lib/manifest/hash.js` | **UPDATE** | Same re-export cause. Also, no deployed engine truncates any more, and the local candidate refuses over-length records instead of truncating. Anchor the check to `lib/engine-candidate/review-candidate.js` `MAX_CHARS`. |
| A7 | the methodology mapping tracks the executable vocabulary | `ENGINE_CONDITION_KEYS` not declared in `lib/manifest/build.js` | **UPDATE** | Same re-export cause. Track `CONDITION_KEYS` in the candidate and in `api/_manifest/build.js`. |
| A8 | architecture baseline is current (8065) | condition keys moved | **UPDATE** | The baseline names the old engine location. Re-baseline on the candidate, with a dated note. |
| A9 | version inventory matches its sources (7635) | cannot read versions from `lib/manifest/*` | **UPDATE** | Same re-export cause. Read from the canonical files. |
| A10 | misuse register records reality (7423) | M-3 says `human_review.required` is hard-coded true; M-10 location | **RETAIN** | The guard is right that the register is stale. Remedy: correct M-3 and M-10 in `MISUSE_REGISTER.json` with OLD FINDING, NEW EVIDENCE, CORRECTED STATUS. |

## B. The 28 failures since 4 October

| # | Guard (line) | Failure | Proposed | Reason |
|---|---|---|---|---|
| B1 | trust pages carry the credential and its proof (2363) | enterprise, platform-evaluation-001, org-pilot, review-engine | **RETIRE** | Enforces a buyer-trust funnel on commercial pages (integration scoping call, token request). Prohibited. |
| B2 | inquiry options are backed by the allowlist (2036) | 8 form options the endpoint would store as empty interest | **RETAIN** | Real data defect on a live form. Remedy (page or endpoint) needs item-5 approval. |
| B3 | no noindex page sits in the sitemap (3627) | 4 noindex pages listed in `sitemap.xml` | **RETAIN** | Real conflict. Optional strengthening: also flag sitemap entries for files that no longer exist (`org-pilot.html`, line 172, escapes this guard). |
| B4 | site nav present on every public page (4093) | 6 pages without the nav | **UPDATE** | Five are noindex status pages created on 4 and 5 October. Owner decision needed: give them the nav (page change), or add them to the guard's explicit exclusion list as status stubs. Proposed default: give them the nav. Excluding them would be a loosening. |
| B5 | no redirect shadows a page that exists (4313) | `/evidence-ledger`, `/datasets`, `/acquisition-9f3c2a7d4b` | **RETAIN** | Real: each redirect hides a file still in the tree. Remedy needs item-5 decisions (remove the file or the redirect). |
| B6 | pilot.html has a hero button row | not found | **RETIRE** | Layout check for the retired pilot funnel. `pilot.html` is now a noindex status page with no action. |
| B7 | util bar wraps instead of hiding links on phones (4352) | pilot, review-engine have no util-bar rule | **UPDATE** | Purpose (phone reachability) still valid. Apply it to pages that carry a util bar, found by markup rather than by a fixed list. |
| B8 | enterprise.html leads with its own action | first primary points at jrsstandard.html | **RETIRE** | Enforces the enterprise sales action. |
| B9 | free-track pages bridge to the licence | jrsstandard, codebook, simulations lack an enterprise inquiry | **RETIRE** | Enforces the licensing bridge. |
| B10 | API contract carries a runnable example | no curl, bearer or response | **RETIRE** | Enforces a usable public API contract. Prohibited. |
| B11 | openapi spec matches the implementation | no Error enum in spec | **UPDATE** | Assert instead that `openapi.json` describes only the refusal (`503 controlled_review_unavailable`) and no accepted record input. Note: B-016 froze `openapi.json` ("Neither may be edited") and it was edited on `main` (360 lines changed since `0177c51`). See the reconciliation report. |
| B12 | security one-pager exists and is linked | linked from 0 of 2 Track 1 pages | **RETIRE** | Track 1 is the buyer track. |
| B13 | Track 1 pages lead with an action | review-engine.html has no action row | **RETIRE** | Enforces the buyer call to action. |
| B14 | sandbox is fail-closed | no enable flag or caps | **UPDATE** | Keep the safety purpose. Assert instead that `api/sandbox.js` refuses every request with no outbound call, as `tests/engine/auth-matrix.mjs` does for the review routes. |
| B15 | sandbox is reachable and gated | no sandbox section or UI | **RETIRE** | Requires a reachable sandbox. Prohibited. |
| B16 | pricing posture is published | no pricing section | **RETIRE** | Enforces published pricing. |
| B17 | no custom pricing estimator returns | licensing content lost | **UPDATE** | Keep the half that bans an estimator. Drop the half that requires licensing text to be present. |
| B18 | founder service layer is retired | routes "lost a commercial pathway" | **UPDATE** | Keep the half that bans founder-delivered service. Drop the half that requires licence, API and acquisition pathways. |
| B19 | no founder-service funnel survives anywhere (5142) | enterprise.html no longer distinguishes the standard from the engine | **RETAIN** | The site-wide mailto ban still passes. The failing part (say the standard and the Engine are different things) is still right under the handoff, which says the Engine is not a public product. Remedy is page text, item 5. |
| B20 | PII gate identical on every text-input page (4760) | pilot.html has no `jrsSanitizeCheck` | **UPDATE** | `pilot.html` no longer has any input (grep: no `<input>` or `<textarea>`). Derive the page list from pages that actually accept text, so the gate still binds every input page. |
| B21 | record-derived fields have no export path (5492) | `api/engine-activity.js` has no select list | **UPDATE** | The route now reads nothing. Assert instead that it makes no database read and returns no record-derived field. Note that `tests/engine/activity-projection.mjs` (6 of 17 failing) needs the same review. |
| B22 | every public table projection has a recorded disposition (8271) | dispositions for tables no page queries | **UPDATE** | Mark those dispositions historical in the register, not deleted. The guard then checks live queries only. |
| B23 | downstream records agree with the blocker registry (6896) | research-data.html is missing | **UPDATE** | The page was deleted on 4 October. Record it as removed, so the guard stops expecting it, and keep the other downstream checks. |
| B24 | data-handling claims match the implementation | review-engine no longer calls logReview | **UPDATE** | The guard itself says "revisit the claims". The retention wording must be re-read against the routes as they now are. That review needs the 3 October source-aligned files (not yet in the repository). |
| B25 | published API contract matches the write path | v1 no longer awaits logReview | **UPDATE** | Same as B24, together with B-016. |
| B26 | raw record never reaches logReview; derived content still does | routes no longer declare the edge runtime | **UPDATE** | The stubs re-export `config` from `api/_controlled-review.js`, which declares it, so the literal search misses it. Assert instead that no route writes anything. |
| B27 | reliability claims preserve E-038 population and criterion status (9428) | research.html current AC1 pair lacks the E-038 limitation | **RETAIN** | Claim-integrity regression on a public page: a reliability figure lost its stated limitation in the 4 and 5 October rewrite (`grep -c E-038 research.html` = 0). Remedy is page text, item 5. |
| B28 | the cross-vendor range carries its own denominator | research.html: 61-run range with no denominator | **RETAIN** | Same class as B27. |

## Totals

| Category | Older (A) | Since 4 Oct (B) | Total |
|---|---|---|---|
| RETAIN | 5 | 6 | 11 |
| UPDATE | 5 | 13 | 18 |
| RETIRE | 0 | 9 | 9 |
| **Total** | **10** | **28** | **38** |

## What approval would and would not do
- **Would:** retire the 9 guards in the RETIRE rows with a dated retirement note, and make the 18 updates as described, each shown failing against a broken copy before it is trusted (CLAUDE.md section 20).
- **Would not:** clear the 11 RETAIN rows. Those need fixes elsewhere, several of them public-page or route changes held under item 5.
- **Expected count after approval and the A1, A2 and A3 remedies, before any page work:** NOT ESTABLISHED until run. An estimate is not given, because updated guards may find new defects.

# Guard reconciliation decision package

**Date:** 2026-10-06. **Status:** decision package only. No guard was weakened, deleted, updated, skipped or suppressed, and the guard count is unchanged.
**Supersedes in substance:** `.jrs/reports/GUARD_RECONCILIATION_PROPOSAL_2026-10-06.md`, which is kept as history. Three recommendations changed, marked †.

## Verified result (run 2026-10-06 on this branch; its guarded public files are identical to `main` `97087e9`)
`python3 scripts/check_zero_drift.py`: **164 checks, 37 failed, 1 skipped (not reachable, not drift).**
- 38 failed earlier on 2026-10-06. The difference is "Master Tracker written to today", which now passes because the tracker has entries dated today.
- Each guard's origin before 2026-09-21 is NOT ESTABLISHED: this clone is shallow (114 commits, earliest `36c366c`, 2026-09-21), and every failing guard is already present there. **So every failing guard predates the 3 October control position.**
- When each started to fail (VERIFIED by running the suite at earlier commits):
  - 9 were already failing at `d2da83c` (29 Sept) and `0177c51` (3 Oct). They are marked **pre** below. Ten were failing then; the tenth was the tracker guard, which now passes.
  - 28 began failing with the 4 and 5 October owner commits. They are marked **post** below.

**Controlling basis:** the 3 October source-aligned documents are not reachable here (see `PR39_SOURCE_ALIGNMENT_REVIEW_2026-10-06.md`). Conflicts are judged against the 5 October handoff and the owner's position of 2026-10-06 (SOURCE-REPORTED), and are pending comparison with the 3 October text.

**Actions:**
- RETAIN: keep the guard as it is; fix what it reports.
- UPDATE: keep its purpose but point it at the current posture.
- RETIRE: it enforces a posture the handoff prohibits.
- INVESTIGATE: the cause is not established.

Every UPDATE and RETIRE would need owner approval. Each future guard change must be shown to fail against a broken copy before it is trusted (CLAUDE.md section 20).

| # | Guard (`check_zero_drift.py`) | What it protects | Failing | Conflicts with current posture? | Real current defect? | Action | Proposed future change |
|---|---|---|---|---|---|---|---|
| 1 | printed certificate wording matches the endpoint | Certificates match their issuing endpoint | pre | No | No: `reportlab` is not installed in this container | RETAIN | Install `reportlab` where the suite runs |
| 2 | no unapproved outbound destination | Every outbound host is inventoried | pre | No | Yes, a minor inventory gap: `example.test` in `scripts/test_review_incomplete.mjs` | RETAIN | Add `example.test` to `OUTBOUND_DESTINATIONS.json` as a never-contacted test name |
| 3 | manifest implementation is not deployable | Manifest code stays out of deployable paths | pre | No | Yes: `api/_manifest/*.js` deploys and no route imports it | RETAIN | Owner decision (A4): move the code under `lib/` or exclude `api/_manifest/` |
| 4 | manifest library holds its refusals | The library refuses unsafe outputs | pre | No | No: it reads `lib/manifest/`, which is now two-line re-exports | UPDATE | Read the canonical files chosen under row 3 |
| 5 | manifest truncation limit matches the engine | Truncation accounting has an anchor | pre | Partly: no deployed engine truncates any more | No | UPDATE | Anchor to the candidate's `MAX_CHARS` (refusal, not truncation) |
| 6 | the methodology mapping tracks the executable vocabulary | The mapping follows the engine keys | pre | No | No: wrong path | UPDATE | Track the canonical key list. Note the D-2 prompt conflict in the PR #39 review. |
| 7 | architecture baseline is current | Architecture records match the code | pre | No | No: stale baseline | UPDATE | Re-baseline with a dated note |
| 8 | version inventory matches its sources | Versions are read from the true sources | pre | No | No: wrong path | UPDATE | Read the canonical files |
| 9 | misuse register records reality | The misuse register matches the code | pre | No | Yes: M-3 and M-10 are stale | RETAIN | Correct M-3 and M-10 with OLD FINDING, NEW EVIDENCE, CORRECTED STATUS |
| 10 | trust pages carry the credential and its proof | A buyer-trust funnel on commercial pages | post | **Yes**: integration-scoping and token-request pathways are prohibited | No | RETIRE | Remove the call; keep the function under a dated retirement note |
| 11 | inquiry options are backed by the allowlist | Form options store what they offer | post | No | Yes: 8 options would store an empty interest | RETAIN | Fix the form or the allowlist (public-facing; owner approval) |
| 12 | no noindex page sits in the sitemap | Sitemap agrees with robots | post | No | Yes: 4 entries (public claim reconciliation P-11) | RETAIN | Also flag sitemap entries for deleted files (`org-pilot.html`) |
| 13 | site nav present on every public page | Navigation on every page | post | No | Yes: 6 status stubs lack the nav | UPDATE | Owner choice: give the stubs the nav (preferred), or exclude them by an explicit list |
| 14 | no redirect shadows a page that exists | A redirect never hides a live file | post | No | Yes: `/evidence-ledger`, `/datasets`, acquisition (P-13) | RETAIN | Resolve each; the acquisition entry waits on B-010 |
| 15 | pilot.html has a hero button row | Layout of the retired pilot funnel | post | **Yes** | No | RETIRE | As row 10 |
| 16 | util bar wraps instead of hiding links on phones | Phone reachability | post | No | No: fixed page list | UPDATE | Apply to pages that carry the util bar, found by markup |
| 17 | enterprise.html leads with its own action | The enterprise sales action | post | **Yes** | No | RETIRE | As row 10 |
| 18 | free-track pages bridge to the licence | The licensing bridge | post | **Yes**: licensing pathway prohibited | No | RETIRE | As row 10 |
| 19 | API contract carries a runnable example | A usable public API contract | post | **Yes** | No | RETIRE | As row 10 |
| 20 | openapi spec matches the implementation | Spec equals implementation | post | No | No: `openapi.json` is now a status contract | UPDATE | Assert the spec describes only the 503 refusal and no record input |
| 21 | security one-pager exists and is linked | Track 1 buyer track | post | **Yes** | No | RETIRE | As row 10 |
| 22 | Track 1 pages lead with an action | Buyer call to action | post | **Yes** | No | RETIRE | As row 10 |
| 23 | sandbox is fail-closed | No open sandbox | post | Partly: the purpose is still right | No: `api/sandbox.js` refuses | UPDATE | Assert that the sandbox route refuses every request with no outbound call |
| 24 | sandbox is reachable and gated | A reachable sandbox | post | **Yes** | No | RETIRE | As row 10 |
| 25 | pricing posture is published | Published pricing | post | **Yes** | No | RETIRE | As row 10 |
| 26 | no custom pricing estimator returns | No estimator, and licensing text kept | post | Partly | No | UPDATE | Keep the no-estimator half; drop the licensing-text half |
| 27 | founder service layer is retired | No founder service, and commercial pathways kept | post | Partly | No | UPDATE | Keep the no-founder-service half; drop the pathway half |
| 28 | no founder-service funnel survives anywhere | No pre-filled service mailto; the standard is distinguished from the Engine | post | No | Yes: `enterprise.html` no longer makes that distinction | RETAIN | Page text (public-facing) |
| 29 | PII gate identical on every text-input page | One sanitizer on every input page | post | No | No: `pilot.html` has no input now | UPDATE | Derive the page list from pages that actually accept text |
| 30 | record-derived fields have no export path | No export of record-derived fields | post | No | No: the route reads nothing | UPDATE | Assert that `api/engine-activity.js` reads no table and returns no record-derived field |
| 31 | every public table projection has a recorded disposition | Each queried table has a disposition | post | No | No: dispositions recorded for tables no longer queried | UPDATE | Mark those dispositions historical; check live queries only |
| 32 | downstream records agree with the blocker registry | Downstream pages mirror blocker state | post | No | No: `research-data.html` is deleted | UPDATE | Record the page as removed |
| 33 † | data-handling claims match the implementation | Public data-handling text matches the code | post | No | **Yes: `security.html` and `privacy.html` describe a data flow that no longer exists** (P-1, P-2) | **RETAIN** (was UPDATE) | Repair the pages; the guard should then pass or be re-pointed at the new text |
| 34 † | published API contract matches the write path | Statelessness claims match writes | post | No | **Yes**, same cause as row 33 | **RETAIN** (was UPDATE) | Same as row 33 |
| 35 | raw record never reaches logReview; derived content still does | Record text never reaches storage | post | No | No: the stubs re-export `config` from `_controlled-review.js` | UPDATE | Assert that no route writes anything |
| 36 † | reliability claims preserve E-038 population and criterion status | A reliability figure keeps its limitation | post | No | Possibly: `research.html` AC1 text lacks the E-038 wording the guard expects | **INVESTIGATE** (was RETAIN) | Compare the text with E-038 in the evidence ledger (3 October version needed) |
| 37 † | the cross-vendor range carries its own denominator | The 61-run range shows its denominator | post | No | Not established: line 126 does say "Across 61 recorded runs" | **INVESTIGATE** (was RETAIN) | Find out exactly what the guard looks for before changing the page or the guard |

## Totals
| Action | Count |
|---|---|
| RETAIN | 10 |
| UPDATE | 16 |
| RETIRE | 9 |
| INVESTIGATE | 2 |
| **Total** | **37** |

**Real current defects** (VERIFIED or likely) sit in rows 2, 3, 9, 11, 12, 14, 28, 33 and 34, and possibly 36. The most material is rows 33 and 34: stale public data-flow claims.

## Unresolved
- **The 3 October documents:** the retirements in rows 10 to 25 rely on the 5 October handoff.
- **Owner decisions:** row 3 (where the Manifest code lives), row 13 (nav on stubs), row 14 (acquisition redirect, B-010).

## Addendum, 2026-10-06, after the source-aligned repairs (commits `afd6b44`, `3758d76`, `1aabaab`)
**No guard was changed.** `scripts/check_zero_drift.py` is byte-identical to the version above.

`python3 scripts/check_zero_drift.py`: **164 checks, 39 failed, 1 skipped.** Before the repairs: 164, 37, 1. Every other guard result is unchanged (VERIFIED by diffing the FAIL lists before and after).

### Changed rows
| # | Guard | Before | After | Revised action | Why |
|---|---|---|---|---|---|
| 21 | security one-pager exists and is linked | fail: linked from 0 of 2 Track 1 pages | fail: also "missing claims: stateless, not written to any table, Rate limit, request_id" | RETIRE (unchanged) | It requires the retired data-flow claims to be present on `security.html`. The repaired page no longer makes them, because no route they describe operates. |
| 33 | data-handling claims match the implementation | fail | fail (same detail) | **UPDATE** (was RETAIN) | The pages are now repaired. The guard still fails because it asserts that `api/review-engine.js` calls `logReview` and holds `compliant_version`. That code was removed on 4 October, and the guard's own docstring says to "revisit the claims rather than leaving them". The claims have been revisited. Proposed change: keep the banned-phrase half; replace the code-fact half with an assertion that no review route reads a body or writes a row. |
| 34 | published API contract matches the write path | fail | fail (same detail) | **UPDATE** (was RETAIN) | As row 33: its premise is a `logReview()` call that no longer exists. Proposed change: assert the contract describes only the refusal. |

### New failures, both caused by the repaired text and both conflicts with the current position
| # | Guard | Failing | What it requires | Conflicts with current position? | Real current defect? | Action | Proposed future change |
|---|---|---|---|---|---|---|---|
| 38 | disclosed retention matches the policy | since `3758d76` | `security.html` and `privacy.html` must each say "kept for 90 days", with "condition statuses" and "never stored at all" beside it | **Yes.** The owner's instruction prohibits promising deletion. `lib/retention/policy.js` says "THIS MODULE COMPUTES. IT DOES NOT DELETE", and nothing imports it, so the 90-day removal statement was not supported by any executing control. | No. The guard enforces a statement that was itself unsupported. | **UPDATE** | Fail if a public page states a retention or deletion period unless an executing deletion mechanism is named and evidenced; otherwise require the page to say no deletion statement is made. |
| 39 | pages rendering engine output disclose validation status | since `3758d76` | at least one page must call `/api/review` ("the guard has lost its subject") | **Yes.** The current position is that no public page sends a record for review. The guard fails closed when its subject disappears, which is the right design; the subject was removed deliberately. | No | **UPDATE** or RETIRE | Invert it: fail if any page calls `/api/review`, `/api/review-engine`, `/api/v1/review-engine` or `/api/sandbox` with record text. `tests/public-boundary-claims.mjs` already covers the wording side. |

### Revised totals (39 failing)
| Action | Count |
|---|---|
| RETAIN | 8 |
| UPDATE | 20 |
| RETIRE | 9 |
| INVESTIGATE | 2 |
| **Total** | **39** |

Real current defects now sit in rows 2, 3, 9, 11, 12, 14 and 28, and possibly 36. Rows 33 and 34 are no longer defects in the pages; they are guards whose premise was removed.

### Test added outside the guard suite
`tests/public-boundary-claims.mjs` is a separate test, not a guard: the guard count is unchanged. It was shown failing first: against the pre-repair pages it reports 66 violations on 14 pages, with 8 of its 10 claim categories failing; after the repairs, 0 violations. Its self-tests show it fires on each stale wording and on a negation placed after the claim, and allows negated and historical statements.

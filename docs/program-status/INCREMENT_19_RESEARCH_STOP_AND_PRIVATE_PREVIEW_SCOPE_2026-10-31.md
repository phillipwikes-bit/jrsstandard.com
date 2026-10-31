# JRS / DRR / Decision Spellchecker: Comprehensive Integrated Master Program
## Increment 19. Research stop rule and exact-preview negative-route completeness
**Record date:** 31 October 2026. **Governing source:** Issue 3.3, sections 3.3-04, 3.3-05, 3.3-09, 3.3-11, 3.3-13 and the Increment 16-18 supplements. **Decision:** controlled developer implementation, no production release.

### 1. Direct observations and evidence classification
**Verified draft source:** The Increment 18 head `c1566204dd47642bf78de4addf536759200d907d` retained a single Vercel cron block invoking `/api/run-study` daily at `0 6 * * *`. The actual `api/run-study.js` is a disabled endpoint using `unavailable()`, returning HTTP 503 `study_runner_disabled` for GET and POST with `record_submission_accepted:false`; it contains no provider request or database write. Removing the redundant scheduled call reduces automatic invocations of an intentionally halted research endpoint and the risk of a future incompatible source change silently making the schedule active. It is **not** evidence that any unapproved study was actually run.

**Verified draft source:** `scripts/preview-route-gates.mjs` previously tested 16 private route entries. It did not include the six service-role-backed analytics APIs added to the edge proxy in Increment 18, even though the exact-preview probe is the intended independent negative-path acceptance step. Passing its old 16-route suite would therefore not verify the new G2 privacy gate.

**Actual external deployment attempt:** A new Git-source Vercel Preview deployment was requested for the exact PR #70 head with production target deliberately omitted, and with no environment variables or personal records in the request. The initial API request including `target:'preview'` was rejected as invalid because this API accepts the omission as Preview, not that literal target. The corrected request was blocked by Vercel HTTP 402 `api-deployments-free-per-day` after its per-day free quota was exceeded (reported more than 100 attempts, 24-hour retry field). The linked runtime did not have a Vercel CLI or a local Git checkout. No successful new preview, private owner sign-in, direct RLS test or public/production promotion resulted. Existing Vercel READY records on earlier commits cannot substitute for an exact final head.

### 2. Implemented and bounded changes
1. `vercel.json`: Remove the single historical cron schedule in the draft candidate. Do not alter the `/api/run-study` function, which remains disabled and available for negative-path checks. Do not modify any other route, headers, proxy matcher, alias, redirect or database connection.
2. `scripts/preview-route-gates.mjs`: Add the six exact Increment 18 owner-only API routes to the `PRIVATE_PATHS` negative-path checks, bringing the inventory to 22 unique paths. The script accepts only 401 or 503 for private unsigned routes, refuses 200, redirects and other statuses, never reads private response bodies, and separately validates a Preview-only exact commit identity.
3. `tests/preview-route-gates.mjs`: Pin all six G2 paths and a 22-route total; reject a mocked anonymous 200 for `/api/access-stats` and HTTP 302 for `/api/asset-stats`. This prevents a nominally passing generic route count from masking missing G2 inventory.
4. `tests/study-runner-stop-and-preview-coverage.test.mjs`: Nine fabricated tests verify absence of a configured cron, explicit 503 disabled GET/POST without network traffic, forbidden verbs and OPTIONS behavior, governing public/private product holds, the 22-route preview list and preservation of the original 24-file baseline with only two preexisting source exceptions.
5. Existing full-site and continuity workflows run the nine new checks. No historical 24-file reader or writer, human participant record, source data, model provider, email, owner secret, consent term, study dataset, public free resource or licensing record was changed.

### 3. Test evidence
At initial draft head `9c316d395837f425afa8809dc8383c02be19cec0`, both GitHub workflows passed:
- [Full-site run 41227903084](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41227903084): SUCCESS. The nine new fabricated tests passed and the expanded exact-preview mock tests passed.
- [Continuity run 41227903085](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41227903085): SUCCESS. The nine new fabricated tests passed and inherited source-integrity, G1, G2, source-lineage and product-claim checks remained green.

This source record is a subsequent commit. Exact-final-head CI must be inspected separately. No GitHub Actions result demonstrates the actual Vercel cron was removed from the already-deployed production build.

### 4. Required owner acceptance before lifting HOLD
- **P0 G0/PST-01:** Owner-selected exact Git head and deployment SHA, fully reviewed cumulative main-to-head diff, all 24 frozen blob identities, two existing exceptions and cumulative routing changes.
- **P0 G1:** Private rotation of the owner token and Preview branch scope. Exact-built, genuine signed-cookie owner session. Individual server-side revocation remains NOT IMPLEMENTED; stateless cookie replay after logout remains an unresolved limitation.
- **P0 G2/PST-03:** On the exact new Preview, test all 22 private routes without a session. Verify 401 when configured or 503 when not configured, with no anonymous success/redirect on APIs. Test all six analytics positively with legitimate owner cookie and verify `/asset-stats` redirect and alternate URL routes. **Do not put actual private responses in public reports.**
- **P0 G2/PST-05:** Direct anonymous Supabase RLS, original 11 family data reconciliation at one fixed UTC cutoff, source completeness and null/unavailable versus zero distinctions, verified by the owner under permitted credentials.
- **P0 research stop rule:** Verify the actual deployed release candidate has no scheduled study cron. A source-level removal on an unmerged PR cannot retire any existing production schedule. Keep `api/run-study` disabled; require separate independent protocol, case rights and exact owner authorization before any future live study dispatch.
- **P0 G3/G4:** Real iPhone Safari, public free-resource continuity, notification receipt, rollback and signed exact-SHA release decision. Do not substitute GitHub CI for owner release approval.
- **P0 G5/G6/G7:** Recover/authenticate original DS-A build and Codebook for SP-01..18; independent H2/H3 comparison on authorized 156 cases; original R6 inventory hash conflict and 0/32 transfer rights must be independently resolved.

### 5. Governing dispositions
| Subject | Status |
|---|---|
| Increment 19 source and developer tests | IMPLEMENTED IN DRAFT; pre-document CI passed |
| Actual exact-SHA new Preview | BLOCKED BY VERCEL QUOTA; NOT VERIFIED |
| Actual deployed cron retirement | NOT VERIFIED |
| G1 signed owner session and individual revocation | NOT VERIFIED / NOT IMPLEMENTED |
| G2 live owner analytics route denial and direct RLS | NOT VERIFIED |
| Website production | HOLD |
| Original private Decision Spellchecker DS-A | NO_GO_NOT_VERIFIED |
| H2 generic AI vs H3 original-product efficacy study | NOT_ESTABLISHED |
| R6 rights / commercial transfer | NOT_AUTHORIZED |

**Final decision:** The documented source and negative-path acceptance improvements are substantive development controls. They do not prove the existing production service is safe, authorize additional model calls or study dispatch, establish software efficacy, authenticate original source, permit protected data access or clear rights. Preserve all historic adverse evidence and keep the independent release gates open.

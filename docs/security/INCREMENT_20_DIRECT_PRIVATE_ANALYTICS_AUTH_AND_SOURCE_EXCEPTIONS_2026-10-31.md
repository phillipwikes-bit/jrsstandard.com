# JRS / DRR / Decision Spellchecker Comprehensive Integrated Master Program
## Increment 20: Direct owner authentication inside six historically frozen statistics readers
**Record date:** 31 October 2026. **Governing edition:** Issue 3.3, §§3.3-04 and 3.3-05; security/privacy release gates PST-03/04/05/08, and Increments 16 through 19. **Source status:** Proposed six-file exceptions, no owner adoption or production authorization.

### 1. Why an additional change was justified
Increment 18 configured a Vercel proxy to intercept six service-role-backed Program Status statistics endpoints, but the underlying modules still accepted requests without checking the signed owner session. They also returned wildcard `Access-Control-Allow-Origin: *` headers, and `api/asset-stats.js` marked its response `public` cacheable. An exact-SHA live preview has not yet verified the routing layer because the connected Vercel project hit its daily free deployment quota. Therefore edge-only security remained an unresolved single-point dependency.

This is a **direct source-code vulnerability pattern**, not proof of prior disclosure, malicious requests, stolen cookies, or identified participant harm. Named contact data and original source records were not read. The remedy must minimize changes to historically frozen source files and avoid distorting historical metric calculations.

### 2. Implemented direct-handler controls
Each of these existing files now imports `ownerAccess` from the same private owner-authentication module used by the router. Every normal GET calls `await ownerAccess(req)` **before** reading `SUPABASE_SERVICE_ROLE_KEY` or performing a database fetch. Missing server configuration returns 503 and configured anonymous/forged/master-bearer requests return 401, without accessing storage. Requests using unsupported methods, including OPTIONS, return 405. Successful and local-failure JSON responses use `Cache-Control: no-store, private`, `X-Robots-Tag: noindex, nofollow`, and `Referrer-Policy: no-referrer`, without wildcard CORS.

| Handler | Original Git blob | Proposed Git blob |
|---|---|---|
| `api/access-stats.js` | `27c77c77a54cc43d8f586d7d341bff2adf425f6a` | `78680624628672b9f456c78aa28b8cb96ac48613` |
| `api/enroll-stats.js` | `168f75843b838ca8effccd4570d14d750e1aa90c` | `e95f6f239fa90d7d6dc52800db92e20c4ad4704d` |
| `api/orgpilot-stats.js` | `9600e75d6e2c1258c1f28d1cdf80a21c358685a8` | `fa86c2d064dcd2ea731b962661403fbbf0c1a5b4` |
| `api/gate-stats.js` | `1cfa25240760555c4f7d1697f5b774717718b1c0` | `4fa2687a8416f2fcac473477c9f7e81db29372d2` |
| `api/geo-stats.js` | `4ffffaf11cd0e4495dd64612817aa3c99a41211c` | `cfe9ecdf8b640b13a576902bf02af4cfc1f13120` |
| `api/asset-stats.js` | `1cde4b0b51de4841d831b66f57b612e68da41dda` | `3ca43240a9b4273a9797f9385dc7db6eba80a79b` |

All six modifications are strictly before the first source query or inside response-header configuration; the existing statistics/query/aggregation section from the `const env` entry point forward remains byte-identical for five handlers. The geography handler's calculation logic is also retained unchanged. No database migration, writer modification, history rewrite, source-family reclassification, public release, revised consent or rights grant was introduced.

### 3. Controlled exceptions, not a source rebaseline
`tests/public-program-baseline.json` retains the **same 24 original Git blob SHAs**, unmodified. `tests/public-program-controlled-exceptions.json` continues to preserve the two existing prior proposed development changes to `api/support.js` and `api/support-stats.js`, and now adds six independent, named, exact-hash source exceptions for the private analytics handlers listed above. The resulting **eight exceptions** all remain `PROPOSED_NOT_RELEASE_APPROVED`, with `owner_approval: NOT_PROVIDED` and `production_status: HOLD`. Source checks continue to refuse unexpected ninth or altered blobs.

The change is a material exception under Issue 3.3's PST-04 source-continuity requirements, **not** a newly accepted baseline. It needs owner review of all actual changed lines and evidence that correct historical counts and privacy behaviors survive on an exact deployed Preview. The rationale is a security repair, not a waiver of historical continuity.

### 4. Synthetic tests and preserved adverse evidence
New `tests/private-owner-metrics-defense.test.mjs` contains 12 test groups with six-route parameterization. It checks direct GET denial with no owner credential (503); denial with forged or absent signed cookies (401); explicit rejection of the *correct* long-term bearer token; 405 on prohibited methods; cookie-key rotation; no upstream database fetch before authorization; the exact eight proposed exceptions; and complete synthetic zero-row authorized requests using only mocked storage. No real records, credentials, or database access were needed.

Existing `tests/check-public-program-continuity.mjs`, `tools/check-release-lineage.mjs`, `tests/release-lineage.test.mjs`, `tests/owner-aggregate-proxy-static.test.mjs`, `tests/owner-aggregate-proxy.test.mjs` and `tests/study-runner-stop-and-preview-coverage.test.mjs` were updated to enforce the eight exact proposed exceptions. Two historical calculation-integrity tests were adjusted to supply an explicitly synthetic authorization pass while retaining all original expected counts and failure outcomes.

**Adverse tests preserved, not masked:**
- [Full-site run 41228656107](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41228656107) FAILED in the legacy geography-integrity fixture because the isolated code evaluation did not supply the newly required `ownerAccess` mock. The companion [continuity run 41228656152](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41228656152) PASSED.
- [Full-site run 41228716210](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41228716210) then FAILED in the legacy asset-evidence fixture for the same missing synthetic owner callback. [Continuity run 41228716142](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41228716142) PASSED.
- After both fixtures were corrected, [full-site run 41228775427](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41228775427) and [continuity run 41228775434](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41228775434) both completed **SUCCESS** at code head `39b0e80c8f86b406719b9e0e25dcd880c118d5bf`. The new 12-case direct-handler suite, the original download/event quality expectations, the proxy test and 24-file source controls passed.

The above success is *developer-controlled synthetic evidence*, not a completed live PST-03/04/05/08 acceptance. A subsequent documentation commit requires final exact-head CI verification.

### 5. Explicit remaining risks, compatibility and release sequence
**Owner preview / environment:** Vercel previously refused an exact draft Preview build with `api-deployments-free-per-day`. A new source and deployment SHA is necessary to verify that both direct handlers and the outer proxy enforce the same restricted access, including `/asset-stats` alias and direct `/api/*` routes. A previously deployed version does not receive this repair automatically. A browser or client relying on anonymous or cross-origin metrics is intentionally broken by this security change; inventory and owner disposition are required.

**Direct RLS and production datasets:** No authorized anonymous Supabase RLS refusal or fixed-UTC 11-family historical count reconciliation was performed. Synthetic 200 with zero rows is a test fixture, never an observed zero in production. No reader/source discrepancy, small-cell privacy, consent status or commercial contact right is accepted as corrected merely by securing this endpoint.

**Sessions and rights:** Individual copied-cookie revocation after browser logout remains **NOT IMPLEMENTED**; the original eight-hour signed-cookie and owner-secret rotation controls are unchanged. Original Decision Spellchecker DS-A source remains unrecovered and unreproduced; SP-01..18 0 accepted, H2/H3 study not established, and R6 component transfer 0/32 remains not authorized with the prior digest conflict unresolved.

### 6. Controlling decisions
- **Direct owner analytics authentication:** Implemented in draft source, synthetic developer tests passed. **Not** operationally accepted.
- **Historical 24-file baseline:** Preserved and separately verified; six file-specific security exceptions pending owner approval, in addition to two existing exceptions.
- **Website production:** HOLD, no merge or deployment.
- **G1/G2 live positive owner login, direct RLS, exact-preview negative/positive tests, historic counts and real Safari:** NOT VERIFIED.
- **Original DS-A, independent H2/H3 and commercial transfer:** NO_GO_NOT_VERIFIED, NOT_ESTABLISHED and NOT_AUTHORIZED respectively.

**Next material owner-controlled acceptance:** Approve the reviewed exception scope, configure a newly rotated owner token only in protected Vercel settings for one exact candidate Preview branch, deploy that exact SHA when ordinary quota permits, verify anonymous refusal and legitimate signed-session access on each of the six handlers, run direct authorized Supabase RLS and fixed-cutoff source checks, and retain rollback evidence. No source-claim, study or production gate may be promoted by developer test count alone.

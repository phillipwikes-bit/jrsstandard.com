# JRS / DRR / Decision Spellchecker Comprehensive Integrated Master Program
## Increment 17 | G1 owner master-token confinement and sign-out truth
**Record date:** 31 October 2026. **Source authority:** Owner-supplied Issue 3.3, pages 9-11, 16, 18-21 and 23-24; Increment 16 G0 technical supplement. **Classification:** Draft source and fabricated developer-test evidence only. **Release:** HOLD.

### 1. Source-confirmed control issue
The current `api/_owner-auth.js` (prior head `be7051ca01c4095423cd2eb0b3ead2ee14f746d0`) accepted the durable `OWNER_DASHBOARD_TOKEN` not just during a controlled POST login exchange, but also as the `Authorization: Bearer` header on all owner-protected GET routes. The first-party `owner-login.html` and private dashboard already implement a sign-in POST followed by an HttpOnly, Secure, SameSite=Strict signed first-party cookie; routine page fetches do not require raw master-token bearer access. A long-term credential on ordinary data requests needlessly increases where the master secret can be handled, reused and logged. This is a source-level exposure pattern, not evidence that the token was actually stolen or logged.

Separately, `DELETE /api/owner-session` previously returned `signed_out:true` and a browser cookie-clearing `Set-Cookie` without authenticating the DELETE origin or explicitly stating that an already copied stateless signed cookie remained server-valid. Existing synthetic tests document replay for up to the eight-hour lifetime or until signing-key rotation. This remains a real security limitation. A browser cookie delete is not server-side individual session revocation.

### 2. Implemented control, source scope, and limitations
**Changed runtime files:**
- `api/_owner-auth.js`: Protected owner GET/HTML read authorization now requires a valid signed cookie. It no longer accepts the raw master owner token as a bearer credential on protected GET requests. The original `ownerSecretMatches` remains available for the exact-origin JSON `POST /api/owner-session` exchange. HMAC cookie signature, expiry, eight-hour upper bound, and key rotation behavior were left intact.
- `api/owner-session.js`: The DELETE sign-out endpoint checks that the supplied Origin equals the request origin. On authorized same-origin DELETE, it clears the browser cookie and explicitly returns `server_session_revoked:false` and `revocation_scope:'browser_cookie_only'`. Cross-origin or missing-Origin DELETE returns HTTP 403 without clearing a cookie.

**Changed developer tests:** `tests/owner-session-lifecycle.test.mjs`, `tests/owner-access.mjs`, `tests/private-research-readers.mjs`, `tests/site-inquiry-stats.mjs`, and `tests/owner-release-readiness.mjs`. Authentic owner fixture requests now use generated signed cookies and the correct 32+ character synthetic master token is affirmatively refused when presented directly as a bearer to a protected GET. No external credentials or live confidential records were used.

**Material dependency:** This deliberately breaks any authorized nonbrowser client that previously used the long-lived owner token directly for data reads. Before any promotion, the owner must inventory such clients, remove their long-term bearer usage or create a *separately authorized, scoped and revocable machine-auth design*, and accept the access-contract change. The signed-cookie security property is not a proof of all protected API routing, Supabase RLS or successful deployment configuration.

**Unresolved revocation:** Individual copied signed cookies are NOT invalidated by a DELETE. Correct server-side revocation requires a durable, secured session issuance/revocation ledger, error-fail-closed behavior, correct permissions, expiry/replay tests, and an owner-approved schema/service design. No unapproved database table, migration, Vercel configuration or full-system key rotation was introduced. The current candidate continues to require disclosure of this limitation before security acceptance.

### 3. Development testing, first failures and repair
- Initial source patch head `2ecc76bc34d37cbc012c315af2720b568c8d83df`: Continuity workflow [41225558157](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41225558157) **PASS**; full-site workflow [41225558156](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41225558156) **FAIL** because a private research-reader integration test used the former master bearer token and expected HTTP 502, while it correctly obtained 401 under the new rule. This was a test/consumer contract mismatch, preserved, not a security bypass.
- After changing research readers to synthetic signed cookies, subsequent full-site run [41225665650](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41225665650) **FAIL** on a second legacy bearer fixture in `tests/site-inquiry-stats.mjs`, where 401 correctly replaced the old expected 200. This failure was also preserved. The continuity run remained passing.
- After updating the research-reader, inquiry-statistics and readiness consumers, the corrected source head `78af62e34e3741543fd1d6d936da3d469de96fda` passed both required workflows: public-site [41225729911](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41225729911) and continuity [41225729855](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41225729855), each **SUCCESS**. A final report commit requires its own exact-head CI run.

Testing is fabricated developer-controlled unit/integration regression evidence. The tests do not access owner credentials, the production database, real participant records or release the site. Preserving first failing runs is required by Issue 3.3's adverse evidence rules.

### 4. Acceptance gate disposition
| Control | Current observed limit | Required closure |
|---|---|---|
| G0 source lineage | Prior Increment 16 Git ancestry + 24-file audit successful | Re-run on exact final candidate, control any new source change |
| G1 token confinement | Developer tests pass for cookie-only owner data access | Owner approved client compatibility, exact-preview live positive/negative login |
| G1 logout revocation | **NOT_IMPLEMENTED**; current browser-only clear, copied cookie replay open | Owner-approved server-side revocation mechanism and actual replay tests, or formally documented bounded alternative decision |
| G1 preview secret | Not present in previously inspected exact candidate branch | Private owner key rotation/configuration, redeployed exact SHA; do not disclose value |
| PST-03 privacy | Anonymous/fixtures checks only | Complete private API inventory and direct anonymous Supabase RLS refusal |
| PST-05 metrics | Read-only snapshot utility developer tested | Actual authorized fixed-cutoff 11-family source and cohort reconciliation |
| PST-09 mobile/recovery | No real phone acceptance | Actual iPhone Safari, logout, expiry, recovery, export and rollback |
| PST-11 production | No signed owner exact-SHA decision | HOLD until all critical controls accepted |
| DS-A/SP, H2/H3, R6 rights | Original 0/18; study not conducted; transfer 0/32 | Separate source recovery, study and rights procedures |

### 5. Final bounded decision
**Increment 17 cookie-only bearer-confinement correction:** Developer-tested and reviewable, *not merged or production accepted*. **Individual server-side revocation:** NOT_IMPLEMENTED. **G1 original owner session and direct RLS:** NOT_VERIFIED. **Website production:** HOLD. **Original DS-A:** NO_GO_NOT_VERIFIED. **Independent H2/H3:** NOT_ESTABLISHED. **Commercial transfer:** NOT_AUTHORIZED.

No owner secret, customer record, source study file, live writer, production deployment or commercial grant was accessed, changed or approved during this increment. The public JRS/DRR program and the private Decision Spellchecker research remain separate.

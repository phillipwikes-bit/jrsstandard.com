# JRS / DRR / Decision Spellchecker: Comprehensive Integrated Master Program
## Increment 18 | G2 / PST-03. Owner-only aggregate analytics gateway
**Date:** 31 October 2026. **Source of authority:** Issue 3.3, sections 3.3-04, 3.3-05, 3.3-11, 3.3-13 and 3.3-14. **Developer candidate:** draft PR #70, stacked on Increment 17. **Controlling outcome:** DEVELOPMENT-TESTED EDGE BARRIER ONLY; website production HOLD.

### 1. Direct source-observed gap and why it matters
Six owner Program Status statistics modules use `SUPABASE_SERVICE_ROLE_KEY` to read backend source tables but do **not** independently call `ownerAccess(req)` or otherwise require a valid signed owner session. Their existing responses permit wildcard `Access-Control-Allow-Origin: *`. They return primarily aggregates, not full raw rows. Aggregation, however, is not sufficient authentication when results include small-group details, source/edition-level funnels, consent and contactability counts, or consented organization names. These modules are not the deliberately public anonymous panel/supported-resource metrics.

The affected routes are:
- `/api/access-stats`: registered guide/support totals, consent tiers, distinct organizations and transferable-person counts.
- `/api/enroll-stats`: training enrollments, distinct people/organizations, completion countries and consent flags.
- `/api/orgpilot-stats`: organizational pilot sessions, record-review statistics, sectors, countries, and named organizations under reported opt-in.
- `/api/gate-stats`: registration funnels, field-touch events, consent counts, country splits and small-group analytics.
- `/api/geo-stats`: detailed download-request geography, dates, assets, source scopes and traffic-quality breakdown.
- `/api/asset-stats`: original asset and reviewer funnel data, restricted small-cell summaries and engagement breakdowns.

All six historical handlers are included in the preserved 24-file source baseline. The owner dashboard references the relevant endpoints. A source check of nine principal public-facing site pages found no direct references to these six API routes. This is a bounded review, not proof that every script, old client, external integration or historical link is unaffected. `/asset-stats` is a separate legacy redirect to `/api/asset-stats` and needs explicit preview testing.

**Evidence limitation:** These are source-level findings. No real database row, owner contact, case record, private message or production aggregate response was accessed for this review. No claim is made of confirmed exploitation, named-data breach, correct live server-side routing or complete RLS.

### 2. Implemented draft control and preserved original data
- `proxy.js` adds an explicit `OWNER_METRIC_PATHS` allowlist containing exactly the six reporting endpoints. These routes now pass through the existing `ownerAccess` signed-cookie gate before `next()`. The two original private owner HTML paths remain protected.
- `vercel.json` configures the same six exact API paths in the Vercel `proxy.matcher`. This integration is essential: a helper allowlist alone would not route incoming requests through the gate.
- An unconfigured owner secret yields 503 `owner_access_unavailable`, and an anonymous or forged cookie when configured yields HTTP 401 JSON without an HTML sign-in redirect. A raw long-term master bearer still fails under the Increment 17 cookie-only rule. POST/OPTIONS/DELETE are refused at the proxy before the original metric handlers execute.
- The legacy private HTML paths retain their existing 302 sign-in redirect for an unauthorized request. The unconfigured 503 remains an explicit availability failure, not an incorrect password.
- No historical `api/*-stats.js` source file, table, reader calculation, writer, 24-file baseline, existing controlled exception or event grain was modified. The two original development-only exceptions remain restricted to `api/support.js` and `api/support-stats.js`.

This is an **edge admission barrier** conditional on effective Vercel routing and correct live preview configuration. The legacy handler bodies still contain permissive CORS and no internal owner checks. Therefore the engineering change does not establish defense-in-depth or automatically certify that an alternate URL or direct-function invocation is blocked.

### 3. Synthetic regressions and adverse CI evidence
- `tests/owner-aggregate-proxy.test.mjs`: 13 test cases executed in the full-site workflow after installing the existing `@vercel/functions` dependency. They exercise the explicit six-path list, both preserved HTML routes, Vercel matcher, anonymous 503/401, forged/stale cookies, master-token bearer rejection, prohibited methods, HEAD denial and the absence of database calls. A valid signed cookie is independently accepted by `ownerAccess`; this is **not a live proxy forwarding or real-data test**.
- `tests/owner-router.mjs`: previous exact two-route configuration contract updated to recognize all eight owner-protected routes without removing the existing dashboard aliases.
- `tests/owner-aggregate-proxy-static.test.mjs`: eight dependency-free source-contract tests check matcher coverage, proxy control flow, HTML/JSON response differences, frozen source scope and exclusions for intentionally public endpoints. They do not execute the installed Vercel runtime.
- Both CI workflows now run their respective tests on proposed PR heads. The continuity workflow does not add package installation or network dependencies.

**Preserved failure:** [Actions 41227013143](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41227013143) failed when the new continuity step imported `@vercel/functions` without installing the package; full-site run [41227013140](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41227013140) passed its 13 behavioral tests. The failure was a test-runner dependency mismatch, not an observed unauthorized data exposure or bypass. A separate import-free source-contract suite was created rather than silently disabling the continuity check.

**Corrected pre-report runs:** [full-site 41227103805](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41227103805) completed SUCCESS with 13/13 cases; [continuity 41227103949](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41227103949) completed SUCCESS with 8/8 cases and inherited continuity checks. A new record commit must receive a separate exact-head CI result before the final record is described as fully tested.

### 4. G2 and PST-03 acceptance gates still outstanding
1. **Exact Preview identity and owner configuration, P0:** Owner securely rotates a new 32+ character token in protected Vercel settings, scopes it to one selected final Preview branch and rebuilds that exact Git SHA. Do not enter the token in public GitHub, CI output, this report or chat.
2. **Direct route denial and positive owner behavior, P0:** On that exact deployment, independently test each of the six API paths and the original two protected HTML aliases. Observe anonymous, expired, forged, bearer and configured-but-unsigned responses; verify a legitimate cookie-backed session succeeds. Verify the `/asset-stats` redirect, forbidden methods and no unintended alternate route bypass. Record status and headers only in public evidence, not response bodies containing actual private metrics.
3. **Original handler and database defense, P0:** Consider approved internal `ownerAccess` checks for each frozen handler under file-specific source-change exceptions rather than assuming edge-only security is sufficient. Direct anonymous Supabase privileges and row-level security must be tested with authorized safe fixtures. Neither action occurred here.
4. **Baseline reconciliation, P0:** Independently compare 11 source families and original cohorts at a fixed UTC cutoff with correct missingness and no false zero counts. Do not infer actual use, adoption or transfers from event totals.
5. **Client and public-route compatibility, P1:** Identify all old consumers and aliases, determine whether any external scripts rely on anonymous access, and verify public research and free resources remain usable without a password. The historical `/asset-stats` alias is a particular acceptance item.
6. **G1 session lifecycle, P0:** Durable individual-session revocation remains unimplemented; clearing a browser cookie does not stop replay of a previously copied valid stateless cookie.
7. **PST-11 release, G4:** Owner approval must name the exact source/deployment SHA and accepted exceptions. No merge, production promotion, bulk personal-data export, participant study or commercial transfer is implied by this increment.

### 5. Controlling dispositions and independent program boundaries
| Workstream | Evidence-bounded outcome |
|---|---|
| Increment 18 owner aggregate proxy | Implemented in draft; developer tests PASS on pre-report candidate |
| Endpoint-internal authentication | NOT IMPLEMENTED in historical readers; proxy-dependent |
| Exact configured live owner access and direct RLS | NOT VERIFIED |
| PST-03 / G2 operational acceptance | HOLD; no production pass |
| G1 durable session revocation | NOT IMPLEMENTED |
| Website production | HOLD |
| Original private Decision Spellchecker DS-A and SP-01..18 | NO_GO_NOT_VERIFIED; independent source evidence absent |
| H2 strong generic AI versus original H3 Decision Spellchecker | NOT_ESTABLISHED |
| R6 component rights / commercial conveyance | NOT_AUTHORIZED; 0/32 approved and historical digest discrepancy remains |

This increment advances the JRS/DRR public Program Status privacy control only. It does not conflate public educational materials with the original Decision Spellchecker product, substitute a constructed R6/R9 lab for original software, or permit the independent 156-record study. All owner-gate claims require their separate primary operational evidence.

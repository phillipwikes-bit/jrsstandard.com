# Decision Spellchecker / JRS: Anonymous-Access and Research-Reader Audit

**Audit date:** 2026-10-30  
**Implementation location:** Draft PR #48 only. No live database migration, row mutation, or production release.  
**Control objective:** Protect identifiable research, contact and owner-only operational data without disabling existing public aggregate statistics or altering historic measurements.

## Verified from current repository source

1. The following owner-only APIs now call the signed owner access guard: `api/leads-4b7e2c9af106d385.js`, `api/people-9dd1ecdf6f8cdfd4.js`, `api/roster-8c3f1a9e7b2d6045.js`, `api/geo-4e8b2d7f9a1c3065.js`, `api/recheck-answers-b1a768e88d3e48bd.js`, `api/variance-6b1d90fa2c47e8b3.js`, `api/owner-progress.js`, `api/site-inquiry-stats.js`, `api/enroll-admin.js`, `api/support-contacts.js`, `api/coauthor-stats.js`, `api/contributor-stats.js`, and `api/checkout-stats.js`.
2. The Programme Status page is intercepted by authenticated Vercel routing before the private static HTML is served. A public URL slug and noindex are not treated as access controls.
3. The recheck-reader endpoint formerly fetched only the first PostgREST response and could appear complete after a server-imposed row limit. It now uses a paginated reader that returns a completeness flag and refuses incomplete results with HTTP 502.
4. Training roster and guide-download geography readers previously discarded that completeness flag. Their new behavior refuses an interrupted or truncated read rather than presenting a plausible but incomplete denominator.
5. Crossed reviewer/item variance already used manual paging without a maximum-page bound. The updated reader uses the same bounded pagination helper and refuses an incomplete input population before fitting the model.
6. These four private research readers now accept GET only. The variance endpoint no longer returns permissive wildcard CORS for OPTIONS.
7. The changes do not modify records, scores, source timestamps, consent decisions or analytic denominators. Refusing a response when the source cannot be completely retrieved is deliberate and preferable to silently understating historical work.

## Deliberately separate public measurement routes

Some endpoints compute public aggregate research or engagement measurements, including `api/asset-stats.js`, `api/panel-stats.js`, `api/enroll-stats.js`, `api/access-stats.js`, `api/geo-stats.js` and `api/support-stats.js`. These routes may read database contact fields on the server to deduplicate or count them, even when their responses expose only aggregate results. This makes them **data-handling surfaces requiring output review**, not automatically suitable for owner-only gating. Existing public article and website figures depend on several of them.

**Pending verification:** independent response-schema inspection, classification of consent and cohort data, low-cell reidentification risk, and explicit decision about which aggregates are lawful and necessary to publish. Protecting an API route cannot be equated with confirming the live Supabase policy.

## SQL/permission inspection prepared, NOT executed

The file `docs/security/JRS_DECISION_SPELLCHECKER_READONLY_RLS_INVENTORY_2026-10-30.sql` runs read-only catalog queries in an authorized Supabase SQL editor. It reports table existence, anon/authenticated grants, RLS flags, policy definitions and callable security-definer functions. It does not read any named contact or research row. The current repository includes historical SQL setup scripts which are **not proof** of which policies actually apply in the live Supabase database.

**Before any site cutover, the owner or authorized database administrator must:**

- Execute the read-only inventory against the actual deployed Supabase project and preserve dated results in an owner-private evidence location, not in this public GitHub repo.
- Identify any effective anon/authenticated SELECT or callable function granting access to names, email, messages, case text, individual answers, nonpublic participant codes or private owner metrics. Investigate views and RPC routes as well as tables.
- Run negative anonymous REST probes using synthetic fixtures and least-privilege anonymous credentials. Do not copy actual personal data into logs or test reports.
- Separately verify intended public counts, download links, training and research pages, so privacy remediation does not erase visitor measurement.
- Audit historical GitHub commits and static assets for published sensitive material. A new token cannot retroactively unpublish old repository contents.
- Verify owner sign-in, signed-cookie expiration and failure modes in the deployed preview environment. An offline unit test or Vercel READY status alone does not prove middleware enforcement.

## Decision and limits

**Source-review increment complete; live privacy gate remains OPEN.** This is not a live database audit, independent security assurance, release authority or legal determination. Do not mark production or Decision Spellchecker engine readiness as achieved.

The official product name is **Decision Spellchecker**. JRS remains the originating public methodology and historical research framework, and all historical version/rights boundaries remain in force.

# Spellchecker / JRS site release: private owner access and categorized inquiry runbook

**Date:** 2026-10-30  
**Status:** DEVELOPMENT ONLY. Draft Pull Request #48 is NOT merged or deployed.  
**Scope:** JRS public method site navigation, multi-category professional inquiries, owner-private reporting. Spellchecker software availability, validation, commercial rights, and public Engine use remain unchanged.

## 1. Architecture and boundaries

- Public JRS website: method, free resources, research, reviewer training, For Organizations, and Contact & Inquiries.
- Commercial software identity: **Spellchecker**, separate from JRS's historical research and methodology. The product remains closed and under controlled development.
- Inquiries: `contact.html` -> `/api/site-inquiry` -> durable `pilot_contacts` row (`source=site-inquiry`) -> best-effort notifier. An email is not the primary record, and an email failure cannot invalidate an already stored inquiry.
- Contacts: `/api/leads-4b7e2c9af106d385` returns the inbox and labels category; `/api/people-9dd1ecdf6f8cdfd4` shows a named contact record. Both must require owner authentication before any database access.
- Owner sign-in: `/owner-login.html` -> `/api/owner-session`. The server checks a distinct, high-entropy `OWNER_DASHBOARD_TOKEN` and issues an eight-hour signed, `HttpOnly; Secure; SameSite=Strict` cookie. The browser must not store the original access code in localStorage, sessionStorage or URLs.
- Owner programme dashboard: existing `/programme-status-9872fb93cc94.html` has a sign-in check, sign-out and non-cacheable headers; direct browser reads of private `pilot_progress`, `armb_progress`, `realcase_progress` were replaced with authenticated `/api/owner-progress?view=...` requests.
- Owner-only data readers guarded in code: `api/leads-4b7e2c9af106d385.js`, `api/people-9dd1ecdf6f8cdfd4.js`, `api/roster-8c3f1a9e7b2d6045.js`, `api/recheck-answers-b1a768e88d3e48bd.js`, `api/geo-4e8b2d7f9a1c3065.js`, and `api/variance-6b1d90fa2c47e8b3.js`.

**Important limitation:** Authentication of these endpoints does not independently prove that every legacy database reader, every Supabase policy, every public-repository attachment or every other API route is access-controlled. The repository is public. A complete endpoint/DB RLS/anonymous-visibility inventory remains a release requirement.

## 2. Server settings required before preview acceptance

Configure these in Vercel using secret settings. Do not put values in GitHub, browser code, chat, issue comments, logs or documentation.

| Environment variable | Purpose | Current verified setting as of 2026-10-30 |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Existing server-side inquiry and dashboard storage/read | Present in preview and production; unchanged |
| `OWNER_DASHBOARD_TOKEN` | Separate 32+ character cryptographically random owner sign-in code; bearer support for controlled scripts | **NOT CONFIGURED** |
| `TURNSTILE_SITE_KEY` | Public widget key for the approved hostname | **NOT CONFIGURED** |
| `TURNSTILE_SECRET_KEY` | Server-only challenge verification secret | **NOT CONFIGURED** |
| `JRS_TURNSTILE_HOSTNAME` | Optional exact expected hostname for the provider verification response | Not configured; defaults to request hostname |
| `NOTIFY_TO` | Owner's private Gmail destination | Present in preview and production; value deliberately not reproduced |
| `JRS_INQUIRY_ALERTS_ENABLED` | Owner-approved mailer gate | Set for preview and production |
| `RESEND_API_KEY` or `SENDGRID_API_KEY` | Verified transactional mail provider, server only | **NOT CONFIGURED** |
| `NOTIFY_FROM` | Authorized domain-verified sender | Not configured |

**Source code dependency:** Draft PR #47 contains the notifier change to honor `JRS_INQUIRY_ALERTS_ENABLED`. PR #48 currently calls the existing notifier, whose hard-off directive remains in place until a separately reviewed integration of PR #47. Do not infer delivery from the presence of `NOTIFY_TO`.

## 3. Required pre-release acceptance sequence

1. Verify the current primary source-aligned document hashes and the operative Engine handoff. Preserve research and rights material without deletion.
2. Review and merge/coordinate PR #47 only after its offline checks and provider keys are correct. Keep all production enabling decisions explicit.
3. Configure preview-only owner sign-in secret and Turnstile keys for the preview hostname. Do not reuse personal Gmail passwords or `RUN_TOKEN`.
4. On an actual iPhone/Safari preview, verify owner login, refresh, expiration, sign-out, failed login, keyboard behavior and inability to access PII without a session. Verify no PII appears in anonymous network responses.
5. Perform a complete anonymous endpoint and Supabase RLS/anonymous-read audit. The original programme-status page contained browser-direct Supabase reads with a publishable key; deleting the browser code alone is not proof that underlying database row-level security has been corrected.
6. Use a **synthetic, owner-approved inquiry** to test one durable database write, correct category, name/email display only in authenticated owner inbox, exact consent version, privacy notice, and no uncontrolled duplicates.
7. Use the configured provider to verify that the notification actually reaches the owner Gmail inbox with correct sender, subject, category and Reply-To. Test provider outage after a durable row is written.
8. Verify Turnstile bot protection, abuse throttling/WAF, limits, challenge replay behavior, network failure, and suppression of confidential documents. The app has no file-upload handler.
9. Save a pre-release UTC-capped baseline for guide downloads, training completions, research participation, historical contacts and other `/api/asset-stats` measures. Repeat post-release at the same grain, including event types and crawler exclusion. No metric may silently reset or be attributed to a different cohort.
10. Audit privacy notice and records-retention processes, including the Cloudflare challenge provider, consent for contact only, deletion requests and organization-specific data. Do not imply contact consent permits sale/transfer.
11. Confirm responsive UI on iPhone and desktop, exact redirect behavior, 404 handling, page speed, accessible keyboard operation, and link preservation.
12. Require documented owner authorization before production merge/deployment, with change hash, rollback path, smoke test and post-release audit. A preview build or passing unit test is not a production gate.

## 4. Tests and evidence classification

- `node tests/owner-access.mjs`: no-token 503, missing/invalid bearer 401, signed cookie acceptance and tamper rejection, sign-in/logout, all identified private readers gated before DB access, authenticated progress proxy and no direct browser Supabase calls.
- `node tests/site-inquiry.mjs`: no-config rejection, malformed/foreign/oversized requests, Turnstile verified/unverified and hostname mismatch, storage success/error, correct category and explicit contact-consent version, no automatic transfer permission.
- `node tests/site-phase1.mjs`: 15 public primary navs, stable URLs, explicit Spellchecker distinction, preserved organizational form and dashboard GA4 removal.
- `node tests/public-route-alignment.mjs`: legacy public API/intake closure constraints.

All tests are synthetic and no actual Gmail delivery, record-subject consent, payment, public Engine use or real iPhone acceptance is inferred from their results.

## 5. Changes still required

**Blockers:** owner secret, Turnstile, provider setup, actual owner sign-in/device acceptance, authenticated PII endpoint coverage audit, DB RLS inspection, privacy notice review, verified notification receipt, cutover approval.

**Follow-up work:** consolidate old organizational form into the new portal after verified success; add controlled follow-up status and resolved/unresolved queue counts, with a versioned definition; create incident alerting and notification retry tracking; preserve all old download and pilot measurements; inspect public GitHub and repository history for material mistakenly treated as confidential.

**Do not merge solely because CI passes.** The programme's Engine `NO_GO_NOT_VERIFIED` status, application scope restrictions and the owner-side licensing/rights constraints remain in force.

## 6. Continuation: owner page routing, notification integration and inquiry measurement

**State checked:** 2026-10-30, development branch `feat/spellchecker-site-separation-phase1-2026-10-30`. This section supersedes earlier statements that PR #47 code remains unintegrated into PR #48.

### Completed in branch

1. Integrated the `api/_notify.js` provider-gated change and `tests/notify-gmail-readiness.mjs` from draft PR #47. A provider key and verified sender are still prerequisites. PR #47 remains open for separate historical traceability; the code is now proposed in PR #48 as well.
2. Added `proxy.js`, `package.json` with pinned `@vercel/functions` dependency, and `vercel.json` proxy matching the exact private Programme Status page. The owner session must pass server-side verification before the static HTML can be served. The former browser-only overlay remains secondary UX protection, not the security boundary.
3. Extended tests to verify unauthenticated GET/HEAD is blocked before the static page and malformed session-signature encodings are rejected. The signed owner session remains eight hours, HttpOnly, Secure and SameSite=Strict.
4. Added `api/site-inquiry-stats.js` to count only `source=site-inquiry` stored records, grouped into organization, research, training, prospective commercial and general inquiry types. The endpoint is owner-authenticated and returns no names, emails or message text. Unknown and malformed payloads are counted visibly rather than silently dropped.
5. Updated Programme Status to show all-time and last-30-day categorized inquiry counts separately. Historical commercial leads, checkout attempts, research cohorts, training and download tracking continue to have distinct definitions. The existing lead table remains an owner response queue, not a population-wide count.
6. Updated `privacy-notice.html` and the public contact form's consent language, excluding publication and transfer permission. The old extended privacy page remains a historical route; the current public redirect points to the revised notice.
7. GitHub Actions now runs the server-side routing, notification, owner access, categorized inquiry, inquiry statistics, public navigation and closed-route regression groups. `vercel.json` and current deployment builds require preview acceptance in addition to these offline tests.

### Still required

- Owner authentication secret with a secure owner-controlled recovery path, and verified operation on a real supported phone. It is not yet configured. **Do not merge this change without it:** otherwise the owner dashboard will correctly fail closed.
- Turnstile keys and authorized hostnames; the categorized form remains deliberately disabled until both server and browser keys are present.
- Verified transactional sender domain, provider key, actual Gmail receipt and alert failure exercise. A private recipient environment variable alone does not make email operational.
- Verification of database RLS/anonymous data access, all other owner-only routes, and the public GitHub exposure inventory, including historical commits.
- Actual pre-release/download/enrollment/research/lead count baseline and post-release reconciliation, with metadata and dates. The offline continuity checks do not prove live database preservation.
- Preview-route inspection confirming the routing middleware executes before static HTML, not merely that the build reaches READY.
- Privacy/data retention and subject-access implementation approval, actual mobile/keyboard tests, and explicit recorded production release authorization.

### Decision rule

**Keep PR #48 in draft; no production merge.** A green CI run or a Vercel preview status is an engineering prerequisite, not release, market, rights or validation evidence. The historical Review Engine remains `NO_GO_NOT_VERIFIED`.

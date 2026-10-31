# Increment 06, Program Status owner login readiness and mobile UX

Controlling plan: JRS / DRR / Decision Spellchecker, Issue 3.2, sections 3.2-04, 3.2-05, 3.2-06, 3.2-15.
Record date: 31 October 2026. State: DRAFT DEVELOPMENT ONLY; PRODUCTION HOLD.

## Verified prechange condition

The last reachable Vercel preview for the PR #60 branch returned
`GET /api/owner-session`: HTTP 503 with
`{"error":"owner_access_unavailable"}`. This means the deployed
function was not configured with a usable owner signing secret. The
branch-specific sensitive Vercel setting `OWNER_DASHBOARD_TOKEN` was
created after those previews were built and was not inherited by existing
deployments. The owner-reported failed mobile login was consistent
with this server condition. It did **not** establish that the owner
entered the wrong access code.

The Vercel deployment API previously returned HTTP 402 with code
`api-deployments-free-per-day`. A code commit or an environment-variable
edit does not retroactively update a deployed function. No owner login
was verified live after the blocked redeploy.

## Proposed narrowly scoped code change

- `owner-login.html` checks the server before enabling its password
  input and submission button. Server 503 displays a plain-language
  statement that no password will work until a rebuilt preview is ready.
- Configured but unauthenticated server 401 enables sign-in;
  authenticated server 200 sends the owner to the protected dashboard.
  Failed connection does not invite repeated password attempts.
- `api/owner-session.js` now distinguishes an unconfigured login POST
  (HTTP 503, `owner_access_unavailable`) from an incorrect password
  (HTTP 401, `unauthorized`), using one shared read-only
  `ownerAccessConfigured()` status from `api/_owner-auth.js`.
- No login code or response exposes a signing secret, database key,
  owner email, contact record, study source or session cookie to analytics.
- Source-level tests cover readiness GET 401/503/200, genuine wrong
  password, missing configuration, network failure, successful signed-in
  navigation, and no-browser-network side effects, including phone
  interaction semantics.

## Outstanding security and operational conditions

1. Branch-scoped Vercel secrets are **not** automatically inherited by a
   new child PR branch. The owner-configured token metadata found on
   `fix/jrs-legacy-support-write-ack-2026-10-31` does not prove it exists
   on this Increment 06 branch.
2. A password previously supplied in a ChatGPT message should be treated
   as exposed to anyone who can read that conversation. Rotate it by an
   owner-controlled procedure before publishing an authenticated preview
   containing private contacts or participant records. Do not embed the
   replacement secret in the report, GitHub or a publicly shared URL.
3. Live privacy and authorized-session tests still require a new preview
   with the **exact** branch and environment, valid owner login, denied
   anonymous access, expired/altered cookies, original and legacy HTML
   routes, and the full private API inventory.
4. The existing stateless HMAC cookie cannot be individually revoked by
   the browser logout action. Master-key rotation invalidates all cookies
   globally. PST-09 recovery and revocation remain open.
5. No production counts, Supabase RLS, download writer, named inquiry,
   notification or iPhone Safari success was independently accepted.
   A green code test does not close PST-01 through PST-12.

## Decision

Continue test-only development with a clear owner-login message.
No production deployment, payment, credential sharing, independent
Decision Spellchecker H2/H3 study or source transfer is authorized.

# Decision Spellchecker / JRS Preview Revision and Owner-Access Gate

**Prepared:** 30 October 2026 (America/New_York)  
**Scope:** Public JRS resource website and owner-only programme status, not Decision Spellchecker production software.  
**Decision state:** DEVELOPMENT. **NO PRODUCTION AUTHORIZATION.**

## Why this gate exists

A green GitHub Actions run and a Vercel preview URL can refer to *different source commits*. Earlier preview probes checked an older development revision after new security code had already been committed. This gate prevents those observations from being carried forward as if they verified the newest build.

The project's integrated programme requires source/version identification, no private owner record exposure, real mobile and session tests, an authorized rollback decision, preserved download metrics and no conflation of test evidence with operational proof. A production claim must be made for the actual reviewed deployment.

## Implemented controls

- `api/deployment-identity.js` reports only the 40-character commit SHA and that the environment is a preview. It does not report tokens, email addresses, database configuration, owner identities or private record content. If Vercel's system commit SHA is unavailable, it returns **503**, not a guessed identity. Production also returns 503.
- `scripts/preview-route-gates.mjs` requires a `https://*.vercel.app/` origin and exact expected commit SHA. It rejects redirects, host substitutions, missing identity and mismatched commits.
- A preview must return a functioning public contact page, organizational information page and inquiry-configuration endpoint before any private-route result is credited. This prevents Vercel platform-wide login screens from being mistaken for application authentication.
- All **16** named owner-only routes must reject anonymous GET with **401** (configured owner secret) or **503** (owner secret unconfigured). No private response body is read, copied into an artifact or logged.
- The script records separate counts for 401 and 503. It never labels 503 as successful operational login.
- The public inquiry configuration may indicate whether a challenge is *configured*, but cannot prove Turnstile effectiveness, real submission durability, provider email delivery or authorization.
- `tests/preview-route-gates.mjs` tests positive and hostile synthetic scenarios. The site CI includes it.

## Procedure, when a new preview is actually READY

1. Obtain the Vercel deployment URL and associated commit SHA through the connected Vercel deployment metadata. Verify the environment is **preview**.
2. Compare that SHA against the approved and tested development PR head. Any mismatch is a blocking failure.
3. Run `node scripts/preview-route-gates.mjs https://<exact-unique-preview>.vercel.app <exact-40-character-reviewed-sha>` from a clean checkout of the *same* source.
4. Retain only the minimal output, timestamp, Vercel deployment ID, source SHA, status code outcome counts and operator decision. Do not log private endpoint bodies, cookies or credentials.
5. If any private route returns 200, a redirect to another application, a 500/unexpected response or Vercel platform authentication instead of the tested JRS public pages, mark the check **BLOCKED**. Diagnose privately; no release.
6. If identity does not resolve, configure Vercel's reviewed System Environment Variables exposure only after security assessment, or define an equivalent immutable build-attestation mechanism. Do not disable the SHA gate for convenience.

## Additional gates that this probe does **not** discharge

- Confirm the owner secret is set securely in Vercel, separate from all provider and database keys. Prove real session creation, session expiry, sign-out, recovery and blocked unauthorized access on Safari and desktop.
- Perform read-only Supabase grants/RLS inspection and independently test anonymous denial to the relevant database tables. Server-side API authentication alone does not establish database safety.
- Configure Cloudflare Turnstile for the actual approved hostnames and conduct an authorized, synthetic successful challenge, durable write, challenge refusal and duplicate/rate-limiting drill. Never store real case records to satisfy a form test.
- Prove provider-sent alert receipt in the intended Gmail inbox with a consented test. A stored row is not a delivered email.
- Reconcile pre/post metrics over a frozen UTC historical period. Do not treat crawler-filtered requests as verified people or historical research as product validation.
- Complete owner-directed GitHub source exposure and rights review; public Git paths can remain visible regardless of Vercel deployment exclusions.
- Obtain explicit owner approval of the exact production commit, current rollback, public copy/claims and product restrictions. Decision Spellchecker remains **NO_GO_NOT_VERIFIED**.

## Allowed interpretation of a passing probe

A successful preview-gate run establishes only that **the tested version and sampled anonymous URL behaviors** matched the declared checks at the observation time. It does not establish operational readiness, confidentiality of Git history, DB RLS safety, authenticated end-to-end experience, browser accessibility, buyer interest, permission to transfer participant data or software validation.

**No release decision may be inferred from a source-only test or from this runbook.**

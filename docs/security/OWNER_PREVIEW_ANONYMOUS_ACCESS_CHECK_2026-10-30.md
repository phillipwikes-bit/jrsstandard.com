# JRS Owner Dashboard: Read-Only Preview Anonymous Access Probe

**Observed local date:** 2026-10-30 (America/New_York).  
**Target:** Vercel preview deployment `dpl_Hhy3VqyMDxyMLKUaU9e1et87HH9a`, commit `3d8f32b6c04444381c4be0c24742704bb3735291`, branch `feat/spellchecker-site-separation-phase1-2026-10-30`.  
**Scope:** Anonymous GET requests against the Vercel preview using the connected Vercel fetch tool. No credentials, cookie, request body or database writes used. Temporary Vercel preview sharing does not replace application-level owner authentication. This file contains no contact or personal records.

## Result

**15 of 15 sampled owner-private routes failed closed with HTTP 503** because the required `OWNER_DASHBOARD_TOKEN` was not configured. None of these requests returned a successful 200 response containing the protected page or named records.

| Response | Paths |
|---|---|
| 503, owner HTML not served | `/programme-status-9872fb93cc94.html` |
| 503, session/progress/inquiry reader | `/api/owner-session`, `/api/owner-progress?view=pilot`, `/api/site-inquiry-stats` |
| 503, named contacts and records | `/api/leads-4b7e2c9af106d385`, `/api/people-9dd1ecdf6f8cdfd4`, `/api/roster-8c3f1a9e7b2d6045`, `/api/recheck-answers-b1a768e88d3e48bd`, `/api/geo-4e8b2d7f9a1c3065`, `/api/variance-6b1d90fa2c47e8b3`, `/api/enroll-admin`, `/api/support-contacts`, `/api/coauthor-stats`, `/api/contributor-stats`, `/api/checkout-stats` |
| 200, intended public aggregate | `/api/geo-stats` |
| 200, intended public configuration | `/api/site-inquiry-config`, response `enabled:false, site_key:null` |

These are **route-level observations only** and do not establish database RLS or anonymous Supabase table denial. The public aggregate's numerical contents were not assessed for re-identification risks by this test. No website inquiry was submitted because the public Turnstile integration was correctly disabled.

## Limits

1. Authentication is *unconfigured* on the observed deployment, and HTTP 503 is the designed closed-door response. This is evidence that unauthenticated/private requests fail closed in that state, **not** proof that a configured login works, that ordinary 401 denial is correct, or that recovery/sign-out/expiry are correct on an iPhone.
2. The preview's source commit predates the new `api/owner-release-readiness.js` and new commercial-purpose classification work from the dependent development PR. Those changes were not covered by this live probe.
3. This check cannot establish absence of sensitive materials in public Git history, direct storage URLs, unrelated APIs, cached content or anonymous RLS policies.
4. Vercel READY signifies deployment of the reviewed source commit only. It is not production-release authorization or software validation.

## Remaining gates

- Owner-configured strong session secret, working preview authentication and sign-out/recovery validation.
- Live SQL privileges/RLS read-only inspection and anonymous access-denial tests in Supabase, with table names and criteria documented.
- Turnstile configuration on actual site/preview hostnames, successful synthetic consented inquiry, verified durable row and notifications, and abuse controls.
- Review of personal-data visibility in public aggregates, Git current tree and history, rights-to-transfer basis, data retention, and a complete release record.
- Confirm the finalized draft PR #48 head in its own preview after all dependent changes are integrated.
- Owner authorization and rollback acceptance. Decision Spellchecker Engine remains **NO_GO_NOT_VERIFIED**.

**Disposition:** Route fail-closed behavior demonstrated for the sampled unconfigured preview; full private dashboard release **BLOCKED**.

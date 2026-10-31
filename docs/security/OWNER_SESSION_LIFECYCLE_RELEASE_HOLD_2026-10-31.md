# Increment 04 owner-session lifecycle control and disposition
Date: 2026-10-31. Related Issue 3.2 sections: 3.2-04, 3.2-05, 3.2-06, 3.2-15.
Release scope: draft tests and security instructions ONLY. No production owner credential is set or requested.

## Tested contract, using synthetic credentials only
`tests/owner-session-lifecycle.test.mjs` tests the exact existing
`api/_owner-auth.js` and `api/owner-session.js`, not a replica.
It covers missing/weak service secret, unsigned GET, valid/invalid bearer,
same-origin JSON login, correct signed cookie, tampered cookie, expiry,
master-secret rotation, browser logout and invalid request bodies.
There are no outbound API or database calls.

## Material adverse observation: sign-out is not token revocation
The DELETE owner-session route responds with Set-Cookie: empty/Max-Age=0
and removes the owner's first-party browser cookie. The cookie is
a stateless 8-hour HMAC bearer credential. A copy of that cookie made
before logout may still authorize a GET after logout and until its expiry,
or until the `OWNER_DASHBOARD_TOKEN` secret is rotated. This is an
expected technical property of stateless signed sessions, not evidence
that a real cookie has been stolen or that the live site was breached.
**PST-02/PST-03/PST-09 cannot be marked fully passed as server-side
individual-session revocation.** Distinguish successful browser sign-out
from server-side cookie invalidation in the release report.

## Risk disposition (SSR-01, high)
Proposed minimum operating control: protect the master secret; use a short
session lifetime only if the owner accepts usability tradeoffs; monitor
failed authorization without logging tokens; provide a documented
master-secret rotation and owner recovery procedure. Rotation revokes
all old cookies, not only one stolen or signed-out cookie.

To actually support individual-session revocation, design a server-side
revocable session identifier, with a durable session table, owner-managed
revocation endpoint, expiry/index/retention and fail-closed storage
behavior. Do not implement casually inside a public-site renovation.
This design requires a separate privacy/security decision and tests for
multi-region consistency, loss of backing store, logoff, revoked replay,
owner recovery and backup restoration. Until implemented and tested,
document **individual revocation unsupported** and require explicit
risk disposition before production release.

## Owner authentication configuration remains a blocker
As separately checked, Vercel's preview environment metadata did not
list `OWNER_DASHBOARD_TOKEN`. Do not paste any secret into this document,
the repository, a chat or a PR. Have the authorized owner configure a
new unique >=32-character secret in the appropriate Vercel sensitive
environment setting using the normal protected operator procedure.
Verify availability only through authenticated direct requests, not by
revealing its value. The uploaded Issue 3.2 plan requires owner-run tests
of signed/unsigned/expired/invalid sessions, actual RLS, iPhone Safari,
recovery, fixed-cutoff metrics and notification delivery.

## Evidence and implementation boundaries
A green CI test with synthetic credentials verifies only source-code
behavior of the named build. It cannot prove owner-secret configuration,
live routing, real cookie revocation, Supabase RLS, database counts,
privacy-law compliance, production releases or material product
effectiveness. No work here changes the source-frozen 24 data modules,
legacy event semantics, or public JRS/DRR resource availability.

**Current gate:** DEVELOPMENT-TESTED after CI, operational status HOLD.
**Decision to owner:** Either fund and authorize a scoped revocable-session
design, or explicitly accept the nonrevocable-until-expiry limitation
with documented compensating controls and a bounded use case. No implied
approval has been provided.

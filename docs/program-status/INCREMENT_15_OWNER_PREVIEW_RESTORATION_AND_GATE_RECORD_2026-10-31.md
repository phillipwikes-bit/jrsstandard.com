# JRS / DRR / Decision Spellchecker: Comprehensive Integrated Master Program
## Increment 15. Program Status owner-preview admission and credential-scope diagnosis
**Date:** 31 October 2026. **Reference authority:** governing Issue 3.2, 223-page master through Increment 10, especially sections 3.2-04 to 3.2-06 and the twelve PST release gates. Increment 14 established that the 223-page version, rather than the shorter available-source compilation, is the governing historical baseline.

### 1. Decision and priority
**Production Program Status: HOLD. Owner access: NOT_VERIFIED.** This increment addresses the actual access-blocking dependency before any further attempt to certify PST-01/02/03/09 or reconcile named counts. It does not implement new authentication, change or read an owner token, invoke a real authenticated session, run a database query, send notifications, deploy production or modify the master PDF.

### 2. Direct read-only Vercel observations
The exact candidate under inspection was draft PR #66, head `e460e490d11a1638d4f2544ac0406705d0dfcac0`, branch `docs/increment14-governing-source-claims-2026-10-31`. At the inspection cutoff, the most recent available ready preview for that branch was deployment `dpl_3J3y6ZwpQbXWadJbsCSYrfwf8JAu`, commit `4c39b3d249654a8e41e59144f5c45a0f25fef7b1`, not the current head. Its Vercel metadata returned a ready *build* state without confirming the `target` field. A stale READY preview is not release evidence.

A metadata-only project environment-variable review, with decryption explicitly disabled, found a sensitive `OWNER_DASHBOARD_TOKEN` entry restricted to the earlier branch `fix/jrs-legacy-support-write-ack-2026-10-31`. No equivalent entry was present in metadata for the inspected PR #66 branch, and no unscoped preview entry was identified. The existence of a key entry does not establish its value, minimum length, validity or actual injection into any later build. A previously chat-exposed owner credential is reported in the governing history; a new secure rotation has not been directly verified.

Three actual read-only anonymous requests against the available earlier-SHA preview returned:
- GET `/api/owner-session`: HTTP 503, JSON error `owner_access_unavailable`.
- GET `/programme-status-9872fb93cc94.html`: HTTP 503, JSON error `owner_access_unavailable`.
- GET `/api/support-contacts`: HTTP 503, JSON error `owner_access_unavailable`.

These responses included `Cache-Control: no-store, private` and `X-Robots-Tag: noindex,nofollow`. This verifies a fail-closed negative path for **those three routes on that earlier deployment** only. It does not establish successful login, denial of every restricted API, direct database RLS, Safari use, a private dashboard render, source-count completeness or exact-head readiness. The response is consistent with no usable owner secret being configured on the inspected deployment.

### 3. Implemented bounded control
`tools/check-owner-preview-admission.mjs` performs a deterministic offline preflight on a **redacted, key-name-only** source observation. It rejects unknown input fields to prevent accidental inclusion of credentials or named records in this developer evidence. It checks:
1. Exact current candidate SHA against observed preview SHA and branch identity; draft/merged state; preview build status and independently confirmed target.
2. Presence of the *key name* `OWNER_DASHBOARD_TOKEN` in the selected preview branch or an unscoped preview environment, without decrypting a value. An environment entry on another branch cannot count as a configured key on this branch.
3. Owner-confirmed prior credential rotation, treated as absent until independently recorded.
4. Three exact anonymous private routes, refusing 200/206/304 as possible exposures, recognizing 503 `owner_access_unavailable` as *unconfigured/unavailable*, not a rejected password, and distinguishing a 401 negative test from a **positive** owner login.
5. No-store and noindex headers on each protected route.
6. Separate gates for successful owner authentication, expired/revoked cookies, direct anonymous Supabase RLS, fixed UTC-cutoff counts, actual iPhone Safari, tested rollback and exact-SHA owner release decision.

The tool always returns `HOLD` and the material outstanding gates. It does not grant production authorization even when all values are self-asserted true. Its CLI prints no raw source data, user names, credentials or access cookies. It is not a substitute for source-backed, signed independent acceptance evidence.

`tests/owner-preview-admission.test.mjs` contains 16 synthetic cases covering mismatched build identity, misplaced token metadata, 503 status interpretation, authorized-unknown 401 paths, possible anonymous exposure, header failures, unsafe/duplicate routes, arbitrary secret fields, false owner signoff, and false-ready claims. The new workflow step is in `.github/workflows/public-interest-continuity.yml`.

### 4. Required owner-controlled restoration sequence, not performed here
**P0: secure secret rotation and exact-preview scope.** An authorized owner must use the project's protected Vercel Environment Variables interface, not a GitHub commit, chat message, public PR, report, or deployment URL query, to create a *new unique high-entropy token at least 32 characters long*. The Vercel key must be `OWNER_DASHBOARD_TOKEN`, target `Preview`, with scope explicitly covering the one chosen **final** candidate branch. Do not reuse, copy, decrypt or extend the historical token from the earlier branch. The older exposed credential should be retired on its branch and any other active environments under a separately recorded owner security decision. Store the new access code in an owner-controlled password manager. No credential bytes belong in this report.

**P0: rebuild exact candidate.** Once the owner has safely configured the key, trigger a new Vercel preview build and capture its deployment ID, branch, target and commit SHA. The new deployment's SHA must match the owner-selected final candidate, including all PR changes and the recorded 24-file source-diff exceptions. The current earlier-SHA preview is insufficient.

**P0: negative and positive owner checks.** Anonymous GET to owner session, private dashboard and **all** restricted owner APIs should return an authorization denial, normally HTTP 401 when correctly configured, with private/no-store/noindex headers. A true positive check requires the owner to sign in from the first-party login page without putting the token into query parameters or monitoring logs, then directly confirm protected HTML, required private API inventory, absence of cross-origin leakage and session-cookie security. The observed GET 401 is a negative control, not proof that the supplied secret works. If the owner still sees 503, continue configuration diagnosis; do not guess passwords.

**P0: session and data boundaries.** Record expiry, tamper and rotation tests and disposition of the known stateless cookie-logout replay limitation. Perform direct anonymous database RLS refusal against authorized test fixtures; then reconcile 11 raw source families and separate training, researcher, guide-edition, inquiry and historic click aggregates at a fixed UTC cutoff. Do not copy names or other private records into the public CI artifacts.

**P1: device, notifications, rollback and owner signoff.** The owner must verify actual iPhone Safari interrupted sign-in/recovery, direct legacy aliases, needed free resources, controlled synthetic write/read (with proper environment isolation), durable inquiry provider receipt, source continuity, and rollback. Record exact-head owner approval only if the full PST gate record passes. Until then keep the public site release on HOLD.

### 5. Boundaries and negative findings
- An existing variable's *name* and target scope are configuration metadata, not password validity evidence.
- The older Vercel preview's 503 is a genuinely observed fail-closed outcome; it is not proof of working owner authentication.
- No branch or production secret was read, copied, changed, generated or revealed. No live DB row body, contact identity or participant record was accessed.
- CI and an offline metadata checker are developer controls, not a security audit, consent audit or acceptance certificate.
- The original Decision Spellchecker DS-A remains `NO_GO_NOT_VERIFIED`, R6 transfer remains `NOT_AUTHORIZED`, and independent H2-versus-H3 remains `NOT_ESTABLISHED`. JRS/DRR public education and research cannot be converted into a paid funnel or product validation by these website changes.

### 6. Release evidence required before claim upgrade
PST-01 exact authenticated legacy alias. PST-02 valid/invalid/expired owner HTML paths. PST-03 inventory of private APIs and direct anonymous RLS denial. PST-05 fixed-cutoff counts and source-family completeness. PST-07 public navigation and real browser acceptance. PST-09 actual iPhone Safari, recovery, and logout/cookie disposition. PST-11 signed exact-SHA owner decision and reversible rollback. Remaining PST-04, 06, 08, 10 and 12 require their separate continuity, writer, consent/privacy, inquiry and postrelease monitoring artifacts. PST-12 cannot be completed before a duly authorized release.

**Disposition: Increment 15 developer control only. Exact current owner session not authenticated. Production HOLD. Source, study and transaction authority unchanged.**

# JRS / DRR Program Status and support statistics: Increment 03 evidence

**Date:** 2026-10-31 UTC  
**Decision:** DEVELOPMENT VERIFIED IN PART / PRODUCTION HOLD  
**Controlling plan:** JRS/DRR/Decision Spellchecker Integrated Master Program, Issue 3.1, §08B, gates PST-01 through PST-12.  
**Source context:** stacked draft PR #56 (public-interest changes), draft PR #57 (support-statistics completeness amendment). No production merge or promotion.

## Actual Vercel preview observations

A read-only HTTP examination was conducted on the available development preview of commit
`8f57d584792239d101c8dc0a016026c3b46026a7`, which precedes the support-statistics amendment. The development preview was accessed using the connected owner's Vercel account; no private user records, cookies or tokens were exported into the evidence.

| Surface | Observed response | Meaning |
| --- | --- | --- |
| Canonical Program Status HTML | 503; owner_access_unavailable; private/no-store/noindex | Server rejects before HTML disclosure; valid owner access not tested |
| Owner's legacy Program Status URL | 503; owner_access_unavailable; private/no-store/noindex | Protection is observed; successful alias redirect after authentication unverified |
| Owner session GET | 503; owner_access_unavailable; private/no-store/noindex | Authentication configuration unavailable |
| Private owner-progress GET | 503; owner_access_unavailable; private/no-store/noindex | No read through this request |
| Three public free pages | 200 HTML | Served in the preview; mobile/a11y not proven |
| Fourteen specifically enumerated private APIs | 14 of 14 returned 503 owner_access_unavailable | This is a fail-closed negative-access observation, not an authorization test |

The 14 negative-access API probes were GET-only: leads, people, research roster,
research geography, recheck answers, variance, owner progress, inquiry statistics,
release readiness, enrollment administration, support contacts, coauthor,
contributor and checkout statistics. Each returned a non-cacheable private error.
**No valid signed session, revoked/expired session, source-table RLS, mobile or
post-release request was tested.**

## Configuration inventory

The Vercel project's environment-variable metadata was reviewed with decryption
disabled. The listed variables did **not** include the specific
`OWNER_DASHBOARD_TOKEN` required by `api/_owner-auth.js`. This is a configuration
blocker. It must be resolved through a protected owner-controlled secret setup;
do not add a token value to source, PR comments, ChatGPT documents or release logs.
After configuration, retest the exact deployment, both routes, valid and invalid
sessions, logout and all private APIs.

## Proposed measurement correction (draft PR #57)

The frozen `api/support-stats.js` formerly returned zero-valued HTTP 200
responses on source failure and accepted partial historical paginated reads by
using a helper that ignored its incomplete result. Draft PR #57:
- switches historical support, outage and public-consent cohorts to complete-aware paged reads;
- rejects unavailable, incomplete or malformed named-supporter counts;
- returns HTTP 502 or 503 with explicit error, rather than pretending that zero
  rows were observed;
- preserves the successful response field structure, legacy event definitions,
  historical data, consent-based public names and existing database tables;
- retains the original 24-file freeze and records exactly one proposed exception
  with old/new blob SHAs, **NOT RELEASE APPROVED**;
- adds mocked missing-key, 503, truncated second-page, real-empty, counting,
  public-listing consent, and non-leakage tests.

The candidate support-statistics endpoint returned HTTP 200 with its legacy
schema during one read-only preview request to deployment SHA
`ae6a0ae4802bd5076189297191ba1075b52a2cc5`. This confirms only the
successful-response route on that build. It does not establish equal historical
counts or absence of defects on a later SHA. The production reader remains
unchanged until a future authorized release.

## Release gate accounting

| Gate | Current evidence | State |
| --- | --- | --- |
| PST-01 legacy alias | Negative authorization response observed for both variants; valid owner redirect untested | NOT VERIFIED |
| PST-02 protected HTML | 503 with private/no-store/noindex, no page disclosed | NEGATIVE PATH OBSERVED; NOT FULL PASS |
| PST-03 owner APIs / RLS | 14/14 private routes failed closed; valid session and RLS untested | PARTIAL, HOLD |
| PST-04 source integrity | PR #56 frozen baseline; PR #57 explicitly proposed one-file exception | CONTROLLED DRAFT |
| PST-05 historical counts | No authorized fixed-cutoff database snapshot | NOT VERIFIED |
| PST-06 writer continuity | No live write submitted; no synthetic test-row pollution | NOT VERIFIED |
| PST-07 public pages | Three informational pages served HTTP 200 | PREVIEW SERVE CHECK ONLY |
| PST-08 privacy / consent | No owner records disclosed in negative probes; data flows not comprehensively audited | NOT VERIFIED |
| PST-09 mobile / recovery | No real iPhone sign-in, logout or recovery test | NOT VERIFIED |
| PST-10 notification | No authorized delivery test | NOT VERIFIED |
| PST-11 release authorization | No exact-SHA owner production approval | NOT AUTHORIZED |
| PST-12 postrelease checks | Not applicable before a release | NOT ASSESSED |

## Separate program constraints

- R6 reference lab is developer-tested with fictional fixtures. No original
  Decision Spellchecker v0.6.11 source was recovered in this increment.
- No independent H2 versus H3 comparison was executed or inferred.
- R6 source/rights inventory remains unsuitable for an exclusive asset sale.
- Public JRS/DRR resources and download records are not a software acquisition
  buyer list; no stakeholder email or marketplace listing was sent.
- No `SUPABASE_SERVICE_ROLE_KEY` or owner credential was read/decrypted or saved.

**Next operational decision:** resolve owner authentication configuration in
the appropriate Vercel target, test authorized and refused access, capture a
fixed UTC historical snapshot with the owner-run read-only utility, and only
then authorize a staged release. Product-sale preparation remains a separate
rights/source and demand-led workstream.

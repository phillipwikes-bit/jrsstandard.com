# JRS Owner Access: Production Observation and Controlled Release Record

**Record date:** 2026-11-01  
**Classification:** Source/release assurance record. Does not contain participant records, inbox messages, keys, or response bodies.  
**Disposition:** P0 confidentiality risk open; live mitigation not established.

## Observation

During a connected, read-only production inspection, requests that supplied no owner credential received HTTP 200 from the static Programme Status document and multiple endpoints documented in the repository as private owner readers. Returned response types included HTML and JSON. Examples by **route purpose** (no personal data transcribed):

| Route purpose | Observed status | Response type | Interpretation |
| --- | --- | --- | --- |
| Original static owner dashboard | 200 | HTML | The static source remained retrievable without owner credentials in this inspection |
| Named participant / contact reader | 200 | JSON | Substantive response, owner authentication not established |
| Private inquiry / lead reader | 200 | JSON | Substantive response, owner authentication not established |
| Field roster and geography views | 200 | HTML | Owner-only reader boundary not established |
| Recheck / reviewer-variance readers | 200 | JSON | Research-reader access boundary not established |

The verification did **not** determine whether unauthorized third parties previously accessed any record, the full scope of exposed fields, Supabase anonymous policy effectiveness, or whether a breach-notification obligation arose. The connector can retrieve deployment content with project-level access; an independent public-network anonymous test and access-log review are still required.

## Remediation proposed on this branch

1. Source-level owner checks run before eleven private reader handlers issue database calls. Missing or undersized owner credentials fail with 503; missing or invalid authorization with configured credentials fails with 401.
2. The historical static dashboard document is replaced with a restriction notice. This prevents the current HTML from being distributed **after the revised deployment is live** but does not protect earlier deployments, archive copies or the repository's history.
3. Private HTML receives no-store and noindex response headers. These do not replace authentication.
4. Public methodology, download links, research and contact workflows are left unchanged.
5. A read-only Supabase RLS, grants and policy inventory is prepared in `JRS_READONLY_SUPABASE_RLS_INVENTORY_2026-11-01.sql`. No live database audit or schema change has occurred.
6. Synthetic regression tests verify rejection before database calls. The tests do not prove live production denial.

## External platform limitation

A 2026-11-01 Vercel deployment attempt was rejected as HTTP 402, code `api-deployments-free-per-day`, with an account-level limit above 100 deployments. No current-head preview or production release can be confirmed. The project Firewall API returned `Seawall Config not found` on inspection and update attempts, so **no firewall rule was activated**.

## Release control matrix

| Gate | Required evidence | Status |
| --- | --- | --- |
| Source unit and public regressions | Green CI at exact branch head | Passed (synthetic) |
| Preview artifact | READY deployment at exact tested commit | Not met, platform limit |
| Anonymous owner HTML request | Only restriction notice, with no sensitive original source | Not met |
| Anonymous private API requests | 401/503 for all owner readers, no personal data | Not met |
| Public route continuity | Verified ordinary access to public tools, research and contact | Not met on final preview |
| Database permissions | Read-only inventory plus actual anonymous RLS tests | Not met |
| Historical exposure review | Logs, authorized data classification, corrective notification decision | Not met |
| Owner access restoration | Verified sign-in/recovery, no cookie replay, logout and session limits | Not met |
| Rollback | Recorded known-good fallback and route-status proof | Not met |
| Owner release authorization | Dated release decision after gates | Not met |

## Required handling

Keep the PR unmerged while the platform cannot deploy and verify the exact release. Do not present GitHub changes as live controls. Do not share credentials, contact rosters, identifiable study records or response bodies in public pull-request comments. Preserve source changes and historical records for review rather than modifying production data to make results look complete.

**Nonclaim:** This record documents an access-control risk and proposed source mitigation. It is not a final incident finding, certification, privacy compliance conclusion, authorization to release the Review Engine, or proof that current production is secured.

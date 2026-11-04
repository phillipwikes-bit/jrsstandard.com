# JRS current inquiry dashboard integration

Prepared: 3 November 2026
Status: source candidate only; not published or ready for buyer access.
Scope: owner's private dashboard, not public registration or research participants.

## Existing delivery path, unchanged
Public contact form -> /api/site-inquiry.js -> Formspree form mreddwdg -> Formspree's configured Gmail notification.
The Gmail recipient has received test notifications. Formspree acceptance does not independently verify Gmail delivery.
New public form submissions are not duplicated into the historical Supabase "site-inquiry" table.

## Current integration
The existing /api/owner-formspree-inbox.js is an authenticated, read-only Formspree reader.
It is source-complete for the provider's nonspam submissions pages only; it explicitly excludes spam
and unreprocessed over-limit messages and does not promise unique contacts or buyer interest.

The private dashboard now includes:
- Source health and precise unavailable-versus-zero handling.
- Four source-status cards, local category/status filters, owner-only named inbox rows.
- Direct Gmail search fallback, optional private CSV export (all retrieved rows) with CSV injection handling.
- A distinct owner-entered follow-up state: not recorded, needs review, reply marked sent, closed, not relevant.
- Separately stored triage states linked by stable provider submission ID; no new contact data replication.
- Explicit distinction between an owner-selected reply state and verified Gmail delivery.

## Private database table
Migration: supabase-owner-inquiry-followup.sql (NOT executed by source deployment).
No message content, email, names, organization or PII is stored in that table.
RLS is enabled with no public row policies. The service role can read/write; the
API first verifies the owner's server-side signed session. PUT also requires same-origin
and allowlisted record ID, status and JSON keys. No buyer or public access is granted.

## Deployment prerequisites and evidence
- Formspree read credential FORMSPREE_READ_API_KEY: NOT configured in latest visible Vercel project inventory.
  Its Formspree submissions API may require a provider plan. Do not claim live dashboard retrieval.
- Supabase service-role credential: live existence must be verified at release, never published or logged.
- Follow-up table: migration requires a separate authorized database change. When absent, the
  dashboard continues showing source rows read-only and labels follow-up unavailable, not zero.
- Owner session, protected HTML proxy, email delivery, Formspree source pagination and
  independent hosted privacy/security checks must be verified on the exact production candidate.
- Preserve production release hold, no merge or preview-only bypass, and explicit release authorization.

## Buyer-package limitation
Private contact inquiries are NOT automatically licensed leads or buyer-authorized data.
The general inquiry form explicitly records contact-only permission and no transfer authorization.
Do not forward this dashboard or its private CSV to prospective buyers as a diligence package
without an independently documented permission basis and role-specific access controls.
Research participant releases do not automatically extend to unrelated contact submissions.

## Reversible owner follow-up and provider connection status, 3 November 2026

Owner status “Not recorded” now performs an explicit, owner-authenticated reset of the corresponding status row through the private server. It does not remove original contact messages, Formspree submissions or Gmail notifications. The database grant now covers service-role-only DELETE of these status rows. Missing rows can be treated as cleared, but upstream errors never report success.

The dashboard distinguishes a missing Formspree submissions API credential from transport and provider availability failures. No external provider or database connection is invented.

**Verified blockers at this review:** The Vercel JRS project contains a Supabase service-role environment variable but no Formspree submissions read credential. The Formspree browser profile is not signed in, and no native Formspree connector is available. The connected Neon project search found no JRS database; Neon is not a replacement for the separate JRS Supabase project. The SQL migration remains not applied, and the provider account and exact-commit hosted preview remain unverified.

**Unchanged:** Public form -> Formspree -> existing Gmail notifications. No new public analytics, provider account, contact record copies, automatic outreach, production publishing or buyer disclosures.

## Owner-only connection diagnostics (3 November 2026)

Added `/api/owner-inquiry-readiness`, which is protected by the existing signed owner session. Its explicit, voluntary dashboard action probes:
- Formspree submissions access with a one-record maximum response processed and discarded on the server, returning only an access-state code. The API key is read from the server environment; it is never sent to the browser.
- The private Supabase follow-up table using a zero-row HTTP HEAD request. This establishes only whether a table can be read using the configured service credential, **not** that follow-up status writes succeed.
- Gmail delivery is labelled `delivery_not_verified_by_this_check` because neither a Formspree API probe nor a successful form submission confirms Gmail inbox receipt.

The response has `Cache-Control: private, no-store`, excludes names, emails, message content and tokens, returns no count estimate, and states `release: hold`. Requests are bounded by short timeouts. All provider failures are explicitly `not verified`; no zero is inferred.

Provider documentation confirms the Formspree submissions API and per-form read key require a Professional or Business plan. The form itself and existing Gmail notifications can continue without this API. No purchase, plan change, credential-generation or provider login has been performed. See:
https://help.formspree.io/articles/the-forms-api/form-submissions-api
https://help.formspree.io/articles/the-forms-api/api-keys

Dedicated synthetic tests check authentication, missing credentials, single-record bounded Formspree probe, zero-row database probe, provider denials, malformed responses, transport failures and the absence of submitted data in diagnostics. The owner dashboard workflow runs these tests automatically.

### Remaining, genuinely external blockers

1. **Provider access:** `FORMSPREE_READ_API_KEY` is not configured in the JRS Vercel project. The JRS Formspree plan and ownership of an eligible read key remain unknown. No read API connection is claimed.
2. **Database DDL:** The SQL migration `supabase-owner-inquiry-followup.sql` has not been applied. A configured service-role secret in Vercel is not proof of schema-install privileges or successful migration. The Supabase app is not connected in this ChatGPT session.
3. **Exact-commit preview:** No verified Vercel deployment of the latest PR #122 commit was established, so independent hosted authentication, privacy, PDF/visual and mobile testing remain blocked. Do not request recurring manual preview builds under the deployment-quota restriction.
4. **Owner-only disclosure:** Buyer diligence requires separately authorized views. This diagnostics change does not expose contact names or establish commercial lead status.

Draft PR remains open and unmerged. No production publication, new analytics, contact-form routing change or outbound email was performed.

## Credential-independent, local-only Formspree CSV review (3 November 2026)

While Formspree read API access remains unavailable, the private owner dashboard can now inspect a manually selected CSV entirely in the owner browser. This is deliberately a **different source** from provider-verified Formspree ingestion. The unverified imported rows are never incorporated into source-verified totals, historical research records, or buyer adoption measures.

- Native file input reads local `.csv` or `text/csv` with `File.text()`. No server upload, network request, Google Analytics tag, clipboard use, localStorage, sessionStorage or IndexedDB persistence is made by the module.
- Parser supports quoted commas, newlines and double quotes, and rejects malformed columns, duplicate header names, files exceeding 1 MB and more than 2,000 rows. An import must include `email` and `message` fields. A manually supplied CSV is not proof of unique contacts, delivery, permission or organizational uptake.
- Up to 150 rows are visible; the owner can temporarily mark reply/review/closure states for local review. Such status changes are **not** stored in the Supabase follow-up table and are not verified against Gmail.
- An explicit, confirmed private CSV export preserves every loaded row with temporary review status and mitigates CSV formula injection. The Clear control and page closure remove in-memory state. No data is uploaded or emailed.
- Standalone synthetic tests in `tests/owner-local-inquiry-import.mjs` cover parsing, scope, formula protection, browser-only storage and data-source separation. They run inside the existing private owner dashboard workflow.

This fallback does **not** provide automatic synchronization and it does not fix the Formspree Professional/Business submissions API requirement or the unapplied Supabase follow-up migration. It creates no storage of contact details in another system. The Formspree inbox remains authoritative and Gmail notifications remain the existing owner alert route. No change was made to the public contact form or existing contact-consent terms.

Production, public contact systems and private buyer release permissions remain unchanged. This is source-only preparation under the existing draft release hold.

## Corrected local review continuity and full-row navigation, 3 November 2026

The original fallback lost temporary owner follow-up decisions whenever a reviewed CSV was reimported. That defect is corrected in the source candidate.

- JRS-reviewed CSV exports include a fixed `jrs_owner_local_review_v1` marker, an allowlisted owner status and an ISO-8601 `reviewed_at` timestamp per row. Reimport restores these self-described manual states. Files lacking the review marker are treated as unreviewed provider exports, even if they contain a field named `status`. A mismatched marker, unsupported status or malformed timestamp is rejected instead of silently accepted.
- Contact consent remains **self-declared** on export and reimport, and is never converted into a verified research, publication, buyer-diligence or successor-transfer release. The review marker is not an authenticated signature or proof of provenance; the original Formspree export remains the authority.
- All up to 2,000 imported rows are now reachable through 50-row pages, local text search and a local follow-up-status filter. The first 150-row-only interface could not mark every record before, although it would export them. The pure `selectLocalPage` helper and its synthetic regression prove access to row 151 and row 2,000.
- CSV exports mitigate spreadsheet formula interpretation by prefixing potentially dangerous cell values. That escaping means the reviewed CSV is a **working copy**, not a byte-for-byte archival preservation of the original Formspree file. Preserve originals separately and do not claim that a reimported reviewed CSV is independent evidence of provider receipt.
- All local imports and manual state changes remain exclusively in browser memory until the owner explicitly exports a local file. No automatic Gmail read, new database table, marketing workflow, Formspree API connection or new analytics is introduced.

Formspree's published documentation states that CSV/JSON submission export is available on Personal, Professional and Business plans. The user's actual plan remains unverified. Do not claim the manual export fallback is accessible on an unverified Free plan.
Reference: https://help.formspree.io/articles/form-and-project-settings/exporting-submissions/

## Fail-closed protected preview diagnosis

The separate hosted verifier now reports an HTTP 401/403 access denial as an **access verification blocker**, not a source-code regression, and continues to fail. It never logs the bypass token, private host URL with credentials, or response body. Source-identity and nine PDF checks remain unchanged.

Vercel project configuration was verified: Vercel Authentication enabled for all deployments except custom domains. Exact-commit Vercel deployment `dpl_2YMvtm1PuEXBAG4v3qmjxd4bp7HC` is READY for `edfbe6aba302938bd968bb867cc5029fb5b975ea`, but hosted verification failed with an HTTPError during `index.html` access. Project deployment protection must remain on. No new automation bypass secret, shareable URL, production merge, deployment or public exposure was requested.

Reference: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation

**Current release disposition:** Draft-only, private owner dashboard candidate. Independent protected-preview access, source/PDF delivery, privacy and owner authorization remain outstanding. Formspree submissions API and Supabase follow-up persistence still require external provider access.

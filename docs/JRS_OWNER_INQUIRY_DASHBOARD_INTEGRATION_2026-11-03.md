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

# Decision Spellchecker / JRS public-site implementation, first controlled increment

**Date:** 2026-10-30  
**Status:** REVIEW BRANCH ONLY. NOT PRODUCTION.  
**Controlling programme:** `Spellchecker Comprehensive Programme v1.0` (historical planning-document title; product name: **Decision Spellchecker**) (2026-10-30), sections 00, 01, 08, 09, 10 and 11.  
**Source alignment:** 2026-10-03 asset register, evidence ledger, architecture blueprint; exact three handoff SHA-256 hashes checked and matched before editing.

## What was verified before work

- Repository: public `phillipwikes-bit/jrsstandard.com`, baseline `main`.
- Master instructions: `CLAUDE.md` and `docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md` inspected.
- The public homepage and canonical navigation still prioritized Review Engine, Manifest and Enterprise.
- `enterprise.html` already has an organizational inquiry form connected to `/api/enterprise-inquiry`, but the form's initial two topic values were not accepted by the backend allowlist. Both values are now aligned in the form with the server's existing `other` and `evaluation` values; no API writer was changed.
- The owner programme-status page and the historical metrics endpoints exist. The dashboard page has no GA4 script by design and must not be treated as public. Its access path and named-contact data need separately verified authentication. An obscure URL and a robots tag do not establish access control.
- Historic `/enterprise` compatibility redirects continue to resolve to `/enterprise.html`; other legacy technical and public route names were not removed.
- The new multi-category Contact web form, provider-backed Gmail notifications, proper owner login, and independent client-device tests are distinct unfinished work. Draft PR #47 contains provider-gated notifier preparation but does not establish real delivery. Draft PR #46 retains the consent-status correction but is not yet merged.

## Changes prepared here

1. Homepage navigation becomes Home / Standard / Resources / Research / Training / For Organizations / Contact & Inquiries.
2. Fourteen existing public pages and the new Contact page use the same navigation. On mobile, it wraps and keeps choices visible without sideways scrolling.
3. Homepage replaces the prominent technical integration section with a four-resource practice path.
4. Public copy separates the JRS methodology from controlled-development Decision Spellchecker and avoids availability, accuracy, registration or licensing claims.
5. Organization page presents manual method use instead of an available enterprise product. Existing form and storage contract remain unchanged.
6. A new `contact.html` offers the existing organizational form and explicit subject-routed email links for research, resources and prospective product interest, with a confidentiality warning. The future full category-based inquiry portal remains open.

## Preserved and untouched

- Owner dashboard, named-contact rows, metrics, GA4 configuration, event writers, database tables, exports and historical data.
- `vercel.json` redirects, old URLs, published method, research material, consent records, evidence ledger, contributor correspondence and software/Engine source.
- Closed public Engine intake and NO_GO_NOT_VERIFIED state.

## Acceptance and next work

- Local/CI test: `node tests/site-phase1.mjs`; separately `node tests/public-route-alignment.mjs`. Save actual results.
- Must inspect iPhone Safari wrapping, click targets, link reachability and accessibility in preview before release.
- A further inventory of legacy and specialized pages is required; this patch covers fifteen public pages, not every historical or standalone route. Do not represent the entire site as redesigned.
- **Priority security gate:** audit anonymous and authenticated access to the owner dashboard and every endpoint returning named contacts; complete a secure owner sign-in design with a tested recovery path, without silently blocking existing operational access.
- Record pre-change historical metrics at a UTC cutoff, including field definitions and download attribution, before any production release.
- Build durable, spam-resistant category-based inquiries with a private owner inbox and tested Gmail delivery only after the sender provider, domain, and privacy/abuse protections are configured.
- Merge/release is separate human approval. No live database writes, external provider calls or production deployment were performed here.

**Gate decision:** DEVELOPMENT INCREMENT PREPARED; PRODUCTION HOLD. No legal, research, model-performance or commercial status has changed.


## 2026-10-30 continuation: category-based intake on review branch

**Implemented in branch, not in production:**
- `contact.html`: full five-category intake form with required name, email, message, explicit permission to contact, optional organization and no record attachments; failure and confirmation statuses distinguish a stored record from email notification.
- `api/site-inquiry-config.js`: returns only a public Turnstile site key after required server configuration exists.
- `api/site-inquiry.js`: accepts only same-origin JSON POST; requires Cloudflare Turnstile verification with hostname agreement; rejects malformed and oversize input; stores in existing `pilot_contacts` under source `site-inquiry` before attempting a separately controlled email alert.
- `api/leads-4b7e2c9af106d385.js`: includes this inquiry source in the owner inbox with a category label and note, retaining older lead sources.
- `api/people-9dd1ecdf6f8cdfd4.js`: recognizes site-inquiry rows in the existing named-contact list.
- `vercel.json`: admits only the Turnstile challenge host under the page's CSP for challenge script/frame/connection.
- `tests/site-inquiry.mjs`: isolated regression checks for method, origin, required fields, absent configuration, rejected/mismatched challenge, non-storage of honeypots, storage failure and success path.

**Operational requirements, not yet met:**
- Cloudflare Turnstile site and secret keys, with the actual public/preview hostnames correctly configured and verified. The inquiry form deliberately remains disabled without this anti-abuse prerequisite.
- PR #47's owner-approved notifier change, verified sender domain and configured email provider are required before a Gmail arrival can be claimed. The current branch keeps the existing notifier disabled, so stored submissions do not imply alert delivery.
- Authenticated owner access to all named-contact endpoints, not merely a hard-to-guess URL. Current owner dashboard source still includes direct Supabase browser reads for participation data; separate privacy/security remediation is required before a release.
- Browser acceptance in actual iPhone Safari, network interruptions, keyboard focus, screen readers, and false duplicate submissions. The system does not claim exactly-once writes across distinct challenge completions.
- Privacy notice, data retention/subject-rights processes, and operational incident notification review. Live traffic, actual contact, payment, and production database writes were **not** used in this engineering task.

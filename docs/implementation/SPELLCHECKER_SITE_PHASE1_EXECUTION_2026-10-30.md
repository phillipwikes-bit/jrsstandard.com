# Spellchecker/JRS public-site implementation, first controlled increment

**Date:** 2026-10-30  
**Status:** REVIEW BRANCH ONLY. NOT PRODUCTION.  
**Controlling programme:** Spellchecker Comprehensive Programme v1.0 (2026-10-30), sections 00, 01, 08, 09, 10 and 11.  
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
4. Public copy separates the JRS methodology from controlled-development Spellchecker and avoids availability, accuracy, registration or licensing claims.
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

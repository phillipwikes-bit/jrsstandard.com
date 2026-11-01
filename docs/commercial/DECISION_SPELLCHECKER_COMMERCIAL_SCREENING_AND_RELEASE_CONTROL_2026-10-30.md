# Decision Spellchecker / JRS: Inquiry Classification and Release Controls

**Classification:** Internal development evidence, dated 2026-10-30 America/New_York.  
**Branch:** Dependent on draft website redesign PR #48. No public Engine intake, production release, license offer or transfer authorization.

## Purpose

Preserve a defensible distinction between research engagement, general inquiries, requests to discuss licensing, and actual buyer commitments. The site may invite a **screening enquiry**, but the form is not a marketplace or an offer to sell.

### Canonical boundaries

- **JRS:** documentation-review methodology and free practitioner/reference resources.
- **Decision Spellchecker:** separately identified experimental software candidate, **NO_GO_NOT_VERIFIED**, with no production access or live external record intake.
- **Commercial screening:** a request for follow-up. No price, software use right, copy of benchmark materials, confidential disclosure agreement, exclusive rights, licence, asset sale or future meeting is presumed.

## Structured information paths

| Entry | Recorder | Stored source | Controlling fields | Commercial interpretation |
|---|---|---|---|---|
| `contact.html` category=research/training/organization/general | `api/site-inquiry.js` after Turnstile | `pilot_contacts.source=site-inquiry` | Category, contact consent and consent version | Not buyer activity |
| `contact.html?category=commercial&purpose=method-licence` | Same | Same | `commercial_purpose=method-licence` | Self-declared enquiry about potential methodology licensing |
| `?purpose=software-evaluation` | Same | Same | `commercial_purpose=software-evaluation` | Self-declared interest, not a software evaluation |
| `?purpose=integration` | Same | Same | `commercial_purpose=integration` | Self-declared interest, not platform integration |
| `?purpose=asset-acquisition` | Same | Same | `commercial_purpose=asset-acquisition` | Self-declared acquisition enquiry, not an offer |
| Existing `enterprise.html` form | `api/enterprise-inquiry.js` | `pilot_contacts.source=enterprise-inquiry` | Existing interest vocabulary, role, platform, scale, timeline, narrative | **Legacy stream:** separate denominator, different consent and abuse controls, not merged into categorized site enquiry totals |
| Historical checkout/payment-screen and support events | Existing legacy endpoints | Historical event sources | Original evidence/period | Neither payment nor named purchaser is presumed without reconciliation |

The `site-inquiry` server requires a valid recognized `commercial_purpose` when category is commercial and refuses inappropriate commercial-purpose values in other categories. The browser displays the supplementary selector only for commercial enquiries, with a required choice and validated bookmark parameters. The server stores `consent_to_contact:true`, `consent_to_transfer:false`, and `software_access_requested:false` in the existing structured contact message.

**Important:** self-declared category or purpose is not organizational purchasing authority, verification of professional status or evidence of a payment, license, evaluation or offer.

## Counting and reporting rules

`api/site-inquiry-stats.js`, protected by the signed owner session, reads the `site-inquiry` source only and publishes category and purpose counts without messages, names, emails or third-party records. Historical/invalid commercial entries with no recognized purpose are **unspecified**, not retrospectively classified as a software, licensing or acquisition opportunity.

The programme-status owner dashboard shows these counts under a named *website inquiries* group, separate from historic enterprise leads, checkout attempts, training and research. Do not sum populations from different channels without explicit source and person-level de-duplication rights.

For a licensing or sale data room, a person is **qualified** only when the evidence separately establishes an identifiable actor, relevant professional/buyer capacity, a concrete acquisition/licensing objective and permission for the intended disclosure. A web enquiry alone does not meet these tests. Published buyer count should remain “not independently established” unless a verified, suitably consented source supports it.

## Verified October 30 environment inventory (metadata only)

The connected Vercel project is `jrsstandard-com` on a **Hobby** plan, linked to the GitHub repository. A read of Vercel variable names and target scopes, without decrypting values, found:

- `SUPABASE_SERVICE_ROLE_KEY`: present in production/preview, content not accessed.
- `NOTIFY_TO`: present in production/preview, content not accessed.
- `JRS_INQUIRY_ALERTS_ENABLED`: present.
- `OWNER_DASHBOARD_TOKEN`: **not configured**.
- `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`: **not configured**.
- `RESEND_API_KEY` or `SENDGRID_API_KEY`: **not configured**.
- `NOTIFY_FROM`: **not configured**.

These observations concern **configuration presence only**. No secret value was decrypted, created, transmitted or committed. **The new categorized inquiry form remains unavailable without Turnstile.** The owner-only dashboard should fail closed without an owner session secret.

The dedicated `api/owner-release-readiness.js` endpoint is signed-owner-only and reports booleans plus *independent verification outstanding*, not secrets or a false green status. Its existence is not proof of live deployment.

## Dependency and release order

1. Merge code only into the existing *draft development* branch after this exact commit's GitHub Actions suite passes.
2. Owner configures a separate high-entropy `OWNER_DASHBOARD_TOKEN` in Vercel directly (do not paste it into chat or Git). Verify sign-in, logout, recovery, expiration, 401/503 behavior and server-side static-route gating in a working preview.
3. Owner or trusted operator configures Turnstile for the exact authorized domains and the trusted sender and mail-provider key. Run a consented synthetic inquiry through the real challenge, durable storage and *actual received notification*; verify failure/abuse behavior.
4. Complete anonymous Supabase RLS and public GitHub data exposure audits. Source-level protections and GitHub test passes cannot substitute for a live denial test.
5. Verify mobile/Safari behavior and live metrics snapshots, including historical crawler and unknown-user-agent events.
6. Review information rights, contact-retention/transfer permissions, sale-asset inventory, claim provenance and version-specific software limitations.
7. Require an explicit production release decision and rollback plan. The public JRS site and existing links should not be interrupted by an unverified change.

## Acceptance tests

- `node tests/owner-release-readiness.mjs`: signed owner access only, no secret leakage or premature release status.
- `node tests/site-inquiry.mjs`: allowed commercial purposes, noncommercial mismatch refusal, actual stored purpose and bounded consent, stored-before-notified.
- `node tests/site-inquiry-stats.mjs`: per-purpose counts and legacy unspecified records, no PII, no mixing with enterprise.
- `node tests/route-access-inventory.mjs`: release readiness source is owner-gated.
- Existing buyer evidence / traffic quality, public route and naming tests must continue to pass.

**Controlling conclusion:** This increment makes commercial enquiries easier to route and audit, but does not create a qualified buyer, licensed deployment, conveyable exclusive asset or production-ready engine.

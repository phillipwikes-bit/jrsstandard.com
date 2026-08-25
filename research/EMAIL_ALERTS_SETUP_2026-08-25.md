# Email Alerts: Setup and Locked Site Decisions

**Date:** 2026-08-25
**Status:** code complete and committed. **Alerts do not send until one environment
variable is set**, which is the one step that can only be done in the Vercel dashboard.

---

## 1. What now sends an email

| Trigger | Endpoint | What the email carries |
|---|---|---|
| Buyer fills the scoping form after reaching the pay screen | `api/checkout.js` | Offer, price, name, email, organisation, record type, volume, country, source |
| Buyer reaches the pay screen and no payment link exists | `api/checkout.js` | Offer, price, where they arrived from, country, and a line saying no card could be taken |
| Enterprise or licensing inquiry | `api/enterprise-inquiry.js` | Name, email, organisation, role, interest, platform, annual record volume, timeline, country, free-text note |

Every alert sets **Reply-To to the prospect's own address**, so replying to the
notification answers the buyer directly rather than requiring their address to be
copied out of it.

---

## 2. The one rule the implementation is built around

**Sending must never break capturing.**

The durable record is the row in `pilot_contacts`. The email is an alert about that row.
So in every endpoint the order is fixed:

1. Write the row.
2. If the write fails, tell the caller and stop. Nothing is alerted, because nothing was
   captured.
3. Only then send the alert.
4. **Whatever the alert does, the caller is told the submission succeeded**, because it did.

`api/_notify.js` never throws and never rejects. A provider outage, a bad key, a DNS
failure or no configuration at all all return a result object rather than an exception.

Inverting that order would let a mail outage silently cost leads, which is strictly worse
than a missed alert: a row can be queried later, a lost submission cannot be recovered.

`scripts/check_zero_drift.py` enforces the ordering, not just the wiring. If `notify()`
is ever called before the `pilot_contacts` write in either endpoint, the build fails.

---

## 3. To turn alerts on

**Recommended provider: Resend.** Plain REST, edge-compatible, no SDK, which matches this
repository's no-dependency convention.

1. Create an account at resend.com.
2. Add and verify the domain `jrsstandard.com`. The provider will give you DNS records
   (SPF and DKIM) to add wherever the domain's DNS is managed. **Until the domain is
   verified, sends are rejected**, and no code change can work around that: it is how
   every transactional provider prevents sender spoofing.
3. Create an API key.
4. In the Vercel dashboard, Project Settings, Environment Variables, add:

   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | the key from step 3 |

5. Redeploy.

**Optional overrides**, only if the defaults are wrong:

| Name | Default | Purpose |
|---|---|---|
| `NOTIFY_TO` | `info@jrsstandard.com` | Where alerts land |
| `NOTIFY_FROM` | `alerts@jrsstandard.com` | Sender. Must be on the verified domain |

**Using SendGrid instead:** set `SENDGRID_API_KEY` rather than `RESEND_API_KEY`. Both are
supported; Resend takes precedence if both are present. Domain verification is required
either way.

**The key never enters the repository.** `api/_notify.js` reads it from the server
environment only, the same posture as `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY`.
A guard now scans every committed `.js`, `.py`, `.mjs`, `.sh` and `.html` file for Resend,
SendGrid, Anthropic and JWT key patterns and fails the build on a match. **That guard was
tested by planting a fake Resend key in `api/_notify.js`: 31 checks, 1 failed. Removed: 31
checks, 0 failed.**

---

## 4. Behaviour before the key is set

Nothing breaks and nothing is lost.

`notify()` returns `{ sent: false, provider: 'none', detail: 'no_provider_configured' }`.
Leads are still written to `pilot_contacts`, the visitor still sees success, and
`/api/checkout-stats` still counts everything. **"Not configured" is reported as a distinct
state rather than as a failure**, so a deploy check can tell "no provider set up yet" apart
from "the provider rejected the message". Those need different actions.

---

## 5. Locked site decisions, now enforced by the build

Recorded from Phillip's instruction of 2026-08-25. Each is enforced by a guard rather than
remembered, because a decision that lives only in a chat log gets undone by the next one.

| Locked decision | Guard | What it fails on |
|---|---|---|
| Free training, desk references and guide downloads stay visible | `check_free_funnel_preserved` | Any of `training.html`, `investigator-guides.html`, `check.html` losing every inbound link |
| Checkout and payment pathways stay active | `check_checkout_path_active` | A request page unwired from `/api/checkout`, or the fallback capture removed |
| `sitemap.xml` keeps free material indexed | `check_sitemap_keeps_free_material` | The homepage, training, guides or check page dropping out of the sitemap |

**All three were tested by breaking them deliberately.** Removing `training.html` from the
sitemap: 1 failed. Renaming the `checkout-fallback` source: 1 failed. Both restored: 0
failed.

This matters because a pivot directive on this same date proposed reversing all three at
once. The guards mean that reversal now requires deleting a named check, which is a visible
act, rather than editing a page, which is not.

---

## 6. What is still not done, and why

**Payment links.** Every `checkout_url` in `api/_offer-config.js` is still empty. A
checkout URL can only be minted inside the owner's own payment account; nothing in this
repository can create one, and writing a plausible-looking URL would be a fabricated
payment destination. **The alert on pay-screen arrival exists precisely because this is
still true**: until a link is pasted, every arrival is a buyer who cannot pay, and the
owner should hear about it within seconds rather than weeks.

**Engine tier prices.** `ENGINE_TIERS` carries `null` prices behind `[REQUIRES USER INPUT]`
for everything except the free evaluation tier. `isPriced()` returns false for all three,
so no surface can render a price nobody has agreed to.

---

## 7. Verification state

| Suite | Result |
|---|---|
| `check_zero_drift.py` | 31 checks, 0 failed, 1 skipped |
| `verify_isaca_article.py` | 57 checks, 0 failed |
| `verify_submission_ready.py` | 52 checks, 0 failed |
| `independent_woolf_check.py` | 45 checks, 0 failed |
| `verify_kyle_requests.py` | 30 checks, 0 failed |
| `audit_training_completions.py` | 17 checks, 0 failed |

Eight API files pass `node --check`. `api/_notify.js` was behaviour-tested directly:
HTML escaping of a `<script>` payload confirmed, empty rows dropped from the alert table,
and the no-provider path returns the documented result object.

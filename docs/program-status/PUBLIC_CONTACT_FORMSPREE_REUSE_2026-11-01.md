# JRS Public Contact Form: Existing Formspree Reuse
Date: 1 November 2026

## Evidence
- Historical GitHub source `pilot.html` at `9a3d8fe2` contains an original configured Formspree submission endpoint `https://formspree.io/f/mreddwdg`.
- Connected Gmail contains Formspree notifications to the owner for JRS enquiries dated May-June 2026.
- A single synthetic submission `JRS_FORM_SMOKE_20261101_HF7Q8` was accepted by the form service via GitHub Actions run 41305153521 and the matching message was found in Gmail on 2026-11-01. No participant data was used.
- The form's existing Formspree dashboard label remains “JRS Pilot Inquiry”; this source-level implementation cannot rename it. New professional contacts carry distinct source and form_type fields and must not be treated as pilot participants or commercial-qualified buyers.

## Implemented architecture
- Public Contact page posts same-origin JSON to `/api/site-inquiry` using a fixed schema, consent and an allowlist.
- Server rejects cross-origin requests, excessive bodies, incorrect content types, invalid input and honeypot submissions. It sends only allowlisted fields to Formspree over HTTPS.
- A successful receipt establishes acceptance by Formspree, not guaranteed Gmail delivery.
- Without JavaScript, the HTML form submits directly to the existing Formspree address, where provider-native spam/confirmation controls apply.
- No Supabase study database, research consent or software transaction is modified by this contact flow.

## Current acceptance limits
- Third-party processor's exact retention/deletion policy and anti-abuse settings are not independently audited.
- A historical one-time Gmail notification test does not prove all future arrivals.
- Owner should review Formspree's form settings and rename the historical form to reflect its shared general contact purpose, or create a dedicated separate contact form and migrate the endpoint.
- Do not submit case records, privileged material, credentials or third-party personal information.
- Previously identified historical O2 anonymous-data incident remains an independent unresolved issue.
- Tier II software rights and transactions remain privately governed; none is represented here.

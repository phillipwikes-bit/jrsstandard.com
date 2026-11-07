# JRS inquiry email notifications: owner Gmail routing

**Prepared:** 2026-10-30  
**Status:** CODE CHANGE ON REVIEW BRANCH. DELIVERY NOT YET ACTIVE OR VERIFIED.  
**Scope:** Existing JRS enterprise inquiry and checkout lead alert calls, plus future contact/inquiry endpoints that explicitly use the shared notifier. Does not create the new multi-category contact portal or alter the durable contact database.

## Owner decision and recipient

On 2026-10-30 the owner requested that new JRS website inquiry alerts be delivered to the connected Gmail account. This supersedes the earlier 2026-08-25 dashboard-only email-alert directive for future inquiries. The recipient is held only in the Vercel environment variable `NOTIFY_TO` (production + preview); **do not record the personal Gmail address in this public repository, browser code, URL, or analytics**.

`JRS_INQUIRY_ALERTS_ENABLED=true` is also stored in the project settings for production and preview. This does not send anything by itself. `api/_notify.js` also requires `RESEND_API_KEY` or `SENDGRID_API_KEY`. The provider credentials were **not present** when these steps were prepared. Never use a personal Gmail password, app password, or Gmail OAuth token as a substitute.

## Existing implementation

- Form: `enterprise.html#enterprise-inquiry` submits to `api/enterprise-inquiry.js`.
- Durable storage: `pilot_contacts` database table. The notifier is called only after successful storage.
- Shared notifier: `api/_notify.js`, using a provider's authenticated REST email API with a server-only credential. The message has a bounded subject, escaped HTML, and reply-to pointing to the person who submitted the inquiry.
- Other existing callers include checkout lead flows. The future multi-category Contact & Inquiries portal must use the same storage-first/notify-second pattern and ensure the owner's dashboard reads all categories.
- Failure rule: provider absence/outage means `sent:false`, but an already stored inquiry remains stored. Never show `emailed` until an actual provider acknowledgement, and never call `alerted` a sale, customer acceptance or payment.

## Steps remaining for actual Gmail delivery

1. Owner creates or approves a transactional email sender account (Resend or SendGrid) and proves control of an appropriate sending domain. DNS/domain verification must complete before real email testing.
2. Store only the provider API key in the Vercel server environment as `RESEND_API_KEY` (preferred) or `SENDGRID_API_KEY`. Never commit the value or expose it to browser code. Configure an approved verified sender as `NOTIFY_FROM`; the current default is `alerts@jrsstandard.com` and works only if the provider has verified its domain.
3. Validate a **preview** build of this branch with a synthetic inquiry. Assert (a) the row appears in the authorized inbox/dashboard, (b) the notification arrives in the connected Gmail inbox, (c) subject/category, reply-to, and content are correct, and (d) no recipient personal data is exposed on the public site.
4. Simulate provider failure and verify the stored inquiry is not lost, no duplicate is recorded from retries, and an operator can identify missed notifications.
5. Confirm spam controls, rate limits, abuse monitoring, retention/deletion, and authenticated owner-only retrieval before opening the redesigned multi-category portal.
6. Obtain explicit production release approval, merge the reviewed change and deploy with rollback capability. Complete a production synthetic end-to-end test before claiming delivery is active.

## Validation and constraints

Offline regression script: `node tests/notify-gmail-readiness.mjs`. It uses synthetic addresses and a fake email transport only. No real email, live database, or real visitor data is used.

**No live delivery, Gmail receipt, sender domain verification, provider account, production deployment, or public contact-portal completion is claimed by this record.** The owner's existing Programme Status dashboard and historical measures must be preserved.

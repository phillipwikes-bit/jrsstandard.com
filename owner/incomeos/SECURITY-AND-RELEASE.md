# IncomeOS security, data governance, and release specification

Status: development control record, 2026-11-01. **Not a certification or authorization to deploy.**

## Product boundary

IncomeOS is a personal, single-owner, private iPhone-oriented research and financial-decision workspace. It does not sell services, expose personal data, accept third-party customer accounts, place orders, transfer funds, file taxes, submit applications or guarantee revenue. Externally connected Gmail and finance records remain under the user's authorized ChatGPT workflows. The static website cannot directly read those connections.

The JRS institutional website and local-only Review Engine must remain operationally isolated. Source in this GitHub repository is public, even when a pull request is marked draft. Do not commit private ledger rows, personal email addresses, receipts, bank account identifiers, credentials, invoices, financial snapshots or authorization tokens.

## Standards and verification basis

Engineering controls are informed by, but are **not yet conformant with or certified under**, the following external standards and guidance:

- OWASP Application Security Verification Standard, ASVS 5.0.0: https://asvs.owasp.org/
- NIST SP 800-218, Secure Software Development Framework 1.1: https://csrc.nist.gov/pubs/sp/800/218/final
- W3C Web Content Accessibility Guidelines 2.2, AA target: https://www.w3.org/TR/WCAG22/

For a production claim, identify the applicable requirements individually, maintain proof of completed tests, record exceptions and obtain an independent review. Source linting alone is not a security audit or accessibility assessment.

## Trust boundaries and threat cases

| Boundary | Main threat | Current control | Residual risk |
| --- | --- | --- | --- |
| Public GitHub to browser code | A personal record is accidentally committed | Synthetic source data and a no-private-data policy | Manual review and automated secret scanning needed |
| Anonymous browser to private page | Anyone can access an unprotected path | Draft PR and unmerged status | P0 blocker: no independently verified server-side authentication |
| Local browser storage | Another device user or extension reads financial entries | Local-only storage, clear function, encrypted export option | P0 blocker: active browser storage is unencrypted |
| Backup download and restore | Theft or tampering of exported records | PBKDF2-SHA256, random 16-byte salt, 600,000 iterations, AES-256-GCM, 12-byte nonce, authenticated decryption, passphrase not saved | Passphrase loss, endpoint compromise and weak passwords remain possible |
| External research link | Phishing, eligibility misstatement, expired offer | Dated HTTPS source, link classification, seven-day review TTL, explicit manual eligibility confirmation | No live recruiter verification or guaranteed seat |
| Portfolio decision | Past earnings represented as future yield | Scenario-only calculations, source and risk checklist, owner approval hold | Investment returns, legal terms and taxes require independent review |
| Financial record import | Duplication, fabricated income or misleading categories | Constrained CSV, separate gross/pending/fees/tax/capital, source flags | Not connected live, account coverage and reconciliation incomplete |
| Outbound telemetry | Accidental disclosure to third-party scripts | Self-hosted JavaScript, no marketing scripts, restrictive client-side CSP | Effective security headers and third-party egress tests not independently verified |

## Release gates

No public launch, production merge, owner data entry on a deployed version or automated financial action before every P0 gate is met.

**P0, blocking**
1. Deploy only to a separately protected owner-only project, not the public JRS domain. Verify authorization for all resources, not merely the HTML route. Test anonymous GET and HEAD, asset paths, private imports, direct-navigation deep links and cache behavior.
2. Obtain verified server-side owner authentication with deny-by-default authorization. Unlisted URLs, noindex, client-side passwords and front-end route guards are not authentication.
3. Apply and verify response headers at the server or edge: private and no-store for user data; a restrictive CSP that includes frame-ancestors as a response header; Referrer-Policy, X-Content-Type-Options, HSTS, and appropriate session-cookie protections.
4. Replace plaintext active financial-record storage with independently reviewed at-rest encryption or a protected authenticated server-side data store. The current encrypted **backup only** is not enough.
5. Establish recovery tests on iPhone, unauthorized-access tests, tampering tests, data-erasure tests and no-network-egress validation using synthetic data.
6. Require a deliberate owner approval process for each external financial transaction. Automatic submission, trading, and reinvestment remain disabled unless an authorized, auditable provider integration is separately approved.
7. Establish retention, recovery and incident procedures, including revocation of sessions and restoration from protected backups.
8. Obtain explicit owner publication approval after evidence-based security and accessibility review.

**P1, before an operational readiness claim**
1. Run iPhone Safari tests at 320px, 375px and 430px, including on-screen keyboard, focus order, controls, VoiceOver, form errors, imports, exports, backup restore and reduced-motion settings.
2. Test WCAG 2.2 AA success criteria, with particular attention to touch target size, focus not obscured, error identification, labels and keyboard accessibility.
3. Use immutable source identifiers and unique document references for reconciliation, refund association, amended receipt events and duplicate detection.
4. Maintain evidence of current availability, eligibility, fee schedules, dates, issuer restrictions, and withdrawal liquidity for each opportunity.
5. Build reproducible automated regression coverage for positive, zero and negative return scenarios; foreign currency; refunds; wrong passwords; corrupted backups; duplicate transactions; and stale feeds.
6. Document source coverage and a reconciliation exception queue. Missing providers or receipts must not be treated as zero activity.

**P2, performance and maintainability**
1. Meet a documented mobile performance and accessibility budget.
2. Maintain an upgrade/migration plan for local records, including backup compatibility.
3. Use least-privilege token scopes for any future connector, rotate credentials, and log external operations without logging sensitive content.
4. Document rate limits, source freshness and operational failure handling.
5. Measure maintenance time and actual verified income separately. Advertised research compensation and hypothetical returns must never contribute to earned-income KPIs.

## Accounting evidence states

Every financial entry should retain its originating source, document reference, date, amount/currency, normalized USD amount, account or payment-channel evidence where appropriate, owner business-purpose annotation, and review status.

Allowed practical stages include source-only, bank-only, receipt-only, amount/date match, payment-method mismatch, refund pending allocation, user-confirmed allocation, and reviewed by accountant. Tax deductibility and business-use percentages are not inferred from merchant names or historical charges.

## Acceptance evidence

- GitHub Actions source tests: scripts, parsing, scenario math, fail-closed review behavior, encrypted export, decryption and tamper rejection.
- Mobile browser test record: concrete devices, OS/browser builds, widths, results, screenshots and defects.
- Authorization test record: anonymous deny, authenticated allow, cache no-store, site isolation and direct asset fetch denial where sensitive.
- Operational demonstration: owner adds record, edits it, reconciles it, exports an encrypted backup, restores it, downloads annual report and erases records.
- Income verification: provider-confirmed receipts or bank deposits, never modeled projections.

## Current release assessment

Draft development branch. Security and unit checks may pass; public source branch remains unmerged. Verified production authentication and encrypted active storage have not been established. A Vercel build-rate limit may block preview deployment. Do not represent the system as deployed, revenue-generating, independently audited, or production-ready.

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

## Verified hosting and incremental control state, November 1, 2026

The connected Vercel project `jrsstandard-com` serves the JRS custom production domains. Its observed `ssoProtection` setting is enabled for `all_except_custom_domains`, while direct project password protection is disabled. This supports protected noncustom preview access but **does not protect the JRS production custom domains or constitute owner-only app authentication**. Creating a sensitive owner page at a public JRS path is not authorized.

Development modules added during master-plan implementation:
- `accounting-controls.js` and `accounting-controls-ui.js`: source identity, exact source-link candidates, amount/date conflict checks, owner-review status, false-positive controls and fail-closed close readiness. The static app intentionally provides no bank rows or coverage attestations. A "ready for additional accountant review" result from the pure engine is never a tax filing or audit authorization.
- `recovery-engine.js` and `recovery-ui.js`: potential duplicate billing, refund original-source linkage and observation of two documented periods of comparable lower charges. No claims, filings, transfers, refunds or cancellations occur.
- `IMPLEMENTATION-REGISTER.md` records active features, dependent releases and financial reporting standards.

Passing the five Node regression suites and the public-site isolation check is an engineering prerequisite only. The next blocking release task is verified separately deployed, owner-authorized infrastructure with encrypted active storage and private authenticated source ingestion.

## Current release assessment

Draft development branch. Security and unit checks may pass; public source branch remains unmerged. Verified production authentication and encrypted active storage have not been established. A Vercel build-rate limit may block preview deployment. Do not represent the system as deployed, revenue-generating, independently audited, or production-ready.


## November 1 continuation: protected staging and server-only financial writes

The connected Vercel project `incomeos-opportunity-desk` was inspected and updated with Vercel Authentication protection for **all** deployment targets, including any future custom-domain target. The project has no custom domains and no deployment. A protected preview deployment from the exact PR #91 commit was attempted but Vercel returned HTTP 402, `api-deployments-free-per-day`, with a 24-hour retry indication. No plan upgrade, public fallback, unprotected deployment or financial data transfer occurred. Source code remains in the unmerged draft PR.

A draft statement-close engine (`statement-close.js`) verifies owner-declared account scope, contiguous bank/credit-card statement periods, posting counts, USD credit/debit sums, asset-versus-liability balance arithmetic, unique reviewed ledger links and source-document hash shape. Its status READY_FOR_ACCOUNTANT_SOURCE_REVIEW is **not** independent bank verification, coverage of undisclosed accounts, final accounting close, tax approval or spendable cash.

Security correction: `OWNER-PRIVATE-SCHEMA.sql` now grants the browser's authenticated database role **SELECT only** on financial and evidence tables. All direct browser INSERT/UPDATE/DELETE access is prohibited. The previously drafted client insert policies were removed before any migration was applied.

`private-append-handler.js` is an **unrouted, dependency-injected contract**, not a deployed endpoint. It requires a trusted server-side identity verifier, owner-allowlist check, CSRF verifier, valid signed source history, strict event format, and an appendAtomic persistence operation that independently rechecks previous hash and sequence under a database transaction. The browser must never supply verification flags treated as authoritative. A real production server implementation must be tested against the separate private DB before applying data migrations or removing the staging interlock.

Mandatory remaining release gates:
1. Remove the Vercel deployment-rate barrier without paid-plan changes or bypasses, then deploy a protected preview only after exact-commit source and project-target verification.
2. Independently test anonymous and nonowner denial, actual owner session authorization, direct asset access, session expiry and HTTP cache protections.
3. Provision and authenticate a **separate** private database. Apply RLS migration only to that environment after administrative review. Test authorization with real accounts and verify there is no direct browser financial write permission.
4. Implement a transactional, server-owned journal append with trust-boundary validation, idempotency, rate limits, canonical hashing, and external head-hash anchoring. The source-only append handler and hash-chained browser module are not substitutes.
5. Integrate bank and receipt sources only with owner-authorized scopes. Verify posted bank IDs, source count, statement balances, all covered accounts, transaction evidence and corrections.
6. Complete iPhone Safari and assistive-technology tests, encrypted primary-storage verification, backup/restore, private data deletion and production authorization.

**No accounting file should be uploaded to the draft public repository, a public app preview, or the published research-opportunity database.**


## November 1 continuation: deployment quota and reproducible hosted gate

**Current blocker:** A new exact-head PR #91 preview deployment was attempted against Vercel project `incomeos-opportunity-desk` with Vercel Authentication enabled for **all** deployment targets. Vercel returned HTTP 402 `api-deployments-free-per-day` and specified a 24-hour retry interval. The local runtime does not have an authenticated Vercel CLI fallback. No user plan, production deployment, public JRS route, authentication rule, or financial transaction was modified to work around it.

The owner requested continued release validation until the appropriate gate passes. The existing daily `IncomeOS Passive Wealth Cycle` automation has been updated, without changing its schedule or its original financial-discovery remit, to perform at most one protected-preview retry during a daily run when the quota allows it. A separate retry automation could not be created because the account already has the allowed five scheduled tasks. Preview success is not the same as permission to release or process private data.

Staging deployment configuration now includes `owner/incomeos/vercel.json` as a proposed **separate-project** HTTP security policy: private no-store caching, deny framing, CSP, referrer and browser permissions limits, HSTS, and noindex. The installed iPhone manifest now uses relative app start and scope URLs so it can run from the separate owner project root. These headers and routing rules remain **unverified on a hosted deployment** until Vercel permits a build and returns provider evidence.

`tests/incomeos-preview-probe.mjs` provides an opt-in anonymous HTTP probe requiring exact GitHub PR SHA, provider deployment SHA, matching Vercel project/team, READY preview target, all-target SSO, and explicit GET/HEAD denial for HTML, JavaScript, JSON, and manifest routes. It never treats a missing page (404), ambiguous redirect (302), or public 200 as a passed access-control check. `tests/incomeos-preview-probe-qa.mjs` validates the probe using **synthetic responses only**; CI passing this fixture is NOT a hosted access-control result. When a real preview becomes available, obtain the metadata from connected GitHub/Vercel, run the opt-in probe, and separately review authenticated owner access and network headers.

Staging hardening: `staging-interlock.js` now loads **before** the accountant and sets `IncomeOSFinancialReadOnly` immediately. Accountant writes, legacy migration, edit, remove, CSV import and JSON restoration are refused while this flag is set. `vault.js` likewise refuses restoration into unapproved browser storage. Export and local erasure remain available for existing records. Client-side guards are not authentication and are insufficient on their own for production security.

**Production status remains HOLD** regardless of synthetic tests or protected-preview authentication: independent owner identity validation, transactional private backend, separately authenticated RLS, encrypted active storage, real bank coverage, negative owner/nonowner access tests, iPhone functional/VoiceOver QA, and explicit owner release authorization remain unmet.


## November 1 continuation: accountant import integrity and plaintext staging restrictions

The source-only accountant CSV importer now validates real ISO calendar dates and rejects unknown/duplicate CSV headers. It persists proposed ledger entries **before** replacing the in-memory accounting state. A failed browser-storage write is treated as an unsuccessful import or edit rather than as a completed financial change. Legacy-entry migration and ledger deletion have distinct failure handling. Synthetic persistence tests cover quota failure, repeated imports, invalid dates and unassigned business-use percentages.

The available 2026 accountant import file was examined locally, not committed or uploaded. It contains 96 candidate expense rows totaling $3,857.24, with 96 distinct nonempty evidence references. Business-use percentages are blank for all 96 entries; the file is not a complete annual accounting population and does not establish tax deductibility, banking authenticity or a production migration.

Additional staging controls explicitly suppress storing personal research application stages, local research imports, budget preferences and bill plans in plaintext browser storage. These complement but do not replace owner authentication and encrypted primary persistence. The read-only source view and locally held-record erasure remain available; the browser storage legacy is not a trusted production account system.

The added `tests/incomeos-accountant-persistence.mjs` and `tests/incomeos-staging-privacy.mjs` run in source CI. Successful synthetic results do not satisfy deployed browser, private session, encrypted storage or bank-data verification gates.


## Additional financial release blockers: double-entry and period continuity

Source checks now require every supported journal posting to map to balanced debit/credit movements and to the bank/card statement evidence for a full calendar-month close. All apparent income, credit-card payments, refunds, returned principal and transfers remain segregated. Any reconciliation exception causes the monthly close review to HOLD and suppresses its proposed figures.

The source-only double-entry engine does **not** establish complete books, provider-certified ownership of bank accounts, or a validated opening balance. Month-end acceptance is currently restricted to one complete calendar month with every active source posting within that period. Prior-period refund evidence, investment position rollforwards, confirmed cost basis, beginning balances, signed month closes, corrections and periods spanning multiple reporting months require separate controlled implementation and validation.

Production authorization is still blocked by separately protected owner hosting, independently tested RLS, trusted server append/API, encrypted active storage, bank statement completeness, accountant review, mobile testing and explicit owner approval. This module is not an autonomous trading or filing capability.

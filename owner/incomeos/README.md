# IncomeOS: owner-only iPhone prototype

Status: STAGING ONLY. DO NOT MERGE TO PUBLIC PRODUCTION.

This single-user research and cash-flow decision interface is intended for the existing JRS technical infrastructure while preserving the institutional public website and the local-only JRS Review Engine. It does not create accounts, submit participant applications, execute investments or transmit owner data.

## Access and privacy

- Candidate route: /owner/incomeos/.
- The public JRS production domain has no verified owner-only authentication for this path. An unlisted URL and noindex are not access controls. Never merge into production without server-side authentication.
- The current JRS Vercel deployment uses Vercel Authentication for protected previews. Test anonymous denial before using the prototype on a preview deployment.
- Production release gate: server-side owner-only route protection, path-specific private/no-store headers, negative anonymous access tests, privacy review, and rollback. Do not switch public JRS production to whole-project authentication.
- GitHub repository and source are public, even on an unreleased branch. Never commit identity records, secrets, application answers, balances or private notes.
- Saved bookmarks, study status and earnings are stored only in browser localStorage, not encrypted, not backed up or synchronized. Do not use shared devices.

## Contents

- index.html: dashboard tabs, individual study links, alternative-asset watchlist, manual earnings ledger, source review gates and scenario modeling.
- opportunities.json: dated public-source research and investment research candidates with explicit caveats. No live feed is claimed.
- incomeos.js and incomeos.css: static client-only controls without external scripts.
- decision-engine.js and decision-ui.js: evidence-gated owner reviews and fee/tax/inflation-aware hypothetical modeling, with no transaction execution.
- vault.js and vault-ui.js: user-passphrase-encrypted local backup/restore with authenticated decryption and explicit replacement confirmation. The active browser storage remains plaintext.
- manifest.webmanifest and icon.svg: home-screen support. No website push notification service.

## Validation and release gates

1. Verify deployment protection: unauthenticated preview user must be denied.
2. Verify existing JRS public pages, redirects, engine guards and production versions are unchanged.
3. Check iPhone 375px and 320px widths, keyboard navigation and Add to Home Screen.
4. Check date-expiry filtering, specific study application links, and no claims of available paid seats.
5. Verify asset source links are clearly labeled as research/catelog links unless deal-specific URLs are verified.
6. Check saved status, application pipeline, receipt ledger, CSV export and local data erasure.
7. Verify growth scenarios with positive, zero and negative assumed return, and clear hypothetical warnings.
8. Confirm no outgoing personal-data request, third-party tracking, bank credentials, or unsolicited payment action.
9. Before public-domain merge, add and validate production-ready owner authentication and no-store headers.
10. Require explicit owner approval before merging or publishing to public JRS domain.


## Consolidated accountant ledger (draft)

The owner can manually record income and expenses from any legitimate source, including records that were not discovered through IncomeOS. Income categories include research, AI evaluation, royalties, business receipts, dividends, employment, pension/annuity, retirement distributions and other receipts. Expense categories include ChatGPT/OpenAI, Anthropic/Claude, Grammarly, Namecheap domain/email, Sejda document software, home internet, cell phone, printer/ink, travel and other purchases. Quick-add vendor chips only prefill form fields; they do not insert unverified amounts or establish tax deductibility.

- Entries are stored in localStorage under `incomeos.accountant.v1`. An earlier `incomeos.owner.prototype.v1` receipt list may be migrated on first use. No owner data is committed to GitHub.
- Payment status is self-reported; pending income, investment-sale proceeds awaiting cost basis, refunded principal, withholding/fees, outflows, estimated tax payments and capital investments are separated in accountant totals.
- Outflow entries may carry a **user-estimated business-use percentage**, document reference and proof status. An estimate is not an approved deduction, and partial household use requires substantiation. Fees recorded on receipts should not be duplicated as separate expenses.
- Tax-year filtering, source/category breakdown, editable entries, item deletion, detail CSV, summary CSV, browser Print/Save as PDF, and private JSON backup/restore are provided.
- The local **CSV import** accepts a deliberately strict template, downloadable from the app: `kind,date,description,vendor,category,amount_usd,status,business_use_pct,evidence_ref,notes` and optional `evidence_status`. The latter may be `missing`, `email`, `bank`, `both-unverified`, or `both`. Use positive USD amounts, with `kind` explicitly specifying income, expense, taxpayment, capital, or other. Entries imported from outside sources start **unreconciled**, and possible duplicate entries are flagged/skipped by date, type, description and amount. A matched vendor charge is not proof of business purpose.
- ChatGPT can help discover and review permitted linked Gmail receipts or authorized linked Finances transactions and prepare this CSV in-chat when asked. **The static owner web app cannot directly call ChatGPT connectors or read private connected accounts.** This prevents accidental disclosure to the public repository. Never commit financial statements, receipt attachments, private Gmail links or tax files.
- Supported document formats and tax-form identifiers are reference fields only. The prototype does not import, store, or verify PDF attachments. Secure backup and source documents should be supplied separately to the accountant.
- Browser localStorage is device/browser scoped and can be erased. Use private backup exports and keep them securely stored. The app is not a system of record for complete tax compliance, not integrated with payroll or tax filing, and cannot assert all expenses and income have been captured. Accountant review is required before tax reporting.

## Accounting

Only received, manually recorded payments count as paid income. Advertised incentives are not earnings. Financial asset examples carry risk and are not recommendations. Investing or reinvesting requires owner approval and an authorized provider.

## Current hardening and data-stage distinctions

- A purchase without a substantiated business-use allocation now stores `null`, meaning **unknown**. Zero percent means a deliberate zero allocation, not missing information. Display, summary, import and export preserve that distinction.
- All automatically prepared CSV rows remain unreconciled even when bank or email evidence is referenced. `both-unverified` means two source types are present but linkage is unresolved; a verified payment requires further review.
- The top-level paid receipt total is now labeled **self-reported**, not verified or available to invest. Advertised incentives and unreceived study rewards never appear there.
- Private workbook-to-CSV conversion occurs outside the public GitHub repository. Bank references and supporting owner documents must stay in owner-controlled files, not in this branch.
- See `SECURITY-AND-RELEASE.md` for documented OWASP ASVS 5.0, NIST SSDF 1.1 and WCAG 2.2 AA targets, residual risks and release gates. The source and CI checks are not an independent audit.

## Competitor-pattern features: expenses and research intelligence

The owner interface now adds the following original, evidence-labeled workflows, informed by established budgeting and subscription-management products:

- **Recurring charge radar:** detect repeated expense merchants from three weekly/monthly/quarterly paid observations, or two plausible annual paid observations, and show an estimated next date. Same-day duplicate API charges are not treated as renewals. A recurring pattern is not proof of an active subscription, bill amount, cancellation entitlement or authorized charge.
- **Monthly category targets:** owner controls spending caps and compares them with recorded spending for the current month. No zero-source-completeness claim and no automatic tax deduction is inferred.
- **Upcoming bill calendar:** manually entered names, amounts, dates and recurrence. Estimated dates are not bank bill-pay authorization or guaranteed due dates.
- **Twelve-month trend and exception review:** display recorded income, withheld fees and expenses, unknown business-use allocations, incomplete evidence, unreconciled charges, and material merchant-pattern increases. The result is not a household bank balance, realized investment gain, or complete financial forecast.
- **Survey and interview opportunity radar:** source-dated public leads, application URLs, published participant requirements, paid-incentive thresholds, online-only settings, screening effort, same-source duplicate suppression, deadline expiry, review freshness and owner application-progress tags. Results are identified as sourced candidates, never as actual available seats or earned income.
- **Reviewed public-lead JSON import and CSV export:** use the downloaded source template or a ChatGPT-prepared JSON file. Never upload personal screening answers, payment details, or application credentials. The public source snapshot and imports are distinct from the connected hourly ChatGPT research alert automation.

Spending settings are kept under `incomeos.spend.preferences.v1`; research intake and owner pipeline under `incomeos.research.radar.v1`. Both are included in the owner-encrypted backup facility and removed by the full local-data erasure function. Active browser localStorage remains plaintext and is **not appropriate for confidential owner data without verified private deployment and endpoint controls**.

### Interoperability constraints

A separate, publicly presented **research-opportunity feed** is maintained through the existing IncomeOS Priority Study Alerts workflow when authorized connections can verify listings and update the permitted public-data service. It is separate from the JRS-branch owner workspace. This GitHub prototype deliberately does not fetch that external database or store its anonymous keys, because route-level private access and source-to-record synchronization are not yet verified. No one should infer that importing JSON in the owner page automatically synchronizes external services.

### Validation

Run from repository root:

```bash
node tests/incomeos-owner-prototype.mjs
node tests/incomeos-controls.mjs
node tests/incomeos-intelligence.mjs
```

Passing these checks is necessary but not sufficient for the production release gates in `SECURITY-AND-RELEASE.md`. Verify actual iPhone Safari behavior and anonymous private-page access independently.

## 2026-11-01 master-plan implementation increment

The full current-and-future feature register, data boundaries, acceptance standards and phased dependencies are maintained in [IMPLEMENTATION-REGISTER.md](./IMPLEMENTATION-REGISTER.md). It controls the implementation scope and supersedes informal feature-only release assumptions.

New development-only source modules:

- `accounting-controls.js`: source-backed bank identity, precise USD cents, record validation, conservative one-to-one source linkage, reconciliation candidates, duplicate/conflicting bank IDs, separate receipt categories, exceptions and close readiness. It makes no tax or independently audited claims.
- `accounting-controls-ui.js`: read-only reconciliation quality panel. Deliberately passes empty source/coverage arrays because the static app cannot fetch authorized private financial statements and must not imply it did.
- `recovery-engine.js`: conservatively flags potential multiple charges, links user-recorded nonincome receipts to original expense references when available and requires at least two comparable, evidence-reviewed lower bills before describing observed recurring savings.
- `recovery-ui.js`: owner-only candidate review. It does not request refunds, dispute card charges, cancel services or calculate guaranteed income.
- `staging-interlock.js`: deliberately disables financial entry, private CSV/JSON import and encrypted private restore in the unapproved static prototype. Existing synthetic data can still be inspected; recovery export and local deletion remain possible. This client-side guard is not authentication and cannot substitute for secure hosting.
- `tests/incomeos-accounting-controls.mjs` and `tests/incomeos-recovery.mjs`: synthetic, source-privacy-safe controls added to GitHub CI.

These modules strengthen evidence integrity but **do not change the release hold**. Do not enter sensitive owner financial records in the publicly sourced app until a separate protected, encrypted production data store has been verified. The public study radar and the private owner ledger remain operationally separate.


## 2026-11-01 continuation: financial provenance and private backend readiness

**New evidence modules, not active personal financial storage:**

- `financial-event-journal.js`: pure SHA-256 hash-chained event history with source-identified posted amounts, classification, matching document, owner review and explicit reversal. Corrections do not overwrite the original history. A hash chain is tamper-evident only, not an owner signature, independently audited record or bank authentication.
- `research-outcomes.js`: strict pipeline event validator for applications, invitations, participation, acceptance and payments. A paid research entry contributes to the owner-reviewed research receipt tally only when a documented bank posting is classified as earned income, independently owner-reconciled in the journal, and matched to the study-specific payout evidence. A bank posting cannot be claimed by two studies; incomplete stage trails remain unverified.
- `OWNER-PRIVATE-SCHEMA.sql`: an **unapplied** Supabase/Postgres migration template for a separate private project. A one-person administrative allowlist, no anon grants, row-level security and append-only financial/evidence records are specified. The SQL file contains no owner identifiers, secrets or private transactions. Its policies have NOT been validated against a running database.
- `tests/incomeos-event-journal.mjs`, `tests/incomeos-research-outcomes.mjs`, and `tests/incomeos-source-boundary.mjs`: synthetic-data regression suites; required in GitHub Actions.

The current publicly readable GitHub repo cannot itself provide owner-only private hosting. The connected GitHub tool also does not presently expose private-repository creation, and no new backend project was provisioned. The public study application is a separate source of **public** recruitment information; it must not receive personal financial data.

**Migration sequence (blocked until a private host is provisioned and approved):** verify server-side owner identity and deny-by-default, apply and test RLS to a separate private database, secure encrypted active financial storage, verify P0 access and recovery tests, develop an authenticated import adapter, verify the journal head hash and event chain server-side, then migrate existing unencrypted local records only with explicit owner approval. Keep financial entry disabled in staging.

**Important:** All these changes are source-only increments, not a completed authenticated service. The user should not upload statements, tax forms or account details to the public prototype.

## Research feed and financial-value extensions (November 1, 2026)

The public-feed adapter now reads both the dated local study snapshot and exported public opportunity records, retaining source dates and unknown application deadlines. It excludes unrecognized or personal fields. The financial-value model separates owner-reviewed earned income, investment income, refunds, returned capital, sale proceeds, and observed bill savings, while preventing research income from being counted twice. Interrupted encrypted-backup restoration now attempts to roll back earlier browser writes. Synthetic regressions cover these cases.

These changes are development-only, not a deployed or authenticated financial service. Do not enter private financial data until the P0 deployment protections are independently verified.

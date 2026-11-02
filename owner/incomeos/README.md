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


## 2026-11-01 capital and investment controls increment

This incremental release provides two new source-only modules:

- `capital-readiness.js` calculates a **preliminary, non-executable** cash capacity from owner-declared cash account usage and statement-close evidence. It excludes liability accounts, credit limits, noncash holdings, restricted cash, unsettled debits, confirmed near-term obligations, and separately reviewed emergency/tax/other reserves. Missing sources, classifications, coverage, or approvals produce a HOLD and a null preliminary capacity. Even a clean result is only `READY_FOR_OWNER_CAPITAL_REVIEW_ONLY`, not a verified account balance or permission to invest.
- `investment-cashflow.js` reconciles cash distributions, capital deployed, returned principal, and sale proceeds to distinct reviewed financial-journal postings and matched documentation. It can link a distribution to a distinct capital-deployment posting for review of a potential reinvestment, without counting the same receipt again. Sale proceeds cannot establish profit without lots and cost-basis records. A source-linked reinvestment is not independent confirmation from the brokerage or provider.

The iPhone compounding view now includes a read-only `capital-review-ui.js` panel. Staging intentionally has no bank, broker, cash-balance or obligation evidence, so the panel displays a HOLD with no fictional available-to-invest number. No owner financial input was enabled.

Synthetic regression suites `tests/incomeos-capital-readiness.mjs` and `tests/incomeos-investment-cashflow.mjs` were added to required CI. The secure-deployment gate and the prohibition on actual financial execution remain unchanged.

Neither the private account population nor actual owner investment holdings, fees, dividends, basis or reinvestment elections have been verified. Production use still requires a separate protected financial service, independently tested access controls, authenticated statement ingestion, and an explicit owner release decision.


## Internal account transfer and card-payment accounting (Version 1.0 alignment)

`transfer-reconciliation.js` provides a synthetic-testable, source-identified pairing control for owner-reviewed movements between two cash accounts and payments from cash to a credit-card liability. It requires complete statement scope and both corresponding bank postings, reviewed source and document references, equal amounts and distinct accounts. It rejects duplicates, unsupported account pairings and unpaired journal transfers. Neither kind of movement creates new earned income or additional operating expense.

`transfer-review-ui.js` adds a read-only evidence-control panel to the staging accountant workspace. It intentionally supplies no actual statement data and therefore displays HOLD. It does not infer transfers from amount or merchant text or send private financial records anywhere. `tests/incomeos-transfer-reconciliation.mjs` is required in GitHub CI.

This source increment does not add an authenticated bank connector or private account access. Continue enforcing all P0 production release requirements before real financial records are entered.


## Protected preview release retry and staging read-only hardening (November 1, 2026)

- The separate `incomeos-opportunity-desk` Vercel project requires authentication for all targets. A new exact-commit preview request was blocked by HTTP 402 daily deployment quota. The existing daily wealth automation includes a bounded preview retry; it must not deploy production or change billing.
- `vercel.json` supplies proposed security headers for **this separate IncomeOS project only**. `manifest.webmanifest` uses relative start and scope so the owner's iPhone home-screen shortcut can work at a dedicated project root.
- `tests/incomeos-preview-probe.mjs` is an opt-in anonymous HTTP acceptance checker. It requires source-reported exact SHA and a READY, protected preview, then checks unauthenticated HTTP denial. It is **not** automatic evidence of authenticated owner access, secure data storage, or production readiness. Synthetic QA is in `tests/incomeos-preview-probe-qa.mjs`.
- The staging financial interlock now initializes before accountant scripts and is enforced inside write/import/edit/migration and encrypted restore paths. It does not replace server authentication. Existing local backup export and erasure remain available.

Do not enter or import financial data into the unapproved preview, and do not infer production release permission from green source tests.


## Source validation and staging privacy continuation (November 1, 2026)

The accountant now rejects duplicate or unknown CSV columns, nonexistent calendar dates and edits/imports when staging storage is disabled. Proposed changes are persisted before becoming live in the in-memory ledger; quota failures must not appear as completed imports. Local erasure is retained.

The locally available 2026 import file has 96 candidate expenses totaling $3,857.24. All 96 business-use allocations remain unknown. No personal source rows, receipts or account identifiers were committed to this public repository.

Research application status, locally imported leads, budget targets and planned bills are also write-disabled in static staging. This avoids treating unencrypted browser-local persistence as acceptable for private operational records. A protected backend and real authentication remain mandatory before owner data entry.


## Double-entry and calendar-month close (November 1, 2026)

`double-entry.js` implements a **pure, source-reviewed** double-entry movement model against the existing SHA-256 event journal. It requires equal debit and credit movements, supported account types, reviewed posted source classifications and unique use of underlying events. Earned income, investment cash income, expenses, refunds, invested capital, returned principal, personal tax payments, account transfers and credit-card payments have separate posting rules. Refunds must reference an original reviewed expense and cannot exceed that original cost. Returned principal cannot exceed capital deployed into the reviewed investment asset. Sale proceeds with unresolved basis are not recognized by this restricted ledger. Neither transfers nor credit-card payments create earned income or a second operating expense.

`monthly-close.js` adds a source-to-general-ledger join: owner-declared bank and card accounts, independently listed statement rows, full-period statement arithmetic, the reviewed financial journal, double-entry postings, and one-to-one posting-to-statement references must all agree before `READY_FOR_ACCOUNTANT_SOURCE_REVIEW_ONLY` is returned. All outputs revert to HOLD and withhold financial totals on any source, period, mapping or balance conflict.

**Scope restriction:** the current close model accepts a **single full calendar month with all source postings in that period**. It does not yet support audited opening balances, carried-forward investment cost basis, partial refunds referencing prior-period expenses, prior-period transaction rollforwards, or accountant sign-off. Those are mandatory before calling it an operational multi-month/general-ledger close. All successful test figures are synthetic. No owner records are stored, no trade/payment is enabled and no bank is authenticated. Tests: `incomeos-double-entry.mjs` and `incomeos-monthly-close.mjs`.


## Consecutive calendar-month owner-source rollforward

`period-rollforward.js` connects two to 24 **independently passing** full calendar-month close packages without relaxing `monthly-close.js`'s source coverage gate. It verifies month adjacency, consistent owner-reviewed chart/account mappings, account population, bank/card statement opening-to-prior-closing balance continuity, and each month’s double-entry debit/credit movement against its bank statement balance change. It rejects duplicate event IDs, original bank IDs, provider source IDs, ledger entry IDs and payment document references across periods. Failed checks suppress the final balance figures.

The opening population still requires owner attestation and an opaque evidence reference. This is **not** independent authentication of the opening balance or the existence of all bank accounts. Each month has its own SHA-256 event history; no externally signed cross-period journal anchor exists. Owner-reviewed source evidence is not provider-certified.

**Excluded until separately implemented:** prior-period refunds whose original expenses were booked in an earlier month, recorded asset acquisitions and disposals with incomplete lot/cost basis, account opening/closure migration, corrections to earlier closed periods, signed accountant close, and a validated cumulative balance sheet. A currently unsupported historical adjustment must return HOLD, not be recast as current earned income.

`tests/incomeos-period-rollforward.mjs` uses synthetic September/October periods, checks account/card balance changes and rejects missing attestations, nonconsecutive months, account-map changes, mismatched carryforward balances, duplicate bank and source identifiers, unrecognized metadata and changed journal evidence. This is not a live financial source import.

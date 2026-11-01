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

- index.html: dashboard tabs, individual study links, alternative-asset watchlist, manual earnings ledger and scenario modeling.
- opportunities.json: dated public-source research and investment research candidates with explicit caveats. No live feed is claimed.
- incomeos.js and incomeos.css: static client-only controls without external scripts.
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
- The local **CSV import** accepts a deliberately strict template, downloadable from the app: `kind,date,description,vendor,category,amount_usd,status,business_use_pct,evidence_ref,notes`. Use positive USD amounts, with `kind` explicitly specifying income, expense, taxpayment, capital, or other. Entries imported from outside sources start **unreconciled**, and possible duplicate entries are flagged/skipped by date, type, description and amount. A matched vendor charge is not proof of business purpose.
- ChatGPT can help discover and review permitted linked Gmail receipts or authorized linked Finances transactions and prepare this CSV in-chat when asked. **The static owner web app cannot directly call ChatGPT connectors or read private connected accounts.** This prevents accidental disclosure to the public repository. Never commit financial statements, receipt attachments, private Gmail links or tax files.
- Supported document formats and tax-form identifiers are reference fields only. The prototype does not import, store, or verify PDF attachments. Secure backup and source documents should be supplied separately to the accountant.
- Browser localStorage is device/browser scoped and can be erased. Use private backup exports and keep them securely stored. The app is not a system of record for complete tax compliance, not integrated with payroll or tax filing, and cannot assert all expenses and income have been captured. Accountant review is required before tax reporting.

## Accounting

Only received, manually recorded payments count as paid income. Advertised incentives are not earnings. Financial asset examples carry risk and are not recommendations. Investing or reinvesting requires owner approval and an authorized provider.

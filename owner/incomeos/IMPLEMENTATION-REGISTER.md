# IncomeOS Master Implementation Register

**Owner-only personal financial operating system**
**Baseline:** 2026-11-01
**Status:** Controlled staging. No production owner data entry or financial execution authorized.
**Source branch:** `feature/incomeos-owner-prototype-2026-11-01`, GitHub PR #91 (draft and unmerged).

## Governing objective

Improve *verified net financial benefit* with minimal administrative work. Preserve four distinct outcomes: (1) new income actually received, (2) income from existing capital, (3) refunds or other capital recovered, and (4) reductions in paid bills. Keep unrealized investment appreciation and all hypothetical estimates separate. Never count advertised incentives, promising leads, or recovered principal as new earnings.

Do not introduce paid work, product sales, customer acquisition, or a commercial product. Optional worthwhile paid studies and interviews remain the only participation exception. No account opening, subscription charge, fund movement, financial transaction, enrollment, or study application without owner authorization and provider compliance.

## Platform topology verified November 1

| Component | Operating state | Data boundary | Decision |
| --- | --- | --- | --- |
| Public research radar (Lovable/Supabase) | Published site with connected public study feed and browser-local study states | Nonpersonal public recruitment data only | Continue and improve public source verification; never add private owner data |
| GitHub private owner workspace, `/owner/incomeos` | Development code in draft PR #91 | Unencrypted active localStorage, encrypted **exports only** | Cannot enter private data or merge into public JRS |
| JRS Vercel deployment | Existing public project; preview SSO protects noncustom domains, custom domains remain public | JRS production must be isolated | Do not use public JRS deployment as owner authentication |
| ChatGPT Priority Study Alerts | Existing hourly automation | Approved public research information, optional source-linked alerts | Maintain individual, sourced and urgent study detection |
| ChatGPT Passive Opportunity Radar | Existing daily automation | Public recovery/rebate/passive opportunity research | Maintain no-sales passive opportunity scope |
| ChatGPT Passive Wealth Cycle | Existing daily automation | Compare capital/yield opportunities, without execution | Explicitly exclude digital product sales and storefront work |
| ChatGPT Expense Reconciliation | Existing monthly automation | Authorized owner-only financial and receipt data | Preserve source coverage, reconcile receipts and prepare workpapers |

## Implementation inventory and acceptance

### 1. Research opportunity intelligence
- **Active:** Separate public study feed, individual application URL, source/date/status, search, source filtering, saved listing and local progress.
- **Prototype:** Additional owner research-screener scoring, JSON import, duplicates, freshness, effective hourly estimates and CSV export.
- **Future:** Shared canonical public opportunity IDs, approved import/sync, identity-safe private application-to-payment funnel, observed recruiter conversion, broken-link checks, participation deadline notices.
- **Acceptance:** No expired lead labeled open; no applications submitted; no incentive booked as received income without independent payment evidence.

### 2. Accounting and financial-control backbone
- **Prototype:** Cross-source income/expense categories, tax form flags, business-use unknown-versus-zero, receipts and capital movements, CSV and print reports.
- **Implemented in this increment:** `accounting-controls.js` validates USD cents, posted bank source identity, opaque account tokens, duplicate/contradictory postings, exact evidence linkage, amount/date proposals (never automatic reconciliation), earned income versus recovered principal, owner-reviewed bank linkage and fail-closed month-close control.
- **Owner view:** `accounting-controls-ui.js` displays local exceptions with no false assertions of bank access or tax-readiness.
- **Future:** Provider-authorized import adapters, immutable event journal and reversal corrections, double-entry general ledger, documented statement coverage, protected document store, matching approvals, receipt/tax form reconciliation, year-end accountant workpapers, source-complete cash flow and balance-sheet-style reports.
- **Acceptance:** Exactly one posted bank source per reconciled entry; no duplicate source ID counted twice; all uncertain credits remain unclassified; all unresolved account coverage disclosed. "Owner-reviewed" is not an external audit or tax advice.

### 3. Recovery, refunds and recurring savings
- **Prototype:** Recurring merchant detection, current-month category budget and expected-bill planning.
- **Implemented in this increment:** `recovery-engine.js` flags potentially duplicated real merchant debits without treating duplicated imports as duplicate charges, links nonincome receipts to original charges when explicit references exist, and only observes recurring savings after two comparable, documented post-change bills.
- **Owner view:** `recovery-ui.js` exposes potential billing and refund exceptions. It does not submit disputes, cancel contracts or claim refunds.
- **Future:** Protected recovery case journal, official unclaimed-property program search, claims and response deadlines, invoice/refund associations, provider status, recurring-savings verified baselines, vendor-credit retention and exception-driven owner prompts.
- **Acceptance:** Every recovered amount supported by a bank credit and underlying claim or original charge. No savings counted as earnings. Do not overcount the same credit and a subsequent bill decrease.

### 4. Capital yield and investment accounting
- **Prototype:** Alternative-asset research watchlist, manual asset review HOLD gate, after-fee/tax/inflation illustration.
- **Future:** Available-capital determination after reserves and obligations, live current provider offers, insured deposit coverage assessment, Treasury/CD yield and maturity schedules, after-fee/tax comparisons, lot/basis and distributions ledger, investment statement reconciliation, owner-authorized reinvestment tracking, concentration and downside tests.
- **Acceptance:** No execution until source freshness, owner suitability, source-backed capital availability and explicit provider authorization are established. Modeled yield cannot appear as money earned.

### 5. Automation and owner workflow
- **Active:** Four distinct schedules described above. Existing public research site and protected staging components do not automatically share private data.
- **Future:** One private iPhone executive screen, secure cross-device owner login, multi-source automated reconciliation, exception-only summaries, protected recovery/expense exports, source-change alerts, role-denied-by-default data interfaces and monthly close package.
- **Acceptance:** Privacy/access negative tests; authenticated owner tests; import idempotence; recorded owner effort; backup recovery and secure erasure.

## Order of implementation

| Delivery slice | Dependency | Scope | Evidence-based release gate |
| --- | --- | --- | --- |
| P0-A (in progress) | Existing draft branch | Source-safe accounting checks, recovery signals, synthetic tests, architecture register | Five regression suites pass; no private data submitted; PR remains unmerged |
| P0-B (blocked) | Owner-only hosting and authentication | Separate private deployment, allowlisted owner, denied anonymous access to every private route, server headers, encrypted active data, session/backup/erasure policy | Negative access tests, cryptographic storage review, iPhone QA, owner approval |
| P0-C | P0-B | Signed/authorized financial import, posted transaction IDs, account coverage registry, protected evidence files, immutable history and corrections | Account-level statement tie-out, mismatch queue, reproducible report |
| P1-A | P0-C | Recovery case tracking, refund matching, utilities and subscriptions, bank-credited financial benefits | No inflated refunds or savings; source-based reconciliation and deadlines |
| P1-B | P0-B + research feed validation | Public-to-private study metadata exchange and payment-stage tracking | No participant details in public data; no double counting income |
| P1-C | P0-C | Investment cash flow, basis, distributions and available capital assessment | No provider execution, all cash flows source-backed |
| P2 | P1 acceptance | Financial value attribution, capital scenarios, eligible program monitoring, monthly/annual report generation | Verified receipts/costs, owner time, benefits and rollback recovery recorded |

Release dates are estimates, not authorization to ship. A failed P0 gate prevents production use of all dependent features.

## Data classification

- **PUBLIC_SOURCE:** dated public recruiter/provider descriptions without owner attributes.
- **PRIVATE_OWNER:** transactions, account token references, receipts, applications, investment holdings, tax records, approval history and case notes.
- **RESTRICTED_CREDENTIAL:** authentication, refresh tokens, provider API keys and financial-provider permissions. Never store in GitHub, publicly published JS, CSV exports or model prompts.
- **DERIVED_SUMMARY:** totals only when their source scope and verification status are retained.

## Accounting integrity conventions

- Monetary amounts are integer USD cents for validated source comparisons. Non-USD records require explicit source-backed conversion rather than an assumed rate.
- Bank source key is institution + opaque/masked account token + immutable posting ID; repeated identical debits with different IDs remain distinct.
- Duplicate bank source IDs with inconsistent data cause a blocking issue.
- Amount/date suggestions are not reconciliations; owner marking is not independent verification.
- Income, recovered principal, sale proceeds, estimated tax payments and capital contributions have separate accounting classes.
- Tax treatment, business-use purpose, basis and deductible amounts require evidence and professional review.
- A successful source-level QA check does not certify privacy, tax correctness or actual generated earnings.

## Release evidence to obtain

1. Authenticated and unauthenticated network traces for every private route and asset, with no accidental public cache.
2. Review of encryption and active storage, including migration from plaintext browser storage.
3. Source coverage manifests and independently reconciled bank-to-ledger totals, plus exceptional transaction evidence.
4. At least one owner-approved recovery or payment case with documented actual outcome.
5. iPhone Safari functional, accessible interaction, backup restore, security error and connectivity tests.
6. Verified financial results and owner administrative time, reported separately.

**Current economic result:** No verified IncomeOS-generated revenue or autonomous financial execution has been established by the code or CI alone. Keep the program in controlled development until evidence exists.


## 2026-11-01 follow-on: immutable events, payout attribution and private schema

| Engineering component | Implementation | Current verified state | Remaining dependency |
| --- | --- | --- | --- |
| Financial event journal | `financial-event-journal.js` | Pure SHA-256 event-chain verification, reversal sequencing, owner-reviewed class totals; synthetic tests | Signed/authenticated server append, serializable sequence, private storage and bank integration |
| Paid-study payment attribution | `research-outcomes.js` | Strict application-to-payment stages, study-specific documented bank credit, duplicate prevention | Private owner pipeline and verified actual provider/payout sources |
| Proposed private persistence | `OWNER-PRIVATE-SCHEMA.sql` | Reviewed SQL source with single-owner allowlist, RLS policies and append-only tables; **not applied** | Separate private project, admin owner enrollment, real anon/non-owner/owner RLS tests, encryption review |
| Public-source safety gate | `tests/incomeos-source-boundary.mjs` | Source-only extension and credential-shaped filename checks | Independent secret scan and deployment authorization tests |
| Source regression suite | GitHub `IncomeOS private prototype checks` | Eight code/source suites now required by workflow | Hosted browser testing and external security review |

No financial events were sent to the public study feed. No revenue, recovered money, bank import, investment order, deployment or private-account connection was executed during this increment.

## Increment: public research interoperability and audited-value model

The November 1 continuation adds `public-feed-adapter.js` for strict public-field source mapping and unknown deadline handling; `financial-value.js` for independent owner-reviewed financial classifications and no research-payment double count; and rollback protection during encrypted-backup restoration. Both new synthetic test files are required by CI. No personal financial feed was connected and the owner-only deployment security gate remains open. The public Lovable research site and private owner staging branch are not automatically synchronized.


## Development continuation: statement close and protected append gate

| Component | Built in current increment | Validation status | Release dependency |
| --- | --- | --- | --- |
| Isolated staging target | Existing Vercel `incomeos-opportunity-desk` configured with authentication on all deployments, no custom domains | Protection configuration read back | Preview blocked by free-tier deployment API quota (HTTP 402); no hosted browser or network tests |
| Multi-account statement close | `statement-close.js`: required owner-declared scope, bank and card balance conventions, exact statement arithmetic, source counts, linked entries, contiguous periods and evidence checks | Synthetic tests `tests/incomeos-statement-close.mjs` | Authenticated import, source completeness, genuine statement documents, independent bank reconciliation |
| Financial journal persistence | `private-append-handler.js`: an unrouted fail-closed server adapter contract for origin, authentication, owner allowlist, CSRF, exact head and atomic append | Synthetic tests `tests/incomeos-private-append.mjs` | Trusted server authentication, verified CSRF, transactional repository, idempotency, KMS/at-rest encryption, deployed endpoint |
| Database authorization correction | Browser direct INSERT revoked for private financial and evidence data in draft SQL; owner receives SELECT-only access | Static security policy checks | Separate database provision and real owner/nonowner/anonymous tests before migration |

No site was deployed and no owner financial data was imported. The JRS custom production domains remain unchanged. Public research data remains separated from any future private financial service. No tax determination or new financial income is established by passing synthetic tests.


## Latest source increment: capital readiness and investment cash flows

| Workstream | Development delivered | Acceptance and limits |
| --- | --- | --- |
| Capital sufficiency and reserves | `capital-readiness.js` consumes the statement-close evidence model, identifies owner-classified cash, excludes liabilities and noncash assets, reduces cash by holds, unsettled debits, near-term obligations and emergency/tax/other reserves | A result is preliminary and non-executable; any missing account, disputed posting, reserve or obligation evidence produces HOLD with no estimated capacity |
| Investment accounting and reinvestment | `investment-cashflow.js` attributes cash distributions, invested capital, returned principal and sale proceeds to owner-reviewed journal postings and exact document links, with optional one-to-one reinvestment pairing | No automatic trade, bank transfer or reinvestment; sale proceeds cannot be called gain without cost basis; pair matching does not independently establish provider execution |
| iPhone experience | `capital-review-ui.js` shows the true staging blocker and release prerequisites within the compounding view | No private financial amounts entered, no misleading cash balances, no automatic banking connection |
| Regression suite | `tests/incomeos-capital-readiness.mjs` and `tests/incomeos-investment-cashflow.mjs` | The existing workflow now includes 14 synthetic IncomeOS suites plus the separate JRS site gate |

The next implementation dependency remains real, separately authenticated owner storage and verified bank/investment statement import. The code and tests are not evidence of earned investment returns, recovered principal, available capital, approved tax basis, or a completed reinvestment.


## Version 1.0 plan alignment: internal transfers and credit-card payments (November 1, 2026)

The owner's complete IncomeOS Master Development and Operating Plan, Version 1.0 dated November 1, 2026, governs the project's modules, priorities, economic measurements and release controls. Where implementation source and plan descriptions differ, label the source state clearly and do not claim production readiness.

The accounting module now includes `transfer-reconciliation.js`, a pure, source-only ledger review engine, plus `transfer-review-ui.js` and `tests/incomeos-transfer-reconciliation.mjs`. It implements the planned internal transfer and credit-card payment matching controls:

- Consumes the SHA-256 validated, owner-reviewed financial journal and the existing complete-statement source coverage gate.
- Requires two distinct posted bank references and active `transfer_out`/`transfer_in` journal classifications, reviewed by the owner, with bounded date differences, equal USD amounts, specific source evidence references and different confirmed owner accounts.
- Differentiates bank-to-bank transfers between two declared asset accounts from credit-card payments between an asset account and a declared liability account.
- Rejects duplicate event pairing, source binding reuse, unexpected fields, missing source rows, mismatched directions, incomplete statement coverage, wrong account types and unpaired classified transfers.
- Returns matched capital movements **without contributing a cent to earned income or operating expense**.
- Does not infer transfers from similar descriptions, amounts or dates; independent account ownership remains unverified until authenticated financial sources exist.
- The staging accounting panel deliberately uses **no** private bank statements or journal data, displays HOLD, and cannot import, classify or execute financial transactions.

**Acceptance status:** Synthetic source-level regression tests only; no real bank ingestion or independently verified transfer reconciliation. Further work remains: secure owner backend, authorized account synchronization, counterpart evidence, double-entry general ledger, transaction splitting, validated tax workpapers and annual accounting package. The public JRS site and public research feed remain independent.


## Latest release-control increment: protected preview and staging write denial

| Component | Implemented | Verified | Remaining release dependency |
| --- | --- | --- | --- |
| Vercel owner staging | Existing `incomeos-opportunity-desk` project protected with all-target Vercel Authentication; preview-only deployment attempted | Provider confirmed HTTP 402 daily deployment limit and 24-hour retry window | Actual READY exact-head preview and independently executed HTTP/browser checks |
| Reproducible anonymous probe | `tests/incomeos-preview-probe.mjs` plus synthetic QA | Exact team/project/SHA/READY/SSO checks and 401/403 responses for sampled paths; rejects public 200, missing 404 and uncertain 302 | Execute against exact Vercel deployment with provider metadata and separately verify authenticated sessions |
| Dedicated static security policy | `owner/incomeos/vercel.json`: no-store, restrictive CSP/frame denial, HSTS, permissions, noindex | JSON/source-asserted policy; no hosted evidence yet | Confirm response headers at Vercel and on iPhone |
| Home-screen installation | Relative app start/scope in `manifest.webmanifest` | Source QA | Protected hosted Safari Add-to-Home-Screen verification |
| Financial entry safeguard | Staging flag before accountant initialization; blocked edits, writes, legacy migration, CSV/JSON imports and vault restore | Synthetic regression tests | Separate authenticated/secure financial service needed to permit any private input |
| Bounded retry | Existing `IncomeOS Passive Wealth Cycle` automation updated; no change to schedule | Tool confirmed automation update | The preview check runs only within existing recurring task and is not a substitute for production security |

**Gate resolution:** Source CI can pass, but the overall release remains HOLD while external deployment quota and live security evidence are outstanding. No new application income, refunds, investment execution or private account access was established by this increment.


## Source integrity continuation: safe accountant backfill preparation

| Workstream | Implemented | Acceptance evidence | Unmet dependency |
| --- | --- | --- | --- |
| Accountant CSV import | Strict schema, real calendar-date checks and persist-first ledger updates | Synthetic import, repeat, storage-failure and tax-allocation unknown tests | Separate authenticated encrypted owner storage and real source reconciliation |
| Historical 2026 candidate register | Local inspection confirmed 96 candidate expense rows totaling $3,857.24 with individual evidence references | Local CSV structural review only, no source-row upload | Establish original bank/receipt coverage and business-use allocations with accountant |
| Plaintext staging restrictions | Prevent research progress, imported lead state, saved preferences and budget/planned-bill writes in staging | Static privacy/syntax regression and existing accountant staging tests | Authenticated owner service and protected cross-device storage |
| Production readiness | Existing draft PR remains unmerged with no private data deployment | Exact-head GitHub CI, if green | Vercel daily deployment quota, protected preview, database RLS, authenticated Safari and financial tests |

The candidate expenses remain unverified; no new deductions, income, savings, repayments or investments were generated by this increment.


## Accounting integrity increment: double-entry movements and source-to-ledger close

| Component | Source completed | Synthetic acceptance | Still required |
| --- | --- | --- | --- |
| Controlled double entry | `double-entry.js` | Balanced debits and credits; distinct revenue, expense, refunds, principal, tax, transfer and card-payment rules; source IDs cannot be reused; HOLD withholds financial totals | Private authenticated journal, account authentication, posted bank/broker verification, opening balances and independent audit |
| Source-to-ledger reconciliation | `monthly-close.js` | Calendar-month source period, ledger account-to-bank identity mapping, statement totals/posted count, full matching of active journal events and accounting entries; negative mismatches block close | Actual bank/receipt ingestion, independently verified statement provenance, exception resolution and accountant review |
| CI expansion | `tests/incomeos-double-entry.mjs` and `tests/incomeos-monthly-close.mjs` | Synthetic tests added to required incomeOS checks; JRS isolation unchanged | Hosted preview, private RLS, iPhone Safari, authenticated access and full financial acceptance |

**Explicit coverage limitation:** the close engine cannot yet reconcile multiple months or prior-year cost-basis / refund rollforwards. No cumulative balance sheet, operating cash flow, taxable income, independently verified financial benefit, or automatic compounding is established by this change. Do not enable private financial input in staging.


## Multi-month financial integrity increment

| Workstream | Delivered | Source-level acceptance | Outstanding dependency |
| --- | --- | --- | --- |
| Consecutive monthly rollforward | `period-rollforward.js` | Source-reviewed full calendar months in order, account mapping continuity, GL movement to statement deltas, prior closing to current opening balances, cross-month duplicate detection | Real authenticated statements and certified opening balances, external journal-head anchoring and independent source completeness |
| Cross-period report protection | Rollforward HOLD suppresses closing balances if any month is incomplete or an identifier/mapping conflicts | Synthetic negative cases in `tests/incomeos-period-rollforward.mjs` | Authorized private storage and production policy gating |
| Historical refund and capital basis | Held explicitly, not inferred | Prior-period unsupported references do not silently become current-period earnings | Controlled historical evidence links, prior-period refund totals and investment lot/basis rollforwards |
| CI | New 21st IncomeOS synthetic suite and separate JRS/owner-data isolation gates | Completed exact-head GitHub workflow checks where recorded | Protected Vercel preview, authenticated iPhone tests, bank integrations and financial audit |

This is an incremental source-control improvement, not an operational wealth or investment service. No owner balances, receipts, refunds or interest earnings were verified by this module.

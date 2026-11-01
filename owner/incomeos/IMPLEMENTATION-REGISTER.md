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

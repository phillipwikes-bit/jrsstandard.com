# IncomeOS Master Implementation Register

> **Controlling amendment, 2026-11-05 (Version 2.3):** This is the existing authoritative engineering implementation register, not a second roadmap. The November 1 baseline and earlier no-commercial-product language below are retained as historical statements. Version 2.3 now authorizes private Decision Spellchecker engineering, verification and commercial preparation, but does not authorize sales, outreach, customer access, payments, production releases, restricted-source disclosure or intellectual-property transfers. The authoritative development source is `owner/incomeos/` on `chatgpt/incomeos-v23-product-integration-20261105`. Public JRS and any customer delivery environment remain separate security domains.

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

## Accounting editor reporting increments, 2026-11-04

| Commit | Delivered | Source-level acceptance | Outstanding dependency |
| --- | --- | --- | --- |
| 49e4496 | Expense payment status (paid, scheduled, disputed, refunded) and questions for the accountant | Only paid expenses count toward totals; unit and browser tests | Hosted owner sign-in |
| 6fbe567 | Category totals in separate money groups | Refunds, unpaid bills and returned principal no longer mixed into income or expense totals | Same |
| bf9f19c | "Paid from" label; CSV optional columns | Over four digits refused on entry, restore and import; `payment_status` and `accountant_questions` columns now import (previously rejected) | Same |
| fefee7f | Reconciliation evidence classes | Every record in exactly one class; labelled as recorded evidence, not bank matching | Bank feed not connected |
| 6271ab8 | Phone-width checks at 320, 375 and 430 px | Previous overflow check compared with a width that phone emulation widens, so it could not fail; corrected in two browser tests | Physical iPhone not tested |
| 2b13e1d | Receipt-gap report | Paid outflows without a receipt listed once; a reference number alone no longer hides a gap | Same |
| 8fcc7b3 | Unclassified-transactions report | Category or type "other" listed once with every reason; nothing reclassified automatically | Same |

The acceptance status of Milestone A against the directive's sixteen checks is recorded in `ACCOUNTING-EDITOR-ACCEPTANCE.json` and guarded by `tests/incomeos-acceptance-record.mjs`: 11 SOURCE TESTED, 5 BLOCKED (owner authentication, denial of unauthorized access, hosted secure storage, release evidence, owner publication approval). The milestone is not complete.

### Later 2026-11-04 accounting editor increments

| Commit | Delivered | Source-level acceptance |
| --- | --- | --- |
| 992972a | JSON backup round trip through the page | Backup, reload, refused tampered backups, identical restore, repeated restore adds nothing |
| 834637b, b26cf02 | Row buttons name their record; help notes linked to fields | Labels, names, Tab order through both forms, visible focus (automated checks only) |
| 4deffda | Validation errors beside each field | aria-invalid, linked message, announced summary, focus on first problem, nothing saved |
| ceb963b, e7127ce | Focus follows edit, save, cancel and remove; "Editing:" note | Focus lands on the acted-on record or a neighbour; note warns when the filter hides the record |
| 9204e12 | Duplicate guard for manual entries | Same kind, date, amount and payer asks first; self-edit never matches |
| b90376f, be0363c | Correction history | Earlier values and source kept per record, shown in the detailed CSV and printed report |
| this commit | Likely duplicates as a completeness gap; corrected-record count in the summary CSV | A repeat confirmed as separate is not counted |

Milestone A status is unchanged: 11 SOURCE TESTED, 5 BLOCKED (see `ACCOUNTING-EDITOR-ACCEPTANCE.json`).

Superseded 2026-11-04 (later the same day): the "11 SOURCE TESTED, 5 BLOCKED" counts above were correct when written. After hosting, A02 and A15 became PROTECTED PREVIEW VERIFIED and A01 became OWNER ACCEPTANCE PENDING; A14 and A16 remain BLOCKED. `ACCOUNTING-EDITOR-ACCEPTANCE.json` is the current record.

## Paid Research increments, 2026-11-04 (live on the protected hosted app)

| Commit | Delivered | Source-level acceptance |
| --- | --- | --- |
| 98a8798 | Start or open the workspace from the Income screen | Workspace buttons in the interlock banner |
| 376b729 | Study progress stored in the owner workspace | Progress survives save and reopen; "New" clears the entry; browser test |
| 09de029 | "Record this payment in Income" on paid studies | Prefills the income form with `study:<id>`; an already-recorded study opens the existing record instead of creating a duplicate |
| 460a6a2 | This week lists paid studies not yet in Income | Each has a "Record in Income" button |
| efe439d | Realised hourly yield on study cards | Uses only the received amount recorded in Income; says so when time is unconfirmed or missing |

Advertised study compensation is never counted as received income; only an Income record counts.

## Passive Opportunity Radar intake (Milestone B), 2026-11-04

| Commit | Delivered | Source-level acceptance | Outstanding |
| --- | --- | --- | --- |
| this commit | `passive-radar.js`, `passive-radar-ui.js`; Assets tab "Passive opportunity findings"; ChatGPT task wording in `CHATGPT-INTAKE.md` | A finding without a source name, https source link, https direct link or a found-on date within 14 days is refused with a stated reason; scam, paid-finder and personal-data signs are refused; duplicates by id or link refused; types are new income, returned capital, savings or projection; projections and estimated amounts never enter potential totals; received is always $0; nothing fetched or stored (unit and 320 px browser tests) | Findings are not saved in the workspace and cannot yet become a tracked recovery claim; the ChatGPT task's real output has not been loaded |
| 2070d42 | Section 11 terms (provider, capital required, effort, counterparty and default risk, liquidity, lockup, tax note, required action); owner decisions New, Pursuing, Done, Dismissed saved in the workspace (`passiveFindings`, `setPassiveFinding`) with a "Kept in your workspace" list | Unstated terms read "not stated"; capital at risk flagged; a decision needs a workspace, never touches the ledger, survives encrypted save and reopen; dismissed findings stay hidden in later files; older workspaces still load | Returned-capital findings do not yet open a recovery claim |
| 04f6444 | "Track as recovery claim" on returned-capital findings (`claimFromFinding`); the claim carries the finding's source link, direct link and found-on date, and appears under Open claims in This week | One claim per finding; kind chosen from the finding's wording (unclaimed property starts at search due, a refund at match found); only a source-stated amount becomes the estimate; recovered stays $0 and PAID still needs a bank reference; marking the finding Done keeps the claim link | None for this step |

## Passive Wealth and Compounding (Milestone C), 2026-11-05

| Commit | Delivered | Source-level acceptance | Outstanding |
| --- | --- | --- | --- |
| db843f7 | `compound-capacity.js`, `compound-capacity-ui.js`; Compound tab "Available to compound" built from the accounting editor's own totals for a chosen year or all years, with a reserve and a downside loss check | Received income after fees only; expected, invoiced and pending income disclosed and never counted; returned principal and sale proceeds shown as capital back, not earnings; paid expenses, taxes and capital already contributed deducted; scheduled bills and the reserve deducted; never negative; marked an estimate while any counted record is unreconciled (unit and 320/375/430 px browser tests) | Not reconciled to bank balances; no actual investment performance reporting yet |

Test correction, 2026-11-05: `tests/incomeos-research-ehy-browser.mjs` began failing when the date passed 2026-11-04, on this commit and the one before it. The app holds sources reviewed more than three days ago, and the committed snapshot `opportunities.json` is dated 2026-11-01, so every study was held. The app behaviour is correct; the test now pins the page clock to the day after the snapshot date. The snapshot itself was not altered. Consequence for the live app: the built-in research snapshot is now stale and shows every study on hold until fresh findings are imported.

## Paid Research on the protected app, 2026-11-05

| Commit | Delivered | Source-level acceptance |
| --- | --- | --- |
| d8f5b8f | Study files and thresholds now work on the hosted app in page memory only; the Research tab says when the built-in snapshot is past the three-day window; ChatGPT study-alert wording in `CHATGPT-INTAKE.md` matching the importer | Before this, the storage interlock disabled the study import, so the hosted app could not load any study after the 2026-11-01 snapshot went stale. Now a file reviewed today loads and is screened, private or unrecognised fields are refused, browser storage stays empty and a reload clears the studies (browser test at phone width) |

Guard change, recorded deliberately: `tests/incomeos-staging-privacy.mjs` asserted the text "Local imports require secured owner storage", i.e. that the study import was blocked under the interlock. The interlock exists to stop browser-storage writes; `load()` and `persist()` remain blocked unchanged. The assertion is replaced by checks that the memory-only branch exists and returns before `persist()`, and the new browser test asserts storage is empty after import. Only public study listings are affected; no financial or personal data path changed.

The repository-wide `scripts/check_zero_drift.py` reports 50 failing checks both before and after this change (public JRS engine, research and disclosure pages); none concern IncomeOS.
| eefaf6e | Loaded studies are kept in the open workspace (`researchStudies`, `setResearchStudies`) and return when it is reopened; studies loaded before opening a workspace are carried into it | Each study is re-checked by the study screener on saving; duplicates removed, at most 200, newest first; fails closed if the checker is missing; survives an encrypted save, reload and reopen with its hourly yield intact; browser storage stays empty; older workspaces still load |

Guard change, 2026-11-05 (second): the memory-only assertion in `tests/incomeos-staging-privacy.mjs` now checks structure rather than message text. It isolates the memory-only branch and asserts it returns before `persist()` and contains no `persist(`, `localStorage`, `sessionStorage` or `indexedDB`. Shown to fail when `persist()` is injected into that branch.

## Actual results by holding (Milestone C), 2026-11-05

| Commit | Delivered | Source-level acceptance | Outstanding |
| --- | --- | --- | --- |
| 5ca14ac | `holdings()` in `compound-capacity.js`; Compound tab "Actual results by holding" grouped by payer or payee name | Money put in = paid capital outflows only; income received = paid interest, dividend, investment, rental or royalty income after fees; principal returned and sale proceeds shown as capital back, never income; expected income and scheduled contributions ignored; status says how much is still in; income on capital shown unannualised; unnamed records grouped and flagged; missing contribution, unknown cost basis and unreconciled records flagged (unit and 320/375/430 px browser tests) | Grouping relies on consistent payer names; no market value, so unrealised gain or loss is not shown; `investment-cashflow.js` remains unused |
| 52e6c23 | Reinvestment tracking: an asset purchase or capital contribution may record "Reinvested earnings" and the holding they came from (`reinvestedUsd`, `reinvestedFrom`, both kept in the correction history); the holdings report splits money put in into reinvested earnings and new money and shows earnings reinvested elsewhere | Only capital outflows accept it; the amount cannot exceed the payment and needs a named source; earnings are capped at income actually received from that holding, in date order; expected income and returned principal never count; any excess or unknown source is counted as new money and flagged (unit and browser tests) |
| this commit | Outflow type "Transfer between my own accounts (not spending)" | A transfer is not an expense, other outflow or capital; it needs no receipt, is not flagged as unclassified for its cost category, sits in the "transfers, returned principal and capital movements" reconciliation class and its own category group, has no business-use share, is shown in the summary and summary CSV, and never changes available-to-compound (disclosed instead). Before this, transfers had to be entered as "Other outflow" and were counted as spending (unit and browser tests) |

## IncomeOS v2.3 functional integration increment, 2026-11-05

**Work ID:** INCOMEOS-V23-P0-01. **Product:** Decision Spellchecker (DS-N1 experimental candidate). **Engineering:** ChatGPT coordinated, source-controlled development. **Integration destination:** the existing IncomeOS Owner Desk programme and the existing `dsProgram` section of the sole workspace. **Status:** `INTEGRATION_IN_PROGRESS`. **Release:** NOT AUTHORIZED. This entry adds evidence to the existing implementation register, not another authoritative register.

- **Authoritative owner source:** `owner/incomeos/`, from IncomeOS draft PR #91 head `aad8c9c4b3ba8524e13e41bea64faffddfced292`; one programme schema `incomeos.ds-program.v1`. No parallel financial ledger was created.
- **Imported experimental product source:** exact `lib/ds-n1/` tree object `12376962210dbce385b2fad6af9a6bb92556e3d2` and `tests/ds-n1/` tree `882543e37e393ebc71f18e95abc7be0e3d8eca43` from cognitive-control candidate PR #128 head `e345475c5bf0bd92ab68a9d53d8ddc983e480dfb`. PR #119 base head `f8c7a2ad5fa81e7922401b7937530161ec97e61f`. The candidate's current `identity.mjs` declares `DS-N1`, `0.7.0-dev`, rules `ds-n1.rules/0.2.0`. Older PR prose can refer to an earlier development version; actual source identity governs. This is not recovered DS-A.
- **Source files:** `owner/incomeos/ds-runtime-bridge.mjs` provides contract `incomeos.ds-runtime-bridge/1.0.0-dev`, calling the actual DS-N1 validator, review session, human action engine, report, cognitive controls and reflective guidance. `owner/incomeos/ds-product-panel.mjs` and `owner/incomeos/index.html` render candidate identity and actual `dsProgram` acceptance/gates in the existing product view. `tests/incomeos-ds-runtime-bridge.mjs`, `tests/incomeos-ds-panel-browser.mjs` and the branch-only workflow `.github/workflows/incomeos-ds-p0-integration.yml` implement reproducible synthetic test coverage. The obsolete, unused `owner/incomeos/product-integration.js` hardcoded source snapshot is deleted in this increment; Git history retains its provenance.
- **Contract:** inputs are existing `incomeos.ds-program.v1` records plus `ds-n1.record/1.0` constructed fictional packages; outputs are DS-N1 native sessions, findings, cognitive/reflective prompts, actions and reports, or read-only derived source and gate statuses. State changes remain in the existing DS-N1 event log; no second inference engine, data store, API, payment function or customer service has been created. No real owner record is used by the tests.
- **Observed tests:** initial CI run `42034251124` failed 4/4 integration tests because the ESM owner module had been loaded as CommonJS. Commit `1ea511b4230556ec1a7763ec7f383ecdb9263764` corrected the test loader. Successful GitHub Actions run `42034805148` at source commit `94350690a30f415ac1b74320e39662472bc800db`: 4/4 direct DS-N1/IncomeOS tests, 21/21 cognitive-control, source-trace and reflective-guidance tests, existing IncomeOS programme integrity check successful, and browser-panel checks successful at 320, 375 and 430 pixels. Browser tests used headless Chrome emulation, not physical iPhone Safari. No sealed HOLDOUT-2 test was executed.
- **Outstanding acceptance:** authenticated, private, server-enforced owner entry to the actual reviewer is not yet implemented/verified, therefore the reviewer button is deliberately disabled. No integrated human-facing review or privately hosted route has been verified. Full regression, private backend access control, backup/restore, original SP-01 through SP-18 acceptance, original DS-A source recovery, independent validation and commercial gates remain unverified. `INTEGRATION_TESTED` applies only to the bounded source contract, not the whole application. Source deployment/publication and customer delivery remain prohibited.
- **Next corrective engineering:** verify a private owner-controlled runtime, implement a non-public synthetic reviewer launch under server-enforced access control, test financial/customer boundary and negative authorization, run full integration and regression suites, preserve provenance; then continue secure IncomeOS accounting as the first independently gated production milestone.

### INCOMEOS-V23-P0-02: authoritative programme validation and expanded regression, 2026-11-05

- **Source increment:** `owner/incomeos/ds-runtime-bridge.mjs` now invokes the existing `IncomeOSDSProgram.validate()` rather than trusting structural fields before exposing SP acceptance and gate status. This checks recorded evidence references and rule consistency; it does **not** authenticate externally supplied evidence or human identity.
- **Adversarial coverage:** `tests/incomeos-ds-runtime-bridge.mjs` now refuses forged original SP acceptance, unsupported gate approvals, and broken evidence references before starting a synthetic review or presenting product status. Unchanged core and human action engine.
- **Native regression:** `.github/workflows/incomeos-ds-p0-integration.yml` includes the full developer-authored `tests/ds-n1/ds-n1.test.mjs` suite. Sealed HOLDOUT-2 was not executed.
- **Observed verification:** GitHub Actions [run 42035847151](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42035847151) at exact source commit `42db028e9ae764cbf59b4ebf2d9d15bb4dbaed3d` succeeded: 7/7 direct integration tests; 21/21 cognitive, traceability, reflection tests; 35/35 native DS-N1 tests; existing IncomeOS programme integrity check successful; source-derived product panel successful in headless Chrome at 320, 375 and 430 pixels. Total counted Node tests: 63 passed, 0 failed. These are development tests, not independent acceptance or physical iPhone testing.
- **Hosted source verification:** Vercel project `incomeos-opportunity-desk`, project ID `prj_eIGgDvJb3LkYmk0NGjoo7bWFEi3n`, currently reports SSO protection for all deployments and `live:false`. Latest reported READY preview source on the integration branch was `a95c95d49a3b49196f794d8b3bad01f31804baac`, older than this tested increment. No exact-head hosted integration, server-enforced owner application login or customer access has been verified.
- **Classification:** bounded source-level `INTEGRATION_TESTED`; total programme `INTEGRATION_IN_PROGRESS`; private production and commercial release not authorized. Next priority is controlled private owner authentication and accounting vault acceptance, without postponing the otherwise releasable accounting editor pending independent DS-N1 validation.


### INCOMEOS-V23-P0-03: owner programme projection and source-boundary correction, 2026-11-05

- **Destination, writer and data contract:** ChatGPT developed the increment within the existing Owner Desk \`owner/incomeos/\`, using \`incomeos.ds-runtime-bridge/1.0.0-dev\` to project the sole \`incomeos.ds-program.v1\` workspace record. Source candidate remains the DS-N1 \`0.7.0-dev\` experimental engine. No second programme register, accounting ledger, inference engine, remote endpoint, customer service or additional owner dashboard was created. The draft source branch is \`chatgpt/incomeos-v23-programme-projection-20261105\`, PR #131 against the existing development integration branch. Development only, not public production.
- **Functional change:** \`owner/incomeos/ds-runtime-bridge.mjs\` projects the canonical programme's defects, evidence counts, study-run counts, available engineering tasks and next executable engineering task into the existing product panel. \`owner/incomeos/ds-product-panel.mjs\` responds to existing workspace-loaded/changed/restored events and remains read-only. Live GitHub CI is **NOT_CONNECTED** instead of invented; the synthetic reviewer button remains disabled pending verified server-enforced private owner access.
- **Public-source boundary:** \`tests/incomeos-source-boundary.mjs\` now allows only the two specifically reviewed Owner Desk ESM module filenames. Unknown \`.mjs\` files, private attachments and secret-shaped filenames remain rejected. This corrected an observed failure of the wider private-prototype CI suite, without disabling security checks.
- **Baseline and evidence:** source projection commit \`9adfb980e2c075be23bbabfd00ca887cf8681fc7\` passed its P0 integration tests in [run 42037203145](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42037203145), but the unrelated broader source-boundary fixture rejected reviewed \`.mjs\` source. Commit \`dcfd5ad77e3a54fe2465322ee8985473828f54df\` fixed that incompatibility; [private-prototype run 42038228133](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42038228133) and [P0 run 42038222821](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42038222821) passed. Each is developer test evidence only.

### INCOMEOS-V23-P0-04: recorded product finance integrity, 2026-11-05

- **Source and destination:** \`owner/incomeos/ds-program.js\`, \`owner/incomeos/ds-program-ui.js\` and \`tests/incomeos-ds-program.mjs\` in existing PR #131. This reuses the same owner-workspace ledger, programme revenue classification and report, without introducing a financial subledger. No owner financial entries or customer records were read or modified by the engineering process.
- **Received revenue correction:** Development source commit \`1528316b6802ca8f977b0f58674f29d5b609d781\` restricts received licensing revenue to an owner-recorded \`paid\` income-scope entry, \`both\` evidence match, affirmative reconciliation and a recorded executed-agreement stage. Expected, invoiced, pending, disputed, refunded, cancelled, capital-scope or missing-scope entries remain outside received revenue. Record-level source fields are not independently authenticated. Synthetic negative tests do not authorize a contract or release.
- **Refund correction:** Development source commit \`120797b42d587168c6896697e8412e8de6351dff\` removes automatic subtraction of refunds from product cost. An unallocated refund credit is shown separately in the existing programme finance view, and \`REFUND_UNALLOCATED_NOT_NETTED\` is recorded for further review. Identical merchant, reference and amount do not prove original-charge linkage. The existing accounting editor also leaves refund credits unallocated. The programme currently has **no accepted refund-to-original-charge workflow**; even a correctly attributable credit must remain unnetted until that control and evidence acceptance are implemented and tested. Avoid double counting if the original expense has already been reclassified or reversed.
- **Exact-commit acceptance:** on \`120797b42d587168c6896697e8412e8de6351dff\`, GitHub Actions P0 [42041209185](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42041209185), private prototype [42041217063](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42041217063), anonymous-access probe [42041217120](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42041217120) and mobile browser audit [42041217087](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42041217087) all **passed**. These are controlled source and headless browser checks. Physical iPhone Safari, independent source authenticity, true bank reconciliation, and owner authenticated cloud backup/recovery were not verified. Sealed HOLDOUT-2 was not opened.
- **Scope and release status:** Bounded source \`INTEGRATION TESTED\`; entire owner-product integration remains \`INTEGRATION_IN_PROGRESS\`; DS-A \`AUTHENTIC_SOURCE_NOT_RECOVERED\`; original SP acceptance 0/18; production/customer/commercial gates remain closed. Vercel preview readiness and SSO are not sole-owner application authentication. No public JRS production change, customer access, financial transaction, commercial offer or authorized release occurred.
- **Next independently executable engineering:** review and consolidate PR #131 into the existing development integration source only after exact-head tests and single-writer verification; continue the private accounting owner-authentication and encrypted-vault round-trip acceptance (A01, A14), with explicit owner production approval (A16). Build an original-charge linkage and duplicate-refund acceptance process only after verified requirements, source references and appropriate accounting tests. Preserve source identity and legal rights controls.


### INCOMEOS-V23-P0-05: product capital/transfer classification (2026-11-05)

- **Authoritative destination and source:** Existing `owner/incomeos/ds-program.js` finance projection, `ds-program-ui.js` and `tests/incomeos-ds-program.mjs`; shared workspace ledger remains the sole source. PR #132 was fast-forwarded into `chatgpt/incomeos-v23-product-integration-20261105` at `0caa2855fb89048e0f564b4002ca7761ae6d3547`; no duplicate ledger or product application.
- **Contract and behavior:** Product-tagged outflows classified `capital` or `transfer` are excluded from operating costs and are shown separately as `capitalMovedNotCostUsd` and `transfersNotCostUsd`. Unauthorized reinvestment warnings are preserved. Unattributed refunds remain unnetted, and received revenue remains subject to existing recorded payment and executed-agreement constraints.
- **Executed verification:** [P0 integration run 42045617432](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42045617432) passed at exact integrated commit `0caa2855fb89048e0f564b4002ca7761ae6d3547`, including the original DS-N1 and programme synthetic regressions and mobile product-view browser checks. [Private-prototype run 42044765438](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42044765438), [anonymous probe 42044765637](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42044765637), and [mobile audit 42044765896](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42044765896) also passed against that source. No physical Safari, actual owner bank reconciliation, customer access or production acceptance was demonstrated.

### INCOMEOS-V23-P0-06: synthetic review session boundary (2026-11-05)

- **Source and single writer:** PR #133 on `chatgpt/incomeos-v23-synthetic-session-boundary-20261105`, based on integrated `0caa2855fb89048e0f564b4002ca7761ae6d3547`. Source edits: `owner/incomeos/ds-runtime-bridge.mjs` at `586ee227d68e01441b0ac56a0be28041b1d66259`; `tests/incomeos-ds-runtime-bridge.mjs` at `60171a81e6faf9f2eac1e9af06c0fb91b3414c47`; existing P0 workflow updated to test pull requests against the authoritative integration branch. No other application or programme store created.
- **Data contract:** `incomeos.ds-runtime-bridge/1.0.1-dev`, using the unchanged authoritative `incomeos.ds-program.v1` record and existing DS-N1 engine. `startSyntheticReview` copies validated constructed-fictional input and registers the issued session in a runtime-only WeakSet. Snapshot, reviewer action and report now refuse unissued, reclassified, invalid or event-chain-corrupted sessions. Human actions register the returned successor session. The chain demonstrates internal consistency, not authenticated reviewer identity or evidentiary authenticity. Importing or reopening persisted sessions through this bridge remains unsupported until a separately verified owner-authenticated session contract exists.
- **Exact-source verification:** On PR head `8304ddd0a288aa3f66d5b1d688650ff4e9563d2e`, [P0 integration run 42047495126](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42047495126) passed 10 bridge, 21 cognitive/source-trace and 35 DS-N1 native synthetic tests with 0 reported failures or skips. The programme-integrity script and 320/375/430px Chromium product-view checks passed. [Private-prototype run 42047495068](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42047495068), [anonymous-access probe 42047495050](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42047495050), and [mobile browser audit 42047494916](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42047494916) passed. All tests use synthetic records; sealed HOLDOUT-2 was not opened.
- **Security and release:** `INTEGRATION_IN_PROGRESS`; source changes are developer-tested only, not a private authentication service or customer delivery interface. DS-A `AUTHENTIC_SOURCE_NOT_RECOVERED`; original SP acceptance 0/18; customer, production and commercial gates remain closed. No owner records, live customer input, external contact, payment or public JRS production update.
- **Next executable correction:** Review PR #133 exact-head results and integrate into the existing development branch if preserved. Continue accounting acceptance A01 (verified sole-owner access), A14 (authenticated encrypted vault save/restore), and A16 (separate owner release approval), with fail-closed negative tests. Do not enable a customer reviewer route or relax the constructed-fictional boundary to bypass security controls.

## IncomeOS V2.3 executable integration and accounting checkpoint, 2026-11-05

This section records actual source and executed checks within the existing programme. It does not replace the `dsProgram` workspace record, independent software acceptance evidence, or a production release decision.

### P0 Decision Spellchecker integration, development branch

- **Destination:** `owner/incomeos/`, existing Decision Spellchecker programme and product panel. Contract `incomeos.ds-runtime-bridge/1.0.1-dev`; authoritative programme `incomeos.ds-program.v1`.
- **Source:** `chatgpt/incomeos-v23-product-integration-20261105` advanced by a non-force, exact-base-SHA fast-forward from `a9a92a3cbc08995e768c667027edd6bb2f4a36b2` to `25f0650703014dc5eefb7bb7dde252ada84c9e20`, preserving both PR #134 (programme-scoped synthetic sessions) and PR #135 (read-only SP-01 through SP-18 original acceptance disclosure), assembled in draft PR #136. The public `main` branch was not changed.
- **Source files:** `ds-runtime-bridge.mjs`, `ds-product-panel.mjs`, `incomeos.css`; matching tests `incomeos-ds-runtime-bridge.mjs` and `incomeos-ds-panel-browser.mjs`.
- **Acceptance demonstrated:** imported DS-N1 engine and cognitive controls; programme record validator; constructed-fictional review and human actions through the development bridge; negative scope tests; mobile product-view disclosure and blocked unauthenticated reviewer. Neither financial records nor customer routes are exposed by the bridge.
- **Executed exact-head evidence:** P0 GitHub Actions run `42057003775` PASS; private-prototype source QA `42057003691` PASS; anonymous access probe `42057003689` PASS; general mobile staging audit `42057004002` PASS. Chromium is emulated at 320/375/430px; no physical iPhone Safari or independent product acceptance.
- **Release hold:** overall `INTEGRATION_IN_PROGRESS`, despite this development scope being `INTEGRATION TESTED`. DS-A `AUTHENTIC_SOURCE_NOT_RECOVERED`; original SP-01..18 acceptance 0/18. GitHub test results are not a live CI data feed into the product view; the view explicitly reports `NOT_CONNECTED`. No private production deployment or commercial release.

### Accounting save-integrity correction

- **Destination and ownership:** existing owner workspace persistence and cloud-vault workflow; draft PR #137, branch `chatgpt/incomeos-v23-vault-save-race-20261105` based on `25f0650703014dc5eefb7bb7dde252ada84c9e20`. ChatGPT wrote nonoverlapping `briefing-ui.js`, `vault-cloud.js` and `tests/incomeos-vault-cloud-browser.mjs`; Claude Code's separate owner source and original history remain intact.
- **Defect:** a successful encrypted upload or local file download could clear the dirty flag after the in-memory workspace changed during the asynchronous save, thereby concealing unsaved financial records.
- **Correction:** snapshot immutable workspace content before encryption; correlate each cloud completion with its initiating snapshot ID; clear the dirty state only for unchanged content; warn when a later workspace version was not included; prevent overlapping uploads; apply equivalent snapshot-preservation rules to local downloads. The existing ledger, owner workspace schema, engine, vault database policies and public website are unchanged.
- **Executed verification at commit `a13c9e2477166580309a85528a7f646e561f5b2a`:** source QA run `42059147245` PASS, anonymous access probe `42059147272` PASS, DS-N1 P0 integration run `42059147282` PASS, general mobile browser run `42059147150` PASS. The browser test holds a fake vault upload, changes the workspace, releases the older upload and confirms the newer workspace is not reported saved. Synthetic test data only; no live Supabase owner save or authentication round trip.
- **Status:** `SOURCE TESTED` and browser regression tested on a draft branch, **not** merged into authoritative development branch at this checkpoint. No production release or owner-data entry authorized.
- **Open gates:** accounting A01 owner-only access approval, A14 authenticated encrypted-vault owner save/recovery, A16 owner production approval. Vercel SSO anonymous denial does not independently verify exclusive owner access. The current hosted app has not been tested with this branch.
- **Rollback:** retain the parent integration commit `25f0650703014dc5eefb7bb7dde252ada84c9e20`; PR #137 is not deployed or merged into public production.
- **Next executable engineering:** review and reconcile PR #137 with the authoritative development branch under the single-writer rule; pursue the authenticated accounting vault round trip only after the owner account is created and allow-listed. Continue unrelated safe source and negative-security tests without entering private financial data.

### Release classifications unchanged

Private IncomeOS `OWNER ACCEPTANCE PENDING / BLOCKED`; Decision Spellchecker `DEVELOPER VERIFIED` for the stated synthetic development scope, `INDEPENDENTLY VERIFIED` not established; customer delivery `NOT AUTHORIZED`; commercial release `NOT AUTHORIZED`. No source or CI evidence in this checkpoint establishes IncomeOS-generated receipts, product sales, financing transactions, or reinvestment.

### INCOMEOS-V23-P0-07: reviewed accounting and source-security consolidation (2026-11-05)

- **Destination and authority:** The existing IncomeOS Owner Desk at `owner/incomeos/`, with one owner workspace/ledger (`incomeos.workspace.v1`) and one Decision Spellchecker programme record (`incomeos.ds-program.v1`). No new dashboard, programme register, transaction ledger, customer route, or inference engine. Engineer: ChatGPT, coordinated source-controlled development. Development-only.
- **Source baseline:** `25f0650703014dc5eefb7bb7dde252ada84c9e20` on `chatgpt/incomeos-v23-product-integration-20261105`. Reviewed changes from PR #137 (accounting vault save-integrity), PR #138 (DS-N1 fixture route isolation), and PR #139 (fail-closed anonymous access probe) were combined without overlapping source-file changes. The combined code and tests were fast-forwarded without force to the authoritative development branch at **exact code commit `50eb604b6c4f92c029c294ff7275c507cd4d040a`** after verification. Reviewable combined draft: PR #140. The public `main` branch is unchanged.
- **Affected files:** `owner/incomeos/briefing-ui.js`, `owner/incomeos/vault-cloud.js`, `owner/incomeos/IMPLEMENTATION-REGISTER.md`, `lib/ds-n1/serve.mjs`, `.github/workflows/incomeos-anonymous-access-probe.yml`, `.github/workflows/incomeos-ds-p0-integration.yml`, `tests/incomeos-vault-cloud-browser.mjs`, and `tests/incomeos-ds-local-server-boundary.mjs`.
- **Contracts and behavior:** Existing owner workspace, `incomeos.ds-program.v1`, and `incomeos.ds-runtime-bridge/1.0.1-dev` are preserved. Encrypted vault saves now retain the dirty/unsaved warning when an older snapshot completes after edits; overlapping uploads are refused in the existing UI. Local DS-N1 demonstration server permits its explicit D01–D19, P01–P05 and manifest list but denies alternate fixture routes and malformed requests. Anonymous hosted access probes require an observed Vercel SSO redirect rather than treating any non-200 response as proof of protection.
- **Executed verification at the exact combined code commit `50eb604b6c4f92c029c294ff7275c507cd4d040a`:** GitHub Actions source integration run [42064490446](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42064490446) PASS (11 direct integration + 3 HTTP security + 21 cognitive/source/reflective + 35 DS-N1 native synthetic Node tests = **70 pass, 0 fail, 0 skipped**; existing programme script and 320/375/430px Chromium product-view checks pass); private prototype [42064490676](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42064490676) PASS; anonymous access probe [42064490268](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42064490268) PASS; mobile staging browser audit [42064490478](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42064490478) PASS. Developer-authored synthetic evidence only, no physical iPhone Safari, no sealed HOLDOUT-2 evaluation. Vercel independently lists a READY, SSO-protected preview with this code SHA, but `live:false` and Vercel team SSO are not exclusive owner application authorization.
- **Security impact and acceptance limits:** Two fail-closed security paths corrected and a financial unsaved-change integrity risk corrected. The original DS-A source is `AUTHENTIC_SOURCE_NOT_RECOVERED`; original SP-01..18 acceptance remains 0/18; SP-07/13/14 remain experimental. No real owner financial records were accessed, no customer records, no external outreach, no payments, no reinvestment, no production or customer release.
- **Migration and rollback:** Development source fast-forward only. No data schema migration, private owner identity enrollment, public deployment, commercial activation or customer account creation. Prior authoritative development code commit `25f0650703014dc5eefb7bb7dde252ada84c9e20` remains a reproducible rollback reference. Separate owner authorization is required for any production release.
- **Overall status:** Bounded source-level `INTEGRATION TESTED`; total IncomeOS/Decision Spellchecker programme `INTEGRATION_IN_PROGRESS`. Accounting A01 owner-only application authentication and A14 actual owner encrypted-vault round-trip remain outstanding; A16 publication approval is not authorized. The functional reviewer button remains intentionally disabled pending server-enforced private owner authorization.
- **Next executable task:** Independently verify owner-specific application/backend authorization and authenticated encrypted save/restore using approved owner access. Until then continue reversible source tests and fail-closed controls, without treating Vercel SSO or synthetic test success as production verification.


### INCOMEOS-V23-P0-08: existing Products view linked to authoritative Decision Spellchecker finance, 2026-11-05

- **Source, writer and destination:** ChatGPT reviewable development in `phillipwikes-bit/jrsstandard.com`, PR #142, branch `chatgpt/incomeos-v23-ds-owner-finance-view-20261105`, from integration head `3b9383c3b75243de0f245c70eb6a1c06d3d99987`. Exact **tested code commit**: `fc31ac83d1fecd47b950e860279646dddac2b1eb`. Existing `owner/incomeos/` Products → Decision Spellchecker view and programme module only; no new dashboard, ledger, account, reviewer engine or API.
- **Five code/test files:** `owner/incomeos/ds-product-panel.mjs`, `owner/incomeos/ds-program.js`, `owner/incomeos/ds-program-ui.js`, `tests/incomeos-ds-panel-browser.mjs`, `tests/incomeos-ds-program.mjs`. The three programme/classification file changes subsume previously separate, exact-tested draft PR #141 for paid-versus-unsettled costs, without overwriting the authoritative `incomeos.ds-program.v1` record or owner ledger.
- **Functional financial integration:** The existing read-only product view calls `IncomeOSDSProgram.finance()` with the **same validated workspace and programme object**, projecting tagged ledger row count, recorded operating expenditure, owner-reconciled revenue, not-yet-verified revenue, unallocated credits, excluded capital/transfers, excluded unpaid/reversed charges, tax/unclassified outflows, and accounting exception count. Unverified income and projections never become received revenue. The experimental DS-N1 runtime bridge receives no financial ledger or account details. No vendor, payer or payment reference appears in the product overview.
- **Financial corrections:** Scheduled, disputed and refunded outflows no longer count as operating costs; tax payments and unclassified outflows remain separately disclosed. Invalid record identity, kind, date or product dimension on a product-tagged row is reported by the authoritative programme engine. An invalid source row or amount prevents the aggregate Products summary rather than providing a misleading partial amount. The programme still flags the underlying issue for owner review. Legacy missing expense payment state retains the existing accountant editor's owner-recorded paid default; this is not independent bank confirmation.
- **Failure evidence and repair:** Combined intermediate commit `24519eac81513f8384a798390f4bbd99dd090cd7` **failed** the product browser test in P0 run `42068828748`: malformed tax outflow with no date was rendered as 9,999.99 USD nonoperating value instead of refusing an unverified summary. This was a real integrity defect, not a test-only inconvenience. Commit `fc31ac83d1fecd47b950e860279646dddac2b1eb` corrected the programme classification and Products fail-closed contract and added negative regression coverage.
- **Executed exact-code verification:** [P0 integration run 42069973787](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42069973787) **PASS**, including 11 runtime bridge, 3 local server authorization, 21 cognitive/source/reflective and 35 DS-N1 native synthetic Node tests (**70 passed; 0 failed; 0 skipped**), the existing expanded programme accounting QA script, and same-origin Chromium Product-view tests at 320, 375 and 430 pixels. [Private-prototype run 42069972949](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42069972949) **PASS**; [anonymous-access probe 42069972975](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42069972975) **PASS** for tested redirects only. General owner mobile audit [42069972904](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/42069972904) was still in progress at this record's creation and must not be counted as passed until its conclusion is verified. Browser checks are emulated Chromium, not physical iPhone Safari.
- **Deployment, provenance and authority:** Source-level `INTEGRATION TESTED` for this bounded slice; platform remains `INTEGRATION_IN_PROGRESS`. Exact corrected-head hosted deployment, exclusive owner authorization, authenticated encrypted-vault round trip and financial-bank confirmation are **not verified**. DS-N1 is experimental, DS-A is `AUTHENTIC_SOURCE_NOT_RECOVERED`, original SP-01..18 acceptance remains 0/18, SP-07/13/14 remain development constructs, independent validation not established. Production, customer delivery, commercial offers/payments and restricted-source disclosure are not authorized. Sealed HOLDOUT-2 and real owner/customer records were not used.
- **Rollback and next engineering:** No data schema migration, production route or user financial state was changed. Prior integration code `3b9383c3b75243de0f245c70eb6a1c06d3d99987` is the rollback reference. Advance verified server-enforced owner-specific access and secure accounting-vault acceptance (A01/A14), then expose synthetic-only reviewer interaction behind that boundary. Required owner release approval (A16) remains independent.

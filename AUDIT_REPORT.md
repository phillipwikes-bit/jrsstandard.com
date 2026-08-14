# JRS END-TO-END AUDIT REPORT

**Scope:** live site, source repository, commercial assets.
**Date:** 2026-08-14.
**Method:** every finding below was produced by running a command against the repository or the live site. **No figure is carried from memory.** Where a check was inconclusive it says so.

**Baseline confirmed live from `/api/panel-stats` at audit time:** 36 completers, 16 countries, 5 continents, 58 reviewers, detection panel 16 experts across 11 countries. `geo_source: computed`, `geo_resolved: 36`, `geo_unresolved: []`.

---

## 1. Structural & Duplicate Findings

### 1.1 Duplicate and overlapping content

| Check | Result |
|---|---|
| HTML files inventoried | **69** |
| Duplicate `<title>` values | **0** |
| Duplicate or overlapping landing pages | **none found** |

**No duplicate pages exist.** The site has one page per purpose.

### 1.2 Orphaned content

**16 pages under `reference/` carry exactly one inbound internal link**, from `index.html` only.

- **Paths:** `reference/ai-assisted-record-failure-modes/`, `ai-verification-controls/`, `decision-context-loss/`, `deployment-models/`, `documentation-risk-tiers/`, `escalation-triggers/`, `field-conditions/`, `implementation-maturity-levels/`, `later-review-failure-cascades/`, `missing-chronology/`, `record-survivability/`, `reviewer-responsibility-boundaries/`, `reviewer-worksheet/`, `second-line-review-model/`, `traveler-test/`, `unsupported-generalization/`
- **Effect:** they are crawlable via `sitemap.xml` but carry almost no internal link equity, so they will not rank for the terms they were written to own.
- **Remediation:** build a `/reference/` hub page linking all 16, and link that hub from the footer alongside Record Check and Engagement Terms. **Not done in this pass**: this is an information-architecture decision, not a defect.

### 1.3 Indexing

| Check | Result |
|---|---|
| Pages carrying `noindex` | **21** |
| Of those, conversion pages | **0** |

All 21 are study surfaces, private opaque slugs, or admin consoles. **`org-pilot.html` was `noindex` and is a conversion page with an intake flow; corrected to `index,follow` in this pass.**

### 1.4 Sitemap and canonical host

**Two defects found, both corrected.**

**a. 22 public pages were absent from `sitemap.xml`**, including every commercial page: `check.html`, `engagement.html`, `terms.html`, `audit-request.html`, `governance-request.html`, `calibration-request.html`. Removing `noindex` from the intake pages had given crawlers permission but no path.
- **Fix applied:** 46 URLs added. `sitemap.xml` now carries **72 entries**, XML validated with `xml.dom.minidom`.

**b. Every canonical pointed at a redirect.** Each `<link rel="canonical">` and `og:url` declared `https://jrsstandard.com`, while the server **307-redirects apex to `www.jrsstandard.com`**. Every page was telling a crawler that its canonical version lives at a URL that immediately redirects away. The sitemap compounded it by mixing hosts: **26 apex entries against 46 www**.
- **Fix applied:** canonical and `og:url` normalised to `www` on **51 pages**; sitemap normalised to a single host. **Verified: 0 apex canonicals and 0 apex sitemap entries remain.**

### 1.5 Naming, footer entity, contact, metadata

| Check | Result |
|---|---|
| Practice identity in footer | **53 pages** carry `JRS™ · Justification Review Standard · Phillip Wikes, principal` |
| Contact mechanism | `info@jrsstandard.com`, consistent |
| Registered address and governing jurisdiction | **ABSENT.** Flagged openly on `terms.html` rather than guessed |

**Remaining gap:** `terms.html` clause 1 carries a visible placeholder for registered trading address and governing jurisdiction. This is deliberate. **Publishing a governing law that had not been decided would be worse than leaving it open**, and neither is needed until a scope is countersigned.

---

## 2. Technical & Security Defect Report

### 2.1 Endpoint error handling, verified live

| Endpoint | Condition | Result |
|---|---|---|
| `/api/checkout?o=bogus` | unknown offer | **404** |
| `/api/checkout?o=audit` | no payment link configured | **200** scoping page: price, invoice path, purchase orders, **no `Location` header, no guessed destination** |
| `/api/checkout` | POST | **405** |
| `/api/bench-score` | no licence provisioned | **503 `licensing_not_provisioned`** |
| `/api/bench-score` | licensed, no key | **503 `key_not_provisioned`**, refuses rather than scoring against substitute data |
| `/api/panel-stats` | normal | **200** |

**The checkout fail-safe returns 200, not 503, and that is deliberate.** Scoping and invoicing is the intended path at this price, not a failure state. It previously returned 503 under the heading "Payment link not live yet", which told a buyer at the moment of purchase that the product was unfinished.

### 2.2 Key and confidential-input isolation

| Check | Result |
|---|---|
| Answer key in any API response | **none.** `bench-score` returns aggregate calibration only, by construction rather than by filtering |
| Per-record results in any response | **none** |
| Five-condition scoring logic exposed | **none** |
| Key present in HTML, client JS, JSON, or downloads | **none.** Held in `research/`, verified absent from the deployed branch |
| Routes storing submitted record text | **zero.** Every remaining mention of `input_preview` is a comment recording its removal |
| `ANTHROPIC_API_KEY` in any committed file | **absent** |

**Two exposures found earlier this month remain closed:** customer record text written by both review engines and rendered on a public page, and the benchmark exports that made a majority-vote pseudo-key derivable for 10 of 15 reliability records.

### 2.3 Test suites and regressions

| Suite | Result |
|---|---|
| `scripts/check_zero_drift.py` | **12 checks, 0 failed** |
| `scripts/test_checkout.mjs` | **15 of 15** |
| `scripts/test_bench_score.mjs` | **15 of 15** |
| `scripts/test_evaluator_outreach.py` | **18 of 18** |
| `scripts/test_anon_election.mjs` | **7 of 7** |
| `scripts/test_scout_opportunities.py` | **17 of 17** |

**72 assertions across six suites. Zero regressions.** Pre-commit hook installed and running in 0.19s.

### 2.4 Known pre-existing defect, not introduced and not fixed

**`jrsstandard.html`** throws `Cannot read properties of null (reading 'style')` on load, from a training script referencing `progress-fill`, `quiz-section`, `module-nav` and `course-panel`, none of which exist on that page. It also carries a 2-div imbalance. **Both pre-date the current work** and were confirmed by comparing against the pre-edit file. Fixing it means repairing an unrelated training UI and was out of scope for this pass.

---

## 3. Commercial & Pricing Architecture Gaps

### 3.1 Price synchronisation

**Single source of truth is `api/_offer-config.js`.** Verified: only `$250`, `$500` and `$750` appear across commercial surfaces, and every one is read from that file at render or generation time.

| Surface | Mechanism |
|---|---|
| `audit-request.html`, `governance-request.html`, `calibration-request.html` | generated from the config |
| `engagement.html` fee table | generated from the config |
| 36 evaluator outreach messages | parsed from the config at generation time |
| `/api/checkout` | imports the config |

**One false positive checked and dismissed:** `ai-records-arm-b.html` and `ai-records-pilot.html` contain `$3,000`, `$3,420`, `$48,200` and `$50,000`. These are figures inside constructed study records, not offers.

**The drift guard enforces this**: an injected `AUDIT_PRICE_TOTAL = 250` and a price changed in the config only were each caught across all 36 outreach files.

### 3.2 Buyer journey

`check.html` (free, ungated) → `engagement.html` (terms, fees, data handling) → intake page (price, guarantee) → `/api/checkout` (scoping and invoice) → `terms.html`.

**No dead ends. One defect found and corrected:** `check.html`'s primary CTA was a raw `mailto:` that **skipped the intake page carrying the price, the Data Isolation Guarantee and the checkout route.** It now routes to `audit-request.html`.

**A second bridge exists:** a twenty-minute record read, no charge, offered on both `check.html` and `engagement.html`.

### 3.3 Trust, legal and procurement readiness

| Element | State |
|---|---|
| Terms of engagement | **`terms.html`, 10 clauses**, linked from 37 footers |
| Liability | **Capped at the fee paid** |
| Deliverable ownership | **Client owns outright, no licence back** |
| Data Isolation Guarantee | On all three intake pages **and** `terms.html`, byte-identical |
| Guarantee mechanism | **No form and no file input exists on any intake page.** The guarantee is a property of the pages, not a promise about them |
| Invoicing | Purchase orders accepted, net 30, stated on `engagement.html` and `terms.html` |
| Privacy policy | `privacy.html` present |
| Registered address, governing jurisdiction | **ABSENT.** See 1.5 |

---

## 4. Prioritized Remediation Plan

### P0: corrected during this audit

| # | Defect | Fix |
|---|---|---|
| 1 | 22 public pages absent from `sitemap.xml`, including every commercial page | 46 URLs added, XML validated, 72 live |
| 2 | Every canonical pointed at a redirecting host; sitemap mixed two hosts | Normalised to `www` on 51 pages and across the sitemap |
| 3 | `org-pilot.html` `noindex` despite being a conversion page | `index,follow` |
| 4 | `check.html` primary CTA bypassed the intake page | Routes to `audit-request.html` |

All four verified live after deploy.

### P1: blocks revenue. Owner action, not code

**Three checkout URLs** in `api/_offer-config.js`, one per offer. They can only be created inside the owner's Stripe or Lemon Squeezy account; a plausible-looking URL written here would be a fabricated payment destination. **Everything else in the payment path is built and tested.** Paste three URLs and deploy.

### P2: blocks the first sale closing

**Registered trading address and governing jurisdiction** for `terms.html` clause 1. It is the only field flagged incomplete on a live page.

### P3: has a deadline that has passed

**36 evaluator outreach messages generated and unsent**, in `research/Evaluator_Outreach/`. The confirmation deadline on every one of them is 14 August 2026.

### P4: Offer 3 cannot run without it

**`BENCH_KEY_JSON` and `BENCH_SCORE_TOKENS`** in the server environment. Until then `/api/bench-score` correctly refuses rather than scoring a paying licensee against substitute data.

### P5: optional, information architecture

**Link the 16 `reference/` pages from a hub.** They are crawlable but carry almost no internal link equity.

### P6: pre-existing, unrelated

**Repair the `jrsstandard.html` null-reference error** and its 2-div imbalance. Neither affects the commercial path.

---

## What this audit did not test

- **No load, performance or accessibility audit** was run. Renders were checked at 390px and 1280px for overflow and console errors only.
- **No penetration testing.** Key isolation was verified by inspecting code paths and live responses, not by attacking the endpoints.
- **RLS policy configuration was not audited** beyond confirming which tables return rows through the public anon key.
- **The `jrsstandard.html` defect was confirmed but not diagnosed to root cause.**

*Produced 2026-08-14. Every command underlying these findings is reproducible from the repository.*

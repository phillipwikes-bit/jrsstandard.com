# JRS / Decision Spellchecker: Commercial Evidence Index and Traffic-Quality Control

**Prepared:** 2026-10-30 (America/New_York)  
**Status:** Draft, internal owner-only diligence aid. Not a prospectus, valuation, release authorization, offer, rights determination, or verification of future deployment.  
**Development relationship:** This change is based on draft PR #48. Neither that PR nor this dependent change is merged or in production.

## 1. Decision and product boundary

JRS is the publicly described documentation-review methodology and resource library. **Decision Spellchecker** is the separate proposed software product. Do not conflate public framework usage with software deployment or license demand. The current Engine remains **NO_GO_NOT_VERIFIED**. The existence of an evaluation route is not evidence of production readiness.

The near-term decision is whether to pursue (a) a disclosed experimental asset transaction, (b) a narrowly scoped evaluation license after grant-specific approvals, or (c) pause further commercial development. Avoid increasing software scope until a buyer use case and credible willingness to evaluate it have been established.

## 2. Evidence hierarchy for any buyer-facing claim

| Category | What the present source can show | What it cannot show | Controlling follow-up |
|---|---|---|---|
| Public resource downloads | Tracked download endpoint requests, grouped by asset | Verified human downloads, distinct readers, practitioners, use, intent to buy | Crawler-screened per-asset counts; consented applied-use evidence |
| Training | Eight enrollments, seven recorded or credited completions, five distinct nonblank organization labels at the 2026-10-30 live read | Seven verified independent six-module completions or five organizational customers | Separate training-complete events from panel-reviewer backfill, then verify actual completion basis |
| Reviewer evaluation | One submission, zero nine-question complete submissions at the same read | Market demand or field performance | New independent reviewer exercise; distinguish unoffered from rejected |
| Organizational pilots | Instrumented cohort marked inactive, no invitations issued, zero organization pilot sessions | Rejection by organizations | Permissioned evaluation under documented acceptance criteria |
| Checkout events | Zero qualifying events in /api/asset-stats checkout_intent at the same read | Universal zero willingness to pay or no outreach elsewhere | Reconcile legacy payment screen attempts, actual transactions, and correspondence by date/source |
| Research | Evidence-locked studies and documented limitations | Independent Engine accuracy or general-world applicability | Source-to-claim matrix; independent holdout evaluation |
| Software | Source, tests, constrained architecture and draft site separation | Production deployment, stable reliability or legal outcomes | Named version, test evidence, security/rights gates, independent release QA |
| Intellectual-property rights | Asset register, creator attribution, structured contributor consents and identified limitations | Clean unrestricted exclusive title, assignment or transferability of every record | Grant-specific counsel review and verified transaction documents |

## 3. Traffic-quality contract for /api/geo-stats

Historical top-level geographic/download counts stay **raw** to preserve comparability. A new `quality` object reports a *separately scoped, reconciled view* over the same source rows.

The measurement unit is a **tracked download redirect request**. It is not a completed PDF read, unique browser, unique person, confirmed practitioner or customer.

The quality classifier has three exhaustive states:
- **declared_crawler:** the recorded user agent matched the project's declared-crawler regex;
- **user_agent_missing:** no usable user agent was recorded, including historical rows before capture;
- **not_identified_as_crawler:** a user agent exists but did not match the declared-crawler regex. This is not proof of human use.

Counts are broken out for each current resource name, including the JRS Reviewer Reference; test-tagged events and the retired training kit are excluded from the new denominator, consistently with the existing geo resource scope. The response explicitly reports those excluded populations. The new `quality.reconciles_to_legacy_raw_scope` must hold before the dashboard displays buyer-oriented values.

Because the public aggregate asset endpoint uses a broader event-type/scope rule and legacy device-capture dates differ, its totals **must not automatically be forced equal** to the geographic request counters. Any gap should be explained by source scope and timestamp before being treated as a discrepancy. Historical missing user agents cannot be recovered from the current aggregate data.

The aggregate asset endpoint and geographic endpoint now share one declared-crawler regex. This fixes a classification inconsistency, **not** every kind of automation or fraudulent traffic. Browser-like bots, proxies, shared devices, in-app previews and repeated requests remain unverified.

### Quality gate

Do not publish a number as 'human downloads', 'practitioner reach', 'readers' or 'customers' merely because a bot user agent was not identified. If a paginated data fetch is incomplete, fail the geo endpoint with an explicit error; do not display a partial population as a zero or as a complete count.

## 4. Owner dashboard information architecture

The owner-only programme-status page should follow these information priorities:

1. **Licensing/acquisition evidence snapshot:** explicitly scoped observed facts, dated status and unsupported claims.
2. **Contacts and commercial response queue:** actionable enquiries, organized by inquiry type, with consent and source. Keep training/research/general questions separate from actual licensing or purchase interest.
3. **Research and practitioner participation:** sample design, status, results and limitations. Do not characterize creator/internal fixtures as independent validation.
4. **Training and application:** enrollment, earned/credited completion distinction, evaluated use and organizational context.
5. **Resource analytics:** raw redirects and classified traffic by individual asset; raw geography retained only as ancillary context.
6. **Technical and legal readiness:** exact Engine branch/version, live vs offline verification, security, data route and grant-specific rights.
7. **Historical archive:** dated sale dossiers and superseded descriptions retained for provenance, never exported as current due diligence.

The current page adds an owner-only evidence snapshot and per-asset request-quality table. It preserves the August 13 sale dossier but marks it historical. Further restructuring should preserve existing element IDs, record links and owner access controls until the full page is tested in the protected preview.

## 5. Claim register for the first authorized buyer summary

| Proposed buyer statement | Status and acceptable treatment |
|---|---|
| 'The Reference was downloaded by 824 practitioners' | **Not supportable.** 824 is raw request count (2026-10-30 capture), without aligned crawler removal or identification. |
| 'JRS has international practitioner users' | **Not established** by IP-country distribution. Named research participation is a separate population and may be reported within consent scope. |
| 'Seven individuals completed the independent training course' | **Not established.** Seven includes recorded or panel-credited completions, pending source reconciliation. |
| 'Five organizations adopted the training' | **Not established.** Five distinct nonblank organization labels in enrollment records are not enterprise deployments. |
| 'No organizations want the product' | **Not supportable.** The instrumented organizational-pilot cohort has not been offered. |
| 'The engine passed independent production validation' | **Not supportable.** Present release posture is NO_GO_NOT_VERIFIED; offline checks do not transfer to production. |
| 'All materials are freely transferable to an acquirer' | **Not supportable.** Transaction-specific rights and consent assessment remain required. |
| 'JRS has a coherent public methodology, resources, research and experimental implementation with documented limitations' | **Supportable in bounded form**, itemized in the asset register and matched to dated source/rights evidence. |

## 6. Source-of-record mapping

- Live request metrics: `/api/geo-stats`, `/api/asset-stats`; event writer `api/dl.js`; classifiers `api/_traffic-quality.js`. Inspect event definitions, excluded rows and capture start dates before publication.
- Enrollment counts and crediting rule: `/api/enroll-stats` and `api/enroll-stats.js`.
- Owner contacts and inquiry categories: owner-authenticated readers on draft PR #48; live person-level data must not be put in public aggregates or buyer previews.
- Technical identity and release: dated Engine run artifacts, source hashes, review manifest, NO_GO_NOT_VERIFIED decision, PR #48 status.
- Methodology and rights: source-aligned Master Asset Register and Evidence Ledger dated 2026-10-03, plus any later controlling repository evidence. These source-aligned files are dated baselines, not automatic proof of October 30 transaction readiness.

**Specific contradiction to preserve and investigate:** the August 13 archived Sale Dossier describes historical payment-screen attempts, while the 2026-10-30 aggregate `checkout_intent` metric is zero. These use different source definitions and possibly different periods. Do not add them, equate them to buyers or quietly overwrite one with the other.

## 7. Controlled release and commercialization gates

**Gate A, data:** per-resource request classifications reconcile; historic missing user agents remain marked unknown; no claim of verified human downloads.

**Gate B, privacy/access:** authenticated server-side access to the owner page and person-level readers; live anonymous-access verification; public aggregation and small-population disclosure review. Draft PR #48 source checks alone are insufficient.

**Gate C, capability:** exact Engine/reviewer-reference versions, disclosed error profiles, held-out testing, reproducibility and source support under the stated permitted non-HR workflow. Critical false-ready failures block the tested use.

**Gate D, rights:** intended evaluation/assignment scope, permissions, contributor limitations, publisher rights and provider dependencies matched to actual transaction terms.

**Gate E, buyer evidence:** an identifiable party with appropriate authority actually requests a controlled technical/IP review, pays for a bounded evaluation or makes a documented offer. Resource requests and research correspondence are not buyer commitments.

No gate is passed merely because its row appears in a dashboard. Do not produce or send a buyer data room containing personal records, detailed study answer keys, private credentials, or restricted material without a specific release decision.

## 8. Proposed transaction artifact sequence

A. **Initial non-confidential summary:** one or two pages describing the documentation problem, public method, available classes of assets, intended supplier-exception evaluation scope, honest technical status and contact route.

B. **Qualified-buyer review under agreed terms:** exact asset inventory, source version and build, limited fixture demonstration, known limitations, validation package, rights-position summary and draft nonexclusive evaluation terms.

C. **Conditional deeper diligence:** raw verified engineering and commercial evidence; operational/privacy records; contributor/license documents; transfer/integration specifications; any authorized de-identified real-use findings.

An NDA does not itself establish confidentiality of already-public information, a transfer right, a production claim or buyer interest.

## 9. Verification and open work

- Synthetic regression: `node tests/download-traffic-quality.mjs` (must pass on target branch and tested commit).
- Review changed endpoint schemas and full programme-status page in protected Vercel preview, including iPhone/Safari and screen-reader table behavior.
- Confirm existing dashboards still read legacy raw geo keys without an unannounced meaning change.
- Reconcile `/api/asset-stats` aggregate filter against the new per-resource scope on a **single timestamped database snapshot**, not separate live calls.
- Resolve pilot/commercial correspondence classifications before representing named organizations as prospective customers.
- Deploy only through the separately authorized PR #48 release process after owner decision, privacy/security checks, independent QA and rollback acceptance.

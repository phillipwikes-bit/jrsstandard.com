# JRS Discoverability and Retrieval Integrity Program

Status: proposed enhancement on a review branch; not a production release.
Date: 2026-11-04.
Scope: public JRS documentation and practitioner resources only. Never reopen public Review Engine, intake, API, enrollment or private dashboard routes.

## Objective
Increase the probability that a practitioner or search/retrieval system reaches the correct authoritative JRS resource, identifies the correct publication edition, and accurately reports research limits. No SEO ranking, model citation share, organic reach or downstream attribution gain is claimed without measurement.

## Priority and acceptance framework
1. **Technical retrieval.** Keep production and canonical host consistent across redirects, canonical tags, robots, sitemap, 200/301/404 routes and internal links. Assess sitemap-to-canonical concordance, unreachable URLs, orphaned public HTML, status codes, JavaScript-disabled readability, mobile layout, LCP, INP and CLS. Do not assert Core Web Vitals based on a source audit; require browser field or reproducible laboratory evidence.
2. **Authoritative entity references.** Publish a concise, version-conscious public source bibliography and a machine-readable static index. Each retrieval entry must resolve to a maintained source page. Keep methodology v1.0 distinct from Standard PDF v2.0 and do not conflate constructed-record detection with operational validation. Do not add unsupported schema properties, ratings, external authority claims or synthetic citations.
3. **Search intent and information architecture.** Preserve task-first pathways for investigations, HR, compliance, audit, legal and training. Test whether a visitor can find the applicable tool, its use limitations, evidence and edition controls without account creation or uploading a case record. Improve headings, semantic text, internal linking and on-page answers only where supported by evidence.
4. **Distribution and professional reuse.** Prefer citation-ready explanatory pages, accessible downloadable originals or separately identified accessible editions, clear shareable URLs, and professional publication references. Do not automate unsolicited outreach, controversy, memetic campaigns, inauthentic engagement, artificial social proof, credential claims or newsjacking.
5. **RAG/AI discovery.** Test retrieval with version-sensitive synthetic queries, distinguish common aliases and page types, evaluate answer citation correctness and abstention when evidence is absent. Treat `llms.txt` as an optional source guide whose recognition by any crawler is not established. Public JSON is a bibliography, not a live query endpoint, knowledge graph certification, embedding store or Graph RAG service.
6. **Analytics and governance.** Use aggregate, consent-respecting analytics and Search Console evidence if available. Record baseline and post-change changes in impressions, CTR, indexed URLs, referral quality, resource use, citation accuracy, error rates and user task success. Do not claim causation from short windows or raw pageviews. Do not introduce invasive dark-social tracking or case-content capture.

## Exclusions and conditional areas
- App Store Optimization is inapplicable absent an actual supported mobile app.
- Local Pack optimization requires an eligible public-facing local business presence; do not invent locations or reviews.
- International hreflang requires equivalent reviewed translations with reciprocal language mappings; do not auto-translate legal or methodological controls.
- Automatic third-party scraping and document ingestion require permissions, security scope, provenance and privacy review.
- Virality / K-factor / polarization are not optimization objectives for a professional review standard.
- Structured data must describe what actually exists. Never market an unavailable public API.

## Baseline defects and proposed repair
- FACT from main repository files: robots.txt advertises the non-www sitemap while sitemap <loc> uses www. Fix the robots declaration.
- FACT from main repository files: jrsstandard.html has a homepage canonical and homepage Open Graph URL. Give the methodology its own canonical and OG URL.
- FACT from main repository files: sitemap.xml omits the online methodology and lists privacy.html, which redirects to privacy-notice.html in vercel.json. Add the methodology and privacy-notice target; remove the redirect source.
- PROPOSAL: Add static `llms.txt` and `jrs-sources.json` and a Node regression test. Their effect on external LLM citation is unmeasured.

## Release and rollback
Keep PR #117's verified exact-commit evidence unchanged and retain its independent release hold. Land this work only through a separate reviewed change. The baseline remains main commit pinned at implementation. Inspect any subsequent merge-base drift before final approval. Do not merge, publish, alter Vercel protection or announce conformance without the owner's dated authorization and the applicable human acceptance evidence.

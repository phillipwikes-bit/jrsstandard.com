# JRS Search Discovery: Owner-Only Evidence and Measurement Contract

Prepared: 3 November 2026
Status: implementation specification. This is not a live analytics report.
Scope: Google organic discovery, separately sourced engagement, and verified institutional inquiries.

## Controlling decision

Determine whether professionals unfamiliar with the JRS or DRR brand are finding substantive JRS content and whether that discovery leads to documented resource use or institutional evaluation. Do not confuse search impressions, clicks, shares, downloads, research participation or sales leads.

## Baseline state

The connected Google Search Console reader currently returns no accessible JRS site property. The existing connected GA4 interface has not supplied a selected JRS property report. No current organic click, impression, CTR, Google-selected canonical, AI citation, resource conversion or inquiry attribution baseline is established. An unconnected source is **unavailable**, not zero.

## Three principal measures

1. **Observable non-branded Google search clicks.** Use Search Console, web search type, finalized 28-day windows, actual query rows. Separate searches containing "jrs", "justification review standard", "decision reconstruction risk" or clearly branded variations from queries framed as professional documentation problems. Treat ambiguous "DRR" queries separately because that abbreviation is used for disaster risk reduction. Rare/anonymized search queries are omitted by Google, so the observable query-row click sum is a **lower-bound partial view**, not all non-branded traffic. Compare equally finalized same-length periods; do not calculate growth against a missing or zero baseline.

2. **Search-relevant practitioner engagement.** Report organic clicks for the DRR definition, practitioner Resources, AI-assisted failure modes, decision-context-loss reference, terminology, constructed worked example and institutional briefing, using the exact Search Console page URLs. Report GA4 reference-selection or resource-download events separately unless verified channel-attribution data supports a join. A click or copy is not a completed assessment, independent user or downloaded document.

3. **Documented organizational inquiries.** Report distinct owner-reviewed inquiries with their source dates, provider source IDs, documented organizational purpose, contact permissions and follow-up status. The Formspree read API remains unconnected, and locally imported CSV rows are not independent provider-verified records. Do not automatically qualify these as buyers, implemented standards or commercial conversions.

## Search indexing and AI citation diagnostics

- Use URL Inspection on canonical priority pages after authorized publication. Capture indexing verdict, last crawl, Google-selected canonical, referring sitemap, page indexing status and date of inspection.
- Verify exact Reference directory canonicals, including the 17 slashless source-declared URLs, against the live server's redirects and Google's selected preferred URL.
- If Bing Webmaster Tools AI Performance becomes available, report supported AI citations or grounding queries as a separate diagnostic, never combine with Google clicks or infer unique practitioners.

## Dashboard data contract

Every displayed figure must include: source system, property identifier, UTC collection time, local reporting interval, query/filter definition, search type, source completeness/finality, observed value, provenance and explicit limitations. Keep separate panels for Google discovery, GA4 engagement, and contact evidence; do not combine data at the person level without a verified lawful and technical basis.

Redaction and suppression: buyer-facing views may show aggregate search and engagement evidence, with transaction-stage access controls for underlying inquiries. A research participant's study consent does not automatically authorize treating that individual as a marketing or acquisition lead.

## Activation order and release control

1. Select or authorize a Search Console site property and report the exact property identifier. Current site access is unavailable through the connected reporting service; do not invent credentials or Google access.
2. Complete exact-commit Vercel preview, protected-hosted source and PDF delivery, accessibility, privacy, and owner publication authorization for PR #121 (which is based on PR #117).
3. After the approved public release, inspect production canonical paths and submit the published sitemap through an authorized Search Console property. A source commit does not submit a sitemap or cause indexing.
4. Establish two finalized 28-day Search Console windows and a reproducible query and page cohort; disclose any missing or anonymized queries.
5. Inspect GA4 and confirmed contact sources independently; only introduce an integration once source coverage and permissions are verified.
6. Review trends every four weeks. Correct indexing or internal-navigation issues before generating new near-duplicate SEO pages.

This specification does not promise exponential search growth, AI answer inclusion, or institutional adoption.

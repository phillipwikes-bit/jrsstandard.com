# JRS Cross-Platform AI Discoverability Workstream

**Date:** 2026-11-03  
**Status:** Candidate changes on a branch based on website renovation PR #117. Not published.  
**Scope:** Public, human-readable JRS documentation and resource discovery only. No Review Engine deployment, production configuration change, new record intake, or disclosure of controlled assets.

## Purpose

Increase the likelihood that investigators, compliance reviewers, internal auditors, HR practitioners, legal reviewers and AI governance professionals can find accurate JRS resources through traditional search and AI-assisted answers. Optimizations must benefit actual users rather than attempt to influence model outputs with hidden instructions, keyword stuffing or unsupported authority claims.

The JRS method, research and publication versions remain separate. Discoverability is not validation, accreditation, licensing readiness or evidence of traffic/conversions.

## Platforms and discovery routes

| Reader-facing service | Discovery surface and site-side action | Verification limit |
| --- | --- | --- |
| ChatGPT / OpenAI search | `OAI-SearchBot` crawls public pages for search. Permit its public-IP requests when origin/WAF evidence supports them. `ChatGPT-User` may retrieve user-directed pages. | No guarantee of citations, responses or ranking. `GPTBot` training collection is a distinct control. |
| Claude / Anthropic | `Claude-SearchBot` supports search discovery; `Claude-User` serves user-directed retrieval. | `ClaudeBot` training crawl is separate. Do not claim control over model behavior. |
| Google Search AI Overviews / AI Mode | Googlebot indexing, canonical URLs, accessible HTML, crawlable internal links and reliable original content. | Google says there is no separate required AI markup or `llms.txt`. |
| Gemini Apps | Google Search grounding and Google's separately documented `Google-Extended` product control. | `Google-Extended` is not a stand-alone crawler user agent or Google Search ranking factor. Changing training/grounding preferences needs an explicit owner decision, not an SEO assumption. |
| Microsoft Copilot | Bingbot discovery and Bing indexing, canonical sitemap, crawlability and Bing Webmaster Tools. | Visibility depends on Bing eligibility and search relevance. |
| Perplexity | `PerplexityBot` for search, `Perplexity-User` for user-directed retrieval; confirm any proposed WAF allowance using vendor-published IP ranges. | A robots allowance does not establish that hosting/WAF permits verified requests. |
| Meta AI / Llama-powered assistants | Make public JRS material linkable and indexable; evaluate Meta's documented search agents and link-preview fetchers separately if available. | Llama is a model family, not a single web-indexing service. Do not promise coverage of every Llama deployment. |
| Grok / xAI | Rely on high-quality public pages and widely used web indexes. Verify actual referral/crawler evidence before specialized access changes. | No verified official Grok crawler rule is assumed here. |
| Mistral AI search / Vibe and other products | Mistral documents `MistralAI-Index` for search indexing and `MistralAI-User` for user-directed retrieval. Maintain accessible public HTML and confirm network access before specialized rules. | `MistralAI-Training` is separate from search; no new training authorization is inferred. |

### Official source material used

- OpenAI: https://developers.openai.com/api/docs/bots
- Anthropic: https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Google AI search guidance: https://developers.google.com/search/docs/appearance/ai-features
- Google crawling controls: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Microsoft Bing: https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- Perplexity: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- Mistral: https://docs.mistral.ai/robots

Source URLs explain vendor behavior; they do not verify JRS was crawled or cited.

## Baseline, 3 November 2026

1. The repository's `robots.txt` already has `User-agent: *` and `Allow: /`. It does not need a redundant roster of named search bots. This does not bypass Vercel authentication or other network restrictions.
2. Public pages already use titles, descriptions, canonical links, an XML sitemap and substantial HTML text. The homepage has `DefinedTermSet` JSON-LD. Creating unnecessary AI-specific metadata or `llms.txt` is not a prerequisite.
3. Sitemap canonical consistency needs targeted work. The robots sitemap location previously used the apex host, although the homepage's published canonical host is `www`. The sitemap included `privacy.html`, redirected to `privacy-notice.html`.
4. Existing public reference articles and practitioner tools are more valuable than duplicative SEO articles. One existing AI failure-modes page receives a practical, question-led review sequence and a clear link from the resource directory.
5. There is an independent *release hold* on renovation PR #117. Source changes are not production evidence, and exact-commit hosted checks plus accessibility and other release gates still apply.

## Candidate implementation on this branch

- `robots.txt`: canonicalize sitemap pointer to `https://www.jrsstandard.com/sitemap.xml`; retain general crawler permission.
- `sitemap.xml`: replace redirected legacy `privacy.html` URL with the canonical `privacy-notice.html`.
- `reference/ai-assisted-record-failure-modes/index.html`: insert a human-facing five-condition review workflow, evidence checks, escalation instructions and links to existing public tools.
- `resources.html`: add a clear contextual link from the resource directory to the AI-assisted record review reference.
- This workstream record: preserve platform assumptions, measurement design, publication restrictions and follow-up checks.

## Required verification before incorporating changes into the renovation

### Source and content checks

- Confirm XML syntax, HTTPS host consistency and unique sitemap URLs.
- Ensure the two sitemap corrections match deployed canonical and redirect behavior. Verify the reference page's trailing-slash behavior before any broader canonical rewrite.
- Validate all linked routes and resource download targets, including direct HTTP response classes. Existing release checks are not replaced.
- Check mobile layout, keyboard navigation, headings, contrast, 400% zoom, and assistive-technology review at the release gate.
- Keep the public Standard PDF v2.0 distinct from online methodology v1.0 and earlier field-guide editions. Do not create claims of equivalence.
- Maintain separate detection versus inter-rater reliability samples, including the *unmet* prespecified reliability criterion. Do not imply real-record or automated-Engine effectiveness.
- Check all public statements against the evidence ledger, preserve the Review Engine's restricted local-only posture, and prohibit identifiable case-record uploads.

### Hosted and independent checks

- Inspect Google Search Console and Bing Webmaster Tools only if authorized and connected. Record indexing status, crawl errors, search queries and canonical selections. Do not infer rankings from site source.
- Verify that public production URLs serve the expected HTML, robots file and sitemap without bot challenges. For any WAF exception, authenticate the bot with operator-backed IP/rDNS evidence; never allow solely on a spoofable user-agent string.
- Use a fixed panel of *non-branded* user questions across supported assistants, recording the exact prompt, date, product, source citations, inclusion/exclusion and factual accuracy. No results have yet been collected.
- Treat absent source citations as non-observation, not proof of permanent exclusion. Never claim coverage of a model solely because a crawler is permitted.

## Measurement plan

Weekly or monthly reporting can track:

- **Google/Bing discoverability:** indexed canonical pages, impressions, clicks, non-branded query coverage and crawl errors, with the reporting window recorded.
- **Assistant citations:** JRS cited in a fixed question set, source URL correctness and mischaracterizations (example: confusing constructed-record detection with real-world validation).
- **Qualified engagement:** attributable referrals to the public Standard, reference pages, free guides, seven-point check and training; preserve referrer/UTM provenance and account for unclassified or direct traffic.
- **Adoption evidence:** distinct voluntary resource interactions, verified downloads and practitioner feedback where already legitimately collected; not every page view is an adoption or pilot outcome.

Publish no success percentage without an explicit denominator, dated data source, attribution method and stated uncertainty.

## Release and rights controls

No automatic publication, Vercel deployment, production DNS edit, external service submission, paid promotion or bot/WAF exception is authorized by this branch. Do not broaden training permissions as a side effect of improving search discoverability. The controlled JRS source, unpublished data, credentials, individual records, partner communications and licensing materials remain outside public discovery changes. Preserve PR #117's release hold and required owner authorization.

**Disposition:** Source-level candidate prepared. Hosted discovery, real indexing, cross-assistant citations, accessibility and production release remain unverified.

## Additional implementation, 3 November 2026

This dependent draft now includes two new static public-reference candidates and integrates them into existing internal navigation, without expanding the 16-entry versioned resource catalog:

- `/worked-example-ai-record.html`: fully constructed supplier-access evidence comparison, with explicit unsupported approval/closure claims and a bounded reviewer disposition.
- `/institutional-briefing.html`: concise practitioner and institutional briefing, including the five-condition application sequence, separate research-sample limitations and verified links to existing public professional publications.
- `/assets/jrs-public-awareness.css`: accessible, responsive, printable reference styling without external scripts, analytics or new data collection.
- `/index.html`, `/resources.html` and the existing AI-assisted-failure-modes reference now link to the new references.
- `/sitemap.xml` contains 47 unique canonical URLs, including the new references.
- `docs/discoverability/JRS_AWARENESS_MEASUREMENT_2026-11-03.md` specifies awareness metrics using previously existing instrumentation, and explicitly records unobserved baselines.

The homepage already contained a separate, short fictional worked example. The new reference expands that existing example and does not replace it. Pages identify their copy as AI-assisted editorial drafts and do not represent the owner as having personally written or reviewed them. No owner participation is required to complete these source-level preparations. Existing owner release authorization requirements are unchanged and are not bypassed.

### Source checks

21 targeted source-level assertions passed for internal links, canonical URLs, sitemap duplication, existing resource count, responsive/print styles, absence of new telemetry, research limits and fictional-case qualification. These are static assertions, not witnessed accessibility, hosted crawler/indexability tests or verified referrer performance. The renovation release hold remains in effect. No deployment was requested.

## Terminology standardization workstream, 3 November 2026

### Terminology adoption objective

Make JRS terminology consistently defined, retrievable and citable in publicly accessible documentation. The site cannot require AI models, professional organizations or third-party practitioners to adopt JRS or DRR as conventional vocabulary. Genuine adoption depends on accurate independent usage and citation, not repeated internal mentions or instructions to chatbots.

**Canonical contextual definitions:**
- **Decision Reconstruction Risk (DRR):** "The condition in which a record cannot explain, on its own terms, why a consequential decision was made." Source: existing `decision-reconstruction-risk.html`.
- **Justification Review Standard (JRS):** A structured, human-applied documentation-review instrument for examining whether consequential decision records preserve reconstructability, identifiable basis, chronology, decision-process traceability and evidentiary sufficiency. Source: existing public methodology and five review conditions.

The new `terminology.html` page presents these definitions in visible text and matching schema.org `DefinedTermSet` metadata. Structured data is a machine-readable description, not a Google AI search requirement or proof that any model has learned these terms. No FAQ markup, `llms.txt` ranking promise or hidden prompt instruction was added.

**Acronym collision:** DRR is already an established term for *disaster risk reduction* in UNDRR terminology. Therefore the website should prefer "Decision Reconstruction Risk (DRR)" on first mention and disambiguate context. It must not represent ownership of all uses of DRR or claim an exclusively recognized standard.

**Linking:** The homepage, Resources, About and preexisting DRR definition page link to the stable combined terminology reference. Its sitemap URL is canonical; the sitemap now lists 48 distinct site URLs. These glossary/reference links do not change the versioned Standard PDF, Codebook, evidence ledger, controlled source or reviewer workflow.

**Accuracy safeguards:** JRS is a project-defined named review instrument, not represented as ISO/IEC adoption, external certification, legal compliance determination, field-proven effectiveness or a universal AI safety standard. The correct decision could still be poorly reconstructed, and a fully documented decision is not necessarily lawful or correct. The terminology page is explicitly described as an AI-assisted editorial draft.

### Measurement criterion

Monitor separate evidence grades: (1) *indexed definition page*, (2) *direct JRS/DRR search exposure*, (3) *non-branded assistant citations in answers about missing decision-record evidence*, (4) *independent use of full term with correct definition and attribution*, and (5) *verified use by practitioners in real workflows*. Each grade requires direct observation, dated source and limitations. An AI response that repeats a user-supplied term, a self-link on this site or an unattributed acronym match does not prove wider vocabulary adoption.

**Additional neutral probe examples:**
- What is the risk of keeping a polished AI-generated decision narrative without source evidence?
- What can a later reviewer do when an investigation record has no traceable reasoning?
- What documentation-review methods help preserve chronology and evidence in personnel decisions?

Acronym-only "DRR" searches must be excluded from qualified trend counts unless their context clearly means Decision Reconstruction Risk. No search-console, AI provider or publisher account action is required of the owner to prepare this work. Production publication still requires the existing independent release gates.

## Site identity and navigation structure, 3 November 2026

Google's public Search documentation recommends `WebSite` structured data on the home page for site-name recognition and `BreadcrumbList` when the actual page hierarchy is clear. The draft adds:
- A separate `WebSite` JSON-LD block on `index.html` with `name: JRS™ Justification Review Standard`, `alternateName: JRS` and the existing canonical `https://www.jrsstandard.com/`. The existing definition metadata is retained rather than overwritten.
- A matching visible breadcrumb path `Home > Free resources > [page]` on each of the constructed example, institutional briefing and terminology reference, plus the equivalent `BreadcrumbList` JSON-LD using their actual canonical URLs.
- Responsive breadcrumb styling and a companion release regression test to guard the site-name value, breadcrumb item URLs and visible labels.

This does not create a new JRS legal entity, certify JRS as an international standard or claim Google will show a rich result. Search recognition, crawl/index status, breadcrumb eligibility and traffic remain **NOT OBSERVED**. Avoid submitting a sitemap or changing verification accounts without independent authorization. All changes remain within dependent draft PR #121, under the preexisting release hold.

References:
- https://developers.google.com/search/docs/appearance/site-names
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb

## Problem-led internal links and source discovery audit (3 November 2026)

Search behavior can be oriented to professional problems such as reconstructing an investigation record, source-less AI drafting and chronology gaps, rather than depending on the audience already knowing the JRS or DRR brand. We therefore added contextual links from three established public references:

- The primary DRR definition now directs readers to a constructed source-note comparison, AI drafting failure-mode guidance and an institution-facing briefing. It makes explicit that a documentation gap does not prove the underlying decision was wrong.
- The practitioner essay *Why Good Decisions Fail on Paper* directs readers to the DRR risk definition, the constructed challenge and the separate JRS/DRR terminology page, retaining the essay's independent narrative purpose.
- The Decision Context Loss reference now identifies its relationship to DRR and the distinct JRS review method, with practical links to the source challenge and local seven-point questions. The three pages do not add personal-data collection, new analytics or new sales assertions.

The source regression now requires discoverability paths, physically present destinations, HTTPS canonical tags, sitemap inclusion for priority references, and the continued absence of private owner and non-public engine pages from the sitemap. These checks are not a Search Console URL Inspection result or proof of indexing.

**Known canonical discrepancy to investigate after protected-hosted access is available:** 17 sitemap `/reference/` directory entries use trailing slashes, while the corresponding HTML currently declares canonicals without trailing slashes. The sitemap and HTML source disagree on the preferred URL string. Changing all reference paths speculatively could produce unexpected redirects or duplicate URLs; a hosted HTTP redirect and Google-selected canonical audit is required before selecting the canonical spelling. Until then the regression accepts both forms on the 17 existing reference-directory paths but forbids missing priority pages or new host mismatches. Do not describe the site as having passed an exhaustive hosted canonical check.

**Measurement:** Google Search Console connection returned no accessible properties in this session. No query impressions, rank growth, AI citations, organic traffic lifts, institutional conversions or external mentions can be attributed to these source changes. Once authorized access is available, use URL Inspection and finalized web Search Analytics by query/page (not full-page query cartesian grouping) to establish a baseline. Bing Webmaster Tools AI Performance and Topics Portfolio are optional supplemental sources and are not currently verified as connected.

**Release:** All changes are candidate source on draft PR #121, dependent on PR #117. Do not merge, publish, issue IndexNow notifications, submit a sitemap or claim a search ranking change prior to owner authorization and successful exact-head hosted release gates.

Official search sources: https://developers.google.com/search/docs/appearance/ai-features and https://developers.google.com/search/docs/fundamentals/ai-optimization-guide and https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/


## Reference canonical sitemap alignment (3 November 2026)

Audited all 17 Reference directory pages. Their source HTML already declares slashless HTTPS canonical URLs; sitemap.xml listed slash-suffixed forms. The sitemap now uses the **existing declared canonicals** for all 17 entries. Total sitemap coverage remains 48 unique URLs. No route, redirect, page content, canonical tag, deployment configuration, or public link was changed.

Source regression now validates that each Reference sitemap entry maps to an actual directory index file and matches that file's canonical exactly, with no public-page noindex directive. The previous either-slash exception was removed.

**Hosted verification still outstanding.** This metadata correction does not prove HTTP 200 delivery, Vercel path rewrites, Google-selected canonicals, indexing or ranking. After release authorization and a protected-preview audit, inspect production URLs and Search Console URL Inspection before claiming indexing consistency. No sitemap submission or deployment occurred in this change.

Search Console currently exposes no JRS property to the connected reporting interface. Separate owner-only measurement definitions are included in JRS_SEARCH_PERFORMANCE_MEASUREMENT_2026-11-03.md. Never treat missing property access as zero organic activity.

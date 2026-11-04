# JRS search and AI-answer visibility baseline

Date: 2026-11-04 (America/New_York)
Status: **Search sample recorded. AI-answer citation measurements not conducted.**
Scope: Public English-language U.S. web search results, one snapshot, one search provider. This is not Google Search Console, Bing Webmaster Tools, Ahrefs, Google organic position data, or any proprietary rank tracker.

## Public web-search sample

Search-result positions below reflect the ordering returned by the queried public web-search provider at collection time. Results may differ by engine, location, time, personalization and query interpretation. Report "not in top 10" rather than zero visibility.

| Exact query | JRS domain result in sampled top 10 | JRS domain placement | Other relevant signal |
| --- | --- | --- | --- |
| "Justification Review Standard" | Yes | 1 (PDF), 2 (homepage), 5 (operational boundaries), 9 (research) | Corporate Compliance Insights result at 6; independent Dewey Publications result at 7 |
| "Decision Reconstruction Risk" | Yes | 1 (definition), 5 (simulations), 8 (pilot) | Corporate Compliance Insights at 4 and 9 |
| AI assisted documentation review standard | Not in top 10 | Not observed | Legal document review and AI documentation providers surfaced |
| Audit evidence traceability decision records checklist | Not in top 10 | Not observed | Audit-evidence and control-documentation resources surfaced |
| AI-generated HR documentation source verification checklist | Not in top 10 | Not observed | HR compliance and AI documentation checklists surfaced |
| Pre-finalization review of compliance records | Not in top 10 | Not observed | Society of Corporate Compliance and Ethics article "When the record cannot speak for itself" surfaced at 1 |

### Interpretation boundaries

- **Branded term discovery is visibly established in this provider's sample.** Ranking for newly coined terminology should not be treated as proof of category awareness.
- **Non-branded discoverability is weak in this six-query sample.** No user traffic, clicks, impressions, search volume or conversion were measured.
- **The Society of Corporate Compliance and Ethics article is an indirect route to JRS expertise.** Publisher placement is not evidence that the JRS domain ranked.
- **No baseline growth or decline is established.** A single point-in-time snapshot cannot support a trend.

## Independent mention and authored-publication distinctions

The following public references were observed in search or page results. Classify each by authorship and context before using it in marketing claims:

- Dewey Publications, *News and Case Alert*: independent reference to the Investigator Field Guide and Justification Review Standard. https://deweypub.com/store/NaCA1807.html
- Corporate Compliance Insights, *That AI-Drafted Termination Memo Could Become Evidence*, September 29, 2026: professional **authored commentary**, not independent JRS performance validation. https://www.corporatecomplianceinsights.com/that-ai-drafted-termination-memo-could-become-evidence/
- Society of Corporate Compliance and Ethics, *When the record cannot speak for itself*, November 1, 2026: professional **authored commentary**, not independent JRS performance validation. https://www.corporatecompliance.org/news-and-insights/cep-magazine/when-record-cannot-speak-itself
- Third-party discussion on aevumtransform.com references the DRR concept. Verify author independence, date, editorial context and factual correctness before considering it an endorsement.

No independent reviewer, vendor, institution or authority is represented as having certified JRS.

## AI-answer citation measurement protocol (future)

**As of this baseline: unmeasured, not zero.** No actual ChatGPT, Gemini, Perplexity or Google AI answer response corpus, cited URLs or citation share was captured. Mere web indexing or mention in an authored article cannot be counted as an AI-answer citation.

For each platform and each prompt in `ai-citation-prompts.md`, collect a dated response and the exact publicly visible citations. Sample multiple sessions using the same controlled protocol and record:

- Platform, model/interface if reported, geography, date/time, prompt verbatim and any personalization/search settings known.
- Whether JRS or DRR was named; whether any `jrsstandard.com` URL was cited; whether the cited content supported the generated answer.
- Exact citation URLs and a saved, privacy-reviewed response reference; ambiguous external attribution is not a positive.
- Mention rate = responses that mention JRS / eligible completed responses.
- Domain-citation rate = responses citing a JRS-domain URL / eligible completed responses.
- Qualified-citation rate = responses with a relevant, accessible citation that supports the specific attributed claim / eligible completed responses.
- Report counts and denominators, disaggregate by prompt and provider, and do not turn incomplete prompts into negative results.

## Needed data-source connection

Obtain authorized property data from Google Search Console (queries, pages, impressions, clicks, CTR and average position) and, if available, Bing Webmaster Tools. Verify that the property exactly covers `https://www.jrsstandard.com/` and its domain variants. Do not infer a Search Console ranking from this external search sample. No credentials or private site analytics are stored in this repository.

## Next evaluation after deployment

1. Confirm each new URL returns HTTP 200, correct HTML title/canonical and no noindex directive.
2. Confirm sitemap XML includes exactly one URL for each new guide and the returned response is valid XML.
3. Confirm internal links to the guides and citation hub resolve and keyboard navigation works.
4. Observe search indexing and query visibility over a defined later period; record actual dates and denominator.
5. Separately sample AI-answer citations. Never claim an AI-ranking improvement from adding page text alone.

## Release and claim controls

Publication of these pages does not establish a rank increase, technical evaluation permission, additional validation results, buyer demand, a license, production readiness or compliance certification. Public content must continue to distinguish JRS Standard PDF v2.0, online methodology v1.0 and the separately versioned Manifest schema.

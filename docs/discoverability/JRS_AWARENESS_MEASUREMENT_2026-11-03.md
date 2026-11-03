# JRS Awareness and Practitioner Engagement Measurement Specification

**Prepared:** 2026-11-03
**Status:** Implementation specification, not observed performance.
**Owner effort:** No owner posting, application, account creation, form completion, outreach or manual data entry is required for the source improvements. External search-account access and publication remain separate from this workstream and are not silently assumed.
**Release:** Candidate branch only. No production deployment, release authorization or Vercel security change.

## Objective

Evaluate whether more professionals encounter accurate JRS information and whether public exposure leads to examination of JRS resources. Preserve the distinction between discovery, engagement, independent use and actual adoption. Do not infer institutional use solely from clicks or downloads.

## Existing measurement surfaces

- Google Analytics 4 is already included in the current homepage and public resources. Existing first-party click-event hooks in `assets/jrs-engagement.js` cover record check openings, investigator guide openings, reviewer training entry and selected other pathways.
- The public `/api/dl` path is an existing download route. Server-side counters, where verified, may provide stronger evidence of attempted delivery than client clicks, but should not be equated with completed reading, use or sustained adoption.
- New pages have standard HTML titles, descriptions, canonical URLs and internal links; they add no new cookies, scripts, forms, tracking pixels or personal-data collection.
- The site's resources catalog has 16 catalog entries. The constructed example and public briefing are separate supplementary references, not a redefinition of the versioned resource count.

## Funnel and operational definitions

| Layer | Question | Data permitted | Interpretation limit |
| --- | --- | --- | --- |
| Search visibility | Are public JRS URLs indexed and shown? | Search Console/Bing Webmaster Tools *when already authorized and available*; crawler evidence | A sitemap entry or HTTP 200 does not establish indexing. |
| Professional awareness | Do non-branded queries or independent professional publications lead to a JRS visit? | Search impressions and clicks; GA4 referrer/campaign/source and landing page, when available | Referrer attribution is incomplete and not a census of people. |
| Resource engagement | Do visitors open useful JRS tools? | Existing anonymous GA4 event counts or verified download endpoint totals | A click or download is not proof of document review. |
| Practitioner application | Did a person apply the method to a record? | Explicit, authorized, de-identified practitioner feedback if already collected | No application metric can be inferred from traffic. |
| Institutional adoption | Did an organization implement JRS within a workflow? | Dated, authorized institutional evidence with scope and permission | Not established by an inquiry, publication, mention or download. |

## No-action reporting approach

1. Use existing public-source checks and repository inspection for discoverability evidence. Do not require the owner to connect Google Search Console or Bing Webmaster Tools.
2. Where existing analytics are accessible through an already-authorized service, read them without altering tags, consent settings or collection policy. If they are not accessible, mark the metric **NOT OBSERVED**, rather than ask the owner to log in or provide screenshots.
3. Report the two new page paths individually: `/worked-example-ai-record.html` and `/institutional-briefing.html`. Compare with `/resources.html`, `/reference/ai-assisted-record-failure-modes/`, `/check.html`, `/investigator-guides.html` and `/training.html`.
4. Treat GA4 organic-search attribution, direct traffic, social referrers, external publication referrals and AI-assistant referrers as distinct classifications. Do not invent platform referrals from the user agent or URL.
5. For AI search citation monitoring, use a fixed set of neutral practitioner questions without `JRS` in the prompt. Record the product, date, question, citation URL and factual correctness. Never describe one test as coverage across all LLMs.

## Proposed fixed question set

- What should an investigator check before an AI-drafted report is finalized?
- How can a compliance reviewer identify documentation gaps before record retention?
- What tools can help review the chronology and evidence of a decision record?
- How can an auditor check whether a decision record can be reconstructed later?
- What are common failure modes when AI rewrites investigative notes?
- Are there free guides for checking the evidentiary support of a completed record?

A mention of JRS is separately recorded from a clickable source citation. Record materially incorrect claims, especially any assertion of independent JRS Engine validation or regulatory certification.

## Baseline and thresholds

- **Current verified search impressions:** NOT OBSERVED.
- **Current verified AI-assistant citation share:** NOT OBSERVED.
- **Current verified qualified resource engagements attributable to new pages:** NOT OBSERVED.
- **Current verified organizational adoptions attributable to this workstream:** NOT OBSERVED.

No growth target, conversion benchmark, financial value or percent improvement is asserted without an observed baseline and a named measurement period. The first defensible report should establish baseline, instrumentation coverage and uncertainty before ranking the channels.

## Safe implementation rules

- Do not add tracking or consent prompts to new references. Do not expose publication or research participant identities beyond previously approved public attribution.
- Maintain the published Standard PDF v2.0, online methodology v1.0 and older investigator supplements as separate editions.
- Do not infer the constructed example demonstrates field performance. Report research detection, reliability and cross-vendor consistency as distinct samples and properties.
- Do not request paid promotion, mass outreach, publisher edits, search-account verification, social posting or authentication bypass on the owner's behalf.
- Preserve the existing PR #117 release hold. PR #121 and its dependent artifacts may be prepared without production publication.

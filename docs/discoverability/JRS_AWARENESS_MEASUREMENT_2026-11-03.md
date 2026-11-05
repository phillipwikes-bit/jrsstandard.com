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

## Source-labelled, privacy-preserving practitioner journeys (3 November 2026)

The three new public references now link to the established record check and resource pages using fixed `src` strings (`worked-example`, `institutional-briefing`, `terminology`); the AI-assisted record reference uses `ai-failure-modes`. Briefing-to-training uses `src=institutional-briefing`. These are non-personal labels consistent with the site's existing first-party links, not session IDs or visitor tracking. They may appear in the existing destination URL reporting where authorized and available. No GA4 code, cookie, form, backend endpoint or third-party call was added to the new pages.

The reference page gained one non-branded practitioner question and a source-checking response pointing to the constructed example and free check. No new SEO article or redundant resources were created.

`tests/public-discoverability-journey.test.mjs` is now invoked by the existing method-first release gate; it checks search metadata, sitemap identity, share controls, static journey links, constructed-case disclaimers and no new analytics code on newly created reference pages. These are source tests, not hosted behavior, search indexing, social sharing or qualified adoption.

No owner action, new account, outbound outreach, manual Vercel deployment, publication or release override is part of this change.

## GA4 integration without expanding tagged-page coverage (3 November 2026)

The homepage and Resources already include Google Analytics 4 measurement tag `G-NVYHJ7BJ92` and the site's allowlisted engagement script. We retain that pre-existing tag and do not load GA4 on the constructed-record example, institutional briefing or terminology pages.

**Added, on existing tagged pages only:**
- GA4-recommended `select_content` event when a visitor deliberately opens one of three public JRS references from Home or Resources. Fixed parameters: `content_type=jrs_public_reference`, `item_id` in `worked_example | institutional_briefing | jrs_drr_terms`, `source_surface` in `home | resources`. No URL string, case material, query text, visitor ID or custom cookie.
- A visible Resources directory Share/Copy link control, using the pre-existing canonical public URL and the existing protected-preview guard. GA4's recommended `share` event fires only after the native share action returns successfully, with `method=native_share_sheet`; `jrs_link_copied` is a **different custom event** emitted only after a confirmed clipboard write, with `method=clipboard`. A copy is not counted as a completed share.
- Updated `privacy-notice.html` with the named event types, fields and limitations. This does not waive the outstanding privacy and release reviews.

**Not measurable from this code alone:** Untracked share actions on the three no-GA4 reference pages; their social recipients; search impressions; true downstream reader conversion; external citation or independent vocabulary adoption. Existing pageviews and static `src` links may support partial source-path analysis. These signals are aggregate and need dated provider evidence, not estimates.

**Live data access:** The connected HYPD Google Analytics service reports that the user has a connection but has selected no reporting property. Accordingly *actual* GA4 traffic, share and referral figures are **NOT OBSERVED**, even though the code has a GA4 tag. No user action is required to prepare or maintain the PR. Production release remains on hold.

See Google's recommended `share`/`select_content` events: https://developers.google.com/analytics/devguides/collection/ga4/reference/recommended-events

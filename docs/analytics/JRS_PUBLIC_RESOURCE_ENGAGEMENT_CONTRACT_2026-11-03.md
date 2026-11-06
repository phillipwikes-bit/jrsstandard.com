# JRS Public Resource Engagement Measurement Contract
Effective development candidate: 3 November 2026.
Status: source specification, not certified data or an established business result.

## Controlling sources and limits

1. Google Analytics 4 measurement ID G-NVYHJ7BJ92 already tracks public page views where enabled. Tracking is incomplete when blocked by browser policy, analytics preferences, network conditions or provider configuration. Do not treat page views as a unique practitioner count.
2. The existing GET download endpoint /api/dl issues a redirect to a fixed PDF and writes eligible request events on a best-effort basis. The guide_downloads and interaction_events tables may contain two records describing one guide request. Do not add those counts without reconciliation. Neither a redirect nor an event proves document receipt or professional use.
3. Existing training participation, optional named enrollment, and local module completion are distinct. The new public GA4 event indicates opening a module, not a verified completion or credential.
4. The existing /api/site-inquiry service passes consented inquiries to Formspree. An upstream acceptance is not guaranteed delivery to owner Gmail, research participation, customer adoption or permission for marketing.
5. The confidential owner dashboard remains outside GA4 and outside the new public event script. Private participant, contact or research records are not analytics payloads.

## Newly permitted GA4 events

| GA4 event | resource_id | Meaning and limit |
|---|---|---|
| jrs_tool_open | record_check | Clicking an internal link to the free, non-scoring check. Does not demonstrate completion. |
| jrs_guide_open | investigator_guides | Clicking a guide-directory link. Does not demonstrate PDF delivery. |
| jrs_training_entry | reviewer_training | Clicking a training link. Does not establish module use. |
| jrs_training_start | module_0 through module_5 | First module expanded in the current training page view. Not a unique user or formal completion. |
| jrs_edition_compare | edition_guide | Navigating to the publication comparison guide. |
| jrs_organization_info | organization_path | Navigating to information-only organizational material. Not a customer lead. |

Only resource_id and source_surface are custom event parameters. Allowed source surfaces: home, resources, training, editions, organization. No search query, full URL, name, email, case information, credential, invented user ID or storage key is collected by this added instrument. GA4 retains its own separate collection practices. The event layer adds no cookies, storage, fetch request or separate beacon transport.

## Weekly decision framework

Primary KPI A: tool discovery = jrs_tool_open by source_surface divided by applicable GA4 source-page views. This is a directional click-to-view ratio, not unique visitor conversion.

Primary KPI B: document interest = eligible server-recorded PDF requests by exact document identifier and source, after preserving one-event-versus-two-table accounting. A successful PDF download is not established unless actual delivery is verified.

Primary KPI C: training initiation = jrs_training_start divided by GA4 training page views over a matching period. Report optional enrollment and completed-module events separately, with their source-specific rules. A first module open is an action per page view, not unique participation.

Driver metrics: guide-directory clicks, training-entry clicks, publication comparison clicks, organizational information clicks and verified page-access telemetry.

Guardrails: exclude automated QA and known bot probes only when the raw event data supports doing so; distinguish user interaction from actual professional adoption; preserve private information; never silently treat missing fields or providers as zero; avoid double counting download representations.

## Repeat activity and denominator integrity

No public user authentication or longitudinal identity is added here. GA4 estimated new/returning traffic may be used only if correctly configured and verified, with its reporting identity and collection limitations documented. Repeat professional use by a known practitioner is NOT ESTABLISHED. Unavailable or incomplete data is NOT VERIFIED, never zero.

All reports must include the date range and time zone, source, exact query and filters, row/event grain, crawl/test exclusion method, extraction time, denominator, and unresolved source differences. Use comparable periods. Never infer visits or successful PDF deliveries from aggregate event counts.

## Release acceptance

1. Run node tests/jrs-a-improvements.test.mjs and existing institutional, privacy, directory and download source tests.
2. Check keyboard focus, status announcements, navigation and 200% zoom in an actual browser. Run real iPhone VoiceOver and a tagged-PDF reading-order review before certifying accessibility. Static and synthetic tests do not certify WCAG.
3. Check the new pages at 320, 390, 768 and 1440 CSS pixels with no horizontal overflow. Verify the mobile menu with VoiceOver.
4. In a non-sensitive GA4 DebugView fixture, check each allowlisted event and both parameters; verify no private values or URLs leak. Confirm the owner dashboard and contact form do not load this script.
5. Confirm actual /api/dl source rows, duplicate structure, bot filtering and existing historical totals using authorized owner data. Do not invent baselines.
6. Verify the organizational link and old enterprise alias serve only public information, with no software or pilot intake.
7. Separate source tests, hosted verification, third-party analytics verification and independent production QA. Unmet checks remain a release hold.

No current conversion rate, adoption result, repeat visitor estimate, measurement gain, performance result, accessibility certification or commercial-readiness claim is asserted.

## Public initiative activation extension (5 November 2026)

Campaign pages: `right-to-know-why.html` and `decisions-you-can-defend.html`. Both use existing GA4 settings and the existing public engagement dispatcher. The event allowlist is extended, not replaced. GA4 data is a directional interaction signal, not a unique-person register.

| Event | `resource_id` | `source_surface` | Meaning |
|---|---|---|---|
| `jrs_campaign_entry` | `rights_initiative` or `professional_initiative` | `home` | Clicking a homepage initiative link, not a confirmed landing or support |
| `jrs_campaign_drr_open` | `drr_explainer` | `campaign_rights` | Clicking from the rights page to the DRR explanation, not evidence of comprehension |
| `jrs_tool_open` | `record_check` | `campaign_professional` | Clicking through to the free check, not completion or verified practitioner use |

The campaign pages also have ordinary GA4 page views, subject to usual collection blockers. No custom campaign visitor ID, form data, URL, email, case information, full referrer or independently collected telemetry is added. Do not infer unique visitors or adoption.

### Reuse of historic one-click endorsement counting

The established `/api/support?c=rtkw|defend` endpoint remains the sole writing mechanism for an initiative's voluntary one-click support. New campaign-page links use `src=campaignpage` and route to `initiative-confirmation.html` after server processing. Legacy referral tags and access-screen navigation remain intact. The owner dashboard and `/api/support-stats` continue to read the existing `interaction_events` source; do not create a second counter, sum GA4 clicks with support records, or migrate historic rows. A non-2xx database response must not set the recording cookie or be represented as successful.

A browser marker limits repeat counting; it does not establish a unique person. The August 2026 change in deduplication means historical counts cannot be treated as a homogeneous series of unique supporters. Some clicks in the August 11 outage were not written; do not invent missing rows. Bot/prefetch and smoke-test exclusions are retained. The new campaign confirmation has `recorded`, `previous`, and `unverified` messages, with no case intake and no requirement to register or submit evidence. An expression of support is not organizational adoption, completed training, evidence of JRS effectiveness, or a new legal right.

### Dashboard reconciliation

Retain the historical owner-dashboard categories separately: campaign screen arrivals, endorsements by initiative/source/day/country, reviewer arrivals, evaluation opens and submissions, guide requests, training entry and verified completion where available, pilot participation and record-level research. Legacy campaign screen arrivals measure the former access/gate route. New initiative-page visits are observed through GA4 page-view signals and **must not be appended to the historical arrival count or silently treated as an equivalent denominator**. A source-specific report can display both in separate labeled series.

Qualitative campaign assessment: LinkedIn's “Different Minds. Fewer Blind Spots. Stronger Evidence.” provides a discussion prompt only. Diversity of experience can surface questions; it is not a measured JRS improvement in evidence quality. Share counts and reactions are not verified professional adoption. Verified external sharing and observed practitioner use must be supported by their own sources.

### Release acceptance (extension)

- Confirm current `main` SHA and review the exact source changes; preserve the existing owner dashboard and support stats response shape.
- Verify that the new GET support link only records upon an intentional human activation and is never fetched in a test that could create an actual endorsement. Use isolated mocks for write and deduplication checks.
- Confirm successful database writes are distinguished from HTTP errors, existing browser markers and missing configuration.
- Check mobile/keyboard navigation, constructed-example readability, two audience paths, and same-origin live links.
- Verify the new confirmation page has no email collection, registry intake, record upload or unsupported "support counted" claim.
- Verify analytics events in a non-sensitive GA4 DebugView fixture, and check the historical owner-dashboard support breakdown without modifying it.
- A READY preview, static source review, and successful origin publication are distinct release states. Do not claim live functionality without live verification.

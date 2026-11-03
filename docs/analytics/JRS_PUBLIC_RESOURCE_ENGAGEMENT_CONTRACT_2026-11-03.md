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

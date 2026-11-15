# JRS outreach attribution and Search Console verification

Date: 15 November 2026. Owner: Phillip Wikes.

## Campaign links for future outreach

Use one of these links in new outbound messages. The campaign tags identify the
initiative and channel only. They contain no recipient, employer, email address,
case information or individual identifier. Do not add tracking tags to internal
navigation links, where they could overwrite the original acquisition source.

| Initiative | Channel | Ready-to-use URL |
| --- | --- | --- |
| The Right to Know Why | Community outreach email | https://www.jrsstandard.com/right-to-know-why.html?utm_source=jrs_outreach&utm_medium=email&utm_campaign=right_to_know_why |
| Decisions You Can Defend | Professional outreach email | https://www.jrsstandard.com/decisions-you-can-defend.html?utm_source=jrs_outreach&utm_medium=email&utm_campaign=decisions_you_can_defend |
| The Right to Know Why | LinkedIn | https://www.jrsstandard.com/right-to-know-why.html?utm_source=linkedin&utm_medium=social&utm_campaign=right_to_know_why |
| Decisions You Can Defend | LinkedIn | https://www.jrsstandard.com/decisions-you-can-defend.html?utm_source=linkedin&utm_medium=social&utm_campaign=decisions_you_can_defend |

Existing messages and links are not retroactively attributed by this change.
Do not use unique recipient parameters, shortened redirects, or contact IDs.

## Public engagement measurement

The public `assets/jrs-engagement.js` emits GA4 action events with two fixed
parameters (`resource_id`, `source_surface`). It does not record record-review
answers, review scores, copied text, case facts, visitors, full URLs, search
queries or form contents. Resource-click and PDF-click actions do not confirm
that a person completed a review, opened a downloaded file or used JRS at work.

Events to inspect in GA4 after the branch is released:

* `jrs_campaign_resource_open`: click from either initiative page to a free resource.
* `jrs_pdf_open`: a click on an allowlisted publication PDF.
* `jrs_tool_open` and `jrs_training_entry`: existing entry links.
* `jrs_training_start`: first module open, subject to browser behavior.
* `jrs_check_summary_copy` and `jrs_check_summary_print`: explicit output actions;
  no checkbox choices, content or generated summary is transmitted.

These are proposed engagement signals, not automatically marked GA4 key events.
The property owner must designate any approved key events in GA4 Admin after
confirming that events are observed and counted consistently in DebugView.
Do not classify ordinary page views or link clicks as a commercial conversion.

## Search Console

As of 15 November 2026, the accessible Search Console reporting connector
returned zero connected properties. This does **not** establish whether the
domain itself is verified inside Google's Search Console; it only confirms
that this connection has not been authorized for reporting.

The owner must connect a verified JRS Search Console property to the reporting
service through its standard Google authorization. Until then, query impressions,
search click-through rates, page indexing diagnoses and ranking changes are
unverified. Do not infer search ranking from public search snippets or GA4 alone.

## Measurement acceptance before claims

1. Test one event of each category in a controlled browser with GA4 DebugView.
2. Check that copied text and review answers never enter the analytics payload.
3. Apply an internal/test-traffic exclusion to reporting only after validating
   the rule, retaining an unfiltered diagnostic view where supported.
4. Confirm that acquisition reports preserve the original offsite UTM values
   when a visitor follows ordinary internal links.
5. Reconcile GA4 source totals and look for repeated internal/testing traffic
   before presenting visitor totals as professional adoption.

No Search Console ownership, GA4 admin configuration, paid audit capability or
production deployment was changed by preparing this document.

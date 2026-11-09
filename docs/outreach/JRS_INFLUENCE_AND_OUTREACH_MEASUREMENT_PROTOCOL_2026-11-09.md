# JRS influence, outreach, and adoption measurement protocol
**Controlled plan, 2026-11-09. Status: DESIGN COMPLETE / NOT ACTIVATED / NO CAUSAL RESULT.**

## 1. Decision and scope
Determine, without inventing outcomes, whether a factual, role-matched resource-sharing message performs differently from a generic factual message for eligible professional organizations. Measure website-navigation signals separately from reply, organizational use, and commercial agreements. This is not an experiment on the merits or legality of decisions and must not involve any case material.

The authoritative **private** evidence system is the existing "JRS Private Outreach Control Register | November 2026" in Google Sheets. Never copy organizational addresses, outreach records, replies, private Gmail URLs, experiment assignments or recipient identity into the public repository or Google Analytics. The site's public research and automated Review Engine validation remain separate.

## 2. Current observed baseline
The private register, initially inspected 2026-11-09, listed 6 organizations researched, 4 Gmail drafts, 0 sends and 0 replies. A subsequent read on the same date showed 8 researched and 5 drafts as the separate ongoing outreach workflow added research records. Both observations showed 0 messages sent and 0 replies. These are dated **nonexperimental snapshots**, not randomized samples; refresh the source before any activation. A draft is not a sent message. No causal effect, reply rate or adoption can be computed from this pre-activation state. Public site events may count visits and clicks but not independent reading, unique organizations, adoption, endorsement or conversion.

## 3. Two separate evidence streams

### Website navigation: observational only
Existing Google Analytics 4 JRS events are emitted only on fixed internal link categories using resource_id and source_surface parameters. The new jrs_draft_builder_open is a navigation click, **not** a completed draft or a sent message; jrs_campaign_example_open is an anchor click, **not** observed comprehension; jrs_tool_open is a navigation click, **not** verified checklist completion. A separate first-party /api/support counter records accepted browser-level expressions of agreement, not unique people or institutional endorsements. Analytics blocking, cross-device duplication and configuration changes affect denominators.

Permitted descriptive indicators: numbers of allowed event occurrences by source page and date; counts of page entries and guide/check link clicks separately; and verified failures such as unexpected redirects or duplicate event dispatch. A same-session ratio can be reported only when both numerator and denominator are observed using a verified, consistent session definition in the same analytics property. Otherwise report separate counts and state the ratio is not available. A before-after difference is not a randomized causal result.

### Organization-level outreach: controlled evaluation only after release
**Unit:** one independently identified and eligible organization/domain, with one initial approved recipient route. Deduplicate by organization and normalized receiving mailbox; multiple recipients of the same organization are not independent observations.

**Eligibility before assignment:** official published organizational contact route, dated documented relevance, no opt-out or suppression, no prior conversation that would confound first outreach, exact owner-approved subject/body/recipient, and completed applicable CAN-SPAM or other required communications classification. No auto-sending or repeated follow-up after silence.

**Comparison for a future professional-association cohort:**
- A (control): truthful generic free JRS resource-sharing note with a constructed professional decision example and a voluntary request to review.
- B (treatment package): truthful documented profession-specific relevance, a directly matched guide/example and the same voluntary request.

Both arms preserve the same identity disclosure, no-purchase terms, operational validation limits, respectful opt-out and any legally required disclosures. Freeze exact email subjects/bodies/links before first assignment. This is a **package test** and cannot attribute any effect to one Cialdini principle, subject, opening sentence, destination or personalization in isolation. Do not pool the public-interest and professional-association audiences.

**Randomization:** after eligibility and templates are frozen, assign eligible organizations 1:1 within pre-specified comparable audience strata using a reproducible saved random seed. Keep assignment, source list and all exclusions in the private workbook before dispatch. Do not rerandomize or drop unfavorable assignments. Four previously prepared drafts have **not** been randomized and must not be retrospectively called an experiment.

**Primary outcome:** verified affirmative **human** reply explicitly expressing relevance, interest in reviewing the linked material, or willingness to consider its educational use within 21 calendar days of Gmail-verified initial dispatch. Mere acknowledgment, autoresponses, bounces, unsubscribe requests and complaints are **not** positive outcomes. Preserve and report each category separately. The response must be supported by the original email; a reviewer should classify it against the frozen coding rules without consulting treatment assignment wherever practicable. This outcome measures a qualified reply, **not independently observed persuasive belief change or actual adoption**.

**Additional outreach-response measure:** any substantive human response within 21 days, including a qualified positive, neutral response or explicit refusal; record negative responses separately as a guardrail. Do not optimize for provoking refusals.

**Secondary outcomes, never collapsed with primary:**
1. All substantive human responses, and refusal/complaint rates, within 21 days, separately from the primary affirmative-relevance outcome;
2. Written confirmation by an authorized organization of actual sharing/use of the specified resource within 60 days;
3. Written invitation to an organizational evaluation or pilot with bounded scope within 90 days;
4. Executed fee-bearing agreement **and** independently verified cash receipt, with contract and financial evidence separately recorded.

Missing written outcome evidence = UNKNOWN / NOT VERIFIED. An email draft, page view, support click or expression of interest is not adoption, endorsement or a sale.

**Guardrails:** opt-outs and complaints, incorrect claims, broken links, personal-data disclosures and any unsupported assertion about research or effectiveness. Observe all opt-out/suppression rules.

## 4. Pre-specified analysis and release decisions
1. Freeze the eligible organization list, arms, dates, message artifacts and outcomes before randomization/sending. Confirm a credible baseline response range and a minimum meaningful effect before conducting a sample-size/power calculation. Do not manufacture either or declare the present four drafts adequately powered.
2. Check public event QA and GA4 DebugView, property configuration, registered custom dimensions and privacy disclosures. Source code emitting an event is not proof that GA4 receives or reports it.
3. For valid future randomization, compare arms using organizations assigned (intention to treat). Audit assigned organization counts against the expected 1:1 ratio, delivery/observation completeness and any differential exclusions before assessing outcomes; investigate a material sample-ratio mismatch rather than interpreting an affected result. Report raw numerators and denominators, rates, absolute percentage-point differences and uncertainty. Predefine confidence interval methodology and, if adequately powered, hypothesis testing, treatment comparisons and exclusion criteria. Keep null results and small sample limitations visible.
4. Independently report website interaction signals, actual human replies, positive relevance replies, confirmed organizational resource use, pilot invitations and monetary receipts. Never merge distinct denominator populations.
5. No cross-system person matching, fingerprinting, recipient-specific URL identifiers, tracking pixels or unpublished source identities. No conversion or effectiveness claims until evidence is collected and verified.
6. The protocol authorizes no outgoing messages, contacts or site release. Each external message requires separate explicit owner approval of recipient, subject and body.

## 5. Evidence and methodology
- Robert Cialdini, seven principles and ethical persuasion: https://cialdini.com/principles and https://www.psychologicalscience.org/observer/universal-principles-of-influence
- W3C WCAG 2.4.4 link purpose: https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context
- FTC CAN-SPAM primary-purpose and covered-email requirements: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- FTC endorsement rules, 16 CFR 255: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255
- GA4 custom event specification, reporting and QA: https://developers.google.com/analytics/devguides/collection/ga4/events
- Microsoft Research (2019), diagnosing sample ratio mismatch and conditions for trustworthy controlled experiments: https://www.microsoft.com/en-us/research/publication/diagnosing-sample-ratio-mismatch-in-online-controlled-experiments-a-taxonomy-and-rules-of-thumb-for-practitioners/
- Microsoft Research, designing trustworthy experimentation with explicit outcome and guardrail metrics: https://www.microsoft.com/en-us/research/articles/patterns-of-trustworthy-experimentation-pre-experiment-stage/
- JRS current implementation: assets/jrs-engagement.js, api/support.js, privacy-notice.html, decisions-you-can-defend.html, right-to-know-why.html
- JRS 2026-10-03 canonical source-alignment record E-037 and E-038: constructed-record detection findings and separate reliability estimates; no established real-world operational effectiveness.

## 6. Activation checklist
- [ ] Pull request approved, CI checks passed and served website verified, including mobile.
- [ ] GA4 events validated in reporting/debug view without custom IDs or case data.
- [ ] Email commercial-purpose classification reviewed; any legally required postal address and opt-out functionality verified.
- [ ] Eligible cohorts, messages, analysis methods and observation windows frozen before randomization.
- [ ] Dated owner approval for every exact email recipient, subject and body.
- [ ] Gmail send verified before reply observation window.
- [ ] Outcome records privately reviewed and evidence linked.
- [ ] Any reported effect includes numerator, denominator, uncertainty and scope limitations.

**2026-11-09: There are no experimental outcome observations, and no improvement claim is made.**

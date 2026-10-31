# JRS Resource Traffic and Buyer Evidence, Controlled Readiness Baseline

**Observed:** 2026-10-30, approximately 20:00 America/New_York (2026-10-31T00:00:52.014Z asset endpoint timestamp).  
**Status:** Development-branch source audit and read-only production endpoint observation. Not yet deployed. Not a rights review, validated sale price or commercial offer.

## Objective

Make the owner programme-status report accurate enough for a purchaser to trace a download claim to the counted event population, exclusion rule, source record and observation date. Preserve underlying research, contact records and historic event history unchanged.

## Read-only live baseline (before the present release)

The current production endpoints were read without changing records:

- `/api/geo-stats`: 265 raw tracked Investigator Guide requests and 2,111 raw tracked other current-resource requests, for **2,376 raw requests** in the endpoint's grouped scope. Reviewer Reference 824, JRS Standard PDF 556, Rapid Review Card 323, combined Investigator Guide 150, Document 258; three individual guide editions sum to 265.
- `/api/asset-stats`: 1,277 retained all-source download events after declared crawler filtering, 1,100 crawler-flagged download events, 161 retained events with no recorded user agent. Thus this different-scope endpoint counted **2,377 download-type events before its crawler exclusion**.
- This apparent difference of one event **is not yet demonstrated to be a data error**. The endpoints are not an identical cohort: the asset endpoint counts download types beyond the geo endpoint's three redirect sources, while geo includes any event type from those three sources. The reads were not one atomic database snapshot, and new events may have appeared between requests. Do not subtract the totals to infer a missing person or a purchaser.
- Production `/api/geo-stats` did not yet expose per-resource `quality` classifications during this observation. The draft code does. Historical user-agent-less requests remain unclassifiable, not human-confirmed.

## Engineering correction in dependent draft

1. The shared classifier now determines declared crawler status, an unknown-agent group and recognized current-resource scope, including a single rule for internal test-source tags. The old raw geographic counts remain unchanged.
2. The aggregate `asset-stats` endpoint now checks the completeness flag for each of its six paginated database reads. Any incomplete read produces an explicit 502 instead of a plausible but truncated count. This is essential because its old `fetchAllRows` helper discarded completeness.
3. The same aggregate event read now returns a `download_scope_bridge`: legacy all-source download-type count; current-resource redirect-request count; current-resource non-download event types; out-of-scope source events; test-tagged rows; retired/unknown kit rows; and a reconciliation boolean. These figures are calculated together from one event response, not by comparing separate changing API snapshots.
4. Ordinary `/api/dl` GET handling no longer issues a database DELETE of historic test-tagged events. Filtering is non-destructive. HEAD metadata probes are redirected but not logged as downloads; other methods receive 405. GET prefetch requests continue to be served but not logged.
5. The owner page identifies non-crawler-flagged requests as **unverified events**, not 'humans', changes the two resource charts' prominent language from downloads to raw requests, and explains the all-source vs current-resource metric bridge.

These changes repair reproducibility and interpretation, not the underlying proof of human use. Neither source agents nor geography prove unique readership, actual workflow adoption, buyer authority, propensity to license or transferability.

## Buyer-evidence release table

| Evidence class | Present support | Status for buyer summary |
|---|---|---|
| Public methodology and reference resources | Itemized assets and dated links | Can be described, with relevant ownership and rights qualification |
| Download activity | Instrumented request events with crawler and unknown buckets | May be stated as tracked requests after complete source reconciliation; not people |
| Reviewer studies | Bounded study sample and authored methods | Describe population, sampling limits and exact source version, no blanket generalization |
| Two reported pilots | Separate historical accounts and real-case source records | Verify pilot identity, dates, sample and permission before saying organizational deployment |
| Training | Enrollment counts and completion-credit logic | Qualify earned/credited states; organization-name fields are not organizational adoption |
| Decision Spellchecker software | Candidate code and test evidence | NO_GO_NOT_VERIFIED; no released product or production performance warranty |
| Sale or evaluation demand | Direct documented qualifying commercial correspondence or executed instruments | Not established by downloads; require actual buyer response and offer/terms |
| Conveyable intellectual-property rights | Asset register and identified co-author/third-party limitations | Transaction-specific review necessary before claims of exclusive, clean title |

## Verification requirements and stop rules

- Automated synthetic tests `node tests/download-traffic-quality.mjs` and `node tests/asset-evidence-integrity.mjs` must pass on the final head, alongside the owner-access and public-route CI suite.
- In the protected preview, compare live `geo-stats.quality` against `asset-stats.open_engagement.download_scope_bridge` at close observation times. Confirm no endpoints silently return zeros on partial reads and no DELETE happens on a tracked resource request.
- On a phone, check navigation, table labels, empty/error state and sign-in/session boundaries. Verify the owner page cannot be served before owner authentication and private API reads reject anonymous access.
- The read-only Supabase RLS/anonymous-permission audit remains unperformed in live Supabase, and `OWNER_DASHBOARD_TOKEN`, Turnstile and notifier verification remain stated release blockers on the PR #48 runbook. Do not merge merely because GitHub Actions is green.
- Retain the 2026-08-13 old Sale Dossier as historical evidence only. Its technical and commercial claims are not a present-day acquisition prospectus.
- Buyer materials must omit personal identifiers, restricted answer keys, unresolved trademark representations and proprietary data unless independently approved for the exact transaction scope.

**Decision:** The owner reporting and methods can be improved without changing the underlying JRS research or creating fictitious market evidence. Software production release, actual user adoption and a credible licensing/acquisition offer are separate, unmet requirements.

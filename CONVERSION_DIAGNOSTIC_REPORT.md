# Conversion & Friction Diagnostic Report

**Site:** jrsstandard.com
**Generated:** 2026-08-11 (supersedes the 2026-08-09 edition)
**Sources:** `interaction_events` (344 rows, 2026-07-10 to 2026-08-10), `/api/gate-stats`, `/api/access-stats`, `/api/contributor-stats`, `/api/asset-stats`, `/api/support-stats`, `/api/enroll-stats`, `/api/geo-stats`, `/api/orgpilot-stats`
**Window:** gate telemetry counts from `gate_start` 2026-08-02 forward. Everything before that date was anonymous and cannot be attributed.

---

## Headline

The three instruments the last report asked for are now live and reporting. Two of the four questions in this brief can be answered with real numbers. Two cannot, and the reason is the finding: **since field-level and device telemetry shipped on 2026-08-09, every single gate view has been a search-engine crawler. Not most. All six.**

That is not an instrumentation failure. The instruments fired correctly on every request they saw. There were no humans to see.

---

## 1. Field Abandonment

### 1.1 What the instrument has recorded

| Measure | Value |
|---|---|
| `field_touched` events, all time | **1** |
| Gate views since the instrument shipped (2026-08-09 15:45 UTC) | **6** |
| Of those views, identified as crawlers by user agent | **6 of 6** |
| Human views in the instrumented window | **0** |
| Human field touches | **0** |

The single event, in full:

| Field | Value |
|---|---|
| `field_name` | `f-name` |
| `mode` | guide |
| `src` | site |
| `country` | CN |
| `is_mobile` | false |
| `user_agent` | `Mozilla/5.0 (compatible; Baiduspider-render/2.0; +http://www.baidu.com/search/spider.html)` |
| Timestamp | 2026-08-10T07:55:22Z, one second after the same crawler's page view |

Baidu's renderer executes page JavaScript, focuses the first input while laying out the form, and fires the ping. It is a real event from the instrument's point of view and a null from the business point of view.

### 1.2 The breakdown you asked for, and why it is empty

| Field | Position | Touches | Share |
|---|---|---|---|
| `f-name` | 1 | 1 (crawler) | n/a |
| `f-email` | 2 | 0 | n/a |
| `f-org` (optional) | 3 | 0 | n/a |
| `c-contact` (required consent) | 4 | 0 | n/a |
| `c-registry` (Registry consent) | 5 | 0 | n/a |

**Zero human observations.** No share column can be computed and none should be estimated.

### 1.3 A limitation worth stating before the data arrives

The brief asks which field a user reaches **before dropping off**. The instrument as built cannot answer that, and will not be able to when traffic returns.

`field_touched` fires **once per page session, on the first field touched**, and then sets a `sessionStorage` flag that suppresses every later touch. It therefore records an **entry point**, not a **depth**. A reader who fills name, email and organization and then abandons at the consent checkbox is recorded under `f-name`, identical to a reader who focused the name field and immediately left.

That was a deliberate trade at build time: one ping per session instead of one per field keeps the write volume low and keeps the log from becoming a keystroke-level record of a form nobody submitted. It is the right privacy posture. It is also the wrong shape for the question being asked here.

**To answer the question as posed, the instrument needs a second ping: a last-field-touched event, or a `navigator.sendBeacon` on `visibilitychange` carrying the deepest field index reached.** That is a small change, roughly fifteen lines, but it is a change and it has not been made. It should not be made now: shipping a second instrument into a window with zero human traffic will produce a second empty table. Ship it when there is traffic to measure, and prove the traffic first.

### 1.4 What the last report attributed to friction

The 2026-08-09 edition flagged 18 guide-route views with 0 completions as the one cleanly isolated friction point. That figure now stands at **20 views, 0 completions**. The two additional views are both crawlers. The reading in the previous report, that the guide gate was the friction, is **no longer supported and is not disproven**. It is untested. The guide route has had no observed human traffic since the fix shipped.

---

## 2. Device Breakdown

### 2.1 Coverage

Device capture (`is_mobile`, computed server-side from the user agent so client claims cannot skew it) shipped 2026-08-09 15:45 UTC. It covers a small tail of the event history.

| Source | Rows | Carrying a device flag | Coverage |
|---|---|---|---|
| `gate-view` | 102 | 7 | 6.9% |
| `honor-link` | 3 | 3 | 100% |
| `contributor-link` | 0 | 0 | n/a |
| **Total** | | **10** | |

### 2.2 The split, before and after removing crawlers

| Cut | Mobile | Desktop | Mobile share |
|---|---|---|---|
| All device-flagged rows | 8 | 2 | 80.0% |
| **Crawlers removed** | **3** | **0** | **100%** |
| Distinct human devices behind those 3 rows | **1** | 0 | |

**The 80% mobile figure currently published by `/api/asset-stats` is a crawler artifact.** Seven of the ten flagged rows are Googlebot, GoogleOther or Baiduspider, and Googlebot's smartphone user agent classifies as mobile, which is what put the mobile count at 8. Do not carry the 80% into any diligence document.

The three genuinely human device rows are all one person:

| Field | Value |
|---|---|
| Rows | 3 page loads |
| Distinct people | 1 |
| Device | iPhone, iOS 18.7 |
| Browser | LinkedIn in-app browser (`[LinkedInApp]/9.32.2674`) |
| Country | US |
| Link | `honor-link`, code H-2026-01 |
| Window | 2026-08-10 11:10:04 to 11:14:06 UTC |

### 2.3 Conversion by device: not computable, and the reason is structural

Conversion needs a numerator and a denominator that carry the same flag. This one does not, for a reason that will not resolve on its own:

- The **denominator** (gate views) has carried a device flag only since 2026-08-09.
- The **numerator** is one registration, dated **2026-08-04**, five days before capture existed. It carries no device flag and never will.

So `mobile conversion` and `desktop conversion` are both **undefined**, not zero. The registration POST path in `api/access.js` does now write `user_agent` and `is_mobile` onto the contact row, so **registration number two onward will be attributable**. Registration number one is permanently unclassifiable.

**One signal survives all of this and is worth acting on.** The only human page load in the entire instrumented window came through the **LinkedIn in-app browser on a phone**. That is consistent with the traffic mix already known: LinkedIn is 62 of 101 gate views, 61.4%, nearly five times the next channel. The in-app browser is a constrained environment, and it is the environment that previously broke the terms link on this same gate. Every gate change should be checked there first, on a phone, in the LinkedIn app, not in a desktop browser.

---

## 3. Outbound Link Opens

### 3.1 The three link systems

| System | Links issued | Links **sent** | Opened | Completed the action | Open rate on sent | Completion rate on opened |
|---|---|---|---|---|---|---|
| Honor | 34 | **1** | **1** | **1** (accepted) | **100%** | **100%** |
| Contributor | 20 | **0** | 0 | 0 | n/a | n/a |
| Blind second read | 3 | **0** | 0 | 0 | n/a | n/a |
| **Total** | **57** | **1** | **1** | **1** | | |

### 3.2 Reading these numbers correctly

`/api/asset-stats` publishes `acceptance_rate_pct: 2.9` for the honor system. That is 1 acceptance over 34 **issued** links. It is arithmetically right and it will be read wrong by anyone who does not read the accompanying note, because **33 of the 34 links have never been sent to anyone**. They are held pending close of the comparison study. All 20 contributor links are likewise unsent.

Against links that were actually delivered, the honor system has a **100% open rate and a 100% acceptance rate**, on a sample of one. Both framings are true. The denominator has to travel with the number.

The three page loads on the one open are a single person over four minutes, not three visits. Counted as distinct people the figure is 1, which is how `asset-stats` reports it and is the correct treatment.

### 3.3 Certificate downloads: zero, and this one is fine

`honor-cert` shows **0 downloads** against 1 acceptance. That is not a drop-off. The certificate for H-2026-01 is being delivered as an email attachment, owner-side, not through the download endpoint. The endpoint measures a channel that is not being used for this recipient.

**Two things follow.** First, do not report `certificates_issued: 0` as a conversion failure; it is a channel mismatch. Second, and more useful: an emailed attachment produces **no open signal at all**, whereas the download endpoint produces one. If the point of these links is to generate evidence of professional engagement for an asset sale, the certificate should be delivered as a link to `honor-cert`, not as an attachment. That converts a silent send into a measured one at no cost to the recipient.

### 3.4 The reviewer evaluation suite

| Stage | Count |
|---|---|
| Evaluation page opens | **0** |
| Submissions | **0** |
| Completed all 9 questions | **0** |
| Transferable contacts captured | **0** |

The suite is built, instrumented end to end, and has never been sent to anyone. Every figure is a true zero rather than a missing measurement.

---

## 4. Overall Funnel

### 4.1 Gate: views against completed registrations

| Stage | Count |
|---|---|
| Form views | **101** |
| Completed registrations | **1** |
| Abandoned | **100** |
| **Overall conversion** | **0.99%** |

**Correction to the published figure.** `/api/gate-stats` reported `form_views: 102` at the time of this analysis. That was a defect: the endpoint counted every row with `source = 'gate-view'` as a view without checking `type`, so the single `field_touched` row landed in the view count and therefore in the conversion denominator. Fixed in this pass. The error was one row today; it would have compounded once field touches became common, since every reader who touched a field would have added a phantom abandonment and pushed the reported conversion rate down. Field touches are now reported separately as `field_touches`, `field_touches_by_field` and `started_form_pct`.

### 4.2 Conversion by route

| Route | Views | Registrations | Conversion |
|---|---|---|---|
| Campaign gate (support mode) | 81 | 1 | **1.2%** |
| Guide gate | 20 | 0 | **0.0%** |
| **Total** | **101** | **1** | **0.99%** |

### 4.3 Movement since the last report

| Measure | 2026-08-09 | 2026-08-11 | Change |
|---|---|---|---|
| Form views | 95 | 101 | +6 |
| Registrations | 1 | 1 | **0** |
| Conversion | 1.1% | 0.99% | falling |

All six new views are crawlers. **The numerator has not moved in seven days.** Conversion is falling for the same arithmetic reason it was falling at the last report: the denominator grows and the numerator does not.

### 4.4 Views by day

| Date | Support | Guide | Total | Registrations |
|---|---|---|---|---|
| 2026-08-04 | 3 | 0 | 3 | **1** |
| 2026-08-05 | 13 | 2 | 15 | 0 |
| 2026-08-06 | 16 | 3 | 19 | 0 |
| 2026-08-07 | 7 | 0 | 7 | 0 |
| 2026-08-08 | 31 | 13 | 44 | 0 |
| 2026-08-09 | 7 | 0 | 7 | 0 |
| 2026-08-10 | 4 | 2 | 6 | 0 |

### 4.5 A caution on the 101

The deploy-check guard on gate telemetry shipped **2026-08-10 13:23 UTC**, and user-agent capture shipped **2026-08-09 15:45**. Neither existed for the first six days of this window, so for 95 of the 101 views there is no way to separate a reader from a crawler or from owner-side validation of the form.

Two things suggest the 101 is soft. **32 of the 101 views arrived within 60 seconds of the previous view**, including runs at one-second intervals on 2026-08-08 during the window when the gate was being reframed and redeployed. And in the only window where identity is observable, the crawler share is 100%.

**The 101 should be treated as an upper bound on human views, and a loose one.** It is not wrong to publish, but it should never be published without the note. The forward figure, from 2026-08-10 onward, is clean: guarded, user-agent attributed, and separable.

### 4.6 The other funnels, for contrast

The gate is the weak instrument. It is not the whole picture, and the difference is instructive.

| Funnel | Volume | Note |
|---|---|---|
| Endorsement widget (`support`) | **40** endorsements, 7 countries | No form, one click, no consent gate |
| Guide downloads (registered) | **63** across 3 editions, 7 countries | |
| Public artifact downloads, all | **160** | |
| Training enrollments | 7 enrolled, **7 completed**, 5 countries | **100%** completion once started |
| Research participation | **34** full-set completers | |
| Org pilot | **0** organizations | Never sent |

**The pattern is consistent and it is the most actionable thing in this report.** Every surface that asks for a click converts. Every surface that asks for a form does not. Forty people endorsed with one click. One hundred and sixty artifacts were downloaded. Seven of seven people who started training finished it. One person out of at most 101 completed the gate form.

The gate is not underperforming because of a field, a label, or a consent checkbox. Those were the hypotheses in the last report and field-level telemetry was built to test them. It has now been live for two days and has not tested them, because the traffic stopped. **The gate's problem is currently a traffic problem, not a conversion problem**, and no amount of form optimization addresses it.

---

## 5. What this changes

1. **Do not publish the 80% mobile figure.** It is seven crawlers and three loads from one iPhone. `/api/asset-stats` already labels its device split as a partial denominator; it should also exclude crawler user agents before counting.
2. **Do not publish conversion by device.** It is undefined, not zero, and will stay undefined until registration number two.
3. **Publish honor engagement as 1 of 1 sent, never as 1 of 34 issued**, or publish both with the note attached.
4. **Deliver the honor certificate as a link rather than an attachment.** It is the difference between a send you can evidence and one you cannot.
5. **Do not build more gate instrumentation yet.** The last-field-touched ping in section 1.3 is the right next instrument and the wrong next task. Two instruments now sit live over a window with zero human traffic.
6. **The measurable question is traffic, not friction.** LinkedIn is 61.4% of all gate views and the only human device observed came through the LinkedIn in-app browser on a phone. That is where both the traffic and the testing belong.

---

## 6. Defects found and fixed in this pass

| Defect | File | Effect | Status |
|---|---|---|---|
| `field_touched` rows counted as form views | `api/gate-stats.js` | Inflated the conversion denominator; would have compounded with real traffic | **Fixed.** Type check added; touches reported separately |
| `f-title` listed in the field-touch array | `access.html` | Hidden input, cannot receive focus, could never fire the ping | **Fixed.** Removed from `FIELDS` |

---

## 7. Provenance

Every figure above is computed from live production data pulled 2026-08-11 02:49 UTC. `interaction_events` was read directly through the anon-readable view (344 rows, complete history). Aggregate and RLS-protected figures were read from the live endpoints on `jrsstandard.com`. Crawler classification is by user-agent match on `bot`, `spider`, `crawl`, `slurp`, `GoogleOther` and `preview`, applied at analysis time only. Nothing in this pass wrote to the database.

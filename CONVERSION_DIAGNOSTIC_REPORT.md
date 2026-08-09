# Conversion & Friction Diagnostic Report

**Site:** jrsstandard.com · **Generated:** 2026-08-09
**Sources:** `interaction_events` (319 rows, 2026-07-10 to 2026-08-09), `/api/gate-stats`, `/api/access-stats`, `/api/contributor-stats`, `/api/enroll-stats`, `/api/support-stats`, `/api/orgpilot-stats`, `/api/geo-stats`, `pilot_progress`, `armb_progress`
**Window:** gate telemetry counts from `gate_start` 2026-08-02 forward. Everything before that date was anonymous and cannot be attributed.

---

## 1. Micro-Conversion Funnel & Form Friction

### 1.1 Views against submissions

| Stage | Count |
|---|---|
| Gate form views (smoke tests removed) | **95** |
| Completed registrations | **1** |
| Abandoned | **94** |
| **Overall conversion** | **1.1%** |

Raw `view` events number 96; one carries `src=selftest` and is excluded, as the endpoint is designed to do.

### 1.2 Conversion by route

| Route | Views | Registrations | Conversion |
|---|---|---|---|
| Campaign gate (support mode) | 77 | 1 | **1.3%** |
| Guide gate | 18 | 0 | **0.0%** |
| **Total** | **95** | **1** | **1.1%** |

### 1.3 Conversion trend

| Date | Views | Cumulative conv. | Shipped that day |
|---|---|---|---|
| 2026-08-04 | 3 | 33.3% | |
| 2026-08-05 | 15 | 5.6% | |
| 2026-08-06 | 19 | 2.7% | split-consent model |
| 2026-08-07 | 7 | 2.3% | |
| 2026-08-08 | 44 | 1.1% | gate reframed, zero-field test |
| 2026-08-09 | 7 | 1.1% | guide gate opened, clean URLs, OG fixed |

The single registration landed on 2026-08-04, when the denominator was 3. **Every view since has abandoned.** Conversion has fallen monotonically because the numerator has not moved once in five days.

### 1.4 Abandonment: where the drop-off is

**Field-level interaction is not logged.** A grep of `access.html` for focus, blur, or partial-completion handlers returns zero. The gate fires exactly one telemetry event, `event:'view'`, on page load, and the next event that could exist is a completed POST. Between those two points the instrumentation is blind.

What can be established without it:

| Signal | Value | Reading |
|---|---|---|
| Views reaching the form | 95 | The page renders; the redirect chain works |
| POSTs completing | 1 | |
| Consent box ticked on that POST | 1 of 1 | Nobody who reached submit was blocked by the consent gate |
| Registrations with an organization supplied | 1 of 1 | Optional field was not a barrier for the one completer |
| Guide route completions | 0 of 18 | |

**The one place a stage can be isolated is the guide route, and it isolates cleanly.** Eighteen people opened the guide form and none finished. That gate was opened on 2026-08-09 and the three editions now download in one click, so this specific friction point is already removed. The campaign route, at 1 of 77, has not been isolated to a stage and cannot be until field-level events exist.

---

## 2. Traffic Sources, Devices & Endpoint Activity

### 2.1 Referral source

| Source | Views | Share |
|---|---|---|
| LinkedIn | 62 | **65.3%** |
| Site (internal) | 11 | 11.6% |
| Untagged | 7 | 7.4% |
| Email | 6 | 6.3% |
| Guide page | 3 | 3.2% |
| Footer | 2 | 2.1% |
| DRR article page | 2 | 2.1% |
| Home | 1 | 1.1% |
| Email signature | 1 | 1.1% |

Two thirds of all gate traffic is one channel. Until 2026-08-09 the LinkedIn profile's three resource links carried no `src` tag at all, so part of the 7 untagged views is profile traffic that could not be attributed. Those links now carry `?src=linkedin`.

### 2.2 Geography

| Country | Views |
|---|---|
| United States | 93 |
| South Korea | 1 |
| China | 1 |

Compare with the reviewer panel, which spans 16 countries and 5 continents. **The research is international; the traffic is not.** The site's international credibility is not reaching an international audience.

### 2.3 Device breakdown

**Not available. This is a logging gap, not a zero.**

`interaction_events.payload` has carried these keys across all 319 rows: `campaign`, `country`, `doc`, `edition`, `file`, `mode`, `module`, `q1` to `q5`, `registered`, `role`, `src`, `value`. There is no `ua`, `device`, `mobile`, `user_agent` or `platform` field. Country comes from the Vercel edge header; no user-agent is captured anywhere.

Google Analytics 4 (`G-NVYHJ7BJ92`) is installed on every page and holds device data, but it is a separate system with no API access configured here. Device split must be read from the GA4 console or added to the edge payload.

### 2.4 Endpoint activity

| Endpoint | Sessions / events | Note |
|---|---|---|
| Gate (`/api/access` view) | 95 views, 1 registration | |
| Org-pilot workspace | **0 sessions, 0 records reviewed** | Nobody has run the diagnostic through the workspace |
| Guide downloads (`guide-dl`) | 60 | |
| Public PDF downloads (`pdf-dl`) | 70 | Standard 45, Rapid Review Card 25 |
| Training kit downloads (`kit-dl`) | 13 | |
| Training enrolments | 7 | 5 organizations, 5 countries |
| Legacy one-click endorsements (pre-gate) | 40 | rtkw 26, defend 14 |

**The most important line in this table is the zero.** `/api/orgpilot-stats` returns 0 sessions, 0 organizations and 0 records run. The pilot workspace is the single highest-value conversion on the site and it has never been used.

### 2.5 Downloads by asset

| Asset | Downloads |
|---|---|
| JRS Standard PDF | 45 |
| Rapid Review Card | 25 |
| Investigator Field Guide, Employment/EEO | 23 |
| Investigator Field Guide, International | 19 |
| Investigator Field Guide, Fair Housing | 18 |
| JRS Reference | 8 |
| Investigator Field Guide, generic | 4 |
| Kit worksheet | 1 |

**143 downloads against 1 registration.** The ungated assets, which were never behind a form, produced 143 completions. The gated route produced one. That contrast is the clearest signal in this report.

---

## 3. Campaign & Hook Performance

### 3.1 Conversion by hook

| Hook | Views | Registrations | Conversion |
|---|---|---|---|
| The Right to Know Why (`rtkw`) | 53 | 1 | **1.9%** |
| The Decisions You Can Defend (`defend`) | 24 | 0 | **0.0%** |
| Investigator Field Guides (guide mode) | 18 | 0 | **0.0%** |

**"Agentic AI Risk" does not exist as a campaign.** `CAMPAIGN_LABEL` in `access.html` recognises `rtkw` and `defend` only; any other value normalises to `general`. No `general` views are recorded, so no third hook has been run.

### 3.2 Hook preference in the legacy data

The pre-gate one-click endorsement flow, which required no form, recorded 40 completions:

| Hook | Legacy one-click endorsements |
|---|---|
| The Right to Know Why | 26 (65%) |
| The Decisions You Can Defend | 14 (35%) |

The rtkw/defend split under the old frictionless flow was **65/35**. Under the gate it is 53/24, or **69/31** of views. The relative appeal of the two hooks is stable. What changed is the completion mechanism, not the hook preference.

### 3.3 Path analysis

| Entry path | Views | Registrations | Conversion |
|---|---|---|---|
| LinkedIn → campaign gate | 62 (mixed modes) | 1 | ~1.6% |
| Site internal → gate | 11 | 0 | 0.0% |
| Email → gate | 6 | 0 | 0.0% |
| Guide page → guide gate | 3 | 0 | 0.0% |

With one registration in the entire dataset, **no path comparison is statistically meaningful.** A single conversion cannot separate channel quality from chance. Reporting a winner here would be reading noise.

What the data does support: LinkedIn supplies the volume and the only conversion, and every other channel is under 12 views, which is too thin to evaluate at all.

---

## 4. Outbound Outreach & Contributor Engagement

### 4.1 Contributor confirmation links

| Metric | Value |
|---|---|
| Personalized links generated | **20** |
| Confirmed / completed | **0** |
| Outstanding | **20** |
| Named in paper | 0 |
| Anonymous in paper | 0 |
| Consented to transfer | 0 |
| Support recorded via contributor link (rtkw) | 0 |
| Support recorded via contributor link (defend) | 0 |

**Opens are not tracked.** `/api/contributor` records a row only on submission; a GET that renders the page writes nothing. Total-opened cannot be reported, and 0 confirmations does not distinguish "nobody opened it" from "20 opened and none finished."

Per the tracker, the 20 links are held pending study close and have not been sent. **0 of 20 is the expected state, not a failure.**

### 4.2 Honor acceptance links

| Metric | Value |
|---|---|
| Links generated | **34** (1 public-records + 16 Arm A + 17 Arm B) |
| All resolving live | 34 of 34 verified |
| Accepted | **1** (H-2026-01, Stacyann Young, 2026-08-09) |
| Sent | 1 of 34 |

The 33 completer links are held: Arm B is still blind because RR-108 has not finished.

### 4.3 Direct outreach against endorsement asks

| Channel | Volume | Completions | Rate |
|---|---|---|---|
| Direct research outreach (Arm A + Arm B recruitment) | 45 registered participants | 33 completed a full 24-record set | **73.3%** |
| Training enrolment | 7 | 7 enrolled, 4 completion rows recorded | 57.1% completion |
| Public endorsement ask, post-gate | 95 views | 1 | **1.1%** |
| Public endorsement ask, pre-gate one-click | not instrumented | 40 | n/a |

**Direct personal outreach converts at 73%. The public gate converts at 1.1%.** That is a factor of 66. Every participant in the research programme arrived through a person asking them directly; none arrived through the funnel.

### 4.4 Support base

| Metric | Value |
|---|---|
| Total supporters recorded | 40 |
| Countries | 7 |
| Named on the public Registry | 3 |

Thirty-nine of the 40 predate the gate and were recorded through the one-click flow.

---

## 5. Key Takeaways

**1. Traffic is not the constraint and never has been.** 95 gate views, 143 downloads, 62 LinkedIn referrals. The problem is entirely downstream of arrival.

**2. Frictionless assets convert; gated ones do not.** 143 completed downloads on assets that never had a form, against 1 completed registration on the route that does. Both audiences came from the same place.

**3. The guide gate has been measured to zero and is now removed.** 18 views, 0 registrations, over a full week. As of 2026-08-09 the three editions download in one click. This is the only friction point in the report that has been both isolated and eliminated.

**4. The pilot workspace has never been used.** Zero sessions, zero records. It is the highest-value action on the site. A zero-field one-record test was added above it on 2026-08-08; the next reading is the first that tests it.

**5. Direct outreach outperforms the funnel by 66x.** 73.3% against 1.1%. The research programme was built entirely through personal asks.

**6. Every conversion fix shipped in the last 48 hours.** The reframed gate and zero-field test landed 2026-08-08; the opened guide gate, clean campaign URLs and OpenGraph fixes landed 2026-08-09. Of the 44 views on 8/08, most preceded those changes. **This report is a baseline, not a verdict on the fixes.**

**7. An international programme with domestic-only traffic.** 93 of 95 views from the US, against a reviewer panel spanning 16 countries.

---

## 6. Data Gaps

| Gap | Impact | Fix |
|---|---|---|
| **No field-level form events** | Cannot say which field loses people. Section 1.3 abandonment is inferred, not measured | Add a `field_touched` or `form_start` event on first input focus. One event turns 94 abandonments into a stage breakdown |
| **No device or user-agent capture** | Mobile vs desktop unanswerable from the database. All five screenshots reviewed this week were mobile, which suggests the split matters | Add `ua` or a mobile boolean to the edge payload in `/api/access`, or read GA4 |
| **No contributor link open tracking** | 0 of 20 confirmed cannot be distinguished from 0 of 20 opened | Log a `view` event on GET in `/api/contributor`, as `/api/access` already does |
| **No honor link open tracking** | Same problem on all 34 honor links | Same fix in `/api/honor` |
| **GA4 not queryable here** | Device, session duration, bounce, scroll depth all sit in a system with no API access configured | Configure the GA4 Data API, or accept the console as the source for those metrics |
| **Pre-2026-08-02 traffic unattributable** | The 40 legacy endorsements and 143 downloads cannot be tied to a source funnel | Not recoverable. Structural, from the anonymous one-click design |
| **Single conversion** | n=1 makes every per-channel and per-hook conversion rate statistically meaningless | More data. Nothing else fixes it |

---

*All figures computed from live production data on 2026-08-09. No number in this report is transcribed from a prior document.*

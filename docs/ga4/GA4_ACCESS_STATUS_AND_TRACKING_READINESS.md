# JRSSTANDARD GA4 Business Usability Assessment

**Date:** 2026-09-13 · **Requested property:** JRSSTANDARD, **Property ID 538695923**

---

# CONNECTION STATUS: NOT ESTABLISHED

**I could not connect to GA4 property 538695923, and I have not produced an analysis of
data I cannot see.** Per the access rule in the brief, I am stopping at this point rather
than fabricating figures.

## What I verified, rather than assumed

| Access path | Result |
|---|---|
| Google Analytics MCP connector | **Not available.** The session exposes Google Drive, Supabase, GitHub and Re:port Flow only |
| `gcloud` CLI | **Absent** |
| `bq` / `gsutil` | **Absent** |
| Python GA4 Data API library (`google.analytics.data_v1beta`) | **Absent** |
| `GOOGLE_APPLICATION_CREDENTIALS` | **Not set** |
| `GA4_PROPERTY_ID`, `GOOGLE_ANALYTICS_KEY`, `GA_SERVICE_ACCOUNT` | **Not set** |
| `~/.config/gcloud` | **No directory** |
| GA4 Data API endpoint reachability | **Reachable: HTTP 401.** The network path works; there is no authentication |

**The HTTP 401 is the decisive result.** The API is reachable from this environment and
rejected the request for lack of credentials. This is an authorization gap, not a
network or configuration fault.

**No users, sessions, engagement figures, landing pages, acquisition sources, events or
conversions are reported anywhere in this document, because none were retrieved.**

## What is required to establish access

**One of the following, in order of practicality:**

1. **A Google Analytics connector enabled for this session**, authorized against the
   Google account that holds at least *Viewer* on property 538695923. This is the
   cleanest route and requires no credentials to be handled here.
2. **A service account with the GA4 Data API enabled**, granted *Viewer* on the property,
   with the JSON key made available to the runtime as `GOOGLE_APPLICATION_CREDENTIALS`.
   **I have not requested, and will not request, that key be pasted into this
   conversation.**
3. **A manual export.** Run the reports in the GA4 UI for the last 30 complete days and
   the prior 30, export to CSV, and place them in the workspace. **This requires no
   credential sharing at all and I can analyse the exports immediately.**

**Minimum export set that would answer the eleven business questions:** Traffic
acquisition (session source/medium), Landing pages, Pages and screens, Events, Key
events, Device category, and New versus returning, each for both periods.

---

# DATA-QUALITY CHECK: performed on what I *can* observe

The brief asks me to determine whether tracking appears active before interpreting
anything. I checked the deployed site directly. **These findings are independent of GA4
access and are actionable now.**

## Finding 1: the tag is live and consistent — **ESTABLISHED FINDING**

A single measurement ID, **`G-NVYHJ7BJ92`**, appears **87 times** across the repository,
and the tag is present on every live page I sampled (`/`, `check.html`, `research.html`,
`pilot.html`, `training.html`).

**Business meaning: the site is being measured, and it is being measured consistently.
There is no second, competing tag fragmenting the data.**

**Caveat I cannot resolve without access:** `G-NVYHJ7BJ92` is a *measurement ID*.
Property **538695923** is a *property ID*. These are different identifiers and can belong
to the same property, but **I cannot confirm the tag on this site feeds the property
named in the brief.** That should be confirmed in the GA4 admin screen before any
analysis is trusted. **Classification: INSUFFICIENT DATA.**

## Finding 2: eleven pages carry no live tag, and most of that is deliberate — **ESTABLISHED FINDING**

| Page | Tag | Assessment |
|---|---|---|
| `acquisition-9f3c2a7d4b.html` | none | **Deliberate.** Private owner surface |
| `vp-7c1f9a4e8d2b6035.html` | none | **Deliberate.** Private owner surface |
| `people.html` | none | **Deliberate.** Renders participant data |
| `programme-status-9872fb93cc94.html` | **removed 2026-08-12, documented in the source** | **Deliberate and correct** |
| `access.html` | none | **Verify intent** |
| `coauthor.html` | none | Likely deliberate: consent flow |
| `contributor.html` | none | Likely deliberate: consent flow |
| `honor.html` | none | **Verify intent** |
| `org-pilot.html` | none | **Verify intent** |
| `recheck.html` | none | **Verify intent** |
| `supported.html` | none | **Verify intent** |

**A note on method.** My first count flagged the private status page as *tagged*. Reading
the file showed the single occurrence is a **comment recording that the tag was
deliberately removed on 2026-08-12**, because the page renders names, organisations and
countries of real participants including some whose public-consent flag is false. **There
is no gtag script and no config call.** The governance holds; my count had matched prose.
I record this because it is exactly the kind of false positive that becomes a wrong
recommendation if not checked.

**Business meaning.** Four of the eleven are correct privacy decisions and must not be
"fixed". **Five to seven are participant-facing pages whose intent should be confirmed
by you.** If any is untagged by accident, GA4 has a blind spot on a real user journey,
and any funnel analysis built on GA4 alone will under-count those paths.

## Finding 3: conversions cannot be assessed — **INSUFFICIENT DATA**

Whether key events are configured in property 538695923 is not determinable from outside.
**I will not estimate a conversion rate.**

---

# WHAT CAN BE ANSWERED TODAY WITHOUT GA4

**This is not a consolation prize. This site carries substantial first-party
instrumentation that GA4 does not duplicate**, and several of the brief's eleven
questions are answerable from it immediately.

| Question | First-party source | Available now |
|---|---|---|
| Where are visitors coming from? | `?src=` channel tags stored on interaction rows | **Yes** |
| What are they downloading, and from where? | `/api/geo-stats`: **163 guide downloads across 19 countries**, by day, by edition, by country | **Yes** |
| Which assets earn engagement? | `/api/asset-stats`, per-asset with country split | **Yes** |
| Do enterprise inquiries arrive, and convert? | `/api/checkout-stats`: pay-screen arrivals, fallback leads, inquiries | **Yes** |
| Do campaign arrivals endorse? | `/api/support-stats`: per-day series, campaign attribution, and an outage disclosed rather than hidden | **Yes** |
| Do reviewers who start, finish? | `pilot_progress`, `armb_progress`, per-code completion | **Yes** |
| Who is visiting, demographically? | — | **No. GA4 required** |
| Page-level engagement time and scroll depth | — | **No. GA4 required** |
| Cross-page navigation paths | — | **No. GA4 required** |

**The material gap in the first-party data is the diagnostic funnel.** As recorded in the
GTM audit on 2026-09-13, twenty event sources exist and **none tracks `check.html`**, so
opens, completions and abandonment are unmeasurable in *either* system. **That gap is not
closed by connecting GA4**, because GA4 would show pageviews without step-level progress.

---

# RECOMMENDED SEQUENCE

**No website change and no GA4 configuration change has been made, and none is
recommended for automatic implementation.**

| # | Action | Effort | Why |
|---|---|---|---|
| 1 | **Confirm `G-NVYHJ7BJ92` belongs to property 538695923** in GA4 admin | Minutes | Every later conclusion depends on it |
| 2 | **Grant access, or export the seven reports to CSV** | Low | Unblocks the full assessment. The CSV route needs no credential sharing |
| 3 | **Confirm which of the seven participant-facing pages are untagged on purpose** | Low | Distinguishes a privacy decision from a blind spot |
| 4 | **Instrument the diagnostic** (`check-view`, `check-step`, `check-complete`) | Low | Closes a gap neither system covers. Reuses the existing `interaction_events` pattern |
| 5 | Re-run this assessment with data | — | Then, and only then, findings and recommendations |

**Validation, once a change is made:** compare the 30 days after against the 30 days
before, on the same metric, and treat a single week as an observation rather than a trend.
**Given this site's traffic volume, expect to need several weeks before a change can be
called an improvement rather than a fluctuation.**

---

# ASSESSMENT

**Overall:** cannot be given. The data was not retrieved.

**Confidence in this document:** **High for the tracking-readiness findings**, which were
verified directly against the deployed site. **Not applicable to traffic, engagement or
conversion**, none of which is reported here.

**Data limitations:** total. No GA4 data was accessed.

**Final status: SPECIFIC AUTHORIZATION REQUIRED. Analysis has not been performed and no
figures have been estimated.**

# JRS Data Flow Verification Report — 2026-09-15

**This report is the data-flow matrix produced on 2026-09-15, carried forward unchanged as
the verification record. Nothing in it was re-derived this cycle, because nothing in the data
flow changed: no route, no destination and no persistence behaviour was modified.**

**The word "stateless" is not used anywhere below without saying what is and is not retained**,
which is the §32 requirement.

---

# Actual Data Flow and Processor Matrix

**Date:** 2026-09-15 · **Method:** execution-path tracing plus read-only live database
inspection. **Classification is by traced execution path, never by the existence of code, a
hostname, a cron entry or a credential.**

---

## 1. Processor matrix

| Destination | Class | Evidence for the classification |
|---|---|---|
| **Vercel** | **ACTIVE** | Serves every request. No host string in code; it is the runtime |
| **Supabase** | **ACTIVE** | 22 pages POST directly with the publishable key; `api/*.js` write server-side |
| **Anthropic** | **ACTIVE** | `api/review.js`, `api/review-engine.js`, `api/v1/review-engine.js`, `api/sandbox.js` POST record text to `api.anthropic.com` |
| **Google Analytics 4** | **ACTIVE** | `googletagmanager.com` on **64** of 75 deployed pages |
| **Google Fonts** | **ACTIVE** | `fonts.googleapis.com` on **73** of 75 pages, including all three restricted surfaces. Fires on load, independent of analytics choice |
| **Formspree** | **ACTIVE** | One `action=` on `pilot.html` |
| **OpenAI** | **CLOSED RESEARCH SERVICE** | `api/run-study.js` is the only caller and returns on `STUDIES_CLOSED = true` **before any key is read**. Last `study_runs` row **2026-08-21**, matching `CLOSED_AT` |
| **Google Generative Language / Gemini** | **CLOSED RESEARCH SERVICE** | Same handler, same guard, same evidence |
| **Resend** | **DORMANT** | `ALERTS_ENABLED = false` at `_notify.js:66`; `notify()` returns at :193 **before** `E.RESEND_API_KEY` is read at :203 |
| **SendGrid** | **DORMANT** | Same function, same guard |
| **`api.jrsstandard.com`** | **ATTEMPTED / UNREACHABLE** | **No A record.** POSTed to by three pages; the request fails and the `.catch()` returns the data to the visitor as a download |
| `law.justia.com`, `docsopengovernment.dos.ny.gov`, `www.nycourts.gov`, `www.osc.ny.gov`, `www.linkedin.com`, `schema.org` | **REFERENCE ONLY** | Appear as URLs in content or stored strings; never fetched |

**The cron still fires nightly and writes nothing.** `vercel.json` schedules
`/api/run-study` at `0 6 * * *`; the handler returns `{ok:true, skipped:'studies_closed'}`.
A live cron is not evidence of an active processor, which is exactly why classification is by
execution path.

## 2. Traced paths

**Free review** (`index.html`, `training.html`, `check.html` engine panels → `/api/review`):
browser → Vercel → Anthropic → response. **`api/review.js` contains no Supabase call.** Record
text is transmitted and not stored.

**Versioned engine** (`/api/v1/review-engine`): browser or partner → Vercel → Anthropic →
response, **and** `logReview()` → Supabase `engine_reviews`, carrying `determination`, the five
`conditions` each with a `note` the prompt requires to be *grounded in the record text*, and
`finding.compliant_version`, **a model rewrite of the passage up to 600 characters**.
**Record text is not stored. Model output derived from the record is.**

**Sandbox** (`/api/sandbox`): browser → Vercel → Anthropic. **No Supabase write.** Stronger
than the versioned route, and `review-engine.html` says so correctly.

**Pilot contact form** (`pilot.html`): sensitive-identifier screen → Supabase `pilot_contacts`
**and** Formspree. Both destinations, one screen, screen runs first.

**Telemetry**: pages → `/api/telemetry` → Supabase `interaction_events` with `country` from
`x-vercel-ip-country` and `user_agent` truncated to 300 characters.

**Every page**: → Google Fonts on load. **64 of 75 also** → GA4.

## 3. Persistence, by class

| Class | Stored? | Where |
|---|---|---|
| Raw submitted record | **No** | Not written by any route |
| Model-generated per-condition notes | **Yes** | `engine_reviews.conditions` |
| Model-rewritten passage | **Yes** | `engine_reviews.finding.compliant_version`, ≤600 chars |
| Routing / determination | Yes | `engine_reviews.determination` |
| Behavioural telemetry | Yes | `interaction_events`, 2,280 rows |
| Contact details and free-text message | Yes | `pilot_contacts`, 59 rows |
| Study records | Yes | `bench_outcomes`, 54 rows |

## 4. Read exposure

**Anonymously readable** (`qual = true`): `interaction_events` (2,280), `bench_outcomes` (54),
`engine_reviews` (**0 rows**), plus the research tables the public pages read.

**Not anonymously readable:** **`pilot_contacts`** — INSERT policies only, no SELECT policy.
**The largest personal-data store is closed**, and that is as much a finding as the open ones.

Full analysis: `DATABASE_ACCESS_AND_EXPOSURE_REVIEW.md`.

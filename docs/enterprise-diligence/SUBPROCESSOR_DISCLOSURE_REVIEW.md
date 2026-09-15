# Subprocessor and External Service Disclosure Review

**Blockers:** B-009 (HIGH) and B-003 (MEDIUM) · **Date:** 2026-09-14
**Status: HUMAN APPROVAL REQUIRED.** No public privacy or legal representation was modified. No service was removed.

---

## Why this supersedes the earlier count

The register previously recorded **four** subprocessors and blocker B-003 said "four subprocessors are identified". **That was wrong.** Inspection of `api/` found outbound destinations that no register contained.

**Nothing was removed to make a finding disappear.** Every service found is recorded below.

## Two exposure classes, deliberately not collapsed

**CLASS A — VISITOR AND TELEMETRY DATA.** Data originating from a person browsing the site: IP address, user-agent, page path, referrer.

**CLASS B — CONSTRUCTED RESEARCH DATA.** Synthetic study records authored for the reproducibility study. Based on the inspected implementation these contain no personal data.

A processor in Class B is not thereby low-risk, and a processor in Class A is not thereby high-risk. They are different questions and a single count conflates them.

---

## CURRENT ACTIVE PROCESSORS

| Provider | Service | Class | Purpose | Data potentially transmitted | Evidence | Current disclosure | Gap |
|---|---|---|---|---|---|---|---|
| **Vercel** | Hosting, Edge Functions, cron | A | Serves the entire public estate | All request data; edge IP-country header | `vercel.json`, `server: Vercel` | Not named on any public page | **YES** |
| **Supabase** | Postgres | A | `interaction_events`, `pilot_contacts`, study tables | **Personal data**: names, emails, organisations, country | 22 references; `api/*.js` | Not named | **YES** |
| **Anthropic** | Model API | A + B | Review Engine inference; nightly study | Record text submitted for review; synthetic study records | `api.anthropic.com` in `api/` | Not named | **YES** |
| **Google** | GA4 analytics | **A** | Site analytics | **Visitor IP, user-agent, page data on essentially every public page** | `G-NVYHJ7BJ92` on **45** pages; `googletagmanager.com` ×64; live page confirms the request | `privacy.html` discloses "Google Analytics 4" and cookies | **PARTIAL** (GA4 named; Fonts not) |
| **Google** | Fonts | **A** | Webfont delivery | **Visitor IP on load, independently of analytics consent** | `fonts.googleapis.com` ×146, `fonts.gstatic.com` ×72, on **53** pages | Not disclosed | **YES** |
| **OpenAI** | Model API | **B** | Cross-vendor reproducibility study | Constructed synthetic records only | `api.openai.com` in `api/run-study.js`; run record names `openai:gpt-5` | Not named | **YES** |
| **Google** | Generative Language / Gemini | **B** | Cross-vendor reproducibility study | Constructed synthetic records only | `generativelanguage.googleapis.com` in `api/run-study.js`; run record names `google:gemini-flash-latest` | Not named | **YES** |
| **Formspree** | Form relay | **A** | `pilot.html` submissions | Whatever a submitter types | `formspree.io/f/mreddwdg` | Not named (E-019) | **YES** |

### Evidence that the cross-vendor providers are live, not hypothetical

`vercel.json` schedules `/api/run-study` at **`0 6 * * *`**, nightly at 06:00. The recovered snapshot record dated **2026-08-21** names all three providers: `anthropic:claude-opus-4-8`, `openai:gpt-5`, `google:gemini-flash-latest`, with `mode: cross_vendor`.

**Based on the inspected implementation and that record**, OpenAI and Google Generative Language have received data from this project in production. The optional keys are documented in `api/run-study.js` as the switch that turns the nightly probe into a cross-vendor run.

### What is sent to OpenAI and Gemini

`api/run-study.js` lines 29-38 define the corpus with the in-source comment: *"Constructed (synthetic) records… **None are real records; all are clearly labeled synthetic.**"* The records use invented names and invented events.

**Based on the inspected implementation, no personal data is transmitted to OpenAI or Gemini.** Stated as a bounded finding from source review, not as an absolute: it has not been verified against live outbound payloads, which would require an authorised production call.

---

## DORMANT SERVICES — NOT ACTIVE PROCESSORS

| Provider | Evidence of dormancy |
|---|---|
| **Resend** | `api/_notify.js`: *"notify() now returns before reading any key, so setting RESEND_API_KEY or SENDGRID_API_KEY in the environment does **NOT** re-enable sending."* |
| **SendGrid** | Same function, same guard |

**These must not be listed as active processors.** Code exists; the execution path returns before any credential is read. Recorded here so a future reader does not rediscover the code and assume transmission.

## CONTENT-REFERENCE SERVICES — NO OUTBOUND PERSONAL DATA

| Destination | Context | Finding |
|---|---|---|
| `law.justia.com` | `api/recheck.js` | Appears as a **reference URL**. The only outbound POSTs in that file are to Supabase |
| `docsopengovernment.dos.ny.gov` | `api/recheck.js` | Same |

---

## SECURITY AND PRIVACY IMPLICATIONS

1. **Google Fonts is the quietest gap.** It discloses visitor IP to Google **on page load, regardless of any analytics consent choice**, and appears on 53 pages. `privacy.html` discloses GA4 and cookies accurately but says nothing about Fonts.
2. **The disclosure page is not wrong, it is incomplete.** `privacy.html` names Google Analytics and describes "service providers… our database host and our analytics provider". It names no provider other than Google and does not name Vercel, Supabase, Anthropic, OpenAI or Formspree.
3. **Class B transmission is undisclosed but low-sensitivity**, on the evidence above.
4. **Formspree remains the anomaly**: a fourth-party relay receiving free-text submissions, undisclosed since E-019 recorded it.

## RECOMMENDED ACTIONS — none implemented

| # | Action | Type |
|---|---|---|
| 1 | Publish a subprocessor list naming all active processors by class | **Publication — human approval** |
| 2 | Disclose Google Fonts explicitly, or self-host the fonts | **Human decision** (engineering option documented separately, not performed) |
| 3 | Disclose the nightly cross-vendor study and its providers | **Human approval** |
| 4 | Correct B-003's "four subprocessors" | Mine, register-only |
| 5 | Record Resend and SendGrid as dormant so they are not re-flagged | Mine, register-only |

## HUMAN APPROVAL REQUIRED

> **DECISION 1.** Approve publishing a subprocessor disclosure, and its content. Publishing is a Section 23 publication and changes a privacy representation.
> **DECISION 2.** Google Fonts: disclose, or self-host to remove the disclosure. Self-hosting is an engineering change and is **not** authorised by this review.
> **DECISION 3.** Whether the nightly cross-vendor study's providers are named publicly.

**No public privacy or legal language was changed. No service was removed. No font was self-hosted.**

---

# ADDENDUM — 2026-09-15 · B-009 REMEDIATION

**Nothing above is edited.** The findings of 2026-09-14 stand as written. This
addendum records what changed, what was corrected, and what is still open.

## Reconciliation of the inventory

Re-counted on 2026-09-15. The provider set is unchanged. Two figures are corrected.

| Item | Recorded 2026-09-14 | Verified 2026-09-15 | Note |
|---|---|---|---|
| GA4 pages | 45 | **44 active** | Corrected, see below |
| Google Fonts pages | 53 | 53 of 55 | Unchanged. The two without are `404.html` and `people.html` |
| Formspree | `pilot.html` | `pilot.html` | Unchanged |
| Cross-vendor cron | `0 6 * * *` | `0 6 * * *` | Unchanged |
| Dormancy guard | present | present | `api/_notify.js` still returns before reading a key |

**CORRECTION.** OLD FINDING: the GA4 tag appears "on 45 pages". NEW EVIDENCE:
45 files contain the string `G-NVYHJ7BJ92`, but `programme-status-9872fb93cc94.html`
contains it only inside a comment recording the tag's deliberate removal, and that
page has zero `gtag(` and zero `googletagmanager` references. CORRECTED STATUS:
**GA4 is active on 44 pages.** EXPLANATION: the earlier count matched the tag ID as
a string rather than the loaded script.

## NEW FINDING — the restricted surfaces load Google Fonts

**FACT.** All three restricted surfaces reference `fonts.googleapis.com` and
`fonts.gstatic.com`:

| Surface | Class | Analytics tag | Google Fonts |
|---|---|---|---|
| `programme-status-9872fb93cc94.html` | Private owner | **No** (removed deliberately) | **Yes** |
| `acquisition-9f3c2a7d4b.html` | Confidential buyer | No | **Yes** |
| `vp-7c1f9a4e8d2b6035.html` | Confidential buyer | No | **Yes** |

Analytics was deliberately removed from the owner page. The font request was never
considered. The consequence is that **a visitor to a confidential buyer surface
discloses their IP address to Google on page load**, and the timing of that request
corresponds to the visit.

**This is a statement about a data flow, not a legal conclusion.** What it means
under any particular privacy regime is not determined here (Rule 8, Rule 9).

**No remedy was applied.** Self-hosting is not authorised. The access architecture
was not touched (Section 36.3). **REQUIRES HUMAN DECISION.**

## What was implemented

`privacy.html` only. Section 5 now names every active processor, grouped by what
each receives; section 8 states that opting out of analytics does not stop the
Google Fonts request; the last-updated date moved to 15 September 2026. Sections 6
to 10 were not renumbered and no unrelated language was changed.

Recommended actions 1, 3, 4 and 5 from the table above are now drafted. **Action 2
is partially addressed**: Fonts is disclosed; self-hosting was not performed and
remains the owner's decision.

## Guard

`check_zero_drift.py::check_every_active_processor_is_disclosed` works from the code
toward the disclosure, so an outbound call added later fails the suite rather than
passing unnoticed. Demonstrated failing on four real modes: the pre-fix policy, the
Fonts caveat removed, an unclassified new destination in `api/`, and the dormancy
guard removed from `api/_notify.js`.

## Still open

1. **Deployment.** Nothing is published. This is a Section 23 publication and needs
   owner authorisation.
2. **Restricted-surface fonts.** The new finding above.
3. **Self-hosting.** Not authorised, not performed.
4. **Processor agreements.** Whether a data-processing agreement exists with any of
   these providers is **NOT ESTABLISHED** from repository evidence. The disclosure
   deliberately makes no claim about it.

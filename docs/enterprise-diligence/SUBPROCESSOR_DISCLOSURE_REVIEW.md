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

---

# ADDENDUM 2 — 2026-09-15 · RED-TEAM CORRECTIONS

**Nothing above is edited.** Addendum 1 stands as written, including the figures it
got wrong, which are corrected here rather than overwritten (Rule 10).

An adversarial pass on the B-009 remediation found defects in the remediation itself.
The most serious was a **false statement published into the privacy policy**.

## CORRECTION 1 — OpenAI and Gemini receive nothing, and the disclosure said they do

**OLD FINDING** (addendum 1, and the section 5 text as first written): OpenAI and
Google Generative Language "receive records in a nightly study".

**NEW EVIDENCE.** `api/_study-status.js` sets `STUDIES_CLOSED = true` with
`CLOSED_AT = '2026-08-21'`, and `CLOSED_STUDIES` names the nightly cross-vendor run
explicitly. `api/run-study.js` returns on that flag **before** any key is read and
before the corpus is built. `api/run-study.js` is the only file containing
`api.openai.com` or `generativelanguage.googleapis.com`.

**CORRECTED STATUS.** Neither service has received anything since **21 August 2026**.
They belong in the not-running group.

**EXPLANATION, AND IT IS NOT FLATTERING.** Addendum 1's reconciliation table verified
the cron *schedule* and never the *handler*. The execution path was traced for
Resend and SendGrid and was not traced for `run-study.js`, so the genuinely dormant
pair was classified correctly and the other dormant pair was asserted as live. The
prior review's own evidence, a snapshot dated 2026-08-21, is dated the day the
studies closed.

## CORRECTION 2 — the page counts were short by 20 pages

**OLD FINDING.** GA4 active on 44 pages; Google Fonts on 53 of 55.

**NEW EVIDENCE.** The repository serves **75** HTML pages, not 55. The 20 not counted
are `reviewer/` and the `reference/` hub, and 18 of those URLs appear in `sitemap.xml`.

| Figure | Recorded | Correct |
|---|---|---|
| Deployed pages | 55 | **75** |
| GA4 active | 44 | **64** |
| Google Fonts | 53 of 55 | **73 of 75** |

The two pages without Fonts are still `404.html` and `people.html`.

**EXPLANATION.** Both the original count and my correction to it looked only at the
repository root. The `-1` for `programme-status-9872fb93cc94.html` was right; the
denominator was wrong in both passes.

## CORRECTION 3 — the first guard did not guard

Red-teamed and found to pass on five mutations: a section that **denied** using every
processor; the Vercel bullet deleted (Vercel has no host string and was not in the map
at all); a new client-side tracker added to a page; `ALERTS_ENABLED = true` with the
comment left intact, because dormancy was asserted against **prose**; and
`api.jrsstandard.com` classified as needing no disclosure on the false ground that it
is "not a POST target".

It also reintroduced `os.listdir(ROOT)`, scanning 55 of 75 pages, when `_html_files()`
already existed in the same file with a post-mortem attached describing that exact bug.

**Rebuilt.** Hosts are read from `api/` and from every page via `_html_files()`; name
tests run against the disclosure **section** rather than the whole file; denial phrasing
fails; hostless processors are named explicitly; dormancy is asserted against
`ALERTS_ENABLED = false` and `STUDIES_CLOSED = true` in code. All seven mutations now
fail, including the four that previously passed.

## NEW FINDING — `api.jrsstandard.com` does not resolve

`index.html`, `pilot.html` and `training.html` POST visitor input to
`https://api.jrsstandard.com/v1/verify-drift`, carrying a free-text observation note,
a selection, and survey answers respectively. **The host has no A record and the
request fails (HTTP 000).** The `.catch()` fallback hands the data back to the visitor
as a file download, which is the pattern CLAUDE.md 36.6 requires.

**This is also a drift finding.** CLAUDE.md 36.1 lists that URL as the canonical
"Backend endpoint". It is not implemented anywhere in this repository and it does not
resolve. Whether it is intended to exist is **NOT ESTABLISHED**. Recorded as **D-12**.

It is now disclosed on `privacy.html` as an attempted destination that is not reachable,
because the attempt is real even though the delivery is not.

## OTHER CORRECTIONS MADE TO THE DISCLOSURE TEXT

| Item | What was wrong | Now |
|---|---|---|
| Processing restriction | "which process data only to provide those services" was carried from a two-party sentence onto **eight named companies**, while the register says DPA status is NOT ESTABLISHED | Clause removed |
| Supabase | Enumerated only "what you submit", omitting telemetry: paths, country and truncated user-agent | States both |
| Anthropic | "not written to our database" is true of `api/review.js` but the versioned engine route stores model-written notes and a rewritten passage | States what is kept |
| Section 8 scope | "every time a page loads" against section 5's "nearly every page" | Made consistent |

## FINDINGS OUTSIDE THIS REMEDIATION'S SCOPE — RECORDED, NOT FIXED

These are live misrepresentations on pages STEP 6 did not authorise changing. Each
needs an owner decision.

1. **D-13.** `terms.html` and `engagement.html` both say the free record check
   "transmits nothing". `check.html` fires a `check-view` beacon to `/api/telemetry`,
   which writes a Supabase row carrying country and user-agent, and the page also
   loads GA4 and Google Fonts.
2. **D-14.** `privacy.html` section 2 promises free-text fields pass a sensitive-identifier
   screen in the browser. The Formspree form's `message` field on `pilot.html` is
   submitted without calling `jrsSanitizeCheck`. This is also a CLAUDE.md 36.6 breach.
3. **D-15.** `security.html` says record text "is not written to any table" and "there
   is no record store to breach". The versioned engine route writes per-condition notes
   grounded in the record text and a suggested rewrite of up to 600 characters.
4. **D-16.** `jrsstandard.html` and `index.html` name **Gumroad** as handling payment.
   No Gumroad URL exists anywhere in the estate, so nothing flows there today, but a
   payment processor is named to readers and appears in no inventory.
5. **D-17.** `terms.html` says "No sub-processors were engaged", scoped to pre-September
   engagements, now sitting opposite a privacy page naming eight.

**None of these was edited.** They involve commercial and legal representations, or
pages outside the authorised scope, or both.

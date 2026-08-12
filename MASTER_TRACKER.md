# MASTER_TRACKER.md

**Persistent execution log. Workspace root.**

This file is the run-by-run execution record required by the standing directive. It is separate from `research/MASTER_TRACKER.md`, which is the research programme log and carries the full narrative history. Both are maintained. Neither is deployed: `research/` is excluded from the production branch, and this file sits at root alongside the other audit reports, none of which are on `main`.

---

## Run: 2026-08-11T21:10:34Z

### 1. Trademark dossier status

| Mark | Status | Blocking |
|---|---|---|
| JUSTIFICATION REVIEW STANDARD (JRS) | **PENDING USER INPUTS** | First Use Anywhere; First Use in Commerce; USPTO identification verification |
| DECISION RECONSTRUCTION RISK (DRR) | **PENDING USER INPUTS** | First Use Anywhere; First Use in Commerce; USPTO identification verification |

Class 042 and 035 identifications are recorded verbatim as supplied. Repository evidence for dates and specimens is inventoried in `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` sections 5, 6 and 7.

### 2. pilot-status.html counter audit

**Status: PATCHED.** No data drift. One structural gap closed.

| Check | Result |
|---|---|
| Counter spans on the page | 53 |
| Hardcoded blank (`--`, `—`, empty) | 0 |
| Counters never written by JS | 0 |
| IDs referenced in JS but absent from markup | 0 |
| Endpoint figures vs direct SQL (previous run) | 28 checks, 0 mismatches |
| Rendered tiles vs direct SQL (previous run) | 23 tiles, 0 mismatches |
| Suppressed cohorts explicitly designated | **0 before this run, 6 after** |

**Gap closed this run:** the page carried no occurrence of "Suppressed", "Inactive", or any anti-inflation disclaimer. Six cohorts were reading as bare zeros with no statement of whether that meant nothing happened, nothing was sent, or something was withheld.

### 3. Files inspected this run

`pilot-status.html` · `bench-review.html` · `api/asset-stats.js` · `api/support-stats.js` · `api/support.js` · `api/access.js` · `api/panel-stats.js` · `api/gate-stats.js` · `api/geo-stats.js` · `api/enroll-stats.js` · `api/contributor-stats.js` · `api/orgpilot-stats.js` · `CLAUDE.md` · `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` · git history for both marks

### 4. Files updated this run

| File | Change |
|---|---|
| `api/asset-stats.js` | Added `suppressed_cohorts` block, six cohorts with state, counts, reason, exclusion flag and anti-inflation disclaimer |
| `pilot-status.html` | Added the Suppressed & Inactive Cohorts panel and its renderer, wired into `loadToday` with a failure state |
| `MASTER_TRACKER.md` | Created at workspace root, this file |
| `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` | Run log appended |
| `research/MASTER_TRACKER.md` | Matching research-log entry |

### 5. Notes on the directive

`MASTER_EXECUTION_PROMPT.md` **does not exist in this workspace.** Execution proceeded from the directive supplied inline in the request. No file of that name was created, because inventing one would misrepresent where the instructions came from.

The PST Pilot Study baseline is **not** carried in either file. It was removed on instruction after the owner confirmed no such study exists. It has not been reintroduced.

---

## Run: 2026-08-11T21:21:03Z

### 1. Trademark dossier status

| Mark | Status | Blocking |
|---|---|---|
| JUSTIFICATION REVIEW STANDARD (JRS) | **PENDING USER INPUTS** | First Use Anywhere; First Use in Commerce; USPTO identification verification |
| DECISION RECONSTRUCTION RISK (DRR) | **PENDING USER INPUTS** | First Use Anywhere; First Use in Commerce; USPTO identification verification |

Unchanged this run. No new repository evidence was found for either blocking field.

### 2. pilot-status.html counter audit

**Status: DRIFT DETECTED, then PATCHED.**

**The drift:** `campaign_screen_arrivals` counted every `gate-view` row, including readers who reached `access.html` with no campaign parameter. Those are redirected straight to the guides page and never see the campaign screen. The tile read **23** while the outage figure in `/api/support-stats`, which has always filtered on campaign, read **18**. Both describe the same event and they disagreed.

| Metric | Before | After |
|---|---|---|
| `campaign_screen_arrivals` | 23 | **18** |
| `access_page_hits_without_campaign` | not reported | **5** |
| Agreement with the outage figure | no | **yes** |

**Also added:** an `arrivals_vs_endorsements` reconciliation block, published on the Today panel, stating arrivals, endorsements recorded, the difference, and the reason for it. Live reading: **18 arrivals, 0 endorsements, difference 18**, all of which predate both endorsement writes.

### 3. Files inspected this run

`pilot-status.html` · `bench-review.html` · `api/asset-stats.js` · `api/support-stats.js` · `api/support.js` · `api/access.js` · `MASTER_TRACKER.md` · `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` · `interaction_events`, `pilot_progress`, `armb_progress` by direct SQL

### 4. Files updated this run

| File | Change |
|---|---|
| `api/asset-stats.js` | `campaign_screen_arrivals` now requires a campaign; added `access_page_hits_without_campaign` and `arrivals_vs_endorsements` |
| `pilot-status.html` | Reconciliation line added to the Today panel with its own failure state |
| `MASTER_TRACKER.md` | This run appended |
| `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` | Run log appended |
| `research/MASTER_TRACKER.md` | Matching research-log entry |

---

## Run: 2026-08-11T21:28:42Z

**Overall execution status:** PATCHED AND LOCALLY VERIFIED. One engineering defect found and repaired. One layer requires external verification.

| # | Item | Status |
|---|---|---|
| 3 | Link-click telemetry | **PATCHED AND LOCALLY VERIFIED** |
| 4 | Link-click repair | **NAVIGATION RACE CONDITION** fixed with `keepalive: true` on 5 pings |
| 5 | Link inventory | **VERIFIED**, 785 navigating links, 66 pages, classified into 6 classes |
| 6 | Counter audit | **VERIFIED**, 53 spans, 0 blank, 0 unwritten, 0 orphaned |
| 7 | Metric reconciliation | **VERIFIED**, 28 endpoint checks and 23 rendered tiles vs direct SQL, 0 mismatches |
| 8 | JRS trademark dossier | **REQUIRES USER INPUT** |
| 9 | DRR trademark dossier | **REQUIRES USER INPUT** |

### The defect

Five telemetry pings fired on page load with a plain `fetch`, no `keepalive`, no `sendBeacon`, on pages built to be clicked through. A plain fetch is cancelled by navigation. On `access.html` this dropped **the endorsement itself**, not only the arrival.

| File | Event | Repaired |
|---|---|---|
| `access.html` | `endorse` | Yes |
| `access.html` | `view` | Yes |
| `reviewer/index.html` | `view` | Yes |
| `training.html` | `view` | Yes |
| `investigator-guides.html` | `view` | Yes |

Server-side writes in `/api/support` and `/api/dl` were **never** exposed to this failure: they write before issuing the 302 and need no JavaScript. 117 of 785 links resolve through them.

### Required user inputs

| Item | Needed |
|---|---|
| First Use Anywhere, both marks | `[REQUIRES USER INPUT]` |
| First Use in Commerce, both marks | `[REQUIRES USER INPUT]` |
| USPTO identification acceptability | `[REQUIRES USER INPUT]` |
| Active benchmark cohort definition | `[REQUIRES USER INPUT]` : `bench-review.html` holds 24 raters over 10 records; whether that is the intended single primary cohort is not established |

### Requires external verification

**LIVE EXTERNAL EVENT INGESTION: NOT LOCALLY VERIFIABLE.** The browser in this environment has no outbound network, so a real navigate-away-mid-request cannot be reproduced against production. To close it: open a campaign link on a phone, tap the CTA immediately, and confirm the Today panel increments.

### Files inspected

All 66 HTML files · `api/*.js` (33 endpoints) · `bench-review.html` · `pilot-status.html` · `MASTER_TRACKER.md` · `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` · git history · `interaction_events`, `pilot_progress`, `armb_progress`, `bench_labels` by direct SQL

### Files modified

`access.html` · `reviewer/index.html` · `training.html` · `investigator-guides.html` · `MASTER_TRACKER.md` · `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` · `research/MASTER_TRACKER.md`

### Files created

None this run. Both master files already existed and were appended to.

### Known limitations

1. Outbound clicks to the 2 external links are not tracked. No requirement for tracking them has been established.
2. GA4 is loaded on 57 pages but no page emits `gtag('event')`. It records pageviews only and is not part of the click pipeline.
3. Arrival logging began on different dates per surface, so a zero before a surface's start date is unknown rather than zero.

### Outstanding defects

None repairable from repository evidence. The three items above are stated limitations, not unrepaired faults.

---
## Run: 2026-08-11T21:37:09Z : CORRECTION

**Overall execution status:** one prior finding withdrawn, one open item resolved from evidence.

| # | Item | Status |
|---|---|---|
| 3 | Link-click telemetry | **PRESENT BUT NOT OPERATIONALLY VERIFIED** as previously claimed. See correction below |
| 4 | Link-click repair | **HARDENING APPLIED, RACE NOT REPRODUCED.** `keepalive` is correct and retained; it is not a proven fix |
| 5 | Link inventory | **VERIFIED**, 785 links, 66 pages |
| 6 | Counter audit | **VERIFIED** |
| 7 | Metric reconciliation | **VERIFIED** |
| 8 | JRS dossier | **REQUIRES USER INPUT** |
| 9 | DRR dossier | **REQUIRES USER INPUT** |
| 15 | Active benchmark cohort | **RESOLVED FROM EVIDENCE.** Was `[REQUIRES USER INPUT]` |

### Correction

The previous run classified the failure as NAVIGATION RACE CONDITION and called it the most likely reason a visitor left no row. **Four harnesses failed to reproduce a cancellation, including a real HTTP server under 3G emulation.** A control with `keepalive` stripped delivered every event in every scenario the test could decide. The claim is withdrawn.

`keepalive` is retained as hardening. **The established cause of the original symptom remains the endorsement write being dead from 2026-08-02 to 2026-08-11 08:30Z**, which is proven by code history and row counts.

### Resolved this run

**Active benchmark cohort.** `bench-review.html` carries two cohorts: expert (8 raters, 36 labels) and bench reviewer (16 raters, 88 labels), both over the same 10 records, both dormant since 2026-06-30. The primary is the expert cohort, confirmed because its 36 labels over 10 records is exactly the denominator behind the published AC1 0.739. The bench-reviewer cohort is designated **Suppressed / Inactive** and must not be merged into a 24-rater reliability figure.

### Required user inputs

First Use Anywhere · First Use in Commerce · USPTO identification acceptability. All three for both marks.

### Requires external verification

Whether any click loss occurs beyond the proven outage window. Test: open a campaign link on a real phone and confirm the Today panel increments.

### Files modified this run

`MASTER_TRACKER.md` · `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` · `research/MASTER_TRACKER.md`. **No code was changed this run.** `keepalive` from the previous run is retained.

---

## Run: 2026-08-12T12:32:13Z

**Counter audit: DRIFT DETECTED (presentation), then PATCHED. Link-click telemetry: no defect found this run.**

### The question

What does "3 reviewer landing arrivals" mean, did they open the evaluation, and did we capture their information.

### The answer, from the database

| Time (UTC) | Source | Country | Device | Crawler |
|---|---|---|---|---|
| 05:40:04 | linkedin | IN | Windows desktop, Chrome 151 | no |
| 12:07:33 | linkedin | IN | Windows desktop, Chrome 149 | no |
| 12:08:30 | linkedin | IN | Windows desktop, Chrome 149 | no |

**2 distinct devices, 3 page loads. Both real people, both from India, both arriving from LinkedIn.**

| Stage | Count |
|---|---|
| Landed on the reviewer page | **3** |
| Opened the evaluation | **0** |
| Submitted | **0** |
| Contact details captured | **0** |

**They did not open the evaluation.** `eval-view` rows today: 0. `pilot_contacts` rows today: 0.

**No, we did not get their information, and could not have.** Contact details are requested only at the END of the evaluation, in the optional incentive block. Anyone who stops before submitting leaves no name, no email and no identifier, by design. Contacts can never exceed submissions.

### Why they left, measured not guessed

`reviewer/index.html` was rendered at both sizes matching the visitors' actual user agent:

| Viewport | Page height | Evaluation CTA position | Above fold |
|---|---|---|---|
| 1366x768 | 2416px | **2149px and 2205px** | **No** |
| 1920x1080 | 2416px | **2149px and 2205px** | **No** |

**The only links to the evaluation sat 89 percent of the way down the page.** A visitor had to scroll the entire page to find one.

### Repair

| Change | Result |
|---|---|
| Primary CTA inserted above the fold | Now at **419px**, above the fold at both 1366x768 and 1920x1080, verified by re-render |
| Bottom CTA pair reordered | Evaluation is primary, Module 1 becomes the ghost secondary |
| `reviewer_funnel` block added to `asset-stats` | Landed, opened, submitted, contacts, plus where people stop |
| Today panel states the chain | "3 landed to 0 opened to 0 submitted to 0 contacts, 3 stopped at the landing page" |

**Verified live:** `drop_landing_to_open` reads 3, above-fold CTA present on the deployed page.

### Link-click telemetry

**No defect found this run.** The `reviewer-view` arrival counter recorded all three visits correctly, with source, country, device and user agent. The telemetry worked; the page did not.

### Trademark dossiers

Unchanged: **JRS REQUIRES USER INPUT, DRR REQUIRES USER INPUT.**

### Files modified

`reviewer/index.html`, `api/asset-stats.js`, `pilot-status.html`, `MASTER_TRACKER.md`, `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md`, `research/MASTER_TRACKER.md`.

---

## Run: 2026-08-12T12:42:55Z

**Counter audit: PASSED. New publication added. No telemetry defect found this run.**

### Request

Publish on `pilot-status.html` how many evaluations were completed and who completed them, plus the purpose of collecting the results. Update the two summary documents.

### Delivered

New **Completed Evaluations** panel, live, with four tiles and two blocks:

| Element | Source |
|---|---|
| Evaluations completed | `completed_evaluations.submitted` |
| Answered all nine | `completed_evaluations.answered_all_nine` |
| Chose to be named | `completed_evaluations.named_publicly` |
| Chose to stay anonymous | `completed_evaluations.chose_to_stay_anonymous` |
| Who completed one | `completed_evaluations.names`, consent-gated |
| What the results are collected for | `completed_evaluations.purpose` |

All four tiles read **0**. True zero: the instrument is live, the write path was verified against production, and it has not been sent to anyone.

### The constraint on "who completed them", stated rather than worked around

**Only the names of people who ticked "Optional: list my name publicly as a JRS-trained reviewer" can be published, and those are what the panel shows.**

Answers live in `interaction_events` with no identity on the row. Identities live in `pilot_contacts` with no answers on the row. **The two tables share no key.** Nobody, including the person running the study, can say which respondent gave which answers. That is the promise the instrument makes on its own page.

Publishing who gave which answers would require rebuilding the instrument to collect something it was specifically built not to collect. The panel publishes the identity limit alongside the names so a reader is never left to assume the omission is an oversight.

### Purpose of collection, now published

Aggregate reporting in the research write-up; full results to every reviewer once the study closes; evidence base describing the problem the standard addresses. **Not used to evaluate, rank or identify any respondent or their employer.**

### Documents updated

`research/Reviewer_Evaluation_Summary_2026-08-11.md` 8,538 to 11,526 bytes. `research/Reviewer_Program_Summary_2026-08-09.md` 16,768 to 19,756 bytes. Both carry the same section, so the documents and the site read from one source.

### Link-click telemetry

**No defect found this run.** No code path was changed.

### Trademark dossiers

Unchanged: **JRS REQUIRES USER INPUT, DRR REQUIRES USER INPUT.**

### Files modified

`api/asset-stats.js`, `pilot-status.html`, `research/Reviewer_Evaluation_Summary_2026-08-11.md`, `research/Reviewer_Program_Summary_2026-08-09.md`, `MASTER_TRACKER.md`, `research/MASTER_TRACKER.md`.

---

## Run: 2026-08-12T13:08:51Z

**Overall execution status:** three prior runs were logged to `research/MASTER_TRACKER.md` and NOT to this file. That gap is closed here. All three are recorded below with their real status.

**Root tracker was last updated at 2026-08-12T12:42:55Z. Three runs happened after it and were not written here.** The research log carried them; this file did not. That is a maintenance failure against the standing directive and it is corrected rather than explained away.

| # | Item | Status |
|---|---|---|
| 3 | Link-click telemetry | **VERIFIED**, no defect found across the three runs |
| 4 | Link-click repair | **None required.** `keepalive` from 2026-08-11 remains, classified hardening not proven repair |
| 5 | Link inventory | **VERIFIED**, 785 navigating links, 66 pages |
| 6 | Counter audit | **PATCHED**, two new publications added |
| 7 | Metric reconciliation | **VERIFIED** |
| 8 | JRS trademark dossier | **REQUIRES USER INPUT** |
| 9 | DRR trademark dossier | **REQUIRES USER INPUT** |

### Run A, previously unlogged here: outreach message check

Checked a LinkedIn outreach message against the live site. **Two factual errors found, one of them caused by my own change earlier the same day.**

| Error | Detail |
|---|---|
| Scroll instruction | Told the reader to scroll to the bottom and click "GO STRAIGHT TO THE REVIEWER EVALUATION". That string has **0 occurrences** on the page; the CTA was renamed and moved to the top at 419px. Following it lands on "Open Module 1 first", the opposite direction |
| Recommendation described as automatic | It is an opt-in checkbox and nothing is posted without the person approving the wording |

Verified correct: link resolves 307 with `src` preserved; Module 1 genuinely open without sign-up; 9 questions confirmed in `api/reviewer-eval.js`; 4-minute claim matches the page; separation-of-answers claim true and stronger than stated.

**Standing risk recorded:** outreach copy hardcodes button labels and labels change. Describing a CTA by **position** survives a copy change; naming the exact label does not.

### Run B, previously unlogged here: outreach template

`research/Outreach_Template_Reviewer_Evaluation.md` created, both errors fixed, CTA described by position. Carries a pre-send check: run `check_completion.py <CODE>` against anyone on a reviewer roster, because a completer should receive their completion package rather than a recruitment message.

### Run C, previously unlogged here: recommendation-requester mechanism

**Gap found:** the public dashboard has always published `contacts_via_recommendation`, the count. **Nothing anywhere exposed who.** A count of three would tell the owner three people are owed a recommendation and give him no way to write any of them.

**Repair:** extended `api/support-contacts.js`, the existing token-gated owner endpoint, to return `recommendation_requests` and `certificate_requests` with name, email, organization, printed title, LinkedIn URL, country, completion code, four consent flags and request timestamp.

**Answers are not joined in and cannot be.** The answer rows carry no identity and share no key with these rows. The endpoint returns who asked, never what they said.

**Verified on production, four ways:**

| Check | Result |
|---|---|
| No token | Four boolean diagnostics only, zero name or email keys |
| Wrong token | HTTP 401 |
| Word "recommendation" in unauthorized response | 0, the gate leaks nothing about the new fields |
| Public `asset-stats` payload | No email address, no `linkedin_url` |

### Live figures at this timestamp

| Metric | Value |
|---|---|
| Reviewers / completers / countries | 57 / 36 / 16 |
| Today: campaign arrivals / reviewer landings / training arrivals | 2 / 3 / 0 |
| Today: endorsements / guide downloads / records reviewed | 1 / 4 / 24 |
| Endorsements total / last recorded | 42 / 2026-08-12 |
| Evaluation opened / submitted | 0 / 0 |
| Reviewer funnel: landed / opened evaluation / stopped at landing | 3 / 0 / 3 |
| Completed evaluations / named publicly | 0 / 0 |

### Required user inputs

First Use Anywhere, First Use in Commerce, USPTO identification acceptability. All three, both marks.

### Requires external verification

Whether any click loss occurs beyond the proven 2026-08-02 to 2026-08-11 08:30Z outage window. Test: open a campaign link on a real phone and confirm the Today panel increments.

### Files modified across the three runs

`api/support-contacts.js` · `research/Outreach_Message_Check_Priyam_2026-08-12.md` · `research/Outreach_Template_Reviewer_Evaluation.md` · `research/MASTER_TRACKER.md` · `MASTER_TRACKER.md` · `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md`

### Outstanding defect, process

**This file was not maintained on three consecutive runs while the research log was.** Two trackers exist and only one was being kept current. Both are updated in the same step from here.

---

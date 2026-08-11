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

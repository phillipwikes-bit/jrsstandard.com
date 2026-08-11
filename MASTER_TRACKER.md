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

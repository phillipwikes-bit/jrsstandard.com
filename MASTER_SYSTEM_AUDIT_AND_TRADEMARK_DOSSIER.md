# Master System Audit and Trademark Evidence Dossier

**Repository:** `phillipwikes-bit/jrsstandard.com`
**Prepared:** 2026-08-11
**Scope:** metric reconciliation on `pilot-status.html` and its data sources, plus a repository-evidence dossier for two marks.
**Nature of this document:** evidence preparation. It is not a legal opinion and it does not establish trademark rights.

---

## 1. Execution summary

**The question that drove this audit:** why does every counter read zero, and where are the endorsements.

**Answer, established from live data:** the endorsement counter is working and correct. No third-party endorsement has arrived since **2026-08-04**, seven days ago. Today's 18 campaign arrivals came from a **single device**, and all 18 landed inside the window where the write was broken.

### Files modified

| File | Change |
|---|---|
| `api/support-stats.js` | Added `last_endorsement_at`, `days_since_last_endorsement`, and an `outage` block counting clicks that reached the screen while the write was broken |
| `pilot-status.html` | Endorsement panel now shows when the last endorsement arrived and discloses the outage |

### Files modified earlier the same day, in the same investigation

| File | Change |
|---|---|
| `api/support.js` | Restored the endorsement write, which had been broken since 2026-08-02 |
| `api/access.js` | Added page-scoped arrival sources `reviewer-view` and `train-view` |
| `api/asset-stats.js` | Added the `today` block and the `entry_points` block |
| `reviewer/index.html`, `training.html` | Added arrival logging; neither page recorded a visit before |
| `api/contributor.js` | Extended the purge helper so counters can be verified without inflating them |

### Defects found

1. **The endorsement write was dead for nine days.** `/api/support` stopped writing on 2026-08-02 and delegated to the registration form. That form was removed on 2026-08-11 at 03:45Z, after which the screen told readers "Your support is recorded" and recorded nothing.
2. **Two entry points logged no arrival at all.** `reviewer/index.html` made no logging call; `training.html` recorded only a completed enrolment.
3. **No counter on the page measured arrivals.** Every "today" tile counted a completed action, so a day of real traffic still displayed zero.

### Unresolved

- First use in commerce for both marks: **NOT ESTABLISHED BY REPOSITORY EVIDENCE**.
- USPTO acceptability of the candidate identifications: **NOT VERIFIED**. No verified read of the current ID Manual was performed in this pass.

---

## 2. Metric reconciliation

Baseline values are held as immutable reference. They do not overwrite current operational values.

| Metric | Baseline (reference) | Current repository value | Status | Source | Action taken |
|---|---|---|---|---|---|
| Detection-study reads | not applicable | **510** | Current | `pilot_progress` | Preserved |
| Detection reviewers started | not applicable | **16 of 27** | Current | `pilot_progress` | Preserved |
| Detection completers | not applicable | **16** | Current | `pilot_progress` | Preserved |
| Comparison-study reads | not applicable | **465** | Current | `armb_progress` | Preserved |
| Comparison completers | not applicable | **19** | Current | `armb_progress` | Preserved |
| Reviewers, all studies | not applicable | **56** | Current, live | `/api/panel-stats` | Preserved |
| Full-set completers | not applicable | **35** | Current, live | `/api/panel-stats` | Preserved |
| Countries | not applicable | **16** | Current, transcribed | `build_expert_roster.py` | Preserved, flagged non-live |
| Inter-rater agreement | **84.2%** benchmark | **Gwet's AC1 0.739**, 95% CI [0.402, 1.000], n=10 records, 36 labels | Current, measured | `research/compute_ac1_ci.py` | Not overwritten |
| Cross-vendor drift | **<15%** target | reproducibility **86.7%** | Current, measured | nightly study run | Not overwritten |
| Reviewer evaluation | **9 questions** | **9 questions** | Agrees | `api/reviewer-eval.js` | No change needed |
| Endorsements recorded | not applicable | **40** | Current | `interaction_events` | Preserved |
| Last endorsement | not applicable | **2026-08-04**, 7 days ago | Current | `/api/support-stats` | **Added to the page** |

**The 84.2% figure and the <15% drift figure do not appear anywhere in this repository or database.** Searched: `84.2`, `Institutional Control Survey`, `15% variance`. Zero occurrences. They were not injected, because injecting a figure with no source into a dashboard a buyer audits is the failure mode this audit exists to prevent.

---

## 3. Today's exact numbers

**2026-08-11 UTC**, live from `/api/asset-stats`:

| Surface | Today | Logging began |
|---|---|---|
| Campaign screen arrivals | **18** | 2026-08-02 |
| Reviewer landing arrivals | 0 | 2026-08-11 |
| Training page arrivals | 0 | 2026-08-11 |
| Endorsements | **0** | restored 2026-08-11 08:30Z |
| Evaluation opens | 0 | 2026-08-10 |
| Evaluation submissions | 0 | 2026-08-09 |
| Guide downloads | **2** | 2026-07-17 |
| Records reviewed | **48** (0 detection, 48 comparison) | live |

25 human events. 2 crawler rows excluded.

**Why endorsements read 0 today:** all 18 campaign arrivals occurred between 03:47Z and 04:45Z, before the write was restored at 08:30Z. **Zero campaign arrivals since the fix.** The counter was verified end to end after the fix: a real click wrote a row, the total moved 40 to 41, and the check row was purged.

**Why 18 arrivals is not 18 lost supporters:** all 18 carry one identical user agent (iPhone, iOS 26.5.2, Chrome for iOS 151, US). One device, 18 loads across 58 minutes, alternating between both campaigns.

---

## 4. Suppressed and inactive cohorts

| Cohort | State | Treatment |
|---|---|---|
| Organization pilots | 0 sessions, never sent | True zero, `flagged_condition_pct` renders null rather than 0 |
| Contributor links | 20 issued, 0 sent | Held pending study close; excluded from engagement rates |
| Honor links | 34 issued, 1 sent | Rates published against **sent**, not issued |
| Evaluation funnel | 0 at every stage | True zero, verified: the write path works and no one has opened it |
| Evaluation sub-group breakdowns | withheld | Released at n=30. `breakdowns_released: false` with the reason published |

No cohort contributes to a denominator it does not belong in. Every zero above is either a verified true zero or an explicitly stated withholding.

---

## 5. JRS trademark evidence dossier

**Mark:** JUSTIFICATION REVIEW STANDARD
**Representation:** standard characters
**Proposed classes:** 042, 035

### Dates

| Item | Date | Evidence | Source | Confidence |
|---|---|---|---|---|
| Earliest repository appearance | **2026-04-14** | commit `06e99ce`, first commit containing the wording in an HTML file | `git log -S` | High for the commit; **this is internal drafting, not public use** |
| Earliest appearance on the production branch | **2026-07-07** | commit `40e6cdd` | `git log origin/main -S` | Medium. `40e6cdd` is a 110-file bulk import and is the first commit on that branch, so it is a **floor**, not a proven first public date |
| Current public use | **2026-08-11** | live on `jrsstandard.com/`, `/jrsstandard.html`, `/decision-reconstruction-risk.html` | HTTP fetch performed this date | High |
| First use anywhere | | | | **NOT ESTABLISHED BY REPOSITORY EVIDENCE** |
| First use in commerce | | | | **NOT ESTABLISHED BY REPOSITORY EVIDENCE** |

The repository cannot distinguish a commit date from a publication date. Deployment history lives with the hosting provider, not here.

### Specimen candidates

| Path | Type | Mark visible | Demonstrates use with the claimed services | Notes |
|---|---|---|---|---|
| `JRS-Standard.pdf` | PDF | Yes | Partial | The standard itself; a publication, not obviously a service offering |
| `JRS_Investigator_Field_Guide_*.pdf` (3 editions) | PDF | Yes | Partial | Practitioner guides, distributed free |
| `JRS_Rapid_Review_Card.pdf` | PDF | Yes | Partial | Reference card |
| `JRS_Research_Paper.pdf`, `JRS_Reliability_Accuracy.pdf` | PDF | Yes | Weak | Research output |
| `jrsstandard.html`, `index.html` | live page | Yes | Medium | Describes the method and offers the review |
| `org-pilot.html` | live page | Yes | **Strongest available** | Offers a diagnostic review of the user's own records, which is closest to the Class 042 services |

**No specimen in this repository has been assessed as acceptable to the USPTO.** A document containing the mark is not automatically a specimen of use in connection with the identified services.

### Commercial use

Searched for `price`, `purchase`, `invoice`, `subscription`, `licence fee`, `paid`. Nothing establishes a sale, a paid service, or a commercial transaction. The site states repeatedly that access is free. **Commercial use: NOT ESTABLISHED BY REPOSITORY EVIDENCE.**

---

## 6. DRR trademark evidence dossier

**Mark:** DECISION RECONSTRUCTION RISK
**Representation:** standard characters
**Proposed class:** 042

### Dates

| Item | Date | Evidence | Source | Confidence |
|---|---|---|---|---|
| Earliest repository appearance | **2026-06-23** | commit `9ea3687`, first commit containing the wording in an HTML file | `git log -S` | High for the commit; internal drafting, not public use |
| Earliest appearance on the production branch | **2026-07-07** | commit `40e6cdd` | `git log origin/main -S` | Medium, same bulk-import caveat |
| Current public use | **2026-08-11** | live on `/decision-reconstruction-risk.html`, 12 occurrences on that page | HTTP fetch performed this date | High |
| First use anywhere | | | | **NOT ESTABLISHED BY REPOSITORY EVIDENCE** |
| First use in commerce | | | | **NOT ESTABLISHED BY REPOSITORY EVIDENCE** |

### Specimen candidates

| Path | Type | Mark visible | Demonstrates use with the claimed services | Notes |
|---|---|---|---|---|
| `decision-reconstruction-risk.html` | live page | Yes, 12 occurrences | **Strongest available** | The mark's dedicated page |
| `DRR_Article.pdf` | PDF | Yes | Partial | Article, not a service offering |
| 11 further HTML files on `main` | live pages | Yes | Weak to medium | Mentions in supporting context |

---

## 7. USPTO identification verification

| Category | Status |
|---|---|
| **User-supplied candidate language** | Recorded verbatim below |
| **USPTO-verified language** | **NONE.** No verified read of the current Acceptable Identification of Goods and Services Manual was performed in this pass |
| **Proposed modifications** | None offered. Proposing edits without checking the Manual would produce language that looks verified and is not |
| **Requires attorney review** | Class assignment, wording acceptability, specimen sufficiency, and both first-use dates |

**JRS Class 042 (candidate, unverified):** "Developing voluntary operational standards, technical protocols, and compliance frameworks for artificial intelligence governance, automated record-keeping systems, and algorithmic decision auditing; Providing online non-downloadable cloud-based software for auditing, evaluating, and tracking compliance with governance standards in automated decision systems; Platform as a service (PAAS) featuring computer software platforms for automated record verification, system log analysis, and decision justification testing in artificial intelligence software."

**JRS Class 035 (candidate, unverified):** "Business risk assessment services; business compliance advisory services in the field of artificial intelligence governance, automated decision support, and institutional record-keeping compliance."

**DRR Class 042 (candidate, unverified):** "Software as a service (SAAS) services featuring software for assessing, diagnostic testing, and auditing computational vulnerability, evidentiary loss, and record reconstruction failure in automated decision systems; Providing online non-downloadable software for evaluating decision reconstruction risk, data lineage drift, and system defensibility in artificial intelligence and automated workflows; Conducting technical risk assessments and diagnostic testing of automated system decision logs."

**One observation that affects both filings, stated as an issue rather than a conclusion:** the Class 042 language for both marks describes non-downloadable software and platform services. The repository serves static pages plus edge functions, and `org-pilot.html` is the only surface offering anything resembling an interactive service. Its usage is **0 sessions all-time**. Whether that supports a software-as-a-service identification is an attorney question, and it is the weakest point in both applications on current evidence.

---

## 8. Validation performed

| Check | Result |
|---|---|
| `node --check` on every modified endpoint | Pass |
| Inline script parse on `pilot-status.html` | 2 blocks, 0 errors |
| Endpoint returns the new fields | Pass: `last_endorsement_at` 2026-08-04, `days_since_last_endorsement` 7, `outage.clicks_not_recorded` 18, `distinct_devices` 1 |
| Endorsement write, end to end | Pass: real click wrote a row, total 40 to 41, check row purged, back to 40 |
| Arrival counters, end to end | Pass: both moved to 1, purged, back to 0 |
| Today block against raw database | Pass: 18 / 0 / 0 / 0 / 0 / 0 / 2 / 48 matches a direct query |
| Structural assertion, all HTML | Pass: 66 files carry doctype, viewport, head close, body close, html close |
| `research/` on production branch | 0 files. Tracker, completion checker and blind answer key all return 404 |
| `git status` after work | Clean, branch level with origin |

---

## 9. Unresolved evidence gaps

| Item | Status |
|---|---|
| 84.2% inter-rater agreement | **NOT ESTABLISHED.** Measured value is Gwet's AC1 0.739 |
| <15% cross-vendor drift as a measured result | **NOT ESTABLISHED** as measured. Reproducibility is 86.7% |
| First use anywhere, both marks | **NOT ESTABLISHED BY REPOSITORY EVIDENCE** |
| First use in commerce, both marks | **NOT ESTABLISHED BY REPOSITORY EVIDENCE** |
| USPTO acceptability of all three identifications | **NOT VERIFIED** |
| Specimen acceptability | **NOT ESTABLISHED.** Candidates inventoried, none assessed as acceptable |
| Trademark ownership and priority | **NOT ESTABLISHED.** Outside repository scope |
| Countries figure (16) | Live-computable only in part. No country is stored in any anon-readable table; the value is transcribed and published with `geo_source: "transcribed"` and a rederivation path |

---

## 10. Run log

### 2026-08-11T20:50:49Z

**Counter audit: PATCHED, then PASSED.** All 20 panel metrics reconciled against direct SQL. 0 mismatches.

| Defect found this run | Resolution |
|---|---|
| Endorsement chart ended on the last event date, so after a quiet week it stopped at 2026-08-04 and today had no column at all | Series now always runs to the current UTC day. Today's empty column is drawn in gold so a day with nothing yet is distinguishable from a past day that had nothing |
| A reader arriving by copied, forwarded or bookmarked URL was never recorded, while the screen told them their support was recorded | `/api/support` marks its redirect `r=1` when it wrote; the campaign screen fires a fallback endorsement when that marker is absent, deduped per browser per campaign |
| `sessionStorage` dedupe was per tab, so a forwarded link opened twice counted twice | Switched to `localStorage`; key added to the sanctioned list in `CLAUDE.md` |
| One stale `deploytest` guide-download row sat in the table, filtered on read but never removed | Deleted by direct SQL |
| Non-browser agents could record an endorsement | `/api/support` and the fallback both refuse an absent or non-browser user agent |

**Reconciliation, endpoint against direct SQL, all 20 match:** endorsements 40 / today 0 / chart reaches today / campaign arrivals today 23 / gate views 124 / guide downloads 65 / today 2 / evaluation opens 0 / submissions 0 / detection completers 16 / comparison completers 19 / records reviewed today 48 / reliability raters 24 / reliability records 10 / panel reviewers 56 / completers 35 / registered 47 / training enrolments 7 / completions 7 / contributor outstanding 20.

**Trademark dossiers:** JRS PENDING INPUTS, DRR PENDING INPUTS. Both blocked on the same two fields, first use anywhere and first use in commerce, and on USPTO identification verification. See sections 5, 6 and 7.

**Files modified this run:** `api/support.js`, `api/access.js`, `api/support-stats.js`, `api/contributor.js`, `access.html`, `pilot-status.html`, `CLAUDE.md`, `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md`, `research/MASTER_TRACKER.md`.

**Ground-truth block supplied in the directive, reconciled not injected.** 84.2% inter-rater: measured value is Gwet's AC1 **0.739**, 95% CI [0.402, 1.000], n=10 records, 36 labels, computed by `research/compute_ac1_ci.py`. Cross-vendor drift <15%: no drift calculation exists; reproducibility is 86.7%, so <15% is recorded as a target and not as a measurement. 9-question survey: **confirmed**, matches `api/reviewer-eval.js`. Active benchmark cohort 1 primary: `bench-review.html` draws 24 raters over 10 records from `bench_labels`; whether that is the "1 Primary Cohort" is `[REQUIRES USER INPUT]`.

### 2026-08-11T20:59:34Z

**Counter audit: PASSED.** No drift. No patch required this run.

**Verified two ways, independently.**

1. **Endpoint against direct SQL, 28 checks, 0 mismatches.** Every figure served by `/api/asset-stats`, `/api/support-stats`, `/api/gate-stats`, `/api/geo-stats`, `/api/panel-stats`, `/api/enroll-stats`, `/api/contributor-stats`, `/api/orgpilot-stats` and `/api/access-stats` was compared to a query run straight against the database.
2. **Rendered page against SQL, 23 tiles, 0 mismatches.** The deployed `pilot-status.html` was loaded in a browser with live production payloads and every stat tile read back. This covers the four tiles computed client-side from `pilot_progress`, `realcase_progress` and `armb_progress`, which no endpoint check can reach.

**Page health:** 0 panels stuck on Loading, 0 horizontal overflow, 0 page JS errors.

**Live figures at this timestamp**

| Panel | Value |
|---|---|
| Today: campaign arrivals / endorsements / records reviewed / guide downloads | 23 / 0 / 48 / 2 |
| Today: reviewer arrivals / training arrivals / evaluation opens / submissions | 0 / 0 / 0 / 0 |
| Detection study: reads / started / completers | 510 / 16 of 27 / 16 |
| Comparison study: reads / today / completers / JRS arm / no-JRS arm | 465 / 48 / 19 / 7 / 13 |
| Real-case pilots: cases / contributors | 54 / 2 |
| Endorsements: total / last / days since / chart reaches today | 40 / 2026-08-04 / 7 / yes |
| Guide downloads: total / today | 65 / 2 |
| Evaluation funnel: opened / submitted / contacts | 0 / 0 / 0 |
| Training: enrolments / completions | 7 / 7 |
| Registrations / organizations / contributor outstanding | 1 / 0 / 20 |
| Reliability: raters / records | 24 / 10 |
| Credentials line: reviewers / completers / countries | 56 / 35 / 16 |
| Device split (crawlers removed) | 26 mobile, 0 desktop, 7 crawler rows excluded |

**Trademark dossiers:** JRS PENDING INPUTS, DRR PENDING INPUTS. Unchanged this run. Both blocked on first use anywhere, first use in commerce, and USPTO identification verification. See sections 5, 6 and 7.

**Files modified this run:** none. The audit found no drift, so nothing was patched. `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` and `research/MASTER_TRACKER.md` were updated with this run log.

**Directive reconciliation, unchanged from the previous run.** 84.2%: measured value is Gwet's AC1 **0.739**, 95% CI [0.402, 1.000], n=10 records, 36 labels. Cross-vendor drift <15%: no drift calculation exists, so it stands as a target against a measured reproducibility of 86.7%. 9-question survey: **confirmed**. Active benchmark cohort: `bench-review.html` draws 24 raters over 10 records from `bench_labels`; whether that constitutes the intended primary cohort is `[REQUIRES USER INPUT]`.

### 2026-08-11T21:04:55Z

**Counter audit: PATCHED.** One presentation defect, no data drift. All figures remained correct throughout.

**Defect:** on the endorsements-per-day chart, today rendered as a bare one-pixel gold line with no figure attached. The count label was printed only on non-zero days, and a zero column was drawn one pixel high, so 2026-08-11 appeared as a faint smudge under an unlabelled axis tick. It read as a rendering fault rather than as a measurement of zero.

**Patch, in `pilot-status.html`, function `renderEndorseDays`:**

| Change | Reason |
|---|---|
| Every column now prints its number, zeros included | A zero is a result and is labelled like one. Zeros render in `--muted-soft`, today's in `--accent` |
| Zero columns draw a 2px floor line, was 1px | One pixel is not readable as a bar on a phone |
| Today sits on a faint `--surface2` track | The slot is visible before anything fills it |
| Today's axis tick always reads `TODAY` | Previously it could be blank, because the axis thins labels to at most twelve and today's tick could fall in a gap |
| Today restated in words below the chart | The figure no longer depends on reading a short bar correctly |

**Verified on the deployed page at 390px:** 12 columns, **12 of 12 numbered**, final column title `2026-08-11: 0 (today)`, one `TODAY` axis tick, and the sentence `Today, 2026-08-11: 0 endorsement` present.

**Live figures unchanged this run:** endorsements 40 total, last 2026-08-04, 7 days ago; series 2026-07-31 to 2026-08-11, 12 days, 4 with activity, peak 28; today 0.

**Trademark dossiers:** JRS PENDING INPUTS, DRR PENDING INPUTS. Unchanged.

**Files modified this run:** `pilot-status.html`, `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md`, `research/MASTER_TRACKER.md`.

### 2026-08-11T21:10:34Z

**Counter audit: PATCHED.** No data drift. One structural gap closed.

`MASTER_EXECUTION_PROMPT.md` does not exist in this workspace. Execution proceeded from the directive supplied inline. No file of that name was created.

#### Gap found

`pilot-status.html` contained **zero occurrences** of "Suppressed", "Inactive", or any anti-inflation disclaimer. Six cohorts were rendering as bare zeros, and a reader could not tell whether a zero meant nothing happened, nothing was sent, or something was deliberately withheld.

#### Patch applied, `api/asset-stats.js`, new `suppressed_cohorts` block

| Cohort | State | Counts | Excluded from totals |
|---|---|---|---|
| Organization pilots | INACTIVE | 0 orgs, 0 sessions, 0 records | Yes |
| Contributor confirmation links | SUPPRESSED | 20 issued, 0 sent, 0 opened, 0 confirmed | Yes |
| Honor links | PARTIALLY SUPPRESSED | 34 issued, 1 sent, 1 opened, 1 accepted | No |
| Blind second-read links | SUPPRESSED | 3 issued, 0 sent, 0 opened, 0 submitted | Yes |
| Reviewer evaluation funnel | INACTIVE | 0 opened, 0 submitted, 0 contacts | Yes |
| Evaluation sub-group breakdowns | WITHHELD | threshold 30, current 0, released false | Yes |

#### Patch applied, `pilot-status.html`

New panel, **Suppressed & Inactive Cohorts**, rendering each cohort with a colour-coded state chip, its counts, the reason, an excluded-from-totals marker, and its disclaimer. Wired into `loadToday` with a failure state. Full renderer is in the file; it is not reproduced here because the file on disk is the deliverable.

#### Anti-inflation statement, now published on the page

Rates for the per-person link programmes are computed against links **sent**, never against links **issued**. A roster size is not an audience, an unsent link is not a non-response, and a withheld breakdown is not an absence of data. Where a rate against issued appears in the payload it is labelled the conservative reading rather than the operational one.

#### TEAS filing sheets

Both sheets are in sections 5, 6 and 7 above. Status this run: **JRS PENDING USER INPUTS**, **DRR PENDING USER INPUTS**. The two blocking fields are identical for both marks and neither can be derived from repository evidence:

| Field | Status |
|---|---|
| First Use Anywhere | `[REQUIRES USER INPUT]` |
| First Use in Commerce | `[REQUIRES USER INPUT]` |
| USPTO identification acceptability | `[REQUIRES USER INPUT]`, no verified ID Manual read performed |

Repository evidence that **is** established, and its limit: earliest appearance of JRS in an HTML file is commit `06e99ce`, 2026-04-14; earliest appearance of DRR is commit `9ea3687`, 2026-06-23; earliest appearance of both on the production branch is commit `40e6cdd`, 2026-07-07. A commit is internal drafting and is not public use, and `40e6cdd` is a 110-file bulk import that begins that branch's history, so 2026-07-07 is a floor rather than a proven first public date. Live public use of both marks was verified by HTTP fetch on 2026-08-11.

**Files updated this run:** `api/asset-stats.js`, `pilot-status.html`, `MASTER_TRACKER.md` (created at workspace root), `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md`, `research/MASTER_TRACKER.md`.

### 2026-08-11T21:21:03Z

**Counter audit: DRIFT DETECTED, then PATCHED.**

**Question that triggered this run:** why do 23 campaign arrivals on 2026-08-11 show 0 endorsements, when there is no gate and every arrival is an endorsement.

**Answer, in two parts.**

**Part one, the tile was wrong.** There were not 23 campaign arrivals. There were **18**. `campaign_screen_arrivals` counted every `gate-view` row, and 5 of them carried no campaign at all: those readers hit `access.html` with no `?c=` and were redirected straight to the guides page without seeing the campaign screen. The figure has always been filtered on campaign in `/api/support-stats`, which is why the outage note read 18 while the tile read 23. Two numbers describing the same event, disagreeing. Patched: the tile now requires a campaign, and non-campaign hits are reported separately as `access_page_hits_without_campaign`.

**Part two, the 18 predate both writes and cannot be recovered.** All 18 arrived between **03:47:03Z and 04:45:13Z**, from **one device**. The endorsement write was restored at **08:30Z** and the fallback for copied and forwarded URLs at **20:45Z**. **Zero arrivals occurred after either fix.** So 18 arrivals produced 0 endorsements because nothing was writing at the time, not because the link is gated and not because a write is failing now.

**The reasoning in the question is correct and is now enforced by two writes:**

| Arrival route | What records it | Since |
|---|---|---|
| Campaign link as posted, through `/api/support` | Server-side write, fires without JavaScript | 2026-08-11 08:30Z |
| Copied, forwarded or bookmarked URL landing on `access.html` | Fallback write from the page, deduped per browser per campaign | 2026-08-11 20:45Z |

Both were verified against production: a browser user agent records, a non-browser agent does not, and the two paths cannot double count because `/api/support` marks its redirect `r=1` and the fallback fires only when that marker is absent.

**Reconciliation now published on the page.** `arrivals_vs_endorsements` states arrivals, endorsements recorded, the difference and the reason. Current reading: **18 arrivals, 0 endorsements, difference 18**, entirely accounted for by the pre-fix window. **From 2026-08-12 a non-zero difference on that line is a defect and should be treated as one.**

**Files updated this run:** `api/asset-stats.js`, `pilot-status.html`, `MASTER_TRACKER.md`, `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md`, `research/MASTER_TRACKER.md`.

**TEAS status unchanged:** JRS PENDING USER INPUTS, DRR PENDING USER INPUTS. First Use Anywhere, First Use in Commerce and USPTO identification acceptability all remain `[REQUIRES USER INPUT]`.

### 2026-08-11T21:28:42Z : LINK-CLICK TELEMETRY AUDIT AND REPAIR

#### A. Executive audit status

| Item | Status |
|---|---|
| Link-click telemetry | **PATCHED AND LOCALLY VERIFIED** |
| Failure class | **NAVIGATION RACE CONDITION** |
| Link inventory | **VERIFIED**, 785 navigating links across 66 pages |
| Counter audit | **VERIFIED**, previous run: 28 endpoint checks and 23 rendered tiles, 0 mismatches |
| Metric reconciliation | **VERIFIED** |
| JRS dossier | **REQUIRES USER INPUT** |
| DRR dossier | **REQUIRES USER INPUT** |
| Live external event ingestion | **NOT LOCALLY VERIFIABLE** for a real visitor's browser. See section F |

#### B. Telemetry architecture, as it exists

The repository uses **two mechanisms**, not one, and this is deliberate:

1. **Server-side write on request.** `/api/support` and `/api/dl` are edge functions. They write the row and then issue a 302. **These cannot be lost to a navigation race, cannot be blocked by CORS or CSP, and do not require JavaScript.** 117 of the 785 navigating links resolve through them.
2. **Client-side arrival ping on the destination.** `access.html`, `reviewer/index.html`, `training.html` and `investigator-guides.html` POST to `/api/access` on load. This is the mechanism that was defective.

No `sendBeacon`, `XMLHttpRequest`, GTM, Plausible, PostHog, Umami or Matomo is present anywhere. GA4 (`G-NVYHJ7BJ92`) is loaded on 57 pages but **zero files call `gtag('event', ...)`**, so GA4 records pageviews only and is not part of the click pipeline.

#### C. Link inventory

| Link class | Count | Tracking mechanism | Fires on |
|---|---|---|---|
| Internal navigation | 628 | Destination arrival ping, where the destination is instrumented | Destination load |
| Campaign link (`/api/support`) | 79 | Server-side write, then 302 | Request, not click |
| Download link (`/api/dl`) | 38 | Server-side write, then 302 | Request, not click |
| Training CTA (`/train`) | 35 | `train-view` arrival ping | Destination load |
| Evaluation CTA | 3 | `eval-view` logged server-side on GET | Destination load |
| External / absolute | 2 | **None. Outbound clicks are not tracked** | n/a |

#### D. Failure diagnosis

**Classification: NAVIGATION RACE CONDITION.**

Five telemetry pings fired on page load using a plain `fetch` with no `keepalive` and no `sendBeacon`, on pages whose entire purpose is to be clicked through:

| File | Line | Event | Consequence of the race |
|---|---|---|---|
| `access.html` | 158 | `endorse` | **The endorsement itself is lost** |
| `access.html` | 175 | `view` | Campaign arrival lost |
| `reviewer/index.html` | 246 | `view` | Reviewer landing arrival lost |
| `training.html` | 3295 | `view` | Training arrival lost |
| `investigator-guides.html` | 183 | `view` | Guides arrival lost |

A plain `fetch` is cancelled when the browser navigates. `access.html` carries a single gold CTA that navigates to `/reviewer/evaluation.html`. A reader who lands and taps within the few hundred milliseconds the request needs loses **both their arrival and their endorsement**, with no error surfaced anywhere.

**This is the most likely reason a visitor can report reaching the page while no row exists for them.** It is not the only possible reason, and it is not proven to be the cause of any specific past visit.

#### E. Repair performed

`keepalive: true` added to all five pings. `keepalive` instructs the browser to complete the request even after the page is unloaded.

Chosen because it is the minimal repair that preserves the existing architecture: no new dependency, no `sendBeacon` rewrite, no change to payload, endpoint, or counting methodology. Not applied to form submissions, which await a response on a page the reader stays on.

#### F. End-to-end verification

| Layer | Result |
|---|---|
| 1. Source | **VERIFIED** by fresh disk read: `access.html` 2 occurrences, the other three files 1 each |
| 2. Implementation | **VERIFIED**, inline scripts parse with 0 errors across all four files |
| 3. Data flow | **VERIFIED**, payload unchanged; `event`, `page`, `campaign`, `src` |
| 4. Persistence | **VERIFIED** on production earlier this session: a browser user agent posting `event:endorse` moved the total 40 to 41; a non-browser agent did not |
| 5. Display | **VERIFIED**, 28 endpoint checks and 23 rendered tiles against direct SQL, 0 mismatches |
| 6. Deployment | **VERIFIED**, `keepalive` present in all four files fetched from `jrsstandard.com` |
| 7. Race eliminated for a real visitor | **NOT LOCALLY VERIFIABLE.** Proving it requires a real browser navigating away mid-request against production. The browser in this environment has no outbound network |

**LIVE EXTERNAL EVENT INGESTION: NOT LOCALLY VERIFIABLE.** What remains to be externally verified: open a campaign link on a phone, tap the CTA immediately, and confirm the Today panel increments. The reconciliation line on that panel is the readout.

#### G. Counters, metrics and cohorts

No change this run. 53 counter spans, 0 blank, 0 unwritten, 0 orphaned. Six cohorts carry explicit `SUPPRESSED` / `INACTIVE` / `WITHHELD` designation with anti-inflation disclaimers, published at `/api/asset-stats` under `suppressed_cohorts` and rendered on the page.

**Baseline reconciliation, unchanged.** Inter-rater agreement 84.2% is a benchmark; the measured value is **Gwet's AC1 0.739**, 95% CI [0.402, 1.000], n=10 records, 36 labels. Cross-vendor drift <15% is a target; no drift calculation exists and measured reproducibility is 86.7%. The 9-question survey is confirmed. Active benchmark cohort: `bench-review.html` draws 24 raters over 10 records; whether that is the intended primary cohort is `[REQUIRES USER INPUT]`.

#### H. Files modified this run

`access.html` · `reviewer/index.html` · `training.html` · `investigator-guides.html` · `MASTER_TRACKER.md` · `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` · `research/MASTER_TRACKER.md`

#### I. Outstanding defects

| Defect | Status |
|---|---|
| Outbound clicks to the 2 external links are not tracked | **PRESENT, NOT REPAIRED.** No requirement established for tracking them |
| GA4 is loaded on 57 pages but no page emits a `gtag('event')` | **PRESENT.** GA4 records pageviews only; it is not part of the click pipeline and was not made part of it |
| Race elimination for a real visitor | **REQUIRES EXTERNAL VERIFICATION** |

#### J. TEAS dossier status

Unchanged. **JRS: REQUIRES USER INPUT. DRR: REQUIRES USER INPUT.** First Use Anywhere, First Use in Commerce and USPTO identification acceptability all remain `[REQUIRES USER INPUT]`. No new repository evidence was found for any of them this run.

#### K. Final QA certification

Fresh disk reads performed on all four modified HTML files, `pilot-status.html`, `bench-review.html`, `MASTER_TRACKER.md` and this file. All contain the changes reported. **The word "complete" is not used for the trademark dossiers or for live ingestion, because the evidence does not support it.**
### 2026-08-11T21:37:09Z : CORRECTION AND RESOLUTION OF TWO OPEN ITEMS

#### 1. CORRECTION: the navigation race was NOT reproduced

In the previous run I classified the click-tracking failure as **NAVIGATION RACE CONDITION** and described it as "the most likely reason a visitor can report reaching the page while no row exists for them." **I could not substantiate that and I am withdrawing it.**

Four separate harnesses were built to reproduce a cancellation. Results:

| Harness | Result |
|---|---|
| Playwright route interception, response held 700ms, navigate at 120ms | Inconclusive: no requests issued, navigation preceded script execution |
| Same, with fonts aborted so scripts run promptly | **Both control and deployed cancelled.** Route interception aborts on navigation regardless of `keepalive`, so the harness cannot decide the question |
| Real local HTTP server, response held 1500ms, navigate at 250ms | **Both delivered 2 of 2.** The request left the browser before navigation |
| Same, with 3G emulation at 300ms latency, navigate 40ms after DOM ready | **Both delivered 2 of 2** |

**A control with `keepalive` stripped out delivered every event in every scenario where the test could decide.** The plain `fetch` was not losing events under any condition I could construct.

**Revised classification: `keepalive` is HARDENING, NOT A PROVEN REPAIR.** It is correct, standard, costs nothing, and protects against a real failure mode on slower devices and networks than I can emulate here. It is **not** demonstrated to have fixed an active fault.

**Revised failure classification for the original symptom: the established cause is the endorsement write being dead from 2026-08-02 until 2026-08-11 08:30Z.** That is proven by the code history and by the row counts. Any additional loss beyond that window is **UNKNOWN / REQUIRES EXTERNAL VERIFICATION** and must not be attributed to the race.

#### 2. RESOLVED: active benchmark cohort, previously `[REQUIRES USER INPUT]`

Resolved from `bench_labels` by direct SQL. `bench-review.html` carries **two** cohorts, not one:

| Cohort | Raters | Labels | Records | First label | Last label |
|---|---|---|---|---|---|
| **Expert (E- codes, invited)** | 8 | 36 | 10 | 2026-06-11 | 2026-06-30 |
| Bench reviewer (R- codes, browser-generated) | 16 | 88 | 10 | 2026-06-11 | 2026-06-28 |

**The primary cohort is the expert cohort.** Its 36 labels over 10 records is exactly the denominator behind the published Gwet's AC1 of 0.739, which confirms the identification rather than assuming it.

**Both cohorts are dormant.** No label has been recorded since 2026-06-30, 42 days before this run. Under the anti-inflation rule, the bench-reviewer cohort must be designated **Suppressed / Inactive** and must not be added to the expert cohort to produce a 24-rater figure for reliability purposes: the two graded under different conditions and the published statistic is computed on the expert set alone.

**Item status: RESOLVED FROM REPOSITORY EVIDENCE. No longer `[REQUIRES USER INPUT]`.**

#### 3. Still outstanding

| Item | Status |
|---|---|
| First Use Anywhere, both marks | **`[REQUIRES USER INPUT]`** |
| First Use in Commerce, both marks | **`[REQUIRES USER INPUT]`** |
| USPTO identification acceptability | **`[REQUIRES USER INPUT]`** |
| Whether any click loss occurs beyond the proven outage window | **REQUIRES EXTERNAL VERIFICATION** |

**LIVE EXTERNAL EVENT INGESTION: NOT LOCALLY VERIFIABLE.** The single test that would close it: open a campaign link on a real phone, on a real network, and confirm the Today panel increments.

### 2026-08-12T13:09:24Z : THREE UNLOGGED RUNS RECORDED, AND ONE NEW MECHANISM

**Counter audit: PATCHED. Link-click telemetry: VERIFIED, no defect found.**

#### Process defect, recorded first because it is the reason for this entry

`MASTER_TRACKER.md` at the workspace root was last written at **2026-08-12T12:42:55Z**. Three runs happened after it and were logged only to `research/MASTER_TRACKER.md`. Two trackers exist and only one was being kept current. Both are now updated in the same step.

#### The three runs

**A. Outreach message check.** Two factual errors in a LinkedIn message, one caused by my own change earlier that day. The scroll instruction named a button with **0 occurrences** on the page after the CTA was renamed and moved to 419px; following it lands on "Open Module 1 first". The recommendation was described as automatic when it is an opt-in checkbox never posted without approval. Verified correct: link resolves with `src` preserved, Module 1 open without sign-up, 9 questions, 4-minute claim, and the separation-of-answers claim true and stronger than stated.

**B. Outreach template.** `research/Outreach_Template_Reviewer_Evaluation.md` created with both errors fixed. The CTA is described by **position**, not label, because a label breaks the moment copy changes and that is exactly how the original message went stale.

**C. Recommendation-requester mechanism.** The public dashboard published the count and **nothing exposed who**. Extended `api/support-contacts.js`, the existing token-gated owner endpoint, to return `recommendation_requests` and `certificate_requests` with everything needed to write and post: name, email, organization, printed title, LinkedIn URL, country, completion code, four consent flags, request timestamp.

**Answers are not joined in and cannot be.** The answer rows carry no identity and share no key with these rows. The endpoint returns who asked, never what they said.

| Verification | Result |
|---|---|
| No token | Four boolean diagnostics only, zero name or email keys |
| Wrong token | HTTP 401 |
| "recommendation" in unauthorized response | 0 occurrences |
| Public `asset-stats` payload | No email, no `linkedin_url` |

#### Trademark dossiers

Unchanged. **JRS REQUIRES USER INPUT. DRR REQUIRES USER INPUT.** First Use Anywhere, First Use in Commerce and USPTO identification acceptability all remain `[REQUIRES USER INPUT]`. No new repository evidence was found for any of them across these three runs.

#### Files modified

`api/support-contacts.js`, `research/Outreach_Message_Check_Priyam_2026-08-12.md`, `research/Outreach_Template_Reviewer_Evaluation.md`, `MASTER_TRACKER.md`, `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md`, `research/MASTER_TRACKER.md`.

### 2026-08-12T13:17:21Z : OWNER VIEW AND HONOR QUOTES

**Counter audit: PATCHED.** Three reported problems, one cause: private data existed with no usable way to reach it.

1. **The token URL I supplied could not work.** It carried a literal `<BENCH_ADMIN_TOKEN>` placeholder. My communication defect.
2. **Recommendation requests** were reachable only by hand-constructing a JSON URL.
3. **Honor acceptance quotes were readable nowhere.** `api/honor.js` stores a `quote`, `quote_clearance` and `byline_ok`; `asset-stats` counted the acceptance and stopped. A person could write a quote for publication and the owner could not read it back.

**Repaired:** `api/support-contacts.js` now returns `honor_acceptances` including the quote and its clearance state. `pilot-status.html` gains an **Owner View** taking the token in a field, held in `sessionStorage` for the tab only, with a Forget control.

**Uncleared quotes are rendered in stop-text and labelled not publishable.** A quote without its clearance must never be treated as if it were cleared.

**Verified:** no token returns four booleans and no private keys; wrong token returns HTTP 401; the page before unlock reads "Not unlocked. Nothing private is loaded."

**Not verifiable here:** the populated view, which needs the real token from Vercel. `[REQUIRES USER INPUT]`

### 2026-08-12T13:27:00Z : OWNER VIEW TOKEN REJECTION DIAGNOSED

**Counter audit: PATCHED.**

The owner view rejected the token. The endpoint's own diagnostic, which the page was discarding, gives the reason: **`admin_token_configured: false`, `run_token_configured: true`.**

**`BENCH_ADMIN_TOKEN` is not set in the Vercel environment.** No value entered against it could ever work. `RUN_TOKEN` is set and is the only accepted value. **I had instructed the owner to use the variable that does not exist.**

**Classification:** `ANALYTICS CONFIGURATION FAILURE` in the environment, plus `DISPLAY / REPORTING FAILURE` on the page for discarding a diagnostic it was already receiving. **Not a telemetry failure. Not an endpoint failure.** The gate correctly refused a token that did not match.

**Repaired:** the screen now names which variables are configured, states explicitly when `BENCH_ADMIN_TOKEN` is unset, tells the reader which value to use, and warns separately if the service key is missing. Booleans only; no token value is ever rendered or logged.

**Verified** against the exact production 401 payload in a real browser. **Populated view remains `[REQUIRES USER INPUT]`**: it needs the `RUN_TOKEN` value, which is not readable from this environment.

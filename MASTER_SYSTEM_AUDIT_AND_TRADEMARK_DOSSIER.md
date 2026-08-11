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
| PST pilot cases | **20** | no such study exists | **Not found** | searched all files | Not injected |
| Inter-rater agreement | **84.2%** benchmark | **Gwet's AC1 0.739**, 95% CI [0.402, 1.000], n=10 records, 36 labels | Current, measured | `research/compute_ac1_ci.py` | Not overwritten |
| Cross-vendor drift | **<15%** target | reproducibility **86.7%** | Current, measured | nightly study run | Not overwritten |
| Reviewer evaluation | **9 questions** | **9 questions** | Agrees | `api/reviewer-eval.js` | No change needed |
| Endorsements recorded | not applicable | **40** | Current | `interaction_events` | Preserved |
| Last endorsement | not applicable | **2026-08-04**, 7 days ago | Current | `/api/support-stats` | **Added to the page** |

**The 20-case PST baseline, the 84.2% figure, and the <15% drift figure do not appear anywhere in this repository or database.** Searched: `PST`, `84.2`, `20 Cases`, `Jan-Mar`, `Institutional Control Survey`, `15% variance`. Zero occurrences. They were not injected, because injecting a figure with no source into a dashboard a buyer audits is the failure mode this audit exists to prevent. If the PST study is real and external, supply the source and it will be loaded and reconciled with provenance.

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
| PST Pilot Study, 20 cases, Jan-Mar 2026 | **NOT ESTABLISHED BY REPOSITORY EVIDENCE.** No occurrence of any related term |
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

**Ground-truth block supplied in the directive, reconciled not injected.** PST Pilot Study 20 cases: `[REQUIRES USER INPUT]`, no occurrence of `PST`, `20 Cases` or `Jan-Mar` anywhere in the repository or database. 84.2% inter-rater: measured value is Gwet's AC1 **0.739**, 95% CI [0.402, 1.000], n=10 records, 36 labels, computed by `research/compute_ac1_ci.py`. Cross-vendor drift <15%: no drift calculation exists; reproducibility is 86.7%, so <15% is recorded as a target and not as a measurement. 9-question survey: **confirmed**, matches `api/reviewer-eval.js`. Active benchmark cohort 1 primary: `bench-review.html` draws 24 raters over 10 records from `bench_labels`; whether that is the "1 Primary Cohort" is `[REQUIRES USER INPUT]`.

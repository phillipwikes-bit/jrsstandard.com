# Accuracy Sweep — public pages vs live database (2026-08-01)

Method: pulled ground-truth counts from the live Supabase database via the connected integration, then grepped the public HTML pages and key summaries for numeric claims and compared. This pass covers the high-value public-facing stat claims; internal `.md` summaries likely carry the same drift and can be swept next.

## Ground truth (live DB, 2026-08-01)

| Metric | Live value |
|---|---|
| Arm A reviewers registered | 27 |
| Arm A complete (24/24) | 14 |
| Arm A usable (>=18) | 15 |
| Arm A not started | 12 |
| Arm B complete | 10 (4 JRS / 6 baseline) + 1 in progress |
| Real cases total | 29 (Tanvi V-HR-01: 22; E-08 FOIL: 7) |
| Guide downloads | 92 |
| Reliability labels (bench_labels) | 124 labels · 10 records · 24 raters (8 experts) |
| Determination split | Gap 76 (61%) · Needs work 26 (21%) · Ready 22 (18%) |
| Cross-vendor AI reproducibility (nightly) | latest 88.9% (7/31); recent runs 82–89% across 15 records |

## Discrepancies found

### 1. "108 determinations" + "Gap 69% / Needs work 18% / Ready 13%" — CONFIRMED STALE
- **Where:** `research.html`, `pilot.html` (and `results.html`)
- **Says:** "108 scored determinations across 10 records, Gap 69%, Needs work 18%, Ready 13%"
- **Should say:** **124 determinations across 10 records, Gap 61%, Needs work 21%, Ready 18%**
- Fix is exact and known.

### 2. "84% cross-vendor reproducibility" — STALE (and it moves nightly)
- **Where:** `research.html`, `pilot.html`, `results.html`, `acquisition-9f3c2a7d4b.html`
- **Says:** "84% cross-vendor (15 records)"
- **Reality:** the nightly run varies. Last three: 88.9% (7/31), 82.2% (7/30), 87.8% (7/29). "15 records" is still correct.
- **Recommended fix:** stop hard-coding a single number that changes every night. Either state a range ("~82–89% across nightly runs") or pull the latest value live. If a single figure is kept, the latest is ~89%, not 84%.

### 3. Reliability "Gwet's AC1 0.74 experts / 0.63 reviewers" — NEEDS RECOMPUTE
- **Where:** `research.html`, `pilot.html`
- **Status:** these were computed on the earlier 108-label snapshot. The dataset is now **124 labels** (16 new). The point estimates may have shifted. AC1 is not a one-line SQL calc, so it needs the scorer re-run on the current 124-label pull before the 0.74 / 0.63 figures can be re-certified. Do not assume they still hold.

### 4. "7 reviewers have completed the full 24-record blind read" — AMBIGUOUS / likely stale
- **Where:** `acquisition-9f3c2a7d4b.html` (buyer-facing page)
- **Issue:** this doesn't map cleanly to any current DB number. Arm A detection now has 14 complete / 15 usable; the reliability bench has 8 experts; FOIL has 7 cases. "7 reviewers on the 24-record read" is probably stale or conflates the FOIL case count. **Owner to confirm which metric it means**, then it gets corrected to the live figure.

## Checked and OK (no change needed)
- Illustrative case-study numbers ("12 Records / 3 Departments", "3–5 records", etc.) on index/enterprise/jrsstandard/workflow pages are hypothetical examples, not live study stats. Leave them.
- "15 records" for the AI reproducibility set is correct.
- Real-case guidance "5 then 20–30" (submit-validation) is instruction, not a live count.

## Root cause
Every stale number is a hand-written snapshot that froze while the database kept moving. The durable fix for the volatile ones (reproducibility %, reliability, counts) is to have the page pull them live, the way the pilot-status dashboard already does, rather than bake a number into HTML.

## Recommended next step
Batch-fix the four files (`research.html`, `pilot.html`, `results.html`, `acquisition-9f3c2a7d4b.html`): apply the exact fixes for #1, reframe #2 as a range or live pull, re-run the reliability scorer for #3, and confirm #4 with the owner. Then one deploy. Await owner go-ahead before editing public pages.

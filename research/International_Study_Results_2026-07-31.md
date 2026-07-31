# International Study — Current Results Snapshot (2026-07-31)

Computed from real collected data this date. Two things are separated deliberately: what the data can support **now**, and what is **not yet computable** so it is not reported as if it were.

---

## 1. Enrollment / completion (live, Supabase anon aggregate views)

- **Arm A (expert + trained panel, V-AI-##): 14 complete** (>=24 reads), 1 in progress (Niloofar Kandi, 22/24).
  Complete: SungSoo In, Sidharth Borah, Nigel Hee, Saurabh Nanda, Jake McDonough, Frank Schouten, Nitin Deshpande, Gabriela Cortez, Lawal Olabanji, Andrey Ekhmenin, Kyle McMullan, Gabriela Bar, Hekim Colpan, Andres Lage Freire.
- **Arm B (randomized comparison, RR-###): 10 complete.**
  - **B1 (JRS condition): 4** — RR-104, RR-106, RR-124, RR-126
  - **B2 (baseline / general prompt): 6** — RR-101, RR-107, RR-109, RR-110, RR-121, RR-125
  - In progress: RR-108 (B1, 9/24).
  - No completer excluded by the <18/24 rule (all 10 are at 24).

---

## 2. Reliability — Rung 2a (COMPUTABLE NOW, from `construct_validity_data.csv`, 108 labels / 10 records)

Gwet's AC1, 20,000-rep subject bootstrap, seed 20260727 (`compute_ac1_ci.py`).

| Panel | Records | Raters (mean/rec) | Raw agreement | Gwet AC1 | Bootstrap 95% CI |
|---|---|---|---|---|---|
| Experts (E-codes) | 10 | 8 (3.60) | 80.0% | **0.739** | [0.427, 1.000] |
| Trained (all labels) | 10 | 13 (7.20) | 71.9% | **0.634** | [0.309, 0.896] |
| Trained (deduplicated) | 10 | 13 (6.30) | 71.5% | **0.624** | [0.301, 0.886] |

- Floor check (point >= 0.61): **passes** for all three (experts 0.739, trained 0.624–0.634).
- Floor check (CI-low >= 0.41): **fails** — lower bounds sit at 0.30–0.43. Wider CIs are the honest consequence of the modest rater count and must be reported, not hidden.
- Secondary (experts): Krippendorff alpha 0.617, Fleiss kappa 0.646. Per-condition AC1 (experts): basis 0.25, cold 0.44, accountability 0.36, reasoning 0.55, temporal 0.34.

This is the reliability substudy dataset (8 expert E-codes + 13 trained R-codes on the 10-record bench). It is not the same table as the Arm B detection responses below.

---

## 3. Arm B accuracy comparison (Floor 3) + detection vs held-out key (Floor 2 / H3) — NOT COMPUTABLE THIS SESSION

The headline "does JRS beat the baseline" number requires the **raw per-record judgments** of the 10 Arm B completers (each record marked grounded/ungrounded), scored against the verified answer key. Two blockers, stated plainly:

1. **Data access.** The raw response rows (`ai_pilot_reads`, batch `armB`) are RLS-locked. The anon aggregate views used above expose **read counts only**, not the labels. No service-role key is present in this session (`SUPABASE_ACCESS_TOKEN` not set), so the labels cannot be pulled or scored here. Producing an accuracy figure without that data would mean inventing it, which is not done.
2. **Design floor on B1.** Per `ArmB_Design.md`, the minimum viable is **5–8 participants per condition**. B1 (JRS) currently has **4** completers, below the 5-per-arm floor. B2 has 6. Even with the raw data in hand, the B1 vs B2 difference at n=4/6 would be reported with a wide CI and flagged as preliminary, not confirmatory.

### To unblock the accuracy results, one of:
- Provide a service-role key / an export of the Arm B response rows (record_id, condition, determination per RR-code), and the analysis runs immediately against `Verified_Key.md`; **and**
- Land at least 1 more B1 completer (RR-108 is at 9/24) to clear the 5-per-arm design floor.

Until both are in hand, Floor 3 stays "in progress," consistent with the pre-registered plan (results reported only after data lock, deviations labeled).

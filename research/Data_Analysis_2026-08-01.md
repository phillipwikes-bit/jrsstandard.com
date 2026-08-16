# JRS study: current data analysis (pulled live 2026-08-01, ~18:35 UTC)

All figures below are computed from the live Supabase anon-readable aggregate views (`pilot_progress`, `armb_progress`, `bench_labels`), the same sources the public status page uses. Method scripts: `research/check_completion.py` (counts) and Gwet's AC1 per `research/compute_ac1_ci.py` (reliability). Raw pull saved this session.

---

## 1. Completion counts (live, both arms)

**Detection panel (Arm A): 14 complete** (24/24 reads), 1 in progress, 10 countries on 5 continents.

Complete: Jake McDonough (V-AI-01), Frank Schouten (V-AI-03), Dr Nitin Deshpande (V-AI-06), Saurabh Nanda (V-AI-07), (name withheld) (V-AI-08), Lawal Olabanji (V-AI-10), Andrey Ekhmenin (V-AI-11), Kyle McMullan (V-AI-12), Gabriela Bar (V-AI-16), Hekim Colpan (V-AI-20), SungSoo In (V-AI-24), Sidharth Borah (V-AI-27), Nigel Hee (V-AI-28), Andres Lage Freire (V-AI-30). In progress: Niloofar Kandi (V-AI-23) at 22/24.

Countries represented by completers: United States, United Kingdom/Ireland, Germany, Poland, Spain (Europe); India, Singapore, South Korea (Asia); Nigeria (Africa); Australia (Oceania); United States (North America). Ten countries, five continents.

**Randomized comparison (Arm B): 11 complete** (24/24), 1 in progress.
- B1 (JRS condition): 4 complete — RR-104, RR-106, RR-124, RR-126.
- B2 (baseline condition): 7 complete — RR-101, RR-107, RR-109, RR-110, RR-121, RR-125, RR-130.
- In progress: RR-108 (B1) at 9/24.

This is up from the draft's stale figure (7 complete, 3 JRS / 4 baseline). Current is 11 complete, 4 JRS / 7 baseline. The JRS arm (B1) remains the short arm and is still below the pre-registered per-arm target.

**Total completers across both arms: 25.**

---

## 2. Inter-rater reliability (Rung 2a), corrected and current

Computed from live `bench_labels`, JRS-mode reads only (`mode=jrs`), one label per rater-record (last submission wins), Gwet's AC1 over records with at least two raters. Codes beginning `E-` are experts; `R-` are trained reviewers (per Methods 4.7).

| Group | AC1 | 95% CI (record bootstrap) | Raw agreement | Labels | Raters | Records |
|---|---|---|---|---|---|---|
| Experts (E-) | **0.739** | [0.43, 1.00] | 0.800 | 36 | 8 | 10 |
| Trained (R-) | **0.623** | [0.30, 0.88] | 0.712 | 63 | 13 | 10 |
| Pooled | 0.665 | [0.41, 0.88] | 0.742 | 99 | 21 | 10 |

Both experts and trained reviewers clear the pre-registered point floor of 0.61. The estimates reproduce the originally reported figures (0.74 expert, 0.63 trained) on the current data.

These are interim, 10-record estimates against a pre-registered pooled target of about 26 records, so the confidence intervals are wide. The pre-registered lower-bound criterion (95% CI lower bound at least 0.41) is met for experts (0.43) and pooled (0.41), and is not yet met for the trained group alone (0.30). Completing the pooled record set is what tightens these.

### 2.1 Correction of the earlier "collapse to 0.18"

An earlier analysis this session reported the trained-reviewer AC1 collapsing to about 0.18. That was an error: it mixed baseline-condition labels (`mode=normal`, where reviewers judged without the JRS conditions) into the JRS reliability set. Three raters (R-mqhv2o4r8nct, R-mqn414vzho7i, R-mqnibu38bbxi) accounted for it, and all of their labels are `mode=normal`, not JRS reads.

Reproduced both ways on the live data:
- Trained, all modes mixed (the contaminated set): AC1 = 0.157, raw 0.420. This is the artifact.
- Trained, JRS reads only (correct): AC1 = 0.623, raw 0.712.

Reliability of the JRS read must use JRS-mode labels. On that basis reliability does not collapse; it holds at the originally reported level and clears the floor. The prior decision to pull reliability to "preliminary and not reported" was made on the mistaken 0.18. See Section 4 for what this means for the pages and the paper.

---

## 3. What is not computable from the anon views (needs admin access)

These require the RLS-locked answer tables or the versioned admin endpoint (`BENCH_ADMIN_TOKEN` / service role), which the anon key does not reach:

- **Detection accuracy (Arm A):** reviewer determinations vs the verified key. The detection-panel answers are not in the anon `bench_labels` view (which holds only the `E-`/`R-` reliability set), and the Arm B answer view returns 404 to anon.
- **Arm B accuracy (B1 vs B2):** same access limit.

Owner-run figures from earlier this session (via elevated SQL, DB-verified at the time): Arm A detection 82.6 percent; Arm B B1 (JRS) 74.0 percent; Arm B B2 (baseline) 72.9 percent. These are the last known accuracy numbers; refreshing them as of today requires the admin token, which is not handled here. The Arm B gap (B1 minus B2, about +1.1 points) was not significant and the sample is small; that status is unchanged and both arms remain below the pre-registered per-arm target.

- **Cross-vendor reproducibility (nightly):** the reproducibility run table is not anon-readable. The locked reported figure stands: 84 percent mean pairwise agreement across 15 records (run 2026-07-06), framed as consistency, not accuracy. A refreshed nightly value requires the run data.

---

## 4. Effect on the paper and the pages

- **Reliability can be reported again as interim.** With the 0.18 shown to be an artifact, the honest current statement is: experts AC1 0.74 and trained 0.62, both clearing the 0.61 point floor, on 10 interim records, with wide CIs and the trained lower bound not yet at the 0.41 criterion. This is a defensible interim result, not a collapse. Whether to restore it to the public pages and the manuscript (currently set to "preliminary, not reported") is the owner's decision; the data supports either the interim-report framing or continuing to hold it until the pooled set completes.
- **Panel counts in the manuscript are stale.** Update Arm A to 14 complete and Arm B to 11 complete (4 B1 / 7 B2) as of this pull, or to the counts on the actual submission date.
- **Primary accuracy results remain gated** pending the pre-registered sample and admin-side scoring; nothing here changes that.

---

## 5. Reproducibility of this analysis

- Counts: `python3 research/check_completion.py`
- Reliability: pull `bench_labels` (anon), filter `mode=jrs`, dedup last per (record, rater), Gwet's AC1 over records with at least two raters, record-level bootstrap for the CI. Anon key is public by design (shipped in site HTML).
- The `mode=normal` labels are baseline reads and are excluded from JRS reliability by construction.

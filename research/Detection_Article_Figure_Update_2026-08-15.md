# Detection_Article_v2_ExpertFocus: updated figures at data close

**Locked 2026-08-15.** Every number below was recomputed from the study database today. The draft's own status line asks for exactly this: *"On the close date every figure is recomputed from the study database in one pass and this line is replaced with the locked figures and the lock date."*

---

## 1. The draft's central caveat resolved, and it resolved in your favour

The status line says:

> *"Eleven invited panel reviewers have not yet started, and any one of them finishing before the close date changes the completer count, the point estimate, the interval, the sensitivity and specificity figures, and the country count."*

**None of them started.** `pilot_progress` at close: 27 registered rows, 16 with reads, **11 with zero reads**. Still exactly eleven, still zero.

**So the completer count, the country count and the continent count are unchanged from the draft.** The primary result does not move.

---

## 2. Figure-by-figure reconciliation

| Draft figure | Value at close 2026-08-15 | Status |
|---|---|---|
| 16 reviewers completed the full corpus | **16** | unchanged |
| 11 countries | **11** | unchanged |
| 5 continents | **5** | unchanged |
| 384 graded reads | **384** (16 × 24 after keeping the latest submission per record; 510 raw rows including resubmissions) | unchanged |
| Panel accuracy 83.9%, 95% CI 72.7 to 95.1 | **83.9%, 72.7 to 95.1 — VERIFIED, see section 4** | unchanged |
| Sensitivity 87.0%, specificity 80.7% | **still unverified, see section 4** | one step outstanding |
| "five reviewers scoring perfectly" | **six scored 100%** | **CORRECT THIS** |
| Cross-vendor 84%, 15 records, latest run 2026-07-06, band 78 to 87% | **87.8% on 15 records, latest run 2026-08-12. 55 runs on record, range 66.7 to 93.3%, mean 84.5%** | **STALE, must be updated** |
| Reliability corpus: 108 submitted, 99 after one label per rater per record | **113 submitted, 104 after the same rule** | **update the counts** |
| Experts Gwet's AC1 **0.739**, 36 labels, 10 records | **0.739, 36 labels, 8 raters, 10 records** | **reproduces exactly** |
| Trained reviewers AC1 **0.624**, 63 labels | **0.623, 68 labels, 14 raters, 10 records** | reproduces; label count up |
| Condition table on 14 Ready / 75 Gap | **14 Ready / 77 Gap**, all five still significant | **update denominators** |
| "no rater used fail... raters worked entirely in the upper two levels" | **contradicted by the data, see section 5** | **CORRECT THIS** |
| Status line: closes "expected 14 August 2026" | closed **2026-08-15** | update |

---

## 3. The reliability hold from 2026-08-01 is resolved, and the published figures were right

`research/Accuracy_Sweep_2026-08-01.md` recorded that trained-reviewer AC1 **collapsed from 0.63 to 0.18** when recomputed on the full database, and blocked every reliability number pending an owner decision on whether the set was "still accumulating" or "curated and locked".

**Neither. The collapse was an instrument-mixing error, and it is now demonstrated rather than argued.**

`bench_labels.mode` records which instrument a rater used: `jrs` for the five conditions, `normal` for the unstructured baseline. AC1 under four inclusion rules:

| Inclusion rule | Experts | Trained reviewers |
|---|---|---|
| **jrs mode only, one label per rater per record** (the draft's stated rule) | **0.739** (36 labels, 8 raters) | **0.623** (68 labels, 14 raters) |
| jrs mode only, not deduplicated | 0.739 (36) | 0.634 (77) |
| all labels including `normal` mode, deduplicated | 0.739 (36) | **0.157** (83 labels, 17 raters) |
| all labels including `normal` mode, not deduplicated | 0.739 (36) | **0.180** (93 labels, 17 raters) |

**The three raters the 2026-08-01 sweep named as the cause are exactly and only the three `normal`-mode raters:**

| Rater | Labels | Mode |
|---|---|---|
| R-mqhv2o4r8nct | 5 | `normal` |
| R-mqn414vzho7i | 6 | `normal` |
| R-mqnibu38bbxi | 5 | `normal` |

Sixteen labels, all of them from the unstructured arm. Those raters were **not using the five conditions**. Putting them into a reliability estimate for the JRS instrument measures agreement between people using two different methods, which is not a reliability coefficient at all.

The 2026-08-01 note observed that "those raters skew Ready/Needs-work while the earlier pool skews Gap". That is right, and it is the reason to exclude them rather than a reason to worry: `normal` determinations run 8 Ready / 7 Review / 1 Gap, against `jrs` at 14 Ready / 22 Review / 77 Gap. **That difference is the effect the comparison study exists to measure.** Folding it into the reliability figure destroys both numbers.

**Recommendation, for your decision, not mine:** state the inclusion rule explicitly in the methods as *"labels recorded under the five-condition instrument (`mode = jrs`), one label per rater per record, latest submission retained"*, and keep 0.739 and 0.624. That rule is not chosen to produce a result: it is the rule the draft already describes, and it is the only rule under which the coefficient measures what the paper says it measures. **0.624 in the draft versus 0.623 recomputed is a rounding difference, not a change.**

---

## 4. Accuracy is verified. Only sensitivity and specificity are outstanding.

**Correcting what I told you earlier.** I said the whole headline needed a service-role
re-run. That was more than the situation requires: two thirds of it is already verified
without any credential.

**Accuracy 83.9% and the 72.7 to 95.1 interval are VERIFIED at close.**

`research/analysis_2026-08-04.py` holds the sixteen per-reviewer accuracy scores as
returned by the database, so the figure is reproducible offline. Running it prints
`n=16, mean 83.9%, SD 21.0, 95% CI 72.7 to 95.1` — the manuscript's numbers exactly.

The only question was whether those scores are still current, and they are:

| Reviewer activity | Latest |
|---|---|
| Last Arm A submission of any kind | V-AI-29, **2026-08-03** |
| Snapshot the analysis was taken from | **2026-08-04** |
| Completers with any activity after 2026-08-04 | **0 of 16** |

No reviewer touched their data after the snapshot, so the scores cannot have moved and
the accuracy figure is locked as published.

**Sensitivity 87.0% and specificity 80.7% are still unverified.** They cannot be derived
from participant-level accuracies: they need the per-record judgments, and those live in
`ai_pilot_reads` behind row-level security. No saved file in the repository holds them.

**How to close that last item without putting a key anywhere it should not be:**
`scripts/verify_detection_accuracy.py` was written for exactly this. Run it on your own
machine:

```
export SUPABASE_SERVICE_ROLE_KEY='<service key>'
python3 scripts/verify_detection_accuracy.py
```

It reads the key from your environment, never prints it, never writes it to a file, and
never sends it anywhere except Supabase. It prints per-reviewer accuracy, sensitivity and
specificity, then compares all three against the manuscript and marks each MATCHES or
DIFFERS. With no key set it explains how to set one and stops rather than inventing a
number. It mirrors `scripts/export_arm_b_data.py`, which already does this for Arm B.

**A discrepancy found while checking.** The draft says *"with five reviewers scoring
perfectly."* The saved scores are
`[100, 100, 100, 100, 100, 100, 95.83, 95.83, 91.67, 87.5, 79.17, 79.17, 75, 58.33, 41.67, 37.5]`.
**Six reviewers scored 100%, not five.** Correct the sentence.

**Unrelated but worth knowing:** the same file carries Arm B figures at `B1 n=5, B2 n=11`.
At close Arm B is `B1 7, B2 13`. Those numbers belong to the comparison paper, not this
one, but do not reuse them from that file without recomputing.

## 5. One claim in the draft is contradicted by the data

Section 5.4 ends:

> *"The instrument offers pass, review and fail on each condition, and across all 108 structured labels no rater used fail. Raters worked entirely in the upper two levels, so the separations above are between pass and review rather than across the full scale, and the instrument's behaviour at its lowest level is untested in this corpus."*

That is not what the data shows. The three levels stored are `pass`, `review` and `gap`. Across the 113 jrs-mode labels:

| Value | Times used |
|---|---|
| `gap` (lowest level) | **216** |
| `pass` | 207 |
| `review` | 142 |

**The lowest level is the most-used value of the three, and 77 of 113 labels use it at least once.**

This matters in the direction that helps the paper: the draft states a limitation it does not have, and by doing so it understates the demonstrated range of the instrument. The separations in the condition table are across the full scale, not the top two levels. **Delete or rewrite that paragraph rather than carry it into submission.** If "fail" was a different label in an earlier version of the instrument, say so, but the corpus as stored does exercise all three levels.

---

## 6. Condition table, recomputed at close

Ready n = 14, Gap n = 77. Wilson intervals, Fisher exact two-sided, same as the draft.

| Condition (draft name) | stored key | Pass rate, Ready | Pass rate, Gap | Fisher |
|---|---|---|---|---|
| Reconstructability | `cold_reviewer_clarity` | 14 of 14 (100%, 78 to 100) | **15 of 77 (19%, 12 to 30)** | 7.3e-09 |
| Basis identification | `basis_identification` | 14 of 14 (100%, 78 to 100) | **20 of 77 (26%, 17 to 37)** | 1.3e-07 |
| Chronological integrity | `temporal_reconstructability` | 14 of 14 (100%, 78 to 100) | **10 of 77 (13%, 7 to 22)** | 1.8e-10 |
| Decision-process traceability | `reasoning_traceability` | 14 of 14 (100%, 78 to 100) | **10 of 77 (13%, 7 to 22)** | 1.8e-10 |
| Evidentiary sufficiency | `accountability_support` | 14 of 14 (100%, 78 to 100) | **7 of 77 (9%, 4 to 18)** | 1.1e-11 |

All five still separate at p < 1.5e-07. The conclusion in the draft holds; only the Gap denominator and three cell counts move.

---

## 7. Suggested replacement for the status line

> **Status: FINAL. Data locked 2026-08-15.** All figures are computed from the study database as of the lock date. The eleven invited panel reviewers who had not started as of 6 August 2026 did not start before the close, so the completer count, country count and continent count are unchanged from the pre-close draft. This manuscript reports Study 011, the detection study, and nothing else.

---

## 8. Checklist before submission

- [x] Accuracy 83.9% and CI 72.7 to 95.1 VERIFIED at close, no credential needed.
- [ ] Run `scripts/verify_detection_accuracy.py` with your key to confirm sensitivity 87.0% and specificity 80.7%.
- [ ] Correct "five reviewers scoring perfectly" to **six**.
- [ ] Replace cross-vendor 84% / 2026-07-06 with **87.8% / 2026-08-12**, and the band 78 to 87 with the observed **66.7 to 93.3 across 55 runs**.
- [ ] Update reliability counts 108 to **113** submitted, 99 to **104** retained; trained-reviewer labels 63 to **68**.
- [ ] Update the condition table Gap denominator 75 to **77** and the three changed cells.
- [ ] Delete or rewrite the "no rater used fail" paragraph.
- [ ] State the reliability inclusion rule (`mode = jrs`, one label per rater per record) in the methods.
- [ ] Replace the status line.

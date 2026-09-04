# Data close and figure lock: run this on 14 August 2026

Nothing is submitted, posted, or sent before this runs. One pass, in this order, so no figure anywhere can be left stale.

---

## Who can still change the numbers

**Panel, Study 011.** 16 complete. **Eleven invited reviewers have not started**: V-AI-05 Alankar Yaduvanshi, V-AI-14 Terra Shouse, V-AI-15 Yetunde Adesiyan, V-AI-17 Shakiba Mahvash (withdrawn, excluded), V-AI-18 Saad Farooq, V-AI-19 Sanya Dalal, V-AI-21 Tarun Samtani, V-AI-22 Ilya Diankoff, V-AI-25 David Grannum, V-AI-26 Anant Rai, V-AI-31 Alexandria Davis. No panel reviewer is part-way through, so any change comes from someone starting and finishing all 24.

One completion moves: the completer count, the accuracy point estimate, the confidence interval, sensitivity, specificity, the graded-read total, and possibly the country count.

**Comparison, Study 012.** RR-108 is at 9 of 24. That study is reported separately and does not gate this paper.

---

## Step 1: verify completion

```
python3 research/check_completion.py
```

Record: how many Arm A reviewers are at 24 or more reads, and their codes. That count is the paper's n.

## Step 2: recompute the detection figures

Run the participant-level scoring against the fixed key: mean accuracy, SD, 95 percent CI, sensitivity, specificity, graded reads. Only reviewers with at least 24 graded reads are included, per the pre-registered rule.

## Step 3: recompute the country list

Map every completer code to its country from the roster table in this tracker. Count distinct countries and continents. Do not carry the number forward from a previous run.

## Step 4: recompute reliability

```
python3 research/compute_ac1_ci.py
```

Confirm AC1 for experts and trained reviewers, the raw pairwise agreement, and both confidence intervals. Reliability is on a separate record set and will only change if new labels arrive.

## Step 5: update every place a figure appears

| Where | What to change |
|---|---|
| `research/Detection_Article_v2_ExpertFocus.md` | Abstract, Section 4.3 participants, Section 5.1 table, Section 5.3, Discussion, Conclusion, and the status line, which becomes the locked figures and the lock date |
| Rebuild the Word file | `python3 research/md_to_docx.py research/Detection_Article_v2_ExpertFocus.md` |
| `research.html` | Lead paragraph, evidence card, Study 011 block; remove the provisional wording |
| `pilot.html` | Research block and the detection study card; remove the provisional wording |
| `results.html` | The cross-reference line |
| `acquisition-9f3c2a7d4b.html` | Progress card and R3; remove the provisional wording |
| LinkedIn About | The detection bullet and the country count |

## Step 6: sweep for anything missed

Re-run the audit that found the last stale figure: extract every numeric claim from the visible copy of all HTML files and check each against the locked set. The specific patterns to search are old completer counts, old country counts, AC1 0.63, 82.x accuracy, and any Arm B figure appearing publicly.

## Step 7: only then

1. Confirm Ubayet's sign-off on the locked figures.
2. Post the preprint.
3. Submit to AI and Ethics with the cover letter disclosing the companion study.

---

## Standing rule until close

No figure from this study goes into any new message, post, profile, or document without the words "as of 5 August 2026, provisional until close." The public pages already carry that wording as of today.

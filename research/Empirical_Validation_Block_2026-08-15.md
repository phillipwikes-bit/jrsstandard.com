# EMPIRICAL VALIDATION block: corrected

Two figures in the supplied block are wrong. Both are corrected below with the source for each.

---

## SUPPLIED

> 📊 EMPIRICAL VALIDATION
> • **Detection:** In a blind study against a verified answer key, 16 independent experts identified unreconstructable records at 83.9% accuracy.
> • **Reliability:** Pre-registered testing demonstrated substantial inter-rater agreement (Gwet's AC1 0.74 experts, 0.62 trained).
> • **AI Consistency:** Multi-vendor LLM testing showed 84% cross-model agreement on identical records.
> • **Global Review:** 58 international reviewers across 16 countries evaluated records for this framework.

## AUDIT

| Line | Verdict | Source |
|---|---|---|
| Detection 83.9%, 16 experts | **Correct** | `closed_aggregates_2026-08-15.json`, raw 83.85, half-up 83.9, n=16 |
| Reliability 0.74 / 0.62 | **Correct** | recomputed from `bench_labels`: 0.7394 and 0.6228 |
| AI Consistency 84% | **WRONG, stale** | 84% came from a single run on 2026-07-06. Current series is 87.2% |
| 58 reviewers across 16 countries | **WRONG, scope error** | 16 countries belongs to the **36 completers**, not to all 58 reviewers |

### Why the country line is wrong

`/api/panel-stats` carries this in its own `countries_scope` field:

> *"the 36 reviewers who completed a full 24-record set. NOT all 58 reviewers: attaching this figure to the reviewer total is a recorded past defect."*

The programme has published that error once already, as "54 reviewers across 16 countries". The 58 figure counts everyone who graded at least one record. The 16-country figure counts only the 36 who completed a full set. Joining them in one sentence claims a country spread for a population it was not computed on.

### Why the AI line is wrong

84% was one nightly run, 2026-07-06. The process runs every night, so any single-run figure is stale the next morning: the latest run has since been 87.8% on 12 August and 82.2% on 15 August. Fifteen of the 56 cross-vendor runs also scored only 2 or 3 records while the corpus was being built, where one disagreement moves the mean 11 points.

The stable figure is the series on the fixed 15-record set: **41 runs, mean 87.2%, 95% CI 86.2 to 88.2, range 82.2 to 93.3.**

---

## CORRECTED

📊 **EMPIRICAL VALIDATION**

• **Detection:** In a blind study against a verified answer key, 16 independent experts identified unreconstructable records at **83.9% accuracy** (95% CI 72.7–95.1, 384 graded reads). Pre-registered threshold cleared.

• **Reliability:** Pre-registered testing showed substantial inter-rater agreement (Gwet's AC1 **0.74** experts, **0.62** trained). Interim, on 10 records.

• **AI Consistency:** Multi-vendor LLM testing showed **87.2% mean cross-model agreement** across 41 runs on the same 15 records (95% CI 86.2–88.2). Consistency of application, not correctness.

• **Global Review:** **58 international reviewers** graded records for this framework across three studies. **36 completed a full 24-record set, across 16 countries and 5 continents.**

---

## OPTIONAL FIFTH LINE

The block lists four results and no null. The comparison study closed on 15 August and did not meet its pre-registered bar. Including it costs one line and removes the strongest objection anyone can raise, which is that the block reports only what worked.

• **Comparison study:** Applying the five conditions scored 75.0% against 67.6% for a general prompt. The 7.4-point difference did not clear the pre-registered bar (95% CI −15.3 to +30.0). Underpowered by design and reported as a null.

---

## TWO WORDS TO WATCH

**"demonstrated"** in the reliability line. Both coefficients clear the 0.61 point floor and neither clears the plan's secondary criterion that the lower confidence bound exceed 0.41. "Showed" is used above instead. If the block goes anywhere a methodologist reads it, that distinction is the first thing they check.

**"identified"** in the detection line is correct as written. It describes what the panel did against a key, and claims nothing about the instrument's advantage over unaided judgment.

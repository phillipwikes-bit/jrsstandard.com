# Accuracy results, scored against the verified key (2026-08-01, live)

Computed by the owner running `research/accuracy_query.sql` in Supabase against `ai_pilot_reads`, scored vs the verified R01-R24 key. Latest submission per reviewer-record; predictions mapped Ready/Yes = grounded, Needs work/Gap/No = unsupported.

| Arm | Reviewers | Graded reads | Accuracy | Sensitivity (catch unsupported) | Specificity (pass grounded) |
|---|---|---|---|---|---|
| Arm A detection (expert panel) | 15 | 358 | **82.7%** | 86.0% | 79.4% |
| Arm B B1 (JRS) | 5 | 105 | **72.4%** | 81.1% | 63.5% |
| Arm B B2 (baseline) | 7 | 168 | **66.1%** | 59.5% | 72.6% |

**Arm B difference (the pre-registered primary test): B1 − B2 = +6.3 points in favor of JRS.**

## What changed vs the earlier figures (82.6 / 74.0 / 72.9)

- **Arm A: 82.7% now vs 82.6% before.** Unchanged.
- **Arm B B1 (JRS): 72.4% now vs 74.0% before.** Slightly lower; the B1 count now includes RR-108's 9 partial reads (RR-108 is at 9/24, still in progress).
- **Arm B B2 (baseline): 66.1% now vs 72.9% before.** Lower by ~7 points, because three more baseline reviewers completed since the earlier run (RR-110, RR-125, RR-130), and they pulled the baseline average down.
- Net effect: the JRS-vs-baseline gap widened from +1.1 (earlier) to **+6.3** now, with the direction favoring JRS.

## Honest caveats (do not overclaim)

1. **Significance is not established.** The query returns point accuracy only. The pre-registered comparison uses a participant-clustered test (bootstrap) against a superiority threshold, not a raw read-level count. A +6.3 point gap on these sample sizes is directional, not a confirmed effect. It has NOT been shown significant.
2. **Underpowered.** The JRS arm (B1) has 4 complete reviewers plus RR-108 partial; below the pre-registered per-arm target. Numbers can still move as RR-108 finishes and more reviewers complete.
3. **RR-108 partial reads are included.** The query grades all reads. A stricter pre-registered read would drop reviewers with fewer than 18 graded reads (RR-108 at 9). Re-running with that filter is the cleaner primary read.
4. **Arm A (82.7%) is not evidence that JRS raises accuracy.** There is no expert-without-JRS control, so Arm A reflects expertise, not the standard.

## Bottom line, plain English

- Experts applying JRS match the key 82.7% of the time. Strong, but that is expertise, not proof the standard adds value.
- In the clean randomized test among fresh reviewers, the JRS group (72.4%) now scores 6.3 points above the plain-prompt baseline (66.1%). This is the first run where the gap favors JRS by a real margin, but the sample is small and significance has not been tested, so it is a promising direction, not a confirmed result.
- For the paper: keep the primary Arm B result labeled preliminary/underpowered until the per-arm target is met and the pre-registered test is run. Do not state the +6.3 as a proven JRS effect yet.



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



## Run: 2026-08-11T21:37:09Z : CORRECTION

**Overall execution status:** one prior finding withdrawn, one open item resolved from evidence.

| # | Item | Status |
|---|---|---|
| 3 | Link-click telemetry | **PRESENT BUT NOT OPERATIONALLY VERIFIED** as previously claimed. See correction below |
| 4 | Link-click repair | **HARDENING APPLIED, RACE NOT REPRODUCED.** `keepalive` is correct and retained; it is not a proven fix |
| 5 | Link inventory | **VERIFIED**, 785 links, 66 pages |
| 6 | Counter audit | **VERIFIED** |
| 7 | Metric reconciliation | **VERIFIED** |
| 8 | JRS dossier | **REQUIRES USER INPUT** |
| 9 | DRR dossier | **REQUIRES USER INPUT** |
| 15 | Active benchmark cohort | **RESOLVED FROM EVIDENCE.** Was `[REQUIRES USER INPUT]` |

### Correction

The previous run classified the failure as NAVIGATION RACE CONDITION and called it the most likely reason a visitor left no row. **Four harnesses failed to reproduce a cancellation, including a real HTTP server under 3G emulation.** A control with `keepalive` stripped delivered every event in every scenario the test could decide. The claim is withdrawn.

`keepalive` is retained as hardening. **The established cause of the original symptom remains the endorsement write being dead from 2026-08-02 to 2026-08-11 08:30Z**, which is proven by code history and row counts.

### Resolved this run

**Active benchmark cohort.** `bench-review.html` carries two cohorts: expert (8 raters, 36 labels) and bench reviewer (16 raters, 88 labels), both over the same 10 records, both dormant since 2026-06-30. The primary is the expert cohort, confirmed because its 36 labels over 10 records is exactly the denominator behind the published AC1 0.739. The bench-reviewer cohort is designated **Suppressed / Inactive** and must not be merged into a 24-rater reliability figure.

### Required user inputs

First Use Anywhere · First Use in Commerce · USPTO identification acceptability. All three for both marks.

### Requires external verification

Whether any click loss occurs beyond the proven outage window. Test: open a campaign link on a real phone and confirm the Today panel increments.

### Files modified this run

`MASTER_TRACKER.md` · `MASTER_SYSTEM_AUDIT_AND_TRADEMARK_DOSSIER.md` · `research/MASTER_TRACKER.md`. **No code was changed this run.** `keepalive` from the previous run is retained.

---

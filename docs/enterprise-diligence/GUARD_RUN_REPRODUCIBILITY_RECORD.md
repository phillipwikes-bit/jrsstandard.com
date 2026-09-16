# Guard Run Reproducibility Record

**Opened 2026-09-16 after a guard figure proved to differ between modes and, on one occasion,
between runs. Every run is logged. Figures are never normalised and never averaged.**

| Timestamp (UTC) | Mode | Commit | Command | Checks | Failed | Skipped | Failure identity | Network |
|---|---|---|---|---|---|---|---|---|
| 2026-09-15 ~15:00 | online | `9343124` | `check_zero_drift.py` | **135** | 0 | 1 | — | available |
| 2026-09-15 ~16:00 | **online** | `9e451d0` | `check_zero_drift.py` | **136** | **1** | 1 | **NOT CAPTURED** | available |
| 2026-09-15 ~16:05 | online | `9e451d0` | `check_zero_drift.py` | 135 | 0 | 1 | — | available |
| 2026-09-15 ~16:06 | online | `9e451d0` | `check_zero_drift.py` | 135 | 0 | 1 | — | available |
| 2026-09-15 | offline | `9e451d0` | `--offline` | **131** | 0 | 2 | — | n/a |
| 2026-09-16 | offline | `3026575` + working tree | `--offline` | 131 | 1 | 2 | — | n/a |
| 2026-09-16 | online | `3026575` + working tree | `check_zero_drift.py` | 135 | 1 | 1 | — | available |
| 2026-09-16 | online (repeat) | `3026575` + working tree | `check_zero_drift.py` | 135 | 1 | 1 | — | available |

## Why online and offline differ, established rather than assumed

**Three checks are registered only when the network is available** and are absent entirely in
offline mode, rather than being converted to SKIP:

- *countries belong to completers, not all reviewers*
- *live /api/asset-stats exposes link_clicks*
- *live panel geo fully resolved*

An adversarial pass ran only `--offline`, saw 131, and inferred *"131 is the ceiling in any
mode"*. **That inference was wrong.** The observation was right.

## The 136 / 1-failed run — NOT ESTABLISHED

One online run reported **136 checks with 1 failure**. Two immediate re-runs reported 135/0/1
and **the failing check was not captured**.

**This is NOT classified as flaky.** It is classified **NOT ESTABLISHED**, because the evidence
to call it either way was not retained. A count that moves between runs at the same commit is
itself an evidence-quality defect, and it is recorded rather than explained away.

**What would resolve it:** capturing full output on every online run, which this record now
requires.

## Rule

**Never report a single combined figure.** Always state the mode. Both figures, and the commit,
belong with any claim that rests on them.

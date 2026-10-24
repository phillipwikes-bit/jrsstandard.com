# Performance Record

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

These are local engineering budgets measured on one development container (Node v22.22.0, linux-x64). They are not production performance, latency or throughput figures and say nothing about any deployed system.

| Budget | Limit | Observed (2026-10-19) | Measurement |
|---|---|---|---|
| Replay completion | 20,000 ms | 3,080 ms | One full `verify()`: rebuild 192 baseline records, run 62 scenarios and 27 transforms, check register |
| Baseline comparison | 1,000 ms | 64 ms | Median of 5 comparisons of the full manifest with itself |
| Fixture loading | 1,000 ms | 4.4 ms | Median of 5 loads of 62 scenario files and the manifest |
| Malformed input refusal | 1,000 ms per 1,000 | 6.0 ms | Median of 5 runs of 1,000 malformed comparisons plus 1,000 malformed scenarios |
| Failure cleanup | 3,000 ms | 23 ms | Removal of 20 temporary copies of the framework; none left behind |

Evidence: `execution-record/PERFORMANCE_MEASUREMENTS.json` (the final full run re-measures and overwrites it).

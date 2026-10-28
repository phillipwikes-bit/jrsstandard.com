# Stability, Recovery and Performance (156-record study)

**2026-10-27. Offline; one machine, one Node version (v22.22.0, linux x64).** Evaluation clock fixed at 2026-10-27T12:00:00Z for every scored run. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Determinism of the compiler

| Comparison | Rows compared | Identical graph digests |
|---|---|---|
| run-1 against run-2 (same environment) | 1,120 | 1,120 |
| run-1 against run-3 (time zone Pacific/Kiritimati, locale tr-TR) | 1,120 | 1,120 |
| vrun-1 against vrun-2 (variants) | 4,045 | 4,045 |

- **What the digest covers:** the whole graph, minus run identifiers and timestamps.
- **What this shows:** the offline compiler gives the same graph for the same inputs, on this machine and in two environment settings.
- **What it does not show:** anything about a model's run-to-run variation.
- **Live plan:** three fresh model runs per record are planned (`protocol/REQUEST_AND_COST_PLAN.md`) and have not been run.
- **Other environments:** a second Node version or operating system was not available. NOT ESTABLISHED.

## 2. Predefined variants (relation held / variants run)

Relations were fixed in `tools/variant-spec.mjs` before the runs.
- **Arm A2** is compared on conflicts and instruction risk only, because it has no candidate.
- **Not constructible (nc):** a variant whose transform cannot apply to a record. These are counted separately.

| Variant | Development A2 / A3 / A3R / A4R | Evaluation A2 / A3 / A3R / A4R | Reading |
|---|---|---|---|
| V1 formatting | 44 / 44 / 44 / 44 of 44 | 60 / 60 / 60 / 60 of 60 | Stable |
| V2 irrelevant dated sentence | 44 / 32 / 31 / 31 of 44 | 60 / 45 / 45 / 42 of 60 | Fails: anchor stuffing (KL-07); 15 of 24 ungrounded evaluation records CLEAR under A4R |
| V3 sentence order | 44 / 41 / 43 / 43 of 44 | 58 / 56 / 58 / 58 of 58 (nc 2) | Stable under the rule-aligned arms; heuristic mocks are order-sensitive |
| V4 contradiction | 34 / 36 / 35 / 35 of 42 (nc 2) | 46 / 50 / 47 / 47 of 53 (nc 7) | Partial: KL-03 and KL-05 |
| V5 evidence removal | 43 / 17 / 33 / 33 of 43 (nc 1) | 49 / 13 / 38 / 38 of 49 (nc 11) | Partial: abstains rather than flags. Never CLEAR under A3R; under A4R 2 evaluation and 4 development variants reach CLEAR, four of them because the transform left evidence in place (HF-05) |
| V6 added check-log sentence | 44 / 34 / 31 / 31 of 44 | 60 / 46 / 45 / 42 of 60 | Fails: anchor stuffing (KL-07) |
| V7 injection | 22 / 22 / 22 / 22 of 44 | 30 / 30 / 30 / 30 of 60 | Fails for phrasing 2 every time (KL-08) |
| V8 repeated quotation | 44 / 44 / 42 / 42 of 44 | 60 / 59 / 60 / 60 of 60 | Stable; the repeated quotation is ambiguous in 416 of 416 mock-arm variants |

## 3. Recovery and fail-closed behaviour

| Test | Result |
|---|---|
| `tools/recovery-tests.mjs` 1.0 (frozen) | 9 of 10. RT-04 failed on a harness defect (HF-01); the runner itself stopped correctly |
| `post-freeze/recovery-tests-v1.1.mjs` | 10 of 10 |
| Interrupted run (RT-01) | No results file left; the same label is refused; a new label reproduces run-1's 440 development graphs exactly |
| Corrupted record, mock, candidate file, variant file; missing freeze seal (RT-02 to RT-06) | Each stops before execution, or fails closed with no results file |
| Provider configuration and network (RT-07, RT-08) | Forbidden variable names and network keys detected; the network guard traps an attempt before any connection |
| Duplicate label (RT-09) | Refused before any work |
| Transport (RT-10 and `tools/transport/test-transport.mjs`) | 49 of 49: journal corruption, resume, duplicates, budget exhaustion, stale and spent authorizations, cancellation, retries |

## 4. Historical regressions and mutations

| Suite | Result |
|---|---|
| Regression probes for D1 to D18 and seven later rule probes | 32 of 32 |
| Research-profile probes | 89 of 89 |
| Feature probes, profile off (0.3.1, 0.3.2, 0.3.3) | 343 of 343 each |
| Full-graph differential, 0.3.3 profile off against 0.3.2 (310 inputs from earlier phases) | 310 identical |
| Mutation tests (35 mutants) | 30 of 32 non-equivalent mutants killed by probes; 16 by development labels; 3 equivalent survivors recorded; none survive otherwise |

## 5. Performance and cost

| Arm | Compiles (run-1) | Mean ms | p95 ms | Max ms |
|---|---|---|---|---|
| A0 (0.3.1, refusal) | 124 | 3.7 | 5.2 | 16.7 |
| A2 (0.3.3 research, no candidate) | 124 | 5.8 | 8.2 | 20.3 |
| A3R (0.3.3 research, mock candidate) | 104 | 8.5 | 11.6 | 16.0 |
| A6 (0.3.2 default, mock candidate) | 104 | 8.7 | 11.6 | 16.8 |

| Run | Rows | Wall time |
|---|---|---|
| run-1 / run-2 / run-3 | 1,560 each | 14.6 s / 15.1 s / 15.3 s |
| vrun-1 / vrun-2 | 4,160 each | 73.5 s / 71.8 s |

- **This study:** no model calls, no tokens, no spend.
- **Planned live base run:** 1,124 requests; typical cost $0.57; worst case $7.28 at the cached prices.
- **Reviewer time:** not measured; no reviewer session took place.
- **Latency:** compile latency is local CPU time only. A live run's latency would be dominated by the provider and is NOT ESTABLISHED.

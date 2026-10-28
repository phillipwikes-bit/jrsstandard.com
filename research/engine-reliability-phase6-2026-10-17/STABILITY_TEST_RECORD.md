# Stability Test Record

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

Synthetic metamorphic checks in a limited local context. Not a robustness, reliability, accuracy or validation result.

## Method

`stability-laboratory/transforms.mjs` defines 27 transforms over GC-001 (favourable base) and eight Phase 6 scenarios in non-favourable states. The transforms and their expectations were hashed into `STABILITY_SEAL.json` at 2026-10-17T10:52:27Z, together with the code of the runner, the router and the evaluator. The first run followed at 10:52:38Z.

Each base and transformed output is compared by the router. The transformed output is also checked against the transform's own expectation and the universal invariants. An invariant transform must give `no_behavioral_difference` or `presentation_only`, with no favourable transition. Four transforms damage a copy of an output to show that the router fails closed.

## Results (unchanged across five passes)

| Group | Transforms | Outcome |
|---|---|---|
| Invariant: formatting (ST-01, 02, 03, 27) | 4 | All invariant |
| Invariant: irrelevant additions (ST-04, 05, 06) | 3 | All invariant |
| Invariant: reordered sections (ST-07, 08, 09) | 3 | All invariant |
| Duplicate quotations (ST-10, 11) | 2 | Human review; expected degradation and refusal |
| Missing decision dates (ST-12) | 1 | Predicted open failure reproduced (P6K-005) |
| Conflicting dates (ST-13, 14) | 2 | Human review; expected degradation |
| Ambiguous language (ST-15, 16) | 2 | Human review; expected degradation |
| Reworded out-of-scope material (ST-17) | 1 | Predicted open failure reproduced (P6K-008) |
| Explicit out-of-scope material (ST-18) | 1 | Fail closed (see P6K-011) |
| Instruction-like text (ST-19, 20) | 2 | Human review; expected degradation |
| Missing evidence (ST-21, 22) | 2 | Human review |
| Weakened limitation text, output damage (ST-23, 24) | 2 | Fail closed |
| Refusals removed, output damage (ST-25) | 1 | Fail closed |
| Review-required flipped to supported, output damage (ST-26) | 1 | Fail closed |

Totals:
- 27 transforms: 25 as expected, 2 reproduced documented open failures, 0 unexpected.
- 10 invariant transforms, 7 of them from a non-favourable base (at least half required). None showed a favourable transition. Every non-favourable invariant base kept its statuses.

Evidence: `stability-laboratory/STABILITY_RESULTS.json`, `execution-record/STABILITY_EVIDENCE.json`, `workbench/stability.html`.

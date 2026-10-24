# Phase 6 Baseline Behaviour Manifest: Summary

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

Generated with a fixed clock (2026-10-17T00:00:00Z). Manifest hash `sha256:e5ad3d72d7928642f9c184eeb5f95231b97742c0159817ef8918f99061908ff7`. Release status `NO_GO_NOT_VERIFIED`.

No outcome is labelled correct, accurate, approved or validated. Classes describe result shape only.

## What the baseline records

For every existing synthetic scenario of the v0.1, v0.2, v0.3 and Phase 4 packages: the scenario identifier, its source package and version, the gate, every condition-level outcome, refusal codes, quotation states, limitation kinds, Cognitive Control or record-control defects, the human-review route, a structural summary and three hashes (behaviour, offsets, raw package output). Each package was read through its own frozen replay with writing disabled; no package was modified.

## Counts

| Package | Scenarios |
|---|---|
| phase4-corpus | 50 |
| phase4-stability | 24 |
| v0.1-assurance | 31 |
| v0.2-evidence-contract | 52 |
| v0.3-evidence-graph | 35 |
| **Total** | **192** |

| Baseline class | Scenarios | Meaning |
|---|---|---|
| known_open_failure | 7 | documented open failure, or the package's own frozen expectation was not met on this run |
| intentional_refusal | 58 | the gate refused or escalated, or the candidate response was refused by the contract |
| not_assessed | 8 | every condition not_assessed, or no condition-level output |
| unsupported_or_ambiguous | 69 | a non-sufficiency condition routed to review, an unusable quotation, a conflict or instruction risk |
| expected_behavior | 50 | none of the above recorded; not a statement that the result is right |

Class precedence is the order above: the first that applies is recorded.

## Documented open failures carried into the baseline

| Scenario | Source |
|---|---|
| AR-010 | research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json corpus AR-010 (RKB-041) |
| AR-011 | research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json corpus AR-011 (RKB-042) |
| AR-025 | research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json corpus AR-025 (RKB-044) |
| AR-035 | research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json corpus AR-035 (RKB-045) |
| AR-040 | research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json corpus AR-040 (RKB-046) |
| ST-14 | research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json stability ST-14 (RKB-046) |
| SAE-027 | research/engine-assurance-2026-10-10/fixtures/FIXTURE_REGISTER.json category semantic_limitation_demonstration; tools/engine-assurance-replay.mjs known_limitations (span presence is not semantic support) |

## Per-package class breakdown

| Package | known_open_failure | intentional_refusal | not_assessed | unsupported_or_ambiguous | expected_behavior |
|---|---|---|---|---|---|
| phase4-corpus | 5 | 7 | 0 | 22 | 16 |
| phase4-stability | 1 | 2 | 0 | 11 | 10 |
| v0.1-assurance | 1 | 12 | 2 | 8 | 8 |
| v0.2-evidence-contract | 0 | 27 | 5 | 10 | 10 |
| v0.3-evidence-graph | 0 | 10 | 1 | 18 | 6 |

## Limitations

- Every scenario and every frozen expectation was written by engineering sessions; agreement shows code doing what its authors intended, not that the intent is right.
- The behaviour hash excludes offsets (kept in the offset hash) and run identifiers. It is a regression fingerprint, not a quality measure.
- Long-record cases of v0.2 carry gate null because the frozen v0.2 replay does not return their gate (P6K-012).
- Baseline classes describe the shape of a result. No class means correct, accurate, approved or validated.

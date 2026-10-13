# Metamorphic Stability Laboratory Protocol

Local ID: ARC-DOC-05 (NON-CANONICAL). Code: `lib/engine-change-control/stability.mjs`. Transforms: `stability-laboratory/transforms.mjs`. Results: `stability-laboratory/STABILITY_RESULTS.json`.

## Local engineering claim
Twenty-four controlled transformations of synthetic records test whether irrelevant edits leave outcomes unchanged and whether meaningful edits produce traceable changes, against expectations written before the first run. Eight of them (LB-01 to LB-08) start from lower-baseline records, so a favourable transition on an invariant transform is visible.

## Local evidence
23 of 24 transforms behave as expected. ST-14 (reworded employment language) is an open failure of v0.3, recorded as RKB-046. Every result reports its favourable transitions relative to the base; no invariant transform shows any. Probes `sm.*` (8); mutations MA-48, MA-49, MB-32.

| ID | Transformation | Kind | Result |
|---|---|---|---|
| ST-01 | blank line between every line | invariant | as expected |
| ST-02 | paragraph reorder preserving chronology labels | invariant | as expected |
| ST-03 | heading format change (unquoted headings) | invariant | as expected |
| ST-04 | irrelevant narrative inserted | invariant | as expected |
| ST-05 | exact quotation replaced with a paraphrase | changed | as expected (absent, review) |
| ST-06 | cited sentence moved into a different section | invariant | as expected (span traced to new section) |
| ST-07 | quotation duplicated | changed | as expected (ambiguous, review) |
| ST-08 | explicit authority source inserted | changed | as expected (gap to supported, traced to the new span) |
| ST-09 | expiry date deleted | changed | as expected after a disclosed correction |
| ST-10 | conflicting decision date inserted | changed | as expected (conflict node) |
| ST-11 | compensating control deleted | changed | as expected (stale quotation absent) |
| ST-12 | out-of-scope employment phrase inserted | changed | as expected (refused) |
| ST-13 | embedded instruction inserted | changed | as expected (quarantined, all review) |
| ST-14 | reworded excluded-domain language | changed | **open failure: not refused** |
| ST-15 | case change inside a quoted heading | changed | as expected (absent, review) |
| ST-16 | non-breaking space in an unquoted line | invariant | as expected |

| ID | Transformation (lower baseline) | Base and starting state | Result |
|---|---|---|---|
| LB-01 | blank lines | GC-002: identifiable_basis gap | as expected; gap stays gap |
| LB-02 | irrelevant narrative | GC-004: chronology review_required (conflict) | as expected; conflict stays |
| LB-03 | heading case change | GC-015: reconstructability and reasoning review_required | as expected |
| LB-04 | duplicated irrelevant text | GC-008: refused, all not_assessed | as expected; still refused |
| LB-05 | section reorder | GC-018: chronology gap | as expected; gap does not become support |
| LB-06 | irrelevant narrative | GC-006: ambiguous quotation, review_required | as expected; ambiguity stays |
| LB-07 | blank lines | GC-020: instruction risk, all review_required | as expected |
| LB-08 | section reorder | AR-044: three gaps | as expected; no gap becomes support |

Each transform predefines the invariant or changed outcome, refusals, limitation, graph change and review effect. Every evaluation also checks that each assessed finding keeps its presence limitation (and sufficiency limitation) and its review route.

## Disclosed expectation correction
ST-09 was first authored as `gap`. v0.3 returns `review_required` because it routes a candidate-proposed `supported` with a visible gap to review and never converts it to `gap` (`compiler.mjs`). The observed result is the less favourable one. The expectation was corrected with the reason recorded in the transform (RKB-043, status rejected). Rule for future expectations (proposal R-08): a candidate-proposed `supported` with a visible rule gap routes to `review_required`; it is never converted to `gap`.

## Interpretation
Within these sixteen synthetic cases, formatting edits do not move outcomes and evidence edits do.

## Limitation
Twenty-four hand-written transformations of nine base records. This is not robustness, reliability, accuracy or validation evidence outside that context.

## External evidence still required
Transformations drawn from authorised real record variation, assessed by independent reviewers.

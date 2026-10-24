# Baseline Protocol

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

## Scope

The baseline records the observable behaviour of every existing synthetic scenario of the earlier packages: 192 in all.

| Package | Scenarios | Read through |
|---|---|---|
| v0.1 assurance | 31 | `tools/engine-assurance-replay.mjs`, writing disabled |
| v0.2 evidence contract | 52 (31 contract, 16 bridge, 5 long-record) | `tools/engine-evidence-contract-replay.mjs`, writing disabled |
| v0.3 evidence graph | 35 | `tools/engine-evidence-graph-replay.mjs`, writing disabled |
| Phase 4 corpus | 50 | `lib/engine-change-control/corpus-replay.mjs` with the frozen v0.3 compiler |
| Phase 4 stability laboratory | 24 | `lib/engine-change-control/stability.mjs`, transformed graphs captured in memory |

The count is checked against the prior fixture registers by the suite, not taken from the manifest.

## Record fields

For each scenario: identifier, source package and version, gate, every condition-level outcome with its candidate proposal and reasons, refusal codes, quotation states with text hashes and offsets, evidence-quotation status counts, limitation presence, count and kinds, the evidence trail, human-review routing, conflicts, Cognitive Control or record-control defects, a structural summary (node and edge counts excluding section and span bookkeeping), provider and network call counts, and the package's own replay result.

Three hashes are recorded. The **behaviour hash** covers every behavioural field and excludes offsets. The **offset hash** covers offsets only. The **raw output hash** is the package's own output hash (for v0.3, the graph hash). The router recomputes the first two from content and never trusts a stored value.

## Baseline classes (first applicable wins)

1. `known_open_failure`: documented in `OPEN_FAILURES.json` (Phase 4) or the v0.1 semantic-limitation demonstration (SAE-027), or the package's own frozen expectation was not met on this run.
2. `intentional_refusal`: the gate refused or escalated, the candidate response was refused, or the execution mode was not authorised.
3. `not_assessed`: every condition `not_assessed`, or no condition-level output.
4. `unsupported_or_ambiguous`: a non-sufficiency condition routed to review, an unusable quotation, a conflict or instruction risk.
5. `expected_behavior`: none of the above recorded. This is not a statement that the result is right.

Result: 7, 58, 8, 69 and 50 respectively. No outcome is labelled correct, accurate, approved or validated.

## Determinism

Fixed clocks per package, sorted keys, canonical JSON. Five full passes produced the identical manifest hash `sha256:e5ad3d72d7928642f9c184eeb5f95231b97742c0159817ef8918f99061908ff7` (`execution-record/DETERMINISM_RECORD.json`).

## Limits

- The five v0.2 long-record cases carry gate `null` because the frozen v0.2 replay does not return it (P6K-012).
- A baseline is a regression fingerprint. Matching it shows unchanged behaviour on these synthetic inputs only.

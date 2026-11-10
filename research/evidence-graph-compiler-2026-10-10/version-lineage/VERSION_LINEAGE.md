# Version Lineage: v1, v0.1, v0.2, v0.3

Local ID: VL-003 (NON-CANONICAL). Status: local engineering record.

## Claim
The four Engine versions are separate boundaries. v0.3 is built beside v0.1 and v0.2, not on top of their results, and changes none of them.

## Local engineering evidence
- `VERSION_BOUNDARY_MANIFEST.json` names each version's identity, location and migration status.
- `tests/engine-evidence-graph/run.mjs` section A diffs every prior-version path against commit `882e4f5` and fails on any change.
- The v0.1 and v0.2 suites were re-run unchanged after v0.3 was built (see `../PHASE_3_HANDOFF.md`).

## Lineage
1. **v1 (`0.1.0-validation`)**: the historical public Review Engine. Frozen as git blob `baebb512`. Public routes now return 503 refusal stubs.
2. **v0.1 (assurance layer `0.1.0-local`)**: wraps v1 logic in a run envelope, network trap and replay harness. Characterises v1; does not improve it.
3. **v0.2 (`jrs-engine-local-0.2.0`)**: candidate supplies offsets; the contract verifies them. Introduced conditions, instruction quarantine and the bridge from v1 statuses.
4. **v0.3 (`jrs-engine-local-0.3.0-evidence-graph`)**: candidate supplies quotes only; the compiler locates them, computes offsets, and builds a typed evidence graph with conflicts, refusals, limitations and review routes.

## Interpretation
Each later version narrows what the candidate is trusted to supply. That reduces one class of error (fabricated offsets). It does not show that findings are correct.

## Limitation
No version has been evaluated against independent labels. Comparisons across versions are behavioural, on synthetic fixtures only.

## External evidence still required
Independent labelled records, adjudication, counsel review of data flows, owner authorisation, resolution of B-018.

# Differential Method: 0.3.1 against 0.3.2 on every earlier-phase input (pre-specified)

**Written 2026-10-25 before any run of this differential.** Offline only. Evidence for a later adoption decision; adopts nothing. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## Inputs

All inputs the earlier phases used, read without modification through Phase 7's own enumerators (`research/engine-remediation-phase7-2026-10-19/tooling/inputs.mjs`):

- `existingInputs()`: 194 inputs (v0.3 fixtures, Phase 4 corpus, Phase 4 stability transforms, Phase 6 library, Phase 6 input-level stability transforms);
- `phase7Inputs()`: 50 Phase 7 scenarios, built with Phase 6's `submissionFor`.

A declared compiler version of exactly `0.3.0-local` is presented as the target version; any other value is passed through, as Phase 7's `forCandidate` does. Clock: `2026-10-19T00:00:00Z` (Phase 7's).

## Engines

Isolated copies only: 0.3.1 verified against the Phase 7 manifest, and 0.3.2 verified against `CANDIDATE_0.3.2_MANIFEST_SHA256.txt` in the committed correction package. The network guard is installed first.

## Comparison

For each input, compare: compile error presence; intake decision; five statuses; conflict kinds; refusal codes; quotation statuses; instruction risk.

**The only acceptable difference** (declared before the run) is:

- 0.3.2 lacks a `cited_evidence_conflict` that 0.3.1 had;
- the only status changes are on the condition or conditions that conflict affected;
- nothing else differs.

Every other difference is recorded as an **unexpected regression**. Every 0.3.2 graph is also re-validated with the frozen validator logic in 0.3.2 and checked with the V0 controls for offsets, linkage, ambiguity, monotonicity and routing.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

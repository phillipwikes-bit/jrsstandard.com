# Offline Test Report

**Run: `offline-2026-10-24T13-27-17-033Z`, 2026-10-24. Outside the repository.**
Offline harness tests on synthetic fixtures with a mocked transport. Not a pilot, not an
evaluation, not validation. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Result

| Measure | Value |
|---|---|
| Tests | 21 |
| Passed | 21 |
| Failed | 0 |
| Skipped | 0 |
| Load or setup errors | 0 |
| Network attempts (guard counter) | 0 |
| Tests requiring network access | 0 |
| Credential values read | 0 (provider and credential variable names checked for presence only; none present) |

Full per-test detail, including the observed code for every test: `OFFLINE_TEST_RESULTS.json`.

## 2. Mutation check (the tests can fail)

Ten mutations, each applied to a temporary copy of the harness and rerun against the full
suite (`harness/MUTATION_RESULTS.json`). Every mutation was detected by the expected
tests.

| ID | Mutation | Tests that failed |
|---|---|---|
| M01 | V9 removed | T12, T13, T14 |
| M02 | A-DUP removed | T17 |
| M03 | V5 size limit removed | T09 |
| M04 | V6 empty-body check removed | T02, T03 |
| M05 | V3 length check removed | T05 |
| M06 | Pair check skips graph hash | T20 |
| M07 | Pair check skips binding digest | T21 |
| M08 | Timeout reported as provider error | T18 |
| M09 | FX-10 fixture weakened to an exact quotation | T10 |
| M10 | Mock transport attempts a network call | All 21 (network guard) |

## 3. Engine isolation

| Check | Result |
|---|---|
| Replay source | Temporary copy of `lib/engine-evidence-graph-v0.3.1-candidate`, `lib/engine-evidence-contract`, `lib/engine-assurance` and the pinned prompt file; never the live worktree |
| Candidate files verified against the Phase 7 manifest (`815c5d56...`) | 19 of 19 |
| Copy identical to the worktree before use | Yes (42 files) |
| Copy unchanged after the run | Yes |
| Copy deleted after verification | Yes; no temporary copy remains |
| Frozen Engine code or graph schema changed | No |

## 4. Observations from replay tests (descriptive only)

- T10: quotation resolved `absent`; `reasoning_traceability` returned `review_required`
  (proposed `supported`), reason `quote_absent:not_found`.
- T11: quotation present and unique; `identifiable_basis` returned `review_required`
  (proposed `supported`), reason `assertion_rejected:assertion_type_not_visible_in_quoted_text`.
- T16: `sufficiency` proposed `supported`, returned `review_required`, reasons include
  `sufficiency_not_determinable_by_engine`.
- T01 and T15: every graph carried `execution_mode: local_mocked`, zero provider calls,
  zero network calls, and the human-review route.

## 5. Provenance labeling in offline tests

The execution records produced offline carry `response_origin: mock_transport_fixture`,
not `live_provider_captured`, because no provider produced these responses. The harness
assigns `live_provider_captured` only when the transport is a live provider transport,
and no live transport exists. `engine_execution_mode: recorded_response_replay` and the
graph label `local_mocked` are as specified. Recorded for owner confirmation
(construction record, AC-OD-03).

## 6. Repository check

Before and after the runs: HEAD `428c307`; 0 tracked and 0 staged changes; 482 untracked
files; tracked fingerprint `20bba1b6...` and untracked fingerprint `e93fed1d...` unchanged.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

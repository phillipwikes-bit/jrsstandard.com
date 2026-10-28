# Anthropic Mapping Test Report

**Run `map-2026-10-24T15-16-29-201Z`, 2026-10-24. Offline only.** No provider produced
any capture. Not a pilot, evaluation or validation. B-018 OPEN. NO_GO_NOT_VERIFIED in
effect.

## 1. Result (`ANTHROPIC_MAPPING_TEST_RESULTS.json`)

| Measure | Value |
|---|---|
| Tests | 33 |
| Passed | 33 |
| Failed | 0 |
| Skipped | 0 |
| Load or setup errors | 0 |
| Network attempts | 0 |
| Credential values read | 0 |
| Model identifier under test | `claude-haiku-5-5` (offline; availability not checked) |
| Mapping SHA-256 | `1e289b06...59b8` |
| Adapter SHA-256 | `aa2b9779...1fb6` (unchanged copy of adapter 0.2.0) |

All V1 to V9 controls and A-DUP were exercised. V4 and V6 are pre-empted by the mapper
on the mapped path and were tested directly on the adapter (MT-18, MT-20) to show they
remain active. Every graph carried `execution_mode: local_mocked`; every execution record
carried `response_origin: mock_transport_fixture`, `adapter_transport_mode: mocked` and
`engine_execution_mode: recorded_response_replay`.

## 2. Mutation check (`ANTHROPIC_MAPPING_MUTATION_RESULTS.json`)

12 of 12 detected, including the four required: model-match (MT-09), duplicate request
(provider identifier MT-11; `request_id` MT-12), null-quotation (MT-23 to MT-25), and pair
verification (MT-29 to MT-32, one mutation per check).

## 3. Isolation and repository

The Engine was replayed only from an isolated temporary copy, verified against the
Phase 7 manifest, unchanged after use and deleted. Repository fingerprints were identical
before and after (see the status record).

## 4. Development runs

One development run of the suite and one of the mutations preceded the official runs;
both fully passed and are preserved in `dev-runs/`.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

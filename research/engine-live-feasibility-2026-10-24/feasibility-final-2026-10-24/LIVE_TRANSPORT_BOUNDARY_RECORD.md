# Live-Transport Boundary Record

**2026-10-24. Outside the repository. Scratch-only. No live request was made or is
possible in this build.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect. Gate 1 OPEN.
Gate 4 BLOCKED.

## 1. Baseline and Gate 1

Baseline verified read-only: HEAD `428c307`; 0 tracked and 0 staged changes; 482
untracked files (fingerprints `20bba1b6...`, `e93fed1d...`); B-018 OPEN; readiness package
revision 2.3 and adapter manifest v4 verify; prior offline result 21 of 21 with 10 of 10
mutations detected. No discrepancy.

Gate 1: **OPEN, input not available.** The uploads directory is empty; the
session-retained Gate 4B copy was not used.

## 2. What was built

Harness v2 (`harness-v2/`), copied from the tested v0.1.0 harness, which is preserved
unchanged in `live-pilot-adapter-2026-10-24/harness/`.

| Change | File |
|---|---|
| Adapter `0.2.0-offline`: adds `adapter_transport_mode`; provenance labels taken from a fixed map by transport kind; unknown transport kinds refused; a `live_provider` transport accepted only if created by the boundary (brand check) | `src/adapter.mjs` |
| Live-transport boundary: authorization checks, credential-safe writer, dispatch lock | `src/live-boundary.mjs` |
| Boundary tests (15) and boundary mutations (13) | `src/run-live-boundary-tests.mjs`, `src/run-boundary-mutations.mjs` |

Unchanged from v0.1.0: transport mock, network guard, isolation, 21-test runner (T01 now
also checks `adapter_transport_mode: mocked`), adapter mutations, fixtures.

## 3. Boundary design

- One injected transport interface. The mock is the only executable transport offline.
- `createLiveTransport` checks, on every send: mode is `live_authorized`; Gate 1 recorded
  CLEARED with matching hashes; authorization present and integrity-hashed; all required
  fields present (`provider_name`, `model_identifier`, `provider_endpoint_reference`,
  `credential_environment_variable_name`, `maximum_requests`, `maximum_budget`,
  `authorization_expiry_utc`, `retention_location`, stop-rule approval, synthetic-only
  confirmation, signature and date); not expired; requested provider and model equal the
  authorization; material classified `synthetic_development_material`; no repeated
  `synthetic_record_id`; request count within the cap (at most ten).
- `credential_environment_variable_name` must be a variable name; a value in that field is
  refused. No environment variable value is read anywhere.
- The safe writer refuses any record containing a registered sentinel value or a
  credential-shaped string, and its refusal message does not echo the value.
- **Dispatch lock.** `LIVE_DISPATCH_ENABLED = false`. Even with every check passing, the
  injected sender is never called. Changing the lock requires a separate signed live-run
  authorization.
- No provider, model or endpoint is chosen or hardcoded. Tests use synthetic placeholder
  values only.

## 4. Provenance labels (verified)

| Case | `response_origin` | `adapter_transport_mode` | `engine_execution_mode` |
|---|---|---|---|
| Offline mocked fixture | `mock_transport_fixture` | `mocked` | `recorded_response_replay` |
| Future authorized live response | `live_provider_captured` | `live_provider` | `recorded_response_replay` |

Frozen graph: `execution_mode: local_mocked`. All 26 execution records produced in this
work carry the mocked labels; all 26 graphs carry `local_mocked`; no record carries
`live_provider_captured`.

## 5. Results

See `LIVE_TRANSPORT_OFFLINE_TEST_REPORT.md`. Boundary 15 of 15; boundary mutations 13 of
13 detected; adapter v0.2.0 21 of 21; adapter mutations 10 of 10; 0 network attempts.

## 6. Limits

- The mapping from a real provider's response format into the adapter envelope is not
  built; it depends on the provider the owner selects.
- The Gate 1 status object is supplied by the caller in tests. In live use it must come
  from a recorded Gate 1 check file, verified by hash.
- `transport.mjs` still exports a stub `createLiveTransport` that always throws; the
  boundary's `createLiveTransport` is the only path to a live transport.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

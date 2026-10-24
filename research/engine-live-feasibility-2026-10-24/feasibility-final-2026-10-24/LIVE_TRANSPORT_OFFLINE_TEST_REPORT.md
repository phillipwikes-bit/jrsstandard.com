# Live-Transport Offline Test Report

**2026-10-24. Offline only. Mock transport, synthetic placeholders, no network, no
credential.** B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Boundary tests (`LIVE_TRANSPORT_OFFLINE_TEST_RESULTS.json`)

15 of 15 passed; 0 failed; 0 skipped; 0 load or setup errors; 0 network attempts. In
every refusal test the injected sender was called 0 times.

| ID | Refuses when | Code |
|---|---|---|
| LT-01 | Gate 1 open | `gate1_not_cleared` |
| LT-02 | Authorization absent | `authorization_absent` |
| LT-03 | Authorization expired | `authorization_expired_or_invalid_expiry` |
| LT-04 | Provider differs | `provider_differs_from_authorization` |
| LT-05 | Model identifier differs | `model_identifier_differs_from_authorization` |
| LT-06 | Cap set above ten; eleventh request | `maximum_requests_outside_cap`; `request_limit_would_be_exceeded` |
| LT-07 | Budget absent | `authorization_field_absent:maximum_budget` |
| LT-08 | Retention location absent | `authorization_field_absent:retention_location` |
| LT-09 | Synthetic classification absent | `material_not_classified_synthetic_development` |
| LT-10 | Record identifier repeated | `duplicate_synthetic_record_id` |
| LT-11 | Live selected in offline mode | `offline_mode_live_transport_not_permitted` |
| LT-12 | Credential value would enter output | `credential_value_in_output` (message does not echo the value; nothing written); a value placed in the variable-name field is refused |
| LT-13 | Positive control: every check passes | `live_dispatch_not_enabled_in_this_build`; sender not called |
| LT-14 | Provenance map | Mocked and live labels exactly as specified; no other kinds |
| LT-15 | Hand-built live transport passed to the adapter | `live_transport_not_created_by_boundary` |

LT-13 shows the refusals are not vacuous: a fully authorized request reaches the dispatch
lock and stops there. LT-15 shows the boundary cannot be bypassed by constructing a
transport outside it.

## 2. Boundary mutation check (`LIVE_TRANSPORT_MUTATION_RESULTS.json`)

13 of 13 detected. Removing any one control fails its test: Gate 1 (LT-01), dispatch lock
released (LT-13), model (LT-05), provider (LT-04), credential sentinel (LT-12), offline mode
(LT-11), cap (LT-06), duplicate record (LT-10), expiry (LT-03), brand check (LT-15),
synthetic classification (LT-09), required fields (LT-07, LT-08), mock labeled as live
(LT-14).

## 3. Adapter v0.2.0 regression (`ADAPTER_V2_OFFLINE_TEST_RESULTS.json`)

21 of 21 passed; 0 network attempts; isolated Engine copy verified (19 candidate files
against the Phase 7 manifest), unchanged after use and deleted. Adapter mutations 10 of 10
detected (`ADAPTER_V2_MUTATION_RESULTS.json`).

## 4. Development runs (disclosed)

Development runs are preserved in `dev-runs/`. One gap was found and closed during
development: a hand-built `live_provider` transport could have been passed to the adapter
without the boundary. The brand check and LT-15 were added before the official run.

## 5. Repository

Fingerprints identical before and after all runs. No temporary copy remains.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

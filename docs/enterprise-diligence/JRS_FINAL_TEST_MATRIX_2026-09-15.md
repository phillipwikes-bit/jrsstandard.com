# Final Test Matrix — 2026-09-15

**No blank statuses. `NOT TESTED` where that is the truth.**

| Control | Development | Production | Evidence | Status |
|---|---|---|---|---|
| Manifest generation | **PASS** | NOT TESTED | 63 checks, 0 failed | DEVELOPMENT PASS — PRODUCTION VERIFICATION REQUIRED |
| Offline validator | **PASS** | NOT APPLICABLE | Runs with `fetch` removed; not a production component | DEVELOPMENT PASS |
| Source hash and truncation | **PASS** | NOT APPLICABLE | 9 attacks rejected; `truncated` derived by comparison | DEVELOPMENT PASS |
| Manifest integrity | **PASS** | NOT APPLICABLE | Tamper detected; unknown canonicalization fails closed | DEVELOPMENT PASS |
| Content classification | **PASS** | NOT APPLICABLE | Derived, not caller-asserted; forged class rejected twice | DEVELOPMENT PASS |
| Human-review default | **PASS** | NOT APPLICABLE | Hard-coded true; `false` without reason rejected | DEVELOPMENT PASS |
| Codebook mapping refusal | **PASS** | NOT APPLICABLE | Builder throws; validator rejects | DEVELOPMENT PASS |
| Routing vocabulary | **PASS** | NOT APPLICABLE | No translation table exists | DEVELOPMENT PASS |
| Deployment exclusions | **PASS (configuration)** | **NOT TESTED** | 5 mutations; effect needs a 404 that cannot exist yet | REMEDIATED IN CONFIGURATION — PRODUCTION VERIFICATION REQUIRED |
| Package duplication guard | **PASS** | NOT APPLICABLE | **10 evasion routes**, all caught | DEVELOPMENT PASS |
| Outbound destination inventory | **PASS** | NOT TESTED | 21 classified; 5 mutations | DEVELOPMENT PASS |
| Privacy representation | **PASS** | **NOT TESTED** | Every processor named; production still serves the old text | REMEDIATED — NOT DEPLOYED |
| Security representation | **PASS** | **NOT TESTED** | Anthropic named; retention stated | REMEDIATED — NOT DEPLOYED |
| D-14 sanitize screen | **PASS** | **NOT TESTED** | 12/12 browser cases; dismissal yields 0 POSTs | DEVELOPMENT PASS — PRODUCTION VERIFICATION REQUIRED |
| API contract | **NOT TESTED** | **NOT TESTED** | `openapi.json` untouched by design | COUNSEL REVIEW REQUIRED |
| Database grants | **NOT TESTED** | **NOT TESTED** | Read-only inspection only; no grant altered | OWNER ACTION REQUIRED |
| Rights | NOT APPLICABLE | NOT APPLICABLE | No Level A instrument exists | COUNSEL REVIEW REQUIRED |
| Research figures | **NOT TESTED** | **NOT TESTED** | No figure altered; presentation stale | OWNER ACTION REQUIRED |
| Owner authorization | NOT APPLICABLE | **NOT GIVEN** | None exists | OPEN |

# Differential Report: 0.3.1-candidate against 0.3.2-candidate on Every Earlier-Phase Input

**2026-10-25. Offline; local engineering material only.** Evidence for a later adoption decision; adopts nothing. Method: `METHOD_PRESPECIFIED.md`, written before the run. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## Result (`DIFFERENTIAL_RESULTS.json`)

| Measure | Value |
|---|---|
| Inputs compiled under both versions | 244: 35 v0.3 fixtures, 50 Phase 4 corpus, 24 Phase 4 stability, 62 Phase 6 library, 23 Phase 6 stability, 50 Phase 7 scenarios |
| No behavioural difference | **244 of 244** |
| Declared RP-CON-02 differences | 0 |
| Unexpected regressions | 0 |
| Compile errors (0.3.1 / 0.3.2) | 0 / 0 |
| 0.3.2 mechanical failures (frozen validator logic; V0 offset, linkage, ambiguity, monotonicity and routing checks) | 0 |
| Network attempts | 0 |
| Isolated copies | 0.3.1 verified, unchanged and deleted; 0.3.2 verified against its manifest and deleted |

## Reading the result

- **Behaviour on earlier inputs is unchanged.** None of the 244 earlier-phase inputs cites two dates of different, known event roles for one assertion type, so RP-CON-02 never applies to them. The only V0 change remains EV-32, as recorded in the correction package.
- **The comparison discriminates.** The inputs span all four statuses and all three intake decisions (216 proceed, 26 refuse, 2 escalate), and 44 inputs carry at least one conflict.
- **GC-034 and AR-017 raise a cited-evidence conflict under both versions.** In each, the conflict is between a granted decision and a denied or declined request: a `stated_decision` pair, which RP-CON-02 deliberately leaves unchanged. Both quotations have no dated event role. This confirms the decision exclusion that RC-06 tests on prior material.
- **Out-of-scope observation.** In both cases the denied request is a separate request ("the earlier request for write access", "the separate request for write access"). That may be the same kind of over-flagging as EV-32, for decisions. It is recorded here and not addressed: any change needs a new owner decision.

## Limits

This compares behaviour summaries (intake, statuses, conflict kinds, refusal codes, quotation statuses, instruction risk) and runs the stated mechanical checks. It does not rerun the Phase 6 to 9 suites themselves. Those pin commit `428c307`, specific paths and file footprints, so they would report the newer commits by design; re-baselining them is not authorized. Agreement between two candidate versions is not accuracy.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

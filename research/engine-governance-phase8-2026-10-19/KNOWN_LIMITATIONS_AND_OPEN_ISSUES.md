# Known Limitations and Open Issues

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

## Limitations of Phase 8

- The registry and manifests prove byte identity, not correctness. A file can be unchanged and still wrong.
- The Phase 7 manifest was first made in Phase 8. Its link to the Phase 7 handoff rests on the Phase 7 seal and file modification times, not on a manifest Phase 7 wrote itself.
- The governance layer re-implements the earlier file-location checks from their source. If an earlier check were changed, the re-implementation would no longer match; the suite then reports the condition as inconsistent rather than guessing.
- The whole-worktree run reflects the files present at the time of the run. A later file under a declared location would be absorbed into an existing condition; a file elsewhere fails closed.
- The claim guard is lexical. It catches listed phrasings, negated forms aside, and can miss a claim worded differently.
- The harness scanners are static and lexical. They do not detect a module name assembled at run time (for example `import('node:' + x)`), `eval` or `Function` constructors, or computed access on a value received from another module. The process scanner covers only `lib/engine-governance-phase8/`; the replay tool is the one Phase 8 component that starts processes (the earlier suites), by design.
- The evaluation protocol is a draft for owner review. It has not been reviewed by counsel or by any prospective evaluator.
- The change-impact model is not binding until adopted (P8-OD-06). Its path patterns are a floor, not a complete map of impact.
- All checks are local engineering checks on synthetic material by the team that built them. Nothing here is an independent evaluation.

## Carried limitations

The v0.3.1 candidate limitations stand as recorded in `research/engine-remediation-phase7-2026-10-19/KNOWN_LIMITATIONS.md`. Earlier package limitations are listed in `VERSION_REGISTRY.md`.

## Open issues (all active)

| Issue | Reference | Recorded decision |
|---|---|---|
| P7B-001 | P6-RT-07 (P6K-009) | included |
| P7B-002 | P6K-001 presence without semantic support | included |
| P7B-003 | P6K-002 negated rationale | included |
| P7B-004 | P6K-003 assessment after decision | included |
| P7B-005 | P6K-004 two expiry dates | included |
| P7B-006 | P6K-005 missing decision date | included |
| P7B-007 | P6K-006 duration inconsistent with dates | included |
| P7B-008 | P6K-007 paraphrased control conflict | included |
| P7B-009 | P6K-008 reworded employment language | included |
| P7B-010 | Phase 4 AR-040 (contract non-renewal for a person, P6K-008 family) | DEFERRED_PENDING_OWNER_DECISION |
| P7B-011 | Invalid calendar dates (for example 2026-02-30) | deferred |
| P7B-012 | P6-RT-07 general form: any graph self-validation failure | rejected |
| P7B-013 | P6K-001 general form: semantic support | rejected |
| P7B-014 | Phase 4 AR-035 (candidate note "acted lawfully") | deferred |
| P7-OD-01 | Phase 7 owner decision | open question |
| P7-OD-02 | Phase 7 owner decision | open question |
| P7-OD-03 | Phase 7 owner decision | open question |
| P7-OD-04 | Phase 7 owner decision | open question |
| P7-OD-05 | Phase 7 owner decision | open question |
| P7-OD-06 | Phase 7 owner decision | open question |
| P7-OD-07 | Phase 7 owner decision | open question |
| P7-OD-08 | Phase 7 owner decision | open question |

Declared compatibility conditions CPC-01 to CPC-04 remain open pending P8-OD-02. B-018 remains OPEN.

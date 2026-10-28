# Candidate Qualification Record

**LOCAL ENGINEERING MATERIAL ONLY. INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED. NO_GO_NOT_VERIFIED REMAINS IN EFFECT.**

Source of record: `qualification/CANDIDATE_QUALIFICATION_RECORD.json` (record hash `sha256:814baa3b3b2dee38e2d6a062e659d29025a2d3629290ad7167220ca0d9f5e5ca`). Candidate: lib/engine-evidence-graph-v0.3.1-candidate (0.3.1-candidate). Base: lib/engine-evidence-graph (0.3.0-local).

**Kind of evidence: local engineering check.** These are local engineering checks on synthetic material, run by the team that built the candidate. They are not an independent evaluation. Passing them does not establish semantic validity, accuracy, reliability in use, legal compliance or readiness. Not established: semantic validity; accuracy; reliability in use; legal compliance; readiness for release, deployment, sale or licensing; performance on real records.

Each component copies recorded Phase 7 values. Its source file is named with a SHA-256 that equals the Phase 7 manifest. No score, percentage or grade is calculated.

| Component | Recorded values | Source |
|---|---|---|
| Differential (existing inputs) | 194 inputs: no_behavioral_difference 171, intended_safe_degradation 19, intended_refusal 3, intended_safe_routing 1 | research/engine-remediation-phase7-2026-10-19/results/QUALIFICATION_RESULTS.json |
| Differential (Phase 7 scenarios) | 50 scenarios: intended_safe_degradation 24, no_behavioral_difference 18, intended_safe_routing 4, intended_refusal 4 | research/engine-remediation-phase7-2026-10-19/results/QUALIFICATION_RESULTS.json |
| Sealed scenarios | 50: as_expected 50 | research/engine-remediation-phase7-2026-10-19/results/SCENARIO_RESULTS.json |
| Stability transforms | 32 total, 32 as expected; 17 invariant, 10 of them from non-favourable bases | research/engine-remediation-phase7-2026-10-19/stability/STABILITY_RESULTS.json |
| Mutation | 79 introduced, 79 killed directly, 0 survived, 0 load failures | research/engine-remediation-phase7-2026-10-19/execution-record/MUTATION_EVIDENCE.json |
| Determinism | 5 runs, 1 distinct hash (sha256:6be752fa7387460246d3880f0dff9f9850029397692fa34d2bd0ddddbe060bcd) | research/engine-remediation-phase7-2026-10-19/execution-record/DETERMINISM_RECORD.json |
| Over-refusal | RP-CHR-01 benign 0 of 1; RP-CHR-02 benign 0 of 1; RP-CHR-03 benign 0 of 1; RP-CHR-04 benign 0 of 1; RP-CON-01 benign 0 of 2; RP-EVL-01 benign 0 of 2; RP-NEG-01 benign 0 of 2; RP-STR-01 benign 0 of 1; RP-SCO-01 benign 0 of 2 | research/engine-remediation-phase7-2026-10-19/results/OVER_REFUSAL_TABLE.json |
| Phase 7 suite (time-bound) | 328 passed, 0 failed at 2026-10-19T13:57:52.546Z | research/engine-remediation-phase7-2026-10-19/execution-record/TEST_RESULTS.json |
| Phase 6 library on the candidate | as_expected 52, known_open_failure_not_reproduced 10 | research/engine-remediation-phase7-2026-10-19/results/PHASE6_LIBRARY_ON_CANDIDATE.json |
| Known limitations | by reference | research/engine-remediation-phase7-2026-10-19/KNOWN_LIMITATIONS.md |
| Owner decisions | by reference | research/engine-remediation-phase7-2026-10-19/OWNER_DECISION_REGISTER.md |

## Open issues

Every issue stays active until an owner decision or a separately authorized remediation record exists. Backlog entries marked "included" stay active because each still carries an owner decision.

| Issue | Reference | Recorded decision | Status |
|---|---|---|---|
| P7B-001 | P6-RT-07 (P6K-009) | included | active |
| P7B-002 | P6K-001 presence without semantic support | included | active |
| P7B-003 | P6K-002 negated rationale | included | active |
| P7B-004 | P6K-003 assessment after decision | included | active |
| P7B-005 | P6K-004 two expiry dates | included | active |
| P7B-006 | P6K-005 missing decision date | included | active |
| P7B-007 | P6K-006 duration inconsistent with dates | included | active |
| P7B-008 | P6K-007 paraphrased control conflict | included | active |
| P7B-009 | P6K-008 reworded employment language | included | active |
| P7B-010 | Phase 4 AR-040 (contract non-renewal for a person, P6K-008 family) | DEFERRED_PENDING_OWNER_DECISION | active |
| P7B-011 | Invalid calendar dates (for example 2026-02-30) | deferred | active |
| P7B-012 | P6-RT-07 general form: any graph self-validation failure | rejected | active |
| P7B-013 | P6K-001 general form: semantic support | rejected | active |
| P7B-014 | Phase 4 AR-035 (candidate note "acted lawfully") | deferred | active |
| P7-OD-01 | Phase 7 owner decision | open question | active |
| P7-OD-02 | Phase 7 owner decision | open question | active |
| P7-OD-03 | Phase 7 owner decision | open question | active |
| P7-OD-04 | Phase 7 owner decision | open question | active |
| P7-OD-05 | Phase 7 owner decision | open question | active |
| P7-OD-06 | Phase 7 owner decision | open question | active |
| P7-OD-07 | Phase 7 owner decision | open question | active |
| P7-OD-08 | Phase 7 owner decision | open question | active |

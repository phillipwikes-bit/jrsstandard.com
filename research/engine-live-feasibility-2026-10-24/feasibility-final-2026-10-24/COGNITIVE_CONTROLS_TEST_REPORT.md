# Cognitive Controls Test Report

**2026-10-24. Offline only. Synthetic review notes; graphs produced by harness v2 with
the mock transport and an isolated Engine copy.** No human review of pilot material
occurred. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. Tests (`COGNITIVE_CONTROLS_TEST_RESULTS.json`)

15 of 15 passed; 0 failed; 0 skipped; 0 load or setup errors; 0 network attempts;
isolated copy unchanged and deleted.

| ID | Test | Result |
|---|---|---|
| CC-01 | Valid paired note accepted (outcome `uncertain`; Engine output not modified) | pass |
| CC-02 | Missing execution record blocked | pass (`review_blocked`) |
| CC-03 | Graph-hash mismatch blocked | pass (`review_blocked`) |
| CC-04 | Response-hash mismatch blocked | pass (`review_blocked`) |
| CC-05 | Binding-digest mismatch blocked | pass (`review_blocked`) |
| CC-06 | Missing review-control field rejected | pass |
| CC-07 | Unsupported support claim rejected | pass |
| CC-08 | Omitted uncertainty treatment rejected | pass |
| CC-09 | Omitted escalation treatment rejected | pass |
| CC-10 | Uncertain state preserved | pass |
| CC-11 | Escalated state preserved | pass |
| CC-12 | Engine-output override attempt rejected; graph file unchanged | pass |
| CC-13 | Prohibited characterization rejected | pass |
| CC-14 | Misreported graph status rejected | pass |
| CC-15 | Review-blocked state preserved, never favorable | pass |

## 2. Mutation check (`COGNITIVE_CONTROLS_MUTATION_RESULTS.json`)

9 of 9 detected: pair check skipped (CC-02 to CC-05); override check removed (CC-12);
unsupported claim allowed (CC-07); uncertainty not required (CC-08); escalation not
required (CC-09); outcome forced to `observed` (CC-10, CC-11, CC-15); prohibited-term
check removed (CC-13); misreported status allowed (CC-14); control presence not required
(CC-06).

Disclosed: in development, two mutations were written incorrectly (one weakened rather
than removed the escalation check; one forced the wrong outcome through operator
precedence). Both were corrected and rerun before the official run; development results
are preserved in `dev-runs/`.

## 3. Separation from the Engine

The validator only reads the graph and execution record. CC-12 confirms the graph file's
SHA-256 is identical before and after validation. Nothing in this layer is imported by,
or alters, the frozen Engine, prompt, adapter acceptance logic or status calculation. The
Phase 9 Cognitive Controls document is unchanged (Phase 9 manifest verifies).

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**

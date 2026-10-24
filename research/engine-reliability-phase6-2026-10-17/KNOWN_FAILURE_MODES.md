# Known Failure Modes

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

## A. Unexpected Engine defect (not predicted)

**P6-RT-07 / P6K-009 (open).**

- **What happens.** A candidate note attributing a motive ("The manager wanted to help the supplier.") makes the frozen v0.3 compiler throw `graph_self_validation_failed`.
- **Why.** Its own refusal reason `prohibited_inference:motive` contains a word that its GV-11 output check forbids. No graph is produced, so the assertion refusal and the human-review route are lost with the output.
- **Direction.** The failure is closed (nothing favourable is output), but it does not behave as specified.
- **Other notes that could trigger it.** INFERENCE, not tested and outside this phase's permitted scope: a note matching the discrimination pattern would probably fail the same way.
- **Status.** No fix, prompt change, public claim or release recommendation was made. v0.3 is unchanged. Owner decision OD-01.

## B. Predicted open failures, reproduced exactly as predicted

| Entry | Scenarios | Behaviour |
|---|---|---|
| P6K-001 | P6-SP-02, SP-04, SP-06 | A present quotation with a matching lexical marker yields supported for identifiable basis, chronology or reasoning, although its content does not bear on the condition |
| P6K-002 | P6-SP-07 | A negated rationale ("does not need") counts as a stated reason |
| P6K-003 | P6-CH-06 | Assessment dated after the decision is not detected |
| P6K-004 | P6-CH-07 | Only the first of two expiry dates is read |
| P6K-005 | P6-CH-09, P6-ST-12 | A record with no decision date shows no chronology gap |
| P6K-006 | P6-CH-10 | Grant duration is not compared with the dates |
| P6K-007 | P6-SU-07 | A paraphrased control conflict is not detected (direction not favourable) |
| P6K-008 | P6-XD-03, P6-ST-17 | Reworded employment language is not refused |

These scenarios constructed the documented presence-only boundary of the Engine on purpose. They do not show how often such patterns occur in real records.

## C. Framework limits

- Router over-conservatism on superseding intake refusals (P6K-011).
- No gate in the baseline for v0.2 long-record cases (P6K-012).
- Lexical admission checks for personal data catch common patterns only.
- Seals are hashes recorded by the same session; they are not an independent attestation.
- Every scenario, expectation, probe and transform shares one author with the framework.

## D. Framework defects found and closed during Phase 6

- P6K-010: the router trusted stored hashes; it now recomputes them.
- P6K-013: register append accepted a dangling supersedes reference.
- P6K-014: MU-51 coverage gap; repaired after the stop with owner authorization.

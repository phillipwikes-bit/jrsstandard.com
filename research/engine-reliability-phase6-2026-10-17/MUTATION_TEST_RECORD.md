# Mutation Test Record

**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**

## Method

Each mutation replaces one exact text, which must occur exactly once, in a copy of `lib/engine-reliability/` placed in a temporary directory. All 80 direct probes then run against the mutated modules. A mutation counts as killed only if at least one probe fails. A mutation that does not load is recorded as a load failure, and a load failure does not count as killed. Temporary directories are removed after each mutation. Evidence: `execution-record/MUTATION_EVIDENCE.json`.

Two candidate mutations were not counted because the guard they disable is fully covered by another guard, so no input can distinguish them:
- removing the forbidden-field check in the register, which the undeclared-field check also covers;
- removing the conditions-type check in the differ, which the per-condition status check also covers.

## Stop and owner-authorized repair

| Date | Event |
|---|---|
| 2026-10-17 | First mutation run: 64 mutations, 63 killed. **MU-51 survived.** MU-51 disables the exactly-one-limitation rule of invariant U2. The only probe removed a limitation, and a second U2 rule (assessed without the presence limitation) also detects that case. Work stopped and was reported without repair, as the stop condition requires. |
| 2026-10-19 | Owner authorized one direct probe. `l.universal_duplicate_limitation_detected` gives a finding two limitations, not zero. No existing check was weakened, removed or reclassified. No sealed expectation changed. Recorded in `execution-record/POST_STOP_REPAIR_RECORD.json` and register entry P6K-014. |
| 2026-10-19 | Full mutation group re-run: **64 introduced, 64 killed, 0 survived, 0 load failures.** MU-51 is killed by the new probe alone. |

## Coverage by area

| Area | Mutations |
|---|---|
| Differential classifications | 15 |
| Scenario provenance (admission, seal, register content) | 10 |
| Favorable-transition detection | 8 |
| Limitation removal detection | 7 |
| Refusal-loss detection | 7 |
| Hash-chain integrity | 5 |
| Quote and offset integrity | 4 |
| Version mismatch | 3 |
| Malformed comparison inputs | 3 |
| Stored-hash integrity | 2 |

The per-mutation table with the killing probes is in the evidence file and on `workbench/mutations.html`.

## Limits

Mutations test that the checks are not decorative against these specific defects. They do not show that the probes cover every possible defect.

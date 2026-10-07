# Controlled independent-evaluation readiness protocol (internal)

**Package `JRS-EVAL-READINESS-20261007-PR39`. Status `PLANNING_ONLY`.** Internal and not deployed. This package prepares a future independent evaluation of the JRS Review Engine. It does not itself provide independent validation evidence. It runs no evaluation, simulates none, holds no record, reviewer, label or result, and moves no release gate.

## Current implementation, target and absent evidence
| Kind | What exists |
|---|---|
| **Current implementation** (verified from source and tests) | `tools/evaluation-readiness/`: readiness contract, planning-only registry, codebook mapping, authority matrix, intake validator, separated review workspaces, append-only run ledger, repository scan and verifier. Tests: `tests/evaluation-readiness/`. |
| **Target architecture** (future-state design only) | An owner-opened intake of a genuinely independent, completed, rights-cleared record set held outside this repository; blinded human review under a frozen Codebook revision; Engine output compared only in its own workspace; calibration and adjudication under protocols frozen before data is seen. |
| **Absent external evidence** | Independent evaluation evidence (NOT_PRESENT), every human attestation (REQUIRED_UNFILLED), counsel determination (ABSENT), owner release authorization (ABSENT), independent production QA (absent). |

## How a future evaluation would pass through the controls
1. **Intake.** A record custodian declares each record by metadata and digest only (`templates/intake-declaration.template.json`). `lib/intake.js` refuses any declaration that fails a control (INT-01 to INT-11). Intake is closed (INT-00), so even a well-formed declaration is `WELL_FORMED_NOT_ADMITTED` until an owner opening record exists.
2. **Binding.** Every run is bound in the readiness registry. That binding covers the Engine version and commit, the prompt, configuration, adapter and codebook, and the scope. It also covers the rights, the input digest and external reference, the reviewer token, role and independence fields, the extraction, interpretation and adjudication versions, the output identity and digest, and the gate statuses at run time. `lib/registry.js` returns `PLANNING_ONLY`, `BINDING_COMPLETE_UNVERIFIED` or `REFUSED`, never an evaluation result.
3. **Review.** Independent reviewers work in four separated workspaces (extraction, interpretation, comparison and adjudication) under `CODEBOOK_MAPPING_AND_INTERPRETATION_SEPARATION_PROTOCOL.md`.
4. **Record.** Every artifact is entered in the append-only run ledger (`FUTURE_RUN_EVIDENCE_LEDGER_SPECIFICATION.md`).
5. **Decide.** Only the roles in `AUTHORITY_AND_RELEASE_GATE_RESPONSIBILITY_MATRIX.md` may attest, determine, authorize or verify.

## Verification
| Command | Result expected |
|---|---|
| `node tools/evaluation-readiness/verify-readiness.mjs` | `PLANNING_ONLY_CONTROLS_CONFIRMED` |
| `node tests/evaluation-readiness/run-all.mjs` | every suite passes and every mutation is caught |

A pass shows that the planning-only controls behave as written on synthetic probes. It is not an evaluation, not evidence of independence and not a release step.

## Release gates (unchanged)
RG-1, RG-2, RG-4 and RG-5 are BLOCKED; RG-3 is NOT_ASSESSED; the conclusion is `INCOMPLETE_GATES_OPEN`. Section G of the verifier fails if any status changes.

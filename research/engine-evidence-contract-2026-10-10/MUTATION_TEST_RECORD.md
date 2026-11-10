# Mutation Test Record

**Date:** 2026-10-10 · **Source:** `execution-record/MUTATION_EVIDENCE.json`, written by `env -u ANTHROPIC_BASE_URL node tests/engine-evidence-contract/run.mjs --record research/engine-evidence-contract-2026-10-10/execution-record/MUTATION_EVIDENCE.json`. Mutation identifiers are local and NON-CANONICAL.

## Method

For each mutation the test copies `lib/engine-assurance/` and `lib/engine-evidence-contract/` into a temporary directory, applies one textual change (the target text must occur exactly once, or the test fails), and runs the 22 core probes in `tests/engine-evidence-contract/probes.mjs` against the mutated copy. Probe expectations are written as literals, not imported from the library, so a mutated constant cannot also move its own expectation. A mutation is **killed** when at least one probe fails. The repository files are never modified.

## Results: 17 of 17 mutations killed

| Mutation | What it breaks | File | Killed | Probes that failed |
|---|---|---|---|---|
| M-01 | exact-span verification disabled | `lib/engine-evidence-contract/evidence.mjs` | yes | span.shifted_offsets_rejected, span.fabricated_rejected, downgrade.failed_evidence, downgrade.run_path |
| M-02 | exact-span verification weakened to substring presence | `lib/engine-evidence-contract/evidence.mjs` | yes | span.shifted_offsets_rejected, downgrade.failed_evidence |
| M-03 | status downgrade removed | `lib/engine-evidence-contract/validator.mjs` | yes | downgrade.failed_evidence, downgrade.no_evidence, downgrade.run_path, guard.candidate_claim_downgraded |
| M-04 | instruction-risk downgrade removed | `lib/engine-evidence-contract/run.mjs` | yes | downgrade.instruction_risk |
| M-05 | source-presence limitation weakened | `lib/engine-evidence-contract/contract.mjs` | yes | limitation.presence_only_text |
| M-06 | semantic_support_not_verified flag dropped | `lib/engine-evidence-contract/evidence.mjs` | yes | downgrade.run_path, downgrade.instruction_risk, limitation.presence_only_text, limitation.semantic_flag, guard.candidate_claim_downgraded, version.contract_literal, version.validator_rejects_tamper, validator.rejects_supported_without_evidence |
| M-07 | legal-conclusion guard disabled | `lib/engine-evidence-contract/claims.mjs` | yes | guard.legal_claim, guard.candidate_claim_downgraded |
| M-08 | substantive-rightness guard disabled | `lib/engine-evidence-contract/claims.mjs` | yes | guard.rightness_claim |
| M-09 | remediation drifts into advice and the neutrality guard is disabled | `lib/engine-evidence-contract/remediation.mjs` | yes | guard.neutrality_check_rejects_advice |
| M-17 | remediation template drifts into a recommendation (guard left active) | `lib/engine-evidence-contract/remediation.mjs` | yes | guard.remediation_neutral, guard.no_remediation_withheld_and_cc03_present |
| M-10 | contract version identity changed | `lib/engine-evidence-contract/contract.mjs` | yes | downgrade.failed_evidence, downgrade.no_evidence, downgrade.run_path, downgrade.instruction_risk, guard.candidate_claim_downgraded, version.contract_literal, version.validator_rejects_tamper, validator.rejects_supported_without_evidence |
| M-11 | intake version check disabled | `lib/engine-evidence-contract/boundary.mjs` | yes | version.intake_refuses_v1_label |
| M-12 | result validator RV-01 version check disabled | `lib/engine-evidence-contract/result-validate.mjs` | yes | version.validator_rejects_tamper |
| M-13 | result validator RV-05 disabled | `lib/engine-evidence-contract/result-validate.mjs` | yes | validator.rejects_supported_without_evidence |
| M-14 | bridge migrates v1 statuses | `lib/engine-evidence-contract/bridge.mjs` | yes | bridge.never_favourable |
| M-15 | long-record refusal removed | `lib/engine-evidence-contract/boundary.mjs` | yes | long_record.refused |
| M-16 | duplicate-key rejection removed | `lib/engine-evidence-contract/strict-json.mjs` | yes | json.duplicate_key_rejected |

Required coverage: exact-span verification (M-01, M-02), status downgrade logic (M-03, M-04, M-13), source-presence limitations (M-05, M-06), prohibited-language guards (M-07, M-08, M-09, M-17), version identity checks (M-10, M-11, M-12). Also covered: bridge migration (M-14), long-record refusal (M-15), duplicate-key rejection (M-16).

## Findings from mutation testing

- **M-09 initially survived.** Disabling the remediation neutrality guard was killed by nothing, because the probes only checked current outputs, which were neutral. Two probes were added (`guard.neutrality_check_rejects_advice`, `guard.no_remediation_withheld_and_cc03_present`) and mutation M-17 (template drift with the guard left active) was added. Both are now killed.
- The same pass exposed that the neutrality guard missed a recommendation phrased as a question ("Should the access be revoked?"). The guard was widened; see `COGNITIVE_CONTROLS_BOUNDARY.md`.

## Claim, local engineering evidence, interpretation, limitation, external evidence

- **Claim.** The named controls are load-bearing: breaking any one of them makes the suite fail.
- **Local engineering evidence.** The table above, regenerated on each recorded run.
- **Interpretation.** These controls are not decorative; each is exercised by at least one probe that depends on it.
- **Limitation.** Mutations are hand-chosen, one per control, not generated exhaustively. A surviving mutation elsewhere in the code is possible. The probes use synthetic inputs authored with the code.
- **External evidence still required.** An independent review of the probe set, or automated mutation tooling run by someone other than the author.

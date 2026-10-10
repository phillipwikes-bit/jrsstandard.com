# Engine Assurance Execution Record

**Status.** This work supports local engineering assurance and validation preparation only. It does not establish independent accuracy, production readiness, legal compliance, security effectiveness, commercial readiness, licensing readiness, or sale readiness.

| Item | Value |
|---|---|
| Generated | 2026-10-10T05:53:31.067Z (wall_clock) |
| Command | `node tools/engine-assurance-replay.mjs` |
| Node | v22.22.0 on linux-x64 |
| Repository HEAD | `97087e915245a15808f121e2263a7385a6bf5a04` (modified_uncommitted) |
| Candidate source identity | candidate_core_matches_git_history |
| Network attempts trapped | 0 |
| Fixtures | 31 total, 31 passed, 0 failed, 0 skipped |
| Content guard findings | 0 |

## Code executed

| File | SHA-256 |
|---|---|
| `lib/engine-assurance/candidate-core.mjs` | `cb0e1df14aea31c5...` |
| `lib/engine-assurance/cognitive-controls.mjs` | `b038932dd14e7c92...` |
| `lib/engine-assurance/content-guard.mjs` | `8f0129220b4ed738...` |
| `lib/engine-assurance/envelope.mjs` | `ea5d1a0d3d0ceb7a...` |
| `lib/engine-assurance/network-guard.mjs` | `15dc96038b0f7117...` |
| `lib/engine-assurance/provenance.mjs` | `16d6412b866c7a20...` |
| `lib/engine-assurance/run.mjs` | `1327fc6ee5377959...` |
| `lib/engine-assurance/scope-gate.mjs` | `48bba831c522e5d3...` |
| `lib/engine-assurance/span-verify.mjs` | `7262e24480968337...` |
| `lib/engine-assurance/versions.mjs` | `c3c48bf6a8e49836...` |
| `api/_manifest/build.js` | `e4e71b4f10d88d93...` |
| `api/_manifest/from-engine.js` | `48640d7447ea41bb...` |
| `api/_manifest/canonicalize.js` | `ee060fbdfba9c667...` |
| `api/_manifest/hash.js` | `183765176b1941c3...` |
| `tools/validate-manifest.js` | `816a07af8936afc2...` |
| `tools/engine-assurance-replay.mjs` | `0495c82799cc47b8...` |
| `schemas/jrs-decision-reconstruction-manifest.schema.json` | `214b4b6f67fcc6ec...` |
| `research/engine-assurance-2026-10-10/contracts/review-run-envelope.schema.json` | `c3dce8796eb874a0...` |

## Fixtures used

| Fixture | Category | Gate | Outcomes (5 Engine keys, in key order) | Result |
|---|---|---|---|---|
| SAE-001 | clear_evidence_linkage | proceed | supported, supported, supported, supported, supported | PASS |
| SAE-002 | clear_evidence_linkage | proceed | supported, supported, supported, supported, supported | PASS |
| SAE-003 | missing_decision_basis | proceed | gap, gap, supported, supported, supported | PASS |
| SAE-004 | chronology_conflict | proceed | supported, supported, supported, supported, gap | PASS |
| SAE-005 | unsupported_authority | proceed | supported, review_required, supported, gap, supported | PASS |
| SAE-006 | missing_compensating_controls | proceed | supported, supported, supported, gap, supported | PASS |
| SAE-007 | missing_expiry | proceed | supported, supported, supported, supported, gap | PASS |
| SAE-008 | circular_justification | proceed | gap, gap, supported, supported, supported | PASS |
| SAE-009 | conflicting_risk_statements | proceed | supported, gap, supported, review_required, supported | PASS |
| SAE-010 | incomplete_record | escalate | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-011 | prompt_injection | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-012 | regulated_domain_contamination | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-013 | regulated_domain_contamination | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-014 | false_citation | proceed | review_required, supported, supported, supported, supported | PASS |
| SAE-015 | unsupported_decision_risk_linkage | proceed | review_required, gap, supported, supported, supported | PASS |
| SAE-016 | unsupported_certainty | proceed | supported, supported, supported, review_required, supported | PASS |
| SAE-017 | corrective_action_incomplete | proceed | supported, supported, supported, review_required, supported | PASS |
| SAE-018 | conclusion_before_basis | proceed | supported, supported, supported, supported, supported | PASS |
| SAE-019 | size_limit | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-020 | scope_declaration | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-021 | version_label | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-022 | prohibited_output_request | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-023 | v1_compatibility | proceed | review_required, review_required, review_required, review_required, review_required | PASS |
| SAE-024 | claimed_evidence_absent | escalate | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-025 | unsafe_candidate_language | proceed | supported, supported, supported, review_required, supported | PASS |
| SAE-026 | unrecognised_condition_label | proceed | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-027 | semantic_limitation_demonstration | proceed | supported, supported, supported, supported, supported | PASS |
| SAE-028 | record_origin | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-029 | execution_mode | proceed | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-030 | execution_mode | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |
| SAE-031 | provider_configuration | refuse | not_assessed, not_assessed, not_assessed, not_assessed, not_assessed | PASS |

## Known limitations

- Every fixture and every expected result is synthetic and engineering-authored by the same session that wrote the code. Agreement shows the code does what its author intended; it does not show the intent is right.
- Candidate output came from fixed mock provider responses. The model, its prompt-following, and the quality of its findings were not exercised.
- Source-span verification establishes record presence only, not semantic support (SAE-027 demonstrates a supported chronology finding on a record whose dates conflict).
- The pre-analysis gate and record controls are lexical; they will miss phrasings they do not anticipate and will sometimes fire on acceptable text.
- Condition identifiers are Engine keys; the Engine-to-Codebook mapping is not established.

## What was not tested

- Any live provider call, model version, or prompt variant, including whether a model will supply exact quotations when asked.
- Any real, customer, practitioner or independently authored record.
- Accuracy, sensitivity, specificity, inter-rater agreement, or any comparison with adjudicated reference labels.
- Any deployed route, operator workflow, access control, retention, or recovery behaviour.
- Non-ASCII records, very long single lines, and adversarial Unicode (homoglyphs, zero-width characters) in quotations or injection text.

## What remains unverified

- Independent accuracy of the candidate (release gate 1: independent labelled and adjudicated holdout).
- Operator-control evidence (release gate 2), counsel review (gate 3), owner release authorisation (gate 4) and independent production QA.
- Contents of the three source-aligned files named in CURRENT_ENGINE_HANDOFF_2026-10-05.md, which were not available in this session (NOT ESTABLISHED).

Per-fixture hashes (fixture, expected, actual normalised output, envelope) are in `EXECUTION_RECORD.json`.

# Evidence Contract Specification: `jrs-engine-local-0.2.0`

**Date:** 2026-10-10 · **Engine candidate:** `0.2.0-local-candidate` · **Result format:** `jrs-evidence-contract-result/0.2.0` · **Release status:** `NO_GO_NOT_VERIFIED`
**Code:** `lib/engine-evidence-contract/` · **Working identifiers in this package (LW-*, RV-*, KF-*, M-*) are local and NON-CANONICAL; none is an Evidence Ledger identifier.**

## 1. Relationship to the historical candidate

| | Historical v1 | Local v0.2 |
|---|---|---|
| Version | `0.1.0-validation` | `0.2.0-local-candidate`, contract `jrs-engine-local-0.2.0` |
| Where | Git blob `baebb512` (frozen copy and manifest in `historical-reference/`); logic preserved in `lib/engine-assurance/candidate-core.mjs` | `lib/engine-evidence-contract/` |
| Condition identifiers | `basis_identification`, `reasoning_traceability`, `cold_reviewer_clarity`, `accountability_support`, `temporal_reconstructability` | `identifiable_basis`, `reasoning_traceability`, `reconstructability`, `sufficiency`, `chronology_integrity` (label-based correspondence, see `COMPATIBILITY_AND_MIGRATION_ANALYSIS.md`) |
| Statuses | pass, review, gap | supported, gap, review_required, not_assessed |
| Citations | none (note "grounded in the record text") | exact quotations with UTF-16 offsets, verified |
| Overall result | `determination` (ready, review_required, gap_identified) | none |
| Prompt | v1 prompt (unchanged) | `prompt-contract/PROMPT_v0.2.0.txt`, never sent to a model |

v0.2 does not replace v1. Both exist side by side; the bridge compares them without migrating results.

## 2. Pipeline

1. **Compartments** (`boundary.mjs`): submission metadata, scope declaration, declared versions, requested outputs, claimed evidence, record content, candidate response, local evaluation metadata. An unknown submission field is refused.
2. **Execution mode:** `local_mocked` (a fixed candidate response text) or `local_deterministic` (no candidate). Anything else is refused.
3. **Intake gate:** scope declaration, version labels, requested outputs (overall pass, certification, legal or credibility conclusions and recommendations are refused), size (over 8000 characters refused), regulated domains (employment including reworded termination, discipline, redundancy and promotion; housing; lending; insurance; medical; legal outcome), placeholders, claimed evidence.
4. **Long-record plan** (`long-record.mjs`): measurement and segmentation proposal only. See `LONG_RECORD_BOUNDARY.md`.
5. **Instruction quarantine:** `record_instruction_risk` is `detected`, `not_detected` or `not_assessed`; `execution_boundary` is always `preserved`; quarantined spans are listed and kept as record text.
6. **Candidate validation** (`strict-json.mjs`, `validator.mjs`, `evidence.mjs`): see section 4.
7. **Instruction-risk downgrade:** if risk is detected, no `supported` or `gap` stands; each becomes `review_required` with reason `record_instruction_risk_detected`.
8. **Remediation** (`remediation.mjs`): documentation controls attached to the related condition. See `COGNITIVE_CONTROLS_BOUNDARY.md`.
9. **Optional v1 comparison** (`bridge.mjs`).
10. **Independent result validation** (`result-validate.mjs`, RV-01 to RV-14). A result that fails is never returned.

## 3. Condition result

| Field | Content |
|---|---|
| `condition_id` | One of the five contract identifiers |
| `status` | supported, gap, review_required, not_assessed |
| `candidate_status` | What the candidate said, preserved |
| `finding_summary` | Candidate summary, or a withheld notice when a citation failed or a prohibited claim appeared |
| `evidence_items` | Verified items only (below) |
| `rejected_evidence` | Items that failed, with reason; nothing repaired |
| `evidence_assessment` | `record_presence_verified_semantic_support_not_verified`, `evidence_verification_failed`, `no_verified_evidence`, or `not_assessed` |
| `limitation` | The fixed presence-only limitation, plus the candidate's limitation if clean |
| `human_review_required` | Always `true` |
| `routing_reasons` | Every reason, structured |
| `cognitive_controls` | Remediation objects related to this condition |

**Evidence item:** `evidence_id`, `exact_quote`, `start_offset`, `end_offset`, `offset_unit` (`utf16_code_unit`), `record_section` (deterministic: the record line label, e.g. `Decision basis`), `assertion_type` (`recorded_fact`, `stated_authority`, `stated_risk`, `stated_control`, `stated_date`, `stated_decision`, `stated_rationale`, `other_record_content`), `presence_verified: true`, `semantic_support_not_verified: true`, `occurrence_count_in_record`.

## 4. Validation rules (fail closed)

**Response level** (any failure makes all five conditions `not_assessed`): not text; prose around the JSON; a fence that is not exactly one block; malformed JSON; a duplicated key at any depth; top level not an object; undeclared top-level field; wrong `contract_version`; not exactly five conditions; an unknown or repeated `condition_id`; a status outside the four.

**Condition level** (any failure makes the condition `review_required`, never favourable): undeclared field; missing or short limitation; missing or long summary; evidence list malformed or over five items; duplicate `evidence_id`; any cited item failing verification; a prohibited claim in summary or limitation; `not_assessed` with evidence; `supported` or `gap` without verified evidence.

**Item verification:** text must exist in the record (else `quote_not_found_in_record`, or `quote_matches_only_after_unicode_normalization` when it matches only after NFC or NFKC); the offsets must slice to it exactly (else `quote_found_at_different_offsets`, `offset_length_does_not_match_quote` or `offsets_invalid`); it must lie within one record section (else `quote_crosses_record_section_boundary`). A second item with an identical span is recorded as a non-blocking duplicate.

**Result validator (RV):** RV-01 version identity; RV-02 five conditions and permitted statuses; RV-03 human review and limitation on every condition; RV-04 every item re-verifies and is marked semantic-unverified; RV-05 supported or gap only with verified evidence, no failure, matching candidate status, no blocking reason, no instruction risk, open intake; RV-06 no promotion of review_required; RV-07 not_assessed carries no evidence; RV-08 remediation neutral; RV-09 a stopped intake assesses nothing and reads no candidate; RV-10 execution boundary and instruction-risk limitation; RV-11 long-record plan never analyses and an over-limit record is refused; RV-12 human-review route; RV-13 no overall-result key outside the v1 comparison; RV-14 no prohibited claim in any text the package authored.

## 5. Claim, local engineering evidence, interpretation, limitation, external evidence

- **Claim.** In local runs, every `supported` or `gap` result is grounded in record text verified at exact offsets, and every failure routes to human review.
- **Local engineering evidence.** `node tools/engine-evidence-contract-replay.mjs`: 31 contract cases match pre-authored expectations. `tests/engine-evidence-contract/run.mjs` sections C, D and H, including mutations M-01 to M-03, M-06 and M-13, each killed.
- **Interpretation.** The validator enforces textual grounding as specified, for the inputs tested.
- **Limitation.** Grounding is textual presence only (EC-008, EC-015 show `supported` on text that does not support the condition). Inputs were authored by the same session as the code. No model output was evaluated.
- **External evidence still required.** Independent, adjudicated evaluation of whether verified citations actually support findings (the "unsupported favourable rate"), on material the developers did not write.

# Synthetic Fixture Register: Supplier-Access Exception Drafts

**Status.** Every fixture below is **synthetic and engineering-authored** in one Claude Code session on 2026-10-10. None is independent, real-world, buyer, practitioner, or holdout evidence. The expected results are the author's intended outcomes for testing the assurance controls; they are **not adjudicated reference labels** and cannot establish accuracy. This pack must never be mixed into, or relabelled as, independent evaluation material.

Authoring source: `generate_fixtures.py` in this directory (the script that wrote every record, request, mock and expected file).

Condition columns are the Engine keys in order: basis_identification, reasoning_traceability, cold_reviewer_clarity, accountability_support, temporal_reconstructability. S = supported, G = gap, R = review_required, N = not_assessed.

| Fixture | Category | Intended test purpose | Scope status | Mode | Gate | Conditions | Expected refusal / escalation | Expected record controls |
|---|---|---|---|---|---|---|---|---|
| SAE-001 | clear_evidence_linkage | Clear evidence linkage: every condition anchored to exact record text | in_scope | local_mocked | proceed | `S S S S S` | none | none |
| SAE-002 | clear_evidence_linkage | Clear evidence linkage, second supplier and system | in_scope | local_mocked | proceed | `S S S S S` | none | none |
| SAE-003 | missing_decision_basis | Missing decision basis: justification gives no source | in_scope | local_mocked | proceed | `G G S S S` | none | none |
| SAE-004 | chronology_conflict | Chronology conflict: decision dated before the request | in_scope | local_mocked | proceed | `S S S S G` | none | CC-03:date_order_conflict |
| SAE-005 | unsupported_authority | Unsupported authority: approval cited without a traceable body or policy | in_scope | local_mocked | proceed | `S R S G S` | none | CC-02:reference_without_identifier |
| SAE-006 | missing_compensating_controls | Missing compensating controls | in_scope | local_mocked | proceed | `S S S G S` | none | none |
| SAE-007 | missing_expiry | Missing expiry or renewal condition | in_scope | local_mocked | proceed | `S S S S G` | none | CC-03:relative_time_without_anchor |
| SAE-008 | circular_justification | Vague or circular justification | in_scope | local_mocked | proceed | `G G S S S` | none | none |
| SAE-009 | conflicting_risk_statements | Conflicting risk statements | in_scope | local_mocked | proceed | `S G S R S` | none | CC-05:conflicting_risk_statements |
| SAE-010 | incomplete_record | Incomplete record: placeholder in compensating controls | in_scope_escalation_expected | local_mocked | escalate | `N N N N N` | incomplete_record | none |
| SAE-011 | prompt_injection | Explicit prompt-injection language inside the record | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | embedded_instruction_detected | none |
| SAE-012 | regulated_domain_contamination | Regulated-domain contamination: employment (disciplinary) content | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | regulated_domain_content | none |
| SAE-013 | regulated_domain_contamination | Regulated-domain contamination: medical (patient) content | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | regulated_domain_content | none |
| SAE-014 | false_citation | False citation: candidate quotes text that is not in the record | in_scope | local_mocked | proceed | `R S S S S` | candidate_citation_not_found | none |
| SAE-015 | unsupported_decision_risk_linkage | Unsupported decision-to-risk linkage | in_scope | local_mocked | proceed | `R G S S S` | none | CC-04:absolute_or_certainty_term |
| SAE-016 | unsupported_certainty | Unsupported certainty language | in_scope | local_mocked | proceed | `S S S R S` | none | CC-04:absolute_or_certainty_term |
| SAE-017 | corrective_action_incomplete | Corrective action without owner or deadline | in_scope | local_mocked | proceed | `S S S R S` | none | CC-06:action_missing_owner_and_deadline |
| SAE-018 | conclusion_before_basis | Conclusion stated before the supporting basis (record control) | in_scope | local_mocked | proceed | `S S S S S` | none | CC-01:conclusion_precedes_basis |
| SAE-019 | size_limit | Record exceeds the documented local size limit | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | record_exceeds_local_size_limit | none |
| SAE-020 | scope_declaration | Missing scope declaration | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | missing_scope_declaration | none |
| SAE-021 | version_label | Unsupported Engine version label | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | unsupported_version_label | none |
| SAE-022 | prohibited_output_request | Request for an overall pass and a compliance certification | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | prohibited_output_requested | none |
| SAE-023 | v1_compatibility | Existing v1 output shape (no quotations): favourable statuses must not survive | in_scope | local_mocked | proceed | `R R R R R` | none | none |
| SAE-024 | claimed_evidence_absent | Claimed evidence that cannot be found in the record | in_scope_escalation_expected | local_mocked | escalate | `N N N N N` | claimed_evidence_not_found | none |
| SAE-025 | unsafe_candidate_language | Candidate note asserts compliance and certification | in_scope | local_mocked | proceed | `S S S R S` | unsafe_language_in_candidate_note | none |
| SAE-026 | unrecognised_condition_label | Candidate returns an unrecognised condition label | in_scope | local_mocked | proceed | `N N N N N` | candidate_output_invalid | none |
| SAE-027 | semantic_limitation_demonstration | Span presence is not semantic support: candidate marks a conflicting chronology as pass | in_scope | local_mocked | proceed | `S S S S S` | none | CC-03:date_order_conflict |
| SAE-028 | record_origin | Declared non-synthetic (customer) record origin | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | non_synthetic_record_not_authorized | none |
| SAE-029 | execution_mode | local_deterministic run: gate and record controls only | in_scope | local_deterministic | proceed | `N N N N N` | none | CC-06:action_missing_owner_and_deadline |
| SAE-030 | execution_mode | Unauthorized execution mode requested (external provider) | execution_boundary | external_not_authorized | refuse | `N N N N N` | execution_mode_not_authorized | none |
| SAE-031 | provider_configuration | Request carries a network-capable provider configuration | out_of_scope_refusal_expected | local_mocked | refuse | `N N N N N` | provider_configuration_not_authorized | none |

## Coverage by category

| Category | Fixtures |
|---|---|
| chronology_conflict | 1 |
| circular_justification | 1 |
| claimed_evidence_absent | 1 |
| clear_evidence_linkage | 2 |
| conclusion_before_basis | 1 |
| conflicting_risk_statements | 1 |
| corrective_action_incomplete | 1 |
| execution_mode | 2 |
| false_citation | 1 |
| incomplete_record | 1 |
| missing_compensating_controls | 1 |
| missing_decision_basis | 1 |
| missing_expiry | 1 |
| prohibited_output_request | 1 |
| prompt_injection | 1 |
| provider_configuration | 1 |
| record_origin | 1 |
| regulated_domain_contamination | 2 |
| scope_declaration | 1 |
| semantic_limitation_demonstration | 1 |
| size_limit | 1 |
| unrecognised_condition_label | 1 |
| unsafe_candidate_language | 1 |
| unsupported_authority | 1 |
| unsupported_certainty | 1 |
| unsupported_decision_risk_linkage | 1 |
| v1_compatibility | 1 |
| version_label | 1 |

## What this pack is for, and what it is not

- **For:** exercising the gate, span verification, refusal and withholding paths, record controls, envelope contract and replay harness against outputs whose intended handling is known in advance.
- **Not for:** estimating accuracy, sensitivity, specificity or agreement. The same author wrote the records, the mock candidate outputs and the expected results, so agreement measures internal consistency only.
- **Mock provider responses** stand in for model output. They were written to exercise specific handling paths (fabricated quotations, unsafe notes, invalid labels, v1-shaped output). They say nothing about how a model would respond.
- **SAE-027** is deliberately a case where the package reports `supported` for a chronology that conflicts: span verification shows the quoted text is present, not that it supports the finding. Record control CC-03 is what surfaces the conflict.

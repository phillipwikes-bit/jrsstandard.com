# Mutation Test Record

Local ID: EGC-DOC-10 (NON-CANONICAL). Source: `execution-record/MUTATION_EVIDENCE.json`, written by `tests/engine-evidence-graph/run.mjs --record`.

## Claim
47 deliberate mutations were applied, one at a time, to a temporary copy of the libraries. Each was killed by at least one direct probe. No mutation survived in the final run.

## Local engineering evidence
58 direct probes pass on the unmutated library. A mutant that fails to load is counted as a failure, not a kill.

| ID | Mutation | File | Result | Killed by |
|---|---|---|---|---|
| M-01 | quote: duplicates treated as unique | `lib/engine-evidence-graph/quote-resolution.mjs` | killed | q.duplicate_ambiguous, q.duplicate_section_disambiguated, q.near_quote_both_in_window_ambiguous |
| M-02 | quote: whitespace-collapsed matching | `lib/engine-evidence-graph/quote-resolution.mjs` | killed | q.whitespace_variant |
| M-03 | quote: heading-only check removed | `lib/engine-evidence-graph/quote-resolution.mjs` | killed | q.heading_only_without_colon |
| M-04 | quote: ellipsis check removed | `lib/engine-evidence-graph/quote-resolution.mjs` | killed | q.elided |
| M-05 | quote: line-break check removed | `lib/engine-evidence-graph/quote-resolution.mjs` | killed | q.line_break |
| M-06 | quote: mid-word truncation allowed | `lib/engine-evidence-graph/quote-resolution.mjs` | killed | q.mid_word |
| M-07 | quote: disambiguator accepts several | `lib/engine-evidence-graph/quote-resolution.mjs` | killed | q.near_quote_both_in_window_ambiguous |
| M-08 | quote: breadth limit removed | `lib/engine-evidence-graph/quote-resolution.mjs` | killed | q.too_broad |
| M-09 | graph: span text check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.span_text_altered |
| M-10 | graph: traversal check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.untraceable_finding_rejected |
| M-11 | graph: evidence-path check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.supported_without_evidence_path |
| M-12 | graph: edge shape check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.edge_wrong_shape |
| M-13 | graph: edge meaning check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.edge_meaning_non_proof_altered |
| M-14 | graph: sufficiency-supported check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.sufficiency_supported_rejected |
| M-15 | graph: ordering check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.unsorted_rejected |
| M-16 | graph: limitation check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.missing_limitation_rejected |
| M-17 | graph: proof-claim guard removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.proof_claim_graph_guard_only |
| M-18 | graph: identity check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | g.version_tamper_rejected |
| M-19 | graph: conflict-node downgrade check removed | `lib/engine-evidence-graph/graph-validate.mjs` | killed | c.validator_rejects_undowngraded_conflict_node |
| M-20 | contradiction: downgrade removed in compiler | `lib/engine-evidence-graph/compiler.mjs` | killed | c.chronology_conflict_downgrades, c.validator_rejects_undowngraded_conflict_node, k.controls_neutral_and_present |
| M-21 | contradiction: impossible-sequence detection removed | `lib/engine-evidence-graph/contradictions.mjs` | killed | c.chronology_conflict_downgrades, c.validator_rejects_undowngraded_conflict_node, k.controls_neutral_and_present |
| M-22 | contradiction: decision-date detection removed | `lib/engine-evidence-graph/contradictions.mjs` | killed | c.decision_date_conflict |
| M-23 | contradiction: authority-state detection removed | `lib/engine-evidence-graph/contradictions.mjs` | killed | c.authority_state_conflict |
| M-24 | scope: v0.3 employment phrasings removed | `lib/engine-evidence-graph/scope.mjs` | killed | s.relieved_of_duties_refused |
| M-25 | scope: refusal never decided | `lib/engine-evidence-graph/scope.mjs` | killed | s.employment_refused, s.reworded_termination_refused, s.relieved_of_duties_refused |
| M-26 | scope: reworded injection pattern removed | `lib/engine-evidence-graph/scope.mjs` | killed | s.reworded_injection_detected |
| M-27 | scope: instruction-risk downgrade removed | `lib/engine-evidence-graph/compiler.mjs` | killed | s.injection_routes_all_review |
| M-28 | version: declared-version check removed | `lib/engine-evidence-graph/scope.mjs` | killed | v.codebook_mismatch_refused, v.prompt_mismatch_refused, v.compiler_mismatch_refused |
| M-29 | version: fixture-hash check removed | `lib/engine-evidence-graph/scope.mjs` | killed | v.fixture_hash_mismatch_refused |
| M-30 | version: response prompt check removed | `lib/engine-evidence-graph/response.mjs` | killed | v.response_prompt_mismatch_invalid |
| M-31 | response: untrusted-field check removed | `lib/engine-evidence-graph/response.mjs` | killed | v.untrusted_field_reason |
| M-32 | claim: prohibited-inference check removed | `lib/engine-evidence-graph/assertions.mjs` | killed | k.intent_inference_rejected |
| M-33 | claim: unstated-cause check removed | `lib/engine-evidence-graph/assertions.mjs` | killed | k.unstated_cause_rejected |
| M-34 | claim: assertion marker check removed | `lib/engine-evidence-graph/assertions.mjs` | killed | k.marker_required |
| M-35 | claim: condition permission check removed | `lib/engine-evidence-graph/assertions.mjs` | killed | k.condition_permission_required |
| M-36 | controls: template drifts into a recommendation | `lib/engine-evidence-graph/controls.mjs` | killed | k.controls_neutral_and_present, k.templates_all_neutral |
| M-37 | status: sufficiency override removed | `lib/engine-evidence-graph/compiler.mjs` | killed | st.clean_statuses |
| M-38 | status: gap accepted without a visible rule gap | `lib/engine-evidence-graph/compiler.mjs` | killed | st.unconfirmed_gap_routes_review |
| M-39 | evaluation: synthetic-holdout check removed | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.synthetic_holdout |
| M-40 | evaluation: overlap check removed | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.overlap |
| M-41 | evaluation: label-independence check removed | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.label_independence |
| M-42 | evaluation: tracked-directory check removed | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.raw_records_tracked |
| M-43 | evaluation: freeze check removed | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.changed_after_freeze |
| M-44 | evaluation: checker can approve | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.never_authorises |
| M-45 | evaluation: registry accepts completed status | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.registry_rejects_completed |
| M-46 | evaluation: registry chain check removed | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.registry_chain_detects_edit |
| M-47 | evaluation: engineering-role conflict check removed | `lib/engine-evidence-graph/evaluation/factory.mjs` | killed | e.authority_conflict |

## Corrections made during this run (disclosed)
| Finding | Cause | Correction |
|---|---|---|
| Probe `q.utf8_offsets` failed on the unmutated library | Test defect: the probe's record was so short that the quotation exceeded half of it, so `quote_too_broad` was correctly returned | Lengthened the probe record; the probe now also requires `verified_unique` and a UTF-8 offset that differs from the UTF-16 offset. The failing probe had been inflating kill lists, so it was fixed before kills were counted |
| M-04 target not found | Mutation text used an escaped form of the ellipsis character that does not appear in source | Target corrected to the literal source text |
| M-16 produced a syntax error | Deleting the `if` line orphaned its `else` | Mutation now replaces the condition with `false`; runner now treats any mutant that fails to load as a failure, not a kill |
| M-13 and M-17 survived | Real coverage gap: each guard was exercised only by a probe that the other guard also caught (a proof phrase inside an edge meaning) | Added two isolating probes: `g.edge_meaning_non_proof_altered` (only GV-03 catches it) and `g.proof_claim_graph_guard_only` (only GV-11 catches it). No guard was changed |

## Interpretation
Each mutated guard has at least one probe that depends on it.

## Limitation
Mutations were chosen by the same process that wrote the code and probes. Mutation kill shows sensitivity of the tests, not correctness of the rules.

## External evidence still required
Independent review of the mutation set.

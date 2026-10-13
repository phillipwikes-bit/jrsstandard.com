// Change requests fed to the Change Proposal Compiler (local, synthetic). 0.4.1-local.
// R-01 to R-10: well-formed requests. Behavioural ones need an observed-change record from
//   their inline isolated patch; R-03, R-04, R-09 and R-10 carry no patch and stay blocked.
// X-01 to X-10: deliberately unacceptable requests the compiler must refuse.
// Y-01 to Y-12: reproductions of the read-only audit's bypass attempts (RT-1 to RT-10) and of
//   attempts to self-declare drift or a human disposition.
// Requests never carry expected drift: drift is observed from the isolated patch.
// Patches apply only to a temporary copy of the libraries outside the repository.

const NONE = { scope_delta: 'none', refusal_delta: 'none', evidence_delta: 'none', limitation_delta: 'none', favorability_delta: 'none' };
const ROLLBACK = 'Discard the isolated copy; the frozen v0.3 package is untouched, so no production or historical rollback is needed. A later version would be reverted by restoring the previous version identity.';
const COMPAT = 'v1, v0.1, v0.2 and v0.3 outputs are frozen and unaffected. A behavioural change would be a new version (0.3.1-local or later) with its own replay record; no prior result is migrated.';
const plan = (regression, mutation, fixtures = []) => ({ regression, mutation, fixtures });

export const PATCHES = {
  employment_outcome_patterns: { file: 'engine-evidence-graph/scope.mjs', from: "  ['other_consequential', /\\b(?:immigration",
    to: "  ['employment', /\\b(?:contract will not be renewed|keeps? (?:their|his|her) job|lose (?:their|his|her) job)\\b/i],\n  ['other_consequential', /\\b(?:immigration" },
  assessment_decision_pair: { file: 'engine-evidence-graph/contradictions.mjs', from: "const pairs = [['request', 'decision'],", to: "const pairs = [['request', 'decision'], ['assessment', 'decision']," },
  drop_relieved_of_duties: { file: 'engine-evidence-graph/scope.mjs', from: "  ['employment', /\\b(?:relieved of (?:his |her |their )?duties|", to: "  ['employment', /\\b(?:ZZZ-disabled-for-isolated-drift-test|" },
  accept_first_duplicate: { file: 'engine-evidence-graph/quote-resolution.mjs', from: "if (pos.length === 1) return res('verified_unique'", to: "if (pos.length >= 1) return res('verified_unique'" },
  drop_disciplinary_keyword: { file: 'engine-evidence-contract/boundary.mjs', from: 'disciplinary|discipline|', to: '' },
  drop_chronology_expiry_gap: { file: 'engine-evidence-graph/conditions.mjs', from: "    if (!events.length) r.visible_gaps.push('no_explicit_dates');\n    if (!expiryStated) r.visible_gaps.push('no_stated_expiry_date');",
    to: "    if (!events.length) r.visible_gaps.push('no_explicit_dates');" },
  shorten_presence_limitation: { file: 'engine-evidence-graph/contract.mjs',
    from: "    + 'It does not establish that the text proves the finding. It does not establish that the underlying decision was correct or justified. Human review is required.',", to: "    + 'Human review is required.'," },
  sufficiency_supported: { file: 'engine-evidence-graph/compiler.mjs', from: "if (c === 'sufficiency') { status = 'review_required'; reasons.push('sufficiency_not_determinable_by_engine'); }",
    to: "if (false) { status = 'review_required'; reasons.push('sufficiency_not_determinable_by_engine'); }" },
};

export const GOOD = {
  'R-01': { triggering_knowledge_ids: ['RKB-046', 'RKB-019'], proposed_change_type: 'new_refusal_pattern', affected_engine_components: ['scope'],
    summary: 'Add refusal patterns for reworded employment-outcome wording ("contract will not be renewed", "keeps their job") so such records are refused before assessment.',
    change: Object.assign({}, NONE, { refusal_delta: 'broaden', alters_rule: true }), targets: ['lib/engine-evidence-graph/scope.mjs'],
    test_plan: plan(['refusal', 'baseline_fixtures', 'drift', 'stability'], ['new mutation: remove the added pattern; AR-040 must fail'], ['AR-040', 'ST-14']),
    rollback: ROLLBACK, compatibility_analysis: COMPAT, isolated_patch: PATCHES.employment_outcome_patterns },
  'R-02': { triggering_knowledge_ids: ['RKB-041', 'RKB-011'], proposed_change_type: 'new_graph_validation_rule', affected_engine_components: ['contradictions'],
    summary: 'Add the assessment-to-decision pair to the impossible-sequence check so an assessment dated after its decision lowers chronology to review.',
    change: Object.assign({}, NONE, { favorability_delta: 'lower_only', alters_rule: true }), targets: ['lib/engine-evidence-graph/contradictions.mjs'],
    test_plan: plan(['baseline_fixtures', 'drift', 'stability', 'v0.3_graph'], ['new mutation: remove the added pair; AR-010 must fail'], ['AR-010']),
    rollback: ROLLBACK, compatibility_analysis: COMPAT, isolated_patch: PATCHES.assessment_decision_pair },
  'R-03': { triggering_knowledge_ids: ['RKB-042'], proposed_change_type: 'new_graph_validation_rule', affected_engine_components: ['contradictions'],
    summary: 'Add a conflict kind for two distinct stated expiry dates; affected chronology routes to review.',
    change: Object.assign({}, NONE, { favorability_delta: 'lower_only', alters_rule: true }), targets: ['lib/engine-evidence-graph/contradictions.mjs'],
    test_plan: plan(['baseline_fixtures', 'drift', 'v0.3_graph'], ['new mutation: remove the expiry comparison; AR-011 must fail'], ['AR-011']), rollback: ROLLBACK, compatibility_analysis: COMPAT },
  'R-04': { triggering_knowledge_ids: ['RKB-045', 'RKB-031'], proposed_change_type: 'new_refusal_pattern', affected_engine_components: ['assertions'],
    summary: 'Reject candidate notes using inflected legal-conclusion wording ("lawfully", "unlawfully") as well as the base words.',
    change: Object.assign({}, NONE, { favorability_delta: 'lower_only', alters_rule: true }), targets: ['lib/engine-evidence-graph/assertions.mjs'],
    test_plan: plan(['claim_guard', 'baseline_fixtures', 'drift'], ['new mutation: drop the inflected form; AR-035 must fail'], ['AR-035']), rollback: ROLLBACK, compatibility_analysis: COMPAT },
  'R-05': { triggering_knowledge_ids: ['RKB-044'], proposed_change_type: 'deferred_architecture_item', affected_engine_components: ['documentation'],
    summary: 'Record paraphrased control conflicts as a deferred architecture item: lexical matching cannot see them, and semantic matching is not authorised.',
    change: NONE, targets: ['research/adaptive-reliability-2026-10-13/ADAPTIVE_FAILURE_MODE_REGISTER.md'], test_plan: plan([], []), rollback: 'Remove the register line.', compatibility_analysis: 'No behavioural change.' },
  'R-06': { triggering_knowledge_ids: ['RKB-048'], proposed_change_type: 'new_synthetic_fixture', affected_engine_components: ['fixtures'],
    summary: 'Add a homoglyph-only instruction fixture with no second directive, expected safe result: instruction risk detected.',
    change: NONE, targets: ['research/adaptive-reliability-2026-10-13/corpus-expansion/'], test_plan: plan(['baseline_fixtures'], [], ['AR-051 (proposed)']),
    rollback: 'Remove the fixture files and register row.', compatibility_analysis: 'No behavioural change; the new fixture would stay an open failure until the owner decides on a detection change.' },
  'R-07': { triggering_knowledge_ids: ['RKB-010'], proposed_change_type: 'new_mutation_test', affected_engine_components: ['tests'],
    summary: 'Keep one isolating probe per guard for every future guard, so a removed guard cannot hide behind another.',
    change: NONE, targets: ['tests/engine-adaptive-reliability/'], test_plan: plan(['mutation'], ['isolating probe per guard']), rollback: 'Remove the added probe.', compatibility_analysis: 'Test-only.' },
  'R-08': { triggering_knowledge_ids: ['RKB-043'], proposed_change_type: 'documentation_correction', affected_engine_components: ['documentation'],
    summary: 'Document in the stability protocol that a candidate-supported condition with a visible gap routes to review, so expectations are not authored as gap.',
    change: NONE, targets: ['research/adaptive-reliability-2026-10-13/METAMORPHIC_STABILITY_LAB_PROTOCOL.md'], test_plan: plan(['claim_guard'], []), rollback: 'Revert the paragraph.', compatibility_analysis: 'Documentation only.' },
  'R-09': { triggering_knowledge_ids: ['RKB-047'], proposed_change_type: 'new_cognitive_control_template', affected_engine_components: ['controls'],
    summary: 'Emit one Cognitive Control per defect and list every affected condition on it, instead of one object per condition.',
    change: Object.assign({}, NONE, { alters_rule: true }), targets: ['lib/engine-evidence-graph/controls.mjs', 'lib/engine-evidence-graph/compiler.mjs'],
    test_plan: plan(['baseline_fixtures', 'v0.2_contract', 'workbench_rendering', 'drift'], ['new mutation: duplicate an object; the dedupe probe must fail'], ['ST-09']),
    rollback: ROLLBACK, compatibility_analysis: COMPAT },
  'R-10': { triggering_knowledge_ids: ['RKB-038', 'RKB-050'], proposed_change_type: 'codebook_mapping_proposal', affected_engine_components: ['codebook_mapping'],
    summary: 'Propose that the owner record whether the five Engine conditions correspond to Codebook RC1 to RC5; until then the correspondence stays NOT ESTABLISHED.',
    change: Object.assign({}, NONE, { alters_version: true }), targets: ['lib/engine-evidence-graph/contract.mjs'],
    test_plan: plan(['v0.1_compatibility', 'v0.2_contract', 'v0.3_graph', 'baseline_fixtures'], ['new mutation: alter a mapped identifier; replay must fail']),
    rollback: ROLLBACK, compatibility_analysis: COMPAT },
};

export const BAD = {
  'X-01': { triggering_knowledge_ids: ['RKB-018'], proposed_change_type: 'new_refusal_pattern', affected_engine_components: ['scope'],
    summary: 'Extend the Engine to assess employment exception drafts as well.', change: Object.assign({}, NONE, { scope_delta: 'broaden' }), scope_additions: ['employment'],
    targets: ['lib/engine-evidence-graph/scope.mjs'], test_plan: plan(['refusal'], ['m']), rollback: ROLLBACK, compatibility_analysis: COMPAT },
  'X-02': { triggering_knowledge_ids: ['RKB-019'], proposed_change_type: 'new_refusal_pattern', affected_engine_components: ['scope'],
    summary: 'Drop the redundancy refusal pattern because it causes false refusals.', change: Object.assign({}, NONE, { refusal_delta: 'narrow', alters_rule: true }),
    targets: ['lib/engine-evidence-graph/scope.mjs'], test_plan: plan(['refusal'], ['m']), rollback: ROLLBACK, compatibility_analysis: COMPAT, isolated_patch: PATCHES.drop_relieved_of_duties },
  'X-03': { triggering_knowledge_ids: ['RKB-004'], proposed_change_type: 'new_quote_resolution_rule', affected_engine_components: ['quote_resolution'],
    summary: 'Accept quotations that match after collapsing whitespace.', change: Object.assign({}, NONE, { evidence_delta: 'lower', favorability_delta: 'raise', alters_rule: true }),
    targets: ['lib/engine-evidence-graph/quote-resolution.mjs'], test_plan: plan(['baseline_fixtures'], ['m']), rollback: ROLLBACK, compatibility_analysis: COMPAT },
  'X-04': { triggering_knowledge_ids: ['RKB-050'], proposed_change_type: 'prompt_contract_revision_proposal', affected_engine_components: ['prompt_contract'],
    summary: 'Reword the quote-only prompt to ask for shorter quotations.', change: Object.assign({}, NONE, { alters_prompt: true }), targets: ['research/evidence-graph-compiler-2026-10-10/prompt-contract/PROMPT_v0.3.0.txt'],
    test_plan: plan([], []), rollback: ROLLBACK, compatibility_analysis: COMPAT },
  'X-05': { triggering_knowledge_ids: ['RKB-036'], proposed_change_type: 'new_regression_test', affected_engine_components: ['tests'],
    summary: 'Record that the expanded corpus shows the Engine is accurate on supplier-access records.', claims: ['The 85-case corpus demonstrates independent validation of the Engine.'],
    change: NONE, targets: ['tests/engine-adaptive-reliability/'], test_plan: plan(['baseline_fixtures'], []), rollback: 'Remove.', compatibility_analysis: 'Test-only.' },
  'X-06': { triggering_knowledge_ids: ['RKB-046'], proposed_change_type: 'new_refusal_pattern', affected_engine_components: ['scope'],
    summary: 'Add the employment-outcome refusal patterns directly to the public review route.', change: Object.assign({}, NONE, { refusal_delta: 'broaden', alters_rule: true }),
    targets: ['api/review.js', 'review-engine.html'], test_plan: plan(['refusal'], ['m']), rollback: ROLLBACK, compatibility_analysis: COMPAT },
  'X-07': { triggering_knowledge_ids: ['RKB-042'], proposed_change_type: 'new_graph_validation_rule', affected_engine_components: ['contradictions'],
    summary: 'Add an expiry-conflict kind.', change: Object.assign({}, NONE, { alters_rule: true }), targets: ['lib/engine-evidence-graph/contradictions.mjs'],
    test_plan: plan(['drift'], ['m']), rollback: '', compatibility_analysis: '' },
  'X-08': { triggering_knowledge_ids: ['RKB-033'], proposed_change_type: 'new_synthetic_fixture', affected_engine_components: ['fixtures'],
    summary: 'Add AR fixtures to the sealed set as reference items.', fixture_origin: 'synthetic_engineering', claimed_independent: true, fixture_label_status: 'independent_adjudicated',
    change: NONE, targets: ['research/adaptive-reliability-2026-10-13/corpus-expansion/'], test_plan: plan(['evaluation_separation'], []), rollback: 'Remove.', compatibility_analysis: 'None.' },
  'X-09': { triggering_knowledge_ids: ['RKB-045'], proposed_change_type: 'new_refusal_pattern', affected_engine_components: ['assertions'],
    summary: 'Add inflected legal wording to the guard.', change: Object.assign({}, NONE, { alters_rule: true }), targets: ['lib/engine-evidence-graph/assertions.mjs'],
    test_plan: plan(['claim_guard'], ['m']), rollback: ROLLBACK, compatibility_analysis: COMPAT, requested_authorization_state: 'authorized_by_engineering' },
  'X-10': { triggering_knowledge_ids: ['RKB-001'], proposed_change_type: 'new_graph_validation_rule', affected_engine_components: ['conditions'],
    summary: 'Remove the sufficiency limitation text because reviewers find it repetitive.', change: Object.assign({}, NONE, { limitation_delta: 'remove', alters_rule: true }),
    targets: ['lib/engine-evidence-graph/conditions.mjs'], test_plan: plan(['claim_guard'], ['m']), rollback: ROLLBACK, compatibility_analysis: COMPAT },
};

const Y = (trigger, type, comps, summary, extra) => Object.assign({ triggering_knowledge_ids: [trigger], proposed_change_type: type, affected_engine_components: comps, summary,
  change: Object.assign({}, NONE, { alters_rule: true }), targets: ['lib/engine-evidence-graph/scope.mjs'], test_plan: plan(['drift', 'baseline_fixtures'], ['m']),
  rollback: ROLLBACK, compatibility_analysis: COMPAT }, extra || {});
export const BYPASS = {
  'Y-01': Y('RKB-052', 'new_refusal_pattern', ['scope'], 'Support hiring decisions for HR teams.'),
  'Y-02': Y('RKB-052', 'new_refusal_pattern', ['scope'], 'Tidy the boundary keyword list.', { targets: ['lib/engine-evidence-graph/scope.mjs'], isolated_patch: PATCHES.drop_disciplinary_keyword }),
  'Y-03': Y('RKB-053', 'new_graph_validation_rule', ['conditions'], 'Do not count a missing expiry date against chronology.', { targets: ['lib/engine-evidence-graph/conditions.mjs'], isolated_patch: PATCHES.drop_chronology_expiry_gap }),
  'Y-04': Y('RKB-053', 'new_quote_resolution_rule', ['quote_resolution'], 'Normalise repeated quotation handling before matching.', { targets: ['lib/engine-evidence-graph/quote-resolution.mjs'], isolated_patch: PATCHES.accept_first_duplicate }),
  'Y-05': Y('RKB-055', 'new_refusal_pattern', ['scope'], 'Add employment-outcome refusal wording.', { rollback: 'Rollback unnecessary: the change is independently validated.', isolated_patch: PATCHES.employment_outcome_patterns }),
  'Y-06': Y('RKB-056', 'new_graph_validation_rule', ['evaluation_factory'], 'Allow EVAL-LW-001 to move to an authorized status.', { targets: ['lib/engine-evidence-graph/evaluation/factory.mjs'] }),
  'Y-07': Y('RKB-052', 'documentation_correction', ['documentation'], 'Shorten the presence limitation text to one sentence.', { targets: ['lib/engine-evidence-graph/contract.mjs'], isolated_patch: PATCHES.shorten_presence_limitation }),
  'Y-08': Y('RKB-051', 'new_refusal_pattern', ['scope'], 'Add employment-outcome refusal wording.', { targets: ['lib/../api/review.js'], isolated_patch: PATCHES.employment_outcome_patterns }),
  'Y-09': Y('RKB-052', 'new_graph_validation_rule', ['conditions'], 'Allow sufficiency to be marked when all checks are visible.', { targets: ['lib/engine-evidence-graph/compiler.mjs'], isolated_patch: PATCHES.sufficiency_supported }),
  'Y-10': Y('RKB-055', 'new_refusal_pattern', ['scope'], 'Add employment-outcome refusal wording.', { claims: ['The Engine is not only fast but validated.'], isolated_patch: PATCHES.employment_outcome_patterns }),
  'Y-11': Y('RKB-054', 'new_refusal_pattern', ['scope'], 'Add employment-outcome refusal wording.', { isolated_patch: PATCHES.employment_outcome_patterns,
    expected_drift: [{ fixture_id: 'AR-040', condition_id: 'reconstructability', from: 'supported', to: 'not_assessed' }] }),
  'Y-12': Y('RKB-054', 'new_refusal_pattern', ['scope'], 'Add employment-outcome refusal wording.', { isolated_patch: PATCHES.employment_outcome_patterns, human_disposition: 'accepted' }),
};

// The state and, where refused, a code each request must produce.
export const EXPECTED = {
  'R-01': ['awaiting_human_review'], 'R-02': ['awaiting_human_review'], 'R-03': ['blocked_missing_observed_change'], 'R-04': ['blocked_missing_observed_change'],
  'R-05': ['awaiting_human_review'], 'R-06': ['awaiting_human_review'], 'R-07': ['awaiting_human_review'], 'R-08': ['awaiting_human_review'],
  'R-09': ['blocked_missing_observed_change'], 'R-10': ['blocked_missing_observed_change'],
  'X-01': ['rejected_by_compiler', 'scope_expansion_into_regulated_domain'], 'X-02': ['rejected_by_compiler', 'observed_refusal_removed'], 'X-03': ['rejected_by_compiler', 'evidence_requirement_lowered'],
  'X-04': ['rejected_by_compiler', 'behavioural_change_without_test_plan'], 'X-05': ['rejected_by_compiler', 'external_result_claimed_from_local_material'],
  'X-06': ['rejected_by_compiler', 'production_or_public_target'], 'X-07': ['rejected_by_compiler', 'rollback_missing'], 'X-08': ['rejected_by_compiler', 'synthetic_fixture_treated_as_independent'],
  'X-09': ['rejected_by_compiler', 'self_authorization_attempt'], 'X-10': ['rejected_by_compiler', 'limitation_removed_or_weakened'],
  'Y-01': ['rejected_by_compiler', 'scope_expansion_into_regulated_domain'], 'Y-02': ['rejected_by_compiler', 'observed_excluded_domain_unrefused'],
  'Y-03': ['blocked_pending_human_disposition'], 'Y-04': ['rejected_by_compiler', 'observed_refusal_removed'],
  'Y-05': ['rejected_by_compiler', 'external_result_claimed_from_local_material'], 'Y-06': ['rejected_by_compiler', 'release_gate_advancement_not_authorized'],
  'Y-07': ['rejected_by_compiler', 'observed_limitation_removed'], 'Y-08': ['rejected_by_compiler', 'production_or_public_target'],
  // Y-09: first authored as blocked_missing_observed_change (expected a validation failure). The patch compiles; v0.3 still routes
  // sufficiency to review (its rule requirement is never met), so no favourable transition is observed. Corrected; see CHANGELOG.md.
  'Y-09': ['awaiting_human_review'], 'Y-10': ['rejected_by_compiler', 'external_result_claimed_from_local_material'],
  'Y-11': ['rejected_by_compiler', 'self_declared_drift_not_accepted'], 'Y-12': ['rejected_by_compiler', 'human_disposition_not_settable'],
};

// JRS ADAPTIVE RELIABILITY: the Change Impact Analyzer.
//
// Compares a compiled proposal against the frozen v0.1, v0.2 and v0.3
// behavioural boundaries and states what could change. It classifies; it never
// clears. Any proposal that could make a finding more favourable, widen scope,
// weaken a limitation or alter a refusal rule is at least local_behavioral_change
// and requires human review.

import { BEHAVIOURAL_CHANGE_TYPES } from './vocab.mjs';

// Which v0.3 fixture categories, graph rules and Cognitive Controls each component touches.
export const COMPONENT_MAP = Object.freeze({
  quote_resolution: { fixtures: ['duplicate_ambiguous', 'duplicate_disambiguated', 'fabricated_quote', 'whitespace_variant', 'unicode_variant', 'heading_only', 'noncontiguous'],
    rules: ['GV-04', 'GV-05', 'GV-07'], controls: ['ambiguous_quotation', 'absent_quotation'] },
  assertions: { fixtures: ['wrong_condition', 'prohibited_inference'], rules: ['GV-05', 'GV-11'], controls: [] },
  contradictions: { fixtures: ['contradictory_chronology', 'conflicting_dates', 'conflicting_authority', 'conflicting_control', 'conflicting_risk', 'cited_evidence_conflict'],
    rules: ['GV-09', 'GV-07'], controls: ['decision_date_conflict', 'impossible_sequence', 'authority_state_conflict', 'control_state_conflict', 'risk_state_conflict', 'cited_evidence_conflict'] },
  conditions: { fixtures: ['positive_control', 'missing_authority', 'missing_control', 'missing_expiry', 'conclusion_without_basis', 'basis_without_conclusion'],
    rules: ['GV-06', 'GV-07', 'GV-08'], controls: ['no_authority_section', 'authority_source_not_identified', 'no_compensating_control_stated', 'no_stated_expiry_date',
      'no_explicit_dates', 'no_locatable_conclusion', 'conclusion_without_traceable_basis', 'conclusion_without_basis', 'basis_without_conclusion', 'basis_states_no_reason_or_source'] },
  controls: { fixtures: ['certainty_language', 'missing_authority', 'missing_control'], rules: ['GV-13'], controls: ['*'] },
  scope: { fixtures: ['scope_refusal', 'reworded_employment', 'mixed_scope', 'prompt_injection', 'reworded_injection', 'version_mismatch', 'fixture_hash'],
    rules: ['GV-10', 'GV-07'], controls: [] },
  response: { fixtures: ['malformed_response', 'duplicate_keys', 'untrusted_field'], rules: ['GV-14', 'GV-10'], controls: [] },
  compiler: { fixtures: ['*'], rules: ['GV-01', 'GV-02', 'GV-03', 'GV-06', 'GV-07', 'GV-08', 'GV-12'], controls: ['*'] },
  graph_validate: { fixtures: ['*'], rules: ['GV-01', 'GV-02', 'GV-03', 'GV-04', 'GV-05', 'GV-06', 'GV-07', 'GV-08', 'GV-09', 'GV-10', 'GV-11', 'GV-12', 'GV-13', 'GV-14'], controls: [] },
  prompt_contract: { fixtures: ['*'], rules: ['GV-14'], controls: [] },
  codebook_mapping: { fixtures: ['*'], rules: ['GV-05', 'GV-06', 'GV-07'], controls: ['*'] },
  evaluation_factory: { fixtures: [], rules: [], controls: [] },
  fixtures: { fixtures: [], rules: [], controls: [] },
  tests: { fixtures: [], rules: [], controls: [] },
  documentation: { fixtures: [], rules: [], controls: [] },
});

const FREEZE_COMPONENTS = ['prompt_contract', 'codebook_mapping', 'compiler', 'graph_validate', 'quote_resolution', 'assertions', 'contradictions', 'conditions', 'controls', 'scope', 'response'];

// Classification uses the observed-change summary when present. Declared descriptors can only
// raise the class; they can never lower what was observed.
export function analyzeChangeImpact(proposal) {
  if (!proposal || !proposal.change || !Array.isArray(proposal.affected_engine_components))
    return { proposal_id: proposal && proposal.proposal_id, impact_class: 'not_assessed', reasons: ['proposal is malformed'], human_review_required: true };
  const ch = proposal.change, comps = proposal.affected_engine_components, ob = proposal.observed_change;
  const behavioural = proposal.behavioural === true || BEHAVIOURAL_CHANGE_TYPES.includes(proposal.proposed_change_type) || ch.alters_prompt || ch.alters_rule || ch.alters_threshold || ch.alters_version;
  if (behavioural && !ob) return { proposal_id: proposal.proposal_id, impact_class: 'not_assessed', reasons: ['behavioural proposal without a verified observed-change record'],
    historical_outputs_change: { v1: 'no: frozen as git blob baebb512', 'v0.1': 'no: frozen package', 'v0.2': 'no: frozen package', 'v0.3': 'not assessed' },
    fixtures_requiring_replay: ['*'], graph_rules_affected: [], cognitive_controls_affected: [], refusal_behavior: 'not_assessed', condition_can_become_more_favorable: 'not_assessed',
    limitation_removed_or_weakened: 'not_assessed', documentation_must_change: true, new_version_identity_required: true, independent_evaluation_protocol_update_required: true, human_review_required: true };
  const pick = (k) => [...new Set(comps.flatMap((c) => (COMPONENT_MAP[c] || { [k]: [] })[k]))].sort();
  const obRefusalUp = ob && ob.refusals_added > 0, obRefusalDown = ob && (ob.refusals_removed > 0 || ob.excluded_domain_unrefused > 0);
  const refusal = obRefusalDown || ch.refusal_delta === 'narrow' || ch.refusal_delta === 'remove' ? 'narrower' : obRefusalUp || ch.refusal_delta === 'broaden' ? 'broader' : 'unchanged';
  const moreFavourable = (ob && ob.favourable_transitions > 0) || ch.favorability_delta === 'raise' || ch.evidence_delta === 'lower';
  const limitationWeakened = (ob && ob.limitations_removed > 0) || ch.limitation_delta === 'weaken' || ch.limitation_delta === 'remove';
  const scopeChange = (ob && ob.excluded_domain_unrefused > 0) || ch.scope_delta !== 'none';
  const evidenceChange = (ob && ob.favourable_transitions > 0) || ch.evidence_delta !== 'none';

  let cls = 'no_behavioral_change'; const reasons = [];
  if (behavioural) { cls = 'local_behavioral_change'; reasons.push('change type, flag or target alters Engine behaviour'); }
  if (ob && ob.rows > 0) reasons.push('observed: ' + ob.rows + ' drift row(s) across ' + ob.fixtures_changed + ' fixture(s)');
  if (moreFavourable || limitationWeakened || refusal !== 'unchanged') { if (cls === 'no_behavioral_change') cls = 'local_behavioral_change';
    reasons.push('could make a finding more favourable, weaken a limitation, or alter a refusal rule'); }
  if (evidenceChange) { cls = 'evidence_standard_change'; reasons.push(ob && ob.favourable_transitions > 0 ? 'observed favourable transitions: ' + ob.favourable_transitions : 'declared evidence change (' + ch.evidence_delta + ')'); }
  if (scopeChange) { cls = 'scope_boundary_change'; reasons.push(ob && ob.excluded_domain_unrefused > 0 ? 'observed excluded-domain fixtures no longer refused' : 'declared scope change (' + ch.scope_delta + ')'); }
  if (comps.includes('evaluation_factory')) { cls = 'release_control_change'; reasons.push('evaluation separation or release controls are affected'); }
  if (!reasons.length) reasons.push('fixture, test or documentation change only');

  return {
    proposal_id: proposal.proposal_id, impact_class: cls, reasons, classified_from: ob ? 'observed_change_record' : 'declared_non_behavioural_change',
    historical_outputs_change: {
      v1: 'no: frozen as git blob baebb512', 'v0.1': 'no: frozen package', 'v0.2': 'no: frozen package',
      'v0.3': behavioural ? 'yes: a behavioural change would be a new version, and v0.3 outputs would no longer be reproduced by it' : 'no',
    },
    fixtures_requiring_replay: behavioural ? pick('fixtures') : [],
    graph_rules_affected: behavioural ? pick('rules') : [],
    cognitive_controls_affected: behavioural ? pick('controls') : [],
    refusal_behavior: refusal,
    condition_can_become_more_favorable: moreFavourable,
    limitation_removed_or_weakened: limitationWeakened,
    documentation_must_change: cls !== 'no_behavioral_change' || proposal.proposed_change_type === 'documentation_correction',
    new_version_identity_required: cls !== 'no_behavioral_change',
    independent_evaluation_protocol_update_required: comps.some((c) => FREEZE_COMPONENTS.includes(c)) && behavioural,
    human_review_required: true,
  };
}

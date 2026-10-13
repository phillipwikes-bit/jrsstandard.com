// JRS EVIDENCE GRAPH 0.3.0: Cognitive Controls driven by graph defects.
//
// One remediation object per graph defect, with exactly detect, reflect, correct
// and learn. "correct" is always a neutral record-completion question. Nothing
// here tells a reviewer what to decide, whether access should be granted, whether
// anyone is credible, or what employment, disciplinary, legal or medical action
// to take. Every object passes the 0.2 neutrality check (reused unchanged); an
// object that fails is withheld and reported, never rewritten.

import { checkRemediationNeutral } from '../engine-evidence-contract/remediation.mjs';

export const DEFECT_TEMPLATES = Object.freeze({
  no_authority_section: ['identifiable_basis', 'No section of the record identifies an authority for the exception.',
    'A later reviewer may be unable to determine who authorised the exception.', 'What record identifies the authority for this exception?', 'Add an authority-source field to the exception template.'],
  authority_source_not_identified: ['identifiable_basis', 'The stated exception has no verified authority source linked in the record.',
    'A later reviewer may be unable to locate the authority the record relies on.', 'What record identifies the authority for this exception, and where can it be located?', 'Add an authority-source field with a document identifier and date.'],
  no_compensating_control_stated: ['sufficiency', 'No compensating control is stated in the record.',
    'A later reviewer cannot see what limited the exposure while the exception was open.', 'What compensating controls, if any, does the record identify for this access?', 'Add a compensating-controls field with a source reference.'],
  no_stated_expiry_date: ['chronology_integrity', 'No expiry date is stated for the exception.',
    'Without an end point a later reviewer cannot tell when the exception was expected to close.', 'What event or date would trigger renewal, expiry, or reassessment?', 'Require an expiry date and a renewal condition in the template.'],
  no_explicit_dates: ['chronology_integrity', 'No explicitly dated event appears in the record.',
    'The sequence of request, assessment and decision cannot be reconstructed.', 'What dates establish the request, assessment and decision sequence?', 'Require a date for each step of the exception workflow.'],
  no_locatable_conclusion: ['reconstructability', 'No section states the decision or conclusion.',
    'A later reviewer cannot identify what is being reconstructed.', 'Which passage records the decision this exception concerns?', 'Add a decision field to the exception template.'],
  conclusion_without_traceable_basis: ['reconstructability', 'A decision is stated with no linked basis section.',
    'A later reviewer may not be able to see what the decision rested on.', 'What record states the basis for this decision?', 'Pair the decision field with a basis field.'],
  conclusion_without_basis: ['reasoning_traceability', 'A decision is stated with no linked basis section.',
    'A later reviewer may not be able to trace how the decision was reached.', 'What record states the basis for this decision?', 'Pair the decision field with a basis field.'],
  basis_without_conclusion: ['reasoning_traceability', 'A basis is stated with no linked decision.',
    'A later reviewer may not be able to tell what the basis was used for.', 'Which passage records the decision this basis relates to?', 'Pair the basis field with a decision field.'],
  basis_states_no_reason_or_source: ['reasoning_traceability', 'The basis section states neither a reason nor a source reference.',
    'A later reviewer may not be able to see why the exception was considered.', 'What reason or source does the record give for the exception?', 'Add a source-reference field to the basis section.'],
  decision_date_conflict: ['chronology_integrity', 'Two verified record spans provide incompatible decision dates.',
    'The sequence cannot be reconstructed without clarification.', 'Which date reflects the actual decision, and what record confirms it?', 'Require a single decision-date field and source reference.'],
  impossible_sequence: ['chronology_integrity', 'Two dated record spans appear in an order that cannot both be correct as written.',
    'The sequence cannot be reconstructed without clarification.', 'What date establishes the decision sequence, and which source document records it?', 'Add a date check between request, decision and expiry fields.'],
  authority_state_conflict: ['identifiable_basis', 'The record states the authority as given in one passage and as pending in another.',
    'A later reviewer cannot tell the authority status from the record alone.', 'What record shows the authority status at the time of the decision?', 'Add an authority-status field with a date.'],
  control_state_conflict: ['sufficiency', 'A control is stated as in place in one passage and as not in place in another.',
    'A later reviewer cannot tell which controls applied from the record alone.', 'What record shows whether this control was in place, and from what date?', 'Add an implementation-date field for each control.'],
  risk_state_conflict: ['sufficiency', 'The record states the risk as low in one passage and as unresolved or high in another.',
    'A later reviewer cannot tell which risk statement the decision relied on.', 'What evidence links the stated risk to the requested access, and which risk statement does the record rely on?', 'Add a single risk field with its source.'],
  cited_evidence_conflict: ['reconstructability', 'Two quotations cited for the same assertion state incompatible values.',
    'A later reviewer cannot tell which statement the record relies on.', 'Which statement does the record rely on, and what record confirms it?', 'Use one field per fact so the record states it once.'],
  ambiguous_quotation: ['reconstructability', 'A proposed quotation occurs more than once in the record and could not be located uniquely.',
    'A reviewer cannot tell which passage the observation refers to.', 'Which occurrence of this text does the observation refer to?', 'Prefer distinctive wording in fields that are quoted.'],
  absent_quotation: ['reconstructability', 'A proposed quotation does not occur in the record.',
    'An observation that rests on text outside the record cannot be checked.', 'What passage of the record, if any, does this observation rely on?', 'Keep cited material inside the record or reference it by identifier.'],
  certainty_language: ['sufficiency', 'A record span uses absolute or certainty terms.',
    'Absolute terms state a confidence the record may not show the basis for.', 'What evidence in the record supports the stated degree of certainty?', 'List certainty terms that prompt a request for the supporting measurement.'],
});

const CERTAINTY = /\b(?:clearly|obviously|undoubtedly|certainly|definitely|no risk|zero risk|risk-free|fully secure|completely secure|guaranteed?|cannot fail|beyond doubt|without question)\b/i;
export function certaintySpans(record) {
  const out = []; const re = new RegExp(CERTAINTY.source, 'gi'); let m;
  while ((m = re.exec(record)) !== null) out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  return out;
}

export function buildControls(defects) {
  const controls = [], withheld = [];
  const seen = new Set();
  for (const d of defects) {
    const t = DEFECT_TEMPLATES[d.defect];
    if (!t || seen.has(d.defect + '|' + (d.condition_id || t[0]))) continue;
    seen.add(d.defect + '|' + (d.condition_id || t[0]));
    const obj = { control_id: 'GCC:' + d.defect, defect: d.defect, related_condition: d.condition_id || t[0], scope: 'documentation_control_only',
      detect: t[1], reflect: t[2], correct: t[3], learn: t[4], span_ids: d.span_ids || [], route: 'human_review' };
    const problems = checkRemediationNeutral(obj);
    if (problems.length) withheld.push({ defect: d.defect, problems }); else controls.push(obj);
  }
  return { controls, withheld };
}

// JRS PHASE 9: human decision model.
//
// Seven outcomes, each with its meaning, minimum basis, prohibited reasoning, escalation rule and
// relationship to the Engine result. The model is for human reviewers. Nothing in this package
// selects, infers or fills in an outcome; deriveOutcome always refuses.

import { OUTCOMES, ESCALATING_OUTCOMES, EVIDENCE_LAYERS, PROHIBITED_QUESTIONS } from './contract.mjs';

export const DECISION_MODEL = Object.freeze([
  { outcome: 'supports_finding', meaning: 'The quoted words, read in their section and in the record, bear on the condition and support the finding.', minimum_basis: 'At least one verified quotation whose actual words, not an inferred meaning, carry the support, with the reviewer naming those words.', prohibited_reasoning: 'Support inferred from the presence of a quotation, from the Engine status, from the outcome of the decision, or from what the author probably meant.', escalation_rule: 'None, unless a conflict indicator or missing information remains unresolved; then escalate instead.', engine_relationship: 'Independent of the Engine status. Agreement with a supported Engine status is recorded, never assumed.' },
  { outcome: 'does_not_support_finding', meaning: 'The quoted words are present but do not bear on the condition, or bear on it without supporting the finding.', minimum_basis: 'The reviewer states what the quoted words actually say and why that does not support the finding.', prohibited_reasoning: 'Rejecting support because the decision seems wrong, because of the outcome, or because of a guessed motive.', escalation_rule: 'Escalate if other record text might carry the support but is not cited.', engine_relationship: 'Where the Engine status is supported, the difference goes to the disagreement protocol; the Engine output is not changed.' },
  { outcome: 'insufficient_context', meaning: 'The record does not contain enough to decide whether the quotation supports the finding.', minimum_basis: 'The reviewer names the specific missing information.', prohibited_reasoning: 'Filling the gap with assumptions or with knowledge outside the record.', escalation_rule: 'Always escalates.', engine_relationship: 'Consistent with any Engine route to review; recorded as a disagreement if the Engine status is supported.' },
  { outcome: 'ambiguous', meaning: 'The quoted words admit more than one reasonable reading and the record does not settle which applies.', minimum_basis: 'The reviewer states at least two readings and why the record does not decide between them.', prohibited_reasoning: 'Choosing the reading that fits the outcome.', escalation_rule: 'Always escalates.', engine_relationship: 'Recorded as a disagreement if the Engine status is supported.' },
  { outcome: 'record_conflict', meaning: 'Parts of the record contradict each other on a point the condition depends on.', minimum_basis: 'The reviewer cites the conflicting passages.', prohibited_reasoning: 'Deciding which passage is true.', escalation_rule: 'Always escalates.', engine_relationship: 'Consistent with an Engine conflict indicator; a conflict the Engine did not flag is recorded as a reviewer-identified risk.' },
  { outcome: 'outside_authorized_scope', meaning: 'The material falls outside the authorized review scope (for example employment matters or a legal question).', minimum_basis: 'The reviewer names the scope boundary that applies.', prohibited_reasoning: 'Reviewing the material anyway, or deciding the excluded question.', escalation_rule: 'Always escalates; the item is not reviewed further.', engine_relationship: 'Consistent with an Engine refusal; if the Engine did not refuse, recorded as a reviewer-identified risk.' },
  { outcome: 'abstain_and_escalate', meaning: 'The reviewer cannot responsibly reach any of the other outcomes.', minimum_basis: 'The reviewer states why no other outcome can be reached.', prohibited_reasoning: 'Abstaining to avoid recording a disagreement with the Engine.', escalation_rule: 'Always escalates to the adjudicator.', engine_relationship: 'No inference about the Engine result.' },
]);

export function validateDecisionModel(model = DECISION_MODEL) {
  const p = [];
  if (JSON.stringify(model.map((m) => m.outcome)) !== JSON.stringify(OUTCOMES)) p.push('outcome set altered');
  for (const m of model) for (const k of ['meaning', 'minimum_basis', 'prohibited_reasoning', 'escalation_rule', 'engine_relationship']) if (!m[k]) p.push(m.outcome + ': missing ' + k);
  for (const o of ESCALATING_OUTCOMES) { const m = model.find((x) => x.outcome === o); if (m && !/escalat/i.test(m.escalation_rule)) p.push(o + ': escalation rule missing'); }
  const s = model.find((x) => x.outcome === 'supports_finding');
  if (!s || !/presence of a quotation/.test(s.prohibited_reasoning) || !/Engine status/.test(s.prohibited_reasoning)) p.push('supports_finding does not prohibit support from presence or Engine status');
  if (JSON.stringify(EVIDENCE_LAYERS.map((l) => l.layer)) !== JSON.stringify(['quote_presence', 'quote_accuracy', 'section_linkage', 'semantic_support', 'decision_validity'])) p.push('evidence layers collapsed or altered');
  if (EVIDENCE_LAYERS.find((l) => l.layer === 'semantic_support').determined_by !== 'Human reviewer only') p.push('semantic support not reserved to the human reviewer');
  const text = JSON.stringify(model);
  for (const q of PROHIBITED_QUESTIONS) if (new RegExp('decide (?:the )?' + q, 'i').test(text)) p.push('model asks reviewers to decide ' + q);
  return p;
}

// A future reviewer entry (decision ledger row). Only a human may complete one.
export function validateReviewerEntry(e) {
  const p = [];
  if (!e || e.source !== 'human') p.push('entry not completed by a human reviewer');
  if (!e || !OUTCOMES.includes(e.outcome)) p.push('outcome not admissible');
  if (!e || !e.rationale || String(e.rationale).trim().length < 20) p.push('rationale missing');
  if (!e || !/^REVIEWER-PLACEHOLDER-\d+$/.test(e.reviewer_placeholder || '')) p.push('reviewer identity must be a placeholder');
  if (e && e.outcome === 'supports_finding' && !(e.cited_evidence || []).length) p.push('supports_finding without cited words');
  if (e && ESCALATING_OUTCOMES.includes(e.outcome) && e.escalated !== true) p.push('escalating outcome not escalated');
  if (e && /^(?:engine|auto|model|system)/i.test(String(e.source || ''))) p.push('entry generated by the system');
  return p;
}

// No function in this package derives a human outcome. This exists so that a caller fails loudly.
export function deriveOutcome() { throw new Error('REFUSED: semantic support is determined by a human reviewer; this package never derives or fills in an outcome'); }

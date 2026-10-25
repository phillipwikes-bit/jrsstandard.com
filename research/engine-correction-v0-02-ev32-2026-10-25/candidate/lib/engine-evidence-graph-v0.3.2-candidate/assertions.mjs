// JRS EVIDENCE GRAPH 0.3.0: bounded assertion compiler.
//
// Turns a verified quotation into a narrow record assertion: "the record states
// <assertion type> here". An assertion type is accepted only if the quoted text
// itself carries a visible marker of that type (a date for stated_date, an
// identifier for stated_source_reference, and so on). The marker check is
// lexical and does not establish that the text means what the type suggests;
// every assertion carries requires_human_interpretation: true.
//
// Candidate notes are screened for inferences the Engine must never make:
// intent, motive, credibility, emotional state, discrimination, legal
// conclusions, fairness, compliance, and causes not stated in the quoted text.

import { ASSERTION_TYPES, CONDITION_ASSERTIONS } from './contract.mjs';
import { scanProhibitedClaims } from '../engine-evidence-contract/claims.mjs';

const ID = /\b[A-Z]{2,}(?:-[A-Z0-9]+)*-\d+\b|§\s*\d|\bsection\s+\d|\bitem\s+\d|\bminutes\b/i;
const DATE = /\b\d{4}-\d{2}-\d{2}\b/;

export const ASSERTION_MARKERS = Object.freeze({
  stated_authority: /\b(?:authority|board|approved by|authori[sz]ed by|signed off by|approver|committee)\b/i,
  stated_decision: /\b(?:decision|granted|approved|denied|rejected|declined)\b/i,
  stated_date: DATE,
  stated_rationale: /\b(?:because|based on|basis|found that|needs?|in order to|to reconcile|rationale|justification|requires?)\b/i,
  stated_risk: /\brisk\b/i,
  stated_control: /\b(?:control|controls|limited to|restricted|multi-factor|mfa|monitor\w*|logg?\w*|reviewed|encrypt\w*)\b/i,
  stated_expiry: /\b(?:expir\w*|valid until|until)\b/i,
  stated_renewal_condition: /\b(?:renew\w*|reassess\w*|extension)\b/i,
  stated_source_reference: ID,
  stated_unresolved_issue: /\b(?:pending|unresolved|open issue|not yet|awaiting|to be confirmed|outstanding)\b/i,
});

const EXTRA_INFERENCE = [
  ['discrimination', /\b(?:discriminat\w*|prejudic\w*|targeted because)\b/i],
  ['motive', /\b(?:motive|motivated|in order to hide|wanted to|tried to)\b/i],
];
// RP-STR-01 (Phase 7): the label 'motive' is itself a word the graph self-validation forbids, so a rejected
// motive note made the compiler fail (P6-RT-07). With the rule active the label is 'attributed_purpose'.
const LABEL = (cat, rules) => (cat === 'motive' && rules && rules.has('RP-STR-01') ? 'attributed_purpose' : cat);
const CAUSAL = /\b(?:because|caused|due to|as a result of|led to|resulted in)\b/i;

export function compileAssertion({ observation, evidenceId, quotedText, spanId, conditionId, rules = new Set() }) {
  const problems = [];
  const t = observation.assertion_type;
  if (!ASSERTION_TYPES.includes(t)) problems.push('unsupported_assertion_type');
  else {
    if (!ASSERTION_MARKERS[t].test(quotedText)) problems.push('assertion_type_not_visible_in_quoted_text');
    if (!CONDITION_ASSERTIONS[conditionId].includes(t)) problems.push('assertion_type_not_permitted_for_condition');
  }
  const note = typeof observation.note === 'string' ? observation.note : '';
  for (const c of scanProhibitedClaims(note)) problems.push('prohibited_inference:' + c.category);
  for (const [cat, re] of EXTRA_INFERENCE) if (re.test(note)) problems.push('prohibited_inference:' + LABEL(cat, rules));
  if (CAUSAL.test(note) && !CAUSAL.test(quotedText)) problems.push('prohibited_inference:cause_not_stated_in_quote');
  const assertion = {
    assertion_id: 'as:' + evidenceId.replace(/^ev:/, ''),
    assertion_type: t,
    quoted_text: quotedText,
    record_span_id: spanId,
    condition_id: conditionId,
    assertion_scope: 'The record contains this text, associated with the assertion type ' + t + '.',
    assertion_limit: 'This assertion records what the text states. It does not establish that the statement is true, complete, or sufficient.',
    requires_human_interpretation: true,
  };
  return { ok: problems.length === 0, problems: [...new Set(problems)], assertion };
}

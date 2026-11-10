// JRS EVIDENCE CONTRACT 0.2.0: Cognitive Controls remediation layer (documentation only).
//
// Wraps the 0.1 record controls (lib/engine-assurance/cognitive-controls.mjs,
// unchanged) and returns, for each detection, a bounded remediation object:
//   detect  : the observed documentation pattern, with record spans
//   reflect : why a reviewer should pause
//   correct : a neutral RECORD-COMPLETION QUESTION, never an instruction
//   learn   : an optional reusable checklist improvement
//
// It never produces a decision, a business action, advice, a diagnosis, a
// credibility assessment, or a statement about a person. Every object passes
// checkRemediationNeutral() before it is returned; one that fails is withheld
// and reported, not softened or rewritten.

import { runCognitiveControls } from '../engine-assurance/cognitive-controls.mjs';

// Which contract condition a reviewer would look at first. A routing aid only;
// it does not change any condition status.
export const CONTROL_TO_CONDITION = Object.freeze({
  'CC-01': 'reasoning_traceability',
  'CC-02': 'identifiable_basis',
  'CC-03': 'chronology_integrity',
  'CC-04': 'sufficiency',
  'CC-05': 'reconstructability',
  'CC-06': 'reconstructability',
});

export const CORRECTIVE_QUESTIONS = Object.freeze({
  conclusion_precedes_basis: 'Which passage records the basis for this decision, and where does the record place it relative to the decision statement?',
  conclusion_without_labelled_basis: 'Which passage of the record states the basis for this decision?',
  reference_without_identifier: 'What record identifies the authority or evidence cited in this passage?',
  relative_time_without_anchor: 'What calendar date, or what event, does this time reference correspond to, and what event would trigger renewal, expiry, or reassessment?',
  no_absolute_dates: 'What date establishes each step of the decision sequence?',
  date_order_conflict: 'What date establishes the decision sequence, and which source document records it?',
  absolute_or_certainty_term: 'What evidence in the record supports the stated degree of certainty?',
  conflicting_risk_statements: 'What evidence links the stated risk to the requested access, and which risk statement does the record rely on?',
  conflicting_access_statements: 'Which access level does the record describe as granted, and which passage records it?',
  action_missing_owner: 'Who does the record identify as responsible for this action?',
  action_missing_deadline: 'What date or follow-up point does the record set for this action?',
  action_missing_owner_and_deadline: 'Who does the record identify as responsible for this action, and what date or follow-up point does it set?',
});

// v0.2 wording for "learn" where the 0.1 text uses a modal verb the neutrality
// guard rejects. The 0.1 package is not edited. (Found 2026-10-10 when the
// widened guard withheld CC-04 on fixture SAE-015.)
export const LEARN_OVERRIDES = Object.freeze({
  absolute_or_certainty_term: 'Codebook candidate: a list of certainty terms that prompts a request for the supporting measurement.',
});

// Independent of the templates above: what a remediation object must never say.
// Widened 2026-10-10 after the suite found that "Should the access be revoked?"
// passed: a recommendation phrased as a question. Any modal of obligation and
// any revocation or termination verb now fails.
const DIRECTIVE = /\b(?:approve|approved|reject|rejected|deny|denied|grant the|revok\w*|terminat\w*|dismiss\w*|discipline|escalate to|should|ought to|must|need to|we recommend|recommend(?:ed|s|ing)?|advise|advice|the decision (?:is|was) (?:correct|wrong|justified))\b/i;
const PERSONAL = /\b(?:bias(?:ed)?|mental|psycholog\w*|intent(?:ion)?s?|motive|motivat\w*|credib\w*|honest\w*|dishonest\w*|deceptiv\w*|lying|personality|diagnos\w*|emotion\w*|treatment|therap\w*|stress\w*|the author (?:is|was|believes|feels|thinks)|the writer (?:is|was))\b/i;

export function checkRemediationNeutral(obj) {
  const problems = [];
  if (!obj || typeof obj.correct !== 'string' || !obj.correct.trim().endsWith('?')) problems.push('correct_is_not_a_question');
  for (const field of ['reflect', 'correct', 'learn']) {
    const v = obj && obj[field];
    if (v == null) continue;
    if (DIRECTIVE.test(v)) problems.push(field + '_contains_directive_or_recommendation');
    if (PERSONAL.test(v)) problems.push(field + '_describes_a_person');
  }
  const d = obj && obj.detect && obj.detect.summary;
  if (d && PERSONAL.test(d)) problems.push('detect_describes_a_person');
  return problems;
}

export function remediationFor(record) {
  const out = [], withheld = [];
  for (const c of runCognitiveControls(record)) {
    const question = CORRECTIVE_QUESTIONS[c.detect.pattern_id];
    const obj = {
      control_id: c.control_id,
      pattern_id: c.detect.pattern_id,
      related_condition: CONTROL_TO_CONDITION[c.control_id],
      scope: 'documentation_control_only',
      detect: { summary: c.detect.summary, spans: c.detect.spans },
      reflect: c.reflect,
      correct: question || null,
      learn: LEARN_OVERRIDES[c.detect.pattern_id] || c.learn,
      route: 'human_review',
    };
    const problems = question ? checkRemediationNeutral(obj) : ['no_corrective_question_defined'];
    if (problems.length) withheld.push({ control_id: c.control_id, pattern_id: c.detect.pattern_id, problems });
    else out.push(obj);
  }
  return { remediation: out, withheld };
}

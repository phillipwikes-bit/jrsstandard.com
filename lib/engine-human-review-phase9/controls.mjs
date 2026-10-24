// JRS PHASE 9: Cognitive Controls for reviewers.
//
// Each control names one predictable review risk and asks one neutral, operational
// question. No control tells a reviewer what to conclude. Cognitive Controls are
// structured review safeguards; they make no clinical or diagnostic claim.

export const CONTROLS = Object.freeze([
  { id: 'CC-INTENT', name: 'Intent inference', review_risk: 'Inferring why someone acted from the outcome alone.', prompt: 'Which words in the record state a reason, and which reasons are being supplied from the outcome rather than from the record?' },
  { id: 'CC-PLAUSIBLE', name: 'Plausible explanation is not evidence', review_risk: 'Treating a reasonable-sounding explanation as if the record established it.', prompt: 'Is this explanation stated in the record, or is it one possible reading that the record does not state?' },
  { id: 'CC-NEGATION', name: 'Negation, qualification and condition', review_risk: 'Missing "not", "unless", "only if" or similar words that change what the text says.', prompt: 'Does the quoted text contain a negation, qualification or condition, and how does it change what the text says?' },
  { id: 'CC-DATES', name: 'Event, document and decision dates', review_risk: 'Merging the date something happened, the date it was written and the date it was decided.', prompt: 'For each date in the quotation, is it an event date, a document date or a decision date, and does the sequence hold?' },
  { id: 'CC-WORDS', name: 'Actual words versus assumed meaning', review_risk: 'Reading meaning into a quotation that its words do not carry.', prompt: 'What does the quotation literally say, without adding meaning that is not in its words?' },
  { id: 'CC-MISSING', name: 'Missing information', review_risk: 'Completing gaps in the record with assumptions.', prompt: 'What information would be needed to answer the reviewer question that the record does not contain?' },
  { id: 'CC-BASIS', name: 'Stated basis versus conclusion', review_risk: 'Treating a stated conclusion as if it were its own basis.', prompt: 'Which text is the conclusion, and which text, if any, is the stated basis for it?' },
  { id: 'CC-ESCALATE', name: 'Escalation when reconstruction is not possible', review_risk: 'Completing a review that the record cannot support instead of escalating.', prompt: 'Can this condition be reviewed from the record as it stands, or does the review need to be escalated?' },
]);
export const CONTROL_IDS = Object.freeze(CONTROLS.map((c) => c.id));

// Directive wording that would tell a reviewer what to find.
const DIRECTIVE = /\b(?:you should (?:find|conclude|mark|select)|must (?:be )?(?:supported|support)|is supported|is not supported|select (?:supports_finding|does_not_support_finding)|conclude that|the answer is|mark (?:it|this) as|therefore (?:supports|does not support)|clearly (?:supports|shows)|the correct outcome)\b/i;
const CLINICAL = /\b(?:diagnos\w*|therap\w*|treatment|clinical|disorder|patient)\b/i;
export const isNeutral = (text) => !DIRECTIVE.test(String(text)) && !CLINICAL.test(String(text));

// Detects a disabled, missing, altered or directive control. enabled: optional list of enabled ids.
export function validateControls(controls = CONTROLS, enabled = CONTROL_IDS) {
  const p = [];
  for (const id of CONTROL_IDS) {
    const c = controls.find((x) => x.id === id);
    if (!c) { p.push('control missing: ' + id); continue; }
    if (!enabled.includes(id)) p.push('control disabled: ' + id);
    if (!c.review_risk || !c.prompt || !c.name) p.push('control incomplete: ' + id);
    if (!isNeutral(c.prompt) || !isNeutral(c.review_risk)) p.push('control directs a result: ' + id);
    if (!/\?$/.test(c.prompt.trim())) p.push('control is not phrased as a question: ' + id);
  }
  if (controls.length !== CONTROL_IDS.length) p.push('unexpected control set size');
  return p;
}

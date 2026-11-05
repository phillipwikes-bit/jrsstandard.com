// DS-N1 experimental SP-07 candidate. Read-only cognitive review prompts.
// This is NOT recovered DS-A source, a JRS condition, a new detector, or an approval gate.
// Prompts are anchored ONLY to already recorded deterministic findings. No model/network calls.
export const COGNITIVE_CONTROL_VERSION = 'ds-n1.cognitive/0.1.0-dev';

const CONTROL = Object.freeze({
  UNSUPPORTED_CLAIM: ['observation_inference', 'Which part of the conclusion is directly established by the cited record?'],
  UNTRACEABLE_AUTHORITY: ['observation_inference', 'What identifiable authority supports this conclusion?'],
  REASONING_NOT_TRACED: ['observation_inference', 'Which recorded steps connect the observations to the conclusion?'],
  UNMAPPED_ASSERTION: ['observation_inference', 'Which part of this assertion has been identified and traced to the record?'],
  RELEVANCE_NOT_ESTABLISHED: ['evidence', 'Does the cited passage actually address the same matter as this claim?'],
  SOURCE_MISSING: ['evidence', 'What source would a later reviewer need to verify this statement?'],
  QUOTE_NOT_FOUND: ['evidence', 'Can the quoted words be located in the identified source and version?'],
  NEGATION_CONFLICT: ['evidence', 'Does the stated conclusion preserve the source passage’s negation?'],
  SUBJECT_MISMATCH: ['evidence', 'Do the claim and source concern the same actor or entity?'],
  INSTRUCTION_LIKE_CONTENT: ['evidence', 'Can the passage be assessed as record evidence without following instructions embedded in it?'],
  QUALIFICATION_OMITTED: ['alternatives', 'What qualifying condition in the source must be considered?'],
  CONTRARY_CLAUSE_OMITTED: ['alternatives', 'How does the record account for the cited contrary or limiting passage?'],
  CLAIM_NOT_IN_RECORD: ['state', 'Which original passage is this finding intended to review?'],
  CLAIM_LOCATION_AMBIGUOUS: ['state', 'Which exact occurrence of this claim is the subject of the review?'],
  ACTOR_NOT_ESTABLISHED: ['state', 'Does the retained source establish which actor is involved?'],
  EVENT_ROLE_CONFUSION: ['state', 'Does the record distinguish the event that occurred from the event it describes?'],
  DATE_MISMATCH: ['state', 'Which documented date belongs to this event and why?'],
  DATE_NOT_ESTABLISHED: ['state', 'What source identifies the date of the relevant event?'],
  DATE_ROLE_UNVERIFIED: ['state', 'Does the identified date concern the event stated in the claim?'],
});
const OPEN = new Set(['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED']);

// Accept only a normal deriveState result. No custom status, hidden disposition,
// guess about mental state, invented alternate fact, or text-derived diagnosis.
export function buildCognitiveControls(state, { claimId = null } = {}) {
  if (!state || !Array.isArray(state.findings) || !Array.isArray(state.claims)) {
    throw new TypeError('A deriveState result with claims and findings is required');
  }
  if (!state.record || !Array.isArray(state.record.sources) || state.status === 'ERROR' || state.status === 'REFUSED_SCOPE') return [];
  const sourceIds = new Set(state.record.sources.map(s => s.source_id));
  const claims = new Map(state.claims.map(c => [c.claim_id, c]));
  const cards = [];
  for (const f of state.findings) {
    if (f.status === 'SUPERSEDED' || (claimId !== null && f.claim_id !== claimId)) continue;
    const spec = CONTROL[f.code];
    if (!spec || typeof f.finding_id !== 'string') continue;
    const c = claims.get(f.claim_id);
    const referenced = (c && Array.isArray(c.citations) ? c.citations : [])
      .filter(x => typeof x.source_id === 'string' && sourceIds.has(x.source_id))
      .map(x => x.source_id);
    cards.push({
      control_version: COGNITIVE_CONTROL_VERSION,
      finding_id: f.finding_id,
      claim_id: f.claim_id || null,
      condition: f.condition || null,
      category: spec[0],
      question: spec[1],
      passage: c && typeof c.text === 'string' ? c.text : null,
      source_ids: [...new Set(referenced)],
      finding_status: f.status,
      unresolved: OPEN.has(f.status),
      action_surface: 'existing_findings_and_actions',
      limitation: 'Review prompt only. No inference about reviewer bias, intent, sufficiency, or legal approval.',
    });
  }
  return cards;
}

// DS-N1 cognitive lenses and cognitive safeguards (2026-11-18).
//
// A LENS guides attention: it names a reasoning risk shown by the record and asks
// one neutral question. A SAFEGUARD (CC-*) says what the review process should do
// with that risk: which existing reviewer actions fit, and whether the matter
// should go to an authorised reviewer.
//
// Both are read-only. They never create or change a finding, a status, the event
// log or the report, never rewrite a claim, never supply a fact, and never infer
// a writer's or reviewer's intent, motive, emotion or state of mind. Every item is
// anchored to a recorded finding, an observation, or a quoted word in the record.
// No model or network calls.
import { buildCognitiveObservations } from './cognitive-observations.mjs';
import { fold } from './text.mjs';

export const SAFEGUARD_VERSION = 'ds-n1.cognitive-safeguards/0.1.0-dev';
export const SAFEGUARD_LIMITATION =
  'Review prompt only. It does not decide sufficiency, validity, liability or outcome, and makes no inference about any person.';

const UNRESOLVED = new Set(['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED']);

// Twelve commercial lens definitions, plus two from the second specification
// (causation, automation reliance). Aliases record the second specification's
// names for the same lens.
export const LENSES = Object.freeze({
  observation_vs_inference: { title: 'Observation versus inference', aliases: [],
    question: 'What does the cited source directly establish, and what has been inferred from it?' },
  alternative_explanations: { title: 'Alternative explanations', aliases: [],
    question: 'Could the same evidence support another reasonable reading, and why was this one chosen?' },
  selective_evidence: { title: 'Selective evidence', aliases: ['confirmation'],
    question: 'Has qualifying or contrary material in the cited source been left out?' },
  premature_closure: { title: 'Premature closure', aliases: [],
    question: 'What remains unresolved before this conclusion can be finalized?' },
  unsupported_certainty: { title: 'Unsupported certainty', aliases: ['certainty_calibration'],
    question: 'Does the strength of the wording exceed the strength of the evidence?' },
  negation_and_qualification: { title: 'Negation and qualification', aliases: ['language_fidelity'],
    question: 'Does the statement preserve every "not", "unless", "subject to" or "only if" in the source?' },
  chronology: { title: 'Chronology and sequence', aliases: [],
    question: 'Are occurrence, assessment, authorization and reporting dates kept distinct and in order?' },
  source_relevance: { title: 'Source relevance', aliases: ['evidence_relevance'],
    question: 'Does the source concern the same person, transaction, event, rule and period?' },
  authority_integrity: { title: 'Authority and rule integrity', aliases: ['authority'],
    question: 'Which identifiable authority, policy or provision supports this, and in which version?' },
  missing_evidence: { title: 'Missing evidence', aliases: ['evidence_sufficiency'],
    question: 'What evidence would be needed to verify this, and is it in the record?' },
  reasoning_continuity: { title: 'Reasoning continuity', aliases: ['reconstruction'],
    question: 'Could an independent reviewer follow the steps from the evidence to this conclusion?' },
  materiality_and_escalation: { title: 'Materiality and escalation', aliases: [],
    question: 'Could this unresolved issue change the conclusion, and does it need a different level of review?' },
  causation: { title: 'Causation', aliases: [],
    question: 'Does the evidence establish cause, or only sequence or association?' },
  automation_reliance: { title: 'Automation reliance', aliases: [],
    question: 'Was each critical warning checked against the evidence before it was set aside?' },
});

// Finding code -> lenses it shows.
const LENS_BY_CODE = Object.freeze({
  UNSUPPORTED_CLAIM: ['observation_vs_inference', 'missing_evidence'],
  UNMAPPED_ASSERTION: ['observation_vs_inference'],
  EVENT_ROLE_CONFUSION: ['alternative_explanations', 'chronology'],
  SUBJECT_MISMATCH: ['alternative_explanations', 'source_relevance'],
  RELEVANCE_NOT_ESTABLISHED: ['alternative_explanations', 'source_relevance'],
  ACTOR_NOT_ESTABLISHED: ['source_relevance'],
  QUALIFICATION_OMITTED: ['selective_evidence', 'negation_and_qualification'],
  SUPPORT_NOT_CONFIRMED: ['source_relevance'],
  POSSIBLE_CONTRADICTION: ['negation_and_qualification', 'source_relevance'],
  POSSIBLE_SUBJECT_MISMATCH: ['alternative_explanations', 'source_relevance'],
  DATE_OMITTED: ['selective_evidence', 'chronology'],
  SPEAKER_OMITTED: ['selective_evidence'],
  CONTRARY_CLAUSE_OMITTED: ['selective_evidence'],
  NEGATION_CONFLICT: ['negation_and_qualification'],
  DATE_MISMATCH: ['chronology'],
  DATE_NOT_ESTABLISHED: ['chronology', 'missing_evidence'],
  DATE_ROLE_UNVERIFIED: ['chronology'],
  UNTRACEABLE_AUTHORITY: ['authority_integrity'],
  SOURCE_MISSING: ['missing_evidence'],
  QUOTE_NOT_FOUND: ['missing_evidence'],
  REASONING_NOT_TRACED: ['reasoning_continuity'],
  CLAIM_NOT_IN_RECORD: ['reasoning_continuity'],
  // 2026-11-25: practitioner-gap findings.
  RECOMMENDATION_STATED_AS_REQUIREMENT: ['unsupported_certainty', 'negation_and_qualification'],
  CONCLUSORY_ASSESSMENT: ['observation_vs_inference', 'missing_evidence'],
  AUTHORITY_TEXT_NOT_SUPPLIED: ['authority_integrity', 'missing_evidence'],
  CONCLUSION_ON_UNRESOLVED_BASIS: ['premature_closure', 'reasoning_continuity'],
  BROAD_ACCESS_NOT_JUSTIFIED: ['materiality_and_escalation'],
});

// The eight named safeguards. CC-INTENT is specified two ways in the owner's
// documents ("prevent unsupported assumptions about intent or purpose" and
// "preserve the actual question or request being considered"); both triggers are
// implemented and reported separately.
export const CONTROLS = Object.freeze({
  'CC-INTENT': { title: 'Intent and purpose',
    purpose: 'Prevent unsupported statements of intent or purpose, and keep the finding on the actual request or question.' },
  'CC-PLAUSIBLE': { title: 'Plausibility versus evidence',
    purpose: 'Challenge conclusions resting on plausibility rather than identifiable evidence.' },
  'CC-NEGATION': { title: 'Negation and qualifiers',
    purpose: 'Preserve negation, restrictions and qualifications.' },
  'CC-DATES': { title: 'Temporal integrity',
    purpose: 'Keep events, assessments, decisions, approvals and effective dates distinct and in order.' },
  'CC-WORDS': { title: 'Material language changes',
    purpose: 'Identify wording that strengthens or changes what the source says.' },
  'CC-MISSING': { title: 'Missing information',
    purpose: 'Surface evidence the record does not contain.' },
  'CC-BASIS': { title: 'Evidentiary and reasoning basis',
    purpose: 'Require an identifiable, relevant basis for consequential assertions.' },
  'CC-ESCALATE': { title: 'Human oversight',
    purpose: 'Route material unresolved issues to an authorised reviewer before finalization.' },
});

const CONTROL_BY_CODE = Object.freeze({
  SUBJECT_MISMATCH: 'CC-INTENT', EVENT_ROLE_CONFUSION: 'CC-INTENT',
  NEGATION_CONFLICT: 'CC-NEGATION', QUALIFICATION_OMITTED: 'CC-NEGATION', CONTRARY_CLAUSE_OMITTED: 'CC-NEGATION',
  DATE_OMITTED: 'CC-NEGATION', SPEAKER_OMITTED: 'CC-NEGATION',
  DATE_MISMATCH: 'CC-DATES', DATE_NOT_ESTABLISHED: 'CC-DATES', DATE_ROLE_UNVERIFIED: 'CC-DATES',
  SOURCE_MISSING: 'CC-MISSING', QUOTE_NOT_FOUND: 'CC-MISSING', ACTOR_NOT_ESTABLISHED: 'CC-MISSING',
  UNSUPPORTED_CLAIM: 'CC-BASIS', SUPPORT_NOT_CONFIRMED: 'CC-BASIS', POSSIBLE_CONTRADICTION: 'CC-NEGATION', POSSIBLE_SUBJECT_MISMATCH: 'CC-BASIS', UNTRACEABLE_AUTHORITY: 'CC-BASIS', REASONING_NOT_TRACED: 'CC-BASIS',
  RELEVANCE_NOT_ESTABLISHED: 'CC-BASIS',
  RECOMMENDATION_STATED_AS_REQUIREMENT: 'CC-WORDS', CONCLUSORY_ASSESSMENT: 'CC-BASIS',
  AUTHORITY_TEXT_NOT_SUPPLIED: 'CC-MISSING', CONCLUSION_ON_UNRESOLVED_BASIS: 'CC-PLAUSIBLE',
  BROAD_ACCESS_NOT_JUSTIFIED: 'CC-ESCALATE',
});

const CONTROL_QUESTION = Object.freeze({
  SUBJECT_MISMATCH: 'Is this finding about the same person or organisation as the cited source?',
  EVENT_ROLE_CONFUSION: 'Is this finding about the original event or request, or a different one described in the source?',
  NEGATION_CONFLICT: 'Does the statement preserve the negation in the cited source?',
  QUALIFICATION_OMITTED: 'Does the statement preserve the condition attached in the cited source?',
  SUPPORT_NOT_CONFIRMED: 'Does the cited passage say what the statement says?',
  POSSIBLE_CONTRADICTION: 'Does the source say the opposite of this statement, or is a different passage meant?',
  POSSIBLE_SUBJECT_MISMATCH: 'Does the source concern the same person or body as the statement?',
  DATE_OMITTED: 'Does the statement keep the date the cited source gives?',
  SPEAKER_OMITTED: 'Does the statement keep who said it, as the cited source records?',
  CONTRARY_CLAUSE_OMITTED: 'How does the statement account for the contrary or limiting part of the cited source?',
  DATE_MISMATCH: 'Which documented date belongs to this event, and why?',
  DATE_NOT_ESTABLISHED: 'Which source identifies the date of this event?',
  DATE_ROLE_UNVERIFIED: 'Does the cited date concern the event stated?',
  SOURCE_MISSING: 'Where is the source this statement relies on?',
  QUOTE_NOT_FOUND: 'Can the quoted words be found in the identified source and version?',
  ACTOR_NOT_ESTABLISHED: 'Which source establishes who was involved?',
  UNSUPPORTED_CLAIM: 'Which specific source establishes this statement as written?',
  UNTRACEABLE_AUTHORITY: 'Which identifiable authority or provision supports this?',
  REASONING_NOT_TRACED: 'Which recorded steps connect the evidence to this conclusion?',
  RELEVANCE_NOT_ESTABLISHED: 'Does the cited passage address the same matter as this statement?',
  RECOMMENDATION_STATED_AS_REQUIREMENT: 'Has a recommendation become a requirement in the retelling, and who made it binding?',
  CONCLUSORY_ASSESSMENT: 'What did the assessment actually examine, and is its result being relied on without its basis?',
  AUTHORITY_TEXT_NOT_SUPPLIED: 'Can the cited policy or standard be produced, so its terms can be checked?',
  CONCLUSION_ON_UNRESOLVED_BASIS: 'Would the conclusion still be reached if the open points went the other way?',
  BROAD_ACCESS_NOT_JUSTIFIED: 'Should a decision to grant broad access without a stated reason go to an authorised reviewer?',
});

// Recommended existing reviewer actions per control (session.mjs action types).
const ACTIONS = Object.freeze({
  'CC-INTENT': ['revise_claim', 'attach_citation', 'request_evidence'],
  'CC-PLAUSIBLE': ['attach_citation', 'revise_claim', 'request_evidence'],
  'CC-NEGATION': ['revise_claim', 'override'],
  'CC-DATES': ['revise_claim', 'attach_citation', 'request_evidence'],
  'CC-WORDS': ['revise_claim', 'record_limitation'],
  'CC-MISSING': ['request_evidence', 'attach_citation', 'escalate'],
  'CC-BASIS': ['attach_citation', 'add_reasoning', 'request_evidence'],
  'CC-ESCALATE': ['escalate', 'request_evidence', 'leave_pending'],
});

// Lexical markers. A hit means the wording is present, not that it is wrong.
const INTENT = /\b(intended to|intentionally|deliberately|on purpose|in order to|so as to|with the aim of|sought to|wanted to|meant to|knowingly|wil(?:l)?fully|purpose was|motive|motivated)\b/u;
const PLAUSIBLE = /\b(likely|probably|presumably|plausibly|it appears|it seems|apparently|must have|would have|reasonable to assume|it is reasonable|suggests that)\b/u;
const CAUSAL = /\b(caused|causes|because of|due to|led to|leads to|resulted in|results in|as a result of|owing to|consequently|therefore)\b/u;
// Word strength: a hedged or provisional source term restated as a firm one.
const WEAK = /\b(may|might|could|possible|possibly|proposed|recommended|should|pending|draft|provisional|tentative|expected to|planned)\b/u;
const STRONG = /\b(must|will|shall|confirmed|approved|established|required|final|definitely|is certain|granted|completed)\b/u;

const has = (re, text) => typeof text === 'string' && re.test(fold(text).text);
const firstMatch = (re, text) => { const m = fold(String(text || '')).text.match(re); return m ? m[0] : null; };

function citedSentences(claim) {
  return (Array.isArray(claim.citations) ? claim.citations : [])
    .map((c) => (c && c.source_sentence && typeof c.source_sentence.text === 'string') ? c.source_sentence.text : null)
    .filter(Boolean);
}

// Input: a normal deriveState result. Output: { lenses, controls }, deterministic.
export function buildSafeguards(state) {
  if (!state || !Array.isArray(state.findings) || !Array.isArray(state.claims)) {
    throw new TypeError('A deriveState result with claims and findings is required');
  }
  if (!state.record || state.status === 'ERROR' || state.status === 'REFUSED_SCOPE') return { lenses: [], controls: [] };
  const active = state.findings.filter((f) => f && f.status !== 'SUPERSEDED' && typeof f.finding_id === 'string');
  const unresolved = active.filter((f) => UNRESOLVED.has(f.status));
  const lenses = [];
  const controls = [];
  const lensSeen = new Set();
  const lens = (key, claimId, trigger, related) => {
    const id = `${key}|${claimId}|${trigger}`;
    if (lensSeen.has(id)) return;
    lensSeen.add(id);
    lenses.push({ version: SAFEGUARD_VERSION, lens: key, title: LENSES[key].title, aliases: LENSES[key].aliases,
      claim_id: claimId, trigger, question: LENSES[key].question, related_findings: related,
      changes_review_status: false, limitation: SAFEGUARD_LIMITATION });
  };
  const control = (cc, claimId, trigger, question, related, extra = {}) => {
    controls.push({ version: SAFEGUARD_VERSION, control: cc, title: CONTROLS[cc].title, claim_id: claimId, trigger,
      question, related_findings: related, recommended_actions: [...ACTIONS[cc]], escalate: cc === 'CC-ESCALATE',
      changes_review_status: false, limitation: SAFEGUARD_LIMITATION, ...extra });
  };

  // 1. From unresolved findings.
  for (const f of unresolved) {
    for (const key of LENS_BY_CODE[f.code] || []) lens(key, f.claim_id || null, f.code, [f.finding_id]);
    const cc = CONTROL_BY_CODE[f.code];
    if (cc) control(cc, f.claim_id || null, f.code, CONTROL_QUESTION[f.code], [f.finding_id]);
  }

  // 2. From the wording observations (certainty, closure, alternative reading).
  for (const o of buildCognitiveObservations(state)) {
    if (o.kind === 'premature_closure') lens('premature_closure', o.claim_id, o.kind, o.related_findings);
    if (o.kind === 'unsupported_certainty') {
      lens('unsupported_certainty', o.claim_id, o.kind, o.related_findings);
      control('CC-WORDS', o.claim_id, `certainty:${o.markers.join(',')}`,
        'Does this wording state more certainty than the cited evidence supports?', o.related_findings);
    }
    if (o.kind === 'alternative_interpretation') lens('alternative_explanations', o.claim_id, o.kind, o.related_findings);
  }

  // 3. Text checks on each claim against its own cited source sentences.
  for (const c of state.claims) {
    if (!c || typeof c.text !== 'string') continue;
    const open = unresolved.filter((f) => f.claim_id === c.claim_id).map((f) => f.finding_id);
    const src = citedSentences(c);
    const supportedSomewhere = src.length > 0 && !open.length;
    const intent = firstMatch(INTENT, c.text);
    if (intent && !src.some((s) => has(new RegExp(`\\b${intent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'u'), s))) {
      control('CC-INTENT', c.claim_id, `intent:${intent}`,
        `What source records the purpose stated here ("${intent}"), rather than inferring it?`, open, { facet: 'stated_intent' });
    }
    const plaus = firstMatch(PLAUSIBLE, c.text);
    if (plaus && !supportedSomewhere) {
      control('CC-PLAUSIBLE', c.claim_id, `plausibility:${plaus}`,
        `What specific source establishes this, rather than making it plausible ("${plaus}")?`, open);
      lens('observation_vs_inference', c.claim_id, `plausibility:${plaus}`, open);
    }
    const cause = firstMatch(CAUSAL, c.text);
    if (cause && c.kind !== 'conclusion' && !src.some((s) => has(CAUSAL, s))) {
      lens('causation', c.claim_id, `causal:${cause}`, open);
    }
    for (const s of src) {
      const weak = firstMatch(WEAK, s);
      const strong = firstMatch(STRONG, c.text);
      if (weak && strong && !has(WEAK, c.text) && !has(STRONG, s)) {
        control('CC-WORDS', c.claim_id, `strength:${weak}->${strong}`,
          `Does restating "${weak}" in the source as "${strong}" overstate what the source says?`, open);
        lens('negation_and_qualification', c.claim_id, `strength:${weak}->${strong}`, open);
        break;
      }
    }
  }

  // 4. Materiality and escalation: unresolved critical findings, and critical
  // warnings that were overridden without any evidence-related action.
  const critical = unresolved.filter((f) => f.severity === 'critical' || f.severity === 'blocking');
  if (critical.length) {
    lens('materiality_and_escalation', null, `unresolved_critical:${critical.length}`, critical.map((f) => f.finding_id));
    const closure = buildCognitiveObservations(state).some((o) => o.kind === 'premature_closure');
    if (closure) {
      control('CC-ESCALATE', null, 'closure_with_unresolved_critical',
        'Should these unresolved critical issues go to an authorised reviewer before the record is finalized?',
        critical.map((f) => f.finding_id), { route: 'authorised_reviewer' });
    }
  }
  const overridden = active.filter((f) => f.status === 'OVERRIDDEN' && f.severity === 'critical');
  if (overridden.length) {
    const evidenceActions = (state.events || []).filter((e) => ['attach_citation', 'revise_claim', 'add_reasoning', 'request_evidence'].includes(e.type));
    if (!evidenceActions.length) {
      lens('automation_reliance', null, `overridden_without_evidence_action:${overridden.length}`, overridden.map((f) => f.finding_id));
    }
    control('CC-ESCALATE', null, 'critical_overridden',
      'Has someone with authority reviewed the decision to override these critical warnings?',
      overridden.map((f) => f.finding_id), { route: 'authorised_reviewer' });
  }
  return { lenses, controls };
}

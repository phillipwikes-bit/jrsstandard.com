// JRS controlled independent-evaluation readiness: shared vocabulary. INTERNAL, PLANNING ONLY.
// No network, no provider, no clock, no storage. Every value here is read by the validators and the
// verifier, so a change to it is a change to a control.
import { readFileSync } from 'node:fs';

export const PACKAGE_DIR = new URL('../', import.meta.url).pathname;          // tools/evaluation-readiness/
export const PACKAGE_ID = 'JRS-EVAL-READINESS-20261007-PR39';
export const PACKAGE_MARKER = 'jrs-evaluation-readiness';
const load = (f) => JSON.parse(readFileSync(PACKAGE_DIR + f, 'utf8'));
export const loadMapping = () => load('codebook-mapping.json');
export const loadRegistry = () => load('readiness-registry.json');
export const loadContract = () => load('readiness-contract.json');
export const loadAuthority = () => load('authority-matrix.json');

// States this package may record. None of them is an evaluation result: the package defines no
// state for one, so no code path here can emit one.
export const PERMITTED_STATES = Object.freeze(['PLANNING_ONLY', 'UNVERIFIED', 'BLOCKED', 'NOT_ASSESSED', 'REQUIRED_UNFILLED', 'ABSENT', 'NOT_PRESENT',
  'INTAKE_CLOSED', 'REFUSED', 'BINDING_COMPLETE_UNVERIFIED', 'WELL_FORMED_NOT_ADMITTED', 'VERIFIED_IN_REPOSITORY', 'TARGET_ONLY', 'DEVELOPMENT_ONLY', 'NOT_FROZEN']);
// States that would claim an outcome nobody has produced. Built from parts so the files that define
// them do not themselves carry the words as states.
export const PROHIBITED_STATES = Object.freeze(['VALI' + 'DATED', 'RELEASE' + '_READY', 'READY', 'APPR' + 'OVED', 'PASS', 'PASSED', 'PRODUCTION' + '_READY', 'INDEPENDENTLY' + '_EVALUATED',
  'EVALUATION' + '_COMPLETE', 'CLEARED', 'AUTHORIZED', 'CERTIFIED', 'COMPLIANT', 'DEMO' + '_READY', 'ENTERPRISE' + '_READY', 'LICENSE' + '_READY', 'SALE' + '_READY', 'PILOT' + '_READY']);

// Scope. Only completed, non-HR supplier-access exception records; every other domain is refused.
export const ALLOWED_RECORD_CATEGORIES = Object.freeze(['supplier_access_exception']);
export const REFUSED_DOMAINS = Object.freeze(['employment', 'housing', 'lending', 'insurance', 'medical', 'legal_outcome', 'education', 'benefits', 'immigration', 'criminal_justice', 'credit', 'tenancy', 'healthcare', 'hr']);

export const CONDITION_IDS = Object.freeze(['RC1', 'RC2', 'RC3', 'RC4', 'RC5']);
export const DETERMINATIONS = Object.freeze(['AFFIRMATIVE_DEFECT', 'INFORMATION_MISSING', 'NO_DEFECT_OBSERVED', 'INSUFFICIENT_BASIS_TO_ASSESS']);
export const HUMAN_ROLES = Object.freeze(['independent_reviewer', 'adjudicator', 'record_custodian', 'counsel', 'owner', 'independent_production_qa']);
export const FREEZES = Object.freeze(['codebook', 'interpretation', 'calibration', 'adjudication_protocol']);
export const GATE_IDS = Object.freeze(['RG-1', 'RG-2', 'RG-3', 'RG-4', 'RG-5']);

// Resolves a condition reference to its ID. Only an ID, a canonical name or an assignment label
// resolves; a candidate key or any other label is refused, never guessed.
export function resolveCondition(label, mapping = loadMapping()) {
  if (typeof label !== 'string') return null;
  if (mapping.candidate_keys_not_conditions.keys.includes(label)) return null;
  const c = mapping.conditions.find((x) => x.condition_id === label || x.canonical_name === label || x.assignment_label === label);
  return c ? c.condition_id : null;
}

// Text that would describe a person instead of the record, or decide a legal question.
export const PROHIBITED_INFERENCE = Object.freeze({
  emotion: /\b(angry|upset|frustrat\w*|anxious|afraid|emotional(?:ly)?|felt (?:pressured|rushed))\b/i,
  intent: /\b(intend(?:ed|s)? to|intention(?:al(?:ly)?)?|deliberately|on purpose|knowingly)\b/i,
  motive: /\b(motive|motivated by|ulterior|to cover (?:up|for)|agenda)\b/i,
  payoff: /\b(payoff|kickback|personal gain|stood to (?:gain|benefit))\b/i,
  credibility: /\b(credib\w*|lying|lied|liar|dishonest\w*|untruthful|trustworth\w*)\b/i,
  clinical: /\b(depress\w*|narcissis\w*|paranoi\w*|disorder|mental (?:state|health|illness)|diagnos\w*)\b/i,
  legal_conclusion: /\b(liab(?:le|ility)|unlawful|illegal|fraud\w*|negligen\w*|in breach of|violat(?:ed|es|ion of) (?:the )?(?:law|statute|regulation))\b/i,
  compliance_conclusion: /\b(?:is|are|was|not)\s+(?:non-)?compliant\b|\bcomplies with\b/i,
});
export function inferenceGroups(text) {
  return Object.keys(PROHIBITED_INFERENCE).filter((k) => PROHIBITED_INFERENCE[k].test(String(text || '')));
}

// Field names that would carry record content. No artifact of this package may hold one.
export const RECORD_TEXT_FIELDS = Object.freeze(['text', 'record_text', 'raw', 'raw_text', 'content', 'body', 'excerpt', 'quote', 'quotation', 'passage', 'source_text']);
export const MAX_FREE_TEXT = 400;

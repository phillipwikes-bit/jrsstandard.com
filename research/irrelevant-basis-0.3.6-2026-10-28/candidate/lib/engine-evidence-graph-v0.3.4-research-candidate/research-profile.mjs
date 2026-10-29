// JRS EVIDENCE GRAPH 0.3.4-research-candidate: the study research profile, repaired after the 156-record study.
// RESEARCH USE ONLY.
//
// INERT BY DEFAULT. Nothing here runs unless compileEvidenceGraph() receives a researchProfile object that
// passes checkResearchProfile() AND the separately signed research rule pack (rule-packs-research/) validates.
// Without that object the compiler follows the 0.3.2 path unchanged. With an invalid object or pack it refuses
// every record (fail closed). There is no environment variable, default or fallback that enables it.
//
// WHAT 0.3.3 ADDED, for study decision records written as prose (kept, with the changes below):
//   RP-SRP-01 sentence units with lexical roles (decision, basis cue, authority reference, added conclusion);
//   RP-SRP-02 evidence anchors (dates, identifiers, quantities, on-file documents), excluding the decision's own
//             date, the identifier of the thing decided, and the figures inside an authority citation;
//   RP-SRP-03 dates written in words, an event key per date, and a conflict only for one event with two dates;
//   RP-SRP-04 opposite outcomes for different decision units are not treated as a contradiction;
//   RP-SRP-05 opposite outcomes for the same decision unit are a record conflict;
//   RP-SRP-06 an authority reference without facts showing its conditions are met is not an identifiable basis;
//   RP-SRP-07 a reason that restates the conclusion, or a decision with no reason, is not a traceable rationale;
//   RP-SRP-08 expiry, compensating-control and labelled-section rules do not apply to study records, and an
//             added conclusion needs its own evidence.
// WHAT 0.3.4 CHANGES (failure identifiers from the study's reports/FAILURE_REGISTER.md):
//   RP-SRP-09 decision-linked evidence (VF-01, VF-02, EF-05, EF-06, VF-04). An anchor is evidence only when the
//             record itself links it to a decision: it sits in a decision sentence (outside the decision's own
//             date, subject and details), in a sentence that gives a reason and refers to the decision, or in a
//             sentence naming the same source (an identifier, or the date of the same event) as linked evidence.
//             Two kinds of INFERRED link stop a "no evidence" flag but can never support a condition: facts that
//             state a measurement in the same unit as a condition of an authority the decision cites, and a
//             sentence reporting evidence about what a decision concerns (its subject identifier, a named party
//             or item, or a value the decision sentence states). Shared ordinary words are not used. Every other
//             anchor is reported as unlinked and never counted. A first sentence with no verb is a title: its
//             contents are metadata.
//   RP-SRP-10 event identity reads instance words ("next", "previous", "second", "revised") and planned events;
//             chronology counts dated events on the decision path only; more process words carry event keys;
//             a comma inside a number no longer cuts the event window; an unnumbered decision object is
//             compared for opposite outcomes (EF-07, VF-05).
//   RP-SRP-11 a research instruction screen (VF-03): text addressed to a reviewing system, or directing how the
//             record is assessed, is quarantined. Its anchors and roles are dropped, nothing can be supported,
//             and the visible gaps of the rest of the record are still reported.
//   RP-SRP-12 decision wording (EF-01, EF-03): verb families in place of single words; when the rules find no
//             decision but the candidate quotes one, the result is review, not a "no conclusion" gap.
//   RP-SRP-13 cognitive controls (CF-01): one control per defect, naming every affected condition and the record
//             passages it concerns, with observed text, inferred concern and requested clarification kept apart.
//   Defect fix in RP-SRP-02 (EF-02): verb forms ("was", "is", "has") are not read as plural quantities.
// WHAT 0.3.6 CHANGES (irrelevant-basis investigation, 2026-10-28; parent 0.3.5, whose compiler is 0.3.4):
//   RP-SRP-14 a stated link is an assertion, not support. A sentence that says the decision "rests on" or "was based
//             on" identified material, or a decision sentence's own dates and identifiers, still counts as a STATED
//             basis: it removes the "no linked evidence" and "no stated reason" gaps, because the record does state
//             one. It no longer SUPPORTS any basis condition by itself, because the words cannot show that the
//             material concerns the decision. Support needs a relevance assessment by a separately identified
//             person, supplied in the research profile (relevance_assessments), never by the candidate response.
//             An assessment that the stated material is not relevant removes that link, so a demonstrated absence
//             of linked evidence is reported again. Without an assessment, the conditions go to review with the
//             reason stated_link_relevance_unresolved. Nothing else in the rules changes.
// WHAT IT NEVER DOES: raise a candidate status; produce a supported sufficiency finding; produce any overall
// result, readiness verdict, legal or compliance conclusion; assess a person; repair a quotation; truncate or
// segment a record (over-length records are refused exactly as in 0.3.2).
//
// EVERYTHING IS STILL LEXICAL. These rules see words, not meaning. A link is a pattern of words: an irrelevant
// sentence that the record explicitly states as the basis ("the decision rests on ...") is treated as a stated
// basis, and the instruction screen misses phrasings it has no pattern for. The rules were written by the same
// developer who wrote the study records, so agreement with those records is conformance, not accuracy.

import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateRulePacks } from './rule-packs.mjs';
import { ASSERTION_MARKERS } from './assertions.mjs';
import { DEFECT_TEMPLATES } from './controls.mjs';
import { detectInstructionRisk } from './scope.mjs';
import { checkRemediationNeutral } from '../engine-evidence-contract/remediation.mjs';

export const RESEARCH_PROFILE_ID = 'jrs-study-research-profile/1';
export const RESEARCH_PROMPT_VERSION = 'jrs-engine-local-0.3.5-research/prompt-1';   // unchanged in 0.3.6: no prompt change
export const RESEARCH_RULES = Object.freeze(['RP-SRP-01', 'RP-SRP-02', 'RP-SRP-03', 'RP-SRP-04', 'RP-SRP-05', 'RP-SRP-06', 'RP-SRP-07', 'RP-SRP-08',
  'RP-SRP-09', 'RP-SRP-10', 'RP-SRP-11', 'RP-SRP-12', 'RP-SRP-13', 'RP-SRP-14']);
const ALL_RULES = new Set(RESEARCH_RULES);
export const RESEARCH_AUTHORIZED_SCOPE = Object.freeze({ record_type: 'study_decision_record', record_state: 'completed_record',
  content_origin: Object.freeze(['constructed_study_vignette', 'synthetic_study_record']) });
const PROFILE_FIELDS = Object.freeze(['profile_id', 'enabled', 'authorization_ref', 'relevance_assessments']);
// RP-SRP-14: a relevance assessment is made by a separately identified PERSON about one sentence of the record (the
// sentence unit as the rules split it, identified by the SHA-256 of its text). The candidate response cannot carry one
// (the response validator refuses undeclared fields). An assessor that is not a person, or is named like a model or
// system, is refused, and the whole profile fails closed.
const ASSESSMENT_FIELDS = Object.freeze(['statement_sha256', 'relevant', 'assessor_kind', 'assessor_name', 'assessed_on']);
const NON_HUMAN_NAME = /\b(?:claude|haiku|sonnet|opus|fable|mythos|gpt|chatgpt|gemini|llama|mistral|copilot|model|llm|ai|engine|bot|assistant|automated|automatic|system|script|compiler)\b/i;
export function checkRelevanceAssessments(list) {
  const p = [];
  if (list === undefined) return p;
  if (!Array.isArray(list)) return ['relevance_assessments_not_a_list'];
  const seen = new Set();
  list.forEach((a, i) => {
    const at = 'relevance_assessment ' + i + ': ';
    if (!a || typeof a !== 'object' || Array.isArray(a)) { p.push(at + 'not an object'); return; }
    for (const k of Object.keys(a)) if (!ASSESSMENT_FIELDS.includes(k)) p.push(at + 'undeclared field ' + k);
    if (typeof a.statement_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(a.statement_sha256)) p.push(at + 'statement_sha256 invalid');
    else if (seen.has(a.statement_sha256)) p.push(at + 'duplicate statement'); else seen.add(a.statement_sha256);
    if (typeof a.relevant !== 'boolean') p.push(at + 'relevant must be true or false');
    if (a.assessor_kind !== 'human') p.push(at + 'assessor_kind must be human');
    if (typeof a.assessor_name !== 'string' || a.assessor_name.trim().length < 3) p.push(at + 'assessor_name missing');
    else if (NON_HUMAN_NAME.test(a.assessor_name)) p.push(at + 'assessor_name names a model or system, not a person');
    if (typeof a.assessed_on !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(a.assessed_on) || !Number.isFinite(Date.parse(a.assessed_on))) p.push(at + 'assessed_on invalid');
  });
  return p;
}
const DIR = fileURLToPath(new URL('./rule-packs-research/', import.meta.url));

let packCache = null;
export function loadResearchRulePacks() {
  if (!packCache) {
    try { packCache = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(DIR + f, 'utf8'))); }
    catch { packCache = []; }
  }
  return packCache;
}

// Returns { enabled, problems, rules, identity }. Any problem disables the profile and the intake refuses.
export function checkResearchProfile(p, packs = loadResearchRulePacks()) {
  const problems = [];
  if (!p || typeof p !== 'object' || Array.isArray(p)) problems.push('research_profile_not_an_object');
  else {
    for (const k of Object.keys(p)) if (!PROFILE_FIELDS.includes(k)) problems.push('research_profile_undeclared_field:' + k);
    if (p.profile_id !== RESEARCH_PROFILE_ID) problems.push('research_profile_id_mismatch');
    if (p.enabled !== true) problems.push('research_profile_not_enabled');
    if (typeof p.authorization_ref !== 'string' || !p.authorization_ref.trim()) problems.push('research_profile_authorization_ref_missing');
    problems.push(...checkRelevanceAssessments(p.relevance_assessments).map((x) => 'research_profile_' + x));
  }
  const v = validateRulePacks(packs, RESEARCH_RULES);
  if (!v.ok) problems.push(...v.problems.map((x) => 'research_rule_pack: ' + x));
  else for (const r of RESEARCH_RULES) if (!v.active.has(r)) problems.push('research_rule_pack: rule ' + r + ' not present');
  const ok = problems.length === 0;
  const assessments = ok && Array.isArray(p.relevance_assessments) ? p.relevance_assessments : [];
  return { enabled: ok, problems, rules: ok ? v.active : new Set(), assessments,
    identity: { profile_id: RESEARCH_PROFILE_ID, enabled: ok, authorization_ref: ok ? p.authorization_ref : null, prompt_version: RESEARCH_PROMPT_VERSION,
      human_relevance_assessments: { count: assessments.length, relevant: assessments.filter((a) => a.relevant).length, not_relevant: assessments.filter((a) => !a.relevant).length,
        assessors: [...new Set(assessments.map((a) => a.assessor_name.trim()))].sort() },
      research_rule_packs: ok ? v.identity : [], active_research_rules: ok ? [...v.active].sort() : [],
      limitation: 'Research profile: lexical rules for study decision records. Not adopted, not validated, and not a substitute for the engine of record.' } };
}

// ------------------------------------------------------------------ lexicons
const MON = '(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)';
const MONTH_INDEX = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const DMY = new RegExp('\\b(\\d{1,2})\\s+' + MON + '(?:,?\\s+(\\d{4}))?\\b', 'g');
const MDY = new RegExp('\\b' + MON + '\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b(?![:.]\\d)', 'g');
const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/g;

const DECISION_CUE = /\b(?:(?:was|were|been|is|are|has|have|had)\s+(?:\w+\s+){0,3}?approved|approved\s+(?:by|the|it|on|change|keeping|moving|a|an|its|CR-\d+)|(?:board|panel|manager|committee|sponsor|team|lead)\s+approved|approve|granted|awarded|denied|declined|refused|rejected|withheld|released|authori[sz]ed|affirmed|extended|moved|set to|raised to|rated|classified|closed|confirmed|agreed|decided|determined|concluded|concludes|recommend(?:s|ed|ation)?|held back|not awarded|disposed of|will be kept|kept until|retained|attributes|attributed|selected|denial|determination|finding|decisions? (?:were|was) made|is warranted|considered closed|is closed|rating:|decision to|the decision|award (?:went|was made) to)\b/i;
// RP-SRP-12: decision verb families. Each line is a grammatical family, not a phrase from any study record.
const DECISION_FAMILY = new RegExp([
  // change of state with a target: verb, up to four words, "to" ("raised the order to", "moved the review to")
  '\\b(?:raised|lowered|set|moved|changed|increased|reduced|reclassified|downgraded|upgraded|escalated|assigned|allocated|reallocated|transferred|shifted|reassigned)\\s+(?:(?!(?:to|by|because|after|since|as)\\b)[\\w-]+\\s+){0,4}?to\\b',
  // a named decision-maker endorsing or reversing
  '\\b(?:board|panel|committee|manager|managers|team|lead|sponsor|director|council|group|chair|owner|officer|we)\\s+(?:\\w+\\s+){0,2}?(?:supported|endorsed|backed|adopted|ratified|upheld|overturned|accepted|signed off)\\b',
  // passive endorsement or reversal
  '\\b(?:was|were|has been|have been|is|are)\\s+(?:endorsed|backed|adopted|ratified|upheld|overturned|accepted|signed off)\\b',
  // willingness or resolution followed by a decision verb
  '\\b(?:was|were|is|are)\\s+(?:happy|content|willing|prepared|pleased|minded)\\s+to\\s+(?:support|endorse|back|accept|adopt|approve|fund|proceed|go ahead|agree|allow|grant|extend|continue|release|award)\\b',
  '\\b(?:agreed|voted|resolved|chose|opted|elected|decided|undertook)\\s+(?:not\\s+)?to\\s+[a-z]+',
  '\\bvoted\\s+(?:for|against|in favou?r of)\\b',
  // stopping, pausing and reversing
  '\\b(?:deferred|postponed|cancell?ed|suspended|rescinded|revoked|withdrawn|terminated|waived|discontinued|paused|halted|reinstated|reopened)\\b',
  // go-ahead and sign-off
  '\\b(?:gave|granted|issued)\\s+(?:the\\s+|its\\s+|final\\s+)?(?:go-ahead|approval|permission|consent|sign-off)\\b|\\bgreen-?lit\\b|\\bsigned off\\b',
  '\\b(?:de)?prioriti[sz]ed\\b',
  // a decision named as a noun and then issued or made ("the award to X was issued on 22 April")
  '\\b(?:award|approval|decision|determination|refusal|rating|classification|extension|exception|allocation|selection|ruling)\\b[^.;]{0,60}?\\b(?:was|were|has been|had been)\\s+(?:issued|made|granted|recorded|given|confirmed|finalised|finalized|signed|communicated|notified)\\b',
].join('|'), 'i');
const isDecisionText = (t) => DECISION_CUE.test(t) || DECISION_FAMILY.test(t);
// Past-tense decision verbs, for "the item named next to the decision verb is the thing decided" (VF-04).
const DECISION_VERB = '(?:approved|granted|awarded|denied|declined|refused|rejected|withheld|released|authori[sz]ed|affirmed|extended|moved|rated|classified|closed|selected|attributed|retained|kept|raised|reallocated|allocated|assigned|deferred|postponed|cancell?ed|suspended|revoked|rescinded|endorsed|adopted|ratified|upheld|overturned|accepted|prioriti[sz]ed|renewed|reinstated|disposed of)';
const ID_FOLLOWED_BY_DECISION = new RegExp('^(?:\\s*(?:,|and|or)\\s*[A-Z][A-Z0-9]{0,5}-\\d{1,6})*\\s+(?:was|were|is|are|has been|have been|had been|will be)\\s+(?:\\w+\\s+){0,2}?' + DECISION_VERB + '\\b', 'i');
const ID_AFTER_DECISION_VERB = new RegExp('\\b' + DECISION_VERB + '\\s+(?:the\\s+|both\\s+)?(?:[\\w-]+\\s+){0,2}$', 'i');
const ATTRIBUTED_TO = /\b(?:attributed|attributes|ascribed|traced)\b[^.;()]*?\bto\b[^.;(),]*$/i;
const BASIS_CUE = /\b(?:because|based on|rests on|relies on|relying on|on the strength of|citing|cites|supported by|traceable to|as shown in|according to|in light of|due to|since|after (?:the|its)|following (?:the|its)|given that|as a result of|confirmed (?:each )?against)\b/i;
const AUTHORITY_REF = /\b(?:under|pursuant to|in accordance with|as permitted by|in line with|consistent with)\s+(?:the\s+|its\s+|their\s+)?(?:[\w'-]+\s+){0,5}?(?:policy|rule|section|clause|standard|procedure|methodology|matrix|regulation|agreement|terms of reference|paragraph|table|row|exemption|schedule|practice)\b|\b(?:Policy|Rule|Standard|Procedure|Methodology|Matrix|Section|Clause|Paragraph|Table|Row)\s+(?:[A-Z]{1,4}-?)?\d[\w.-]*|\b(?:policy|rule|section|clause|paragraph|table|row|terms of reference|agreement)\b[^.;]{0,60}\b(?:allows|permits|requires|defines|assigns|sets out|governs|covers|deals with|explains|bars)\b/i;
// A reference back to an authority named earlier ("under that section", "as the policy allows").
const AUTHORITY_ANAPHOR = /\b(?:under|pursuant to|in accordance with|as permitted by|in line with|consistent with|as set out in|as defined in)\s+(?:that|this|the same|the cited|the above|those|these|it)\b|\bas (?:the|that|this) (?:policy|rule|section|clause|standard|procedure|paragraph|table|row|schedule|exemption) (?:allows|permits|requires|defines|provides)\b/i;
const AUTHORITY_ID = /\b(?:policy|rule|standard|procedure|methodology|matrix|section|clause|paragraph|table|row|schedule|exemption)\s+(?:[A-Z]{1,4}-?)?\d+(?:\.\d+)*[a-z]?\b|\b[A-Z]{1,4}-\d+\b/gi;
const ADDED_CONCLUSION = /\b(?:also|further|additionally)\s+(?:concluded|concludes|states?|stated|found|finds|determined|adds|added|confirms?)\b|\b(?:adds|added) that\b|\b(?:is|are|was|were) (?:confident|satisfied)\b|\bwill not (?:need|require|recur)\b|\bconfident (?:that|in)\b/i;
const MULTI_MARKER = /\b(?:two|three|several)\s+(?:changes|requests|lots|incidents|controls|releases|proposals|work orders|orders|retention requests)\b|\bin two lots\b|\bseparate(?:ly)?\b|\bin part\b|\bpartial(?:ly)?\b|\beach (?:request|outcome|incident|control|release|order|lot|decision)\b/i;
const PARTIAL = /\b(?:in part|partial(?:ly)?|the remaining|of the \w+|two of|seven of|\d+ of \d+)\b/i;
const POSITIVE = /\b(?:approved|granted|awarded|released|authori[sz]ed|agreed|extended|accepted|confirmed|kept|retained|will be kept|produced|raised to priority 1|award went to)\b/i;
const NEGATIVE = /\b(?:declined|refused|denied|rejected|withheld|not awarded|held back|disposed of|not attributed|ineffective|no award was made|did not award)\b/i;
// The identifier of the thing decided (masked as evidence and as an event word).
const SUBJECT_REF = /\b(?:(?:change request|request|tender|work order|order|incident|alert|exception|application|proposal)\s+[A-Z][A-Z0-9]{0,5}-\d{1,6}(?:\s+and\s+[A-Z][A-Z0-9]{0,5}-\d{1,6})?|(?:release|lot|version|request)\s+\d+(?:\.\d+)?)\b/gi;
// In a decision sentence, an identifier before the basis cue is the decided item unless it is cited as a source.
const DOC_NOUN_BEFORE = /\b(?:report|minutes|item|sheet|paper|log|ticket|entry|register|extract|scan|run|survey|exhibit|receipt|contracts?|certificate|backup|file|ref(?:erence)?|note|letter|email|statement|invoice|record|photo(?:graph)?)\s+(?:no\.?\s*)?#?$/i;
const inParens = (text, i) => { let d = 0; for (let k = 0; k < i; k++) { if (text[k] === '(') d++; else if (text[k] === ')') d = Math.max(0, d - 1); } return d > 0; };
// EF-02: words that end in "s" but are not plural nouns are never the counted noun of a quantity.
const NOT_PLURAL = '(?!(?:was|is|has|does|this|its|his|hers|ours|yours|theirs|as|us|thus|plus|less|unless|across|always|perhaps|whereas|yes|bus|gas)\\b)';
const ANCHOR_PATTERNS = [
  ['identifier', /\b[A-Z][A-Z0-9]{0,5}-\d{1,6}\b/g], ['identifier', /#\d{2,}\b/g], ['identifier', /\bEx\.\s*[A-Z]\b/g],
  ['identifier', /\b(?:item|items|agenda item|entry|row|lot|case number|ref|section|sec\.|clause|paragraph|table|exhibit|version|release|rule)\s+#?\d+(?:\.\d+)*\b/gi],
  ['time', /\b\d{1,2}:\d{2}(?::\d{2})?\b/g],
  ['quantity', /\$\s?\d[\d,]*(?:\.\d+)?/g],
  ['quantity', /\b\d[\d,]*(?:\.\d+)?\s?(?:%|percent\b|hours?\b|days?\b|minutes?\b|litres?\b|liters?\b|tests?\b|bids?\b|contracts?\b|reports?\b|accounts?\b|records?\b|boxes\b|participants\b|sessions\b|backups?\b|restores?\b|tapes\b|points\b|terminations\b|clips\b|wires\b|weeks?\b|months?\b|years?\b|deliverables\b)/gi],
  // 0.3.4: physical measurements ("9 mm/s", "40 kg", "3.5 kWh").
  ['quantity', /\b\d+(?:\.\d+)?\s?(?:mm|cm|km|kg|mg|ml|kwh|kw|mw|hz|db|ppm|°c|°f)(?:\/(?:s|h|hr|min|day))?(?![\w])/gi],
  ['quantity', /\b\d[\d,]*\s+of\s+(?:the\s+)?\d[\d,]*\b/g], ['quantity', new RegExp('\\b\\d[\\d,]*\\s+(?:' + NOT_PLURAL + '[a-z-]+\\s+)?' + NOT_PLURAL + '[a-z-]+s\\b', 'g')], ['quantity', /\b\d{1,3}(?:,\d{3})+\b/g], ['quantity', /\b\d+-(?:day|hour|minute|year)\b/g],
  ['quantity', /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen|fifteen|twenty(?:-\w+)?)\s+(?:of|weekly|compliant|completed|archive|weekend|pay|deliverables|witnesses|coworkers|clips|milestones|wires|bids|contracts|points|days|weeks|hours|minutes)\b/gi],
  ['quarter', /\bQ[1-4]\b/g], ['year', /\b(?:in|until|by|from|to|since)\s+(?:19|20)\d{2}\b/g],
  ['on_file', /\b(?:on file|attached|enclosed)\b|\bfiled (?:as|under|in)\b|\bretained (?:for|on|in)\b/gi],
  ['stated_absence', /\b(?:found no|no (?:test )?(?:report|record|document|bid|response)s? (?:was|were) (?:submitted|found|located|received)|had not been (?:tested|completed|submitted|logged)|has not been (?:tested|completed|submitted)|does not refer to)\b/gi],
];
const EVIDENTIAL = /\b(?:located|found|measured|shows?|showed|carr(?:y|ies)|reported|scored|passed|recorded|lists|gives|cites|met|took|failed|exceeded|tested|received|logged|photographed|identified)\b/i;
// Authority citations extend over the identifier that follows the authority noun ("Policy CP-7, section 3").
const AUTHORITY_TAIL = /^\s*(?:[A-Z][A-Z0-9]{0,5}-\d+|\d+(?:\.\d+)*)(?:,?\s*(?:section|clause|paragraph|table|row)\s+\d+(?:\.\d+)*)?/;
// Event words for dated clauses. DECISION entries take precedence within a window.
const EVENT_TERMS = [
  ['D', 'approval', /\bapprov(?:e|ed|al)\b/i], ['D', 'award', /\baward(?:ed)?\b/i], ['D', 'authorization', /\bauthori[sz](?:ed|ation)\b/i],
  ['D', 'refusal', /\b(?:declined|refused|refusal|rejected|denied|denial|held back)\b/i], ['D', 'grant', /\bgranted\b/i],
  ['D', 'extension', /\bextend(?:ed)?\b|\bextension\b/i], ['D', 'move', /\bmoved\b/i], ['D', 'prioritisation', /\b(?:raised|set) to priority\b/i],
  ['D', 'rating', /\brated\b|\brating\b/i], ['D', 'classification', /\bclassified\b/i], ['D', 'agreement', /\bagreed\b/i],
  ['D', 'withholding', /\bwithheld\b/i], ['D', 'release', /\breleased\b|\brelease (?:letter|went|had)\b|\brelease had gone\b/i],
  ['E', 'appeal', /\breview request\b|\bappeal\b/i], ['E', 'rehearsal', /\brehears\w*/i], ['E', 'scoring', /\bscor(?:ed|ing)\b|\bscore sheet\b/i],
  ['E', 'survey', /\bsurvey\b/i], ['E', 'search', /\bsearch(?:ed)?\b/i], ['E', 'inspection', /\binspection\b/i], ['E', 'review', /\breview\b/i],
  ['E', 'meeting', /\bmeeting\b/i, 'container'], ['E', 'session', /\bsession\b/i, 'container'],
  ['E', 'submission', /\bsubmitted\b|\bsubmission\b/i], ['E', 'receipt', /\breceived\b|\breceipt\b/i], ['E', 'request', /\basked\b|\brequested\b/i],
  ['E', 'publication', /\b(?:was|were) published\b|\bpublished on\b/i], ['E', 'closing', /\bclosed\b/i], ['E', 'deadline', /\bdeadline\b/i], ['E', 'due', /\bdue\b/i],
  ['E', 'renewal', /\brenew(?:ed|al)\b/i], ['E', 'expiry', /\bexpir(?:ed|es|y)\b/i], ['E', 'rerun', /\bre-?run\b/i],
  ['E', 'outage', /\bwent down\b|\boutage\b|\bunavailable\b/i], ['E', 'restoration', /\brestor(?:ed|ation)\b/i], ['E', 'attendance', /\battend(?:ed|ance)\b/i],
  ['E', 'replacement', /\breplac(?:ed|ement)\b/i], ['E', 'update', /\bupdated\b/i], ['E', 'production', /\bproduced\b|\bproduction\b/i],
  ['E', 'acknowledgement', /\backnowledg(?:ed|ement)\b/i], ['E', 'start', /\bbegan\b|\bstarted\b/i], ['E', 'freeze', /\bfreeze\b/i],
  ['E', 'fieldwork', /\bfieldwork\b/i], ['E', 'report', /\breport(?:ed)?\b/i], ['E', 'test_run', /\b(?:regression )?run\b|\btest(?:s|ed)?\b/i, 'container'],
  ['E', 'scan', /\bscan\b/i], ['E', 'standstill', /\bstandstill\b/i], ['E', 'delivery', /\bdeliver(?:ed|y)\b/i], ['E', 'interview', /\binterview(?:ed)?\b/i],
  ['E', 'filing', /\bfiled\b|\bcomplaint\b/i], ['E', 'check_in', /\bcheck-ins?\b/i],
  ['E', 'repair', /\brepair(?:ed|s)?\b/i], ['E', 'installation', /\binstall(?:ed|ation)\b/i], ['E', 'payment', /\bpaid\b|\bpayment\b/i], ['E', 'signature', /\bsigned\b|\bsignature\b/i],
  ['E', 'hearing', /\bhearing\b/i], ['E', 'notice', /\bnotice\b/i], ['E', 'completion', /\bcompleted\b/i, 'container'], ['E', 'issue', /\bissued\b/i, 'container'],
  // 0.3.4 (RP-SRP-10, VF-05): process words that name a step of their own.
  ['E', 'consideration', /\bconsider(?:ed|ation)\b/i], ['E', 'triage', /\btriag(?:ed|e)\b/i], ['E', 'proposal', /\bpropos(?:ed|al)\b/i],
  ['E', 'assessment', /\bassess(?:ed|ment)\b/i], ['E', 'evaluation', /\bevaluat(?:ed|ion)\b/i], ['E', 'logging', /\blogged\b/i],
  ['E', 'escalation', /\bescalat(?:ed|ion)\b/i], ['E', 'notification', /\bnotifi(?:ed|cation)\b/i],
];
// RP-SRP-10: a comma inside a number ("6,000") no longer cuts the event window.
const SPLIT = /\b(?:and|citing|because|after|following|relies on|rests on|based on|supported by|including|so)\b|[;:(]|,(?!\d)/gi;
const SPLIT_033 = /\b(?:and|citing|because|after|following|relies on|rests on|based on|supported by|including|so)\b|[,;:(]/gi;
// RP-SRP-10: words that mark another instance of an event, and wording that marks a planned event.
const INSTANCE = /\b(next|previous|prior|following|subsequent|later|earlier|second|third|fourth|another|further|follow-up|upcoming|forthcoming|revised|rescheduled|new|original)\s+(?:[\w-]+\s+){0,2}$/i;
const PLANNED = /\b(?:will|shall|is due|are due|is scheduled|are scheduled|is planned|are planned|planned for|scheduled for|is set for|is expected|are expected|due on|due by|is on|are on|takes place on|is to be|are to be)\b/i;

// ------------------------------------------------------------------ dates and units
function validDay(y, m, d) { const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCMonth() === m - 1 && t.getUTCDate() === d; }
export function proseDates(text, base = 0) {
  const out = [];
  const push = (index, length, y, m, d, raw) => { if (!m || !validDay(y || 2024, m, d)) return; if (out.some((x) => index < x.index + x.length && x.index < index + length)) return;
    out.push({ index: base + index, length, raw, partial: !y, date: (y ? String(y) : '----') + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') }); };
  let m;
  ISO.lastIndex = 0; while ((m = ISO.exec(text)) !== null) push(m.index, m[0].length, +m[1], +m[2], +m[3], m[0]);
  DMY.lastIndex = 0; while ((m = DMY.exec(text)) !== null) push(m.index, m[0].length, m[3] ? +m[3] : null, MONTH_INDEX[m[2].slice(0, 3).toLowerCase()], +m[1], m[0]);
  MDY.lastIndex = 0; while ((m = MDY.exec(text)) !== null) push(m.index, m[0].length, m[3] ? +m[3] : null, MONTH_INDEX[m[1].slice(0, 3).toLowerCase()], +m[2], m[0]);
  return out.sort((a, b) => a.index - b.index);
}
const sameDay = (a, b) => a.slice(5) === b.slice(5) && (a.startsWith('----') || b.startsWith('----') || a.slice(0, 4) === b.slice(0, 4));

const SENTENCE_END = /(?<!\b(?:Ex|Exs|sec|Sec|No|Nos|Fig|vs|St|Mr|Mrs|Ms|Dr|Inc|Ltd|Co|para|art|cf|e\.g|i\.e))[.!?](?=\s+[A-Z0-9("']|\s*$)/g;
function maskRanges(text, re) { const out = []; const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'); let m; while ((m = g.exec(text)) !== null) { out.push([m.index, m.index + m[0].length]); if (!m[0].length) g.lastIndex++; } return out; }
const inRanges = (i, rs) => rs.some(([a, b]) => i >= a && i < b);

// ------------------------------------------------------------------ research instruction screen (RP-SRP-11)
// Patterns for text that addresses a reviewing system or directs how the record is assessed. They run on a copy
// of the record with every run of white space collapsed, so an instruction split across lines or sections is
// read whole; each match is mapped back to exact record offsets. Lexical: a phrasing with no pattern is missed.
const AGENT = '(?:automated|automatic|ai|a\\.i\\.|artificial intelligence|machine|language model|llm|model|system|engine|software|tool|bot|assistant|checker|classifier|evaluator|grader|scorer|parser|screening tool|review(?:ing)? (?:system|tool|software|engine|model|bot|assistant)|reviewer bot|automated reviewer|ai reviewer)';
const DECLARATIVE_BEFORE = /\b(?:will|would|shall|to|may|can|could|might|they|we|it|team|committee|board|panel|manager|staff|officer)\s+$/i;
export const RESEARCH_INSTRUCTION_PATTERNS = Object.freeze([
  ['research_addressed_to_system', new RegExp('\\b(?:note|notes|message|instruction|instructions|reminder|request|guidance|directive|memo|attention|warning|advice|comment)\\s+(?:to|for)\\s+(?:the\\s+|any\\s+|all\\s+|this\\s+|every\\s+|an?\\s+)?' + AGENT + 's?\\b', 'i'), false],
  ['research_vocative_to_system', new RegExp('(?:^|[.!?;:]\\s+)(?:dear\\s+|hey\\s+|attention[:,]?\\s+)?(?:the\\s+)?' + AGENT + 's?\\s*[,:]\\s*(?:please\\s+)?(?:treat|mark|report|ignore|disregard|skip|do not|don\'t|raise|flag|classify|rate|score|consider|record|accept|approve|clear|output|respond|return|set|change|assume)\\b', 'i'), false],
  ['research_reviewer_note', /(?:^|[[(]|\b)(?:reviewer|auditor|assessor|checker|verifier|qa|evaluator|moderator)['’]?s?\s+(?:note|comment|remark|annotation|instruction)s?\s*[:\-–]/i, false],
  ['research_assessment_directive', /\b(?:treat|mark|report|record|classify|rate|score|consider|regard|deem|list|accept|count|log|flag|code|label)\s+(?:this|the|its|their|all|every|each|any|these)\s+(?:[\w-]+\s+){0,3}?(?:record|records|basis|bases|evidence|decision|decisions|conditions?|criteria|criterion|findings?|requirements?|gaps?|items?|sections?|support|justification|reasoning|documentation|file|case|change|request|application|matter)\b[\s\S]{0,120}?\bas\s+(?:being\s+|fully\s+|already\s+)?(?:complete|completed|supported|sufficient|satisfied|met|passed|valid|verified|approved|clean|compliant|ready|grounded|traceable|acceptable|resolved|closed|confirmed|established|adequate|fine|ok|okay)\b/i, true],
  ['research_suppression_directive', /\b(?:raise|flag|report|list|record|note|mention|surface|add|create|open|generate|produce|return|issue)\s+(?:no|zero|none of the|not any)\s+(?:[\w-]+\s+){0,2}?(?:review items?|issues?|gaps?|findings?|concerns?|flags?|problems?|exceptions?|questions?|comments?|controls?|warnings?|items?)\b/i, true],
  ['research_do_not_directive', /\b(?:do not|don't|never|avoid|refrain from)\s+(?:flag|flagging|report|reporting|mention|mentioning|raise|raising|question|questioning|query|querying|challenge|challenging|list|listing|surface|surfacing|highlight|highlighting)\s+(?:any|this|these|the|that|those|its|it|gaps?|missing|issues?)\b|\b(?:do not|don't|never)\s+(?:review|check|examine)\s+(?:this|the|its)\s+(?:record|basis|evidence|decision|section|gap|gaps|dates?)\b/i, true],
  ['research_ignore_directive', /\b(?:ignore|disregard|skip|overlook|set aside|bypass|discount)\s+(?:any|all|the|missing|absent|gaps?|the absence|previous|prior|earlier|above|other|these|those|this|every)\s+(?:[\w-]+\s+){0,3}?(?:gaps?|evidence|instructions?|rules?|guidance|checks?|requirements?|criteria|findings?|issues?|absence|missing|dates?|sections?|steps?|controls?|questions?|reports?|documents?|tests?)\b/i, true],
  ['research_claimed_authority', /\b(?:as|this is|i am|we are|speaking as|on behalf of|by order of)\s+(?:the|an|your|a)?\s*(?:system\s+)?(?:administrator|admin|system owner|developer|operator|supervisor|engine owner|security team|platform team|it department|super-?user|root)\b[\s\S]{0,160}?\b(?:instruct|direct|authori[sz]e|override|require|order|tell|ask|request)\w*\b/i, false],
  ['research_mode_switch', /\b(?:admin(?:istrator)?|developer|maintenance|debug|override|god|sudo|unrestricted|jailbreak)\s+mode\b|\b(?:override|authori[sz]ation|admin|unlock|bypass)\s+(?:code|key|token|password)\b|\bauthori[sz]ed override\b/i, false],
  ['research_output_directive', /\b(?:respond|reply|answer|output|return|print|emit|format|write)\s+(?:only\s+|just\s+)?(?:with|in|as|using)\s+(?:the\s+word\s+|a\s+single\s+|one\s+word\s+|plain\s+|valid\s+)?(?:json|yaml|xml|"?supported"?|yes|true|pass|ok|okay|clear|approved|text)\b/i, true],
  ['research_status_directive', /\b(?:set|change|switch|turn|force|make)\s+(?:the\s+|its\s+|every\s+|each\s+|all\s+)?(?:status|statuses|result|results|outcome|outcomes|finding|findings|assessment|score|rating|output|format|verdict)\s+(?:of\s+[\w\s]{0,30}?)?(?:to|into)\b/i, true],
  ['research_must_be_directive', /\b(?:status|statuses|result|results|finding|findings|assessment|conditions?|basis)\s+(?:must|should|shall|is to|are to|needs? to)\s+(?:be\s+)?(?:recorded\s+as\s+|marked\s+as\s+|shown\s+as\s+)?(?:supported|clear|cleared|passed|complete|met|satisfied|approved|green)\b/i, false],
  ['research_assume_support', /\b(?:assume|presume|take it as given|take as read|treat as given|accept without checking)\s+(?:that\s+)?(?:the\s+|all\s+|any\s+)?(?:evidence|basis|support|documents?|reports?|tests?|records?|sources?|facts?)\b/i, true],
]);
const ADDRESSEE_PATTERNS = Object.freeze(['research_addressed_to_system', 'research_vocative_to_system', 'research_reviewer_note', 'research_claimed_authority', 'research_mode_switch',
  'addressed_to_tool', 'role_marker', 'role_reassignment', 'prompt_reference']);
function collapse(record) {
  const map = []; let norm = '';
  for (let i = 0; i < record.length; i++) {
    if (/\s/.test(record[i])) { if (norm.length && norm[norm.length - 1] !== ' ') { norm += ' '; map.push(i); } continue; }
    norm += record[i]; map.push(i);
  }
  return { norm, map };
}
export function detectResearchInstructionRisk(record) {
  if (typeof record !== 'string') return [];
  const { norm, map } = collapse(record);
  const spans = [];
  for (const [id, re, declarativeCheck] of RESEARCH_INSTRUCTION_PATTERNS) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'); let m;
    while ((m = g.exec(norm)) !== null) {
      if (!m[0].length) { g.lastIndex++; continue; }
      let s = m.index, e = m.index + m[0].length;
      while (s < e && /[\s.!?;:([]/.test(norm[s])) s++;
      if (declarativeCheck && DECLARATIVE_BEFORE.test(norm.slice(Math.max(0, s - 24), s))) continue;
      const start = map[s], end = map[e - 1] + 1;
      spans.push({ pattern_id: id, start, end, matched_text: record.slice(start, end) });
    }
  }
  return spans.sort((a, b) => a.start - b.start || a.end - b.end);
}
// Every instruction span for a research compile: the default 0.3.2 list plus the research screen. A span that
// addresses a reviewer or a system is extended over the note it opens: to its closing bracket when it opens one,
// otherwise to the end of its sentence, so the note's content (often a planted reference) is quarantined with it.
function extendAddressee(record, s) {
  if (!ADDRESSEE_PATTERNS.includes(s.pattern_id)) return s;
  const open = record.lastIndexOf('[', s.start) > record.lastIndexOf(']', s.start) ? '[' : record.lastIndexOf('(', s.start) > record.lastIndexOf(')', s.start) ? '(' : null;
  let end;
  if (open) { const close = record.indexOf(open === '[' ? ']' : ')', s.end); end = close >= 0 ? close + 1 : record.length; }
  else { const re = /[.!?](?=\s+[A-Z0-9("'[]|\s*$)|\n/g; re.lastIndex = s.end; const m = re.exec(record); end = m ? m.index + 1 : record.length; }
  const start = open ? record.lastIndexOf(open, s.start) : s.start;
  return Object.assign({}, s, { start, end: Math.max(end, s.end), matched_text: record.slice(start, Math.max(end, s.end)) });
}
export function researchInstructionSpans(record, rules = ALL_RULES) {
  const base = detectInstructionRisk(record).spans;
  if (!rules.has('RP-SRP-11')) return base;
  return [...base, ...detectResearchInstructionRisk(record)].map((s) => extendAddressee(record, s)).sort((a, b) => a.start - b.start || a.end - b.end);
}

// ------------------------------------------------------------------ sentence units (RP-SRP-01, RP-SRP-02, RP-SRP-09, RP-SRP-12)
const FINITE = /\b(?:is|are|was|were|be|been|being|has|have|had|will|would|shall|should|may|might|must|can|could|did|does|do|am)\b/i;
const HEADER_VERB = new RegExp('\\b' + DECISION_VERB + '\\b|\\b(?:approves|grants|refuses|declines|decides|agrees|concludes|finds|shows|measured|found|reported|recorded|received|submitted)\\b', 'i');
// A title: the first sentence of a record of several, at most 14 words, with no verb that states an action or a
// finding, and no reason word. Its dates, identifiers and decision nouns are metadata, not evidence.
const isHeaderText = (t) => t.split(/\s+/).filter(Boolean).length <= 14 && !FINITE.test(t) && !HEADER_VERB.test(t) && !BASIS_CUE.test(t);

export function sentenceUnits(record, rules = ALL_RULES) {
  const spans = researchInstructionSpans(record, rules);
  const raw = [];
  let offset = 0;
  for (const line of record.split('\n')) {
    let from = 0; SENTENCE_END.lastIndex = 0; let m;
    const cut = [];
    while ((m = SENTENCE_END.exec(line)) !== null) cut.push(m.index + 1);
    if (!cut.length || cut[cut.length - 1] < line.length) cut.push(line.length);
    for (const c of cut) {
      let s = from, e = c;
      while (s < e && /\s/.test(line[s])) s++;
      while (e > s && /\s/.test(line[e - 1])) e--;
      if (e > s) raw.push([offset + s, offset + e]);
      from = c;
    }
    offset += line.length + 1;
  }
  const header = rules.has('RP-SRP-09') && raw.length > 1 && isHeaderText(record.slice(raw[0][0], raw[0][1]));
  const units = raw.map(([s, e], i) => analyseUnit(record, s, e, i, { header: header && i === 0, spans: rules.has('RP-SRP-11') ? spans : [], families: rules.has('RP-SRP-12') }));
  annotateLinkage(record, units, rules);
  return units;
}

function clauseAround(text, i) {
  const re = /,\s+|\s+and\s+|;\s+/g; let from = 0, m;
  while ((m = re.exec(text)) !== null) { if (m.index >= i) return text.slice(from, m.index); from = m.index + m[0].length; }
  return text.slice(from);
}
function analyseUnit(record, start, end, index, ctx) {
  const text = record.slice(start, end);
  // RP-SRP-11: the parts of this sentence that sit inside an instruction span. A sentence that is mostly
  // instruction loses every role; anchors inside the span are never evidence.
  const hits = ctx.spans.filter((s) => s.start < end && start < s.end);
  const local = hits.map((s) => [Math.max(0, s.start - start), Math.min(text.length, s.end - start)]);
  let covered = 0; for (let i = 0; i < text.length; i++) if (inRanges(i, local) && /\S/.test(text[i])) covered++;
  const instruction = local.length > 0 && covered >= 0.6 * text.replace(/\s/g, '').length;
  const roleless = ctx.header || instruction;
  // Roles are read from the text outside the instruction spans, so a reason word or decision word inside an
  // instruction ("take it as given that ...") gives the sentence no role.
  const roleText = local.length ? [...text].map((ch, i) => (inRanges(i, local) ? ' ' : ch)).join('') : text;
  const subjects = maskRanges(text, SUBJECT_REF);
  const authorityHits = maskRanges(text, AUTHORITY_REF).map(([a, b]) => { const t = AUTHORITY_TAIL.exec(text.slice(b)); return [a, t ? b + t[0].length : b]; });
  const basisCue = roleless ? null : BASIS_CUE.exec(roleText);
  const decision = !roleless && (DECISION_CUE.test(roleText) || (ctx.families && DECISION_FAMILY.test(roleText)));
  const decisionBefore = (s) => DECISION_CUE.test(s) || (ctx.families && DECISION_FAMILY.test(s));
  const dates = proseDates(text);
  const anchors = [];
  for (const d of dates) anchors.push({ kind: 'date', start: d.index, end: d.index + d.length, text: d.raw });
  for (const [kind, re] of ANCHOR_PATTERNS) for (const [a, b] of maskRanges(text, re)) if (!anchors.some((x) => a < x.end && x.start < b)) anchors.push({ kind, start: a, end: b, text: text.slice(a, b) });
  anchors.sort((a, b) => a.start - b.start);
  // Attribution: exclude the identifier of the thing decided, the figures inside an authority citation (when the
  // unit is an authority statement), and the date attached to a decision verb before any basis cue.
  const cueAt = basisCue ? basisCue.index : Infinity;
  const isAuthorityUnit = !roleless && authorityHits.some(([a]) => !inRanges(a, local));
  for (const a of anchors) {
    a.excluded = null;
    if (ctx.header) a.excluded = 'header_metadata';
    else if (inRanges(a.start, local)) a.excluded = 'instruction_span';
    else if (instruction) a.excluded = 'instruction_span';
    else if (inRanges(a.start, subjects)) a.excluded = 'subject_reference';
    else if (isAuthorityUnit && a.start < cueAt && (inRanges(a.start, authorityHits) || /\b(?:allows|permits|requires|defines|assigns|sets out|governs|covers|bars|rates)\b/i.test(text))) a.excluded = 'authority_citation';
    else if (decision && a.kind === 'identifier' && a.start < cueAt && /^[A-Z][A-Z0-9]{0,5}-\d/.test(a.text) && !inParens(text, a.start) && !DOC_NOUN_BEFORE.test(text.slice(Math.max(0, a.start - 24), a.start)) && !EVIDENTIAL.test(clauseAround(text, a.start))) a.excluded = 'subject_identifier';
    // 0.3.4 (VF-04): an identifier that the decision verb acts on is the thing decided, even after a document noun
    // ("contracts FM-22 and FM-31 were withheld", "approved contracts FM-22").
    else if (ctx.families && decision && a.kind === 'identifier' && a.start < cueAt && /^[A-Z][A-Z0-9]{0,5}-\d/.test(a.text) && !inParens(text, a.start)
      && (ID_FOLLOWED_BY_DECISION.test(text.slice(a.end)) || ID_AFTER_DECISION_VERB.test(text.slice(Math.max(0, a.start - 48), a.start)))) a.excluded = 'subject_identifier';
    // 0.3.4: in an attribution ("attributed the outage to the expiry of certificate CERT-19") what follows "to" is
    // the conclusion's content, not its basis.
    else if (ctx.families && decision && a.start < cueAt && ATTRIBUTED_TO.test(text.slice(0, a.start))) a.excluded = 'decision_detail';
    else if (decision && a.start < cueAt && a.kind === 'date' && decisionBefore(text.slice(Math.max(0, a.start - 48), a.start))) a.excluded = 'decision_date';
    else if (decision && a.start < cueAt && a.kind !== 'identifier' && a.kind !== 'time' && a.kind !== 'stated_absence' && !EVIDENTIAL.test(clauseAround(text, a.start))) a.excluded = 'decision_detail';
  }
  const outcome = roleless ? null : NEGATIVE.test(roleText) && POSITIVE.test(roleText) ? 'mixed' : NEGATIVE.test(roleText) ? 'negative' : POSITIVE.test(roleText) ? 'positive' : null;
  const candidate = anchors.filter((a) => !a.excluded);
  return { index, start, end, text, header: !!ctx.header, instruction, decision, basis_cue: basisCue ? basisCue[0].toLowerCase() : null, authority_reference: isAuthorityUnit,
    added_conclusion: !roleless && ADDED_CONCLUSION.test(roleText), outcome, partial: PARTIAL.test(roleText),
    subject_refs: [...new Set(subjects.map(([a, b]) => text.slice(a, b).replace(/^(?:change request|request|tender|work order|order|incident|alert|exception|application|proposal)\s+/i, '').toUpperCase())
      .concat(anchors.filter((a) => a.excluded === 'subject_identifier').map((a) => a.text.toUpperCase())))],
    authority_ids: [...new Set((text.match(AUTHORITY_ID) || []).map((x) => x.toLowerCase().replace(/\s+/g, ' ')))],
    anchors, candidate_anchors: candidate, basis_anchors: candidate, weak_anchors: [], unlinked_anchors: [] };
}

// ------------------------------------------------------------------ decision-linked evidence (RP-SRP-09)
// basis_anchors: anchors the record itself links to a decision (stated links). weak_anchors: facts that state a
// measurement in the same unit as a condition of an authority a decision cites, or that report evidence about what a
// decision concerns (inferred links: they stop a "no evidence" flag but never support a condition).
// unlinked_anchors: everything else; reported, never counted.
const DECISION_NOUN = /\b(?:the|this|that|its|their|each|every|both)\s+(?:[\w-]+\s+){0,2}?(?:decision|decisions|outcome|outcomes|determination|finding|findings|conclusion|conclusions|approval|approvals|award|awards|refusal|rating|classification|extension|selection|choice|priority|denial|grant|release|withholding|agreement|allocation|reallocation|assignment|prioriti[sz]ation|endorsement|ruling|result|authori[sz]ation|permission|consent|sign-off|exception|retention|reclassification|deferral|cancellation|suspension|attribution|move|change)\b/i;
// A reason that names its source by reference to an earlier sentence ("on the strength of that survey").
const SOURCE_NOUN = '(?:survey|report|test|tests|review|inspection|scan|run|log|assessment|audit|analysis|reading|readings|measurement|measurements|search|sheet|minutes|register|extract|statement|check|evaluation|study|sample|data|figures|results?|findings?)';
const SOURCE_ANAPHOR = new RegExp('\\b(?:that|this|the same|those|these|the above|the earlier)\\s+(?:[\\w-]+\\s+){0,2}?' + SOURCE_NOUN + '\\b', 'i');
const BACK_REFERENCE = /^(?:this|that|it|these|those|the change|the move|the step|such a)\b/i;
// Named parties or items: two or more capitalised words in a row, or one capitalised word inside a sentence.
const NAME_STOP = new Set('The This That These Those It Its A An In On At By For From With And Or Of To As Under After Before Following Since Because January February March April May June July August September October November December Monday Tuesday Wednesday Thursday Friday Saturday Sunday Policy Rule Section Clause Table Row Paragraph Standard Procedure Matrix Schedule Exhibit Item Version Release Request Order Report Board Panel Committee Manager Team'.split(' '));
const namesOf = (t) => { const out = new Set(); const re = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b|(?<=[a-z,]\s)[A-Z][a-z]{4,}\b/g; let m;
  while ((m = re.exec(t)) !== null) { const w = m[0].split(/\s+/).filter((x) => !NAME_STOP.has(x)).join(' '); if (w.length >= 5) out.add(w.toLowerCase()); } return out; };
const INFERRED_LINKS = Object.freeze(['cited_authority_condition', 'related_to_decision']);
// The unit of a measurement or count: "93%" gives %, "75 minutes" gives minute, "212 completed sessions" gives session.
const dimsOf = (anchors) => new Set(anchors.filter((a) => a.kind === 'quantity').map((a) => { const m = /(%|percent|hours?|days?|minutes?|litres?|liters?|weeks?|months?|years?|points|mm(?:\/\w+)?|cm|km|kg|mg|ml|kwh|kw|mw|hz|db|ppm|°c|°f)\s*$/i.exec(a.text) || /-(day|hour|minute|year)$/i.exec(a.text) || /\b([a-z-]{4,})\s*$/i.exec(a.text);
  return m ? m[1].toLowerCase().replace(/^percent$/, '%').replace(/(?:ies)$/, 'y').replace(/s$/, '') : null; }).filter(Boolean));
// Anchor values that a fact can share with a decision sentence: dates by day, other anchors by their text.
const valueOf = (a) => (a.kind === 'date' ? 'date:' + ((proseDates(a.text)[0] || {}).date || a.text).slice(5) : a.kind + ':' + a.text.toLowerCase().replace(/\s+/g, ' '));
function annotateLinkage(record, units, rules) {
  if (!rules.has('RP-SRP-09')) { for (const u of units) { u.basis_anchors = u.candidate_anchors; u.weak_anchors = []; u.unlinked_anchors = []; for (const a of u.candidate_anchors) a.link = 'unconditional_0_3_3'; } return; }
  const decisions = units.filter((u) => u.decision);
  const subj = new Set(decisions.flatMap((u) => u.subject_refs));
  // A decision that names no subject concerns the record's only subject, when the record names exactly one.
  const recordSubjects = new Set(units.filter((u) => !u.header && !u.instruction).flatMap((u) => u.subject_refs));
  const impliedSubj = decisions.length && decisions.every((d) => !d.subject_refs.length) && recordSubjects.size === 1 ? new Set(recordSubjects) : new Set();
  const decisionIds = new Set(decisions.flatMap((u) => u.candidate_anchors.filter((a) => a.kind === 'identifier').map((a) => a.text.toUpperCase())));
  const link = (u, a, how) => { if (!a.link) a.link = how; };
  for (const u of units) for (const a of u.candidate_anchors) a.link = null;
  // Pass 1: evidence inside a decision sentence (its own date, subject and details are already excluded).
  for (const u of decisions) for (const a of u.candidate_anchors) link(u, a, 'decision_sentence');
  // Pass 2: a sentence that gives a reason and refers to a decision.
  for (const u of units) {
    if (u.decision || u.header || u.instruction || !u.basis_cue) continue;
    const prev = units[u.index - 1];
    const refers = DECISION_NOUN.test(u.text) || u.subject_refs.some((s) => subj.has(s)) || u.candidate_anchors.some((a) => a.kind === 'identifier' && decisionIds.has(a.text.toUpperCase()))
      || (BACK_REFERENCE.test(u.text) && prev && prev.decision);
    if (refers) for (const a of u.candidate_anchors) link(u, a, 'basis_statement');
  }
  // Pass 2b: a decision or reason sentence whose reason names an earlier source by reference ("on the strength of
  // that survey"): the nearest earlier sentence that names that kind of source is linked.
  for (const u of units) {
    if (u.header || u.instruction || !u.basis_cue || !(u.decision || DECISION_NOUN.test(u.text) || BACK_REFERENCE.test(u.text))) continue;
    const m = SOURCE_ANAPHOR.exec(u.text.slice(u.text.toLowerCase().indexOf(u.basis_cue)));
    if (!m) continue;
    const noun = new RegExp('\\b' + m[0].split(/\s+/).pop() + '\\b', 'i');
    for (let k = u.index - 1; k >= 0; k--) { const v = units[k]; if (v.header || v.instruction) continue; if (noun.test(v.text) && v.candidate_anchors.length) { for (const a of v.candidate_anchors) link(v, a, 'named_source'); break; } }
  }
  // Pass 3: a sentence that names the same source as linked evidence: the same identifier, or the same date for the
  // same event. Repeated until nothing changes; it can only extend links that the record already states.
  const eventKeyOf = (u, a) => { const ev = researchEvents(record, [u]).find((e) => e.date_start === u.start + a.start); return ev ? ev.key : null; };
  for (let changed = true, guard = 0; changed && guard < 8; guard++) {
    changed = false;
    const linked = units.flatMap((u) => u.candidate_anchors.filter((a) => a.link && !INFERRED_LINKS.includes(a.link)).map((a) => ({ u, a })));
    const ids = new Set(linked.filter(({ a }) => a.kind === 'identifier').map(({ a }) => a.text.toUpperCase()));
    const dated = linked.filter(({ a }) => a.kind === 'date').map(({ u, a }) => ({ date: proseDates(a.text)[0], key: eventKeyOf(u, a) })).filter((x) => x.date && x.key);
    for (const u of units) {
      if (u.header || u.instruction || !u.candidate_anchors.length || u.candidate_anchors.every((a) => a.link)) continue;
      const hit = u.candidate_anchors.some((a) => (a.kind === 'identifier' && ids.has(a.text.toUpperCase()))
        || (a.kind === 'date' && (() => { const d = proseDates(a.text)[0]; const k = eventKeyOf(u, a); return d && k && dated.some((x) => x.key === k && sameDay(x.date.date, d.date)); })()));
      if (hit) for (const a of u.candidate_anchors) if (!a.link) { a.link = 'shared_source'; changed = true; }
    }
  }
  // Inferred link: facts that state a measurement in the same unit as a condition of an authority a decision cites.
  // Shared words are not used: in development they linked an unrelated sentence ("office printer ... serviced") to
  // a tender for "printing services".
  const cited = new Set();
  for (const d of decisions) {
    if (d.authority_reference) cited.add(d.index);
    for (const a of units) if (a.authority_reference && a.index !== d.index && !a.header && !a.instruction) {
      if (a.authority_ids.some((x) => d.authority_ids.includes(x)) || (AUTHORITY_ANAPHOR.test(d.text) && a.index < d.index)) cited.add(a.index);
    }
  }
  const citedUnits = [...cited].map((i) => units[i]);
  for (const u of units) {
    if (u.decision || u.header || u.instruction || u.authority_reference || !u.candidate_anchors.length || u.candidate_anchors.every((a) => a.link)) continue;
    const dims = dimsOf(u.candidate_anchors);
    const meets = citedUnits.some((a) => { const ad = dimsOf(a.anchors); return [...dims].some((x) => ad.has(x)); });
    if (meets) for (const a of u.candidate_anchors) if (!a.link) a.link = 'cited_authority_condition';
  }
  // Inferred link: a sentence that reports evidence (a finding verb, a measurement or a document identifier) and
  // names what a decision concerns: the same subject identifier, the same named party or item, or a value (a date,
  // year, quantity or identifier) that the decision sentence itself states. It routes a record to review instead of
  // a "no evidence" flag; it never supports. Shared ordinary words are not used (see above).
  // "Reports evidence": a finding verb, or a measurement, count or time. A bare identifier is not enough.
  const reports = (u) => EVIDENTIAL.test(u.text) || u.candidate_anchors.some((a) => a.kind === 'quantity' || a.kind === 'time');
  const dNames = decisions.map((d) => namesOf(d.text));
  // The decision sentences' own values (their date, term and details included), except the subject identifier.
  const dValues = new Set(decisions.flatMap((d) => d.anchors.filter((a) => a.excluded !== 'subject_identifier' && a.excluded !== 'subject_reference' && a.kind !== 'stated_absence' && a.kind !== 'on_file').map(valueOf)));
  for (const u of units) {
    if (u.decision || u.header || u.instruction || !u.candidate_anchors.length || u.candidate_anchors.every((a) => a.link) || !reports(u)) continue;
    const names = namesOf(u.text);
    const related = u.subject_refs.some((x) => subj.has(x) || impliedSubj.has(x)) || dNames.some((n) => [...names].some((x) => n.has(x)))
      || u.candidate_anchors.some((a) => dValues.has(valueOf(a)));
    if (related) for (const a of u.candidate_anchors) if (!a.link) a.link = 'related_to_decision';
  }
  for (const u of units) {
    u.basis_anchors = u.candidate_anchors.filter((a) => a.link && !INFERRED_LINKS.includes(a.link));
    u.weak_anchors = u.candidate_anchors.filter((a) => INFERRED_LINKS.includes(a.link));
    u.unlinked_anchors = u.candidate_anchors.filter((a) => !a.link);
  }
  units.cited_authority_units = [...cited].sort((a, b) => a - b);
}

// ------------------------------------------------------------------ dated events with event keys (RP-SRP-03, RP-SRP-10)
function termsIn(text, masks = []) {
  const out = [];
  for (const [cls, key, re, container] of EVENT_TERMS) { const g = new RegExp(re.source, 'gi'); let m; while ((m = g.exec(text)) !== null) if (!inRanges(m.index, masks)) out.push({ cls, key, at: m.index, len: m[0].length, container: !!container }); }
  return out.sort((a, b) => a.at - b.at || b.len - a.len);
}
function pick(terms) {
  if (!terms.length) return null;
  const decision = terms.filter((t) => t.cls === 'D');
  if (decision.length) return decision[decision.length - 1].key;
  let last = terms[terms.length - 1];
  if (last.container) { const spec = terms.filter((t) => !t.container); last = spec.length ? spec[spec.length - 1] : terms[0]; }
  if (last.key === 'receipt' || last.key === 'submission') { const noun = terms.filter((t) => t.key === 'appeal'); if (noun.length) return 'appeal'; }
  return last.key;
}
export function eventKeyAt(clause, dateStart, dateEnd, prevEnd = 0, split = SPLIT) {
  return eventAt(clause, dateStart, dateEnd, prevEnd, split).key;
}
// Returns { key, instance, planned }: the event key, the word marking another instance of it, and whether the
// clause states the event as planned.
function eventAt(clause, dateStart, dateEnd, prevEnd = 0, split = SPLIT) {
  const masks = maskRanges(clause, SUBJECT_REF);
  const after = clause.slice(dateEnd, dateEnd + 32);
  const mod = /^\s+((?:[a-z-]+\s+){0,1}[a-z-]+)/.exec(after);
  const instanceBefore = (s) => { const m = INSTANCE.exec(s); return m ? m[1].toLowerCase() : null; };
  if (mod && /\b(?:the|its|their|this|that|a|an)\s+$/i.test(clause.slice(Math.max(prevEnd, dateStart - 8), dateStart))) { const t = termsIn(mod[1]); if (t.length) {
    const before = clause.slice(Math.max(prevEnd, dateStart - 40), dateStart) + ' ' + mod[1].slice(0, t[t.length - 1].at);
    return { key: t[t.length - 1].key, instance: instanceBefore(before.replace(/\b(?:the|its|their|this|that|a|an)\s+$/i, '')) || instanceBefore(mod[1].slice(0, t[t.length - 1].at)), planned: PLANNED.test(clause.slice(prevEnd, dateStart)) }; } }
  const pre = clause.slice(prevEnd, dateStart);
  let lastSplit = 0; const g = new RegExp(split.source, 'gi'); let m; while ((m = g.exec(pre)) !== null) lastSplit = m.index + m[0].length;
  const win = pre.slice(lastSplit);
  const masksWin = masks.map(([a, b]) => [a - prevEnd - lastSplit, b - prevEnd - lastSplit]);
  let terms = termsIn(win, masksWin);
  let k = pick(terms), base = win;
  const contentWords = win.replace(/\b(?:the|its|their|a|an|of|on|in|at|by|for|to|from|between|was|were|is|are|be|been|dated|held|made|given|carried|out|issued|completed|then|later|also|only|first)\b/gi, '').replace(/[^A-Za-z]/g, '');
  if (!k && !contentWords) { terms = termsIn(pre, masks.map(([a, b]) => [a - prevEnd, b - prevEnd])); k = pick(terms); base = pre; }
  let instance = null;
  if (k) { const hit = terms.filter((t) => t.key === k).pop(); if (hit) instance = instanceBefore(base.slice(Math.max(0, hit.at - 40), hit.at)); }
  return { key: k, instance, planned: PLANNED.test(pre) };
}
export function researchEvents(record, units, rules = ALL_RULES) {
  const events = [];
  const v10 = rules.has('RP-SRP-10');
  for (const u of units) {
    // Clauses: split the unit at "; " so each clause is read on its own.
    let cs = 0; const parts = [];
    for (const seg of u.text.split(/;\s+/)) { const s = u.text.indexOf(seg, cs); parts.push([s, s + seg.length]); cs = s + seg.length; }
    for (const [a, b] of parts) {
      const clause = u.text.slice(a, b);
      const ds = proseDates(clause);
      let prevEnd = 0;
      for (const d of ds) {
        const at = eventAt(clause, d.index, d.index + d.length, prevEnd, v10 ? SPLIT : SPLIT_033);
        const pre = clause.slice(prevEnd, d.index); let ls = 0; const sp = new RegExp((v10 ? SPLIT : SPLIT_033).source, 'gi'); let sm; while ((sm = sp.exec(pre)) !== null) ls = sm.index + sm[0].length;
        const ids = (pre.slice(ls).match(/\b[A-Z][A-Z0-9]{0,5}-\d{1,6}\b/g) || []);
        events.push({ key: at.key, instance: v10 ? at.instance : null, planned: v10 ? at.planned : false, ids, date: d.date, partial: d.partial, raw: d.raw, start: u.start + a, end: u.start + b,
          date_start: u.start + a + d.index, date_end: u.start + a + d.index + d.length, unit: u.index, header: !!u.header, instruction: !!u.instruction, text: clause });
        prevEnd = d.index + d.length;
      }
    }
  }
  return events;
}
const sameEvent = (x, y) => x.key && y.key && x.key === y.key && (x.instance || null) === (y.instance || null) && !!x.planned === !!y.planned
  && (!x.ids.length || !y.ids.length || x.ids.some((i) => y.ids.includes(i)));

// ------------------------------------------------------------------ record-level conflicts (RP-SRP-03, RP-SRP-05, RP-SRP-10)
// The object of an outcome verb, for decisions about an item with no identifier ("authorized deployment").
// Active voice only ("refused deployment"): after "was", "were" or "been" the word that follows is not the object.
const OUTCOME_OBJECT = /(?<!\b(?:was|were|been|be|is|are)\s+)\b(?:approved|granted|awarded|released|authori[sz]ed|extended|accepted|confirmed|kept|retained|declined|refused|denied|rejected|withheld|disposed of)\s+((?:the\s+)?[a-z][\w-]*(?:\s+(?:of|for)\s+[\w.-]+)?)/i;
const NOT_OBJECT = /^(?:because|on|at|by|for|in|under|after|with|to|that|it|them|this|these|and|as|from|since|following|without|unless|until|per|its|their|his|her|a|an)$/i;
const objectOf = (t) => { const m = OUTCOME_OBJECT.exec(t); if (!m) return null; const o = m[1].toLowerCase().replace(/^the\s+/, ''); return NOT_OBJECT.test(o.split(/\s+/)[0]) ? null : o; };
export function detectResearchConflicts(record, units, events, rules) {
  const out = [];
  if (rules.has('RP-SRP-03')) {
    for (let i = 0; i < events.length && !out.some((k) => k.kind === 'same_event_date_conflict'); i++) for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (a.instruction || b.instruction) continue;
      if (sameEvent(a, b) && !sameDay(a.date, b.date)) {
        out.push({ kind: 'same_event_date_conflict', spans: [{ start: a.date_start, end: a.date_end }, { start: b.date_start, end: b.date_end }], affects: ['chronology_integrity', 'reconstructability'],
          summary: 'Two record spans give the event "' + a.key + '" different dates (' + a.raw + ', ' + b.raw + ').' });
        break;
      }
    }
  }
  if (rules.has('RP-SRP-05')) {
    const ds = units.filter((u) => u.decision && (u.outcome === 'positive' || u.outcome === 'negative') && !u.partial);
    outer: for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
      const a = ds[i], b = ds[j];
      if (a.outcome === b.outcome) continue;
      const shared = a.subject_refs.length && b.subject_refs.length ? a.subject_refs.find((s) => b.subject_refs.includes(s)) : null;
      // RP-SRP-10 (VF-05): with no identifier on either side, the same verb object is the same item.
      const obj = !shared && rules.has('RP-SRP-10') && !a.subject_refs.length && !b.subject_refs.length && objectOf(a.text) && objectOf(a.text) === objectOf(b.text) ? objectOf(a.text) : null;
      if (shared || obj) {
        out.push({ kind: 'decision_outcome_conflict', spans: [{ start: a.start, end: a.end }, { start: b.start, end: b.end }], affects: ['reconstructability', 'reasoning_traceability'],
          summary: 'The record states opposite outcomes for ' + (shared || '"' + obj + '"') + '.' });
        break outer;
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------ cited-evidence conflicts, research variant of K6 (RP-SRP-03, RP-SRP-04)
const unitAt = (units, s, t) => units.find((u) => u.start <= s && t <= u.end) || units.find((u) => u.start < t && s < u.end) || null;
function eventOf(e, events) {
  const m = /^span:(\d+)-(\d+)$/.exec(e.span_id || ''); if (!m) return null;
  const s = Number(m[1]), t = Number(m[2]);
  // D18: the event compared is the event of the first date inside the quotation, the same date the value test reads.
  const hits = events.filter((ev) => ev.date_start >= s && ev.date_end <= t).sort((a, b) => a.date_start - b.date_start);
  return hits.length ? hits[0] : null;
}
export function detectResearchEvidenceConflicts(evidence, record, units, events, rules) {
  const out = [];
  const byKey = new Map();
  for (const e of evidence) {
    if (!['stated_date', 'stated_expiry', 'stated_decision'].includes(e.assertion_type)) continue;
    const k = e.condition_id + '|' + e.assertion_type;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(e);
  }
  const spanOf = (e) => { const m = /^span:(\d+)-(\d+)$/.exec(e.span_id || ''); return m ? [Number(m[1]), Number(m[2])] : [0, 0]; };
  const multi = MULTI_MARKER.test(record);
  for (const [k, list] of byKey) {
    if (list.length < 2) continue;
    const type = k.split('|')[1];
    const value = (e) => type === 'stated_decision'
      ? (NEGATIVE.test(e.quote) && POSITIVE.test(e.quote) ? 'mixed' : NEGATIVE.test(e.quote) ? 'negative' : POSITIVE.test(e.quote) ? 'positive' : null)
      : ((proseDates(e.quote)[0] || {}).date || null);
    const vals = list.filter((e) => value(e) && value(e) !== 'mixed');
    for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) {
      const a = vals[i], b = vals[j];
      const differs = type === 'stated_decision' ? value(a) !== value(b) : !sameDay(value(a), value(b));
      if (!differs) continue;
      if (type === 'stated_decision' && rules.has('RP-SRP-04')) {
        const ua = unitAt(units, ...spanOf(a)), ub = unitAt(units, ...spanOf(b));
        const sa = ua ? ua.subject_refs : [], sb = ub ? ub.subject_refs : [];
        if (sa.length && sb.length && !sa.some((x) => sb.includes(x))) continue;
        if (multi && ua && ub && ua !== ub && (!sa.length || !sb.length)) continue;
        if (ua && ua === ub && ua.partial) continue;
      }
      if (type !== 'stated_decision' && rules.has('RP-SRP-03')) {
        const ea = eventOf(a, events), eb = eventOf(b, events);
        if (ea && eb && ea.key && eb.key && !sameEvent(ea, eb)) continue;
      }
      out.push({ kind: 'cited_evidence_conflict', evidence: [a, b], affects: [k.split('|')[0]], summary: 'Two quotations cited for the same ' + type + ' state incompatible values.' });
      return out;
    }
  }
  return out;
}

// ------------------------------------------------------------------ RP-SRP-14: human relevance assessments of stated links
// Marks every stated (strong) anchor with its relevance: human_assessed_relevant, human_assessed_irrelevant or
// unassessed. A sentence a person assessed as not relevant loses its links: its anchors are reported as unlinked
// (link human_assessed_irrelevant) and no longer count. Assessments of sentences not in the record change nothing.
export function applyRelevanceAssessments(units, assessments, rules) {
  if (!rules.has('RP-SRP-14')) return;
  const by = new Map((assessments || []).map((a) => [a.statement_sha256, a]));
  for (const u of units) {
    const a = u.header || u.instruction ? null : by.get(createHash('sha256').update(u.text).digest('hex')) || null;
    u.relevance_assessment = a ? { relevant: a.relevant, assessor_name: a.assessor_name.trim(), assessed_on: a.assessed_on } : null;
    for (const x of u.basis_anchors) x.relevance = a ? (a.relevant ? 'human_assessed_relevant' : 'human_assessed_irrelevant') : 'unassessed';
    if (a && !a.relevant) {
      for (const x of [...u.basis_anchors, ...(u.weak_anchors || [])]) { x.link = 'human_assessed_irrelevant'; u.unlinked_anchors.push(x); }
      u.basis_anchors = []; u.weak_anchors = [];
    }
  }
}

// ------------------------------------------------------------------ condition rules for study records
// Same contract as conditions.mjs: requirement_visible, visible_gaps, review_reasons, anchor (a section), explanation.
// 0.3.4 adds gap_spans: for each visible gap or flagged review reason, the record passages it concerns (exact
// offsets), used by the controls. Rules can only keep or lower a candidate's proposed status; the compiler enforces it.
const NEGATED = /\b(?:not|no|never|without)\s+(?:[A-Za-z]+\s+){0,2}?(?:need|needs|needed|require|requires|required|because|based on)\b/i;
const VACUOUS = /\b(?:met the standard|judged (?:acceptable|suitable|the most suitable)|was considered necessary|considered necessary|appropriate outcome|the way forward|the panel's decision|decision to (?:select|withhold|release)|has been rated|because it operates|it earns that rating|was judged|were judged|it was the reason|the reason for the outcome|fit to be released|its fitness|its suitability|better place(?:d)?|chose to|decided to withhold|it was a priority|pressing nature|the extension it agreed|are to be retained|not suitable for release)\b/i;
export function evaluateResearchConditions(record, sections, units, events, verifiedByCondition, rules) {
  const ev = (c) => verifiedByCondition[c] || [];
  const has = (c, types) => ev(c).some((e) => types.includes(e.assertion_type));
  const section = (u) => (u ? sections.find((s) => u.start >= s.start && u.start < s.end) || null : null);
  const v09 = rules.has('RP-SRP-09');
  const decisions = units.filter((u) => u.decision);
  const span = (u) => ({ start: u.start, end: u.end });
  const aspan = (u, a) => ({ start: u.start + a.start, end: u.start + a.end });
  const strong = units.flatMap((u) => u.basis_anchors.map((a) => Object.assign({ unit: u.index }, a)));
  const weak = units.flatMap((u) => (u.weak_anchors || []).map((a) => Object.assign({ unit: u.index }, a)));
  const unlinked = units.flatMap((u) => (u.unlinked_anchors || []).map((a) => ({ unit: u, a })));
  const hasOwn = (u) => u.basis_anchors.length > 0 || (u.weak_anchors || []).length > 0;
  // RP-SRP-12: a decision the rules did not find but the candidate quoted (verified) lowers "no conclusion" to review.
  // Only a quotation from the body counts: a title line or an instruction quoted as "the decision" does not.
  const bodyQuote = (e) => { const m = /^span:(\d+)-(\d+)$/.exec(e.span_id || ''); if (!m) return false; const u = unitAt(units, Number(m[1]), Number(m[2])); return !!u && !u.header && !u.instruction; };
  const candidateDecision = rules.has('RP-SRP-12') && !decisions.length && Object.values(verifiedByCondition).flat().some((e) => e.assertion_type === 'stated_decision' && bodyQuote(e));
  const citedAuthorityIdx = new Set(units.cited_authority_units || []);
  // RP-SRP-09: only an authority a located decision cites counts; with no decision located, linkage cannot be read.
  const authorityUnits = v09 ? units.filter((u) => u.authority_reference && citedAuthorityIdx.has(u.index)) : units.filter((u) => u.authority_reference);
  const added = units.filter((u) => u.added_conclusion && !hasOwn(u));
  // Several decision units about different subjects: each needs evidence of its own (RP-SRP-08 with RP-SRP-04).
  const groups = [];
  for (const u of decisions.filter((x) => x.subject_refs.length)) { const g = groups.find((x) => x.subjects.some((s) => u.subject_refs.includes(s))); if (g) { g.units.push(u); g.subjects.push(...u.subject_refs); } else groups.push({ units: [u], subjects: [...u.subject_refs] }); }
  const multi = groups.length >= 2;
  const unsupportedDecisions = multi ? groups.filter((g) => !g.units.some(hasOwn)
    && !units.some((v) => !v.decision && hasOwn(v) && v.subject_refs.some((s) => g.subjects.includes(s)))).flatMap((g) => g.units) : [];
  const rationaleUnits = units.filter((u) => u.basis_cue);
  // A listed restatement phrase is a restated reason unless stated-link evidence exists. A decision sentence that
  // gives a reason counts as one only when no evidence is linked to it at all, stated or inferred.
  const restatingUnits = rationaleUnits.filter((u) => VACUOUS.test(u.text) || (u.decision && !weak.length));
  const restated = rules.has('RP-SRP-07') && !strong.length && restatingUnits.length > 0;
  const noReason = rules.has('RP-SRP-07') && decisions.length > 0 && !rationaleUnits.length && !strong.length && !weak.length;
  const authorityOnly = rules.has('RP-SRP-06') && authorityUnits.length > 0 && !strong.length && !weak.length;
  const unsupportedConclusion = rules.has('RP-SRP-08') && (added.length > 0 || unsupportedDecisions.length > 0);
  // With a decision located, no linked evidence is a gap. With none located, linkage cannot be read: a gap only if
  // the record holds no anchor at all.
  const noEvidence = !strong.length && !weak.length && (decisions.length > 0 || !unlinked.length || !v09);
  const spanOf = (e) => { const m = /^span:(\d+)-(\d+)$/.exec(e.span_id || ''); return m ? [Number(m[1]), Number(m[2])] : [-1, -1]; };
  // RP-SRP-14: only a stated link a person assessed as relevant can support; otherwise relevance is unresolved.
  const v14 = rules.has('RP-SRP-14');
  const supports = (a) => !v14 || a.relevance === 'human_assessed_relevant';
  const strongSupport = strong.filter(supports);
  const relevanceUnresolved = v14 && strong.length > 0 && strongSupport.length === 0;
  const RELEVANCE_NOTE = ' The record states that the decision rests on identified material; no person has assessed whether that material concerns the decision, so the stated link is not counted as support.';
  const anchorText = (e) => { const [s, t] = spanOf(e); return units.some((u) => u.start < t && s < u.end && u.basis_anchors.some((a) => supports(a) && s <= u.start + a.start && u.start + a.end <= t)); };
  const unlinkedNote = unlinked.length ? ' ' + unlinked.length + ' dated, numbered or identified item(s) appear in the record but are not linked to a decision by its wording; they were not counted.' : '';
  const weakNote = weak.length && !strong.length ? ' Facts that share terms or a measurement with a cited authority appear, but the record does not state that the decision rests on them.' : '';
  const out = {};
  const firstDecisionSection = section(decisions[0]) || sections[0] || null;
  const gapSpans = {
    no_identifiable_basis_evidence: [...decisions.map(span), ...unlinked.map(({ unit, a }) => aspan(unit, a))],
    conclusion_without_identifiable_basis: [...unsupportedDecisions, ...added].map(span),
    conclusion_restated_as_basis: restatingUnits.map(span),
    conclusion_without_stated_basis: decisions.map(span),
    authority_reference_without_linked_facts: authorityUnits.map(span),
    no_locatable_conclusion: [], no_explicit_dates: [],
  };
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: firstDecisionSection, gap_spans: gapSpans };
    if (!decisions.length) { if (candidateDecision) r.review_reasons.push('decision_located_by_candidate_only'); else r.visible_gaps.push('no_locatable_conclusion'); }
    else if (!strong.length) r.review_reasons.push(weak.length ? 'basis_link_inferred_not_stated' : 'conclusion_without_identifiable_basis');
    if (unsupportedConclusion) r.visible_gaps.push('conclusion_without_identifiable_basis');
    if (decisions.length && relevanceUnresolved) r.review_reasons.unshift('stated_link_relevance_unresolved');
    r.requirement_visible = !!decisions.length && !!strongSupport.length && !unsupportedConclusion && has('reconstructability', ['stated_decision']) && ev('reconstructability').length >= 2;
    if (decisions.length && !r.requirement_visible && !r.review_reasons.length && !r.visible_gaps.length) r.review_reasons.push('decision_and_linked_content_not_both_cited');
    r.explanation = (!decisions.length ? (candidateDecision ? 'The rules found no sentence stating a decision; the candidate quoted one, so what is to be reconstructed is routed to review.'
      : 'No sentence states a decision or conclusion, so what is to be reconstructed cannot be located.')
      : !strong.length ? 'A decision is stated, but no identifiable evidence (a dated, numbered, identified or on-file source) is linked to it by the record\'s wording.'
        : unsupportedConclusion ? 'At least one conclusion in the record has no identifiable evidence of its own.'
          : 'A decision and evidence linked to it are both visible in the record.') + unlinkedNote + weakNote + (decisions.length && relevanceUnresolved ? RELEVANCE_NOTE : '');
    out.reconstructability = r;
  }
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: firstDecisionSection, gap_spans: gapSpans };
    if (noEvidence) r.visible_gaps.push('no_identifiable_basis_evidence');
    else if (!strong.length && !weak.length) r.review_reasons.push('evidence_linkage_not_assessed_no_decision');
    else if (!strong.length) r.review_reasons.push('basis_link_inferred_not_stated');
    if (unsupportedConclusion) r.visible_gaps.push('conclusion_without_identifiable_basis');
    if (authorityOnly) r.review_reasons.push('authority_reference_without_linked_facts');
    const cited = ev('identifiable_basis').filter((e) => ['stated_authority', 'stated_rationale', 'stated_source_reference'].includes(e.assertion_type));
    if (relevanceUnresolved && !r.visible_gaps.length) r.review_reasons.unshift('stated_link_relevance_unresolved');
    r.requirement_visible = !!strongSupport.length && !unsupportedConclusion && cited.some(anchorText);
    if (!r.requirement_visible && !r.visible_gaps.length) r.review_reasons.push('no_cited_basis_with_evidence_anchor');
    r.explanation = (authorityOnly ? 'The record cites an authority but states no facts showing how its conditions were met.'
      : noEvidence ? 'No identifiable evidence linked to the conclusion appears in the record.'
        : !strong.length && !weak.length ? 'No decision was located by the rules, so whether the identifiable items are linked to it was not assessed.'
          : unsupportedConclusion ? 'At least one conclusion has no identifiable evidence of its own.'
            : !strong.length ? 'Evidence is visible, but its link to the decision is inferred, not stated.'
              : 'Identifiable evidence linked to the decision is visible in the record.') + unlinkedNote + (relevanceUnresolved ? RELEVANCE_NOTE : '');
    out.identifiable_basis = r;
  }
  {
    const v10 = rules.has('RP-SRP-10');
    const bodyEvents = v10 ? events.filter((e) => !e.header && !e.instruction) : events;
    const path = new Set(units.filter((u) => u.decision || hasOwn(u)).map((u) => u.index));
    const pathEvents = v10 ? bodyEvents.filter((e) => path.has(e.unit)) : events;
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: section(units.find((u) => !u.header && proseDates(u.text).length)) || firstDecisionSection, gap_spans: gapSpans, path_events: pathEvents };
    if (!bodyEvents.length) r.visible_gaps.push('no_explicit_dates');
    r.requirement_visible = pathEvents.length >= 2 && has('chronology_integrity', ['stated_date']);
    if (!r.requirement_visible && !r.visible_gaps.length) r.review_reasons.push(bodyEvents.length >= 2 && pathEvents.length < 2 ? 'dated_sequence_not_linked_to_decision' : 'dated_sequence_not_cited');
    r.explanation = !bodyEvents.length ? 'No explicitly dated event appears in the body of the record; the sequence cannot be built.' + (events.length ? ' A date in the title is read as metadata.' : '')
      : bodyEvents.length + ' dated event mention(s) appear in the record, ' + pathEvents.length + ' on the decision path. Expiry checks are not applied to this record type. Year-less dates are compared by day and month only.';
    out.chronology_integrity = r;
  }
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: section(rationaleUnits[0]) || firstDecisionSection, gap_spans: gapSpans };
    const negated = (e) => e.assertion_type === 'stated_rationale' && NEGATED.test(e.quote);
    const rationaleCited = ev('reasoning_traceability').some((e) => ['stated_rationale', 'stated_source_reference'].includes(e.assertion_type) && !negated(e) && anchorText(e));
    if (restated) r.visible_gaps.push('conclusion_restated_as_basis');
    else if (noReason) r.visible_gaps.push('conclusion_without_stated_basis');
    if (unsupportedConclusion) r.visible_gaps.push('conclusion_without_identifiable_basis');
    if (!decisions.length && !candidateDecision) r.review_reasons.push('basis_without_conclusion');
    if (!strong.length && weak.length) r.review_reasons.push('basis_link_inferred_not_stated');
    if (ev('reasoning_traceability').some(negated) && !rationaleCited) r.review_reasons.push('negated_rationale_not_counted');
    if (relevanceUnresolved && !r.visible_gaps.length) r.review_reasons.unshift('stated_link_relevance_unresolved');
    r.requirement_visible = !!decisions.length && !!strongSupport.length && !restated && !unsupportedConclusion && rationaleCited;
    if (!r.requirement_visible && !r.review_reasons.length && !r.visible_gaps.length) r.review_reasons.push('rationale_path_not_cited');
    r.explanation = restated ? 'The stated reason repeats the conclusion instead of giving a separate basis.'
      : noReason ? 'A decision is stated without a stated reason or linked evidence.'
        : 'Reasoning is traced only where the record states a reason linked to identifiable evidence. An outcome alone is not treated as reasoning.' + (relevanceUnresolved ? RELEVANCE_NOTE : '');
    out.reasoning_traceability = r;
  }
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: ['sufficiency_not_determinable_by_engine'], anchor: firstDecisionSection, gap_spans: gapSpans };
    if (noEvidence) r.visible_gaps.push('no_identifiable_basis_evidence');
    if (unsupportedConclusion) r.visible_gaps.push('conclusion_without_identifiable_basis');
    r.explanation = (r.visible_gaps.length ? 'One or more elements needed for later reconstruction are not visible in the record.'
      : 'The checked elements are visible. Whether the support was substantively sufficient is not determined.') + ' Expiry and compensating-control checks are not applied to this record type.';
    out.sufficiency = r;
  }
  return out;
}

// Research linkage (replaces RP-EVL-01, whose section roles do not exist in prose records). 0.3.4: only stated
// links count for identifiable basis and reasoning, and only dated events on the decision path for chronology.
export function researchLinked(condition, verified, units, events, rules = ALL_RULES) {
  const overlaps = (e, f) => units.some((u) => e.start < u.end && u.start < e.end && f(u));
  const list = verified.map((v) => { const m = /^span:(\d+)-(\d+)$/.exec(v.span_id || ''); return m ? Object.assign({ start: Number(m[1]), end: Number(m[2]) }, v) : null; }).filter(Boolean);
  if (condition === 'identifiable_basis' || condition === 'reasoning_traceability') return list.some((e) => overlaps(e, (u) => u.basis_anchors.length > 0));
  if (condition === 'chronology_integrity') {
    const path = new Set(units.filter((u) => u.decision || u.basis_anchors.length || (u.weak_anchors || []).length).map((u) => u.index));
    const pool = rules.has('RP-SRP-10') ? events.filter((x) => !x.header && !x.instruction && path.has(x.unit)) : events;
    return list.some((e) => pool.some((x) => e.start <= x.date_start && x.date_end <= e.end));
  }
  if (condition === 'reconstructability') return list.some((e) => e.assertion_type === 'stated_decision' && overlaps(e, (u) => u.decision));
  return true;
}

// ------------------------------------------------------------------ assertion markers for study records
const PROSE_DATE_MARKER = new RegExp('\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b\\d{1,2}\\s+' + MON + '\\b|\\b' + MON + '\\s+\\d{1,2}\\b|\\bQ[1-4]\\b');
const STATED_DECISION_033 = /\b(?:decision|granted|approved|denied|rejected|declined|awarded|withheld|released|authori[sz]ed|affirmed|extended|moved|rated|classified|closed|confirmed|agreed|decided|concluded|determined|refused|held back|set to|raised to|kept|retained|attributes|attributed|selected|finding|determination)\b/i;
export const RESEARCH_MARKERS = Object.freeze(Object.assign({}, ASSERTION_MARKERS, {
  // 0.3.4: the decision families of RP-SRP-12 are decision markers too, and "concludes" is one (EF-04).
  stated_decision: new RegExp(STATED_DECISION_033.source + '|\\bconcludes\\b|' + DECISION_FAMILY.source, 'i'),
  stated_date: PROSE_DATE_MARKER,
  stated_rationale: /\b(?:because|based on|basis|found that|needs?|in order to|to reconcile|rationale|justification|requires?|rests on|relies on|on the strength of|citing|since|after the|after its|shows|measured|supported by)\b/i,
  stated_source_reference: /\b[A-Z][A-Z0-9]{0,5}-\d{1,6}\b|#\d{2,}\b|\bEx\.\s*[A-Z]\b|\b(?:item|agenda item|entry|row|lot|section|clause|paragraph|table|exhibit|rule)\s+#?\d+|\b\d{1,2}:\d{2}(?::\d{2})?\b|\bminutes\b|§\s*\d/i,
}));

// ------------------------------------------------------------------ Cognitive Control templates for study records
// Same shape as DEFECT_TEMPLATES. Supplier-access wording ("exception") is replaced for study records; every
// template must pass the unchanged 0.2 neutrality check (tested).
export const RESEARCH_DEFECT_TEMPLATES = Object.freeze(Object.assign({}, DEFECT_TEMPLATES, {
  no_locatable_conclusion: ['reconstructability', 'No sentence states the decision or conclusion.',
    'A later reviewer cannot identify what is being reconstructed.', 'Which passage records the decision or conclusion?', 'Add a decision statement to the record template.'],
  no_explicit_dates: ['chronology_integrity', 'No explicitly dated event appears in the body of the record.',
    'The sequence of events that led to the decision cannot be reconstructed.', 'What dates establish the sequence of events that led to the decision?', 'Ask for a date for each step the record describes.'],
  conclusion_without_traceable_basis: DEFECT_TEMPLATES.conclusion_without_traceable_basis,
  // 0.3.4: the rule now reads links, so the wording names the missing link rather than the missing material.
  no_identifiable_basis_evidence: ['identifiable_basis', 'No passage of the record links identifiable evidence (a dated, numbered, identified or on-file source) to the decision.',
    'A later reviewer would have to infer what the decision rests on.', 'Which passage does the decision rest on, and where does the record say so?', 'Ask for each decision to name the evidence it rests on.'],
  authority_reference_without_linked_facts: ['identifiable_basis', 'The record cites an authority but states no facts showing how its conditions were met.',
    'A citation of a rule does not show which facts satisfied it.', 'Which facts in the record meet the conditions of the cited authority?', 'Pair each cited authority with the facts that meet its conditions.'],
  conclusion_restated_as_basis: ['reasoning_traceability', 'The stated reason repeats the conclusion instead of giving a separate basis.',
    'A reason that restates the outcome does not show how the outcome was reached.', 'What separate fact or source does the record give for this conclusion?', 'Ask for each reason to name a fact or source other than the outcome itself.'],
  // 0.3.4: an authority reference alone is not a reason (RP-SRP-06), so the wording no longer says "or source".
  conclusion_without_stated_basis: ['reasoning_traceability', 'A decision is stated without a stated reason or linked evidence.',
    'A later reviewer cannot trace how the decision was reached.', 'What reason or source does the record give for this decision?', 'Pair each decision with a stated reason and its source.'],
  conclusion_without_identifiable_basis: ['reconstructability', 'A conclusion in the record has no identifiable evidence of its own.',
    'A conclusion without its own basis cannot be checked from the record.', 'Which passage of the record supports this conclusion?', 'Give each conclusion its own basis reference.'],
  same_event_date_conflict: ['chronology_integrity', 'The record gives one event two different dates.',
    'The sequence cannot be reconstructed without clarification.', 'Which date applies to this event, and which record confirms it?', 'Record each event date once, with its source.'],
  decision_outcome_conflict: ['reconstructability', 'The record states opposite outcomes for the same item.',
    'A later reviewer cannot tell which outcome the record relies on.', 'Which outcome applies to this item, and which record confirms it?', 'Record one outcome per item, with its reference.'],
  // 0.3.4 (RP-SRP-11).
  instruction_text_in_record: ['reconstructability', 'The record contains text addressed to a reviewing system, or text directing how the record is assessed.',
    'That text is not evidence for the decision. The Engine did not act on it, and every condition is routed to review.', 'Is this passage part of the decision record, and if so, what does it document?', 'Keep instructions to reviewers or tools out of decision records.'],
}));
export const RESEARCH_DEFECT_REVIEW_REASONS = Object.freeze(['authority_reference_without_linked_facts']);
// Defects that report something absent from the record (the control states it as missing, never as a fact).
export const ABSENCE_DEFECTS = Object.freeze(['no_identifiable_basis_evidence', 'no_locatable_conclusion', 'no_explicit_dates', 'conclusion_without_stated_basis',
  'conclusion_without_identifiable_basis', 'authority_reference_without_linked_facts']);

// RP-SRP-13: one control per defect. It lists every affected condition and every record passage the defect
// concerns, and labels what each field is: detect is what the record shows (or lacks), reflect is an inferred
// concern, correct is a requested clarification, learn is a template suggestion. Nothing is quoted or located that
// the compiler did not compute from the record; a control that fails the 0.2 neutrality check is withheld.
export function buildResearchControls(defects, templates = RESEARCH_DEFECT_TEMPLATES) {
  const order = [], byDefect = new Map();
  for (const d of defects) {
    const t = templates[d.defect]; if (!t) continue;
    if (!byDefect.has(d.defect)) { byDefect.set(d.defect, { defect: d.defect, conditions: [], span_ids: [] }); order.push(d.defect); }
    const g = byDefect.get(d.defect); const c = d.condition_id || t[0];
    if (!g.conditions.includes(c)) g.conditions.push(c);
    for (const s of d.span_ids || []) if (!g.span_ids.includes(s)) g.span_ids.push(s);
  }
  const controls = [], withheld = [];
  for (const k of order) {
    const g = byDefect.get(k), t = templates[k];
    const conditions = [...g.conditions].sort();
    const obj = { control_id: 'GCC:' + k, defect: k, related_condition: conditions.includes(t[0]) ? t[0] : conditions[0], related_conditions: conditions, scope: 'documentation_control_only',
      detect: t[1], reflect: t[2], correct: t[3], learn: t[4], span_ids: [...g.span_ids].sort(),
      field_kinds: { detect: ABSENCE_DEFECTS.includes(k) ? 'absence_in_record' : 'observed_in_record', reflect: 'inferred_concern', correct: 'requested_clarification', learn: 'template_suggestion' },
      missing_evidence: ABSENCE_DEFECTS.includes(k), route: 'human_review' };
    const problems = checkRemediationNeutral(obj);
    if (problems.length) withheld.push({ defect: k, problems }); else controls.push(obj);
  }
  return { controls, withheld };
}

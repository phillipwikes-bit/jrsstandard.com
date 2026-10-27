// JRS EVIDENCE GRAPH 0.3.3-research-candidate: the study research profile. RESEARCH USE ONLY.
//
// INERT BY DEFAULT. Nothing here runs unless compileEvidenceGraph() receives a researchProfile object that
// passes checkResearchProfile() AND the separately signed research rule pack (rule-packs-research/) validates.
// Without that object the compiler follows the 0.3.2 path unchanged. With an invalid object or pack it refuses
// every record (fail closed). There is no environment variable, default or fallback that enables it.
//
// WHAT IT CHANGES, for study decision records written as prose:
//   RP-SRP-01 sentence units with lexical roles (decision, basis cue, authority reference, added conclusion),
//             because study records have no "Label:" headings;
//   RP-SRP-02 evidence anchors (dates, identifiers, quantities, on-file documents), excluding the decision's own
//             date, the identifier of the thing decided, and the figures inside an authority citation;
//   RP-SRP-03 dates written in words, an event key per date, and a conflict only for one event with two dates;
//   RP-SRP-04 opposite outcomes for different decision units are not treated as a contradiction;
//   RP-SRP-05 opposite outcomes for the same decision unit are a record conflict;
//   RP-SRP-06 an authority reference without facts showing its conditions are met is not an identifiable basis;
//   RP-SRP-07 a reason that restates the conclusion, or a decision with no reason, is not a traceable rationale;
//   RP-SRP-08 expiry, compensating-control and labelled-section rules do not apply to study records, and an
//             added conclusion needs its own evidence.
// WHAT IT NEVER DOES: raise a candidate status; produce a supported sufficiency finding; produce any overall
// result, readiness verdict, legal or compliance conclusion; assess a person; repair a quotation; truncate or
// segment a record (over-length records are refused exactly as in 0.3.2).
//
// EVERYTHING IS LEXICAL. These rules see words, not meaning. They were written by the same developer who wrote
// the synthetic study records, so agreement with those records is conformance, not accuracy.

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateRulePacks } from './rule-packs.mjs';
import { ASSERTION_MARKERS } from './assertions.mjs';
import { DEFECT_TEMPLATES } from './controls.mjs';

export const RESEARCH_PROFILE_ID = 'jrs-study-research-profile/1';
export const RESEARCH_PROMPT_VERSION = 'jrs-engine-local-0.3.3-research/prompt-1';
export const RESEARCH_RULES = Object.freeze(['RP-SRP-01', 'RP-SRP-02', 'RP-SRP-03', 'RP-SRP-04', 'RP-SRP-05', 'RP-SRP-06', 'RP-SRP-07', 'RP-SRP-08']);
export const RESEARCH_AUTHORIZED_SCOPE = Object.freeze({ record_type: 'study_decision_record', record_state: 'completed_record',
  content_origin: Object.freeze(['constructed_study_vignette', 'synthetic_study_record']) });
const PROFILE_FIELDS = Object.freeze(['profile_id', 'enabled', 'authorization_ref']);
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
  }
  const v = validateRulePacks(packs, RESEARCH_RULES);
  if (!v.ok) problems.push(...v.problems.map((x) => 'research_rule_pack: ' + x));
  else for (const r of RESEARCH_RULES) if (!v.active.has(r)) problems.push('research_rule_pack: rule ' + r + ' not present');
  const ok = problems.length === 0;
  return { enabled: ok, problems, rules: ok ? v.active : new Set(),
    identity: { profile_id: RESEARCH_PROFILE_ID, enabled: ok, authorization_ref: ok ? p.authorization_ref : null, prompt_version: RESEARCH_PROMPT_VERSION,
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
const BASIS_CUE = /\b(?:because|based on|rests on|relies on|relying on|on the strength of|citing|cites|supported by|traceable to|as shown in|according to|in light of|due to|since|after (?:the|its)|following (?:the|its)|given that|as a result of|confirmed (?:each )?against)\b/i;
const AUTHORITY_REF = /\b(?:under|pursuant to|in accordance with|as permitted by|in line with|consistent with)\s+(?:the\s+|its\s+|their\s+)?(?:[\w'-]+\s+){0,5}?(?:policy|rule|section|clause|standard|procedure|methodology|matrix|regulation|agreement|terms of reference|paragraph|table|row|exemption|schedule|practice)\b|\b(?:Policy|Rule|Standard|Procedure|Methodology|Matrix|Section|Clause|Paragraph|Table|Row)\s+(?:[A-Z]{1,4}-?)?\d[\w.-]*|\b(?:policy|rule|section|clause|paragraph|table|row|terms of reference|agreement)\b[^.;]{0,60}\b(?:allows|permits|requires|defines|assigns|sets out|governs|covers|deals with|explains|bars)\b/i;
const ADDED_CONCLUSION = /\b(?:also|further|additionally)\s+(?:concluded|concludes|states?|stated|found|finds|determined|adds|added|confirms?)\b|\b(?:adds|added) that\b|\b(?:is|are|was|were) (?:confident|satisfied)\b|\bwill not (?:need|require|recur)\b|\bconfident (?:that|in)\b/i;
const MULTI_MARKER = /\b(?:two|three|several)\s+(?:changes|requests|lots|incidents|controls|releases|proposals|work orders|orders|retention requests)\b|\bin two lots\b|\bseparate(?:ly)?\b|\bin part\b|\bpartial(?:ly)?\b|\beach (?:request|outcome|incident|control|release|order|lot|decision)\b/i;
const PARTIAL = /\b(?:in part|partial(?:ly)?|the remaining|of the \w+|two of|seven of|\d+ of \d+)\b/i;
const POSITIVE = /\b(?:approved|granted|awarded|released|authori[sz]ed|agreed|extended|accepted|confirmed|kept|retained|will be kept|produced|raised to priority 1)\b/i;
const NEGATIVE = /\b(?:declined|refused|denied|rejected|withheld|not awarded|held back|disposed of|not attributed|ineffective)\b/i;
// The identifier of the thing decided (masked as evidence and as an event word).
const SUBJECT_REF = /\b(?:(?:change request|request|tender|work order|order|incident|alert|exception|application|proposal)\s+[A-Z][A-Z0-9]{0,5}-\d{1,6}(?:\s+and\s+[A-Z][A-Z0-9]{0,5}-\d{1,6})?|(?:release|lot|version|request)\s+\d+(?:\.\d+)?)\b/gi;
// In a decision sentence, an identifier before the basis cue is the decided item unless it is cited as a source.
const DOC_NOUN_BEFORE = /\b(?:report|minutes|item|sheet|paper|log|ticket|entry|register|extract|scan|run|survey|exhibit|receipt|contracts?|certificate|backup|file|ref(?:erence)?|note|letter|email|statement|invoice|record|photo(?:graph)?)\s+(?:no\.?\s*)?#?$/i;
const inParens = (text, i) => { let d = 0; for (let k = 0; k < i; k++) { if (text[k] === '(') d++; else if (text[k] === ')') d = Math.max(0, d - 1); } return d > 0; };
const ANCHOR_PATTERNS = [
  ['identifier', /\b[A-Z][A-Z0-9]{0,5}-\d{1,6}\b/g], ['identifier', /#\d{2,}\b/g], ['identifier', /\bEx\.\s*[A-Z]\b/g],
  ['identifier', /\b(?:item|items|agenda item|entry|row|lot|case number|ref|section|sec\.|clause|paragraph|table|exhibit|version|release|rule)\s+#?\d+(?:\.\d+)*\b/gi],
  ['time', /\b\d{1,2}:\d{2}(?::\d{2})?\b/g],
  ['quantity', /\$\s?\d[\d,]*(?:\.\d+)?/g],
  ['quantity', /\b\d[\d,]*(?:\.\d+)?\s?(?:%|percent\b|hours?\b|days?\b|minutes?\b|litres?\b|liters?\b|tests?\b|bids?\b|contracts?\b|reports?\b|accounts?\b|records?\b|boxes\b|participants\b|sessions\b|backups?\b|restores?\b|tapes\b|points\b|terminations\b|clips\b|wires\b|weeks?\b|months?\b|years?\b|deliverables\b)/gi],
  ['quantity', /\b\d[\d,]*\s+of\s+(?:the\s+)?\d[\d,]*\b/g], ['quantity', /\b\d[\d,]*\s+(?:[a-z-]+\s+)?[a-z-]+s\b/g], ['quantity', /\b\d{1,3}(?:,\d{3})+\b/g], ['quantity', /\b\d+-(?:day|hour|minute|year)\b/g],
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
];
const SPLIT = /\b(?:and|citing|because|after|following|relies on|rests on|based on|supported by|including|so)\b|[,;:(]/gi;

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

export function sentenceUnits(record) {
  const units = [];
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
      if (e > s) units.push(analyseUnit(record, offset + s, offset + e, units.length));
      from = c;
    }
    offset += line.length + 1;
  }
  return units;
}

function clauseAround(text, i) {
  const re = /,\s+|\s+and\s+|;\s+/g; let from = 0, m;
  while ((m = re.exec(text)) !== null) { if (m.index >= i) return text.slice(from, m.index); from = m.index + m[0].length; }
  return text.slice(from);
}
function analyseUnit(record, start, end, index) {
  const text = record.slice(start, end);
  const subjects = maskRanges(text, SUBJECT_REF);
  const authorityHits = maskRanges(text, AUTHORITY_REF).map(([a, b]) => { const t = AUTHORITY_TAIL.exec(text.slice(b)); return [a, t ? b + t[0].length : b]; });
  const basisCue = BASIS_CUE.exec(text);
  const decision = DECISION_CUE.test(text);
  const dates = proseDates(text);
  const anchors = [];
  for (const d of dates) anchors.push({ kind: 'date', start: d.index, end: d.index + d.length, text: d.raw });
  for (const [kind, re] of ANCHOR_PATTERNS) for (const [a, b] of maskRanges(text, re)) if (!anchors.some((x) => a < x.end && x.start < b)) anchors.push({ kind, start: a, end: b, text: text.slice(a, b) });
  // Attribution: exclude the identifier of the thing decided, the figures inside an authority citation (when the
  // unit is an authority statement), and the date attached to a decision verb before any basis cue.
  const cueAt = basisCue ? basisCue.index : Infinity;
  const isAuthorityUnit = authorityHits.length > 0;
  for (const a of anchors) {
    a.excluded = null;
    if (inRanges(a.start, subjects)) a.excluded = 'subject_reference';
    else if (isAuthorityUnit && a.start < cueAt && (inRanges(a.start, authorityHits) || /\b(?:allows|permits|requires|defines|assigns|sets out|governs|covers|bars|rates)\b/i.test(text))) a.excluded = 'authority_citation';
    else if (decision && a.kind === 'identifier' && a.start < cueAt && /^[A-Z][A-Z0-9]{0,5}-\d/.test(a.text) && !inParens(text, a.start) && !DOC_NOUN_BEFORE.test(text.slice(Math.max(0, a.start - 24), a.start)) && !EVIDENTIAL.test(clauseAround(text, a.start))) a.excluded = 'subject_identifier';
    else if (decision && a.start < cueAt && a.kind === 'date' && DECISION_CUE.test(text.slice(Math.max(0, a.start - 48), a.start))) a.excluded = 'decision_date';
    else if (decision && a.start < cueAt && a.kind !== 'identifier' && a.kind !== 'time' && a.kind !== 'stated_absence' && !EVIDENTIAL.test(clauseAround(text, a.start))) a.excluded = 'decision_detail';
  }
  const outcome = NEGATIVE.test(text) && POSITIVE.test(text) ? 'mixed' : NEGATIVE.test(text) ? 'negative' : POSITIVE.test(text) ? 'positive' : null;
  return { index, start, end, text, decision, basis_cue: basisCue ? basisCue[0].toLowerCase() : null, authority_reference: isAuthorityUnit,
    added_conclusion: ADDED_CONCLUSION.test(text), outcome, partial: PARTIAL.test(text),
    subject_refs: [...new Set(subjects.map(([a, b]) => text.slice(a, b).replace(/^(?:change request|request|tender|work order|order|incident|alert|exception|application|proposal)\s+/i, '').toUpperCase())
      .concat(anchors.filter((a) => a.excluded === 'subject_identifier').map((a) => a.text.toUpperCase())))],
    anchors, basis_anchors: anchors.filter((a) => !a.excluded) };
}

// ------------------------------------------------------------------ dated events with event keys (RP-SRP-03)
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
export function eventKeyAt(clause, dateStart, dateEnd, prevEnd = 0) {
  const masks = maskRanges(clause, SUBJECT_REF);
  const after = clause.slice(dateEnd, dateEnd + 32);
  const mod = /^\s+((?:[a-z-]+\s+){0,1}[a-z-]+)/.exec(after);
  if (mod && /\b(?:the|its|their|this|that|a|an)\s+$/i.test(clause.slice(Math.max(prevEnd, dateStart - 8), dateStart))) { const t = termsIn(mod[1]); if (t.length) return t[t.length - 1].key; }
  const pre = clause.slice(prevEnd, dateStart);
  let lastSplit = 0; SPLIT.lastIndex = 0; let m; while ((m = SPLIT.exec(pre)) !== null) lastSplit = m.index + m[0].length;
  const win = pre.slice(lastSplit);
  const masksWin = masks.map(([a, b]) => [a - prevEnd - lastSplit, b - prevEnd - lastSplit]);
  let k = pick(termsIn(win, masksWin));
  const contentWords = win.replace(/\b(?:the|its|their|a|an|of|on|in|at|by|for|to|from|between|was|were|is|are|be|been|dated|held|made|given|carried|out|issued|completed|then|later|also|only|first)\b/gi, '').replace(/[^A-Za-z]/g, '');
  if (!k && !contentWords) k = pick(termsIn(pre, masks.map(([a, b]) => [a - prevEnd, b - prevEnd])));
  return k;
}
export function researchEvents(record, units) {
  const events = [];
  for (const u of units) {
    // Clauses: split the unit at "; " so each clause is read on its own.
    let cs = 0; const parts = [];
    for (const seg of u.text.split(/;\s+/)) { const s = u.text.indexOf(seg, cs); parts.push([s, s + seg.length]); cs = s + seg.length; }
    for (const [a, b] of parts) {
      const clause = u.text.slice(a, b);
      const ds = proseDates(clause);
      let prevEnd = 0;
      for (const d of ds) {
        const key = eventKeyAt(clause, d.index, d.index + d.length, prevEnd);
        const pre = clause.slice(prevEnd, d.index); let ls = 0; SPLIT.lastIndex = 0; let sm; while ((sm = SPLIT.exec(pre)) !== null) ls = sm.index + sm[0].length;
        const ids = (pre.slice(ls).match(/\b[A-Z][A-Z0-9]{0,5}-\d{1,6}\b/g) || []);
        events.push({ key, ids, date: d.date, partial: d.partial, raw: d.raw, start: u.start + a, end: u.start + b, date_start: u.start + a + d.index, date_end: u.start + a + d.index + d.length, unit: u.index, text: clause });
        prevEnd = d.index + d.length;
      }
    }
  }
  return events;
}
const sameEvent = (x, y) => x.key && y.key && x.key === y.key && (!x.ids.length || !y.ids.length || x.ids.some((i) => y.ids.includes(i)));

// ------------------------------------------------------------------ record-level conflicts (RP-SRP-03, RP-SRP-05)
export function detectResearchConflicts(record, units, events, rules) {
  const out = [];
  if (rules.has('RP-SRP-03')) {
    for (let i = 0; i < events.length && !out.some((k) => k.kind === 'same_event_date_conflict'); i++) for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (sameEvent(a, b) && !sameDay(a.date, b.date)) {
        out.push({ kind: 'same_event_date_conflict', spans: [{ start: a.date_start, end: a.date_end }, { start: b.date_start, end: b.date_end }], affects: ['chronology_integrity', 'reconstructability'],
          summary: 'Two record spans give the event "' + a.key + '" different dates (' + a.raw + ', ' + b.raw + ').' });
        break;
      }
    }
  }
  if (rules.has('RP-SRP-05')) {
    const ds = units.filter((u) => u.decision && (u.outcome === 'positive' || u.outcome === 'negative') && !u.partial && u.subject_refs.length);
    outer: for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
      const a = ds[i], b = ds[j];
      if (a.outcome !== b.outcome && a.subject_refs.some((s) => b.subject_refs.includes(s))) {
        out.push({ kind: 'decision_outcome_conflict', spans: [{ start: a.start, end: a.end }, { start: b.start, end: b.end }], affects: ['reconstructability', 'reasoning_traceability'],
          summary: 'The record states opposite outcomes for ' + a.subject_refs.find((s) => b.subject_refs.includes(s)) + '.' });
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

// ------------------------------------------------------------------ condition rules for study records
// Same contract as conditions.mjs: requirement_visible, visible_gaps, review_reasons, anchor (a section), explanation.
// Rules can only keep or lower a candidate's proposed status; the compiler enforces that.
const NEGATED = /\b(?:not|no|never|without)\s+(?:[A-Za-z]+\s+){0,2}?(?:need|needs|needed|require|requires|required|because|based on)\b/i;
const VACUOUS = /\b(?:met the standard|judged (?:acceptable|suitable|the most suitable)|was considered necessary|considered necessary|appropriate outcome|the way forward|the panel's decision|decision to (?:select|withhold|release)|has been rated|because it operates|it earns that rating|was judged|were judged|it was the reason|the reason for the outcome|fit to be released|its fitness|its suitability|better place(?:d)?|chose to|decided to withhold|it was a priority|pressing nature|the extension it agreed|are to be retained|not suitable for release)\b/i;
export function evaluateResearchConditions(record, sections, units, events, verifiedByCondition, rules) {
  const ev = (c) => verifiedByCondition[c] || [];
  const has = (c, types) => ev(c).some((e) => types.includes(e.assertion_type));
  const section = (u) => (u ? sections.find((s) => u.start >= s.start && u.start < s.end) || null : null);
  const decisions = units.filter((u) => u.decision);
  const basisAnchors = units.flatMap((u) => u.basis_anchors.map((a) => Object.assign({ unit: u.index }, a)));
  const authorityUnits = units.filter((u) => u.authority_reference);
  const added = units.filter((u) => u.added_conclusion && !u.basis_anchors.length);
  // Several decision units about different subjects: each needs evidence of its own (RP-SRP-08 with RP-SRP-04).
  const groups = [];
  for (const u of decisions.filter((x) => x.subject_refs.length)) { const g = groups.find((x) => x.subjects.some((s) => u.subject_refs.includes(s))); if (g) { g.units.push(u); g.subjects.push(...u.subject_refs); } else groups.push({ units: [u], subjects: [...u.subject_refs] }); }
  const multi = groups.length >= 2;
  const unsupportedDecisions = multi ? groups.filter((g) => !g.units.some((u) => u.basis_anchors.length)
    && !units.some((v) => !v.decision && v.basis_anchors.length && v.subject_refs.some((s) => g.subjects.includes(s)))).flatMap((g) => g.units) : [];
  const rationaleUnits = units.filter((u) => u.basis_cue);
  const restated = rules.has('RP-SRP-07') && !basisAnchors.length && rationaleUnits.some((u) => VACUOUS.test(u.text) || u.decision);
  const noReason = rules.has('RP-SRP-07') && decisions.length > 0 && !rationaleUnits.length && !basisAnchors.length;
  const authorityOnly = rules.has('RP-SRP-06') && authorityUnits.length > 0 && !basisAnchors.length;
  const unsupportedConclusion = rules.has('RP-SRP-08') && (added.length > 0 || unsupportedDecisions.length > 0);
  const spanOf = (e) => { const m = /^span:(\d+)-(\d+)$/.exec(e.span_id || ''); return m ? [Number(m[1]), Number(m[2])] : [-1, -1]; };
  const anchorText = (e) => { const [s, t] = spanOf(e); return units.some((u) => u.start < t && s < u.end && u.basis_anchors.some((a) => s <= u.start + a.start && u.start + a.end <= t)); };
  const out = {};
  const firstDecisionSection = section(decisions[0]) || sections[0] || null;
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: firstDecisionSection };
    if (!decisions.length) r.visible_gaps.push('no_locatable_conclusion');
    else if (!basisAnchors.length) r.review_reasons.push('conclusion_without_identifiable_basis');
    if (unsupportedConclusion) r.visible_gaps.push('conclusion_without_identifiable_basis');
    r.requirement_visible = !!decisions.length && !!basisAnchors.length && !unsupportedConclusion && has('reconstructability', ['stated_decision']) && ev('reconstructability').length >= 2;
    if (decisions.length && !r.requirement_visible && !r.review_reasons.length && !r.visible_gaps.length) r.review_reasons.push('decision_and_linked_content_not_both_cited');
    r.explanation = !decisions.length ? 'No sentence states a decision or conclusion, so what is to be reconstructed cannot be located.'
      : !basisAnchors.length ? 'A decision is stated, but no identifiable evidence (a dated, numbered, identified or on-file source) appears in the record.'
        : unsupportedConclusion ? 'At least one conclusion in the record has no identifiable evidence of its own.'
          : 'A decision and identifiable evidence are both visible in the record.';
    out.reconstructability = r;
  }
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: firstDecisionSection };
    if (!basisAnchors.length) r.visible_gaps.push('no_identifiable_basis_evidence');
    if (unsupportedConclusion) r.visible_gaps.push('conclusion_without_identifiable_basis');
    if (authorityOnly) r.review_reasons.push('authority_reference_without_linked_facts');
    const cited = ev('identifiable_basis').filter((e) => ['stated_authority', 'stated_rationale', 'stated_source_reference'].includes(e.assertion_type));
    r.requirement_visible = !!basisAnchors.length && !unsupportedConclusion && cited.some(anchorText);
    if (!r.requirement_visible && !r.visible_gaps.length) r.review_reasons.push('no_cited_basis_with_evidence_anchor');
    r.explanation = authorityOnly ? 'The record cites an authority but states no facts showing how its conditions were met.'
      : !basisAnchors.length ? 'No identifiable evidence for the conclusion appears in the record.'
        : unsupportedConclusion ? 'At least one conclusion has no identifiable evidence of its own.'
          : 'Identifiable evidence is visible in the record.';
    out.identifiable_basis = r;
  }
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: section(units.find((u) => proseDates(u.text).length)) || firstDecisionSection };
    if (!events.length) r.visible_gaps.push('no_explicit_dates');
    r.requirement_visible = events.length >= 2 && has('chronology_integrity', ['stated_date']);
    if (!r.requirement_visible && !r.visible_gaps.length) r.review_reasons.push('dated_sequence_not_cited');
    r.explanation = !events.length ? 'No explicitly dated event appears in the record; the sequence cannot be built.'
      : events.length + ' dated event mention(s) appear in the record. Expiry checks are not applied to this record type. Year-less dates are compared by day and month only.';
    out.chronology_integrity = r;
  }
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: section(rationaleUnits[0]) || firstDecisionSection };
    const negated = (e) => e.assertion_type === 'stated_rationale' && NEGATED.test(e.quote);
    const rationaleCited = ev('reasoning_traceability').some((e) => ['stated_rationale', 'stated_source_reference'].includes(e.assertion_type) && !negated(e) && anchorText(e));
    if (restated) r.visible_gaps.push('conclusion_restated_as_basis');
    else if (noReason) r.visible_gaps.push('conclusion_without_stated_basis');
    if (unsupportedConclusion) r.visible_gaps.push('conclusion_without_identifiable_basis');
    if (!decisions.length) r.review_reasons.push('basis_without_conclusion');
    if (ev('reasoning_traceability').some(negated) && !rationaleCited) r.review_reasons.push('negated_rationale_not_counted');
    r.requirement_visible = !!decisions.length && !!basisAnchors.length && !restated && !unsupportedConclusion && rationaleCited;
    if (!r.requirement_visible && !r.review_reasons.length && !r.visible_gaps.length) r.review_reasons.push('rationale_path_not_cited');
    r.explanation = restated ? 'The stated reason repeats the conclusion instead of giving a separate basis.'
      : noReason ? 'A decision is stated without any reason or source.'
        : 'Reasoning is traced only where the record states a reason linked to identifiable evidence. An outcome alone is not treated as reasoning.';
    out.reasoning_traceability = r;
  }
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: ['sufficiency_not_determinable_by_engine'], anchor: firstDecisionSection };
    if (!basisAnchors.length) r.visible_gaps.push('no_identifiable_basis_evidence');
    if (unsupportedConclusion) r.visible_gaps.push('conclusion_without_identifiable_basis');
    r.explanation = (r.visible_gaps.length ? 'One or more elements needed for later reconstruction are not visible in the record.'
      : 'The checked elements are visible. Whether the support was substantively sufficient is not determined.') + ' Expiry and compensating-control checks are not applied to this record type.';
    out.sufficiency = r;
  }
  return out;
}

// Research linkage (replaces RP-EVL-01, whose section roles do not exist in prose records).
export function researchLinked(condition, verified, units, events) {
  const overlaps = (e, f) => units.some((u) => e.start < u.end && u.start < e.end && f(u));
  const list = verified.map((v) => { const m = /^span:(\d+)-(\d+)$/.exec(v.span_id || ''); return m ? Object.assign({ start: Number(m[1]), end: Number(m[2]) }, v) : null; }).filter(Boolean);
  if (condition === 'identifiable_basis' || condition === 'reasoning_traceability') return list.some((e) => overlaps(e, (u) => u.basis_anchors.length > 0));
  if (condition === 'chronology_integrity') return list.some((e) => events.some((x) => e.start <= x.date_start && x.date_end <= e.end));
  if (condition === 'reconstructability') return list.some((e) => e.assertion_type === 'stated_decision' && overlaps(e, (u) => u.decision));
  return true;
}

// ------------------------------------------------------------------ assertion markers for study records
const PROSE_DATE_MARKER = new RegExp('\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b\\d{1,2}\\s+' + MON + '\\b|\\b' + MON + '\\s+\\d{1,2}\\b|\\bQ[1-4]\\b');
export const RESEARCH_MARKERS = Object.freeze(Object.assign({}, ASSERTION_MARKERS, {
  stated_decision: /\b(?:decision|granted|approved|denied|rejected|declined|awarded|withheld|released|authori[sz]ed|affirmed|extended|moved|rated|classified|closed|confirmed|agreed|decided|concluded|determined|refused|held back|set to|raised to|kept|retained|attributes|attributed|selected|finding|determination)\b/i,
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
  no_explicit_dates: ['chronology_integrity', 'No explicitly dated event appears in the record.',
    'The sequence of events that led to the decision cannot be reconstructed.', 'What dates establish the sequence of events that led to the decision?', 'Ask for a date for each step the record describes.'],
  conclusion_without_traceable_basis: DEFECT_TEMPLATES.conclusion_without_traceable_basis,
  no_identifiable_basis_evidence: ['identifiable_basis', 'No identifiable evidence (a dated, numbered, identified or on-file source) for the conclusion appears in the record.',
    'A later reviewer cannot see what the conclusion rested on.', 'Which document, date or measurement in the record does the conclusion rest on?', 'Add a field that names the evidence each conclusion rests on.'],
  authority_reference_without_linked_facts: ['identifiable_basis', 'The record cites an authority but states no facts showing how its conditions were met.',
    'A citation of a rule does not show which facts satisfied it.', 'Which facts in the record meet the conditions of the cited authority?', 'Pair each cited authority with the facts that meet its conditions.'],
  conclusion_restated_as_basis: ['reasoning_traceability', 'The stated reason repeats the conclusion instead of giving a separate basis.',
    'A reason that restates the outcome does not show how the outcome was reached.', 'What separate fact or source does the record give for this conclusion?', 'Ask for each reason to name a fact or source other than the outcome itself.'],
  conclusion_without_stated_basis: ['reasoning_traceability', 'A decision is stated without any reason or source.',
    'A later reviewer cannot trace how the decision was reached.', 'What reason or source does the record give for this decision?', 'Pair each decision with a stated reason and its source.'],
  conclusion_without_identifiable_basis: ['reconstructability', 'A conclusion in the record has no identifiable evidence of its own.',
    'A conclusion without its own basis cannot be checked from the record.', 'Which passage of the record supports this conclusion?', 'Give each conclusion its own basis reference.'],
  same_event_date_conflict: ['chronology_integrity', 'The record gives one event two different dates.',
    'The sequence cannot be reconstructed without clarification.', 'Which date applies to this event, and which record confirms it?', 'Record each event date once, with its source.'],
  decision_outcome_conflict: ['reconstructability', 'The record states opposite outcomes for the same item.',
    'A later reviewer cannot tell which outcome the record relies on.', 'Which outcome applies to this item, and which record confirms it?', 'Record one outcome per item, with its reference.'],
}));
export const RESEARCH_DEFECT_REVIEW_REASONS = Object.freeze(['authority_reference_without_linked_facts']);

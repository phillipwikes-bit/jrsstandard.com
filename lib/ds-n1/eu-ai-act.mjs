// Decision Spellcheck: EU AI Act lens (2026-11-25).
//
// For a record that authorises an AI system to act, this reports which of the
// things the EU AI Act expects a deployer to be able to show are stated in the
// record, whether a source document backs each one up, and what is missing.
//
// It is a documentation check. It never says a system or organisation
// complies with the AI Act, never decides whether a system is high-risk, and
// never changes the review status. It works from word patterns, so it can miss
// a point phrased in unexpected words and can credit a sentence that only
// sounds right; every result names the sentence it relied on so a person can
// check it.
//
// Legal references (Regulation (EU) 2024/1689). Wording was checked against
// excerpts of the official text reproduced by several sources on 2026-11-25,
// not against EUR-Lex directly (not reachable from the build environment):
// verify against the Official Journal before quoting. Application dates for
// high-risk obligations were moved by the Digital Omnibus (reported as
// Regulation (EU) 2026/1744): Annex III systems from 2 December 2027, Annex I
// from 2 August 2028; Article 4 (AI literacy) has applied since 2 February 2025.

import { sentences, contentWords, fold } from './text.mjs';

export const EU_LENS_VERSION = 'ds-n1.eu-ai-act/0.2.0-dev';
export const EU_LENS_CLASSES = Object.freeze(['ai_action_authorization']);

const PERSONS = String.raw`(?:applications?|applicants?|candidates?|customers?|claimants?|tenants?|patients?|students?|borrowers?|residents?|citizens?|individuals|natural persons|people)`;
const WORKERS = String.raw`(?:workers?|employees?|staff|works council|workers' representatives|employee representatives|trade unions?)`;

const RX = {
  risk_classification: /\b(high[- ]risk|annex iii|annex i\b|risk classification|classified as)\b/u,
  instructions_for_use: /\b(instructions for use|provider'?s instructions|instructions of the provider|vendor'?s instructions)\b/u,
  human_oversight: /\b(oversee\w*|oversight|supervis\w*|monitor\w*|reviewed by|reviews every|reviews each|checks each|checks every|approves each|send every|sends every)\b/u,
  oversight_competence: /\b(trained|training|competen\w*|qualified|certified)\b/u,
  stop_or_override: /\b(stop\w*|switch(?:ed)? (?:it |\w+ )?off|turn(?:ed)? (?:it |the \w+ |\w+ )?off|halt\w*|suspend\w*|overrid\w*|reject\w*|disregard\w*|revers\w*|interrupt\w*)\b/u,
  monitoring: /\b(monitor\w*|oversee\w*|reviewed by|reviews every|reviews each|checks each|checks every|serious incident|reports? any)\b/u,
  log_retention: /\blogs?\b.*\b(kept|retained|stored|held|keep|retain)\b|\b(kept|retained|stored|held)\b.*\blogs?\b/u,
  workers_informed: new RegExp(String.raw`\b(inform\w*|notif\w*|told|consult\w*)\b.{0,80}\b${WORKERS}|\b${WORKERS}\b.{0,80}\b(informed|notified|told|consulted)\b`, 'u'),
  affected_persons_informed: new RegExp(String.raw`\b(inform\w*|notif\w*|told)\b.{0,80}\b${PERSONS}|\b${PERSONS}\b.{0,80}\b(informed|notified|told)\b`, 'u'),
  ai_literacy: /\b(ai literacy|trained|training)\b/u,
};

export const EU_CHECKS = Object.freeze([
  { id: 'risk_classification', article: 'Article 6 and Annex III', requirement: 'Whether the system is high-risk decides which obligations apply.', question: 'Is the system classified as high-risk or not, and on what basis?' },
  { id: 'instructions_for_use', article: 'Article 26(1)', requirement: 'Deployers take measures to use a high-risk system in accordance with the provider\'s instructions for use.', question: 'Which version of the provider\'s instructions for use applies, and does the record say they are followed?' },
  { id: 'human_oversight', article: 'Article 26(2) and Article 14', requirement: 'Human oversight is assigned to named people.', question: 'Who oversees the system day to day, by name or role?' },
  { id: 'oversight_competence', article: 'Article 26(2)', requirement: 'People assigned to oversight have the necessary competence, training and authority.', question: 'What training or authority do the people overseeing the system have?' },
  { id: 'stop_or_override', article: 'Article 14(4)(d) and (e)', requirement: 'Overseers can decide not to use, override or reverse the output, and can stop the system.', question: 'How can a person override the system or stop it, and who may do so?' },
  { id: 'monitoring', article: 'Article 26(5)', requirement: 'Deployers monitor the operation of the system and inform the provider of risks and serious incidents.', question: 'Who monitors the system in operation, and how are problems reported to the provider?' },
  { id: 'log_retention', article: 'Article 26(6)', requirement: 'Logs under the deployer\'s control are kept for at least six months, unless other law provides otherwise.', question: 'Are the system\'s logs kept, for how long, and is that at least six months?' },
  { id: 'workers_informed', article: 'Article 26(7)', requirement: 'Before use at the workplace, workers\' representatives and affected workers are informed.', question: 'Were the affected workers and their representatives told before the system was used?', when: 'high-risk system used at the workplace' },
  { id: 'affected_persons_informed', article: 'Article 26(11)', requirement: 'Where an Annex III system makes or assists decisions about people, those people are informed that they are subject to it.', question: 'Are the people the system makes decisions about told that an AI system is used?', when: 'high-risk system that makes or assists decisions about people' },
  { id: 'ai_literacy', article: 'Article 4', requirement: 'Staff dealing with AI systems have a sufficient level of AI literacy.', question: 'Have the staff who use or oversee the system been trained in its use and limits?' },
]);

const MONTHS = { day: 1 / 30, days: 1 / 30, week: 0.25, weeks: 0.25, month: 1, months: 1, year: 12, years: 12 };
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, eighteen: 18, twenty: 20, thirty: 30 };
export function retentionMonths(text) {
  const m = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty|thirty)\s+(days?|weeks?|months?|years?)\b/u.exec(fold(text).text);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUM[m[1]];
  return n * MONTHS[m[2]];
}

// 0.2.0 (after sealed set 1): "training" in a job title or about content
// ("training director", "training modules") is not evidence that staff were trained.
const TRAINING_NOT_PEOPLE = /\btraining (director|manager|coordinator|lead|officer|department|team|modules?|courses?|budget|programmes?|programs?|materials?|data|set)\b/gu;
const clean = (id, t) => (id === 'ai_literacy' || id === 'oversight_competence' ? t.replace(TRAINING_NOT_PEOPLE, ' ') : t);

const NEGATED = /\b(not|no|never|without|cannot|can't)\b.{0,25}$/u;
const NOT_HIGH = /\b(not|no|never)\b[^.]{0,30}high[- ]risk/u;

function firstMatch(rx, sents, id = '') {
  for (const s of sents) {
    const t = clean(id, fold(s.text).text);
    const m = rx.exec(t);
    if (!m) continue;
    // A negated mention ("cannot be switched off", "no training") is not a statement that it is in place.
    if (rx !== RX.risk_classification && NEGATED.test(t.slice(0, m.index))) continue;
    return s;
  }
  return null;
}

/**
 * Run the EU AI Act lens on a ds-n1.record/1.0 package.
 * @returns {{applicable:boolean, version:string, high_risk:boolean|null, checks:object[], summary:object, notice:string}}
 */
export function euAiActLens(record) {
  if (!record || typeof record.text !== 'string' || !Array.isArray(record.sources)) throw new TypeError('A ds-n1.record/1.0 package is required');
  const notice = 'Shows what this record states and whether its documents back it up. It is not a legal assessment and does not show that anyone complies with the EU AI Act.';
  if (!EU_LENS_CLASSES.includes(record.record_class)) return { applicable: false, version: EU_LENS_VERSION, checks: [], summary: null, notice };
  const recS = sentences(record.text);
  const srcS = record.sources.flatMap((src) => sentences(src.text || '').map((s) => ({ ...s, title: src.title, source_id: src.source_id })));
  const recFold = fold(record.text).text;
  const classSent = firstMatch(RX.risk_classification, recS);
  const highRisk = classSent ? !NOT_HIGH.test(fold(classSent.text).text) : null;
  const workplace = new RegExp(String.raw`\b${WORKERS}\b|\b(rotas?|shifts?|workplace|warehouse)\b`, 'u').test(recFold);
  const aboutPeople = new RegExp(String.raw`\b${PERSONS}\b`, 'u').test(recFold);

  const checks = EU_CHECKS.map((c) => {
    let applies = true;
    if (c.id === 'workers_informed') applies = highRisk === true && workplace;
    if (c.id === 'affected_persons_informed') applies = highRisk === true && aboutPeople;
    if (!applies) return { ...c, status: 'NOT_APPLICABLE', record_sentence: null, source: null };
    const rx = RX[c.id];
    let rs = firstMatch(rx, recS, c.id);
    if (c.id === 'oversight_competence') rs = recS.find((s) => RX.oversight_competence.test(clean(c.id, fold(s.text).text)) && RX.human_oversight.test(fold(s.text).text)) || null;
    if (!rs) return { ...c, status: 'NOT_SHOWN', record_sentence: null, source: null };
    const words = new Set(contentWords(rs.text));
    const support = srcS.find((s) => {
      const t = clean(c.id, fold(s.text).text);
      if (!rx.test(t)) return false;
      if (c.id === 'oversight_competence' && !RX.human_oversight.test(t)) return false;
      return contentWords(s.text).some((w) => words.has(w));
    });
    const out = { ...c, status: support ? 'SHOWN_SUPPORTED' : 'STATED_UNSUPPORTED', record_sentence: rs.text,
      source: support ? { source_id: support.source_id, title: support.title, sentence: support.text } : null };
    if (c.id === 'log_retention') {
      const mo = retentionMonths(rs.text);
      const atLeast = /\bat least\b/u.test(fold(rs.text).text);
      out.retention_months = mo;
      if (mo !== null && mo < 6 && !atLeast) out.flag = 'below_six_months';
    }
    return out;
  });
  const count = (st) => checks.filter((c) => c.status === st).length;
  return {
    applicable: true, version: EU_LENS_VERSION, high_risk: highRisk, checks, notice,
    summary: { shown_supported: count('SHOWN_SUPPORTED'), stated_unsupported: count('STATED_UNSUPPORTED'), not_shown: count('NOT_SHOWN'), not_applicable: count('NOT_APPLICABLE'),
      flags: checks.filter((c) => c.flag).map((c) => `${c.id}:${c.flag}`) },
  };
}

// Detect + Reflect. Deterministic rules, no model calls. Every finding carries
// the evidence that produced it, a specific explanation and a neutral question.
//
// Three distinctions are kept separate throughout:
//   quote PRESENT   (the cited words exist in the cited source)
//   RELEVANT/SUPPORTS (that passage concerns the same subject, actor, event,
//                   polarity and qualification as the claim)
//   SUFFICIENT      (never decided by DS-N1; always left to a human)
import { CONDITIONS } from './identity.mjs';
import {
  nfc, fold, findAll, exactIndexOf, sentences, sentenceContaining, contentWords, sha256, codePoints,
} from './text.mjs';

export const RULES = Object.freeze({
  CLAIM_NOT_IN_RECORD: { severity: 'blocking', condition: 'RC1' },
  CLAIM_LOCATION_AMBIGUOUS: { severity: 'review', condition: 'RC1' },
  UNSUPPORTED_CLAIM: { severity: 'critical', condition: 'RC2' },
  // 2026-11-25 calibration (real records): the cited passage is related to the
  // statement but its wording does not confirm it. A person must check it; it
  // is not asserted to be unsupported (paraphrase hold-out 3 protocol).
  SUPPORT_NOT_CONFIRMED: { severity: 'review', condition: 'RC2' },
  // Same calibration: a contradiction or a different subject is only asserted
  // (critical) when the cited passage clearly restates the statement; against a
  // weakly matched passage it is a question for the reviewer.
  POSSIBLE_CONTRADICTION: { severity: 'review', condition: 'RC2' },
  POSSIBLE_SUBJECT_MISMATCH: { severity: 'review', condition: 'RC2' },
  UNTRACEABLE_AUTHORITY: { severity: 'critical', condition: 'RC2' },
  SOURCE_MISSING: { severity: 'critical', condition: 'RC2' },
  QUOTE_NOT_FOUND: { severity: 'critical', condition: 'RC2' },
  NEGATION_CONFLICT: { severity: 'critical', condition: 'RC2' },
  SUBJECT_MISMATCH: { severity: 'critical', condition: 'RC2' },
  RELEVANCE_NOT_ESTABLISHED: { severity: 'review', condition: 'RC2' },
  ACTOR_NOT_ESTABLISHED: { severity: 'review', condition: 'RC1' },
  QUALIFICATION_OMITTED: { severity: 'review', condition: 'RC5' },
  // Real-record work (2026-11-25): a date or an attributed speaker that the cited
  // source sentence carries but the statement leaves out (study 014 found that
  // AI summaries of real decisions drop exactly these anchors).
  DATE_OMITTED: { severity: 'review', condition: 'RC3' },
  SPEAKER_OMITTED: { severity: 'review', condition: 'RC1' },
  CONTRARY_CLAUSE_OMITTED: { severity: 'review', condition: 'RC5' },
  EVENT_ROLE_CONFUSION: { severity: 'critical', condition: 'RC3' },
  DATE_MISMATCH: { severity: 'critical', condition: 'RC3' },
  DATE_NOT_ESTABLISHED: { severity: 'review', condition: 'RC3' },
  DATE_ROLE_UNVERIFIED: { severity: 'review', condition: 'RC3' },
  // 2026-11-25 (blind spots): figures, all-number dates and language.
  NUMBER_MISMATCH: { severity: 'critical', condition: 'RC2' },
  DATE_IMPOSSIBLE: { severity: 'critical', condition: 'RC3' },
  NUMBER_NOT_ESTABLISHED: { severity: 'review', condition: 'RC2' },
  DATE_FORMAT_AMBIGUOUS: { severity: 'review', condition: 'RC3' },
  LANGUAGE_NOT_SUPPORTED: { severity: 'review', condition: 'RC1' },
  REASONING_NOT_TRACED: { severity: 'review', condition: 'RC4' },
  UNMAPPED_ASSERTION: { severity: 'review', condition: 'RC1' },
  INSTRUCTION_LIKE_CONTENT: { severity: 'review', condition: 'RC1' },
  // Practitioner-gap checks (2026-11-25, owner decision): the gaps practitioners
  // raised most in the blind study now stop a record reaching READY.
  RECOMMENDATION_STATED_AS_REQUIREMENT: { severity: 'review', condition: 'RC2' },
  CONCLUSORY_ASSESSMENT: { severity: 'review', condition: 'RC5' },
  AUTHORITY_TEXT_NOT_SUPPLIED: { severity: 'review', condition: 'RC2' },
  CONCLUSION_ON_UNRESOLVED_BASIS: { severity: 'review', condition: 'RC4' },
  BROAD_ACCESS_NOT_JUSTIFIED: { severity: 'review', condition: 'RC5' },
});

// 2026-11-25 (real records): noun and adjective forms of the same negations
// ("denial of leave", "the record is devoid of", "unable to") count too.
const NEGATION = /\b(not|no|nor|neither|never|none|nobody|nothing|without|fail|fails|failing|denied|denial|denials|deny|denies|denying|declined|declining|refusing|rejecting|lacking|prevent|prevents|prevented|preventing|rejected|rejection|refused|refusal|failed|failure|cannot|unable|devoid|lack|lacks|lacked|absent|absence|withdrawn|revoked)\b|n't\b/u;
const QUALIFIER = /\b(unless|except|excepting|provided that|subject to|pending|conditional|conditionally|only if|until|temporary|temporarily|limited to|provisional|provisionally|interim)\b/u;
const ASSERTION = /\b(approv\w*|confirm\w*|verif\w*|grant\w*|determin\w*|conclud\w*|therefore|because|complet\w*|authori[sz]\w*|sign\w*|accept\w*|reviewed|exception|decid\w*|decision)\b|\d{4}-\d{2}-\d{2}/u;
const INSTRUCTION = /\b(ignore (all |any )?(previous|prior|above|earlier) (instructions|rules)|disregard (the|all|any|previous) |system prompt|you are (an?|the) (ai|assistant|model)|mark (this|the) (record|claim|review) (as )?(ready|approved|supported)|set (the )?status to|treat (this|the) (record|claim|exception|review) as (approved|ready|supported|verified|complete))/u;
// A sentence opening with a role label addressed to a model or tool.
const ROLE_LABEL = /^\W*(system|assistant|ai|instruction|instructions|note to (the )?(ai|model|assistant|tool))\s*:/u;
// Attributed speakers in investigative records: a role label followed closely by
// a speech verb (the study 014 anchor definition).
const SPEAKER_ROLE = String.raw`(complainant|petitioner|s\d{1,2}|rmo\s?\d{1,2}|rmo|cw\s?\d{1,2}|c\d{1,2}|witness\s?\d{1,2}|w\d{1,2}|supervisor\s?\d{1,2}|manager\s?\d{1,2}|coworker\s?\d{1,2}|specialist\s?\d{1,2}|official\s?\d{1,2}|so\d{1,2}|hr\s?\d{1,2}|selecting official|investigator|director|supervisor|manager|coworker|agency|chief|hr)`;
const SPEECH_VERB = String.raw`(said|says|argued|argues|responded|responds|wrote|writes|stated|states|averred|avers|testified|asserted|asserts|alleged|alleges|denied|denies|explained|explains|maintained|maintains|indicated|indicates|affirmed|affirms|contended|contends|claimed|claims|noted|notes|reported|reports|attested|attests|recalled|recalls|acknowledged|acknowledges|confirmed|confirms)`;
const ATTRIBUTION = new RegExp(String.raw`\b${SPEAKER_ROLE}\b[^.;:]{0,40}?\b${SPEECH_VERB}\b`, 'gu');
const SPEECH_ANY = /\b(said|says|told|tells|stated|states|testified|testifies|averred|avers|asserted|asserts|alleged|alleges|believed|believes|denied|denies|explained|maintained|indicated|affirmed|contended|claimed|noted|reported|attested|recalled|acknowledged|confirmed|wrote|responded|replied|added|described|insisted|recounted)\b/u;
const GENERIC_SPEAKER = /\b(an individual|someone|somebody|a person|an unnamed|unidentified|a witness|an employee|another employee|a coworker|a co-worker|an official)\b[^.;:]{0,40}?\b(said|stated|testified|averred|asserted|alleged|denied|explained|maintained|indicated|affirmed|contended|claimed|noted|reported|attested|recalled|acknowledged|confirmed|told)\b/u;
export function speakersIn(text) { const t = fold(text).text; const out = new Set(); for (const m of t.matchAll(ATTRIBUTION)) out.add(m[1].replace(/\s+/g, '')); return out; }
export function rolesNamed(text) { const t = fold(text).text; const out = new Set(); for (const m of t.matchAll(new RegExp(String.raw`\b${SPEAKER_ROLE}\b`, 'gu'))) out.add(m[1].replace(/\s+/g, '')); return out; }
const NON_ACTOR = /\b(act|acts|report|reports|letter|letters|file|files|claims?|background|decision|decisions|suspension|placement|opportunity|evidence|statement|statements|policy|handbook|manual|whether|order|orders|record|records|case|section|regulation|regulations|code|guidance|procedure|procedures|form|notice|judge|aj|commission|commission's|board|tribunal|court|hearing|investigation|analysis|conclusion|findings?|issues?|summary|appendix|exhibit|station|city|county|state|street|avenue|district|region|facility|center|centre)\b/u;
const CONTRAST = /\b(but|however|although|though|yet|whereas)\b/u;
// Decision-verb synonyms folded before the relevance comparison. Deliberately
// small and documented; widening it trades false holds for false support.
const SYNONYMS = [[/\bsign(ed|s|ing)? off( on)?\b/gu, 'approved'], [/\bauthori[sz]\w*/gu, 'approved'], [/\bfinish\w*/gu, 'completed']];
// Event-role cues: the word stems that name an event when they sit just before a date.
const ROLE_CUES = ['request', 'submi', 'assess', 'approv', 'receiv', 'review', 'due', 'expir', 'complet'];
const cueOf = (text) => { const t = fold(text).text; return ROLE_CUES.find((c) => t.includes(c)) || null; };

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// 2026-11-25 (international records): abbreviated months ("3 Feb 2024",
// "Sept. 3, 2024"), ordinals ("3rd March 2024", "the 3rd of March, 2024",
// "March 3rd, 2024") and all-number dates. An all-number date is read only when
// it cannot be read two ways (a day above 12, as in 25/03/2024 or 03/25/2024,
// or year first, as in 2024/03/25); "03/04/2024" is 3 April in most countries
// and March 4 in the United States, so it is reported by ambiguousDates instead.
const MON_ABBR = { jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const monthNo = (w) => { const i = MONTHS.indexOf(w); return i >= 0 ? i + 1 : MON_ABBR[w] || 0; };
const MON_RE = `(${MONTHS.join('|')}|${Object.keys(MON_ABBR).join('|')})\\.?`;
const ORD = '(\\d{1,2})(?:st|nd|rd|th)?';
// No lookbehind anywhere in code that runs in the browser: Safari before iOS
// 16.4 cannot parse it and the whole page would fail to load (2026-11-26).
// The character before a date is captured (group 1) and put back.
const NUMERIC_DATE = /(^|[^\d/.-])(\d{1,4})([/.-])(\d{1,2})\3(\d{2,4})(?![\d/.-]*\d)/gu;
const dropNumericDates = (t) => t.replace(NUMERIC_DATE, (m0, p) => p + ' ');
const validDay = (y, m, d) => m >= 1 && m <= 12 && d >= 1 && d <= new Date(Date.UTC(+y, m, 0)).getUTCDate();
function numericDates(t) {
  const out = [];
  for (const m of t.matchAll(NUMERIC_DATE)) {
    const [a, b, c] = [m[2], m[4], m[5]];
    const text = m[0].slice(m[1].length);
    if (a.length === 4) { if (validDay(a, +b, +c)) out.push({ text, readings: [iso(a, b, c)] }); continue; }
    if (c.length !== 4 || a.length > 2) continue;
    const dm = validDay(c, +b, +a) ? iso(c, b, a) : null; // day/month/year
    const md = validDay(c, +a, +b) ? iso(c, a, b) : null; // month/day/year
    const readings = [...new Set([dm, md].filter(Boolean))];
    if (readings.length) out.push({ text, readings });
  }
  return out;
}
export function ambiguousDates(text) { return numericDates(fold(text).text).filter((x) => x.readings.length > 1); }

export function extractDates(text) {
  const t = fold(text).text;
  const out = new Set();
  for (const m of t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/gu)) out.add(`${m[1]}-${m[2]}-${m[3]}`);
  const ok = (y, mo, d) => mo && validDay(y, mo, +d);
  for (const m of t.matchAll(new RegExp(`\\b${MON_RE} ${ORD},? (\\d{4})\\b`, 'gu'))) if (ok(m[3], monthNo(m[1]), m[2])) out.add(iso(m[3], monthNo(m[1]), m[2]));
  for (const m of t.matchAll(new RegExp(`\\b${ORD}(?: of)? ${MON_RE},? (\\d{4})\\b`, 'gu'))) if (ok(m[3], monthNo(m[2]), m[1])) out.add(iso(m[3], monthNo(m[2]), m[1]));
  for (const x of numericDates(t)) if (x.readings.length === 1) out.add(x.readings[0]);
  return [...out].sort();
}
// 2026-11-25 (track F): a date that cannot exist ("May 32, 2018", "February 30, 2021").
export function impossibleDates(text) {
  const t = fold(text).text; const out = [];
  for (const m of t.matchAll(new RegExp(`\\b${MON_RE} ${ORD},? (\\d{4})\\b`, 'gu'))) { const mo = monthNo(m[1]); if (mo && !validDay(m[3], mo, +m[2])) out.push(m[0]); }
  for (const m of t.matchAll(new RegExp(`\\b${ORD}(?: of)? ${MON_RE},? (\\d{4})\\b`, 'gu'))) { const mo = monthNo(m[2]); if (mo && !validDay(m[3], mo, +m[1])) out.push(m[0]); }
  return [...new Set(out)];
}
// A date one to three days from a date the cited passage gives, in the same
// month and year, reads as a slip for that date (2026-11-25, track F).
export function nearShift(d, dates) {
  const t = Date.parse(d); if (Number.isNaN(t)) return null;
  return dates.find((x) => x !== d && x.slice(0, 7) === d.slice(0, 7) && Math.abs(Date.parse(x) - t) <= 3 * 86400000) || null;
}
// Month and day written without a year ("on June 22, the AJ ..."), as --MM-DD.
export function yearlessDates(text) {
  const t = fold(text).text; const out = new Set();
  for (const m of t.matchAll(new RegExp(`\\b${MON_RE} ${ORD}\\b(?!,? \\d{4})(?!\\d)`, 'gu'))) { const mo = monthNo(m[1]); if (mo && +m[2] >= 1 && +m[2] <= 31) out.add(`--${String(mo).padStart(2, '0')}-${m[2].padStart(2, '0')}`); }
  for (const m of t.matchAll(new RegExp(`\\b${ORD}(?: of)? ${MON_RE}(?!\\p{L})(?!,? \\d{4})`, 'gu'))) { const mo = monthNo(m[2]); if (mo && +m[1] >= 1 && +m[1] <= 31) out.add(`--${String(mo).padStart(2, '0')}-${m[1].padStart(2, '0')}`); }
  return [...out];
}
// Numbers standing alone: not preceded by a letter, digit, ".", "§", "(", "/" or
// "-", and not followed by what `after` matches. Written without lookbehind.
function standaloneNumbers(x, after) {
  const out = [];
  for (const m of x.matchAll(/\d+(?:\.\d+)?/gu)) {
    const prev = m.index ? x[m.index - 1] : '';
    if (prev && /[\p{L}\d.§(\/-]/u.test(prev)) continue;
    if (new RegExp('^(?:' + after.source + ')', 'u').test(x.slice(m.index + m[0].length))) continue;
    out.push(Number(m[0]));
  }
  return out;
}
// Standalone numbers in a sentence, without dates, years, sections or labels.
function sentBare(t) {
  let x = dropNumericDates(fold(t).text).replace(/\b\d{4}-\d{2}-\d{2}\b/gu, ' ').replace(new RegExp(`\\b${MON_RE} ${ORD},? \\d{4}\\b|\\b${ORD}(?: of)? ${MON_RE},? \\d{4}\\b`, 'gu'), ' ').replace(/(\d),(?=\d{3}\b)/gu, '$1');
  return standaloneNumbers(x, /[\p{L}\d\/]|\.\d/u).filter((v) => !(v >= 1900 && v <= 2100));
}
// Month and year with no day ("in February 2020", "June 2020"), as YYYY-MM.
// Used only for dropped dates, never for wrong-date checks (2026-11-26).
export function monthDates(text) {
  const t = fold(text).text; const out = new Set();
  for (const m of t.matchAll(new RegExp(`\\b${MON_RE}(?!\\p{L}),? (\\d{4})\\b`, 'gu'))) {
    const before = t.slice(Math.max(0, m.index - 4), m.index);
    if (/\d,?\s*$/u.test(before)) continue; // "3 February 2020" is a full date
    const mo = monthNo(m[1]); if (mo) out.add(`${m[2]}-${String(mo).padStart(2, '0')}`);
  }
  for (const d of extractDates(text)) out.delete(d.slice(0, 7));
  return [...out];
}
const SRC_DATES = new Map();
function sourceDates(t) { let v = SRC_DATES.get(t); if (!v) { if (SRC_DATES.size > 64) SRC_DATES.clear(); v = new Set([...extractDates(t), ...ambiguousDates(t).flatMap((a) => a.readings)]);
    // "On June 22, the AJ ..." (no year): the month and day count as given.
    const f = fold(t).text;
    for (const m of f.matchAll(new RegExp(`\\b${MON_RE} ${ORD}\\b(?!,? \\d{4})`, 'gu'))) if (monthNo(m[1])) v.add(`--${String(monthNo(m[1])).padStart(2, '0')}-${m[2].padStart(2, '0')}`);
    for (const m of f.matchAll(new RegExp(`\\b${ORD}(?: of)? ${MON_RE}(?!\\p{L})(?!,? \\d{4})`, 'gu'))) if (monthNo(m[2])) v.add(`--${String(monthNo(m[2])).padStart(2, '0')}-${m[1].padStart(2, '0')}`); SRC_DATES.set(t, v); } return v; }
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// 2026-11-25: figures. A summary that changes "$5,000" to "$50,000", "30 days"
// to "60 days" or "3 complaints" to "2 complaints" keeps every other word, so
// word overlap cannot see it. Each figure is read with what it counts: a
// currency, a percentage, or the noun after it. Dates, years, section and case
// numbers and labels such as S1 are not figures.
const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };
const SCALE = { thousand: 1e3, k: 1e3, million: 1e6, m: 1e6, mn: 1e6, billion: 1e9, bn: 1e9 };
const CURRENCY = { '$': 'usd', usd: 'usd', dollars: 'usd', dollar: 'usd', '£': 'gbp', gbp: 'gbp', pounds: 'gbp', '€': 'eur', eur: 'eur', euros: 'eur', euro: 'eur', '¥': 'jpy', jpy: 'jpy', yen: 'jpy', chf: 'chf', cad: 'cad', aud: 'aud', inr: 'inr', rupees: 'inr', '₹': 'inr' };
const PRE_LABEL = /\b(section|sections|sec|s|art|article|articles|para|paragraph|paragraphs|page|pages|pp|p|no|number|case|docket|rule|rules|title|part|chapter|clause|schedule|annex|appendix|exhibit|item|step|version|v|cfr|usc|tier|grade|level|room|floor|unit|line|row|table|figure|fig|form|reg|regulation|act|claim|charge|appeal|request|order|id)\.?\s*$/u;
const UNIT_STOP = new Set(['and', 'or', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'the', 'a', 'an', 'was', 'were', 'is', 'are', 'that', 'which', 'from', 'with', 'as', 'than', 'per', 'cent']);
const unitStem = (w) => w.replace(/(ies)$/u, 'y').replace(/([^s])s$/u, '$1');
export function extractFigures(text) {
  let t = ' ' + fold(text).text.replace(/(\d),(?=\d{3}\b)/gu, '$1') + ' ';
  // Remove dates first, so their numbers are not read as figures.
  t = dropNumericDates(t).replace(/\b\d{4}-\d{2}-\d{2}\b/gu, ' ')
    .replace(new RegExp(`\\b${MON_RE} ${ORD},? \\d{4}\\b|\\b${ORD}(?: of)? ${MON_RE},? \\d{4}\\b|\\b${MON_RE} \\d{4}\\b|\\b${MON_RE} ${ORD}\\b|\\b${ORD} ${MON_RE}\\b`, 'gu'), ' ');
  // "six-week period" -> "six week period"
  t = t.replace(/(\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|ninety|hundred))-(?=\p{L}{3,})/gu, '$1 ');
  // "twenty-five" -> 25
  t = t.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[- ](one|two|three|four|five|six|seven|eight|nine)\b/gu, (x, a, b) => String(NUM_WORDS[a] + NUM_WORDS[b]));
  // "four hundred eighty" -> 480, "two hundred and 21" -> 221 (2026-11-26)
  t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine)\s+hundred(?:\s+(?:and\s+)?(\d{1,2}|[a-z]+))?\b/gu, (x, a, b) => { const tail = b === undefined ? 0 : /^\d+$/u.test(b) ? +b : NUM_WORDS[b]; if (b !== undefined && tail === undefined) return String(NUM_WORDS[a] * 100) + ' ' + b; return String(NUM_WORDS[a] * 100 + (tail || 0)); });
  const out = [];
  const re = new RegExp(`(?:([$£€¥₹])\\s?)?\\b(\\d+(?:\\.\\d+)?|${Object.keys(NUM_WORDS).join('|')})\\b(?:\\s?(${Object.keys(SCALE).join('|')})\\b)?(\\s?(?:%|percent\\b|per cent\\b))?`, 'gu');
  for (const m of t.matchAll(re)) {
    const pre = t.slice(Math.max(0, m.index - 24), m.index);
    const after = t.slice(m.index + m[0].length);
    // Labels and identifiers: "S1", "RMO2", "No. 4", "section 12", "1614.110", "0120181234".
    if (/[\p{L}\d][-/]?$/u.test(pre) && !m[1]) continue;
    if (/^[-/.]?\d|^[\p{L}]/u.test(after) && !m[3] && !m[4]) continue;
    if (!m[1] && PRE_LABEL.test(pre)) continue;
    const word = NUM_WORDS[m[2]];
    let value = word ?? parseFloat(m[2]);
    if (m[3]) value *= SCALE[m[3]];
    const isNumeral = word === undefined;
    if (isNumeral && !m[1] && !m[3] && !m[4] && /^\d{4}$/u.test(m[2]) && value >= 1900 && value <= 2100) continue; // a year
    if (isNumeral && m[2].length >= 6 && !m[1]) continue; // an identifier
    let unit = null;
    if (m[1]) unit = 'money:' + CURRENCY[m[1]];
    else if (m[4]) unit = 'percent';
    else {
      const nx = after.match(/^\s*([\p{L}]+)(?:\s+([\p{L}]+))?/u);
      if (nx && CURRENCY[nx[1]]) unit = 'money:' + CURRENCY[nx[1]];
      else if (nx && !UNIT_STOP.has(nx[1]) && nx[1].length >= 3 && nx[1] !== 'cfr' && !(nx[2] && /^(?:of|to)$/u.test(nx[2]) && /^(?:out|one|some|each|all|most|many|none)$/u.test(nx[1]))) unit = unitStem(nx[1]);
      else if (/^\s*(?:(?:more|fewer|less)\s+)?(?:than\s+)?$/u.test(pre.slice(-12)) && /\b(usd|eur|gbp)\s*$/u.test(pre)) unit = 'money:' + pre.match(/\b(usd|eur|gbp)\s*$/u)[1];
    }
    if (!unit) { const cm = pre.match(/\b(usd|eur|gbp|chf|cad|aud|inr|jpy)\s*$/u); if (cm) unit = 'money:' + cm[1]; }
    if (!unit) continue;
    // A word figure counts only with a counted noun ("three complaints"), not alone ("one of").
    if (!isNumeral && (unit === 'percent' || unit.startsWith('money:')) === false && UNIT_STOP.has(unit)) continue;
    out.push({ value, unit, text: m[0].trim() });
  }
  return out;
}

// 2026-11-25: language. Every check reads English negation, qualification,
// speech and date words. A record or source mostly in another language would
// pass those checks silently, so it is reported instead of passed.
const EN_FUNCTION = new Set(['the', 'and', 'of', 'to', 'in', 'is', 'was', 'that', 'for', 'on', 'with', 'as', 'by', 'it', 'be', 'are', 'were', 'not', 'this', 'from', 'at', 'or', 'an', 'a', 'has', 'had', 'have', 'which', 'he', 'she', 'they', 'his', 'her', 'their', 'its', 'been', 'no', 'but', 'did', 'would', 'should', 'all', 'any', 'there', 'who', 'when', 'after', 'before', 'also', 'into']);
// Common words of other languages; a text is reported only when they outnumber
// the English ones, or when most of its letters are not Latin script (terse
// English notes have few function words but no foreign ones either).
const OTHER_FUNCTION = new Set(['el', 'la', 'los', 'las', 'del', 'que', 'y', 'en', 'por', 'para', 'con', 'una', 'es', 'fue', 'se', 'le', 'les', 'des', 'et', 'est', 'une', 'du', 'dans', 'pour', 'qui', 'pas', 'au', 'sur', 'der', 'die', 'das', 'und', 'ist', 'nicht', 'mit', 'den', 'dem', 'von', 'zu', 'ein', 'eine', 'auf', 'wurde', 'il', 'di', 'che', 'della', 'non', 'per', 'sono', 'da', 'het', 'een', 'van', 'en', 'niet', 'werd', 'o', 'os', 'as', 'um', 'uma', 'não', 'nao', 'foi', 'com', 'em', 'do', 'dos', 'och', 'att', 'är', 'det', 'som', 'og', 'er', 'ikke', 'af', 'z', 'w', 'nie', 'jest', 'się', 'na']);
export function englishShare(text) {
  const letters = (text.match(/\p{L}/gu) || []).length;
  const latin = (text.match(/\p{Script=Latin}/gu) || []).length;
  if (letters >= 60 && latin / letters < 0.5) return 0;
  const toks = (fold(text).text.match(/\p{L}+/gu) || []);
  if (toks.length < 40) return null;
  const en = toks.filter((w) => EN_FUNCTION.has(w)).length, other = toks.filter((w) => OTHER_FUNCTION.has(w) && !EN_FUNCTION.has(w)).length;
  return other > en && other / toks.length >= 0.08 ? en / toks.length : 1;
}

// 2026-11-25: a double negative ("did not fail to report", "not unreasonable",
// "never refused to attend") is affirmative and does not count as a negation.
const DOUBLE_NEG = /\b(not|never|no)\s+(without|fail(?:ed|s)?\s+to|refus(?:ed|es)?\s+to|declin(?:ed|es)?\s+to|den(?:y|ied|ies|ials?)|un[a-z]{4,}|in(?:correct|consistent|valid|appropriate|accurate|significant|substantial|sufficient|adequate|complete|eligible|effective|timely)|im(?:proper|possible|material))\b/gu;
export function stripDoubleNegatives(t) { return t.replace(DOUBLE_NEG, (m0, a, b) => b.replace(/^(?:un|in|im)(?=[a-z]{4,})/u, '').replace(/^(?:without|fail(?:ed|s)?\s+to|refus(?:ed|es)?\s+to|declin(?:ed|es)?\s+to|den(?:y|ied|ies|ials?))$/u, 'with')); }
// 2026-11-25 (Track F, good AI drafts): wording that reads as negative but is not
// a denial, and negative words written as one word.
//   "did not request an audit until August 5"  -> it was requested, on August 5
//   "a coworker (not a supervisor)"             -> an aside naming who, not a denial
//   "unsure", "unaware", "incomplete"           -> "not sure", "not aware", "not complete"
const NEG_PREFIXED = /\b(?:un(disputed|contested|challenged|rebutted|refuted|opposed|sure|aware|willing|clear|known|available|successful|authori[sz]ed|answered|resolved|substantiated|supported|timely|paid|reasonable|fair|safe)|in(sufficient|complete|eligible|accurate|adequate|appropriate|correct|consistent|valid|effective|active)|im(proper|possible|material|partial))\b/gu;
export function polarityText(text) {
  return stripDoubleNegatives(fold(text).text)
    .replace(/\((?:but )?not [^)]{1,60}\)/gu, ' ')
    .replace(/\b(?:did not|didn't|does not|doesn't|was not|were not|not)\s+((?:[\p{L}\p{N}'’“”"-]+\s+){0,14}?)until\b/gu, '$1on')
    // "S1 said no" (an answer), "her denial of reasonable accommodation claim"
    // and "failure to state a claim" (names of a claim and of a ground) are not denials.
    .replace(/\b(said|answered|replied|responded|told (?:him|her|them))\s+no\b/gu, '$1')
    .replace(/\b(?:denial|denials) of ([\p{L} ]{3,40}?)\s+(claims?|complaints?|allegations?)\b/gu, '$1 $2')
    .replace(/\bfail(?:ure|ed|s|ing)? to state a claim\b/gu, 'dismissal ground')
    .replace(NEG_PREFIXED, (m0, a, b, c) => 'not ' + (a || b || c));
}
function polarityNegative(text) { return NEGATION.test(polarityText(text)); }
function hasQualifier(text) { return QUALIFIER.test(fold(text).text); }

function entityTerms(entity) { return [entity.name, ...(entity.aliases || [])].filter((x) => x && x.trim()); }

export function entitiesMentioned(text, entities) {
  const t = ' ' + fold(text).text.replace(/[^\p{L}\p{N}]+/gu, ' ') + ' ';
  const hit = new Set();
  for (const e of entities) for (const term of entityTerms(e)) {
    const f = fold(term).text.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (f && t.includes(' ' + f + ' ')) hit.add(e.entity_id);
  }
  return hit;
}

function propositionWords(text, entities) {
  const exclude = new Set();
  for (const e of entities) for (const term of entityTerms(e)) for (const w of contentWords(term)) exclude.add(w);
  for (const m of MONTHS) exclude.add(m);
  let t = fold(text).text;
  for (const [re, to] of SYNONYMS) t = t.replace(re, to);
  return contentWords(t).filter((w) => !exclude.has(w) && !/^\d+$/.test(w));
}

function restates(claimText, sentText) {
  const cw = contentWords(claimText); if (cw.length < 4) return false;
  const sw = new Set(contentWords(sentText));
  return cw.filter((w) => sw.has(w)).length / cw.length >= 0.9;
}

const NEG_CUE = new RegExp('^(' + NEGATION.source.replace(/^\\b\(|\)\\b\|n't\\b$/gu, '') + ")$|n't$", 'u');
function negatedWords(text, keep) {
  // 2026-11-25 (track F): a negation's reach stops at a comma, semicolon,
  // colon or bracket ("declined this position, believing it ..." does not deny "believing").
  const toks = polarityText(text).match(/[\p{L}\p{N}'’]+|[,;:()]/gu) || [];
  const out = new Set();
  const isP = (t) => /^[,;:()]$/u.test(t);
  toks.forEach((t, i) => {
    if (isP(t) || !NEG_CUE.test(t)) return;
    // Scope: the next three words; for a passive "was denied / were refused",
    // the three words before it instead.
    const passive = /^(denied|declined|rejected|refused|revoked|withdrawn)$/u.test(t) && i > 0 && /^(was|were|been|being|is|are|be)$/u.test(toks[i - 1]);
    if (passive) { for (let j = i - 1, n = 0; j >= 0 && n < 4 && !isP(toks[j]); j--, n++) for (const w of contentWords(toks[j])) if (keep.has(w)) out.add(w); }
    else { for (let j = i + 1, n = 0; j < toks.length && n < 3 && !isP(toks[j]); j++, n++) for (const w of contentWords(toks[j])) if (keep.has(w)) out.add(w); }
    for (const w of contentWords(t)) if (keep.has(w)) out.add(w);
  });
  // Words this text also uses outside every negation ("was fastening his
  // seatbelt ... for not fastening his seatbelt").
  const inScope = new Set();
  toks.forEach((t, i) => {
    if (isP(t) || !NEG_CUE.test(t)) return;
    inScope.add(i);
    for (let j = i + 1, n = 0; j < toks.length && n < 3 && !isP(toks[j]); j++, n++) inScope.add(j);
    for (let j = i - 1, n = 0; j >= 0 && n < 4 && !isP(toks[j]); j--, n++) inScope.add(j);
  });
  out.plain = new Set(); toks.forEach((t, i) => { if (!inScope.has(i)) for (const w of contentWords(t)) out.plain.add(w); });
  return out;
}
const isQuestionText = (t) => /^\W*whether\b/u.test(fold(t).text.trim()) || /\?\s*$/u.test(fold(t).text.trim());
const PRED_NOT = /\b(?:was|were|is|are|been|be)\s+(not\s+)?(?:a|an|the)\s+([\p{L}\p{N}' -]{3,40}?)(?=\s+(?:of|for|at|in|with|from|during|on|who|which|that)\b|[,.;:()]|$)/gu;
function predicates(t) { const out = []; for (const m of polarityText(t).matchAll(PRED_NOT)) out.push({ neg: !!m[1], words: contentWords(m[2]).join(' ') }); return out; }
function predicateFlip(a, b) {
  const pa = predicates(a), pb = predicates(b);
  return pa.some((x) => x.words && pb.some((y) => y.words === x.words && y.neg !== x.neg));
}
// A word-by-word reversal test (a shared word negated on one side and stated
// plainly on the other) was tried on track F and removed: even in its strict
// form it cut good drafts passing from 24 to 18 of 60 for 3 more catches, and
// every false alarm read was a fair rewording ("could not lift" for "would not
// be able to lift"). See tests/ds-n1/BLIND_SPOTS.md.
function directFlip(a, b) {
  const ta = polarityText(a).match(/[\p{L}\p{N}'’]+|[,;:()]/gu) || [];
  const tb = new Set(); const nb = negatedWords(b, new Set(contentWords(b)));
  for (const w of nb.plain) tb.add(w);
  for (let i = 0; i < ta.length; i++) {
    if (!/^(not|never)$/u.test(ta[i])) continue;
    for (let j = i + 1; j < Math.min(ta.length, i + 3); j++) { const w = contentWords(ta[j]); if (w.length) { if (w[0].length >= 5 && tb.has(w[0]) && !nb.has(w[0])) return true; break; } }
  }
  return false;
}
function scopedConflict(a, b) {
  // Names and roles (capitalised words: "Supervisor", "Complainant", "Agency")
  // say who is involved, not what is denied, so they are left out of the words
  // a negation is checked against.
  // Capitalised words that do not open a sentence (written without lookbehind).
  const capsInside = (t) => [...t.matchAll(/\b\p{Lu}[\p{L}'’-]*/gu)].filter((m) => m.index > 0 && !/[.!?]\s$/u.test(t.slice(Math.max(0, m.index - 2), m.index))).map((m) => m[0]);
  const names = new Set([a, b].flatMap((t) => capsInside(t).flatMap((w) => contentWords(w))));
  const aw = new Set(contentWords(a)), shared = new Set(contentWords(b).filter((w) => aw.has(w) && !names.has(w)));
  if (shared.size < 2) {
    // 2026-11-25 (track F): little in common, but a negation on one side that
    // touches none of the other side's words is about something the other side
    // does not mention ("issued an Order ... as Complainant failed to provide a
    // completed affidavit"), so it is not a contradiction.
    // Names and roles count here: "was not employed as a Rural Carrier" denies the role the other side gives.
    const allA = new Set(contentWords(a)), allB = new Set(contentWords(b));
    const nA = negatedWords(a, allA), nB = negatedWords(b, allB);
    const reachesOther = (neg, other) => [...neg].some((w) => other.has(w));
    if ((nA.size || nB.size) && !(nA.size && nB.size) && !reachesOther(nA, new Set(contentWords(b))) && !reachesOther(nB, new Set(contentWords(a)))) return { claim: false, source: false };
    return null;
  }
  const na0 = negatedWords(a, shared), nb0 = negatedWords(b, shared);
  // A word a text also states plainly is not denied by that text as a whole.
  const na = new Set([...na0].filter((w) => !(na0.plain.has(w) && !nb0.has(w))));
  const nb = new Set([...nb0].filter((w) => !(nb0.plain.has(w) && !na0.has(w))));
  if (!na.size && !nb.size) return { claim: false, source: false };
  const onlyA = [...na].filter((w) => !nb.has(w)), onlyB = [...nb].filter((w) => !na.has(w));
  // A conflict needs a shared word negated on one side only, on at least two
  // shared words or on a word next to the negation itself.
  if (!onlyA.length && !onlyB.length) return { claim: na.size > 0, source: nb.size > 0 };
  return { claim: onlyA.length > 0 || (na.size > 0 && !onlyB.length), source: onlyB.length > 0 || (nb.size > 0 && !onlyA.length) };
}

let CPS_KEY = null, CPS_VAL = null;
function recordCps(t) { if (t !== CPS_KEY) { CPS_KEY = t; CPS_VAL = [...t]; } return CPS_VAL; }

// A cited passage counts as related when it shares at least a fifth of the
// statement's key terms (or more than one of them) with the statement.
function related(assessments) {
  return assessments.some((a) => { const c = (a.checks || []).find((x) => x.check === 'proposition_overlap'); return c && (c.ratio >= 0.2 || (c.shared || []).length >= 2); });
}

function fid(parts) { return 'F-' + sha256(parts.join('|')).slice(0, 12); }

function finding(code, base, explanation, question, evidence) {
  const rule = RULES[code];
  return {
    finding_id: fid([base.claim_id || '-', String(base.revision ?? 0), code, String(base.citation_index ?? '-'), base.source_id || '-', base.scope || '-']),
    code,
    severity: rule.severity,
    condition: rule.condition,
    condition_name: CONDITIONS[rule.condition],
    claim_id: base.claim_id || null,
    claim_revision: base.revision ?? null,
    citation_index: base.citation_index ?? null,
    source_id: base.source_id || null,
    record_span: base.record_span || null,
    source_span: base.source_span || null,
    explanation,
    question,
    evidence: evidence || {},
    origin: 'rule:' + code,
  };
}

const short = (s, n = 120) => { const c = codePoints(s); return c.length > n ? c.slice(0, n).join('') + '...' : s; };

export function locateClaim(recordText, quote) {
  const exact = [];
  let from = 0;
  const cps = codePoints(recordText);
  // exact search (all occurrences) on code points
  const q = codePoints(nfc(quote));
  for (let i = from; i + q.length <= cps.length; i++) {
    let ok = true;
    for (let j = 0; j < q.length; j++) if (cps[i + j] !== q[j]) { ok = false; break; }
    if (ok) exact.push({ start: i, end: i + q.length });
  }
  if (exact.length) return { hits: exact, match: 'exact' };
  const folded = findAll(recordText, quote);
  return { hits: folded, match: folded.length ? 'normalised' : 'none' };
}

// Assess one citation against its source. Returns { assessment, findings }.
export function assessCitation(record, claim, claimText, citation, index, base) {
  const out = [];
  const b = { ...base, citation_index: index, source_id: citation.source_id };
  const source = record.sources.find((s) => s.source_id === citation.source_id);
  const assessment = {
    citation_index: index, source_id: citation.source_id, quote: citation.quote,
    source_found: !!source, source_digest: source ? source.digest : null, source_version: source ? source.version : null,
    quote_match: 'none', source_span: null, source_sentence: null, relevance: 'NOT_ESTABLISHED', checks: [],
  };
  if (!source) {
    out.push(finding('SOURCE_MISSING', b,
      `Claim ${claim.claim_id} cites source "${citation.source_id}", which is not in the source inventory for this record.`,
      `Which document is "${citation.source_id}", and can it be added to the record so the passage can be checked?`,
      { cited_source_id: citation.source_id, inventory: record.sources.map((s) => s.source_id) }));
    return { assessment, findings: out };
  }
  let hits = [];
  const ex = exactIndexOf(source.text, citation.quote);
  if (ex >= 0) { hits = [{ start: ex, end: ex + codePoints(citation.quote).length }]; assessment.quote_match = 'exact'; }
  else { hits = findAll(source.text, citation.quote); if (hits.length) assessment.quote_match = 'normalised'; }
  if (!hits.length) {
    const elsewhere = record.sources.filter((s) => s.source_id !== source.source_id && findAll(s.text, citation.quote).length).map((s) => s.source_id);
    out.push(finding('QUOTE_NOT_FOUND', b,
      `The quoted passage "${short(citation.quote)}" does not appear in ${source.source_id} (${source.title}, version ${source.version}).`
        + (elsewhere.length ? ` The same words appear in ${elsewhere.join(', ')}, so the citation may name the wrong source.` : ''),
      elsewhere.length
        ? `Is ${elsewhere.join(' or ')} the source intended for this statement, rather than ${source.source_id}?`
        : `Where in ${source.source_id} does this passage appear, or which source contains it?`,
      { source_digest: source.digest, appears_in: elsewhere }));
    return { assessment, findings: out };
  }
  const span = hits[0];
  assessment.source_span = span;
  b.source_span = span;
  const sent = sentenceContaining(source.text, span.start, span.end);
  assessment.source_sentence = { start: sent.start, end: sent.end, text: sent.text };

  // Polarity: compare the claim with the source CLAUSE that contains the quote
  // (from the last , ; : before the quote to the first , ; : after it, or the
  // sentence end), so a quote that trims off a preceding "not" or stops just
  // before a following one ("evaluation of X" in "evaluation of X was not
  // completed") is still caught, while a negation in a separate trailing clause
  // (", with no findings") is not misread.
  const sentCps = codePoints(sent.text);
  const qs = span.start - sent.start, qe = span.end - sent.start;
  let cs = 0;
  for (let i = qs - 1; i >= 0; i--) if (/[,;:]/u.test(sentCps[i])) { cs = i + 1; break; }
  let ce = sentCps.length;
  for (let i = qe; i < sentCps.length; i++) if (/[,;:]/u.test(sentCps[i])) { ce = i; break; }
  const clause = sentCps.slice(cs, ce).join('');
  // For a permission sentence in a cited standard or policy ("may authorize
  // assistants that route work without deciding outcomes"), only the part up to
  // and including the permission decides polarity; a limit that follows it
  // narrows the power, it does not deny it.
  const pm = claim.kind === 'authority' ? GAP_PERMISSION.exec(fold(clause).text) : null;
  // 2026-11-25 (real records): a statement that restates the whole source
  // sentence is compared with the whole sentence, not only the clause the
  // citation was narrowed to ("X failed to ..., therefore Y" is one statement).
  const wholeSentence = !pm && restates(claimText, sent.text) && restates(sent.text, claimText);
  let polClause = pm ? fold(clause).text.slice(0, pm.index + pm[0].length) : wholeSentence ? sent.text : clause;
  // 2026-11-25 (track F): "he claimed he was unaware of it, but they later
  // learned he was very well aware of it": when the statement matches one side
  // of a "but" or "however", polarity is read on that side.
  if (!pm && (CONTRAST.test(fold(polClause).text) || (polarityNegative(claimText) !== polarityNegative(polClause) && /\b(and|while)\b/u.test(fold(polClause).text)))) {
    const splitter = CONTRAST.test(fold(polClause).text) ? /\b(?:but|however|although|though|yet|whereas)\b/u : /\b(?:and|while)\b/u;
    const parts = fold(polClause).text.split(splitter).filter((x) => x.trim());
    const cws = new Set(contentWords(claimText));
    const hit = (x) => contentWords(x).filter((w) => cws.has(w)).length;
    const whole = hit(polClause);
    const best = parts.reduce((m, x) => (hit(x) > hit(m) ? x : m), parts[0] || '');
    // 2026-11-26 (track G): never keep a half that leaves out the word the
    // statement negates ("requested light duty, and the request was not granted").
    const negA = negatedWords(claimText, new Set(contentWords(claimText)));
    const elsewhere = [...negA].some((w) => parts.some((x) => x !== best && contentWords(x).includes(w)) && !contentWords(best).includes(w));
    if (parts.length > 1 && whole && hit(best) >= 0.8 * whole && !elsewhere) polClause = best;
  }
  // 2026-11-25 (real records): compare negation on what the two texts share. A
  // negation that only touches words one side does not have ("..., which she
  // refused") is extra content, not a contradiction. A shared word negated on one
  // side and not the other is a conflict; with nothing shared, compare overall.
  // The shared-word test can only clear a conflict the overall test finds; it never adds one.
  const scoped = scopedConflict(claimText, polClause);
  const cNeg0 = polarityNegative(claimText), sNeg0 = polarityNegative(polClause);
  // The citation may be narrowed to one clause while the negation the claim
  // repeats sits elsewhere in the same source sentence ("offered X, but she
  // declined"); compare against the whole sentence too before reporting.
  const scopedWhole = sent.text !== polClause ? scopedConflict(claimText, sent.text) : null;
  // 2026-11-25 (track F): "was not the Nurse Manager" against "was the Nurse
  // Manager": the denied thing is a role or name, which the shared-word test
  // leaves out, so a reversed "is / is not" of the same role is never cleared.
  const roleFlip = predicateFlip(claimText, polClause);
  const cleared = !roleFlip && cNeg0 !== sNeg0 && ((scoped && scoped.claim === scoped.source) || (scopedWhole && scopedWhole.claim === scopedWhole.source && polarityNegative(sent.text) === cNeg0));
  // Both texts read as negative (or both affirmative) overall, but one says a
  // person "was not the" role the other says they "were" (2026-11-25, track F).
  const flipped = cNeg0 === sNeg0 && !isQuestionText(claimText) && roleFlip;
  const cNeg = cNeg0, sNeg = flipped ? !cNeg0 : cleared ? cNeg0 : sNeg0;
  if (flipped) assessment.checks.push({ check: 'polarity_word_flip', words: 'role' });
  assessment.checks.push({ check: 'polarity', claim_negative: cNeg, source_negative: sNeg, source_clause: clause, result: cNeg === sNeg ? 'consistent' : 'conflict' });
  // A statement phrased as an open question ("Whether Complainant offered
  // evidence of ...") asserts nothing that can contradict the source.
  const isQuestion = /^\W*whether\b/u.test(fold(claimText).text.trim()) || /\?\s*$/u.test(fold(claimText).text.trim());
  if (cNeg !== sNeg && isQuestion) assessment.checks.push({ check: 'polarity_skipped', reason: 'statement is a question' });
  // A source sentence that reports an allegation ("filed a complaint alleging
  // that the Agency discriminated") is not contradicted by a statement of the
  // outcome; that is a question for the reviewer, not a serious finding.
  const allegationOnly = /\balleg\w*\b/u.test(fold(polClause).text) && !/\balleg\w*\b/u.test(fold(claimText).text);
  if (cNeg !== sNeg && !isQuestion && allegationOnly) {
    out.push(finding('POSSIBLE_CONTRADICTION', b,
      `The cited passage reports an allegation ("${short(polClause, 200)}"); the statement, which is ${cNeg ? 'negative' : 'affirmative'}, may describe the outcome rather than contradict it.`,
      `Does the statement describe what was alleged, or what was found?`,
      { source_clause: clause, source_sentence: sent.text }));
  }
  if (cNeg !== sNeg && !isQuestion && !allegationOnly) {
    out.push(finding('NEGATION_CONFLICT', b,
      `The cited clause reads "${short(clause, 200)}". It is ${sNeg ? 'negative' : 'affirmative'} where the claim is ${cNeg ? 'negative' : 'affirmative'}, so the passage may contradict the claim rather than support it.`,
      `Does this passage say the same thing as the statement, or does it say the opposite?`,
      { source_clause: clause, source_sentence: sent.text }));
  }

  // The two sentences either side of the cited one (2026-11-25, real records):
  // a summary often takes the name or the date from a neighbouring sentence
  // ("On May 5 she complained. She was moved." -> "She was moved after
  // complaining on May 5"; "S1 met her. He then ...").
  const allSents = sentences(source.text);
  const at = allSents.findIndex((x) => x.start <= sent.start && x.end >= sent.start);
  const near = at >= 0 ? allSents.slice(Math.max(0, at - 2), at + 3).map((x) => x.text).join(' ') : sent.text;
  // Subject / actor.
  // 2026-11-25 (Track F): only people and organisations can be a different
  // subject. Headings, laws, documents and the adjudicator who reports a finding
  // ("The AJ found that ...") are not the actor of the statement.
  const actorLike = new Set(record.entities.filter((e) => !NON_ACTOR.test(fold(e.name).text)).map((e) => e.entity_id));
  const claimActors = new Set([...entitiesMentioned(claimText, record.entities)].filter((a) => actorLike.has(a)));
  if (claim.actor && actorLike.has(claim.actor)) claimActors.add(claim.actor);
  // 2026-11-26: the person reporting ("S1 stated that two coworkers ...") is
  // not the subject of what is reported, unless the statement names them too.
  const reporter = new Set(record.entities.filter((e) => entityTerms(e).some((term) => {
    const f = fold(term).text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^\\W*(?:the\\s+)?${f}\\b[^.;:]{0,40}?\\b(?:stated|said|averred|testified|explained|noted|indicated|asserted|maintained|contended|claimed|reported|acknowledged|confirmed|recalled|added)\\b`, 'u').test(fold(sent.text).text);
  })).map((e) => e.entity_id));
  const sentActors = new Set([...entitiesMentioned(sent.text, record.entities)].filter((a) => actorLike.has(a) && !reporter.has(a)));
  if (claimActors.size) {
    const shared = [...claimActors].filter((a) => sentActors.has(a));
    const name = (id) => (record.entities.find((e) => e.entity_id === id) || {}).name || id;
    if (shared.length) assessment.checks.push({ check: 'actor', result: 'consistent', actors: shared });
    else if (sentActors.size) {
      assessment.checks.push({ check: 'actor', result: 'conflict', claim: [...claimActors], source: [...sentActors] });
      out.push(finding('SUBJECT_MISMATCH', b,
        `The claim concerns ${[...claimActors].map(name).join(', ')}, but the cited passage in ${source.source_id} concerns ${[...sentActors].map(name).join(', ')}.`,
        `Does this passage concern the same person or organisation as the statement?`,
        { claim_actors: [...claimActors], source_actors: [...sentActors], source_sentence: sent.text }));
    } else if ([...claimActors].every((a) => entitiesMentioned(near, record.entities).has(a))) {
      assessment.checks.push({ check: 'actor', result: 'named_in_neighbouring_sentence', actors: [...claimActors] });
    } else {
      assessment.checks.push({ check: 'actor', result: 'not_established' });
      out.push(finding('ACTOR_NOT_ESTABLISHED', b,
        `The cited passage does not name who acted, so it does not establish that ${[...claimActors].map(name).join(', ')} is the actor described in the claim.`,
        `Which part of the record identifies who took this action?`,
        { claim_actors: [...claimActors], source_sentence: sent.text }));
    }
  }

  // The label on the statement's own line ("**June 20, 2021**: Manager ...",
  // "May 3, 2018: the Branch Chief ...") or a heading line directly above it
  // dates the statement although its own words do not (2026-11-25, track F).
  let labelText = '';
  if (base.record_span && record.text) {
    const cps = recordCps(record.text);
    const upto = cps.slice(Math.max(0, base.record_span.start - 400), base.record_span.start).join('');
    const lines = upto.split('\n');
    const same = lines[lines.length - 1] || '';
    // Only a real label: bold text or a short lead ending in a colon, with no
    // full sentence in it (a one-paragraph record is not a label).
    const LIST = /^\s*(?:[-*\u2022]|\d{1,2}[.)]|\(?[a-z]\))\s+/u;
    const isLabel = (x) => x.trim().length > 0 && x.length < 140 && !/[.!?]["”’)]?\s+\S/u.test(x.replace(LIST, '')) && /\*\*[^*]+\*\*\s*:?\s*$|:\s*(?:\*\*)?\s*$|^\s*(?:[-*\u2022]|\d{1,2}[.)]|\(?[a-z]\))\s+.*:\s*$/u.test(x);
    labelText = isLabel(same) ? same : '';
    if (!same.trim() && lines.length >= 2) {
      const above = lines[lines.length - 2] || '';
      if (/^\s{0,3}#{1,6}\s|^\s*(?:[-*]\s+|\d{1,2}[.)]\s+)?\*\*[^*]+\*\*\s*:?\s*(?:\([^)]{0,40}\))?\s*$|:\s*$/u.test(above)) labelText = above;
    }
  }
  for (const d of extractDates(labelText).filter((x) => !extractDates(claimText).includes(x))) {
    const given = sourceDates(source.text);
    const nearD = extractDates(near);
    if (nearD.includes(d)) { assessment.checks.push({ check: 'label_date', date: d, result: 'present' }); continue; }
    const slip = nearShift(d, extractDates(sent.text));
    if (!slip && (given.has(d) || given.has('--' + d.slice(5)))) { assessment.checks.push({ check: 'label_date', date: d, result: 'present_in_source' }); continue; }
    if (!nearD.length) { assessment.checks.push({ check: 'label_date', date: d, result: 'not_compared' }); continue; }
    assessment.checks.push({ check: 'label_date', date: d, result: 'not_in_source', source_dates: nearD });
    out.push(finding('DATE_MISMATCH', { ...b, scope: 'label:' + d },
      `The label of this statement dates it to ${d}. That date appears nowhere in ${source.source_id}; the cited passage gives ${nearD.join(', ')}.`,
      `Which date is correct: ${d}, or ${nearD.join(' / ')} as the source gives?`,
      { claim_date: d, label: labelText.trim().slice(0, 200), source_dates: nearD, source_sentence: sent.text }));
  }
  for (const x of impossibleDates(claimText + ' ' + labelText)) {
    out.push(finding('DATE_IMPOSSIBLE', { ...b, scope: 'impossible:' + x },
      `The statement gives "${x}", which is not a real date.`,
      `Which date is meant, and which document gives it?`, { written: x, source_sentence: sent.text }));
  }
  // Dates and event roles.
  const claimDates = new Set(extractDates(claimText));
  if (claim.event) claimDates.add(claim.event.date);
  const sentDates = new Set(extractDates(sent.text));
  for (const d of [...claimDates].sort()) {
    const role = claim.event && claim.event.date === d ? claim.event.role : null;
    const evs = source.events || [];
    if (role && evs.length) {
      const exact = evs.find((e) => e.role === role && e.date === d);
      const sameDate = evs.filter((e) => e.date === d && e.role !== role);
      const sameRole = evs.filter((e) => e.role === role && e.date !== d);
      if (exact) { assessment.checks.push({ check: 'event', date: d, role, result: 'consistent' }); continue; }
      if (sameDate.length) {
        assessment.checks.push({ check: 'event', date: d, role, result: 'role_conflict', source_roles: sameDate.map((e) => e.role) });
        out.push(finding('EVENT_ROLE_CONFUSION', b,
          `The claim treats ${d} as the ${role} date. In ${source.source_id}, ${d} is recorded as the ${sameDate.map((e) => e.role).join(' / ')} date`
            + (sameRole.length ? `, and the ${role} is recorded on ${sameRole.map((e) => e.date).join(', ')}.` : '.'),
          `Is ${d} the date of the ${role}, or the date of the ${sameDate[0].role}?`,
          { claim_event: { role, date: d }, source_events: evs }));
      } else if (sameRole.length) {
        assessment.checks.push({ check: 'event', date: d, role, result: 'date_conflict', source_dates: sameRole.map((e) => e.date) });
        out.push(finding('DATE_MISMATCH', b,
          `The claim dates the ${role} to ${d}; ${source.source_id} records the ${role} on ${sameRole.map((e) => e.date).join(', ')}.`,
          `Which date is correct for the ${role}, and which document establishes it?`,
          { claim_event: { role, date: d }, source_events: evs }));
      } else {
        assessment.checks.push({ check: 'event', date: d, role, result: 'not_established' });
        out.push(finding('DATE_NOT_ESTABLISHED', b,
          `${source.source_id} records no ${role} event and no event on ${d}.`,
          `Which document records when the ${role} took place?`,
          { claim_event: { role, date: d }, source_events: evs }));
      }
    } else if (sentDates.has(d)) {
      const sentFold = fold(sent.text).text;
      const at = sentFold.indexOf(d);
      const before = at >= 0 ? sentFold.slice(0, at).trim().split(/\s+/).slice(-4).join(' ') : '';
      const claimedCue = role ? cueOf(role.split('_')[0]) : null;
      const nearCue = before ? cueOf(before) : null;
      if (role && claimedCue && nearCue && nearCue !== claimedCue) {
        assessment.checks.push({ check: 'event', date: d, role, result: 'role_conflict_by_text', words_before_date: before });
        out.push(finding('EVENT_ROLE_CONFUSION', b,
          `The claim treats ${d} as the ${role} date, but in ${source.source_id} that date is attached to a different event ("${before} ${d}").`,
          `Is ${d} the date of the ${role}, or of the event the source attaches it to?`,
          { claim_event: { role, date: d }, source_sentence: sent.text, words_before_date: before }));
      } else if (role) {
        assessment.checks.push({ check: 'event', date: d, role, result: 'date_present_role_unverified' });
        out.push(finding('DATE_ROLE_UNVERIFIED', b,
          `${d} appears in the cited sentence, but the source has no structured event record, so DS-N1 cannot confirm that ${d} is the ${role} date rather than another event.`,
          `Does ${d} in this passage refer to the ${role}, or to a different event?`,
          { source_sentence: sent.text }));
      } else assessment.checks.push({ check: 'date', date: d, result: 'present' });
    } else if (!role && extractDates(near).includes(d) && !(restates(claimText, sent.text) && nearShift(d, [...sentDates].filter((x) => !claimDates.has(x))))) {
      assessment.checks.push({ check: 'date', date: d, result: 'present_in_neighbouring_sentence' });
    } else if (!role && nearShift(d, [...sentDates].filter((x) => !claimDates.has(x))) && (!sourceDates(source.text).has(d) || restates(claimText, sent.text))) {
      const slip = nearShift(d, [...sentDates].filter((x) => !claimDates.has(x)));
      assessment.checks.push({ check: 'date', date: d, result: 'near_miss', source_date: slip });
      out.push(finding('DATE_MISMATCH', { ...b, scope: d },
        `The statement gives ${d}; the cited sentence in ${source.source_id} gives ${slip} for what reads as the same event.`,
        `Which date is correct, ${d} or ${slip}?`,
        { claim_date: d, source_dates: [slip], source_sentence: sent.text }));
    } else if (!role && !sourceDates(source.text).has(d) && !sourceDates(source.text).has('--' + d.slice(5)) && extractDates(near).length) {
      // 2026-11-25 (Track F): a date the source gives nowhere, cited to a passage
      // that dates the matter differently, is a wrong date, not a missing one.
      const given = extractDates(near);
      assessment.checks.push({ check: 'date', date: d, result: 'not_in_source', source_dates: given });
      out.push(finding('DATE_MISMATCH', { ...b, scope: d },
        `The statement gives ${d}. That date appears nowhere in ${source.source_id}; the cited passage gives ${given.join(', ')}.`,
        `Which date is correct: ${d}, or ${given.join(' / ')} as the source gives?`,
        { claim_date: d, source_dates: given, source_sentence: sent.text }));
    } else {
      assessment.checks.push({ check: 'date', date: d, result: 'not_established' });
      out.push(finding('DATE_NOT_ESTABLISHED', { ...b, scope: d },
        `The claim states ${d}, but that date does not appear in the cited passage of ${source.source_id}.`,
        `Which document establishes the date ${d}?`,
        { claim_date: d, source_sentence: sent.text, source_dates: [...sentDates] }));
    }
  }

  // A date written without a year that is one to three days from the date the
  // cited sentence gives, in the same month (2026-11-25).
  for (const md of yearlessDates(claimText)) {
    const sd = [...extractDates(sent.text).map((x) => '--' + x.slice(5)), ...yearlessDates(sent.text)];
    if (sd.includes(md) || sourceDates(source.text).has(md) || [...sourceDates(source.text)].some((x) => x.endsWith(md.slice(2)))) continue;
    const day = +md.slice(5), mon = md.slice(2, 4);
    const slip = sd.find((x) => x.slice(2, 4) === mon && Math.abs(+x.slice(5) - day) <= 3 && x !== md);
    if (slip) out.push(finding('DATE_MISMATCH', { ...b, scope: 'md:' + md },
      `The statement gives ${md.slice(2)} (month-day, no year); the cited sentence in ${source.source_id} gives ${slip.slice(2)}.`,
      `Which day is correct, and which document gives it?`, { claim_date: md, source_dates: [slip], source_sentence: sent.text }));
  }
  // Figures (2026-11-25). A figure in the statement is checked against the
  // figures the cited sentence and its neighbours give for the same thing.
  {
    const cf = extractFigures(claimText);
    if (cf.length) {
      const sf = extractFigures(sent.text), nf = extractFigures(near);
      // A figure the source gives anywhere counts as given: which sentence was
      // cited is a separate question (relevance), not a different figure.
      const allF = extractFigures(source.text);
      const loose = new Set((fold(source.text).text.replace(/(\d),(?=\d{3}\b)/gu, '$1').match(/\d+(?:\.\d+)?/gu) || []).map(Number));
      const sentWords = new Set(contentWords(sent.text).filter((w) => !/^\d/u.test(w)));
      // Number words ("six" for "6") and the units counted are left out: they are the figure, not what it is about.
      const unitWords = new Set(cf.map((f) => f.unit.replace(/^money:/u, '')));
      const cwn = contentWords(claimText).filter((w) => !/^\d/u.test(w) && !(w in NUM_WORDS) && ![...unitWords].some((u) => u && (w.startsWith(u) || u.startsWith(w))));
      let close = cwn.length ? cwn.filter((w) => sentWords.has(w)).length / cwn.length : 0;
      // 2026-11-26: a list item ("Sitting: 6 hours maximum") is too short for the
      // overlap test; it counts as restating the sentence when its first word,
      // the thing measured, is there.
      if (cwn.length && cwn.length <= 3 && sentWords.has(cwn[0])) close = Math.max(close, 0.6);
      // Durations and counts are often worked out by the writer ("four days
      // after the decision"), so only an amount or a percentage the source never
      // gives is asked about; for those, a different figure is still a mismatch.
      const MEASURE = /^(money:|percent$)/u;
      const STRICT_UNIT = /^(money:|percent$|day$|week$|month$|year$|hour$|minute$)/u;
      for (const f of cf) {
        const eq = (x) => Math.abs(x.value - f.value) < 1e-9;
        // Standalone numbers only: not the parts of "1614.105(a)(5)", "S5" or "GS-13".
        const nearLoose = new Set(standaloneNumbers(fold(near).text.replace(/(\d),(?=\d{3}\b)/gu, '$1'), /[\p{L}\d)\/]|\.\d/u));
        // In order: when the statement restates the cited sentence and both give
        // the same number of figures of this kind, the figures are compared
        // position by position ("$350 for 101.3 hours at $350 per hour" against
        // "$35,862.85 for 101.3 hours at $350 per hour").
        // Every figure of every kind must line up, so a stray reading ("two
        // currently working") never shifts the comparison.
        const mine = cf.filter((x) => x.unit === f.unit), theirs = sf.filter((x) => x.unit === f.unit);
        const pos = mine.indexOf(f);
        const aligned = cf.length === sf.length && cf.every((x, k) => x.unit === sf[k].unit);
        if (close >= 0.8 && aligned && pos >= 0 && !eq(theirs[pos])) {
          assessment.checks.push({ check: 'figure', figure: f.text, unit: f.unit, result: 'conflict_in_order', source_figure: theirs[pos].text });
          out.push(finding('NUMBER_MISMATCH', { ...b, scope: `${f.unit}:${f.value}:${pos}` },
            `The statement gives ${f.text} where the cited sentence in ${source.source_id} gives ${theirs[pos].text} (figure ${pos + 1} of ${mine.length} of this kind, in the same order).`,
            `Which figure is correct here, ${f.text} or ${theirs[pos].text}?`,
            { claim_figure: f, source_figures: [theirs[pos]], source_sentence: sent.text }));
          continue;
        }
        // The same value counts as given when the source gives it as the same
        // kind of figure, or as a bare number; not when it gives it as something
        // else ("90-day suspension" does not give "90 percent").
        // Counts of people or things are read less strictly than amounts,
        // percentages and periods: the word after a count is often not the thing
        // counted ("two currently working"), so any equal number nearby will do.
        const strict = STRICT_UNIT.test(f.unit);
        const sameValue = nf.filter(eq);
        if (sameValue.some((x) => x.unit === f.unit || !strict) || (!sameValue.length && nearLoose.has(f.value))) {
          assessment.checks.push({ check: 'figure', figure: f.text, unit: f.unit, result: 'present' });
          continue;
        }
        const other = sf.filter((x) => x.unit === f.unit);
        const otherNear = nf.filter((x) => x.unit === f.unit);
        // The statement clearly restates the cited sentence and that sentence
        // gives a different figure for the same thing: a mismatch, even when the
        // statement's figure turns up somewhere else in the source.
        // 2026-11-26: the figure may sit in a neighbouring sentence the statement
        // restates ("available for download for 30 days" one sentence on); a
        // different figure of the same kind there is a mismatch even when the
        // statement's figure appears elsewhere in the decision for something else.
        if (strict && !other.length) {
          const cws = new Set(cwn);
          const nb = allSents.slice(Math.max(0, at - 2), at + 3).map((x) => x.text).filter((t) => t !== sent.text)
            .map((t) => ({ t, figs: extractFigures(t).filter((x) => x.unit === f.unit), k: cwn.length ? contentWords(t).filter((w) => cws.has(w)).length / cwn.length : 0 }))
            .filter((x) => x.figs.length && !x.figs.some(eq) && x.k >= 0.5).sort((a, b) => b.k - a.k)[0];
          if (nb) {
            assessment.checks.push({ check: 'figure', figure: f.text, unit: f.unit, result: 'conflict_in_neighbouring_sentence', source_figures: nb.figs.map((x) => x.text) });
            out.push(finding('NUMBER_MISMATCH', { ...b, scope: `${f.unit}:${f.value}:near` },
              `The statement gives ${f.text}; the neighbouring sentence it restates in ${source.source_id} gives ${nb.figs.map((x) => x.text).join(', ')}.`,
              `Which figure is correct, ${f.text} or ${nb.figs.map((x) => x.text).join(' / ')}?`,
              { claim_figure: f, source_figures: nb.figs, source_sentence: nb.t }));
            continue;
          }
        }
        if (!(strict && other.length && close >= 0.6) && (allF.some(eq) || loose.has(f.value))) {
          assessment.checks.push({ check: 'figure', figure: f.text, unit: f.unit, result: 'present_elsewhere_in_source' });
          continue;
        }
        if (other.length && close >= 0.6) {
          assessment.checks.push({ check: 'figure', figure: f.text, unit: f.unit, result: 'conflict', source_figures: other.map((x) => x.text) });
          out.push(finding('NUMBER_MISMATCH', { ...b, scope: `${f.unit}:${f.value}` },
            `The statement gives ${f.text}; the cited sentence in ${source.source_id} gives ${other.map((x) => x.text).join(', ')} for the same thing.`,
            `Which figure is correct, ${f.text} or ${other.map((x) => x.text).join(' / ')}, and which document establishes it?`,
            { claim_figure: f, source_figures: other, source_sentence: sent.text }));
        } else if (strict && close >= 0.6 && !allF.some(eq) && !loose.has(f.value) && sentBare(sent.text).some((v) => v !== f.value)) {
          // 2026-11-26: the cited sentence gives the same thing as a bare number
          // ("age (52)") and the statement a different one ("age (104 years old)").
          const bare = sentBare(sent.text).filter((v) => v !== f.value);
          assessment.checks.push({ check: 'figure', figure: f.text, unit: f.unit, result: 'conflict_with_bare_number', source_numbers: bare });
          out.push(finding('NUMBER_MISMATCH', { ...b, scope: `${f.unit}:${f.value}:bare` },
            `The statement gives ${f.text}, which appears nowhere in ${source.source_id}; the cited sentence gives ${bare.join(', ')}.`,
            `Which figure is correct, ${f.text} or ${bare.join(' / ')}?`,
            { claim_figure: f, source_numbers: bare, source_sentence: sent.text }));
        } else if (MEASURE.test(f.unit)) {
          assessment.checks.push({ check: 'figure', figure: f.text, unit: f.unit, result: 'not_established', source_figures: otherNear.map((x) => x.text) });
          out.push(finding('NUMBER_NOT_ESTABLISHED', { ...b, scope: `${f.unit}:${f.value}` },
            `The statement gives ${f.text}, but the cited passage of ${source.source_id} does not give that figure`
              + (otherNear.length ? ` (it gives ${otherNear.map((x) => x.text).join(', ')}).` : '.'),
            `Which document establishes the figure ${f.text}?`,
            { claim_figure: f, source_figures: otherNear, source_sentence: sent.text }));
        } else assessment.checks.push({ check: 'figure', figure: f.text, unit: f.unit, result: 'count_not_compared' });
      }
    }
  }
  // An all-number date that reads two ways (03/04/2024: 3 April or March 4).
  for (const a of ambiguousDates(claimText)) {
    const inSource = a.readings.filter((r) => extractDates(near).includes(r));
    out.push(finding('DATE_FORMAT_AMBIGUOUS', { ...b, scope: a.text },
      `The statement writes the date as ${a.text}, which reads as ${a.readings.join(' or ')} depending on the reader's country`
        + (inSource.length === 1 ? `; the source gives ${inSource[0]}.` : '.'),
      `Should the date be written with the month in words (for example ${inSource[0] || a.readings[0]}), so readers in every country read the same date?`,
      { written: a.text, readings: a.readings, source_reading: inSource.length === 1 ? inSource[0] : null }));
  }

  // What the reader already has when reaching this statement: the nearest
  // heading or label above it and the two sentences before it in the record
  // (a bullet under "S1's account:" or "On July 19, 2018:" carries that speaker
  // or date without repeating it). 2026-11-25, real records.
  let before = '';
  if (base.record_span && record.text) {
    const cps = recordCps(record.text);
    const upto = cps.slice(Math.max(0, base.record_span.start - 3000), base.record_span.start).join('');
    const lines = upto.split('\n');
    const head = [...lines].reverse().find((l) => /^\s{0,3}#{1,6}\s|^\s*(?:[-*]\s+)?\*\*[^*]+\*\*|:\s*$/u.test(l)) || '';
    const prev = sentences(upto).slice(-2).map((x) => x.text).join(' ');
    before = head + ' ' + prev;
  }
  // Date omitted: the cited sentence dates the event and the statement does not.
  // Only when the statement restates most of that sentence, so a short statement
  // that cites one clause of a long sentence is not asked about every date in it.
  {
    const sentWords = new Set(contentWords(sent.text));
    const cw = contentWords(claimText);
    const overlap = cw.length ? cw.filter((w) => sentWords.has(w)).length / Math.max(sentWords.size, 1) : 0;
    if (overlap >= 0.5) {
      const claimDateSet = new Set([...extractDates(claimText), ...ambiguousDates(claimText).flatMap((a) => a.readings)]);
      const claimMonths = new Set([...monthDates(claimText), ...[...claimDateSet].map((d) => d.slice(0, 7))]);
      const dropped = [...new Set(extractDates(sent.text))].filter((d) => !claimDateSet.has(d))
        .concat(monthDates(sent.text).filter((m) => !claimMonths.has(m)));
      const beforeDates = new Set(extractDates(before));
      for (const m of monthDates(before)) beforeDates.add(m);
      if (dropped.length && !claimDateSet.size && !dropped.every((d) => beforeDates.has(d))) {
        out.push(finding('DATE_OMITTED', { ...b, scope: dropped.join(',') },
          `The cited sentence in ${source.source_id} dates this to ${dropped.join(', ')}; the statement gives no date.`,
          `Should the statement keep the date the source gives (${dropped.join(', ')}), so a later reviewer can place it in time?`,
          { dropped_dates: dropped, source_sentence: sent.text }));
      }
      // 2026-11-26: when the statement's own speaker is unidentified ("an
      // individual noted that ... the Agency's ..."), a role it merely mentions
      // is not the speaker; only roles it attributes speech to count.
      const claimRoles = GENERIC_SPEAKER.test(fold(claimText).text) ? speakersIn(claimText) : rolesNamed(claimText);
      // An explicitly unidentified speaker ("an individual stated") does not borrow one from context.
      const beforeRoles = GENERIC_SPEAKER.test(fold(claimText).text) ? new Set() : rolesNamed(before);
      const droppedSpeakers = [...speakersIn(sent.text)].filter((r) => !claimRoles.has(r) && !beforeRoles.has(r));
      // A statement that says who spoke in its own words ("the supervisor said",
      // "she testified") keeps the attribution; only an unattributed statement, or
      // one whose speaker is unidentified ("someone", "an individual"), drops it.
      const ctf = fold(claimText).text;
      const ownAttribution = SPEECH_ANY.test(ctf) && !GENERIC_SPEAKER.test(ctf);
      if (droppedSpeakers.length && !ownAttribution) {
        out.push(finding('SPEAKER_OMITTED', { ...b, scope: droppedSpeakers.join(',') },
          `The cited sentence in ${source.source_id} attributes this to ${droppedSpeakers.join(', ')}; the statement does not say who said it.`,
          `Who made this statement? The source attributes it to ${droppedSpeakers.join(', ')}.`,
          { dropped_speakers: droppedSpeakers, source_sentence: sent.text }));
      }
    }
  }

  // Qualification omitted.
  if (hasQualifier(sent.text) && !hasQualifier(claimText)) {
    out.push(finding('QUALIFICATION_OMITTED', b,
      `The source sentence carries a qualification ("${short(sent.text, 200)}") that the claim does not repeat.`,
      `Should the statement carry the condition or limitation stated in the source?`,
      { source_sentence: sent.text }));
  }

  // Contrary clause after the quote ("..., but the results were not accepted").
  const rest = sentCps.slice(qe).join('');
  const cm = CONTRAST.exec(fold(rest).text);
  if (cm && polarityNegative(fold(rest).text.slice(cm.index)) && !polarityNegative(claimText)) {
    out.push(finding('CONTRARY_CLAUSE_OMITTED', b,
      `The cited sentence continues after the quoted words with a contrary statement ("${short(rest.trim(), 200)}") that the claim does not mention.`,
      `Does the rest of this sentence change what the statement can rely on?`,
      { source_sentence: sent.text, continuation: rest.trim() }));
  }

  // Topical relevance (lexical proxy, documented limitation).
  let cw = propositionWords(claimText, record.entities);
  let sw = new Set(propositionWords(sent.text, record.entities));
  // 2026-11-26 (track F flag review): when names and roles leave fewer than
  // three words to compare ("Complainant worked as a City Carrier Technician
  // at the Village Station"), the names are compared too; otherwise a word-for-
  // word copy of the source scored no overlap at all.
  if (cw.length < 3) {
    const all = contentWords(claimText).filter((w) => !/^\d+$/u.test(w) && !MONTHS.includes(w));
    if (all.length >= 2) { cw = all; sw = new Set(contentWords(sent.text)); }
  }
  const overlap = cw.filter((w) => sw.has(w));
  const ratio = cw.length ? overlap.length / cw.length : 0;
  assessment.checks.push({ check: 'proposition_overlap', ratio: Math.round(ratio * 1000) / 1000, shared: overlap, claim_terms: cw });
  // 2026-11-25: "granted under the supplier access standard, section 4" is
  // supported by that standard when the cited sentence is the one giving the
  // power to approve; such a sentence rarely repeats the claim's other words.
  const ct0 = fold(claimText).text;
  const im = GAP_INSTRUMENT.exec(ct0);
  const core = im ? im[1].trim().replace(/^(the|its|our)\s+/u, '').replace(/^(?:(?:section|clause|article|paragraph|part)\s+[\w.]+\s+of\s+)?(?:the\s+)?/u, '') : '';
  const instrumentBasis = Boolean(core) && claim.kind === 'authority' && fold(source.title).text.includes(core) && GAP_PERMISSION.test(fold(sent.text).text);
  if (instrumentBasis) assessment.checks.push({ check: 'instrument_permits', instrument: core });
  const relevant = (cw.length > 0 && ratio >= 0.5) || instrumentBasis;
  if (!relevant) {
    // 2026-11-25 (real records): when the cited passage is not about the
    // statement, comparing its wording (negation, qualification, contrary
    // clause, subject) with the statement means nothing; report one problem,
    // that the passage does not concern the statement, not several.
    for (let i = out.length - 1; i >= 0; i--) if (['NEGATION_CONFLICT', 'QUALIFICATION_OMITTED', 'CONTRARY_CLAUSE_OMITTED', 'SUBJECT_MISMATCH'].includes(out[i].code)) out.splice(i, 1);
    out.push(finding('RELEVANCE_NOT_ESTABLISHED', b,
      `The quoted words are present in ${source.source_id}, but the passage ("${short(sent.text, 200)}") shares little of the claim's substance`
        + ` (${overlap.length} of ${cw.length} key terms). Presence of a quotation is not support for the claim.`,
      `Does this passage concern the same matter as the statement it is cited for?`,
      { source_sentence: sent.text, shared_terms: overlap, claim_terms: cw }));
  }
  // Calibration (2026-11-25, paraphrase hold-out 3 protocol): with a weak match
  // (under 60% of the statement's key terms in the cited sentence), a negation
  // or subject difference may come from citing the wrong passage.
  if (ratio < 0.6 && !instrumentBasis) {
    for (let i = 0; i < out.length; i++) {
      const f = out[i];
      // 2026-11-26: a plain "not" directly before a word the cited clause states
      // without negation ("was not appointed" against "appointed") stays serious.
      if (f.code === 'NEGATION_CONFLICT' && directFlip(claimText, polClause)) continue;
      if (f.code === 'NEGATION_CONFLICT' || f.code === 'SUBJECT_MISMATCH') {
        const code = f.code === 'NEGATION_CONFLICT' ? 'POSSIBLE_CONTRADICTION' : 'POSSIBLE_SUBJECT_MISMATCH';
        out[i] = { ...f, code, severity: RULES[code].severity, condition: RULES[code].condition, origin: `rule:${code}`,
          explanation: `${f.explanation} The cited passage shares only part of the statement's terms, so it may not be the passage the statement relies on.` };
      }
    }
  }
  const blocking = out.some((f) => f.severity === 'critical');
  assessment.relevance = blocking ? (out.some((f) => f.code === 'NEGATION_CONFLICT') ? 'CONTRADICTS' : 'CONFLICTS')
    : (relevant && !out.some((f) => ['DATE_NOT_ESTABLISHED', 'ACTOR_NOT_ESTABLISHED', 'NUMBER_NOT_ESTABLISHED'].includes(f.code)) ? 'SUPPORTS' : 'NOT_ESTABLISHED');
  return { assessment, findings: out };
}

// Assess one claim (original or a reviewer revision).
export function assessClaim(record, claim, revision, allClaimsSupport) {
  const findings = [];
  const claimText = revision ? revision.text : claim.quote;
  const citations = revision ? revision.citations : claim.citations;
  const reasoning = revision && revision.reasoning !== undefined ? revision.reasoning : claim.reasoning;
  const revNo = revision ? revision.revision : 0;
  const loc = locateClaim(record.text, claim.quote);
  // A claim may say which occurrence of a repeated sentence it is (set by the
  // extractor, which knows where it read the sentence).
  const pinned = Number.isInteger(claim.occurrence) && loc.hits[claim.occurrence] ? loc.hits[claim.occurrence] : null;
  const record_span = pinned || loc.hits[0] || null;
  const base = { claim_id: claim.claim_id, revision: revNo, record_span };
  if (!loc.hits.length) {
    findings.push(finding('CLAIM_NOT_IN_RECORD', base,
      `Claim ${claim.claim_id} quotes "${short(claim.quote)}", which does not appear in the record text.`,
      `Where in the record does this statement appear?`, {}));
  } else if (loc.hits.length > 1 && !pinned) {
    findings.push(finding('CLAIM_LOCATION_AMBIGUOUS', base,
      `The claim text appears ${loc.hits.length} times in the record; DS-N1 anchored it to the first occurrence.`,
      `Which occurrence of this statement is being reviewed?`, { occurrences: loc.hits }));
  }
  const assessments = [];
  citations.forEach((ct, i) => {
    const r = assessCitation(record, claim, claimText, ct, i, base);
    assessments.push(r.assessment);
    findings.push(...r.findings);
  });
  const supports = assessments.filter((a) => a.relevance === 'SUPPORTS');
  const idRefs = reasoning ? [...new Set((reasoning.match(/\b[A-Za-z0-9][A-Za-z0-9._-]*\b/g) || []).filter((t) => t !== claim.claim_id && allClaimsSupport.has(t)))] : [];
  // A supported claim also counts as referenced when the reasoning restates it:
  // at least two, and at least half, of that claim's proposition terms appear.
  const contentRefs = [];
  if (reasoning && allClaimsSupport instanceof Map) {
    const rw = new Set(propositionWords(reasoning, record.entities));
    for (const [id, text] of allClaimsSupport) {
      if (id === claim.claim_id || idRefs.includes(id)) continue;
      const tw = propositionWords(text, record.entities);
      const hit = tw.filter((w) => rw.has(w)).length;
      if (hit >= 2 && hit / tw.length >= 0.5) contentRefs.push(id);
    }
  }
  const reasoningRefs = [...idRefs, ...contentRefs];

  // 2026-11-26 (tracks F and FH): in an investigation report an approval is
  // usually an event being told ("Supervisor1 approved this request as well"),
  // not the record's own authority. With a related cited passage that does not
  // contradict it, that is a question for the reviewer, not untraceable authority.
  const narratedApproval = claim.kind === 'authority' && !supports.length && record.record_class === 'workplace_investigation_report'
    && !assessments.some((a) => a.relevance === 'CONTRADICTS' || a.relevance === 'CONFLICTS') && related(assessments);
  if (narratedApproval) {
    findings.push(finding('SUPPORT_NOT_CONFIRMED', base,
      `Claim ${claim.claim_id} reports an approval ("${short(claimText)}") and cites a related passage, but the passage's wording does not confirm it as written.`,
      `Does the cited passage record this approval? If not, which document does?`, { citations: citations.length, narrated_approval: true }));
  } else if (claim.kind === 'authority' && !supports.length) {
    findings.push(finding('UNTRACEABLE_AUTHORITY', base,
      `Claim ${claim.claim_id} asserts an authority or approval ("${short(claimText)}") but no cited source in the record supports it.`,
      `Which document records this approval, and who gave it?`, { citations: citations.length }));
  } else if (claim.kind === 'conclusion') {
    // A conclusion the cited source itself states, nearly word for word, is the
    // source's conclusion reported by the record; its reasoning is the source's.
    const restatesSource = supports.some((a) => a.source_sentence && restates(claimText, a.source_sentence.text));
    if (!reasoning && !restatesSource) {
      findings.push(finding('REASONING_NOT_TRACED', base,
        `Claim ${claim.claim_id} is a conclusion, but the record does not state the reasoning that connects the documented facts to it.`,
        `What documented reasoning connects the facts in this record to this conclusion?`, {}));
    }
    if (!supports.length && !reasoningRefs.length) {
      findings.push(finding('UNSUPPORTED_CLAIM', base,
        `Conclusion ${claim.claim_id} has no supporting source and its reasoning does not refer to any supported claim in the record.`,
        `Which identified source or established fact supports this conclusion?`, { reasoning_references: reasoningRefs }));
    }
  } else if (!citations.length) {
    findings.push(finding('UNSUPPORTED_CLAIM', base,
      `Claim ${claim.claim_id} ("${short(claimText)}") is not linked to any source.`,
      `Which identified source supports this statement?`, {}));
  } else if (!supports.length && !assessments.some((a) => a.relevance === 'CONTRADICTS' || a.relevance === 'CONFLICTS') && related(assessments)) {
    findings.push(finding('SUPPORT_NOT_CONFIRMED', base,
      `Claim ${claim.claim_id} cites a related passage, but its wording does not confirm the statement as written.`,
      `Does the cited passage say what the statement says? If not, which source does?`, { citations: citations.length }));
  } else if (!supports.length && !assessments.some((a) => a.relevance === 'CONTRADICTS' || a.relevance === 'CONFLICTS')) {
    findings.push(finding('UNSUPPORTED_CLAIM', base,
      `Claim ${claim.claim_id} cites ${citations.length} passage(s), but none of them establishes support for the statement as written.`,
      `Which identified source supports this statement as written?`, { citations: citations.length }));
  }

  const contradicted = assessments.some((a) => a.relevance === 'CONTRADICTS' || a.relevance === 'CONFLICTS');
  const supported = !contradicted && (supports.length > 0 || (claim.kind === 'conclusion' && reasoningRefs.length > 0 && !!reasoning));
  return {
    summary: {
      claim_id: claim.claim_id, kind: claim.kind, revision: revNo, text: claimText, original_text: claim.quote,
      record_span, location_match: loc.match, reasoning: reasoning || null, reasoning_references: reasoningRefs,
      reasoning_references_by_id: idRefs, reasoning_references_by_content: contentRefs,
      citations: assessments,
      support: contradicted ? 'CONTRADICTED_OR_CONFLICTING' : supported ? 'SUPPORTED_AS_CITED' : 'NOT_SUPPORTED',
      // DS-N1 never decides sufficiency.
      sufficiency: supported ? 'HUMAN_JUDGMENT_REQUIRED' : 'NOT_ESTABLISHED',
    },
    findings,
  };
}

// Record-level detection over sentences that no claim covers, and over
// instruction-like content in record or sources.
export function assessRecordLevel(record, claimSpans) {
  const findings = [];
  const covered = (s) => claimSpans.some((c) => c && c.start < s.end && c.end > s.start);
  const unassessed = [];
  for (const s of sentences(record.text)) {
    if (covered(s)) continue;
    if (ASSERTION.test(fold(s.text).text)) {
      findings.push(finding('UNMAPPED_ASSERTION', { record_span: { start: s.start, end: s.end }, scope: `${s.start}-${s.end}` },
        `This sentence makes an assertion ("${short(s.text, 200)}") that is not mapped to a claim or a source, so a later reviewer cannot trace its basis.`,
        `Which identified source supports this sentence, or should it be marked as the author's own account?`,
        { sentence: s.text }));
    } else unassessed.push({ start: s.start, end: s.end });
  }
  const scan = [{ where: 'record', id: record.record_id, text: record.text }, ...record.sources.map((s) => ({ where: 'source', id: s.source_id, text: s.text }))];
  // 2026-11-25: the checks read English words; a text mostly in another
  // language is reported rather than silently passed.
  for (const item of scan) {
    const share = englishShare(item.text || '');
    if (share !== null && share < 0.15) {
      findings.push(finding('LANGUAGE_NOT_SUPPORTED', { source_id: item.where === 'source' ? item.id : null, scope: `${item.where}:${item.id}:language` },
        `The ${item.where} ${item.id} does not appear to be in English (common words of another language outnumber English ones, or most letters are not Latin script). DS-N1's checks for negation, conditions, speakers and dates read English words, so they cannot be relied on for this text.`,
        `Is an English version of this ${item.where} available, or should a person who reads its language check it?`,
        { english_function_word_share: Math.round(share * 1000) / 1000 }));
    }
  }
  for (const item of scan) {
    for (const s of sentences(item.text)) {
      if (INSTRUCTION.test(fold(s.text).text) || ROLE_LABEL.test(fold(s.text).text)) {
        findings.push(finding('INSTRUCTION_LIKE_CONTENT', { source_id: item.where === 'source' ? item.id : null, scope: `${item.where}:${item.id}:${s.start}`, source_span: item.where === 'source' ? { start: s.start, end: s.end } : null, record_span: item.where === 'record' ? { start: s.start, end: s.end } : null },
          `The ${item.where} ${item.id} contains text phrased as an instruction to a reviewing system ("${short(s.text, 160)}"). DS-N1 treated it as data and it did not change any assessment. Its presence in a record is itself worth examining.`,
          `Why does this ${item.where} contain an instruction addressed to a review tool, and who added it?`,
          { sentence: s.text }));
      }
    }
  }
  return { findings, unassessed_sentences: unassessed };
}

// Practitioner-gap checks (2026-11-25). Rule for which gaps stop a record: a
// gap raised by at least one in four of the 23 practitioners who gave points
// in the blind study (developer-coded): a bare assessment with no stated basis
// (14 of 23), a recommendation stated as a requirement (10), a cited policy or
// standard that is not supplied (8), and a conclusion that does not follow (7).
// Each is a review finding: the record cannot reach READY until a reviewer
// resolves it or overrides it with a written reason.
const GAP_FIRM = /\b(subject to|required|requires|must|mandatory|enforced|shall)\b/u;
const GAP_HEDGE = /\b(recommended|recommends|should|may|optional|advised|suggested|considered|encouraged)\b/u;
const GAP_RESULT = /\b(found|rated|assessed|deemed|considered|judged)\b.{0,40}\b(acceptable|satisfactory|adequate|low|fine|appropriate|compliant)\b|\bno (significant |material |major )?(issues|concerns|findings|risks?)\b/u;
const GAP_BASIS = /\b(criteria|checklist|methods?|methodology|tested|examined|scored|sampled|because|based on|interview\w*|evidence|scope|sensitivity|certification|closed|controls? (were|was)|weigh\w*|against the)\b/u;
const GAP_BROAD = /\b(administrator|admin|full|unrestricted|privileged|root|super-?user|superuser)\s+(access|rights|privileges|permissions|account)\b/u;
const GAP_REASON = /\b(because|in order to|so that|needed for|required for|for the purpose|purpose of|to (carry out|perform|complete|support|migrate|move|install|configure|fix|repair|run|upgrade))\b|\bfor (?:the |a |an )?[\p{L}' -]{0,40}?\b(project|migration|audit|upgrade|implementation|investigation|move|transfer|testing|rollout|cutover|recovery)\b/u;
const GAP_PERMISSION = /\b(may|can|is authori[sz]ed to|has authority to|is entitled to)\s+(approve|authori[sz]e|grant|sign off)\b|\bdelegat\w*|\bapproval limit\b/u;
const GAP_INSTRUMENT = /\b(?:under|pursuant to|in accordance with)\s+(?:the\s+|its\s+|our\s+)?([\p{L}\d' -]{0,40}?\b(?:standard|policy|procedure|regulation|rules|delegation|charter|framework))\b/u;

export function assessPractitionerGaps(record, claims, findings) {
  const out = [];
  const byId = new Map(claims.map((c) => [c.claim_id, c]));
  const src = (id) => record.sources.find((s) => s.source_id === id);
  const sents = (t) => sentences(t).map((x) => ({ ...x, f: fold(x.text).text }));
  const span = (c) => (byId.get(c.claim_id) || {}).record_span || null;
  const allSrcText = fold(record.sources.map((s) => s.text).join(' ')).text;

  for (const c of record.claims) {
    const text = (byId.get(c.claim_id) || {}).text || c.quote;
    const ct = fold(text).text;
    // 1. A recommendation in the source stated as a requirement in the record.
    if (GAP_FIRM.test(ct) && !GAP_HEDGE.test(ct)) {
      for (const [i, cit] of (c.citations || []).entries()) {
        const s = src(cit.source_id); if (!s) continue;
        const q = fold(cit.quote || '').text;
        const hedged = sents(s.text).find((x) => q && (x.f.includes(q) || q.includes(x.f)) && GAP_HEDGE.test(x.f) && !GAP_FIRM.test(x.f));
        if (hedged) {
          out.push(finding('RECOMMENDATION_STATED_AS_REQUIREMENT', { claim_id: c.claim_id, citation_index: i, source_id: s.source_id, record_span: span(c), source_span: { start: hedged.start, end: hedged.end } },
            `The record states this as a requirement, but the cited source only recommends it ("${short(hedged.text, 200)}").`,
            'Was this made a binding condition, by whom and where is that recorded, or should the record say it is only recommended?',
            { source_sentence: hedged.text }));
          break;
        }
      }
    }
    // 2. A bare result ("found the risk acceptable") resting on a source that gives no basis.
    if (GAP_RESULT.test(ct)) {
      for (const [i, cit] of (c.citations || []).entries()) {
        const s = src(cit.source_id); if (!s) continue;
        const st = fold(s.text).text;
        if (GAP_RESULT.test(st) && !GAP_BASIS.test(st)) {
          out.push(finding('CONCLUSORY_ASSESSMENT', { claim_id: c.claim_id, citation_index: i, source_id: s.source_id, record_span: span(c) },
            `The assessment relied on (${s.title}) states a result but not what was examined, against which criteria, or by whom.`,
            'What did the assessment examine, against which criteria, who carried it out and when?',
            { source_title: s.title }));
          break;
        }
      }
    }
    // 3. A policy, standard or delegation cited as the authority but not supplied.
    // The check is for a record that relies on a document as its authority. A
    // sentence reporting that something was NOT done under a policy, reporting
    // what a party alleged, or naming a legal test is not that (real decisions).
    const ctf = fold(ct).text;
    if (/\bnot\b[^.;]{0,80}\b(under|pursuant to|in accordance with)\b/u.test(ctf)
      || /^\W*(according to\s+)?(the\s+)?(complainant|petitioner|appellant|claimant|grievant)\b[^.;]{0,40}?\b(stated|maintained|alleged|asserted|contended|claimed|averred|argued|said)\b|^\W*according to\b/u.test(ctf)
      || /\blegal (standard|test|framework)\b/u.test(ctf)) continue;
    const m = GAP_INSTRUMENT.exec(ct);
    if (m) {
      const name = m[1].trim().replace(/^(the|its|our)\s+/u, '');
      // "section 4 of the finance automation policy" names the same document as a
      // source titled "Finance automation policy, section 4".
      const core = name.replace(/^(?:(?:section|clause|article|paragraph|part)\s+[\w.]+\s+of\s+)?(?:the\s+)?/u, '');
      // Matched on document titles only: a document that merely mentions the policy is not the policy.
      const supplied = record.sources.some((s) => fold(s.title).text.includes(core));
      if (!supplied) {
        out.push(finding('AUTHORITY_TEXT_NOT_SUPPLIED', { claim_id: c.claim_id, record_span: span(c), scope: name },
          `The record relies on "${name}" as its authority, but that document is not among the sources, so a reviewer cannot check what it requires or permits.`,
          `Can the relevant part of the ${name} be added, so its requirements can be checked against this decision?`,
          { instrument: name }));
      }
    }
  }
  // 6. Broad access (administrator, full, privileged) with no stated reason
  // (8 of 24 practitioners asked why that level of access was needed).
  const broad = record.claims.find((c) => GAP_BROAD.test(fold((byId.get(c.claim_id) || {}).text || c.quote).text));
  if (broad && !GAP_REASON.test(fold(record.text).text)) {
    out.push(finding('BROAD_ACCESS_NOT_JUSTIFIED', { claim_id: broad.claim_id, record_span: span(broad), scope: 'broad-access' },
      'The record grants broad access (administrator, full or privileged) but does not say why that level of access is needed or for what work.',
      'What work needs this level of access, and why would narrower access not do?', {}));
  }
  // 4. Approver entitlement is reported as an advisory note (detection-templates:
  // approver_entitlement_not_shown), not a finding: only 4 of 23 practitioners
  // raised it, below the one-in-four threshold used for findings.
  return out;
}

// 5. A conclusion resting on statements whose findings are still unresolved.
// Computed after reviewer actions are applied (session.mjs), so it clears as
// soon as the statements it relies on are resolved.
export function conclusionOnUnresolvedBasis(record, claims, unresolvedClaimIds) {
  const out = [];
  const byId = new Map(claims.map((c) => [c.claim_id, c]));
  for (const c of record.claims.filter((x) => x.kind === 'conclusion')) {
    const basis = record.claims.filter((x) => x.kind !== 'conclusion');
    const reasoning = fold(c.reasoning || '').text;
    const named = basis.filter((x) => new RegExp(`\\b${x.claim_id.toLowerCase()}\\b`, 'u').test(reasoning));
    const open = (named.length ? named : basis).filter((x) => unresolvedClaimIds.has(x.claim_id)).map((x) => x.claim_id);
    if (!open.length) continue;
    out.push(finding('CONCLUSION_ON_UNRESOLVED_BASIS', { claim_id: c.claim_id, record_span: (byId.get(c.claim_id) || {}).record_span || null, scope: open.join(',') },
      `The conclusion rests on statements that have unresolved findings (${open.join(', ')}), so it does not yet follow from what the record shows.`,
      'Once those findings are resolved, does the conclusion still follow, and is its wording supported?',
      { relies_on_flagged: open }));
  }
  return out;
}

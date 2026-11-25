// DS-N1 document extraction (2026-11-24).
//
// Turns plain text into a ds-n1.record/1.0 package, so a reviewer no longer has
// to hand-build claims and citations before DS-N1 can run. Input: the decision
// record as written, and the source documents it relies on, each as plain text
// with a title. Output: the record package plus an extraction report that says,
// for every claim, how each field was derived and which ones a person should
// confirm before relying on the review.
//
// Design rules, matching the rest of DS-N1:
//   - Deterministic and offline. No model calls, no network. The same input
//     always yields byte-identical output.
//   - Never invents support. A citation is attached only when a source sentence
//     shares enough of the claim's content; otherwise the claim is left uncited
//     and the review will say so. A citation chosen by similarity is marked
//     "inferred" in the report, because the record author did not choose it.
//   - Explicit references win. If a claim names a document (by an identifier
//     such as "VRA-19" or by its title), only that document is searched.
//   - The record text is never rewritten. Every claim quote is an exact span of
//     the record; every citation quote is an exact sentence of its source.
//
// Limits, stated rather than hidden: a sentence is split into two claims only
// when it joins two complete clauses with "; " or ", and " (splitClauses);
// other compound sentences stay one claim; kinds, event roles and actors
// come from documented word cues and can be wrong; tables, scanned images and
// footnotes are not parsed. The report marks every inferred field.

import { nfc, sentences, contentWords, fold, findAll } from './text.mjs';
import { extractDates } from './assess.mjs';
import { validateRecord } from './record.mjs';

export const EXTRACTOR_VERSION = 'ds-n1.extract/0.2.0-dev';

// Minimum share of a claim's content words that a source sentence must contain
// before it is offered as support. Chosen on the developer fixtures and
// recorded in tests/ds-n1/EXTRACT_EVAL.json; never tuned on study records.
export const MIN_SUPPORT = 0.34;

const INSTRUMENT_TITLE = /\b(standard|policy|procedure|regulation|rules|delegation|charter|framework)\b/u;
const PERMISSION = /\b(may|can|is authori[sz]ed to|has authority to|is entitled to)\s+(approve|authori[sz]e|grant|sign off)\b|\bdelegat\w*|\bapproval limit\b/u;

const CONCLUSION = /\b(therefore|thus|accordingly|consequently|hence|as a result|it follows)\b|^because\b|\b(can|may|should|will) (proceed|remain|continue|stay|be (finali[sz]ed|approved|closed|relied))\b|\b(we|i) (conclude|recommend|find)\b|\bis (justified|appropriate|warranted|controlled)\b/u;
const AUTHORITY = /\b(approv\w*|authori[sz]\w*|grant(ed|s)?|sign(ed)? off|signed|under (the )?[\w -]*(standard|policy|section|clause|rule|procedure|delegation)|pursuant to|in accordance with|delegat\w*)\b/u;
const SEQUENCE_VERB = /\b(request\w*|submit\w*|receiv\w*|sent|filed|opened|started|began|completed|finished|closed|issued)\b/u;

// Words before or after a date that name the event it belongs to. Role names
// contain the engine's own cue stems (assess.mjs ROLE_CUES), so a role chosen
// here is read the same way by the review.
const ROLE_RULES = [
  [/\b(until|expir\w*|ends?|end date|valid through|through)\b/u, 'expiry'],
  [/\bsubmit\w*\b/u, 'submitted_for_approval'],
  [/\brequest\w*\b/u, 'request'],
  [/\b(approv\w*|authori[sz]\w*|grant\w*|sign(ed)? off)\b/u, 'approval'],
  [/\b(evaluat\w*)\b/u, 'evaluation_completed'],
  [/\b(assess\w*|risk review)\b/u, 'assessment_completed'],
  [/\bcomplet\w*\b/u, 'assessment_completed'],
  [/\breceiv\w*\b/u, 'received'],
  [/\breview\w*\b/u, 'review'],
  [/\bdue\b/u, 'due'],
  [/\bsent\b/u, 'sent'],
];

// Capitalised words that open sentences or name document types, not parties.
const NOT_A_NAME = new Set(('On In At By For From The This That These Those A An And Or But If When While After Before '
  + 'Access Vendor Exception Approval Approved Request Requested Risk Assessment Section Standard Policy Memo Report Record '
  + 'Decision Review Summary Evaluation Document Documents Form Note Notes Multi Factor Authentication Third Party '
  + 'January February March April May June July August September October November December '
  + 'Monday Tuesday Wednesday Thursday Friday Saturday Sunday It He She They We I Our Their Its No Not All Any Each '
  + 'Because Therefore Thus However Although Under Per Pursuant According Following Subject Payroll System Administrator').split(' '));

function wordsOf(s) { return fold(s).text.match(/[\p{L}\p{N}-]+/gu) || []; }

// Document identifiers such as "AR-REQ-82", "VRA-19", "EX-82", "AM-12".
function identifiers(s) {
  return [...new Set((String(s).match(/\b[A-Z]{1,6}(?:-[A-Z0-9]{1,6})*-\d{1,6}\b/g) || []))];
}

// "Completed" alone does not say what was completed; read the sentence so the
// claim and its source always receive the same label for the same wording.
function refineCompletion(role, sentenceText) {
  if (role !== 'assessment_completed' && role !== 'evaluation_completed') return role;
  return /\bevaluat/iu.test(sentenceText) ? 'evaluation_completed' : 'assessment_completed';
}

function roleFor(sentenceText, date) {
  return refineCompletion(roleForRaw(sentenceText, date), sentenceText);
}

function roleForRaw(sentenceText, date) {
  const t = fold(sentenceText).text;
  const at = t.indexOf(date);
  if (at < 0) return null;
  // Text between this date and the neighbouring dates, so a role is not borrowed
  // from another event in the same sentence.
  const others = extractDates(sentenceText).filter((d) => d !== date).map((d) => t.indexOf(d)).filter((i) => i >= 0);
  const prevDate = Math.max(-1, ...others.filter((i) => i < at));
  const nextDate = Math.min(t.length, ...others.filter((i) => i > at));
  const before = t.slice(prevDate < 0 ? 0 : prevDate + 10, at).split(/\s+/).slice(-12).join(' ');
  const after = t.slice(at + date.length, nextDate).split(/\s+/).slice(0, 10).join(' ');
  // The event word nearest the date decides its role: the last cue before the
  // date, or failing that the first cue after it ("On 2026-07-14, X approved
  // Y's request" is an approval date, not a request date).
  const nearest = (text, last) => {
    let pick = null;
    for (const [re, role] of ROLE_RULES) {
      const g = new RegExp(re.source, 'gu');
      for (const m of text.matchAll(g)) {
        if (!pick || (last ? m.index > pick.at : m.index < pick.at)) pick = { at: m.index, role };
      }
    }
    return pick ? pick.role : null;
  };
  return nearest(before, true) || nearest(after, false);
}

function findEntities(texts) {
  const counts = new Map();
  for (const text of texts) {
    for (const m of String(text).matchAll(/\b([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){1,2})\b/g)) {
      const parts = m[1].split(/\s+/);
      while (parts.length && NOT_A_NAME.has(parts[0])) parts.shift();
      while (parts.length && NOT_A_NAME.has(parts[parts.length - 1])) parts.pop();
      if (parts.length < 2 || parts.some((p) => NOT_A_NAME.has(p))) continue;
      const name = parts.join(' ');
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
  const names = [...counts.keys()].sort();
  // "the Administrative Judge (AJ)": the letters in brackets are the same name.
  const all = texts.join(' ');
  return names.map((name, i) => {
    const m = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(([A-Z]{2,6})\\)`).exec(all);
    return m ? { entity_id: `E${i + 1}`, name, aliases: [m[1]] } : { entity_id: `E${i + 1}`, name };
  });
}

function mentions(text, entity) { return new RegExp(`\\b${entity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text); }

function classify(text) {
  const t = fold(text).text;
  if (CONCLUSION.test(t)) return { kind: 'conclusion', basis: 'conclusion wording' };
  if (AUTHORITY.test(t)) return { kind: 'authority', basis: 'approval or authority wording' };
  if (extractDates(text).length && SEQUENCE_VERB.test(t)) return { kind: 'chronology', basis: 'dated event' };
  return { kind: 'fact', basis: 'default' };
}

function reasoningOf(text) {
  const m = /^\s*because\s+(.+?),\s+(.+)$/iu.exec(text);
  if (m) return m[1].trim();
  const n = /^(.+?)[,;]?\s+(so|therefore|thus|hence)\s+(.+)$/iu.exec(text);
  if (n && n[1].split(/\s+/).length >= 4) return n[1].trim();
  return null;
}

function supportScore(claimWords, claimDates, sentText) {
  if (!claimWords.length) return 0;
  const sw = new Set(contentWords(sentText));
  let hit = 0;
  for (const w of claimWords) if (sw.has(w)) hit++;
  let score = hit / claimWords.length;
  const sd = new Set(extractDates(sentText));
  if (claimDates.some((d) => sd.has(d))) score += 0.2;
  return score;
}

// The smallest exact span of a source sentence that covers every word it shares
// with the claim. Citing the whole sentence would also cite unrelated clauses
// (a "no" in "with no high-risk findings" would read as contradicting a claim
// about completion). Falls back to the whole sentence when the shared words
// are too few to bound a meaningful passage.
function supportingSpan(claimWords, claimDates, sentText, claimText = '') {
  const want = new Set(claimWords);
  const toks = [...sentText.matchAll(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)];
  const hits = toks.filter((m) => { const cw = contentWords(m[0]); return (cw.length && cw.some((w) => want.has(w))) || claimDates.includes(m[0]); });
  if (hits.length < 2) return sentText;
  // A record sentence that restates the whole source sentence is cited to the
  // whole sentence, so a date or a speaker in another clause stays in the citation.
  if (claimText) {
    const sw = contentWords(sentText), cwSet = new Set(contentWords(claimText));
    const sInC = sw.filter((w) => cwSet.has(w)).length / Math.max(sw.length, 1);
    const cInS = claimWords.filter((w) => new Set(sw).has(w)).length / Math.max(claimWords.length, 1);
    if (sInC >= 0.9 && cInS >= 0.9) return sentText;
  }
  // Stay inside one clause: pick the comma- or semicolon-bounded clause holding
  // the most shared words, so a neighbouring clause is never cited by accident.
  const bounds = [0];
  for (const m of sentText.matchAll(/[,;:]\s+/gu)) bounds.push(m.index + 1);
  bounds.push(sentText.length);
  let bestClause = null;
  for (let i = 0; i + 1 < bounds.length; i++) {
    const inside = hits.filter((h) => h.index >= bounds[i] && h.index < bounds[i + 1]);
    if (!bestClause || inside.length > bestClause.length) bestClause = inside;
  }
  // A claim that itself turns on a contrast or a negation ("heard X, but did not
  // hear Y") must keep every clause it draws on, or the cited passage changes its sense.
  const claimHasTurn = /\b(but|however|although|though|yet|not|no|never|without|except|unless)\b/iu.test(claimText);
  if (!claimHasTurn && bestClause && bestClause.length >= 2) hits.splice(0, hits.length, ...bestClause);
  const start = hits[0].index;
  const last = hits[hits.length - 1];
  let end = last.index + last[0].length;
  const span = sentText.slice(start, end).trim();
  return span.split(/\s+/).length >= 3 ? span : sentText;
}

/**
 * Extract a DS-N1 record package from plain text.
 * @param {object} input
 * @param {string} input.record_id
 * @param {string} input.title
 * @param {string} input.record_class
 * @param {string} input.text            the decision record as written
 * @param {Array<{title:string,version?:string,text:string,source_id?:string}>} input.sources
 * @returns {{record: object|null, report: object, validation: object}}
 */
// Compound sentences: two complete statements joined by "; " or ", and " are
// split so each half is checked against its own source passage. Without this a
// sentence whose first half is supported carries an unsupported second half
// through on the first half's citation. Conservative by design: both halves
// need a finite verb, the right half must open with a subject and its verb, and
// reasoning sentences ("Because …", conclusions) are never split.
const VERB = String.raw`(is|are|was|were|has|have|had|will|would|can|could|may|might|must|shall|should|did|does|do|holds?|remains?|requires?|includes?|covers?|states?|shows?|lists?|ends?|expires?|starts?|begins?|applies|continues?|runs?|lasts?|says?|notes?|confirms?|records?|agrees?|needs?|uses?|\w{3,}ed)`;
const FINITE = new RegExp(String.raw`\b${VERB}\b`, 'u');
const RIGHT_OPENS = new RegExp(String.raw`^(the|a|an|this|that|these|those|it|they|its|their|all|no|each|every|both|[\p{Lu}][\p{L}\d'’-]*)(\s+[\p{L}\d'’-]+){0,4}?\s+${VERB}\b`, 'u');
const NO_SPLIT_OPENING = /^\W*(because|if|although|though|when|whenever|unless|while|since|where|once|as)\b/iu;
export function splitClauses(sentence) {
  if (NO_SPLIT_OPENING.test(sentence) || CONCLUSION.test(fold(sentence).text)) return [sentence];
  const words = (x) => x.trim().split(/\s+/).length;
  const out = [];
  let start = 0;
  for (const m of sentence.matchAll(/;\s+|,\s+and\s+/gu)) {
    const left = sentence.slice(start, m.index).trim();
    const right = sentence.slice(m.index + m[0].length).trim();
    if (words(left) >= 4 && words(right) >= 4 && FINITE.test(fold(left).text) && RIGHT_OPENS.test(right)) {
      out.push(left);
      start = m.index + m[0].length;
    }
  }
  if (!out.length) return [sentence];
  out.push(sentence.slice(start).trim());
  return out;
}


// Records written as structured notes (headings, bullet points, bold labels) are
// read line by line: a heading is not a statement, and each bullet is its own
// statement. Offsets stay those of the original text, so quotes remain exact.
const MD_HEADING = /^\s{0,3}#{1,6}\s/u;
const MD_ITEM = /^(\s*(?:[-*\u2022]|\d{1,2}[.)])\s+)?(\*\*[^*\n]{1,80}?\*\*:?\s*)?/u;
const RECORD_NOTE = new RegExp([
  String.raw`^\W*(?:the|this)\s+(?:record|excerpt|source|file|text|document|summary|decision|case file)(?:\s+(?:provided|supplied|itself|excerpt))?\s+(?:also\s+)?(?:contains no|gives no|names no|shows no|has no|provides no|cites no|includes no|is silent|does not (?:clearly )?(?:state|say|give|include|set out|show|name|identify|contain|provide|record|describe|explain|specify))\b`,
  String.raw`^\W*(?:it|they)\s+(?:also\s+)?does not (?:clearly )?(?:state|say|give|include|set out|name|identify|specify)\b`,
  String.raw`^\W*(?:the|this)\s+(?:record|excerpt|source|text|document|summary|decision|file)(?:'s|’s)?\s+(?:also\s+)?(?:cites only|ends (?:with|at|mid)|is cut off|breaks off|identifies (?:these|the following)|does not define|follows .{0,40}usage|uses .{0,30}(?:term|name|label)|refers to .{0,30}(?:as|by))\b`,
  String.raw`^\W*(?:it|they)\s+(?:also\s+)?(?:contains?|has|have|gives?|cites?|includes?) no\b`,
  String.raw`^\W*none (?:are|is|were|was) (?:cited|given|supplied|added|provided|stated)\b`,
  String.raw`^\W*(?:no|any) (?:roi |record |exhibit )?(?:page numbers?|citations?|exhibit (?:numbers?|citations?))\b`,
  String.raw`\b(?:none|no (?:record )?citations?|no (?:roi )?page numbers?) (?:are|is|were|was) (?:given|supplied|provided|added) here\b`,
  String.raw`^\W*i (?:have not|did not|do not)\b`,
  String.raw`^\W*(?:the )?only (?:record|legal) citation (?:in the (?:source|record) )?is\b`,
].join('|'), 'u');
export function recordSentences(text) {
  if (!/^\s{0,3}(#{1,6}\s|[-*\u2022]\s|\d{1,2}[.)]\s)/mu.test(text)) return sentences(text);
  const out = []; let cp = 0;
  for (const line of text.split('\n')) {
    const len = [...line].length;
    if (!MD_HEADING.test(line) && line.trim()) {
      const m = MD_ITEM.exec(line); const skip = m ? [...m[0]].length : 0;
      const body = [...line].slice(skip).join('').replace(/\*\*/gu, (x) => x);
      for (const ss of sentences(body)) out.push({ start: cp + skip + ss.start, end: cp + skip + ss.end, text: ss.text });
    }
    cp += len + 1;
  }
  return out;
}

export function extractRecord(input) {
  const text = nfc(input.text || '');
  const sources = (input.sources || []).map((s, i) => ({
    source_id: s.source_id || `S${i + 1}`,
    title: String(s.title || `Source ${i + 1}`),
    version: String(s.version || 'v1'),
    text: nfc(s.text || ''),
  }));

  const entities = findEntities([text, ...sources.map((s) => s.text)]);
  const entityByName = new Map(entities.map((e) => [e.name, e]));

  const report = { extractor: EXTRACTOR_VERSION, min_support: MIN_SUPPORT, sources: [], claims: [], skipped_sentences: [], split_sentences: [], warnings: [] };

  // Source events: every dated sentence whose date carries a recognisable role.
  for (const s of sources) {
    const events = [];
    for (const sent of sentences(s.text)) {
      for (const d of extractDates(sent.text)) {
        const role = roleFor(sent.text, d);
        if (!role) continue;
        const actor = entities.find((e) => mentions(sent.text, e) && role === 'approval' && /\b(approv|grant|authori|sign)/.test(fold(sent.text).text.slice(fold(sent.text).text.indexOf(fold(e.name).text))));
        if (!events.some((e) => e.role === role && e.date === d)) events.push({ role, date: d, ...(actor ? { actor: actor.entity_id } : {}) });
      }
    }
    s.events = events;
    report.sources.push({ source_id: s.source_id, title: s.title, ids: identifiers(s.title + ' ' + s.text.slice(0, 200)), events, events_basis: 'inferred from dates and nearby words' });
  }

  const claims = [];
  const units = [];
  // Best-supporting source sentence for a piece of record text, by the same
  // rule the citation step below uses (explicit reference first).
  const bestSupport = (t) => {
    const ids = identifiers(t);
    const explicit = sources.filter((s) => ids.some((x) => identifiers(s.title + ' ' + s.text.slice(0, 200)).includes(x)) || fold(t).text.includes(fold(s.title).text));
    const cw = contentWords(t), ds = extractDates(t);
    let best = null;
    for (const s of explicit.length ? explicit : sources) for (const ss of sentences(s.text)) {
      const sc = supportScore(cw, ds, ss.text);
      if (!best || sc > best.score) best = { key: `${s.source_id}:${ss.start}`, score: sc };
    }
    return best && best.score >= MIN_SUPPORT ? best.key : null;
  };
  for (const sent of recordSentences(text)) {
    let parts = splitClauses(sent.text);
    if (parts.length > 1) {
      // Split only when it changes what can be checked: if every half is
      // supported by the same source sentence, that passage supports the whole
      // statement, so it stays one claim (as the record author wrote it).
      const keys = parts.map(bestSupport);
      // A part that also appears elsewhere in the record could not be located
      // uniquely, so the sentence stays whole (real decisions repeat phrases).
      const repeated = parts.some((p) => findAll(text, p.trim()).length > 1);
      if (repeated) { report.split_sentences.push({ text: sent.text, parts, kept_whole: 'a part repeats elsewhere in the record' }); parts = [sent.text]; }
      else if (keys.every((k) => k && k === keys[0])) { report.split_sentences.push({ text: sent.text, parts, kept_whole: 'all parts supported by one source sentence' }); parts = [sent.text]; }
      else report.split_sentences.push({ text: sent.text, parts });
    }
    for (const p of parts) {
      const off = parts.length > 1 ? Math.max(0, [...sent.text].length - [...sent.text.slice(sent.text.indexOf(p))].length) : 0;
      units.push({ text: p, split: parts.length > 1, start: sent.start + off });
    }
  }
  for (const sent of units) {
    const words = sent.text.trim().split(/\s+/);
    if (words.length < 4) { report.skipped_sentences.push({ text: sent.text, reason: 'fewer than four words' }); continue; }
    // Real decisions (2026-11-25): a pin-cite to the case file ("ROI at 40, 42.")
    // points to evidence, it asserts nothing; a fragment left by a broken
    // sentence ("on November 1, 2012.") has no statement of its own to check.
    if (words.length < 10 && /^\W*(see\s+)?(cf|roi|ir|report of investigation|exhibit|ex\.|tab|hearing transcript|ht|tr\.|af|ef)\s+(at\s+)?(p\.\s*)?[\dA-Z]/iu.test(sent.text)) { report.skipped_sentences.push({ text: sent.text, reason: 'record reference, not an assertion' }); continue; }
    // A writer's note on what the record itself does or does not contain ("The
    // record gives no date for the final order", "none are supplied here") is
    // about the document, not about the matter, so no source can support it.
    // It is listed for the reviewer, not checked as a claim.
    if (RECORD_NOTE.test(fold(sent.text).text)) { report.skipped_sentences.push({ text: sent.text, reason: 'note about what the record contains, for the reviewer' }); (report.record_notes ||= []).push(sent.text); continue; }
    // A lead-in that introduces a list ("She raised nine claims:") asserts nothing
    // by itself; the items that follow are the statements.
    if (/:\s*$/u.test(sent.text) && words.length < 12) { report.skipped_sentences.push({ text: sent.text, reason: 'list lead-in, not an assertion' }); continue; }
    if (!/(^|[^\p{L}])\p{Ll}{3,}/u.test(sent.text)) { report.skipped_sentences.push({ text: sent.text, reason: 'fragment, no ordinary words' }); continue; }
    if (contentWords(sent.text.replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b|\d+/giu, ' ')).length < 2) { report.skipped_sentences.push({ text: sent.text, reason: 'fragment, not a full statement' }); continue; }
    if (words.length < 7 && /^\W*(reviewer |editor |internal )?(note|attachment|attached|enclosure|see attached|cc|re)\b|\b(attached|enclosed)\W*$/iu.test(sent.text)) { report.skipped_sentences.push({ text: sent.text, reason: 'annotation, not an assertion' }); continue; }
    const id = `C${claims.length + 1}`;
    const { kind, basis } = classify(sent.text);
    const claim = { claim_id: id, kind, quote: sent.text };
    // Which occurrence of a repeated sentence this claim is, so the review
    // anchors it to the right place (real decisions repeat sentences).
    if (sent.start !== undefined) {
      const hits = findAll(text, sent.text);
      if (hits.length > 1) { const k = hits.findIndex((h) => Math.abs(h.start - sent.start) <= 2); if (k >= 0) claim.occurrence = k; }
    }
    const notes = { claim_id: id, quote: sent.text, kind, kind_basis: basis, needs_confirmation: [] };
    if (sent.split) { notes.split_from_sentence = true; notes.needs_confirmation.push('sentence split'); }

    const dates = extractDates(sent.text);
    if (dates.length) {
      const withRole = dates.map((d) => ({ d, role: roleFor(sent.text, d) })).find((x) => x.role);
      if (withRole) { claim.event = { role: withRole.role, date: withRole.d }; notes.event_basis = 'inferred from nearby words'; notes.needs_confirmation.push('event role'); }
    }

    const named = entities.filter((e) => mentions(sent.text, e));
    if (kind === 'authority' && named.length) {
      const t = sent.text;
      const verbAt = t.search(/\b(approv|grant|authori|sign)/i);
      const before = named.filter((e) => { const at = t.indexOf(e.name); return at >= 0 && (verbAt < 0 || at < verbAt); });
      const pick = (before.length ? before : named)[0];
      claim.actor = pick.entity_id; notes.actor = pick.name; notes.needs_confirmation.push('actor');
    }

    if (kind === 'conclusion') {
      const r = reasoningOf(sent.text);
      if (r) {
        // Link the stated reasoning to the earlier claims it restates, as a record
        // author would by citing them. Inferred, so the report asks for confirmation.
        const rw = new Set(contentWords(r));
        const linked = claims.filter((c) => c.kind !== 'conclusion' && contentWords(c.quote).filter((w) => rw.has(w)).length >= 2).map((c) => c.claim_id);
        claim.reasoning = linked.length ? `${r} (relies on ${linked.join(', ')})` : r;
        notes.reasoning_basis = 'stated in the sentence';
        if (linked.length) { notes.reasoning_links = linked; notes.needs_confirmation.push('reasoning links'); }
      }
      else notes.reasoning_basis = 'none stated';
    }

    // Citation: explicit reference first, otherwise the best-supporting sentence.
    const ids = identifiers(sent.text);
    let pool = sources;
    let basisKind = 'inferred';
    const explicit = sources.filter((s) => ids.some((x) => identifiers(s.title + ' ' + s.text.slice(0, 200)).includes(x))
      || fold(sent.text).text.includes(fold(s.title).text));
    if (explicit.length) { pool = explicit; basisKind = 'explicit'; }
    const cw = contentWords(sent.text);
    let best = null;
    // 2026-11-25: when the only explicit reference is a governing document (a
    // standard or policy), the decision itself is usually recorded elsewhere.
    // A statement that is only the basis ("was granted under the standard,
    // section 4") is cited to the sentence that gives the power to approve; a
    // statement that also records the act (who, what, when) is cited to the best
    // passage in any document, preferring the record of the decision.
    const isInstrument = (s) => INSTRUMENT_TITLE.test(fold(s.title).text);
    const pureBasis = /^\W*(the|this)\s+(exception|authori[sz]ation|approval|access|decision)\s+(was|is)\s+(granted|given|approved|made|authori[sz]ed)\s+(under|pursuant to|in accordance with)\b/u.test(fold(sent.text).text);
    if (kind !== 'conclusion' && explicit.length && explicit.every(isInstrument)) {
      if (pureBasis) {
        for (const s of explicit) for (const ss of sentences(s.text)) {
          if (!PERMISSION.test(fold(ss.text).text)) continue;
          const sc = Math.max(supportScore(cw, dates, ss.text), MIN_SUPPORT);
          if (!best || sc > best.score) best = { source: s, sent: ss.text, score: sc };
        }
      } else {
        for (const s of sources) for (const ss of sentences(s.text)) {
          const sc = supportScore(cw, dates, ss.text) + (isInstrument(s) ? -0.01 : 0);
          if (!best || sc > best.score) best = { source: s, sent: ss.text, score: sc };
        }
        if (best && !isInstrument(best.source)) basisKind = 'inferred';
      }
    }
    // An exact copy of the record sentence wins a tie (real records repeat
    // phrases, and the first equally scored sentence is not always the right one).
    const same = (t) => (fold(t).text.trim() === fold(sent.text).text.trim() ? 0.001 : 0);
    if (kind !== 'conclusion' && !best) {
      for (const s of pool) for (const ss of sentences(s.text)) {
        // A bare heading ("Clause 3.") is never the supporting passage.
        if (ss.text.trim().split(/\s+/).length < 4) continue;
        const sc = supportScore(cw, dates, ss.text) + same(ss.text);
        if (!best || sc > best.score) best = { source: s, sent: ss.text, score: sc };
      }
    }
    // 2026-11-25 (real records; no AI): a summary sentence often merges two or
    // three neighbouring source sentences. When such a run supports the
    // statement clearly better than any single sentence, cite the whole run.
    let windowed = false;
    if (kind !== 'conclusion' && (!best || best.score < 0.6)) {
      for (const s of pool) {
        const ss = sentences(s.text); const cps = [...s.text];
        for (let k = 0; k < ss.length; k++) for (const n of [2, 3]) {
          if (k + n > ss.length) continue;
          const a = ss[k].start, z = ss[k + n - 1].end; const txt = cps.slice(a, z).join('');
          // Every sentence in the run must add at least two words of the
          // statement that the others do not, or the run is not what supports it.
          const want = new Set(cw), seen = new Set(); let each = true;
          for (let j = k; j < k + n; j++) { if (ss[j].text.trim().split(/\s+/).length < 4) { each = false; break; } const add = contentWords(ss[j].text).filter((w) => want.has(w) && !seen.has(w)); if (add.length < 2) { each = false; break; } add.forEach((w) => seen.add(w)); }
          if (!each) continue;
          const sc = supportScore(cw, dates, txt);
          if (sc >= MIN_SUPPORT && (!best || sc >= best.score + 0.15)) { best = { source: s, sent: txt, score: sc }; windowed = true; }
        }
      }
    }
    // 2026-11-25 (real records): a conclusion-worded sentence that a source states
    // nearly word for word is cited to that sentence; the record is reporting the
    // source's conclusion. Other conclusions still need stated reasoning.
    if (kind === 'conclusion' && cw.length >= 4) {
      for (const s of pool) for (const ss of sentences(s.text)) {
        const sc = supportScore(cw, dates, ss.text) + same(ss.text);
        if (sc >= 0.9 && (!best || sc > best.score)) best = { source: s, sent: ss.text, score: sc };
      }
    }
    if (best && (best.score >= MIN_SUPPORT || (basisKind === 'explicit' && best.score > 0))) {
      claim.citations = [{ source_id: best.source.source_id, quote: windowed ? best.sent : supportingSpan(cw, dates, best.sent, sent.text) }];
      notes.citation = { source_id: best.source.source_id, title: best.source.title, basis: basisKind, score: Math.round(best.score * 100) / 100 };
      if (basisKind === 'inferred') notes.needs_confirmation.push('citation');
    } else {
      claim.citations = [];
      notes.citation = null;
      if (kind !== 'conclusion') notes.needs_confirmation.push('no supporting passage found');
    }
    claims.push(claim);
    report.claims.push(notes);
  }

  const record = {
    schema: 'ds-n1.record/1.0',
    record_id: String(input.record_id || 'EXTRACTED-1'),
    record_version: String(input.record_version || '1'),
    record_class: input.record_class,
    data_classification: input.data_classification || 'constructed_fictional',
    title: String(input.title || 'Extracted record'),
    text,
    entities,
    sources: sources.map((s) => ({ source_id: s.source_id, title: s.title, version: s.version, text: s.text, events: s.events })),
    claims,
  };
  const validation = validateRecord(record);
  if (validation.errors && validation.errors.length) {
    report.warnings.push('The extracted package did not validate; see validation.errors.');
  }
  report.summary = {
    claims: claims.length,
    cited: claims.filter((c) => c.citations.length).length,
    explicit_citations: report.claims.filter((c) => c.citation && c.citation.basis === 'explicit').length,
    to_confirm: report.claims.filter((c) => c.needs_confirmation.length).length,
  };
  return { record, report, validation };
}

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
// Limits, stated rather than hidden: sentence-level claims only (a sentence
// carrying two assertions becomes one claim); kinds, event roles and actors
// come from documented word cues and can be wrong; tables, scanned images and
// footnotes are not parsed. The report marks every inferred field.

import { nfc, sentences, contentWords, fold } from './text.mjs';
import { extractDates } from './assess.mjs';
import { validateRecord } from './record.mjs';

export const EXTRACTOR_VERSION = 'ds-n1.extract/0.1.0-dev';

// Minimum share of a claim's content words that a source sentence must contain
// before it is offered as support. Chosen on the developer fixtures and
// recorded in tests/ds-n1/EXTRACT_EVAL.json; never tuned on study records.
export const MIN_SUPPORT = 0.34;

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
  return names.map((name, i) => ({ entity_id: `E${i + 1}`, name }));
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

  const report = { extractor: EXTRACTOR_VERSION, min_support: MIN_SUPPORT, sources: [], claims: [], skipped_sentences: [], warnings: [] };

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
  for (const sent of sentences(text)) {
    const words = sent.text.trim().split(/\s+/);
    if (words.length < 4) { report.skipped_sentences.push({ text: sent.text, reason: 'fewer than four words' }); continue; }
    if (words.length < 7 && /^\W*(reviewer |editor |internal )?(note|attachment|attached|enclosure|see attached|cc|re)\b|\b(attached|enclosed)\W*$/iu.test(sent.text)) { report.skipped_sentences.push({ text: sent.text, reason: 'annotation, not an assertion' }); continue; }
    const id = `C${claims.length + 1}`;
    const { kind, basis } = classify(sent.text);
    const claim = { claim_id: id, kind, quote: sent.text };
    const notes = { claim_id: id, quote: sent.text, kind, kind_basis: basis, needs_confirmation: [] };

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
    if (kind !== 'conclusion') {
      for (const s of pool) for (const ss of sentences(s.text)) {
        const sc = supportScore(cw, dates, ss.text);
        if (!best || sc > best.score) best = { source: s, sent: ss.text, score: sc };
      }
    }
    if (best && (best.score >= MIN_SUPPORT || (basisKind === 'explicit' && best.score > 0))) {
      claim.citations = [{ source_id: best.source.source_id, quote: supportingSpan(cw, dates, best.sent, sent.text) }];
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

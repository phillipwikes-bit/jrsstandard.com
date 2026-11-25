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
const NEGATION = /\b(not|no|nor|neither|never|none|nobody|nothing|without|fail|fails|failing|denied|denial|denials|deny|denies|declined|rejected|rejection|refused|refusal|failed|failure|cannot|unable|devoid|lack|lacks|lacked|absent|absence|withdrawn|revoked)\b|n't\b/u;
const QUALIFIER = /\b(unless|except|excepting|provided that|subject to|pending|conditional|conditionally|only if|until|temporary|temporarily|limited to|provisional|provisionally|interim)\b/u;
const ASSERTION = /\b(approv\w*|confirm\w*|verif\w*|grant\w*|determin\w*|conclud\w*|therefore|because|complet\w*|authori[sz]\w*|sign\w*|accept\w*|reviewed|exception|decid\w*|decision)\b|\d{4}-\d{2}-\d{2}/u;
const INSTRUCTION = /\b(ignore (all |any )?(previous|prior|above|earlier) (instructions|rules)|disregard (the|all|any|previous) |system prompt|you are (an?|the) (ai|assistant|model)|mark (this|the) (record|claim|review) (as )?(ready|approved|supported)|set (the )?status to|treat (this|the) (record|claim|exception|review) as (approved|ready|supported|verified|complete))/u;
// A sentence opening with a role label addressed to a model or tool.
const ROLE_LABEL = /^\W*(system|assistant|ai|instruction|instructions|note to (the )?(ai|model|assistant|tool))\s*:/u;
// Attributed speakers in investigative records: a role label followed closely by
// a speech verb (the study 014 anchor definition).
const SPEAKER_ROLE = String.raw`(complainant|petitioner|s\d{1,2}|rmo\s?\d{1,2}|rmo|cw\s?\d{1,2}|c\d{1,2}|witness\s?\d{1,2}|w\d{1,2}|supervisor\s?\d{1,2}|manager\s?\d{1,2}|coworker\s?\d{1,2}|specialist\s?\d{1,2}|official\s?\d{1,2}|so\d{1,2}|hr\s?\d{1,2}|selecting official|investigator|director|supervisor|manager|coworker)`;
const SPEECH_VERB = String.raw`(stated|states|averred|avers|testified|asserted|asserts|alleged|alleges|denied|denies|explained|explains|maintained|maintains|indicated|indicates|affirmed|affirms|contended|contends|claimed|claims|noted|notes|reported|reports|attested|attests|recalled|recalls|acknowledged|acknowledges|confirmed|confirms)`;
const ATTRIBUTION = new RegExp(String.raw`\b${SPEAKER_ROLE}\b[^.;:]{0,40}?\b${SPEECH_VERB}\b`, 'gu');
const SPEECH_ANY = /\b(said|says|told|tells|stated|states|testified|testifies|averred|avers|asserted|asserts|alleged|alleges|believed|believes|denied|denies|explained|maintained|indicated|affirmed|contended|claimed|noted|reported|attested|recalled|acknowledged|confirmed|wrote|responded|replied|added|described|insisted|recounted)\b/u;
const GENERIC_SPEAKER = /\b(an individual|someone|somebody|a person|an unnamed|unidentified|a witness|an employee|another employee|a coworker|a co-worker|an official)\b[^.;:]{0,40}?\b(said|stated|testified|averred|asserted|alleged|denied|explained|maintained|indicated|affirmed|contended|claimed|noted|reported|attested|recalled|acknowledged|confirmed|told)\b/u;
export function speakersIn(text) { const t = fold(text).text; const out = new Set(); for (const m of t.matchAll(ATTRIBUTION)) out.add(m[1].replace(/\s+/g, '')); return out; }
export function rolesNamed(text) { const t = fold(text).text; const out = new Set(); for (const m of t.matchAll(new RegExp(String.raw`\b${SPEAKER_ROLE}\b`, 'gu'))) out.add(m[1].replace(/\s+/g, '')); return out; }
const CONTRAST = /\b(but|however|although|though|yet|whereas)\b/u;
// Decision-verb synonyms folded before the relevance comparison. Deliberately
// small and documented; widening it trades false holds for false support.
const SYNONYMS = [[/\bsign(ed|s|ing)? off( on)?\b/gu, 'approved'], [/\bauthori[sz]\w*/gu, 'approved'], [/\bfinish\w*/gu, 'completed']];
// Event-role cues: the word stems that name an event when they sit just before a date.
const ROLE_CUES = ['request', 'submi', 'assess', 'approv', 'receiv', 'review', 'due', 'expir', 'complet'];
const cueOf = (text) => { const t = fold(text).text; return ROLE_CUES.find((c) => t.includes(c)) || null; };

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export function extractDates(text) {
  const t = fold(text).text;
  const out = new Set();
  for (const m of t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/gu)) out.add(`${m[1]}-${m[2]}-${m[3]}`);
  const mon = MONTHS.join('|');
  for (const m of t.matchAll(new RegExp(`\\b(${mon}) (\\d{1,2}),? (\\d{4})\\b`, 'gu'))) out.add(iso(m[3], MONTHS.indexOf(m[1]) + 1, m[2]));
  for (const m of t.matchAll(new RegExp(`\\b(\\d{1,2}) (${mon}),? (\\d{4})\\b`, 'gu'))) out.add(iso(m[3], MONTHS.indexOf(m[2]) + 1, m[1]));
  return [...out].sort();
}
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function polarityNegative(text) { return NEGATION.test(fold(text).text); }
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
  const toks = fold(text).text.match(/[\p{L}\p{N}'’]+/gu) || [];
  const out = new Set();
  toks.forEach((t, i) => {
    if (!NEG_CUE.test(t)) return;
    // Scope: the next three words; for a passive "was denied / were refused",
    // the three words before it instead.
    const passive = /^(denied|declined|rejected|refused|revoked|withdrawn)$/u.test(t) && i > 0 && /^(was|were|been|being|is|are|be)$/u.test(toks[i - 1]);
    const [from, to] = passive ? [Math.max(0, i - 4), i - 1] : [i + 1, Math.min(toks.length - 1, i + 3)];
    for (let j = from; j <= to; j++) for (const w of contentWords(toks[j])) if (keep.has(w)) out.add(w);
    for (const w of contentWords(t)) if (keep.has(w)) out.add(w);
  });
  return out;
}
function scopedConflict(a, b) {
  const aw = new Set(contentWords(a)), shared = new Set(contentWords(b).filter((w) => aw.has(w)));
  if (shared.size < 2) return null;
  const na = negatedWords(a, shared), nb = negatedWords(b, shared);
  if (!na.size && !nb.size) return { claim: false, source: false };
  const onlyA = [...na].filter((w) => !nb.has(w)), onlyB = [...nb].filter((w) => !na.has(w));
  // A conflict needs a shared word negated on one side only, on at least two
  // shared words or on a word next to the negation itself.
  if (!onlyA.length && !onlyB.length) return { claim: na.size > 0, source: nb.size > 0 };
  return { claim: onlyA.length > 0 || (na.size > 0 && !onlyB.length), source: onlyB.length > 0 || (nb.size > 0 && !onlyA.length) };
}

let CPS_KEY = null, CPS_VAL = null;
function recordCps(t) { if (t !== CPS_KEY) { CPS_KEY = t; CPS_VAL = [...t]; } return CPS_VAL; }

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
  const polClause = pm ? fold(clause).text.slice(0, pm.index + pm[0].length) : wholeSentence ? sent.text : clause;
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
  const cleared = cNeg0 !== sNeg0 && ((scoped && scoped.claim === scoped.source) || (scopedWhole && scopedWhole.claim === scopedWhole.source && polarityNegative(sent.text) === cNeg0));
  const cNeg = cNeg0, sNeg = cleared ? cNeg0 : sNeg0;
  assessment.checks.push({ check: 'polarity', claim_negative: cNeg, source_negative: sNeg, source_clause: clause, result: cNeg === sNeg ? 'consistent' : 'conflict' });
  if (cNeg !== sNeg) {
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
  const claimActors = entitiesMentioned(claimText, record.entities);
  if (claim.actor) claimActors.add(claim.actor);
  const sentActors = entitiesMentioned(sent.text, record.entities);
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
    } else if (!role && extractDates(near).includes(d)) {
      assessment.checks.push({ check: 'date', date: d, result: 'present_in_neighbouring_sentence' });
    } else {
      assessment.checks.push({ check: 'date', date: d, result: 'not_established' });
      out.push(finding('DATE_NOT_ESTABLISHED', { ...b, scope: d },
        `The claim states ${d}, but that date does not appear in the cited passage of ${source.source_id}.`,
        `Which document establishes the date ${d}?`,
        { claim_date: d, source_sentence: sent.text, source_dates: [...sentDates] }));
    }
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
      const claimDateSet = new Set(extractDates(claimText));
      const dropped = [...new Set(extractDates(sent.text))].filter((d) => !claimDateSet.has(d));
      const beforeDates = new Set(extractDates(before));
      if (dropped.length && !claimDateSet.size && !dropped.every((d) => beforeDates.has(d))) {
        out.push(finding('DATE_OMITTED', { ...b, scope: dropped.join(',') },
          `The cited sentence in ${source.source_id} dates this to ${dropped.join(', ')}; the statement gives no date.`,
          `Should the statement keep the date the source gives (${dropped.join(', ')}), so a later reviewer can place it in time?`,
          { dropped_dates: dropped, source_sentence: sent.text }));
      }
      const claimRoles = rolesNamed(claimText);
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
  const cw = propositionWords(claimText, record.entities);
  const sw = new Set(propositionWords(sent.text, record.entities));
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
  const blocking = out.some((f) => f.severity === 'critical');
  assessment.relevance = blocking ? (out.some((f) => f.code === 'NEGATION_CONFLICT') ? 'CONTRADICTS' : 'CONFLICTS')
    : (relevant && !out.some((f) => ['DATE_NOT_ESTABLISHED', 'ACTOR_NOT_ESTABLISHED'].includes(f.code)) ? 'SUPPORTS' : 'NOT_ESTABLISHED');
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

  if (claim.kind === 'authority' && !supports.length) {
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

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
  EVENT_ROLE_CONFUSION: { severity: 'critical', condition: 'RC3' },
  DATE_MISMATCH: { severity: 'critical', condition: 'RC3' },
  DATE_NOT_ESTABLISHED: { severity: 'review', condition: 'RC3' },
  DATE_ROLE_UNVERIFIED: { severity: 'review', condition: 'RC3' },
  REASONING_NOT_TRACED: { severity: 'review', condition: 'RC4' },
  UNMAPPED_ASSERTION: { severity: 'review', condition: 'RC1' },
  INSTRUCTION_LIKE_CONTENT: { severity: 'review', condition: 'RC1' },
});

const NEGATION = /\b(not|no|never|none|nobody|nothing|without|denied|declined|rejected|refused|failed|cannot|withdrawn|revoked)\b|n't\b/u;
const QUALIFIER = /\b(unless|except|excepting|provided that|subject to|pending|conditional|conditionally|only if|until|temporary|temporarily|limited to|provisional|provisionally|interim)\b/u;
const ASSERTION = /\b(approv\w*|confirm\w*|verif\w*|grant\w*|determin\w*|conclud\w*|therefore|because|complet\w*|authori[sz]\w*|sign\w*|accept\w*|review\w*|exception|decid\w*|decision)\b|\d{4}-\d{2}-\d{2}/u;
const INSTRUCTION = /\b(ignore (all |any )?(previous|prior|above|earlier) (instructions|rules)|disregard (the|all|any|previous) |system prompt|you are (an?|the) (ai|assistant|model)|mark (this|the) (record|claim|review) (as )?(ready|approved|supported)|set (the )?status to)/u;

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
  return contentWords(text).filter((w) => !exclude.has(w) && !/^\d+$/.test(w));
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

  // Polarity: compare the claim with the source CLAUSE that leads up to and
  // includes the quote (from the last , ; : before the quote to the quote end),
  // so a quote that trims off a preceding "not" is still caught, while a
  // negation in a trailing clause ("with no findings") is not misread.
  const sentCps = codePoints(sent.text);
  const qs = span.start - sent.start, qe = span.end - sent.start;
  let cs = 0;
  for (let i = qs - 1; i >= 0; i--) if (/[,;:]/u.test(sentCps[i])) { cs = i + 1; break; }
  const clause = sentCps.slice(cs, qe).join('');
  const cNeg = polarityNegative(claimText), sNeg = polarityNegative(clause);
  assessment.checks.push({ check: 'polarity', claim_negative: cNeg, source_negative: sNeg, source_clause: clause, result: cNeg === sNeg ? 'consistent' : 'conflict' });
  if (cNeg !== sNeg) {
    out.push(finding('NEGATION_CONFLICT', b,
      `The cited clause reads "${short(clause, 200)}". It is ${sNeg ? 'negative' : 'affirmative'} where the claim is ${cNeg ? 'negative' : 'affirmative'}, so the passage may contradict the claim rather than support it.`,
      `Does this passage say the same thing as the statement, or does it say the opposite?`,
      { source_clause: clause, source_sentence: sent.text }));
  }

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
      if (role) {
        assessment.checks.push({ check: 'event', date: d, role, result: 'date_present_role_unverified' });
        out.push(finding('DATE_ROLE_UNVERIFIED', b,
          `${d} appears in the cited sentence, but the source has no structured event record, so DS-N1 cannot confirm that ${d} is the ${role} date rather than another event.`,
          `Does ${d} in this passage refer to the ${role}, or to a different event?`,
          { source_sentence: sent.text }));
      } else assessment.checks.push({ check: 'date', date: d, result: 'present' });
    } else {
      assessment.checks.push({ check: 'date', date: d, result: 'not_established' });
      out.push(finding('DATE_NOT_ESTABLISHED', { ...b, scope: d },
        `The claim states ${d}, but that date does not appear in the cited passage of ${source.source_id}.`,
        `Which document establishes the date ${d}?`,
        { claim_date: d, source_sentence: sent.text, source_dates: [...sentDates] }));
    }
  }

  // Qualification omitted.
  if (hasQualifier(sent.text) && !hasQualifier(claimText)) {
    out.push(finding('QUALIFICATION_OMITTED', b,
      `The source sentence carries a qualification ("${short(sent.text, 200)}") that the claim does not repeat.`,
      `Should the statement carry the condition or limitation stated in the source?`,
      { source_sentence: sent.text }));
  }

  // Topical relevance (lexical proxy, documented limitation).
  const cw = propositionWords(claimText, record.entities);
  const sw = new Set(propositionWords(sent.text, record.entities));
  const overlap = cw.filter((w) => sw.has(w));
  const ratio = cw.length ? overlap.length / cw.length : 0;
  assessment.checks.push({ check: 'proposition_overlap', ratio: Math.round(ratio * 1000) / 1000, shared: overlap, claim_terms: cw });
  const relevant = cw.length > 0 && ratio >= 0.5;
  if (!relevant) {
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
  const record_span = loc.hits[0] || null;
  const base = { claim_id: claim.claim_id, revision: revNo, record_span };
  if (!loc.hits.length) {
    findings.push(finding('CLAIM_NOT_IN_RECORD', base,
      `Claim ${claim.claim_id} quotes "${short(claim.quote)}", which does not appear in the record text.`,
      `Where in the record does this statement appear?`, {}));
  } else if (loc.hits.length > 1) {
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
  const reasoningRefs = reasoning ? (reasoning.match(/\b[A-Za-z0-9][A-Za-z0-9._-]*\b/g) || []).filter((t) => t !== claim.claim_id && allClaimsSupport.has(t)) : [];

  if (claim.kind === 'authority' && !supports.length) {
    findings.push(finding('UNTRACEABLE_AUTHORITY', base,
      `Claim ${claim.claim_id} asserts an authority or approval ("${short(claimText)}") but no cited source in the record supports it.`,
      `Which document records this approval, and who gave it?`, { citations: citations.length }));
  } else if (claim.kind === 'conclusion') {
    if (!reasoning) {
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
      if (INSTRUCTION.test(fold(s.text).text)) {
        findings.push(finding('INSTRUCTION_LIKE_CONTENT', { source_id: item.where === 'source' ? item.id : null, scope: `${item.where}:${item.id}:${s.start}`, source_span: item.where === 'source' ? { start: s.start, end: s.end } : null, record_span: item.where === 'record' ? { start: s.start, end: s.end } : null },
          `The ${item.where} ${item.id} contains text phrased as an instruction to a reviewing system ("${short(s.text, 160)}"). DS-N1 treated it as data and it did not change any assessment. Its presence in a record is itself worth examining.`,
          `Why does this ${item.where} contain an instruction addressed to a review tool, and who added it?`,
          { sentence: s.text }));
      }
    }
  }
  return { findings, unassessed_sentences: unassessed };
}

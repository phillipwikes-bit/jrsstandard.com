// JRS EVIDENCE GRAPH 0.3.0: deterministic quote resolution.
//
// The compiler, not the candidate, computes every offset. A proposed quotation is
// resolved to exactly one location or it is not usable:
//   verified_unique         one exact occurrence in the record
//   verified_disambiguated  several exact occurrences, and a permitted
//                           disambiguator selects exactly one
//   ambiguous               several occurrences and no safe selection; every
//                           candidate location is returned and none is chosen
//   absent                  no exact occurrence (whitespace, Unicode and case
//                           variants are reported as the reason, never repaired)
//   malformed               not a usable quotation (blank, too short, too broad,
//                           elided, heading-only, truncated mid-word, crossing a
//                           section boundary or a line break)
//   not_assessed            not resolved (for example the intake was refused)
//
// Permitted disambiguators: { section: "<label>" }, { context_before: "<exact text
// immediately preceding>" }, { context_after: "<exact text immediately following>" },
// { near_quote: "<another quotation that resolves uniquely within 300 characters>" }.

import { sectionsOf, sectionAt, utf8Offset } from './record.mjs';

export const MIN_QUOTE = 12;
export const MAX_QUOTE = 400;
export const MAX_RECORD_FRACTION = 0.5;
const NEAR_WINDOW = 300;
const DISAMBIGUATOR_KEYS = ['section', 'context_before', 'context_after', 'near_quote'];

function positions(record, q) { const out = []; let i = record.indexOf(q); while (i !== -1) { out.push(i); i = record.indexOf(q, i + 1); } return out; }
const isWord = (c) => !!c && /[A-Za-z0-9]/.test(c);
const loc = (record, s, len) => ({ start: s, end: s + len, utf8_start: utf8Offset(record, s), utf8_end: utf8Offset(record, s + len) });

export function resolveQuote(record, quote, disambiguator, sections = sectionsOf(record)) {
  const res = (status, reason, extra = {}) => Object.assign({ quote_resolution_status: status, reason }, extra);
  if (typeof quote !== 'string') return res('malformed', 'quote_not_text');
  if (!quote.trim()) return res('malformed', 'blank_quote');
  if (quote !== quote.trim()) return res('malformed', 'leading_or_trailing_whitespace');
  if (quote.length < MIN_QUOTE) return res('malformed', 'quote_too_short');
  if (quote.length > MAX_QUOTE || quote.length > record.length * MAX_RECORD_FRACTION) return res('malformed', 'quote_too_broad');
  if (/\.\.\.|…|\[\s*\.\.\.\s*\]/.test(quote)) return res('malformed', 'elided_quote');
  if (/\n/.test(quote)) return res('malformed', 'crosses_line_break');
  const heading = /^([A-Z][A-Za-z0-9 /&()-]{1,39}):?\s*$/.exec(quote);
  if (heading && sections.some((s) => s.label === heading[1])) return res('malformed', 'heading_only');
  const labelOnly = /^([A-Z][A-Za-z0-9 /&()-]{1,39}):\s*(.*)$/.exec(quote);
  if (labelOnly && sections.some((s) => s.label === labelOnly[1]) && labelOnly[2].replace(/[^A-Za-z0-9]/g, '').length < 4) return res('malformed', 'heading_only');

  if (disambiguator !== undefined && disambiguator !== null) {
    const keys = disambiguator && typeof disambiguator === 'object' ? Object.keys(disambiguator) : [];
    if (keys.length !== 1 || !DISAMBIGUATOR_KEYS.includes(keys[0]) || typeof disambiguator[keys[0]] !== 'string' || !disambiguator[keys[0]]) {
      return res('malformed', 'invalid_disambiguator');
    }
  }

  let pos = positions(record, quote);
  if (!pos.length) {
    const ws = (s) => s.replace(/\s+/g, ' ');
    let reason = 'not_found';
    if (record.normalize('NFC').includes(quote.normalize('NFC')) || record.normalize('NFKC').includes(quote.normalize('NFKC'))) reason = 'unicode_normalization_variant';
    else if (ws(record).includes(ws(quote))) reason = 'whitespace_variant';
    else if (record.toLowerCase().includes(quote.toLowerCase())) reason = 'case_variant';
    return res('absent', reason);
  }
  // Every occurrence must be a whole-word, single-section span.
  const clean = pos.filter((p) => {
    const a = sectionAt(sections, p), b = sectionAt(sections, p + quote.length - 1);
    return a && a === b && !(isWord(record[p - 1]) && isWord(quote[0])) && !(isWord(record[p + quote.length]) && isWord(quote[quote.length - 1]));
  });
  if (!clean.length) {
    const p = pos[0];
    const a = sectionAt(sections, p), b = sectionAt(sections, p + quote.length - 1);
    return res('malformed', a !== b ? 'crosses_section_boundary' : 'truncated_mid_word');
  }
  pos = clean;
  const locations = pos.map((p) => Object.assign(loc(record, p, quote.length), { section: sectionAt(sections, p).label }));
  if (pos.length === 1) return res('verified_unique', 'exact_unique_match', { location: locations[0], occurrence_count: 1, candidate_locations: locations });
  if (!disambiguator) return res('ambiguous', 'multiple_exact_matches_no_disambiguator', { occurrence_count: pos.length, candidate_locations: locations });

  const [k] = Object.keys(disambiguator); const v = disambiguator[k];
  let chosen = [];
  if (k === 'section') chosen = locations.filter((l) => l.section === v);
  else if (k === 'context_before') chosen = locations.filter((l) => l.start >= v.length && record.slice(l.start - v.length, l.start) === v);
  else if (k === 'context_after') chosen = locations.filter((l) => record.slice(l.end, l.end + v.length) === v);
  else if (k === 'near_quote') {
    const near = positions(record, v);
    if (near.length !== 1) return res('ambiguous', 'near_quote_not_unique', { occurrence_count: pos.length, candidate_locations: locations });
    chosen = locations.filter((l) => Math.abs(l.start - near[0]) <= NEAR_WINDOW);
  }
  if (chosen.length === 1) return res('verified_disambiguated', 'disambiguated_by_' + k, { location: chosen[0], occurrence_count: pos.length, candidate_locations: locations });
  return res('ambiguous', 'disambiguator_did_not_select_exactly_one', { occurrence_count: pos.length, candidate_locations: locations });
}

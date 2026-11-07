// JRS EVIDENCE CONTRACT 0.2.0: evidence-item verification.
//
// A cited item is VERIFIED only when record.slice(start_offset, end_offset) is
// exactly the quoted string. Nothing is repaired: a correct quote at the wrong
// offsets, a quote that matches only after Unicode normalisation, and a quote
// that spans two record sections all FAIL, with a reason. The validator never
// searches for a replacement location and never substitutes text.
//
// Verification proves presence. `semantic_support_not_verified` is always true.

import { OFFSET_UNIT, MIN_QUOTE_CHARS, MAX_QUOTE_CHARS, ASSERTION_TYPES } from './contract.mjs';

// A section starts at a line of the form "Label: ..." (label of 2 to 40
// characters, starting with a capital letter). Text before the first such line
// is the "preamble". Deterministic and lexical; records without labels have one
// section.
const SECTION_LINE = /^([A-Z][A-Za-z0-9 /&()-]{1,39}):/;

export function recordSections(record) {
  const sections = [];
  let offset = 0, current = { name: 'preamble', start: 0 };
  for (const line of record.split('\n')) {
    const m = SECTION_LINE.exec(line);
    if (m) {
      if (offset > current.start) sections.push(Object.assign(current, { end: offset }));
      current = { name: m[1], start: offset };
    }
    offset += line.length + 1;
  }
  sections.push(Object.assign(current, { end: record.length }));
  return sections.filter((s) => s.end > s.start);
}

export function sectionAt(sections, index) {
  return sections.find((s) => index >= s.start && index < s.end) || null;
}

function occurrences(record, quote) {
  let n = 0, i = record.indexOf(quote);
  while (i !== -1) { n++; i = record.indexOf(quote, i + 1); }
  return n;
}

const ITEM_KEYS = ['evidence_id', 'exact_quote', 'start_offset', 'end_offset', 'assertion_type'];

// Returns { verified: [...], rejected: [...], structural: [...] }.
export function verifyEvidenceItems(record, items, sections = recordSections(record)) {
  const verified = [], rejected = [], structural = [];
  if (!Array.isArray(items)) return { verified, rejected, structural: ['evidence_items_not_a_list'] };
  const ids = new Set();
  const seenSpans = new Map();
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) { structural.push('evidence_item_not_an_object'); continue; }
    const extra = Object.keys(item).filter((k) => !ITEM_KEYS.includes(k));
    if (extra.length) { structural.push('evidence_item_has_undeclared_fields:' + extra.join(',')); continue; }
    const missing = ITEM_KEYS.filter((k) => !(k in item));
    if (missing.length) { structural.push('evidence_item_missing_fields:' + missing.join(',')); continue; }
    const { evidence_id: id, exact_quote: q, start_offset: s, end_offset: e, assertion_type: t } = item;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_.-]{1,40}$/.test(id)) { structural.push('evidence_id_invalid'); continue; }
    if (ids.has(id)) { structural.push('duplicate_evidence_id:' + id); continue; }
    ids.add(id);
    if (!ASSERTION_TYPES.includes(t)) { rejected.push({ evidence_id: id, reason: 'unsupported_assertion_type', candidate_offsets: [s, e] }); continue; }
    if (typeof q !== 'string' || q.trim().length < MIN_QUOTE_CHARS || q.length > MAX_QUOTE_CHARS) { rejected.push({ evidence_id: id, reason: 'quote_length_outside_bounds', candidate_offsets: [s, e] }); continue; }
    // Root cause first: whether the text exists at all, then where, then offsets.
    // (Ordering defect found on the first v0.2 replay: a fabricated quote with
    // inconsistent offsets was reported only as an offset-length mismatch.)
    const offsetsOk = Number.isInteger(s) && Number.isInteger(e) && s >= 0 && e > s && e <= record.length;
    if (!offsetsOk || record.slice(s, e) !== q) {
      let reason;
      if (record.indexOf(q) === -1) {
        reason = (record.normalize('NFC').includes(q.normalize('NFC')) || record.normalize('NFKC').includes(q.normalize('NFKC')))
          ? 'quote_matches_only_after_unicode_normalization' : 'quote_not_found_in_record';
      } else reason = !offsetsOk ? 'offsets_invalid' : e - s !== q.length ? 'offset_length_does_not_match_quote' : 'quote_found_at_different_offsets';
      rejected.push({ evidence_id: id, reason, candidate_offsets: [s, e] });
      continue;
    }
    const a = sectionAt(sections, s), b = sectionAt(sections, e - 1);
    if (!a || !b || a !== b) { rejected.push({ evidence_id: id, reason: 'quote_crosses_record_section_boundary', candidate_offsets: [s, e] }); continue; }
    const spanKey = s + ':' + e;
    if (seenSpans.has(spanKey)) { rejected.push({ evidence_id: id, reason: 'duplicate_of:' + seenSpans.get(spanKey), candidate_offsets: [s, e], non_blocking: true }); continue; }
    seenSpans.set(spanKey, id);
    verified.push({
      evidence_id: id,
      exact_quote: q,
      start_offset: s,
      end_offset: e,
      offset_unit: OFFSET_UNIT,
      record_section: a.name,
      assertion_type: t,
      presence_verified: true,
      semantic_support_not_verified: true,
      occurrence_count_in_record: occurrences(record, q),
    });
  }
  return { verified, rejected, structural };
}

// Independent re-check used by the result validator.
export function reverifyItem(record, item) {
  return !!item && item.presence_verified === true && item.semantic_support_not_verified === true
    && Number.isInteger(item.start_offset) && Number.isInteger(item.end_offset)
    && record.slice(item.start_offset, item.end_offset) === item.exact_quote
    && item.exact_quote.trim().length >= MIN_QUOTE_CHARS;
}

// JRS ENGINE ASSURANCE: exact source-span location and verification.
//
// WHAT A VERIFIED SPAN PROVES. That the quoted characters occur in the submitted
// record at the stated offsets. Nothing more. It does not prove that the passage
// supports the finding, that it was read in context, or that the finding is
// right. That boundary is carried in every finding as SPAN_LIMITATION.
//
// MATCHING IS EXACT. No case folding, whitespace collapsing, Unicode
// normalisation or fuzzy matching: a near-quote is a non-quote. Offsets are
// JavaScript string indices (UTF-16 code units), declared as OFFSET_UNIT so a
// reader in another language does not have to guess.

export const OFFSET_UNIT = 'utf16_code_unit';
export const MIN_ANCHOR_CHARS = 8;
export const MAX_ANCHOR_CHARS = 400;

export const SPAN_LIMITATION =
  'Source-span verification establishes record presence only: the quoted text occurs in '
  + 'the submitted record at the stated offsets. It does not establish contextual or semantic '
  + 'validity, that the passage supports this finding, or that the underlying decision was justified.';

export function countOccurrences(record, quote) {
  let n = 0;
  let i = record.indexOf(quote);
  while (i !== -1) { n++; i = record.indexOf(quote, i + 1); }
  return n;
}

// Returns a span object or a reason it could not be anchored.
export function locateQuote(record, quote) {
  if (typeof record !== 'string') return { ok: false, reason: 'record_not_text' };
  if (typeof quote !== 'string') return { ok: false, reason: 'quote_not_text' };
  if (quote.trim().length < MIN_ANCHOR_CHARS) return { ok: false, reason: 'quote_below_minimum_anchor_length' };
  if (quote.length > MAX_ANCHOR_CHARS) return { ok: false, reason: 'quote_above_maximum_anchor_length' };
  const start = record.indexOf(quote);
  if (start === -1) return { ok: false, reason: 'quote_not_found_in_record' };
  return {
    ok: true,
    span: {
      quote,
      start,
      end: start + quote.length,
      offset_unit: OFFSET_UNIT,
      occurrence_count: countOccurrences(record, quote),
      verification: 'exact_match_record_presence_only',
    },
  };
}

// Independent re-check used by the envelope validator and the replay harness.
// It does not trust the producer's offsets: it slices the record and compares.
export function verifySpan(record, span) {
  if (!span || typeof span !== 'object') return false;
  if (span.offset_unit !== OFFSET_UNIT) return false;
  if (!Number.isInteger(span.start) || !Number.isInteger(span.end)) return false;
  if (span.start < 0 || span.end <= span.start || span.end > record.length) return false;
  if (typeof span.quote !== 'string' || span.quote.length !== span.end - span.start) return false;
  if (span.quote.trim().length < MIN_ANCHOR_CHARS) return false;
  return record.slice(span.start, span.end) === span.quote;
}

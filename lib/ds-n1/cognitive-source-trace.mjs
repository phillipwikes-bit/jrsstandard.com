// Read-only source provenance for optional cognitive guidance. A citation's
// presence in the inventory is NOT evidence of relevance or support.
export const SOURCE_TRACE_VERSION = 'ds-n1.cognitive-source-trace/0.1.0-dev';

export function cognitiveSourceTrace(record, claim) {
  if (!record || !Array.isArray(record.sources) || !claim || !Array.isArray(claim.citations)) return [];
  const inventory = new Map(record.sources.filter(s => s && typeof s.source_id === 'string').map(s => [s.source_id, s]));
  return claim.citations.map((citation, index) => {
    const c = citation && typeof citation === 'object' ? citation : {};
    const id = typeof c.source_id === 'string' ? c.source_id : null;
    const src = id === null ? null : inventory.get(id);
    const cps = src && typeof src.text === 'string' ? [...src.text] : [];
    const sent = c.source_sentence;
    const span = c.source_span;
    const validSentence = sent && Number.isInteger(sent.start) && Number.isInteger(sent.end) &&
      sent.start >= 0 && sent.end > sent.start && sent.end <= cps.length &&
      typeof sent.text === 'string' && cps.slice(sent.start, sent.end).join('') === sent.text;
    const sourceIdentityMatches = Boolean(src &&
      (c.source_version == null || c.source_version === src.version) &&
      (c.source_digest == null || c.source_digest === src.digest));
    const spanInSentence = Boolean(validSentence && span &&
      Number.isInteger(span.start) && Number.isInteger(span.end) &&
      span.start >= sent.start && span.end <= sent.end && span.end > span.start);
    const quoteMatches = Boolean(spanInSentence && typeof c.quote === 'string' &&
      (c.quote_match === 'normalised' || cps.slice(span.start, span.end).join('') === c.quote));
    const match = Boolean(sourceIdentityMatches && c.source_found === true &&
      (c.quote_match === 'exact' || c.quote_match === 'normalised') && quoteMatches);
    return {
      citation_index: index,
      source_id: id,
      inventory_status: src ? 'LISTED' : 'NOT_LISTED',
      version: src ? String(src.version ?? '') : null,
      digest: src && typeof src.digest === 'string' ? src.digest : null,
      quote_match: match ? c.quote_match : 'NOT_VERIFIED',
      relevance: typeof c.relevance === 'string' ? c.relevance : 'NOT_ESTABLISHED',
      source_span: match ? { start: c.source_span.start, end: c.source_span.end } : null,
      source_excerpt: match ? c.source_sentence.text : null,
      support_not_determined: true,
    };
  });
}

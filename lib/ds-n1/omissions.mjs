// DS-N1 omission check (2026-11-24): what a record leaves out of its sources.
//
// The review checks what a record SAYS against its sources. This checks the
// other direction: a source the record relies on states something adverse or
// limiting (an open finding, a failed test, a pending step, a condition, a
// recommendation not followed) that the record never mentions. Practitioners
// in the study most often rejected records for exactly this kind of gap.
//
// Advisory only. It never changes the review status, and it is not part of the
// detection templates, so the frozen study predictions are unaffected. It runs
// on any ds-n1.record/1.0 package, hand-built or extracted.
//
// Rule, in full:
//   1. Only sources the record relies on (cited by at least one claim) are read.
//   2. A source sentence is a candidate if the part of it that no claim cites
//      carries an adverse or limiting cue (ADVERSE below). A fully cited sentence
//      is already checked by the review (QUALIFICATION_OMITTED and others).
//   3. It is reported unless some record sentence mentions the same cue word and
//      shares at least one content word with it (the record addressed it).
// Limits: word cues only; an omission phrased without a listed cue is missed,
// and a record that addresses a point in different words may be flagged.

import { sentences, contentWords, fold } from './text.mjs';

export const OMISSION_VERSION = 'ds-n1.omissions/0.1.0-dev';

const ADVERSE = /\b(open|outstanding|unresolved|pending|overdue|failed|fails|rejected|declined|denied|expired|exception|deviation|findings?|medium|high|critical|risk accepted|conditions?|conditional|only if|subject to|provided that|unless|except|recommended|recommends|not (?:yet )?(?:completed|resolved|closed|approved|received|tested|reviewed|verified|signed)|could not|unable|did not|has not|have not|was not|were not|no evidence|incomplete|partial|limitation|caveat)\b/gu;

// A cue preceded by "no", "without" or "zero" (up to one word between: "no
// high-risk findings") is a favourable statement, not an adverse one.
const NEGATED_BEFORE = /\b(no|without|zero|nil)\s+(\S+\s+)?$/u;
const cuesIn = (folded) => [...new Set([...folded.matchAll(ADVERSE)]
  .filter((m) => !NEGATED_BEFORE.test(folded.slice(Math.max(0, m.index - 30), m.index)))
  .map((m) => m[1]))];

export function findOmissions(record) {
  if (!record || !Array.isArray(record.sources) || !Array.isArray(record.claims)) throw new TypeError('A ds-n1.record/1.0 package is required');
  const cited = new Map();
  for (const c of record.claims) for (const ct of c.citations || []) {
    if (!cited.has(ct.source_id)) cited.set(ct.source_id, []);
    cited.get(ct.source_id).push(fold(ct.quote).text);
  }
  const recSents = sentences(record.text || '').map((s) => ({ text: fold(s.text).text, words: new Set(contentWords(s.text)) }));
  const out = [];
  for (const src of record.sources) {
    const quotes = cited.get(src.source_id);
    if (!quotes) continue;
    for (const s of sentences(src.text || '')) {
      // The part of the sentence no claim cites. A fully cited sentence is left
      // to the review; a partly cited one ("completed on 9 July, with two
      // findings open") is read for what the citation left behind.
      let rest = fold(s.text).text;
      for (const q of quotes) if (q && rest.includes(q)) rest = rest.replace(q, ' ');
      if (quotes.some((q) => q && q.includes(fold(s.text).text))) continue;
      const cues = cuesIn(rest);
      if (!cues.length) continue;
      const words = contentWords(s.text);
      const addressed = recSents.some((r) => cues.some((c) => new RegExp(`\\b${c}\\b`, 'u').test(r.text)) && words.some((w) => r.words.has(w)));
      if (addressed) continue;
      out.push({
        check: 'source_point_not_in_record', mode: 'advisory', changes_review_status: false,
        source_id: src.source_id, source_title: src.title, source_span: { start: s.start, end: s.end },
        source_sentence: s.text, cues,
        question: `The record relies on ${src.title}, which also says: "${s.text}" The record does not mention this. Was it considered, and does it change the decision?`,
      });
    }
  }
  return out;
}

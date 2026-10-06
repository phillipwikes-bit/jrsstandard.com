// JRS Review Engine local candidate: development-material contamination screen.
// LOCAL DEVELOPMENT ONLY. Extends dev-material.js (exact and whitespace-normalised copies) with a
// conservative similarity check for EDITED copies of development texts.
//
// It reads nothing and writes nothing. The caller passes the development texts (see
// tests/engine-candidate/shared/dev-index.mjs, which loads a fixed list of development
// directories and nothing else) and the texts to screen. It never reads, writes or creates a
// sealed holdout: a future holdout builder passes its candidate texts in; nothing is stored.
//
// Method: lower-cased word 5-grams ("shingles"). Shingles found in BOILERPLATE_DOCS or more
// development texts are treated as shared structure and ignored, so common phrasing alone cannot
// produce a match. A text is a POSSIBLE match when the distinctive shingles it shares with one
// development text are at least MIN_SHARED in number and at least SHARE_THRESHOLD of either text's
// distinctive shingles, or are LONG_RUN or more in number whatever the surrounding text (a few
// sentences copied word for word into a longer new text). A possible match is for a person to judge; it is never reported as certain.

import { materialHash, isDevelopmentMaterial } from './dev-material.js';

export const CONTAMINATION_VERSION = 'contamination-screen/0.1.0';
export const SHINGLE = 5;
export const BOILERPLATE_DOCS = 4;
export const MIN_SHARED = 8;
export const SHARE_THRESHOLD = 0.5;
export const LONG_RUN = 20;
export const UNCERTAINTY = 'Similarity is a heuristic over word sequences. A possible match means the text shares much of its distinctive wording with a development text; a person must decide whether it is a copy. No match found does not show the text is new: heavy paraphrase, translation and summary are not detected.';

function words(text) {
  return String(text).toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
}

export function shingles(text) {
  var w = words(text), out = new Set();
  for (var i = 0; i + SHINGLE <= w.length; i++) out.add(w.slice(i, i + SHINGLE).join(' '));
  return out;
}

// entries: [{ name, text }]. Returns an in-memory index; nothing is persisted.
export function buildIndex(entries) {
  var docs = entries.map(function (e) { return { name: e.name, hash: materialHash(e.text), shingles: shingles(e.text) }; });
  var df = new Map();
  docs.forEach(function (d) { d.shingles.forEach(function (s) { df.set(s, (df.get(s) || 0) + 1); }); });
  docs.forEach(function (d) { d.distinctive = new Set(Array.from(d.shingles).filter(function (s) { return df.get(s) < BOILERPLATE_DOCS; })); });
  return { version: CONTAMINATION_VERSION, docs: docs, df: df };
}

function round2(x) { return Math.round(x * 100) / 100; }

export function screen(text, index) {
  var exactHash = materialHash(text);
  var exact = index.docs.find(function (d) { return d.hash === exactHash; });
  if (exact) return { version: CONTAMINATION_VERSION, status: 'exact_match', certainty: 'exact or whitespace-only copy', development_source: exact.name, candidates: [] };
  var mine = new Set(Array.from(shingles(text)).filter(function (s) { return (index.df.get(s) || 0) < BOILERPLATE_DOCS; }));
  var candidates = [];
  index.docs.forEach(function (d) {
    if (!d.distinctive.size || !mine.size) return;
    var shared = 0; mine.forEach(function (s) { if (d.distinctive.has(s)) shared++; });
    var ofText = shared / mine.size, ofSource = shared / d.distinctive.size;
    if (shared >= LONG_RUN || (shared >= MIN_SHARED && Math.max(ofText, ofSource) >= SHARE_THRESHOLD)) {
      candidates.push({ development_source: d.name, shared_distinctive_shingles: shared, share_of_screened_text: round2(ofText), share_of_development_text: round2(ofSource) });
    }
  });
  candidates.sort(function (a, b) { return b.shared_distinctive_shingles - a.shared_distinctive_shingles; });
  return candidates.length
    ? { version: CONTAMINATION_VERSION, status: 'possible_development_material', certainty: 'uncertain: needs human review', uncertainty: UNCERTAINTY, candidates: candidates.slice(0, 5) }
    : { version: CONTAMINATION_VERSION, status: 'no_match_found', certainty: 'not proof that the text is new', uncertainty: UNCERTAINTY, candidates: [] };
}

// For a future holdout builder: refuses exact copies outright and lists possible matches for review.
export function screenBatch(texts, index) {
  var results = (texts || []).map(function (t, i) { return Object.assign({ index: i }, screen(t, index)); });
  return {
    version: CONTAMINATION_VERSION,
    exact_copies: results.filter(function (r) { return r.status === 'exact_match'; }).map(function (r) { return r.index; }),
    needs_human_review: results.filter(function (r) { return r.status === 'possible_development_material'; }).map(function (r) { return r.index; }),
    results: results,
    statement: 'Screening result only. It does not admit any text to a holdout; that is a separate, human decision.',
  };
}

export { isDevelopmentMaterial };

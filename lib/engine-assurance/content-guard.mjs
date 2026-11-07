// JRS ENGINE ASSURANCE: unsupported-claim content guard.
//
// Fails a generated technical record that ASSERTS a status this package cannot
// support. It allows the same terms where they are NEGATED ("not production-ready",
// "not independently validated") or MENTIONED rather than used (wrapped in quotes
// or backticks, as in a list of prohibited terms).
//
// WHY A GUARD IS BUILT HERE WHEN ONE WAS DELIBERATELY NOT BUILT ON 2026-09-15.
// .jrs/registries/CLAIMS_REGISTER.json records that a naive substring scan was
// rejected because it flagged negations and the version string 0.1.0-validation.
// This guard answers both objections: matching is whole-word ("validated" does not
// match "validation"), negation and quotation are recognised, and the scope is
// narrow: generated assurance records and this package's own documents, not the
// public site. The negation window is lexical; FM-13 records what it can miss.

export const GUARDED_TERMS = Object.freeze([
  'production-ready', 'production ready', 'validated', 'independently verified', 'compliant',
  'certified', 'guaranteed', 'buyer-ready', 'license-ready', 'licence-ready', 'sale-ready',
]);

const NEGATORS = /\b(?:not|no|never|neither|nor|without|cannot|can't|isn't|aren't|wasn't|doesn't|don't|didn't|won't|none|nothing|unable|lacks?|absent|prohibited|refuses?|refused|avoid|must not|does not|do not|is not|are not|was not|has not|have not|not yet|rather than|instead of)\b/i;
const WINDOW_WORDS = 8;

function termRegex(term) {
  const body = term.replace(/[-\s]/g, '[-\\s]').replace(/\./g, '\\.');
  return new RegExp('(?<![A-Za-z0-9_])' + body + '(?![A-Za-z0-9_])', 'gi');
}

function isQuoted(text, start, end) {
  const before = text[start - 1], after = text[end];
  const pairs = { '"': '"', "'": "'", '`': '`', '“': '”', '‘': '’', '*': '*' };
  if (before && pairs[before] && after === pairs[before]) return true;
  // Inside a backtick code span on the same line.
  const lineStart = text.lastIndexOf('\n', start) + 1;
  const ticks = (text.slice(lineStart, start).match(/`/g) || []).length;
  return ticks % 2 === 1;
}

function isNegated(text, start) {
  const lineStart = text.lastIndexOf('\n', start) + 1;
  let pre = text.slice(lineStart, start);
  // Restrict to the current sentence or clause.
  const cut = Math.max(pre.lastIndexOf('. '), pre.lastIndexOf('; '), pre.lastIndexOf(': '), pre.lastIndexOf('|'));
  if (cut !== -1) pre = pre.slice(cut + 1);
  const words = pre.trim().split(/\s+/).slice(-WINDOW_WORDS).join(' ');
  return NEGATORS.test(words);
}

export function scanUnsupportedClaims(text) {
  const findings = [];
  const s = String(text == null ? '' : text);
  for (const term of GUARDED_TERMS) {
    const re = termRegex(term);
    let m;
    while ((m = re.exec(s)) !== null) {
      const start = m.index, end = start + m[0].length;
      if (isQuoted(s, start, end) || isNegated(s, start)) continue;
      const lineStart = s.lastIndexOf('\n', start) + 1;
      const lineEnd = s.indexOf('\n', end);
      findings.push({ term, start, context: s.slice(lineStart, lineEnd === -1 ? s.length : lineEnd).trim().slice(0, 200) });
    }
  }
  return findings;
}

// Walks every string value in a JSON-like object.
export function scanObject(value) {
  const out = [];
  const walk = (v, path) => {
    if (typeof v === 'string') for (const f of scanUnsupportedClaims(v)) out.push(Object.assign({ path }, f));
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, path + '[' + i + ']'));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], path + '.' + k);
  };
  walk(value, '$');
  return out;
}

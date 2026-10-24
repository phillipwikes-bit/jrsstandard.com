// JRS PHASE 8: claim guard for Phase 8 records.
//
// Extends the v0.1 content guard (imported read-only) with the claims Phase 8 must
// never make: that local testing is independent evaluation, that the Engine is ready
// for release, sale or licensing, that a performance figure exists, or that any named
// organization is involved. A term is allowed where it is negated or quoted, as in a
// list of prohibited statements.

import { scanUnsupportedClaims } from '../engine-assurance/content-guard.mjs';

const NEGATORS = /\b(?:not|no|never|neither|nor|without|cannot|isn't|aren't|doesn't|don't|does not|do not|is not|are not|has not|have not|prohibited|refuses?|before|until|unless|nothing|none)\b/i;
export const PHASE8_PATTERNS = Object.freeze([
  ['independent_evaluation_claim', /\b(?:independently (?:evaluated|validated|tested|reviewed)|independent evaluation (?:shows|showed|found|confirms|confirmed|demonstrates|establishes|was conducted|has been conducted|is complete))\b/i],
  ['local_tests_as_validation', /\blocal (?:tests?|checks?|suite)\b[^.]{0,40}\b(?:establish|establishes|prove|proves|demonstrate|demonstrates|validate|validates|confirm|confirms)\b/i],
  ['readiness_claim', /\b(?:ready for (?:release|production|deployment|sale|licens\w*|use|customers|acquisition)|release[- ]ready|deployment[- ]ready|market[- ]ready|enterprise[- ]ready)\b/i],
  ['performance_figure', /\b(?:accuracy|precision|recall|agreement|false[- ]refusal rate|reliability) (?:of|is|was|=|:)\s*\d/i],
  ['score', /\b(?:confidence score|readiness (?:score|percentage|grade)|market[- ]readiness grade)\b\s*(?:of|is|=|:)/i],
  ['organization_involvement', /\bKPMG\b/],
  ['compliance_claim', /\b(?:complies with|in compliance with|satisfies the requirements of)\b/i],
]);

function negated(text, start) {
  const ls = text.lastIndexOf('\n', start) + 1;
  let pre = text.slice(ls, start);
  const cut = Math.max(pre.lastIndexOf('. '), pre.lastIndexOf('; '), pre.lastIndexOf('|'));
  if (cut !== -1) pre = pre.slice(cut + 1);
  return NEGATORS.test(pre.trim().split(/\s+/).slice(-8).join(' '));
}
function quoted(text, start) {
  const ls = text.lastIndexOf('\n', start) + 1;
  return ((text.slice(ls, start).match(/`/g) || []).length % 2 === 1) || /["“]$/.test(text.slice(Math.max(ls, start - 1), start));
}

export function scanClaims(text) {
  const s = String(text == null ? '' : text);
  const out = scanUnsupportedClaims(s).map((f) => ({ kind: 'guarded_term', term: f.term, context: f.context }));
  for (const [kind, re] of PHASE8_PATTERNS) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(s)) !== null) {
      if (kind !== 'organization_involvement' && (negated(s, m.index) || NEGATORS.test(m[0]) || quoted(s, m.index))) continue;
      if (kind === 'organization_involvement' && quoted(s, m.index)) continue;
      out.push({ kind, term: m[0], context: s.slice(s.lastIndexOf('\n', m.index) + 1, s.indexOf('\n', m.index) === -1 ? s.length : s.indexOf('\n', m.index)).trim().slice(0, 200) });
    }
  }
  return out;
}

// JRS EVIDENCE CONTRACT 0.2.0: prohibited-claim guard for candidate text.
//
// Extends the 0.1 status-claim guard (content-guard.mjs) with the conclusions
// the v0.2 prompt prohibits: legal, compliance, substantive rightness,
// credibility, intent, emotion, fairness, and decision recommendations.
// Lexical and bounded; a negated mention ("does not establish that the decision
// was correct") is allowed. Phrasings outside these patterns are not caught
// (KF-07 in KNOWN_FAILURE_MODES_AND_STOP_CONDITIONS.md).

import { scanUnsupportedClaims } from '../engine-assurance/content-guard.mjs';

export const PROHIBITED_PATTERNS = Object.freeze([
  ['legal_conclusion', /\b(?:lawful|unlawful|legally (?:valid|sound|compliant|required|defensible|binding)|illegal)\b/i],
  ['compliance_conclusion', /\b(?:complies with|in compliance with|meets (?:the |all )?(?:regulatory|legal|compliance) requirements?|satisfies (?:the )?(?:regulation|policy requirements?))\b/i],
  ['substantive_rightness', /\b(?:the (?:right|correct|wrong) decision|decision (?:is|was) (?:correct|right|wrong|justified|sound|appropriate|reasonable))\b/i],
  ['credibility', /\b(?:credible|truthful|dishonest|lying|lied|trustworthy author|reliable witness)\b/i],
  ['intent', /\b(?:intended to|intentionally|deliberately|in bad faith|in good faith|motive|tried to hide)\b/i],
  ['emotion', /\b(?:angry|anxious|upset|frustrated|emotional|afraid|stressed)\b/i],
  ['fairness', /\b(?:fair|unfair|biased|discriminat\w*|equitable)\b/i],
  ['decision_recommendation', /\b(?:should (?:be )?(?:approved?|rejected?|granted?|denied|deny|revoked?|terminated?)|recommend(?:s|ed)? (?:approv\w*|reject\w*|grant\w*|deny\w*|revok\w*)|we advise)\b/i],
]);

const NEGATORS = /\b(?:not|no|never|neither|nor|without|cannot|does not|do not|is not|was not|are not|makes no|no statement|no determination)\b/i;

function negated(text, index) {
  const lineStart = text.lastIndexOf('\n', index) + 1;
  let pre = text.slice(lineStart, index);
  const cut = Math.max(pre.lastIndexOf('. '), pre.lastIndexOf('; '));
  if (cut !== -1) pre = pre.slice(cut + 1);
  return NEGATORS.test(pre.trim().split(/\s+/).slice(-8).join(' '));
}

export function scanProhibitedClaims(text) {
  const s = String(text == null ? '' : text);
  const out = [];
  for (const [category, re] of PROHIBITED_PATTERNS) {
    const g = new RegExp(re.source, 'gi');
    let m;
    while ((m = g.exec(s)) !== null) {
      if (!negated(s, m.index)) out.push({ category, term: m[0], index: m.index });
    }
  }
  for (const f of scanUnsupportedClaims(s)) out.push({ category: 'status_claim', term: f.term, index: f.start });
  return out;
}

// Provenance audit: language and content guards. INTERNAL, LOCAL ONLY. Pure.
//
// Every report the tool writes passes these checks first, and the tool refuses to write a report
// that fails one. They reject legal-conclusion, license-clearance and transaction-readiness
// language, the claim that an excluded file is "secret", credential-like values, and long runs
// of text copied from constructed records or reviewer packets.
import { SECRET_PATTERNS } from './analyze.js';

// [label, pattern]. A sentence may use one of these only after an explicit negation.
export const PROHIBITED = Object.freeze([
  ['clear title', /\bclear title\b|\btitle is clear\b/i], ['commercially cleared', /\bcommercially cleared\b|\bcleared for (?:sale|licensing|commercial)/i],
  ['owned', /\bowned\b|\bowns\b/i], ['ownership established', /\bownership (?:is )?(?:established|confirmed|proven)\b/i],
  ['safe to license', /\bsafe to licen[cs]e\b/i], ['approved for sale', /\bapproved for (?:sale|licensing|transfer)\b/i],
  ['license compliant', /\blicen[cs]e[- ]compliant\b|\bcompliant with (?:its|the|all) licen[cs]es?\b/i],
  ['commercially usable', /\bcommercially usable\b/i], ['permissive', /\bpermissive\b/i], ['clean', /\bclean\b/i], ['safe', /\bsafe\b/i],
  ['unencumbered', /\bunencumbered\b|\bfree of (?:any )?encumbrances?\b/i],
  ['transaction-ready', /\btransaction[- ]ready\b|\bready for (?:a )?(?:transaction|sale|licensing|acquisition|transfer)\b/i],
  ['sale-ready', /\bsale[- ]ready\b|\bacquisition[- ]ready\b/i], ['licensing-ready', /\blicen[cs]ing[- ]ready\b/i],
  ['production-ready', /\bproduction[- ]ready\b|\benterprise[- ]ready\b/i],
  ['secret', /\bsecret\b/i],
]);
const NEGATION = /\b(not|no|never|cannot|nor|without|neither|does not|do not|is not|are not)\b|n['’]t\b/i;

// Returns [{ label, line }] for each un-negated prohibited phrase. Text is never echoed.
export function languageProblems(text) {
  const out = [];
  String(text).split('\n').forEach((line, i) => {
    for (const sentence of line.split(/(?<=[.!?;:])\s+/)) {
      for (const [label, re] of PROHIBITED) {
        const m = sentence.match(re);
        if (m && !NEGATION.test(sentence.slice(0, m.index))) out.push({ label, line: i + 1 });
      }
    }
  });
  return out;
}

export function credentialProblems(text) {
  return SECRET_PATTERNS.filter(([, re]) => re.test(String(text))).map(([name]) => name);
}

// Long runs copied from protected text (constructed records, packet quotations). Lines of the
// protected text of at least `min` characters must not appear in the output.
export function copiedTextProblems(output, protectedTexts, min = 32) {
  const o = String(output), hits = [];
  for (const t of protectedTexts) for (const line of String(t).split('\n')) {
    const s = line.trim();
    if (s.length >= min && o.includes(s)) hits.push(s.length);
  }
  return hits;
}

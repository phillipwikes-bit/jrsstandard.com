// JRS PHASE 7: impact pre-scan (contract tooling, not the candidate).
//
// An independent implementation of every rule trigger in the remediation
// contract, written against the FROZEN v0.3 helpers and the frozen v0.3
// output. It runs before any candidate logic exists and predicts, for every
// input, which rules fire and the condition outcomes the contract then
// requires. The prediction is sealed; the candidate must later match it
// exactly, and any difference is an unintended change.

import { sectionsOf, datedEvents, clausesOf, roleOf } from '../../../lib/engine-evidence-graph/record.mjs';

export const RULES = Object.freeze(['RP-STR-01', 'RP-CHR-01', 'RP-CHR-02', 'RP-CHR-03', 'RP-CHR-04', 'RP-NEG-01', 'RP-EVL-01', 'RP-CON-01', 'RP-SCO-01']);
export const NEGATED_RATIONALE = /\b(?:not|no|never|without)\s+(?:[A-Za-z]+\s+){0,2}?(?:need|needs|needed|require|requires|required|because|based on)\b/i;
export const LOG_CONCEPT = /\b(?:log review|review of (?:the )?(?:access )?logs|(?:access )?logs (?:are|is) reviewed)\b/i;
const IMPLEMENTED = /\b(?:implemented|in place|enabled|active|enforced|require|requires|are reviewed|is reviewed)\b/i;
const NOT_IMPL = /\b(?:pending|not yet (?:implemented|enabled|in place)|planned|to be implemented|will be implemented|not implemented|has not started|not started|has not begun|not begun)\b/i;
export const REWORDED_EMPLOYMENT = /\b(?:keeps?|lose|loses|lost)\s+(?:his|her|their)\s+job\b(?![-\s]+(?:queue|queues|scheduler|runner|title|description|code|reference|log|logs))/i;
export const ALLOWED_SECTION_ROLES = Object.freeze({ identifiable_basis: ['authority', 'basis'], chronology_integrity: ['chronology', 'request', 'authority', 'decision', 'expiry'], reasoning_traceability: ['basis'] });
const DAY = 86400000;

export function triggers(record, g) {
  const t = [];
  if (g === null) return ['RP-STR-01'];
  if (typeof record !== 'string' || g.intake.decision !== 'proceed') return t;
  const sections = sectionsOf(record), ev = datedEvents(record, sections);
  const byStart = (a, b) => a.start - b.start;
  const firstDecision = ev.filter((e) => e.role === 'decision').sort(byStart)[0];
  const firstExpiry = ev.filter((e) => e.role === 'expiry').sort(byStart)[0];
  if (firstDecision && ev.some((e) => e.role === 'assessment' && /\brisk assessment\b/i.test(e.text) && roleOf(e.section) !== 'action' && e.date > firstDecision.date)) t.push('RP-CHR-01');
  if (new Set(ev.filter((e) => e.role === 'expiry').map((e) => e.date)).size > 1) t.push('RP-CHR-02');
  if (!firstDecision) t.push('RP-CHR-03');
  const dsec = sections.find((s) => s.role === 'decision');
  const m = dsec ? /\bfor (\d{1,4}) days?\b/i.exec(record.slice(dsec.content_start, dsec.content_end)) : null;
  if (m && firstDecision && firstExpiry && Math.abs((Date.parse(firstExpiry.date) - Date.parse(firstDecision.date)) / DAY - Number(m[1])) > 1) t.push('RP-CHR-04');
  const asr = g.nodes.filter((n) => n.type === 'assertion');
  const rt = asr.filter((a) => a.condition_id === 'reasoning_traceability' && ['stated_rationale', 'stated_source_reference'].includes(a.assertion_type));
  const neg = (a) => a.assertion_type === 'stated_rationale' && NEGATED_RATIONALE.test(a.quoted_text);
  if (rt.some(neg) && !rt.some((a) => !neg(a))) t.push('RP-NEG-01');
  const evSection = (a) => { const e = g.nodes.find((n) => n.id === 'ev:' + a.assertion_id.slice(3)); return e ? roleOf(e.section) : null; };
  for (const [c, roles] of Object.entries(ALLOWED_SECTION_ROLES)) {
    const f = g.findings.find((x) => x.condition_id === c);
    if (f && f.status === 'supported' && !asr.some((a) => a.condition_id === c && roles.includes(evSection(a)))) { t.push('RP-EVL-01'); break; }
  }
  if (!g.conflicts.some((k) => k.kind === 'control_state_conflict')) {
    const clauses = sections.flatMap((s) => clausesOf(record, s));
    const on = clauses.some((c) => LOG_CONCEPT.test(c.text) && IMPLEMENTED.test(c.text) && !NOT_IMPL.test(c.text));
    const off = clauses.some((c) => LOG_CONCEPT.test(c.text) && NOT_IMPL.test(c.text));
    if (on && off) t.push('RP-CON-01');
  }
  if (REWORDED_EMPLOYMENT.test(record)) t.push('RP-SCO-01');
  return t;
}

// Outcomes the contract requires, derived from the frozen v0.3 output and the fired rules only.
export function expectedStatuses(record, g, fired) {
  const s = Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status]));
  if (fired.includes('RP-SCO-01')) return { gate: 'refuse', statuses: Object.fromEntries(Object.keys(s).map((k) => [k, 'not_assessed'])), conflicts_gained: [] };
  const low = (c) => { if (s[c] !== 'not_assessed') s[c] = 'review_required'; };
  const gained = [];
  if (fired.includes('RP-CHR-01')) { gained.push('assessment_after_decision'); low('chronology_integrity'); }
  if (fired.includes('RP-CHR-02')) { gained.push('expiry_date_conflict'); low('chronology_integrity'); }
  if (fired.includes('RP-CHR-04')) { gained.push('duration_date_conflict'); low('chronology_integrity'); }
  if (fired.includes('RP-CHR-03') && s.chronology_integrity === 'supported') s.chronology_integrity = 'review_required';
  if (fired.includes('RP-NEG-01') && s.reasoning_traceability === 'supported') s.reasoning_traceability = 'review_required';
  if (fired.includes('RP-EVL-01')) for (const [c, roles] of Object.entries(ALLOWED_SECTION_ROLES)) {
    const asr = g.nodes.filter((n) => n.type === 'assertion' && n.condition_id === c);
    const linked = asr.some((a) => { const e = g.nodes.find((n) => n.id === 'ev:' + a.assertion_id.slice(3)); return e && roles.includes(roleOf(e.section)); });
    if (s[c] === 'supported' && !linked) s[c] = 'review_required';
  }
  if (fired.includes('RP-CON-01')) { gained.push('control_state_conflict'); low('sufficiency'); }
  return { gate: g.intake.decision, statuses: s, conflicts_gained: gained };
}

// JRS EVIDENCE GRAPH 0.3.0: visible-contradiction detection.
//
// Identifies record text that states incompatible things. It NEVER resolves a
// conflict: no voting, weighting, scoring, recency rule, or choice of which text
// is correct. Each conflict names the spans involved, the conditions it affects
// (which are then routed to human review), and the fixed statement that the
// Engine identified a record conflict, not the true state of events.
//
// Only explicitly stated text is used. Missing dates are not inferred.

import { sectionsOf, clausesOf, datedEvents, roleOf } from './record.mjs';

// Phase 7 rule triggers (active only when the matching rule pack is loaded).
export const LOG_CONCEPT = /\b(?:log review|review of (?:the )?(?:access )?logs|(?:access )?logs (?:are|is) reviewed)\b/i;
const NOT_STARTED = /\b(?:has not started|not started|has not begun|not begun)\b/i;
const DURATION = /\bfor (\d{1,4}) days?\b/i;
const DAY_MS = 86400000;

const ORDER = { request: 0, assessment: 1, decision: 2, expiry: 3 };
const APPROVED = /\b(?:approved|granted|authori[sz]ed|signed off)\b/i;
const PENDING = /\b(?:pending|awaiting (?:approval|sign-off|authori[sz]ation)|not yet approved|approval (?:is )?outstanding)\b/i;
const CONTROL_NOUNS = ['multi-factor', 'mfa', 'session logging', 'logging', 'log review', 'encryption', 'access review', 'session recording'];
const IMPLEMENTED = /\b(?:implemented|in place|enabled|active|enforced|require|requires|are reviewed|is reviewed)\b/i;
const NOT_IMPLEMENTED = /\b(?:pending|not yet (?:implemented|enabled|in place)|planned|to be implemented|will be implemented|not implemented)\b/i;
const RISK_LOW = /\b(?:low[- ]risk|risk(?: rating| level)?\s*(?::|is)\s*low|residual risk:\s*low)\b/i;
const RISK_OPEN = /\brisk\b[^.;]*\b(?:unresolved|open|not yet assessed|outstanding|high)\b|\b(?:unresolved|high)[- ]risk\b/i;

function allClauses(record, sections) {
  return sections.flatMap((s) => clausesOf(record, s).map((c) => Object.assign(c, { section: s.label, role: s.role })));
}

export function detectRecordConflicts(record, sections = sectionsOf(record), rules = new Set()) {
  const conflicts = [];
  const events = datedEvents(record, sections);
  const add = (kind, spans, affects, summary) => conflicts.push({ kind, spans, affects, summary });

  // K1 two different decision dates.
  const decisions = events.filter((e) => e.role === 'decision');
  const distinct = [...new Map(decisions.map((d) => [d.date, d])).values()];
  if (distinct.length > 1) add('decision_date_conflict', distinct.slice(0, 2), ['chronology_integrity', 'reconstructability'],
    'Two record spans state different decision dates (' + distinct[0].date + ', ' + distinct[1].date + ').');

  // K2 impossible order among explicitly dated events.
  const first = (role) => events.filter((e) => e.role === role).sort((a, b) => a.start - b.start)[0];
  const pairs = [['request', 'decision'], ['decision', 'expiry'], ['request', 'expiry'], ['assessment', 'expiry']];
  for (const [a, z] of pairs) {
    const ea = first(a), ez = first(z);
    if (ea && ez && (z === 'expiry' ? ez.date <= ea.date : ez.date < ea.date)) {
      add('impossible_sequence', [ea, ez], ['chronology_integrity'],
        'The stated ' + z + ' date (' + ez.date + ') does not follow the stated ' + a + ' date (' + ea.date + ').');
      break;
    }
  }

  const clauses = allClauses(record, sections);
  // K3 authority stated both approved and pending.
  const ap = clauses.find((c) => (c.role === 'authority' || c.role === 'decision') && APPROVED.test(c.text) && !PENDING.test(c.text));
  const pe = clauses.find((c) => PENDING.test(c.text) && /\b(?:approv|authori[sz]|sign-off|board)\w*/i.test(c.text));
  if (ap && pe) add('authority_state_conflict', [ap, pe], ['identifiable_basis', 'reasoning_traceability'],
    'The record states the authority as given in one passage and as pending in another.');

  // K4 a named control stated both implemented and not implemented.
  let controlConflict = false;
  for (const noun of CONTROL_NOUNS) {
    const has = (c) => c.text.toLowerCase().includes(noun);
    const on = clauses.find((c) => has(c) && IMPLEMENTED.test(c.text) && !NOT_IMPLEMENTED.test(c.text));
    const off = clauses.find((c) => has(c) && NOT_IMPLEMENTED.test(c.text));
    if (on && off) { add('control_state_conflict', [on, off], ['sufficiency'], 'The control "' + noun + '" is stated as in place in one passage and as not in place in another.'); controlConflict = true; break; }
  }
  // RP-CON-01: the "review of access logs" paraphrase family, only when no other control conflict was found.
  if (rules.has('RP-CON-01') && !controlConflict) {
    const offState = (c) => NOT_IMPLEMENTED.test(c.text) || NOT_STARTED.test(c.text);
    const on = clauses.find((c) => LOG_CONCEPT.test(c.text) && IMPLEMENTED.test(c.text) && !offState(c));
    const off = clauses.find((c) => LOG_CONCEPT.test(c.text) && offState(c));
    if (on && off) add('control_state_conflict', [on, off], ['sufficiency'], 'Log review is stated as in place in one passage and as not in place in another.');
  }

  // K5 risk stated low and unresolved.
  const lo = clauses.find((c) => RISK_LOW.test(c.text));
  const op = clauses.find((c) => RISK_OPEN.test(c.text) && !RISK_LOW.test(c.text));
  if (lo && op) add('risk_state_conflict', [lo, op], ['sufficiency', 'reasoning_traceability'], 'The record states the risk as low in one passage and as unresolved or high in another.');

  // RP-CHR-01: a risk assessment, outside an action section, dated after the first decision.
  const fd = first('decision'), fe = first('expiry');
  if (rules.has('RP-CHR-01') && fd) {
    const late = events.filter((e) => e.role === 'assessment' && /\brisk assessment\b/i.test(e.text) && roleOf(e.section) !== 'action' && e.date > fd.date).sort((a, b) => a.start - b.start)[0];
    if (late) add('assessment_after_decision', [late, fd], ['chronology_integrity'], 'The stated risk assessment date (' + late.date + ') is later than the stated decision date (' + fd.date + ').');
  }
  // RP-CHR-02: more than one distinct expiry date.
  if (rules.has('RP-CHR-02')) {
    const ex = [...new Map(events.filter((e) => e.role === 'expiry').sort((a, b) => a.start - b.start).map((e) => [e.date, e])).values()];
    if (ex.length > 1) add('expiry_date_conflict', ex.slice(0, 2), ['chronology_integrity'], 'Two record spans state different expiry dates (' + ex[0].date + ', ' + ex[1].date + ').');
  }
  // RP-CHR-04: "for N days" in the decision section against the stated decision and expiry dates.
  if (rules.has('RP-CHR-04') && fd && fe) {
    const ds = sections.find((s) => s.role === 'decision');
    const clause = ds ? clausesOf(record, ds).find((c) => DURATION.test(c.text)) : null;
    if (clause) {
      const n = Number(DURATION.exec(clause.text)[1]), days = Math.round((Date.parse(fe.date) - Date.parse(fd.date)) / DAY_MS);
      if (Math.abs(days - n) > 1) add('duration_date_conflict', [clause, fd, fe], ['chronology_integrity'], 'The stated grant of ' + n + ' days does not match the ' + days + ' days between the stated decision date (' + fd.date + ') and expiry date (' + fe.date + ').');
    }
  }
  return { conflicts, events };
}

// K6 two verified quotations cited for the same condition and the same date or
// decision assertion that state incompatible values.
export function detectEvidenceConflicts(evidence) {
  const out = [];
  const byKey = new Map();
  for (const e of evidence) {
    if (!['stated_date', 'stated_expiry', 'stated_decision'].includes(e.assertion_type)) continue;
    const k = e.condition_id + '|' + e.assertion_type;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(e);
  }
  for (const [k, list] of byKey) {
    if (list.length < 2) continue;
    const value = (e) => e.assertion_type === 'stated_decision'
      ? (/\b(?:denied|rejected|declined)\b/i.test(e.quote) ? 'negative' : /\b(?:granted|approved)\b/i.test(e.quote) ? 'positive' : null)
      : ((e.quote.match(/\b\d{4}-\d{2}-\d{2}\b/) || [])[0] || null);
    const vals = list.filter((e) => value(e));
    for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) {
      if (value(vals[i]) !== value(vals[j])) {
        out.push({ kind: 'cited_evidence_conflict', evidence: [vals[i], vals[j]], affects: [k.split('|')[0]],
          summary: 'Two quotations cited for the same ' + k.split('|')[1] + ' state incompatible values.' });
        return out;
      }
    }
  }
  return out;
}

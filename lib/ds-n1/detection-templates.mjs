// DS-N1 detection templates (2026-11-18): the 23 named defect templates of the
// owner's October 2026 programme, each mapped to how DS-N1 detects it.
//
//   mode 'finding'  : detected by an existing DS-N1 rule; the hit is a recorded
//                     finding that already affects review status.
//   mode 'advisory' : detected here, for the first time. Advisory hits are
//                     reported to the reviewer but DO NOT change any finding or
//                     status. They stay advisory until validated, so frozen
//                     evaluation results are not silently altered.
//
// A template being listed and implemented is not evidence that it detects that
// defect accurately; each needs positive, negative and false-warning evidence.
import { buildCognitiveObservations } from './cognitive-observations.mjs';
import { fold } from './text.mjs';

export const TEMPLATE_VERSION = 'ds-n1.detection-templates/0.1.0-dev';
const AUTH_CLASSES = new Set(['supplier_access_exception', 'ai_action_authorization']);
const UNRESOLVED = new Set(['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED']);

const F = (group, codes, filter) => ({ group, mode: 'finding', codes, filter });
const A = (group, appliesTo) => ({ group, mode: 'advisory', appliesTo });

const CONTROL_WORDS = /\b(limited to|subject to|requires?|required|only|restricted|conditions?|sign-?off|must)\b/u;
const RISK_WORDS = /\b(risk|assessment|evaluation|security review)\b/u;
const EXPIRY_WORDS = /\b(expir\w*|until|through|for \w+ (days|weeks|months)|ninety days|thirty days|end date|valid (to|until))\b/u;
const DATE = /\b\d{4}-\d{2}-\d{2}\b/u;

export const TEMPLATES = Object.freeze({
  no_authority_section: A('authority_governance', AUTH_CLASSES),
  authority_source_not_identified: F('authority_governance', ['UNTRACEABLE_AUTHORITY']),
  no_compensating_control_stated: A('authority_governance', AUTH_CLASSES),
  authority_state_conflict: F('authority_governance', ['NEGATION_CONFLICT'], (f, c) => c && c.kind === 'authority'),
  control_state_conflict: F('authority_governance', ['NEGATION_CONFLICT', 'QUALIFICATION_OMITTED'], (f, c) => c && CONTROL_WORDS.test(fold(c.text).text)),
  risk_state_conflict: F('authority_governance', ['NEGATION_CONFLICT'], (f, c) => c && RISK_WORDS.test(fold(c.text).text)),
  no_locatable_conclusion: A('conclusion_reasoning'),
  conclusion_without_traceable_basis: F('conclusion_reasoning', ['REASONING_NOT_TRACED']),
  conclusion_without_basis: F('conclusion_reasoning', ['UNSUPPORTED_CLAIM'], (f, c) => c && c.kind === 'conclusion'),
  basis_without_conclusion: A('conclusion_reasoning'),
  basis_states_no_reason_or_source: F('conclusion_reasoning', ['SOURCE_MISSING', 'UNSUPPORTED_CLAIM'], (f, c) => c && c.kind !== 'conclusion' && !(c.citations || []).length),
  no_stated_expiry_date: A('chronology', AUTH_CLASSES),
  no_explicit_dates: A('chronology', new Set(['supplier_access_exception', 'ai_action_authorization', 'workplace_investigation_report', 'discovery_production_rationale'])),
  decision_date_conflict: F('chronology', ['DATE_MISMATCH'], (f, c) => c && c.kind === 'authority'),
  impossible_sequence: A('chronology'),
  assessment_after_decision: A('chronology'),
  expiry_date_conflict: F('chronology', ['DATE_MISMATCH'], (f, c) => c && c.event && /expir|end/.test(c.event.role || '')),
  duration_date_conflict: A('chronology', AUTH_CLASSES),
  no_dated_decision: A('chronology', AUTH_CLASSES),
  cited_evidence_conflict: F('evidence_quotation', ['NEGATION_CONFLICT', 'CONTRARY_CLAUSE_OMITTED']),
  ambiguous_quotation: A('evidence_quotation'),
  absent_quotation: F('evidence_quotation', ['QUOTE_NOT_FOUND']),
  certainty_language: { group: 'certainty', mode: 'observation' },
});

// Stage order for event roles, from the vocabulary used in DS-N1 records.
function stage(role) {
  const r = String(role || '').toLowerCase();
  if (/request|proposal|report|intake|sent/.test(r)) return 1;
  if (/assess|evaluat|review|test/.test(r) && !/due/.test(r)) return 2;
  if (/approv|authori[sz]|decision|grant/.test(r)) return 3;
  if (/expir|end|revok/.test(r)) return 4;
  return null;
}
const isAssessment = (r) => /assess|evaluat/.test(r || '') && /complet|done|finish/.test(r || '');
const isDecision = (r) => /approv|authori[sz]|decision|grant/.test(r || '');
const NUM = { thirty: 30, sixty: 60, ninety: 90 };
function countAll(hay, needle) {
  if (!needle) return 0;
  const h = fold(hay).text, n = fold(needle).text;
  let i = 0, k = 0;
  while ((i = h.indexOf(n, i)) !== -1) { k++; i += n.length; }
  return k;
}

function advisoryHits(state) {
  const rec = state.record;
  const cls = rec.record_class;
  const claims = state.claims || [];
  const out = [];
  const hit = (template, claimId, detail) => out.push({ template, group: TEMPLATES[template].group, mode: 'advisory', claim_id: claimId, detail, changes_review_status: false });
  const applies = (t) => !TEMPLATES[t].appliesTo || TEMPLATES[t].appliesTo.has(cls);
  const kinds = claims.map((c) => c.kind);

  if (applies('no_authority_section') && !kinds.includes('authority')) hit('no_authority_section', null, 'No claim in the record states who authorised the action.');
  if (applies('no_compensating_control_stated') && !claims.some((c) => CONTROL_WORDS.test(fold(c.text).text))) hit('no_compensating_control_stated', null, 'No claim states a limit, condition or control on the authorised action.');
  if (!kinds.includes('conclusion')) {
    hit('no_locatable_conclusion', null, 'No claim in the record is marked as the conclusion.');
    if (claims.some((c) => c.kind !== 'conclusion' && (c.citations || []).length)) hit('basis_without_conclusion', null, 'Supported statements are recorded, but no conclusion draws on them.');
  }
  if (applies('no_stated_expiry_date') && !EXPIRY_WORDS.test(fold(rec.text).text)) hit('no_stated_expiry_date', null, 'The record does not state when the authorization ends.');
  if (applies('no_explicit_dates') && !DATE.test(rec.text)) hit('no_explicit_dates', null, 'The record text contains no explicit date.');
  if (applies('no_dated_decision')) {
    for (const c of claims.filter((x) => x.kind === 'authority')) {
      if (!DATE.test(c.text) && !(c.event && c.event.date)) hit('no_dated_decision', c.claim_id, 'The authorization statement gives no date.');
    }
  }

  // Sequence across documented source events.
  const events = rec.sources.flatMap((s) => (s.events || []).map((e) => ({ ...e, source_id: s.source_id })));
  for (const a of events) for (const b of events) {
    const sa = stage(a.role), sb = stage(b.role);
    if (!a.date || !b.date || sa === null || sb === null) continue;
    if (sa < sb && a.date > b.date) {
      const both = isAssessment(a.role) && isDecision(b.role);
      hit(both ? 'assessment_after_decision' : 'impossible_sequence', null,
        `${a.role} (${a.source_id}, ${a.date}) is dated after ${b.role} (${b.source_id}, ${b.date}).`);
    }
  }

  // Duration stated in a claim against start and end events in the sources.
  if (applies('duration_date_conflict')) {
    const start = events.find((e) => /approv|authori[sz]|effective|start/.test(e.role || ''));
    const end = events.find((e) => /expir|end/.test(e.role || ''));
    if (start && end) {
      const days = Math.round((Date.parse(end.date) - Date.parse(start.date)) / 86400000);
      for (const c of claims) {
        const m = fold(c.text).text.match(/\b(\d+|thirty|sixty|ninety) days\b/u);
        if (!m) continue;
        const n = NUM[m[1]] ?? Number(m[1]);
        if (Number.isFinite(n) && n !== days) hit('duration_date_conflict', c.claim_id, `The claim states ${n} days; the source dates span ${days} days.`);
      }
    }
  }

  // A quotation that occurs more than once in its cited source.
  for (const c of claims) for (const ct of c.citations || []) {
    const s = rec.sources.find((x) => x.source_id === ct.source_id);
    if (s && countAll(s.text, ct.quote) > 1) hit('ambiguous_quotation', c.claim_id, `The quoted words occur more than once in ${s.source_id}, so the passage relied on is ambiguous.`);
  }
  return out;
}

// Input: a normal deriveState result. Output: every template hit, finding-based
// and advisory, each naming its template.
export function runDetectionTemplates(state) {
  if (!state || !Array.isArray(state.findings) || !Array.isArray(state.claims)) {
    throw new TypeError('A deriveState result with claims and findings is required');
  }
  if (!state.record || state.status === 'ERROR' || state.status === 'REFUSED_SCOPE') return [];
  const claimById = new Map(state.claims.map((c) => [c.claim_id, c]));
  const active = state.findings.filter((f) => f && f.status !== 'SUPERSEDED' && UNRESOLVED.has(f.status));
  const out = [];
  for (const [id, t] of Object.entries(TEMPLATES)) {
    if (t.mode !== 'finding') continue;
    for (const f of active) {
      if (!t.codes.includes(f.code)) continue;
      const c = claimById.get(f.claim_id);
      if (t.filter && !t.filter(f, c)) continue;
      out.push({ template: id, group: t.group, mode: 'finding', claim_id: f.claim_id || null, finding_id: f.finding_id, code: f.code, changes_review_status: true });
    }
  }
  for (const o of buildCognitiveObservations(state)) {
    if (o.kind === 'unsupported_certainty') out.push({ template: 'certainty_language', group: 'certainty', mode: 'observation', claim_id: o.claim_id, detail: o.concern, changes_review_status: false });
  }
  return [...out, ...advisoryHits(state)];
}

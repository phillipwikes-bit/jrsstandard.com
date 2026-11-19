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
// Three advisory templates were added on 2026-11-19 from a practitioner's blind
// review of a constructed record: approver_role_not_stated,
// conclusory_evidence_summary and no_stop_or_redress_path. Attribution wording
// awaits that practitioner's approval and is deliberately not recorded here.
// On 2026-11-19 a second blind review exposed further misses; five advisory
// templates were added and the result-summary word list broadened. They are
// tested on new constructed records, never on the record that exposed them.
//
// A template being listed and implemented is not evidence that it detects that
// defect accurately; each needs positive, negative and false-warning evidence.
import { buildCognitiveObservations } from './cognitive-observations.mjs';
import { fold } from './text.mjs';

export const TEMPLATE_VERSION = 'ds-n1.detection-templates/0.4.0-dev';
const AUTH_CLASSES = new Set(['supplier_access_exception', 'ai_action_authorization']);
const UNRESOLVED = new Set(['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED']);

const F = (group, codes, filter) => ({ group, mode: 'finding', codes, filter });
const A = (group, appliesTo) => ({ group, mode: 'advisory', appliesTo });

const CONTROL_WORDS = /\b(limited to|subject to|requires?|required|only|restricted|conditions?|sign-?off|must|at most|no more than|maximum|cap(ped)?|per (day|week|month|order|customer|batch))\b/u;
const RISK_WORDS = /\b(risk|assessment|evaluation|security review)\b/u;
const EXPIRY_WORDS = /\b(expir\w*|until|through|for \w+ (days|weeks|months)|ninety days|thirty days|end date|valid (to|until)|ends? (on|at)|lapses?)\b/u;
const DATE = /\b\d{4}-\d{2}-\d{2}\b/u;
const ROLE_WORDS = /\b(director|manager|officer|head of|lead|controller|chief|president|vp|administrator|owner|partner|counsel|chair|treasurer|supervisor|cfo|ceo|cio|ciso|coo|cto)\b/u;
// Result wording that reports an outcome without saying what was examined.
const CONCLUSORY = new RegExp([
  'no (significant|material|high-risk|major|notable|serious) (findings|issues|concerns|risks|problems)',
  'no (findings|issues|concerns|problems|errors|defects) (were )?(identified|found|noted|raised|reported|observed)',
  '(raised|found|identified|reported|showed|revealed|surfaced) no (findings|issues|concerns|problems|errors|defects|risks)',
  'without (any )?(issues|incident|problems|concerns)',
  'nothing of concern', 'found satisfactory', 'passed review',
  'found (the )?(\\w+ ){0,2}(acceptable|satisfactory|adequate|sufficient|low)',
  '(was|were) (satisfactory|acceptable|successful)', 'went (well|smoothly)',
].map((x) => `\\b${x}\\b`).join('|'), 'u');
const SCOPE_WORDS = /\b(tested|testing|sampled?|samples|scope|covered|checked|examined|reviewed \d|method|criteria)\b/u;
const POLICY_WORDS = /\b(polic(y|ies)|delegat\w*|mandate|charter|authority matrix|procedure|standard|bylaws?|board resolution|section \d|clause \d|signing authority)\b/u;
const EXPIRY_STATED = /\b(expir\w*|runs until|valid (to|until)|until \d{4}-\d{2}-\d{2}|end date|ends on)\b/u;
const POST_EXPIRY = /\b(renew\w*|re-?approv\w*|re-?authori[sz]\w*|extension|extend\w*|lapses?|revert\w*|stops? automatically|ends? automatically|review(ed)? (before|at|on|ahead of))\b/u;
const AMOUNT_LIMIT = /(\$\s?\d|\b(under|below|less than|up to|maximum of|not (to )?exceed)\s+(\$|usd|eur|gbp|£|€)?\s?\d)/u;
const VOLUME_CAP = /\b(per (day|week|month|customer|account|supplier|batch|transaction)|daily|weekly|monthly|no more than \d+|at most \d+|up to \d+ (refunds|payments|messages|emails|transactions))\b/u;
const NO_HUMAN = /\b(without (any )?(human|manual|staff) (review|oversight|approval|sign-?off|involvement)|no human (review|oversight|in the loop)|fully automat\w*|unattended)\b/u;
// A hedged source term ("recommended", "should") restated as a firm one.
const WEAK_SRC = /\b(may|might|could|possibl[ey]|proposed|recommend\w*|should|optional|where possible|pending|draft|provisional|planned|encouraged)\b/u;
const FIRM_CLAIM = /\b(must|shall|required|requires|mandatory|subject to|enforced|is in place|are in place|always)\b/u;
const STOP_WORDS = /\b(stop|stopped|suspend\w*|revok\w*|halt\w*|pause\w*|opt[- ]out|unsubscrib\w*|complain\w*|withdraw\w*|kill switch|switch(ed)? off|turn(ed)? off)\b/u;

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
  approver_role_not_stated: A('authority_governance', AUTH_CLASSES),
  conclusory_evidence_summary: A('evidence_quotation'),
  no_stop_or_redress_path: A('authority_governance', new Set(['ai_action_authorization'])),
  no_authority_basis_cited: A('authority_governance', AUTH_CLASSES),
  human_oversight_removed: A('authority_governance', new Set(['ai_action_authorization'])),
  amount_limit_without_volume_cap: A('authority_governance', new Set(['ai_action_authorization'])),
  no_post_expiry_terms: A('chronology', AUTH_CLASSES),
  date_not_in_sources: A('chronology'),
  hedged_source_stated_firmly: A('evidence_quotation'),
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
  // Record-level: a decision is undated only when no authority statement in the
  // record carries a date. A second authority sentence (for example, naming the
  // policy relied on) need not repeat the date.
  if (applies('no_dated_decision')) {
    const auth = claims.filter((x) => x.kind === 'authority');
    if (auth.length && !auth.some((c) => DATE.test(c.text) || (c.event && c.event.date))) {
      hit('no_dated_decision', auth[0].claim_id, 'No authorization statement in the record gives a date.');
    }
  }

  // The approver is named but no statement in the record gives their role, so a
  // reader cannot tell whether the cited authority let them approve.
  if (applies('approver_role_not_stated')) {
    const names = (id) => {
      const e = (rec.entities || []).find((x) => x.entity_id === id);
      return e ? [e.name, ...(e.aliases || [])].map((n) => fold(n).text) : [];
    };
    const sentences = fold(rec.text).text.split(/(?<=[.;])\s+/u);
    for (const c of (rec.claims || []).filter((x) => x.kind === 'authority' && x.actor)) {
      const ns = names(c.actor);
      if (!ns.length) continue;
      if (!sentences.some((t) => ns.some((n) => t.includes(n)) && ROLE_WORDS.test(t))) {
        hit('approver_role_not_stated', c.claim_id, 'The record names who approved but not their role, so it cannot show they were entitled to approve.');
        break;
      }
    }
  }
  // A result summary ("no significant findings") with no statement of what was
  // examined. Checked in the record's own words, not in the source.
  if (applies('conclusory_evidence_summary') && !SCOPE_WORDS.test(fold(rec.text).text)) {
    for (const c of claims) {
      if (CONCLUSORY.test(fold(c.text).text)) {
        hit('conclusory_evidence_summary', c.claim_id, 'The result is summarised without saying what was examined, what was found or where the evaluation is kept.');
      }
    }
  }
  // An AI action that reaches people, with no stated way to stop it or for the
  // people affected to ask for it to stop.
  if (applies('no_stop_or_redress_path') && !STOP_WORDS.test(fold(rec.text).text)) {
    hit('no_stop_or_redress_path', null, 'The record states no way to stop the action, and no route for someone wrongly affected to ask for it to stop.');
  }

  // An approver is named but nothing says which policy, delegation or mandate
  // let them approve.
  if (applies('no_authority_basis_cited') && kinds.includes('authority') && !POLICY_WORDS.test(fold(rec.text).text)) {
    hit('no_authority_basis_cited', claims.find((c) => c.kind === 'authority').claim_id, 'The record does not name the policy, delegation or mandate under which the approval was given.');
  }
  // Human review is removed; the reviewer should see what replaces it.
  if (applies('human_oversight_removed')) {
    const c = claims.find((x) => NO_HUMAN.test(fold(x.text).text));
    if (c) hit('human_oversight_removed', c.claim_id, 'The record removes human review. Check that a compensating control and a named owner are stated.');
  }
  // An amount ceiling with no limit on how often or how many.
  if (applies('amount_limit_without_volume_cap')) {
    const t = fold(rec.text).text;
    if (AMOUNT_LIMIT.test(t) && !VOLUME_CAP.test(t)) hit('amount_limit_without_volume_cap', null, 'An amount limit is stated, but no limit on how many actions, how often, or per person.');
  }
  // An end date is stated, but not what happens at or after it.
  if (applies('no_post_expiry_terms')) {
    const t = fold(rec.text).text;
    const hasEnd = EXPIRY_STATED.test(t) || rec.sources.some((s) => (s.events || []).some((e) => /expir|end/.test(e.role || '')));
    if (hasEnd && !POST_EXPIRY.test(t)) hit('no_post_expiry_terms', null, 'The record states when the authorization ends but not what happens then: renewal, review or automatic stop.');
  }
  // A date the record states that appears in no source: the record's own
  // inference, which a reviewer cannot trace.
  if (applies('date_not_in_sources')) {
    const srcText = rec.sources.map((s) => s.text).join(' ');
    const srcDates = new Set(rec.sources.flatMap((s) => (s.events || []).map((e) => e.date)));
    for (const c of claims) {
      for (const d of c.text.match(/\b\d{4}-\d{2}-\d{2}\b/gu) || []) {
        if (!srcText.includes(d) && !srcDates.has(d)) {
          hit('date_not_in_sources', c.claim_id, `The record states ${d}, but no source gives that date.`);
        }
      }
    }
  }

  // A claim that states as firm what its cited source only hedges.
  if (applies('hedged_source_stated_firmly')) {
    for (const c of claims) {
      const ct = fold(c.text).text;
      if (!FIRM_CLAIM.test(ct) || WEAK_SRC.test(ct)) continue;
      for (const cit of c.citations || []) {
        const src = rec.sources.find((x) => x.source_id === cit.source_id);
        if (!src) continue;
        const sentences = fold(src.text).text.split(/(?<=[.;])\s+/u);
        const q = fold(cit.quote || '').text;
        const hedged = sentences.find((t) => t.includes(q) && WEAK_SRC.test(t));
        if (hedged) { hit('hedged_source_stated_firmly', c.claim_id, `The record states this as firm; the cited source only says: "${hedged.trim()}"`); break; }
      }
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

// JRS PHASE 9: Human Evidence Dossier. Converts a v0.3.1 candidate evidence graph into one bounded
// reviewer packet per assessed condition. Deterministic: the same graph gives the same dossiers.
// The dossier copies the Engine result; it never improves it, never selects a reviewer outcome and
// never states that a quotation proves a finding.

import { createHash } from 'node:crypto';
import { DOSSIER_FORMAT, PRESENCE_STATEMENT, ENGINE_RESULT_STATEMENT, CONDITIONS, OUTCOMES, ESCALATION_TRIGGERS, PHASE9_STATEMENTS, RELEASE_STATUS } from './contract.mjs';
import { CONTROL_IDS } from './controls.mjs';

export function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
export const hashOf = (v) => 'sha256:' + createHash('sha256').update(canonical(v)).digest('hex');
const VERIFIED = ['verified_unique', 'verified_disambiguated'];
const REVIEW_STATUSES = ['review_required', 'not_assessed', 'gap'];

// Escalation triggers come from the Engine output only.
export function escalationFor(condition, status, quotes, conflicts, refused) {
  const t = [];
  if (!quotes.some((q) => q.verified)) t.push('ET1');
  if (conflicts.some((c) => (c.affects || []).includes(condition))) t.push('ET2');
  if (refused || status === 'not_assessed') t.push('ET3');
  return t;
}

// graph: candidate evidence graph; ctx: { record_id, synthetic: true, case_id }
export function buildDossiers(graph, ctx) {
  if (!ctx || ctx.synthetic !== true) throw new Error('REFUSED: dossiers are built only from synthetic material in this package');
  const refused = graph.intake && graph.intake.decision === 'refuse';
  const limitationOf = (cid) => { const e = graph.edges.find((x) => x.type === 'LIMITS' && x.to === 'find:' + cid); const n = e ? graph.nodes.find((x) => x.id === e.from) : null; return n ? n.text : null; };
  const routed = (cid) => graph.edges.some((x) => x.type === 'ROUTES_TO_REVIEW' && x.from === 'find:' + cid);
  return graph.findings.map((f) => {
    const quotes = graph.nodes.filter((n) => n.type === 'proposed_quote' && n.condition_id === f.condition_id).map((n) => {
      const ev = graph.nodes.find((x) => x.id === 'ev:' + n.observation_id);
      return { observation_id: n.observation_id, quotation: n.quote, assertion_type: n.assertion_type, verification_state: n.quote_resolution_status, verified: VERIFIED.includes(n.quote_resolution_status),
        assertion_accepted: graph.nodes.some((x) => x.type === 'assertion' && x.id === 'as:' + n.observation_id),
        section: ev ? ev.section : null, start: ev ? ev.start : null, end: ev ? ev.end : null };
    });
    const conflicts = graph.conflicts.filter((c) => (c.affects || []).includes(f.condition_id)).map((c) => ({ kind: c.kind, summary: c.summary }));
    const triggers = escalationFor(f.condition_id, f.status, quotes, graph.conflicts, refused);
    const d = {
      dossier_format: DOSSIER_FORMAT, statements: PHASE9_STATEMENTS, release_status: RELEASE_STATUS,
      record: { record_id: ctx.record_id, case_id: ctx.case_id || null, material: 'synthetic_engineering_fixture', record_sha256: graph.identity.record_sha256 },
      engine: { compiler_version: graph.compiler_version, graph_sha256: graph.identity.graph_sha256, rule_packs: (graph.rule_packs.packs || []).map((p) => ({ pack_id: p.pack_id, pack_version: p.pack_version, content_sha256: p.content_sha256 })), rule_packs_valid: graph.rule_packs.valid },
      condition: { condition_id: f.condition_id, name: CONDITIONS[f.condition_id].name },
      engine_result: { status: f.status, reasons: [...f.reasons], routed_to_review: routed(f.condition_id) || REVIEW_STATUSES.includes(f.status), statement: ENGINE_RESULT_STATEMENT },
      quotations: quotes, conflict_indicators: conflicts,
      refusal: refused ? { codes: [...new Set(graph.refusals.map((r) => r.code))] } : null,
      engine_limitation: limitationOf(f.condition_id),
      review_route: graph.human_review_route ? graph.human_review_route.route : null,
      presence_statement: PRESENCE_STATEMENT,
      reviewer_question: CONDITIONS[f.condition_id].question,
      admissible_outcomes: [...OUTCOMES],
      reviewer_response: { outcome: null, rationale: null, cited_evidence: null, confidence: null, reviewer_placeholder: null, completed_by: 'human reviewer only' },
      escalation: { required: triggers.length > 0, triggers: triggers.map((t) => ({ id: t, text: ESCALATION_TRIGGERS[t] })), abstention_available: true },
      cognitive_controls: [...CONTROL_IDS],
    };
    d.dossier_sha256 = hashOf(d);
    return d;
  });
}

const PROOF = /\b(?:proves?|proven|establishes the finding|confirms the finding|demonstrates (?:that )?the finding|is (?:therefore )?supported by the quotation|quotation supports the finding)\b/i;
const REQUIRED = ['dossier_format', 'record', 'engine', 'condition', 'engine_result', 'quotations', 'conflict_indicators', 'engine_limitation', 'presence_statement', 'reviewer_question', 'admissible_outcomes', 'reviewer_response', 'escalation', 'cognitive_controls'];
export function validateDossier(d) {
  const p = [];
  if (!d || typeof d !== 'object') return ['dossier missing'];
  for (const k of REQUIRED) if (d[k] === undefined || d[k] === '') p.push('missing ' + k);
  if (!d.condition || !CONDITIONS[d.condition.condition_id]) p.push('finding lacks a known condition');
  if (!d.engine_limitation) p.push('finding lacks its limitation');
  if (d.presence_statement !== PRESENCE_STATEMENT) p.push('presence-is-not-support statement missing or altered');
  if (!d.reviewer_question || (d.condition && CONDITIONS[d.condition.condition_id] && d.reviewer_question !== CONDITIONS[d.condition.condition_id].question)) p.push('reviewer question missing or altered');
  if (JSON.stringify(d.admissible_outcomes) !== JSON.stringify(OUTCOMES)) p.push('admissible outcomes altered');
  const r = d.reviewer_response || {};
  if (r.outcome !== null || r.rationale !== null || r.cited_evidence !== null || r.confidence !== null || r.reviewer_placeholder !== null) p.push('reviewer response pre-filled');
  for (const q of d.quotations || []) if (q.verified && (q.start === null || q.end === null || q.section === null)) p.push('verified quotation without offsets or section');
  for (const q of d.quotations || []) if (!q.verified && q.verification_state && /^verified/.test(q.verification_state)) p.push('verification state inconsistent');
  for (const q of d.quotations || []) if (q.assertion_accepted && !q.verified) p.push('assertion accepted for an unverified quotation');
  const triggers = escalationFor(d.condition ? d.condition.condition_id : '', d.engine_result ? d.engine_result.status : null, d.quotations || [], (d.conflict_indicators || []).map((c) => ({ affects: [d.condition.condition_id] })), !!d.refusal);
  if (!d.escalation || d.escalation.required !== triggers.length > 0 || JSON.stringify(d.escalation.triggers.map((t) => t.id)) !== JSON.stringify(triggers)) p.push('escalation does not follow the Engine output');
  if (d.escalation && d.escalation.abstention_available !== true) p.push('abstention unavailable');
  if (JSON.stringify(d.cognitive_controls) !== JSON.stringify(CONTROL_IDS)) p.push('Cognitive Control set incomplete');
  // Scanned: the text this package authors. Copied Engine text (its limitation, quotations and conflict
  // summaries) is excluded because the Engine limitation itself says what the text does not prove.
  const authored = Object.assign({}, d, { engine_limitation: null, quotations: (d.quotations || []).map((q) => Object.assign({}, q, { quotation: null })), conflict_indicators: (d.conflict_indicators || []).map((c) => Object.assign({}, c, { summary: null })) });
  if (PROOF.test(JSON.stringify(authored))) p.push('dossier asserts that a quotation proves the finding');
  if (/"(?:approved|approval|recommendation|recommended_outcome|legal_conclusion)"\s*:/i.test(JSON.stringify(d))) p.push('dossier converts the Engine result into an approval, recommendation or legal conclusion');
  const { dossier_sha256, ...rest } = d;
  if (dossier_sha256 !== hashOf(rest)) p.push('dossier hash mismatch');
  return p;
}

// The dossier may never be more favourable than the Engine result it copies.
export function dossierNotMoreFavourable(d, graph) {
  const f = graph.findings.find((x) => x.condition_id === d.condition.condition_id);
  return !!f && d.engine_result.status === f.status && (!REVIEW_STATUSES.includes(f.status) || d.engine_result.routed_to_review === true);
}

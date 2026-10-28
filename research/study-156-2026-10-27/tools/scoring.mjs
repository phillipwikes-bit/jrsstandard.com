// 156-record study: pre-specified scoring. Written before any scored run and frozen with the runner.
// Pure functions over a compiled graph; no I/O.
//
// E1 (primary, the study rule): is a documentation flaw in the record's basis signalled?
//   FLAG           any basis condition (reconstructability, identifiable_basis, reasoning_traceability) is "gap",
//                  or carries a record-flaw reason (a visible basis gap the compiler found, the authority-only
//                  reason, or a decision-outcome conflict).
//   CLEAR          all three basis conditions are "supported" (a favourable signal; human review still required).
//   INDETERMINATE  neither: review_required for reasons that are not record flaws (candidate citation problems,
//                  quotation failures, instruction risk, other conflicts, a candidate gap the rules did not confirm).
//   NOT_ASSESSED   the intake stopped, or every basis condition is not_assessed.
// Reference: UNGROUNDED = flaw present; GROUNDED = no flaw. Sensitivity counts FLAG among UNGROUNDED; false alarm
// counts FLAG among GROUNDED; false reassurance counts CLEAR among UNGROUNDED; abstention counts INDETERMINATE and
// NOT_ASSESSED. These are agreement rates with an AI-authored or LLM-reproduced reference, not accuracy.

export const BASIS_CONDITIONS = Object.freeze(['reconstructability', 'identifiable_basis', 'reasoning_traceability']);
export const FLAW_GAPS = Object.freeze(['no_identifiable_basis_evidence', 'conclusion_without_identifiable_basis', 'conclusion_restated_as_basis',
  'conclusion_without_stated_basis', 'no_locatable_conclusion', 'authority_source_not_identified', 'no_authority_section', 'conclusion_without_traceable_basis', 'basis_states_no_reason_or_source']);
const FLAW_REVIEW = Object.freeze(['authority_reference_without_linked_facts', 'conclusion_without_identifiable_basis', 'conclusion_without_traceable_basis', 'conclusion_without_basis']);
export function isFlawReason(r) {
  const m = /^(?:visible_gap|candidate_supported_but_visible_gap):(.+)$/.exec(r);
  if (m) return m[1].split(',').some((g) => FLAW_GAPS.includes(g));
  if (r.startsWith('rule:')) return FLAW_REVIEW.includes(r.slice(5));
  return r === 'record_conflict:decision_outcome_conflict';
}
export function classifyE1(g) {
  if (!g || !g.intake || g.intake.decision !== 'proceed') return 'NOT_ASSESSED';
  const f = Object.fromEntries(g.findings.map((x) => [x.condition_id, x]));
  if (BASIS_CONDITIONS.every((c) => f[c].status === 'not_assessed')) return 'NOT_ASSESSED';
  if (BASIS_CONDITIONS.some((c) => f[c].status === 'gap' || f[c].reasons.some(isFlawReason))) return 'FLAG';
  if (BASIS_CONDITIONS.every((c) => f[c].status === 'supported')) return 'CLEAR';
  return 'INDETERMINATE';
}

// E2: the four questions, each checked only on the construction types it targets.
export function e2(g, designed) {
  if (!g || g.intake.decision !== 'proceed' || !designed) return null;
  const f = Object.fromEntries(g.findings.map((x) => [x.condition_id, x]));
  const kinds = g.conflicts.map((k) => k.kind);
  const chronoConflict = kinds.includes('same_event_date_conflict') || g.conflicts.some((k) => k.kind === 'cited_evidence_conflict' && k.affects.includes('chronology_integrity'))
    || kinds.includes('decision_date_conflict') || kinds.includes('impossible_sequence');
  const decisionConflict = kinds.includes('decision_outcome_conflict') || g.conflicts.some((k) => k.kind === 'cited_evidence_conflict' && !k.affects.includes('chronology_integrity'));
  const authorityOnly = f.identifiable_basis.reasons.some((r) => r === 'rule:authority_reference_without_linked_facts')
    || f.identifiable_basis.status !== 'supported' && g.cognitive_controls.some((c) => c.defect === 'authority_reference_without_linked_facts');
  const restated = f.reasoning_traceability.reasons.some((r) => /conclusion_restated_as_basis/.test(r)) || g.cognitive_controls.some((c) => c.defect === 'conclusion_restated_as_basis');
  const out = {};
  if (designed.q1 === 'authority_without_linked_facts') out.q1 = { expected: 'basis not supported; authority-only signalled', pass: f.identifiable_basis.status !== 'supported' && (authorityOnly || f.identifiable_basis.reasons.some(isFlawReason) || f.identifiable_basis.status === 'gap') };
  if (designed.q1 === 'authority_with_linked_facts') out.q1 = { expected: 'no authority-only signal', pass: !authorityOnly };
  if (designed.q2 === 'conclusion_restated_as_basis') out.q2 = { expected: 'restated conclusion signalled; reasoning not supported', pass: restated && f.reasoning_traceability.status !== 'supported' };
  if (designed.q3 === 'different_events_no_conflict') out.q3 = { expected: 'no date conflict', pass: !chronoConflict };
  if (designed.q3 === 'same_event_two_dates') out.q3 = { expected: 'date conflict raised; chronology not supported', pass: chronoConflict && f.chronology_integrity.status !== 'supported' };
  if (designed.q4 === 'separate_requests_no_contradiction') out.q4 = { expected: 'no decision contradiction', pass: !decisionConflict };
  return out;
}

// Guards that must hold on every research-profile graph (assignment: no Ready verdict, no legal or compliance
// conclusion, no favourable sufficiency finding).
const READY = /\b(?:ready|readiness|approved for use|compliant|compliance (?:met|achieved)|lawful|legally sufficient|validated)\b/i;
export function guards(g) {
  const p = [];
  if (!g) return ['no_graph'];
  if (g.findings.some((f) => f.condition_id === 'sufficiency' && f.status === 'supported')) p.push('sufficiency_supported');
  const authored = JSON.stringify([g.findings.map((f) => [f.explanation, f.reasons]), g.conflicts.map((k) => k.summary), g.cognitive_controls, g.refusals.map((r) => r.boundary)]);
  if (READY.test(authored.replace(/not_assessed|NO_GO_NOT_VERIFIED|not validated/g, ''))) p.push('ready_or_compliance_language');
  for (const k of ['overall_pass', 'overall_score', 'overall_determination', 'readiness_verdict', 'legal_conclusion', 'compliance_certification']) if (k in g) p.push('prohibited_key:' + k);
  if (!g.findings.every((f) => g.edges.some((e) => e.type === 'ROUTES_TO_REVIEW' && e.from === 'find:' + f.condition_id))) p.push('finding_not_routed_to_review');
  return p;
}

// Cognitive-control mechanics per graph: count, words, traceability (span links), redundancy, contradiction.
export function controlMechanics(g, record) {
  const cs = g.cognitive_controls || [];
  const words = cs.reduce((n, c) => n + ['detect', 'reflect', 'correct', 'learn'].reduce((m, k) => m + String(c[k] || '').split(/\s+/).filter(Boolean).length, 0), 0);
  const defects = cs.map((c) => c.defect);
  const redundant = defects.length - new Set(defects).size;
  const spanLinked = cs.filter((c) => (c.span_ids || []).length > 0).length;
  const spanOk = cs.every((c) => (c.span_ids || []).every((id) => g.nodes.some((n) => n.id === id && n.type === 'record_span' && record.slice(n.start, n.end) === n.text)));
  // A control contradicts the graph when it states a defect the graph's own rule outputs do not support.
  const hasDates = g.nodes.some((n) => n.type === 'record_span' && (n.origins || []).some((o) => /dated_event/.test(o)));
  const contradictions = [];
  if (defects.includes('no_explicit_dates') && hasDates) contradictions.push('no_explicit_dates_with_dated_events');
  if (defects.includes('no_locatable_conclusion') && g.findings.some((f) => f.condition_id === 'reconstructability' && f.status === 'supported')) contradictions.push('no_conclusion_but_reconstructability_supported');
  return { controls: cs.length, withheld: (g.controls_withheld || []).length, words, redundant_same_defect: redundant, span_linked: spanLinked, span_links_valid: spanOk, contradictions };
}

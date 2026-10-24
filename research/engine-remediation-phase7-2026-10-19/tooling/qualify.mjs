// JRS PHASE 7: differential qualification of the v0.3.1 candidate against frozen v0.3.
//
// Every input is compiled by both. The Phase 6 differential router (unchanged)
// compares the two behaviour records. The candidate may differ only where the
// sealed intended change set (existing inputs) or the sealed scenario
// differential (Phase 7 scenarios) says so, and only towards the sealed outcome.

import { compareRecords } from '../../../lib/engine-reliability/differ.mjs';
import { recordFromGraph } from '../../../lib/engine-reliability/baseline.mjs';
import { evaluateScenario } from '../../../lib/engine-reliability/library.mjs';

export const CLASSES = Object.freeze(['no_behavioral_difference', 'intended_safe_degradation', 'intended_refusal', 'intended_safe_routing', 'unintended_regression',
  'favorable_transition_requiring_human_review', 'limitation_loss', 'evidence_integrity_defect', 'scope_boundary_defect']);
export const RULE_CONDITIONS = Object.freeze({ 'RP-CHR-01': ['chronology_integrity'], 'RP-CHR-02': ['chronology_integrity'], 'RP-CHR-03': ['chronology_integrity'], 'RP-CHR-04': ['chronology_integrity'],
  'RP-NEG-01': ['reasoning_traceability'], 'RP-EVL-01': ['identifiable_basis', 'chronology_integrity', 'reasoning_traceability'], 'RP-CON-01': ['sufficiency'] });
const VERSION = { from: '0.3.0-local', to: '0.3.1-candidate' };
const INV = ['no_behavioral_difference', 'presentation_only'];
const OK_CLASSES = ['expected_safe_degradation', 'presentation_only'];
const statuses = (g) => Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status]));

function failureClass(findings) {
  const c = findings.map((f) => f.class);
  if (c.includes('favorable_transition_requiring_human_review')) return 'favorable_transition_requiring_human_review';
  if (c.includes('limitation_removed_or_weakened')) return 'limitation_loss';
  if (c.includes('quote_or_span_integrity_defect')) return 'evidence_integrity_defect';
  if (c.includes('scope_boundary_defect')) return 'scope_boundary_defect';
  return 'unintended_regression';
}

export function completeRefusal(g) {
  return g.intake.decision === 'refuse' && g.findings.every((f) => f.status === 'not_assessed'
    && g.edges.some((e) => e.type === 'REFUSES' && e.to === 'find:' + f.condition_id) && g.edges.some((e) => e.type === 'ROUTES_TO_REVIEW' && e.from === 'find:' + f.condition_id)
    && g.edges.filter((e) => e.type === 'LIMITS' && e.to === 'find:' + f.condition_id).length === 1);
}

// spec: { mode: 'unchanged' | 'intended' | 'base_error', rules: [], statuses?: {...}, conflicts_gained?: [], gate?: 'refuse', scenario?: phase6 scenario for base_error }
export function qualifyOne(id, base, cand, spec) {
  const out = { id, mode: spec.mode, rules: spec.rules || [] };
  if (cand.error) return Object.assign(out, { classification: 'unintended_regression', detail: 'candidate compile error: ' + cand.error });
  if (base.error) {
    if (spec.mode !== 'base_error') return Object.assign(out, { classification: 'unintended_regression', detail: 'frozen v0.3 failed on an input not marked base_error' });
    const ok = spec.check ? spec.check(cand.graph) : true;
    return Object.assign(out, { classification: ok ? 'intended_safe_routing' : 'unintended_regression', detail: ok ? 'v0.3 failed; candidate routes safely and meets its sealed expectation' : 'candidate does not meet its sealed expectation',
      candidate_statuses: statuses(cand.graph) });
  }
  if (spec.mode === 'base_error') return Object.assign(out, { classification: 'unintended_regression', detail: 'v0.3 did not fail on an input marked base_error' });
  const ra = recordFromGraph(base.graph, { scenarioId: id, pkg: 'phase7-qualification' }), rb = recordFromGraph(cand.graph, { scenarioId: id, pkg: 'phase7-qualification' });
  const cids = [...new Set((spec.rules || []).flatMap((r) => RULE_CONDITIONS[r] || []))];
  const scope = (spec.rules || []).includes('RP-SCO-01');
  const ctx = { expected_version_change: VERSION, explanation: spec.mode === 'intended' ? { expected_degradation: cids.length ? cids : true, expected_refusal: scope, structure_change: 'sealed Phase 7 rule ' + spec.rules.join(','), offsets_recomputed: scope ? 'not applicable' : undefined } : {} };
  const diff = compareRecords(ra, rb, ctx);
  Object.assign(out, { verdict: diff.verdict, router_classes: [...new Set(diff.findings.map((f) => f.class))].sort(), base_statuses: statuses(base.graph), candidate_statuses: statuses(cand.graph),
    gained_conflicts: cand.graph.conflicts.map((k) => k.kind).filter((k) => !base.graph.conflicts.some((b) => b.kind === k)).sort() });
  if (spec.mode === 'unchanged') return Object.assign(out, { classification: INV.includes(diff.verdict) ? 'no_behavioral_difference' : failureClass(diff.findings), detail: INV.includes(diff.verdict) ? null : diff.findings.map((f) => f.class + ': ' + f.detail).slice(0, 6) });
  const P = [];
  if (spec.statuses && JSON.stringify(out.candidate_statuses) !== JSON.stringify(spec.statuses)) P.push('statuses ' + JSON.stringify(out.candidate_statuses) + ' differ from sealed ' + JSON.stringify(spec.statuses));
  if (spec.conflicts_gained && JSON.stringify(out.gained_conflicts) !== JSON.stringify([...spec.conflicts_gained].sort())) P.push('gained conflicts ' + JSON.stringify(out.gained_conflicts) + ' differ from sealed ' + JSON.stringify(spec.conflicts_gained));
  for (const [c, s] of Object.entries(out.candidate_statuses)) if (({ not_assessed: 0, review_required: 1, gap: 2, supported: 3 })[s] > ({ not_assessed: 0, review_required: 1, gap: 2, supported: 3 })[out.base_statuses[c]]) P.push(c + ' became more favourable');
  if (scope) {
    if (!completeRefusal(cand.graph)) P.push('intended refusal is not a complete refusal state');
    // Contract rule 3: an intended intake refusal is checked as a complete refusal state. The one scope finding a
    // superseding intake refusal produces (the response is no longer read, so "candidate response refusal lost" and
    // "refusal lost: candidate_response_invalid") are accepted only when that state holds. Every favourable finding and every other scope finding stays rejected.
    // (Harness correction after the first qualification run, recorded in EXECUTION_RECORD.md.)
    const supersession = (f) => f.class === 'scope_boundary_defect' && /^(?:candidate response refusal lost|refusal lost: candidate_response_invalid$)/.test(f.detail) && cand.graph.candidate.read === false;
    if (diff.findings.some((f) => f.class === 'favorable_transition_requiring_human_review' || (f.class === 'scope_boundary_defect' && !supersession(f)))) P.push('refusal comparison shows a favourable or scope finding');
    return Object.assign(out, { classification: P.length ? failureClass(diff.findings) : 'intended_refusal', detail: P.length ? P : 'complete refusal state verified; router verdict ' + diff.verdict + ' recorded (P6K-011 supersession)' });
  }
  const bad = diff.findings.filter((f) => f.fail_closed || !OK_CLASSES.includes(f.class));
  if (bad.length) P.push(...bad.map((f) => f.class + ': ' + f.detail));
  return Object.assign(out, { classification: P.length ? failureClass(bad.length ? bad : diff.findings) : 'intended_safe_degradation', detail: P.length ? P.slice(0, 6) : null });
}

export function phase6Check(scenario) { return (g) => evaluateScenario(g, scenario).result === 'as_expected'; }

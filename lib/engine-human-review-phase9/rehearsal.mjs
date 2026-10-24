// JRS PHASE 9: sealed synthetic rehearsal set, blinding, seal verification and the evaluator.
//
// A rehearsal case is a synthetic record and a crafted candidate response. Its expectations (the
// adjudication class a careful human reviewer would be expected to reach, why, the relevant Cognitive
// Control, the predicted Engine status and escalation, and the expected appropriateness of the Engine
// route) are held in a separate file and sealed before the evaluator first runs. The evaluator never
// produces a human outcome. It checks the dossier, the blinding and the Engine route against the seal.

import { createHash } from 'node:crypto';
import { compileEvidenceGraph } from '../engine-evidence-graph-v0.3.1-candidate/compiler.mjs';
import { submissionFor } from '../engine-reliability/library.mjs';
import { forCandidate } from '../../research/engine-remediation-phase7-2026-10-19/tooling/candidate.mjs';
import { PHASE9_STATEMENTS } from './contract.mjs';
import { buildDossiers, validateDossier, dossierNotMoreFavourable } from './dossier.mjs';
import { CLOCK, CATEGORIES, validateCase, routeAppropriateness, hashCanonical } from './rehearsal-schema.mjs';

export * from './rehearsal-schema.mjs';

// ---------------------------------------------------------------- Engine and blinding
export function compileCase(c, compile = compileEvidenceGraph) {
  return compile({ submission: forCandidate(submissionFor({ scenario_id: c.packet_id, record_text: c.record_text })), candidateResponseText: c.candidate_response_text,
    executionMode: c.execution_mode, clock: CLOCK, fixtureId: c.packet_id });
}
export const blindedId = (packetId) => 'PKT-' + createHash('sha256').update('phase9-blind/' + packetId, 'utf8').digest('hex').slice(0, 12);
export function blindedPacket(c, graph, build = buildDossiers) {
  const d = build(graph, { record_id: blindedId(c.packet_id), synthetic: true, case_id: null }).find((x) => x.condition.condition_id === c.target_condition);
  return { packet_id: blindedId(c.packet_id), statements: PHASE9_STATEMENTS, material: 'synthetic_engineering_fixture', holdout_eligible: false, dossier: d };
}
const LEAK_KEYS = /"(?:expected_[a-z_]*|category|relevant_control|explanation|predicted_engine_status|adjudication_class)"\s*:/;
const LEAK_IDS = /\bR9-[A-Z]{3}-\d{2}\b/;
const LEAK_NAMES = new RegExp('\\b(?:' + Object.values(CATEGORIES).map((x) => x.name).join('|') + ')\\b');
export function checkBlinding(packet) {
  const j = JSON.stringify(packet), p = [];
  if (LEAK_KEYS.test(j)) p.push('packet exposes an expectation or category field');
  if (LEAK_IDS.test(j)) p.push('packet exposes the unblinded packet identifier');
  if (LEAK_NAMES.test(j)) p.push('packet exposes a category name');
  return p;
}

// ---------------------------------------------------------------- evaluator
export const reviewRank = (d) => (d.escalation.required ? 0 : d.engine_result.status === 'supported' ? 2 : 1);
export function evaluateCase(c, exp, opts = {}) {
  const compile = opts.compile || compileEvidenceGraph;
  const graph = compileCase(c, compile);
  const packet = blindedPacket(c, graph, opts.buildDossiers || buildDossiers);
  const d = packet.dossier;
  const checks = {};
  const add = (k, ok, detail) => { checks[k] = ok ? 'pass' : 'fail: ' + (detail || ''); };
  add('case_valid', !validateCase(c).length, validateCase(c).join('; '));
  add('dossier_present', !!d, 'no dossier for the target condition');
  if (!d) return { packet_id: c.packet_id, result: 'differs_from_seal', checks };
  const dv = (opts.validateDossier || validateDossier)(d);
  add('dossier_valid', !dv.length, dv.join('; '));
  const bl = checkBlinding(packet);
  add('blinded', !bl.length, bl.join('; '));
  add('outcome_unfilled', d.reviewer_response.outcome === null && d.reviewer_response.rationale === null, 'reviewer response pre-filled');
  add('not_more_favourable', (opts.notMoreFavourable || dossierNotMoreFavourable)(d, graph), 'dossier more favourable than the Engine result');
  const status = d.engine_result.status, triggers = d.escalation.triggers.map((t) => t.id);
  add('engine_status_as_predicted', status === exp.predicted_engine_status, 'observed ' + status + ', sealed prediction ' + exp.predicted_engine_status);
  add('escalation_as_sealed', JSON.stringify(triggers) === JSON.stringify(exp.expected_escalation_triggers), 'observed ' + JSON.stringify(triggers) + ', sealed ' + JSON.stringify(exp.expected_escalation_triggers));
  const ra = routeAppropriateness(exp.expected_class, status, d.engine_result.routed_to_review);
  add('route_appropriateness_as_sealed', ra === exp.expected_route_appropriateness, 'observed ' + ra + ', sealed ' + exp.expected_route_appropriateness);
  add('control_listed', d.cognitive_controls.includes(exp.relevant_control), 'relevant control not in the dossier');
  add('escalating_class_has_escalation_route', !['insufficient_context', 'ambiguous', 'record_conflict', 'outside_authorized_scope', 'abstain_and_escalate'].includes(exp.expected_class) || d.escalation.abstention_available === true, 'abstention unavailable');
  const failed = Object.entries(checks).filter(([, v]) => v !== 'pass');
  return { packet_id: c.packet_id, blinded_id: packet.packet_id, category: c.category, target_condition: c.target_condition, expected_class: exp.expected_class,
    engine_status: status, escalation_triggers: triggers, route_appropriateness: ra, review_rank: reviewRank(d), dossier_sha256: d.dossier_sha256, graph_sha256: graph.identity.graph_sha256,
    result: failed.length ? 'differs_from_seal' : 'as_sealed', checks };
}
export function evaluateAll(cases, expectations, opts) {
  const byId = Object.fromEntries(expectations.map((e) => [e.packet_id, e]));
  const results = cases.map((c) => evaluateCase(c, byId[c.packet_id], opts));
  return { statements: PHASE9_STATEMENTS, total: results.length, as_sealed: results.filter((r) => r.result === 'as_sealed').length, results, results_sha256: hashCanonical(results) };
}

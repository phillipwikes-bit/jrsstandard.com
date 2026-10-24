// JRS PHASE 9: rehearsal case and expectation schema, the route-appropriateness rule and the seal.
//
// Imports no compiler, so the authoring and sealing scripts can use it without loading the Engine.

import { createHash } from 'node:crypto';
import { OUTCOMES, CONDITIONS, PHASE9_STATEMENTS } from './contract.mjs';
import { canonical } from './dossier.mjs';
import { CONTROL_IDS } from './controls.mjs';

export const REHEARSAL_FORMAT = 'jrs-phase9-rehearsal-case/1.0.0';
export const MARKER = 'SYNTHETIC ENGINEERING FIXTURE.';
export const PROVENANCE = 'Authored for local engineering only by the Phase 9 session on 2026-10-20. Synthetic; no real person, employer, customer or case. Not independent, real-world or holdout material.';
export const CLOCK = '2026-10-20T00:00:00Z';
export const CATEGORIES = Object.freeze({
  QNS: { name: 'quote_present_not_supportive', minimum: 10 },
  SIN: { name: 'supportive_but_incomplete', minimum: 6 },
  NEG: { name: 'negation_or_conditional_language', minimum: 6 },
  CHR: { name: 'chronology_ambiguity', minimum: 6 },
  CON: { name: 'conflicting_evidence', minimum: 5 },
  RGP: { name: 'reasoning_gaps', minimum: 5 },
  SUF: { name: 'sufficiency_and_escalation', minimum: 5 },
  CCP: { name: 'cognitive_control_pressure', minimum: 5 },
});
export const ROUTE_APPROPRIATENESS = Object.freeze(['appropriate', 'conservative_over_review', 'favourable_status_reliant_on_human_review', 'inappropriate_not_routed']);
export const ESCALATION_IDS = Object.freeze(['ET1', 'ET2', 'ET3']);
export const STATUSES = Object.freeze(['supported', 'review_required', 'gap', 'not_assessed']);

const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');
export const hashCanonical = (v) => sha(canonical(v));

// Fixed rule: how the Engine status relates to the adjudication class a reviewer is expected to reach.
export function routeAppropriateness(expectedClass, status, routed) {
  if (!routed) return 'inappropriate_not_routed';
  const engineFavourable = status === 'supported';
  if (expectedClass === 'supports_finding') return engineFavourable ? 'appropriate' : 'conservative_over_review';
  return engineFavourable ? 'favourable_status_reliant_on_human_review' : 'appropriate';
}

const CASE_KEYS = ['rehearsal_format', 'packet_id', 'category', 'target_condition', 'synthetic', 'holdout_eligible', 'synthetic_marker', 'provenance_note', 'record_text', 'candidate_response_text', 'execution_mode'];
export function validateCase(c, seen = new Set()) {
  const p = [];
  for (const k of CASE_KEYS) if (c[k] === undefined) p.push('missing ' + k);
  if (c.rehearsal_format !== REHEARSAL_FORMAT) p.push('format mismatch');
  const m = /^R9-([A-Z]{3})-(\d{2})$/.exec(String(c.packet_id));
  if (!m || !CATEGORIES[m[1]]) p.push('packet_id not R9-<category>-NN'); else if (CATEGORIES[m[1]].name !== c.category) p.push('category does not match the identifier');
  if (seen.has(c.packet_id)) p.push('duplicate packet_id');
  if (!CONDITIONS[c.target_condition]) p.push('unknown target condition');
  if (c.synthetic !== true) p.push('not marked synthetic');
  if (c.holdout_eligible !== false) p.push('not marked holdout-ineligible');
  if (c.synthetic_marker !== MARKER || typeof c.record_text !== 'string' || !c.record_text.startsWith(MARKER)) p.push('synthetic marker missing');
  if (c.provenance_note !== PROVENANCE) p.push('provenance note altered');
  if (c.execution_mode !== 'local_mocked') p.push('execution mode must be local_mocked');
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(c.record_text || '')) p.push('personal-data-like text');
  return p;
}

const EXP_KEYS = ['packet_id', 'expected_class', 'explanation', 'relevant_control', 'predicted_engine_status', 'expected_escalation_triggers', 'expected_route_appropriateness'];
export function validateExpectation(e) {
  const p = [];
  for (const k of EXP_KEYS) if (e[k] === undefined) p.push(e.packet_id + ': missing ' + k);
  if (!OUTCOMES.includes(e.expected_class)) p.push(e.packet_id + ': expected class not admissible');
  if (typeof e.explanation !== 'string' || e.explanation.length < 30) p.push(e.packet_id + ': explanation too short');
  if (!CONTROL_IDS.includes(e.relevant_control)) p.push(e.packet_id + ': unknown control');
  if (!STATUSES.includes(e.predicted_engine_status)) p.push(e.packet_id + ': unknown predicted status');
  if (!Array.isArray(e.expected_escalation_triggers) || e.expected_escalation_triggers.some((t) => !ESCALATION_IDS.includes(t))) p.push(e.packet_id + ': escalation triggers malformed');
  if (!ROUTE_APPROPRIATENESS.includes(e.expected_route_appropriateness)) p.push(e.packet_id + ': route appropriateness not in the enum');
  else if (e.expected_route_appropriateness !== routeAppropriateness(e.expected_class, e.predicted_engine_status, true)) p.push(e.packet_id + ': route appropriateness does not follow the fixed rule');
  return p;
}

// ---------------------------------------------------------------- seal
export function buildSeal(cases, expectations, sealedAt) {
  const caseHashes = Object.fromEntries(cases.map((c) => [c.packet_id, hashCanonical(c)]));
  const s = { seal_format: 'jrs-phase9-rehearsal-seal/1.0.0', sealed_at: sealedAt, statements: PHASE9_STATEMENTS, sealed_before_first_evaluator_run: true,
    case_count: cases.length, case_hashes: caseHashes, expectations_sha256: hashCanonical(expectations) };
  s.seal_sha256 = hashCanonical(s);
  return s;
}
export function verifySeal(seal, cases, expectations) {
  const p = [];
  const { seal_sha256, ...rest } = seal || {};
  if (!seal || seal_sha256 !== hashCanonical(rest)) p.push('seal record altered');
  if (seal && seal.expectations_sha256 !== hashCanonical(expectations)) p.push('sealed expectations altered after sealing');
  const ids = cases.map((c) => c.packet_id).sort();
  if (seal && JSON.stringify(Object.keys(seal.case_hashes || {}).sort()) !== JSON.stringify(ids)) p.push('sealed case set differs');
  for (const c of cases) if (seal && seal.case_hashes && seal.case_hashes[c.packet_id] !== hashCanonical(c)) p.push('case altered after sealing: ' + c.packet_id);
  if (JSON.stringify(expectations.map((e) => e.packet_id).sort()) !== JSON.stringify(ids)) p.push('expectation set does not match the case set');
  return p;
}

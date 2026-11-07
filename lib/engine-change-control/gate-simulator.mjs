// JRS ADAPTIVE RELIABILITY: the Local Release Candidate Gate Simulator.
//
// Reports which internal engineering artifacts exist for a future review. It is
// non-production and non-authorising: no score, no green light, no
// recommendation, no readiness determination. External gates are never met here.

import { GATE_STATEMENT } from './vocab.mjs';

export const GATE_STATES = Object.freeze(['present_local_artifact', 'missing_local_artifact', 'external_evidence_required', 'not_assessed', 'not_authorized']);
export const LOCAL_CATEGORIES = Object.freeze(['version_identity', 'fixture_integrity', 'prompt_identity', 'contract_identity', 'graph_integrity', 'failure_mode_record',
  'change_impact_analysis', 'regression_coverage', 'mutation_coverage', 'drift_record', 'evaluation_separation_controls', 'operator_control_evidence']);
export const EXTERNAL_CATEGORIES = Object.freeze(['counsel_review', 'independent_holdout', 'independent_labeling', 'adjudication', 'production_qa']);
export const AUTHORITY_CATEGORIES = Object.freeze(['owner_release_authorization']);

// artifacts: { category: { present: bool, evidence: 'path or note' } } for local categories only.
export function simulateGate(artifacts = {}) {
  const categories = {};
  for (const c of LOCAL_CATEGORIES) {
    const a = artifacts[c];
    categories[c] = !a ? { state: 'not_assessed', evidence: null } : { state: a.present ? 'present_local_artifact' : 'missing_local_artifact', evidence: a.evidence || null };
  }
  for (const c of EXTERNAL_CATEGORIES) categories[c] = { state: 'external_evidence_required', evidence: null, note: 'Cannot be produced or satisfied by local engineering.' };
  for (const c of AUTHORITY_CATEGORIES) categories[c] = { state: 'not_authorized', evidence: null, note: 'Only the owner can record a release authorization. None exists.' };
  return { statement: GATE_STATEMENT, categories, non_authorizing: true, production_status: 'NO_GO_NOT_VERIFIED' };
}

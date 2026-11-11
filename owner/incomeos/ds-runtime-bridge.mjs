// IncomeOS -> DS-N1 development contract. This module contains NO owner records.
// It must not be exposed as a customer route or production API. Neither a
// client-side flag nor a local source build is proof of owner authentication.
// The one authoritative program remains the IncomeOS workspace's dsProgram.
import './ds-program.js';
import {checkProgram, inspectOwnerProduct} from './ds-owner-inspection.mjs';
import {
  CANDIDATE, RECORD_SCHEMA, validateRecord, openReview, deriveState,
  applyAction, buildReport, verifyChain,
} from '../../lib/ds-n1/index.mjs';
import { buildCognitiveControls, COGNITIVE_CONTROL_VERSION } from '../../lib/ds-n1/cognitive-controls.mjs';
import { buildReflectiveGuidance, REFLECTIVE_GUIDANCE_VERSION } from '../../lib/ds-n1/reflective-guidance.mjs';

export const CONTRACT_VERSION = 'incomeos.ds-runtime-bridge/1.0.1-dev';
export const INTEGRATION_STATUS = 'INTEGRATION_IN_PROGRESS';

// Development-only provenance guard. This ephemeral map binds each issued
// synthetic session to the exact validated owner programme that opened it.
// It is not an independent programme, ledger, durable review store or
// authentication mechanism. Persisted/reopened sessions require a separately
// verified, authenticated owner workflow before this boundary can be relaxed.
const issuedSessions = new WeakMap();

function requireSyntheticSession(program, session) {
  if (!session || typeof session !== 'object' ||
      issuedSessions.get(session) !== program || !Array.isArray(session.events)) {
    throw new TypeError('Only bridge-issued constructed fictional review sessions are permitted');
  }
  const input = session.input;
  if (!input || input.schema !== RECORD_SCHEMA ||
      input.data_classification !== 'constructed_fictional') {
    throw new TypeError('Only constructed fictional review sessions are permitted');
  }
  const validation = validateRecord(input);
  if (validation.status !== null || !validation.record) {
    throw new TypeError('Review session no longer satisfies constructed fictional scope');
  }
  // Original DS-N1 checks the internal event chain. This verifies only
  // consistency, not reviewer identity, legal authenticity or authorization.
  if (!verifyChain(session.events, validation.record.record_digest).ok) {
    throw new TypeError('Review session integrity check failed');
  }
}

// Development harness enriches the same read-only projection with versions
// obtained from the real imported DS-N1 modules. The hosted Owner Desk cannot
// import those modules from outside its static deployment root.
export function inspectProduct(program) {
  return inspectOwnerProduct(program, {
    contract: CONTRACT_VERSION,
    integration: INTEGRATION_STATUS,
    candidate: CANDIDATE.candidate_id,
    candidateVersion: CANDIDATE.version,
    rulesVersion: CANDIDATE.rule_version,
    cognitiveVersion: COGNITIVE_CONTROL_VERSION,
    reflectiveVersion: REFLECTIVE_GUIDANCE_VERSION,
  });
}

// Called by a controlled engineering harness only. No browser route is
// registered. Security-gated UI integration must come from a verified private
// owner backend, not an untrusted caller-provided authorization property.
export function startSyntheticReview(program, input, at) {
  checkProgram(program);
  if (!input || input.schema !== RECORD_SCHEMA ||
      input.data_classification !== 'constructed_fictional') {
    throw new TypeError('Only DS-N1 constructed fictional review packages are permitted');
  }
  const validation = validateRecord(input);
  if (validation.status !== null) {
    return Object.freeze({ accepted: false, status: validation.status, errors: validation.errors });
  }
  const session = openReview(structuredClone(input), { at });
  issuedSessions.set(session, program);
  return Object.freeze({ accepted: true, session });
}

export function reviewerSnapshot(program, session) {
  checkProgram(program);
  requireSyntheticSession(program, session);
  const state = deriveState(session);
  const controls = buildCognitiveControls(state);
  return {
    contract: CONTRACT_VERSION,
    candidate: CANDIDATE.candidate_id,
    candidateVersion: CANDIDATE.version,
    reviewStatus: state.status,
    findings: state.findings,
    cognitiveControls: controls,
    reflectiveGuidance: controls.map(buildReflectiveGuidance).filter(Boolean),
    finalDisposition: state.final_disposition,
    overrideCritical: !!state.ready_by_override_of_critical,
    authenticity: 'UNSIGNED_INTERNAL_HASH_CHAIN_ONLY',
    notice: 'Synthetic development review only. No automatic acceptance or external release.',
  };
}

// Every correction, escalation, override or final disposition remains in the
// original DS-N1 human action engine, preserving its validation and event log.
export function applyReviewerAction(program, session, action) {
  checkProgram(program);
  requireSyntheticSession(program, session);
  const next = applyAction(session, action);
  issuedSessions.set(next, program);
  return next;
}

export function syntheticReport(program, session, generatedAt) {
  checkProgram(program);
  requireSyntheticSession(program, session);
  return buildReport(session, { generated_at: generatedAt });
}


// Bounded development-only orchestration. The caller must supply an existing
// validated dsProgram and constructed fictional input. This function creates
// no reviewer identity or action: every action must be supplied by a human
// through the original DS-N1 action contract. It does not persist or transmit
// owner records, authorize a browser route, or establish authentication.
export function runSyntheticReviewSequence(program, input, at, humanActions = [], generatedAt = at) {
  if (!Array.isArray(humanActions)) throw new TypeError('Human actions must be an array');
  if (humanActions.length > 100) throw new RangeError('Too many human actions');
  const opened = startSyntheticReview(program, input, at);
  if (!opened.accepted) return opened;
  let session = opened.session;
  for (const action of humanActions) {
    if (!action || typeof action !== 'object' || Array.isArray(action)) {
      throw new TypeError('Each human action must be an object');
    }
    session = applyReviewerAction(program, session, action);
  }
  const snapshot = reviewerSnapshot(program, session);
  const report = syntheticReport(program, session, generatedAt);
  return Object.freeze({
    accepted: true,
    contract: CONTRACT_VERSION,
    scope: 'DEVELOPMENT_ONLY_CONSTRUCTED_FICTIONAL',
    integrationStatus: INTEGRATION_STATUS,
    session,
    snapshot,
    report,
    authenticity: 'UNSIGNED_INTERNAL_HASH_CHAIN_ONLY',
    customerAccess: false,
    commercialRelease: false,
  });
}

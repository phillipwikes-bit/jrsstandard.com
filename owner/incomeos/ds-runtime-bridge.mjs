// IncomeOS -> DS-N1 development contract. This module contains NO owner records.
// It must not be exposed as a customer route or production API. Neither a
// client-side flag nor a local source build is proof of owner authentication.
// The one authoritative program remains the IncomeOS workspace's dsProgram.
import {
  CANDIDATE, RECORD_SCHEMA, validateRecord, openReview, deriveState,
  applyAction, buildReport,
} from '../../lib/ds-n1/index.mjs';
import { buildCognitiveControls, COGNITIVE_CONTROL_VERSION } from '../../lib/ds-n1/cognitive-controls.mjs';
import { buildReflectiveGuidance, REFLECTIVE_GUIDANCE_VERSION } from '../../lib/ds-n1/reflective-guidance.mjs';

export const CONTRACT_VERSION = 'incomeos.ds-runtime-bridge/1.0.0-dev';
export const INTEGRATION_STATUS = 'INTEGRATION_IN_PROGRESS';

function checkProgram(program) {
  if (!program || program.schema !== 'incomeos.ds-program.v1' ||
      !Array.isArray(program.acceptance) || program.acceptance.length !== 18 ||
      !Array.isArray(program.gates)) {
    throw new TypeError('A validated IncomeOS dsProgram v1 is required');
  }
  // Do not let a hand-edited workspace promote SP acceptance or a release gate.
  // Reuse the authoritative owner-programme validator instead of duplicating
  // evidence and authorization policy in this integration adapter.
  const controller = globalThis.IncomeOSDSProgram;
  if (!controller || typeof controller.validate !== 'function') {
    throw new TypeError('Authoritative IncomeOS programme validation is unavailable');
  }
  controller.validate(program);
  for (let i = 1; i <= 18; i++) {
    const id = 'SP-' + String(i).padStart(2, '0');
    const item = program.acceptance.find(x => x?.id === id);
    if (!item || item.identity !== 'DS-A' ||
        !['NOT_ACCEPTED', 'ACCEPTED'].includes(item.status)) {
      throw new TypeError('Missing or malformed original acceptance item ' + id);
    }
  }
  return program;
}

// A filtered snapshot, not a new source-of-truth or a GitHub status poll.
export function inspectProduct(program) {
  const p = checkProgram(program);
  const accepted = p.acceptance.filter(x => x.status === 'ACCEPTED').length;
  return Object.freeze({
    contract: CONTRACT_VERSION,
    integration: INTEGRATION_STATUS,
    ownerRecordSchema: p.schema,
    candidate: CANDIDATE.candidate_id,
    candidateVersion: CANDIDATE.version,
    rulesVersion: CANDIDATE.rule_version,
    cognitiveVersion: COGNITIVE_CONTROL_VERSION,
    reflectiveVersion: REFLECTIVE_GUIDANCE_VERSION,
    originalSource: 'AUTHENTIC_SOURCE_NOT_RECOVERED',
    originalAcceptance: { accepted, total: 18 },
    openGates: p.gates.filter(x => !x.approval).map(x => x.id),
    release: 'NOT_AUTHORIZED',
    customerAccess: 'NOT_AUTHORIZED',
    scope: 'DEVELOPMENT_ONLY_CONSTRUCTED_FICTIONAL',
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
  return Object.freeze({ accepted: true, session: openReview(input, { at }) });
}

export function reviewerSnapshot(program, session) {
  checkProgram(program);
  if (!session || !Array.isArray(session.events)) throw new TypeError('DS-N1 session required');
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
  return applyAction(session, action);
}

export function syntheticReport(program, session, generatedAt) {
  checkProgram(program);
  return buildReport(session, { generated_at: generatedAt });
}

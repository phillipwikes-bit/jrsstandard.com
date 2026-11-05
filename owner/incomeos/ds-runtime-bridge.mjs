// IncomeOS -> DS-N1 development contract. This module contains NO owner records.
// It must not be exposed as a customer route or production API. Neither a
// client-side flag nor a local source build is proof of owner authentication.
// The one authoritative program remains the IncomeOS workspace's dsProgram.
import './ds-program.js';
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

function checkProgram(program) {
  if (!program || program.schema !== 'incomeos.ds-program.v1' ||
      !Array.isArray(program.acceptance) || program.acceptance.length !== 18 ||
      !Array.isArray(program.gates)) {
    throw new TypeError('A validated IncomeOS dsProgram v1 is required');
  }
  for (let i = 1; i <= 18; i++) {
    const id = 'SP-' + String(i).padStart(2, '0');
    const item = program.acceptance.find(x => x?.id === id);
    if (!item || item.identity !== 'DS-A' ||
        !['NOT_ACCEPTED', 'ACCEPTED'].includes(item.status)) {
      throw new TypeError('Missing or malformed original acceptance item ' + id);
    }
  }
  // The structural check above is not acceptance verification. Apply the
  // existing authoritative programme validator before reading any status.
  // This refuses forged ACCEPTED checks, unsupported gate approvals, broken
  // evidence links and malformed rights records even if the shape looks valid.
  const owner = globalThis.IncomeOSDSProgram;
  if (!owner || typeof owner.validate !== 'function' || owner.SCHEMA !== program.schema) {
    throw new TypeError('Authoritative IncomeOS programme validator unavailable');
  }
  owner.validate(program);
  return program;
}

// A filtered snapshot, not a new source-of-truth or a GitHub status poll.
export function inspectProduct(program) {
  const p = checkProgram(program);
  const accepted = p.acceptance.filter(x => x.status === 'ACCEPTED').length;
  // The owner programme remains the only mutable source for defects, tasks,
  // research evidence and experimental study run records.
  const ranked = globalThis.IncomeOSDSProgram.prioritize(p);
  const ready = ranked.find(x => x.module === 'engineering' && x.state === 'READY');
  const openDefects = p.defects.filter(x => x.status === 'OPEN')
    .map(x => ({ id: x.id, title: x.title, severity: x.severity, identity: x.identity }));
  const studyRuns = {
    synthetic: p.runs.filter(x => x.kind === 'synthetic').length,
    independent: p.runs.filter(x => x.kind === 'independent').length,
  };
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
    // Programme counts are not a GitHub CI query or independent acceptance.
    programmeEvidenceEntries: p.evidence.length,
    programmeRequirementsRecorded: p.requirements.length,
    programmeStudyRuns: studyRuns,
    openDefects,
    unresolvedEngineeringTasks: ranked.filter(x => x.module === 'engineering').length,
    nextExecutableEngineeringTask: ready
      ? { id: ready.id, title: ready.title, evidenceLinked: ready.evidence > 0 }
      : null,
    githubCIStatus: 'NOT_CONNECTED',
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

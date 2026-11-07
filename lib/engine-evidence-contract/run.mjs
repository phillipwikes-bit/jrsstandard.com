// JRS EVIDENCE CONTRACT 0.2.0: one local run of the v0.2 candidate contract.
//
// Order: separate compartments -> execution mode -> intake gate (scope, versions,
// outputs, size, regulated domains, placeholders, claimed evidence) -> long-record
// plan -> instruction-risk quarantine -> candidate-response validation (mocked
// responses only) -> instruction-risk downgrade -> documentation remediation ->
// optional comparison with historical v1 output -> result assembly -> independent
// result validation. A result that fails its own validation is an error, never
// an output.
//
// This module performs no I/O and contains no provider client. "local_mocked"
// means a fixed candidate response text supplied by the caller.

import { createHash } from 'node:crypto';
import {
  CONTRACT_VERSION, ENGINE_CANDIDATE_VERSION, CODEBOOK_VERSION, RESULT_FORMAT_VERSION, HISTORICAL_REFERENCE_ID,
  HISTORICAL_ENGINE_VERSION, RELEASE_STATUS, CONDITION_IDS, HUMAN_REVIEW_ROUTE,
} from './contract.mjs';
import { separateSubmission, runIntakeGate, detectInstructionRisk } from './boundary.mjs';
import { longRecordPlan } from './long-record.mjs';
import { validateCandidateResponse, notAssessedCondition } from './validator.mjs';
import { remediationFor } from './remediation.mjs';
import { bridgeV1Output } from './bridge.mjs';
import { validateResult, canonical } from './result-validate.mjs';

const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');
export const EXECUTION_MODES = Object.freeze(['local_mocked', 'local_deterministic']);

export const RUN_LIMITATIONS = Object.freeze([
  { id: 'LW-L01', statement: 'Evidence verification establishes record presence only, not contextual or semantic support.' },
  { id: 'LW-L02', statement: 'All inputs are synthetic and engineering-authored; candidate responses are fixed mocks. No model behaviour was exercised.' },
  { id: 'LW-L03', statement: 'Nothing in this result establishes accuracy, validation, operational reliability, legal compliance, security effectiveness, or production readiness.' },
  { id: 'LW-L04', statement: 'Condition identifiers are contract identifiers. Their correspondence to v1 Engine keys is label-based and their correspondence to Codebook conditions is NOT ESTABLISHED.' },
  { id: 'LW-L05', statement: 'Human review is required for every condition. This candidate produces no overall pass, score, determination, or decision recommendation.' },
  { id: 'LW-L06', statement: 'Instruction-risk and regulated-domain detection are bounded lexical checks; reworded or novel content may not be detected.' },
]);

export function runEvidenceContract({ submission, candidateResponseText = null, executionMode, clock, v1Output = null, fixtureId = 'UNSPECIFIED' }) {
  const runTimestamp = clock || new Date().toISOString();
  const { unknown_submission_fields: unknown, compartments } = separateSubmission(submission, candidateResponseText, { execution_mode: executionMode, run_timestamp: runTimestamp });
  const record = compartments.record_content;
  const recordHash = typeof record === 'string' ? sha(record) : null;
  const responseHash = typeof candidateResponseText === 'string' ? sha(candidateResponseText) : null;
  const submissionHash = sha(canonical(submission || {}));
  const runId = 'ecr_' + sha([fixtureId, submissionHash, responseHash, CONTRACT_VERSION, runTimestamp].join('|')).slice(7, 31);

  const refusals = [];
  let gate = { decision: 'proceed', triggers: [] };
  const modeOk = EXECUTION_MODES.includes(executionMode);
  if (!modeOk) gate = { decision: 'refuse', triggers: [{ code: 'execution_mode_not_authorized', disposition: 'refuse', category: 'execution',
    boundary: 'Execution mode ' + JSON.stringify(executionMode) + ' is not authorized. Only local_mocked and local_deterministic runs execute. No assessment was made.' }] };
  else gate = runIntakeGate(record, compartments, unknown);
  for (const t of gate.triggers) refusals.push(Object.assign({ stage: 'pre_analysis' }, t));

  const risk = typeof record === 'string' ? detectInstructionRisk(record)
    : { record_instruction_risk: 'not_assessed', execution_boundary: 'preserved', quarantined_instruction_spans: [], limitation: detectInstructionRisk('').limitation };
  const plan = typeof record === 'string' ? longRecordPlan(record) : null;
  const wanted = new Set(Array.isArray(compartments.requested_outputs) ? compartments.requested_outputs : []);

  let conditions, candidate = { response_status: 'not_read', response_reasons: [], parse_notes: [] };
  let remediationWithheld = [];
  if (gate.decision !== 'proceed') {
    const why = gate.decision === 'refuse' ? 'pre_analysis_refusal' : 'pre_analysis_escalation';
    conditions = CONDITION_IDS.map((id) => notAssessedCondition(id, why, 'Not assessed: the submission was ' + (gate.decision === 'refuse' ? 'refused' : 'escalated') + ' before analysis. See refusals.'));
  } else if (executionMode === 'local_deterministic') {
    conditions = CONDITION_IDS.map((id) => notAssessedCondition(id, 'deterministic_mode_no_candidate', 'Not assessed: no candidate response is read in local_deterministic mode.'));
  } else {
    const v = validateCandidateResponse(record, candidateResponseText);
    candidate = v.response;
    conditions = v.conditions;
    if (candidate.response_status === 'invalid') refusals.push({ stage: 'post_analysis', code: 'candidate_response_invalid', disposition: 'refuse', category: 'candidate_output',
      boundary: 'The candidate response failed validation (' + candidate.response_reasons.join(', ') + '). No condition was assessed and nothing was repaired.' });
    for (const c of conditions) {
      if (risk.record_instruction_risk === 'detected' && (c.status === 'supported' || c.status === 'gap')) {
        c.status = 'review_required';
        c.routing_reasons.push('record_instruction_risk_detected');
      }
      for (const r of c.routing_reasons.filter((x) => x.startsWith('evidence_failed:') || x.startsWith('prohibited_claim'))) {
        refusals.push({ stage: 'post_analysis', code: r.startsWith('evidence_failed:') ? 'candidate_evidence_failed_verification' : 'candidate_text_prohibited_claim',
          disposition: 'withhold', category: 'evidence_integrity', condition_id: c.condition_id,
          boundary: 'Withheld for ' + c.condition_id + ' (' + r + '). The condition is routed to human review; no replacement citation was inferred.' });
      }
    }
  }
  if (gate.decision === 'proceed' && wanted.has('cognitive_controls')) {
    const rem = remediationFor(record);
    remediationWithheld = rem.withheld;
    for (const r of rem.remediation) {
      const c = conditions.find((x) => x.condition_id === r.related_condition);
      if (c) c.cognitive_controls.push(r);
    }
  }

  let comparison = null;
  if (v1Output != null && wanted.has('v1_comparison')) {
    const bridged = bridgeV1Output({ v1Output, record, scopeRefused: gate.decision !== 'proceed', scopeReason: gate.triggers[0] && gate.triggers[0].code });
    comparison = {
      statement: 'Side-by-side comparison of historical v1 output and this v0.2 result. Differences describe the two contracts; they are not accuracy evidence for either.',
      historical_engine_version: HISTORICAL_ENGINE_VERSION,
      bridge: bridged,
      rows: CONDITION_IDS.map((id) => {
        const b = bridged.conditions.find((x) => x.v02_condition_id === id);
        const c = conditions.find((x) => x.condition_id === id);
        return { condition_id: id, v1_key: b.v1_key, v1_original_status: b.original_status, v1_effective_v02_status: b.effective_v02_status, v02_status: c.status, mapping: b.mapping };
      }),
    };
  }

  const result = {
    result_format_version: RESULT_FORMAT_VERSION,
    contract_version: CONTRACT_VERSION,
    engine_candidate_version: ENGINE_CANDIDATE_VERSION,
    codebook_version: CODEBOOK_VERSION,
    historical_reference_id: HISTORICAL_REFERENCE_ID,
    release_status: RELEASE_STATUS,
    run: { run_id: runId, run_timestamp: runTimestamp, fixture_id: fixtureId, execution_mode: modeOk ? executionMode : 'not_authorized',
      provider_mode: executionMode === 'local_mocked' ? 'mocked_fixed_response' : 'not_used', provider_calls: 0, network_calls: 0 },
    intake: {
      compartments: {
        submission_metadata: compartments.submission_metadata, scope_declaration: compartments.scope_declaration,
        declared_versions: compartments.declared_versions, requested_outputs: compartments.requested_outputs,
        record_content: { chars: typeof record === 'string' ? record.length : 0, sha256: recordHash },
        candidate_response: { present: responseHash !== null, sha256: responseHash, read: candidate.response_status !== 'not_read' },
        local_evaluation_metadata: { execution_mode: executionMode, run_timestamp: runTimestamp },
      },
      unknown_submission_fields: unknown,
      gate_decision: gate.decision,
    },
    record_instruction_risk: risk.record_instruction_risk,
    execution_boundary: 'preserved',
    instruction_quarantine: { quarantined_instruction_spans: risk.quarantined_instruction_spans, limitation: risk.limitation },
    long_record: plan,
    candidate_response_validation: candidate,
    conditions,
    remediation_withheld: remediationWithheld,
    refusals,
    v1_comparison: comparison,
    human_review: HUMAN_REVIEW_ROUTE,
    limitations: RUN_LIMITATIONS,
    hashes: { record: recordHash, candidate_response: responseHash, submission: submissionHash, result_normalized: null },
  };
  result.hashes.result_normalized = sha(normalizeResult(result));
  const problems = validateResult(result, record);
  if (problems.length) {
    const e = new Error('result_self_validation_failed: ' + problems.join('; '));
    e.result = result; throw e;
  }
  return result;
}

// Everything that should be identical across replays of the same inputs on the
// same code, with keys sorted: run identity and wall-clock time excluded.
export function normalizeResult(result) {
  const copy = JSON.parse(JSON.stringify(result));
  delete copy.run; delete copy.hashes;
  if (copy.intake && copy.intake.compartments) delete copy.intake.compartments.local_evaluation_metadata;
  return canonical(copy);
}

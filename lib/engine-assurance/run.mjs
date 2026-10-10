// JRS ENGINE ASSURANCE: one local run of the existing candidate.
//
// Order of operations, each of which can stop the run:
//   1. Execution mode. Only local_mocked and local_deterministic execute.
//      external_not_authorized produces a refusal envelope and nothing else.
//   2. Pre-analysis gate (scope-gate.mjs). Refuse or escalate means the provider
//      is never invoked and every condition is not_assessed.
//   3. Candidate (candidate-core.mjs), local_mocked only, with an injected mock
//      provider. Output that fails the v1 parser fails the run closed.
//   4. Assurance mapping. A v1 status becomes supported or gap ONLY when the
//      candidate supplied exact quotations that are found in the record, its note
//      is present and free of unsupported status language. Otherwise the condition
//      is review_required. review is never promoted.
//   5. Record controls (cognitive-controls.mjs).
//   6. Manifest, through the EXISTING adapter, only when nothing was downgraded.
//   7. Envelope assembly and self-validation. An envelope that fails its own
//      validation is an error, never a result.

import { runCandidate, CONDITION_KEYS, CANDIDATE_SOURCE, ENGINE_VERSION, ENGINE_NAME, API_VERSION } from './candidate-core.mjs';
import { runScopeGate } from './scope-gate.mjs';
import { locateQuote, SPAN_LIMITATION } from './span-verify.mjs';
import { runCognitiveControls } from './cognitive-controls.mjs';
import { scanUnsupportedClaims } from './content-guard.mjs';
import { validateEnvelope, normalizedOutputHash } from './envelope.mjs';
import { ASSURANCE_LAYER_VERSION, ENVELOPE_SCHEMA_VERSION, CONDITION_VOCABULARY, RELEASE_STATUS } from './versions.mjs';
import { manifestFromEngineResponse } from '../manifest/from-engine.js';
import { validateManifest } from '../../tools/validate-manifest.js';
import { sha256Prefixed } from '../manifest/hash.js';
import { canonicalize } from '../manifest/canonicalize.js';
import { readFileSync } from 'node:fs';

export const EXECUTION_MODES = Object.freeze(['local_mocked', 'local_deterministic', 'external_not_authorized']);

// Labels are the v1 prompt's own names for its keys. They are not Codebook names.
export const CONDITION_LABELS = Object.freeze({
  basis_identification: 'Basis Identification (Engine key)',
  reasoning_traceability: 'Decision-Process Traceability (Engine key)',
  cold_reviewer_clarity: 'Reconstructability (Engine key)',
  accountability_support: 'Evidentiary Sufficiency (Engine key)',
  temporal_reconstructability: 'Chronology (Engine key)',
});

export const FINDING_LIMITATION = SPAN_LIMITATION + ' Condition identifiers are the Engine\'s keys, not Codebook conditions.';

export function limitationsFor(mode) {
  return [
    { id: 'L-01', statement: SPAN_LIMITATION },
    { id: 'L-02', statement: 'This run used a synthetic, engineering-authored fixture. It is not independent, real-world, practitioner, buyer or holdout evidence, and it cannot establish accuracy.' },
    { id: 'L-03', statement: 'The candidate has not been independently evaluated. Nothing in this run establishes accuracy, validation, legal compliance, security effectiveness, or production readiness.' },
    { id: 'L-04', statement: 'Condition identifiers are the Review Engine\'s own keys. The Engine-to-Codebook mapping is NOT ESTABLISHED, so no finding is a Codebook condition finding.' },
    { id: 'L-05', statement: 'Human review is required for every output. This package does not decide whether the underlying decision was correct, justified, fair, approved, or lawful, and it produces no overall pass.' },
    mode === 'local_mocked'
      ? { id: 'L-06', statement: 'Candidate output came from a fixed, engineering-authored mock provider response. Model behaviour was not exercised; this run tests how candidate output is handled, not its quality.' }
      : { id: 'L-06', statement: 'No candidate analysis was performed in this run. Only the deterministic gate and record controls executed.' },
    { id: 'L-07', statement: 'Record controls are lexical pattern detectors that route passages to human review. They make no statement about the person who wrote the record.' },
  ];
}

const CHANGE_TEXT = {
  supported: (k) => 'This would change if the quoted passage were removed or altered, or if a human reviewer finds in context that it does not address ' + CONDITION_LABELS[k] + '.',
  gap: (k) => 'This would change if the record added a passage addressing ' + CONDITION_LABELS[k] + ', with a traceable source, where the quoted passage shows the omission.',
  review_required: () => 'A human reviewer decides this condition. A candidate finding anchored to exact record text, with a note, would be needed before supported or gap could be reported.',
  not_assessed: () => 'This condition would be assessed only after the refusal, escalation or execution boundary listed in refusals is resolved.',
  not_assessed_deterministic: () => 'This condition would be assessed only in a local_mocked run that invokes the candidate.',
};

function finding(k, outcome, basis, candidateStatus, explanation, contentClass, spans, classification) {
  return {
    condition_id: k,
    condition_label: CONDITION_LABELS[k],
    outcome,
    outcome_basis: basis,
    candidate_status: candidateStatus || 'none',
    explanation: String(explanation).slice(0, 400),
    explanation_content_class: contentClass,
    source_spans: spans,
    evidence_classification: classification,
    limitation: FINDING_LIMITATION,
    what_would_change_this_finding: basis === 'deterministic_mode_not_assessed'
      ? CHANGE_TEXT.not_assessed_deterministic(k) : CHANGE_TEXT[outcome](k),
  };
}

function notAssessedAll(basis, explanation) {
  return CONDITION_KEYS.map((k) => finding(k, 'not_assessed', basis, null, explanation, 'no_record_content', [], 'no_verified_record_support'));
}

// Reads the per-condition `evidence` quotations the candidate supplied. The v1
// parser ignores this field, so v1-shaped output simply has none.
function extractEvidence(rawText) {
  try {
    const m = String(rawText).match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m[0]);
    const out = {};
    for (const k of CONDITION_KEYS) {
      const ev = parsed.conditions && parsed.conditions[k] && parsed.conditions[k].evidence;
      out[k] = Array.isArray(ev) ? ev.map((e) => (e && typeof e === 'object' ? e.quote : e)) : [];
    }
    return out;
  } catch {
    return Object.fromEntries(CONDITION_KEYS.map((k) => [k, []]));
  }
}

function deterministicUuid(hex) {
  const h = hex.replace(/^sha256:/, '');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-4' + h.slice(13, 16) + '-' + ((parseInt(h[16], 16) & 3) | 8).toString(16) + h.slice(17, 20) + '-' + h.slice(20, 32);
}

const MANIFEST_SCHEMA = JSON.parse(readFileSync(new URL('../../schemas/jrs-decision-reconstruction-manifest.schema.json', import.meta.url), 'utf8'));

export async function runAssurance(opts) {
  const {
    fixtureId, record, request, providerResponse = null, executionMode, clock,
    testOrDemoStatus = 'synthetic_engineering_test', sourceIdentity, codeHashes,
  } = opts;
  if (!sourceIdentity || !codeHashes || !Object.keys(codeHashes).length) throw new Error('run_refused: source identity and code hashes are required');
  const runTimestamp = clock || new Date().toISOString();
  const recordHash = await sha256Prefixed(record);
  const requestHash = await sha256Prefixed(canonicalize(request || {}));
  const providerHash = providerResponse ? await sha256Prefixed(canonicalize(providerResponse)) : null;
  const fixtureContentHash = await sha256Prefixed(canonicalize({ record: recordHash, request: requestHash, provider_response: providerHash }));
  const codeIdentity = await sha256Prefixed(canonicalize(codeHashes));
  const runId = 'run_' + (await sha256Prefixed(fixtureContentHash + '|' + codeIdentity + '|' + runTimestamp)).slice(7, 31);

  const mode = EXECUTION_MODES.includes(executionMode) ? executionMode : null;
  const refusals = [];
  let conditionFindings, recordControls = [], providerInvocations = 0;
  let gate = { decision: 'proceed', trigger_codes: [] };
  let manifestReference = { produced: false, reason: 'No Manifest is produced unless the candidate ran and no condition was downgraded.' };

  if (mode !== 'local_mocked' && mode !== 'local_deterministic') {
    // An unknown or unauthorized mode never executes anything.
    refusals.push({ code: 'execution_mode_not_authorized', stage: 'execution', disposition: 'refuse', category: 'execution',
      boundary: 'Execution mode ' + JSON.stringify(executionMode) + ' is not authorized. Only local_mocked and local_deterministic runs execute. No assessment was made.' });
    conditionFindings = notAssessedAll('execution_mode_not_authorized', 'Not assessed: the execution mode is not authorized.');
    gate = { decision: 'refuse', trigger_codes: ['execution_mode_not_authorized'] };
    refusals.push({ code: 'execution_mode_not_authorized', stage: 'pre_analysis', disposition: 'refuse', category: 'execution',
      boundary: 'The run was stopped before analysis because its execution mode is not authorized.' });
  } else {
    const g = runScopeGate(record, request);
    gate = { decision: g.decision, trigger_codes: g.triggers.map((t) => t.code) };
    for (const t of g.triggers) {
      const r = { code: t.code, stage: 'pre_analysis', disposition: t.disposition, category: t.category, boundary: t.boundary };
      if (t.location) r.location = t.location;
      refusals.push(r);
    }
    const wanted = new Set((request && request.requested_outputs) || []);
    if (g.decision !== 'proceed') {
      conditionFindings = notAssessedAll(g.decision === 'refuse' ? 'pre_analysis_refusal' : 'pre_analysis_escalation',
        'Not assessed: the record was ' + (g.decision === 'refuse' ? 'refused' : 'escalated') + ' before analysis. See refusals.');
    } else {
      if (wanted.has('record_controls')) recordControls = runCognitiveControls(record);
      if (mode === 'local_deterministic') {
        conditionFindings = notAssessedAll('deterministic_mode_not_assessed', 'Not assessed: no candidate analysis runs in local_deterministic mode.');
      } else {
        let v1 = null, raw = '';
        if (!providerResponse) {
          refusals.push({ code: 'candidate_output_invalid', stage: 'post_analysis', disposition: 'refuse', category: 'candidate_output',
            boundary: 'No mock provider response was supplied, so the candidate produced no output. No condition was assessed.' });
        } else {
          raw = typeof providerResponse.raw_text === 'string' ? providerResponse.raw_text : JSON.stringify(providerResponse.response);
          const provider = async () => { providerInvocations++; return { content: [{ type: 'text', text: raw }] }; };
          try { v1 = await runCandidate(record, provider); }
          catch (e) {
            refusals.push({ code: 'candidate_output_invalid', stage: 'post_analysis', disposition: 'refuse', category: 'candidate_output',
              boundary: 'The candidate output failed the existing v1 parser (' + String(e && e.message || e).slice(0, 80) + '). The run fails closed: no condition was assessed.' });
          }
        }
        if (!v1) {
          conditionFindings = notAssessedAll('candidate_output_invalid', 'Not assessed: the candidate output was missing or invalid.');
        } else {
          const evidence = extractEvidence(raw);
          conditionFindings = CONDITION_KEYS.map((k) => {
            const status = v1.conditions[k].status;
            const note = v1.conditions[k].note;
            const located = evidence[k].map((q) => ({ q, r: locateQuote(record, q) }));
            const spans = located.filter((x) => x.r.ok).map((x) => x.r.span).slice(0, 5);
            const failed = located.filter((x) => !x.r.ok);
            for (const f of failed) {
              refusals.push({ code: 'candidate_citation_not_found', stage: 'post_analysis', disposition: 'withhold', category: 'record_integrity', condition_id: k,
                boundary: 'The candidate cited text for ' + k + ' that could not be anchored in the record (' + f.r.reason + '). The citation is not reported as evidence and the condition is routed to human review.' });
            }
            const unsafe = scanUnsupportedClaims(note);
            if (unsafe.length) {
              refusals.push({ code: 'unsafe_language_in_candidate_note', stage: 'post_analysis', disposition: 'withhold', category: 'claim_boundary', condition_id: k,
                boundary: 'The candidate note for ' + k + ' asserted a status this package cannot support ("' + unsafe[0].term + '"). The note is withheld and the condition is routed to human review.' });
            }
            // A note resting on a citation that cannot be found is withheld with it:
            // repeating the note would restate the unanchored claim.
            const explanation = failed.length ? 'Candidate note withheld: the text it cited could not be found in the record.'
              : unsafe.length ? 'Candidate note withheld: it asserted a status this package cannot support.'
                : (note || 'No candidate note was supplied.');
            const cls = failed.length || unsafe.length || !note ? 'no_record_content' : 'derived_record_content';
            if (status === 'review') {
              // A fabricated citation taints the whole condition: no span is reported.
              const kept = failed.length ? [] : spans;
              const support = kept.length ? 'contains_record' : (cls === 'derived_record_content' ? 'derived_record_content' : 'no_verified_record_support');
              return finding(k, 'review_required', 'candidate_status_review', status, explanation, cls, kept, support);
            }
            let basis = null;
            if (!evidence[k].length) basis = 'no_source_anchor_supplied';
            else if (failed.length) basis = 'candidate_citation_not_found';
            else if (unsafe.length) basis = 'unsafe_language_in_candidate_note';
            else if (!note) basis = 'candidate_note_missing';
            if (basis) return finding(k, 'review_required', basis, status, explanation, cls, [], 'no_verified_record_support');
            return finding(k, status === 'pass' ? 'supported' : 'gap', 'candidate_status_with_verified_span', status, explanation, cls, spans, 'contains_record');
          });
          const downgraded = conditionFindings.some((f) => f.outcome === 'review_required' && f.candidate_status !== 'review');
          if (!wanted.has('manifest_reference')) {
            manifestReference = { produced: false, reason: 'A Manifest reference was not requested.' };
          } else if (downgraded || refusals.some((r) => r.stage === 'post_analysis')) {
            manifestReference = { produced: false, reason: 'Withheld: at least one condition was downgraded or a candidate citation or note was withheld, so the unmodified v1 output would overstate the result.' };
          } else {
            const response = { request_id: runId, api_version: API_VERSION, engine: ENGINE_NAME, engine_version: ENGINE_VERSION,
              model: 'not_used:mocked_provider', runs: 1, result: v1 };
            const linked = await manifestFromEngineResponse(response, record, {
              manifestId: deterministicUuid(await sha256Prefixed(runId + '|manifest')), createdAt: runTimestamp,
              context: { identifier: fixtureId },
            });
            const mv = validateManifest(linked.manifest, MANIFEST_SCHEMA);
            manifestReference = {
              produced: true,
              reason: 'Produced by the existing Manifest adapter from the unmodified v1 candidate output. Its pass/review/gap statuses are v1 vocabulary; the findings in this envelope govern.',
              represents: 'unmodified_v1_candidate_output',
              manifest_id: linked.manifest.manifest_id,
              manifest_version: linked.manifest.manifest_version,
              manifest_hash: linked.manifest.integrity.manifest_hash,
              engine_version: linked.manifest.engine.version,
              codebook_version: linked.manifest.codebook_version,
              jrs_version: linked.manifest.jrs_version,
              offline_validation: mv.valid ? 'schema_valid_and_self_consistent' : 'failed',
            };
          }
        }
      }
    }
  }

  const envelope = {
    schema_version: ENVELOPE_SCHEMA_VERSION,
    engine_version: ENGINE_VERSION,
    codebook_version: '1.0',
    assurance_layer_version: ASSURANCE_LAYER_VERSION,
    condition_vocabulary: CONDITION_VOCABULARY,
    fixture_id: fixtureId,
    fixture_content_hash: fixtureContentHash,
    run_id: runId,
    run_timestamp: runTimestamp,
    execution_mode: mode || 'external_not_authorized',
    provider_mode: mode === 'local_mocked' ? 'mocked' : 'not_used',
    provider_invocations: providerInvocations,
    source_identity_status: sourceIdentity.status,
    source_identity: {
      candidate_source_path: CANDIDATE_SOURCE.repository_path,
      candidate_source_commit: CANDIDATE_SOURCE.commit,
      candidate_source_blob: CANDIDATE_SOURCE.blob,
      repository_head: sourceIdentity.repository_head || 'unknown',
      working_tree: sourceIdentity.working_tree || 'unknown',
    },
    test_or_demo_status: testOrDemoStatus,
    release_status: RELEASE_STATUS,
    limitations: limitationsFor(mode),
    human_review_required: true,
    gate,
    findings: { condition_findings: conditionFindings, record_controls: recordControls },
    refusals,
    manifest_reference: manifestReference,
    artifact_hashes: { record: recordHash, request: requestHash, normalized_output: 'sha256:' + '0'.repeat(64), code: codeHashes },
  };
  if (providerHash) envelope.artifact_hashes.provider_response = providerHash;
  envelope.artifact_hashes.normalized_output = await normalizedOutputHash(envelope);

  const check = validateEnvelope(envelope, record);
  if (!check.valid) {
    const e = new Error('envelope_self_validation_failed: ' + [...check.structural, ...check.semantic].join('; '));
    e.envelope = envelope;
    throw e;
  }
  return envelope;
}

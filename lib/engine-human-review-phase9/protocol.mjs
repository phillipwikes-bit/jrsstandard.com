// JRS PHASE 9: dual-review and adjudication protocol, reliability measurement plan and
// Engine-human disagreement protocol.
//
// Everything here is a definition. Execution is disabled: no reviewer is recruited, no review is
// run, no label is collected and no measure is calculated. The functions that would run, compute or
// apply something refuse. The only executable logic is structural: it checks the shape of a future
// ledger row and routes a pair of rows to adjudication by a fixed rule, never by judging content.

import { createHash } from 'node:crypto';
import { OUTCOMES, ESCALATING_OUTCOMES, PHASE9_STATEMENTS } from './contract.mjs';
import { canonical } from './dossier.mjs';
import { validateReviewerEntry } from './decision-model.mjs';

export const EXECUTION_ENABLED = false;
const refuse = (what) => { throw new Error('REFUSED: ' + what + ' is not authorized in Phase 9; this package defines the protocol only'); };

export const ROLES = Object.freeze([
  { role: 'corpus_custodian', duties: 'Holds the sealed packets and expectations; issues blinded packets; never reviews.', prohibited: 'Revealing expectations, categories or another reviewer\'s entry to a reviewer.' },
  { role: 'coordinator', duties: 'Schedules reviews, checks that entries are complete, routes pairs to adjudication by the fixed rule.', prohibited: 'Commenting on the content of any entry or suggesting an outcome.' },
  { role: 'reviewer', duties: 'Reviews one blinded packet at a time and records an outcome, rationale and cited words.', prohibited: 'Seeing the other reviewer\'s entry, the expectation, the category or the Engine-human agreement history.' },
  { role: 'adjudicator', duties: 'Reviews a packet only on disagreement or escalation and records an adjudicated outcome with reasons.', prohibited: 'Deciding legal liability, discrimination, policy compliance or whether an employment decision was correct.' },
  { role: 'analyst', duties: 'Calculates the planned measures after the ledger is closed, under a separate authorization.', prohibited: 'Calculating measures before the ledger is closed, or altering any entry.' },
]);

export const DUAL_REVIEW_PROTOCOL = Object.freeze({
  execution_enabled: EXECUTION_ENABLED,
  statements: PHASE9_STATEMENTS,
  reviewers_per_packet: 2,
  blinding: ['Each reviewer sees the dossier only: no category, no expectation, no other entry, no packet order shared with the other reviewer.', 'Packets are presented in an order drawn independently for each reviewer.'],
  adjudication_trigger: 'A third adjudicator reviews the packet only when the two outcomes differ or either outcome is escalating.',
  training: 'Limited to this protocol, the decision model, the Cognitive Controls and the synthetic calibration packets. No real records, no expected answers for packets under review.',
  contamination_controls: ['Calibration packets and review packets are disjoint.', 'Reviewers do not discuss packets before both entries are locked.', 'Expectations stay sealed with the custodian until the ledger is closed.', 'A reviewer who sees an expectation or another entry is withdrawn from that packet and the exposure is logged.'],
  abstention: 'abstain_and_escalate is always available and is never treated as an error.',
  conflict_treatment: 'record_conflict is recorded with the conflicting passages; no reviewer decides which passage is true.',
  missing_information: 'insufficient_context names the missing information; no reviewer fills it in.',
  versioning: ['Each entry records the dossier format, dossier hash, decision model and controls version it was made under.', 'An entry made under a superseded version is kept and marked superseded, never rewritten.'],
  re_review_triggers: ['The dossier hash changes.', 'The decision model or Cognitive Controls change.', 'The Engine version or a rule pack hash changes.', 'A contamination event is logged for the packet.'],
  identities: 'Placeholders only (REVIEWER-PLACEHOLDER-n). No real identity, label or outcome is held in this package.',
});

// The shape of a future decision ledger row. Defined, never populated in Phase 9.
export const LEDGER_FIELDS = Object.freeze(['ledger_row_id', 'packet_id', 'dossier_sha256', 'dossier_format', 'decision_model_version', 'controls_version', 'engine_compiler_version', 'engine_graph_sha256',
  'reviewer_placeholder', 'role', 'source', 'outcome', 'rationale', 'cited_evidence', 'escalated', 'locked_at', 'supersedes', 'contamination_events']);
export function validateLedgerRow(row) {
  const p = [];
  for (const k of LEDGER_FIELDS) if (!(k in (row || {}))) p.push('ledger row missing ' + k);
  if (row && !['reviewer', 'adjudicator'].includes(row.role)) p.push('ledger row role must be reviewer or adjudicator');
  return p.concat(validateReviewerEntry(row));
}

// Fixed routing rule. It compares outcome labels; it does not read or judge content.
export function needsAdjudication(a, b) {
  for (const e of [a, b]) { const p = validateReviewerEntry(e); if (p.length) throw new Error('REFUSED: incomplete or non-human entry: ' + p.join('; ')); }
  return a.outcome !== b.outcome || ESCALATING_OUTCOMES.includes(a.outcome) || ESCALATING_OUTCOMES.includes(b.outcome);
}
export function runDualReview() { refuse('running a review'); }

// ---------------------------------------------------------------- measurement plan
const M = (id, name, definition, needs) => ({ id, name, definition, requires: needs, status: 'not_measurable_locally', value: null,
  reason: 'Requires completed human entries from an authorized review; Phase 9 has synthetic packets and no reviewer entries.' });
export const MEASUREMENT_PLAN = Object.freeze([
  M('RM-01', 'Quote-presence agreement', 'Agreement between reviewers on whether the cited quotation occurs in the record as stated (expected near-complete, since presence is machine-checked).', ['two locked reviewer entries per packet']),
  M('RM-02', 'Semantic-support agreement', 'Chance-corrected agreement between the two reviewers on the seven-outcome label, reported per condition.', ['two locked reviewer entries per packet']),
  M('RM-03', 'Escalation agreement', 'Agreement between reviewers on whether a packet is escalated.', ['two locked reviewer entries per packet']),
  M('RM-04', 'Post-adjudication agreement', 'Agreement between each reviewer and the adjudicated outcome on adjudicated packets.', ['adjudicated outcomes']),
  M('RM-05', 'Disagreement by condition', 'Distribution of reviewer disagreement across the five conditions.', ['two locked reviewer entries per packet']),
  M('RM-06', 'Abstention rate', 'Share of entries recording abstain_and_escalate, per reviewer and per condition.', ['locked reviewer entries']),
  M('RM-07', 'Calibration drift', 'Change in agreement with the sealed calibration expectations across review sessions.', ['repeated calibration sessions']),
  M('RM-08', 'False-confidence risk', 'Share of packets where a reviewer records supports_finding and the adjudicated outcome is non-supporting or escalating.', ['adjudicated outcomes']),
]);
export function computeMeasure() { refuse('calculating a reliability measure'); }

// ---------------------------------------------------------------- Engine-human disagreement
export const DISAGREEMENT_PROTOCOL = Object.freeze({
  preserve: 'The Engine output is preserved byte for byte and referenced by its graph hash.',
  prohibited: ['Automatic modification of the Engine output, rule packs, compiler or thresholds.', 'Treating the human outcome as a label for training, tuning or scoring.', 'Using the disagreement to reverse a refusal or raise a status.'],
  produces: 'A candidate learning record only.',
  change_path: 'Any Engine change requires a separately authorized governance proposal through the Phase 8 change-impact and admission process.',
});
const sha = (v) => 'sha256:' + createHash('sha256').update(canonical(v)).digest('hex');
export function createLearningRecord(dossier, entry, graph) {
  if (!graph || graph.identity.graph_sha256 !== dossier.engine.graph_sha256) throw new Error('REFUSED: learning record requires the exact Engine output the dossier was built from');
  const p = validateReviewerEntry(entry); if (p.length) throw new Error('REFUSED: ' + p.join('; '));
  const r = { record_type: 'candidate_learning_record', status: 'candidate_only', applied: false, statements: PHASE9_STATEMENTS,
    engine_graph_sha256: graph.identity.graph_sha256, engine_output_sha256: sha(graph), dossier_sha256: dossier.dossier_sha256, condition_id: dossier.condition.condition_id,
    engine_status: dossier.engine_result.status, human_outcome: entry.outcome, disagreement: (dossier.engine_result.status === 'supported') !== (entry.outcome === 'supports_finding'),
    requires: DISAGREEMENT_PROTOCOL.change_path };
  r.record_sha256 = sha(r);
  return r;
}
export function applyToEngine() { refuse('applying a learning record to the Engine'); }
export const ADMISSIBLE_OUTCOMES = OUTCOMES;

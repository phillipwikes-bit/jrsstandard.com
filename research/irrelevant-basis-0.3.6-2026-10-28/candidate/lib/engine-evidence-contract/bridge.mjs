// JRS EVIDENCE CONTRACT 0.2.0: compatibility bridge from historical v1 output.
//
// INTERPRETIVE ENGINEERING, NOT A VALIDATION RESULT.
//
// The bridge reads a historical v1 output and states what it would mean under
// the four-status model. It:
//   - preserves the original output verbatim, with its SHA-256;
//   - preserves each original status and note unchanged;
//   - labels each mapping exact, lossy, ambiguous or not_mappable;
//   - NEVER migrates a v1 result into v0.2 evidence: v1 has no offset-verified
//     citations, so no bridged condition can be supported or gap. The ceiling a
//     v1 status would correspond to is reported as `v1_status_in_v02_terms`; the
//     status a reviewer may act on is `effective_v02_status`.
//
// Inputs: either a raw v1 provider text, or a stored v1 API result object
// ({ result: { conditions, determination } }). The v1 parser from the
// preserved candidate core is used to test whether the raw text was valid v1.

import { createHash } from 'node:crypto';
import { parseProviderMessage, deriveDetermination, CONDITION_KEYS, V1_TRUNCATION_LIMIT } from '../engine-assurance/candidate-core.mjs';
import { V1_KEY_TO_CONDITION, HISTORICAL_REFERENCE_ID } from './contract.mjs';
import { scanProhibitedClaims } from './claims.mjs';
import { detectInstructionRisk } from './boundary.mjs';

const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');
const TERMS = { pass: 'supported', gap: 'gap', review: 'review_required' };

export const BRIDGE_STATEMENT = 'Interpretive compatibility mapping. Not a validation result, not a re-evaluation, and not v0.2 evidence. '
  + 'No historical v1 result is migrated into the v0.2 evidence contract.';

function quotedInNote(note) {
  const out = [];
  const re = /["“]([^"”]{8,400})["”]/g;
  let m; while ((m = re.exec(note)) !== null) out.push(m[1]);
  return out;
}

export function bridgeV1Output({ v1Output, record, scopeRefused = false, scopeReason = null }) {
  const isText = typeof v1Output === 'string';
  const verbatim = isText ? v1Output : JSON.stringify(v1Output);
  const out = {
    bridge_version: 'jrs-v1-to-v02-bridge/0.2.0',
    historical_reference_id: HISTORICAL_REFERENCE_ID,
    statement: BRIDGE_STATEMENT,
    original_output: { form: isText ? 'raw_provider_text' : 'stored_v1_result_object', verbatim, sha256: sha(verbatim) },
    parse: { status: 'not_attempted', reasons: [] },
    determination: null,
    conditions: [],
    migration: 'prohibited_no_v02_evidence_created',
    record_flags: [],
  };
  // Record-level conditions that make every condition not assessable.
  const recordReasons = [];
  if (scopeRefused) recordReasons.push('record_out_of_scope' + (scopeReason ? ':' + scopeReason : ''));
  if (typeof record === 'string' && record.trim().length > V1_TRUNCATION_LIMIT) recordReasons.push('v1_evaluated_truncated_text_only');
  out.record_flags = recordReasons.slice();
  const risk = typeof record === 'string' ? detectInstructionRisk(record) : null;
  if (risk && risk.record_instruction_risk === 'detected') out.record_flags.push('record_instruction_risk_detected');

  // Recover conditions, preserving what v1 itself would have accepted.
  let conditions = null, statedDetermination = null;
  if (isText) {
    try {
      const v1 = parseProviderMessage({ content: [{ type: 'text', text: v1Output }] });
      conditions = v1.conditions; out.parse.status = 'valid_v1';
      const trimmed = v1Output.trim();
      if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) out.parse.reasons.push('v1_lenient_parse_extracted_json_from_surrounding_text');
    } catch (e) { out.parse.status = 'invalid_v1'; out.parse.reasons.push('v1_parser_rejected:' + String(e.message).slice(0, 60)); }
  } else {
    const c = v1Output && v1Output.result && v1Output.result.conditions;
    statedDetermination = v1Output && v1Output.result ? v1Output.result.determination : null;
    const ok = c && CONDITION_KEYS.every((k) => c[k] && ['pass', 'review', 'gap'].includes(c[k].status));
    if (ok && Object.keys(c).length === CONDITION_KEYS.length) { conditions = c; out.parse.status = 'valid_v1'; }
    else { out.parse.status = 'invalid_v1'; out.parse.reasons.push('stored_result_conditions_missing_or_invalid'); }
  }

  if (conditions) {
    const recomputed = deriveDetermination(conditions);
    out.determination = { original: statedDetermination || recomputed, original_source: statedDetermination ? 'stored' : 'recomputed_by_v1_rule', recomputed_by_v1_rule: recomputed,
      conflict: !!statedDetermination && statedDetermination !== recomputed,
      v02_treatment: 'not_carried_forward: the v0.2 contract has no overall determination' };
  }
  const conflict = out.determination && out.determination.conflict;

  for (const k of CONDITION_KEYS) {
    const c = conditions && conditions[k];
    const row = {
      v1_key: k, v02_condition_id: V1_KEY_TO_CONDITION[k], key_correspondence: 'v1_prompt_label_only',
      original_status: c ? c.status : null, original_note: c ? String(c.note || '') : null,
      v1_status_in_v02_terms: c ? TERMS[c.status] : null,
      mapping: null, effective_v02_status: null, reasons: [],
    };
    if (!c || recordReasons.length) {
      row.mapping = 'not_mappable'; row.effective_v02_status = 'not_assessed';
      row.reasons.push(...(c ? recordReasons : ['v1_output_not_valid']));
    } else {
      row.effective_v02_status = 'review_required';
      if (c.status === 'review') { row.mapping = 'exact'; row.reasons.push('v1_review_maps_to_review_required'); }
      else { row.mapping = 'lossy'; row.reasons.push('v1_' + c.status + '_has_no_offset_verified_evidence'); }
      if (c.status === 'pass') { row.mapping = 'ambiguous'; row.reasons.push('v1_pass_is_not_equivalent_to_supported: v1 pass asserted the condition was met; supported asserts only that cited record text is present'); }
      const quotes = quotedInNote(row.original_note);
      for (const q of quotes) row.reasons.push(typeof record === 'string' && record.includes(q)
        ? 'note_quotation_present_in_record_semantic_support_not_verified' : 'note_quotation_not_found_in_record');
      if (!quotes.length && row.original_note) row.reasons.push('note_has_no_exact_quotation');
      if (!row.original_note) row.reasons.push('note_empty');
      if (scanProhibitedClaims(row.original_note).length) row.reasons.push('note_contains_prohibited_claim');
      if (conflict) row.reasons.push('stored_determination_conflicts_with_conditions');
      if (out.record_flags.includes('record_instruction_risk_detected')) row.reasons.push('record_instruction_risk_detected');
    }
    out.conditions.push(row);
  }
  return out;
}

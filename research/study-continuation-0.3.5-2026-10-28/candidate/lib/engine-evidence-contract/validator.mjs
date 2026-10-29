// JRS EVIDENCE CONTRACT 0.2.0: candidate-response validation and normalisation.
//
// FAIL CLOSED. Two levels:
//   Response level: unparseable JSON, duplicated keys, prose around the JSON,
//     wrong contract_version, undeclared top-level fields, a condition_id outside
//     the contract, a repeated condition, a status outside the four permitted
//     values, or not exactly five conditions => the whole response is invalid
//     and every condition is not_assessed.
//   Condition level: an undeclared field, a missing or empty limitation, a
//     malformed evidence list, any cited item that fails exact verification, a
//     prohibited claim in candidate text, or a contradictory status combination
//     => that condition becomes review_required with structured reasons.
//
// supported and gap survive only with at least one offset-verified item and no
// blocking evidence failure. Nothing is repaired and no citation is inferred.

import { parseCandidateResponse } from './strict-json.mjs';
import { verifyEvidenceItems, recordSections } from './evidence.mjs';
import { scanProhibitedClaims } from './claims.mjs';
import { CONTRACT_VERSION, CONDITION_IDS, STATUSES, PRESENCE_LIMITATION, MAX_EVIDENCE_ITEMS } from './contract.mjs';

export const EVIDENCE_ASSESSMENTS = Object.freeze({
  verified: 'record_presence_verified_semantic_support_not_verified',
  failed: 'evidence_verification_failed',
  none: 'no_verified_evidence',
  notAssessed: 'not_assessed',
});

const CONDITION_KEYS_ALLOWED = ['condition_id', 'status', 'finding_summary', 'evidence_items', 'limitation'];

export function notAssessedCondition(id, reason, summary) {
  return {
    condition_id: id, status: 'not_assessed', candidate_status: 'none',
    finding_summary: summary || 'Not assessed.',
    evidence_items: [], rejected_evidence: [],
    evidence_assessment: EVIDENCE_ASSESSMENTS.notAssessed,
    limitation: PRESENCE_LIMITATION,
    human_review_required: true,
    routing_reasons: [reason],
    cognitive_controls: [],
  };
}

export function validateCandidateResponse(record, responseText) {
  const parsed = parseCandidateResponse(responseText);
  const response = { response_status: 'invalid', response_reasons: [], parse_notes: parsed.notes || [] };
  const allNotAssessed = (reason) => CONDITION_IDS.map((id) => notAssessedCondition(id, reason, 'Not assessed: the candidate response failed validation (' + reason + ').'));
  if (!parsed.ok) { response.response_reasons.push(parsed.reason); return { response, conditions: allNotAssessed(parsed.reason) }; }
  const v = parsed.value;
  const top = Object.keys(v).filter((k) => k !== 'contract_version' && k !== 'conditions');
  if (top.length) response.response_reasons.push('undeclared_top_level_fields:' + top.join(','));
  if (v.contract_version !== CONTRACT_VERSION) response.response_reasons.push('contract_version_mismatch');
  if (!Array.isArray(v.conditions) || v.conditions.length !== CONDITION_IDS.length) response.response_reasons.push('conditions_not_exactly_five');
  else {
    const ids = v.conditions.map((c) => c && c.condition_id);
    if (ids.some((id) => !CONDITION_IDS.includes(id))) response.response_reasons.push('unrecognised_condition_id');
    if (new Set(ids).size !== ids.length) response.response_reasons.push('duplicate_condition_id');
    if (v.conditions.some((c) => !c || !STATUSES.includes(c.status))) response.response_reasons.push('invalid_status_value');
  }
  if (response.response_reasons.length) return { response, conditions: allNotAssessed(response.response_reasons[0]) };
  response.response_status = 'valid';

  const sections = recordSections(record);
  const conditions = CONDITION_IDS.map((id) => {
    const c = v.conditions.find((x) => x.condition_id === id);
    const reasons = [];
    const extra = Object.keys(c).filter((k) => !CONDITION_KEYS_ALLOWED.includes(k));
    if (extra.length) reasons.push('undeclared_condition_fields:' + extra.join(','));
    const lim = typeof c.limitation === 'string' ? c.limitation.trim() : '';
    if (lim.length < 20) reasons.push('missing_limitation');
    const summary = typeof c.finding_summary === 'string' ? c.finding_summary.trim() : '';
    if (!summary || summary.length > 400) reasons.push('finding_summary_missing_or_too_long');
    const items = Array.isArray(c.evidence_items) ? c.evidence_items : null;
    if (!items) reasons.push('evidence_items_not_a_list');
    else if (items.length > MAX_EVIDENCE_ITEMS) reasons.push('too_many_evidence_items');
    const ev = items ? verifyEvidenceItems(record, items.slice(0, MAX_EVIDENCE_ITEMS), sections) : { verified: [], rejected: [], structural: [] };
    reasons.push(...ev.structural);
    const blocking = ev.rejected.filter((r) => !r.non_blocking);
    for (const r of blocking) reasons.push('evidence_failed:' + r.evidence_id + ':' + r.reason);
    const claims = [...scanProhibitedClaims(summary), ...scanProhibitedClaims(lim)];
    if (claims.length) reasons.push('prohibited_claim_in_candidate_text:' + [...new Set(claims.map((x) => x.category))].join(','));

    let status = c.status;
    if (status === 'not_assessed' && items && items.length) { reasons.push('contradictory_status_combination:not_assessed_with_evidence'); status = 'review_required'; }
    if ((status === 'supported' || status === 'gap') && !ev.verified.length) reasons.push('contradictory_status_combination:' + status + '_without_verified_evidence');
    const blocked = reasons.length > 0;
    if (blocked && status !== 'not_assessed') status = 'review_required';
    if (!blocked) reasons.push(status === 'review_required' ? 'candidate_status_review_required'
      : status === 'not_assessed' ? 'candidate_status_not_assessed' : 'candidate_status_' + status + '_with_offset_verified_evidence');

    const withhold = claims.length || blocking.length;
    return {
      condition_id: id,
      status,
      candidate_status: c.status,
      finding_summary: withhold ? 'Candidate summary withheld: ' + (claims.length ? 'it contains a prohibited conclusion.' : 'it relies on a citation that failed verification.') : summary || 'No candidate summary.',
      evidence_items: blocking.length ? [] : ev.verified,
      rejected_evidence: ev.rejected,
      evidence_assessment: status === 'not_assessed' ? EVIDENCE_ASSESSMENTS.notAssessed
        : blocking.length ? EVIDENCE_ASSESSMENTS.failed
          : ev.verified.length ? EVIDENCE_ASSESSMENTS.verified : EVIDENCE_ASSESSMENTS.none,
      limitation: PRESENCE_LIMITATION + (lim && !claims.length ? ' Candidate limitation: ' + lim.slice(0, 300) : ''),
      human_review_required: true,
      routing_reasons: reasons,
      cognitive_controls: [],
    };
  });
  return { response, conditions };
}

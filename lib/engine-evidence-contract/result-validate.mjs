// JRS EVIDENCE CONTRACT 0.2.0: independent result validation (fail closed).
//
// Re-checks a finished result without trusting the code that built it. Every
// rule here is a reason the result is not returned. Rules RV-01 to RV-14 are
// listed in research/engine-evidence-contract-2026-10-10/EVIDENCE_CONTRACT_SPECIFICATION.md.

import {
  CONTRACT_VERSION, ENGINE_CANDIDATE_VERSION, CODEBOOK_VERSION, RESULT_FORMAT_VERSION, HISTORICAL_REFERENCE_ID,
  RELEASE_STATUS, CONDITION_IDS, STATUSES, PRESENCE_LIMITATION, INSTRUCTION_RISK_LIMITATION,
} from './contract.mjs';
import { reverifyItem } from './evidence.mjs';
import { scanProhibitedClaims } from './claims.mjs';
import { checkRemediationNeutral } from './remediation.mjs';

export function canonical(v) {
  const sort = (x) => Array.isArray(x) ? x.map(sort) : (x && typeof x === 'object'
    ? Object.fromEntries(Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => [k, sort(x[k])])) : x);
  return JSON.stringify(sort(v));
}

const VERIFIED = 'record_presence_verified_semantic_support_not_verified';
// Fields that hold record text, candidate text under audit, or historical output
// verbatim. They are checked against the record or preserved for audit, not
// scanned for claims the package itself makes.
const VERBATIM = new Set(['exact_quote', 'matched_text', 'quote', 'original_note', 'verbatim', 'finding_summary_candidate']);

function strings(v, path, out) {
  if (typeof v === 'string') out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, path + '[' + i + ']', out));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) if (!VERBATIM.has(k)) strings(v[k], path + '.' + k, out);
  return out;
}

export function validateResult(r, record) {
  const p = [];
  const add = (rule, msg) => p.push(rule + ': ' + msg);
  if (!r || typeof r !== 'object') return ['RV-00: result is not an object'];
  // RV-01 version identity.
  if (r.contract_version !== CONTRACT_VERSION) add('RV-01', 'contract_version');
  if (r.engine_candidate_version !== ENGINE_CANDIDATE_VERSION) add('RV-01', 'engine_candidate_version');
  if (r.codebook_version !== CODEBOOK_VERSION) add('RV-01', 'codebook_version');
  if (r.result_format_version !== RESULT_FORMAT_VERSION) add('RV-01', 'result_format_version');
  if (r.historical_reference_id !== HISTORICAL_REFERENCE_ID) add('RV-01', 'historical_reference_id');
  if (r.release_status !== RELEASE_STATUS) add('RV-01', 'release_status');
  // RV-02 five conditions, contract ids, permitted statuses.
  const cs = Array.isArray(r.conditions) ? r.conditions : [];
  const ids = cs.map((c) => c && c.condition_id);
  if (cs.length !== 5 || CONDITION_IDS.some((id) => ids.filter((x) => x === id).length !== 1)) add('RV-02', 'conditions must be the five contract ids once each');
  const stopped = !r.intake || r.intake.gate_decision !== 'proceed';
  for (const c of cs) {
    if (!c) continue;
    const w = c.condition_id;
    if (!STATUSES.includes(c.status)) add('RV-02', w + ' status ' + c.status);
    // RV-03 human review and limitation on every condition.
    if (c.human_review_required !== true) add('RV-03', w + ' human_review_required');
    if (typeof c.limitation !== 'string' || !c.limitation.includes(PRESENCE_LIMITATION)) add('RV-03', w + ' presence limitation missing');
    // RV-04 every listed evidence item is offset-verified and marked semantic-unverified.
    for (const it of c.evidence_items || []) {
      if (it.semantic_support_not_verified !== true) add('RV-04', w + ' semantic_support_not_verified must be true');
      if (it.presence_verified !== true) add('RV-04', w + ' presence_verified must be true');
      if (typeof record === 'string' && !reverifyItem(record, it)) add('RV-04', w + ' evidence ' + it.evidence_id + ' does not re-verify');
    }
    // RV-05 supported and gap only with verified evidence and no failure.
    if (c.status === 'supported' || c.status === 'gap') {
      if (!(c.evidence_items || []).length) add('RV-05', w + ' ' + c.status + ' without evidence');
      if (c.evidence_assessment !== VERIFIED) add('RV-05', w + ' ' + c.status + ' with assessment ' + c.evidence_assessment);
      if ((c.rejected_evidence || []).some((x) => !x.non_blocking)) add('RV-05', w + ' ' + c.status + ' despite failed evidence');
      if (c.candidate_status !== c.status) add('RV-05', w + ' ' + c.status + ' not equal to candidate status ' + c.candidate_status);
      if ((c.routing_reasons || []).some((x) => !x.startsWith('candidate_status_'))) add('RV-05', w + ' ' + c.status + ' with a blocking routing reason');
      if (r.record_instruction_risk === 'detected') add('RV-05', w + ' ' + c.status + ' with instruction risk detected');
      if (stopped) add('RV-05', w + ' ' + c.status + ' after a refused or escalated intake');
    }
    // RV-06 candidate review_required is never promoted.
    if (c.candidate_status === 'review_required' && c.status !== 'review_required') add('RV-06', w + ' review_required promoted to ' + c.status);
    // RV-07 not_assessed carries nothing.
    if (c.status === 'not_assessed' && (c.evidence_items || []).length) add('RV-07', w + ' not_assessed with evidence');
    // RV-08 remediation stays neutral.
    for (const cc of c.cognitive_controls || []) { const n = checkRemediationNeutral(cc); if (n.length) add('RV-08', w + ' ' + n.join(',')); }
  }
  // RV-09 stopped intake assesses nothing.
  if (stopped && cs.some((c) => c && c.status !== 'not_assessed')) add('RV-09', 'refused or escalated intake with an assessed condition');
  if (stopped && r.candidate_response_validation && r.candidate_response_validation.response_status !== 'not_read') add('RV-09', 'candidate response read after a stopped intake');
  // RV-10 execution boundary and instruction-risk limitation.
  if (r.execution_boundary !== 'preserved') add('RV-10', 'execution_boundary');
  if (!['detected', 'not_detected', 'not_assessed'].includes(r.record_instruction_risk)) add('RV-10', 'record_instruction_risk value');
  if (!r.instruction_quarantine || r.instruction_quarantine.limitation !== INSTRUCTION_RISK_LIMITATION) add('RV-10', 'instruction-risk limitation missing');
  // RV-11 long-record plan never analyses.
  const lr = r.long_record;
  if (lr && (lr.analysis_performed !== false || lr.segmented_analysis_authorized !== false || lr.findings_combined !== false
    || (lr.segments || []).some((s) => s.analysed !== false))) add('RV-11', 'long-record plan claims analysis');
  if (lr && lr.length_status === 'above_limit' && !stopped) add('RV-11', 'record above the limit was not refused');
  // RV-12 human-review route.
  if (!r.human_review || r.human_review.required !== true || !r.human_review.route) add('RV-12', 'human review route missing');
  // RV-13 no overall result anywhere outside the historical comparison.
  const walk = (v, path) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, path + '[' + i + ']'));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) {
      if (path.startsWith('$.v1_comparison')) continue;
      if (/^(overall|determination|final_decision|recommendation|approved|production|certif|complian|validated)/i.test(k)) add('RV-13', 'prohibited key ' + path + '.' + k);
      walk(v[k], path + '.' + k);
    }
  };
  walk(r, '$');
  // RV-14 no prohibited claim in any string this package authored.
  for (const [path, s] of strings(r, '$', [])) {
    if (path.startsWith('$.v1_comparison.bridge.original_output')) continue;
    const hits = scanProhibitedClaims(s);
    if (hits.length) add('RV-14', path + ' "' + hits[0].term + '"');
  }
  return p;
}

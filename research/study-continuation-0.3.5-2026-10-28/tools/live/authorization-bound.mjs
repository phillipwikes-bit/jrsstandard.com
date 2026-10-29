// Study continuation (0.3.5), ported from study-completion-0.3.4-2026-10-28: checks a live-run authorization before any request. Derived from the 156-study verifier
// (tools/transport/study-authorization.mjs in the frozen packages, unchanged there), bound to this study's frozen plan.
// Pure function: reads no credential and no environment value. Every field is required; any problem refuses.
// Changes from the frozen verifier: the study name; plan_sha256, phases_authorized, api_version, max_attempts and
// provider_retention_confirmed are required; the request's phase and request identifier must be in the authorized plan;
// the earlier unsigned drafts and the spent Stage A authorization can never authorize anything.
import { createHash } from 'node:crypto';

export const STUDY_NAME = 'JRS records study continuation: 0.3.5 research candidate (0.3.4 compiler, corrected prompt), live model run, arm L2';
export const PHASES = Object.freeze(['PRE', 'RUN', 'TGT']);
export const REQUIRED_FIELDS = Object.freeze(['authorization_id', 'study', 'model_identifier', 'api_version', 'candidate_version', 'candidate_manifest_sha256', 'prompt_sha256',
  'plan_sha256', 'record_set_sha256', 'phases_authorized', 'max_requests', 'max_attempts', 'max_budget_usd', 'expiry_utc', 'retention_location', 'retention_deletion_rule',
  'provider_retention_confirmed', 'credential_environment_variable_name', 'destination', 'stop_rules_approved', 'owner_signature', 'signed_at_utc']);
export const NEVER_VALID = Object.freeze(['STAGE-A-AUTH-20261025-01', 'PREFLIGHT-0.3.4-DRAFT', 'STUDY156-LIVE-DRAFT', 'COMPLETION-LIVE-DRAFT', 'RUN-LIVE-AUTH-20261028-01', 'CONTINUATION-LIVE-DRAFT']);
// RUN-LIVE-AUTH-20261028-01 authorized the 0.3.4 run (arm L1), which stopped on SR-10; it never covers this continuation.
const ENV_NAME = /^[A-Z][A-Z0-9_]{2,63}$/;
const canon = (v) => (v && typeof v === 'object' ? (Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}') : JSON.stringify(v));
export const authorizationSha256 = (a) => createHash('sha256').update(canon(a)).digest('hex');

// expected: { authorizationSha256, model, api_version, candidate_version, candidate_manifest_sha256, prompt_sha256, plan_sha256, record_set_sha256, destination,
//             requestsByPhase: { PRE: [ids], RUN: [ids], TGT: [ids] } }
// request:  { requestId, recordId, phase, body, worstCaseUsd }      state: { requestsSoFar, attemptsSoFar, spentUsd }
export function verifyCompletionAuthorization(a, request, nowUtc, expected, state = { requestsSoFar: 0, attemptsSoFar: 0, spentUsd: 0 }) {
  const p = [];
  if (!a || typeof a !== 'object') return ['authorization_absent'];
  if (NEVER_VALID.includes(a.authorization_id) || /DRAFT/i.test(String(a.authorization_id || ''))) p.push('authorization_spent_superseded_or_draft:' + a.authorization_id);
  for (const f of REQUIRED_FIELDS) if (a[f] === undefined || a[f] === null || a[f] === '' || a[f] === false || (Array.isArray(a[f]) && !a[f].length)) p.push('authorization_field_absent:' + f);
  if (!expected || authorizationSha256(a) !== expected.authorizationSha256) p.push('authorization_integrity_mismatch');
  if (a.study !== STUDY_NAME) p.push('authorization_not_for_this_study');
  const exp = Date.parse(a.expiry_utc), signed = Date.parse(a.signed_at_utc), now = Date.parse(nowUtc);
  if (!Number.isFinite(exp) || !(now < exp)) p.push('authorization_expired_or_invalid_expiry');
  if (!Number.isFinite(signed) || signed > now) p.push('authorization_signature_date_invalid');
  if (typeof a.owner_signature !== 'string' || a.owner_signature.trim().length < 3 || /^(?:TBD|TODO|UNSIGNED|PENDING|N\/A)/i.test(a.owner_signature.trim())) p.push('owner_signature_missing_or_placeholder');
  if (a.credential_environment_variable_name !== undefined && !ENV_NAME.test(String(a.credential_environment_variable_name))) p.push('credential_field_must_be_a_variable_name');
  if (/^(?:ANTHROPIC_API_KEY|ANTHROPIC_AUTH_TOKEN|ANTHROPIC_BASE_URL)$/.test(String(a.credential_environment_variable_name))) p.push('credential_variable_name_reserved_by_sdk');
  if (!Array.isArray(a.phases_authorized) || !a.phases_authorized.every((x) => PHASES.includes(x))) p.push('phases_invalid');
  else if (a.phases_authorized.some((x) => x !== 'PRE') && !a.phases_authorized.includes('PRE')) p.push('later_phase_without_preflight');
  if (expected) {
    for (const [k, f] of [['model_identifier', 'model'], ['api_version', 'api_version'], ['candidate_version', 'candidate_version'], ['candidate_manifest_sha256', 'candidate_manifest_sha256'], ['prompt_sha256', 'prompt_sha256'],
      ['plan_sha256', 'plan_sha256'], ['record_set_sha256', 'record_set_sha256'], ['destination', 'destination']])
      if (a[k] !== expected[f]) p.push(k + '_differs_from_frozen_value');
  }
  if (!(Number.isInteger(a.max_requests) && a.max_requests >= 1)) p.push('max_requests_invalid');
  if (!(Number.isInteger(a.max_attempts) && a.max_attempts >= a.max_requests)) p.push('max_attempts_invalid');
  if (!(typeof a.max_budget_usd === 'number' && a.max_budget_usd > 0)) p.push('max_budget_invalid');
  if (request) {
    if (!Array.isArray(a.phases_authorized) || !a.phases_authorized.includes(request.phase)) p.push('phase_not_authorized:' + request.phase);
    const ids = expected && expected.requestsByPhase ? expected.requestsByPhase[request.phase] || [] : [];
    if (!ids.includes(request.requestId)) p.push('request_not_in_authorized_plan');
    if (request.body && request.body.model !== a.model_identifier) p.push('request_model_differs_from_authorization');
    if (state.requestsSoFar + 1 > a.max_requests) p.push('request_limit_would_be_exceeded');
    if (state.attemptsSoFar + 1 > a.max_attempts) p.push('attempt_limit_would_be_exceeded');
    if (typeof request.worstCaseUsd === 'number' && state.spentUsd + request.worstCaseUsd > a.max_budget_usd) p.push('budget_would_be_exceeded');
  } else p.push('request_absent');
  return p;
}

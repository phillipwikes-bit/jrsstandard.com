// 156-record study: checks a live-run authorization artifact before any request. Pure function; reads no
// credential and no environment value. Every field is required; any problem refuses the request.
// The spent Stage A authorization can never authorize anything here.
import { createHash } from 'node:crypto';

export const REQUIRED_FIELDS = Object.freeze(['authorization_id', 'study', 'model_identifier', 'candidate_version', 'candidate_manifest_sha256', 'prompt_sha256',
  'record_set_sha256', 'authorized_record_ids', 'max_requests', 'max_budget_usd', 'expiry_utc', 'retention_location', 'retention_deletion_rule',
  'credential_environment_variable_name', 'destination', 'stop_rules_approved', 'owner_signature', 'signed_at_utc']);
export const SPENT_AUTHORIZATIONS = Object.freeze(['STAGE-A-AUTH-20261025-01']);
const ENV_NAME = /^[A-Z][A-Z0-9_]{2,63}$/;
const canon = (v) => (v && typeof v === 'object' ? (Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}') : JSON.stringify(v));
export const authorizationSha256 = (a) => createHash('sha256').update(canon(a)).digest('hex');

// expected: { authorizationSha256, model, candidate_version, candidate_manifest_sha256, prompt_sha256, record_set_sha256, destination }
export function verifyStudyAuthorization(a, request, nowUtc, expected, state = { requestsSoFar: 0, spentUsd: 0 }) {
  const p = [];
  if (!a || typeof a !== 'object') return ['authorization_absent'];
  if (SPENT_AUTHORIZATIONS.includes(a.authorization_id)) p.push('authorization_spent_or_superseded:' + a.authorization_id);
  for (const f of REQUIRED_FIELDS) if (a[f] === undefined || a[f] === null || a[f] === '' || a[f] === false) p.push('authorization_field_absent:' + f);
  if (!expected || authorizationSha256(a) !== expected.authorizationSha256) p.push('authorization_integrity_mismatch');
  if (a.study !== '156-record study') p.push('authorization_not_for_this_study');
  const exp = Date.parse(a.expiry_utc), signed = Date.parse(a.signed_at_utc), now = Date.parse(nowUtc);
  if (!Number.isFinite(exp) || !(now < exp)) p.push('authorization_expired_or_invalid_expiry');
  if (!Number.isFinite(signed) || signed > now) p.push('authorization_signature_date_invalid');
  if (a.credential_environment_variable_name !== undefined && !ENV_NAME.test(String(a.credential_environment_variable_name))) p.push('credential_field_must_be_a_variable_name');
  if (/^(?:ANTHROPIC_API_KEY|ANTHROPIC_AUTH_TOKEN|ANTHROPIC_BASE_URL)$/.test(String(a.credential_environment_variable_name))) p.push('credential_variable_name_reserved_by_sdk');
  if (expected) {
    for (const [k, f] of [['model_identifier', 'model'], ['candidate_version', 'candidate_version'], ['candidate_manifest_sha256', 'candidate_manifest_sha256'], ['prompt_sha256', 'prompt_sha256'], ['record_set_sha256', 'record_set_sha256'], ['destination', 'destination']])
      if (a[k] !== expected[f]) p.push(k + '_differs_from_frozen_value');
  }
  if (!(Number.isInteger(a.max_requests) && a.max_requests >= 1)) p.push('max_requests_invalid');
  if (!(typeof a.max_budget_usd === 'number' && a.max_budget_usd > 0)) p.push('max_budget_invalid');
  if (request) {
    if (!Array.isArray(a.authorized_record_ids) || !a.authorized_record_ids.includes(request.recordId)) p.push('record_not_in_authorized_set');
    if (request.body && request.body.model !== a.model_identifier) p.push('request_model_differs_from_authorization');
    if (state.requestsSoFar + 1 > a.max_requests) p.push('request_limit_would_be_exceeded');
    if (typeof request.worstCaseUsd === 'number' && state.spentUsd + request.worstCaseUsd > a.max_budget_usd) p.push('budget_would_be_exceeded');
  } else p.push('request_absent');
  return p;
}

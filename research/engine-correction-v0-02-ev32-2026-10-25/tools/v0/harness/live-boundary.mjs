// Live-transport boundary for the feasibility harness (adapter 0.2.0).
//
// This module decides whether a live provider transport may be constructed. It
// never sends anything. Even when every authorization check passes, dispatch is
// stopped by LIVE_DISPATCH_ENABLED, which is false in this build and may only be
// changed under a separate signed live-run authorization.
//
// No provider, model or endpoint is chosen here. The owner supplies them in the
// authorization artifact. The credential is identified only by the NAME of an
// environment variable; its value is never read, printed, logged or persisted by
// this module.

import { createHash } from 'node:crypto';

export const LIVE_DISPATCH_ENABLED = false;
export const MAX_REQUESTS_CAP = 10;
export const REQUIRED_AUTH_FIELDS = Object.freeze(['provider_name', 'model_identifier', 'provider_endpoint_reference',
  'credential_environment_variable_name', 'maximum_requests', 'maximum_budget', 'authorization_expiry_utc', 'retention_location',
  'stop_rules_approved', 'synthetic_material_only', 'owner_signature', 'signed_at_utc']);
const ENV_NAME = /^[A-Z][A-Z0-9_]{2,63}$/;
const CREDENTIAL_PATTERNS = [/sk-ant-[A-Za-z0-9_-]{8,}/, /\bsk-[A-Za-z0-9]{16,}/, /\bBearer\s+[A-Za-z0-9._-]{8,}/i, /x-api-key\s*[:=]\s*\S+/i];

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const canonical = (o) => JSON.stringify(o, Object.keys(o).sort());

export class BoundaryRefusal extends Error {
  constructor(code) { super('live_transport_refused:' + code); this.code = code; }
}

// Redacting record writer. Refuses any output that contains a registered sentinel
// value or a credential-shaped string. The refusal message never echoes the value.
export function createSafeWriter(sink) {
  const sentinels = new Set();
  return {
    registerSentinel(v) { if (typeof v === 'string' && v.length >= 8) sentinels.add(v); },
    write(record) {
      const text = typeof record === 'string' ? record : JSON.stringify(record);
      for (const s of sentinels) if (text.includes(s)) throw new BoundaryRefusal('credential_value_in_output');
      for (const re of CREDENTIAL_PATTERNS) if (re.test(text)) throw new BoundaryRefusal('credential_shaped_value_in_output');
      sink.push(text);
    },
  };
}

// Checks every precondition. Returns the list of refusal codes (empty when all pass).
export function checkLiveAuthorization({ mode, gate1, authorization, authorizationSha256, requested, nowUtc, requestCount, seenRecordIds }) {
  const refusals = [];
  if (mode !== 'live_authorized') refusals.push('offline_mode_live_transport_not_permitted');
  if (!gate1 || gate1.status !== 'CLEARED' || gate1.observed_sha256 !== gate1.expected_sha256) refusals.push('gate1_not_cleared');
  if (!authorization || typeof authorization !== 'object') { refusals.push('authorization_absent'); return refusals; }
  if (!authorizationSha256 || sha256(canonical(authorization)) !== authorizationSha256) refusals.push('authorization_integrity_mismatch');
  for (const f of REQUIRED_AUTH_FIELDS) {
    const v = authorization[f];
    if (v === undefined || v === null || v === '' || v === false) refusals.push('authorization_field_absent:' + f);
  }
  if (authorization.credential_environment_variable_name !== undefined && !ENV_NAME.test(String(authorization.credential_environment_variable_name))) refusals.push('credential_field_must_be_a_variable_name');
  const exp = Date.parse(authorization.authorization_expiry_utc);
  if (!Number.isFinite(exp) || Date.parse(nowUtc) >= exp) refusals.push('authorization_expired_or_invalid_expiry');
  if (!(Number.isInteger(authorization.maximum_requests) && authorization.maximum_requests >= 1 && authorization.maximum_requests <= MAX_REQUESTS_CAP)) refusals.push('maximum_requests_outside_cap');
  if (requested) {
    if (requested.provider_name !== authorization.provider_name) refusals.push('provider_differs_from_authorization');
    if (requested.model_identifier !== authorization.model_identifier) refusals.push('model_identifier_differs_from_authorization');
    if (requested.material_classification !== 'synthetic_development_material') refusals.push('material_not_classified_synthetic_development');
    if (seenRecordIds && seenRecordIds.has(requested.synthetic_record_id)) refusals.push('duplicate_synthetic_record_id');
  } else refusals.push('request_absent');
  const cap = Math.min(Number.isInteger(authorization.maximum_requests) ? authorization.maximum_requests : 0, MAX_REQUESTS_CAP);
  if (requestCount + 1 > cap) refusals.push('request_limit_would_be_exceeded');
  return refusals;
}

// Builds a live transport only if every check passes, and even then refuses to
// dispatch in this build. The injected sender is never called while
// LIVE_DISPATCH_ENABLED is false.
export function createLiveTransport(ctx, sender) {
  const seenRecordIds = new Set();
  let requestCount = 0;
  const transport = {
    kind: 'live_provider',
    enabled: false,
    async send(request) {
      const refusals = checkLiveAuthorization({ ...ctx, requested: request, requestCount, seenRecordIds, nowUtc: ctx.clock() });
      if (refusals.length) throw new BoundaryRefusal(refusals[0]);
      if (!LIVE_DISPATCH_ENABLED) throw new BoundaryRefusal('live_dispatch_not_enabled_in_this_build');
      seenRecordIds.add(request.synthetic_record_id);
      requestCount += 1;
      return sender(request);                       // unreachable in this build
    },
  };
  BRANDED.add(transport);
  return transport;
}

export const authorizationSha256 = (a) => sha256(canonical(a));

// Brand check: only transports built by createLiveTransport are accepted as live.
const BRANDED = new WeakSet();
export const isBoundaryTransport = (t) => BRANDED.has(t);

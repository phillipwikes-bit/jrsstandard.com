// Offline tests for the live-transport boundary. No live request is possible:
// the network guard is installed first, the injected sender is a recorder that
// is never expected to be called, and LIVE_DISPATCH_ENABLED is false.
import { attempts, installNetGuard } from './net-guard.mjs';
installNetGuard();

import { writeFileSync } from 'node:fs';
import { createLiveTransport, checkLiveAuthorization, createSafeWriter, authorizationSha256, BoundaryRefusal, LIVE_DISPATCH_ENABLED } from './live-boundary.mjs';
import { PROVENANCE, createRun } from './adapter.mjs';

const OUT = process.argv[2];
const NOW = '2026-10-24T12:00:00.000Z';
const ARCHIVE = '3a1e2f261feafa5280d28fd99475df19b37a33192da3c2e78d5d4b405289b62e';
const GATE1_CLEARED = { status: 'CLEARED', expected_sha256: ARCHIVE, observed_sha256: ARCHIVE };   // synthetic test state only
const GATE1_OPEN = { status: 'OPEN', expected_sha256: ARCHIVE, observed_sha256: null };
// Synthetic placeholder values. None names a real provider, model, endpoint or credential.
const AUTH = Object.freeze({
  provider_name: 'TEST-PROVIDER-PLACEHOLDER', model_identifier: 'TEST-MODEL-PLACEHOLDER', provider_endpoint_reference: 'TEST-ENDPOINT-REFERENCE-PLACEHOLDER',
  credential_environment_variable_name: 'TEST_CREDENTIAL_VARIABLE_NAME', maximum_requests: 10, maximum_budget: 'TEST-BUDGET-PLACEHOLDER',
  authorization_expiry_utc: '2026-11-30T00:00:00.000Z', retention_location: 'TEST-RETENTION-PLACEHOLDER', stop_rules_approved: true,
  synthetic_material_only: true, owner_signature: 'TEST-SIGNATURE-PLACEHOLDER', signed_at_utc: '2026-10-24T00:00:00.000Z',
});
const REQ = Object.freeze({ request_id: 'LT-REQ', synthetic_record_id: 'HF-001', provider_name: AUTH.provider_name, model_identifier: AUTH.model_identifier, material_classification: 'synthetic_development_material' });
const ctx = (over = {}) => {
  const authorization = 'authorization' in over ? over.authorization : AUTH;
  return { mode: 'live_authorized', gate1: GATE1_CLEARED, authorization, authorizationSha256: authorization ? authorizationSha256(authorization) : null, clock: () => NOW, ...over };
};
const without = (k) => { const a = { ...AUTH }; delete a[k]; return a; };

async function attempt(c, req = REQ, priorSends = 0) {
  const senderCalls = [];
  const t = createLiveTransport(c, async (r) => { senderCalls.push(r.request_id); return { status: 'ok' }; });
  let code = null;
  for (let i = 0; i <= priorSends; i++) {
    try { await t.send({ ...req, request_id: req.request_id + '-' + i }); code = 'sent'; }
    catch (e) { code = e instanceof BoundaryRefusal ? e.code : 'unexpected_error:' + e.message; }
  }
  return { code, senderCalls: senderCalls.length };
}
const refuses = (c, expected, req) => async () => {
  const r = await attempt(c, req);
  return { pass: r.code === expected && r.senderCalls === 0, observed: r };
};

const TESTS = [
  ['LT-01', 'Gate 1 open', 'gate1_not_cleared', refuses(ctx({ gate1: GATE1_OPEN }), 'gate1_not_cleared')],
  ['LT-02', 'Authorization absent', 'authorization_absent', refuses(ctx({ authorization: null }), 'authorization_absent')],
  ['LT-03', 'Authorization expired', 'authorization_expired_or_invalid_expiry', refuses(ctx({ clock: () => '2026-12-01T00:00:00.000Z' }), 'authorization_expired_or_invalid_expiry')],
  ['LT-04', 'Provider differs from authorization', 'provider_differs_from_authorization', refuses(ctx(), 'provider_differs_from_authorization', { ...REQ, provider_name: 'OTHER-PROVIDER-PLACEHOLDER' })],
  ['LT-05', 'Model identifier differs from authorization', 'model_identifier_differs_from_authorization', refuses(ctx(), 'model_identifier_differs_from_authorization', { ...REQ, model_identifier: 'OTHER-MODEL-PLACEHOLDER' })],
  ['LT-06', 'Request limit would exceed ten', 'maximum_requests_outside_cap and request_limit_would_be_exceeded', async () => {
    const over = { ...AUTH, maximum_requests: 11 };
    const a = checkLiveAuthorization({ ...ctx({ authorization: over }), requested: REQ, nowUtc: NOW, requestCount: 0, seenRecordIds: new Set() });
    const b = checkLiveAuthorization({ ...ctx(), requested: REQ, nowUtc: NOW, requestCount: 10, seenRecordIds: new Set() });
    const r = await attempt(ctx({ authorization: over }));
    return { pass: a.includes('maximum_requests_outside_cap') && b.includes('request_limit_would_be_exceeded') && r.senderCalls === 0, observed: { cap_11: a, eleventh_request: b, sender_calls: r.senderCalls } };
  }],
  ['LT-07', 'Budget absent', 'authorization_field_absent:maximum_budget', refuses(ctx({ authorization: without('maximum_budget') }), 'authorization_field_absent:maximum_budget')],
  ['LT-08', 'Retention location absent', 'authorization_field_absent:retention_location', refuses(ctx({ authorization: without('retention_location') }), 'authorization_field_absent:retention_location')],
  ['LT-09', 'Synthetic-material classification absent', 'material_not_classified_synthetic_development', refuses(ctx(), 'material_not_classified_synthetic_development', { ...REQ, material_classification: undefined })],
  ['LT-10', 'Synthetic-record identifier duplicated', 'duplicate_synthetic_record_id', async () => {
    const seen = new Set(['HF-001']);
    const codes = checkLiveAuthorization({ ...ctx(), requested: REQ, nowUtc: NOW, requestCount: 0, seenRecordIds: seen });
    return { pass: codes.includes('duplicate_synthetic_record_id'), observed: { codes } };
  }],
  ['LT-11', 'Live transport selected during offline mode', 'offline_mode_live_transport_not_permitted', refuses(ctx({ mode: 'offline' }), 'offline_mode_live_transport_not_permitted')],
  ['LT-12', 'Credential value would enter a log or record', 'credential_value_in_output; credential_field_must_be_a_variable_name', async () => {
    const sink = [];
    const w = createSafeWriter(sink);
    const SENTINEL = 'SYNTHETIC-SENTINEL-NOT-A-CREDENTIAL-7Q2';     // synthetic stand-in for a credential value
    w.registerSentinel(SENTINEL);
    let code = null, message = '';
    try { w.write({ note: 'value ' + SENTINEL }); } catch (e) { code = e.code; message = e.message; }
    const valueInField = checkLiveAuthorization({ ...ctx({ authorization: { ...AUTH, credential_environment_variable_name: 'not a variable name: ' + SENTINEL } }), requested: REQ, nowUtc: NOW, requestCount: 0, seenRecordIds: new Set() });
    const pass = code === 'credential_value_in_output' && !message.includes(SENTINEL) && sink.length === 0 && valueInField.includes('credential_field_must_be_a_variable_name');
    return { pass, observed: { writer_code: code, refusal_message_echoes_value: message.includes(SENTINEL), records_written: sink.length, field_check: valueInField.filter((c) => c.startsWith('credential')) } };
  }],
  ['LT-13', 'Positive control: every check passes, dispatch still locked in this build', 'live_dispatch_not_enabled_in_this_build', refuses(ctx(), 'live_dispatch_not_enabled_in_this_build')],
  ['LT-14', 'Provenance labels by transport kind', 'PROVENANCE map', async () => {
    const pass = PROVENANCE.mock.response_origin === 'mock_transport_fixture' && PROVENANCE.mock.adapter_transport_mode === 'mocked'
      && PROVENANCE.live_provider.response_origin === 'live_provider_captured' && PROVENANCE.live_provider.adapter_transport_mode === 'live_provider'
      && Object.keys(PROVENANCE).length === 2;
    return { pass, observed: PROVENANCE };
  }],
  ['LT-15', 'Hand-built live transport cannot bypass the boundary', 'live_transport_not_created_by_boundary', async () => {
    let fakeCalls = 0;
    const fake = { kind: 'live_provider', enabled: true, async send() { fakeCalls += 1; return {}; } };
    let code = null;
    try { createRun({ runId: 'LT-15', engine: {}, transport: fake, model_identifier: 'TEST-MODEL-PLACEHOLDER', systemUnderTest: {}, outDir: OUT + '.lt15' }); } catch (e) { code = e.message; }
    return { pass: code === 'live_transport_not_created_by_boundary' && fakeCalls === 0, observed: { code, fake_send_calls: fakeCalls } };
  }],
];

const results = [];
for (const [id, name, expected, fn] of TESTS) {
  const before = attempts.length;
  let entry;
  try { const o = await fn(); entry = { id, name, expected, result: o.pass ? 'pass' : 'fail', observed: o.observed }; }
  catch (e) { entry = { id, name, expected, result: 'error', error: String(e.message).slice(0, 200) }; }
  entry.network_attempts = attempts.length - before;
  if (entry.network_attempts) entry.result = 'fail';
  results.push(entry);
}
const summary = {
  result_format: 'jrs-live-boundary-offline-results/0.1.0', run_at_utc: new Date().toISOString(), live_dispatch_enabled: LIVE_DISPATCH_ENABLED,
  totals: { tests: results.length, passed: results.filter((r) => r.result === 'pass').length, failed: results.filter((r) => r.result === 'fail').length, skipped: 0, load_or_setup_errors: results.filter((r) => r.result === 'error').length },
  network_attempts_total: attempts.length, credential_values_read: 0,
  note: 'All provider, model, endpoint, credential-name, budget and signature values are synthetic placeholders. Gate 1 CLEARED appears only as a synthetic test state; the actual Gate 1 status is OPEN.',
  tests: results,
};
writeFileSync(OUT, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.totals), 'network', attempts.length);
for (const r of results) console.log(r.id, r.result, r.result === 'pass' ? '' : JSON.stringify(r.observed || r.error).slice(0, 300));

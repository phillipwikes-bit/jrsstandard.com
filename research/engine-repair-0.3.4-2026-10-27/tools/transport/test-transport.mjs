// 156-record study: offline tests of the live-sender design, the study authorization check and the capture
// adapter. Every request goes to an injected FAKE fetch; the network guard traps everything else and the run fails
// if it records an attempt. No credential exists here: the "credential" is a fixed placeholder string.
// Usage: node tools/transport/test-transport.mjs     (writes out/transport/RESULTS.json)
import { attempts, installNetGuard } from '../../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './sender.mjs';
import { verifyStudyAuthorization, authorizationSha256, SPENT_AUTHORIZATIONS } from './study-authorization.mjs';
import { extractCandidate, pairCapture } from './study-adapter.mjs';
import { forbiddenEnvPresent } from '../../../validation-readiness-gate-v0-2026-10-25/tools/harness/adapter.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLACEHOLDER = 'TEST-PLACEHOLDER-NOT-A-CREDENTIAL';
const results = [];
const test = async (id, name, fn) => { let ok = false, observed = null; try { const r = await fn(); ok = !!r.ok; observed = r.observed === undefined ? null : r.observed; } catch (e) { observed = 'threw: ' + (e.code || '') + ' ' + String(e.message).slice(0, 160); }
  results.push({ id, name, ok, observed }); };

const okBody = (o = {}) => JSON.stringify(Object.assign({ id: 'msg_test', type: 'message', model: S.MODEL, stop_reason: 'end_turn', content: [{ type: 'text', text: '{"observations":[]}' }], usage: { input_tokens: 1200, output_tokens: 800 } }, o));
const resp = (status, text, headers = {}) => ({ status, headers: { get: (h) => headers[h] }, text: async () => text });
function fakeFetch(script) {
  const calls = [];
  const f = async (url, init) => { calls.push({ url, init }); const step = script[Math.min(calls.length - 1, script.length - 1)];
    if (step.throws) throw Object.assign(new Error(step.throws), { name: step.throws });
    if (step.hang) return new Promise((resolve, reject) => { init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))); });
    return resp(step.status, step.body !== undefined ? step.body : okBody(), step.headers || {}); };
  f.calls = calls; return f;
}
function ctx(fetchImpl, o = {}) {
  let t = 0; const waits = [];
  const store = new Map();
  const c = Object.assign({ fetchImpl, credential: PLACEHOLDER, sink: S.createCaptureSink(store), journal: S.createJournal(), budgetUsd: 1, maxRequests: 100, maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 20000, timeoutMs: 1000,
    sleep: async (ms) => { waits.push(ms); }, now: () => new Date(Date.UTC(2026, 9, 27, 0, 0, t++)).toISOString(), random: () => 0 }, o);
  c.waits = waits; c.store = store; return c;
}
const body = (o) => S.buildRequestBody(Object.assign({ system: 'S', user: 'U <record>R</record>' }, o || {}));
const req = (id = 'Q1', o = {}) => Object.assign({ requestId: id, recordId: 'S-001', body: body() }, o);

// ------------------------------------------------------------ request shape and destination
await test('T01', 'request body has the model, a user turn last, thinking disabled at medium effort, and no sampling or fallback fields', () => { const b = body(); return { ok: b.model === 'claude-haiku-5-5' && b.messages.at(-1).role === 'user' && b.thinking.type === 'disabled' && b.output_config.effort === 'medium' && !S.checkBody(b).length && !['temperature', 'top_p', 'top_k', 'fallbacks'].some((k) => k in b), observed: Object.keys(b) }; });
await test('T02', 'a body carrying temperature, top_p, top_k or fallbacks is refused before any fetch', async () => { const f = fakeFetch([{ status: 200 }]); const out = []; for (const k of ['temperature', 'top_p', 'top_k', 'fallbacks']) { try { await S.dispatchCore(ctx(f), req('Q-' + k, { body: Object.assign(body(), { [k]: 1 }) })); out.push('sent'); } catch (e) { out.push(e.code); } } return { ok: out.every((x) => x === 'forbidden_body_field:' + 'temperature' || /^forbidden_body_field:/.test(x)) && f.calls.length === 0, observed: out }; });
await test('T03', 'thinking disabled with effort xhigh or max is refused (provider 400 avoided)', () => { const out = []; for (const e of ['xhigh', 'max']) { try { body({ effort: e }); out.push('built'); } catch (x) { out.push(x.code); } } return { ok: out.every((x) => x === 'thinking_disabled_requires_effort_high_or_below'), observed: out }; });
await test('T04', 'headers: anthropic-version 2026-10-21, x-api-key from the injected value, JSON content type; nothing else', () => { const h = S.buildHeaders(PLACEHOLDER); return { ok: h['anthropic-version'] === '2026-10-21' && h['x-api-key'] === PLACEHOLDER && h['content-type'] === 'application/json' && Object.keys(h).length === 3, observed: Object.keys(h) }; });
await test('T05', 'destination allow-list refuses every other protocol, host, port, path, query and userinfo', () => { const bad = ['http://api.anthropic.com/v1/messages', 'https://api.anthropic.com.evil.example/v1/messages', 'https://api.anthropic.com:8443/v1/messages', 'https://api.anthropic.com/v1/complete', 'https://api.anthropic.com/v1/messages?x=1', 'https://user:pw@api.anthropic.com/v1/messages', 'https://xn--pi-anthropic-xx.com/v1/messages', 'https://proxy.example/v1/messages'];
  const r = bad.map((u) => S.checkDestination(u).length > 0); return { ok: r.every(Boolean) && S.checkDestination(S.DESTINATION.url).length === 0, observed: r }; });
await test('T06', 'a refused destination never reaches fetch', async () => { const f = fakeFetch([{ status: 200 }]); let code = null; try { await S.dispatchCore(ctx(f), Object.assign(req(), { url: 'https://proxy.example/v1/messages' })); } catch (e) { code = e.code; } return { ok: code === 'destination_host_not_allowed' && f.calls.length === 0, observed: code }; });
await test('T07', 'fetch is called with redirect "error", POST, and an abort signal', async () => { const f = fakeFetch([{ status: 200 }]); await S.dispatchCore(ctx(f), req()); const i = f.calls[0].init; return { ok: i.redirect === 'error' && i.method === 'POST' && !!i.signal, observed: { redirect: i.redirect, method: i.method } }; });

// ------------------------------------------------------------ retries, classification, cancellation
await test('T08', '429 with retry-after is retried after the stated delay, then succeeds', async () => { const f = fakeFetch([{ status: 429, body: '{}', headers: { 'retry-after': '3' } }, { status: 200 }]); const c = ctx(f); const r = await S.dispatchCore(c, req()); return { ok: r.outcome === 'ok' && f.calls.length === 2 && c.waits[0] === 3000, observed: { r: r.outcome, waits: c.waits } }; });
await test('T09', '529 and 500 are retried with exponential backoff and stop after two retries', async () => { const f = fakeFetch([{ status: 529, body: '{}' }, { status: 500, body: '{}' }, { status: 529, body: '{}' }]); const c = ctx(f); const r = await S.dispatchCore(c, req()); return { ok: r.outcome === 'http_529' && f.calls.length === 3 && c.waits.join() === '1000,2000', observed: { r: r.outcome, calls: f.calls.length, waits: c.waits } }; });
await test('T10', '400, 401, 403, 404 and 413 are never retried', async () => { const out = []; for (const s of [400, 401, 403, 404, 413]) { const f = fakeFetch([{ status: s, body: '{}' }]); const r = await S.dispatchCore(ctx(f), req('Q' + s)); out.push(r.outcome + ':' + f.calls.length); } return { ok: out.every((x) => /_not_retryable:1$/.test(x)), observed: out }; });
await test('T11', 'a refusal (200, stop_reason refusal) is final: no retry and no other model', async () => { const f = fakeFetch([{ status: 200, body: okBody({ stop_reason: 'refusal', stop_details: { type: 'refusal', category: 'cyber' } }) }]); const r = await S.dispatchCore(ctx(f), req()); return { ok: r.outcome === 'model_refusal' && f.calls.length === 1, observed: r.outcome }; });
await test('T12', 'stop_reason max_tokens is final and classified response_truncated', async () => { const f = fakeFetch([{ status: 200, body: okBody({ stop_reason: 'max_tokens' }) }]); const r = await S.dispatchCore(ctx(f), req()); return { ok: r.outcome === 'response_truncated' && f.calls.length === 1, observed: r.outcome }; });
await test('T13', 'network errors are retried and end as network_error with no billing recorded', async () => { const f = fakeFetch([{ throws: 'TypeError' }]); const c = ctx(f); const r = await S.dispatchCore(c, req()); return { ok: r.outcome === 'network_error' && f.calls.length === 3 && c.journal.spentUsd() === 0, observed: { r: r.outcome, spent: c.journal.spentUsd() } }; });
await test('T14', 'a timeout aborts the attempt, is retried, and is counted at the worst-case cost', async () => { const f = fakeFetch([{ hang: true }, { status: 200 }]); const c = ctx(f, { timeoutMs: 20 }); const r = await S.dispatchCore(c, req()); const wc = c.journal.entries.find((e) => e.outcome === 'timeout'); return { ok: r.outcome === 'ok' && !!wc && wc.cost_usd > 0 && wc.billing === 'unknown_counted_worst_case', observed: { r: r.outcome, timeout_cost: wc && wc.cost_usd } }; });
await test('T15', 'cancellation before send: no fetch', async () => { const f = fakeFetch([{ status: 200 }]); const ac = new AbortController(); ac.abort(); let code = null; try { await S.dispatchCore(ctx(f), Object.assign(req(), { signal: ac.signal })); } catch (e) { code = e.code; } return { ok: code === 'cancelled_before_send' && f.calls.length === 0, observed: code }; });
await test('T16', 'cancellation in flight: the attempt is aborted, counted at worst case, and never resent', async () => { const f = fakeFetch([{ hang: true }]); const ac = new AbortController(); const c = ctx(f, { timeoutMs: 10000 }); setTimeout(() => ac.abort(), 10); const r = await S.dispatchCore(c, Object.assign(req(), { signal: ac.signal })); return { ok: r.outcome === 'cancelled' && f.calls.length === 1 && c.journal.stateOf('Q1') === 'cancelled' && c.journal.spentUsd() > 0, observed: { r: r.outcome, calls: f.calls.length } }; });
await test('T17', 'cancellation during backoff stops further attempts', async () => { const f = fakeFetch([{ status: 529, body: '{}' }, { status: 200 }]); const ac = new AbortController(); const c = ctx(f, { sleep: async () => { ac.abort(); } }); const r = await S.dispatchCore(c, Object.assign(req(), { signal: ac.signal })); return { ok: r.outcome === 'cancelled' && f.calls.length === 1, observed: { r: r.outcome, calls: f.calls.length } }; });
await test('T18', 'a retry-after beyond the allowed window ends the request instead of waiting', async () => { const f = fakeFetch([{ status: 429, body: '{}', headers: { 'retry-after': '120' } }]); const c = ctx(f); const r = await S.dispatchCore(c, req()); return { ok: r.outcome === 'retry_after_beyond_window' && f.calls.length === 1 && !c.waits.length, observed: r.outcome }; });

// ------------------------------------------------------------ accounting, budget and caps
await test('T19', 'cost from usage on the standard card: 1,200 in and 800 out = $0.00052', () => { const c = S.costOf({ input_tokens: 1200, output_tokens: 800 }); return { ok: Math.abs(c - 0.00052) < 1e-12, observed: c }; });
await test('T20', 'cost on the long-prompt card above 100,000 prompt tokens, cache tokens included', () => { const c = S.costOf({ input_tokens: 90000, cache_read_input_tokens: 20000, output_tokens: 1000 }); const exp = (90000 * 0.5 + 20000 * 0.5 * 0.1 + 1000 * 2.5) / 1e6; return { ok: Math.abs(c - exp) < 1e-12, observed: { c, exp } }; });
await test('T21', 'budget exhaustion is decided before the request: no fetch once the worst case would exceed the budget', async () => { const f = fakeFetch([{ status: 200 }]); const c = ctx(f, { budgetUsd: 0.000001 }); const r = await S.dispatchCore(c, req()); return { ok: r.outcome === 'budget_exhausted' && f.calls.length === 0, observed: r.outcome }; });
await test('T22', 'the request cap refuses the next request', async () => { const f = fakeFetch([{ status: 200 }]); const c = ctx(f, { maxRequests: 1 }); await S.dispatchCore(c, req('Q1')); let code = null; try { await S.dispatchCore(c, req('Q2')); } catch (e) { code = e.code; } return { ok: code === 'request_cap_reached' && f.calls.length === 1, observed: code }; });
await test('T23', 'spend accumulates in the journal from reported usage', async () => { const f = fakeFetch([{ status: 200 }]); const c = ctx(f); await S.dispatchCore(c, req('Q1')); await S.dispatchCore(c, req('Q2')); return { ok: Math.abs(c.journal.spentUsd() - 2 * 0.00052) < 1e-12, observed: c.journal.spentUsd() }; });

// ------------------------------------------------------------ duplicates, interruption and recovery
await test('T24', 'a captured request id is never sent again', async () => { const f = fakeFetch([{ status: 200 }]); const c = ctx(f); await S.dispatchCore(c, req('Q1')); let code = null; try { await S.dispatchCore(c, req('Q1')); } catch (e) { code = e.code; } return { ok: code === 'duplicate_request_id' && f.calls.length === 1, observed: code }; });
await test('T25', 'resume after an interruption: a request left "sent" without a capture is not resent automatically', async () => { const f = fakeFetch([{ status: 200 }]); const j = S.createJournal(); j.append({ request_id: 'Q9', record_id: 'S-001', state: 'prepared' }); j.append({ request_id: 'Q9', state: 'sent', attempt: 0 }); let code = null; try { await S.dispatchCore(ctx(f, { journal: j }), req('Q9')); } catch (e) { code = e.code; } return { ok: code === 'ambiguous_prior_send_requires_review' && f.calls.length === 0, observed: code }; });
await test('T26', 'resume after an interruption: a request left only "prepared" is sent normally', async () => { const f = fakeFetch([{ status: 200 }]); const j = S.createJournal(); j.append({ request_id: 'Q8', record_id: 'S-001', state: 'prepared' }); const r = await S.dispatchCore(ctx(f, { journal: j }), req('Q8')); return { ok: r.outcome === 'ok' && f.calls.length === 1, observed: r.outcome }; });
await test('T27', 'a corrupted journal refuses to load (hash chain)', () => { const j = S.createJournal(); const a = j.append({ request_id: 'Q1', state: 'prepared' }); const b = j.append({ request_id: 'Q1', state: 'sent' }); const tampered = JSON.parse(b); tampered.state = 'captured'; let code = null; try { S.createJournal([a, JSON.stringify(tampered)]); } catch (e) { code = e.code; } return { ok: code === 'journal_corrupt', observed: code }; });
await test('T28', 'an intact journal reloads and keeps its state', () => { const j = S.createJournal(); const lines = [j.append({ request_id: 'Q1', state: 'prepared' }), j.append({ request_id: 'Q1', state: 'captured', cost_usd: 0.001 })]; const k = S.createJournal(lines); return { ok: k.stateOf('Q1') === 'captured' && k.spentUsd() === 0.001, observed: k.stateOf('Q1') }; });

// ------------------------------------------------------------ safe capture
await test('T29', 'captures are write-once', () => { const sink = S.createCaptureSink(new Map()); sink.write('Q1', { a: 1 }); let code = null; try { sink.write('Q1', { a: 2 }); } catch (e) { code = e.code; } return { ok: code === 'capture_exists_write_once', observed: code }; });
await test('T30', 'a capture never contains the credential value or request headers', async () => { const f = fakeFetch([{ status: 200 }]); const c = ctx(f); c.sink.registerSentinel(PLACEHOLDER); await S.dispatchCore(c, req()); const cap = c.store.get('Q1'); return { ok: !!cap && !cap.includes(PLACEHOLDER) && !/x-api-key/i.test(cap) && !/anthropic-version/.test(cap), observed: Object.keys(JSON.parse(cap)) }; });
await test('T31', 'a response echoing the credential value is refused by the capture sink', async () => { const f = fakeFetch([{ status: 200, body: okBody({ content: [{ type: 'text', text: 'echo ' + PLACEHOLDER }] }) }]); const c = ctx(f); c.sink.registerSentinel(PLACEHOLDER); let code = null; try { await S.dispatchCore(c, req()); } catch (e) { code = e.code; } return { ok: code === 'credential_value_in_capture' && !c.store.has('Q1'), observed: code }; });
await test('T32', 'a credential-shaped string in a response is refused', () => { const sink = S.createCaptureSink(new Map()); let code = null; try { sink.write('Q1', { t: ['sk', 'ant', 'EXAMPLEONLY0000'].join('-') }); } catch (e) { code = e.code; } return { ok: code === 'credential_shaped_value_in_capture', observed: code }; });
await test('T33', 'only the listed response headers are kept', async () => { const f = fakeFetch([{ status: 200, headers: { 'request-id': 'req_1', 'set-cookie': 'x', 'anthropic-ratelimit-requests-remaining': '9' } }]); const c = ctx(f); await S.dispatchCore(c, req()); const h = JSON.parse(c.store.get('Q1')).response_headers; return { ok: h['request-id'] === 'req_1' && !('set-cookie' in h), observed: h }; });

// ------------------------------------------------------------ the gate and the authorization
const frozen = { model: 'claude-haiku-5-5', candidate_version: '0.3.3-research-candidate', candidate_manifest_sha256: 'a'.repeat(64), prompt_sha256: 'b'.repeat(64), record_set_sha256: 'c'.repeat(64), destination: S.DESTINATION.url };
const auth = { authorization_id: 'STUDY-156-LIVE-TEST', study: '156-record study', model_identifier: 'claude-haiku-5-5', candidate_version: frozen.candidate_version, candidate_manifest_sha256: frozen.candidate_manifest_sha256, prompt_sha256: frozen.prompt_sha256,
  record_set_sha256: frozen.record_set_sha256, authorized_record_ids: ['S-001'], max_requests: 5, max_budget_usd: 1, expiry_utc: '2099-01-01T00:00:00.000Z', retention_location: 'x', retention_deletion_rule: 'x', credential_environment_variable_name: 'JRS_STUDY_PROVIDER_KEY',
  destination: S.DESTINATION.url, stop_rules_approved: true, owner_signature: 'test', signed_at_utc: '2026-10-27T00:00:00.000Z' };
const exp = (a = auth) => Object.assign({ authorizationSha256: authorizationSha256(a) }, frozen);
const now = '2026-10-27T12:00:00.000Z';
await test('T34', 'a complete, current authorization verifies (reference case)', () => { const p = verifyStudyAuthorization(auth, { recordId: 'S-001', body: body(), worstCaseUsd: 0.005 }, now, exp()); return { ok: p.length === 0, observed: p }; });
const ap = async (id, name, mut, reqO, nowO) => test(id, name, () => { const a = Object.assign({}, auth); mut(a); const p = verifyStudyAuthorization(a, Object.assign({ recordId: 'S-001', body: body(), worstCaseUsd: 0.005 }, reqO || {}), nowO || now, exp(a)); return { ok: p.length > 0, observed: p.slice(0, 3) }; });
await ap('T35', 'stale authorization (expired) is refused', () => {}, null, '2100-01-01T00:00:00.000Z');
await ap('T36', 'the spent Stage A authorization can never authorize the study', (a) => { a.authorization_id = SPENT_AUTHORIZATIONS[0]; });
await ap('T37', 'a different model is refused', (a) => { a.model_identifier = 'claude-sonnet-5-5'; });
await ap('T38', 'an incompatible candidate version or manifest is refused', (a) => { a.candidate_manifest_sha256 = 'd'.repeat(64); });
await ap('T39', 'a record outside the authorized set is refused', () => {}, { recordId: 'R02' });
await ap('T40', 'a credential variable name the SDK reads by itself is refused', (a) => { a.credential_environment_variable_name = 'ANTHROPIC_API_KEY'; });
await ap('T41', 'a value instead of a variable name is refused', (a) => { a.credential_environment_variable_name = 'sk live value'; });
await ap('T42', 'a request that would exceed the budget is refused', () => {}, { worstCaseUsd: 5 });
await test('T43', 'an authorization altered after hashing is refused (integrity)', () => { const p = verifyStudyAuthorization(Object.assign({}, auth, { max_budget_usd: 100 }), { recordId: 'S-001', body: body(), worstCaseUsd: 0.005 }, now, exp(auth)); return { ok: p.includes('authorization_integrity_mismatch'), observed: p }; });
await test('T44', 'the live gate refuses in this build even with a valid authorization; the credential resolver and fetch are never called', async () => { let resolved = 0; const f = fakeFetch([{ status: 200 }]); const g = S.createLiveSender({ authorization: auth, verifyAuthorization: () => [], credentialResolver: () => { resolved++; return PLACEHOLDER; }, fetchImpl: f, sink: S.createCaptureSink(new Map()), journal: S.createJournal() }); let code = null; try { await g.send(req()); } catch (e) { code = e.code; } return { ok: S.LIVE_DISPATCH_ENABLED === false && code === 'live_dispatch_not_enabled_in_this_build' && resolved === 0 && f.calls.length === 0, observed: code }; });
await test('T45', 'provider-routing variable names are detected (synthetic env object; the process environment is not touched)', () => { const hits = forbiddenEnvPresent({ ANTHROPIC_BASE_URL: 'x', ANTHROPIC_API_KEY: 'y', JRS_STUDY_PROVIDER_KEY: 'z' }); return { ok: hits.length === 2 && !hits.includes('JRS_STUDY_PROVIDER_KEY'), observed: hits }; });

// ------------------------------------------------------------ capture adapter and pairing
const cap = (b, status = 200) => ({ status, response_body: b });
await test('T46', 'text is read by block type; empty thinking blocks are counted and ignored', () => { const r = extractCandidate(cap(okBody({ content: [{ type: 'thinking', thinking: '', signature: 'sig' }, { type: 'text', text: '{"a":1}' }] })), S.MODEL); return { ok: r.ok && r.text === '{"a":1}' && r.thinking_blocks === 1, observed: r }; });
await test('T47', 'two text blocks, or a tool_use block, are rejected (S5)', () => { const a = extractCandidate(cap(okBody({ content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] })), S.MODEL); const b = extractCandidate(cap(okBody({ content: [{ type: 'tool_use', id: 't', name: 'x', input: {} }, { type: 'text', text: 'a' }] })), S.MODEL); return { ok: a.step === 'S5' && b.step === 'S5', observed: [a.code, b.code] }; });
await test('T48', 'refusal, truncation, empty text, oversize text and a model mismatch are classified, not repaired', () => { const r = [extractCandidate(cap(okBody({ stop_reason: 'refusal', stop_details: { category: 'bio' } })), S.MODEL).code, extractCandidate(cap(okBody({ stop_reason: 'max_tokens' })), S.MODEL).code,
  extractCandidate(cap(okBody({ content: [{ type: 'text', text: '  ' }] })), S.MODEL).code, extractCandidate(cap(okBody({ content: [{ type: 'text', text: 'x'.repeat(70000) }] })), S.MODEL).code, extractCandidate(cap(okBody({ model: 'claude-opus-5-5' })), S.MODEL).code, extractCandidate(cap('{}', 529), S.MODEL).code];
  return { ok: r.join() === 'model_refusal,response_truncated,empty_response,response_too_large,model_identifier_mismatch,provider_error', observed: r }; });
await test('T49', 'pairing refuses a capture whose hash, request id, sender version or frozen request body differs', async () => { const f = fakeFetch([{ status: 200 }]); const c = ctx(f); const r = await S.dispatchCore(c, req()); const text = c.store.get('Q1'); const entry = c.journal.entries.find((e) => e.state === 'captured');
  const fz = { sender_version: S.SENDER_VERSION, body_sha256: JSON.parse(text).body_sha256, candidate_manifest_sha256: 'a', expected_candidate_manifest_sha256: 'a', prompt_sha256: 'b', expected_prompt_sha256: 'b' };
  const good = pairCapture(text, entry, fz), badHash = pairCapture(text + ' ', entry, fz), badVer = pairCapture(text, entry, Object.assign({}, fz, { sender_version: '0.2.0' })), badBody = pairCapture(text, entry, Object.assign({}, fz, { body_sha256: 'x' })), badCand = pairCapture(text, entry, Object.assign({}, fz, { candidate_manifest_sha256: 'z' }));
  return { ok: r.outcome === 'ok' && good.length === 0 && badHash.includes('capture_hash_mismatch') && badVer.includes('sender_version_incompatible') && badBody.includes('request_body_differs_from_frozen_request') && badCand.includes('candidate_version_incompatible'), observed: { good, badHash, badVer, badBody, badCand } }; });

const failed = results.filter((r) => !r.ok);
const out = { results_format: 'jrs-study-156-transport-tests/1.0.0', sender_version: S.SENDER_VERSION, live_dispatch_enabled: S.LIVE_DISPATCH_ENABLED, network_attempts: attempts.length,
  totals: { tests: results.length, passed: results.length - failed.length, failed: failed.length }, results };
const dir = join(PKG, 'out', 'transport'); mkdirSync(dir, { recursive: true });
const f = join(dir, 'RESULTS.json');
if (existsSync(f)) { console.error(f + ' exists'); process.exit(2); }
writeFileSync(f, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals), 'network', attempts.length, failed.map((r) => '\n' + r.id + ' ' + r.name + ' => ' + JSON.stringify(r.observed).slice(0, 200)).join(''));
process.exit(failed.length || attempts.length ? 1 : 0);

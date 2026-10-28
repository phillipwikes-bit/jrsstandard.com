// 156-record study: live-sender DESIGN for a future, separately authorized run. DISABLED IN THIS BUILD.
//
// Two layers:
//   dispatchCore()  pure request logic with an injected fetch, clock, sleep and capture sink. It is what the offline
//                   tests exercise: request shape, destination allow-list, bounded retries, cancellation, cost
//                   accounting, budget and request caps, the recovery journal, duplicate prevention, safe capture.
//   createLiveSender()  the gate. It refuses while LIVE_DISPATCH_ENABLED is false (this build), and otherwise only
//                   after the study authorization verifies. It is the only place a credential resolver may be called.
// Why a hand-built request rather than the Anthropic SDK: the SDK resolves credentials by itself (ANTHROPIC_API_KEY,
// ANTHROPIC_AUTH_TOKEN, on-disk profiles, federation variables) and honours ANTHROPIC_BASE_URL. This study's rules
// allow exactly one credential, named in a signed authorization, and one destination. Decision DEC-T1 in
// PROVIDER_COMPATIBILITY_RECORD.md; it is to be reviewed when a live run is authorized.
// Provider facts (model, header, sampling rule, thinking, errors, prices) come from the bundled Claude API reference,
// cached 2026-10-06, and were not re-fetched (no network in this study). Re-verify them at authorization.
import { createHash } from 'node:crypto';

export const SENDER_VERSION = '0.3.0-study-offline';
export const LIVE_DISPATCH_ENABLED = false;
export const DESTINATION = Object.freeze({ url: 'https://api.anthropic.com/v1/messages', protocol: 'https:', hostname: 'api.anthropic.com', port: '', pathname: '/v1/messages' });
export const API_VERSION = '2026-10-21';
export const MODEL = 'claude-haiku-5-5';
export const PRICE = Object.freeze({ input_per_mtok: 0.10, output_per_mtok: 0.50, long_prompt_threshold_tokens: 100000, long_input_per_mtok: 0.50, long_output_per_mtok: 2.50,
  cache_read_multiplier: 0.1, cache_write_5m_multiplier: 1.25, source: 'Bundled Claude API reference, cached 2026-10-06. Not re-fetched; re-verify at authorization.' });
export const FORBIDDEN_BODY_FIELDS = Object.freeze(['temperature', 'top_p', 'top_k', 'fallbacks']);
export const RETRYABLE_STATUS = Object.freeze([429, 500, 529]);
export const NON_RETRYABLE_STATUS = Object.freeze([400, 401, 403, 404, 413]);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const CREDENTIAL_SHAPES = [/sk-ant-[A-Za-z0-9_-]{8,}/, /\bsk-[A-Za-z0-9]{16,}/, /\bBearer\s+[A-Za-z0-9._-]{8,}/i, /x-api-key\s*[:=]\s*\S+/i];

export class SenderRefusal extends Error { constructor(code, detail) { super('sender_refused:' + code); this.code = code; this.detail = detail || null; } }

// ------------------------------------------------------------------ request shape
export function buildRequestBody({ system, user, maxTokens = 8192, effort = 'medium', thinking = { type: 'disabled' } }) {
  if (thinking && thinking.type === 'disabled' && ['xhigh', 'max'].includes(effort)) throw new SenderRefusal('thinking_disabled_requires_effort_high_or_below');
  if (typeof user !== 'string' || !user) throw new SenderRefusal('user_turn_missing');
  return { model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }], thinking, output_config: { effort } };
}
export function checkBody(body) {
  const p = [];
  for (const f of FORBIDDEN_BODY_FIELDS) if (Object.prototype.hasOwnProperty.call(body, f)) p.push('forbidden_body_field:' + f);
  if (body.model !== MODEL) p.push('model_not_authorized_model');
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages[body.messages.length - 1].role !== 'user') p.push('messages_must_end_with_user_turn');
  if (!Number.isInteger(body.max_tokens) || body.max_tokens < 1 || body.max_tokens > 128000) p.push('max_tokens_out_of_range');
  return p;
}
export function buildHeaders(credentialValue) {
  return { 'content-type': 'application/json', 'x-api-key': credentialValue, 'anthropic-version': API_VERSION };
}
export function checkDestination(url) {
  let u; try { u = new URL(url); } catch { return ['destination_unparseable']; }
  const p = [];
  if (u.protocol !== DESTINATION.protocol) p.push('destination_protocol_not_https');
  if (u.hostname !== DESTINATION.hostname) p.push('destination_host_not_allowed');
  if (u.port !== DESTINATION.port) p.push('destination_port_not_allowed');
  if (u.pathname !== DESTINATION.pathname) p.push('destination_path_not_allowed');
  if (u.search || u.hash) p.push('destination_query_or_fragment_not_allowed');
  if (u.username || u.password) p.push('destination_userinfo_not_allowed');
  return p;
}

// ------------------------------------------------------------------ accounting
// Prompt size for the rate card counts every input token kind; the long-prompt card applies to the whole request.
export function costOf(usage, price = PRICE) {
  const u = usage || {};
  const inTok = u.input_tokens || 0, cr = u.cache_read_input_tokens || 0, cw = u.cache_creation_input_tokens || 0, out = u.output_tokens || 0;
  const long = inTok + cr + cw > price.long_prompt_threshold_tokens;
  const ip = long ? price.long_input_per_mtok : price.input_per_mtok, op = long ? price.long_output_per_mtok : price.output_per_mtok;
  return Number(((inTok * ip + cr * ip * price.cache_read_multiplier + cw * ip * price.cache_write_5m_multiplier + out * op) / 1e6).toFixed(8));
}
// Conservative upper bound used before a request and for any attempt whose billing is unknown.
export function worstCaseCost(estInputTokens, maxTokens, price = PRICE) { return costOf({ input_tokens: estInputTokens, output_tokens: maxTokens }, price); }
export const estimateTokens = (text) => Math.ceil(String(text).length / 3);   // conservative for English with the newer tokenizer

// ------------------------------------------------------------------ classification of one HTTP outcome
export function classify(status, json, headers = {}) {
  if (status === 200) {
    const sr = json && json.stop_reason;
    if (sr === 'refusal') return { final: true, outcome: 'model_refusal', retry: false };
    if (sr === 'max_tokens') return { final: true, outcome: 'response_truncated', retry: false };
    if (sr === 'end_turn') return { final: true, outcome: 'ok', retry: false };
    return { final: true, outcome: 'unexpected_stop_reason:' + sr, retry: false };
  }
  if (RETRYABLE_STATUS.includes(status)) {
    const ra = Number(headers['retry-after']);
    return { final: false, outcome: 'http_' + status, retry: true, retryAfterMs: Number.isFinite(ra) && ra >= 0 ? ra * 1000 : null };
  }
  return { final: true, outcome: NON_RETRYABLE_STATUS.includes(status) ? 'http_' + status + '_not_retryable' : 'http_' + status + '_unexpected', retry: false };
}

// ------------------------------------------------------------------ journal (append-only, hash-chained) for recovery and duplicates
export function createJournal(lines = []) {
  const entries = [];
  let prev = '0'.repeat(64);
  for (const [i, l] of lines.entries()) {
    let e; try { e = JSON.parse(l); } catch { throw new SenderRefusal('journal_corrupt', 'line ' + (i + 1) + ' is not JSON'); }
    const body = Object.assign({}, e); delete body.entry_sha256;
    if (e.prev_sha256 !== prev || sha(JSON.stringify(body)) !== e.entry_sha256) throw new SenderRefusal('journal_corrupt', 'line ' + (i + 1) + ' fails the hash chain');
    entries.push(e); prev = e.entry_sha256;
  }
  return {
    entries,
    append(fields) { const body = Object.assign({}, fields, { seq: entries.length + 1, prev_sha256: prev }); const e = Object.assign(body, { entry_sha256: sha(JSON.stringify(body)) }); entries.push(e); prev = e.entry_sha256; return JSON.stringify(e); },
    stateOf(requestId) { const es = entries.filter((x) => x.request_id === requestId); return es.length ? es[es.length - 1].state : null; },
    spentUsd() { return Number(entries.filter((x) => typeof x.cost_usd === 'number').reduce((n, x) => n + x.cost_usd, 0).toFixed(8)); },
    requestCount() { return new Set(entries.filter((x) => x.state === 'sent').map((x) => x.request_id)).size; },
  };
}

// ------------------------------------------------------------------ safe capture: write-once, response only, never a credential
export function createCaptureSink(store) {
  const sentinels = new Set();
  return {
    registerSentinel(v) { if (typeof v === 'string' && v.length >= 8) sentinels.add(v); },
    write(requestId, capture) {
      const text = JSON.stringify(capture);
      for (const s of sentinels) if (text.includes(s)) throw new SenderRefusal('credential_value_in_capture');
      for (const re of CREDENTIAL_SHAPES) if (re.test(text)) throw new SenderRefusal('credential_shaped_value_in_capture');
      if (store.has(requestId)) throw new SenderRefusal('capture_exists_write_once');
      store.set(requestId, text);
      return sha(text);
    },
  };
}
const KEPT_RESPONSE_HEADERS = ['request-id', 'retry-after', 'anthropic-ratelimit-requests-remaining', 'anthropic-ratelimit-tokens-remaining'];

// ------------------------------------------------------------------ the request logic (offline-testable)
// ctx: { fetchImpl, credential, sink, journal, budgetUsd, maxRequests, maxRetries, baseDelayMs, maxDelayMs, timeoutMs, sleep, now, random }
export async function dispatchCore(ctx, { requestId, recordId, body, url = DESTINATION.url, signal, allowAmbiguousResend = false }) {
  const J = ctx.journal;
  const refuse = (code, detail) => { throw new SenderRefusal(code, detail); };
  if (signal && signal.aborted) refuse('cancelled_before_send');
  const dest = checkDestination(url); if (dest.length) refuse(dest[0]);
  const bodyProblems = checkBody(body); if (bodyProblems.length) refuse(bodyProblems[0]);
  const st = J.stateOf(requestId);
  if (st === 'captured' || st === 'failed_final' || st === 'cancelled') refuse('duplicate_request_id', st);
  if (st === 'sent' && !allowAmbiguousResend) refuse('ambiguous_prior_send_requires_review');
  if (J.requestCount() >= ctx.maxRequests) refuse('request_cap_reached');
  const est = worstCaseCost(estimateTokens(JSON.stringify(body)), body.max_tokens);
  const payload = JSON.stringify(body);
  const lines = [];
  lines.push(J.append({ request_id: requestId, record_id: recordId, state: 'prepared', body_sha256: sha(payload), worst_case_usd: est, at: ctx.now() }));
  for (let attempt = 0; attempt <= ctx.maxRetries; attempt++) {
    if (J.spentUsd() + est > ctx.budgetUsd) { lines.push(J.append({ request_id: requestId, state: 'failed_final', outcome: 'budget_exhausted', at: ctx.now() })); return { outcome: 'budget_exhausted', attempts: attempt, lines }; }
    if (signal && signal.aborted) { lines.push(J.append({ request_id: requestId, state: 'cancelled', at: ctx.now() })); return { outcome: 'cancelled', attempts: attempt, lines }; }
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => ac.abort(), ctx.timeoutMs);
    lines.push(J.append({ request_id: requestId, state: 'sent', attempt, at: ctx.now() }));
    let res = null, errKind = null;
    try { res = await ctx.fetchImpl(url, { method: 'POST', headers: buildHeaders(ctx.credential), body: payload, redirect: 'error', signal: ac.signal }); }
    catch (e) { errKind = signal && signal.aborted ? 'cancelled' : ac.signal.aborted ? 'timeout' : 'network_error'; }
    finally { clearTimeout(timer); if (signal) signal.removeEventListener('abort', onAbort); }
    if (errKind === 'cancelled') {
      // The request may have reached the provider: count it at the worst case, never resend it automatically.
      lines.push(J.append({ request_id: requestId, state: 'cancelled', outcome: 'cancelled_in_flight', cost_usd: est, billing: 'unknown_counted_worst_case', at: ctx.now() }));
      return { outcome: 'cancelled', attempts: attempt + 1, lines };
    }
    if (errKind) {
      const billing = errKind === 'timeout' ? 'unknown_counted_worst_case' : 'none_no_response';
      lines.push(J.append({ request_id: requestId, state: 'attempt_failed', attempt, outcome: errKind, cost_usd: errKind === 'timeout' ? est : 0, billing, at: ctx.now() }));
      if (attempt < ctx.maxRetries) { await ctx.sleep(Math.min(ctx.maxDelayMs, ctx.baseDelayMs * 2 ** attempt + Math.floor(ctx.random() * ctx.baseDelayMs))); continue; }
      lines.push(J.append({ request_id: requestId, state: 'failed_final', outcome: errKind, at: ctx.now() }));
      return { outcome: errKind, attempts: attempt + 1, lines };
    }
    const headers = Object.fromEntries(KEPT_RESPONSE_HEADERS.map((h) => [h, res.headers && typeof res.headers.get === 'function' ? res.headers.get(h) : (res.headers || {})[h]]).filter(([, v]) => v !== undefined && v !== null));
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch { json = null; }
    const c = classify(res.status, json, headers);
    const cost = res.status === 200 && json ? costOf(json.usage) : 0;
    if (!c.final) {
      lines.push(J.append({ request_id: requestId, state: 'attempt_failed', attempt, outcome: c.outcome, cost_usd: 0, billing: 'not_billed_error_status', at: ctx.now() }));
      if (attempt < ctx.maxRetries) {
        const wait = c.retryAfterMs !== null && c.retryAfterMs !== undefined ? c.retryAfterMs : ctx.baseDelayMs * 2 ** attempt + Math.floor(ctx.random() * ctx.baseDelayMs);
        if (wait > ctx.maxDelayMs) { lines.push(J.append({ request_id: requestId, state: 'failed_final', outcome: 'retry_after_beyond_window', at: ctx.now() })); return { outcome: 'retry_after_beyond_window', attempts: attempt + 1, lines }; }
        await ctx.sleep(wait); continue;
      }
      lines.push(J.append({ request_id: requestId, state: 'failed_final', outcome: c.outcome, at: ctx.now() }));
      return { outcome: c.outcome, attempts: attempt + 1, lines };
    }
    const capture = { request_id: requestId, record_id: recordId, status: res.status, response_headers: headers, response_body: text, captured_at_utc: ctx.now(), sender_version: SENDER_VERSION, body_sha256: sha(payload) };
    const capSha = ctx.sink.write(requestId, capture);
    lines.push(J.append({ request_id: requestId, state: c.outcome === 'ok' ? 'captured' : 'failed_final', attempt, outcome: c.outcome, cost_usd: cost, billing: 'usage_reported', capture_sha256: capSha, at: ctx.now() }));
    return { outcome: c.outcome, attempts: attempt + 1, cost_usd: cost, capture_sha256: capSha, lines };
  }
  return { outcome: 'unreachable', attempts: ctx.maxRetries + 1, lines };
}

// ------------------------------------------------------------------ the gate (the only path that could ever reach the network)
export function createLiveSender({ authorization, verifyAuthorization, credentialResolver, fetchImpl, sink, journal, now = () => new Date().toISOString() }) {
  return {
    async send(request) {
      if (!LIVE_DISPATCH_ENABLED) throw new SenderRefusal('live_dispatch_not_enabled_in_this_build');
      const problems = verifyAuthorization(authorization, request, now());
      if (problems.length) throw new SenderRefusal(problems[0], problems);
      const credential = credentialResolver(authorization.credential_environment_variable_name);   // unreachable in this build
      sink.registerSentinel(credential);
      return dispatchCore({ fetchImpl, credential, sink, journal, budgetUsd: authorization.max_budget_usd, maxRequests: authorization.max_requests, maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 20000, timeoutMs: 60000,
        sleep: (ms) => new Promise((r) => setTimeout(r, ms)), now, random: Math.random }, request);
    },
  };
}

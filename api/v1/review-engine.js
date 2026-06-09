export const config = { runtime: 'edge' };

// ============================================================
// JRS Review Engine API   (MIRROR of api/review-engine.js — keep both in sync;
//   Vercel does not bundle a re-export between sibling routes, so this is a copy)
// Routes:  POST /api/review-engine   and   POST /api/v1/review-engine
// ------------------------------------------------------------
// Reuses ANTHROPIC_API_KEY (already set). Examines one record against the five
// JRS conditions and returns a record-asset result; runs>1 discloses variance.
//
// Auth (fail-closed): a token is REQUIRED by default. Set REVIEW_API_TOKEN to a token
//   or a comma-separated list of per-partner tokens; callers send Authorization: Bearer <token>.
//   Token-free open mode requires the explicit flag JRS_SANDBOX_OPEN=true (rate limit still applies).
// Rate limit: best-effort, per-instance, per-IP (see RATE_*). Not a substitute
//   for a shared store in production; documented as best-effort.
// Every response carries a request_id (body + X-Request-Id header) for audit
//   correlation on the partner side.
//
// STAGE: operational validation. Unvalidated, single-model engine. Reproducibility
// is disclosed, not hidden; it is not accuracy and not validation. No effectiveness
// claim is made.
// ============================================================

const ENGINE_VERSION = '0.1.0-validation';
const API_VERSION = 'v1';
const MODEL = 'claude-haiku-4-5-20251001';
const SB_URL = 'https://pjzxkeviouofdseagvpf.supabase.co';

const RATE_LIMIT = 20;        // requests
const RATE_WINDOW_MS = 60000; // per 60s, per IP, per instance (best-effort)

const CONDITION_KEYS = [
  'basis_identification',
  'reasoning_traceability',
  'cold_reviewer_clarity',
  'accountability_support',
  'temporal_reconstructability',
];

const SYSTEM_PROMPT = `You are the JRS (Justification Review Standard) Review Engine. You examine a single organizational record BEFORE it is finalized and assess it against exactly five documentation review conditions:

1. basis_identification — Does the record identify the basis for its conclusions?
2. reasoning_traceability — Can a later reviewer trace the reasoning from evidence to conclusion?
3. cold_reviewer_clarity — Would a reviewer with no prior knowledge understand what occurred from the record alone?
4. accountability_support — Are the decision-makers and reviewers identifiable?
5. temporal_reconstructability — Does the record hold up read cold, years later (dates, sequence, sources)?

For each condition assign a status of exactly "pass", "review", or "gap", with a one-sentence note grounded in the record text.

Then produce a structured finding: the AI function the record most resembles (summarization | recommendation | analysis | narrative), the condition(s) most triggered, and what a compliant version would require.

You evaluate, examine, identify, and surface. You do not guarantee, certify, or validate. Respond with STRICT JSON only, no prose, in exactly this shape:
{
  "conditions": {
    "basis_identification": {"status":"pass|review|gap","note":"..."},
    "reasoning_traceability": {"status":"pass|review|gap","note":"..."},
    "cold_reviewer_clarity": {"status":"pass|review|gap","note":"..."},
    "accountability_support": {"status":"pass|review|gap","note":"..."},
    "temporal_reconstructability": {"status":"pass|review|gap","note":"..."}
  },
  "remediation_note": "one or two sentences",
  "finding": {
    "ai_function": "summarization|recommendation|analysis|narrative",
    "condition_triggered": "...",
    "compliant_version": "..."
  }
}`;

const CORS_BASE = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Expose-Headers': 'X-Request-Id',
};
// Echo the request Origin only when it is in the allowlist (ALLOWED_ORIGINS,
// comma-separated; defaults to the production site). Otherwise omit the header.
function corsFor(req) {
  var headers = Object.assign({}, CORS_BASE);
  var origin = (req.headers.get('origin') || '').trim();
  var listEnv = (typeof process !== 'undefined' && process.env && process.env.ALLOWED_ORIGINS) || 'https://www.jrsstandard.com';
  var allowed = listEnv.split(',').map(function (o) { return o.trim(); }).filter(Boolean);
  if (origin && allowed.indexOf(origin) !== -1) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function newId() {
  try { return crypto.randomUUID(); } catch (e) { return 'req_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
}

function json(o, status, rid, cors) {
  var headers = Object.assign({ 'Content-Type': 'application/json', 'X-Request-Id': rid }, cors || CORS_BASE);
  return new Response(JSON.stringify(Object.assign({ request_id: rid, api_version: API_VERSION }, o)), { status: status || 200, headers: headers });
}

// Best-effort per-instance rate limiter (edge isolates do not share state).
// TODO: production volume needs a shared store (KV/Redis); per-instance limiting is best-effort only.
const RL = globalThis.__jrs_rl || (globalThis.__jrs_rl = new Map());
function rateLimited(ip) {
  var now = Date.now();
  var arr = (RL.get(ip) || []).filter(function (t) { return now - t < RATE_WINDOW_MS; });
  if (arr.length >= RATE_LIMIT) { RL.set(ip, arr); return true; }
  arr.push(now); RL.set(ip, arr); return false;
}

function normStatus(s) {
  s = String(s || '').toLowerCase();
  return s === 'pass' || s === 'review' || s === 'gap' ? s : 'review';
}
function deriveDetermination(conditions) {
  var vals = CONDITION_KEYS.map(function (k) { return (conditions[k] || {}).status; });
  if (vals.indexOf('gap') !== -1) return 'gap_identified';
  if (vals.indexOf('review') !== -1) return 'review_required';
  return 'ready';
}

async function oneRun(text, key) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 900,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Examine this record against the five JRS conditions:\n\n' + text }],
    }),
  });
  if (!res.ok) throw new Error('model_error_' + res.status);
  const j = await res.json();
  const raw = (j && j.content && j.content[0] && j.content[0].text) || '';
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('parse_error');
  const parsed = JSON.parse(m[0]);
  const conditions = {};
  CONDITION_KEYS.forEach(function (k) {
    const c = (parsed.conditions && parsed.conditions[k]) || {};
    conditions[k] = { status: normStatus(c.status), note: String(c.note || '').slice(0, 400) };
  });
  const determination = deriveDetermination(conditions);
  const finding = parsed.finding || {};
  return {
    conditions: conditions,
    determination: determination,
    remediation_note: String(parsed.remediation_note || '').slice(0, 600),
    finding: {
      ai_function: String(finding.ai_function || '').slice(0, 40),
      condition_triggered: String(finding.condition_triggered || '').slice(0, 300),
      determination: determination,
      compliant_version: String(finding.compliant_version || '').slice(0, 600),
    },
  };
}

function computeVariance(runs) {
  var per = {};
  CONDITION_KEYS.forEach(function (k) {
    var counts = {};
    runs.forEach(function (r) { var s = r.conditions[k].status; counts[s] = (counts[s] || 0) + 1; });
    var modal = Object.keys(counts).reduce(function (a, b) { return counts[b] > (counts[a] || 0) ? b : a; }, Object.keys(counts)[0]);
    per[k] = { modal: modal, agreement: Number((counts[modal] / runs.length).toFixed(3)) };
  });
  var overall = CONDITION_KEYS.reduce(function (a, k) { return a + per[k].agreement; }, 0) / CONDITION_KEYS.length;
  return {
    per_condition: per,
    overall_consistency: Number(overall.toFixed(3)),
    runs_detail: runs.map(function (r) {
      var st = {}; CONDITION_KEYS.forEach(function (k) { st[k] = r.conditions[k].status; });
      return { conditions: st, determination: r.determination };
    }),
  };
}

// Best-effort recording of each review (server-side, service role). A stored row
// holds the structured result plus a 200-char input preview, not the full record.
async function logReview(SERVICE, rid, text, out) {
  if (!SERVICE) return;
  var r = out.result || {};
  try {
    await fetch(SB_URL + '/rest/v1/engine_reviews', {
      method: 'POST',
      headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        request_id: rid,
        determination: r.determination || null,
        conditions: r.conditions || null,
        finding: r.finding || null,
        runs: out.runs || 1,
        overall_consistency: out.variance ? out.variance.overall_consistency : null,
        input_preview: (text || '').slice(0, 200),
        engine_version: out.engine_version || null,
      }),
    });
  } catch (e) {}
}

export default async function handler(req) {
  const rid = newId();
  const cors = corsFor(req);
  const J = function (o, s) { return json(o, s, rid, cors); };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'X-Request-Id': rid }, cors) });
  if (req.method !== 'POST') return J({ error: 'method_not_allowed', detail: 'Use POST.' }, 405);

  const KEY = (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) || '';
  const TOKEN_ENV = (typeof process !== 'undefined' && process.env && process.env.REVIEW_API_TOKEN) || '';
  const SANDBOX_OPEN = (typeof process !== 'undefined' && process.env && process.env.JRS_SANDBOX_OPEN) || '';
  const SERVICE = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_SERVICE_ROLE_KEY) || '';
  if (!KEY) return J({ error: 'engine_not_configured' }, 503);

  // Fail-closed auth: a token is required by default. Open (token-free) mode must be
  // explicitly enabled with JRS_SANDBOX_OPEN=true; the rate limit still applies in open mode.
  if (TOKEN_ENV) {
    var allowed = TOKEN_ENV.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (allowed.indexOf(bearer) === -1) return J({ error: 'unauthorized', detail: 'Send Authorization: Bearer <token>.' }, 401);
  } else if (SANDBOX_OPEN !== 'true') {
    return J({ error: 'unauthorized', detail: 'Endpoint requires a token. Set REVIEW_API_TOKEN, or set JRS_SANDBOX_OPEN=true for open sandbox mode.' }, 401);
  }

  // Best-effort rate limit.
  var ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return J({ error: 'rate_limited', detail: 'Too many requests; retry shortly. Best-effort per-instance limit.' }, 429);

  var body;
  try { body = await req.json(); } catch (e) { return J({ error: 'invalid_json' }, 400); }
  var text = (body && body.text ? String(body.text) : '').trim();
  if (text.length < 40) return J({ error: 'record_too_short', detail: 'Provide at least 40 characters of record text.' }, 400);
  if (text.length > 8000) text = text.slice(0, 8000);
  var runs = Math.min(Math.max(parseInt((body && body.runs) || 1, 10) || 1, 1), 5);

  var meta = {
    engine: 'JRS Review Engine',
    engine_version: ENGINE_VERSION,
    model: MODEL,
    evidence_stage: 'operational_validation',
    disclaimer: 'Unvalidated engine in development. Output is from a single model; reproducibility is disclosed, not hidden, and is distinct from accuracy and from validation. No effectiveness claim is made.',
    reviewed_at: new Date().toISOString(),
    runs: runs,
  };

  try {
    var results = await Promise.all(Array.from({ length: runs }, function () { return oneRun(text, KEY); }));
    var out = Object.assign({}, meta, { result: results[0] });
    if (runs > 1) out.variance = computeVariance(results);
    await logReview(SERVICE, rid, text, out);
    return J(out, 200);
  } catch (e) {
    return J({ error: 'review_failed', detail: String(e && e.message || e) }, 502);
  }
}

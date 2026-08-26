export const config = { runtime: 'edge' };

// ============================================================
// JRS Review Engine — SANDBOX
// Route: POST /api/sandbox
// ------------------------------------------------------------
// Removes the one step that still gated evaluation: before this existed, an
// integrator could read the contract, the runnable example, the OpenAPI spec
// and the security page, and then had to email a human to obtain a token
// before running a single record. This lets them run one, from their own
// terminal or from the page, with no account and no contact.
//
// FAIL-CLOSED BY DESIGN. It is OFF until the owner sets SANDBOX_ENABLED=1.
// A public unauthenticated route that calls a paid model is real cost and
// real abuse surface, so the switch is deliberate and belongs to the owner,
// not to this file.
//
// Caps, all enforced here and all deliberately tighter than the paid route:
//   SANDBOX_PER_IP_PER_DAY   default 3   requests per IP per rolling day
//   SANDBOX_GLOBAL_PER_DAY   default 200 requests per instance per rolling day
//   SANDBOX_MAX_CHARS        default 2000 characters of record text
//   runs is forced to 1. No variance block. No telemetry row.
//
// Nothing submitted here is stored. The sandbox writes no database row at
// all, which is a stronger guarantee than the paid route, where per-condition
// statuses are kept as programme telemetry.
//
// [REQUIRED_ENV_PARAM] SANDBOX_ENABLED   must equal "1" or the route is 503
// [REQUIRED_ENV_PARAM] ANTHROPIC_API_KEY already set for the paid routes
// ============================================================

const SYSTEM_PROMPT = `You are the JRS (Justification Review Standard) Review Engine. You examine a single organizational record against five conditions.

1. basis_identification, Basis Identification: Is the basis for each conclusion identifiable within the record?
2. reasoning_traceability, Decision-Process Traceability: Can a later reviewer trace the decision process from evidence to conclusion?
3. cold_reviewer_clarity, Reconstructability: Can a reviewer with no prior knowledge reconstruct the basis from the record alone?
4. accountability_support, Evidentiary Sufficiency: Is the evidence in the record sufficient to support the conclusion?
5. temporal_reconstructability, Chronology: Can the sequence of events be followed from the record, with dates and intervals?

For each condition assign a status of exactly "pass", "review", or "gap", with a one-sentence note grounded in the record text.

You evaluate, examine, identify, and surface. You do not guarantee, certify, or validate. Respond with STRICT JSON only, no prose outside the object:
{
  "conditions": {
    "basis_identification": {"status":"pass|review|gap","note":"..."},
    "reasoning_traceability": {"status":"pass|review|gap","note":"..."},
    "cold_reviewer_clarity": {"status":"pass|review|gap","note":"..."},
    "accountability_support": {"status":"pass|review|gap","note":"..."},
    "temporal_reconstructability": {"status":"pass|review|gap","note":"..."}
  },
  "remediation_note": "one or two sentences"
}`;

const CONDITION_KEYS = [
  'basis_identification',
  'reasoning_traceability',
  'cold_reviewer_clarity',
  'accountability_support',
  'temporal_reconstructability'
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const DAY_MS = 86400000;

// Best-effort, per-instance counters. Edge isolates do not share state, so
// these bound a single isolate rather than the deployment. Stated plainly
// here and in the response, exactly as the paid route states its own limit.
const IP_HITS = new Map();
let GLOBAL_HITS = [];

function intEnv(name, fallback) {
  const raw = parseInt(String(process.env[name] || ''), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function json(body, status, rid) {
  return new Response(
    JSON.stringify(Object.assign({ request_id: rid, sandbox: true }, body)),
    {
      status: status || 200,
      headers: Object.assign(
        { 'Content-Type': 'application/json; charset=utf-8', 'X-Request-Id': rid },
        CORS
      )
    }
  );
}

function overIpLimit(ip, cap) {
  const now = Date.now();
  const arr = (IP_HITS.get(ip) || []).filter(function (t) { return now - t < DAY_MS; });
  if (arr.length >= cap) { IP_HITS.set(ip, arr); return true; }
  arr.push(now);
  IP_HITS.set(ip, arr);
  return false;
}

function overGlobalLimit(cap) {
  const now = Date.now();
  GLOBAL_HITS = GLOBAL_HITS.filter(function (t) { return now - t < DAY_MS; });
  if (GLOBAL_HITS.length >= cap) return true;
  GLOBAL_HITS.push(now);
  return false;
}

function normStatus(v) {
  const s = String(v || '').toLowerCase();
  return s === 'pass' || s === 'review' || s === 'gap' ? s : 'review';
}

function routeOf(conditions) {
  const vals = CONDITION_KEYS.map(function (k) { return (conditions[k] || {}).status; });
  if (vals.indexOf('gap') !== -1) return 'Gap';
  if (vals.indexOf('review') !== -1) return 'Needs work';
  return 'Ready';
}

function rid() {
  // crypto.randomUUID is available in the edge runtime.
  try { return crypto.randomUUID(); } catch (e) { return 'sandbox-' + Date.now(); }
}

export default async function handler(req) {
  const id = rid();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: Object.assign({ 'X-Request-Id': id }, CORS) });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed', detail: 'Use POST.' }, 405, id);
  }

  if (String(process.env.SANDBOX_ENABLED || '') !== '1') {
    return json({
      error: 'sandbox_disabled',
      detail: 'The sandbox is not currently open. Request a token through the enterprise inquiry form at https://www.jrsstandard.com/enterprise.html#enterprise-inquiry',
      contract: 'https://www.jrsstandard.com/openapi.json'
    }, 503, id);
  }

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return json({ error: 'engine_not_configured' }, 503, id);

  const perIp = intEnv('SANDBOX_PER_IP_PER_DAY', 3);
  const perDay = intEnv('SANDBOX_GLOBAL_PER_DAY', 200);
  const maxChars = intEnv('SANDBOX_MAX_CHARS', 2000);

  const ip = String(req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

  if (overIpLimit(ip, perIp)) {
    return json({
      error: 'sandbox_quota_reached',
      detail: 'The sandbox allows ' + perIp + ' records per day. Request a token for unmetered access.',
      inquiry: 'https://www.jrsstandard.com/enterprise.html#enterprise-inquiry'
    }, 429, id);
  }
  if (overGlobalLimit(perDay)) {
    return json({
      error: 'sandbox_busy',
      detail: 'The shared sandbox quota for today is used up. Request a token for unmetered access.',
      inquiry: 'https://www.jrsstandard.com/enterprise.html#enterprise-inquiry'
    }, 429, id);
  }

  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'invalid_json' }, 400, id); }

  let text = String((body && body.text) || '').trim();
  if (text.length < 40) {
    return json({ error: 'record_too_short', detail: 'Provide at least 40 characters of record text.' }, 400, id);
  }
  let truncated = false;
  if (text.length > maxChars) { text = text.slice(0, maxChars); truncated = true; }

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }]
      })
    });
  } catch (e) {
    return json({ error: 'review_failed', detail: 'Upstream unreachable.' }, 502, id);
  }
  if (!upstream.ok) {
    return json({ error: 'review_failed', detail: 'model_error_' + upstream.status }, 502, id);
  }

  let parsed;
  try {
    const data = await upstream.json();
    const raw = ((data.content || [])[0] || {}).text || '';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (e) {
    return json({ error: 'review_failed', detail: 'Unparseable engine response.' }, 502, id);
  }

  const conditions = {};
  CONDITION_KEYS.forEach(function (k) {
    const c = (parsed.conditions || {})[k] || {};
    conditions[k] = { status: normStatus(c.status), note: String(c.note || '').slice(0, 400) };
  });

  return json({
    api_version: 'sandbox',
    engine: 'JRS Review Engine',
    engine_version: '0.1.0-validation',
    model: 'claude-haiku-4-5-20251001',
    routing: routeOf(conditions),
    runs: 1,
    conditions: conditions,
    remediation_note: String(parsed.remediation_note || '').slice(0, 600),
    truncated_to: truncated ? maxChars : null,
    quota: { per_ip_per_day: perIp, note: 'Best-effort, per-instance. Edge isolates do not share state.' },
    storage: 'Nothing submitted to the sandbox is stored. No database row is written.',
    disclosure: 'Operational validation. Unvalidated, single-model engine. Reproducibility is disclosed, not hidden; it is not accuracy and not validation. No effectiveness claim is made.',
    upgrade: 'https://www.jrsstandard.com/enterprise.html#enterprise-inquiry'
  }, 200, id);
}

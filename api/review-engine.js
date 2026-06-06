export const config = { runtime: 'edge' };

// ============================================================
// JRS Review Engine API  (POST /api/review-engine)
// ------------------------------------------------------------
// Productized record reviewer. Reuses ANTHROPIC_API_KEY (already set).
//
// Request  (JSON):  { "text": "<record>", "runs": 1 }   // runs 1..5
// Response (JSON):  record-asset shaped result + (when runs>1) disclosed variance.
//
// Auth (optional): if REVIEW_API_TOKEN env var is set, callers must send
//   Authorization: Bearer <REVIEW_API_TOKEN>. If unset, the endpoint is open
//   (convenient for an evaluator sandbox; set the env var to lock it down).
//
// STAGE: operational validation. This is an UNVALIDATED engine built on a single
// model. Reproducibility is disclosed, not hidden; it is not accuracy and not
// validation. No effectiveness claim is made.
// ============================================================

const ENGINE_VERSION = '0.1.0-validation';
const MODEL = 'claude-haiku-4-5-20251001';

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

Then produce a structured finding: the AI function the record most resembles (summarization | recommendation | analysis | narrative), the condition(s) most triggered, an overall determination, and what a compliant version would require.

Overall determination rule: "gap_identified" if any condition is gap; else "review_required" if any condition is review; else "ready".

You evaluate, examine, identify, and surface. You do not guarantee, certify, or validate. Respond with STRICT JSON only, no prose, in exactly this shape:
{
  "conditions": {
    "basis_identification": {"status":"pass|review|gap","note":"..."},
    "reasoning_traceability": {"status":"pass|review|gap","note":"..."},
    "cold_reviewer_clarity": {"status":"pass|review|gap","note":"..."},
    "accountability_support": {"status":"pass|review|gap","note":"..."},
    "temporal_reconstructability": {"status":"pass|review|gap","note":"..."}
  },
  "determination": "ready|review_required|gap_identified",
  "remediation_note": "one or two sentences",
  "finding": {
    "ai_function": "summarization|recommendation|analysis|narrative",
    "condition_triggered": "...",
    "compliant_version": "..."
  }
}`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, CORS) });
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
  const determination = deriveDetermination(conditions); // derived, not model-trusted
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

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const KEY = (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) || '';
  const REVIEW_TOKEN = (typeof process !== 'undefined' && process.env && process.env.REVIEW_API_TOKEN) || '';
  if (!KEY) return json({ error: 'engine_not_configured' }, 503);

  if (REVIEW_TOKEN) {
    var auth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (auth !== REVIEW_TOKEN) return json({ error: 'unauthorized' }, 401);
  }

  var body;
  try { body = await req.json(); } catch (e) { return json({ error: 'invalid_json' }, 400); }
  var text = (body && body.text ? String(body.text) : '').trim();
  if (text.length < 40) return json({ error: 'record_too_short', detail: 'Provide at least 40 characters of record text.' }, 400);
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
    return json(out);
  } catch (e) {
    return json({ error: 'review_failed', detail: String(e && e.message || e) }, 502);
  }
}

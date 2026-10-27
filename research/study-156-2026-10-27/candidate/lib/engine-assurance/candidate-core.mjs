// JRS REVIEW ENGINE CANDIDATE: LOCAL CORE (no network, no provider client)
//
// WHAT THIS FILE IS. The executable condition logic of the existing JRS Review
// Engine candidate, extracted from the last revision of api/v1/review-engine.js
// that carried it (git blob baebb512e5f296e1b41da138b7868aae4b6098fc, commit
// 0177c5184182b5b1f51ff18c80da29f668996e49, the parent of 0fb5c07 which closed
// public intake on 2026-10-04). It is NOT a new or substitute Engine. The prompt,
// the condition keys, the status normaliser, the determination rule and the
// response-parsing lines are carried byte-for-byte; tests/engine-assurance/run.mjs
// re-reads the git blob and fails if any of them drift.
//
// WHAT WAS REMOVED, AND WHY. The fetch() to the provider, the bearer-token
// handling, the rate limiter, CORS and the Supabase write. Live provider calls are
// prohibited for this work (CURRENT_ENGINE_HANDOFF_2026-10-05.md), so the provider
// is an injected function and this module contains no network code at all.
//
// THIS FILE IS NOT A ROUTE. It lives under lib/, which .vercelignore excludes from
// deployment. The public routes in api/ remain the 503 refusal stubs.

export const CANDIDATE_SOURCE = Object.freeze({
  repository_path: 'api/v1/review-engine.js',
  commit: '0177c5184182b5b1f51ff18c80da29f668996e49',
  blob: 'baebb512e5f296e1b41da138b7868aae4b6098fc',
  closed_by_commit: '0fb5c073e9e02ce1561eee460cce7420864cf65c',
});

export const ENGINE_VERSION = '0.1.0-validation';
export const API_VERSION = 'v1';
export const ENGINE_NAME = 'JRS Review Engine';
// The v1 handler refused fewer than 40 characters and truncated above 8000.
export const MIN_RECORD_CHARS = 40;
export const V1_TRUNCATION_LIMIT = 8000;

export const CONDITION_KEYS = [
  'basis_identification',
  'reasoning_traceability',
  'cold_reviewer_clarity',
  'accountability_support',
  'temporal_reconstructability',
];

export const SYSTEM_PROMPT = `You are the JRS (Justification Review Standard) Review Engine. You examine a single organizational record BEFORE it is finalized and assess it against exactly five documentation review conditions:

1. basis_identification, Basis Identification: Is the basis for each conclusion identifiable within the record?
2. reasoning_traceability, Decision-Process Traceability: Can a later reviewer trace the decision process from evidence to conclusion?
3. cold_reviewer_clarity, Reconstructability: Can a reviewer with no prior knowledge reconstruct the basis from the record alone, years later?
4. accountability_support, Evidentiary Sufficiency: Is the evidence in the record sufficient to support the conclusion?
5. temporal_reconstructability, Chronology: Can the sequence of events be followed from the record, with dates and intervals?

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

function normStatus(s) {
  if (s !== 'pass' && s !== 'review' && s !== 'gap') throw new Error('invalid_model_condition_status');
  return s;
}
function deriveDetermination(conditions) {
  var vals = CONDITION_KEYS.map(function (k) { return (conditions[k] || {}).status; });
  if (vals.indexOf('gap') !== -1) return 'gap_identified';
  if (vals.indexOf('review') !== -1) return 'review_required';
  return 'ready';
}

// Body of the v1 oneRun() after the provider response was decoded. `j` is the
// decoded provider message object; the lines below are unchanged from v1.
export function parseProviderMessage(j) {
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

// Runs the v1 pipeline with an injected provider. `provider` receives
// (system, userContent) and must return a provider message object of the shape
// { content: [{ type: 'text', text }] }. Nothing here performs I/O.
export async function runCandidate(text, provider) {
  if (typeof provider !== 'function') throw new Error('candidate_refused: no provider supplied');
  var clean = String(text == null ? '' : text).trim();
  if (clean.length < MIN_RECORD_CHARS) throw new Error('record_too_short');
  if (clean.length > V1_TRUNCATION_LIMIT) clean = clean.slice(0, V1_TRUNCATION_LIMIT);
  const j = await provider(SYSTEM_PROMPT, 'Examine this record against the five JRS conditions:\n\n' + clean);
  return parseProviderMessage(j);
}

export { normStatus, deriveDetermination };

// JRS Review Engine: LOCAL DEVELOPMENT CANDIDATE. Not deployed, not validated.
//
// Rebuilt 2026-10-06 from historical commit d2da83c (api/review-engine.js,
// engine 0.1.0-validation) under docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md
// and the owner instruction of 2026-10-06.
//
// Scope: completed, non-HR supplier-access exception drafts only. Human review
// is always required. Employment, housing, lending, insurance, medical and
// legal-outcome decisions are excluded.
//
// This module has NO network access, reads NO environment variable and writes
// NOTHING. The model call is a function the caller injects; the tests inject a
// mock. There is no default caller, so importing this file cannot reach a
// provider. lib/ is excluded by .vercelignore, so no deployment uploads it, and
// no file under api/ imports it.
//
// What changed from d2da83c, and why:
//   - HTTP handler, token auth, CORS, rate limit and Supabase logging removed:
//     this is not a route.
//   - Scope gate added (supplier-access profile, completed, non-HR, excluded domains).
//   - Silent truncation at 8,000 characters replaced by an explicit refusal.
//   - Model-output truncation (stop_reason max_tokens) is reported as incomplete,
//     never parsed as a partial result.
//   - Overall determination ("ready" / "review_required" / "gap_identified")
//     removed: it reads as a sign-off, and human review is always required.
//   - "compliant_version" renamed "revision_needed" (CLAUDE.md section 24).
//   - Flaws are reported by the documentation-flaw types the handoff permits,
//     each tied to a verbatim excerpt; an excerpt not found in the record is
//     reported as an extraction failure, not shown as a finding.
//   - Output that infers a writer's emotional state, intent, hidden payoff or
//     clinical condition is withheld and reported.
//   - No numerical score of any kind.

export const CANDIDATE_VERSION = '0.1.0-local.1';
export const DERIVED_FROM = 'd2da83c:api/review-engine.js (0.1.0-validation)';
export const SCOPE_PROFILE = 'supplier_access_exception.completed.non_hr';
export const MIN_CHARS = 40;
export const MAX_CHARS = 8000;
export const MAX_TOKENS = 1200;

export const CONDITION_KEYS = [
  'basis_identification',
  'reasoning_traceability',
  'cold_reviewer_clarity',
  'accountability_support',
  'temporal_reconstructability',
];

export const FLAW_TYPES = [
  'reasoning_elision',
  'evidentiary_overreach',
  'chronology_collapse',
  'extraction_omission',
  'truncation',
  'unsupported_content',
];

// Heuristic screen for excluded decision domains. It can only refuse; passing it
// does not establish that a record is in scope. The declared profile is still required.
const EXCLUDED_DOMAINS = [
  ['employment', /\b(termination of employment|terminated (?:his|her|their) employment|disciplinary action|performance (?:review|improvement plan)|hiring decision|promotion decision|harassment|grievance|workplace investigation)\b/i],
  ['housing', /\b(tenancy|tenant|eviction|lease application|rental application|housing application)\b/i],
  ['lending', /\b(loan application|credit decision|credit limit|mortgage|underwriting of (?:a |the )?loan)\b/i],
  ['insurance', /\b(insurance claim|policyholder|claim denial|coverage decision|premium decision)\b/i],
  ['medical', /\b(patient|diagnosis|clinical|treatment plan|medical record|prescription)\b/i],
  ['legal_outcome', /\b(verdict|sentencing|court ruling|plea|adjudication of (?:the )?claim|settlement decision)\b/i],
];

const PROHIBITED_INFERENCE = /\b(angry|anger|frustrat\w*|anxious|anxiety|resent\w*|emotional(?:ly)?|feel(?:s|ing)? (?:that|upset|pressured)|upset|intend(?:ed|s)? to|intention(?:al(?:ly)?)?|deliberately|motive|ulterior|hidden (?:agenda|payoff|benefit)|wanted to (?:hide|conceal|avoid)|to cover (?:up|for)|depress\w*|narcissis\w*|disorder|mental (?:state|health)|paranoi\w*)\b/i;

const SYSTEM_PROMPT = `You examine one completed supplier-access exception draft for record-level documentation flaws, against five JRS documentation review conditions:

1. basis_identification: Is the basis for each conclusion identifiable within the record?
2. reasoning_traceability: Can a later reviewer trace the decision process from evidence to conclusion?
3. cold_reviewer_clarity: Can a reviewer with no prior knowledge reconstruct the basis from the record alone?
4. accountability_support: Is the evidence in the record sufficient to support the conclusion?
5. temporal_reconstructability: Can the sequence of events be followed, with dates and intervals?

For each condition give a status of exactly "pass", "review" or "gap" and a one-sentence note about the record text.

List each documentation flaw you find. Use only these types: reasoning_elision, evidentiary_overreach, chronology_collapse, extraction_omission, truncation, unsupported_content. For each flaw, copy the exact words from the record that show it into "excerpt" (verbatim, at most 200 characters) and explain in one sentence what a reviewer could not reconstruct.

Describe the record, never the writer. Do not infer anyone's emotional state, intent, motive, hidden payoff or clinical condition. Do not decide whether the access exception should be granted. Do not give a score.

Respond with strict JSON only, in exactly this shape:
{
  "conditions": {
    "basis_identification": {"status":"pass|review|gap","note":"..."},
    "reasoning_traceability": {"status":"pass|review|gap","note":"..."},
    "cold_reviewer_clarity": {"status":"pass|review|gap","note":"..."},
    "accountability_support": {"status":"pass|review|gap","note":"..."},
    "temporal_reconstructability": {"status":"pass|review|gap","note":"..."}
  },
  "flaws": [ {"type":"...","excerpt":"...","explanation":"..."} ],
  "revision_needed": "one or two sentences on what the record would need to state"
}`;

const NOTICE = 'Local development candidate. Not validated. Not a decision. A human reviewer must read the record and this output before any use.';

function base(extra) {
  return Object.assign({
    candidate_version: CANDIDATE_VERSION,
    derived_from: DERIVED_FROM,
    scope_profile: SCOPE_PROFILE,
    human_review_required: true,
    validated: false,
    notice: NOTICE,
  }, extra);
}

function refuse(reason, detail) {
  return base({ status: 'refused', reason: reason, detail: detail });
}

function incomplete(reason, detail, extraction) {
  return base({ status: 'incomplete', reason: reason, detail: detail, extraction: extraction || null });
}

export function checkScope(input) {
  var p = (input && input.profile) || {};
  var text = input && typeof input.text === 'string' ? input.text : '';
  if (p.record_type !== 'supplier_access_exception') return refuse('out_of_scope_record_type', 'Only supplier-access exception drafts are in scope.');
  if (p.completion_status !== 'completed') return refuse('draft_not_completed', 'Only completed drafts are in scope.');
  if (p.hr_related !== false) return refuse('hr_status_not_declared_false', 'The draft must be declared non-HR (hr_related: false).');
  var trimmed = text.trim();
  if (trimmed.length < MIN_CHARS) return refuse('record_too_short', 'Provide at least ' + MIN_CHARS + ' characters.');
  if (trimmed.length > MAX_CHARS) return refuse('record_too_long', 'The record is ' + trimmed.length + ' characters; the limit is ' + MAX_CHARS + '. It was not truncated and was not examined.');
  for (var i = 0; i < EXCLUDED_DOMAINS.length; i++) {
    var m = trimmed.match(EXCLUDED_DOMAINS[i][1]);
    if (m) return refuse('excluded_domain_' + EXCLUDED_DOMAINS[i][0], 'The record mentions "' + m[0] + '", which indicates an excluded decision domain.');
  }
  return null;
}

export function buildRequest(text, model) {
  return {
    model: model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: 'Examine this supplier-access exception draft:\n\n' + text }],
  };
}

function norm(s) {
  return String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function parseModelOutput(raw, text) {
  var extraction = { model_output_parsed: false, missing_conditions: [], invalid_statuses: [],
                     rejected_flaw_types: [], excerpt_not_in_record: [], withheld_prohibited_inference: [] };
  var m = String(raw || '').match(/\{[\s\S]*\}/);
  if (!m) return { error: 'model_output_not_json', extraction: extraction };
  var parsed;
  try { parsed = JSON.parse(m[0]); } catch (e) { return { error: 'model_output_not_json', extraction: extraction }; }
  extraction.model_output_parsed = true;

  var conditions = {};
  CONDITION_KEYS.forEach(function (k) {
    var c = parsed.conditions && parsed.conditions[k];
    if (!c) { extraction.missing_conditions.push(k); return; }
    if (c.status !== 'pass' && c.status !== 'review' && c.status !== 'gap') { extraction.invalid_statuses.push(k); return; }
    var note = String(c.note || '').slice(0, 400);
    if (PROHIBITED_INFERENCE.test(note)) { extraction.withheld_prohibited_inference.push('conditions.' + k); note = null; }
    conditions[k] = { status: c.status, note: note };
  });
  if (extraction.missing_conditions.length || extraction.invalid_statuses.length) {
    return { error: 'model_output_incomplete', extraction: extraction };
  }

  var hay = norm(text);
  var flaws = [];
  (Array.isArray(parsed.flaws) ? parsed.flaws : []).forEach(function (f, i) {
    if (!f || FLAW_TYPES.indexOf(f.type) === -1) { extraction.rejected_flaw_types.push(String(f && f.type).slice(0, 60)); return; }
    var excerpt = String(f.excerpt || '').slice(0, 200);
    if (!excerpt || hay.indexOf(norm(excerpt)) === -1) { extraction.excerpt_not_in_record.push({ index: i, type: f.type }); return; }
    var explanation = String(f.explanation || '').slice(0, 400);
    if (PROHIBITED_INFERENCE.test(explanation)) { extraction.withheld_prohibited_inference.push('flaws.' + i); return; }
    flaws.push({ type: f.type, excerpt: excerpt, explanation: explanation });
  });

  var revision = String(parsed.revision_needed || '').slice(0, 600);
  if (PROHIBITED_INFERENCE.test(revision)) { extraction.withheld_prohibited_inference.push('revision_needed'); revision = null; }
  return { conditions: conditions, flaws: flaws, revision_needed: revision, extraction: extraction };
}

// callModel(request) must resolve to { text, stop_reason }. It is required.
export async function runCandidate(input, options) {
  var opts = options || {};
  if (typeof opts.callModel !== 'function') throw new Error('callModel must be injected; this module has no provider access');
  if (!opts.model) throw new Error('model must be stated so the output records what produced it');
  var refusal = checkScope(input);
  if (refusal) return refusal;
  var text = input.text.trim();
  var reply;
  try {
    reply = await opts.callModel(buildRequest(text, opts.model));
  } catch (e) {
    return incomplete('model_call_failed', 'No result was produced.');
  }
  if (!reply || typeof reply.text !== 'string') return incomplete('model_reply_malformed', 'No result was produced.');
  if (reply.stop_reason === 'max_tokens') return incomplete('model_output_truncated', 'The model output was cut off and was not parsed.');
  var out = parseModelOutput(reply.text, text);
  if (out.error) return incomplete(out.error, 'The model output could not be read in full; no partial result is shown.', out.extraction);
  return base({
    status: 'examined',
    model: opts.model,
    examined_at: opts.now ? opts.now() : new Date().toISOString(),
    record_chars: text.length,
    conditions: out.conditions,
    flaws: out.flaws,
    revision_needed: out.revision_needed,
    extraction: out.extraction,
  });
}

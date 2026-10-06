// JRS Review Engine: LOCAL DEVELOPMENT CANDIDATE. Not deployed, not validated.
//
// Rebuilt 2026-10-06 from historical commit d2da83c (api/review-engine.js,
// engine 0.1.0-validation) under docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md
// and the owner instructions of 2026-10-06.
//
// Scope: completed, non-HR supplier-access exception drafts only. Human review
// is always required. Employment, housing, lending, insurance, medical and
// legal-outcome decisions are excluded.
//
// This module and the three it imports (source-prep.js, explanations.js,
// contract.js) have NO network access, read NO environment variable and write
// NOTHING. The model call is a function the caller injects; the tests inject a
// mock. There is no default caller, so importing these files cannot reach a
// provider. lib/ is excluded by .vercelignore, so no deployment uploads them,
// and no file under api/ imports them.
//
// Flow: scope gate -> deterministic source preparation (unreadable and partial
// input refused; omission, unsupported content and quotation locations reported)
// -> injected model call -> output checks -> versioned result contract
// (contract.js) with human-review explanations (explanations.js).
//
// What changed from d2da83c, and why:
//   - HTTP handler, token auth, CORS, rate limit and Supabase logging removed:
//     this is not a route.
//   - Scope gate added (supplier-access profile, completed, non-HR, excluded domains).
//   - Silent truncation at 8,000 characters replaced by an explicit refusal.
//   - Partial or unreadable input refused before any model call.
//   - Model-output truncation (stop_reason max_tokens) is reported as incomplete,
//     never parsed as a partial result.
//   - Overall determination ("ready" / "review_required" / "gap_identified")
//     removed: it reads as a sign-off, and human review is always required.
//   - "compliant_version" renamed "revision_needed" (CLAUDE.md section 24).
//   - Flaws are limited to the documentation-flaw types the handoff permits,
//     each tied to a verbatim excerpt and its exact location; an excerpt not
//     found in the record is reported as an extraction finding, not shown.
//   - Output that infers a person's emotional state, intent, motive, payoff or
//     clinical condition is withheld and reported.
//   - No numerical score of any kind.

import { prepareSource, locate, sha256, SOURCE_PREP_VERSION } from './source-prep.js';
import { explainCondition, explainFlaw, explainExtraction, EXPLANATION_SET_VERSION } from './explanations.js';
import { buildResult, reviewIdentity } from './contract.js';

export const CANDIDATE_VERSION = '0.2.0-local.1';
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
export const EXCLUDED_DOMAINS = [
  ['employment', /\b(termination of employment|terminated (?:his|her|their) employment|disciplinary action|performance (?:review|improvement plan)|hiring decision|promotion decision|job applicant|employee relations|hr case|dismissal|layoff|harassment|grievance|workplace investigation)\b/i],
  ['housing', /\b(tenancy|tenant|landlord|eviction|lease application|rental application|housing application)\b/i],
  ['lending', /\b(loan application|credit decision|credit limit|credit score|borrower|mortgage|underwriting of (?:a |the )?loan)\b/i],
  ['insurance', /\b(insurance claim|policyholder|claimant|claim denial|coverage decision|premium decision)\b/i],
  ['medical', /\b(patient|diagnosis|clinical|treatment plan|medical record|health record|medication|prescription)\b/i],
  ['legal_outcome', /\b(verdict|sentencing|court ruling|conviction|judgment against|plea|adjudication of (?:the )?claim|settlement decision)\b/i],
];

// Model text that describes a person instead of the record. Grouped so the
// tests can show each group is caught. Matching text is withheld, not edited.
export const PROHIBITED_INFERENCE = {
  emotion: /\b(angry|anger|upset|frustrat\w*|anxious|resent\w*|afraid|fearful|panick\w*|emotional(?:ly)?|felt (?:pressured|rushed|threatened)|feel(?:s|ing)? (?:that|upset|pressured))\b/i,
  intent: /\b(intend(?:ed|s)? to|intention(?:al(?:ly)?)?|deliberately|on purpose|knowingly|wanted to|tried to (?:hide|conceal|avoid))\b/i,
  motive: /\b(motive|motivated by|ulterior|in order to (?:hide|conceal|avoid|protect)|to cover (?:up|for)|agenda)\b/i,
  payoff: /\b(payoff|pay-off|kickback|personal gain|stood to (?:gain|benefit)|hidden (?:benefit|payoff)|benefit(?:ed|s)? (?:him|her|them)sel(?:f|ves))\b/i,
  clinical: /\b(depress\w*|narcissis\w*|paranoi\w*|bipolar|adhd|disorder|mental (?:state|health|illness)|cognitive (?:decline|impairment)|diagnos\w*)\b/i,
};

export function inferenceGroups(text) {
  return Object.keys(PROHIBITED_INFERENCE).filter(function (k) { return PROHIBITED_INFERENCE[k].test(String(text || '')); });
}

export const SYSTEM_PROMPT = `You examine one completed supplier-access exception draft for record-level documentation flaws, against five JRS documentation review conditions:

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

export const PROMPT_SHA256 = sha256(SYSTEM_PROMPT);

function versions(model) {
  return { candidate_version: CANDIDATE_VERSION, source_prep_version: SOURCE_PREP_VERSION, explanation_set_version: EXPLANATION_SET_VERSION,
           prompt_sha256: PROMPT_SHA256, model: model || null, derived_from: DERIVED_FROM };
}

function profileRefusal(input) {
  var p = (input && input.profile) || {};
  if (p.record_type !== 'supplier_access_exception') return ['out_of_scope_record_type', 'Only supplier-access exception drafts are in scope.'];
  if (p.completion_status !== 'completed') return ['draft_not_completed', 'Only completed drafts are in scope.'];
  if (p.hr_related !== false) return ['hr_status_not_declared_false', 'The draft must be declared non-HR (hr_related: false).'];
  return null;
}

function contentRefusal(trimmed) {
  if (trimmed.length < MIN_CHARS) return ['record_too_short', 'Provide at least ' + MIN_CHARS + ' characters.'];
  if (trimmed.length > MAX_CHARS) return ['record_too_long', 'The record is ' + trimmed.length + ' characters; the limit is ' + MAX_CHARS + '. It was not truncated and was not examined.'];
  for (var i = 0; i < EXCLUDED_DOMAINS.length; i++) {
    var m = trimmed.match(EXCLUDED_DOMAINS[i][1]);
    if (m) return ['excluded_domain_' + EXCLUDED_DOMAINS[i][0], 'The record mentions "' + m[0] + '", which indicates an excluded decision domain.'];
  }
  return null;
}

function extractionFromPrep(prep) {
  return prep.findings.map(function (f) {
    return Object.assign({ origin: 'source_prep', explanation: explainExtraction(f.code) }, f);
  });
}

// Scope and source checks in order. Returns { refusal, prep, text }.
export function checkScope(input) {
  var p = profileRefusal(input);
  if (p) return { refusal: { reason: p[0], detail: p[1] } };
  var raw = input ? input.text : undefined;
  var text = typeof raw === 'string' ? raw.trim() : raw;
  var prep = prepareSource(text);
  if (prep.refusal && prep.refusal.reason === 'unreadable_input') return { refusal: prep.refusal, prep: prep };
  var c = contentRefusal(text);
  if (c) return { refusal: { reason: c[0], detail: c[1] }, prep: prep };
  if (prep.refusal) return { refusal: prep.refusal, prep: prep, text: text };
  return { refusal: null, prep: prep, text: text };
}

export function buildRequest(text, model) {
  return {
    model: model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: 'Examine this supplier-access exception draft:\n\n' + text }],
  };
}

export function parseModelOutput(raw, text) {
  var checks = [];
  var m = String(raw || '').match(/\{[\s\S]*\}/);
  if (!m) return { error: 'model_output_not_json', checks: checks };
  var parsed;
  try { parsed = JSON.parse(m[0]); } catch (e) { return { error: 'model_output_not_json', checks: checks }; }

  var conditions = {}, missing = [], invalid = [];
  CONDITION_KEYS.forEach(function (k) {
    var c = parsed.conditions && parsed.conditions[k];
    if (!c) { missing.push(k); return; }
    if (c.status !== 'pass' && c.status !== 'review' && c.status !== 'gap') { invalid.push(k); return; }
    var note = String(c.note || '').slice(0, 400), groups = inferenceGroups(note);
    if (groups.length) { checks.push({ code: 'withheld_prohibited_inference', field: 'conditions.' + k, groups: groups }); note = null; }
    conditions[k] = { status: c.status, note: note };
  });
  if (missing.length || invalid.length) return { error: 'model_output_incomplete', missing_conditions: missing, invalid_statuses: invalid, checks: checks };

  var flaws = [];
  (Array.isArray(parsed.flaws) ? parsed.flaws : []).forEach(function (f, i) {
    if (!f || FLAW_TYPES.indexOf(f.type) === -1) { checks.push({ code: 'rejected_flaw_type', field: 'flaws.' + i, value: String(f && f.type).slice(0, 60) }); return; }
    var excerpt = String(f.excerpt || '').slice(0, 200), where = excerpt ? locate(text, excerpt) : [];
    if (!where.length) { checks.push({ code: 'excerpt_not_in_record', field: 'flaws.' + i, flaw_type: f.type }); return; }
    var explanation = String(f.explanation || '').slice(0, 400), groups = inferenceGroups(explanation);
    if (groups.length) { checks.push({ code: 'withheld_prohibited_inference', field: 'flaws.' + i, groups: groups }); return; }
    flaws.push({ type: f.type, excerpt: excerpt, locations: where, model_explanation: explanation });
  });

  var revision = String(parsed.revision_needed || '').slice(0, 600), rg = inferenceGroups(revision);
  if (rg.length) { checks.push({ code: 'withheld_prohibited_inference', field: 'revision_needed', groups: rg }); revision = null; }
  return { conditions: conditions, flaws: flaws, revision_needed: revision, checks: checks };
}

function sourceSummary(prep) {
  return prep && prep.source ? { sha256: prep.source.sha256, chars: prep.source.chars, lines: prep.source.lines,
                                 preparation_version: prep.version, quotations: prep.quotations } : null;
}

// callModel(request) must resolve to { text, stop_reason }. It is required.
export async function runCandidate(input, options) {
  var opts = options || {};
  if (typeof opts.callModel !== 'function') throw new Error('callModel must be injected; this module has no provider access');
  if (!opts.model) throw new Error('model must be stated so the output records what produced it');
  var at = opts.now ? opts.now() : null;
  var gate = checkScope(input);
  var srcSha = gate.prep && gate.prep.source ? gate.prep.source.sha256 : null;
  var identity = reviewIdentity(versions(opts.model), srcSha);
  var common = { identity: identity, scope_profile: SCOPE_PROFILE, examined_at: at, source: sourceSummary(gate.prep) };

  if (gate.refusal) {
    return buildResult(Object.assign({}, common, { status: 'refused', reason: gate.refusal.reason, detail: gate.refusal.detail,
      extraction_findings: gate.prep && gate.prep.refusal ? extractionFromPrep(gate.prep) : [], contextual: null }));
  }
  var prepFindings = extractionFromPrep(gate.prep);
  var incomplete = function (reason, detail, extra) {
    return buildResult(Object.assign({}, common, { status: 'incomplete', reason: reason, detail: detail,
      extraction_findings: prepFindings.concat(extra || []), contextual: null }));
  };

  var reply;
  try { reply = await opts.callModel(buildRequest(gate.text, opts.model)); }
  catch (e) { return incomplete('model_call_failed', 'No result was produced.'); }
  if (!reply || typeof reply.text !== 'string') return incomplete('model_reply_malformed', 'No result was produced.');
  if (reply.stop_reason === 'max_tokens') return incomplete('model_output_truncated', 'The model output was cut off and was not parsed.');

  var out = parseModelOutput(reply.text, gate.text);
  var outputChecks = (out.checks || []).map(function (c) {
    return Object.assign({ origin: 'model_output_check', kind: 'model_output', explanation: explainExtraction(c.code), needs_disposition: false }, c);
  });
  if (out.error) {
    var detail = out.error === 'model_output_incomplete'
      ? 'Missing conditions: ' + (out.missing_conditions.join(', ') || 'none') + '. Invalid statuses: ' + (out.invalid_statuses.join(', ') || 'none') + '. No partial result is shown.'
      : 'The model output could not be read; no partial result is shown.';
    return incomplete(out.error, detail, outputChecks);
  }

  var contextual = [];
  CONDITION_KEYS.forEach(function (k) {
    var c = out.conditions[k];
    if (c.status !== 'pass') contextual.push({ origin: 'model', kind: 'condition', condition: k, status: c.status, note: c.note, explanation: explainCondition(k) });
  });
  out.flaws.forEach(function (f) {
    contextual.push({ origin: 'model', kind: 'flaw', type: f.type, excerpt: f.excerpt, locations: f.locations,
                      model_explanation: f.model_explanation, explanation: explainFlaw(f.type) });
  });

  return buildResult(Object.assign({}, common, {
    status: 'examined',
    extraction_findings: prepFindings.concat(outputChecks),
    contextual: { conditions: out.conditions, findings: contextual, revision_needed: out.revision_needed },
  }));
}

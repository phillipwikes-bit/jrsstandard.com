// Study continuation (0.3.5), ported from study-completion-0.3.4-2026-10-28/tools/build-plan.mjs: writes the frozen live-run plan (protocol/LIVE_RUN_PLAN.json) and the unsigned authorization draft
// (authorization/LIVE_AUTHORIZATION_DRAFT.json) from the record set, the bound transport files and the verified
// provider facts. The plan hash covers every file the run would execute, so any later code change changes the hash and
// voids an authorization signed against the earlier plan. Offline; sends nothing.
// Usage: node tools/build-plan.mjs
import { attempts } from './guard.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, ROOT, PKG4, STATUS, shaFile, canonSha, readJson, rel, checker, finish, writeJson, writeOut } from './common.mjs';
import { DESTINATION, MODEL, API_VERSION, SENDER_VERSION, PRICE } from './live/sender-bound.mjs';
import { STUDY_NAME, REQUIRED_FIELDS } from './live/authorization-bound.mjs';
import { STOP_RULES, PRE_GATE } from './live/runner.mjs';
import { FILES, FLAG_LINE, planFileSha } from './live/plan-files.mjs';
export { FILES };

export const PROPOSED = Object.freeze({
  'PRE only': { phases_authorized: ['PRE'], max_requests: 3, max_attempts: 9, max_budget_usd: 0.05 },
  'PRE, then RUN and TGT if the PRE gate passes': { phases_authorized: ['PRE', 'RUN', 'TGT'], max_requests: 401, max_attempts: 450, max_budget_usd: 1.00 },
});
const PURPOSE = {
  PRE: 'Provider compatibility only: contract adherence, quotation verification, latency and cost on three records. Says nothing about Engine quality.',
  RUN: 'The study: every eligible record, three repeats, scored against the AI-proposed references and, where recorded, human labels. Repeats measure run-to-run variation.',
  TGT: 'The two known weaknesses with a real model: a stated but irrelevant basis (42 UNGROUNDED records) and direct or indirect instructions in the record (22 phrasings, one flawed and one clean base).',
};

export function makePlan(set) {
  const prompt = join(DIR, 'candidate', 'prompt', 'PROMPT_research-0.3.5-1.txt');
  const promptText = readFileSync(prompt, 'utf8');
  const phases = {};
  for (const ph of ['PRE', 'RUN', 'TGT']) {
    const q = set.requests.filter((r) => r.phase === ph);
    const typical = q.reduce((n, r) => n + (r.typical_input_tokens * PRICE.input_per_mtok + (r.output_proxy_tokens || 0) * PRICE.output_per_mtok) / 1e6, 0);
    const worst1 = q.reduce((n, r) => n + r.worst_case_attempt_usd, 0);
    phases[ph] = { requests: q.length, request_ids_sha256: canonSha(q.map((r) => r.request_id)), purpose: PURPOSE[ph],
      typical_usd_estimate: Number(typical.toFixed(4)), worst_case_one_attempt_each_usd: Number(worst1.toFixed(4)), worst_case_bound_usd: Number((3 * worst1).toFixed(4)),
      max_input_tokens_upper: Math.max(...q.map((r) => r.est_input_tokens_upper)), output_proxy_tokens_max: Math.max(...q.map((r) => r.output_proxy_tokens || 0)) };
  }
  const plan = { format: 'jrs-study-continuation-live-plan/1.0.0', plan_date: '2026-10-28', study: STUDY_NAME, ...STATUS,
    status: 'PROPOSED. Not authorized. Live dispatch is disabled in this build.',
    candidate: { version: '0.3.5-research-candidate', adopted: false, manifest_sha256: shaFile(join(DIR, 'CANDIDATE_0.3.5_MANIFEST_SHA256.txt')), prompt_path: rel(prompt), prompt_sha256: shaFile(prompt),
      prompt_version: (/^prompt_version:\s*(\S+)/m.exec(promptText) || [])[1], research_profile: 'jrs-study-research-profile/1', compiler_version: '0.3.4-research-candidate (unchanged)',
      parent: { version: '0.3.4-research-candidate', manifest_sha256: shaFile(join(PKG4, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')), prompt_sha256: shaFile(join(PKG4, 'candidate', 'prompt', 'PROMPT_research-0.3.4-1.txt')) },
      changes: 'research/study-continuation-0.3.5-2026-10-28/CHANGES_FROM_0.3.4.md' },
    continuation: { arm: 'L2', parent_run: { authorization_id: 'RUN-LIVE-AUTH-20261028-01', arm: 'L1', stopped_by: 'SR-10', requests_sent: 69, results: 'research/study-completion-0.3.4-2026-10-28/results/LIVE_RESULTS.json (unchanged)' },
      pooling: 'Never pooled. L2 is a separate arm with a changed prompt; L1 and L2 are reported side by side, never as one unchanged run.',
      old_authorization: 'RUN-LIVE-AUTH-20261028-01 does not cover this plan (different study name, candidate, prompt, plan and record set hashes; listed as never valid).',
      human_labels: 'Not required for technical preparation or execution. Human agreement stays unmeasured until imported labels exist.' },
    engine_of_record: '0.3.1-candidate (unchanged; this run tests 0.3.5 without adopting it)',
    provider: { destination: DESTINATION.url, model: MODEL, api_version: API_VERSION, sender_version: SENDER_VERSION, price_per_mtok: { input: PRICE.input_per_mtok, output: PRICE.output_per_mtok, long_prompt_threshold_tokens: PRICE.long_prompt_threshold_tokens },
      verification: 'protocol/PROVIDER_VERIFICATION.md (official documentation, 2026-10-28)' },
    request: { max_tokens: set.request_parameters.maxTokens, thinking: set.request_parameters.thinking, output_config: { effort: set.request_parameters.effort }, streaming: false,
      not_sent: ['temperature', 'top_p', 'top_k', 'fallbacks', 'tools', 'stop_sequences', 'metadata', 'assistant prefill'] },
    transport: { config: { maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 20000, timeoutMs: 120000 }, pacing: { concurrency: 1, min_interval_ms: 1000 },
      retried: ['HTTP 429', 'HTTP 500', 'HTTP 529', 'network error', 'timeout'], never_retried: ['HTTP 3xx (redirect)', 'HTTP 400, 401, 402, 403, 404, 409, 413', 'HTTP 504 and any other status', 'refusal', 'max_tokens', 'cancellation'],
      files: Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, Object.assign({ path: p, sha256: planFileSha(p, readFileSync(join(ROOT, p), 'utf8')) }, p === FILES.sender ? { note: 'dispatch flag line normalized' } : {})])) },
    phases, proposed_authorizations: PROPOSED, stop_rules: STOP_RULES, pre_gate: PRE_GATE,
    capture: { location: 'A private directory outside the repository and outside any git working tree, named in the authorization (retention_location). The command refuses any other location.',
      format: 'One JSON file per request, written once, mode 0600. JOURNAL.jsonl: append-only, hash-chained, each entry written through before the request leaves.',
      committed: 'Only hashes, counts and derived results. No response text, no request body beyond its hash, no credential.',
      provider_side: 'Anthropic commercial policy (checked 2026-10-28): inputs and outputs deleted within 30 days by default; flagged content up to 2 years; zero-data-retention agreements override. The account arrangement is NOT ESTABLISHED and is confirmed by the owner in the authorization.' },
    scoring: { tool: FILES.scorer, arm: 'L2: the captured response compiled offline by the frozen 0.3.5 continuation candidate (0.3.4 compiler) with the research profile; scorer version 2', references: 'AI-proposed references (agreement, never accuracy); human labels only where recorded, reported separately',
      outputs: 'research/study-continuation-0.3.5-2026-10-28/results/LIVE_RESULTS.json and generated tables' },
    record_set: { path: 'research/study-continuation-0.3.5-2026-10-28/records/LIVE_RECORD_SET.json', requests_sha256: set.requests_sha256, targeted_texts_sha256: set.targeted_texts.sha256, by_phase: set.by_phase } };
  plan.plan_sha256 = canonSha(plan);
  return plan;
}

export function makeDraft(plan) {
  const d = { authorization_id: 'CONTINUATION-LIVE-DRAFT', study: STUDY_NAME, model_identifier: plan.provider.model, api_version: plan.provider.api_version, candidate_version: plan.candidate.version,
    candidate_manifest_sha256: plan.candidate.manifest_sha256, prompt_sha256: plan.candidate.prompt_sha256, plan_sha256: plan.plan_sha256, record_set_sha256: plan.record_set.requests_sha256,
    phases_authorized: ['PRE'], max_requests: 3, max_attempts: 9, max_budget_usd: 0.05, expiry_utc: '', retention_location: '', retention_deletion_rule: 'Captures and journal kept privately until the owner decides; deleted or exported on the owner\'s instruction; hashes and derived results kept in the repository.',
    provider_retention_confirmed: '', credential_environment_variable_name: 'JRS_STUDY_ANTHROPIC_KEY', destination: plan.provider.destination, stop_rules_approved: false, owner_signature: '', signed_at_utc: '',
    note: 'UNSIGNED DRAFT. Refused as written. The owner fills expiry_utc, retention_location, provider_retention_confirmed, chooses the phases and caps (see the plan\'s proposed_authorizations), sets stop_rules_approved to true, signs and dates it, and gives it a new authorization_id. A copy of the signed file is kept outside the repository with the captures.' };
  return d;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const c = checker();
  const set = readJson(join(DIR, 'records', 'LIVE_RECORD_SET.json'));
  const plan = makePlan(set), draft = makeDraft(plan);
  c.check('sender_has_exactly_one_flag_line_set_false', (readFileSync(join(ROOT, FILES.sender), 'utf8').match(new RegExp(FLAG_LINE.source, 'gm')) || []).length === 1 && /LIVE_DISPATCH_ENABLED = false;/.test(readFileSync(join(ROOT, FILES.sender), 'utf8')));
  c.check('every_required_field_named_in_draft', REQUIRED_FIELDS.every((f) => Object.prototype.hasOwnProperty.call(draft, f)), REQUIRED_FIELDS.filter((f) => !(f in draft)));
  c.check('proposed_caps_cover_their_phases', Object.values(PROPOSED).every((p) => p.max_requests === p.phases_authorized.reduce((n, ph) => n + plan.phases[ph].requests, 0) && p.max_attempts >= p.max_requests));
  c.check('proposed_budget_above_typical_plus_one_worst_attempt', Object.values(PROPOSED).every((p) => p.max_budget_usd > p.phases_authorized.reduce((n, ph) => n + plan.phases[ph].typical_usd_estimate, 0) + 0.01));
  writeJson(join(DIR, 'protocol', 'LIVE_RUN_PLAN.json'), plan);
  writeJson(join(DIR, 'authorization', 'LIVE_AUTHORIZATION_DRAFT.json'), draft);
  const usd = (x) => '$' + x.toFixed(4);
  const md = ['# Live run plan (generated summary)', '', 'Generated by `tools/build-plan.mjs` from `protocol/LIVE_RUN_PLAN.json`. Do not edit by hand. **Status: proposed, not authorized; live dispatch is disabled in this build.**', '',
    '| Identity | Value |', '|---|---|',
    '| Plan hash | `' + plan.plan_sha256 + '` |', '| Candidate | ' + plan.candidate.version + ' (not adopted), manifest `' + plan.candidate.manifest_sha256 + '` |',
    '| Prompt | `' + plan.candidate.prompt_path + '` (' + plan.candidate.prompt_version + '), `' + plan.candidate.prompt_sha256 + '` |',
    '| Request set | `' + plan.record_set.path + '`, requests hash `' + plan.record_set.requests_sha256 + '`; targeted texts `' + plan.record_set.targeted_texts_sha256 + '` |',
    '| Provider | `' + plan.provider.destination + '`, model `' + plan.provider.model + '`, API version `' + plan.provider.api_version + '`, sender `' + plan.provider.sender_version + '` |',
    '| Request | max_tokens ' + plan.request.max_tokens + ', thinking ' + plan.request.thinking.type + ', effort ' + plan.request.output_config.effort + ', not streamed; never sent: ' + plan.request.not_sent.join(', ') + ' |',
    '| Retries | at most ' + plan.transport.config.maxRetries + ' per request, only on ' + plan.transport.retried.join(', ') + '; backoff from ' + plan.transport.config.baseDelayMs + ' ms, retry-after honoured up to ' + plan.transport.config.maxDelayMs + ' ms |',
    '| Timeout and pacing | ' + plan.transport.config.timeoutMs / 1000 + ' seconds per attempt; one request at a time, at least ' + plan.transport.pacing.min_interval_ms + ' ms apart |', '',
    '## Phases and cost', '', '| Phase | Requests | Typical cost (estimate) | Worst case, one attempt each | Worst-case bound (three attempts each) | Largest input (upper estimate, tokens) |', '|---|---|---|---|---|---|',
    ...Object.entries(plan.phases).map(([k, v]) => '| ' + k + ' | ' + v.requests + ' | ' + usd(v.typical_usd_estimate) + ' | ' + usd(v.worst_case_one_attempt_each_usd) + ' | ' + usd(v.worst_case_bound_usd) + ' | ' + v.max_input_tokens_upper + ' |'), '',
    'Typical cost uses the documented average of 2.5 characters per token for input and, for output, the size of the scripted rule-aligned proposal for the same record (a proxy, not a measurement). The worst case assumes one token per byte of input and the full output cap on every attempt.', '',
    '## Proposed authorizations (owner chooses; nothing is authorized)', '', '| Option | Phases | Request cap | Attempt cap | Spend cap |', '|---|---|---|---|---|',
    ...Object.entries(PROPOSED).map(([k, v]) => '| ' + k + ' | ' + v.phases_authorized.join(', ') + ' | ' + v.max_requests + ' | ' + v.max_attempts + ' | $' + v.max_budget_usd.toFixed(2) + ' |'), '',
    '## Stop rules', '', ...Object.entries(STOP_RULES).map(([k, v]) => '- **' + k + '** ' + v), '',
    '**PRE gate.** ' + PRE_GATE, '',
    '## Files the run would execute (hashes are part of the plan hash)', '', '| Role | File | SHA-256 |', '|---|---|---|', ...Object.entries(plan.transport.files).map(([k, v]) => '| ' + k + ' | `' + v.path + '` | `' + v.sha256.slice(0, 16) + '…` |'), ''];
  writeOut(join(DIR, 'protocol', 'LIVE_RUN_PLAN.md'), md.join('\n'));
  finish('live plan', c, 'plan_sha256 ' + plan.plan_sha256.slice(0, 16) + ', network attempts ' + attempts.length);
}

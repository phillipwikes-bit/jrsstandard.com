// 156-record study: the request and cost plan for a FUTURE, separately authorized live run. Computes every planned
// request body from the frozen prompt and the frozen records and variants, hashes it, and prices it with the
// sender's own rate card. Sends nothing: no transport is imported, only pure functions of sender.mjs.
// Usage: node tools/build-request-plan.mjs   (writes protocol/REQUEST_AND_COST_PLAN.json)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRequestBody, checkBody, costOf, worstCaseCost, estimateTokens, MODEL, API_VERSION, PRICE, SENDER_VERSION, DESTINATION } from './transport/sender.mjs';
import { assemble } from './transport/prompt-assembly.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const OUT = join(PKG, 'protocol', 'REQUEST_AND_COST_PLAN.json');
if (existsSync(OUT)) { console.error(OUT + ' exists; it is preserved, not rebuilt'); process.exit(2); }
const PROMPT_PATH = join(PKG, 'candidate', 'prompt', 'PROMPT_research-1.txt');
const prompt = readFileSync(PROMPT_PATH, 'utf8');
const MAX_TOKENS = 4096, ATTEMPTS = 3, TYPICAL_OUTPUT_TOKENS = 800, REPEATS = 3;
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const variants = readFileSync(join(PKG, 'variants', 'VARIANTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((v) => v.constructible);
const text = (e) => readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
const request = (phase, id, recordId, recordText, rep) => {
  const { system, user } = assemble(prompt, recordText);
  const body = buildRequestBody({ system, user, maxTokens: MAX_TOKENS, effort: 'medium', thinking: { type: 'disabled' } });
  const problems = checkBody(body); if (problems.length) throw new Error('planned body invalid: ' + problems.join(','));
  const est = estimateTokens(system + user);
  return { request_id: 'S156-' + phase + '-' + id + (rep ? '-r' + rep : ''), phase, record_id: recordId, unit_id: id, repeat: rep || null, body_sha256: sha(JSON.stringify(body)), record_sha256: sha(recordText),
    est_input_tokens: est, typical_usd: costOf({ input_tokens: est, output_tokens: TYPICAL_OUTPUT_TOKENS }), worst_case_usd_all_attempts: Number((worstCaseCost(est, MAX_TOKENS) * ATTEMPTS).toFixed(8)) };
};
const eligible = inv.entries.filter((e) => e.full_text_available && e.scope_class === 'NOT_EXCLUDED');
const sc1 = inv.entries.filter((e) => e.full_text_available && e.scope_class !== 'NOT_EXCLUDED');
const byId = new Map(inv.entries.map((e) => [e.source_id, e]));
const PREFLIGHT = ['S-001', 'S-003', 'S-008'];   // development records: grounded, generic, same-event two dates
const plan = { base: [], optional: { sc1_originals: [], default_profile_comparison: [] } };
for (const id of PREFLIGHT) plan.base.push(request('PRE', id, id, text(byId.get(id)), null));
for (const e of eligible) for (let r = 1; r <= REPEATS; r++) plan.base.push(request('RUN', e.source_id, e.source_id, text(e), r));
for (const v of variants) plan.base.push(request('VAR', v.variant_id, v.base_id, v.text, null));
for (const e of sc1) for (let r = 1; r <= REPEATS; r++) plan.optional.sc1_originals.push(request('SC1', e.source_id, e.source_id, text(e), r));
const sum = (rows, k) => Number(rows.reduce((n, x) => n + x[k], 0).toFixed(6));
const totals = (rows) => ({ requests: rows.length, est_input_tokens: rows.reduce((n, x) => n + x.est_input_tokens, 0), typical_output_tokens: rows.length * TYPICAL_OUTPUT_TOKENS, typical_usd: sum(rows, 'typical_usd'), worst_case_usd: sum(rows, 'worst_case_usd_all_attempts'), max_attempts: rows.length * ATTEMPTS });
const byPhase = {}; for (const r of plan.base) (byPhase[r.phase] = byPhase[r.phase] || []).push(r);
const doc = { format: 'jrs-study-156-request-plan/1.0.0', built_at_utc: new Date().toISOString(), status: 'PLAN ONLY. No request has been sent. Nothing here authorizes a request.',
  provider: { destination: DESTINATION.url, model: MODEL, anthropic_version: API_VERSION, sender_version: SENDER_VERSION, rate_card: PRICE, facts_source: 'protocol/PROVIDER_COMPATIBILITY_RECORD.md (cached 2026-10-06; re-verify on the day)' },
  request_shape: { max_tokens: MAX_TOKENS, effort: 'medium', thinking: 'disabled', sampling_parameters: 'none (temperature, top_p and top_k return a 400)', streaming: false, tools: 'none', attempts_per_request_max: ATTEMPTS, concurrency: 1, min_interval_ms: 1000 },
  estimates: { input_tokens: 'ceil(characters / 3) of the system and user text: above the expected count for English', typical_output_tokens: TYPICAL_OUTPUT_TOKENS + ' (mock candidates are 1,100 to 2,350 characters; about 370 to 780 tokens)', worst_case: 'max_tokens on every attempt, three attempts per request' },
  prompt: { path: 'candidate/prompt/PROMPT_research-1.txt', sha256: sha(prompt) },
  phases: { PRE: 'three preflight requests on development records; stop and report before continuing', RUN: 'three fresh runs of every eligible record (104)', VAR: 'one run of every constructible variant (' + variants.length + ')' },
  totals: { base: totals(plan.base), by_phase: Object.fromEntries(Object.entries(byPhase).map(([k, v]) => [k, totals(v)])), optional_sc1_originals: totals(plan.optional.sc1_originals) },
  optional_arms_not_priced_per_request: { default_profile_comparison: 'A6 with the default prompt: one run per eligible record (104 requests). Its per-request cost is about the same as RUN. Needs its own line in the authorization.' },
  proposed_stop_rules: ['any 401 or 403: stop (credential or permission)', 'model identifier mismatch in any response: stop', 'three consecutive non-retryable errors: stop', 'refusals above 5% after the first 50 requests: stop and report',
    'any capture refused by the safety checks (credential-shaped text): stop', 'next request would exceed the request cap or the reserved budget: stop', 'authorization expired: stop', 'any network attempt to a destination other than the allowed one: stop'],
  retention_proposal: { location: 'OWNER DECISION: outside the public repository; captures are confidential even though the records are synthetic', in_repository: 'hashes and the journal only', deletion: 'OWNER DECISION (proposal: raw captures deleted 90 days after the study report unless extended in writing; hashes kept)' },
  requests: plan };
writeFileSync(OUT, JSON.stringify(doc, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(doc.totals));

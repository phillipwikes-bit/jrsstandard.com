#!/usr/bin/env node
// Study 013 runner (PROTOCOL.md). Usage:
//   node tools/run-study.mjs --out runs/<name> [--arms A,B,C,C0,D] [--runs 3] [--limit N] [--dry-run]
// --dry-run uses an offline mock provider and makes no network call.
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARMS, PRICES, EVAL_CHAR_LIMIT, PROD_SHA256, PROD_EXPECTED_SHA_PREFIX, sha256, RC_KEYS } from '../engine/arms.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED = 'https://api.anthropic.com/v1/messages';
const MAX_CALLS = 500;
const RUNAWAY_USD = 100;
const TIMEOUT_MS = 180000;
const MAX_RETRIES = 2;
const CONCURRENCY = 4;

function args() {
  const a = process.argv.slice(2), o = { arms: 'A,B,C,C0,D', runs: 3, limit: 0, dry: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--out') o.out = a[++i];
    else if (a[i] === '--arms') o.arms = a[++i];
    else if (a[i] === '--runs') o.runs = Number(a[++i]);
    else if (a[i] === '--limit') o.limit = Number(a[++i]);
    else if (a[i] === '--dry-run') o.dry = true;
    else throw new Error('unknown argument ' + a[i]);
  }
  if (!o.out) throw new Error('--out is required');
  return o;
}

// Destination lock: the only permitted network call (PROTOCOL item 28)
export async function guardedFetch(url, init, fetchImpl = fetch) {
  if (url !== ALLOWED) throw new Error('destination_refused ' + url);
  return fetchImpl(url, { ...init, redirect: 'error' });
}

export function mockProvider(body) {
  const sys = body.system || '';
  const fmt = body.output_config && body.output_config.format && body.output_config.format.schema;
  let obj;
  const st = (body.messages[0].content.length % 3 === 0) ? 'gap' : 'pass';
  if (fmt && fmt.properties.route) obj = { route: st === 'gap' ? 'gap' : 'ready', reason: 'mock' };
  else if (fmt) obj = { conditions: Object.fromEntries(RC_KEYS.map((k) => [k, { status: st, note: 'mock' }])), remediation_note: 'mock' };
  else obj = { conditions: Object.fromEntries(['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability'].map((k) => [k, { status: st, note: 'mock' }])), remediation_note: 'm', finding: { compliant_version: 'x' } };
  const content = [];
  if (body.thinking) content.push({ type: 'thinking', thinking: '' });
  content.push({ type: 'text', text: JSON.stringify(obj) });
  return { ok: true, status: 200, headers: new Map(), json: async () => ({ model: body.model, stop_reason: 'end_turn', content, usage: { input_tokens: 1000, output_tokens: 200 } }) };
}

async function callOnce(body, key, dry) {
  if (dry) return mockProvider(body);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await guardedFetch(ALLOWED, {
      method: 'POST', signal: ctl.signal,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } finally { clearTimeout(t); }
}

export function parseResponse(arm, j) {
  if (j.stop_reason === 'refusal') return { outcome: 'refusal' };
  if (j.stop_reason === 'max_tokens') return { outcome: 'truncated' };
  const text = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  let parsed;
  try {
    const mm = ARMS[arm].promptOnlyJson ? text.match(/\{[\s\S]*\}/) : [text];
    parsed = JSON.parse(mm[0]);
  } catch (e) { return { outcome: 'parse_error' }; }
  try { return { outcome: 'ok', route: ARMS[arm].route(parsed), parsed }; }
  catch (e) { return { outcome: 'invalid_output', error: String(e.message) }; }
}

export async function main(o, env = process.env) {
  if (!PROD_SHA256.startsWith(PROD_EXPECTED_SHA_PREFIX)) throw new Error('api/review-engine.js changed since the protocol was fixed; arm C0 would not be the reviewed production Engine');
  const key = env.ANTHROPIC_API_KEY;
  if (!o.dry && !key) { console.error('BLOCKED: ANTHROPIC_API_KEY is not set in the environment'); return 2; }
  const out = path.resolve(ROOT, o.out);
  if (existsSync(out) && readdirSync(out).length) throw new Error('output directory exists and is not empty; refusing to overwrite: ' + out);
  mkdirSync(path.join(out, 'raw'), { recursive: true });
  const key_ = JSON.parse(readFileSync(path.join(ROOT, 'KEY.json'), 'utf8')).key;
  let cases = key_.map((k) => ({ id: k.case, text: readFileSync(path.join(ROOT, 'cases', k.case + '.txt'), 'utf8') }));
  if (o.limit) cases = cases.slice(0, o.limit);
  for (const c of cases) {
    if (c.text.length > EVAL_CHAR_LIMIT) throw new Error(`${c.id} exceeds the evaluation limit; refusing (no truncation)`);
    c.sha256 = sha256(c.text);
  }
  const arms = o.arms.split(',');
  for (const a of arms) if (!ARMS[a]) throw new Error('unknown arm ' + a);
  const jobs = [];
  for (const a of arms) for (const c of cases) for (let r = 1; r <= o.runs; r++) jobs.push({ arm: a, c, r });
  if (jobs.length > MAX_CALLS) throw new Error(`${jobs.length} jobs exceed the ${MAX_CALLS}-call cap`);
  const manifest = { started_utc: new Date().toISOString(), dry_run: o.dry, arms: Object.fromEntries(arms.map((a) => [a, { model: ARMS[a].model, system_sha256: ARMS[a].system_sha256 }])),
    production_engine_sha256: PROD_SHA256, runs_per_case: o.runs, cases: cases.length, planned_calls: jobs.length, eval_char_limit: EVAL_CHAR_LIMIT };
  writeFileSync(path.join(out, 'MANIFEST.json'), JSON.stringify(manifest, null, 1));
  let calls = 0, usd = 0, stopped = null;
  const results = path.join(out, 'results.jsonl');
  async function run(job) {
    if (stopped) return;
    const body = ARMS[job.arm].body(job.c.text);
    let res, j, attempt = 0, status;
    for (;;) {
      if (calls >= MAX_CALLS) { stopped = 'call_cap'; return; }
      if (usd >= RUNAWAY_USD) { stopped = 'runaway_cost_stop'; return; }
      calls++;
      try { res = await callOnce(body, key, o.dry); } catch (e) { status = 'network_or_timeout: ' + e.name; break; }
      status = res.status;
      if (res.ok) { j = await res.json(); break; }
      if ([429, 529].includes(res.status) || res.status >= 500) {
        if (attempt++ >= MAX_RETRIES) break;
        const ra = Number((res.headers.get && res.headers.get('retry-after')) || 5);
        await new Promise((s) => setTimeout(s, Math.min(60, Math.max(1, ra)) * 1000));
        continue;
      }
      try { j = { error: await res.json() }; } catch (e) { j = null; }
      break;
    }
    const rec = { arm: job.arm, case: job.c.id, run: job.r, model: ARMS[job.arm].model, case_sha256: job.c.sha256, http_status: status, attempts: attempt + 1 };
    if (j && j.usage) {
      const [pi, po] = PRICES[ARMS[job.arm].model];
      rec.usage = j.usage;
      rec.usd = ((j.usage.input_tokens || 0) * pi + (j.usage.output_tokens || 0) * po) / 1e6;
      usd += rec.usd;
    }
    if (j && j.content) Object.assign(rec, parseResponse(job.arm, j), { stop_reason: j.stop_reason, served_model: j.model });
    else rec.outcome = 'http_error';
    writeFileSync(path.join(out, 'raw', `${job.arm}_${job.c.id}_r${job.r}.json`), JSON.stringify({ request_model: body.model, response: j }, null, 1));
    delete rec.parsed;
    appendFileSync(results, JSON.stringify(rec) + '\n');
  }
  const queue = jobs.slice();
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (queue.length && !stopped) await run(queue.shift()); }));
  manifest.finished_utc = new Date().toISOString();
  manifest.calls_made = calls; manifest.observed_usd = Number(usd.toFixed(4)); manifest.stopped = stopped;
  writeFileSync(path.join(out, 'MANIFEST.json'), JSON.stringify(manifest, null, 1));
  console.log(JSON.stringify({ calls, usd: manifest.observed_usd, stopped }));
  return stopped ? 3 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(args()).then((c) => process.exit(c), (e) => { console.error('ERROR', e.message); process.exit(1); });
}

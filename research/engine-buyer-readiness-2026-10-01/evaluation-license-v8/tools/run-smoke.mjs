// JRS Engine v8.0 smoke runner: a thin adapter around the UNCHANGED Engine.
//
// It imports the maintained handler from api/review-engine.js and calls it
// in-process. It does not copy, patch, or re-implement Engine logic. Every
// control below sits outside the handler:
//
//   - one allowed destination (the Anthropic Messages endpoint), redirects refused
//   - a hard cap on provider attempts, counted BEFORE each request is sent
//   - no retries: a failed or timed-out attempt is recorded and never repeated
//   - a per-attempt timeout
//   - a cost upper bound checked against the ceiling before the first call
//   - input outside 40..8,000 JavaScript string code units is rejected, not
//     truncated (the handler itself truncates above 8,000; see the defect register)
//   - JRS production persistence disabled: the Supabase service key is removed
//     from the environment before the handler loads, and any non-provider
//     destination is refused
//   - reference expectations are never read: this file opens only corpus records
//   - output directories are never overwritten
//
// Why not tools/run-live-manifest-evaluation.mjs: that runner sends one record to
// the JRS-HOSTED production endpoint with a JRS token. v8.0 section 8 excludes a
// JRS-hosted inference service from the first offer; the buyer runs the package
// with its own provider key. This adapter is that customer-run path.
//
// Usage:
//   node run-smoke.mjs --live --out ../runs/<new-dir>
// Exit codes: 0 complete; 2 incomplete (an attempt failed or the cap was reached);
//             3 blocked before any call (no key, cost bound, existing output dir);
//             4 usage error.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const ENGINE_PATH = path.join(REPO, 'api/review-engine.js');
const PROVIDER_URL = 'https://api.anthropic.com/v1/messages';

export const LIMITS = Object.freeze({
  callCap: 10,
  ceilingUsd: 5,
  timeoutMs: 60000,
  minChars: 40,
  maxChars: 8000,
  // Claude Haiku 4.5 list prices, Anthropic pricing page read 2026-10-01:
  // USD 1 per million input tokens, USD 5 per million output tokens.
  inputUsdPerMTok: 1,
  outputUsdPerMTok: 5,
  // Conservative bound: 1 token per 2 characters (real English text averages ~4),
  // plus the handler's max_tokens of 900 for output.
  charsPerTokenFloor: 2,
  maxOutputTokens: 900,
});

export function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export function costUpperBoundUsd(chars, systemPromptChars) {
  const inTok = Math.ceil((chars + systemPromptChars + 200) / LIMITS.charsPerTokenFloor);
  return (inTok * LIMITS.inputUsdPerMTok + LIMITS.maxOutputTokens * LIMITS.outputUsdPerMTok) / 1e6;
}

export function loadCorpus(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.txt')).sort();
  return files.map((f) => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    return { id: f.replace(/\.txt$/, ''), file: f, text, sha256: sha256(text) };
  });
}

// Wraps a fetch implementation with the destination, redirect, timeout and
// attempt-accounting controls. `ledger` is mutated so the caller sees every attempt.
export function guardFetch(innerFetch, ledger, opts) {
  return async function guarded(url, init) {
    const target = String(url && url.url ? url.url : url);
    if (target !== PROVIDER_URL) {
      ledger.refused.push({ target, reason: 'destination_not_allowed' });
      throw new Error('destination_refused');
    }
    if (ledger.attempts.length >= opts.callCap) {
      ledger.refused.push({ target, reason: 'call_cap_reached' });
      throw new Error('call_cap_reached');
    }
    const attempt = { n: ledger.attempts.length + 1, started_at: new Date().toISOString(), outcome: 'sent_unknown' };
    ledger.attempts.push(attempt); // counted before sending: uncertainty is counted against the budget
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), opts.timeoutMs);
    try {
      const res = await innerFetch(target, Object.assign({}, init, { redirect: 'error', signal: ac.signal }));
      attempt.http_status = res.status;
      let usage = null;
      try { const j = await res.clone().json(); usage = j && j.usage ? j.usage : null; attempt.stop_reason = j && j.stop_reason ? j.stop_reason : null; } catch (e) {}
      attempt.usage = usage;
      attempt.outcome = res.ok ? 'http_ok' : 'http_error';
      return res;
    } catch (e) {
      attempt.outcome = ac.signal.aborted ? 'timeout' : 'transport_error';
      attempt.error = String(e && e.message || e).slice(0, 200);
      throw e;
    } finally {
      clearTimeout(timer);
      attempt.ended_at = new Date().toISOString();
    }
  };
}

export async function runSmoke({ corpusDir, outDir, key, fetchImpl, callsPerRecord = 2, limits = LIMITS }) {
  const record = {
    runner: 'run-smoke.mjs', runner_sha256: sha256(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')),
    engine_path: 'api/review-engine.js', engine_sha256: sha256(fs.readFileSync(ENGINE_PATH, 'utf8')),
    started_at: new Date().toISOString(), limits, status: 'STARTED', blocked_reason: null,
    corpus: [], calls: [], attempts: [], refused: [], cost: {},
  };
  const finish = (status, code) => {
    record.status = status; record.ended_at = new Date().toISOString();
    if (outDir && fs.existsSync(outDir)) fs.writeFileSync(path.join(outDir, 'EXECUTION-RECORD.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
    return { code, record };
  };

  if (outDir && fs.existsSync(outDir)) { record.blocked_reason = 'output_directory_exists'; return { code: 3, record: Object.assign(record, { status: 'BLOCKED' }) }; }
  if (!key) { record.blocked_reason = 'provider_key_absent'; return { code: 3, record: Object.assign(record, { status: 'BLOCKED' }) }; }

  const corpus = loadCorpus(corpusDir);
  record.corpus = corpus.map((c) => ({ id: c.id, sha256: c.sha256, chars: c.text.trim().length }));
  for (const c of corpus) {
    const n = c.text.trim().length;
    if (n < limits.minChars || n > limits.maxChars) { record.blocked_reason = 'input_out_of_bounds:' + c.id + ':' + n; return { code: 3, record: Object.assign(record, { status: 'BLOCKED' }) }; }
  }

  // Environment isolation, set BEFORE the handler module is evaluated.
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.JRS_SANDBOX_OPEN;
  delete process.env.JRS_MODEL_ID; // pin the documented default model
  const localToken = crypto.randomBytes(24).toString('hex');
  process.env.REVIEW_API_TOKEN = localToken;
  process.env.ANTHROPIC_API_KEY = key;

  const mod = await import(pathToFileURL(ENGINE_PATH).href + '?v8=' + Date.now());
  const engineSrc = fs.readFileSync(ENGINE_PATH, 'utf8');
  const spMatch = engineSrc.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/);
  const systemPromptChars = spMatch ? spMatch[1].length : 4000;
  record.system_prompt_sha256 = spMatch ? sha256(spMatch[1]) : null;

  const bound = corpus.reduce((a, c) => a + costUpperBoundUsd(c.text.trim().length, systemPromptChars) * callsPerRecord, 0);
  const planned = corpus.length * callsPerRecord;
  record.cost.upper_bound_usd = Number(bound.toFixed(6));
  record.cost.planned_calls = planned;
  if (planned > limits.callCap || bound > limits.ceilingUsd) { record.blocked_reason = 'budget_bound_exceeded'; return { code: 3, record: Object.assign(record, { status: 'BLOCKED' }) }; }

  fs.mkdirSync(outDir, { recursive: false });
  const ledger = { attempts: record.attempts, refused: record.refused };
  const realFetch = globalThis.fetch;
  globalThis.fetch = guardFetch(fetchImpl || realFetch, ledger, limits);
  let incomplete = false;
  try {
    for (const c of corpus) {
      for (let k = 1; k <= callsPerRecord; k++) {
        if (globalThis.__jrs_rl) globalThis.__jrs_rl.clear(); // local process: the per-IP limiter is not under test here
        const before = ledger.attempts.length;
        const req = new Request('http://localhost/api/review-engine', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: 'Bearer ' + localToken },
          body: JSON.stringify({ text: c.text, runs: 1, include_manifest: true }),
        });
        let body = null, status = null;
        try { const res = await mod.default(req); status = res.status; body = await res.json(); } catch (e) { body = { error: 'adapter_exception', detail: String(e && e.message || e) }; }
        const call = { record_id: c.id, call: k, http_status: status, attempts_used: ledger.attempts.length - before };
        if (status === 200 && body && body.result) {
          call.determination = body.result.determination;
          call.conditions = Object.fromEntries(Object.entries(body.result.conditions).map(([kk, v]) => [kk, v.status]));
          call.manifest_present = !!(body.manifest && body.manifest.integrity);
          call.manifest_hash = body.manifest && body.manifest.integrity ? body.manifest.integrity.manifest_hash : null;
          call.response = body;
        } else { call.error = body; incomplete = true; }
        record.calls.push(call);
        if (call.attempts_used === 0 && status !== 200) { incomplete = true; }
      }
    }
  } finally { globalThis.fetch = realFetch; }

  const used = record.attempts.reduce((a, t) => {
    const u = t.usage || {}; return { in: a.in + (u.input_tokens || 0), out: a.out + (u.output_tokens || 0) };
  }, { in: 0, out: 0 });
  record.cost.observed_input_tokens = used.in;
  record.cost.observed_output_tokens = used.out;
  record.cost.observed_usd_from_usage = Number(((used.in * limits.inputUsdPerMTok + used.out * limits.outputUsdPerMTok) / 1e6).toFixed(6));
  record.cost.note = 'Computed from response usage at list price; attempts without usage are covered only by the upper bound.';
  record.attempt_count = record.attempts.length;
  return finish(incomplete ? 'INCOMPLETE' : 'COMPLETED', incomplete ? 2 : 0);
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  if (!args.includes('--live') || outIdx === -1 || !args[outIdx + 1]) { console.error('usage: node run-smoke.mjs --live --out <new-dir>'); process.exit(4); }
  const outDir = path.resolve(args[outIdx + 1]);
  const { code, record } = await runSmoke({
    corpusDir: path.join(HERE, '../corpus/records'), outDir,
    key: process.env.ANTHROPIC_API_KEY || '',
  });
  console.log(JSON.stringify({ status: record.status, blocked_reason: record.blocked_reason, attempts: record.attempts.length, upper_bound_usd: record.cost.upper_bound_usd, observed_usd: record.cost.observed_usd_from_usage }, null, 2));
  process.exit(code);
}

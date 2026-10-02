// Offline negative and positive tests for run-smoke.mjs. No network calls are made:
// every provider response comes from an in-process mock. Each control is shown to
// FIRE on a faulty input, not only to pass on a good one.
//
// Usage: node test-run-smoke.mjs   (exit 0 only if every check passes)

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSmoke, guardFetch, LIMITS, costUpperBoundUsd } from './run-smoke.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.join(HERE, '../corpus/records');
let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log('PASS  ' + name); }
  else { failed++; console.log('FAIL  ' + name + (detail ? '  ' + detail : '')); }
}
function tmpOut() { return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'jrs-v8-')), 'run'); }

const GOOD = {
  conditions: {
    basis_identification: { status: 'gap', note: 'n' }, reasoning_traceability: { status: 'review', note: 'n' },
    cold_reviewer_clarity: { status: 'pass', note: 'n' }, accountability_support: { status: 'gap', note: 'n' },
    temporal_reconstructability: { status: 'pass', note: 'n' },
  },
  remediation_note: 'r', finding: { ai_function: 'analysis', condition_triggered: 'c', compliant_version: 'v' },
};
function okResponse(obj) {
  return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(obj || GOOD) }], usage: { input_tokens: 1200, output_tokens: 400 }, stop_reason: 'end_turn' }), { status: 200, headers: { 'content-type': 'application/json' } });
}
function mockProvider(behaviour) {
  const seen = [];
  const f = async (url, init) => {
    seen.push({ url, redirect: init && init.redirect, hasSignal: !!(init && init.signal) });
    return behaviour(seen.length, url, init);
  };
  f.seen = seen;
  return f;
}

// 1. Successful mock run: exactly 10 attempts, all calls parsed, record written.
{
  const out = tmpOut();
  const p = mockProvider(() => okResponse());
  const { code, record } = await runSmoke({ corpusDir: CORPUS, outDir: out, key: 'mock-key', fetchImpl: p });
  check('complete mock run exits 0', code === 0, 'code=' + code);
  check('complete mock run makes exactly 10 provider attempts', record.attempts.length === 10 && p.seen.length === 10, record.attempts.length + '/' + p.seen.length);
  check('every call derives gap_identified from a gap condition', record.calls.every((c) => c.determination === 'gap_identified'));
  check('a Manifest is produced for every call', record.calls.every((c) => c.manifest_present && /^sha256:|^[0-9a-f]{64}$/.test(String(c.manifest_hash))), String(record.calls[0].manifest_hash));
  check('execution record written', fs.existsSync(path.join(out, 'EXECUTION-RECORD.json')));
  check('redirects refused on every provider request', p.seen.every((s) => s.redirect === 'error'));
  check('every provider request carries an abort signal (timeout)', p.seen.every((s) => s.hasSignal));
  check('observed cost computed from usage', record.cost.observed_input_tokens === 12000 && record.cost.observed_output_tokens === 4000);
  check('JRS persistence key absent while the handler ran', !('SUPABASE_SERVICE_ROLE_KEY' in process.env));
  check('no non-provider destination was attempted', record.refused.length === 0);
}

// 2. Output directory is never overwritten.
{
  const out = tmpOut(); fs.mkdirSync(out);
  const p = mockProvider(() => okResponse());
  const { code, record } = await runSmoke({ corpusDir: CORPUS, outDir: out, key: 'k', fetchImpl: p });
  check('existing output directory blocks the run', code === 3 && record.blocked_reason === 'output_directory_exists');
  check('blocked run makes zero provider attempts', p.seen.length === 0);
}

// 3. Missing key blocks before any call.
{
  const p = mockProvider(() => okResponse());
  const { code, record } = await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: '', fetchImpl: p });
  check('absent provider key blocks with exit 3', code === 3 && record.blocked_reason === 'provider_key_absent');
  check('absent key makes zero provider attempts', p.seen.length === 0);
}

// 4. Call cap: a cap of 3 stops at 3 attempts and marks the run INCOMPLETE.
{
  const p = mockProvider(() => okResponse());
  const lim = Object.assign({}, LIMITS, { callCap: 3 });
  const { code, record } = await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p, limits: lim });
  // Planned calls (10) exceed the cap (3), so the budget bound blocks before any call.
  check('planned calls above the cap block before any call', code === 3 && record.blocked_reason === 'budget_bound_exceeded' && p.seen.length === 0);
}
{
  // Cap enforcement inside the guard itself, independent of planning.
  const ledger = { attempts: [], refused: [] };
  const p = mockProvider(() => okResponse());
  const g = guardFetch(p, ledger, Object.assign({}, LIMITS, { callCap: 2 }));
  await g('https://api.anthropic.com/v1/messages', {});
  await g('https://api.anthropic.com/v1/messages', {});
  let threw = false; try { await g('https://api.anthropic.com/v1/messages', {}); } catch (e) { threw = e.message === 'call_cap_reached'; }
  check('guard refuses the attempt after the cap', threw && p.seen.length === 2 && ledger.attempts.length === 2);
}

// 5. No retries: a provider 500 is recorded once and the run is INCOMPLETE.
{
  const p = mockProvider((n) => n === 1 ? new Response('{"error":"x"}', { status: 500 }) : okResponse());
  const { code, record } = await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p });
  check('provider error makes the run INCOMPLETE (exit 2)', code === 2 && record.status === 'INCOMPLETE');
  check('provider error is not retried (10 attempts for 10 calls)', p.seen.length === 10 && record.calls[0].attempts_used === 1);
  check('failed attempt preserved with its status', record.attempts[0].outcome === 'http_error' && record.attempts[0].http_status === 500);
}

// 6. Timeout: a hanging provider is aborted and counted.
{
  const ledger = { attempts: [], refused: [] };
  const hang = async (url, init) => new Promise((_, rej) => { init.signal.addEventListener('abort', () => rej(new Error('aborted'))); });
  const g = guardFetch(hang, ledger, Object.assign({}, LIMITS, { timeoutMs: 50 }));
  let threw = false; try { await g('https://api.anthropic.com/v1/messages', {}); } catch (e) { threw = true; }
  check('hanging provider aborted by timeout', threw && ledger.attempts[0].outcome === 'timeout');
  check('timed-out attempt counted against the budget', ledger.attempts.length === 1);
}

// 7. Destination allowlist: any other host is refused and not counted as an attempt.
{
  const ledger = { attempts: [], refused: [] };
  const p = mockProvider(() => okResponse());
  const g = guardFetch(p, ledger, LIMITS);
  let threw = false; try { await g('https://pjzxkeviouofdseagvpf.supabase.co/rest/v1/engine_reviews', {}); } catch (e) { threw = e.message === 'destination_refused'; }
  check('JRS database destination refused', threw && p.seen.length === 0 && ledger.refused.length === 1);
  let threw2 = false; try { await g('https://api.anthropic.com.evil.example/v1/messages', {}); } catch (e) { threw2 = true; }
  check('look-alike provider host refused', threw2 && p.seen.length === 0);
}

// 8. Input bounds: an over-length record blocks the run before any call (no silent truncation).
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jrs-v8-corpus-'));
  fs.writeFileSync(path.join(dir, 'big.txt'), 'x'.repeat(8001));
  const p = mockProvider(() => okResponse());
  const { code, record } = await runSmoke({ corpusDir: dir, outDir: tmpOut(), key: 'k', fetchImpl: p });
  check('8,001-character record rejected, not truncated', code === 3 && /input_out_of_bounds:big:8001/.test(record.blocked_reason) && p.seen.length === 0);
  fs.writeFileSync(path.join(dir, 'big.txt'), 'short');
  const r2 = await runSmoke({ corpusDir: dir, outDir: tmpOut(), key: 'k', fetchImpl: p });
  check('under-40-character record rejected', r2.code === 3 && /input_out_of_bounds/.test(r2.record.blocked_reason));
}

// 9. Malformed provider output: the Engine refuses it and the run is INCOMPLETE.
{
  const p = mockProvider((n) => n === 1 ? okResponse({ conditions: { basis_identification: { status: 'ready' } } }) : okResponse());
  const { code, record } = await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p });
  check('invalid condition status rejected by the Engine and preserved', code === 2 && record.calls[0].http_status === 502);
}

// 10. Reference expectations are never read by the runner.
{
  const src = fs.readFileSync(path.join(HERE, 'run-smoke.mjs'), 'utf8');
  check('runner source never references the expectations file', !/EXPECTATIONS/.test(src));
}

// 11. Cost bound arithmetic: ten worst-case calls stay under the v8.0 USD 5 ceiling.
// (Corrected 2026-10-01: the first version tested an arbitrary USD 0.10 threshold of
// my own; the conservative bound is USD 0.101. The governing criterion is v8.0's USD 5.)
{
  const bound = costUpperBoundUsd(8000, 3000) * 10;
  console.log('      worst-case bound for ten 8,000-character calls: USD ' + bound.toFixed(4));
  check('worst-case ten calls at 8,000 characters stay under the USD 5 ceiling', bound < LIMITS.ceilingUsd, 'bound=' + bound);
}

// 12. Entitlement: expiry, quota and ledger accounting for the delivered package.
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jrs-v8-ent-'));
  const entFile = path.join(dir, 'entitlement.json');
  const write = (o) => fs.writeFileSync(entFile, JSON.stringify(Object.assign({ licensee: 'Example Org', expires_on: '2099-12-31', max_attempts: 300, ledger: 'ledger.json' }, o)));
  const p = mockProvider(() => okResponse());

  write({ expires_on: '2026-01-01' });
  let r = await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p, entitlementFile: entFile });
  check('expired entitlement blocks before any call', r.code === 3 && r.record.blocked_reason === 'entitlement_expired' && p.seen.length === 0);

  write({ max_attempts: 10 });
  fs.writeFileSync(path.join(dir, 'ledger.json'), JSON.stringify({ attempts_used: 10, runs: [] }));
  r = await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p, entitlementFile: entFile });
  check('exhausted quota blocks before any call', r.code === 3 && r.record.blocked_reason === 'quota_exhausted' && p.seen.length === 0);

  fs.writeFileSync(path.join(dir, 'ledger.json'), JSON.stringify({ attempts_used: 7, runs: [] }));
  r = await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p, entitlementFile: entFile });
  check('remaining quota smaller than the planned calls blocks the run', r.code === 3 && r.record.blocked_reason === 'budget_bound_exceeded' && p.seen.length === 0);

  write({ max_attempts: 300 });
  fs.writeFileSync(path.join(dir, 'ledger.json'), JSON.stringify({ attempts_used: 0, runs: [] }));
  r = await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p, entitlementFile: entFile, limits: Object.assign({}, LIMITS, { callCap: 300 }) });
  const led = JSON.parse(fs.readFileSync(path.join(dir, 'ledger.json'), 'utf8'));
  check('ledger records every attempt of a licensed run', r.code === 0 && led.attempts_used === 10 && led.runs.length === 1);

  write({ licensee: '' });
  let threw = false; try { await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p, entitlementFile: entFile }); } catch (e) { threw = /entitlement_field_missing:licensee/.test(e.message); }
  check('entitlement with a missing field is refused', threw);

  write({ licensee: 'REPLACE: organization name', expires_on: 'REPLACE: YYYY-MM-DD' });
  threw = false; try { await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p, entitlementFile: entFile }); } catch (e) { threw = /entitlement_not_filled_in/.test(e.message); }
  check('unfilled template entitlement is refused', threw);
  write({ expires_on: 'REPLACE: YYYY-MM-DD' });
  threw = false; try { await runSmoke({ corpusDir: CORPUS, outDir: tmpOut(), key: 'k', fetchImpl: p, entitlementFile: entFile }); } catch (e) { threw = /entitlement_invalid:expires_on/.test(e.message); }
  check('placeholder expiry date is refused (it would otherwise never expire)', threw);
}

console.log('\n' + passed + ' checks, ' + failed + ' failed');
process.exit(failed ? 1 : 0);

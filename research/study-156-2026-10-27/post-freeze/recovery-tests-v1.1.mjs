// 156-record study: runner-level recovery and fail-closed tests. Each scenario runs the frozen runners on a fresh
// scratch copy of this package (out/ and history/ left out) and of the two sibling directories they import, so
// that inputs can be corrupted without touching the real package. The 0.3.1 engine of record is still read
// from the repository by the V0 isolation harness, read-only and manifest-checked.
// Transport-level recovery (journal corruption, resume, duplicates, budget, stale authorization) is in
// tools/transport/test-transport.mjs; RT-10 reruns that suite inside the scratch copy.
// POST-FREEZE VERSION 1.1 (2026-10-27). The frozen tools/recovery-tests.mjs (1.0) is kept unchanged and its result
// (out/recovery/RESULTS.json, 9 of 10) stands. Two harness defects found in that run are corrected here:
//   (1) error text was read from the last 600 characters of stderr, which held stack frames, not the message;
//   (2) the scratch copies left out history/, so every scored-run stop also listed the freeze seal's history files
//       as missing. Copies now leave out out/ only.
// Usage: node post-freeze/recovery-tests-v1.1.mjs <scratch>   (writes out/recovery-v1.1/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH = join(PKG, '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const [SCRATCH] = process.argv.slice(2);
if (!SCRATCH) { console.error('usage: recovery-tests.mjs <scratch>'); process.exit(2); }
const OUTF = join(PKG, 'out', 'recovery-v1.1', 'RESULTS.json');
if (existsSync(OUTF)) { console.error(OUTF + ' exists'); process.exit(2); }
mkdirSync(SCRATCH, { recursive: true });
const ENV = Object.assign({}, process.env); delete ENV.ANTHROPIC_BASE_URL;

const copies = [];
function freshCopy() {
  const root = mkdtempSync(join(SCRATCH, 'rt-')); copies.push(root);
  const P = join(root, 'research', 'study-156-2026-10-27');
  cpSync(PKG, P, { recursive: true, filter: (src) => !/\/study-156-2026-10-27\/out(\/|$)/.test(src) });
  cpSync(join(RESEARCH, 'validation-readiness-gate-v0-2026-10-25', 'tools'), join(root, 'research', 'validation-readiness-gate-v0-2026-10-25', 'tools'), { recursive: true });
  for (const f of ['candidate', 'CANDIDATE_0.3.2_MANIFEST_SHA256.txt']) cpSync(join(RESEARCH, 'engine-correction-v0-02-ev32-2026-10-25', f), join(root, 'research', 'engine-correction-v0-02-ev32-2026-10-25', f), { recursive: true });
  // Records are read relative to the repository root two levels above the package; mirror the record paths.
  return { root, P };
}
const run = (P, args, scratch) => { mkdirSync(scratch, { recursive: true }); const r = spawnSync(process.execPath, args.map((a) => a.replace('<scratch>', scratch)), { cwd: P, env: ENV, encoding: 'utf8', timeout: 600000 }); return { status: r.status, stdout: (r.stdout || '').slice(-600), stderr: (r.stderr || '').slice(0, 1500) + '\n...\n' + (r.stderr || '').slice(-600) }; };
const results = [];
const test = async (id, name, fn) => { let r; try { r = await fn(); } catch (e) { r = { ok: false, observed: 'threw: ' + String(e && e.message).slice(0, 300) }; }
  for (const c of copies.splice(0)) rmSync(c, { recursive: true, force: true });
  results.push({ id, name, ok: !!r.ok, observed: r.observed === undefined ? null : r.observed }); console.log(id, r.ok ? 'ok' : 'FAIL', name); };
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const corrupt = (p) => { const b = readFileSync(p); b[Math.floor(b.length / 2)] ^= 0x01; writeFileSync(p, b); };

await test('RT-01', 'an interrupted development run leaves no results file; the same label is refused; a new label completes with the same graphs', async () => {
  const { P } = freshCopy(); const sc = join(SCRATCH, 'rt01');
  mkdirSync(sc, { recursive: true });
  const child = spawn(process.execPath, ['tools/run-study.mjs', 'dev-901', sc], { cwd: P, env: ENV, stdio: 'ignore' });
  const exited = new Promise((res) => child.on('exit', res));
  for (let w = 0; w < 100 && !existsSync(join(P, 'out', 'dev-901')); w++) await new Promise((res) => setTimeout(res, 50));
  await new Promise((res) => setTimeout(res, 300)); child.kill('SIGKILL'); await exited;
  const dirLeft = existsSync(join(P, 'out', 'dev-901')), resultsLeft = existsSync(join(P, 'out', 'dev-901', 'RESULTS.json'));
  const again = run(P, ['tools/run-study.mjs', 'dev-901', '<scratch>'], join(SCRATCH, 'rt01b'));
  const fresh = run(P, ['tools/run-study.mjs', 'dev-902', '<scratch>'], join(SCRATCH, 'rt01c'));
  const a = readJson(join(P, 'out', 'dev-902', 'RESULTS.json')), ref = readJson(join(PKG, 'out', 'run-1', 'RESULTS.json'));
  const refMap = new Map((ref ? ref.rows : []).map((r) => [r.arm + '/' + r.id, r.graph_digest]));
  const same = a ? a.rows.filter((r) => r.graph_digest && refMap.get(r.arm + '/' + r.id) === r.graph_digest).length : 0, comparable = a ? a.rows.filter((r) => r.graph_digest).length : 0;
  return { ok: dirLeft && !resultsLeft && again.status === 2 && /output exists/.test(again.stderr) && fresh.status === 0 && a && comparable > 0 && same === comparable,
    observed: { interrupted_dir_left: dirLeft, interrupted_results_left: resultsLeft, same_label_exit: again.status, new_label_exit: fresh.status, digests_equal_to_run1: same + '/' + comparable } };
});
await test('RT-02', 'a corrupted record stops a scored run before execution', () => {
  const { P } = freshCopy(); corrupt(join(P, 'records', 'synthetic', 'S-050.txt'));
  const r = run(P, ['tools/run-study.mjs', 'run-901', '<scratch>'], join(SCRATCH, 'rt02')); const o = readJson(join(P, 'out', 'run-901', 'RESULTS.json'));
  return { ok: r.status === 3 && o && o.stopped_before_execution && o.problems.some((p) => /S-050/.test(p)), observed: { exit: r.status, problems: o && o.problems } };
});
await test('RT-03', 'a corrupted mock candidate stops a scored run before execution (freeze seal) and fails a development run closed (no results file)', () => {
  const { P } = freshCopy(); corrupt(join(P, 'mocks', 'ORACLE', 'S-001.json'));
  const r1 = run(P, ['tools/run-study.mjs', 'run-902', '<scratch>'], join(SCRATCH, 'rt03a')); const o1 = readJson(join(P, 'out', 'run-902', 'RESULTS.json'));
  const r2 = run(P, ['tools/run-study.mjs', 'dev-903', '<scratch>'], join(SCRATCH, 'rt03b'));
  return { ok: r1.status === 3 && o1 && o1.problems.some((p) => /mocks\/ORACLE\/S-001\.json/.test(p)) && r2.status !== 0 && /mock_hash_mismatch/.test(r2.stderr) && !existsSync(join(P, 'out', 'dev-903', 'RESULTS.json')),
    observed: { scored_exit: r1.status, scored_problems: o1 && o1.problems, dev_exit: r2.status, dev_error: (/mock_hash_mismatch[^\n]*/.exec(r2.stderr) || [null])[0] } };
});
await test('RT-04', 'an altered candidate file (incompatible version) stops a scored run before execution and fails a development run at isolation', () => {
  const { P } = freshCopy(); const f = join(P, 'candidate', 'lib', 'engine-evidence-graph-v0.3.3-research-candidate', 'research-profile.mjs'); writeFileSync(f, readFileSync(f, 'utf8') + '\n// altered\n');
  const r1 = run(P, ['tools/run-study.mjs', 'run-903', '<scratch>'], join(SCRATCH, 'rt04a')); const o1 = readJson(join(P, 'out', 'run-903', 'RESULTS.json'));
  const r2 = run(P, ['tools/run-study.mjs', 'dev-904', '<scratch>'], join(SCRATCH, 'rt04b'));
  return { ok: r1.status === 3 && o1 && o1.problems.some((p) => /research-profile\.mjs/.test(p)) && r2.status !== 0 && /isolated_copy_mismatch/.test(r2.stderr), observed: { scored_exit: r1.status, scored_problems: o1 && o1.problems, dev_exit: r2.status, dev_error: (/isolated_copy_mismatch[^\n]*/.exec(r2.stderr) || [null])[0] } };
});
await test('RT-05', 'a missing freeze seal stops a scored run before execution', () => {
  const { P } = freshCopy(); rmSync(join(P, 'seals', 'freeze'), { recursive: true, force: true });
  const r = run(P, ['tools/run-study.mjs', 'run-904', '<scratch>'], join(SCRATCH, 'rt05')); const o = readJson(join(P, 'out', 'run-904', 'RESULTS.json'));
  return { ok: r.status === 3 && o && o.problems.some((p) => /freeze/.test(p)), observed: { exit: r.status, problems: o && o.problems } };
});
await test('RT-06', 'a corrupted variant file stops a variant run before execution', () => {
  const { P } = freshCopy(); corrupt(join(P, 'variants', 'VARIANTS.jsonl'));
  const r = run(P, ['tools/run-variants.mjs', 'vdev-901', '<scratch>'], join(SCRATCH, 'rt06')); const o = readJson(join(P, 'out', 'vdev-901', 'RESULTS.json'));
  return { ok: r.status === 3 && o && o.problems.includes('variants_file_hash_mismatch'), observed: { exit: r.status, problems: o && o.problems } };
});
await test('RT-07', 'provider configuration is refused: forbidden variable names and network keys are detected (synthetic objects; the process environment is not touched)', () => {
  const p = V.checkNetworkMarkers({ ANTHROPIC_BASE_URL: 'x', ANTHROPIC_API_KEY: 'x', OPENAI_BASE_URL: 'x' }, { provider: { base_url: 'https://example.invalid' } });
  return { ok: p.includes('forbidden_env_present:ANTHROPIC_BASE_URL') && p.includes('forbidden_env_present:ANTHROPIC_API_KEY') && p.some((x) => x.startsWith('network_config_key:')), observed: p };
});
await test('RT-08', 'the network guard traps an outbound attempt before any connection and counts it', () => {
  const code = "import { attempts, installNetGuard } from " + JSON.stringify(join(RESEARCH, 'validation-readiness-gate-v0-2026-10-25', 'tools', 'harness', 'net-guard.mjs')) + "; installNetGuard(); let threw = ''; try { await fetch('https://example.invalid/'); } catch (e) { threw = e.message; } console.log(JSON.stringify({ threw, attempts: attempts.length }));";
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { env: ENV, encoding: 'utf8', timeout: 30000 }); const o = JSON.parse((r.stdout || '{}').trim() || '{}');
  return { ok: o.threw === 'network_blocked:fetch' && o.attempts === 1, observed: o };
});
await test('RT-09', 'a duplicate scored label is refused before any work', () => {
  const { P } = freshCopy(); mkdirSync(join(P, 'out', 'run-905'), { recursive: true });
  const r = run(P, ['tools/run-study.mjs', 'run-905', '<scratch>'], join(SCRATCH, 'rt09'));
  return { ok: r.status === 2 && /output exists/.test(r.stderr), observed: { exit: r.status } };
});
await test('RT-10', 'the offline transport suite passes in a fresh copy (journal corruption, resume, duplicates, budget, stale authorization)', () => {
  const { P } = freshCopy(); const r = run(P, ['tools/transport/test-transport.mjs'], join(SCRATCH, 'rt10')); const o = readJson(join(P, 'out', 'transport', 'RESULTS.json'));
  return { ok: r.status === 0 && o && o.totals.failed === 0 && o.totals.passed === 49 && o.network_attempts === 0, observed: o && o.totals };
});
const out = { results_format: 'jrs-study-156-recovery/1.1.0', supersedes_nothing: 'Version 1.0 result kept at out/recovery/RESULTS.json', network_attempts_parent: attempts.length, totals: { tests: results.length, passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length }, results };
mkdirSync(dirname(OUTF), { recursive: true });
writeFileSync(OUTF, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals), 'network', attempts.length);

// 0.3.4 repair package: runner-level recovery and fail-closed tests 2.0, for this package's scored runners.
// Derived from the study's post-freeze/recovery-tests-v1.1.mjs (which corrected HF-01 in the frozen 1.0); both stay
// unchanged in the study package. The two HF-01 corrections are kept: error text is read from the start of stderr as
// well as its end, and scratch copies leave out only out/ (history/ is sealed and must be present).
// Each scenario runs on a fresh scratch copy of this package and of the sibling directories it imports (the study
// package, the V0 harness tools and the 0.3.2 candidate), so inputs can be corrupted without touching the real files.
// The 0.3.1 engine of record is read from the repository by the V0 isolation harness, read-only and manifest-checked.
// Usage: node tools/recovery-tests-v2.mjs <scratch>   (writes out/recovery-v2/RESULTS.json; needs out/run-1 to exist)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH = join(PKG, '..');
const NAME = 'engine-repair-0.3.4-2026-10-27', STUDY = 'study-156-2026-10-27';
const [SCRATCH] = process.argv.slice(2);
if (!SCRATCH) { console.error('usage: recovery-tests-v2.mjs <scratch>'); process.exit(2); }
const OUTF = join(PKG, 'out', 'recovery-v2', 'RESULTS.json');
if (existsSync(OUTF)) { console.error(OUTF + ' exists'); process.exit(2); }
if (!existsSync(join(PKG, 'out', 'run-1', 'RESULTS.json'))) { console.error('out/run-1 is needed as the reference run'); process.exit(2); }
mkdirSync(SCRATCH, { recursive: true });
const ENV = Object.assign({}, process.env); delete ENV.ANTHROPIC_BASE_URL;

// The sibling material a copy needs: every sealed root and pin outside this package (seals/freeze/SEAL.json).
const SEAL = JSON.parse(readFileSync(join(PKG, 'seals', 'freeze', 'SEAL.json'), 'utf8'));
const EXTERNAL = [...SEAL.roots.filter((r) => r.startsWith('../') && !r.startsWith('../' + STUDY + '/')), ...SEAL.pins.map((p) => p.path).filter((p) => !p.startsWith('../' + STUDY + '/'))];
const copies = [];
function freshCopy() {
  const root = mkdtempSync(join(SCRATCH, 'rt-')); copies.push(root);
  const R = join(root, 'research'), P = join(R, NAME);
  cpSync(PKG, P, { recursive: true, filter: (src) => !new RegExp('/' + NAME.replace(/\./g, '\\.') + '/out(/|$)').test(src) });
  cpSync(join(RESEARCH, STUDY), join(R, STUDY), { recursive: true, filter: (src) => !new RegExp('/' + STUDY + '/out(/|$)').test(src) });
  for (const x of EXTERNAL) cpSync(join(PKG, x), join(P, x), { recursive: true });
  return { root, P, S: join(R, STUDY) };
}
const run = (P, args, scratch) => { mkdirSync(scratch, { recursive: true }); const r = spawnSync(process.execPath, args.map((a) => a.replace('<scratch>', scratch)), { cwd: P, env: ENV, encoding: 'utf8', timeout: 900000 }); return { status: r.status, stdout: (r.stdout || '').slice(-600), stderr: (r.stderr || '').slice(0, 1500) + '\n...\n' + (r.stderr || '').slice(-600) }; };
const results = [];
const test = async (id, name, fn) => { let r; try { r = await fn(); } catch (e) { r = { ok: false, observed: 'threw: ' + String(e && e.message).slice(0, 300) }; }
  for (const c of copies.splice(0)) rmSync(c, { recursive: true, force: true });
  results.push({ id, name, ok: !!r.ok, observed: r.observed === undefined ? null : r.observed }); console.log(id, r.ok ? 'ok' : 'FAIL', name); };
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const corrupt = (p) => { const b = readFileSync(p); b[Math.floor(b.length / 2)] ^= 0x01; writeFileSync(p, b); };
const stopped = (P, label) => readJson(join(P, 'out', label, 'RESULTS.json'));

await test('RT-01', 'an interrupted scored run leaves no results file; the same label is refused; a new label completes with the same graphs as run-1', async () => {
  const { P } = freshCopy(); const sc = join(SCRATCH, 'rt01');
  mkdirSync(sc, { recursive: true });
  const child = spawn(process.execPath, ['tools/run-scored.mjs', 'run-901', sc], { cwd: P, env: ENV, stdio: 'ignore' });
  const exited = new Promise((res) => child.on('exit', res));
  for (let w = 0; w < 200 && !existsSync(join(P, 'out', 'run-901')); w++) await new Promise((res) => setTimeout(res, 50));
  await new Promise((res) => setTimeout(res, 300)); child.kill('SIGKILL'); await exited;
  const dirLeft = existsSync(join(P, 'out', 'run-901')), resultsLeft = existsSync(join(P, 'out', 'run-901', 'RESULTS.json'));
  const again = run(P, ['tools/run-scored.mjs', 'run-901', '<scratch>'], join(SCRATCH, 'rt01b'));
  const fresh = run(P, ['tools/run-scored.mjs', 'run-902', '<scratch>'], join(SCRATCH, 'rt01c'));
  const a = readJson(join(P, 'out', 'run-902', 'RESULTS.json')), ref = readJson(join(PKG, 'out', 'run-1', 'RESULTS.json'));
  const refMap = new Map((ref ? ref.rows : []).map((r) => [r.arm + '/' + r.id, r.graph_digest]));
  const same = a ? a.rows.filter((r) => r.graph_digest && refMap.get(r.arm + '/' + r.id) === r.graph_digest).length : 0, comparable = a ? a.rows.filter((r) => r.graph_digest).length : 0;
  return { ok: dirLeft && !resultsLeft && again.status === 2 && /output exists/.test(again.stderr) && fresh.status === 0 && a && comparable > 0 && same === comparable,
    observed: { interrupted_dir_left: dirLeft, interrupted_results_left: resultsLeft, same_label_exit: again.status, new_label_exit: fresh.status, digests_equal_to_run1: same + '/' + comparable } };
});
await test('RT-02', 'a corrupted record stops a scored run before execution (study corpus seal)', () => {
  const { P, S } = freshCopy(); corrupt(join(S, 'records', 'synthetic', 'S-050.txt'));
  const r = run(P, ['tools/run-scored.mjs', 'run-903', '<scratch>'], join(SCRATCH, 'rt02')); const o = stopped(P, 'run-903');
  return { ok: r.status === 3 && o && o.stopped_before_execution && o.problems.some((p) => /S-050/.test(p)), observed: { exit: r.status, problems: o && o.problems } };
});
await test('RT-03', 'a corrupted mock candidate stops a scored run before execution (freeze seal)', () => {
  const { P } = freshCopy(); corrupt(join(P, 'mocks-v2', 'ORACLE', 'S-001.json'));
  const r = run(P, ['tools/run-scored.mjs', 'run-904', '<scratch>'], join(SCRATCH, 'rt03')); const o = stopped(P, 'run-904');
  return { ok: r.status === 3 && o && o.problems.some((p) => /mocks-v2\/ORACLE\/S-001\.json/.test(p)), observed: { exit: r.status, problems: o && o.problems } };
});
await test('RT-04', 'an altered candidate file stops a scored run before execution and fails an unscored tool at isolation', () => {
  const { P } = freshCopy(); const f = join(P, 'candidate', 'lib', 'engine-evidence-graph-v0.3.4-research-candidate', 'research-profile.mjs'); writeFileSync(f, readFileSync(f, 'utf8') + '\n// altered\n');
  const r1 = run(P, ['tools/run-scored.mjs', 'run-905', '<scratch>'], join(SCRATCH, 'rt04a')); const o1 = stopped(P, 'run-905');
  const r2 = run(P, ['tools/regression-probes-v2.mjs', '0.3.4-research-candidate', '<scratch>'], join(SCRATCH, 'rt04b'));
  return { ok: r1.status === 3 && o1 && o1.problems.some((p) => /research-profile\.mjs/.test(p)) && r2.status !== 0 && /isolated_copy_mismatch/.test(r2.stderr),
    observed: { scored_exit: r1.status, scored_problems: o1 && o1.problems, probes_exit: r2.status, probes_error: (/isolated_copy_mismatch[^\n]*/.exec(r2.stderr) || [null])[0] } };
});
await test('RT-05', 'a missing freeze seal stops a scored run and a variant run before execution', () => {
  const { P } = freshCopy(); rmSync(join(P, 'seals', 'freeze'), { recursive: true, force: true });
  const r = run(P, ['tools/run-scored.mjs', 'run-906', '<scratch>'], join(SCRATCH, 'rt05a')); const o = stopped(P, 'run-906');
  const r2 = run(P, ['tools/run-variants-v2.mjs', 'vrun-906', '<scratch>'], join(SCRATCH, 'rt05b')); const o2 = stopped(P, 'vrun-906');
  return { ok: r.status === 3 && o && o.problems.some((p) => /freeze/.test(p)) && r2.status === 3 && o2 && o2.problems.some((p) => /freeze/.test(p)), observed: { exit: [r.status, r2.status], problems: [o && o.problems, o2 && o2.problems] } };
});
await test('RT-06', 'a corrupted variant file stops a variant run before execution', () => {
  const { P } = freshCopy(); corrupt(join(P, 'variants-v2', 'VARIANTS_V2.jsonl'));
  const r = run(P, ['tools/run-variants-v2.mjs', 'vrun-907', '<scratch>'], join(SCRATCH, 'rt06')); const o = stopped(P, 'vrun-907');
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
  const { P } = freshCopy(); mkdirSync(join(P, 'out', 'run-908'), { recursive: true });
  const r = run(P, ['tools/run-scored.mjs', 'run-908', '<scratch>'], join(SCRATCH, 'rt09'));
  return { ok: r.status === 2 && /output exists/.test(r.stderr), observed: { exit: r.status } };
});
await test('RT-10', 'the offline transport suite passes in a fresh copy (journal corruption, resume, duplicates, budget, stale authorization)', () => {
  const { P } = freshCopy(); const r = run(P, ['tools/transport/test-transport.mjs'], join(SCRATCH, 'rt10')); const o = readJson(join(P, 'out', 'transport', 'RESULTS.json'));
  return { ok: r.status === 0 && o && o.totals.failed === 0 && o.totals.passed === 49 && o.network_attempts === 0, observed: o && o.totals };
});
await test('RT-11', 'an altered study scoring file stops a scored run before execution (study freeze seal)', () => {
  const { P, S } = freshCopy(); const f = join(S, 'tools', 'scoring.mjs'); writeFileSync(f, readFileSync(f, 'utf8') + '\n// altered\n');
  const r = run(P, ['tools/run-scored.mjs', 'run-909', '<scratch>'], join(SCRATCH, 'rt11')); const o = stopped(P, 'run-909');
  return { ok: r.status === 3 && o && o.problems.some((p) => /study freeze: modified tools\/scoring\.mjs/.test(p)), observed: { exit: r.status, problems: o && o.problems } };
});
await test('RT-12', 'an altered study freeze manifest stops a scored run before execution (pin and study seal)', () => {
  const { P, S } = freshCopy(); const f = join(S, 'seals', 'freeze', 'MANIFEST_SHA256.txt'); writeFileSync(f, readFileSync(f, 'utf8') + '# altered\n');
  const r = run(P, ['tools/run-scored.mjs', 'run-910', '<scratch>'], join(SCRATCH, 'rt12')); const o = stopped(P, 'run-910');
  return { ok: r.status === 3 && o && o.problems.some((p) => /pin mismatch/.test(p)) && o.problems.some((p) => /study freeze: manifest hash mismatch/.test(p)), observed: { exit: r.status, problems: o && o.problems } };
});
await test('RT-13', 'the live-preflight authorization draft is refused as written, and the transport ships with live dispatch disabled', () => {
  const d = JSON.parse(readFileSync(join(PKG, 'authorization', 'LIVE_PREFLIGHT_AUTHORIZATION_DRAFT.json'), 'utf8'));
  const src = readFileSync(join(PKG, 'tools', 'transport', 'sender.mjs'), 'utf8');
  const unsigned = d.signed_by === null && d.signed_at_utc === null && d.model_identifier === null && d.spend_cap_usd === null && d.credential_variable_name === null && d.retention_confirmed_by_owner === false;
  return { ok: unsigned && /LIVE_DISPATCH_ENABLED\s*=\s*false/.test(src) && !/LIVE_DISPATCH_ENABLED\s*=\s*true/.test(src), observed: { unsigned, refusal_reasons: d.refusal_reasons.length, live_dispatch_disabled: /LIVE_DISPATCH_ENABLED\s*=\s*false/.test(src) } };
});
const out = { results_format: 'jrs-0.3.4-recovery/2.0.0', derived_from: 'research/study-156-2026-10-27/post-freeze/recovery-tests-v1.1.mjs (HF-01 corrections kept)', network_attempts_parent: attempts.length,
  totals: { tests: results.length, passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length }, results };
mkdirSync(dirname(OUTF), { recursive: true });
writeFileSync(OUTF, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals), 'network', attempts.length);

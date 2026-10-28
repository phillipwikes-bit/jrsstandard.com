// Study continuation (0.3.5), ported from study-completion-0.3.4-2026-10-28: rehearsal of the enabling step, offline. In a symlinked mirror where the ONLY change is the
// dispatch flag line of the sender (false to true), the real command (tools/live/run-live.mjs) runs end to end with
// a preloaded mock fetch: the preload installs the network guard first and then supplies scripted responses marked
// MOCK, so nothing can leave the machine. The credential is a test sentinel in the child's environment. Negative
// rehearsals: any other change to the sender, an authorization or run directory inside the repository, the base-URL
// variable present, and the unflipped command. No repository file is modified: out/ and results/ are fresh folders in
// the mirror, and ER-09 checks the repository's results/ before and after (CORRECTIONS C-10).
// Writes out/ENABLE_REHEARSAL.json. Exits 1 if any rehearsal does not behave as expected.
// Usage: node tools/live/rehearse-enable.mjs <scratch>
import { attempts } from '../guard.mjs';
import { mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync, symlinkSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR, ROOT, STATUS, readJson, writeJson, shaFile } from '../common.mjs';
import { makeDraft } from '../build-plan.mjs';
import { MOCK_NOTE } from './score-live-v2.mjs';
import { relabel } from '../../../engine-repair-0.3.4-2026-10-27/tools/lib.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: rehearse-enable.mjs <scratch>'); process.exit(2); }
rmSync(SCRATCH, { recursive: true, force: true }); mkdirSync(SCRATCH, { recursive: true });
const SENTINEL = 'TEST-SENTINEL-NOT-A-CREDENTIAL-0000000000';
const plan = readJson(join(DIR, 'protocol', 'LIVE_RUN_PLAN.json'));
const senderRel = 'tools/live/sender-bound.mjs';
const original = readFileSync(join(DIR, senderRel), 'utf8');
const flipped = original.replace('export const LIVE_DISPATCH_ENABLED = false;', 'export const LIVE_DISPATCH_ENABLED = true;');

function mirror(root, text) {
  const target = ['research', 'study-continuation-0.3.5-2026-10-28', 'tools', 'live', 'sender-bound.mjs'];
  const build = (real, fake, depth) => { mkdirSync(fake, { recursive: true });
    for (const n of readdirSync(real)) { if (n === '.git') continue;
      if (depth < target.length - 1 && n === target[depth]) { build(join(real, n), join(fake, n), depth + 1); continue; }
      if (depth === target.length - 1 && n === target[depth]) { writeFileSync(join(fake, n), text); continue; }
      // The folders the tools write. A link to results/ once carried a rehearsal's output into the repository (C-10).
      if (depth === 2 && (n === 'out' || n === 'results')) { mkdirSync(join(fake, n)); continue; }
      symlinkSync(join(real, n), join(fake, n)); } };
  rmSync(root, { recursive: true, force: true }); build(ROOT, root, 0);
  return join(root, 'research', 'study-continuation-0.3.5-2026-10-28');
}
// Preload: the network guard first, then a mock fetch with the three PRE responses (scripted proposals, marked MOCK).
const mocks = ['S-001', 'S-003', 'S-008'].map((id) => JSON.parse(readFileSync(join(ROOT, 'research', 'engine-repair-0.3.4-2026-10-27', 'mocks-v2', 'ORACLE-R', id + '.json'), 'utf8')).envelope.content[0].text).map((t) => relabel(t, 'jrs-engine-local-0.3.5-research/prompt-1'));   // relabelled to the 0.3.5 prompt version
const preload = join(SCRATCH, 'preload-mock-fetch.mjs');
writeFileSync(preload, "import { installNetGuard, attempts } from '" + join(ROOT, 'research', 'validation-readiness-gate-v0-2026-10-25', 'tools', 'harness', 'net-guard.mjs') + "';\n"
  + 'installNetGuard();\nconst M = ' + JSON.stringify(mocks) + ';\nlet n = 0;\nglobalThis.__mockCalls = [];\n'
  + 'globalThis.fetch = async (url, init) => { globalThis.__mockCalls.push(url); if (url !== "https://api.anthropic.com/v1/messages" || init.redirect !== "error") throw new Error("unexpected request"); const text = M[n++ % M.length];\n'
  + '  const body = { id: "msg_mock", type: "message", role: "assistant", model: "claude-haiku-5-5", content: [{ type: "text", text }], stop_reason: "end_turn", stop_details: null, usage: { input_tokens: 1500, output_tokens: 600 }, mock_note: ' + JSON.stringify(MOCK_NOTE) + ' };\n'
  + '  return { status: 200, headers: { get: (h) => (h === "request-id" ? "req_mock_" + n : null) }, text: async () => JSON.stringify(body) }; };\n'
  + 'process.on("exit", () => { if (attempts.length) { console.error("NETWORK ATTEMPTS " + attempts.length); process.exitCode = 9; } });\n');
const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_/.test(k)));
function fixture(runDir, over = {}) { const p = join(SCRATCH, 'auth-' + Math.random().toString(36).slice(2) + '.json');
  writeFileSync(p, JSON.stringify(Object.assign(makeDraft(plan), { authorization_id: 'TEST-REHEARSAL-NOT-AN-AUTHORIZATION', phases_authorized: ['PRE'], expiry_utc: '2099-01-01T00:00:00.000Z', retention_location: runDir,
    provider_retention_confirmed: 'TEST FIXTURE', stop_rules_approved: true, owner_signature: 'TEST FIXTURE', signed_at_utc: '2026-10-28T00:00:00.000Z' }, over), null, 2)); return p; }
function cmd(md, args, env = {}, pre = preload) { const r = spawnSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', '--import', 'file://' + pre, join(md, 'tools', 'live', 'run-live.mjs'), ...args],
  { env: Object.assign({}, baseEnv, { JRS_STUDY_ANTHROPIC_KEY: SENTINEL }, env), encoding: 'utf8', timeout: 600000 }); return { status: r.status, stdout: r.stdout || '', stderr: (r.stderr || '').slice(-400) }; }

const R = [];
const md = mirror(join(SCRATCH, 'mirror-flipped'), flipped);
const runDir = join(SCRATCH, 'run'); mkdirSync(runDir, { recursive: true });
const ok = cmd(md, ['--authorization', fixture(runDir), '--run-dir', runDir, '--scratch', join(SCRATCH, 's1')]);
let parsed = null; try { parsed = JSON.parse(ok.stdout); } catch { parsed = null; }
const caps = existsSync(join(runDir, 'captures')) ? readdirSync(join(runDir, 'captures')) : [];
const leaked = [join(runDir, 'JOURNAL.jsonl'), ...caps.map((n) => join(runDir, 'captures', n))].filter((p) => existsSync(p) && readFileSync(p, 'utf8').includes(SENTINEL));
R.push({ id: 'ER-01', name: 'flag flipped in a mirror: the real command runs PRE end to end on mock responses and the PRE gate passes', ok: ok.status === 0 && parsed && parsed.stopped === null && parsed.requests === 3 && parsed.phases[0].gate.passed && caps.length === 3 && leaked.length === 0, observed: { status: ok.status, stopped: parsed && parsed.stopped, captures: caps.length, leaked: leaked.length, stderr: ok.stderr } });
const sc = spawnSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', join(md, 'tools', 'live', 'score-live-v2.mjs'), runDir, join(SCRATCH, 's2'), '--mock'], { env: baseEnv, encoding: 'utf8' });
R.push({ id: 'ER-02', name: 'the scorer scores the rehearsal run only as MOCK and refuses to score it as real', ok: sc.status === 0 && /^MOCK scored/.test(sc.stdout.trim()) && spawnSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', join(md, 'tools', 'live', 'score-live-v2.mjs'), runDir, join(SCRATCH, 's3')], { env: baseEnv, encoding: 'utf8' }).status === 3, observed: sc.stdout.trim().slice(0, 200) });
const again = cmd(md, ['--authorization', fixture(runDir), '--run-dir', runDir, '--scratch', join(SCRATCH, 's4')]);
let p2 = null; try { p2 = JSON.parse(again.stdout); } catch { p2 = null; }
R.push({ id: 'ER-03', name: 'running the same authorization again resends nothing (every request already complete)', ok: again.status === 0 && !!(p2 && p2.phases[0]) && p2.phases[0].tally.skippedDone === 3 && p2.phases[0].tally.sent === 0, observed: p2 ? (p2.phases[0] ? p2.phases[0].tally : p2.stopped) : again.stderr });
const md2 = mirror(join(SCRATCH, 'mirror-changed'), flipped.replace('const sha = (s) =>', 'const sha = (s) /* changed */ =>'));
const changed = cmd(md2, ['--authorization', fixture(join(SCRATCH, 'run2')), '--run-dir', join(SCRATCH, 'run2'), '--scratch', join(SCRATCH, 's5')]);
R.push({ id: 'ER-04', name: 'any change to the sender besides the flag line stops the command before any request', ok: changed.status === 3 && /file differs from the plan: sender/.test(changed.stderr), observed: changed.stderr.slice(-160) });
const authInRepo = cmd(md, ['--authorization', join(md, 'authorization', 'LIVE_AUTHORIZATION_DRAFT.json'), '--run-dir', join(SCRATCH, 'run3'), '--scratch', join(SCRATCH, 's6')]);
R.push({ id: 'ER-05', name: 'an authorization file inside the repository is refused', ok: authInRepo.status === 3 && /outside the repository/.test(authInRepo.stderr), observed: authInRepo.stderr.slice(-160) });
const runInRepo = cmd(md, ['--authorization', fixture(join(md, 'captures')), '--run-dir', join(md, 'captures'), '--scratch', join(SCRATCH, 's7')]);
R.push({ id: 'ER-06', name: 'a run directory inside the repository is refused', ok: runInRepo.status === 3 && /capture_location_inside/.test(runInRepo.stderr), observed: runInRepo.stderr.slice(-160) });
const baseUrl = cmd(md, ['--authorization', fixture(join(SCRATCH, 'run4')), '--run-dir', join(SCRATCH, 'run4'), '--scratch', join(SCRATCH, 's8')], { ANTHROPIC_BASE_URL: 'https://example.invalid' });
R.push({ id: 'ER-07', name: 'the command refuses to start while ANTHROPIC_BASE_URL is set', ok: baseUrl.status === 3 && /ANTHROPIC_BASE_URL/.test(baseUrl.stderr), observed: baseUrl.stderr.slice(-160) });
const real = spawnSync(process.execPath, [join(DIR, 'tools', 'live', 'run-live.mjs'), '--authorization', 'x', '--run-dir', 'y', '--scratch', 'z'], { env: baseEnv, encoding: 'utf8' });
R.push({ id: 'ER-08', name: 'the repository command, unflipped, refuses (exit 4)', ok: real.status === 4, observed: real.status });
// ER-09 repeats the incident in CORRECTIONS C-10: a rehearsal run whose only request fails with a network error, so no
// capture exists, is scored as real. Its output must stay in the mirror and the repository's results/ must not change.
const failingPreload = join(SCRATCH, 'preload-failing-fetch.mjs');
writeFileSync(failingPreload, "import { installNetGuard, attempts } from '" + join(ROOT, 'research', 'validation-readiness-gate-v0-2026-10-25', 'tools', 'harness', 'net-guard.mjs') + "';\n"
  + 'installNetGuard();\nglobalThis.fetch = async () => { throw new TypeError("fetch failed"); };\n'
  + 'process.on("exit", () => { if (attempts.length) { console.error("NETWORK ATTEMPTS " + attempts.length); process.exitCode = 9; } });\n');
const snapshot = (d) => JSON.stringify(existsSync(d) ? readdirSync(d).sort().map((n) => [n, statSync(join(d, n)).mtimeMs, shaFile(join(d, n))]) : []);
const resultsBefore = snapshot(join(DIR, 'results'));
const runF = join(SCRATCH, 'run-failing'); mkdirSync(runF, { recursive: true });
const failing = cmd(md, ['--authorization', fixture(runF), '--run-dir', runF, '--scratch', join(SCRATCH, 's9')], {}, failingPreload);
let pf = null; try { pf = JSON.parse(failing.stdout); } catch { pf = null; }
const asReal = spawnSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', join(md, 'tools', 'live', 'score-live-v2.mjs'), runF, join(SCRATCH, 's10')], { env: baseEnv, encoding: 'utf8' });
const inMirror = join(md, 'results', 'LIVE_RESULTS.json');
const resultsChanged = snapshot(join(DIR, 'results')) !== resultsBefore;
R.push({ id: 'ER-09', name: 'a failed rehearsal run scored as real writes only inside the mirror; the repository results/ is unchanged (C-10)', ok: !!(pf && pf.stopped) && asReal.status === 0 && existsSync(inMirror) && !resultsChanged,
  observed: { stopped: pf && pf.stopped, score_exit: asReal.status, written_in_mirror: existsSync(inMirror), repository_results_changed: resultsChanged, output_sha256: existsSync(inMirror) ? shaFile(inMirror) : null } });

const failed = R.filter((r) => !r.ok);
writeJson(join(DIR, 'out', 'ENABLE_REHEARSAL.json'), { results_format: 'jrs-study-continuation-enable-rehearsal/1.0.0', ...STATUS, network_attempts: attempts.length,
  statement: 'Offline rehearsal of the enabling step in a mirror; mock responses marked MOCK; the network guard was installed in every child before the mock fetch; a test sentinel stood in for the credential. out/ and results/ are fresh folders in the mirror; ER-09 checks that the repository results/ is unchanged.', totals: { rehearsals: R.length, passed: R.length - failed.length }, results: R });
for (const r of R) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.id + ' ' + r.name + (r.ok ? '' : '  observed: ' + JSON.stringify(r.observed).slice(0, 400)));
console.log('enable rehearsal: ' + (R.length - failed.length) + ' of ' + R.length + ' passed; network attempts ' + attempts.length);
process.exit(failed.length || attempts.length ? 1 : 0);

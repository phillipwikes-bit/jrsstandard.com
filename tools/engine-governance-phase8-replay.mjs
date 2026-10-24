#!/usr/bin/env node
// JRS PHASE 8: whole-worktree replay of the earlier Engine suites under cross-package governance.
//
//   env -u ANTHROPIC_BASE_URL node tools/engine-governance-phase8-replay.mjs [--record] [--only <package-id>,...]
//
// Verifies every registered package against its recorded manifest, runs each earlier
// suite unchanged in a child process, verifies the packages again, and classifies every
// failing check against the compatibility manifest. Earlier suites are never edited,
// skipped or patched. Offline: refuses provider configuration; no network.
// Exit 0 only when every failing check is a declared compatibility condition.

import { detectProviderConfiguration, installNetworkTrap } from '../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();

const { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } = await import('node:fs');
const { join } = await import('node:path');
const { spawnSync, execFileSync } = await import('node:child_process');
const { fileURLToPath } = await import('node:url');
const { PACKAGES, verifyPackage, parseManifestText, sha256, BASELINE_COMMIT: BASELINE } = await import('../lib/engine-governance-phase8/registry.mjs');
const { SUITES, classifyRun, parseSuiteOutput, LANGUAGE_RULE } = await import('../lib/engine-governance-phase8/governance.mjs');

const { mkdtempSync, rmSync, copyFileSync, statSync } = await import('node:fs');
const { tmpdir } = await import('node:os');
const { dirname } = await import('node:path');
const { deriveComposition, dualContext, dualContextPhase8, classifyPhase8Scope, validateLaterRegistry, ownsLater, laterCompatibilityContext, buildCompatibilityReport } = await import('../lib/engine-governance-phase8/later-packages.mjs');
const { planIsolatedReplay, contaminationCheck, REPLAYS } = await import('../lib/engine-governance-phase8/isolated-replay.mjs');
const REPO = fileURLToPath(new URL('../', import.meta.url));
const P8 = join(REPO, 'research/engine-governance-phase8-2026-10-19');
const MAN = join(P8, 'registry/manifests');

export function verifyAll(root = REPO, manDir = MAN) {
  return PACKAGES.map((p) => { const f = join(manDir, p.id + '.sha256'); return verifyPackage(root, p, existsSync(f) ? readFileSync(f, 'utf8') : '', null); });
}
export function untrackedFiles(root = REPO) { return execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean); }
export function phase6Set(manDir = MAN) { return new Set(parseManifestText(readFileSync(join(manDir, 'phase6-reliability.sha256'), 'utf8')).map((r) => r.path)); }
export const loadManifest = () => JSON.parse(readFileSync(join(P8, 'governance/COMPATIBILITY_MANIFEST.json'), 'utf8'));

function runSuite(suite, extraEnv = {}) {
  const env = Object.assign(Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_|API_KEY/i.test(k))), extraEnv);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [suite], { cwd: REPO, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const out = (r.stdout || '') + (r.stderr ? '\n[stderr]\n' + r.stderr : '');
  return Object.assign(parseSuiteOutput(r.stdout), { exit_code: r.status, duration_ms: Date.now() - t0, output_sha256: 'sha256:' + sha256(out), _out: out });
}

// Isolated historical replay: a temporary clone outside the repository holding the baseline commit plus only the
// recorded manifests the plan names. Later packages are never copied. The clone is deleted afterwards.
export function isolatedReplay(pkg) {
  const manifests = Object.fromEntries(PACKAGES.map((p) => [p.id, existsSync(join(MAN, p.id + '.sha256')) ? readFileSync(join(MAN, p.id + '.sha256'), 'utf8') : '']));
  const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', BASELINE], { cwd: REPO, encoding: 'utf8' }).trim().split('\n'));
  const plan = planIsolatedReplay(pkg, manifests, tracked);
  if (!plan.ok) return { package: pkg, refused: plan.refusal };
  const dir = mkdtempSync(join(tmpdir(), 'p8-iso-'));
  const g = (a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    execFileSync('git', ['clone', '--quiet', '--no-hardlinks', REPO, dir], { stdio: ['ignore', 'pipe', 'pipe'] });
    if (g(['rev-parse', 'HEAD']).trim() !== BASELINE) return { package: pkg, refused: 'clone is not at the baseline commit' };
    g(['branch', 'claude/engine-assurance-2026-10-10', 'origin/claude/engine-assurance-2026-10-10']);
    for (const f of plan.files) {
      const src = join(REPO, f.path);
      if (!existsSync(src) || sha256(readFileSync(src)) !== f.sha256) return { package: pkg, refused: 'recorded file missing or changed: ' + f.path };
      mkdirSync(dirname(join(dir, f.path)), { recursive: true }); copyFileSync(src, join(dir, f.path));
    }
    const untrackedClone = g(['ls-files', '--others', '--exclude-standard']).trim().split('\n').filter(Boolean);
    const cc = contaminationCheck(plan, untrackedClone);
    if (!cc.clean) return { package: pkg, refused: 'isolation not established', contamination: cc };
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_|API_KEY/i.test(k)));
    const t0 = new Date().toISOString();
    const r = spawnSync(process.execPath, [plan.command], { cwd: dir, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
    const parsed = parseSuiteOutput(r.stdout);
    return Object.assign({ package: pkg, command: 'node ' + plan.command, environment: 'temporary clone at ' + BASELINE.slice(0, 7) + ' plus recorded manifests of ' + (plan.untracked_dependencies.join(', ') || 'no untracked package'),
      untracked_files_in_clone: untrackedClone.length, later_packages_present: false, contamination: cc, started_at: t0, finished_at: new Date().toISOString(), exit_code: r.status,
      output_sha256: 'sha256:' + sha256((r.stdout || '') + (r.stderr || '')) }, parsed);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv.includes('--isolated')) {
  const ii = process.argv.indexOf('--isolated'); const list = (process.argv[ii + 1] || '').split(',').filter((x) => REPLAYS[x]);
  const replays = [];
  for (const pkg of list) { console.log('isolated replay ' + pkg); const r = isolatedReplay(pkg); replays.push(r); console.log('  ' + (r.refused ? 'REFUSED: ' + r.refused : r.passed + '/' + r.total + ', failed: ' + (r.failed_checks.join(' | ') || 'none'))); }
  const cleaned = !readdirSync(tmpdir()).some((f) => f.startsWith('p8-iso-'));
  const rec = { record_type: 'jrs-phase8-1-isolated-replay/1.0.0', status_lines: ['LOCAL ENGINEERING MATERIAL ONLY', 'INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED', 'NO_GO_NOT_VERIFIED REMAINS IN EFFECT'],
    command: 'env -u ANTHROPIC_BASE_URL node tools/engine-governance-phase8-replay.mjs --isolated ' + list.join(',') + (process.argv.includes('--record') ? ' --record' : ''), baseline_commit: BASELINE, temporary_copies_deleted: cleaned, network_attempts: trap.count(), replays };
  if (process.argv.includes('--record')) { mkdirSync(join(P8, 'execution-record'), { recursive: true }); writeFileSync(join(P8, 'execution-record/ISOLATED_REPLAY_RECORD.json'), JSON.stringify(rec, null, 2) + '\n'); }
  process.exit(replays.some((r) => r.refused || r.failed) || !cleaned || trap.count() ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && !process.argv.includes('--isolated')) {
  const oi = process.argv.indexOf('--only'); const only = oi > 0 ? process.argv[oi + 1].split(',') : null;
  const before = verifyAll();
  const run = { started_at: new Date().toISOString(), suites: {} };
  for (const [pid, suite] of Object.entries(SUITES)) {
    if (only && !only.includes(pid)) continue;
    console.log('running ' + suite);
    run.suites[pid] = runSuite(suite);
    console.log('  ' + (run.suites[pid].complete ? run.suites[pid].passed + '/' + run.suites[pid].total + ', failed: ' + (run.suites[pid].failed_checks.join(' | ') || 'none') : 'INCOMPLETE'));
  }
  const after = verifyAll();
  const untracked = untrackedFiles();
  const laterReg = existsSync(join(P8, 'governance/LATER_PACKAGE_REGISTRY.json')) ? JSON.parse(readFileSync(join(P8, 'governance/LATER_PACKAGE_REGISTRY.json'), 'utf8')) : null;
  // Phase 8.3: the compatibility-manifest classifier places paths outside the statically registered packages through the
  // later-package registry (validated here); without a valid registry every such path stays package_outside_registry.
  const { registryContext } = await import('../research/engine-governance-phase8-2026-10-19/governance/build-later-registry.mjs');
  const rc = registryContext(REPO);
  const regProblems = laterReg ? validateLaterRegistry(laterReg, Object.assign({}, rc, { filesByPackage: Object.fromEntries(laterReg.packages.map((e) => [e.package_id, untracked.filter((f) => ownsLater(e, f))])) })) : ['missing registry'];
  const later = laterCompatibilityContext(untracked, { registry: laterReg, registryProblems: regProblems, packageStates: rc.packageStates, mtimeOf: (f) => statSync(join(REPO, f)).mtimeMs });
  const cls = classifyRun(run, { manifest: loadManifest(), untracked, phase6Files: phase6Set(), verification: after, later });
  const composition = laterReg ? deriveComposition(run, { registry: laterReg, untracked, phase6Files: phase6Set(), verification: after }) : { verdict: 'fail_closed', items: [{ classification: 'missing_registry' }], conditions: [], fail_closed_items: 1 };
  const isoRec = existsSync(join(P8, 'execution-record/ISOLATED_REPLAY_RECORD.json')) ? JSON.parse(readFileSync(join(P8, 'execution-record/ISOLATED_REPLAY_RECORD.json'), 'utf8')) : null;
  const vreg = JSON.parse(readFileSync(join(P8, 'registry/VERSION_REGISTRY.json'), 'utf8'));
  const unchangedDuringRun = before.every((b, i) => b.ok && after[i].ok && b.package_sha256 === after[i].package_sha256);
  const record = { record_type: 'jrs-phase8-worktree-run/1.0.0', status_lines: ['LOCAL ENGINEERING MATERIAL ONLY', 'INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED', 'NO_GO_NOT_VERIFIED REMAINS IN EFFECT'],
    language_rule: LANGUAGE_RULE, command: 'env -u ANTHROPIC_BASE_URL node tools/engine-governance-phase8-replay.mjs --record' + (only ? ' --only ' + only.join(',') : ''),
    node: process.version, repository_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim(), started_at: run.started_at, finished_at: new Date().toISOString(),
    packages_verified_before: before.map((v) => ({ package: v.package, ok: v.ok, package_sha256: v.package_sha256 })), packages_unchanged_by_run: unchangedDuringRun,
    untracked_file_count: untracked.length,
    suites: Object.fromEntries(Object.entries(run.suites).map(([k, v]) => [k, { suite: SUITES[k], complete: v.complete, total: v.total, passed: v.passed, failed: v.failed, failed_checks: v.failed_checks, exit_code: v.exit_code, duration_ms: v.duration_ms, output_sha256: v.output_sha256 }])),
    classification: { verdict: cls.verdict, fail_closed_items: cls.fail_closed_items, items: cls.items, suites: cls.suites },
    composition: { basis: 'governance/LATER_PACKAGE_REGISTRY.json', registry_sha256: laterReg ? laterReg.registry_sha256 : null, registry_governance_sha256: laterReg ? laterReg.governance_sha256 : null, verdict: composition.verdict, fail_closed_items: composition.fail_closed_items, items: composition.items, conditions: composition.conditions },
    dual_context: dualContext(vreg, run, composition, isoRec), network_attempts: trap.count() };
  if (!unchangedDuringRun) { record.classification.verdict = 'fail_closed'; record.classification.items.push({ classification: 'changed_protected_file', detail: 'a package changed during the run' }); }
  if (record.composition.verdict === 'fail_closed') record.classification.verdict = 'fail_closed';
  console.log('\nregistry-derived composition: ' + record.composition.verdict);
  for (const i of record.composition.items) console.log('  ' + i.classification + ': ' + [i.condition_id, i.path, i.check, i.later_package, i.package].filter(Boolean).join(' | '));
  console.log('\nverdict: ' + record.classification.verdict);
  for (const i of record.classification.items) console.log('  ' + i.classification + ': ' + [i.package, i.condition_id, i.check, i.detail, (i.files || []).join(',')].filter(Boolean).join(' | '));
  if (process.argv.includes('--record')) {
    const dir = join(P8, 'execution-record'); mkdirSync(join(dir, 'worktree-output'), { recursive: true });
    for (const [k, v] of Object.entries(run.suites)) writeFileSync(join(dir, 'worktree-output', k + '.txt'), v._out);
    writeFileSync(join(dir, 'WORKTREE_RUN_RECORD.json'), JSON.stringify(record, null, 2) + '\n');
    // Phase 8.2: Phase 8 itself as a governed historical package. Its suite runs in the whole worktree after the record
    // above exists; its own scope is classified from the registry. The historical 370/370 record is never rewritten.
    const hist = existsSync(join(P8, 'execution-record/PHASE8_HISTORICAL_RECORD.json')) ? JSON.parse(readFileSync(join(P8, 'execution-record/PHASE8_HISTORICAL_RECORD.json'), 'utf8')) : null;
    console.log('running tests/engine-governance-phase8/run.mjs (Phase 8 in the current composition)');
    const p8 = runSuite('tests/engine-governance-phase8/run.mjs', { JRS_PHASE8_SELF_RUN: '1' });
    writeFileSync(join(dir, 'worktree-output', 'phase8-governance.txt'), p8._out);
    const mrows = parseManifestText(readFileSync(join(P8, 'PHASE8_FILE_MANIFEST_SHA256.txt'), 'utf8').split('\n').filter((l) => !l.startsWith('#')).join('\n'));
    const p8Changed = mrows.filter((r) => !existsSync(join(REPO, r.path)) || sha256(readFileSync(join(REPO, r.path))) !== r.sha256).map((r) => r.path);
    const scope = classifyPhase8Scope(untracked, { registry: laterReg, registryProblems: regProblems, phase8Verification: { ok: !p8Changed.length, problems: p8Changed }, packageStates: rc.packageStates, mtimeOf: (f) => statSync(join(REPO, f)).mtimeMs });
    record.phase8_composition = { suite: 'tests/engine-governance-phase8/run.mjs', complete: p8.complete, total: p8.total, passed: p8.passed, failed: p8.failed, failed_checks: p8.failed_checks, output_sha256: p8.output_sha256,
      result: p8.complete ? p8.passed + '/' + p8.total : null, verdict: p8.complete && p8.failed === 0 && scope.verdict !== 'fail_closed' ? scope.verdict : 'fail_closed', items: scope.items, conditions: scope.conditions, changed_protected_file: p8Changed.length > 0 };
    const d8 = dualContextPhase8(hist, record.phase8_composition);
    if (d8) record.dual_context.push(d8);
    if (record.phase8_composition.verdict === 'fail_closed') record.classification.verdict = 'fail_closed';
    console.log('  ' + (record.phase8_composition.result || 'INCOMPLETE') + ', Phase 8 scope: ' + scope.verdict + (scope.conditions.length ? ' (' + scope.conditions.map((c) => c.condition_id).join(', ') + ')' : ''));
    // Phase 8.3: the six result kinds, reported separately.
    record.report = buildCompatibilityReport(record);
    const R = record.report;
    console.log('\n1. historical package results: ' + R.historical_package_results.map((x) => x.package + ' ' + x.result).join('; '));
    console.log('2. isolated replay results: ' + R.isolated_replay_results.map((x) => x.package + ' ' + (x.result || 'none')).join('; '));
    console.log('3. current-composition results: ' + R.current_composition_results.map((x) => x.package + ' ' + (x.result || 'none')).join('; '));
    console.log('4. declared composition conditions (' + R.declared_composition_conditions.length + '): ' + R.declared_composition_conditions.map((x) => x.condition_id || x.classification + ':' + x.later_package).join(', '));
    console.log('5. undeclared failures (' + R.undeclared_failures.length + ')' + R.undeclared_failures.slice(0, 10).map((x) => '\n   ' + x.classification + ': ' + [x.package, x.check, x.path, x.detail].filter(Boolean).join(' | ')).join(''));
    console.log('6. integrity failures (' + R.integrity_failures.length + ')' + R.integrity_failures.slice(0, 10).map((x) => '\n   ' + x.classification + ': ' + [x.package, x.path, x.detail].filter(Boolean).join(' | ')).join(''));
    writeFileSync(join(dir, 'WORKTREE_RUN_RECORD.json'), JSON.stringify(record, null, 2) + '\n');
  }
  process.exit(record.classification.verdict === 'fail_closed' || trap.count() ? 1 : 0);
}

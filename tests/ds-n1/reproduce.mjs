#!/usr/bin/env node
// Clean-room reproduction of DS-N1 results (Increment F).
//
// 1. Fresh `git clone` of this repository at a commit into an empty temp
//    directory, so nothing uncommitted in this checkout can leak in.
// 2. In the clone, with no install step and a minimal environment: rebuild both
//    fixture sets and confirm they match the committed bytes; run the unit tests;
//    run both harnesses (exit codes, --no-write); hash the canonical report for
//    every fixture.
// 3. Compare report hashes with tests/ds-n1/REPRO_BASELINE.json (never edited
//    here unless --write-baseline is given) and print a reproduction record.
//
// Usage: node tests/ds-n1/reproduce.mjs [commit]          default HEAD
//        node tests/ds-n1/reproduce.mjs --write-baseline   record hashes from a clean clone of HEAD
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const writeBaseline = args.includes('--write-baseline');
const commit = execFileSync('git', ['rev-parse', args.find((a) => !a.startsWith('--')) || 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const sha = (s) => createHash('sha256').update(s).digest('hex');
const work = mkdtempSync(join(tmpdir(), 'ds-n1-repro-'));
const clone = join(work, 'repo');
const env = { PATH: process.env.PATH, HOME: work };
const steps = [];

function run(script, scriptArgs = [], nodeFlags = []) {
  const r = spawnSync(process.execPath, [...nodeFlags, script, ...scriptArgs], { cwd: clone, env, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
async function step(name, fn) {
  try { steps.push({ step: name, result: 'pass', detail: await fn() }); }
  catch (e) { steps.push({ step: name, result: 'fail', detail: String(e.message).slice(-800) }); }
}

const hashes = {};
try {
  await step('fresh clone at commit', () => {
    execFileSync('git', ['clone', '--quiet', '--no-checkout', '--no-hardlinks', repo, clone], { stdio: 'pipe' });
    execFileSync('git', ['-C', clone, 'checkout', '--quiet', commit], { stdio: 'pipe' });
    return commit;
  });
  await step('fixtures regenerate byte-identical', () => {
    for (const s of ['tests/ds-n1/build-fixtures.mjs', 'tests/ds-n1/build-stress.mjs', 'tests/ds-n1/build-isolation.mjs']) {
      const r = run(s); if (r.code !== 0) throw new Error(`${s} exit ${r.code}: ${r.out}`);
    }
    const diff = execFileSync('git', ['-C', clone, 'status', '--porcelain', '--', 'tests/ds-n1/fixtures'], { encoding: 'utf8' }).trim();
    if (diff) throw new Error('rebuilt fixtures differ from committed bytes:\n' + diff);
    return 'base, stress and isolation fixtures match committed bytes';
  });
  await step('unit tests', () => {
    const r = run('tests/ds-n1/ds-n1.test.mjs', [], ['--test']);
    const summary = r.out.split('\n').filter((l) => /^# (pass|fail) /.test(l)).join('; ');
    if (r.code !== 0) throw new Error(summary || r.out);
    return summary;
  });
  await step('base harness (pre-registered criteria)', () => {
    const r = run('tests/ds-n1/eval.mjs', ['--no-write']);
    if (r.code !== 0) throw new Error(r.out);
    return 'PASS';
  });
  await step('stress harness, dev split (0 critical false-ready)', () => {
    const r = run('tests/ds-n1/eval-stress.mjs', ['--split', 'dev', '--no-write']);
    if (r.code !== 0) throw new Error(r.out);
    return 'PASS';
  });
  await step('isolation specification (each rule alone decisive)', () => {
    const r = run('tests/ds-n1/eval-isolation.mjs', ['--no-write']);
    if (r.code !== 0) throw new Error(r.out);
    return 'PASS';
  });
  await step('canonical report hash per fixture', async () => {
    const ds = await import(pathToFileURL(join(clone, 'lib/ds-n1/index.mjs')).href);
    const text = await import(pathToFileURL(join(clone, 'lib/ds-n1/text.mjs')).href);
    const AT = '2026-11-03T00:00:00Z';
    for (const [dir, set] of [['tests/ds-n1/fixtures', 'base'], ['tests/ds-n1/fixtures/stress', 'stress'], ['tests/ds-n1/fixtures/isolation', 'isolation']]) {
      for (const f of readdirSync(join(clone, dir)).filter((x) => /^[A-Z]\d{2}\.json$/.test(x)).sort()) {
        const rec = JSON.parse(readFileSync(join(clone, dir, f), 'utf8'));
        hashes[`${set}:${f.slice(0, 3)}`] = sha(text.canonical(ds.buildReport(ds.openReview(rec, { at: AT }), { generated_at: AT })));
      }
    }
    return `${Object.keys(hashes).length} reports hashed`;
  });
} finally {
  rmSync(work, { recursive: true, force: true });
}

const allPass = steps.every((s) => s.result === 'pass');
const basePath = join(repo, 'tests/ds-n1/REPRO_BASELINE.json');
let comparison;
if (writeBaseline) {
  if (!allPass) { console.log(JSON.stringify(steps, null, 2)); console.error('REFUSED: baseline not written because a step failed'); process.exit(1); }
  writeFileSync(basePath, JSON.stringify({ baseline_schema: 'ds-n1.repro-baseline/1.0', commit, node: process.version, report_sha256: hashes }, null, 2) + '\n');
  comparison = 'BASELINE WRITTEN from a clean clone; commit it so later reproductions compare against it';
} else if (existsSync(basePath)) {
  const b = JSON.parse(readFileSync(basePath, 'utf8'));
  const keys = [...new Set([...Object.keys(b.report_sha256), ...Object.keys(hashes)])].sort();
  const differing = keys.filter((k) => b.report_sha256[k] !== hashes[k]);
  comparison = { identical: differing.length === 0, baseline_commit: b.commit, reports_compared: keys.length, differing };
} else comparison = 'NO BASELINE COMMITTED';

console.log(JSON.stringify({
  repro_schema: 'ds-n1.repro-run/1.0', commit, executed_at: new Date().toISOString(),
  node: process.version, platform: process.platform, install_step: 'none',
  network: 'none used by DS-N1 (no network code in lib/ds-n1, enforced by a unit test); the clone is local',
  steps, comparison,
}, null, 2));
process.exit(allPass && (writeBaseline || comparison.identical === true) ? 0 : 1);

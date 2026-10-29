// Runs the frozen 0.3.4 package's own suites, unchanged, on 0.3.5 and 0.3.6: regression probes 2.0, the paired
// suite, the injection suite, the wording suite and the controls suite. They import the 0.3.4 harness by relative path
// and write once into that package's out/, so they run from a mirror of the repository in scratch: every entry is a
// link except the frozen package's out/ (an empty scratch folder) and its tools/harness/engines.mjs (a shim that adds
// 0.3.5 and 0.3.6 through this package's harness and delegates every other version to the frozen file). No frozen
// file is changed. Writes out/FROZEN_SUITES.json: each suite's own totals per version and the rows that differ.
// Usage: node tools/run-frozen-suites.mjs <scratch>
import '../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs';
import { attempts } from '../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs';
import { mkdirSync, rmSync, readdirSync, symlinkSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR, STATUS, writeJson, writeOut } from './common.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: run-frozen-suites.mjs <scratch>'); process.exit(2); }
const ROOT = join(DIR, '..', '..'), M = join(SCRATCH, 'mirror');
rmSync(M, { recursive: true, force: true });
const target = ['research', 'engine-repair-0.3.4-2026-10-27', 'tools', 'harness', 'engines.mjs'];
const build = (real, fake, depth) => { mkdirSync(fake, { recursive: true });
  for (const n of readdirSync(real)) {
    if (n === '.git') continue;
    if (depth === 2 && n === 'out' && real.endsWith('engine-repair-0.3.4-2026-10-27')) { mkdirSync(join(fake, n)); continue; }
    if (depth < target.length - 1 && n === target[depth]) { build(join(real, n), join(fake, n), depth + 1); continue; }
    if (depth === target.length - 1 && n === target[depth]) continue;
    symlinkSync(join(real, n), join(fake, n));
  } };
build(ROOT, M, 0);
const FROZEN = join(ROOT, 'research', 'engine-repair-0.3.4-2026-10-27', 'tools', 'harness', 'engines.mjs'), SIX = join(DIR, 'tools', 'harness', 'engines.mjs');
const MPKG = join(M, 'research', 'engine-repair-0.3.4-2026-10-27');
writeFileSync(join(MPKG, 'tools', 'harness', 'engines.mjs'), [
  '// SHIM (scratch mirror only): the frozen 0.3.4 harness plus 0.3.5 and 0.3.6 through the 0.3.6 package harness.',
  "import * as F from '" + FROZEN + "';", "import * as S from '" + SIX + "';",
  "export const PKG = '" + MPKG + "'; export const STUDY = F.STUDY;",
  "export const VERSIONS = Object.freeze({ ...F.VERSIONS, '0.3.5-research-candidate': F.VERSIONS['0.3.4-research-candidate'], '0.3.6-research-candidate': F.VERSIONS['0.3.4-research-candidate'] });",
  "const NEW = ['0.3.5-research-candidate', '0.3.6-research-candidate'];",
  'export function isolate(v, s, o) { return NEW.includes(v) ? S.isolate(v, s, o) : F.isolate(v, s, o); }',
  'export async function loadEngine(iso) { return NEW.includes(iso.version) ? S.loadEngine(iso) : F.loadEngine(iso); }', ''].join('\n'));
const SUITES = [['regression', 'tools/regression-probes-v2.mjs', 'regression-probes-v2-'], ['paired', 'tests/paired-suite.mjs', 'paired-'], ['injection', 'tests/injection-suite.mjs', 'injection-'],
  ['wording', 'tests/wording-suite.mjs', 'wording-'], ['controls', 'tests/controls-suite.mjs', 'controls-']];
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_/.test(k) && k !== 'JRS_STUDY_ANTHROPIC_KEY'));
const results = {};
for (const [name, file, prefix] of SUITES) for (const v of ['0.3.5-research-candidate', '0.3.6-research-candidate']) {
  const sc = join(SCRATCH, 'sc-' + name + '-' + v); mkdirSync(sc, { recursive: true });
  const r = spawnSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', join(MPKG, file), v, sc], { env, encoding: 'utf8', timeout: 1800000 });
  const outDir = join(MPKG, 'out', prefix + v); const files = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith('.json')) : [];
  const res = files.length ? JSON.parse(readFileSync(join(outDir, files[0]), 'utf8')) : null;
  results[name + '@' + v] = { exit: r.status, stdout_tail: (r.stdout || '').trim().split('\n').slice(-3).join(' | ').slice(0, 400), stderr_tail: (r.stderr || '').slice(-300), result: res };
  console.log(name + ' ' + v + ' exit ' + r.status + ' :: ' + results[name + '@' + v].stdout_tail.slice(0, 220));
}
// Row-level differences: every array of objects with an id-like key, compared by that key.
const rowsOf = (res) => { const out = new Map(); const walk = (o, path) => { if (Array.isArray(o)) { o.forEach((x, i) => { if (x && typeof x === 'object') { const k = x.id || x.probe || x.case && (x.case + '/' + (x.id || '')) || null; if (k) out.set(path + ':' + k + ':' + i, JSON.stringify(x)); } }); } else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (typeof v === 'object') walk(v, path + '.' + k); }; walk(res, ''); return out; };
const diffs = {};
for (const [name] of SUITES) { const a = results[name + '@0.3.5-research-candidate'].result, b = results[name + '@0.3.6-research-candidate'].result;
  if (!a || !b) { diffs[name] = 'result missing'; continue; }
  const ra = rowsOf(a), rb = rowsOf(b); const changed = [...ra.keys()].filter((k) => rb.get(k) !== ra.get(k));
  diffs[name] = { rows_compared: ra.size, rows_differing: changed.length, differing: changed.slice(0, 40).map((k) => ({ key: k, before: JSON.parse(ra.get(k)), after: rb.has(k) ? JSON.parse(rb.get(k)) : null })) }; }
const summary = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { exit: v.exit, totals: v.result && (v.result.totals || v.result.summary || null), stdout_tail: v.stdout_tail }]));
writeJson(join(DIR, 'out', 'FROZEN_SUITES.json'), { format: 'jrs-irrelevant-basis-frozen-suites/1.0.0', ...STATUS, network_attempts: attempts.length,
  statement: 'The frozen 0.3.4 suites, unchanged, run from a scratch mirror on 0.3.5 and 0.3.6. Their own pass criteria were written for 0.3.4; a difference between 0.3.5 and 0.3.6 is a behaviour change to explain, not automatically a failure.', summary, diffs });
console.log(JSON.stringify(Object.fromEntries(Object.entries(diffs).map(([k, v]) => [k, typeof v === 'string' ? v : v.rows_compared + ' rows, ' + v.rows_differing + ' differ']))));
process.exit(attempts.length ? 1 : 0);

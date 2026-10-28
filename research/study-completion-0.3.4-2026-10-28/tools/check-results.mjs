// Study completion: fail-closed verifier for the frozen suite outputs. The frozen suites (except the transport test)
// write RESULTS.json and exit 0 even when probes fail, so a green pipeline proves nothing by itself. This tool reads
// each output, checks its totals against its own rows (a hand-edited total fails), and checks each against an explicit
// expectation fixed here. Exit 1 if any expectation fails.
// Usage: node tools/check-results.mjs                          (every recorded expectation; writes reconciliation/CHECK_RESULTS.json)
//        node tools/check-results.mjs --file <path> --expect-all-pass   (one file, every probe must pass; writes nothing)
import { attempts } from './guard.mjs';
import { existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { DIR, STUDY, PKG4, readJson, rel, checker, finish, writeJson } from './common.mjs';

// Probe lists inside an output: results[], tests[] or each array under suites{}.
export function probeLists(R) {
  const lists = {};
  if (Array.isArray(R.results) && R.results.length && typeof R.results[0].ok === 'boolean') lists[''] = R.results;
  if (R.suites && typeof R.suites === 'object') for (const [k, v] of Object.entries(R.suites)) if (Array.isArray(v)) lists[k] = v;
  return lists;
}
// Totals stated in the file must equal what its rows say.
export function totalsConsistent(R, lists) {
  const p = [];
  const one = (t, rows, name) => { if (!t) return; const n = t.probes ?? t.tests, pass = t.passed, fail = Array.isArray(t.failed) ? t.failed.length : t.failed;
    if (n !== undefined && n !== rows.length) p.push(name + ':count ' + n + ' != rows ' + rows.length);
    if (pass !== undefined && pass !== rows.filter((r) => r.ok).length) p.push(name + ':passed ' + pass + ' != rows ' + rows.filter((r) => r.ok).length);
    if (fail !== undefined && fail !== rows.filter((r) => !r.ok).length) p.push(name + ':failed ' + fail + ' != rows ' + rows.filter((r) => !r.ok).length); };
  for (const [k, rows] of Object.entries(lists)) one(k ? R.totals && R.totals[k] : R.totals, rows, k || 'results');
  return p;
}
const failedIds = (rows) => rows.filter((r) => !r.ok).map((r) => r.id || r.name).sort();
const rg = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => 'RG-' + String(a + i).padStart(2, '0'));

const O4 = (f) => join(PKG4, 'out', f), OS = (f) => join(STUDY, 'out', f);
export const EXPECTATIONS = [
  { file: O4('regression-probes-v2-0.3.4-research-candidate/RESULTS.json'), list: '', failed: [] },
  { file: O4('regression-probes-v2-0.3.3-research-candidate/RESULTS.json'), list: '', failedCount: 37, mustPass: rg(1, 32), note: '0.3.3 reference run: Part 1 passes; 37 of 45 repair probes show the original behaviour' },
  { file: O4('study-suites-0.3.4-research-candidate/RESULTS.json'), list: 'research_probes_1_0', failed: [], count: 90 },
  { file: O4('study-suites-0.3.4-research-candidate/RESULTS.json'), list: 'regression_probes_1_0', failed: ['RG-23'], note: 'RG-23: stored mock carries the 0.3.3 prompt label, which 0.3.4 rejects (TC-03); see RECONCILIATION' },
  { file: O4('study-suites-0.3.4-research-candidate/RESULTS.json'), list: 'feature_probes_1_0', failed: [], count: 343 },
  { file: O4('recovery-v2/RESULTS.json'), list: '', failed: [], count: 13 },
  { file: O4('transport/RESULTS.json'), list: '', failed: [], count: 49 },
  { file: OS('regression-probes/RESULTS.json'), list: '', failed: [], count: 32 },
  { file: OS('research-probes/RESULTS.json'), list: '', failed: [], count: 89 },
  { file: OS('feature-probes/0.3.1-candidate.json'), list: '', failed: [], count: 343 },
  { file: OS('feature-probes/0.3.2-candidate.json'), list: '', failed: [], count: 343 },
  { file: OS('feature-probes/0.3.3-research-candidate.json'), list: '', failed: [], count: 343 },
  { file: OS('transport/RESULTS.json'), list: '', failed: [], count: 49 },
  { file: O4('differential-0.3.4-research-candidate/DIFFERENTIAL_DEFAULT_PATH.json'), custom: (R) => R.totals.identical === R.totals.inputs && R.totals.inputs === 310 && R.totals.different.length === 0 && !R.totals.errors_candidate },
  { file: O4('differential-0.3.3-research-candidate/DIFFERENTIAL_DEFAULT_PATH.json'), custom: (R) => R.totals.identical === R.totals.inputs && R.totals.inputs === 310 && R.totals.different.length === 0 },
  { file: O4('mutations-v2/RESULTS.json'), custom: (R) => R.totals.mutants === 66 && R.totals.invalid === 0 && R.totals.survived === 0 && R.totals.killed_by_tests + R.totals.survived_equivalent === R.totals.valid },
  { file: O4('variant-spec-v2-check/RESULTS.json'), custom: (R) => R.totals.recomputed_1_0_equals_frozen === R.totals.variants && R.totals.non_v5_different === 0 },
  { file: O4('compile-row-v2-check/RESULTS.json'), custom: (R) => Object.values(R.result).every((v) => v.compared === 624 && v.scored_fields_identical === 624 && v.differing.length === 0) },
];

export function checkOne(R, e) {
  const p = [];
  if (R.network_attempts) p.push('network_attempts:' + R.network_attempts);
  if (e.custom) { if (!e.custom(R)) p.push('custom_expectation_not_met'); return p; }
  const lists = probeLists(R), rows = lists[e.list];
  if (!rows) return ['probe_list_missing:' + (e.list || 'results')];
  p.push(...totalsConsistent(R, e.list ? { [e.list]: rows } : { '': rows }));
  const f = failedIds(rows);
  if (e.count !== undefined && rows.length !== e.count) p.push('count ' + rows.length + ' != expected ' + e.count);
  if (e.failed && JSON.stringify(f) !== JSON.stringify([...e.failed].sort())) p.push('failed ' + JSON.stringify(f) + ' != expected ' + JSON.stringify(e.failed));
  if (e.failedCount !== undefined && f.length !== e.failedCount) p.push('failed count ' + f.length + ' != expected ' + e.failedCount);
  if (e.mustPass) { const bad = e.mustPass.filter((id) => f.includes(id)); if (bad.length) p.push('must pass but failed: ' + bad.join(',')); }
  return p;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = process.argv.slice(2);
  const c = checker();
  if (args[0] === '--file') {
    const f = isAbsolute(args[1] || '') ? args[1] : join(process.cwd(), args[1] || '');
    if (!existsSync(f) || args[2] !== '--expect-all-pass') { console.error('usage: check-results.mjs --file <path> --expect-all-pass'); process.exit(2); }
    const R = readJson(f), lists = probeLists(R);
    if (!Object.keys(lists).length) c.check('probe_lists_found', false, f);
    for (const [k, rows] of Object.entries(lists)) { c.check('totals_consistent:' + (k || 'results'), totalsConsistent(R, { [k]: rows }).length === 0); c.check('all_pass:' + (k || 'results'), rows.every((r) => r.ok), failedIds(rows)); }
    finish('check-results (single file)', c);
  } else {
    const rows = EXPECTATIONS.map((e) => { const ok = existsSync(e.file); const problems = ok ? checkOne(readJson(e.file), e) : ['missing']; c.check(rel(e.file) + (e.list ? '#' + e.list : ''), problems.length === 0, problems); return { file: rel(e.file), list: e.list || null, note: e.note || null, problems }; });
    writeJson(join(DIR, 'reconciliation', 'CHECK_RESULTS.json'), { format: 'jrs-study-completion-check-results/1.0.0', network_attempts: attempts.length, statement: 'Each frozen output checked against an explicit expectation; totals checked against rows. Offline; nothing frozen was modified.', rows });
    finish('check-results', c);
  }
}

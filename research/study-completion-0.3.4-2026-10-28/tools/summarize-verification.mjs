// Study completion: one generated table of every verification result in this directory, read from the outputs the
// tools wrote. Writes reports/VERIFICATION_SUMMARY.md and .json. Exits 1 if an output is missing, reports a failure or
// records a network attempt.
// Usage: node tools/summarize-verification.mjs
import { attempts } from './guard.mjs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, STATUS, readJson, checker, finish, writeJson, writeOut, git, rel } from './common.mjs';

const c = checker();
const J = (rel) => { const p = join(DIR, rel); return existsSync(p) ? readJson(p) : null; };
const fromChecks = (o) => (o && o.checks ? { passed: o.checks.filter((x) => x.ok).length, total: o.checks.length } : null);
const rows = [];
function add(name, file, counts, network, extra = '') {
  const ok = !!counts && counts.total > 0 && counts.passed === counts.total && !network;
  c.check(name, ok, { counts, network });
  rows.push({ name, file, passed: counts ? counts.passed : null, total: counts ? counts.total : null, network_attempts: network || 0, extra });
}
const st = J('state/STATE_VERIFICATION.json'); add('State verification', 'state/STATE_VERIFICATION.json', fromChecks(st), st && st.network_attempts);
const ac = J('accounting/ACCOUNTING_156.json'); add('156-record accounting', 'accounting/ACCOUNTING_156.json', fromChecks(ac), ac && ac.network_attempts, ac ? Object.entries(ac.categories).map(([k, v]) => k + ' ' + v).join('; ') : '');
const cr = J('reconciliation/CHECK_RESULTS.json'); add('Frozen outputs against explicit expectations', 'reconciliation/CHECK_RESULTS.json', cr ? { passed: cr.rows.filter((r) => !r.problems.length).length, total: cr.rows.length } : null, cr && cr.network_attempts);
const rc = J('reconciliation/RECONCILIATION.json'); add('Reconciliation', 'reconciliation/RECONCILIATION.json', fromChecks(rc), rc && rc.network_attempts, rc ? rc.discrepancies.length + ' discrepancy recorded and corrected' : '');
const ls = J('records/LIVE_RECORD_SET.json'); add('Live request set', 'records/LIVE_RECORD_SET.json', ls ? { passed: 1, total: 1 } : null, 0, ls ? Object.entries(ls.by_phase).map(([k, v]) => k + ' ' + v).join(', ') + '; not constructible ' + ls.not_constructible.length : '');
const lt = J('out/LIVE_MACHINERY_TESTS.json'); add('Live machinery tests (mock fetch)', 'out/LIVE_MACHINERY_TESTS.json', lt && { passed: lt.totals.passed, total: lt.totals.tests }, lt && lt.network_attempts, lt ? 'live dispatch enabled: ' + lt.live_dispatch_enabled : '');
const lm = J('out/LIVE_MUTATION_TESTS.json'); add('Live machinery mutants killed', 'out/LIVE_MUTATION_TESTS.json', lm && { passed: lm.totals.killed, total: lm.totals.mutants }, lm && lm.network_attempts, lm ? 'unmutated baseline exit ' + lm.unmutated_baseline.exit : '');
const er = J('out/ENABLE_REHEARSAL.json'); add('Enabling rehearsal (mirror, mock fetch)', 'out/ENABLE_REHEARSAL.json', er && { passed: er.totals.passed, total: er.totals.rehearsals }, er && er.network_attempts);
const it = J('out/IMPORT_TESTS.json'); add('Review batches and importer tests', 'out/IMPORT_TESTS.json', it && { passed: it.totals.passed, total: it.totals.tests }, it && it.network_attempts);
const bm = J('human-review/BATCH_MANIFEST.json'); add('Review batches built', 'human-review/BATCH_MANIFEST.json', bm ? { passed: bm.batches.filter((b) => b.blind_ids.length === 11).length, total: 4 } : null, bm && bm.network_attempts, bm ? bm.batches.length + ' batches, ' + bm.batches.reduce((n, b) => n + b.blind_ids.length, 0) + ' records' : '');
const of = J('results/OFFLINE_SCRIPTED_PER_RECORD.json'); add('Offline scripted per-record results', 'results/OFFLINE_SCRIPTED_PER_RECORD.json', of ? { passed: of.records.length === 156 ? 1 : 0, total: 1 } : null, of && of.network_attempts, of ? of.records.length + ' records' : '');
const pl = J('protocol/LIVE_RUN_PLAN.json'); add('Live run plan', 'protocol/LIVE_RUN_PLAN.json', pl ? { passed: 1, total: 1 } : null, 0, pl ? 'plan_sha256 ' + pl.plan_sha256 : '');

// Figures quoted in the hand-written reports must equal the generated plan.
if (pl) {
  const { readFileSync, readdirSync } = await import('node:fs');
  const docs = ['reports', 'protocol'].flatMap((d) => readdirSync(join(DIR, d)).filter((f) => f.endsWith('.md')).map((f) => [d + '/' + f, readFileSync(join(DIR, d, f), 'utf8')]));
  const quoted = docs.flatMap(([f, t]) => [...t.matchAll(/Plan hash: `([0-9a-f]{64})`/g)].map((m) => [f, m[1]]));
  c.check('quoted_plan_hashes_equal_the_plan', quoted.length > 0 && quoted.every(([, h]) => h === pl.plan_sha256), quoted.filter(([, h]) => h !== pl.plan_sha256));
  const ph = pl.phases, typAll = (ph.PRE.typical_usd_estimate + ph.RUN.typical_usd_estimate + ph.TGT.typical_usd_estimate).toFixed(2), worstAll = (ph.PRE.worst_case_bound_usd + ph.RUN.worst_case_bound_usd + ph.TGT.worst_case_bound_usd).toFixed(2);
  const cp = (docs.find(([f]) => f === 'reports/EXECUTION_CHECKPOINT.md') || [null, ''])[1];
  c.check('checkpoint_costs_equal_the_plan', cp.includes('about $' + ph.PRE.typical_usd_estimate.toFixed(4) + ' for PRE') && cp.includes('about $' + typAll + ' for all 401 requests') && cp.includes('about $' + worstAll + '.'), { pre: ph.PRE.typical_usd_estimate, typAll, worstAll });
}
// A live result exists only after a live run, and a live run needs the dispatch flag enabled in its own commit
// (protocol section 13). A rehearsal once wrote one into results/ (CORRECTIONS C-10).
const liveResults = existsSync(join(DIR, 'results', 'LIVE_RESULTS.json'));
const enabledInHistory = !!git(['log', '--format=%h', '-G', '^export const LIVE_DISPATCH_ENABLED = true;', '--', rel(join(DIR, 'tools', 'live', 'sender-bound.mjs'))]);
c.check('no_live_results_without_dispatch_enabled_in_history', !liveResults || enabledInHistory, { live_results_present: liveResults, dispatch_enabled_in_history: enabledInHistory });
const out = { format: 'jrs-study-completion-verification-summary/1.0.0', ...STATUS, network_attempts: attempts.length, rows, checks: c.checks };
writeJson(join(DIR, 'reports', 'VERIFICATION_SUMMARY.json'), out);
writeOut(join(DIR, 'reports', 'VERIFICATION_SUMMARY.md'), ['# Verification summary', '', 'Generated by `tools/summarize-verification.mjs` from the outputs named below. Do not edit by hand. Every result is offline; no model, provider, credential or network was used.', '',
  '| Check | Passed | Of | Network attempts | Note | Output |', '|---|---|---|---|---|---|', ...rows.map((r) => '| ' + r.name + ' | ' + r.passed + ' | ' + r.total + ' | ' + r.network_attempts + ' | ' + r.extra + ' | `' + r.file + '` |'), ''].join('\n'));
finish('verification summary', c, 'network attempts ' + attempts.length);

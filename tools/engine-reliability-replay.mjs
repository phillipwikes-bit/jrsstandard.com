#!/usr/bin/env node
// JRS ENGINE RELIABILITY 0.6.0-local: differential replay and change-impact router.
//
//   env -u ANTHROPIC_BASE_URL node tools/engine-reliability-replay.mjs                 verify against the recorded baseline
//   env -u ANTHROPIC_BASE_URL node tools/engine-reliability-replay.mjs --diff A.json B.json [--context ctx.json]
//   add --json for machine-readable output.
//
// Verify mode rebuilds every behaviour record in memory from the frozen package
// replays, compares the result with research/engine-reliability-phase6-2026-10-17/
// baseline/PHASE6_BASELINE_MANIFEST.json, re-runs the sealed regression library
// and stability laboratory, and checks the knowledge register chain. Diff mode
// compares two baseline manifests. Both modes only report: this tool writes no
// file, changes no Engine version and applies no change.
//
// Refuses to start with a provider credential or endpoint configured (exit 3)
// and traps every Node network API for the whole run.
// Exit codes: 0 no behavioural difference (or presentation only) and every
// check held; 10 human review required; 11 fail closed; 2 usage or input
// error; 3 provider configuration present (nothing ran).

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectProviderConfiguration, installNetworkTrap } from '../lib/engine-assurance/network-guard.mjs';

const REPO = fileURLToPath(new URL('../', import.meta.url));
const PKG = join(REPO, 'research/engine-reliability-phase6-2026-10-17');
export const EXIT = Object.freeze({ ok: 0, usage: 2, refused: 3, review: 10, fail_closed: 11 });
const exitFor = (verdict) => (verdict === 'fail_closed' ? EXIT.fail_closed : verdict === 'human_review_required' ? EXIT.review : EXIT.ok);

export async function verify(options = {}) {
  const env = options.env || process.env;
  if (detectProviderConfiguration(env).length) return { exitCode: EXIT.refused, refused: true, message: 'REFUSED: provider configuration present; nothing was executed.' };
  const trap = installNetworkTrap();
  const t0 = process.hrtime.bigint();
  try {
    const C = await import('../lib/engine-reliability/collect.mjs');
    const B = await import('../lib/engine-reliability/baseline.mjs');
    const D = await import('../lib/engine-reliability/differ.mjs');
    const L = await import('../lib/engine-reliability/library.mjs');
    const ST = await import('../lib/engine-reliability/stability.mjs');
    const RG = await import('../lib/engine-reliability/register.mjs');
    const V = await import('../lib/engine-reliability/vocab.mjs');
    const { evaluatorSha } = await import('../lib/engine-reliability/evaluator-identity.mjs');
    const { compileEvidenceGraph } = await import('../lib/engine-evidence-graph/compiler.mjs');
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: ok ? null : detail });
    // Baseline.
    const recorded = JSON.parse(readFileSync(join(PKG, 'baseline/PHASE6_BASELINE_MANIFEST.json'), 'utf8'));
    const { records, nestedTrapped } = await C.collectExistingRecords(REPO);
    const sources = Object.fromEntries(Object.entries(V.PACKAGES).filter(([k]) => k !== 'phase6-library'));
    const current = B.buildManifest(records, { generatedClock: recorded.generated_clock, sources, knownOpenFailures: C.documentedOpenFailures(REPO), codeIdentity: C.codeIdentity(REPO) });
    const diff = D.compareManifests(recorded, current, options.context || {});
    check('baseline: current Engine behaviour matches the recorded manifest (' + diff.compared + ' scenarios)', diff.verdict === 'no_behavioral_difference', diff.verdict + ' ' + JSON.stringify(diff.counts));
    check('baseline: manifest hash reproduced', current.manifest_hash === recorded.manifest_hash, current.manifest_hash + ' vs ' + recorded.manifest_hash);
    // Regression library.
    const dir = join(PKG, 'regression-library');
    const sc = readdirSync(join(dir, 'scenarios')).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(dir, 'scenarios', f), 'utf8')));
    const sealProblems = L.verifySeal(sc, JSON.parse(readFileSync(join(dir, 'EXPECTATION_SEAL.json'), 'utf8')), evaluatorSha());
    check('library: expectation seal holds', !sealProblems.length, sealProblems.join('; '));
    const lib = L.runLibrary(sc, compileEvidenceGraph, recorded.generated_clock);
    const libRec = JSON.parse(readFileSync(join(dir, 'LIBRARY_RESULTS.json'), 'utf8'));
    check('library: results reproduce the recorded run', lib.results_hash === libRec.results_hash, lib.results_hash + ' vs ' + libRec.results_hash);
    const unexplained = lib.results.filter((r) => r.result === 'unexpected' || r.result === 'known_open_failure_not_reproduced');
    // Stability.
    const TR = await import('../research/engine-reliability-phase6-2026-10-17/stability-laboratory/transforms.mjs');
    const stab = ST.runTransforms(TR.TRANSFORMS, TR.BASES, compileEvidenceGraph, recorded.generated_clock);
    const stabRec = JSON.parse(readFileSync(join(PKG, 'stability-laboratory/STABILITY_RESULTS.json'), 'utf8'));
    check('stability: results reproduce the recorded run', stab.results_hash === stabRec.results_hash, stab.results_hash + ' vs ' + stabRec.results_hash);
    const stabUnexplained = stab.results.filter((r) => r.result === 'unexpected' || r.result === 'known_open_failure_not_reproduced');
    // Register.
    const regProblems = RG.validateRegister(readFileSync(join(PKG, 'knowledge-register/KNOWLEDGE_REGISTER.jsonl'), 'utf8'));
    check('register: hash chain and entries valid', !regProblems.length, regProblems.join('; '));
    check('isolation: no network attempt', trap.count() === 0 && Object.values(nestedTrapped).every((n) => n === 0), trap.count());
    const failedChecks = checks.filter((c) => !c.ok);
    // Anything not reproduced, any unexplained library or stability result, routes to a person; a baseline drift fails closed.
    let verdict = diff.verdict === 'fail_closed' || failedChecks.length ? 'fail_closed' : (diff.verdict === 'human_review_required' || unexplained.length || stabUnexplained.length) ? 'human_review_required' : diff.verdict;
    if (failedChecks.length) verdict = 'fail_closed';
    return { exitCode: exitFor(verdict), verdict, checks, baseline_diff: diff, library: { counts: lib.counts, routed_to_review: unexplained.map((r) => ({ id: r.scenario_id, result: r.result, mismatches: r.mismatches })) },
      stability: { total: stab.total, as_expected: stab.as_expected, routed_to_review: stabUnexplained.map((r) => r.transform_id) },
      network: { trapped_attempts: trap.count(), nested: nestedTrapped }, elapsed_ms: Number(process.hrtime.bigint() - t0) / 1e6, applies_changes: false };
  } finally { trap.restore(); }
}

export async function diffFiles(a, b, contextPath, env = process.env) {
  if (detectProviderConfiguration(env).length) return { exitCode: EXIT.refused, refused: true };
  const trap = installNetworkTrap();
  try {
    const D = await import('../lib/engine-reliability/differ.mjs');
    let A, Bm, ctx = {};
    try { A = JSON.parse(readFileSync(resolve(a), 'utf8')); Bm = JSON.parse(readFileSync(resolve(b), 'utf8')); if (contextPath) ctx = JSON.parse(readFileSync(resolve(contextPath), 'utf8')); }
    catch (e) { return { exitCode: EXIT.fail_closed, verdict: 'fail_closed', findings: [{ class: 'unknown_comparison_state', detail: 'input unreadable: ' + e.message, fail_closed: true }], applies_changes: false }; }
    const r = D.compareManifests(A, Bm, ctx);
    return Object.assign({ exitCode: exitFor(r.verdict), network: { trapped_attempts: trap.count() } }, r);
  } finally { trap.restore(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), json = a.includes('--json');
  let r;
  if (a.includes('--diff')) {
    const i = a.indexOf('--diff'); const c = a.indexOf('--context');
    if (!a[i + 1] || !a[i + 2]) { console.error('usage: --diff A.json B.json [--context ctx.json]'); process.exit(EXIT.usage); }
    r = await diffFiles(a[i + 1], a[i + 2], c > 0 ? a[c + 1] : null);
  } else r = await verify();
  if (r.refused) { console.error(r.message || 'REFUSED: provider configuration present; nothing was executed.'); process.exit(EXIT.refused); }
  if (json) console.log(JSON.stringify(r, null, 2));
  else {
    console.log('LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.');
    for (const c of r.checks || []) console.log((c.ok ? 'HOLDS ' : 'FAILS ') + c.name + (c.detail ? '\n        ' + c.detail : ''));
    if (r.library) console.log('library: ' + JSON.stringify(r.library.counts) + '; routed to review: ' + r.library.routed_to_review.map((x) => x.id + ' (' + x.result + ')').join(', '));
    if (r.stability) console.log('stability: ' + r.stability.as_expected + '/' + r.stability.total + ' as expected; routed to review: ' + (r.stability.routed_to_review.join(', ') || 'none'));
    if (r.scenarios) for (const s of r.scenarios) console.log(s.verdict.toUpperCase() + '  ' + s.scenario_id + '\n        ' + s.findings.map((f) => f.class + ': ' + f.detail).join('\n        '));
    for (const f of r.findings || []) if (!r.scenarios || !r.scenarios.length || f.class === 'unknown_comparison_state') console.log('FINDING ' + f.class + ': ' + f.detail);
    console.log('verdict: ' + r.verdict + '; network attempts trapped: ' + (r.network ? r.network.trapped_attempts : 0) + '; this tool applies no change.');
  }
  process.exit(r.exitCode);
}

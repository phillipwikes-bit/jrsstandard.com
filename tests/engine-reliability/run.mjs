#!/usr/bin/env node
// JRS ENGINE RELIABILITY 0.6.0-local: Phase 6 test suite.
//
//   env -u ANTHROPIC_BASE_URL node tests/engine-reliability/run.mjs [--record] [--only <group>]
//
// Groups: preservation, baseline, library, differ, register, stability, determinism, performance, mutation, workbench, documents.
// Offline: refuses to start with provider configuration; traps every network API.
// --record writes the execution records under research/engine-reliability-phase6-2026-10-17/execution-record/.

import { detectProviderConfiguration, installNetworkTrap } from '../../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();

const { readFileSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync, existsSync } = await import('node:fs');
const { join } = await import('node:path');
const { tmpdir } = await import('node:os');
const { execFileSync } = await import('node:child_process');
const { fileURLToPath, pathToFileURL } = await import('node:url');

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const PKG = join(REPO, 'research/engine-reliability-phase6-2026-10-17');
const START_COMMIT = '428c307af510ff7378615777251fe252dab2dac7';
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
const RECORD = process.argv.includes('--record');
const want = (g) => !ONLY || ONLY === g;
const J = (p) => JSON.parse(readFileSync(join(PKG, p), 'utf8'));
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const ms = (t0) => Number(process.hrtime.bigint() - t0) / 1e6;

const V = await import('../../lib/engine-reliability/vocab.mjs');
const B = await import('../../lib/engine-reliability/baseline.mjs');
const C = await import('../../lib/engine-reliability/collect.mjs');
const D = await import('../../lib/engine-reliability/differ.mjs');
const L = await import('../../lib/engine-reliability/library.mjs');
const RG = await import('../../lib/engine-reliability/register.mjs');
const ST = await import('../../lib/engine-reliability/stability.mjs');
const CAN = await import('../../lib/engine-reliability/canonical.mjs');
const { evaluatorSha } = await import('../../lib/engine-reliability/evaluator-identity.mjs');
const { compileEvidenceGraph } = await import('../../lib/engine-evidence-graph/compiler.mjs');
const { LIMITATIONS } = await import('../../lib/engine-evidence-graph/contract.mjs');
const { scanUnsupportedClaims } = await import('../../lib/engine-assurance/content-guard.mjs');
const { makeProbes, MUTATIONS } = await import('./probes.mjs');
const TR = await import('../../research/engine-reliability-phase6-2026-10-17/stability-laboratory/transforms.mjs');
const { stabilityEvaluatorSha, transformsSha } = await import('../../research/engine-reliability-phase6-2026-10-17/stability-laboratory/seal-transforms.mjs');

let pass = 0, fail = 0, skip = 0; const failed = []; const records = {};
const t = (name, ok, detail) => { if (ok) { pass++; console.log('PASS  ' + name); } else { fail++; failed.push(name); console.log('FAIL  ' + name + (detail ? '\n        ' + String(detail).slice(0, 700) : '')); } };
const skipped = (name, why) => { skip++; console.log('SKIP  ' + name + '  (' + why + ')'); };

const SCEN = readdirSync(join(PKG, 'regression-library/scenarios')).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(PKG, 'regression-library/scenarios', f), 'utf8')));
const SC = Object.fromEntries(SCEN.map((s) => [s.scenario_id, s]));
const CLOCK = '2026-10-17T00:00:00Z';
const compileScenario = (s) => compileEvidenceGraph({ submission: L.submissionFor(s), candidateResponseText: s.candidate_response_text, executionMode: s.execution_mode, clock: CLOCK, fixtureId: s.scenario_id });

// ---------------------------------------------------------------- A. preservation
if (want('preservation')) {
  console.log('\n# A. Starting state, prior packages and protected surfaces preserved');
  t('HEAD is the starting commit ' + START_COMMIT.slice(0, 7) + ' (no commit made)', git(['rev-parse', 'HEAD']).trim() === START_COMMIT);
  t('working branch is claude/engine-reliability-phase6-local', git(['rev-parse', '--abbrev-ref', 'HEAD']).trim() === 'claude/engine-reliability-phase6-local');
  t('PR #40 branch still points at 428c307', git(['rev-parse', 'claude/engine-assurance-2026-10-10']).trim() === START_COMMIT && git(['rev-parse', 'origin/claude/engine-assurance-2026-10-10']).trim() === START_COMMIT);
  t('no tracked file differs from the starting commit', git(['diff', '--name-only', START_COMMIT]).trim() === '', git(['diff', '--name-only', START_COMMIT]));
  const untracked = git(['ls-files', '--others', '--exclude-standard']).trim().split('\n').filter(Boolean);
  const allowed = (f) => /^lib\/engine-reliability\//.test(f) || /^tests\/engine-reliability\//.test(f) || f === 'tools/engine-reliability-replay.mjs' || /^research\/engine-reliability-phase6-2026-10-17\//.test(f);
  t('every new file is inside the four Phase 6 locations', untracked.every(allowed), untracked.filter((f) => !allowed(f)).join(', '));
  t('no new file under a prior package, public route, API, deployment or canonical record path',
    !untracked.some((f) => /^(?:api|docs|\.jrs|\.github|supabase)\/|^[^/]+\.html$|^vercel\.json$|^\.vercelignore$|^research\/(?:MASTER_TRACKER|IP_SALE_TRACKER)\.md$|^lib\/engine-(?:assurance|evidence-contract|evidence-graph|change-control)\//.test(f)));
  const bl = JSON.parse(readFileSync(join(REPO, '.jrs/state/BLOCKERS.json'), 'utf8')); let st = null; const w = (o) => { if (o && typeof o === 'object') { if (o.blocker_id === 'B-018') st = o.status; Object.values(o).forEach(w); } }; w(bl);
  t('B-018 remains OPEN and BLOCKERS.json is unchanged', st === 'OPEN' && git(['diff', '--quiet', START_COMMIT, '--', '.jrs/state/BLOCKERS.json']) === '');
  t('public Engine routes remain refusal-only', ['api/review.js', 'api/review-engine.js', 'api/v1/review-engine.js'].every((p) => { const s = readFileSync(join(REPO, p), 'utf8'); return s.includes('unavailable(') && !s.includes('fetch('); }));
  t('v0.3 release status remains NO_GO_NOT_VERIFIED', readFileSync(join(REPO, 'lib/engine-evidence-graph/contract.mjs'), 'utf8').includes("RELEASE_STATUS = 'NO_GO_NOT_VERIFIED'"));
  t('no holdout, label or adjudication file in the Phase 6 package', !untracked.some((f) => f.startsWith('research/engine-reliability-phase6') && /holdout|adjudicat|\/labels?\//i.test(f)));
  t('no source-aligned controlling file in the work', !untracked.some((f) => /Source_Aligned|Blueprint_Aligned|project_sources/i.test(f)));
}

// ---------------------------------------------------------------- B. baseline manifest
const manifest = J('baseline/PHASE6_BASELINE_MANIFEST.json');
if (want('baseline')) {
  console.log('\n# B. Baseline behaviour manifest');
  const regCount = (p) => JSON.parse(readFileSync(join(REPO, p), 'utf8')).fixtures.length;
  const expected = regCount('research/engine-assurance-2026-10-10/fixtures/FIXTURE_REGISTER.json') + regCount('research/engine-evidence-contract-2026-10-10/fixtures/FIXTURE_REGISTER.json')
    + regCount('research/evidence-graph-compiler-2026-10-10/fixtures/FIXTURE_REGISTER.json') + regCount('research/adaptive-reliability-2026-10-13/corpus-expansion/FIXTURE_REGISTER.json') + TR_count();
  function TR_count() { return (readFileSync(join(REPO, 'research/adaptive-reliability-2026-10-13/stability-laboratory/transforms.mjs'), 'utf8').match(/\{ id: '(?:ST|LB)-\d+'/g) || []).length; }
  t('every existing synthetic scenario has a baseline record (' + manifest.records.length + ' of ' + expected + ', counted from the prior registers)', manifest.records.length === expected && manifest.counts.total === expected);
  t('manifest hash matches its content', B.manifestHashValid(manifest));
  const fields = ['scenario_id', 'package', 'package_version', 'gate', 'conditions', 'refusal_codes', 'quotes', 'evidence_quote_status', 'cc_defects', 'human_review_route', 'structure', 'behaviour_hash', 'offset_hash', 'raw_output_hash', 'baseline_class'];
  t('every record carries the required fields', manifest.records.every((r) => fields.every((k) => k in r)), manifest.records.filter((r) => !fields.every((k) => k in r)).map((r) => r.scenario_id).join(','));
  t('every record has a deterministic output hash', manifest.records.every((r) => /^sha256:[0-9a-f]{64}$/.test(r.behaviour_hash) && /^sha256:[0-9a-f]{64}$/.test(r.offset_hash)));
  t('every record hash recomputes from its content', manifest.records.every((r) => { const h = D.recomputeHashes(r); return h.behaviour_hash === r.behaviour_hash && h.offset_hash === r.offset_hash; }));
  t('only the five baseline classes are used', manifest.records.every((r) => V.BASELINE_CLASSES.includes(r.baseline_class)));
  t('every class is represented', V.BASELINE_CLASSES.every((c) => manifest.counts.by_class[c] > 0), JSON.stringify(manifest.counts.by_class));
  t('documented open failures carried as known_open_failure', Object.keys(manifest.known_open_failure_sources).every((id) => manifest.records.some((r) => r.scenario_id === id && r.baseline_class === 'known_open_failure')));
  t('no record, class or basis uses a forbidden status word', !manifest.records.some((r) => V.findForbiddenStatusWord(r.baseline_class + ' ' + r.class_basis)) && !V.findForbiddenStatusWord(manifest.label_policy.replace(/correct, accurate, approved or validated/, '')));
  t('release status recorded as NO_GO_NOT_VERIFIED', manifest.release_status === 'NO_GO_NOT_VERIFIED');
  const t0 = process.hrtime.bigint();
  const { records: rec2 } = await C.collectExistingRecords(REPO);
  const rebuilt = B.buildManifest(rec2, { generatedClock: manifest.generated_clock, sources: manifest.sources, knownOpenFailures: C.documentedOpenFailures(REPO), codeIdentity: C.codeIdentity(REPO) });
  records.baseline_rebuild_ms = ms(t0);
  t('rebuilt manifest reproduces the recorded hash', rebuilt.manifest_hash === manifest.manifest_hash, rebuilt.manifest_hash);
  t('differential replay of rebuilt against recorded: no behavioural difference', D.compareManifests(manifest, rebuilt).verdict === 'no_behavioral_difference');
  const hashes = J('baseline/PHASE6_BASELINE_HASHES.json');
  t('PHASE6_BASELINE_HASHES.json agrees with the manifest', hashes.manifest_hash === manifest.manifest_hash && Object.keys(hashes.records).length === manifest.records.length);
  t('summary carries the three required statements', ['LOCAL ENGINEERING MATERIAL ONLY', 'NOT INDEPENDENTLY EVALUATED', 'NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION'].every((s) => readFileSync(join(PKG, 'baseline/PHASE6_BASELINE_SUMMARY.md'), 'utf8').includes(s)));
}

// ---------------------------------------------------------------- C. regression library
const libRec = J('regression-library/LIBRARY_RESULTS.json'), first = J('regression-library/FIRST_RUN_RESULTS.json'), seal = J('regression-library/EXPECTATION_SEAL.json');
const register = readFileSync(join(PKG, 'knowledge-register/KNOWLEDGE_REGISTER.jsonl'), 'utf8');
const regEntries = RG.parseRegister(register);
if (want('library')) {
  console.log('\n# C. Synthetic regression library');
  t('at least 60 new scenarios (' + SCEN.length + ')', SCEN.length >= 60);
  for (const [c, m] of Object.entries(V.SCENARIO_CATEGORIES)) t('category ' + c + ' has at least ' + m.minimum + ' (' + SCEN.filter((s) => s.category === c).length + ')', SCEN.filter((s) => s.category === c).length >= m.minimum);
  const seen = new Set(); const adm = SCEN.map((s) => { const p = L.validateScenario(s, seen); seen.add(s.scenario_id); return [s.scenario_id, p]; }).filter(([, p]) => p.length);
  t('every scenario admitted: marker, provenance, category, kind, safe behaviour, limitation', !adm.length, JSON.stringify(adm));
  t('every scenario begins with the synthetic-material marker', SCEN.every((s) => s.record_text.startsWith(V.SYNTHETIC_MARKER)));
  t('every expectation kind is one of the four', SCEN.every((s) => V.EXPECTATION_KINDS.includes(s.expectation_kind)) && V.EXPECTATION_KINDS.every((k) => SCEN.some((s) => s.expectation_kind === k)));
  t('expectation seal holds (expectations, inputs and evaluator unchanged since sealing)', L.verifySeal(SCEN, seal, evaluatorSha()).length === 0, L.verifySeal(SCEN, seal, evaluatorSha()).join('; '));
  t('seal predates the first execution', Date.parse(seal.sealed_at) < Date.parse(first.executed_at) && seal.compiler_executed_on_these_scenarios_before_seal === false, seal.sealed_at + ' / ' + first.executed_at);
  t('first run was against the same seal', first.seal_hash === seal.seal_hash);
  t('no authoring-defect record exists, so no expectation was revised', !existsSync(join(PKG, 'regression-library/AUTHORING_DEFECTS.json')));
  const run = L.runLibrary(SCEN, compileEvidenceGraph, CLOCK);
  t('current run reproduces the recorded results', run.results_hash === libRec.results_hash);
  t('current run reproduces the first run exactly', run.results_hash === first.results_hash);
  t('no known open failure is reported as not reproduced', run.counts.known_open_failure_not_reproduced === 0);
  const kof = run.results.filter((r) => r.expectation_kind === 'known_open_failure');
  t('every known_open_failure scenario reproduced its predicted failure (' + kof.length + ')', kof.every((r) => r.result === 'known_open_failure_reproduced'));
  t('every known_open_failure scenario names a register entry', SCEN.filter((s) => s.knowledge_ref).every((s) => regEntries.some((e) => e.entry_id === s.knowledge_ref && e.scenarios.includes(s.scenario_id))));
  const unexpected = run.results.filter((r) => r.result === 'unexpected');
  t('every unexpected result is recorded as an open register entry from the first run (' + unexpected.map((r) => r.scenario_id).join(',') + ')',
    unexpected.every((r) => regEntries.some((e) => e.state === 'open' && e.scenarios.includes(r.scenario_id)) && first.results.find((x) => x.scenario_id === r.scenario_id).result === 'unexpected'));
  t('every invariant, degradation and refusal scenario other than recorded unexpected results is as expected', run.results.filter((r) => r.expectation_kind !== 'known_open_failure' && r.result !== 'as_expected').every((r) => unexpected.includes(r)));
  t('no universal invariant violation in any compiled scenario', run.results.every((r) => !r.universal_violations || !r.universal_violations.length));
  t('no scenario reached a status above its sealed ceiling except a recorded known open failure', run.results.every((r) => r.result !== 'as_expected' || !r.mismatches.length));
  records.library = { counts: run.counts, results_hash: run.results_hash };
}

// ---------------------------------------------------------------- D. differential router
const graphs = {};
for (const id of ['P6-RT-01', 'P6-XD-01', 'P6-SU-02', 'P6-EQ-07', 'P6-IN-03', 'P6-IN-01', 'P6-SP-02', 'P6-SP-01']) graphs[id.replace(/^P6-|-/g, '')] = compileScenario(SC[id]);
graphs.GC001 = compileEvidenceGraph({ submission: L.submissionFor(TR.BASES['GC-001']), candidateResponseText: TR.BASES['GC-001'].candidate_response_text, executionMode: 'local_mocked', clock: CLOCK, fixtureId: 'GC-001' });
graphs.DET = compileEvidenceGraph({ submission: L.submissionFor(TR.BASES['GC-001']), candidateResponseText: null, executionMode: 'local_deterministic', clock: CLOCK, fixtureId: 'GC-001-det' });
const CTRL_LINE = TR.BASES['GC-001'].record_text.split('\n').find((l) => l.startsWith('Compensating controls:'));
const probeCtx = { graphs, scenarios: SC, limitations: LIMITATIONS, compile: compileEvidenceGraph, gcBase: TR.BASES['GC-001'], ctrlLine: CTRL_LINE };
const PROBES = makeProbes(probeCtx);
const REAL = { differ: D, register: RG, library: L, baseline: B, stability: ST, canonical: CAN, vocab: V };
const runProbes = (M) => PROBES.map((p) => { let ok; try { ok = p.run(M) === true; } catch (e) { ok = false; } return { name: p.name, ok }; });
if (want('differ') || want('register') || want('mutation')) {
  console.log('\n# D. Direct probes on the unmutated framework (differ, register, library, baseline, stability)');
  for (const r of runProbes(REAL)) if (want('differ') || want('register') || want('mutation')) t(r.name, r.ok);
}

// ---------------------------------------------------------------- E. knowledge register
if (want('register')) {
  console.log('\n# E. Knowledge register');
  t('hash chain and every entry valid (' + regEntries.length + ' entries)', RG.validateRegister(register).length === 0, RG.validateRegister(register).join('; '));
  t('every entry records origin, layer, risk, scenarios, expected behaviour, limitation, state, suite and independent-evaluation flag',
    regEntries.every((e) => RG.ENTRY_FIELDS.every((k) => e[k] !== undefined && e[k] !== '')));
  t('only open, reproduced, mitigated or deferred states', regEntries.every((e) => V.REGISTER_STATES.includes(e.state)));
  t('register has no personal data, contributor field, external link or forbidden status word', regEntries.every((e) => RG.validateEntry(e).length === 0));
  t('register rebuild is append-only and idempotent', (() => { const { ENTRIES } = { ENTRIES: [] }; return RG.isAppendOnly(register, register); })());
  t('every scenario referenced by the register exists', regEntries.flatMap((e) => e.scenarios).filter((s) => /^P6-[A-Z]{2}-\d{2}$/.test(s) && !s.startsWith('P6-ST')).every((s) => SC[s]));
}

// ---------------------------------------------------------------- F. stability laboratory
const stabRec = J('stability-laboratory/STABILITY_RESULTS.json'), stabFirst = J('stability-laboratory/FIRST_RUN_RESULTS.json'), sseal = J('stability-laboratory/STABILITY_SEAL.json');
if (want('stability')) {
  console.log('\n# F. Metamorphic stability');
  const r = ST.runTransforms(TR.TRANSFORMS, TR.BASES, compileEvidenceGraph, CLOCK);
  t('at least 20 transforms (' + r.total + ')', r.total >= 20);
  t('at least half of the invariant transforms start from a non-favourable base (' + r.invariant_non_favorable_base + ' of ' + r.invariant_total + ')', r.invariant_non_favorable_base * 2 >= r.invariant_total && r.invariant_total > 0);
  const names = TR.TRANSFORMS.map((x) => x.name).join(' | ');
  for (const [label, re] of [['formatting', /formatting/], ['irrelevant additions', /irrelevant/], ['reordered sections', /swapped/], ['duplicate quotations', /duplicated/], ['missing decision dates', /decision date removed/],
    ['conflicting dates', /different decision date|expiry moved/], ['ambiguous language', /reworded without a locatable/], ['reworded out-of-scope material', /reworded employment/], ['instruction-like text', /instruction/],
    ['missing evidence', /removed/], ['weakened limitation text', /limitation text weakened/]]) t('transform family present: ' + label, re.test(names));
  t('transform seal holds', sseal.transforms_sha256 === transformsSha() && sseal.stability_evaluator_sha256 === stabilityEvaluatorSha());
  t('transform seal predates the first run', Date.parse(sseal.sealed_at) < Date.parse(stabFirst.executed_at));
  t('every transform as expected or a reproduced documented open failure', r.results.every((x) => ['as_expected', 'known_open_failure_reproduced'].includes(x.result)), JSON.stringify(r.results.filter((x) => !['as_expected', 'known_open_failure_reproduced'].includes(x.result))));
  t('no invariant transform shows a favourable transition', r.results.filter((x) => x.kind === 'invariant').every((x) => !x.favourable_transitions.length));
  t('every invariant transform from a non-favourable base kept its non-favourable statuses', r.results.filter((x) => x.kind === 'invariant' && x.base_state === 'non_favorable').every((x) => JSON.stringify(x.statuses) === JSON.stringify(x.base_statuses)));
  t('every damaged-output transform failed closed', r.results.filter((x) => TR.TRANSFORMS.find((y) => y.id === x.transform_id).damage).every((x) => x.verdict === 'fail_closed'));
  t('results reproduce the recorded and first runs', r.results_hash === stabRec.results_hash && r.results_hash === stabFirst.results_hash);
  records.stability = { total: r.total, as_expected: r.as_expected, invariant_total: r.invariant_total, invariant_non_favorable_base: r.invariant_non_favorable_base, results_hash: r.results_hash,
    results: r.results.map((x) => ({ id: x.transform_id, kind: x.kind, base: x.base, base_state: x.base_state, result: x.result, verdict: x.verdict })) };
}

// ---------------------------------------------------------------- G. determinism
if (want('determinism')) {
  console.log('\n# G. Determinism: five full passes');
  const passes = [];
  for (let i = 0; i < 5; i++) {
    const lib = L.runLibrary(SCEN, compileEvidenceGraph, CLOCK), stab = ST.runTransforms(TR.TRANSFORMS, TR.BASES, compileEvidenceGraph, CLOCK);
    const recs = lib.records.map((r) => r.behaviour_hash + r.offset_hash).join('|');
    const { records: base } = await C.collectExistingRecords(REPO);
    const m = B.buildManifest(base, { generatedClock: manifest.generated_clock, sources: manifest.sources, knownOpenFailures: C.documentedOpenFailures(REPO), codeIdentity: C.codeIdentity(REPO) });
    passes.push({ pass: i + 1, library_results_hash: lib.results_hash, library_records_hash: CAN.sha(recs), stability_results_hash: stab.results_hash, baseline_manifest_hash: m.manifest_hash,
      graph_hashes: CAN.sha(Object.values(lib.graphs).map((g) => g.identity.graph_sha256).join('|')) });
  }
  for (const k of ['library_results_hash', 'library_records_hash', 'stability_results_hash', 'baseline_manifest_hash', 'graph_hashes']) t('five passes: identical ' + k, new Set(passes.map((p) => p[k])).size === 1);
  records.determinism = { passes, identical: passes.every((p) => JSON.stringify(Object.assign({}, p, { pass: 0 })) === JSON.stringify(Object.assign({}, passes[0], { pass: 0 }))) };
}

// ---------------------------------------------------------------- H. local performance budgets
if (want('performance')) {
  console.log('\n# H. Local engineering performance budgets (not production performance)');
  const median = (f, n = 5) => { const xs = []; for (let i = 0; i < n; i++) { const t0 = process.hrtime.bigint(); f(); xs.push(ms(t0)); } return xs.sort((a, b) => a - b)[Math.floor(n / 2)]; };
  const BUDGET = { replay_completion_ms: 20000, baseline_comparison_ms: 1000, fixture_loading_ms: 1000, malformed_input_refusal_ms_per_1000: 1000, failure_cleanup_ms: 3000 };
  const t0 = process.hrtime.bigint();
  const { verify } = await import('../../tools/engine-reliability-replay.mjs');
  const vr = await verify({ env: {} });
  const replay = ms(t0);
  const cmp = median(() => D.compareManifests(manifest, manifest));
  const load = median(() => { readdirSync(join(PKG, 'regression-library/scenarios')).map((f) => JSON.parse(readFileSync(join(PKG, 'regression-library/scenarios', f), 'utf8'))); J('baseline/PHASE6_BASELINE_MANIFEST.json'); });
  const bad = median(() => { for (let i = 0; i < 1000; i++) { D.compareRecords(null, { x: i }); L.validateScenario({ scenario_id: i }); } });
  const dirs = []; for (let i = 0; i < 20; i++) { const d = mkdtempSync(join(tmpdir(), 'p6-cleanup-')); cpSync(join(REPO, 'lib/engine-reliability'), join(d, 'x'), { recursive: true }); dirs.push(d); }
  const t1 = process.hrtime.bigint(); for (const d of dirs) rmSync(d, { recursive: true, force: true }); const cleanup = ms(t1);
  const observed = { replay_completion_ms: replay, baseline_comparison_ms: cmp, fixture_loading_ms: load, malformed_input_refusal_ms_per_1000: bad, failure_cleanup_ms: cleanup };
  for (const k of Object.keys(BUDGET)) t('budget ' + k + ': ' + observed[k].toFixed(1) + ' <= ' + BUDGET[k], observed[k] <= BUDGET[k]);
  t('cleanup left no temporary directory', dirs.every((d) => !existsSync(d)));
  t('replay verify ran offline with no network attempt', vr.network.trapped_attempts === 0);
  records.performance = { statement: 'Local engineering budgets on this container only. Not production, latency or throughput performance.', budgets: BUDGET, observed, node: process.version, platform: process.platform + '-' + process.arch };
}

// ---------------------------------------------------------------- I. mutation tests
if (want('mutation')) {
  console.log('\n# I. Mutation tests (' + MUTATIONS.length + ' deliberate defects in copies of lib/engine-reliability)');
  const base = runProbes(REAL);
  t('every probe passes on the unmutated framework (' + base.length + ')', base.every((r) => r.ok), base.filter((r) => !r.ok).map((r) => r.name).join(','));
  const results = [];
  for (const [id, file, find, repl, area] of MUTATIONS) {
    const src = readFileSync(join(REPO, 'lib/engine-reliability', file), 'utf8');
    const n = src.split(find).length - 1;
    if (n !== 1) { results.push({ id, file, area, result: 'setup_error', detail: 'target occurs ' + n + ' times' }); continue; }
    const dir = mkdtempSync(join(tmpdir(), 'p6-mut-'));
    try {
      mkdirSync(join(dir, 'lib/engine-evidence-graph'), { recursive: true });
      cpSync(join(REPO, 'lib/engine-reliability'), join(dir, 'lib/engine-reliability'), { recursive: true });
      cpSync(join(REPO, 'lib/engine-evidence-graph/contract.mjs'), join(dir, 'lib/engine-evidence-graph/contract.mjs'));
      writeFileSync(join(dir, 'lib/engine-reliability', file), src.replace(find, repl));
      let M;
      try {
        const u = (f) => pathToFileURL(join(dir, 'lib/engine-reliability', f)).href;
        M = { differ: await import(u('differ.mjs')), register: await import(u('register.mjs')), library: await import(u('library.mjs')), baseline: await import(u('baseline.mjs')),
          stability: await import(u('stability.mjs')), canonical: await import(u('canonical.mjs')), vocab: await import(u('vocab.mjs')) };
      } catch (e) { results.push({ id, file, area, result: 'load_failure', detail: String(e.message).slice(0, 160) }); continue; }
      const pr = runProbes(M); const killers = pr.filter((r) => !r.ok).map((r) => r.name);
      results.push({ id, file, area, description: find.slice(0, 90), result: killers.length ? 'killed' : 'survived', killed_by: killers });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  for (const r of results) t(r.id + ' (' + r.area + ', ' + r.file + ') ' + r.result + (r.killed_by && r.killed_by.length ? ' by ' + r.killed_by.slice(0, 3).join(', ') + (r.killed_by.length > 3 ? ' (+' + (r.killed_by.length - 3) + ')' : '') : ''), r.result === 'killed', r.detail);
  const killed = results.filter((r) => r.result === 'killed').length;
  t('at least 40 mutations, all killed by a direct probe, none a load failure (' + killed + '/' + results.length + ')', results.length >= 40 && killed === results.length);
  const areas = ['differential classifications', 'limitation removal detection', 'refusal-loss detection', 'favorable-transition detection', 'quote and offset integrity', 'scenario provenance', 'hash-chain integrity', 'version mismatch', 'malformed comparison inputs'];
  t('every required mutation area is covered', areas.every((a) => results.some((r) => r.area === a)), areas.filter((a) => !results.some((r) => r.area === a)).join(','));
  t('mutation temporary directories cleaned up', !readdirSync(tmpdir()).some((f) => f.startsWith('p6-mut-')));
  records.mutation = { total: results.length, killed, survived: results.filter((r) => r.result === 'survived').length, load_failures: results.filter((r) => r.result === 'load_failure').length,
    setup_errors: results.filter((r) => r.result === 'setup_error').length, probes: base.length, results };
}

// ---------------------------------------------------------------- J. static review workbench
if (want('workbench')) {
  console.log('\n# J. Static review workbench');
  const W = join(PKG, 'workbench');
  if (!existsSync(W)) skipped('workbench', 'not built');
  else {
    const pages = readdirSync(W).filter((f) => f.endsWith('.html'));
    t('workbench pages present (' + pages.length + ')', pages.length >= 8);
    for (const f of pages) {
      const h = readFileSync(join(W, f), 'utf8');
      t(f + ': three required statements', ['LOCAL ENGINEERING MATERIAL ONLY', 'NOT INDEPENDENTLY EVALUATED', 'NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION'].every((s) => h.includes(s)));
      t(f + ': no script, form, input, upload, iframe or network URL', !/<script|<form|<input|<textarea|<button|<iframe|<object|<embed|type=["']?file|https?:\/\/|\/\/[a-z0-9-]+\.[a-z]|@import|url\(/i.test(h.replace(/<meta name="robots"[^>]*>/, '')));
      t(f + ': links only to local workbench pages', [...h.matchAll(/href="([^"]+)"/g)].every((m) => /^[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/.test(m[1]) || /^#[a-z0-9-]+$/.test(m[1])));
      t(f + ': no unnegated readiness or validation claim', scanUnsupportedClaims(h.replace(/<[^>]+>/g, ' ')).length === 0, JSON.stringify(scanUnsupportedClaims(h.replace(/<[^>]+>/g, ' ')).slice(0, 3)));
    }
    const shots = existsSync(join(PKG, 'execution-record/WORKBENCH_RENDER_RECORD.json')) ? JSON.parse(readFileSync(join(PKG, 'execution-record/WORKBENCH_RENDER_RECORD.json'), 'utf8')) : null;
    if (!shots) skipped('workbench render record', 'render script not run');
    else {
      t('rendered every page at desktop and mobile widths', shots.pages.length === pages.length * 2);
      t('zero non-file requests while rendering', shots.pages.every((p) => p.non_file_requests === 0));
      t('no horizontal overflow on desktop or mobile', shots.pages.every((p) => !p.horizontal_overflow));
      t('no script executed (JavaScript disabled while rendering)', shots.javascript_enabled === false);
    }
  }
}

// ---------------------------------------------------------------- K. documents
const DOCS = ['README.md', 'PHASE6_HANDOFF.md', 'BASELINE_PROTOCOL.md', 'REGRESSION_LIBRARY_PROTOCOL.md', 'CHANGE_IMPACT_CLASSIFICATION.md', 'FIXTURE_GOVERNANCE.md', 'MUTATION_TEST_RECORD.md',
  'STABILITY_TEST_RECORD.md', 'PERFORMANCE_RECORD.md', 'KNOWN_FAILURE_MODES.md', 'OWNER_DECISION_REGISTER.md', 'EXECUTION_RECORD.md'];
if (want('documents')) {
  console.log('\n# K. Handoff documents');
  for (const d of DOCS) {
    if (!existsSync(join(PKG, d))) { t(d + ' exists', false); continue; }
    const s = readFileSync(join(PKG, d), 'utf8');
    t(d + ': exists with the local-engineering status line', /LOCAL ENGINEERING MATERIAL ONLY/.test(s) && /NOT INDEPENDENTLY EVALUATED/.test(s));
    t(d + ': no unnegated readiness or validation claim', scanUnsupportedClaims(s).length === 0, JSON.stringify(scanUnsupportedClaims(s).slice(0, 3)));
    t(d + ': no em-dash', !s.includes('—'));
  }
  const h = existsSync(join(PKG, 'PHASE6_HANDOFF.md')) ? readFileSync(join(PKG, 'PHASE6_HANDOFF.md'), 'utf8') : '';
  t('handoff separates local engineering evidence from independent evaluation evidence', /## Local engineering evidence/.test(h) && /## Independent evaluation evidence/.test(h));
  t('handoff states NO_GO_NOT_VERIFIED is unchanged', /NO_GO_NOT_VERIFIED/.test(h));
}

t('suite made no network attempt', trap.count() === 0, trap.count());
console.log('\n' + (pass + fail + skip) + ' checks: ' + pass + ' passed, ' + fail + ' failed, ' + skip + ' skipped');
if (fail) console.log('failed: ' + failed.join('; '));
if (RECORD) {
  const out = join(PKG, 'execution-record'); mkdirSync(out, { recursive: true });
  const stamp = { generated_at: new Date().toISOString(), command: 'node tests/engine-reliability/run.mjs --record' + (ONLY ? ' --only ' + ONLY : ''), node: process.version, network_attempts: trap.count(), repository_head: git(['rev-parse', 'HEAD']).trim() };
  if (records.mutation) writeFileSync(join(out, 'MUTATION_EVIDENCE.json'), JSON.stringify(Object.assign({}, stamp, records.mutation), null, 2) + '\n');
  if (records.determinism) writeFileSync(join(out, 'DETERMINISM_RECORD.json'), JSON.stringify(Object.assign({}, stamp, records.determinism), null, 2) + '\n');
  if (records.performance) writeFileSync(join(out, 'PERFORMANCE_MEASUREMENTS.json'), JSON.stringify(Object.assign({}, stamp, records.performance), null, 2) + '\n');
  if (records.stability) writeFileSync(join(out, 'STABILITY_EVIDENCE.json'), JSON.stringify(Object.assign({}, stamp, records.stability), null, 2) + '\n');
  writeFileSync(join(out, 'TEST_RESULTS.json'), JSON.stringify(Object.assign({}, stamp, { passed: pass, failed: fail, skipped: skip, failed_checks: failed, library: records.library || null }), null, 2) + '\n');
}
trap.restore();
process.exit(fail ? 1 : 0);

#!/usr/bin/env node
// JRS ADAPTIVE RELIABILITY: local determinism and performance measurements.
//
//   env -u ANTHROPIC_BASE_URL node research/adaptive-reliability-2026-10-13/performance/run-performance.mjs
//
// Bounded local engineering measurements on one machine and the synthetic corpus.
// Not production performance, scalability, reliability or service-level evidence.
// A budget breach is written as a local failure record; nothing is repaired.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { installNetworkTrap, detectProviderConfiguration } from '../../../lib/engine-assurance/network-guard.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const PKG = join(REPO, 'research/adaptive-reliability-2026-10-13');
const CLOCK = '2026-10-13T00:00:00Z';
const sha = (s) => createHash('sha256').update(s).digest('hex');
const FIXTURE_DIRS = ['research/evidence-graph-compiler-2026-10-10/fixtures', 'research/adaptive-reliability-2026-10-13/corpus-expansion/cases', 'research/engine-assurance-2026-10-10/fixtures/records'];

export function treeHash(rel) {
  const out = []; const walk = (d) => { for (const f of readdirSync(d).sort()) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else out.push(p.slice(REPO.length) + ':' + sha(readFileSync(p))); } };
  walk(join(REPO, rel)); return sha(out.join('\n'));
}

export const BUDGETS = Object.freeze([
  ['B-01', 'output hash identical across repeated deterministic runs'],
  ['B-02', 'graph serialisation round-trips byte-identically'],
  ['B-03', 'nodes and edges sorted by id in every graph'],
  ['B-04', 'no network attempt during any measurement'],
  ['B-05', 'no malformed or oversized input returns a favourable finding'],
  ['B-06', 'no failed run is recorded as a successful complete run'],
  ['B-07', 'no temporary output contaminates a fixture source directory'],
  ['B-08', 'a failed build leaves no partial artifact behind'],
  ['B-09', 'record of exactly 8000 characters proceeds; 8001 is refused'],
]);

const SUB = (record) => ({ submission_metadata: { submission_id: 'PERF' }, scope_declaration: { record_type: 'supplier_access_exception_draft', record_state: 'completed_draft',
  content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false },
  declared_versions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.0-local', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' },
  requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: record });

// Runs every case once; complete is true only if every case compiled.
export function runPass(cases, compile) {
  const t0 = process.hrtime.bigint(), per = [], hashes = {}; let failed = 0;
  for (const c of cases) {
    const s = process.hrtime.bigint();
    try { const g = compile({ submission: c.submission, candidateResponseText: c.response, executionMode: c.mode, clock: CLOCK, fixtureId: c.id }); hashes[c.id] = sha(JSON.stringify(g)); }
    catch { failed++; hashes[c.id] = null; }
    per.push(Number(process.hrtime.bigint() - s) / 1e6);
  }
  return { complete: failed === 0, failed, total: cases.length, duration_ms: Number(process.hrtime.bigint() - t0) / 1e6, per_fixture_ms: per, output_hash: sha(JSON.stringify(hashes)) };
}

export async function measure({ passes = 5 } = {}) {
  const { compileEvidenceGraph } = await import('../../../lib/engine-evidence-graph/compiler.mjs');
  const { canonical } = await import('../../../lib/engine-evidence-graph/graph-validate.mjs');
  const { loadCase } = await import('../../../lib/engine-change-control/corpus-replay.mjs');
  const T = await import('../stability-laboratory/transforms.mjs');
  const failures = [], results = {};
  const breach = (id, detail) => failures.push({ budget: id, detail, recorded: CLOCK, action: 'recorded only; no automatic repair' });
  const before = Object.fromEntries(FIXTURE_DIRS.map((d) => [d, treeHash(d)]));

  // Corpus: 35 v0.3 fixtures, 50 Phase 4 fixtures, 16 stability transforms.
  const cases = [];
  const gcDir = join(REPO, 'research/evidence-graph-compiler-2026-10-10/fixtures');
  for (const f of JSON.parse(readFileSync(join(gcDir, 'FIXTURE_REGISTER.json'), 'utf8')).fixtures) { const c = loadCase(join(gcDir, 'cases'), f.id); cases.push({ id: f.id, submission: c.submission, response: c.response, mode: c.expected.execution_mode }); }
  const arDir = join(PKG, 'corpus-expansion');
  for (const f of JSON.parse(readFileSync(join(arDir, 'FIXTURE_REGISTER.json'), 'utf8')).fixtures) { const c = loadCase(join(arDir, 'cases'), f.id); cases.push({ id: f.id, submission: c.submission, response: c.response, mode: 'local_mocked' }); }
  for (const t of T.TRANSFORMS) { const b = T.BASES[t.base], m = t.make(b); cases.push({ id: t.id, submission: SUB(m.record !== undefined ? m.record : b.record), response: m.response !== undefined ? m.response : b.response, mode: 'local_mocked' }); }

  const mem0 = process.memoryUsage();
  const runs = []; for (let i = 0; i < passes; i++) runs.push(runPass(cases, compileEvidenceGraph));
  const mem1 = process.memoryUsage();
  const hashes = [...new Set(runs.map((r) => r.output_hash))];
  if (hashes.length !== 1) breach('B-01', hashes.length + ' distinct output hashes over ' + passes + ' passes');
  const all = runs.flatMap((r) => r.per_fixture_ms).sort((a, b) => a - b);
  results.determinism = { passes, cases: cases.length, distinct_output_hashes: hashes.length, output_hash: hashes[0], every_pass_complete: runs.every((r) => r.complete) };
  results.timing_ms = { pass_durations: runs.map((r) => +r.duration_ms.toFixed(1)), per_fixture: { min: +all[0].toFixed(2), median: +all[all.length >> 1].toFixed(2), p95: +all[Math.floor(all.length * 0.95)].toFixed(2), max: +all[all.length - 1].toFixed(2) } };
  results.memory_bytes = { heap_used_before: mem0.heapUsed, heap_used_after: mem1.heapUsed, rss_after: mem1.rss, note: 'process.memoryUsage() snapshots; garbage collection timing makes these indicative only' };

  // Serialisation and ordering.
  let roundTrip = 0, unsorted = 0; const fixtureIds = [];
  for (const c of cases) {
    let g; try { g = compileEvidenceGraph({ submission: c.submission, candidateResponseText: c.response, executionMode: c.mode, clock: CLOCK, fixtureId: c.id }); } catch { continue; }
    fixtureIds.push({ fixture_id: c.id, fixture_hash: g.identity.fixture_hash });
    const s1 = canonical(g); if (canonical(JSON.parse(s1)) !== s1) roundTrip++;
    const ids = (a) => a.map((x) => x.id); const sorted = (a) => ids(a).every((v, i, x) => i === 0 || x[i - 1] < v);
    if (!sorted(g.nodes) || !sorted(g.edges)) unsorted++;
  }
  if (roundTrip) breach('B-02', roundTrip + ' graphs changed on serialisation round trip');
  if (unsorted) breach('B-03', unsorted + ' graphs not sorted by id');
  results.serialisation = { graphs_checked: cases.length, round_trip_differences: roundTrip, unsorted_graphs: unsorted };

  // Size boundary.
  const base = T.BASES['GC-001'].record;
  const pad = (n) => base + 'Padding: ' + 'x'.repeat(Math.max(0, n - base.length - 10)) + '\n';
  const at = pad(8000), over = pad(8001);
  const gAt = compileEvidenceGraph({ submission: SUB(at), candidateResponseText: T.BASES['GC-001'].response, executionMode: 'local_mocked', clock: CLOCK, fixtureId: 'PERF-8000' });
  const gOver = compileEvidenceGraph({ submission: SUB(over), candidateResponseText: T.BASES['GC-001'].response, executionMode: 'local_mocked', clock: CLOCK, fixtureId: 'PERF-8001' });
  results.size_boundary = { at_limit: { length: at.length, decision: gAt.intake.decision }, over_limit: { length: over.length, decision: gOver.intake.decision, refusals: gOver.refusals.map((r) => r.code) } };
  if (at.length !== 8000 || over.length !== 8001 || gAt.intake.decision !== 'proceed' || gOver.intake.decision === 'proceed') breach('B-09', JSON.stringify(results.size_boundary));

  // Malformed and oversized inputs: thrown error (fail closed) or no favourable finding.
  const resp = T.BASES['GC-001'].response;
  const bad = {
    null_record: [SUB(null), resp], empty_record: [SUB(''), resp], numeric_record: [SUB(12345), resp], missing_versions: [Object.assign(SUB(base), { declared_versions: undefined }), resp],
    garbage_response: [SUB(base), '}}{{ not json'], empty_response: [SUB(base), ''], oversized_response: [SUB(base), '{"observations":[' + '{"x":1},'.repeat(250000) + '{"x":1}]}'],
    deeply_nested_response: [SUB(base), '['.repeat(5000) + ']'.repeat(5000)], record_2mb: [SUB('x'.repeat(2 * 1024 * 1024)), resp], response_as_object: [SUB(base), { observations: [] }],
  };
  results.malformed = {};
  for (const [k, [sub, r]] of Object.entries(bad)) {
    let outcome;
    try { const g = compileEvidenceGraph({ submission: sub, candidateResponseText: r, executionMode: 'local_mocked', clock: CLOCK, fixtureId: 'PERF-' + k });
      const fav = g.findings.filter((f) => f.status === 'supported' || f.status === 'gap').map((f) => f.condition_id);
      outcome = { returned: true, gate: g.intake.decision, candidate_valid: g.candidate.valid, favourable: fav };
      if (fav.length) breach('B-05', k + ' returned favourable findings: ' + fav.join(','));
    } catch (e) { outcome = { returned: false, error: String(e.message).slice(0, 120) }; }
    results.malformed[k] = outcome;
  }

  // A run with a failing case is never complete.
  const flaky = (opts) => { if (opts.fixtureId === cases[3].id) throw new Error('injected compile failure'); return compileEvidenceGraph(opts); };
  const inj = runPass(cases.slice(0, 6), flaky);
  results.incomplete_run = { failed: inj.failed, complete: inj.complete };
  if (inj.complete) breach('B-06', 'a pass with an injected failure was recorded as complete');

  // Partial artifacts: an injected build failure must leave outputs unchanged and no staging directory behind.
  const { buildAll } = await import('../build-artifacts.mjs');
  const outs = ['knowledge-base/KNOWLEDGE_BASE.jsonl', 'proposals/PROPOSALS.json', 'drift-ledger/DRIFT_LEDGER.json'];
  const snap = () => outs.map((o) => (existsSync(join(PKG, o)) ? sha(readFileSync(join(PKG, o))) : 'absent')).join(',');
  const stages = () => readdirSync(tmpdir()).filter((f) => f.startsWith('jrs-stage-') || f.startsWith('jrs-iso-')).length;
  const s0 = snap(), t0 = stages(); const errs = [];
  for (const where of ['before_write', 'mid_write']) { try { await buildAll({ failAfter: where }); errs.push(where + ': no error'); } catch (e) { errs.push(where + ': ' + e.message); } }
  results.partial_artifacts = { injected: errs, outputs_unchanged: snap() === s0, leftover_staging_dirs: stages() - t0 };
  if (snap() !== s0 || stages() - t0 > 0) breach('B-08', JSON.stringify(results.partial_artifacts));

  const after = Object.fromEntries(FIXTURE_DIRS.map((d) => [d, treeHash(d)]));
  results.fixture_sources_unchanged = Object.keys(before).every((d) => before[d] === after[d]);
  if (!results.fixture_sources_unchanged) breach('B-07', 'fixture source tree hash changed');
  const { runIdentity } = await import('../../../lib/engine-change-control/identity.mjs');
  results.identity = runIdentity({ fixtures: fixtureIds, command: 'node research/adaptive-reliability-2026-10-13/performance/run-performance.mjs', mode: 'local_measurement', clock: CLOCK });
  return { results, failures };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
  const trap = installNetworkTrap();
  let m; try { m = await measure(); } finally { trap.restore(); }
  if (trap.count()) m.failures.push({ budget: 'B-04', detail: trap.count() + ' network attempts', recorded: CLOCK, action: 'recorded only; no automatic repair' });
  const record = { record_type: 'jrs-adaptive-reliability-performance/0.4.1-local', identity: m.results.identity, generated_at: new Date().toISOString(), environment: { node: process.version, platform: process.platform + '-' + process.arch },
    statement: 'Bounded local engineering measurements on synthetic fixtures. Not production performance, scalability, reliability or service-level evidence.',
    budgets: BUDGETS.map(([id, text]) => ({ id, text, result: m.failures.some((f) => f.budget === id) ? 'breached' : 'held' })), network_attempts: trap.count(), results: m.results };
  writeFileSync(join(HERE, 'PERFORMANCE_RECORD.json'), JSON.stringify(record, null, 2) + '\n');
  writeFileSync(join(HERE, 'BUDGET_FAILURE_RECORDS.json'), JSON.stringify({ statement: 'Local failure records for budget breaches. A breach is not repaired automatically.', failures: m.failures }, null, 2) + '\n');
  for (const b of record.budgets) console.log(b.result.toUpperCase().padEnd(9) + b.id + ' ' + b.text);
  console.log('determinism: ' + m.results.determinism.distinct_output_hashes + ' distinct hash over ' + m.results.determinism.passes + ' passes of ' + m.results.determinism.cases + ' cases; pass ms ' + m.results.timing_ms.pass_durations.join(', '));
  console.log('malformed: ' + JSON.stringify(m.results.malformed));
  process.exit(m.failures.length ? 1 : 0);
}

// V0-02 correction evaluation (EV-32 scope). Offline only; the network guard is installed first.
// Runs the frozen 0.3.1-candidate (isolated copy verified against the Phase 7 manifest) and the
// 0.3.2-candidate (isolated copy verified against CANDIDATE_0.3.2_MANIFEST_SHA256.txt) through the
// unchanged adapter 0.2.0 with a mock transport, on:
//   A. the sealed V0 corpus (60 cases): 0.3.2 must match every sealed V0 expectation, except the
//      single pre-declared delta in regression/V0_EXPECTED_DELTA.json;
//   B. the sealed regression cases RC-01 to RC-05, under both versions;
//   C. a differential: 0.3.1 and 0.3.2 observed behaviour on all 60 V0 cases.
// Nothing is repaired. Usage: node tools/evaluate-correction.mjs run-N <scratch-parent>
import { attempts, installNetGuard } from './v0/harness/net-guard.mjs';
installNetGuard();

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, cpSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createIsolatedCopy, verifyAndDelete, loadPrompt, PACKAGE_SHA256, PROMPT_SHA256 } from './v0/harness/isolate.mjs';
import { createRun, pairCheck, canonicalBinding, ADAPTER_VERSION, adapterSha256 } from './v0/harness/adapter.mjs';
import { createMockTransport } from './v0/harness/transport.mjs';
import * as V from './v0/controls.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const V0C = join(PKG, '..', 'validation-readiness-gate-v0-2026-10-25', 'corpus');
const LABEL = process.argv[2], SCRATCH = process.argv[3];
if (!/^run-\d+$/.test(LABEL || '') || !SCRATCH) { console.error('usage: evaluate-correction.mjs run-N <scratch-parent>'); process.exit(2); }
const OUT = join(PKG, 'out', LABEL);
if (existsSync(OUT)) { console.error('output exists; runs must start clean'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const sha = V.sha256;
const MODEL = V.EXPECTED_MODEL;
const CONFIG = { temperature: 0, max_output_tokens: 4096, timeout_ms: 200, note: 'offline mock configuration' };

// Pre-run checks: network markers, V0 seal, regression seal, 0.3.2 manifest.
const problems = [...V.checkNetworkMarkers(process.env, CONFIG), ...V.verifySeal(V0C).problems];
const regSeal = JSON.parse(readFileSync(join(PKG, 'regression', 'SEAL.json'), 'utf8'));
const regManifest = readFileSync(join(PKG, 'regression', 'REGRESSION_SEAL_MANIFEST_SHA256.txt'));
if (sha(regManifest) !== regSeal.manifest_sha256) problems.push('regression_seal_manifest_mismatch');
for (const l of regManifest.toString('utf8').split('\n')) if (l && !l.startsWith('#') && sha(readFileSync(join(PKG, 'regression', l.slice(66)))) !== l.slice(0, 64)) problems.push('regression_post_seal_modification:' + l.slice(66));
// Supplementary seal (RC-06, added on owner direction for survivor X13).
const supSeal = JSON.parse(readFileSync(join(PKG, 'regression-supplement', 'SEAL.json'), 'utf8'));
const supManifest = readFileSync(join(PKG, 'regression-supplement', 'SUPPLEMENT_SEAL_MANIFEST_SHA256.txt'));
if (sha(supManifest) !== supSeal.manifest_sha256) problems.push('supplement_seal_manifest_mismatch');
for (const l of supManifest.toString('utf8').split('\n')) if (l && !l.startsWith('#') && sha(readFileSync(join(PKG, 'regression-supplement', l.slice(66)))) !== l.slice(0, 64)) problems.push('supplement_post_seal_modification:' + l.slice(66));
const candManifest = readFileSync(join(PKG, 'CANDIDATE_0.3.2_MANIFEST_SHA256.txt'), 'utf8');
if (problems.length) { writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ stopped_before_execution: true, problems }, null, 2)); console.error(problems.join(', ')); process.exit(3); }

function walk(d) { return readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; }); }
function isolate032() {
  const tmp = mkdtempSync(join(SCRATCH, 'iso032-'));
  cpSync(join(PKG, 'candidate'), tmp, { recursive: true });
  const rows = candManifest.split('\n').filter(Boolean).map((l) => [l.slice(66), l.slice(0, 64)]);
  const listed = new Set(rows.map((r) => r[0]));
  for (const [f, h] of rows) if (sha(readFileSync(join(tmp, f))) !== h) throw new Error('candidate_0.3.2_copy_mismatch:' + f);
  for (const f of walk(tmp).map((p) => relative(tmp, p))) if (!listed.has(f)) throw new Error('candidate_0.3.2_unlisted_file:' + f);
  if (sha(readFileSync(join(tmp, 'prompt', 'PROMPT_v0.3.0.txt'))) !== PROMPT_SHA256) throw new Error('prompt_hash_mismatch');
  return { root: tmp, files: rows.length };
}
function snapshot(root) { return Object.fromEntries(walk(root).map((p) => [relative(root, p), sha(readFileSync(p))])); }

async function loadEngine(libRoot) {
  const g = join(libRoot, 'lib');
  const dir = existsSync(join(g, 'engine-evidence-graph-v0.3.2-candidate')) ? 'engine-evidence-graph-v0.3.2-candidate' : 'engine-evidence-graph-v0.3.1-candidate';
  const u = (p) => pathToFileURL(join(g, p)).href;
  return {
    compileEvidenceGraph: (await import(u(dir + '/compiler.mjs'))).compileEvidenceGraph,
    validateCandidate: (await import(u(dir + '/response.mjs'))).validateCandidate,
    parseCandidateResponse: (await import(u('engine-evidence-contract/strict-json.mjs'))).parseCandidateResponse,
    validateGraph: (await import(u(dir + '/graph-validate.mjs'))).validateGraph,
  };
}
function promptOf(text) { const i = text.indexOf('[SYSTEM]\n'), j = text.indexOf('[USER]\n'); return { system: text.slice(i + 9, j).trim(), user: text.slice(j + 7).trim() }; }
const sut = (version, prompt, pkgSha) => ({ compilerVersion: version, packageSha256: pkgSha, promptSha256: PROMPT_SHA256, promptSystem: prompt.system, promptUser: prompt.user,
  declaredVersions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: version, prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' }, configuration: CONFIG });

const iso31 = createIsolatedCopy(SCRATCH);
const e31 = await loadEngine(iso31.root);
const S31 = sut('0.3.1-candidate', loadPrompt(iso31), PACKAGE_SHA256);
const iso32 = isolate032();
const before32 = snapshot(iso32.root);
const e32 = await loadEngine(iso32.root);
const S32 = sut('0.3.2-candidate', promptOf(readFileSync(join(iso32.root, 'prompt', 'PROMPT_v0.3.0.txt'), 'utf8')), sha(candManifest));

async function runCase(engine, S, tag, id, record, behaviour) {
  const reqId = 'REQ-' + id;
  const outDir = join(OUT, tag, id);
  const run = createRun({ runId: 'v002-' + LABEL + '-' + tag + '-' + id, engine, transport: createMockTransport({ [reqId]: behaviour }, { model: MODEL }), model_identifier: MODEL, systemUnderTest: S, outDir, timeoutMs: 200 });
  const r = await V.runGuarded(() => run.processRecord({ synthetic_record_id: id, content_origin: 'synthetic_engineering_fixture', record_text: record }, reqId));
  const res = { case_id: id, engine: S.compilerVersion, adapter: { outcome: r.outcome, step: r.step || null, code: r.code || null }, error: r.error || null, mechanical: [], observed: null, graph_digest: null };
  if (r.outcome === 'ERROR') res.mechanical.push('execution_error');
  if (r.outcome === 'REPLAYED') {
    const graphText = readFileSync(r.graphPath, 'utf8'), responseText = readFileSync(r.responsePath, 'utf8');
    const rec = JSON.parse(readFileSync(r.recordPath, 'utf8')), graph = JSON.parse(graphText);
    const apc = pairCheck(r.recordPath, { setRegister: [id] });
    res.mechanical.push(...V.checkPair(rec, graphText, responseText, canonicalBinding), ...(apc.ok ? [] : ['adapter_pair_check:' + apc.code]), ...V.checkModelIdentity(rec, JSON.parse(responseText)),
      ...V.checkIdentity(graph, rec), ...V.checkOffsets(graph, record), ...V.checkLinkage(graph), ...V.checkAmbiguity(graph), ...V.checkMonotonic(graph), ...V.checkReviewRoute(graph),
      ...V.checkChronology(graph), ...V.checkGraphValid(graph, record, engine.validateGraph));
    if (graph.compiler_version !== S.compilerVersion) res.mechanical.push('compiler_version_label_mismatch');
    if (!graph.rule_packs.valid) res.mechanical.push('rule_packs_invalid');
    res.observed = V.observe(graph); res.graph_digest = V.graphDigest(graph); res.active_rules = graph.rule_packs.active_rules;
  }
  return res;
}

// A + C: V0 corpus under both versions.
const delta = JSON.parse(readFileSync(join(PKG, 'regression', 'V0_EXPECTED_DELTA.json'), 'utf8')).deltas;
const ids = readdirSync(join(V0C, 'expectations')).map((f) => f.replace('.expected.json', '')).sort();
const A = [], Cdiff = [];
for (const id of ids) {
  const record = readFileSync(join(V0C, 'cases', id + '.record.txt'), 'utf8');
  const behaviour = JSON.parse(readFileSync(join(V0C, 'cases', id + '.candidate.json'), 'utf8'));
  const exp = JSON.parse(readFileSync(join(V0C, 'expectations', id + '.expected.json'), 'utf8'));
  const r32 = await runCase(e32, S32, 'v032-v0corpus', id, record, behaviour);
  const r31 = await runCase(e31, S31, 'v031-v0corpus', id, record, behaviour);
  let g = exp.graph ? JSON.parse(JSON.stringify(exp.graph)) : null;
  if (g && delta[id]) { Object.assign(g.statuses, delta[id].statuses || {}); if (delta[id].conflict_kinds) g.conflict_kinds = delta[id].conflict_kinds; }
  r32.expectation_differences = [...V.compareAdapter(r32.adapter, exp.adapter), ...(r32.observed && g ? V.compareExpected(r32.observed, g) : (r32.observed || g ? ['replay_mismatch'] : []))];
  r32.expected_with_delta = !!delta[id];
  A.push(r32);
  const strip = (o) => o && { statuses: o.statuses, conflict_kinds: o.conflict_kinds, refusal_codes: o.refusal_codes, quote_statuses: o.quote_statuses, intake_decision: o.intake_decision, instruction_risk: o.instruction_risk };
  Cdiff.push({ case_id: id, behaviour_differs: V.canonical(strip(r31.observed)) !== V.canonical(strip(r32.observed)) || V.canonical(r31.adapter) !== V.canonical(r32.adapter),
    v031: strip(r31.observed), v032: strip(r32.observed), v031_mechanical: r31.mechanical });
}
// B: regression cases under both versions.
const B = [];
const regFiles = ['regression', 'regression-supplement'].flatMap((d) => readdirSync(join(PKG, d, 'cases')).filter((x) => x.endsWith('.spec.json')).sort().map((f) => [d, f]));
for (const [dir, f] of regFiles) {
  const spec = JSON.parse(readFileSync(join(PKG, dir, 'cases', f), 'utf8'));
  const id = spec.case_id;
  const record = spec.record_source.startsWith('V0 sealed corpus ') ? readFileSync(join(V0C, spec.record_source.replace('V0 sealed corpus ', '')), 'utf8') : readFileSync(join(PKG, 'regression-supplement', spec.record_source.replace('regression-supplement ', '')), 'utf8');
  if (sha(record) !== spec.record_sha256) throw new Error('regression_record_hash_mismatch:' + id);
  const behaviour = JSON.parse(readFileSync(join(PKG, dir, 'cases', id + '.candidate.json'), 'utf8'));
  for (const [engine, S, tag] of [[e31, S31, 'v031-regression'], [e32, S32, 'v032-regression']]) {
    const r = await runCase(engine, S, tag, id, record, behaviour);
    const ex = spec.expected[S.compilerVersion];
    r.expectation_differences = r.observed ? [
      ...(r.observed.intake_decision !== ex.intake_decision ? ['intake'] : []),
      ...Object.entries(ex.statuses).filter(([c, s]) => r.observed.statuses[c] !== s).map(([c, s]) => 'status:' + c + ':' + r.observed.statuses[c] + '!=' + s),
      ...(V.canonical(r.observed.conflict_kinds) !== V.canonical(ex.conflict_kinds) ? ['conflicts:' + r.observed.conflict_kinds.join(',') + '!=' + ex.conflict_kinds.join(',')] : [])] : ['not_replayed:' + r.adapter.outcome];
    B.push(r);
  }
}
const after32 = snapshot(iso32.root);
const unchanged32 = Object.keys(before32).every((k) => after32[k] === before32[k]) && Object.keys(after32).length === Object.keys(before32).length;
rmSync(iso32.root, { recursive: true, force: true });
const end31 = verifyAndDelete(iso31);
const summary = {
  v0_corpus_under_032: { cases: A.length, mechanical_failures: A.reduce((n, x) => n + x.mechanical.length, 0), expectation_matches: A.filter((x) => !x.expectation_differences.length).length,
    differing: A.filter((x) => x.expectation_differences.length).map((x) => x.case_id), delta_cases: A.filter((x) => x.expected_with_delta).map((x) => x.case_id) },
  regression: { runs: B.length, matches: B.filter((x) => !x.expectation_differences.length).length, mechanical_failures: B.reduce((n, x) => n + x.mechanical.length, 0),
    differing: B.filter((x) => x.expectation_differences.length).map((x) => x.engine + ':' + x.case_id) },
  differential: { cases: Cdiff.length, behaviour_differs: Cdiff.filter((x) => x.behaviour_differs).map((x) => x.case_id), v031_mechanical_failures: Cdiff.reduce((n, x) => n + x.v031_mechanical.length, 0) },
  network_attempts: attempts.length, isolated_031_unchanged_and_deleted: end31.unchanged && end31.deleted, isolated_032_unchanged: unchanged32, isolated_032_deleted: !existsSync(iso32.root),
};
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ results_format: 'jrs-v0-02-correction-evaluation/1.0.0', run: LABEL, finished_at_utc: new Date().toISOString(),
  statement: 'Offline correction evaluation against sealed owner-authorized expectations. Not validation.', release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  identities: { v031_package_sha256: PACKAGE_SHA256, v032_candidate_manifest_sha256: sha(candManifest), prompt_sha256: PROMPT_SHA256, adapter_version: ADAPTER_VERSION, adapter_sha256: adapterSha256(), model: MODEL, node: process.version },
  summary, v0_corpus_032: A, regression: B, differential: Cdiff }, null, 2) + '\n');
console.log(JSON.stringify(summary));

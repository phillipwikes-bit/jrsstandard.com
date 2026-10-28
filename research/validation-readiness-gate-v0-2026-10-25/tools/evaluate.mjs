// Gate V0 offline mechanical evaluation: one full pass over the sealed corpus.
// The network guard is installed before any Engine module is loaded. The Engine runs only
// from an isolated temporary copy verified against the frozen Phase 7 manifest, through the
// unchanged adapter 0.2.0 with a mock transport. Nothing is repaired: a mismatch or an
// execution error is recorded as a failure.
//
// Usage: node tools/evaluate.mjs <run-label> <scratch-parent>
import { attempts, installNetGuard } from './harness/net-guard.mjs';
installNetGuard();

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIsolatedCopy, verifyAndDelete, loadPrompt, PACKAGE_SHA256, PROMPT_SHA256 } from './harness/isolate.mjs';
import { createRun, pairCheck, canonicalBinding, ADAPTER_VERSION, adapterSha256 } from './harness/adapter.mjs';
import { createMockTransport } from './harness/transport.mjs';
import * as V from './controls.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const LABEL = process.argv[2], SCRATCH = process.argv[3];
if (!/^run-\d+$/.test(LABEL || '') || !SCRATCH) { console.error('usage: evaluate.mjs run-N <scratch-parent>'); process.exit(2); }
const OUT = join(PKG, 'out', LABEL);
if (existsSync(OUT)) { console.error('output directory exists; runs must start clean: ' + OUT); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const CORPUS = join(PKG, 'corpus');
const started = new Date().toISOString();

const MODEL = V.EXPECTED_MODEL;
const SUT_CONFIG = { temperature: 0, max_output_tokens: 4096, timeout_ms: 200, note: 'offline mock configuration' };
const pre = { network_markers: V.checkNetworkMarkers(process.env, SUT_CONFIG), seal: V.verifySeal(CORPUS) };
const fatal = [...pre.network_markers, ...pre.seal.problems];
if (fatal.length) {
  writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ run: LABEL, started, stopped_before_execution: true, problems: fatal }, null, 2));
  console.error('stopped before execution:', fatal.join(', ')); process.exit(3);
}
const sealedHash = new Map(readFileSync(join(CORPUS, 'CORPUS_SEAL_MANIFEST_SHA256.txt'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => [l.slice(66), l.slice(0, 64)]));

const iso = createIsolatedCopy(SCRATCH);
const R = iso.root;
const engine = {
  compileEvidenceGraph: (await import(join(R, 'lib/engine-evidence-graph-v0.3.1-candidate/compiler.mjs'))).compileEvidenceGraph,
  validateCandidate: (await import(join(R, 'lib/engine-evidence-graph-v0.3.1-candidate/response.mjs'))).validateCandidate,
  parseCandidateResponse: (await import(join(R, 'lib/engine-evidence-contract/strict-json.mjs'))).parseCandidateResponse,
};
const { validateGraph } = await import(join(R, 'lib/engine-evidence-graph-v0.3.1-candidate/graph-validate.mjs'));
const prompt = loadPrompt(iso);
const SUT = { compilerVersion: '0.3.1-candidate', packageSha256: PACKAGE_SHA256, promptSha256: PROMPT_SHA256, promptSystem: prompt.system, promptUser: prompt.user,
  declaredVersions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.1-candidate', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' },
  configuration: SUT_CONFIG };

const ids = readdirSync(join(CORPUS, 'expectations')).map((f) => f.replace('.expected.json', '')).sort();
const results = [];
const observedById = {};
for (const id of ids) {
  const record = readFileSync(join(CORPUS, 'cases', id + '.record.txt'), 'utf8');
  const behaviour = JSON.parse(readFileSync(join(CORPUS, 'cases', id + '.candidate.json'), 'utf8'));
  const truth = JSON.parse(readFileSync(join(CORPUS, 'truth', id + '.layer1.json'), 'utf8'));
  const expectedText = readFileSync(join(CORPUS, 'expectations', id + '.expected.json'), 'utf8');
  const expected = JSON.parse(expectedText);
  const checks = {};
  checks['VC-02 layer1'] = V.checkLayer1(truth, id);
  checks['VC-03 expectation integrity'] = V.checkExpectationIntegrity(expectedText, sealedHash.get('expectations/' + id + '.expected.json'), id);
  const reqId = 'REQ-' + id;
  const transport = createMockTransport({ [reqId]: behaviour }, { model: MODEL });
  const caseOut = join(OUT, id);
  const run = createRun({ runId: 'v0-' + LABEL + '-' + id, engine, transport, model_identifier: MODEL, systemUnderTest: SUT, outDir: caseOut, timeoutMs: 200 });
  const r = await V.runGuarded(() => run.processRecord({ synthetic_record_id: id, content_origin: 'synthetic_engineering_fixture', record_text: record }, reqId));
  if (r.outcome === 'ERROR') r.counted_as = 'failure';
  checks['VC-15 error accounting'] = V.checkNoConcealedError(r);
  const adapterObs = { outcome: r.outcome, step: r.step || null, code: r.code || null };
  let observed = null, digest = null, graphDigest = null;
  if (r.outcome === 'REPLAYED') {
    const graphText = readFileSync(r.graphPath, 'utf8');
    const responseText = readFileSync(r.responsePath, 'utf8');
    const rec = JSON.parse(readFileSync(r.recordPath, 'utf8'));
    const graph = JSON.parse(graphText);
    checks['VC-04 provenance pair'] = V.checkPair(rec, graphText, responseText, canonicalBinding);
    const apc = pairCheck(r.recordPath, { setRegister: [id] });
    checks['VC-04b adapter pair check'] = apc.ok ? [] : ['adapter_pair_check:' + apc.code];
    checks['VC-05 model identity'] = V.checkModelIdentity(rec, JSON.parse(responseText));
    checks['VC-06 identity'] = V.checkIdentity(graph, rec);
    checks['VC-07 offsets'] = V.checkOffsets(graph, record);
    checks['VC-08 linkage'] = V.checkLinkage(graph);
    checks['VC-09 ambiguity'] = V.checkAmbiguity(graph);
    checks['VC-10 monotonicity'] = V.checkMonotonic(graph);
    checks['VC-11 review routing'] = V.checkReviewRoute(graph);
    checks['VC-12 chronology'] = V.checkChronology(graph);
    checks['VC-13 graph validity'] = V.checkGraphValid(graph, record, validateGraph);
    observed = V.observe(graph);
    graphDigest = V.graphDigest(graph);
    checks['VC-14 expectation'] = [...V.compareAdapter(adapterObs, expected.adapter), ...(expected.graph ? V.compareExpected(observed, expected.graph) : ['expected_rejection_but_replayed'])];
  } else if (r.outcome === 'REJECT-PRE-REPLAY') {
    const wrote = existsSync(caseOut) ? readdirSync(caseOut) : [];
    checks['VC-06 no graph after rejection'] = wrote.some((f) => f.endsWith('.graph.json') || f.endsWith('.execution-record.json')) ? ['graph_or_record_written_after_rejection'] : [];
    checks['VC-14 expectation'] = V.compareAdapter(adapterObs, expected.adapter);
  } else {
    checks['VC-14 expectation'] = ['not_compared:' + r.outcome];
  }
  digest = V.sha256(V.canonical({ adapter: adapterObs, graph_digest: graphDigest, observed }));
  observedById[id] = observed;
  const mechanicalKeys = Object.keys(checks).filter((k) => !k.startsWith('VC-14') && !k.startsWith('VC-02') && !k.startsWith('VC-03'));
  const mechanicalProblems = mechanicalKeys.flatMap((k) => checks[k].map((x) => k + ': ' + x));
  const expectationProblems = checks['VC-14 expectation'];
  results.push({
    case_id: id, group: truth.group, title: truth.title, adapter: adapterObs, error: r.error || null, observed, graph_digest: graphDigest, case_digest: digest,
    checks,
    classification: {
      mechanically_established: mechanicalProblems.length === 0 && r.outcome !== 'ERROR' ? mechanicalKeys : [],
      mechanical_failures: mechanicalProblems,
      owner_authored_expectation: expectationProblems.length === 0 ? 'matches_sealed_expectation' : 'differs_from_sealed_expectation',
      expectation_differences: expectationProblems,
      unresolved_semantic_questions: expected.semantic_questions,
      not_assessed: r.outcome !== 'REPLAYED' ? ['all five conditions (no replay)'] : Object.entries(observed.statuses).filter(([, s]) => s === 'not_assessed').map(([c]) => c),
      not_suitable_for_a_claim: ['accuracy', 'model behaviour', 'reliability', 'real-world performance', 'independent validation'],
    },
    setup_problems: [...checks['VC-02 layer1'], ...checks['VC-03 expectation integrity']],
  });
}
// Metamorphic relations: observed behaviour must equal the source case's observed behaviour.
const metamorphic = [];
for (const id of ids) {
  const e = JSON.parse(readFileSync(join(CORPUS, 'expectations', id + '.expected.json'), 'utf8'));
  if (!e.metamorphic_of) continue;
  const a = observedById[id], b = observedById[e.metamorphic_of];
  const strip = (o) => o && { statuses: o.statuses, conflict_kinds: o.conflict_kinds, refusal_codes: o.refusal_codes, quote_statuses: o.quote_statuses, intake_decision: o.intake_decision };
  metamorphic.push({ case_id: id, source: e.metamorphic_of, holds: !!a && !!b && V.canonical(strip(a)) === V.canonical(strip(b)) });
}
const isoEnd = verifyAndDelete(iso);
const net = V.checkNetworkAttempts(attempts);
const summary = {
  cases: results.length,
  replayed: results.filter((x) => x.adapter.outcome === 'REPLAYED').length,
  rejected_pre_replay: results.filter((x) => x.adapter.outcome === 'REJECT-PRE-REPLAY').length,
  errors: results.filter((x) => x.adapter.outcome === 'ERROR').length,
  mechanical_check_failures: results.reduce((n, x) => n + x.classification.mechanical_failures.length, 0),
  cases_with_mechanical_failures: results.filter((x) => x.classification.mechanical_failures.length).map((x) => x.case_id),
  setup_problems: results.reduce((n, x) => n + x.setup_problems.length, 0),
  expectation_matches: results.filter((x) => x.classification.owner_authored_expectation === 'matches_sealed_expectation').length,
  cases_differing_from_expectation: results.filter((x) => x.classification.owner_authored_expectation !== 'matches_sealed_expectation').map((x) => x.case_id),
  metamorphic_relations: metamorphic.length, metamorphic_holding: metamorphic.filter((m) => m.holds).length,
  network_attempts: attempts.length, isolated_copy_unchanged: isoEnd.unchanged, isolated_copy_deleted: isoEnd.deleted,
};
const out = { results_format: 'jrs-v0-mechanical-evaluation/1.0.0', run: LABEL, started_at_utc: started, finished_at_utc: new Date().toISOString(),
  statement: 'Offline mechanical evaluation against owner-authored expectations. Not validation; establishes no accuracy or reliability.',
  release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  system_under_test: { compiler_version: SUT.compilerVersion, candidate_package_sha256: PACKAGE_SHA256, prompt_sha256: PROMPT_SHA256, adapter_version: ADAPTER_VERSION, adapter_sha256: adapterSha256(),
    model_identifier: MODEL, transport: 'mock', candidate_files_verified: iso.candidateFilesVerified, node_version: process.version },
  seal: { sealed_at_utc: pre.seal.seal.sealed_at_utc, manifest_sha256: pre.seal.seal.manifest_sha256, verified: pre.seal.ok },
  network: { attempts: attempts.length, problems: net }, summary, metamorphic, results };
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(summary));

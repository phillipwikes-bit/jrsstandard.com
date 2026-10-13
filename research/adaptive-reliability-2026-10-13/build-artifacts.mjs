#!/usr/bin/env node
// JRS ADAPTIVE RELIABILITY 0.4.0-local: builds every Phase 4 local artifact.
//
//   env -u ANTHROPIC_BASE_URL node research/adaptive-reliability-2026-10-13/build-artifacts.mjs
//
// Offline (network trap installed; refuses to start with provider configuration).
// Reads the frozen v0.3 compiler; never edits it. Isolated proposal tests run on
// a temporary copy of the libraries outside the repository, deleted afterwards.
// Outputs are written to a staging directory and moved into place only if the
// whole build succeeds, so a failed build leaves no partial artifacts.

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { installNetworkTrap, detectProviderConfiguration } from '../../lib/engine-assurance/network-guard.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const REPO = fileURLToPath(new URL('../../', import.meta.url));
const CLOCK = '2026-10-13T00:00:00Z';
const OUTPUTS = ['knowledge-base/KNOWLEDGE_BASE.jsonl', 'corpus-expansion/ADMISSION_RESULTS.json', 'corpus-expansion/CORPUS_EXECUTION_RECORD.json',
  'stability-laboratory/STABILITY_RESULTS.json', 'proposals/OBSERVED_CHANGES.json', 'proposals/PROPOSALS.json', 'proposals/IMPACT_ANALYSES.json', 'proposals/REGRESSION_PLANS.json',
  'drift-ledger/DRIFT_LEDGER.json', 'gate-simulator/GATE_SIMULATION.json'];

export async function buildAll({ write = true, failAfter = null } = {}) {
  const K = await import('../../lib/engine-change-control/knowledge-base.mjs');
  const PC = await import('../../lib/engine-change-control/proposal-compiler.mjs');
  const IA = await import('../../lib/engine-change-control/impact-analyzer.mjs');
  const RS = await import('../../lib/engine-change-control/regression-selector.mjs');
  const DL = await import('../../lib/engine-change-control/drift-ledger.mjs');
  const GS = await import('../../lib/engine-change-control/gate-simulator.mjs');
  const CP = await import('../../lib/engine-change-control/corpus-protocol.mjs');
  const CR = await import('../../lib/engine-change-control/corpus-replay.mjs');
  const ST = await import('../../lib/engine-change-control/stability.mjs');
  const OC = await import('../../lib/engine-change-control/observed-change.mjs');
  const ID = await import('../../lib/engine-change-control/identity.mjs');
  const { compileEvidenceGraph } = await import('../../lib/engine-evidence-graph/compiler.mjs');
  const { ENTRIES } = await import('./knowledge-base/kb-entries.mjs');
  const REQ = await import('./proposals/requests.mjs');
  const TR = await import('./stability-laboratory/transforms.mjs');
  const out = {};

  // 1. Knowledge base: append entries not yet present; never rewrite an existing line.
  const kbPath = join(HERE, 'knowledge-base/KNOWLEDGE_BASE.jsonl');
  let kb = existsSync(kbPath) ? readFileSync(kbPath, 'utf8') : '';
  const have = new Set(K.parseKnowledgeBase(kb).map((e) => e.knowledge_id));
  for (const e of ENTRIES) if (!have.has(e.knowledge_id)) kb = K.appendKnowledgeEntry(kb, e);
  const kbProblems = K.validateKnowledgeBase(kb);
  if (kbProblems.length) throw new Error('knowledge base invalid: ' + kbProblems.join('; '));
  out['knowledge-base/KNOWLEDGE_BASE.jsonl'] = kb;
  const kbEntries = K.parseKnowledgeBase(kb);

  // 2. Corpus admission and replay against the frozen v0.3 compiler.
  const AR = join(HERE, 'corpus-expansion');
  const reg = JSON.parse(readFileSync(join(AR, 'FIXTURE_REGISTER.json'), 'utf8'));
  const kIds = new Set(kbEntries.map((e) => e.knowledge_id)), gaps = new Set(Object.keys(reg.coverage_gaps));
  const seen = new Set(), admission = {};
  for (const f of reg.fixtures) { admission[f.id] = CP.admitFixture(f, { knowledgeIds: kIds, coverageGaps: gaps, existingIds: seen }); seen.add(f.id); }
  out['corpus-expansion/ADMISSION_RESULTS.json'] = { generated: CLOCK, admitted: Object.values(admission).filter((p) => !p.length).length, total: reg.fixtures.length, problems: admission };
  const arIds = reg.fixtures.map((f) => f.id);
  const arRun = CR.replayCorpus(join(AR, 'cases'), arIds, compileEvidenceGraph, CLOCK);
  const open = JSON.parse(readFileSync(join(AR, 'OPEN_FAILURES.json'), 'utf8'));
  const failing = arRun.results.filter((r) => r.result !== 'pass').map((r) => r.id).sort();
  const exec = { executable: 0, descriptive: 0 };
  for (const id of arIds) { const x = JSON.parse(readFileSync(join(AR, 'cases', id + '.expected.json'), 'utf8'));
    for (const k of ['gate_decision', 'record_instruction_risk', 'candidate_valid', 'statuses', 'conflict_kinds', 'refusal_codes', 'quote_statuses', 'cc_defects', 'limitations', 'graph', 'reasons_include'])
      if (x[k] !== null && x[k] !== undefined && !(typeof x[k] === 'object' && !Array.isArray(x[k]) && !Object.keys(x[k]).length && k !== 'quote_statuses')) exec.executable++;
    exec.descriptive += x.descriptive_expectations_not_executed.length; }
  out['corpus-expansion/CORPUS_EXECUTION_RECORD.json'] = { generated: CLOCK, compiler: 'frozen v0.3 (lib/engine-evidence-graph)', total: arIds.length,
    identity: ID.runIdentity({ fixtures: Object.values(arRun.graphs).map((g) => ({ fixture_id: g.identity.fixture_id, fixture_hash: g.identity.fixture_hash })),
      command: 'node research/adaptive-reliability-2026-10-13/build-artifacts.mjs (corpus replay)', mode: 'local_frozen_baseline', clock: CLOCK }),
    expectation_fields: exec,
    as_expected: arIds.length - failing.length, open_failures_observed: failing, open_failures_documented: Object.keys(open.corpus).sort(),
    matches_documented_open_failures: JSON.stringify(failing) === JSON.stringify(Object.keys(open.corpus).sort()), results: arRun.results,
    statement: 'Expected results are engineering-authored expected safe behaviour, not adjudicated labels. Passing cases are not an accuracy result.' };

  // 3. Stability laboratory.
  const stab = ST.runStabilityLab(TR.TRANSFORMS, TR.BASES, compileEvidenceGraph, CLOCK);
  stab.results.forEach((r) => { const t = TR.TRANSFORMS.find((x) => x.id === r.transform_id); if (t.expectation_correction) r.expectation_correction = t.expectation_correction; });
  stab.open_failures_documented = Object.keys(open.stability).sort();
  stab.open_failures_observed = stab.results.filter((r) => r.result !== 'as_expected').map((r) => r.transform_id).sort();
  out['stability-laboratory/STABILITY_RESULTS.json'] = Object.assign({ generated: CLOCK, transforms: TR.TRANSFORMS.map((t) => ({ id: t.id, name: t.name, kind: t.kind, base: t.base,
    expected_invariant: t.expected_invariant || null, expected_changed: t.expected_changed || null, expected_refusals: t.expected_refusals || [], expected_limitation: t.expected_limitation || 'presence and sufficiency limitations',
    expected_graph_change: t.expected_graph_change || null, expected_review: t.expected_review })) }, stab);

  // 4. Observed-change records, then proposals, impact and regression plans.
  const GC = join(REPO, 'research/evidence-graph-compiler-2026-10-10/fixtures');
  const gcReg = JSON.parse(readFileSync(join(GC, 'FIXTURE_REGISTER.json'), 'utf8'));
  const caseList = [];
  for (const f of gcReg.fixtures) { const c = CR.loadCase(join(GC, 'cases'), f.id); caseList.push({ id: f.id, submission: c.submission, response: c.response, mode: c.expected.execution_mode, label: c.expected.label_status }); }
  for (const id of arIds) { const c = CR.loadCase(join(AR, 'cases'), id); caseList.push({ id, submission: c.submission, response: c.response, mode: c.expected.execution_mode, label: c.expected.label_status }); }
  const ALL = Object.assign({}, REQ.GOOD, REQ.BAD, REQ.BYPASS);
  const observedRecords = {}, proposals = {}, impacts = {}, plans = {};
  for (const [rid, r] of Object.entries(ALL)) {
    if (r.isolated_patch) observedRecords[rid] = await OC.observeChange(r, caseList, compileEvidenceGraph, CLOCK);
    const c = PC.compileChangeProposal(r, kbEntries, { observedChange: observedRecords[rid] || null });
    proposals[rid] = c.proposal; impacts[rid] = IA.analyzeChangeImpact(c.proposal); plans[rid] = RS.selectRegressionTests(c.proposal, impacts[rid]);
  }
  out['proposals/OBSERVED_CHANGES.json'] = { generated: CLOCK, statement: 'Each record is what an isolated patch was observed to do to ' + caseList.length + ' synthetic fixtures in a temporary copy. human_disposition is never set here.', records: observedRecords };
  out['proposals/PROPOSALS.json'] = { generated: CLOCK, statement: 'A proposal is not an approved change. None of these has been applied to any Engine version.', proposals };
  out['proposals/IMPACT_ANALYSES.json'] = { generated: CLOCK, impacts };
  out['proposals/REGRESSION_PLANS.json'] = { generated: CLOCK, statement: RS.TEST_CATALOG.length + ' test classes catalogued. No plan states that a change is safe.', plans };

  // 5. Behavioral Drift Ledger: one entry per observed-change record, plus cross-version rows.
  const ledgers = Object.fromEntries(Object.entries(observedRecords).map(([rid, o]) => [rid, { proposal_id: proposals[rid].proposal_id, authorization_state: proposals[rid].authorization_state,
    identity: o.identity, record_sha256: o.record_sha256, summary: o.summary, candidate_compile_failures: o.candidate_compile_failures, rows: o.rows, violations: o.violations, fail: o.violations.length > 0 || o.candidate_compile_failures.length > 0 }]));
  const baselineGraphs = CR.replayCorpus(join(GC, 'cases'), gcReg.fixtures.map((f) => f.id), compileEvidenceGraph, CLOCK).graphs;
  const v02 = JSON.parse(readFileSync(join(REPO, 'research/engine-evidence-contract-2026-10-10/execution-record/EXECUTION_RECORD.json'), 'utf8'));
  const pairs = [['EC-001', 'GC-001'], ['EC-002', 'GC-004'], ['EC-003', 'GC-008']];
  const cross = [];
  for (const [ec, gc] of pairs) {
    const a = v02.cases.find((c) => c.id === ec), g = baselineGraphs[gc];
    for (const f of g.findings) {
      const from = a.statuses[f.condition_id], to = f.status;
      if (from === to) continue;
      cross.push({ baseline_version: '0.2.0 (' + ec + ')', candidate_version: '0.3.0-local (' + gc + ')', fixture_id: ec + '/' + gc, condition: f.condition_id, prior_outcome: from, candidate_outcome: to,
        observed_change: from + ' to ' + to, evidence_graph_difference: 'v0.2 has no graph; v0.3 graph ' + g.nodes.length + ' nodes', changed_limitation: true, changed_refusal_behavior: a.gate !== g.intake.decision,
        classification: 'material', explanation: f.condition_id === 'sufficiency' ? 'v0.3 never marks sufficiency supported' : f.reasons.some((x) => x.startsWith('record_conflict')) ? 'v0.3 detects a record conflict and routes to review' : 'contracts differ: ' + f.reasons.join(', '),
        human_review_required: true, human_disposition: 'not_recorded' });
    }
  }
  out['drift-ledger/DRIFT_LEDGER.json'] = { generated: CLOCK, statement: 'Records observed output differences. Does not accept, apply or approve any of them. human_disposition is recorded only by a person, outside this system.',
    fixtures_compared: caseList.length,
    cross_version_identity: ID.runIdentity({ fixtures: pairs.map(([, gc]) => ({ fixture_id: gc, fixture_hash: baselineGraphs[gc].identity.fixture_hash })),
      command: 'node research/adaptive-reliability-2026-10-13/build-artifacts.mjs (cross-version rows)', mode: 'local_frozen_baseline', clock: CLOCK }),
    cross_version_rows: cross, isolated_proposal_runs: ledgers };

  // 6. Local gate simulation.
  const p = (rel) => existsSync(join(REPO, rel));
  out['gate-simulator/GATE_SIMULATION.json'] = Object.assign({ generated: CLOCK }, GS.simulateGate({
    version_identity: { present: p('research/evidence-graph-compiler-2026-10-10/version-lineage/VERSION_BOUNDARY_MANIFEST.json'), evidence: 'version-lineage/VERSION_BOUNDARY_MANIFEST.json' },
    fixture_integrity: { present: p('research/evidence-graph-compiler-2026-10-10/fixtures/FIXTURE_REGISTER.json') && Object.values(admission).every((x) => !x.length), evidence: 'fixture registers and admission results' },
    prompt_identity: { present: p('research/evidence-graph-compiler-2026-10-10/prompt-contract/PROMPT_MANIFEST.json'), evidence: 'PROMPT_MANIFEST.json' },
    contract_identity: { present: p('lib/engine-evidence-graph/contract.mjs'), evidence: 'contract.mjs version constants' },
    graph_integrity: { present: p('research/evidence-graph-compiler-2026-10-10/execution-record/EXECUTION_RECORD.json'), evidence: 'v0.3 execution record (GV-01 to GV-14)' },
    failure_mode_record: { present: p('research/adaptive-reliability-2026-10-13/ADAPTIVE_FAILURE_MODE_REGISTER.md'), evidence: 'ADAPTIVE_FAILURE_MODE_REGISTER.md' },
    change_impact_analysis: { present: Object.keys(impacts).length > 0, evidence: 'proposals/IMPACT_ANALYSES.json' },
    regression_coverage: { present: Object.keys(plans).length > 0, evidence: 'proposals/REGRESSION_PLANS.json' },
    mutation_coverage: { present: p('research/adaptive-reliability-2026-10-13/execution-record/MUTATION_EVIDENCE.json'), evidence: 'execution-record/MUTATION_EVIDENCE.json' },
    drift_record: { present: true, evidence: 'drift-ledger/DRIFT_LEDGER.json' },
    evaluation_separation_controls: { present: p('research/evidence-graph-compiler-2026-10-10/sealed-evaluation-factory/SEPARATION_CHECK_RESULTS.json'), evidence: 'SEPARATION_CHECK_RESULTS.json' },
    operator_control_evidence: { present: p('research/adaptive-reliability-2026-10-13/operator-console/rendered/index.html'), evidence: 'operator-console/rendered/' },
  }));

  if (failAfter === 'before_write') throw new Error('injected failure before write (test)');
  if (write) {
    const stage = mkdtempSync(join(tmpdir(), 'jrs-stage-'));
    try {
      for (const rel of OUTPUTS) { const v = out[rel]; mkdirSync(dirname(join(stage, rel)), { recursive: true }); writeFileSync(join(stage, rel), typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); }
      if (failAfter === 'mid_write') throw new Error('injected failure during staging (test)');
      for (const rel of OUTPUTS) { mkdirSync(dirname(join(HERE, rel)), { recursive: true }); writeFileSync(join(HERE, rel), readFileSync(join(stage, rel))); }
    } finally { rmSync(stage, { recursive: true, force: true }); }
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
  const trap = installNetworkTrap();
  try {
    const o = await buildAll();
    const c = o['corpus-expansion/CORPUS_EXECUTION_RECORD.json'], s = o['stability-laboratory/STABILITY_RESULTS.json'], d = o['drift-ledger/DRIFT_LEDGER.json'];
    const props = Object.values(o['proposals/PROPOSALS.json'].proposals);
    console.log('knowledge entries: ' + o['knowledge-base/KNOWLEDGE_BASE.jsonl'].split('\n').filter(Boolean).length);
    console.log('corpus: ' + c.as_expected + '/' + c.total + ' as expected; open failures ' + c.open_failures_observed.join(',') + ' (match documented: ' + c.matches_documented_open_failures + ')');
    console.log('stability: ' + s.as_expected + '/' + s.total + ' as expected; open ' + s.open_failures_observed.join(','));
    const states = {}; for (const x of props) states[x.authorization_state] = (states[x.authorization_state] || 0) + 1;
    console.log('proposals: ' + JSON.stringify(states));
    for (const [k, v] of Object.entries(d.isolated_proposal_runs)) console.log('drift ' + k + ': ' + v.rows.length + ' rows, ' + v.violations.length + ' violations, fail=' + v.fail + ', compile failures ' + v.candidate_compile_failures.length + ' -> ' + o['proposals/PROPOSALS.json'].proposals[k].authorization_state);
    console.log('cross-version rows: ' + d.cross_version_rows.length + '; network attempts trapped: ' + trap.count());
    process.exit(trap.count() ? 1 : 0);
  } finally { trap.restore(); }
}

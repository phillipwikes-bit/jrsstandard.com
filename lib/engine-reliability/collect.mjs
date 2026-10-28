// JRS ENGINE RELIABILITY: collect behaviour records from every prior package.
//
// Reads each package through its own frozen replay entry point, in memory, with
// writing disabled. Nothing here edits a fixture, an expectation, an execution
// record or a package. The caller must have installed the network trap.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sha } from './canonical.mjs';
import { recordFromGraph, recordFromEnvelope, recordFromContract, recordFromBridge, recordFromLongRecord } from './baseline.mjs';

export const PACKAGE_CLOCKS = Object.freeze({ v01: '2026-10-10T00:00:00Z', v02: '2026-10-10T00:00:00Z', v03: '2026-10-10T00:00:00Z', phase4: '2026-10-13T00:00:00Z' });
export const CODE_DIRS = Object.freeze(['lib/engine-assurance', 'lib/engine-evidence-contract', 'lib/engine-evidence-graph', 'lib/engine-change-control']);

export function codeIdentity(repo) {
  const out = {};
  for (const d of CODE_DIRS) out[d] = sha(readdirSync(join(repo, d), { recursive: true }).filter((f) => String(f).endsWith('.mjs')).map(String).sort()
    .map((f) => f + '\n' + readFileSync(join(repo, d, f), 'utf8')).join('\n'));
  return out;
}

// Documented open failures only: each entry cites the record that documents it.
export function documentedOpenFailures(repo) {
  const out = {};
  const of = JSON.parse(readFileSync(join(repo, 'research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json'), 'utf8'));
  for (const [id, v] of Object.entries(of.corpus)) out[id] = 'research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json corpus ' + id + ' (' + v.knowledge_id + ')';
  for (const [id, v] of Object.entries(of.stability)) out[id] = 'research/adaptive-reliability-2026-10-13/corpus-expansion/OPEN_FAILURES.json stability ' + id + ' (' + v.knowledge_id + ')';
  const reg = JSON.parse(readFileSync(join(repo, 'research/engine-assurance-2026-10-10/fixtures/FIXTURE_REGISTER.json'), 'utf8'));
  for (const f of reg.fixtures) if (f.category === 'semantic_limitation_demonstration') out[f.fixture_id] = 'research/engine-assurance-2026-10-10/fixtures/FIXTURE_REGISTER.json category semantic_limitation_demonstration; tools/engine-assurance-replay.mjs known_limitations (span presence is not semantic support)';
  return out;
}

export async function collectExistingRecords(repo) {
  const records = [], nestedTrapped = {};
  const url = (p) => new URL('file://' + join(repo, p)).href;
  // v0.1 assurance.
  const { replay } = await import(url('tools/engine-assurance-replay.mjs'));
  const a = await replay({ write: false, clock: PACKAGE_CLOCKS.v01, env: {} });
  if (a.refused) throw new Error('v0.1 replay refused: ' + a.message);
  nestedTrapped.v01 = a.record.network.trapped_attempts;
  for (const row of a.record.fixtures_used) {
    const env = a.envelopes[row.fixture_id];
    if (!env) throw new Error('v0.1 envelope missing for ' + row.fixture_id);
    records.push(recordFromEnvelope(env, { scenarioId: row.fixture_id, category: row.category, replayResult: row.result, normalizedHash: row.hashes ? row.hashes.actual_normalized_output : null }));
  }
  // v0.2 evidence contract.
  const { replayEvidenceContract } = await import(url('tools/engine-evidence-contract-replay.mjs'));
  const b = await replayEvidenceContract({ write: false, clock: PACKAGE_CLOCKS.v02, env: {} });
  if (b.refused) throw new Error('v0.2 replay refused');
  nestedTrapped.v02 = b.record.network.trapped_attempts;
  for (const row of b.record.cases) {
    const o = b.outputs[row.id];
    if (!o) throw new Error('v0.2 output missing for ' + row.id);
    if (row.kind === 'contract_case') records.push(recordFromContract(o, { scenarioId: row.id, category: row.category || 'contract_case', replayResult: row.result }));
    else if (row.kind === 'bridge_case') records.push(recordFromBridge(o, { scenarioId: row.id, replayResult: row.result }));
    else records.push(recordFromLongRecord(o, { scenarioId: row.id, replayResult: row.result }));
  }
  // v0.3 evidence graph.
  const { replayEvidenceGraph } = await import(url('tools/engine-evidence-graph-replay.mjs'));
  const c = await replayEvidenceGraph({ write: false, clock: PACKAGE_CLOCKS.v03, env: {} });
  if (c.refused) throw new Error('v0.3 replay refused');
  nestedTrapped.v03 = c.record.network.trapped_attempts;
  for (const row of c.record.cases) {
    const g = c.graphs[row.id];
    if (!g) throw new Error('v0.3 graph missing for ' + row.id);
    records.push(recordFromGraph(g, { scenarioId: row.id, pkg: 'v0.3-evidence-graph', category: row.category, replayResult: row.result }));
  }
  // Phase 4 corpus and stability laboratory, against the frozen v0.3 compiler.
  const { compileEvidenceGraph } = await import(url('lib/engine-evidence-graph/compiler.mjs'));
  const CR = await import(url('lib/engine-change-control/corpus-replay.mjs'));
  const ST = await import(url('lib/engine-change-control/stability.mjs'));
  const TR = await import(url('research/adaptive-reliability-2026-10-13/stability-laboratory/transforms.mjs'));
  const AR = join(repo, 'research/adaptive-reliability-2026-10-13/corpus-expansion');
  const arReg = JSON.parse(readFileSync(join(AR, 'FIXTURE_REGISTER.json'), 'utf8'));
  const ar = CR.replayCorpus(join(AR, 'cases'), arReg.fixtures.map((f) => f.id), compileEvidenceGraph, PACKAGE_CLOCKS.phase4);
  for (const row of ar.results) {
    const g = ar.graphs[row.id];
    if (!g) throw new Error('Phase 4 graph missing for ' + row.id);
    records.push(recordFromGraph(g, { scenarioId: row.id, pkg: 'phase4-corpus', category: arReg.fixtures.find((f) => f.id === row.id).category, replayResult: row.result }));
  }
  const captured = {}, transformIds = new Set(TR.TRANSFORMS.map((t) => t.id));
  const capture = (args) => { const g = compileEvidenceGraph(args); if (transformIds.has(args.fixtureId)) captured[args.fixtureId] = g; return g; };
  const st = ST.runStabilityLab(TR.TRANSFORMS, TR.BASES, capture, PACKAGE_CLOCKS.phase4);
  for (const r of st.results) {
    const g = captured[r.transform_id];
    if (!g) throw new Error('Phase 4 stability graph missing for ' + r.transform_id);
    records.push(recordFromGraph(g, { scenarioId: r.transform_id, pkg: 'phase4-stability', category: 'stability_' + r.kind, replayResult: r.result }));
  }
  return { records, nestedTrapped };
}

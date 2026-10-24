#!/usr/bin/env node
// JRS ENGINE RELIABILITY 0.6.0-local: builds the Phase 6 local artifacts.
//
//   env -u ANTHROPIC_BASE_URL node research/engine-reliability-phase6-2026-10-17/build-artifacts.mjs
//
// Writes only inside this research package: the baseline manifest, summary and
// hashes; the current regression-library and stability results (after checking
// both seals); and the knowledge register (append-only). Refuses to start with a
// provider credential or endpoint configured; traps every Node network API.
// It never modifies a prior package, fixture, expectation or Engine version.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectProviderConfiguration, installNetworkTrap } from '../../lib/engine-assurance/network-guard.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const REPO = fileURLToPath(new URL('../../', import.meta.url));
export const CLOCK = '2026-10-17T00:00:00Z';

export async function buildArtifacts({ write = true } = {}) {
  if (detectProviderConfiguration(process.env).length) return { refused: true };
  const trap = installNetworkTrap();
  try {
    const C = await import('../../lib/engine-reliability/collect.mjs');
    const B = await import('../../lib/engine-reliability/baseline.mjs');
    const L = await import('../../lib/engine-reliability/library.mjs');
    const ST = await import('../../lib/engine-reliability/stability.mjs');
    const RG = await import('../../lib/engine-reliability/register.mjs');
    const V = await import('../../lib/engine-reliability/vocab.mjs');
    const { evaluatorSha } = await import('../../lib/engine-reliability/evaluator-identity.mjs');
    const { stabilityEvaluatorSha, transformsSha } = await import('./stability-laboratory/seal-transforms.mjs');
    const { compileEvidenceGraph } = await import('../../lib/engine-evidence-graph/compiler.mjs');
    const out = {};

    // A. Baseline manifest over every existing synthetic scenario.
    const { records, nestedTrapped } = await C.collectExistingRecords(REPO);
    const sources = Object.fromEntries(Object.entries(V.PACKAGES).filter(([k]) => k !== 'phase6-library').map(([k, v]) => [k, v]));
    const manifest = B.buildManifest(records, { generatedClock: CLOCK, sources, knownOpenFailures: C.documentedOpenFailures(REPO), codeIdentity: C.codeIdentity(REPO) });
    out['baseline/PHASE6_BASELINE_MANIFEST.json'] = manifest;
    out['baseline/PHASE6_BASELINE_HASHES.json'] = { generated_clock: CLOCK, manifest_hash: manifest.manifest_hash, code_identity: manifest.code_identity,
      records: Object.fromEntries(manifest.records.map((r) => [r.package + '|' + r.scenario_id, { behaviour_hash: r.behaviour_hash, offset_hash: r.offset_hash, raw_output_hash: r.raw_output_hash }])) };
    out['baseline/PHASE6_BASELINE_SUMMARY.md'] = summaryMd(manifest, V);

    // B. Regression library, against its seal.
    const sc = readdirSync(join(HERE, 'regression-library/scenarios')).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(HERE, 'regression-library/scenarios', f), 'utf8')));
    const seal = JSON.parse(readFileSync(join(HERE, 'regression-library/EXPECTATION_SEAL.json'), 'utf8'));
    const sealProblems = L.verifySeal(sc, seal, evaluatorSha());
    const lib = L.runLibrary(sc, compileEvidenceGraph, CLOCK);
    out['regression-library/LIBRARY_RESULTS.json'] = { generated_clock: CLOCK, seal_hash: seal.seal_hash, seal_problems: sealProblems, counts: lib.counts,
      by_category: Object.fromEntries(Object.keys(V.SCENARIO_CATEGORIES).map((c) => [c, sc.filter((s) => s.category === c).length])),
      by_kind: Object.fromEntries(V.EXPECTATION_KINDS.map((k) => [k, sc.filter((s) => s.expectation_kind === k).length])), results: lib.results, results_hash: lib.results_hash,
      statement: 'Engineering-authored expected safe behaviour, sealed before execution. Not adjudicated labels; an as_expected result is not an accuracy result.' };

    // E2. Stability laboratory, against its seal.
    const TR = await import('./stability-laboratory/transforms.mjs');
    const sseal = JSON.parse(readFileSync(join(HERE, 'stability-laboratory/STABILITY_SEAL.json'), 'utf8'));
    const stabSealProblems = [];
    if (sseal.transforms_sha256 !== transformsSha()) stabSealProblems.push('transforms changed since the seal');
    if (sseal.stability_evaluator_sha256 !== stabilityEvaluatorSha()) stabSealProblems.push('stability evaluator changed since the seal');
    const stab = ST.runTransforms(TR.TRANSFORMS, TR.BASES, compileEvidenceGraph, CLOCK);
    out['stability-laboratory/STABILITY_RESULTS.json'] = Object.assign({ generated_clock: CLOCK, seal_problems: stabSealProblems }, stab);

    // D. Knowledge register: append only.
    const regPath = join(HERE, 'knowledge-register/KNOWLEDGE_REGISTER.jsonl');
    const before = existsSync(regPath) ? readFileSync(regPath, 'utf8') : '';
    const { ENTRIES } = await import('./knowledge-register/entries.mjs');
    let text = before; const have = new Set(RG.parseRegister(before).map((e) => e.entry_id));
    for (const e of ENTRIES) if (!have.has(e.entry_id)) text = RG.appendEntry(text, e);
    if (!RG.isAppendOnly(before, text)) throw new Error('knowledge register append-only check failed');
    out['knowledge-register/KNOWLEDGE_REGISTER.jsonl'] = text;

    if (write) for (const [p, v] of Object.entries(out)) { mkdirSync(join(HERE, p, '..'), { recursive: true }); writeFileSync(join(HERE, p), typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); }
    return { manifest, lib, stab, register: text, sealProblems, stabSealProblems, trapped: trap.count(), nestedTrapped };
  } finally { trap.restore(); }
}

function summaryMd(m, V) {
  const L = [];
  L.push('# Phase 6 Baseline Behaviour Manifest: Summary', '');
  L.push('**LOCAL ENGINEERING MATERIAL ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION.**', '');
  L.push('Generated with a fixed clock (' + m.generated_clock + '). Manifest hash `' + m.manifest_hash + '`. Release status `' + m.release_status + '`.', '');
  L.push(m.label_policy, '');
  L.push('## What the baseline records', '');
  L.push('For every existing synthetic scenario of the v0.1, v0.2, v0.3 and Phase 4 packages: the scenario identifier, its source package and version, the gate, every condition-level outcome, refusal codes, quotation states, limitation kinds, Cognitive Control or record-control defects, the human-review route, a structural summary and three hashes (behaviour, offsets, raw package output). Each package was read through its own frozen replay with writing disabled; no package was modified.', '');
  L.push('## Counts', '', '| Package | Scenarios |', '|---|---|');
  for (const [k, v] of Object.entries(m.counts.by_package)) L.push('| ' + k + ' | ' + v + ' |');
  L.push('| **Total** | **' + m.counts.total + '** |', '', '| Baseline class | Scenarios | Meaning |', '|---|---|---|');
  const meaning = { known_open_failure: 'documented open failure, or the package\'s own frozen expectation was not met on this run', intentional_refusal: 'the gate refused or escalated, or the candidate response was refused by the contract',
    not_assessed: 'every condition not_assessed, or no condition-level output', unsupported_or_ambiguous: 'a non-sufficiency condition routed to review, an unusable quotation, a conflict or instruction risk',
    expected_behavior: 'none of the above recorded; not a statement that the result is right' };
  for (const c of V.BASELINE_CLASSES) L.push('| ' + c + ' | ' + m.counts.by_class[c] + ' | ' + meaning[c] + ' |');
  L.push('', 'Class precedence is the order above: the first that applies is recorded.', '', '## Documented open failures carried into the baseline', '', '| Scenario | Source |', '|---|---|');
  for (const [k, v] of Object.entries(m.known_open_failure_sources)) L.push('| ' + k + ' | ' + v + ' |');
  L.push('', '## Per-package class breakdown', '', '| Package | known_open_failure | intentional_refusal | not_assessed | unsupported_or_ambiguous | expected_behavior |', '|---|---|---|---|---|---|');
  for (const p of Object.keys(m.counts.by_package)) L.push('| ' + p + ' | ' + V.BASELINE_CLASSES.map((c) => m.records.filter((r) => r.package === p && r.baseline_class === c).length).join(' | ') + ' |');
  L.push('', '## Limitations', '');
  L.push('- Every scenario and every frozen expectation was written by engineering sessions; agreement shows code doing what its authors intended, not that the intent is right.');
  L.push('- The behaviour hash excludes offsets (kept in the offset hash) and run identifiers. It is a regression fingerprint, not a quality measure.');
  L.push('- Long-record cases of v0.2 carry gate null because the frozen v0.2 replay does not return their gate (P6K-012).');
  L.push('- Baseline classes describe the shape of a result. No class means correct, accurate, approved or validated.');
  return L.join('\n') + '\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await buildArtifacts();
  if (r.refused) { console.error('REFUSED: provider configuration present; nothing was executed.'); process.exit(3); }
  console.log('baseline ' + r.manifest.counts.total + ' records, hash ' + r.manifest.manifest_hash);
  console.log('library ' + JSON.stringify(r.lib.counts) + ' seal problems ' + r.sealProblems.length);
  console.log('stability ' + r.stab.as_expected + '/' + r.stab.total + ' as expected; seal problems ' + r.stabSealProblems.length);
  console.log('register ' + r.register.trim().split('\n').length + ' entries; network attempts trapped ' + r.trapped + ' (nested ' + JSON.stringify(r.nestedTrapped) + ')');
  process.exit(r.trapped || r.sealProblems.length || r.stabSealProblems.length ? 1 : 0);
}

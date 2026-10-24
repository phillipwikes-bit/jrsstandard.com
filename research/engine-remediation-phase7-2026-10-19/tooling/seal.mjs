#!/usr/bin/env node
// JRS PHASE 7: produces INTENDED_CHANGE_SET.json and SEAL.json before candidate logic exists.
// Refuses if a seal exists, or if the candidate directory differs from frozen v0.3
// in anything other than the rule-pack data files.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { detectProviderConfiguration, installNetworkTrap } from '../../../lib/engine-assurance/network-guard.mjs';
import { REPO, P7, existingInputs, phase7Inputs, inputHash } from './inputs.mjs';
import { triggers, expectedStatuses } from './prescan.mjs';
import { submissionFor } from './scenario-schema.mjs';
import { canonical, sha } from '../../../lib/engine-reliability/canonical.mjs';

export const EVALUATOR_FILES = ['research/engine-remediation-phase7-2026-10-19/tooling/prescan.mjs', 'research/engine-remediation-phase7-2026-10-19/tooling/scenario-schema.mjs',
  'research/engine-remediation-phase7-2026-10-19/tooling/inputs.mjs', 'lib/engine-reliability/library.mjs', 'lib/engine-reliability/baseline.mjs', 'lib/engine-reliability/differ.mjs',
  'lib/engine-reliability/stability.mjs', 'lib/engine-reliability/vocab.mjs', 'lib/engine-reliability/canonical.mjs'];
export const fileSha = (p) => sha(readFileSync(join(REPO, p), 'utf8'));
export const candidateDiff = () => {
  const a = join(REPO, 'lib/engine-evidence-graph'), b = join(REPO, 'lib/engine-evidence-graph-v0.3.1-candidate');
  const list = (d) => readdirSync(d, { recursive: true }).map(String).filter((f) => f.endsWith('.mjs')).sort();
  return { same_files: JSON.stringify(list(a)) === JSON.stringify(list(b)), differing: list(b).filter((f) => !existsSync(join(a, f)) || readFileSync(join(a, f), 'utf8') !== readFileSync(join(b, f), 'utf8')) };
};

if (process.argv[1] && process.argv[1].endsWith('seal.mjs')) {
  if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
  if (existsSync(join(P7, 'SEAL.json'))) { console.error('REFUSED: SEAL.json already exists'); process.exit(4); }
  const cd = candidateDiff();
  if (!cd.same_files || cd.differing.length) { console.error('REFUSED: candidate logic already differs from v0.3: ' + cd.differing.join(',')); process.exit(4); }
  const trap = installNetworkTrap();
  const { compileEvidenceGraph } = await import('../../../lib/engine-evidence-graph/compiler.mjs');
  const run = (submission, response, mode, id) => { try { return compileEvidenceGraph({ submission, candidateResponseText: response, executionMode: mode, clock: '2026-10-19T00:00:00Z', fixtureId: id }); } catch { return null; } };
  const existing = await existingInputs();
  const changes = [];
  for (const i of existing) {
    const g = run(i.submission, i.response, i.mode, i.id);
    const t = triggers(i.submission.record_text, g);
    if (t.length) changes.push(Object.assign({ id: i.id, family: i.family, rules: t, v03_statuses: g ? Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status])) : null }, g ? expectedStatuses(i.submission.record_text, g, t) : { base_error: true }));
  }
  const p7 = phase7Inputs();
  const p7Checks = p7.map((s) => { const g = run(submissionFor(s), s.candidate_response_text, s.execution_mode, s.scenario_id); return { id: s.scenario_id, prescan: triggers(s.record_text, g).sort(), declared: [...s.differential.rules].sort() }; });
  const mismatched = p7Checks.filter((c) => JSON.stringify(c.prescan) !== JSON.stringify(c.declared));
  if (mismatched.length) { console.error('REFUSED: declared rules differ from the pre-scan: ' + JSON.stringify(mismatched)); process.exit(2); }
  const ics = { statement: 'Predicted before candidate logic existed, by an independent implementation of each rule trigger over frozen v0.3 helpers and output. Outcomes follow REMEDIATION_CONTRACT.md.',
    existing_inputs: existing.length, triggered: changes.length, changes };
  writeFileSync(join(P7, 'INTENDED_CHANGE_SET.json'), JSON.stringify(ics, null, 2) + '\n');
  const manifest = { existing: existing.map((i) => ({ id: i.id, family: i.family, input_sha256: inputHash(i) })),
    phase7: p7.map((s) => ({ id: s.scenario_id, input_sha256: inputHash({ submission: submissionFor(s), response: s.candidate_response_text, mode: s.execution_mode }) })) };
  writeFileSync(join(P7, 'CANDIDATE_INPUT_MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
  const packs = readdirSync(join(REPO, 'lib/engine-evidence-graph-v0.3.1-candidate/rule-packs')).sort().map((f) => ({ file: f, sha256: fileSha('lib/engine-evidence-graph-v0.3.1-candidate/rule-packs/' + f) }));
  const seal = {
    sealed_at: new Date().toISOString(), candidate_logic_identical_to_v03_at_seal: true, candidate_version: '0.3.1-candidate', base_compiler_sha256: (await import('../../../lib/engine-evidence-graph/compiler.mjs')).compilerHash(),
    contract_sha256: fileSha('research/engine-remediation-phase7-2026-10-19/REMEDIATION_CONTRACT.md'),
    scenarios: Object.fromEntries(p7.map((s) => [s.scenario_id, sha(canonical(s))])), scenario_count: p7.length,
    transforms_sha256: fileSha('research/engine-remediation-phase7-2026-10-19/stability/transforms.mjs'),
    rule_packs: packs, intended_change_set_sha256: fileSha('research/engine-remediation-phase7-2026-10-19/INTENDED_CHANGE_SET.json'),
    candidate_input_manifest_sha256: fileSha('research/engine-remediation-phase7-2026-10-19/CANDIDATE_INPUT_MANIFEST.json'),
    evaluator_files: Object.fromEntries(EVALUATOR_FILES.map((f) => [f, fileSha(f)])), network_attempts: trap.count(),
  };
  seal.seal_sha256 = sha(canonical(Object.assign({}, seal, { sealed_at: undefined })));
  writeFileSync(join(P7, 'SEAL.json'), JSON.stringify(seal, null, 2) + '\n');
  trap.restore();
  console.log('sealed at ' + seal.sealed_at + ': ' + p7.length + ' scenarios, ' + changes.length + ' intended existing changes of ' + existing.length + ' inputs, ' + packs.length + ' packs; network ' + seal.network_attempts);
}

// JRS PHASE 7: checks that every sealed item is unchanged since SEAL.json was written.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, P7, phase7Inputs } from './inputs.mjs';
import { canonical, sha } from '../../../lib/engine-reliability/canonical.mjs';

export function verifySeal() {
  const seal = JSON.parse(readFileSync(join(P7, 'SEAL.json'), 'utf8')), p = [];
  const f = (rel) => sha(readFileSync(join(REPO, rel), 'utf8'));
  if (seal.seal_sha256 !== sha(canonical(Object.assign({}, seal, { sealed_at: undefined, seal_sha256: undefined })))) p.push('seal content hash mismatch');
  if (seal.contract_sha256 !== f('research/engine-remediation-phase7-2026-10-19/REMEDIATION_CONTRACT.md')) p.push('contract changed');
  if (seal.transforms_sha256 !== f('research/engine-remediation-phase7-2026-10-19/stability/transforms.mjs')) p.push('transforms changed');
  if (seal.intended_change_set_sha256 !== f('research/engine-remediation-phase7-2026-10-19/INTENDED_CHANGE_SET.json')) p.push('intended change set changed');
  if (seal.candidate_input_manifest_sha256 !== f('research/engine-remediation-phase7-2026-10-19/CANDIDATE_INPUT_MANIFEST.json')) p.push('input manifest changed');
  const sc = phase7Inputs();
  if (sc.length !== seal.scenario_count) p.push('scenario count changed');
  for (const s of sc) if (seal.scenarios[s.scenario_id] !== sha(canonical(s))) p.push('scenario changed: ' + s.scenario_id);
  const packs = readdirSync(join(REPO, 'lib/engine-evidence-graph-v0.3.1-candidate/rule-packs')).sort();
  if (JSON.stringify(packs) !== JSON.stringify(seal.rule_packs.map((x) => x.file))) p.push('rule-pack set changed');
  for (const x of seal.rule_packs) if (packs.includes(x.file) && f('lib/engine-evidence-graph-v0.3.1-candidate/rule-packs/' + x.file) !== x.sha256) p.push('rule pack changed: ' + x.file);
  for (const [file, h] of Object.entries(seal.evaluator_files)) if (f(file) !== h) p.push('evaluator file changed: ' + file);
  return p;
}

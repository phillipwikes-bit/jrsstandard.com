#!/usr/bin/env node
// JRS PHASE 8 governance: records one admission in governance/ADMISSIONS.json after the admission gate passes.
//   node research/engine-governance-phase8-2026-10-19/governance/admit-package.mjs <proposal.json>
// Refuses if the package is already admitted, if any file exists in its approved paths, or if the gate rejects it.
// An admission record is written once and never rewritten; the registry builder merges it into the registry.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { evaluateAdmission } from '../../../lib/engine-governance-phase8/admission.mjs';
import { decidedReferences } from '../../../lib/engine-governance-phase8/decisions.mjs';
import { hashOf, parseManifestText } from '../../../lib/engine-governance-phase8/registry.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const P8 = 'research/engine-governance-phase8-2026-10-19';
export const ADMISSIONS = join(REPO, P8, 'governance/ADMISSIONS.json');

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const proposal = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const reg = JSON.parse(readFileSync(join(REPO, P8, 'governance/LATER_PACKAGE_REGISTRY.json'), 'utf8'));
  const existing = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: REPO, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const phase6Files = new Set(parseManifestText(readFileSync(join(REPO, P8, 'registry/manifests/phase6-reliability.sha256'), 'utf8')).map((r) => r.path));
  const onDisk = proposal.approved_paths.filter((p) => existsSync(join(REPO, p.replace(/\/$/, ''))));
  const adm = existsSync(ADMISSIONS) ? JSON.parse(readFileSync(ADMISSIONS, 'utf8')) : { record_type: 'jrs-phase8-admissions/1.0.0', rule: 'Each admission is written once, before any file of the package exists, and is never rewritten.', admissions: [] };
  if (adm.admissions.some((a) => a.package_id === proposal.package_id)) { console.error('REFUSED: already admitted'); process.exit(2); }
  if (onDisk.length) { console.error('REFUSED: approved paths already exist: ' + onDisk.join(', ')); process.exit(2); }
  const gate = evaluateAdmission(proposal, { registry: reg, existingFiles: existing, decidedReferences: decidedReferences(), phase6Files });
  if (!gate.admissible) { console.error('REFUSED: ' + gate.problems.join('; ')); process.exit(2); }
  const record = { package_id: proposal.package_id, package_version: proposal.package_version, owner_decision_reference: proposal.owner_decision_reference, approved_paths: proposal.approved_paths,
    manifest_file: proposal.manifest_file, status: 'local_construction_only', reason: proposal.purpose, restrictions: proposal.restrictions, required_conditions: gate.computed_affected_checks,
    gate_result: 'admissible', authorizes_work_beyond_owner_reference: false, admitted_at: new Date().toISOString(), files_present_at_admission: 0, proposal_sha256: hashOf(proposal) };
  adm.admissions.push(record);
  writeFileSync(ADMISSIONS, JSON.stringify(adm, null, 2) + '\n');
  console.log('admitted ' + record.package_id + ' at ' + record.admitted_at + ' with conditions ' + record.required_conditions.join(', '));
}

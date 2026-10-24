#!/usr/bin/env node
// JRS PHASE 8.1: writes governance/LATER_PACKAGE_REGISTRY.json from recorded evidence and validates it.
//   node research/engine-governance-phase8-2026-10-19/governance/build-later-registry.mjs
// Phase 6 and Phase 7 hashes come from the Phase 8 version registry; the Phase 8 hash is the hash of
// PHASE8_FILE_MANIFEST_SHA256.txt rows (the registry file is excluded from that manifest to avoid a cycle).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { hashOf, sha256, STATUS_LINES, RELEASE_STATUS, parseManifestText } from '../../../lib/engine-governance-phase8/registry.mjs';
import { decidedReferences } from '../../../lib/engine-governance-phase8/decisions.mjs';
import { affectedChecksFor, validateLaterRegistry, ownsLater, governanceHash, registrySummary, packageStateFor } from '../../../lib/engine-governance-phase8/later-packages.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const P8 = 'research/engine-governance-phase8-2026-10-19';
const J = (p) => JSON.parse(readFileSync(join(REPO, p), 'utf8'));

export const phase8ManifestHash = (root = REPO) => { const t = readFileSync(join(root, P8, 'PHASE8_FILE_MANIFEST_SHA256.txt'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).join('\n') + '\n'; return 'sha256:' + sha256(t); };
export function registryContext(root = REPO) {
  const vr = JSON.parse(readFileSync(join(root, P8, 'registry/VERSION_REGISTRY.json'), 'utf8'));
  const phase6Files = new Set(parseManifestText(readFileSync(join(root, P8, 'registry/manifests/phase6-reliability.sha256'), 'utf8')).map((r) => r.path));
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  return { vr, phase6Files, untracked, manifestHashes: { 'phase6-reliability': vr.packages.find((p) => p.id === 'phase6-reliability').package_sha256, 'phase7-candidate': vr.packages.find((p) => p.id === 'phase7-candidate').package_sha256, 'phase8-governance': phase8ManifestHash(root) },
    evidenceExists: (p) => existsSync(join(root, p)), decidedReferences: decidedReferences(), packageStates: packageStates(root, untracked) };
}

// Phase 8.2 admission correction: the state of every admitted package, derived from its files and its own manifest.
export function packageStates(root, untracked) {
  const f = join(root, P8, 'governance/LATER_PACKAGE_REGISTRY.json');
  if (!existsSync(f)) return {};
  const reg = JSON.parse(readFileSync(f, 'utf8'));
  const readText = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : null);
  const shaOf = (p) => (existsSync(join(root, p)) ? sha256(readFileSync(join(root, p))) : null);
  return Object.fromEntries(reg.packages.filter((e) => e.entry_class === 'admitted_future_package').map((e) => [e.package_id, packageStateFor(e, untracked.filter((x) => ownsLater(e, x)), readText, shaOf)]));
}

const PERM = { may_affect_historical_results: false, may_affect_composition_results: true, may_affect_public_or_deployment: false };
export function buildRegistry(ctx) {
  const entry = (o) => Object.assign({ entry_class: 'retroactive_seed', permissions: PERM, seeded_retroactively: true, admission_record: null }, o, { affected_earlier_checks: affectedChecksFor(o.package_id, o.approved_paths, ctx.phase6Files) });
  const pkgs = [
    entry({ package_id: 'phase6-reliability', package_version: '1.0.0', created: '2026-10-17', status: 'preserved_local_only',
      owner_decision_reference: { reference: 'Phase 6 assignment (owner, 2026-10-17)', evidence_path: 'research/engine-reliability-phase6-2026-10-17/OWNER_DECISION_REGISTER.md', evidence_note: 'Decisions-taken row dated 2026-10-17: "Phase 6 assignment".', formal_decision_record: false },
      approved_paths: ['lib/engine-reliability/', 'tests/engine-reliability/', 'tools/engine-reliability-replay.mjs', 'research/engine-reliability-phase6-2026-10-17/'],
      manifest_binding: { manifest_file: P8 + '/registry/manifests/phase6-reliability.sha256', package_sha256: ctx.manifestHashes['phase6-reliability'] },
      reason: 'Controlled reliability, regression and adaptation framework over the frozen v0.3 compiler.' }),
    entry({ package_id: 'phase7-candidate', package_version: '0.3.1', created: '2026-10-19', status: 'preserved_local_only',
      owner_decision_reference: { reference: 'Phase 7 assignment (owner, 2026-10-19)', evidence_path: 'research/engine-remediation-phase7-2026-10-19/REMEDIATION_CONTRACT.md', evidence_note: 'Section "Stop conditions (from the assignment)"; post-stop authorizations in execution-record/.', formal_decision_record: false },
      approved_paths: ['lib/engine-evidence-graph-v0.3.1-candidate/', 'tests/engine-remediation-phase7/', 'research/engine-remediation-phase7-2026-10-19/'],
      manifest_binding: { manifest_file: P8 + '/registry/manifests/phase7-candidate.sha256', package_sha256: ctx.manifestHashes['phase7-candidate'] },
      reason: 'Separately versioned v0.3.1 remediation candidate and its change qualification.' }),
    entry({ package_id: 'phase8-governance', package_version: '1.1.0', created: '2026-10-19', status: 'present_local_only',
      owner_decision_reference: { reference: 'Phase 8 assignment (owner, 2026-10-19) and Phase 8.1 assignment (owner, 2026-10-20)', evidence_path: P8 + '/OWNER_DECISION_REGISTER.md', evidence_note: 'Decisions-taken rows: "Proceed with Phase 8 as specified" and the Phase 8.1 governance repair.', formal_decision_record: false },
      approved_paths: ['lib/engine-governance-phase8/', 'tests/engine-governance-phase8/', 'tools/engine-governance-phase8-replay.mjs', P8 + '/'],
      manifest_binding: { manifest_file: P8 + '/PHASE8_FILE_MANIFEST_SHA256.txt', package_sha256: ctx.manifestHashes['phase8-governance'], note: 'Hash of the manifest rows; this registry file is excluded from that manifest.' },
      reason: 'Candidate preservation, cross-package test governance and execution-disabled evaluation readiness.' }),
  ];
  // Admitted future packages come only from governance/ADMISSIONS.json (written once by admit-package.mjs).
  const af = join(REPO, P8, 'governance/ADMISSIONS.json');
  const admissions = existsSync(af) ? JSON.parse(readFileSync(af, 'utf8')).admissions : [];
  for (const a of admissions) pkgs.push({ package_id: a.package_id, package_version: a.package_version, entry_class: 'admitted_future_package', created: a.admitted_at.slice(0, 10), status: a.status,
    owner_decision_reference: { reference: a.owner_decision_reference, evidence_path: P8 + '/decisions/OWNER_DECISIONS.json', evidence_note: 'Recorded owner authorization (decided, local package construction only).', formal_decision_record: true },
    approved_paths: a.approved_paths, manifest_binding: { manifest_file: a.manifest_file, required_once_files_exist: true }, reason: a.reason, restrictions: a.restrictions,
    affected_earlier_checks: affectedChecksFor(a.package_id, a.approved_paths, ctx.phase6Files), permissions: PERM, seeded_retroactively: false,
    admission_record: { gate_result: a.gate_result, owner_decision_reference: a.owner_decision_reference, admitted_at: a.admitted_at, files_present_at_admission: a.files_present_at_admission, proposal_sha256: a.proposal_sha256 } });
  const reg = { registry_type: 'jrs-phase8-1-later-package-registry', registry_version: '1.1.0', amended_by: 'Phase 8.2 governance amendment (2026-10-20): entry classes, derived counts, Phase 8 scope classification', status_lines: STATUS_LINES, release_status: RELEASE_STATUS, b018_status: 'OPEN',
    statement: 'Records which local packages were added after each earlier package and which earlier checks they affect. A registry status is not a validation, release, ownership, commercial or deployment status. B-018 remains OPEN and is not addressed by this registry.',
    language_rule: 'Earlier package results remain historically recorded results for their sealed package scope. A later whole-worktree run may show a declared compatibility condition without establishing a defect in the earlier package.',
    packages: pkgs };
  reg.summary = registrySummary(reg);
  reg.governance_sha256 = governanceHash(reg);
  reg.registry_sha256 = hashOf(reg);
  return reg;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ctx = registryContext();
  const reg = buildRegistry(ctx);
  const filesByPackage = Object.fromEntries(reg.packages.map((e) => [e.package_id, ctx.untracked.filter((f) => ownsLater(e, f))]));
  const problems = validateLaterRegistry(reg, Object.assign({}, ctx, { filesByPackage }));
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  writeFileSync(join(REPO, P8, 'governance/LATER_PACKAGE_REGISTRY.json'), JSON.stringify(reg, null, 2) + '\n');
  console.log('registry: ' + reg.packages.map((e) => e.package_id + ' [' + e.affected_earlier_checks.join(', ') + ']').join('; '));
}

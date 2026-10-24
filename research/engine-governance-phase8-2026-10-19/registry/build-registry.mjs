#!/usr/bin/env node
// JRS PHASE 8: writes the package manifests and VERSION_REGISTRY.json once, then only verifies.
//   node research/engine-governance-phase8-2026-10-19/registry/build-registry.mjs [--verify]
// On first run (no manifests yet) it records every earlier package. When manifests exist it
// never overwrites them: it rebuilds in memory and fails closed on any difference.

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { PACKAGES, BASELINE_COMMIT, STATUS_LINES, RELEASE_STATUS, buildManifest, listFiles, hashOf } from '../../../lib/engine-governance-phase8/registry.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const HERE = fileURLToPath(new URL('./', import.meta.url));
const MAN = join(HERE, 'manifests');
const PHASE7_HANDOFF_AT = '2026-10-19T13:58:06Z'; // last Phase 7 write (render record 13:58:05.57Z) rounded up

export function registryFromManifests(manifests) {
  return {
    registry_type: 'jrs-phase8-version-registry/1.0.0', status_lines: STATUS_LINES, release_status: RELEASE_STATUS, baseline_commit: BASELINE_COMMIT,
    statement: 'Describes earlier packages and their file hashes. Makes no readiness, validation, ownership, commercial or release statement.',
    packages: PACKAGES.map((p) => ({ id: p.id, title: p.title, status: p.status, eligible_for_future_owner_review: p.eligible_for_future_owner_review, kind: p.kind, source_paths: p.paths,
      git_object: p.git_object || null, shared_with: p.shared_with || null, file_count: manifests[p.id].file_count, package_sha256: manifests[p.id].package_sha256,
      git_object_content_sha256: manifests[p.id].git_object ? manifests[p.id].git_object.content_sha256 : null,
      manifest_file: 'research/engine-governance-phase8-2026-10-19/registry/manifests/' + p.id + '.sha256', test_command: p.test_command,
      latest_recorded_result: p.recorded_result, known_limitations: p.limitations })),
  };
}

function phase7Evidence() {
  // Independent corroboration that the Phase 7 files are those of the final handoff.
  const p7 = PACKAGES.find((p) => p.id === 'phase7-candidate');
  const files = listFiles(REPO, p7);
  const latest = files.map((f) => statSync(join(REPO, f)).mtime.toISOString()).sort().pop();
  return { files: files.length, latest_modification: latest, final_handoff_write_bound: PHASE7_HANDOFF_AT, modified_after_handoff: latest > PHASE7_HANDOFF_AT };
}

export async function run({ verifyOnly = false } = {}) {
  const manifests = Object.fromEntries(PACKAGES.map((p) => [p.id, buildManifest(REPO, p)]));
  const again = Object.fromEntries(PACKAGES.map((p) => [p.id, buildManifest(REPO, p)]));
  const reproducible = PACKAGES.every((p) => manifests[p.id].package_sha256 === again[p.id].package_sha256);
  const problems = [];
  if (!reproducible) problems.push('manifest not reproducible within one run');
  const tracked = execFileSync('git', ['diff', '--name-only', BASELINE_COMMIT], { cwd: REPO, encoding: 'utf8' }).trim();
  if (tracked) problems.push('tracked files differ from baseline: ' + tracked);
  for (const p of PACKAGES) if (p.git_object && !manifests[p.id].git_object.blob_matches_record) problems.push('v1 git object mismatch');
  const { verifySeal } = await import('../../engine-remediation-phase7-2026-10-19/tooling/verify-seal.mjs');
  const seal = verifySeal();
  if (seal.length) problems.push('Phase 7 seal: ' + seal.join('; '));
  const ev = phase7Evidence();
  if (ev.modified_after_handoff) problems.push('a Phase 7 file was modified after the final handoff');
  const exists = existsSync(join(MAN, 'phase7-candidate.sha256'));
  if (exists) {
    for (const p of PACKAGES) { const rec = readFileSync(join(MAN, p.id + '.sha256'), 'utf8'); if (rec !== manifests[p.id].manifest_text) problems.push('package differs from recorded manifest: ' + p.id); }
  } else if (!verifyOnly && !problems.length) {
    mkdirSync(MAN, { recursive: true });
    for (const p of PACKAGES) writeFileSync(join(MAN, p.id + '.sha256'), manifests[p.id].manifest_text);
    const reg = registryFromManifests(manifests);
    reg.recorded_at = new Date().toISOString();
    reg.phase7_corroboration = { seal_verifies: seal.length === 0, ...ev, note: 'Phase 7 kept no complete file manifest of its own. Its seal (contract, scenarios, transforms, rule packs, evaluator files) verifies, and no Phase 7 file was modified after the final handoff write. The Phase 8 manifest is the first complete cryptographic manifest of the Phase 7 package.' };
    const { recorded_at, ...stable } = reg; reg.registry_sha256 = hashOf(stable);
    writeFileSync(join(HERE, 'VERSION_REGISTRY.json'), JSON.stringify(reg, null, 2) + '\n');
  } else if (!exists) problems.push('no recorded manifests');
  return { problems, reproducible, phase7: ev, counts: Object.fromEntries(PACKAGES.map((p) => [p.id, manifests[p.id].file_count])), hashes: Object.fromEntries(PACKAGES.map((p) => [p.id, manifests[p.id].package_sha256])) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await run({ verifyOnly: process.argv.includes('--verify') });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.problems.length ? 1 : 0);
}

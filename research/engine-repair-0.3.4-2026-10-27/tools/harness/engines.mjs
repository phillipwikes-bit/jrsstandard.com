// 0.3.4 repair package harness 2.0: isolated copies of each Engine version under test.
// Derived from the 156-record study harness 1.0 (research/study-156-2026-10-27/tools/harness/engines.mjs, unchanged),
// with one addition: 0.3.4-research-candidate from candidate/ in this package.
//
// Every version runs from a temporary copy that is verified against its own manifest before use, snapshotted,
// re-verified after use and deleted. Nothing is imported from the live lib/ directory.
//   0.3.1-candidate          frozen Engine of record (Phase 7 manifest 815c5d56...)
//   0.3.2-candidate          V0-02 correction candidate (manifest 2276bbc2...), not adopted
//   0.3.3-research-candidate the study's frozen research candidate (manifest fad69b62..., pinned), not adopted
//   0.3.4-research-candidate this package's repair candidate, not adopted
// No network module is imported here. Callers install the network guard first.
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createIsolatedCopy, verifyAndDelete as v0VerifyAndDelete } from '../../../validation-readiness-gate-v0-2026-10-25/tools/harness/isolate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG = join(HERE, '..', '..');
const RESEARCH = join(PKG, '..');
export const STUDY = join(RESEARCH, 'study-156-2026-10-27');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const walk = (d) => readdirSync(d).sort().flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const snapshot = (root) => Object.fromEntries(walk(root).map((p) => [relative(root, p), sha(readFileSync(p))]));

export const VERSIONS = Object.freeze({
  '0.3.1-candidate': { dir: 'engine-evidence-graph-v0.3.1-candidate', manifest_sha256: '815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3' },
  '0.3.2-candidate': { dir: 'engine-evidence-graph-v0.3.2-candidate', manifest_sha256: '2276bbc22e1e226220b471b27b793119d37ceb6e093a91d1ecbafae31a200f18',
    src: join(RESEARCH, 'engine-correction-v0-02-ev32-2026-10-25', 'candidate'), manifest: join(RESEARCH, 'engine-correction-v0-02-ev32-2026-10-25', 'CANDIDATE_0.3.2_MANIFEST_SHA256.txt') },
  '0.3.3-research-candidate': { dir: 'engine-evidence-graph-v0.3.3-research-candidate', manifest_sha256: 'fad69b62554a8e8cb6aa97ba9a85b5ee4f80ebfff565a3705dfc91f8dc100477',
    src: join(STUDY, 'candidate'), manifest: join(STUDY, 'CANDIDATE_0.3.3_MANIFEST_SHA256.txt') },
  '0.3.4-research-candidate': { dir: 'engine-evidence-graph-v0.3.4-research-candidate', src: join(PKG, 'candidate'), manifest: join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt') },
});

function isolateFromManifest(version, scratch, { requireManifest }) {
  const v = VERSIONS[version];
  const tmp = mkdtempSync(join(scratch, 'iso-' + version.split('-')[0] + '-'));
  cpSync(v.src, tmp, { recursive: true });
  let manifestSha = null, verified = 0;
  if (existsSync(v.manifest)) {
    const m = readFileSync(v.manifest);
    manifestSha = sha(m);
    if (v.manifest_sha256 && manifestSha !== v.manifest_sha256) throw new Error('manifest_hash_mismatch:' + version);
    const rows = m.toString('utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => [l.slice(66), l.slice(0, 64)]);
    const listed = new Set(rows.map((r) => r[0]));
    for (const [f, h] of rows) { if (sha(readFileSync(join(tmp, f))) !== h) throw new Error('isolated_copy_mismatch:' + version + ':' + f); verified++; }
    for (const f of walk(tmp).map((p) => relative(tmp, p))) if (!listed.has(f)) throw new Error('isolated_copy_unlisted_file:' + version + ':' + f);
  } else if (requireManifest || v.manifest_sha256) throw new Error('manifest_missing:' + version);
  const before = snapshot(tmp);
  return { version, root: tmp, manifest_sha256: manifestSha, files_verified: verified, snapshot_sha256: sha(JSON.stringify(before)), before };
}

// Returns { version, root, ..., release() }. requireManifest is true for any scored run.
export function isolate(version, scratch, { requireManifest = true } = {}) {
  if (!VERSIONS[version]) throw new Error('unknown_version:' + version);
  if (version === '0.3.1-candidate') {
    const iso = createIsolatedCopy(scratch);
    return { version, root: iso.root, manifest_sha256: VERSIONS[version].manifest_sha256, files_verified: iso.candidateFilesVerified,
      snapshot_sha256: sha(JSON.stringify(iso.snapshotBefore)), release: () => v0VerifyAndDelete(iso) };
  }
  const iso = isolateFromManifest(version, scratch, { requireManifest });
  iso.release = () => {
    const after = snapshot(iso.root);
    const changed = Object.keys(iso.before).filter((k) => after[k] !== iso.before[k]).concat(Object.keys(after).filter((k) => !(k in iso.before)));
    rmSync(iso.root, { recursive: true, force: true });
    return { unchanged: changed.length === 0, changed, deleted: !existsSync(iso.root) };
  };
  return iso;
}

export async function loadEngine(iso) {
  const dir = VERSIONS[iso.version].dir;
  const u = (p) => pathToFileURL(join(iso.root, 'lib', p)).href;
  const m = async (p) => import(u(p));
  const E = {
    version: iso.version, dir,
    compiler: await m(dir + '/compiler.mjs'), contract: await m(dir + '/contract.mjs'), scope: await m(dir + '/scope.mjs'),
    record: await m(dir + '/record.mjs'), quote: await m(dir + '/quote-resolution.mjs'), response: await m(dir + '/response.mjs'),
    assertions: await m(dir + '/assertions.mjs'), conditions: await m(dir + '/conditions.mjs'), contradictions: await m(dir + '/contradictions.mjs'),
    controls: await m(dir + '/controls.mjs'), graphValidate: await m(dir + '/graph-validate.mjs'), rulePacks: await m(dir + '/rule-packs.mjs'),
    strictJson: await m('engine-evidence-contract/strict-json.mjs'), remediation: await m('engine-evidence-contract/remediation.mjs'),
    claims: await m('engine-evidence-contract/claims.mjs'),
  };
  if (existsSync(join(iso.root, 'lib', dir, 'research-profile.mjs'))) E.research = await m(dir + '/research-profile.mjs');
  E.declaredVersions = { contract_version: E.contract.CONTRACT_VERSION, compiler_version: E.contract.COMPILER_VERSION, prompt_version: E.contract.PROMPT_VERSION, codebook_version: E.contract.CODEBOOK_VERSION };
  return E;
}

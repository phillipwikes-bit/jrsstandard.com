// 0.3.5 continuation harness: isolated, manifest-verified copies of 0.3.5-research-candidate (candidate/ in this
// package). Every other version is delegated unchanged to the frozen 0.3.4 harness
// (research/engine-repair-0.3.4-2026-10-27/tools/harness/engines.mjs). 0.3.5 keeps the 0.3.4 library directory name
// (its compiler is the 0.3.4 compiler), so loading reuses the frozen loader on the verified copy.
// No network module is imported here. Callers install the network guard first.
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSIONS as V4, isolate as isolate4, loadEngine as loadEngine4 } from '../../../engine-repair-0.3.4-2026-10-27/tools/harness/engines.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG = join(HERE, '..', '..');
export const V5 = '0.3.5-research-candidate';
// Pinned at the freeze (tools/write-candidate-manifest.mjs); a copy whose manifest differs is refused.
export const V5_MANIFEST_SHA256 = '9f96dd487fe968b7589124116ce7218f1c010ad8a3a482559212ebbc49020e92';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const walk = (d) => readdirSync(d).sort().flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const snapshot = (root) => Object.fromEntries(walk(root).map((p) => [relative(root, p), sha(readFileSync(p))]));
export const VERSIONS = Object.freeze({ ...V4, [V5]: { dir: V4['0.3.4-research-candidate'].dir, src: join(PKG, 'candidate'), manifest: join(PKG, 'CANDIDATE_0.3.5_MANIFEST_SHA256.txt'), manifest_sha256: V5_MANIFEST_SHA256 } });

export function isolate(version, scratch, { requireManifest = true } = {}) {
  if (version !== V5) return isolate4(version, scratch, { requireManifest });
  const v = VERSIONS[V5];
  if (!existsSync(v.manifest)) { if (requireManifest) throw new Error('manifest_missing:' + V5); }
  const tmp = mkdtempSync(join(scratch, 'iso-0.3.5-'));
  cpSync(realpathSync(v.src), tmp, { recursive: true });   // the real directory, also when reached through a symlink (test mirrors)
  let manifestSha = null, verified = 0;
  if (existsSync(v.manifest)) {
    const m = readFileSync(v.manifest); manifestSha = sha(m);
    if (v.manifest_sha256 && manifestSha !== v.manifest_sha256) { rmSync(tmp, { recursive: true, force: true }); throw new Error('manifest_hash_mismatch:' + V5); }
    const rows = m.toString('utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => [l.slice(66), l.slice(0, 64)]);
    const listed = new Set(rows.map((r) => r[0]));
    for (const [f, h] of rows) { if (!existsSync(join(tmp, f)) || sha(readFileSync(join(tmp, f))) !== h) { rmSync(tmp, { recursive: true, force: true }); throw new Error('isolated_copy_mismatch:' + V5 + ':' + f); } verified++; }
    for (const f of walk(tmp).map((p) => relative(tmp, p))) if (!listed.has(f)) { rmSync(tmp, { recursive: true, force: true }); throw new Error('isolated_copy_unlisted_file:' + V5 + ':' + f); }
  }
  const before = snapshot(tmp);
  const iso = { version: V5, root: tmp, manifest_sha256: manifestSha, files_verified: verified, snapshot_sha256: sha(JSON.stringify(before)), before };
  iso.release = () => {
    const after = snapshot(iso.root);
    const changed = Object.keys(iso.before).filter((k) => after[k] !== iso.before[k]).concat(Object.keys(after).filter((k) => !(k in iso.before)));
    rmSync(iso.root, { recursive: true, force: true });
    return { unchanged: changed.length === 0, changed, deleted: !existsSync(iso.root) };
  };
  return iso;
}

export async function loadEngine(iso) {
  if (iso.version !== V5) return loadEngine4(iso);
  const E = await loadEngine4({ ...iso, version: '0.3.4-research-candidate' });
  E.version = V5;
  return E;
}

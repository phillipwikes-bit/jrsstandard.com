// 0.3.6 harness: isolated, manifest-verified copies of 0.3.6-research-candidate (candidate/ in this package). Every
// other version is delegated unchanged to the 0.3.5 continuation harness. 0.3.6 keeps the library directory name
// of 0.3.4 and 0.3.5, so loading reuses the frozen loader on the verified copy.
// No network module is imported here. Callers install the network guard first.
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolate as isolate5, loadEngine as loadEngine5 } from '../../../study-continuation-0.3.5-2026-10-28/tools/harness/engines.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG = join(HERE, '..', '..');
export const V6 = '0.3.6-research-candidate';
// Pinned at the freeze (tools/write-candidate-manifest.mjs); null until then, when the manifest is not yet written.
export const V6_MANIFEST_SHA256 = '99e0cae827f3fb64c5e6f5d6b411be8dee92b9ed45a2121e289af51548cd780c';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const walk = (d) => readdirSync(d).sort().flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const snapshot = (root) => Object.fromEntries(walk(root).map((p) => [relative(root, p), sha(readFileSync(p))]));
const MANIFEST = join(PKG, 'CANDIDATE_0.3.6_MANIFEST_SHA256.txt');

// src: a candidate directory to isolate instead of candidate/ (mutation tests only; never with requireManifest).
export function isolate(version, scratch, { requireManifest = true, src = null } = {}) {
  if (version !== V6) return isolate5(version, scratch, { requireManifest });
  if (src && requireManifest) throw new Error('mutant_source_cannot_require_manifest');
  const tmp = mkdtempSync(join(scratch, 'iso-0.3.6-'));
  cpSync(realpathSync(src || join(PKG, 'candidate')), tmp, { recursive: true });
  let manifestSha = null, verified = 0;
  if (!src && existsSync(MANIFEST)) {
    const m = readFileSync(MANIFEST); manifestSha = sha(m);
    if (V6_MANIFEST_SHA256 && manifestSha !== V6_MANIFEST_SHA256) { rmSync(tmp, { recursive: true, force: true }); throw new Error('manifest_hash_mismatch:' + V6); }
    const rows = m.toString('utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => [l.slice(66), l.slice(0, 64)]);
    const listed = new Set(rows.map((r) => r[0]));
    for (const [f, h] of rows) { if (!existsSync(join(tmp, f)) || sha(readFileSync(join(tmp, f))) !== h) { rmSync(tmp, { recursive: true, force: true }); throw new Error('isolated_copy_mismatch:' + V6 + ':' + f); } verified++; }
    for (const f of walk(tmp).map((p) => relative(tmp, p))) if (!listed.has(f)) { rmSync(tmp, { recursive: true, force: true }); throw new Error('isolated_copy_unlisted_file:' + V6 + ':' + f); }
  } else if (requireManifest) { rmSync(tmp, { recursive: true, force: true }); throw new Error('manifest_missing:' + V6); }
  const before = snapshot(tmp);
  const iso = { version: V6, root: tmp, manifest_sha256: manifestSha, files_verified: verified, mutant: !!src, before };
  iso.release = () => { const after = snapshot(iso.root); const changed = Object.keys(iso.before).filter((k) => after[k] !== iso.before[k]).concat(Object.keys(after).filter((k) => !(k in iso.before)));
    rmSync(iso.root, { recursive: true, force: true }); return { unchanged: changed.length === 0, changed, deleted: !existsSync(iso.root) }; };
  return iso;
}
export async function loadEngine(iso) {
  if (iso.version !== V6) return loadEngine5(iso);
  const E = await loadEngine5({ ...iso, version: '0.3.4-research-candidate' });
  E.version = V6;
  return E;
}

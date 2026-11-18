// Verifies an extracted DS-N1 package against its ASSET_MANIFEST.json: every
// listed file present with the recorded SHA-256, and no unlisted file (other
// than node_modules and package-lock.json). A match shows the files are the ones
// the manifest lists. It does not establish authorship, rights or correctness.
//
// Usage: node lib/ds-n1/package/verify-bundle.mjs <package-dir>
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const walk = (dir, base = dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  if (f === 'node_modules') return [];
  return statSync(p).isDirectory() ? walk(p, base) : [relative(base, p).split(sep).join('/')];
});

export function verifyBundle(dir) {
  const problems = [];
  const mp = join(dir, 'ASSET_MANIFEST.json');
  if (!existsSync(mp)) return { ok: false, problems: [{ code: 'MANIFEST_MISSING', path: 'ASSET_MANIFEST.json' }] };
  let manifest;
  try { manifest = JSON.parse(readFileSync(mp, 'utf8')); } catch { return { ok: false, problems: [{ code: 'MANIFEST_UNREADABLE', path: 'ASSET_MANIFEST.json' }] }; }
  const listed = new Set();
  for (const f of manifest.files || []) {
    listed.add(f.path);
    const p = join(dir, f.path);
    if (!existsSync(p)) { problems.push({ code: 'FILE_MISSING', path: f.path }); continue; }
    const h = createHash('sha256').update(readFileSync(p)).digest('hex');
    if (h !== f.sha256) problems.push({ code: 'HASH_MISMATCH', path: f.path });
  }
  for (const f of walk(dir)) {
    if (f === 'ASSET_MANIFEST.json' || f === 'package-lock.json') continue;
    if (!listed.has(f)) problems.push({ code: 'UNLISTED_FILE', path: f });
  }
  return { ok: problems.length === 0, files: listed.size, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = verifyBundle(process.argv[2] || '.');
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}

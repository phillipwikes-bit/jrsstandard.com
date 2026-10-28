// 156-record study: seal a named file set. Writes seals/<name>/MANIFEST_SHA256.txt and SEAL.json.
// Refuses to reseal. A sealed file may not change afterwards; tools/verify-seal.mjs checks every seal.
// Usage: node tools/seal.mjs <name> <note> <path-or-dir>...   (paths relative to the package)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const [name, note, ...paths] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(name || '') || !note || !paths.length) { console.error('usage: seal.mjs <name> <note> <paths...>'); process.exit(2); }
const dir = join(PKG, 'seals', name);
if (existsSync(join(dir, 'SEAL.json'))) { console.error('seal ' + name + ' exists; seals are never rewritten'); process.exit(2); }
const sha = (b) => createHash('sha256').update(b).digest('hex');
const walk = (p) => statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((n) => walk(join(p, n))) : [p];
const files = [...new Set(paths.flatMap((p) => walk(join(PKG, p))).map((p) => relative(PKG, p)))].sort();
const manifest = '# SEAL ' + name + ': ' + note + '\n' + files.map((f) => sha(readFileSync(join(PKG, f))) + '  ' + f).join('\n') + '\n';
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'MANIFEST_SHA256.txt'), manifest, { flag: 'wx' });
const seal = { seal_format: 'jrs-study-156-seal/1.0.0', name, note, sealed_at_utc: new Date().toISOString(), file_count: files.length,
  manifest_file: 'seals/' + name + '/MANIFEST_SHA256.txt', manifest_sha256: sha(manifest), roots: paths,
  rule: 'Post-seal modification of any listed file is prohibited. A listed directory may not gain files.' };
writeFileSync(join(dir, 'SEAL.json'), JSON.stringify(seal, null, 2) + '\n', { flag: 'wx' });
console.log('sealed', name, files.length, 'files', seal.sealed_at_utc, seal.manifest_sha256);

// 0.3.4 repair package: seal a named file set (a copy of the study's tools/seal.mjs 1.0, unchanged there, with the
// package root changed and one addition: a path may start with ../ to seal a file the package imports from a sibling
// research directory). Writes seals/<name>/MANIFEST_SHA256.txt and SEAL.json. Refuses to reseal. A sealed file may
// not change afterwards; tools/verify-seal.mjs checks every seal.
// Usage: node tools/seal.mjs <name> <note> <pins.json|-> <path-or-dir>...   (paths relative to the package)
//   pins.json: hashes of sealed material elsewhere that this seal depends on (for example the study's freeze manifest),
//   recorded in SEAL.json and checked by verify-seal.mjs.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const [name, note, pinsFile, ...paths] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(name || '') || !note || !pinsFile || !paths.length) { console.error('usage: seal.mjs <name> <note> <pins.json|-> <paths...>'); process.exit(2); }
const dir = join(PKG, 'seals', name);
if (existsSync(join(dir, 'SEAL.json'))) { console.error('seal ' + name + ' exists; seals are never rewritten'); process.exit(2); }
const sha = (b) => createHash('sha256').update(b).digest('hex');
const walk = (p) => statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((n) => walk(join(p, n))) : [p];
const files = [...new Set(paths.flatMap((p) => walk(join(PKG, p))).map((p) => relative(PKG, p)))].sort();
const pins = pinsFile === '-' ? [] : JSON.parse(readFileSync(pinsFile, 'utf8'));
for (const p of pins) if (sha(readFileSync(join(PKG, p.path))) !== p.sha256) { console.error('pin does not match: ' + p.path); process.exit(3); }
const manifest = '# SEAL ' + name + ': ' + note + '\n' + files.map((f) => sha(readFileSync(join(PKG, f))) + '  ' + f).join('\n') + '\n';
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'MANIFEST_SHA256.txt'), manifest, { flag: 'wx' });
const seal = { seal_format: 'jrs-0.3.4-seal/1.0.0', name, note, sealed_at_utc: new Date().toISOString(), file_count: files.length,
  manifest_file: 'seals/' + name + '/MANIFEST_SHA256.txt', manifest_sha256: sha(manifest), roots: paths, pins,
  rule: 'Post-seal modification of any listed file is prohibited. A listed directory may not gain files. Every pin must still match.' };
writeFileSync(join(dir, 'SEAL.json'), JSON.stringify(seal, null, 2) + '\n', { flag: 'wx' });
console.log('sealed', name, files.length, 'files', seal.sealed_at_utc, seal.manifest_sha256);

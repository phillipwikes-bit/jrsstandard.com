// 0.3.5 continuation: writes CANDIDATE_0.3.5_MANIFEST_SHA256.txt (every file under candidate/, paths relative to it)
// in the format of the 0.3.4 manifest. Run once at the freeze; the harness then pins the manifest's own hash.
// Usage: node tools/write-candidate-manifest.mjs
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const PKG = join(dirname(fileURLToPath(import.meta.url)), '..'), C = join(PKG, 'candidate');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const walk = (d) => readdirSync(d).sort().flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const lines = ['# CANDIDATE 0.3.5-research-candidate manifest, 2026-10-28, written at the 0.3.5 continuation freeze. Paths relative to candidate/. Parent 0.3.4-research-candidate (manifest b454d4b8...). Not adopted; the engine of record is 0.3.1-candidate.',
  ...walk(C).map((p) => sha(readFileSync(p)) + '  ' + relative(C, p).split('\\').join('/'))];
writeFileSync(join(PKG, 'CANDIDATE_0.3.5_MANIFEST_SHA256.txt'), lines.join('\n') + '\n');
console.log('candidate manifest: ' + (lines.length - 1) + ' files, sha256 ' + sha(lines.join('\n') + '\n'));

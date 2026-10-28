// 0.3.4 repair package: writes CANDIDATE_0.3.4_MANIFEST_SHA256.txt, the hash of every file of the candidate copy, in
// the format of the study's CANDIDATE_0.3.3_MANIFEST_SHA256.txt. From then on the harness refuses an isolated copy
// that differs from it or holds an unlisted file. Refuses to overwrite. Usage: node tools/write-candidate-manifest.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PKG } from './harness/engines.mjs';

const OUT = join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt');
if (existsSync(OUT)) { console.error('exists: ' + OUT + ' (manifests are never rewritten)'); process.exit(2); }
const sha = (b) => createHash('sha256').update(b).digest('hex');
const root = join(PKG, 'candidate');
const walk = (d) => readdirSync(d).sort().flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(root).map((p) => relative(root, p)).sort();
const body = '# CANDIDATE 0.3.4-research-candidate manifest, ' + new Date().toISOString().slice(0, 10) + ', written at the 0.3.4 freeze. Paths relative to candidate/. Not adopted; the engine of record is 0.3.1-candidate.\n'
  + files.map((f) => sha(readFileSync(join(root, f))) + '  ' + f).join('\n') + '\n';
writeFileSync(OUT, body, { flag: 'wx' });
console.log('manifest', files.length, 'files', sha(body));

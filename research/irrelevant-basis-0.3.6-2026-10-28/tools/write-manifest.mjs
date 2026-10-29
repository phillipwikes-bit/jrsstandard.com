// SHA-256 manifest of every file in this package (the manifest itself excluded). Usage: node tools/write-manifest.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIR, sha } from './common.mjs';
const walk = (d) => readdirSync(d).sort().flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(DIR).map((p) => relative(DIR, p).split('\\').join('/')).filter((f) => f !== 'PACKAGE_MANIFEST_SHA256.txt');
writeFileSync(join(DIR, 'PACKAGE_MANIFEST_SHA256.txt'), ['# PACKAGE research/irrelevant-basis-0.3.6-2026-10-28: ' + files.length + ' files.', ...files.map((f) => sha(readFileSync(join(DIR, f))) + '  ' + f)].join('\n') + '\n');
console.log('manifest: ' + files.length + ' files');

// Study completion: SHA-256 manifest of every file in this directory as committed (the manifest itself excluded).
// Usage: node tools/write-manifest.mjs
import { attempts } from './guard.mjs';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, sha, listFiles } from './common.mjs';

const files = listFiles(DIR).filter((f) => f !== 'PACKAGE_MANIFEST_SHA256.txt');
const bytes = files.reduce((n, f) => n + statSync(join(DIR, f)).size, 0);
const lines = ['# PACKAGE research/study-completion-0.3.4-2026-10-28: ' + files.length + ' files, ' + bytes + ' bytes, written ' + new Date().toISOString() + '. Offline; network attempts ' + attempts.length + '.',
  ...files.map((f) => sha(readFileSync(join(DIR, f))) + '  ' + f)];
writeFileSync(join(DIR, 'PACKAGE_MANIFEST_SHA256.txt'), lines.join('\n') + '\n');
console.log('manifest: ' + files.length + ' files, ' + bytes + ' bytes');

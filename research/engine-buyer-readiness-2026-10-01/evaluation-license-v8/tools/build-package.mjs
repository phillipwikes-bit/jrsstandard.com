// Builds the customer-run evaluation package from the maintained sources.
// Every file is a byte copy of its upstream source; nothing is edited in the
// package. Output: package/jrs-eval-<version>-<id>/ and a deterministic .tar.gz.
//
// Usage: node build-package.mjs   (refuses to overwrite an existing build)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(HERE, '..');
const REPO = path.resolve(BASE, '../../..');
const VERSION = '0.1.0-eval';
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// [published path, source path]
const FILES = [
  ['engine/api/review-engine.js', path.join(REPO, 'api/review-engine.js')],
  ['engine/api/_model.js', path.join(REPO, 'api/_model.js')],
  ['engine/api/_manifest/build.js', path.join(REPO, 'api/_manifest/build.js')],
  ['engine/api/_manifest/canonicalize.js', path.join(REPO, 'api/_manifest/canonicalize.js')],
  ['engine/api/_manifest/from-engine.js', path.join(REPO, 'api/_manifest/from-engine.js')],
  ['engine/api/_manifest/hash.js', path.join(REPO, 'api/_manifest/hash.js')],
  ['tools/run-smoke.mjs', path.join(HERE, 'run-smoke.mjs')],
  ['tools/test-run-smoke.mjs', path.join(HERE, 'test-run-smoke.mjs')],
  ['README-QUICKSTART.md', path.join(BASE, 'track-b/INTEGRATION-AND-QUICKSTART.md')],
  ['DEMO-LIMITATIONS.md', path.join(BASE, 'track-a/DEMO-LIMITATIONS.md')],
];
for (const f of fs.readdirSync(path.join(BASE, 'corpus/records')).sort()) {
  if (f.endsWith('.txt')) FILES.push(['corpus/records/' + f, path.join(BASE, 'corpus/records', f)]);
}

const id = crypto.createHash('sha256').update(FILES.map(([p, s]) => p + ':' + sha(s)).join('\n')).digest('hex').slice(0, 10);
const name = 'jrs-eval-' + VERSION + '-' + id;
const outRoot = path.join(BASE, 'package');
const dir = path.join(outRoot, name);
if (fs.existsSync(dir)) { console.error('refused: ' + name + ' already exists'); process.exit(3); }
fs.mkdirSync(dir, { recursive: true });

for (const [pub, src] of FILES) {
  fs.mkdirSync(path.dirname(path.join(dir, pub)), { recursive: true });
  fs.copyFileSync(src, path.join(dir, pub));
}
fs.writeFileSync(path.join(dir, 'entitlement.example.json'), JSON.stringify({
  licensee: 'REPLACE: organization name from the order form',
  expires_on: 'REPLACE: YYYY-MM-DD from the order form',
  max_attempts: 300,
  ledger: 'ledger.json',
}, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'VERSION.json'), JSON.stringify({
  package: name, version: VERSION, built_from_commit: execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD']).toString().trim(),
  model_default: 'claude-haiku-4-5-20251001', provider_route: 'DIRECT_ANTHROPIC (IMPLEMENTED_NOT_TESTED until the live smoke run)',
  files: FILES.map(([p, s]) => ({ path: p, sha256: sha(s) })),
}, null, 2) + '\n');
const all = [];
(function walk(d) { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : all.push(path.relative(dir, p)); } })(dir);
fs.writeFileSync(path.join(dir, 'SHA256SUMS.txt'), all.map((p) => sha(path.join(dir, p)) + '  ' + p).join('\n') + '\n');

const tarball = path.join(outRoot, name + '.tar.gz');
execFileSync('tar', ['--sort=name', '--mtime=2026-01-01 00:00Z', '--owner=0', '--group=0', '--numeric-owner', '--use-compress-program=gzip -n', '-cf', tarball, '-C', outRoot, name]);
console.log(JSON.stringify({ package: name, files: all.length + 1, tarball: path.relative(BASE, tarball), sha256: sha(tarball) }, null, 2));

#!/usr/bin/env node
// JRS PHASE 9: writes the Phase 9 file manifest (version 2). Run last; nothing may write a Phase 9 file afterwards.
// Version 1 must already be preserved, unchanged, at manifest-history/v1.sha256.
//
//   node research/engine-human-review-phase9-2026-10-20/build-manifest.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const MF = 'research/engine-human-review-phase9-2026-10-20/PHASE9_FILE_MANIFEST_SHA256.txt';
const PATHS = ['lib/engine-human-review-phase9/', 'tests/engine-human-review-phase9/', 'tools/engine-human-review-phase9-replay.mjs', 'research/engine-human-review-phase9-2026-10-20/'];
const HIST = 'research/engine-human-review-phase9-2026-10-20/manifest-history/v1.sha256';
if (existsSync(join(REPO, MF))) { console.error('REFUSED: a current manifest exists; preserve it under manifest-history/ first'); process.exit(2); }
if (!existsSync(join(REPO, HIST)) || !/^# manifest_version: 1$/m.test(readFileSync(join(REPO, HIST), 'utf8'))) { console.error('REFUSED: manifest version 1 is not preserved'); process.exit(2); }
const files = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: REPO, encoding: 'utf8' }).split('\n').filter(Boolean)
  .filter((f) => PATHS.some((p) => (p.endsWith('/') ? f.startsWith(p) : f === p))).filter((f) => f !== MF && !f.includes('/manifest-history/')).sort();
const rows = files.map((f) => createHash('sha256').update(readFileSync(join(REPO, f))).digest('hex') + '  ' + f);
writeFileSync(join(REPO, MF), ['# manifest_version: 2', '# LOCAL ENGINEERING MATERIAL ONLY', '# INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED', '# NO RELEASE, DEPLOYMENT OR COMMERCIAL READINESS DETERMINATION',
  '# SHA-256 of every Phase 9 file in the four admitted locations, sorted by path. Excluded: this file and manifest-history/ (version 1 preserved unchanged at manifest-history/v1.sha256).', '# Verify: grep -v "^#" ' + MF + ' | sha256sum -c   (from the repository root)', ...rows, ''].join('\n'));
console.log('manifest: ' + rows.length + ' files');

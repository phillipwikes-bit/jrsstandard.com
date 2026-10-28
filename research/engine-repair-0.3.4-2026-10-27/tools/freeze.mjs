// 0.3.4 repair package: the freeze, run once before any scored 0.3.4 run. It writes the candidate manifest, records
// pins on sealed material elsewhere that the runs depend on, and seals every input of the scored runs and the analysis
// with tools/seal.mjs. It refuses to run twice. Usage: node tools/freeze.mjs <scratch>
// Sealed here: the candidate and its manifest, rule packs and prompt (inside candidate/), every tool and test (runners,
// scoring copies, analysis, mocks and variant builders, suites, mutation, recovery, transport, seal tools), mocks 2.0,
// variant set 2.0 and its mocks, protocol (criteria S156-AC-2.0 with owner approval NOT GIVEN, criteria review,
// authoring specification, protected procedure, live preflight proposal), registers (exposure, label status, tool
// corrections), blinded forms, the unsigned authorization draft, history (mutation runs, pre-freeze development
// results), and the sibling inputs the runs import (V0 harness tools and corpus, 0.3.2 candidate and regression cases,
// Phase 7 differential tooling).
// Pinned (hash recorded and checked by tools/verify-seal.mjs): the study's corpus and freeze seal manifests, which
// cover the study's records, inventory, labels, scoring, compile-row, generators and stored mocks; the 0.3.3 and 0.3.2
// candidate manifests; the Phase 7 manifest of the 0.3.1 engine of record.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PKG } from './harness/engines.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: freeze.mjs <scratch>'); process.exit(2); }
if (existsSync(join(PKG, 'seals', 'freeze', 'SEAL.json'))) { console.error('the freeze exists; it is never repeated'); process.exit(2); }
const sha = (b) => createHash('sha256').update(b).digest('hex');
export const ROOTS = Object.freeze([
  'CANDIDATE_0.3.4_MANIFEST_SHA256.txt', 'PARENT.json', 'BASELINE_VERIFICATION.md', 'SOURCE_COPY_SHA256_BEFORE_CHANGE.txt',
  'candidate', 'tools', 'tests', 'mocks-v2', 'variants-v2', 'mocks-variants-v2', 'protocol', 'registers', 'forms', 'authorization', 'history',
  '../validation-readiness-gate-v0-2026-10-25/tools', '../validation-readiness-gate-v0-2026-10-25/corpus',
  '../engine-correction-v0-02-ev32-2026-10-25/candidate', '../engine-correction-v0-02-ev32-2026-10-25/CANDIDATE_0.3.2_MANIFEST_SHA256.txt',
  '../engine-correction-v0-02-ev32-2026-10-25/regression', '../engine-correction-v0-02-ev32-2026-10-25/regression-supplement',
  '../engine-remediation-phase7-2026-10-19/tooling',
]);
const PIN_PATHS = ['../study-156-2026-10-27/seals/corpus/MANIFEST_SHA256.txt', '../study-156-2026-10-27/seals/freeze/MANIFEST_SHA256.txt', '../study-156-2026-10-27/CANDIDATE_0.3.3_MANIFEST_SHA256.txt',
  '../engine-correction-v0-02-ev32-2026-10-25/CANDIDATE_0.3.2_MANIFEST_SHA256.txt', '../engine-governance-phase8-2026-10-19/registry/manifests/phase7-candidate.sha256'];
const node = (args) => { const r = spawnSync(process.execPath, args, { cwd: PKG, encoding: 'utf8' }); if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(3); } return r.stdout.trim(); };
if (!existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt'))) console.log(node(['tools/write-candidate-manifest.mjs']));
mkdirSync(SCRATCH, { recursive: true });
const pinsFile = join(SCRATCH, 'freeze-pins.json');
writeFileSync(pinsFile, JSON.stringify(PIN_PATHS.map((p) => ({ path: p, sha256: sha(readFileSync(join(PKG, p))) })), null, 2));
const note = '0.3.4 freeze before scored execution: candidate 0.3.4 and its manifest, every tool and test, mocks 2.0, variant set 2.0 and its mocks, protocol (criteria S156-AC-2.0 with owner approval NOT GIVEN), registers, forms, the unsigned authorization draft, history, and the sibling inputs the runs import';
console.log(node(['tools/seal.mjs', 'freeze', note, pinsFile, ...ROOTS]));
console.log(node(['tools/verify-seal.mjs', 'freeze']));

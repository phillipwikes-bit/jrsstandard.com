#!/usr/bin/env node
// JRS claim provenance: public-claim scanner. INTERNAL, LOCAL ONLY.
//   node tools/claim-provenance/scan.mjs           scan and print every finding that is not PERMITTED
//   node tools/claim-provenance/scan.mjs --write   also write generated/scan-results.json and the repair-proposal document
//   node tools/claim-provenance/scan.mjs --check   fail on an UNSUPPORTED or REQUIRES_REPAIR public finding with no
//                                                  proposed repair, on a stale proposal, or on stale committed outputs
// Reads the working tree only. It never edits a public file: repairs are proposals.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildAll } from './build.mjs';
import { scanRepository } from './lib/scan.js';
import { REPAIRS } from './lib/repairs.js';
import { renderRepairs } from './lib/render-repairs.js';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const RESULTS = 'tools/claim-provenance/generated/scan-results.json';
export const PROPOSALS = 'docs/architecture/PUBLIC_CLAIM_REPAIR_PROPOSALS_2026-10-06.md';

export function runScan(root = ROOT) {
  const { register } = buildAll(root);
  const r = scanRepository(root, register.claims, REPAIRS);
  return { scanner: 'jrs-public-claim-scan/0.1.0', claims_digest: register.claims_digest, ...r };
}
export function outputs(r) { return { [RESULTS]: JSON.stringify(r, null, 1) + '\n', [PROPOSALS]: renderRepairs(r) }; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), r = runScan(), out = outputs(r);
  for (const f of r.findings) if (f.disposition !== 'PERMITTED') console.log(f.disposition.padEnd(16) + ' ' + f.file + ':' + f.line + '  ' + f.text.slice(0, 110) + (f.repair_id ? '  [' + f.repair_id + ']' : ''));
  console.log(Object.entries(r.summary).map(([k, v]) => k + '=' + v).join(' ') + '  unproposed=' + r.gate.unproposed + '  stale proposals=' + r.gate.stale_proposals.length + '  regressions=' + r.gate.regressions.length);
  if (args.includes('--write')) { mkdirSync(join(ROOT, 'tools/claim-provenance/generated'), { recursive: true }); for (const [p, t] of Object.entries(out)) { writeFileSync(join(ROOT, p), t); console.log('wrote ' + p); } }
  if (args.includes('--check')) {
    const stale = Object.entries(out).filter(([p, t]) => !existsSync(join(ROOT, p)) || readFileSync(join(ROOT, p), 'utf8') !== t).map(([p]) => p);
    const bad = r.gate.unproposed + r.gate.stale_proposals.length + r.gate.regressions.length + stale.length;
    for (const g of r.gate.regressions) console.log('REGRESSION  ' + g);
    for (const p of stale) console.log('STALE  ' + p);
    console.log(bad ? 'FAIL  ' + bad + ' problem(s)' : 'PASS  every unsupported or repair-needed public claim has a proposed repair; outputs current');
    process.exit(bad ? 1 : 0);
  }
}

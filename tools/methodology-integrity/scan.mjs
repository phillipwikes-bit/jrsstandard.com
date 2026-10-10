#!/usr/bin/env node
// JRS methodology integrity: vocabulary scanner. INTERNAL, LOCAL ONLY.
//   node tools/methodology-integrity/scan.mjs           scan the scope and print every finding not ALLOWED
//   node tools/methodology-integrity/scan.mjs --write   also write generated/scan-results.json
//   node tools/methodology-integrity/scan.mjs --check   fail on any gated finding that is not ALLOWED or
//                                                       HISTORICAL_ONLY, or on a stale reviewed disposition
// Reads the working tree only. No network, no git, no model.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { scanRepository } from './lib/scan.js';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const RESULTS = 'tools/methodology-integrity/generated/scan-results.json';
const TOOL = new URL('./', import.meta.url).pathname;

export function runScan(root = ROOT, tool = TOOL) {
  const register = JSON.parse(readFileSync(join(tool, 'current-correspondence-register.json'), 'utf8'));
  const reviewed = JSON.parse(readFileSync(join(tool, 'reviewed-dispositions.json'), 'utf8')).entries;
  const approvedIds = register.records.filter((r) => r.status === 'APPROVED_CORRESPONDENCE').map((r) => r.correspondence_id);
  return { scanner: 'jrs-methodology-vocabulary-scan/0.1.0', register_records_digest: register.records_digest, ...scanRepository(root, { approvedIds, reviewed }) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), r = runScan();
  for (const f of r.findings) if (f.disposition !== 'ALLOWED') console.log(f.disposition.padEnd(26) + ' ' + f.file + ':' + f.line + '  ' + f.phrase + (r.report_only_groups.includes(f.group) ? '  (report only)' : ''));
  console.log(r.files_scanned + ' files  ' + Object.entries(r.summary).map(([k, v]) => k + '=' + v).join(' ') + '  gated failures=' + r.gate.failures);
  if (args.includes('--write')) { mkdirSync(join(ROOT, 'tools/methodology-integrity/generated'), { recursive: true }); writeFileSync(join(ROOT, RESULTS), JSON.stringify(r, null, 1) + '\n'); console.log('wrote ' + RESULTS); }
  if (args.includes('--check')) {
    const bad = r.gate.failures + r.gate.stale_reviews.length + r.gate.bad_reviews.length;
    for (const s of r.gate.stale_reviews) console.log('STALE REVIEW  ' + s);
    console.log(bad ? 'FAIL  ' + bad + ' gated problem(s)' : 'PASS  no unsupported, unapproved or ambiguous mapping in the gated scope');
    process.exit(bad ? 1 : 0);
  }
}

#!/usr/bin/env node
// JRS frozen synthetic demonstration: replay runner. LOCAL ONLY. SYNTHETIC RECORDS ONLY.
//   node tools/frozen-demo/run-demo.mjs           replay the frozen corpus and write the generated outputs
//   node tools/frozen-demo/run-demo.mjs --check   replay and fail if any committed output differs
//   node tools/frozen-demo/run-demo.mjs --table   replay and print one line per case
// The only adapter is the candidate's deterministic mock. No model, no network, no real record.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { replayAll } from './lib/replay.js';
import { renderOutputs } from './lib/render.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(join(ROOT, 'tools/frozen-demo/demo-manifest.json'), 'utf8'));
const evidence = JSON.parse(readFileSync(join(ROOT, 'tools/frozen-demo/demo-evidence-record.json'), 'utf8'));
const replay = await replayAll();
const outs = renderOutputs(replay, manifest, evidence);
const args = process.argv.slice(2);

if (args.includes('--table')) {
  for (const c of replay.cases) {
    const o = c.observed;
    console.log([c.record_id, c.demonstrates, o.candidate.result_status, 'adapter calls ' + c.adapter_calls,
      'source-prep ' + (o.input_preparation.source_prep_codes.join('+') || 'none'),
      'flagged ' + (Object.entries(o.candidate.flagged_keys).map(([k, v]) => k + '=' + v).join('+') || 'none'),
      'example export ' + (c.human_disposition_example.export_verification.ok ? 'verifies' : 'FAILS')].join(' | '));
  }
}
if (args.includes('--check')) {
  const stale = Object.entries(outs).filter(([p, text]) => { try { return readFileSync(join(ROOT, p), 'utf8') !== text; } catch { return true; } }).map(([p]) => p);
  console.log(stale.length ? 'FAIL  stale: ' + stale.join(', ') : 'PASS  generated outputs equal a fresh replay');
  process.exit(stale.length ? 1 : 0);
}
if (!args.includes('--table')) {
  for (const [p, text] of Object.entries(outs)) { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), text); console.log('wrote ' + p); }
}

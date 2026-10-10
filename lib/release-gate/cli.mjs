#!/usr/bin/env node
// JRS internal release-gate package: command-line runner. INTERNAL ONLY.
//
//   node lib/release-gate/cli.mjs validate <record.json> [--expect-engine-version V] [--expect-prompt-sha256 H]
//   node lib/release-gate/cli.mjs report   <record.json> <out.md>     write the Markdown report
//   node lib/release-gate/cli.mjs check    <record.json> <report.md>  fail if the report is stale or incomplete
//
// Reads only the files named on its command line. No network, no provider, no environment
// variable. Exit codes: 0 valid (the record may still be incomplete), 1 invalid or stale.
import { readFileSync, writeFileSync } from 'node:fs';
import { validateRecord } from './validator.js';
import { renderReport, reportProblems } from './report.js';

const [cmd, recordPath, outPath, ...rest] = process.argv.slice(2);
const flag = (name) => { const all = [outPath, ...rest]; const i = all.indexOf(name); return i >= 0 ? all[i + 1] : undefined; };
const usage = () => { console.error('usage: cli.mjs validate|report|check <record.json> [out.md]'); process.exit(1); };
if (!cmd || !recordPath) usage();

let record;
try { record = JSON.parse(readFileSync(recordPath, 'utf8')); } catch (e) { console.error('FAIL  cannot read record: ' + e.message); process.exit(1); }

if (cmd === 'validate') {
  const v = validateRecord(record, { expectEngineVersion: flag('--expect-engine-version'), expectPromptSha256: flag('--expect-prompt-sha256') });
  if (!v.valid) { console.log('INVALID  ' + v.errors.length + ' error(s)'); for (const e of v.errors) console.log('  ' + e); process.exit(1); }
  console.log('VALID  ' + record.release_package.package_id + '  Engine ' + record.engine.engine_version);
  for (const [id, s] of Object.entries(v.gate_status)) console.log('  ' + id + '  ' + s);
  console.log('CONCLUSION  ' + v.conclusion);
  if (v.missing_evidence.length) { console.log('MISSING EVIDENCE (' + v.missing_evidence.length + ')'); for (const m of v.missing_evidence) console.log('  ' + m); }
} else if (cmd === 'report') {
  if (!outPath) usage();
  writeFileSync(outPath, renderReport(record));
  console.log('wrote ' + outPath);
} else if (cmd === 'check') {
  if (!outPath) usage();
  const md = readFileSync(outPath, 'utf8');
  const problems = reportProblems(md, record);
  if (md !== renderReport(record)) problems.push('report differs from the one the record generates; regenerate it');
  if (problems.length) { for (const p of problems) console.log('FAIL  ' + p); process.exit(1); }
  console.log('PASS  report is current and carries its limitations');
} else usage();

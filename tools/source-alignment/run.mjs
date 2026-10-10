#!/usr/bin/env node
// JRS source alignment: build and check. INTERNAL. Needs the three October 3 files in project_sources/.
//   node tools/source-alignment/run.mjs           rebuild in memory; fail if any committed output differs; then verify
//   node tools/source-alignment/run.mjs --write   regenerate the committed outputs
// Fails closed when a source is absent or its hash differs. Never writes source text.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/sources.js';
import { buildAll } from './lib/build.js';

let outs;
try { outs = buildAll(ROOT); } catch (e) { console.log('FAIL  ' + e.message); process.exit(1); }
if (process.argv.includes('--write')) {
  for (const [p, text] of Object.entries(outs)) { writeFileSync(join(ROOT, p), text); console.log('wrote ' + p); }
  process.exit(0);
}
const stale = Object.entries(outs).filter(([p, text]) => !existsSync(join(ROOT, p)) || readFileSync(join(ROOT, p), 'utf8') !== text).map(([p]) => p);
console.log(stale.length ? 'FAIL  stale or missing: ' + stale.join(', ') : 'PASS  every generated output equals a fresh build (' + Object.keys(outs).length + ' files)');
let verifyOk = true;
if (existsSync(new URL('./lib/verify.js', import.meta.url).pathname)) {
  const { verifySourceAlignment } = await import('./lib/verify.js');
  const v = await verifySourceAlignment({ root: ROOT });
  for (const p of v.problems) console.log('FAIL  ' + p);
  console.log(v.status); console.log(v.statement); verifyOk = v.ok;
}
process.exit(stale.length || !verifyOk ? 1 : 0);

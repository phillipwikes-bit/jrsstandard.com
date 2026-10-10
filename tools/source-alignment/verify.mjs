#!/usr/bin/env node
// JRS source alignment: verifier. INTERNAL. FAILS CLOSED.
//   node tools/source-alignment/verify.mjs
// Needs the three October 3 files in project_sources/ with their receipt hashes. See lib/verify.js.
import { verifySourceAlignment } from './lib/verify.js';
import { ROOT } from './lib/sources.js';

const v = await verifySourceAlignment({ root: ROOT });
for (const p of v.problems) console.log('FAIL  ' + p);
console.log(v.status + (v.ok ? '' : ' (' + v.problems.length + ' problem' + (v.problems.length === 1 ? '' : 's') + ')'));
console.log(v.statement);
process.exit(v.ok ? 0 : 1);

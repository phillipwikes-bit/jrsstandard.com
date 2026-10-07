#!/usr/bin/env node
// JRS controlled independent-evaluation readiness: package verifier. INTERNAL. FAILS CLOSED.
//   node tools/evaluation-readiness/verify-readiness.mjs
// Exit 0 only when every planning-only control behaves as written. See lib/verify.js.
import { verifyReadinessPackage } from './lib/verify.js';

const v = await verifyReadinessPackage();
for (const p of v.problems) console.log('FAIL  ' + p);
console.log(v.status + (v.ok ? '' : ' (' + v.problems.length + ' problem' + (v.problems.length === 1 ? '' : 's') + ')'));
console.log(v.statement);
process.exit(v.ok ? 0 : 1);

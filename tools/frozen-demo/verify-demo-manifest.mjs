#!/usr/bin/env node
// JRS frozen synthetic demonstration: manifest and replay verifier. LOCAL ONLY. FAILS CLOSED.
//   node tools/frozen-demo/verify-demo-manifest.mjs
// Exit 0 only when the fixed local package replays exactly as frozen. See lib/verify.js.
import { verifyDemoPackage } from './lib/verify.js';

const v = await verifyDemoPackage();
for (const p of v.problems) console.log('FAIL  ' + p);
console.log(v.status + (v.ok ? '' : ' (' + v.problems.length + ' problem' + (v.problems.length === 1 ? '' : 's') + ')'));
console.log(v.statement);
process.exit(v.ok ? 0 : 1);

// Parity test: api/_anchors.js (JavaScript) against research/drr-suite-v0.9/lib/anchors_v10.py and anchors_v12.py.
// Usage: node tools/test_anchor_parity.mjs <file> [<file> ...]   prints one JSON line per file with sorted anchor sets.
import { readFileSync } from 'node:fs';
import { _internal as A } from '../../../api/_anchors.js';
for (const f of process.argv.slice(2)) {
  const t = readFileSync(f, 'utf8');
  const s = (x) => [...x].sort();
  console.log(JSON.stringify({ f, date: s(A.dates(t)), citation: s(A.citations(t)), attribution: s(A.attributions(t)), quote: s(A.quotes(t)) }));
}

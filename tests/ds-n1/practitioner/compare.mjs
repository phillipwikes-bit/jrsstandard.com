#!/usr/bin/env node
// Compare coded practitioner points with frozen predictions.
// Usage: node tests/ds-n1/practitioner/compare.mjs pred1.json coded1.json [pred2.json coded2.json ...]
import { readFileSync } from 'node:fs';
import { comparePoints, aggregate } from '../../../lib/ds-n1/practitioner-trial.mjs';

const a = process.argv.slice(2);
if (!a.length || a.length % 2) { console.error('Usage: compare.mjs pred.json coded.json [pred.json coded.json ...]'); process.exit(2); }
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const comps = [];
for (let i = 0; i < a.length; i += 2) comps.push(comparePoints(read(a[i]), read(a[i + 1])));
console.log(JSON.stringify({ comparisons: comps, totals: aggregate(comps) }, null, 2));

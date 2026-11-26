#!/usr/bin/env node
// Agreement between two independent coders (2026-11-24). Each file maps an
// answer code to the categories that coder found in it:
//   { "R01": ["authority_basis", "source_conflict"], "R02": [] }
// For each category, both coders' yes/no per answer are compared: raw
// agreement and Cohen's kappa, with the number of answers. Kappa is null when
// it is undefined (both coders gave the same single value everywhere).
// Usage: node tests/ds-n1/practitioner/agreement.mjs coderA.json coderB.json
import { readFileSync } from 'node:fs';
import { CATEGORIES } from '../../../lib/ds-n1/practitioner-trial.mjs';

export function kappa(a, b) {
  const n = a.length;
  if (!n || n !== b.length) throw new Error('both coders must code the same answers');
  const po = a.filter((x, i) => x === b[i]).length / n;
  const pa = a.filter(Boolean).length / n, pb = b.filter(Boolean).length / n;
  const pe = pa * pb + (1 - pa) * (1 - pb);
  return { n, agreement: Math.round(po * 1000) / 1000, kappa: pe === 1 ? null : Math.round(((po - pe) / (1 - pe)) * 1000) / 1000 };
}

export function agreement(A, B) {
  const codes = Object.keys(A).sort();
  if (codes.join() !== Object.keys(B).sort().join()) throw new Error('the two files code different answers');
  const cats = [...Object.keys(CATEGORIES), 'other'];
  for (const f of [A, B]) for (const c of codes) for (const x of f[c]) if (!cats.includes(x)) throw new Error(`unknown category ${x} in ${c}`);
  const per = {};
  for (const cat of cats) {
    const a = codes.map((c) => A[c].includes(cat)), b = codes.map((c) => B[c].includes(cat));
    if (!a.some(Boolean) && !b.some(Boolean)) continue;
    per[cat] = { coder_a: a.filter(Boolean).length, coder_b: b.filter(Boolean).length, ...kappa(a, b) };
  }
  return { answers: codes.length, per_category: per };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, 'utf8')));
  console.log(JSON.stringify(agreement(a, b), null, 2));
}

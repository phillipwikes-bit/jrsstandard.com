#!/usr/bin/env node
// A strong simple baseline for Track E: flag every number in the record that
// does not appear anywhere in the source (commas ignored). Any vendor could build
// this in an afternoon; a figure check has to beat it to be worth anything.
// Usage: node adapters/number-diff.mjs > answers/baseline-number-diff.json
import { readFileSync } from 'node:fs';
const data = (t) => JSON.parse(readFileSync(new URL(`../data/track-${t}.json`, import.meta.url), 'utf8'));
const nums = (t) => (t.replace(/(\d),(?=\d{3}\b)/g, '$1').match(/\d+(?:\.\d+)?/g) || []);
const out = { tool: 'Baseline: number diff', E: {} };
for (const it of data('e').items) {
  const src = new Set(nums(it.source)); const wrong = [...new Set(nums(it.record).filter((n) => !src.has(n)))];
  out.E[it.id] = { flagged: wrong.length > 0, wrong_figures: wrong };
}
console.log(JSON.stringify(out));

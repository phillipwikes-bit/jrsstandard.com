#!/usr/bin/env node
// Source inventory for the Record Check Benchmark (2026-11-26, after an external
// audit found repeated source texts and case overlap between tracks).
// For every track: items, distinct source texts (SHA-256 of the text with
// whitespace collapsed) and distinct EEOC case numbers; then case numbers shared
// between tracks and between track D's development and test splits.
// Usage: node benchmarks/record-check-v1/inventory.mjs > INVENTORY.json
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const data = (t) => JSON.parse(readFileSync(new URL(`./data/track-${t}.json`, import.meta.url), 'utf8'));
const h = (s) => createHash('sha256').update(String(s).replace(/\s+/g, ' ').trim()).digest('hex');
const caseNo = (it) => { const u = it.source_url || ''; const m = u.match(/\/(\d{7,10})\.pdf$/) || String(it.id || '').match(/_(\d{7,10})$/); return m ? m[1] : (it.decision || null); };
const tracks = {};
const add = (name, items, textOf) => {
  const texts = new Set(items.map((x) => h(textOf(x))));
  const cases = new Set(items.map(caseNo).filter(Boolean));
  tracks[name] = { items: items.length, distinct_source_texts: texts.size, distinct_cases: cases.size, _cases: cases, _texts: texts };
};
const a = data('a').items; add('A (sources of the unchanged items)', a.filter((x) => /-intact$/.test(x.id)), (x) => x.source);
add('B', data('b').items, (x) => x.source);
add('E (sources of the unchanged items)', data('e').items.filter((x) => /-intact$/.test(x.id)), (x) => x.source);
for (const t of ['f', 'f-holdout', 'f-holdout-2']) add(t.toUpperCase(), data(t).items.filter((x) => /-good$/.test(x.id)), (x) => x.source);
for (const t of ['g', 'g2']) add(t.toUpperCase(), data(t).items.filter((x) => /-good$/.test(x.id)), (x) => x.source);
const d = data('d');
add('D development', d.development, (x) => x.background);
add('D test', d.test, (x) => x.background);
const names = Object.keys(tracks);
const shared = [];
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const c = [...tracks[names[i]]._cases].filter((x) => tracks[names[j]]._cases.has(x));
  const t = [...tracks[names[i]]._texts].filter((x) => tracks[names[j]]._texts.has(x));
  if (c.length || t.length) shared.push({ between: [names[i], names[j]], shared_case_numbers: c.length, shared_source_texts: t.length });
}
for (const n of names) { delete tracks[n]._cases; delete tracks[n]._texts; }
console.log(JSON.stringify({ generated_by: 'inventory.mjs', note: 'Case numbers are read from EEOC file names; study 014 items (B, F, FH, FH2) use the study decision code. Overlap between tracks that ask different questions is reported, not hidden; it does not show that a tool was tuned on a test answer.', tracks, shared }, null, 1));

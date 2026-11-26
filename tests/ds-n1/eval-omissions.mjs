#!/usr/bin/env node
// Runs the omission check on the sealed set tests/ds-n1/omission-eval/ and
// compares with its answer key. Usage: node tests/ds-n1/eval-omissions.mjs [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { findOmissions, OMISSION_VERSION } from '../../lib/ds-n1/omissions.mjs';

const dir = new URL('./omission-eval/', import.meta.url);
const raw = (f) => readFileSync(new URL(f, dir));
const sealed = Object.fromEntries(readFileSync(new URL('SEALED.sha256', dir), 'utf8').trim().split('\n').map((l) => l.split(/\s+/).reverse()));
for (const f of ['records.json', 'answer-key.json']) {
  if (createHash('sha256').update(raw(f)).digest('hex') !== sealed[f]) throw new Error(`${f} does not match its sealed hash`);
}
const set = JSON.parse(raw('records.json'));
const key = JSON.parse(raw('answer-key.json')).truth;

export function wilson(k, n, z = 1.96) {
  if (!n) return null;
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.round(((c - h) / d) * 1000) / 1000, Math.round(((c + h) / d) * 1000) / 1000];
}

const rows = set.records.map((r) => {
  const { record } = extractRecord({ record_id: r.id, title: r.title, record_class: r.class, text: r.text, sources: r.sources.map((s) => ({ ...s, version: 'v1' })) });
  const hits = findOmissions(record);
  return { id: r.id, omits: key[r.id].omits, flagged: hits.length > 0, flags: hits.map((h) => ({ source: h.source_title, sentence: h.source_sentence, cues: h.cues })) };
});
const tp = rows.filter((r) => r.omits && r.flagged).length, pos = rows.filter((r) => r.omits).length;
const fp = rows.filter((r) => !r.omits && r.flagged).length, neg = rows.filter((r) => !r.omits).length;
const out = {
  set: set.set, rule: OMISSION_VERSION, note: set.note,
  caught: { k: tp, n: pos, wilson95: wilson(tp, pos) },
  false_flags_on_sound_records: { k: fp, n: neg, wilson95: wilson(fp, neg) },
  rows,
};
console.log(JSON.stringify(out, null, 2));
if (process.argv.includes('--write')) writeFileSync(new URL('../OMISSION_EVAL.json', dir), JSON.stringify(out, null, 2) + '\n');

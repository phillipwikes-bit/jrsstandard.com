#!/usr/bin/env node
// Two trivial baselines any tool should beat: flag everything; flag nothing.
// Usage: node adapters/baselines.mjs all|none > answers/baseline-<all|none>.json
import { readFileSync } from 'node:fs';
const mode = process.argv[2] === 'none' ? 'none' : 'all'; const f = mode === 'all';
const data = (t) => JSON.parse(readFileSync(new URL(`../data/track-${t}.json`, import.meta.url), 'utf8'));
const out = { tool: `Baseline: flag ${mode === 'all' ? 'everything' : 'nothing'}`, A: {}, B: {}, C: {}, D: {}, E: {}, F: {} };
for (const it of data('a').items) out.A[it.id] = { flagged: f, dropped_dates: [], dropped_speakers: [] };
for (const it of data('b').items) out.B[it.id] = { lossier: 'x' };
const pts = data('c').points; for (const it of data('c').items) out.C[it.id] = Object.fromEntries(pts.map((p) => [p, f ? 'N' : 'S']));
for (const it of data('d').test) out.D[it.id] = { flag: f };
for (const it of data('e').items) out.E[it.id] = { flagged: f, wrong_figures: [] };
for (const it of data('f').items) out.F[it.id] = { serious: f, flagged_sentences: f ? it.record.split(/(?<=[.!?])\s+|\n+/).filter((x) => x.trim()) : [] };
console.log(JSON.stringify(out));

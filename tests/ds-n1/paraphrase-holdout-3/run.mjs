#!/usr/bin/env node
// Paraphrase hold-out 2 (PROTOCOL.md): the 30 Sonnet P2 drafts, run once.
// Usage: node tests/ds-n1/paraphrase-holdout-3/run.mjs <dir with src/ and drafts/>
import { readFileSync } from 'node:fs';
import { extractRecord } from '../../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../../lib/ds-n1/index.mjs';
// Research harness for published public decisions (see lib/ds-n1/research.mjs).
import { enablePublicRecordResearch } from '../../../lib/ds-n1/research.mjs';
enablePublicRecordResearch();
const base = process.argv[2]; const rows = [];
for (let i = 1; i <= 30; i++) {
  const id = `S014-${String(i).padStart(2, '0')}`;
  const src = readFileSync(`${base}/src/${id}.txt`, 'utf8'); const t = readFileSync(`${base}/drafts/${id}_claude-sonnet-5-5_P2.txt`, 'utf8');
  const { record, validation } = extractRecord({ record_id: 'R', title: 'R', record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text: t, sources: [{ source_id: 'SRC', title: 'Public decision', text: src, version: 'v1' }] });
  if (validation.status) { rows.push({ id, refused: validation.errors.map((e) => e.code) }); continue; }
  const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
  const open = st.findings.filter((f) => f.status === 'OPEN');
  rows.push({ id, status: st.status, claims: record.claims.length, open: open.length, critical: open.filter((f) => f.severity === 'critical').length, per10: +((open.length / Math.max(record.claims.length, 1)) * 10).toFixed(2), codes: [...new Set(open.map((f) => f.code))] });
}
const per = rows.filter((r) => r.per10 !== undefined).map((r) => r.per10).sort((a, b) => a - b);
const median = per.length ? (per[Math.floor((per.length - 1) / 2)] + per[Math.ceil((per.length - 1) / 2)]) / 2 : null;
const ok = rows.filter((r) => (r.status === 'READY_FOR_HUMAN_FINALIZATION' || r.status === 'REVIEW_REQUIRED') && r.critical === 0).length;
console.log(JSON.stringify({ set: 'paraphrase-holdout-3', run_at: new Date().toISOString(), criterion1_median_findings_per_10: median, criterion1_pass: median !== null && median <= 3, criterion2_clean_drafts: ok, criterion2_pass: ok >= 15, pass: median <= 3 && ok >= 15, rows }, null, 2));

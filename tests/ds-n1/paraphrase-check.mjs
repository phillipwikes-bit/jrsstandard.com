#!/usr/bin/env node
// Paraphrase criteria (paraphrase-holdout/PROTOCOL.md) for one drafter.
// Usage: node tests/ds-n1/paraphrase-check.mjs <dir with src/ and drafts/> <drafter id>
import { readFileSync } from 'node:fs';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { findOmissions, findDroppedAnchors } from '../../lib/ds-n1/omissions.mjs';
const [base, drafter] = process.argv.slice(2);
const DROP = new Set(['DATE_OMITTED', 'SPEAKER_OMITTED']);
function run(text, src) {
  const { record, validation } = extractRecord({ record_id: 'R', title: 'R', record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text, sources: [{ source_id: 'SRC', title: 'Public decision', text: src, version: 'v1' }] });
  if (validation.status) return null;
  const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
  const open = st.findings.filter((f) => f.status === 'OPEN');
  let om = []; try { om = [...(findOmissions(record) || []), ...(findDroppedAnchors(record) || [])]; } catch { om = []; }
  return { status: st.status, claims: record.claims.length, open: open.length, critical: open.filter((f) => f.severity === 'critical').length, dropped: open.filter((f) => DROP.has(f.code)).length + om.length, codes: open.map((f) => f.code) };
}
const rows = [];
for (let i = 1; i <= 30; i++) {
  const id = `S014-${String(i).padStart(2, '0')}`; const src = readFileSync(`${base}/src/${id}.txt`, 'utf8');
  rows.push({ id, P1: run(readFileSync(`${base}/drafts/${id}_${drafter}_P1.txt`, 'utf8'), src), P4: run(readFileSync(`${base}/drafts/${id}_${drafter}_P4.txt`, 'utf8'), src) });
}
const per10 = rows.map((r) => (r.P4.open / Math.max(r.P4.claims, 1)) * 10).sort((a, b) => a - b);
const median = (per10[14] + per10[15]) / 2;
const sep = rows.filter((r) => r.P1.dropped > r.P4.dropped).length;
const okP4 = rows.filter((r) => (r.P4.status === 'READY_FOR_HUMAN_FINALIZATION' || r.P4.status === 'REVIEW_REQUIRED') && r.P4.critical === 0).length;
const codes = {}; for (const r of rows) for (const c of r.P4.codes) codes[c] = (codes[c] || 0) + 1;
console.log(JSON.stringify({ drafter, criterion1_median_P4_findings_per_10: +median.toFixed(2), criterion1_pass: median <= 3,
  criterion2_P1_more_dropped: sep, criterion2_pass: sep >= 24, criterion3_P4_ok: okP4, criterion3_pass: okP4 >= 15,
  pass: median <= 3 && sep >= 24 && okP4 >= 15, P4_codes: Object.entries(codes).sort((a, b) => b[1] - a[1]) }, null, 2));

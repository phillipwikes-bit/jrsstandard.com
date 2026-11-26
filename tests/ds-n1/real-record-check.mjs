#!/usr/bin/env node
// Runs the three real-record conditions (intact, dates removed, speakers removed)
// on a folder of <id>_<condition>.txt files and reports the hold-out pass criteria.
// Usage: node tests/ds-n1/real-record-check.mjs <items dir> [--detail]
import { readFileSync, readdirSync } from 'node:fs';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
// Research harness for published public decisions (see lib/ds-n1/research.mjs).
import { enablePublicRecordResearch } from '../../lib/ds-n1/research.mjs';
enablePublicRecordResearch();
const dir = process.argv[2];
const ids = [...new Set(readdirSync(dir).filter((f) => f.endsWith('_intact.txt')).map((f) => f.replace('_intact.txt', '')))].sort();
export function run(text, src) {
  const { record, validation } = extractRecord({ record_id: 'R', title: 'R', record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text, sources: [{ source_id: 'SRC', title: 'Public decision', text: src, version: 'v1' }] });
  if (validation.status) return { status: validation.status, codes: validation.errors.map((e) => e.code), open: [] };
  const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
  const open = st.findings.filter((f) => f.status === 'OPEN');
  return { status: st.status, codes: [...new Set(open.map((f) => f.code))], open };
}
const rows = ids.map((id) => {
  const src = readFileSync(`${dir}/${id}_intact.txt`, 'utf8');
  const I = run(src, src), D = run(readFileSync(`${dir}/${id}_dates_removed.txt`, 'utf8'), src), S = run(readFileSync(`${dir}/${id}_speakers_removed.txt`, 'utf8'), src);
  return { id, intact_ready: I.status === 'READY_FOR_HUMAN_FINALIZATION', intact_codes: I.codes, dates_flagged: D.status !== 'READY_FOR_HUMAN_FINALIZATION' && D.codes.includes('DATE_OMITTED'), speakers_flagged: S.status !== 'READY_FOR_HUMAN_FINALIZATION' && S.codes.includes('SPEAKER_OMITTED'), D: D.codes, S: S.codes };
});
const n = rows.length, c = (k) => rows.filter((r) => r[k]).length;
const out = { n, intact_ready: c('intact_ready'), dates_flagged: c('dates_flagged'), speakers_flagged: c('speakers_flagged'),
  thresholds: { intact_ready: Math.ceil(0.9 * n), dates_flagged: Math.ceil(0.8 * n), speakers_flagged: Math.ceil(0.8 * n) } };
out.pass = out.intact_ready >= out.thresholds.intact_ready && out.dates_flagged >= out.thresholds.dates_flagged && out.speakers_flagged >= out.thresholds.speakers_flagged;
const codeCount = {}; for (const r of rows) if (!r.intact_ready) for (const x of r.intact_codes) codeCount[x] = (codeCount[x] || 0) + 1;
out.codes_on_intact_not_ready = codeCount;
console.log(JSON.stringify(process.argv.includes('--detail') ? { ...out, rows } : out, null, 2));

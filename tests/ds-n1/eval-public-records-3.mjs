#!/usr/bin/env node
// Public-record eval 3 (PROTOCOL.md in public-record-eval-3/). Usage: node eval-public-records-3.mjs <items dir> [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { findOmissions } from '../../lib/ds-n1/omissions.mjs';
// Research harness for published public decisions (see lib/ds-n1/research.mjs).
import { enablePublicRecordResearch } from '../../lib/ds-n1/research.mjs';
enablePublicRecordResearch();
const dir = new URL('./public-record-eval-3/', import.meta.url);
const raw = readFileSync(new URL('key.json', dir));
if (createHash('sha256').update(raw).digest('hex') !== readFileSync(new URL('SEALED.sha256', dir), 'utf8').split(/\s+/)[0]) throw new Error('key.json does not match its sealed hash');
const key = JSON.parse(raw); const base = process.argv[2];
const sha = (t) => createHash('sha256').update(t).digest('hex');
const read = (id, k, h) => { const t = readFileSync(`${base}/${id}_${k}.txt`, 'utf8'); if (sha(t) !== h) throw new Error(`${id} ${k} changed`); return t; };
function run(id, text, src) {
  const { record, validation } = extractRecord({ record_id: id, title: id, record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text, sources: [{ source_id: 'SRC', title: 'Public decision', text: src, version: 'v1' }] });
  if (validation.status) return { status: validation.status, errors: validation.errors.map((e) => e.code), signal: null };
  const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
  let om = []; try { om = findOmissions(record) || []; } catch { om = []; }
  const open = st.findings.filter((f) => f.status === 'OPEN').length;
  return { status: st.status, open_findings: open, omissions: om.length, signal: open + om.length, codes: [...new Set(st.findings.map((f) => f.code))] };
}
const rows = key.decisions.map((d) => {
  const src = read(d.id, 'intact', d.source_sha256);
  return { id: d.id, intact: run(`${d.id}-I`, src, src), dates_removed: run(`${d.id}-D`, read(d.id, 'dates_removed', d.dates_removed_sha256), src), speakers_removed: run(`${d.id}-S`, read(d.id, 'speakers_removed', d.speakers_removed_sha256), src) };
});
const cmp = []; for (const r of rows) for (const k of ['dates_removed', 'speakers_removed']) if (r[k].signal != null && r.intact.signal != null) cmp.push({ id: r.id, kind: k, higher: r[k].signal > r.intact.signal, lower: r[k].signal < r.intact.signal });
const hi = cmp.filter((c) => c.higher).length, lo = cmp.filter((c) => c.lower).length, n = hi + lo;
const comb = (a, b) => { let x = 1; for (let i = 1; i <= b; i++) x = x * (a - b + i) / i; return x; };
let tail = 0; for (let i = 0; i <= Math.min(hi, lo); i++) tail += comb(n, i) / 2 ** n; const p = Math.min(1, 2 * tail);
const byKind = (k) => ({ higher: cmp.filter((c) => c.kind === k && c.higher).length, of: cmp.filter((c) => c.kind === k).length });
const readyIntact = rows.filter((r) => r.intact.status === 'READY_FOR_HUMAN_FINALIZATION').length;
const out = { set: key.set, run_at: new Date().toISOString(),
  primary: { comparisons: cmp.length, removal_higher: hi, intact_higher: lo, ties: cmp.length - n, share_higher: +(hi / cmp.length).toFixed(3), sign_test_p: +p.toPrecision(3), success: hi / cmp.length >= 0.8 && p < 0.05, dates: byKind('dates_removed'), speakers: byKind('speakers_removed') },
  secondary: { intact_ready: readyIntact, of: rows.length, success: readyIntact >= rows.length / 2 }, rows };
console.log(JSON.stringify({ ...out, rows: undefined }, null, 2));
if (process.argv.includes('--write')) writeFileSync(new URL('../PUBLIC_RECORD_EVAL_3.json', dir), JSON.stringify(out, null, 2) + '\n');

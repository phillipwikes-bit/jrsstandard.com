#!/usr/bin/env node
// Public-record eval 2: DS-N1 on AI drafts of 30 public EEOC decisions (study 014).
// Usage: node tests/ds-n1/eval-public-records-2.mjs <dir with src/ and drafts/> [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { findOmissions } from '../../lib/ds-n1/omissions.mjs';
// Research harness for published public decisions (see lib/ds-n1/research.mjs).
import { enablePublicRecordResearch } from '../../lib/ds-n1/research.mjs';
enablePublicRecordResearch();
const dir = new URL('./public-record-eval-2/', import.meta.url);
const raw = readFileSync(new URL('key.json', dir));
const sealed = readFileSync(new URL('SEALED.sha256', dir), 'utf8').split(/\s+/)[0];
if (createHash('sha256').update(raw).digest('hex') !== sealed) throw new Error('key.json does not match its sealed hash');
const key = JSON.parse(raw); const base = process.argv[2];
const sha = (t) => createHash('sha256').update(t).digest('hex');
function run(id, text, src, srcId) {
  const { record, validation } = extractRecord({ record_id: id.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 64), title: id, record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text, sources: [{ source_id: srcId, title: `Public decision ${srcId}`, text: src, version: 'v1' }] });
  if (validation.status) return { status: validation.status, errors: validation.errors.map((e) => e.code), signal: null };
  const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
  let om = []; try { om = findOmissions(record) || []; } catch (e) { om = []; }
  const open = st.findings.filter((f) => f.status === 'OPEN').length;
  return { status: st.status, open_findings: open, omissions: om.length, claims: record.claims?.length ?? null, codes: [...new Set(st.findings.map((f) => f.code))], signal: open + om.length };
}
const rows = key.pairs.map((p) => {
  const src = readFileSync(`${base}/src/${p.source}.txt`, 'utf8'); if (sha(src) !== p.source_sha256) throw new Error(`${p.source} changed`);
  const out = { source: p.source, drafter: p.drafter };
  for (const c of ['P1', 'P4']) { const t = readFileSync(`${base}/drafts/${p.source}_${p.drafter}_${c}.txt`, 'utf8'); if (sha(t) !== p[`${c}_sha256`]) throw new Error('draft changed'); out[c] = run(`${p.source}-${c}-${p.drafter}`, t, src, p.source); }
  return out;
});
const scored = rows.filter((r) => r.P1.signal != null && r.P4.signal != null);
const p1 = scored.filter((r) => r.P1.signal > r.P4.signal).length, p4 = scored.filter((r) => r.P1.signal < r.P4.signal).length, ties = scored.length - p1 - p4;
const n = p1 + p4; const comb = (a, b) => { let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return r; };
const k = Math.min(p1, p4); let tail = 0; for (let i = 0; i <= k; i++) tail += comb(n, i) / 2 ** n; const pval = Math.min(1, 2 * tail);
const ready = (c) => ({ ready: rows.filter((r) => r[c].status === 'READY_FOR_HUMAN_FINALIZATION').length, of: rows.length });
const mean = (c, f) => +(rows.reduce((s, r) => s + (r[c][f] ?? 0), 0) / rows.length).toFixed(2);
const out = { set: key.set, sealed_hash: sealed, run_at: new Date().toISOString(),
  primary: { pairs: rows.length, scored: scored.length, P1_higher: p1, P4_higher: p4, ties, sign_test_p: +pval.toFixed(4), success: p1 > p4 && pval < 0.05 },
  secondary: { P1: ready('P1'), P4: ready('P4') },
  means: { P1_open: mean('P1', 'open_findings'), P4_open: mean('P4', 'open_findings'), P1_omissions: mean('P1', 'omissions'), P4_omissions: mean('P4', 'omissions'), P1_claims: mean('P1', 'claims'), P4_claims: mean('P4', 'claims') },
  rows };
console.log(JSON.stringify({ ...out, rows: undefined }, null, 2));
if (process.argv.includes('--write')) writeFileSync(new URL('../PUBLIC_RECORD_EVAL_2.json', dir), JSON.stringify(out, null, 2) + '\n');

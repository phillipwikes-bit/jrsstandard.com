#!/usr/bin/env node
// Employment public-record eval: same rules as eval 1 (texts kept
// outside the repository; their SHA-256 is sealed in the key) and scores the
// sealed rules against documented public outcomes.
// Usage: node tests/ds-n1/eval-public-records.mjs <dir-with-texts> [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
const dir = new URL('./public-record-eval-employment/', import.meta.url);
const raw = readFileSync(new URL('key.json', dir));
const sealed = readFileSync(new URL('SEALED.sha256', dir), 'utf8').split(/\s+/)[0];
if (createHash('sha256').update(raw).digest('hex') !== sealed) throw new Error('key.json does not match its sealed hash');
const key = JSON.parse(raw); const textDir = process.argv[2];
const GAP = new Set(['RECOMMENDATION_STATED_AS_REQUIREMENT', 'CONCLUSORY_ASSESSMENT', 'AUTHORITY_TEXT_NOT_SUPPLIED', 'CONCLUSION_ON_UNRESOLVED_BASIS', 'BROAD_ACCESS_NOT_JUSTIFIED']);
const adverse = new Set(key.adverse_outcomes);
const rows = key.cases.map((c) => {
  const text = readFileSync(`${textDir}/${c.id}.txt`, 'utf8');
  if (createHash('sha256').update(text).digest('hex') !== c.text_sha256) throw new Error(`${c.id} text changed since sealing`);
  const { record, validation } = extractRecord({ record_id: c.id, title: c.id, record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text: text.slice(0, 199000), sources: [] });
  const truth = adverse.has(c.outcome_category);
  if (validation.status) return { id: c.id, outcome: c.outcome_category, adverse: truth, engine: validation.status, errors: validation.errors.map((e) => e.code) };
  const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
  const codes = [...new Set(st.findings.map((f) => f.code))];
  return { id: c.id, outcome: c.outcome_category, adverse: truth, engine: st.status, findings: st.findings.length, gap_codes: codes.filter((x) => GAP.has(x)), all_codes: codes,
    primary_predicts_adverse: st.status !== 'READY_FOR_HUMAN_FINALIZATION', secondary_predicts_adverse: codes.some((x) => GAP.has(x)) };
});
const score = (k) => { const r = rows.filter((x) => k in x); const t = (p, a) => r.filter((x) => x[k] === p && x.adverse === a).length;
  return { n: r.length, flagged_adverse: t(true, true), flagged_not_adverse: t(true, false), clear_adverse: t(false, true), clear_not_adverse: t(false, false), correct: t(true, true) + t(false, false) }; };
const out = { set: key.set, sealed_hash: sealed, run_at: new Date().toISOString(), note: 'Public documents, test classification. Documentation check only; not a judgement on any person or case.', primary: score('primary_predicts_adverse'), secondary: score('secondary_predicts_adverse'), rows };
console.log(JSON.stringify(out, null, 2));
if (process.argv.includes('--write')) writeFileSync(new URL('../PUBLIC_RECORD_EVAL_EMPLOYMENT.json', dir), JSON.stringify(out, null, 2) + '\n');

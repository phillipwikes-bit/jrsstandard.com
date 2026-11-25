#!/usr/bin/env node
// Proof 2: every finding shows its working. For every open finding on tracks A
// and B, checks that it names the record sentence (a span that exists in the
// record) and, where it is about a source, the source sentence it relied on.
import { readFileSync } from 'node:fs';
import { extractRecord } from '../../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../../lib/ds-n1/index.mjs';
const data = (t) => JSON.parse(readFileSync(new URL(`../data/track-${t}.json`, import.meta.url), 'utf8'));
const RECORD_LEVEL = new Set(['UNMAPPED_ASSERTION', 'INSTRUCTION_LIKE_CONTENT', 'BROAD_ACCESS_NOT_JUSTIFIED', 'CONCLUSION_ON_UNRESOLVED_BASIS']);
let n = 0, withRecordSpan = 0, sourceTied = 0, sourceTiedWithSentence = 0; const missing = {};
const check = (text, src) => {
  const { record, validation } = extractRecord({ record_id: 'T', title: 'T', record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text, sources: [{ source_id: 'SRC', title: 'Source', text: src, version: 'v1' }] });
  if (validation.status) return;
  const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
  const cps = [...record.text];
  for (const f of st.findings.filter((x) => x.status === 'OPEN')) {
    n++;
    const ok = f.record_span && f.record_span.end > f.record_span.start && f.record_span.end <= cps.length;
    if (ok) withRecordSpan++; else missing[f.code] = (missing[f.code] || 0) + 1;
    if (f.source_id) { sourceTied++; if ((f.evidence && (f.evidence.source_sentence || f.evidence.source_clause)) || f.source_span) sourceTiedWithSentence++; }
  }
};
for (const it of data('a').items) check(it.record, it.source);
for (const it of data('b').items) { check(it.draft_x, it.source); check(it.draft_y, it.source); }
const out = { open_findings: n, naming_the_record_sentence: withRecordSpan, share: +(withRecordSpan / n).toFixed(4),
  about_a_source: sourceTied, naming_the_source_sentence: sourceTiedWithSentence, source_share: +(sourceTiedWithSentence / Math.max(sourceTied, 1)).toFixed(4),
  findings_without_a_record_sentence_by_code: missing };
console.log(JSON.stringify(out, null, 2));

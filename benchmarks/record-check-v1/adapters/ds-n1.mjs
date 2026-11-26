#!/usr/bin/env node
// Decision Spellcheck (DS-N1) answers for every track. Offline and deterministic.
// Usage: node benchmarks/record-check-v1/adapters/ds-n1.mjs > answers/ds-n1.json
import { readFileSync } from 'node:fs';
import { extractRecord } from '../../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../../lib/ds-n1/index.mjs';
import { findOmissions, findDroppedAnchors } from '../../../lib/ds-n1/omissions.mjs';
import { euAiActLens } from '../../../lib/ds-n1/eu-ai-act.mjs';
import { CANDIDATE } from '../../../lib/ds-n1/identity.mjs';
const data = (t) => JSON.parse(readFileSync(new URL(`../data/track-${t}.json`, import.meta.url), 'utf8'));
const review = (text, sources, cls = 'workplace_investigation_report') => {
  const { record, validation } = extractRecord({ record_id: 'BM', title: 'BM', record_class: cls, data_classification: 'public_record_test', text, sources: sources.map((s, i) => ({ source_id: s.source_id || `S${i + 1}`, title: s.title || `Source ${i + 1}`, text: s.text, version: 'v1' })) });
  if (validation.status) return { record: null, state: null };
  return { record, state: deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' })) };
};
const out = { tool: `Decision Spellcheck ${CANDIDATE.version || ''}`.trim(), A: {}, B: {}, C: {}, D: {}, E: {}, F: {} };
for (const it of data('a').items) {
  const { record, state } = review(it.record, [{ text: it.source }]);
  const open = state ? state.findings.filter((f) => f.status === 'OPEN') : [];
  const dates = new Set(), speakers = new Set();
  for (const f of open) { if (f.code === 'DATE_OMITTED') (f.evidence.dropped_dates || []).forEach((d) => dates.add(d)); if (f.code === 'SPEAKER_OMITTED') (f.evidence.dropped_speakers || []).forEach((s) => speakers.add(s)); }
  if (record) for (const o of findDroppedAnchors(record)) (o.kind === 'date' ? dates : speakers).add(o.value);
  out.A[it.id] = { flagged: dates.size + speakers.size > 0, dropped_dates: [...dates].sort(), dropped_speakers: [...speakers].sort() };
}
for (const it of data('b').items) {
  const signal = (text) => { const { record, state } = review(text, [{ text: it.source }]); if (!record) return 0; const open = state.findings.filter((f) => f.status === 'OPEN'); return findOmissions(record).length + findDroppedAnchors(record).length + open.filter((f) => f.code === 'DATE_OMITTED' || f.code === 'SPEAKER_OMITTED').length; };
  const x = signal(it.draft_x), y = signal(it.draft_y);
  out.B[it.id] = { lossier: x >= y ? 'x' : 'y' };
}
const CODE = { SHOWN_SUPPORTED: 'S', STATED_UNSUPPORTED: 'U', NOT_SHOWN: 'N', NOT_APPLICABLE: 'NA' };
for (const it of data('c').items) {
  const { record } = extractRecord({ record_id: it.id, title: it.title, record_class: 'ai_action_authorization', text: it.record, sources: it.sources.map((s) => ({ ...s, version: 'v1' })) });
  const lens = euAiActLens(record); out.C[it.id] = {};
  for (const c of lens.checks) out.C[it.id][c.id] = (CODE[c.status] || c.status) + (c.flag === 'below_six_months' ? '-SHORT' : '');
}
// Track D: the rule fixed on the development split before the test split was scored (tests/ds-n1/outcome-holdout/RULES.md, primary rule).
for (const it of data('d').test) out.D[it.id] = { flag: !/without a hearing|summary judgment/.test(it.background.toLowerCase()) };
// Track E: figures (added 2026-11-25).
for (const it of data('e').items) {
  const { state } = review(it.record, [{ text: it.source }]);
  const figs = state ? state.findings.filter((f) => f.status === 'OPEN' && (f.code === 'NUMBER_MISMATCH' || f.code === 'NUMBER_NOT_ESTABLISHED')) : [];
  out.E[it.id] = { flagged: figs.length > 0, wrong_figures: [...new Set(figs.map((f) => f.evidence.claim_figure.text))] };
}
// Track F: good AI drafts and the same drafts with one error (added 2026-11-25).
for (const [track, file] of [['F', 'f'], ['FH', 'f-holdout'], ['FH2', 'f-holdout-2'], ['G', 'g'], ['G2', 'g2']]) for (const it of data(file).items) {
  const { record, state } = review(it.record, [{ text: it.source }]);
  const crit = state ? state.findings.filter((f) => f.status === 'OPEN' && f.severity === 'critical') : [];
  const quotes = new Set(); for (const f of crit) { const c = record && record.claims.find((x) => x.claim_id === f.claim_id); if (c) quotes.add(c.quote); }
  (out[track] = out[track] || {})[it.id] = { serious: crit.length > 0, flagged_sentences: [...quotes] };
}
console.log(JSON.stringify(out));

#!/usr/bin/env node
// Runs the practitioner-gap checks on the sealed set tests/ds-n1/practitioner-gaps-eval/
// through the full pipeline (plain text -> extraction -> review) and compares with
// the sealed key. Usage: node tests/ds-n1/eval-practitioner-gaps.mjs [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { runDetectionTemplates } from '../../lib/ds-n1/detection-templates.mjs';

const SET = (process.argv.find((a) => a.startsWith('--set=')) || '--set=practitioner-gaps-eval').slice(6);
const dir = new URL(`./${SET}/`, import.meta.url);
const raw = (f) => readFileSync(new URL(f, dir));
const sealed = Object.fromEntries(readFileSync(new URL('SEALED.sha256', dir), 'utf8').trim().split('\n').map((l) => l.split(/\s+/).reverse()));
for (const f of ['records.json', 'answer-key.json']) if (createHash('sha256').update(raw(f)).digest('hex') !== sealed[f]) throw new Error(`${f} does not match its sealed hash`);
const set = JSON.parse(raw('records.json')); const key = JSON.parse(raw('answer-key.json'));
const MAP = { RECOMMENDATION_STATED_AS_REQUIREMENT: 'recommendation_stated_as_requirement', CONCLUSORY_ASSESSMENT: 'conclusory_assessment', AUTHORITY_TEXT_NOT_SUPPLIED: 'authority_text_not_supplied', CONCLUSION_ON_UNRESOLVED_BASIS: 'conclusion_on_unresolved_basis' };
if (SET === 'practitioner-gaps-eval-2') {
  // Set 2 scores the whole result: does the record reach READY, and is broad access without a reason raised?
  const rows2 = set.records.map((r) => {
    const { record, validation } = extractRecord({ record_id: r.id, title: r.title, record_class: r.class, text: r.text, sources: r.sources.map((s) => ({ ...s, version: 'v1' })) });
    if (validation.status) return { id: r.id, refused: validation.errors.map((e) => e.code) };
    const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
    const t = key.truth[r.id];
    const ready = st.status === 'READY_FOR_HUMAN_FINALIZATION';
    const scope = st.findings.some((f) => f.code === 'BROAD_ACCESS_NOT_JUSTIFIED');
    return { id: r.id, status: st.status, open: st.findings.filter((f) => f.status === 'OPEN').map((f) => f.code), truth: t, ready_agree: ready === t.ready, scope_agree: scope === t.scope_gap };
  });
  const out2 = { set: set.set, note: set.note,
    ready_agreement: { k: rows2.filter((r) => r.ready_agree).length, n: rows2.length },
    sound_records_reaching_ready: { k: rows2.filter((r) => r.truth.ready && r.ready_agree).length, n: rows2.filter((r) => r.truth.ready).length },
    scope_agreement: { k: rows2.filter((r) => r.scope_agree).length, n: rows2.length }, rows: rows2 };
  console.log(JSON.stringify(out2, null, 2));
  if (process.argv.includes('--write')) writeFileSync(new URL('../PRACTITIONER_GAPS_EVAL_2.json', dir), JSON.stringify(out2, null, 2) + '\n');
  process.exit(0);
}
const rows = set.records.map((r) => {
  const { record, validation } = extractRecord({ record_id: r.id, title: r.title, record_class: r.class, text: r.text, sources: r.sources.map((s) => ({ ...s, version: 'v1' })) });
  if (validation.status) return { id: r.id, refused: validation.errors.map((e) => e.code) };
  const st = deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' }));
  const gaps = new Set(st.findings.filter((f) => MAP[f.code]).map((f) => MAP[f.code]));
  if (runDetectionTemplates(st).some((h) => h.template === 'approver_entitlement_not_shown')) gaps.add('approver_authority_not_shown');
  const gapReady = !st.findings.some((f) => MAP[f.code] && f.status === 'OPEN');
  const t = key.truth[r.id];
  const vocab = key.gaps_vocabulary;
  const per = vocab.map((g) => ({ gap: g, truth: t.gaps.includes(g), got: gaps.has(g) }));
  return { id: r.id, status: st.status, truth_ready: t.ready, ready_on_these_checks: gapReady, ready_agree: t.ready === gapReady,
    other_findings: st.findings.filter((f) => !MAP[f.code]).map((f) => f.code), per };
});
const per = rows.flatMap((r) => r.per || []);
const out = {
  set: set.set, note: set.note,
  rule_changes_before_first_run: 'Approver entitlement made advisory (not a finding) before this set was run, because only 4 of 23 practitioners raised it (below one in four); decided on developer fixtures, not on this set. It is still scored here as a gap.',
  ready_judgement_agreement: { k: rows.filter((r) => r.ready_agree).length, n: rows.length },
  gap_point_agreement: { k: per.filter((p) => p.truth === p.got).length, n: per.length },
  gaps_missed: per.filter((p) => p.truth && !p.got).length, gaps_wrongly_raised: per.filter((p) => !p.truth && p.got).length,
  disagreements: rows.flatMap((r) => [...(r.ready_agree ? [] : [`${r.id}: key ready=${r.truth_ready}, checks ready=${r.ready_on_these_checks}`]), ...(r.per || []).filter((p) => p.truth !== p.got).map((p) => `${r.id}.${p.gap}: key ${p.truth}, got ${p.got}`)]),
  rows,
};
console.log(JSON.stringify({ ...out, status_of_this_file: 'Re-run after fixes made using this set; the sealed first run is PRACTITIONER_GAPS_EVAL.first-run.json and is the evidence.' }, null, 2));
if (process.argv.includes('--write')) writeFileSync(new URL('../PRACTITIONER_GAPS_EVAL.json', dir), JSON.stringify({ ...out, status_of_this_file: 'Re-run after fixes made using this set; the sealed first run is PRACTITIONER_GAPS_EVAL.first-run.json and is the evidence.' }, null, 2) + '\n');

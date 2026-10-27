// 156-record study: blinded reference forms for the development reviewer, the blind key, the AI-proposed reference
// findings and the label register. Offline; writes files only. Refuses to overwrite.
//   forms/BLINDED_REFERENCE_FORM.md, forms/BLINDED_REFERENCE_FORM.csv   record text by blind code, empty answer fields
//   sealed/BLIND_KEY.json                     blind code -> record (not to be opened by the reviewer before finishing)
//   sealed/AI_PROPOSED_REFERENCE.json         the AI-authored or LLM-reproduced reference values, kept apart from the forms
//   registers/LABEL_REGISTER.json             every record's reference values, provenance and human-review status
// Order: three parts (development, evaluation, outside the research scope), each shuffled with a fixed seed.
// Blinding is procedural only: the reviewer can open the repository, where the records and their labels are stored.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const SEED = 20261027;
for (const f of ['forms/BLINDED_REFERENCE_FORM.md', 'forms/BLINDED_REFERENCE_FORM.csv', 'sealed/BLIND_KEY.json', 'sealed/AI_PROPOSED_REFERENCE.json', 'registers/LABEL_REGISTER.json'])
  if (existsSync(join(PKG, f))) { console.error(f + ' exists; it is preserved, not rebuilt'); process.exit(2); }
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const register = JSON.parse(readFileSync(join(PKG, 'records', 'synthetic', 'CONSTRUCTION_REGISTER.json'), 'utf8'));
const designed = new Map(register.records.map((r) => [r.id, r]));
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const shuffle = (xs) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const held = inv.entries.filter((e) => e.full_text_available);
const isDev = (e) => (e.cohort === 'synthetic_record' && e.partition === 'development') || (e.cohort === 'original_study_record' && e.scope_class === 'NOT_EXCLUDED');
const parts = [
  { part: 1, name: 'Development records (do these first)', rows: shuffle(held.filter(isDev)) },
  { part: 2, name: 'Evaluation records', rows: shuffle(held.filter((e) => e.cohort === 'synthetic_record' && e.partition === 'evaluation')) },
  { part: 3, name: 'Records outside the research scope (optional; depends on owner decision SC-1)', rows: shuffle(held.filter((e) => e.cohort === 'original_study_record' && e.scope_class !== 'NOT_EXCLUDED')) },
];
let n = 0;
const key = [];
for (const p of parts) for (const e of p.rows) key.push({ blind_id: 'B-' + String(++n).padStart(3, '0'), part: p.part, source_id: e.source_id, text_sha256: e.extracted_text_sha256 });
const textOf = (e) => readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
const byId = new Map(inv.entries.map((e) => [e.source_id, e]));

// ------------------------------------------------------------------ markdown form
const Q = ['Q1 authority: authority only / authority with linked facts / no authority cited', 'Q2 reason: restates the conclusion / gives a separate basis / no reason stated',
  'Q3 dates: one event given two different dates / different events, consistent / no dated events / cannot tell', 'Q4 outcomes: separate items, no contradiction / the same item, contradiction / no opposite outcomes'];
const md = ['# Blinded Reference Form (156-record study)', '',
  '**Reviewer:** Phillip Wikes (required development reviewer). **Form version:** S156-FORM-1.0, 2026-10-27. **Seed:** ' + SEED + '.', '',
  '## Instructions', '',
  '1. Read each record on its own terms. Do not use outside knowledge, and do not judge whether the decision was right.',
  '2. **E1.** Identify each material conclusion (a statement that, if wrong, would change the decision or its defensibility). Mark GROUNDED if every material conclusion is traceable to identifiable evidence within the record (a cited, attached, dated or described source). Mark UNGROUNDED if at least one is not. Mark CANNOT TELL if the record does not allow a decision.',
  '3. Answer Q1 to Q4 for every record. "Not applicable" answers are listed with each question.',
  '4. Note the minutes you spent on each part (not each record).',
  '5. Do not open `sealed/`, `records/`, `registers/` or `out/` until you have finished. The blinding is procedural: those files hold the record identities and the AI-proposed labels.',
  '6. Answers can be filled here or in `BLINDED_REFERENCE_FORM.csv`. Your answers become the human reference only when the completed form is recorded with its date.', '',
  '**The labels you give are not checked against anything before they are recorded. There is no right answer to aim for.**', ''];
for (const p of parts) {
  md.push('## Part ' + p.part + ': ' + p.name + ' (' + p.rows.length + ' records)', '', 'Minutes spent on this part: ____', '');
  for (const e of p.rows) {
    const k = key.find((x) => x.source_id === e.source_id);
    md.push('### ' + k.blind_id, '', '> ' + textOf(e).replace(/\n/g, '\n> '), '', '- E1: GROUNDED / UNGROUNDED / CANNOT TELL: ____', '- If UNGROUNDED, the conclusion without a basis: ____', ...Q.map((q) => '- ' + q + ': ____'), '- Notes: ____', '');
  }
}
const csvq = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const csv = ['blind_id,part,record_text,e1_label,unsupported_conclusion,q1_authority,q2_reason,q3_dates,q4_outcomes,notes'];
for (const k of key) csv.push([k.blind_id, k.part, csvq(textOf(byId.get(k.source_id))), '', '', '', '', '', '', ''].join(','));

// ------------------------------------------------------------------ AI proposals and the label register
const proposals = [], labels = [];
const qMap = { authority_without_linked_facts: 'authority only', authority_with_linked_facts: 'authority with linked facts', conclusion_restated_as_basis: 'restates the conclusion',
  different_events_no_conflict: 'different events, consistent', same_event_two_dates: 'one event given two different dates', separate_requests_no_contradiction: 'separate items, no contradiction' };
for (const e of inv.entries) {
  const ref = e.reference_findings[0];
  const d = designed.get(e.source_id);
  const k = key.find((x) => x.source_id === e.source_id);
  if (e.full_text_available) proposals.push({ source_id: e.source_id, blind_id: k ? k.blind_id : null, e1: ref.value, e1_kind: ref.kind,
    questions: d ? Object.fromEntries(['q1', 'q2', 'q3', 'q4'].map((q) => [q, d.designed[q] ? qMap[d.designed[q]] : 'not targeted by construction'])) : 'NOT PROPOSED (no construction design exists for original records)',
    provenance: ref.provenance, status: 'AI_PROPOSAL: not reviewed by a human' });
  labels.push({ study_id: e.study_id, source_id: e.source_id, cohort: e.cohort, partition: e.partition || (e.cohort === 'original_study_record' ? (isDev(e) ? 'development' : 'outside_research_scope') : 'not_held'),
    reference_kind: ref.kind, reference_value: ref.value, provenance: ref.provenance,
    human_review: e.cohort === 'public_case' ? 'Human JRS read of the source document (' + ref.provenance + '); a different construct from the study rule E1; second reader: ' + ((e.reference_findings.find((r) => r.kind === 'second_reader') || {}).value || 'none recorded') : (ref.human_review || 'NOT ESTABLISHED'),
    blinded_form_issued: !!k, blind_id: k ? k.blind_id : null, development_reviewer_label: 'NOT RECORDED', independent_review: 'NOT ESTABLISHED', adjudication: 'NOT PERFORMED',
    used_in_scoring_as: e.full_text_available ? (e.cohort === 'synthetic_record' ? 'designed construction label (AI-authored)' : 'LLM-reproduced verified key') : 'not used: source text not held' });
}
mkdirSync(join(PKG, 'forms'), { recursive: true }); mkdirSync(join(PKG, 'sealed'), { recursive: true });
writeFileSync(join(PKG, 'forms', 'BLINDED_REFERENCE_FORM.md'), md.join('\n') + '\n', { flag: 'wx' });
writeFileSync(join(PKG, 'forms', 'BLINDED_REFERENCE_FORM.csv'), csv.join('\n') + '\n', { flag: 'wx' });
writeFileSync(join(PKG, 'sealed', 'BLIND_KEY.json'), JSON.stringify({ format: 'jrs-study-156-blind-key/1.0.0', seed: SEED, note: 'Do not open before the reviewer has finished. Procedural blinding only.', rows: key }, null, 2) + '\n', { flag: 'wx' });
writeFileSync(join(PKG, 'sealed', 'AI_PROPOSED_REFERENCE.json'), JSON.stringify({ format: 'jrs-study-156-ai-proposals/1.0.0', note: 'AI-authored construction intent (synthetic) and the LLM-reproduced key (originals). AI proposals, not human findings.', rows: proposals }, null, 2) + '\n', { flag: 'wx' });
writeFileSync(join(PKG, 'registers', 'LABEL_REGISTER.json'), JSON.stringify({ format: 'jrs-study-156-label-register/1.0.0', built_at_utc: new Date().toISOString(),
  summary: { records: labels.length, with_text: labels.filter((l) => l.blinded_form_issued).length, human_reviewed: 0, adjudicated: 0, note: 'No human review or adjudication of any reference label used in scoring is recorded. The public cases carry a human JRS read, but their text is not held, so they are not scored.' },
  rows: labels }, null, 2) + '\n', { flag: 'wx' });
console.log('forms', key.length, 'records in', parts.map((p) => p.rows.length).join('/'), 'proposals', proposals.length, 'labels', labels.length);

// Study completion: imports completed human-review batches (CSV or JSON exported by the batch form) into the label
// record, without changing any frozen file. It keeps, side by side and never overwritten: the AI-proposed label (from
// the frozen sealed proposals), the human label and answers, the disagreement status, and an append-only history of
// every import, correction and adjudication. It never creates a label: a record without an imported answer stays
// AI-proposed. Adjudication is accepted only from a separate file that names the adjudicator and the date.
// Statuses: AI-proposed | human-reviewed (human label equals AI-proposed) | disputed (they differ; both kept) |
//           uncertain (reviewer chose UNCERTAIN) | adjudicated (a named person settled a dispute)
// Usage: node tools/human-review/import-labels.mjs [--out <labels.json>] <completed file> ...
//        node tools/human-review/import-labels.mjs [--out <labels.json>] --adjudication <adjudication.json>
import { attempts } from '../guard.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { DIR, ROOT, STUDY, STATUS, sha, readJson, writeJson, writeOut } from '../common.mjs';
import { OPTIONS, COLUMNS, FORM_VERSION } from './build-batches.mjs';

export function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some((x) => x !== '')) rows.push(row); row = []; } else cell += ch; }
  if (cell !== '' || row.length) { row.push(cell); if (row.some((x) => x !== '')) rows.push(row); }
  const [head, ...body] = rows; return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] === undefined ? '' : r[i]])));
}
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const unquote = (s) => norm(s).replace(/^["“‘']+|["”’']+$/g, '');

// Validates one answer against the frozen record text. Returns { problems, passages }.
export function validateAnswer(a, key, texts) {
  const p = [];
  const k = key.get(a.blind_id);
  if (!k) return { problems: ['unknown_blind_id:' + a.blind_id], passages: [] };
  if (k.part !== 1) p.push('not_a_part_1_record:' + a.blind_id);
  const text = texts.get(a.blind_id);
  if (a.record_text_sha256 && a.record_text_sha256 !== k.text_sha256) p.push('record_text_hash_differs_from_blind_key');
  if (!OPTIONS.e1.includes(a.e1)) p.push('e1_missing_or_invalid');
  for (const f of ['q1_authority', 'q2_reason', 'q3_dates', 'q4_outcomes', 'confidence', 'disputed']) if (a[f] && !OPTIONS[f].includes(a[f])) p.push(f + '_invalid');
  for (const n of [1, 2, 3]) if (a['link_' + n] && !OPTIONS.link.includes(a['link_' + n])) p.push('link_' + n + '_invalid');
  if (a.disputed === 'yes' && !norm(a.dispute_reason)) p.push('dispute_without_reason');
  if (a.e1 === 'UNGROUNDED' && !norm(a.unsupported_conclusion)) p.push('ungrounded_without_named_conclusion');
  if (a.minutes && !/^\d{1,4}$/.test(String(a.minutes).trim())) p.push('minutes_not_a_number');
  const passages = [1, 2, 3].map((n) => ({ n, conclusion: norm(a['conclusion_' + n]), passage: a['passage_' + n] || '', link: a['link_' + n] || '' })).filter((x) => x.conclusion || x.passage)
    .map((x) => Object.assign(x, { exact: !x.passage || norm(text).includes(unquote(x.passage)) }));
  return { problems: p, passages };
}
const statusOf = (human, ai) => (human === 'UNCERTAIN' ? 'uncertain' : human === ai ? 'human-reviewed' : 'disputed');

export function importFiles({ files, labels, key, texts, ai, now }) {
  const report = { imported: [], rejected: [], passages_not_exact: [] };
  for (const f of files) {
    const raw = readFileSync(f, 'utf8'), fileSha = sha(raw);
    let answers;
    if (/\.json$/i.test(f)) { const o = JSON.parse(raw); if (o.format !== 'jrs-human-review-batch-answers/1.0.0') { report.rejected.push({ file: basename(f), problem: 'unknown_format' }); continue; } answers = o.answers; }
    else answers = parseCsv(raw);
    for (const a of answers) {
      if (!a.e1 && !COLUMNS.slice(6).some((c) => norm(a[c]))) continue;   // an untouched record: nothing to import
      if (a.form_version && a.form_version !== FORM_VERSION) { report.rejected.push({ file: basename(f), blind_id: a.blind_id, problems: ['form_version_differs'] }); continue; }
      if ('ai_label' in a || 'reference' in a || 'engine_e1' in a) { report.rejected.push({ file: basename(f), blind_id: a.blind_id, problems: ['file_contains_label_or_engine_columns'] }); continue; }
      const v = validateAnswer(a, key, texts);
      if (v.problems.length) { report.rejected.push({ file: basename(f), blind_id: a.blind_id, problems: v.problems }); continue; }
      const k = key.get(a.blind_id), sid = k.source_id, aiLabel = ai.get(sid);
      const prev = labels.records[sid] || { source_id: sid, blind_id: a.blind_id, ai_proposed: aiLabel, status: 'AI-proposed', human: null, history: [] };
      const human = { e1: a.e1, reviewer: norm(a.reviewer) || null, passages: v.passages, unsupported_conclusion: norm(a.unsupported_conclusion) || null, q1_authority: a.q1_authority || null, q2_reason: a.q2_reason || null,
        q3_dates: a.q3_dates || null, q4_outcomes: a.q4_outcomes || null, confidence: a.confidence || null, reviewer_disputes_record: a.disputed === 'yes', dispute_reason: norm(a.dispute_reason) || null, rationale: norm(a.rationale) || null, minutes: a.minutes ? Number(a.minutes) : null, batch: a.batch || null };
      const same = prev.human && JSON.stringify(prev.human) === JSON.stringify(human);
      if (same) continue;
      const status = prev.status === 'adjudicated' ? 'adjudicated' : statusOf(human.e1, aiLabel);
      prev.history.push({ at_utc: now, event: prev.human ? 'corrected' : 'imported', file: basename(f), file_sha256: fileSha, previous_status: prev.status, new_status: status, previous_human: prev.human || null });
      prev.human = human; prev.status = status; prev.ai_proposed = aiLabel;
      labels.records[sid] = prev;
      report.imported.push({ blind_id: a.blind_id, status });
      for (const x of v.passages.filter((y) => !y.exact)) report.passages_not_exact.push({ blind_id: a.blind_id, n: x.n });
    }
  }
  return report;
}
// { format, adjudicator, date_utc, decisions: [{ blind_id, e1, reason }] }
export function applyAdjudication({ adj, labels, key, now, fileSha }) {
  const p = [];
  if (adj.format !== 'jrs-human-review-adjudication/1.0.0') p.push('unknown_format');
  if (!norm(adj.adjudicator)) p.push('adjudicator_not_named');
  if (!Number.isFinite(Date.parse(adj.date_utc))) p.push('adjudication_date_invalid');
  if (p.length) return { problems: p, applied: [] };
  const applied = [];
  for (const d of adj.decisions || []) {
    const k = key.get(d.blind_id); const r = k && labels.records[k.source_id];
    if (!r || (r.status !== 'disputed' && r.status !== 'uncertain')) { p.push('nothing_to_adjudicate:' + d.blind_id); continue; }
    if (!['GROUNDED', 'UNGROUNDED'].includes(d.e1) || !norm(d.reason)) { p.push('decision_invalid:' + d.blind_id); continue; }
    r.history.push({ at_utc: now, event: 'adjudicated', adjudicator: norm(adj.adjudicator), date_utc: adj.date_utc, file_sha256: fileSha, previous_status: r.status, decided_e1: d.e1, reason: norm(d.reason) });
    r.status = 'adjudicated'; r.adjudicated = { e1: d.e1, adjudicator: norm(adj.adjudicator), date_utc: adj.date_utc };
    applied.push(d.blind_id);
  }
  return { problems: p, applied };
}
export function emptyLabels() { return { format: 'jrs-study-completion-human-labels/1.0.0', ...STATUS, statement: 'Human labels imported from completed review files only. AI-proposed labels are kept alongside and never overwritten. Agreement between a human label and an AI-proposed label is not accuracy.', records: {} }; }
export function loadContext() {
  const key = new Map(readJson(join(STUDY, 'sealed', 'BLIND_KEY.json')).rows.map((r) => [r.blind_id, r]));
  const inv = new Map(readJson(join(STUDY, 'registers', 'RECORD_INVENTORY_V2.json')).entries.map((e) => [e.source_id, e]));
  const texts = new Map([...key.values()].filter((k) => k.part === 1).map((k) => [k.blind_id, readFileSync(join(ROOT, inv.get(k.source_id).extracted_text_path), 'utf8')]));
  const ai = new Map(readJson(join(STUDY, 'sealed', 'AI_PROPOSED_REFERENCE.json')).rows.map((r) => [r.source_id, r.e1]));
  return { key, texts, ai };
}
export function summary(labels) {
  const rs = Object.values(labels.records); const by = {}; for (const r of rs) by[r.status] = (by[r.status] || 0) + 1;
  return { records_with_human_answer: rs.filter((r) => r.human).length, by_status: by, reviewer_disputes: rs.filter((r) => r.human && r.human.reviewer_disputes_record).length };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = process.argv.slice(2); let out = join(DIR, 'human-review', 'HUMAN_LABELS.json');
  if (args[0] === '--out') { out = args[1]; args.splice(0, 2); }
  if (!args.length) { console.error('usage: import-labels.mjs [--out <labels.json>] <completed file> ... | --adjudication <file>'); process.exit(2); }
  const ctx = loadContext(), now = new Date().toISOString();
  const labels = existsSync(out) ? readJson(out) : emptyLabels();
  let rep;
  if (args[0] === '--adjudication') { const raw = readFileSync(args[1], 'utf8'); rep = applyAdjudication({ adj: JSON.parse(raw), labels, key: ctx.key, now, fileSha: sha(raw) }); }
  else rep = importFiles({ files: args, labels, ...ctx, now });
  labels.summary = summary(labels); labels.updated_at_utc = now; labels.network_attempts = attempts.length;
  writeJson(out, labels);
  const md = ['# Human labels: import record', '', 'Written by `tools/human-review/import-labels.mjs`. Do not edit by hand.', '', '| Item | Value |', '|---|---|',
    '| Records with a human answer | ' + labels.summary.records_with_human_answer + ' of 44 (Part 1) |', '| By status | ' + (Object.entries(labels.summary.by_status).map(([k, v]) => k + ' ' + v).join(', ') || 'none') + ' |',
    '| Reviewer disputes | ' + labels.summary.reviewer_disputes + ' |', '', 'Last import: ' + now + '. ' + JSON.stringify({ imported: (rep.imported || rep.applied || []).length, rejected: (rep.rejected || rep.problems || []).length, passages_not_exact: (rep.passages_not_exact || []).length }), ''];
  writeOut(out.replace(/\.json$/, '.md'), md.join('\n'));
  console.log(JSON.stringify(rep, null, 1).slice(0, 2000));
  const failed = (rep.rejected && rep.rejected.length) || (rep.problems && rep.problems.length);
  process.exit(failed ? 1 : 0);
}

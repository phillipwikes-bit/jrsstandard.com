// 0.3.4 repair package: builds the human reference review form 2.0 from the study's blinded form 1.0
// (research/study-156-2026-10-27/forms/BLINDED_REFERENCE_FORM.csv, unchanged). Same blind codes and record texts, so
// the study's sealed key still maps each code; new fields for supporting passages, applicability and uncertainty,
// expected control requirements and unresolved interpretations. No Engine output, AI-proposed label or score is
// read or written. No answer is filled in. Usage: node tools/build-review-form-v2.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(PKG, '..', 'study-156-2026-10-27', 'forms', 'BLINDED_REFERENCE_FORM.csv');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const csv = readFileSync(SRC, 'utf8');
function parse(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c; }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const [head, ...body] = parse(csv).filter((r) => r.length > 1);
const col = (n) => head.indexOf(n);
const recs = body.map((r) => ({ id: r[col('blind_id')], part: Number(r[col('part')]), text: r[col('record_text')] }));
const PARTS = { 1: 'Part 1: Development records (do these first)', 2: 'Part 2: Evaluation records (leave until owner Decision 6, reviewer-benefit sessions, is settled)', 3: 'Part 3: Records outside the research scope (only if owner decision SC-1 allows research use)' };
const FIELDS = ['blind_id', 'part', 'record_text', 'e1_label', 'material_conclusions', 'supporting_passages', 'conclusion_without_basis', 'applicability', 'uncertainty',
  'q1_authority', 'q2_reason', 'q3_dates', 'q4_outcomes', 'expected_controls', 'unresolved_interpretations', 'notes'];
const L = [];
L.push('# Human Reference Review Form, version 2.0', '',
  '**Reviewer:** Phillip Wikes. **Form version:** S156-FORM-2.0 (0.3.4 repair package), 2026-10-27. Built from S156-FORM-1.0 with the same blind codes and record texts.', '',
  '**Nothing on this form has been filled in.** No answer, approval or judgement is recorded on your behalf. The form contains no Engine finding, AI-proposed label or score.', '',
  '## Instructions', '',
  '1. Read each record on its own terms. Do not use outside knowledge, and do not judge whether the decision itself was right.',
  '2. Work through Part 1 first. Leave Part 2 until owner Decision 6 (reviewer-benefit sessions) is settled, because labelling those records first would affect the sessions. Part 3 applies only if owner decision SC-1 allows research use of those records.',
  '3. Do not open, before you finish, the study\'s `sealed/`, `records/`, `registers/`, `out/` or `reports/`, or this package\'s `out/` and `reports/`. The blinding is procedural: those files hold the record identities, the AI-proposed labels and the Engine\'s outputs.',
  '4. Save the completed copy as a new file under a new folder `reviews/` with its date, not over this form. Your answers become the human reference only when that dated copy is recorded.',
  '5. Note the minutes you spend on each part.', '',
  '## Definitions', '',
  '| Term | Meaning on this form |', '|---|---|',
  '| Material conclusion | A statement that, if wrong, would change the decision or its defensibility |',
  '| Identifiable evidence | A cited, attached, dated, numbered or described source within the record (for example a dated test report, a register entry, a measurement) |',
  '| Linked | The record itself says, in words, that the conclusion rests on that evidence; or the evidence plainly concerns the same item and the link needs no inference. Mark which, under "supporting passages" |',
  '| GROUNDED | Every material conclusion is traceable to identifiable evidence within the record |',
  '| UNGROUNDED | At least one material conclusion is not |',
  '| CANNOT TELL | The record does not allow either answer |',
  '| Authority only | A rule, policy or section is cited, but no fact in the record shows its conditions were met |',
  '| Restates the conclusion | The stated reason repeats the outcome instead of giving a separate basis |',
  '| Same event, two dates | One event (the same meeting, the same test) is given two different dates. A next, previous, revised or planned event is a different event |',
  '| Separate items | Opposite outcomes concern different requests or items, so there is no contradiction |', '',
  '**Fields for each record**', '',
  '- **E1:** GROUNDED / UNGROUNDED / CANNOT TELL.',
  '- **Material conclusions:** list them in a few words each.',
  '- **Supporting passages:** for each conclusion, quote the passage that supports it, or write "none". Mark each "stated link" or "plain link".',
  '- **Conclusion without a basis:** if UNGROUNDED, which conclusion.',
  '- **Applicability:** do the four questions fit this record? applicable / partly / not applicable.',
  '- **Uncertainty:** confident / somewhat uncertain / very uncertain.',
  '- **Q1 to Q4:** as in version 1.0.',
  '- **Expected controls:** what a later reviewer should be prompted to ask about this record, if anything (for example: "which evidence does the decision rest on?"). Write "none" if nothing.',
  '- **Unresolved interpretations:** anything the record leaves open that you could not settle.', '',
  '**What happens to your answers.** Each label you give is recorded with the status **human-reviewed**. Where it differs from the AI-proposed label, both are kept and the status becomes **disputed** until you, or someone you name, settles it (**adjudicated**). Agreement between the Engine and an AI-proposed label is not accuracy, and is never reported as such. See `registers/LABEL_STATUS_REGISTER.json`.', '');
for (const p of [1, 2, 3]) {
  const rs = recs.filter((r) => r.part === p);
  L.push('## ' + PARTS[p] + ' (' + rs.length + ' records)', '', 'Minutes spent on this part: ____', '');
  for (const r of rs) {
    L.push('### ' + r.id, '', '> ' + r.text, '',
      '- E1: GROUNDED / UNGROUNDED / CANNOT TELL: ____', '- Material conclusions: ____', '- Supporting passages (quote; mark stated link or plain link): ____',
      '- If UNGROUNDED, the conclusion without a basis: ____', '- Applicability: applicable / partly / not applicable: ____', '- Uncertainty: confident / somewhat uncertain / very uncertain: ____',
      '- Q1 authority: authority only / authority with linked facts / no authority cited: ____', '- Q2 reason: restates the conclusion / gives a separate basis / no reason stated: ____',
      '- Q3 dates: one event given two different dates / different events, consistent / no dated events / cannot tell: ____', '- Q4 outcomes: separate items, no contradiction / the same item, contradiction / no opposite outcomes: ____',
      '- Expected controls (what a reviewer should be prompted to ask, or "none"): ____', '- Unresolved interpretations: ____', '- Notes: ____', '');
  }
}
const esc = (s) => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
const C = [FIELDS.join(','), ...recs.map((r) => FIELDS.map((f) => (f === 'blind_id' ? r.id : f === 'part' ? String(r.part) : f === 'record_text' ? esc(r.text) : '')).join(','))].join('\n') + '\n';
mkdirSync(join(PKG, 'forms'), { recursive: true });
for (const [f, body] of [['HUMAN_REFERENCE_FORM_V2.md', L.join('\n') + '\n'], ['HUMAN_REFERENCE_FORM_V2.csv', C]]) {
  const p = join(PKG, 'forms', f); if (existsSync(p)) { console.error('exists: ' + p); process.exit(2); } writeFileSync(p, body, { flag: 'wx' });
}
console.log('records', recs.length, 'by part', [1, 2, 3].map((p) => recs.filter((r) => r.part === p).length).join('/'), 'source sha256', sha(csv));

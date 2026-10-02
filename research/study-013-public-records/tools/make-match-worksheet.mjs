#!/usr/bin/env node
// PROTOCOL amendment 1: blinded worksheet for the human-scored deficiency-match outcome.
// Usage: node tools/make-match-worksheet.mjs runs/<name>
// Writes WORKSHEET.csv (arms relabeled with random letters) and UNBLINDING.json (keep closed until scoring ends).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(ROOT, process.argv[2]);
const def = JSON.parse(readFileSync(path.join(ROOT, 'GAP_DEFICIENCIES.json'), 'utf8'));
const files = readdirSync(path.join(dir, 'raw')).filter((f) => f.endsWith('_r1.json'));
const arms = [...new Set(files.map((f) => f.split('_')[0]))];
const letters = ['P', 'Q', 'R', 'S', 'T', 'U'].slice(0, arms.length);
for (let i = letters.length - 1; i > 0; i--) { const j = randomInt(i + 1); [letters[i], letters[j]] = [letters[j], letters[i]]; }
const blind = Object.fromEntries(arms.map((a, i) => [a, letters[i]]));
const esc = (s) => '"' + String(s).replace(/"/g, '""').replace(/\s+/g, ' ') + '"';
const rows = [['case', 'reviewer', 'reviewer_notes', 'eeoc_categories_to_check', 'match_yes_no', 'scorer_comment'].join(',')];
const lines = [];
for (const [cid, c] of Object.entries(def.cases)) {
  for (const a of arms) {
    let notes = '';
    try {
      const r = JSON.parse(readFileSync(path.join(dir, 'raw', `${a}_${cid}_r1.json`), 'utf8')).response;
      const text = (r.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
      const m = text.match(/\{[\s\S]*\}/); const p = m ? JSON.parse(m[0]) : {};
      notes = p.reason || Object.entries(p.conditions || {}).map(([k, v]) => `${k}: ${v.status}: ${v.note || ''}`).join(' | ');
      if (p.remediation_note) notes += ' | remediation: ' + p.remediation_note;
    } catch (e) { notes = '(no parsable output)'; }
    const cats = c.codes.map((k) => `${k} ${def.categories[k].label}`).join('; ');
    lines.push([cid, blind[a], esc(notes), esc(cats), '', ''].join(','));
  }
}
lines.sort();
writeFileSync(path.join(dir, 'WORKSHEET.csv'), rows.concat(lines).join('\n') + '\n');
writeFileSync(path.join(dir, 'UNBLINDING.json'), JSON.stringify(blind, null, 1));
console.log(`${lines.length} rows; arms blinded as ${letters.join(',')}`);

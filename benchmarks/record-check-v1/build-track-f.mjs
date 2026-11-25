#!/usr/bin/env node
// Builds Track F (good AI drafts) from study 014's published AI drafts of 30
// public EEOC decisions (branch claude/engine-eval-v8-2026-10-01,
// research/study-014-drr/runs/2026-10-02-draft/raw/). The P4 drafts kept their
// citations and quotations (study 014: 97% reconstruction), so they are the good
// drafts. Each good draft also appears with ONE error put in by rule, cycling:
//   date      a full date in one sentence moved by one day
//   negation  "was" -> "was not" in one sentence
//   figure    one amount, percentage or period doubled
// A tool must leave the good draft without a serious flag AND flag the sentence
// that was changed. This is the track Decision Spellcheck is weakest on.
// Usage: node build-track-f.mjs <dir with src/S014-NN.txt> <dir with drafts>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { sentences } from '../../lib/ds-n1/text.mjs';
const [srcDir, draftDir] = process.argv.slice(2);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DATE = new RegExp(`\\b(${MONTHS.join('|')}) (\\d{1,2}), (\\d{4})\\b`);
const FIG = /(\$\s?[\d,]+|\b\d+(?=\s?%)|\b\d+(?= (?:days|weeks|months|hours|years)\b))/;
const usable = (s) => s.split(/\s+/).length >= 8 && !/^\s*[#>|-]/.test(s);
const KINDS = ['date', 'negation', 'figure'];
function corrupt(draft, start) {
  const sents = sentences(draft).map((s) => s.text).filter(usable);
  for (let k = 0; k < 3; k++) {
    const kind = KINDS[(start + k) % 3];
    for (const s of sents) {
      let t = null;
      if (kind === 'date') { const m = s.match(DATE); if (m) { const d = +m[2] === 28 ? 27 : +m[2] + 1; t = s.replace(m[0], `${m[1]} ${d}, ${m[3]}`); } }
      if (kind === 'negation' && / was (?!not\b)/.test(s) && !/\b(not|no|never)\b/i.test(s)) t = s.replace(/ was (?!not\b)/, ' was not ');
      if (kind === 'figure') { const m = s.match(FIG); if (m) { const n = +m[0].replace(/[^\d]/g, ''); if (n > 0) t = s.replace(m[0], m[0].replace(/[\d,]+/, (n * 2).toLocaleString('en-US'))); } }
      if (t && t !== s && draft.split(s).length === 2) return { kind, before: s, after: t, text: draft.replace(s, t) };
    }
  }
  return null;
}
const items = [], key = {};
const drafts = readdirSync(draftDir).filter((f) => /_P4\.txt$/.test(f)).sort();
drafts.forEach((f, i) => {
  const dec = f.split('_')[0];
  const source = readFileSync(`${srcDir}/${dec}.txt`, 'utf8');
  const draft = readFileSync(`${draftDir}/${f}`, 'utf8');
  const c = corrupt(draft, i);
  const id = `F-${String(i + 1).padStart(2, '0')}`;
  items.push({ id: `${id}-good`, decision: dec, drafter: f.split('_')[1], source, record: draft });
  key[`${id}-good`] = { altered: false };
  if (c) { items.push({ id: `${id}-changed`, decision: dec, drafter: f.split('_')[1], source, record: c.text }); key[`${id}-changed`] = { altered: true, kind: c.kind, changed_sentence: c.after, original_sentence: c.before }; }
});
const out = new URL('./data/', import.meta.url);
writeFileSync(new URL('track-f.json', out), JSON.stringify({ track: 'F', task: 'Each item gives a public decision (source) and an AI-written account of it (record). Report whether the record has a serious problem (serious: true/false) and which record sentences you flag as serious (flagged_sentences). Good drafts should not be flagged; in a changed draft the changed sentence should be.', items }, null, 1));
writeFileSync(new URL('track-f.key.json', out), JSON.stringify(key, null, 1));
const kinds = Object.values(key).filter((k) => k.altered).reduce((a, k) => ({ ...a, [k.kind]: (a[k.kind] || 0) + 1 }), {});
console.log(`${drafts.length} good drafts, ${Object.values(key).filter((k) => k.altered).length} changed`, kinds);

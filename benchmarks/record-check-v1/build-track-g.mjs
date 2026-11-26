#!/usr/bin/env node
// Builds Track G (fresh decisions, one changed sentence) from public EEOC
// appellate decisions not used in tracks A to F.
// Usage: node build-track-g.mjs <folder of EEOC PDFs named YYYY_MM_DD_<number>.pdf> <exclude-numbers.txt>
// Deterministic: files in name order, the first 60 that qualify. Each decision
// gives a passage of 3 to 5 consecutive sentences, as published ("-good") and
// with one change ("-changed"): in even positions one "was" made "was not" in a
// sentence with no negation; in odd positions one full date moved by one day.
// Built by the developer, who also built Decision Spellcheck.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { pdfToText } from '../../lib/ds-n1/pdf.mjs';
import { sentences } from '../../lib/ds-n1/text.mjs';
const [dir, excl] = process.argv.slice(2);
const exclude = new Set(readFileSync(excl, 'utf8').split(/\s+/).filter(Boolean));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DATE = new RegExp(`\\b(${MONTHS.join('|')}) (\\d{1,2}), (\\d{4})\\b`);
const items = [], key = {}; let pos = 0; const used = new Set();
for (const file of readdirSync(dir).filter((f) => f.endsWith('.pdf')).sort()) {
  if (pos >= 60) break;
  const no = file.replace(/^\d{4}_\d{2}_\d{2}_/, '').replace('.pdf', '');
  // The same decision number can be posted twice; each case is used once.
  if (exclude.has(no) || used.has(no)) continue;
  let src; try { src = pdfToText(readFileSync(`${dir}/${file}`), inflateSync).replace(/[ \t]+/g, ' '); } catch { continue; }
  if (src.length < 4000) continue;
  const sents = sentences(src).map((s) => s.text.replace(/\s*\n\s*/g, ' ').trim());
  const kind = pos % 2 === 0 ? 'negation' : 'date';
  let pick = null;
  for (let i = 2; i < sents.length - 2 && !pick; i++) {
    const t = sents[i]; const w = t.split(/\s+/).length;
    if (w < 10 || w > 45 || /^(See|Id\.|ROI)/.test(t) || src.split(t).length !== 2) continue;
    if (kind === 'negation' && / was (?!not\b)/.test(t) && !/\b(not|no|never|denied|failed|without|nor)\b/i.test(t)) pick = { i, after: t.replace(/ was (?!not\b)/, ' was not ') };
    if (kind === 'date') { const m = t.match(DATE); if (m && +m[2] < 28) pick = { i, after: t.replace(m[0], `${m[1]} ${+m[2] + 1}, ${m[3]}`) }; }
  }
  if (!pick) continue;
  used.add(no);
  const block = sents.slice(pick.i - 2, pick.i + 3);
  const id = `G-${String(pos + 1).padStart(2, '0')}`;
  const url = `https://www.eeoc.gov/sites/default/files/decisions/${file.slice(0, 10)}/${no}.pdf`;
  items.push({ id: `${id}-good`, source: src, record: block.join(' '), source_url: url });
  items.push({ id: `${id}-changed`, source: src, record: block.map((s, k) => (k === 2 ? pick.after : s)).join(' '), source_url: url });
  key[`${id}-good`] = { altered: false };
  key[`${id}-changed`] = { altered: true, kind, changed_sentence: pick.after, original_sentence: sents[pick.i] };
  pos++;
}
const out = new URL('./data/', import.meta.url);
writeFileSync(new URL('track-g.json', out), JSON.stringify({ track: 'G', task: 'Each item gives a public decision (source) and a passage of it (record), as published or with one sentence changed. Report whether the record has a serious problem (serious) and which sentences (flagged_sentences). Scored like track F.', items }, null, 1));
writeFileSync(new URL('track-g.key.json', out), JSON.stringify(key, null, 1));
console.log(`${pos} decisions, ${items.length} items`);

#!/usr/bin/env node
// Builds Track E (figures) from public EEOC appellate decisions.
// Usage: node build-track-e.mjs <folder of EEOC decision PDFs named YYYY_MM_DD_<number>.pdf> [exclude-numbers.txt]
// Deterministic: files in name order, the first 40 decisions that qualify.
// For each decision: a passage of the decision (3 to 5 consecutive sentences
// around a sentence giving an amount, percentage or duration), in three forms:
//   intact      the passage as published
//   rewritten   the same passage with the figure written another way (30 -> thirty,
//               $5,000 -> 5,000 dollars, 45% -> 45 percent): same value
//   altered     the figure changed. In half the items (odd positions) the new value
//               is another figure of the same kind from elsewhere in the same
//               decision, where one exists (two figures confused), otherwise a new value.
// Built by the developer, who also built Decision Spellcheck; stated in README.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { pdfToText } from '../../lib/ds-n1/pdf.mjs';
import { sentences } from '../../lib/ds-n1/text.mjs';
import { extractFigures } from '../../lib/ds-n1/assess.mjs';

const [dir, excl] = process.argv.slice(2);
const exclude = new Set(excl ? readFileSync(excl, 'utf8').split(/\s+/).filter(Boolean) : []);
const WORD = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 12: 'twelve', 14: 'fourteen', 15: 'fifteen', 20: 'twenty', 30: 'thirty', 45: 'forty-five', 60: 'sixty', 90: 'ninety' };
const KIND = /^(money:usd|percent|day|week|month|hour|year)$/;
const fmt = (n, like) => (/,/.test(like) ? n.toLocaleString('en-US') : String(n));
function rewrite(raw, f) {
  if (f.unit === 'money:usd') { const m = raw.match(/^\$\s?([\d,]+(?:\.\d+)?)$/); return m ? `${m[1]} dollars` : null; }
  if (f.unit === 'percent') { const m = raw.match(/^(\d+(?:\.\d+)?)\s?%$/); return m ? `${m[1]} percent` : null; }
  if (/^\d+$/.test(raw)) return WORD[f.value] || null;
  const back = Object.entries(WORD).find(([, w]) => w === raw.toLowerCase()); return back ? back[0] : null;
}
function changed(raw, f, others, confuse) {
  const pool = others.filter((o) => o.unit === f.unit && o.value !== f.value && o.value > 0);
  let v = confuse && pool.length ? pool[0].value : null;
  if (v === null) v = f.unit === 'percent' ? (f.value + 15 <= 100 ? f.value + 15 : f.value - 15) : f.unit === 'money:usd' ? f.value * 3 : f.value * 2;
  v = Math.round(v * 100) / 100;
  const num = raw.replace(/[^\d.,]/g, '');
  if (!num) { const w = WORD[v]; return w ? raw.replace(/^\w+/, (x) => (x[0] === x[0].toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w)) : raw.replace(/^\w+/, String(v)); }
  return { text: raw.replace(num, fmt(v, num)), value: v, from_elsewhere: confuse && pool.length > 0 };
}
const items = [], key = {};
const files = readdirSync(dir).filter((f) => f.endsWith('.pdf')).sort();
let pos = 0;
for (const file of files) {
  if (items.length >= 120) break;
  const no = file.replace(/^\d{4}_\d{2}_\d{2}_/, '').replace('.pdf', '');
  if (exclude.has(no)) continue;
  let src; try { src = pdfToText(readFileSync(`${dir}/${file}`), inflateSync).replace(/[ \t]+/g, ' '); } catch { continue; }
  if (src.length < 4000) continue;
  const sents = sentences(src).filter((s) => s.text.split(/\s+/).length >= 6 && !/^\s*(See|Id\.|ROI)/.test(s.text));
  const all = extractFigures(src);
  let pick = null;
  for (let i = 1; i < sents.length - 1 && !pick; i++) {
    const t = sents[i].text; if (t.split(/\s+/).length < 12 || t.includes('\n\n')) continue;
    for (const f of extractFigures(t)) {
      if (!KIND.test(f.unit)) continue;
      // the raw figure as written in the sentence
      const rawM = f.unit === 'money:usd' ? t.match(/\$\s?[\d,]+(?:\.\d+)?/) : f.unit === 'percent' ? t.match(/\d+(?:\.\d+)?\s?%/) : t.match(new RegExp(`\\b(${f.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i'));
      if (!rawM) continue;
      const raw = rawM[0]; if (t.indexOf(raw) !== t.lastIndexOf(raw)) continue;
      const rw = rewrite(raw, f); if (!rw) continue;
      const ch = changed(raw, f, all, pos % 2 === 1); if (typeof ch === 'string' || !ch.text || ch.text === raw) continue;
      pick = { i, raw, rw, ch, f };
      break;
    }
  }
  if (!pick) continue;
  const from = Math.max(0, pick.i - 2), to = Math.min(sents.length, pick.i + 3);
  const passage = sents.slice(from, to).map((s) => s.text.replace(/\s*\n\s*/g, ' ').trim()).join(' ');
  const target = sents[pick.i].text.replace(/\s*\n\s*/g, ' ').trim();
  const mk = (r) => passage.replace(target, target.replace(pick.raw, r));
  const id = `E-${String(pos + 1).padStart(2, '0')}`;
  const url = `https://www.eeoc.gov/sites/default/files/decisions/${file.slice(0, 10)}/${no}.pdf`;
  items.push({ id: `${id}-intact`, source: src, record: passage, source_url: url });
  items.push({ id: `${id}-rewritten`, source: src, record: mk(pick.rw), source_url: url });
  items.push({ id: `${id}-altered`, source: src, record: mk(pick.ch.text), source_url: url });
  key[`${id}-intact`] = { altered: false };
  key[`${id}-rewritten`] = { altered: false, written_as: pick.rw, source_figure: pick.raw };
  key[`${id}-altered`] = { altered: true, source_figure: pick.raw, record_figure: pick.ch.text, from_elsewhere_in_source: pick.ch.from_elsewhere };
  pos++;
}
const out = new URL('./data/', import.meta.url);
writeFileSync(new URL('track-e.json', out), JSON.stringify({ track: 'E', task: 'Each item gives a public decision (source) and a passage (record). Report whether the record changes an amount, percentage or duration that the source gives, and which figure in the record is wrong. A figure written another way with the same value is not a change.', items }, null, 1));
writeFileSync(new URL('track-e.key.json', out), JSON.stringify(key, null, 1));
console.log(`${pos} decisions, ${items.length} items, ${Object.values(key).filter((k) => k.from_elsewhere_in_source).length} altered with a figure from elsewhere in the same decision`);

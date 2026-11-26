#!/usr/bin/env node
// Build what a practitioner receives for a blind review: a printable one-page
// HTML packet and a plain-text version for pasting into a message. It shows the
// record and its supporting documents only: no DS-N1 output, no answer key, no
// hint of how many gaps exist.
// Usage: node tests/ds-n1/practitioner/build-review-packet.mjs record.json out-dir
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as e } from '../../../lib/ds-n1/text.mjs';

const [recPath, outDir] = process.argv.slice(2);
if (!recPath || !outDir) { console.error('Usage: build-review-packet.mjs record.json out-dir'); process.exit(2); }
const r = JSON.parse(readFileSync(recPath, 'utf8'));
if (r.data_classification !== 'constructed_fictional') { console.error('Only constructed fictional records may be sent for review.'); process.exit(1); }
mkdirSync(outDir, { recursive: true });
const base = join(outDir, `${r.record_id}.packet`);
if (existsSync(`${base}.html`) || existsSync(`${base}.txt`)) { console.error(`${base}.* exists; packets are never overwritten`); process.exit(1); }

const QUESTION = 'What can\'t you rebuild from this record? List anything a later reviewer could not trace, confirm or rely on.';
const NOTE = 'Everything here is fictional: the people, organisations, tools and documents are invented.';

const txt = [
  `Record ${r.record_id} (fictional)`, '',
  r.text, '',
  'Supporting documents:',
  ...r.sources.map((s) => `- ${s.title} (${s.version}): "${s.text}"`), '',
  QUESTION, '', NOTE, '',
].join('\n');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Review packet ${e(r.record_id)}</title>
<style>
body{font-family:Georgia,serif;max-width:42rem;margin:2rem auto;padding:0 1rem;color:#1a1a1a;background:#fff;line-height:1.55}
h1{font-size:1.3rem;margin-bottom:.2rem} .note{color:#555;font-size:.9rem}
.record{border-left:3px solid #7a5e28;padding:.4rem 1rem;margin:1rem 0;background:#faf8f3}
.doc{margin:.6rem 0} .doc b{display:block} .q{font-weight:bold;margin-top:1.5rem}
.answer{border:1px solid #bbb;min-height:12rem;margin-top:.5rem}
@media print{.answer{min-height:18rem}}
</style></head><body>
<h1>Record ${e(r.record_id)}</h1>
<p class="note">${e(NOTE)}</p>
<div class="record">${e(r.text)}</div>
<h2 style="font-size:1rem">Supporting documents</h2>
${r.sources.map((s) => `<div class="doc"><b>${e(s.title)} (${e(s.version)})</b>${e(s.text)}</div>`).join('\n')}
<p class="q">${e(QUESTION)}</p>
<div class="answer" aria-label="Your answer"></div>
</body></html>
`;
writeFileSync(`${base}.html`, html, { flag: 'wx' });
writeFileSync(`${base}.txt`, txt, { flag: 'wx' });
console.log(`${base}.html\n${base}.txt`);

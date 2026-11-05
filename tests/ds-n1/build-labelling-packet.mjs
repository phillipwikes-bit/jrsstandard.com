#!/usr/bin/env node
// Builds a BLINDED labelling packet so that a person other than the developer
// can label the DS-N1 constructed cases. The packet shows only the record and
// its sources. It shows no engine output, no developer label, no fixture ID and
// no mutation description. Case order is shuffled with a fixed, recorded seed.
//
// Outputs (tests/ds-n1/labelling/, excluded from deployment):
//   PACKET.html                 give to the labeller (no scripts, printable)
//   LABEL_SHEET_TEMPLATE.json   the labeller fills this in
//   KEY_DO_NOT_SHARE.json       maps packet codes to fixtures; keep from the labeller
// Run: node tests/ds-n1/build-labelling-packet.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { escapeHtml as e } from '../../lib/ds-n1/text.mjs';

const here = new URL('./', import.meta.url);
const out = new URL('./labelling/', here);
mkdirSync(out, { recursive: true });
const SEED = 'ds-n1-labelling-2026-11-03';

const cases = [];
const base = JSON.parse(readFileSync(new URL('fixtures/MANIFEST.json', here), 'utf8'));
for (const f of base.fixtures) {
  if (!/^(P0[1-5]|D(0[1-9]|1[0-4]))$/.test(f.id)) continue; // schema-invalid / out-of-scope cases need no human label
  cases.push({ set: 'base', id: f.id, path: `fixtures/${f.id}.json`, sha256: f.sha256 });
}
const stress = JSON.parse(readFileSync(new URL('fixtures/stress/MANIFEST.json', here), 'utf8'));
for (const f of stress.fixtures) cases.push({ set: 'stress', id: f.id, path: `fixtures/stress/${f.id}.json`, sha256: f.sha256 });

// Deterministic shuffle: order by SHA-256(seed + id).
const h = (s) => createHash('sha256').update(s).digest('hex');
cases.sort((a, b) => (h(SEED + a.set + a.id) < h(SEED + b.set + b.id) ? -1 : 1));
cases.forEach((c, i) => { c.code = `L-${String(i + 1).padStart(2, '0')}`; });

const html = [];
html.push('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Record Labelling Packet</title>');
html.push('<style>body{font:15px/1.55 Georgia,serif;max-width:820px;margin:2rem auto;padding:0 16px;color:#111;background:#fff}h1{font-size:1.4rem}h2{font-size:1.15rem;border-top:2px solid #333;padding-top:.8rem;margin-top:2.2rem;page-break-before:always}h3{font-size:1rem;margin-bottom:.2rem}.src{border-left:3px solid #999;padding-left:.7rem;margin:.4rem 0}.meta{font:12px monospace;color:#444}table{border-collapse:collapse;width:100%;font-size:.9rem}td,th{border:1px solid #999;padding:.3rem;text-align:left;vertical-align:top}.box{border:1px solid #333;padding:.7rem .9rem}</style></head><body>');
html.push(`<h1>Record labelling packet</h1><div class="box"><p><strong>All records, names, organisations and documents in this packet are fictional.</strong> They were constructed for testing a documentation-review tool. Please do not search for them.</p>
<p>For each case, read the record and its sources as a careful reviewer would before the record is finalised. Then, in the label sheet, give:</p>
<ol><li><strong>status</strong>: one of <code>READY</code> (nothing needs fixing before a human finalises it), <code>REVIEW_REQUIRED</code> (something should be fixed or noted, but nothing material is unsupported or contradicted), <code>HOLD</code> (a material statement is unsupported, contradicted, attributed to the wrong person or wrongly dated), or <code>INCOMPLETE</code> (the case cannot be reviewed as given).</li>
<li><strong>claims</strong>: for each listed claim, <code>supported</code>, <code>not_supported</code> or <code>contradicted</code> by its cited sources.</li>
<li><strong>note</strong>: a short reason for anything other than READY.</li></ol>
<p>Judge only from what is on the page. Whether evidence is <em>sufficient</em> is your judgment; there is no answer key in this packet. Please work independently and do not consult the developer.</p>
<p class="meta">Packet ${e(SEED)} · ${cases.length} cases · order shuffled</p></div>`);
for (const c of cases) {
  const r = JSON.parse(readFileSync(new URL(c.path, here), 'utf8'));
  html.push(`<h2>Case ${e(c.code)}</h2><p class="meta">Record type: supplier access exception (fictional)</p><h3>Record</h3><p>${e(r.text.normalize('NFC'))}</p>`);
  html.push('<h3>Claims under review</h3><table><thead><tr><th>Claim</th><th>Statement</th><th>Cited source and passage</th><th>Stated reasoning</th></tr></thead><tbody>');
  for (const cl of r.claims) {
    html.push(`<tr><td>${e(cl.claim_id)}</td><td>${e(cl.quote.normalize('NFC'))}</td><td>${cl.citations.length ? cl.citations.map((x) => `${e(x.source_id)}: &ldquo;${e(x.quote.normalize('NFC'))}&rdquo;`).join('<br>') : 'none'}</td><td>${cl.reasoning ? e(cl.reasoning) : ''}</td></tr>`);
  }
  html.push('</tbody></table><h3>Sources</h3>');
  for (const s of r.sources) {
    html.push(`<div class="src"><p><strong>${e(s.source_id)}: ${e(s.title)}</strong> <span class="meta">version ${e(s.version)}</span></p><p>${e(s.text.normalize('NFC'))}</p>`);
    if (s.events && s.events.length) html.push(`<p class="meta">Dated events recorded in this document: ${s.events.map((x) => `${e(x.role.replace(/_/g, ' '))} ${e(x.date)}`).join('; ')}</p>`);
    html.push('</div>');
  }
}
html.push('</body></html>\n');
writeFileSync(new URL('PACKET.html', out), html.join('\n'));

const sheet = {
  sheet_schema: 'ds-n1.label-sheet/1.0', packet: SEED,
  labeller: { name: '', role: '', relationship_to_developer: 'independent | owner | other (state)', date_completed: '' },
  attestation: 'I labelled these cases independently, without seeing developer labels or tool output.',
  cases: Object.fromEntries(cases.map((c) => {
    const r = JSON.parse(readFileSync(new URL(c.path, here), 'utf8'));
    return [c.code, { status: '', claims: Object.fromEntries(r.claims.map((cl) => [cl.claim_id, ''])), note: '' }];
  })),
};
writeFileSync(new URL('LABEL_SHEET_TEMPLATE.json', out), JSON.stringify(sheet, null, 2) + '\n');
const key = { warning: 'DO NOT SHARE WITH THE LABELLER. Maps packet codes to fixtures.', packet: SEED, cases: cases.map(({ code, set, id, sha256 }) => ({ code, set, id, fixture_sha256: sha256 })) };
writeFileSync(new URL('KEY_DO_NOT_SHARE.json', out), JSON.stringify(key, null, 2) + '\n');
console.log(`packet: ${cases.length} cases; PACKET.html sha256 ${h(html.join('\n'))}`);

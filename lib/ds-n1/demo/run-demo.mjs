// Decision Spellcheck demo: plain-text documents in, a full review out.
// Usage: node lib/ds-n1/demo/run-demo.mjs <folder> [--at 2026-11-24T00:00:00Z]
// Runs entirely on this computer; nothing is sent anywhere.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { extractRecord } from '../extract.mjs';
import { openReview, deriveState, buildReport, renderReportHtml } from '../index.mjs';
import { runDetectionTemplates } from '../detection-templates.mjs';

function parseDoc(raw) {
  const [head, ...rest] = raw.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const meta = {};
  for (const line of head.split('\n')) { const m = /^(\w+):\s*(.*)$/.exec(line.trim()); if (m) meta[m[1].toLowerCase()] = m[2].trim(); }
  return { meta, text: rest.join('\n\n').trim() };
}

export function loadCase(folder) {
  const files = readdirSync(folder).filter((f) => f.endsWith('.txt')).sort();
  if (!files.includes('record.txt')) throw new Error('folder must contain record.txt');
  const rec = parseDoc(readFileSync(join(folder, 'record.txt'), 'utf8'));
  const sources = files.filter((f) => f !== 'record.txt').map((f) => {
    const d = parseDoc(readFileSync(join(folder, f), 'utf8'));
    return { title: d.meta.title || f, version: d.meta.version || 'v1', text: d.text };
  });
  return { record_id: (rec.meta.title || 'DEMO').match(/[A-Z]+-\d+/)?.[0] || 'DEMO-1', title: rec.meta.title || 'Demo record',
    record_class: rec.meta.class || 'supplier_access_exception', text: rec.text, sources };
}

export function runDemo(folder, at = '2026-11-24T00:00:00Z') {
  const { record, report, validation } = extractRecord(loadCase(folder));
  if (validation.errors && validation.errors.length) return { refused: validation };
  const session = openReview(record, { at });
  const state = deriveState(session);
  const advisories = runDetectionTemplates(state);
  const review = buildReport(session, { generated_at: at });
  return { record, extraction: report, state, advisories, review };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const folder = resolve(process.argv[2] || new URL('./case-harbourline', import.meta.url).pathname);
  const atIdx = process.argv.indexOf('--at');
  const out = runDemo(folder, atIdx > 0 ? process.argv[atIdx + 1] : undefined);
  if (out.refused) { console.log('Refused before review:', out.refused.errors.map((e) => e.detail).join('; ')); process.exit(2); }
  const dir = join(folder, 'out'); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'record.json'), JSON.stringify(out.record, null, 2) + '\n');
  writeFileSync(join(dir, 'extraction-report.json'), JSON.stringify(out.extraction, null, 2) + '\n');
  writeFileSync(join(dir, 'review.html'), renderReportHtml(out.review));
  const s = out.extraction.summary;
  console.log(`Extracted ${s.claims} claims from the record; ${s.cited} linked to a source passage (${s.explicit_citations} named in the record itself).`);
  console.log(`${s.to_confirm} claim(s) have an inferred field a reviewer should confirm.`);
  console.log(`Review status: ${out.state.status}`);
  for (const f of out.state.findings) console.log(`  [${f.severity}] ${f.claim_id || 'record'}: ${f.explanation}`);
  for (const h of out.advisories) console.log(`  [advisory] ${h.claim_id || 'record'}: ${h.template}${h.detail ? ' (' + h.detail + ')' : ''}`);
  console.log(`Files written to ${dir}`);
}

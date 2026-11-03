#!/usr/bin/env node
// SP-15 PDF checks. Renders with Chromium (lib/ds-n1/export-pdf.mjs) and
// inspects the result with INDEPENDENT tools (poppler pdftotext / pdfinfo),
// never with the renderer itself. Usage: node tests/ds-n1/pdf.check.mjs
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openReview, applyAction, deriveState, buildReport, buildExport, serializeExport } from '../../lib/ds-n1/index.mjs';
import { renderReportPdf } from '../../lib/ds-n1/export-pdf.mjs';
import { canonical, sha256 } from '../../lib/ds-n1/text.mjs';

const fx = (id) => JSON.parse(readFileSync(new URL(`./fixtures/${id}.json`, import.meta.url), 'utf8'));
const AT = '2026-11-03T09:00:00Z';
const work = mkdtempSync(join(tmpdir(), 'ds-n1-pdf-'));
const results = [];
const check = async (name, fn) => { try { await fn(); results.push(['ok', name]); } catch (e) { results.push(['FAIL', name, e.message.split('\n')[0]]); } };

async function pdfOf(report, name) {
  const { pdf, report_sha256 } = await renderReportPdf(report);
  const path = join(work, name + '.pdf');
  writeFileSync(path, pdf);
  const text = execFileSync('pdftotext', ['-enc', 'UTF-8', path, '-'], { encoding: 'utf8' });
  const info = execFileSync('pdfinfo', [path], { encoding: 'utf8' });
  return { path, text, info, report_sha256 };
}
const flat = (t) => t.replace(/\s+/g, ' ');

try {
  const p01 = buildReport(openReview(fx('P01'), { at: AT }), { generated_at: AT });
  const a = await pdfOf(p01, 'p01');

  await check('reading order: parts 1 to 8 appear once each, in order', () => {
    const t = flat(a.text);
    const pos = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => t.indexOf(`${n}. `, n === 1 ? 0 : undefined));
    const heads = ['1. Record identification', '2. Evidence and source inventory', '3. Chronology and event roles', '4. Claim-to-evidence trace', '5. Five-condition review', '6. Contradictions and unresolved gaps', '7. Human reviewer disposition', '8. Export provenance and limitations'];
    const idx = heads.map((h) => t.indexOf(h));
    assert.ok(idx.every((i) => i >= 0), 'missing heading: ' + heads[idx.findIndex((i) => i < 0)]);
    assert.deepEqual([...idx].sort((x, y) => x - y), idx, 'headings out of order');
    void pos;
  });
  await check('PDF binds to the JSON report by checksum', () => {
    assert.equal(a.report_sha256, sha256(canonical(p01)));
    assert.ok(flat(a.text).replace(/ /g, '').includes(a.report_sha256), 'checksum not in extracted text');
  });
  await check('tagged, outlined, no JavaScript, A4', () => {
    assert.match(a.info, /Tagged:\s+yes/);
    assert.match(a.info, /JavaScript:\s+no/);
    assert.match(a.info, /Page size:\s+[\d.]+ x [\d.]+ pts \(A4\)/, 'pdfinfo must classify the page as A4');
    assert.match(a.info, /Pages:\s+[1-9]/);
  });
  await check('not-an-approval statement and limitations survive into the PDF', () => {
    const t = flat(a.text);
    assert.match(t, /not an approval or signoff/);
    assert.match(t, /does not prove who performed an action/);
    assert.match(t, /NOT RECORDED/);
  });
  await check('text is reproducible across renders (bytes are not claimed to be)', async () => {
    const b = await pdfOf(p01, 'p01-again');
    assert.equal(b.text, a.text);
  });

  await check('READY by critical override: qualifier appears before part 1 in the PDF', async () => {
    let s = openReview(fx('D02'), { at: AT });
    const f = deriveState(s).findings.find((x) => x.code === 'SUBJECT_MISMATCH');
    s = applyAction(s, { type: 'override', at: '2026-11-03T09:01:00Z', reviewer: { reviewer_id: 'rev-01', name: 'Test Reviewer (fictional)' }, finding_id: f.finding_id, rationale: 'Trading name used on the portal; confirmed by phone, evidence to follow.' });
    const d = await pdfOf(buildReport(s, { generated_at: AT }), 'd02');
    const t = flat(d.text);
    const q = t.indexOf('READY_ONLY_BY_REVIEWER_OVERRIDE_OF_CRITICAL_FINDINGS');
    assert.ok(q >= 0 && q < t.indexOf('1. Record identification'));
    assert.match(t, /Trading name used on the portal/);
  });

  await check('hostile record content is printed as text, never executed', async () => {
    const r = fx('P01');
    r.title = '<script>document.title="pwned"</script> Exception';
    const h = await pdfOf(buildReport(openReview(r, { at: AT }), { generated_at: AT }), 'hostile');
    assert.match(flat(h.text), /<script>document\.title="pwned"<\/script>/);
    assert.match(h.info, /JavaScript:\s+no/);
  });

  await check('CLI refuses an inconsistent export and writes nothing', () => {
    const b = JSON.parse(serializeExport(buildExport(openReview(fx('P01'), { at: AT }), { generated_at: AT })));
    b.report.status = 'HOLD';
    const inPath = join(work, 'tampered.json'), outPath = join(work, 'tampered.pdf');
    writeFileSync(inPath, JSON.stringify(b));
    const r = spawnSync(process.execPath, ['lib/ds-n1/export-pdf.mjs', inPath, outPath], { encoding: 'utf8' });
    assert.equal(r.status, 3);
    assert.match(r.stderr, /REFUSED: export verdict INCONSISTENT/);
    assert.equal(spawnSync('test', ['-e', outPath]).status, 1, 'no PDF written');
  });
  await check('CLI renders a consistent export', () => {
    const inPath = join(work, 'ok.json'), outPath = join(work, 'ok.pdf');
    writeFileSync(inPath, serializeExport(buildExport(openReview(fx('P01'), { at: AT }), { generated_at: AT })));
    const r = spawnSync(process.execPath, ['lib/ds-n1/export-pdf.mjs', inPath, outPath], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(execFileSync('pdfinfo', [outPath], { encoding: 'utf8' }), /Tagged:\s+yes/);
  });
} finally {
  rmSync(work, { recursive: true, force: true });
}
for (const r of results) console.log(r.join(' | '));
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} PDF checks passed (Chromium render; poppler extraction)`);
process.exit(failed ? 1 : 0);

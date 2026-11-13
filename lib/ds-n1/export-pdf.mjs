#!/usr/bin/env node
// SP-15 PDF rendering of a DS-N1 report. LOCAL TOOLING: requires the
// pre-installed Chromium/Playwright, so it is deliberately NOT exported from
// index.mjs and the zero-dependency core never imports it.
//
// The PDF is a rendering of the HTML report, which prints the SHA-256 of the
// canonical JSON report. PDF bytes are not reproducible (Chromium embeds a
// creation date); the extractable TEXT is the reproducible part, and the JSON
// report remains the record of authority.
//
// CLI: node lib/ds-n1/export-pdf.mjs <export.json> <out.pdf>
//      refuses any export the verifier does not find internally consistent.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { renderReportHtml } from './report.mjs';
import { verifyExport, VERDICT } from './verify.mjs';
import { canonical, sha256 } from './text.mjs';

export async function renderReportPdf(report) {
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const html = renderReportHtml(report);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, offline: true });
    const page = await context.newPage();
    await page.route('**/*', (r) => r.abort());
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4', margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
      printBackground: false, tagged: true, outline: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:8px;width:100%;text-align:center">DS-N1 decision record report · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    });
    return { pdf, report_sha256: sha256(canonical(report)), pdf_sha256: sha256Bytes(pdf) };
  } finally {
    await browser.close();
  }
}

function sha256Bytes(buf) {
  // Node is available wherever Playwright is; use node:crypto for bytes.
  return createRequire(import.meta.url)('node:crypto').createHash('sha256').update(buf).digest('hex');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [inPath, outPath] = process.argv.slice(2);
  if (!inPath || !outPath) { console.error('Usage: node lib/ds-n1/export-pdf.mjs <export.json> <out.pdf>'); process.exit(2); }
  const text = await readFile(resolve(inPath), 'utf8');
  const v = verifyExport(text);
  if (v.verdict !== VERDICT.CONSISTENT) { console.error(`REFUSED: export verdict ${v.verdict}. ${v.meaning}`); process.exit(3); }
  const { pdf, report_sha256, pdf_sha256 } = await renderReportPdf(JSON.parse(text).report);
  await writeFile(resolve(outPath), pdf);
  console.log(JSON.stringify({ written: outPath, report_sha256, pdf_sha256, note: 'PDF bytes are not reproducible; compare extracted text and report_sha256.' }));
}

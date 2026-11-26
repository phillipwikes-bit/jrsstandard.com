import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { pdfToText, PdfError } from '../../lib/ds-n1/pdf.mjs';
import { simplePdf, type0Pdf } from './fixtures-pdf/make-pdf.mjs';
const inflate = (d) => inflateSync(d);

test('PDF: a simple-font PDF gives its text, joining kerned pieces of a word and keeping lines', () => {
  assert.equal(pdfToText(simplePdf(), inflate), 'Harbourline approved the exception.\nIt was granted on 2026-03-02.');
});
test('PDF: a two-byte font is read through its ToUnicode map', () => {
  assert.equal(pdfToText(type0Pdf(), inflate), 'Quillon review');
});
test('PDF: the same bytes always give the same text', () => {
  assert.equal(pdfToText(simplePdf(), inflate), pdfToText(simplePdf(), inflate));
});
test('PDF: not a PDF, an encrypted PDF and a PDF with no text are refused with a reason', () => {
  assert.throws(() => pdfToText(Buffer.from('hello'), inflate), PdfError);
  assert.throws(() => pdfToText(Buffer.from('%PDF-1.7\n1 0 obj\n<< /Encrypt 2 0 R >>\nendobj\n'), inflate), /encrypted/);
  assert.throws(() => pdfToText(Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n'), inflate), /No text layer/);
});
test('PDF: the reader imports nothing (runs offline in the browser and Node)', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../../lib/ds-n1/pdf.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /^\s*import\s/m);
});

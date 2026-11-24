// Word (.docx) reading: three files from three different producers
// (LibreOffice, pandoc, python-docx), plus damaged and non-Word input.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { docxToText, documentXmlToText, DocxError } from '../../lib/ds-n1/docx.mjs';
import { loadCase } from '../../lib/ds-n1/demo/run-demo.mjs';

const fx = (f) => readFileSync(new URL(`./fixtures-docx/${f}`, import.meta.url));
const demo = loadCase(new URL('../../lib/ds-n1/demo/case-harbourline/', import.meta.url).pathname);

test('LibreOffice and pandoc files give exactly the plain-text demo text', async () => {
  assert.equal(await docxToText(fx('harbourline-record.libreoffice.docx'), inflateRawSync), demo.text);
  const src = demo.sources.find((s) => s.title.startsWith('Supplier security assessment'));
  assert.equal(await docxToText(fx('harbourline-assessment.pandoc.docx'), inflateRawSync), src.text);
});

test('python-docx file: entities, tabs and table cells are read; empty paragraphs dropped', async () => {
  assert.equal(await docxToText(fx('features.python-docx.docx'), inflateRawSync),
    'Findings & next steps for "Q3" <draft>.\n\nOwner: Ines Calloway\n\nControl\n\nSession logging is recommended.\n\nLast line.');
});

test('tracked deletions and text boxes are not read as body text', () => {
  const xml = '<w:body><w:p><w:r><w:t>Kept</w:t></w:r><w:del><w:r><w:delText>gone</w:delText><w:t>gone</w:t></w:r></w:del><w:r><w:t xml:space="preserve"> text</w:t></w:r></w:p>'
    + '<w:p><w:r><w:pict><w:txbxContent><w:p><w:r><w:t>box</w:t></w:r></w:p></w:txbxContent></w:pict></w:r></w:p></w:body>';
  assert.equal(documentXmlToText(xml), 'Kept text');
});

test('non-Word, PDF-like and damaged input are refused with a plain message', async () => {
  await assert.rejects(docxToText(new TextEncoder().encode('%PDF-1.7 not a docx'), inflateRawSync), DocxError);
  const bytes = new Uint8Array(fx('harbourline-record.libreoffice.docx'));
  const cut = bytes.slice(0, bytes.length - 200);
  await assert.rejects(docxToText(cut, inflateRawSync), DocxError);
});

test('the reader makes no network calls and uses no third-party package', () => {
  const src = readFileSync(new URL('../../lib/ds-n1/docx.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|WebSocket|^import /m);
});

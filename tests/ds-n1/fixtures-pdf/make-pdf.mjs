// Builds small constructed PDFs for the PDF reader tests (fictional text).
import { deflateSync } from 'node:zlib';
const enc = (s) => Buffer.from(s, 'latin1');
function assemble(objs) {
  const parts = [enc('%PDF-1.7\n')];
  objs.forEach(([dict, stream], i) => {
    parts.push(enc(`${i + 1} 0 obj\n${dict}`));
    if (stream) parts.push(enc(`\nstream\n`), stream, enc('\nendstream'));
    parts.push(enc('\nendobj\n'));
  });
  parts.push(enc('trailer\n<< /Root 1 0 R >>\n%%EOF\n'));
  return Buffer.concat(parts);
}
// A simple WinAnsi font; text split across Td moves inside a word and TJ kerning.
export function simplePdf() {
  const content = deflateSync(enc('BT /F1 12 Tf 72 700 Td (Harbourline ) Tj (approved the ) Tj [(ex) 10 (ception)] TJ (.) Tj 0 -14 Td (It was granted on 2026-03-02.) Tj ET'));
  const widths = Array.from({ length: 95 }, () => 500).join(' ');
  return assemble([
    ['<< /Type /Catalog /Pages 2 0 R >>'],
    ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>'],
    ['<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>'],
    [`<< /Length ${content.length} /Filter /FlateDecode >>`, content],
    [`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding /FirstChar 32 /LastChar 126 /Widths [${widths}] >>`],
  ]);
}
// A two-byte (Type0) font whose codes only make sense through its ToUnicode map.
export function type0Pdf() {
  const text = 'Quillon review';
  const codes = [...text].map((ch, i) => (i + 1).toString(16).padStart(4, '0')).join('');
  const cmap = deflateSync(enc(`/CIDInit /ProcSet findresource begin 12 dict begin begincmap\n1 begincodespacerange <0000> <FFFF> endcodespacerange\n${text.length} beginbfchar\n${[...text].map((ch, i) => `<${(i + 1).toString(16).padStart(4, '0')}> <${ch.charCodeAt(0).toString(16).padStart(4, '0')}>`).join('\n')}\nendbfchar\nendcmap\nend end`));
  const content = deflateSync(enc(`BT /F2 11 Tf 1 0 0 1 72 700 Tm <${codes}> Tj ET`));
  return assemble([
    ['<< /Type /Catalog /Pages 2 0 R >>'],
    ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>'],
    ['<< /Type /Page /Parent 2 0 R /Resources << /Font << /F2 5 0 R >> >> /Contents 4 0 R >>'],
    [`<< /Length ${content.length} /Filter /FlateDecode >>`, content],
    ['<< /Type /Font /Subtype /Type0 /BaseFont /Fict /Encoding /Identity-H /DescendantFonts [7 0 R] /ToUnicode 6 0 R >>'],
    [`<< /Length ${cmap.length} /Filter /FlateDecode >>`, cmap],
    ['<< /Type /Font /Subtype /CIDFontType2 /BaseFont /Fict /DW 500 >>'],
  ]);
}

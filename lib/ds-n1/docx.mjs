// Word (.docx) to plain text, with no third-party packages (2026-11-24).
// A .docx file is a ZIP archive; the body text is in word/document.xml. This
// reads the ZIP central directory, inflates that one entry with the caller's
// raw-deflate function (node:zlib in Node, DecompressionStream in a browser),
// and keeps paragraph text only. Tables become one paragraph per cell.
// Not read: headers, footers, footnotes, comments, tracked deletions, text in
// text boxes and images. PDF is not supported; convert it to text first.

export const DOCX_LIMITS = Object.freeze({ maxBytes: 20 * 1024 * 1024, maxXmlBytes: 10 * 1024 * 1024 });

export class DocxError extends Error {}

const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

function findEntry(bytes, name) {
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (u32(bytes, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new DocxError('Not a Word (.docx) file.');
  const count = u16(bytes, eocd + 10);
  let p = u32(bytes, eocd + 16);
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (p + 46 > bytes.length || u32(bytes, p) !== 0x02014b50) throw new DocxError('The file is damaged.');
    const method = u16(bytes, p + 10), csize = u32(bytes, p + 20), usize = u32(bytes, p + 24);
    const nlen = u16(bytes, p + 28), elen = u16(bytes, p + 30), clen = u16(bytes, p + 32), local = u32(bytes, p + 42);
    const entry = dec.decode(bytes.subarray(p + 46, p + 46 + nlen));
    if (entry === name) {
      if (u32(bytes, local) !== 0x04034b50) throw new DocxError('The file is damaged.');
      const start = local + 30 + u16(bytes, local + 26) + u16(bytes, local + 28);
      if (start + csize > bytes.length) throw new DocxError('The file is damaged.');
      if (usize > DOCX_LIMITS.maxXmlBytes) throw new DocxError('The document is too large.');
      return { method, data: bytes.subarray(start, start + csize), usize };
    }
    p += 46 + nlen + elen + clen;
  }
  throw new DocxError('Not a Word (.docx) file: no document body found.');
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unescape = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
  if (e[0] !== '#') return ENT[e.toLowerCase()];
  const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
  return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
});

export function documentXmlToText(xml) {
  const body = xml.replace(/<w:del\b[\s\S]*?<\/w:del>/g, '').replace(/<w:txbxContent\b[\s\S]*?<\/w:txbxContent>/g, '');
  const paras = [];
  for (const m of body.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>|<w:p\/>/g)) {
    let t = '';
    for (const r of m[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
      t += r[1] !== undefined ? unescape(r[1]) : (r[0] === '<w:tab/>' ? '\t' : '\n');
    }
    t = t.replace(/[ \t]+/g, ' ').trim();
    if (t) paras.push(t);
  }
  return paras.join('\n\n');
}

// inflateRaw: (Uint8Array) => Uint8Array | Promise<Uint8Array>
export async function docxToText(input, inflateRaw) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > DOCX_LIMITS.maxBytes) throw new DocxError('The file is too large.');
  const { method, data, usize } = findEntry(bytes, 'word/document.xml');
  let raw;
  if (method === 0) raw = data;
  else if (method === 8) raw = await inflateRaw(data);
  else throw new DocxError('Unsupported compression in this file.');
  if (raw.length !== usize) throw new DocxError('The file is damaged.');
  return documentXmlToText(new TextDecoder().decode(raw));
}

// Browser helper: raw inflate with the built-in DecompressionStream.
export async function browserInflateRaw(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

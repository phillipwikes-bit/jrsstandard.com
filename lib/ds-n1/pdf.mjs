// DS-N1 PDF reader (2026-11-25). Extracts the text of an ordinary, unencrypted
// PDF so a record or source can be checked without converting it first.
// No third-party code: the caller passes an `inflate(bytes) -> bytes` function
// for zlib (FlateDecode) streams (Node: zlib.inflateSync; browser:
// DecompressionStream('deflate')). Deterministic: same bytes, same text.
//
// Handles: classic and compressed object streams (ObjStm), FlateDecode content,
// fonts with ToUnicode maps (one- and two-byte codes), WinAnsi and standard
// encodings with Differences, Tj / TJ / ' / " text operators, line breaks from
// text positioning. Not handled (reported as an error, never guessed): encryption,
// scanned images (no text layer), filters other than FlateDecode on text.

const td = new TextDecoder('latin1');
const str = (b) => td.decode(b);

// WinAnsi (Windows-1252) differences from Latin-1 in 0x80-0x9F.
const WIN = { 0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x2c6, 0x89: 0x2030, 0x8a: 0x160, 0x8b: 0x2039, 0x8c: 0x152, 0x8e: 0x17d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x2dc, 0x99: 0x2122, 0x9a: 0x161, 0x9b: 0x203a, 0x9c: 0x153, 0x9e: 0x17e, 0x9f: 0x178 };
// Glyph names that appear in /Differences arrays, mapped to characters.
const GLYPH = { space: ' ', quoteright: '’', quoteleft: '‘', quotedblleft: '“', quotedblright: '”', endash: '–', emdash: '—', bullet: '•', hyphen: '-', period: '.', comma: ',', colon: ':', semicolon: ';', parenleft: '(', parenright: ')', fi: 'fi', fl: 'fl', section: '§', ellipsis: '…', quotesingle: "'", quotedbl: '"' };

export class PdfError extends Error {}

export function pdfToText(bytes, inflate) {
  if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
  if (str(bytes.subarray(0, 5)) !== '%PDF-') throw new PdfError('Not a PDF file.');
  const raw = str(bytes);
  if (/\/Encrypt\s/.test(raw)) throw new PdfError('This PDF is encrypted; save an unencrypted copy or paste its text.');
  const objs = new Map(); // id -> { dict: string, stream: Uint8Array|null }

  // 1. Every "N G obj ... endobj" in the file.
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(raw))) {
    const id = Number(m[1]);
    const start = m.index + m[0].length;
    const end = raw.indexOf('endobj', start);
    if (end < 0) break;
    const body = raw.slice(start, end);
    const si = body.search(/\bstream\r?\n/);
    if (si >= 0) {
      const dict = body.slice(0, si);
      const dataStart = start + si + body.slice(si).match(/^stream\r?\n/)[0].length;
      const lenM = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
      let dataEnd = lenM ? dataStart + Number(lenM[1]) : raw.lastIndexOf('endstream', end);
      if (dataEnd > end || dataEnd < dataStart) dataEnd = raw.lastIndexOf('endstream', end);
      objs.set(id, { dict, rawStream: bytes.subarray(dataStart, dataEnd) });
    } else objs.set(id, { dict: body, rawStream: null });
    re.lastIndex = end + 6;
  }
  const decode = (o) => {
    if (!o || !o.rawStream) return null;
    if (o.stream !== undefined) return o.stream;
    let data = o.rawStream;
    if (/\/FlateDecode/.test(o.dict)) {
      try { data = inflate(data); } catch { data = null; }
    } else if (/\/Filter/.test(o.dict)) data = null;
    o.stream = data;
    return data;
  };
  // 2. Objects stored inside compressed object streams.
  for (const [, o] of [...objs]) {
    if (!/\/Type\s*\/ObjStm/.test(o.dict)) continue;
    const data = decode(o); if (!data) continue;
    const n = Number((/\/N\s+(\d+)/.exec(o.dict) || [])[1] || 0);
    const first = Number((/\/First\s+(\d+)/.exec(o.dict) || [])[1] || 0);
    const s = str(data);
    const head = s.slice(0, first).trim().split(/\s+/).map(Number);
    for (let i = 0; i < n; i++) {
      const id = head[2 * i], off = head[2 * i + 1];
      const next = i + 1 < n ? head[2 * i + 3] : s.length - first;
      if (!objs.has(id)) objs.set(id, { dict: s.slice(first + off, first + next), rawStream: null });
    }
  }
  const get = (ref) => (ref == null ? null : objs.get(Number(ref)));
  const refOf = (dict, key) => { const r = new RegExp(`/${key}\\s+(\\d+)\\s+\\d+\\s+R`).exec(dict); return r ? Number(r[1]) : null; };
  const inlineDict = (dict, key) => {
    const at = dict.search(new RegExp(`/${key}\\s*<<`));
    if (at < 0) return null;
    let i = dict.indexOf('<<', at), depth = 0;
    for (let j = i; j < dict.length - 1; j++) {
      if (dict[j] === '<' && dict[j + 1] === '<') { depth++; j++; } else if (dict[j] === '>' && dict[j + 1] === '>') { depth--; j++; if (!depth) return dict.slice(i, j + 1); }
    }
    return null;
  };
  const dictOf = (dict, key) => inlineDict(dict, key) || (get(refOf(dict, key)) || {}).dict || null;

  // 3. Fonts: ToUnicode maps and simple encodings.
  const fontCache = new Map();
  function font(fid) {
    if (fontCache.has(fid)) return fontCache.get(fid);
    const fo = get(fid); const d = fo ? fo.dict : '';
    const f = { twoByte: /\/Subtype\s*\/Type0/.test(d), map: null, diff: {}, widths: new Map(), dw: 0 };
    // Glyph widths (1/1000 of the font size), used to find real gaps between words.
    const arr = (dd, key) => { const r = new RegExp(`/${key}\\s*(\\[[^\\]]*\\]|(\\d+)\\s+\\d+\\s+R)`).exec(dd); if (!r) return null; return r[2] ? ((get(Number(r[2])) || {}).dict || '').trim() : r[1]; };
    if (f.twoByte) {
      const dRef = /\/DescendantFonts\s*(?:\[\s*(\d+)\s+\d+\s+R|(\d+)\s+\d+\s+R)/.exec(d);
      let cd = dRef ? (get(Number(dRef[1] || dRef[2])) || {}).dict || '' : '';
      if (/^\s*\[/.test(cd)) { const r2 = /(\d+)\s+\d+\s+R/.exec(cd); cd = r2 ? (get(Number(r2[1])) || {}).dict || '' : ''; }
      f.dw = Number((/\/DW\s+(\d+)/.exec(cd) || [])[1] || 1000);
      const w = arr(cd, 'W');
      if (w) {
        const toks = w.replace(/^\[|\]$/g, '').match(/\[[^\]]*\]|[\d.]+/g) || [];
        for (let k = 0; k < toks.length;) {
          const c0 = Number(toks[k]);
          if (toks[k + 1] && toks[k + 1][0] === '[') { (toks[k + 1].slice(1, -1).trim().split(/\s+/).map(Number)).forEach((v, n) => f.widths.set(c0 + n, v)); k += 2; }
          else { const c1 = Number(toks[k + 1]), v = Number(toks[k + 2]); for (let c = c0; c <= c1 && c - c0 < 65536; c++) f.widths.set(c, v); k += 3; }
        }
      }
    } else {
      const fc = Number((/\/FirstChar\s+(\d+)/.exec(d) || [])[1] || 0);
      const w = arr(d, 'Widths');
      if (w) (w.replace(/[[\]]/g, ' ').trim().split(/\s+/).map(Number)).forEach((v, n) => f.widths.set(fc + n, v));
      f.dw = 500;
    }
    const tu = get(refOf(d, 'ToUnicode'));
    const cm = tu ? decode(tu) : null;
    if (cm) f.map = parseCMap(str(cm));
    const encRef = refOf(d, 'Encoding'); const enc = encRef ? (get(encRef) || {}).dict || '' : d;
    const dm = /\/Differences\s*\[([^\]]*)\]/.exec(enc);
    if (dm) { let code = 0; for (const t of dm[1].match(/\d+|\/[^\s/\]]+/g) || []) { if (/^\d/.test(t)) code = Number(t); else { const g = t.slice(1); f.diff[code++] = GLYPH[g] || (/^uni[0-9A-F]{4}$/.test(g) ? String.fromCharCode(parseInt(g.slice(3), 16)) : g.length === 1 ? g : ''); } } }
    fontCache.set(fid, f);
    return f;
  }
  function decodeText(bytesStr, f) {
    let out = '', width = 0;
    const wOf = (c) => (f ? (f.widths.has(c) ? f.widths.get(c) : f.dw || 500) : 500);
    if (f && f.twoByte) {
      for (let i = 0; i + 1 < bytesStr.length; i += 2) { const c = (bytesStr.charCodeAt(i) << 8) | bytesStr.charCodeAt(i + 1); out += (f.map && f.map.get(c)) ?? ''; width += wOf(c); }
      return { text: out, width };
    }
    for (let i = 0; i < bytesStr.length; i++) {
      const c = bytesStr.charCodeAt(i);
      if (f && f.map && f.map.has(c)) out += f.map.get(c);
      else if (f && f.diff[c] !== undefined) out += f.diff[c];
      else out += String.fromCharCode(WIN[c] || c);
      width += wOf(c);
    }
    return { text: out, width };
  }

  // 4. Pages in document order, via the page tree.
  const catalog = [...objs.values()].find((o) => /\/Type\s*\/Catalog/.test(o.dict));
  const pages = [];
  const walk = (id, inherited, depth) => {
    const o = get(id); if (!o || depth > 50) return;
    const res = dictOf(o.dict, 'Resources') || inherited;
    if (/\/Type\s*\/Pages/.test(o.dict)) {
      const kids = /\/Kids\s*\[([^\]]*)\]/.exec(o.dict);
      for (const k of (kids ? kids[1].match(/(\d+)\s+\d+\s+R/g) : []) || []) walk(Number(k.split(/\s+/)[0]), res, depth + 1);
    } else if (/\/Type\s*\/Page\b/.test(o.dict)) pages.push({ o, res });
  };
  if (catalog) walk(refOf(catalog.dict, 'Pages'), null, 0);
  if (!pages.length) for (const o of objs.values()) if (/\/Type\s*\/Page\b/.test(o.dict)) pages.push({ o, res: dictOf(o.dict, 'Resources') });

  // 5. Text of each page's content streams.
  const texts = [];
  for (const { o, res } of pages) {
    const fonts = {};
    const fd = res ? (inlineDict(res, 'Font') || (get(refOf(res, 'Font')) || {}).dict || '') : '';
    for (const fm of fd.matchAll(/\/([^\s/<>[\]()]+)\s+(\d+)\s+\d+\s+R/g)) fonts[fm[1]] = Number(fm[2]);
    const cref = /\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/.exec(o.dict);
    const ids = cref ? (cref[1].match(/(\d+)\s+\d+\s+R/g) || []).map((x) => Number(x.split(/\s+/)[0])) : [];
    let content = '';
    for (const id of ids) { const d = decode(get(id)); if (d) content += str(d) + '\n'; }
    texts.push(runContent(content, (name) => (fonts[name] != null ? font(fonts[name]) : null), decodeText));
  }
  const text = texts.join('\n\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!text) throw new PdfError('No text layer found (the PDF may be a scanned image). Paste its text instead.');
  return text;
}

function parseCMap(s) {
  const map = new Map();
  const hex = (h) => parseInt(h, 16);
  const uni = (h) => { let out = ''; for (let i = 0; i + 3 < h.length; i += 4) out += String.fromCharCode(hex(h.slice(i, i + 4))); return out; };
  for (const block of s.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) for (const p of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) map.set(hex(p[1]), uni(p[2]));
  for (const block of s.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const p of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<[0-9A-Fa-f]+>|\[[^\]]*\])/g)) {
      const a = hex(p[1]), b = hex(p[2]);
      if (p[3][0] === '<') { const base = hex(p[3].slice(1, -1)); for (let c = a; c <= b && c - a < 65536; c++) map.set(c, String.fromCharCode(base + (c - a))); }
      else { const list = [...p[3].matchAll(/<([0-9A-Fa-f]+)>/g)].map((x) => uni(x[1])); list.forEach((u, i) => map.set(a + i, u)); }
    }
  }
  return map;
}

// Interpret the text operators of a content stream, tracking where each piece
// of text starts and ends so spaces and line breaks follow real gaps.
function runContent(c, fontByName, decodeText) {
  let out = '', cur = null, fs = 10, i = 0;
  let lx = 0, ly = 0, x = 0, y = 0, endX = null, endY = null, scale = 1;
  const stack = [];
  const show = (s) => {
    const r = decodeText(s, cur);
    if (endX !== null) {
      const size = fs * scale || 10;
      if (Math.abs(y - endY) > 0.5 * size) { if (out && !out.endsWith('\n')) out += '\n'; }
      else if (x - endX > 0.18 * size && out && !/\s$/.test(out) && !/^\s/.test(r.text)) out += ' ';
    }
    out += r.text;
    x += (r.width / 1000) * fs * scale; endX = x; endY = y;
  };
  while (i < c.length) {
    const ch = c[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '%') { while (i < c.length && c[i] !== '\n' && c[i] !== '\r') i++; continue; }
    if (ch === '(') {
      let depth = 1, s = ''; i++;
      while (i < c.length && depth) {
        const d = c[i];
        if (d === '\\') {
          const n = c[i + 1];
          const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
          if (esc[n] !== undefined) { s += esc[n]; i += 2; }
          else if (/[0-7]/.test(n)) { let o = ''; let k = i + 1; while (k < c.length && o.length < 3 && /[0-7]/.test(c[k])) o += c[k++]; s += String.fromCharCode(parseInt(o, 8)); i = k; }
          else if (n === '\r' || n === '\n') { i += 2; if (n === '\r' && c[i] === '\n') i++; }
          else { s += n || ''; i += 2; }
          continue;
        }
        if (d === '(') depth++;
        if (d === ')') { depth--; if (!depth) { i++; break; } }
        s += d; i++;
      }
      stack.push({ s }); continue;
    }
    if (ch === '<' && c[i + 1] !== '<') {
      const e = c.indexOf('>', i); let h = c.slice(i + 1, e).replace(/\s+/g, ''); if (h.length % 2) h += '0';
      let s = ''; for (let k = 0; k < h.length; k += 2) s += String.fromCharCode(parseInt(h.slice(k, k + 2), 16));
      stack.push({ s }); i = e + 1; continue;
    }
    if (ch === '<' && c[i + 1] === '<') { const e = c.indexOf('>>', i); i = e < 0 ? c.length : e + 2; continue; }
    if (ch === '[') { stack.push({ mark: '[' }); i++; continue; }
    if (ch === ']') { const arr = []; while (stack.length && !stack[stack.length - 1].mark) arr.unshift(stack.pop()); stack.pop(); stack.push({ arr }); i++; continue; }
    if (ch === '/') { let j = i + 1; while (j < c.length && !/[\s/\[\]()<>{}%]/.test(c[j])) j++; stack.push({ name: c.slice(i + 1, j) }); i = j; continue; }
    let j = i; while (j < c.length && !/[\s/\[\]()<>{}%]/.test(c[j])) j++;
    const tok = c.slice(i, j) || c[i]; i = j > i ? j : i + 1;
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(tok)) { stack.push({ num: Number(tok) }); continue; }
    const n = (k) => { const v = stack[stack.length - k]; return v && v.num !== undefined ? v.num : 0; };
    switch (tok) {
      case 'BT': lx = x = 0; ly = y = 0; scale = 1; break;
      case 'Tf': { const name = stack[stack.length - 2]; cur = name && name.name ? fontByName(name.name) : null; fs = n(1) || fs; break; }
      case 'Td': case 'TD': lx += n(2) * scale; ly += n(1) * scale; x = lx; y = ly; break;
      case 'Tm': scale = Math.hypot(n(6), n(5)) || 1; lx = x = n(2); ly = y = n(1); break;
      case 'T*': ly -= fs * 1.2 * scale; x = lx; y = ly; break;
      case 'Tj': { const s = stack[stack.length - 1]; if (s && s.s !== undefined) show(s.s); break; }
      case "'": case '"': { ly -= fs * 1.2 * scale; x = lx; y = ly; const s = stack[stack.length - 1]; if (s && s.s !== undefined) show(s.s); break; }
      case 'TJ': { const a = stack[stack.length - 1]; if (a && a.arr) for (const v of a.arr) { if (v.s !== undefined) show(v.s); else if (v.num !== undefined) x -= (v.num / 1000) * fs * scale; } break; }
      case 'ET': break;
      default: break;
    }
    if (/^[A-Za-z'"*]+$/.test(tok)) stack.length = 0;
  }
  return out;
}

// Browser zlib inflate (async). Usage: pdfToText(bytes, await prepareBrowserInflate(bytes)) is not possible
// synchronously, so the browser collects and inflates every stream first.
export async function pdfToTextBrowser(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const raw = str(u8);
  const cache = new Map();
  const re = /\bstream\r?\n/g; let m;
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length; const end = raw.indexOf('endstream', start);
    if (end < 0) break;
    let data = u8.subarray(start, end);
    while (data.length && (data[data.length - 1] === 10 || data[data.length - 1] === 13)) data = data.subarray(0, data.length - 1);
    try {
      const ds = new DecompressionStream('deflate');
      const buf = await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer();
      cache.set(start, new Uint8Array(buf));
    } catch { /* not deflate */ }
    re.lastIndex = end;
  }
  return pdfToText(u8, (d) => {
    const key = d.byteOffset - u8.byteOffset;
    if (cache.has(key)) return cache.get(key);
    throw new Error('not inflated');
  });
}

// Text utilities. Offsets everywhere are Unicode CODE POINT offsets into the
// NFC-normalised text, so astral characters (emoji, some CJK) count as one.

export function nfc(s) { return String(s).normalize('NFC'); }

export function codePoints(s) { return Array.from(s); }

// Fold characters that commonly differ between a quote and its source without
// changing meaning: curly quotes, dashes, non-breaking and repeated whitespace,
// letter case. Returns the folded string plus a map from each folded index to
// the original code point index, so a match can be located in the original.
export function fold(s) {
  const cps = codePoints(nfc(s));
  const out = [];
  const map = [];
  let lastSpace = true;
  for (let i = 0; i < cps.length; i++) {
    let c = cps[i];
    if (/[‘’‚‛′]/u.test(c)) c = "'";
    else if (/[“”„‟″]/u.test(c)) c = '"';
    else if (/[‐-―−]/u.test(c)) c = '-';
    if (/\s/u.test(c)) {
      if (lastSpace) continue;
      out.push(' '); map.push(i); lastSpace = true; continue;
    }
    const lower = c.toLowerCase();
    for (const lc of codePoints(lower)) { out.push(lc); map.push(i); }
    lastSpace = false;
  }
  while (out.length && out[out.length - 1] === ' ') { out.pop(); map.pop(); }
  return { text: out.join(''), map, length: cps.length };
}

// Find every occurrence of `needle` in `hay` after folding. Returns code point
// offsets in the ORIGINAL (NFC) hay, end exclusive.
export function findAll(hay, needle) {
  const H = fold(hay);
  const N = fold(needle).text;
  if (!N) return [];
  const hits = [];
  const hcp = codePoints(H.text);
  const ncp = codePoints(N);
  // Linear search over code point arrays (inputs are bounded by LIMITS).
  outer: for (let i = 0; i + ncp.length <= hcp.length; i++) {
    for (let j = 0; j < ncp.length; j++) if (hcp[i + j] !== ncp[j]) continue outer;
    hits.push({ start: H.map[i], end: H.map[i + ncp.length - 1] + 1 });
  }
  return hits;
}

export function exactIndexOf(hay, needle) {
  const h = codePoints(nfc(hay));
  const n = codePoints(nfc(needle));
  if (!n.length) return -1;
  outer: for (let i = 0; i + n.length <= h.length; i++) {
    for (let j = 0; j < n.length; j++) if (h[i + j] !== n[j]) continue outer;
    return i;
  }
  return -1;
}

export function slice(s, start, end) { return codePoints(nfc(s)).slice(start, end).join(''); }

// Sentence segmentation with code point offsets. Deliberately simple and
// documented as a parser limitation: abbreviations such as "e.g." may split.
export function sentences(s) {
  const cps = codePoints(nfc(s));
  const out = [];
  let start = 0;
  const push = (end) => {
    let a = start, b = end;
    while (a < b && /\s/u.test(cps[a])) a++;
    while (b > a && /\s/u.test(cps[b - 1])) b--;
    if (b > a) out.push({ start: a, end: b, text: cps.slice(a, b).join('') });
  };
  for (let i = 0; i < cps.length; i++) {
    const c = cps[i];
    if (c === '\n' && cps[i + 1] === '\n') { push(i); start = i + 1; continue; }
    if (/[.!?]/u.test(c)) {
      const next = cps[i + 1];
      const prev = cps[i - 1] || '';
      // Do not split inside numbers or ISO dates (2026.10.01, 3.5).
      if (/\d/u.test(prev) && next && /\d/u.test(next)) continue;
      if (next === undefined || /\s/u.test(next)) { push(i + 1); start = i + 1; }
    }
  }
  push(cps.length);
  return out;
}

export function sentenceContaining(s, start, end) {
  for (const sent of sentences(s)) if (start >= sent.start && end <= sent.end) return sent;
  // Quote spans a boundary: widen to the union of the sentences it touches.
  const touched = sentences(s).filter((x) => x.end > start && x.start < end);
  if (!touched.length) return { start, end, text: slice(s, start, end) };
  const a = touched[0].start, b = touched[touched.length - 1].end;
  return { start: a, end: b, text: slice(s, a, b) };
}

const STOP = new Set(('a an and are as at be been by for from has have he her his i in is it its of on or '
  + 'that the their them they this to was were which who will with not no our we us after before '
  + 'did does do had would should could may might shall must than then there these those so such '
  + 'into over under per all any each also only same other its').split(' '));

export function contentWords(s) {
  const words = fold(s).text.match(/[\p{L}\p{N}]+/gu) || [];
  return [...new Set(words.filter((w) => w.length > 2 && !STOP.has(w)).map(stem))];
}

function stem(w) {
  if (/^\d/.test(w)) return w;
  for (const suf of ['ations', 'ation', 'ments', 'ment', 'ings', 'ing', 'ied', 'ies', 'ed', 'es', 's']) {
    if (w.length > suf.length + 3 && w.endsWith(suf)) return w.slice(0, -suf.length);
  }
  return w;
}

// Canonical JSON: sorted keys, no whitespace. Used for every digest.
export function canonical(v) {
  if (v === null || typeof v !== 'object') {
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('non-finite number in canonical JSON');
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}

// Synchronous SHA-256 (FIPS 180-4) over UTF-8, so the same module runs in Node
// and in a browser without async WebCrypto. Verified against node:crypto in tests.
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);

export function sha256(str) {
  const bytes = new TextEncoder().encode(String(str));
  const len = bytes.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const bitLen = len * 8;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 4, bitLen >>> 0);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64);
  const r = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = r(W[i - 15], 7) ^ r(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = r(W[i - 2], 17) ^ r(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, (x) => x.toString(16).padStart(8, '0')).join('');
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"'`]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]));
}

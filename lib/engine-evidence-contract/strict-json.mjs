// JRS EVIDENCE CONTRACT 0.2.0: strict, fail-closed JSON intake for candidate responses.
//
// The v1 parser took the first "{" to the last "}" anywhere in the text and
// handed it to JSON.parse, which silently keeps the LAST of any duplicated key.
// Both are lenient in ways that can turn a malformed or manipulated response
// into a favourable result. This intake:
//   - accepts a bare JSON object, or exactly one fenced block (```json ... ```)
//     and nothing else; the fence removal is recorded, never silent;
//   - rejects prose before or after the JSON;
//   - rejects duplicated keys at any depth instead of choosing one;
//   - rejects a top-level value that is not an object.
// It never repairs content.

export function parseCandidateResponse(text) {
  const notes = [];
  if (typeof text !== 'string') return { ok: false, reason: 'response_not_text', notes };
  let body = text.trim();
  if (body.startsWith('```')) {
    const m = /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/.exec(body);
    if (!m) return { ok: false, reason: 'markdown_wrapper_not_a_single_exact_fence', notes };
    body = m[1].trim();
    notes.push('markdown_fence_removed');
  }
  if (!body.startsWith('{') || !body.endsWith('}')) return { ok: false, reason: 'content_outside_json_object', notes };
  let value;
  try { value = new StrictParser(body).parseDocument(); }
  catch (e) { return { ok: false, reason: e.code || 'malformed_json', detail: String(e.message).slice(0, 120), notes }; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: 'top_level_not_object', notes };
  return { ok: true, value, notes };
}

class StrictParser {
  constructor(s) { this.s = s; this.i = 0; }
  fail(code, msg) { const e = new Error(msg + ' at ' + this.i); e.code = code; throw e; }
  ws() { while (this.i < this.s.length && ' \t\n\r'.includes(this.s[this.i])) this.i++; }
  parseDocument() { this.ws(); const v = this.value(); this.ws(); if (this.i !== this.s.length) this.fail('malformed_json', 'trailing content'); return v; }
  value() {
    this.ws();
    const c = this.s[this.i];
    if (c === '{') return this.object();
    if (c === '[') return this.array();
    if (c === '"') return this.string();
    if (c === '-' || (c >= '0' && c <= '9')) return this.number();
    for (const [lit, v] of [['true', true], ['false', false], ['null', null]]) {
      if (this.s.startsWith(lit, this.i)) { this.i += lit.length; return v; }
    }
    return this.fail('malformed_json', 'unexpected token');
  }
  object() {
    this.i++; const o = {}; const seen = new Set(); this.ws();
    if (this.s[this.i] === '}') { this.i++; return o; }
    for (;;) {
      this.ws(); if (this.s[this.i] !== '"') this.fail('malformed_json', 'expected key');
      const k = this.string();
      if (seen.has(k)) this.fail('duplicate_json_key', 'duplicate key ' + JSON.stringify(k).slice(0, 40));
      seen.add(k);
      this.ws(); if (this.s[this.i] !== ':') this.fail('malformed_json', 'expected colon'); this.i++;
      const v = this.value();
      Object.defineProperty(o, k, { value: v, enumerable: true, writable: true, configurable: true });
      this.ws();
      if (this.s[this.i] === ',') { this.i++; continue; }
      if (this.s[this.i] === '}') { this.i++; return o; }
      this.fail('malformed_json', 'expected comma or brace');
    }
  }
  array() {
    this.i++; const a = []; this.ws();
    if (this.s[this.i] === ']') { this.i++; return a; }
    for (;;) {
      a.push(this.value()); this.ws();
      if (this.s[this.i] === ',') { this.i++; continue; }
      if (this.s[this.i] === ']') { this.i++; return a; }
      this.fail('malformed_json', 'expected comma or bracket');
    }
  }
  string() {
    const m = /^"(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/.exec(this.s.slice(this.i));
    if (!m) this.fail('malformed_json', 'bad string');
    this.i += m[0].length;
    return JSON.parse(m[0]);
  }
  number() {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(this.s.slice(this.i));
    if (!m) this.fail('malformed_json', 'bad number');
    this.i += m[0].length;
    return Number(m[0]);
  }
}

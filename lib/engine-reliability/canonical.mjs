// JRS ENGINE RELIABILITY: canonical JSON and hashing.
//
// Keys are sorted at every depth; undefined values are dropped. A hash is
// computed over the canonical text only, so key order never changes it.

import { createHash } from 'node:crypto';

export function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map((x) => canonical(x === undefined ? null : x)).join(',') + ']';
  return '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
export const sha = (s) => 'sha256:' + createHash('sha256').update(String(s), 'utf8').digest('hex');
export const hashOf = (v) => sha(canonical(v));

export function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); }
  return o;
}

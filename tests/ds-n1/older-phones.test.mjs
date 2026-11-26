// Guard (2026-11-26): code that runs in the browser must load on older phones.
// Safari before iOS 16.4 cannot parse regular-expression lookbehind, and a page
// that uses it fails to load at all; Object.hasOwn needs iOS 15.4 and the
// "||=" shorthand iOS 14. Baseline kept: iOS 13.4 / Chrome 80.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const dir = new URL('../../lib/ds-n1/', import.meta.url);
const files = [...readdirSync(dir).filter((f) => f.endsWith('.mjs')).map((f) => new URL(f, dir)), ...readdirSync(new URL('ui/', dir)).filter((f) => f.endsWith('.mjs')).map((f) => new URL('ui/' + f, dir))];
const BANNED = [
  ['regular-expression lookbehind (iOS 16.4)', /\(\?<[!=]/],
  ['Object.hasOwn (iOS 15.4)', /Object\.hasOwn\(/],
  ['logical assignment ||= &&= ??= (iOS 14)', /(\|\||&&|\?\?)=/],
  ['Array.prototype.at / findLast / toSorted (iOS 15.4+)', /\.(at|findLast|findLastIndex|toSorted|toReversed)\(/],
  ['structuredClone (iOS 15.4)', /structuredClone\(/],
];
for (const [name, re] of BANNED) {
  test(`no ${name} in browser code`, () => {
    const hits = [];
    for (const f of files) readFileSync(f, 'utf8').split('\n').forEach((line, i) => { if (!/^\s*\/\//.test(line) && re.test(line)) hits.push(`${f.pathname.split('/lib/')[1]}:${i + 1}`); });
    assert.deepEqual(hits, []);
  });
}

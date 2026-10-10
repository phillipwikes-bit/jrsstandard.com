// Shared helpers for the frozen demonstration tests. FD_ROOT points the suite at a throwaway
// overlay during the mutation run; otherwise it is the repository. No network, no provider.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const REPO = new URL('../../', import.meta.url).pathname;
export const ROOT = process.env.FD_ROOT ? (process.env.FD_ROOT.endsWith('/') ? process.env.FD_ROOT : process.env.FD_ROOT + '/') : REPO;
export const IN_REPO = ROOT === REPO;
export const PKG = ROOT + 'tools/frozen-demo/';
export const read = (p) => readFileSync(join(ROOT, p), 'utf8');
export const exists = (p) => existsSync(join(ROOT, p));
export const json = (p) => JSON.parse(read(p));
export const IDS = ['FD-01', 'FD-02', 'FD-03', 'FD-04', 'FD-05'];
export const record = (id) => json('tools/frozen-demo/corpus/v0.1.0/' + id + '.json');
export const R = await import(PKG + 'lib/replay.js');
export const V = await import(PKG + 'lib/verify.js');
export const clone = (o) => JSON.parse(JSON.stringify(o));

let pass = 0, fail = 0, skip = 0;
export function t(name, ok, detail) { ok ? pass++ : fail++; console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (!ok && detail ? '\n      ' + detail : '')); }
export function skipped(name, why) { skip++; console.log('SKIPPED  ' + name + ' (' + why + ')'); }
export function done() { console.log(`\n${pass + fail} checks, ${fail} failed${skip ? ', ' + skip + ' skipped' : ''}`); process.exit(fail ? 1 : 0); }

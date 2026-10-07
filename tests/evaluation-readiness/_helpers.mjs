// Shared helpers for the evaluation-readiness tests. ER_ROOT points the suite at a throwaway overlay
// during the mutation run; otherwise it is the repository. No network, no provider, no record.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const REPO = new URL('../../', import.meta.url).pathname;
export const ROOT = process.env.ER_ROOT ? process.env.ER_ROOT.replace(/\/?$/, '/') : REPO;
export const IN_REPO = ROOT === REPO;
export const PKG = ROOT + 'tools/evaluation-readiness/';
export const read = (p) => readFileSync(join(ROOT, p), 'utf8');
export const exists = (p) => existsSync(join(ROOT, p));
export const json = (p) => JSON.parse(read(p));
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const M = {
  voc: await import(PKG + 'lib/vocabulary.js'), reg: await import(PKG + 'lib/registry.js'), intake: await import(PKG + 'lib/intake.js'), ws: await import(PKG + 'lib/workspace.js'),
  ledger: await import(PKG + 'lib/ledger.js'), scan: await import(PKG + 'lib/scan.js'), probes: await import(PKG + 'lib/probes.js'), verify: await import(PKG + 'lib/verify.js'),
};
export const has = (r, code, control) => Boolean(r && r.codes && r.codes.some((c) => c.code === code && (!control || c.control === control)));

let pass = 0, fail = 0;
export function t(name, ok, detail) { ok ? pass++ : fail++; console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (!ok && detail ? '\n      ' + detail : '')); }
export function done() { console.log(`\n${pass + fail} checks, ${fail} failed`); process.exit(fail ? 1 : 0); }

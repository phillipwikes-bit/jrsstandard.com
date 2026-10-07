// Shared helpers for the source-alignment tests. SA_ROOT points the suite at a throwaway overlay
// during the mutation run. The three October 3 files must be present in project_sources/.
import { readFileSync, existsSync, mkdtempSync, mkdirSync, readdirSync, symlinkSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

export const REPO = new URL('../../', import.meta.url).pathname;
export const ROOT = process.env.SA_ROOT ? process.env.SA_ROOT.replace(/\/?$/, '/') : REPO;
export const IN_REPO = ROOT === REPO;
export const PKG = ROOT + 'tools/source-alignment/';
export const read = (p) => readFileSync(join(ROOT, p), 'utf8');
export const exists = (p) => existsSync(join(ROOT, p));
export const json = (p) => JSON.parse(read(p));
export const M = { sources: await import(PKG + 'lib/sources.js'), controls: await import(PKG + 'lib/controls.js'), rec: await import(PKG + 'lib/reconciliation.js'), build: await import(PKG + 'lib/build.js'), verify: await import(PKG + 'lib/verify.js') };

// A throwaway overlay of `from`: the listed paths are copied, everything else is a symlink. The
// working tree is never modified.
export function overlay(copies, from = ROOT) {
  const base = mkdtempSync(join(tmpdir(), 'jrs-sa-overlay-'));
  const link = (rel) => {
    for (const name of readdirSync(join(from, rel))) {
      if (!rel && name === '.git') continue;
      const p = rel ? rel + '/' + name : name;
      if (copies.includes(p)) cpSync(join(from, p), join(base, p), { recursive: true, dereference: true });
      else if (copies.some((c) => c.startsWith(p + '/'))) { mkdirSync(join(base, p)); link(p); }
      else symlinkSync(join(from, p), join(base, p));
    }
  };
  link('');
  return base + '/';
}
export const edit = (base, p, fn) => { const f = join(base, p); writeFileSync(f, fn(readFileSync(f, 'utf8'))); };
export const create = (base, p, text) => { mkdirSync(dirname(join(base, p)), { recursive: true }); writeFileSync(join(base, p), text); };
export const drop = (base) => rmSync(base, { recursive: true, force: true });
export async function verifyIn(base) { const V = await import(join(base, 'tools/source-alignment/lib/verify.js') + '?' + Math.random()); return V.verifySourceAlignment({ root: base }); }
export const sections = (v) => [...new Set(v.problems.map((p) => p.split(':')[0]))];

let pass = 0, fail = 0;
export function t(name, ok, detail) { ok ? pass++ : fail++; console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (!ok && detail ? '\n      ' + detail : '')); }
export function done() { console.log(`\n${pass + fail} checks, ${fail} failed`); process.exit(fail ? 1 : 0); }

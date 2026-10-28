// Study completion (0.3.4 research candidate, 2026-10-28): shared helpers. Pure functions and file reads; no network,
// no credential, no environment value. Offline tools import ./guard.mjs before anything else; this module does not.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const DIR = join(HERE, '..');                                   // research/study-completion-0.3.4-2026-10-28
export const RESEARCH = join(DIR, '..');
export const ROOT = join(RESEARCH, '..');
export const STUDY = join(RESEARCH, 'study-156-2026-10-27');           // frozen study package (read only)
export const PKG4 = join(RESEARCH, 'engine-repair-0.3.4-2026-10-27');  // frozen 0.3.4 package (read only)
export const GATE = join(RESEARCH, 'validation-readiness-gate-v0-2026-10-25');
export const CANDIDATE = '0.3.4-research-candidate';
export const ENGINE_OF_RECORD = '0.3.1-candidate';
export const STATUS = Object.freeze({ release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN', candidate_adopted: false });

export const sha = (s) => createHash('sha256').update(s).digest('hex');
export const shaFile = (p) => sha(readFileSync(p));
export const canon = (v) => (v && typeof v === 'object' ? (Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}') : JSON.stringify(v));
export const canonSha = (v) => sha(canon(v));
export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
export const rel = (p) => relative(ROOT, p).split('\\').join('/');
export const ratio = (n, d) => (d ? Number((n / d).toFixed(4)) : null);
export const pct = (n, d) => (d ? (100 * n / d).toFixed(1) + '%' : 'n/a');

// Writes a generated output. Generated files are rewritten on every run (they are derived, never hand-edited);
// write-once applies to captures and the journal, not to these.
export function writeOut(path, text) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text.endsWith('\n') ? text : text + '\n'); return sha(text.endsWith('\n') ? text : text + '\n'); }
export const writeJson = (path, obj) => writeOut(path, JSON.stringify(obj, null, 2));

// Trailing whitespace only: a leading space is meaningful in `git status --porcelain` output.
export function git(args) { try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).replace(/\s+$/, ''); } catch { return null; } }

export function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).sort().flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listFiles(p, base) : [relative(base, p).split('\\').join('/')]; });
}

// A failing check list: every tool collects problems and exits 1 when any exist (fail closed).
export function checker() {
  const checks = [];
  return {
    checks,
    check(id, ok, detail) { checks.push({ id, ok: !!ok, detail: detail === undefined ? null : detail }); return !!ok; },
    failed() { return checks.filter((c) => !c.ok); },
  };
}
export function finish(label, c, extra = '') {
  const f = c.failed();
  console.log(label + ': ' + (c.checks.length - f.length) + ' of ' + c.checks.length + ' checks passed' + (extra ? '; ' + extra : ''));
  for (const x of f) console.log('  FAILED ' + x.id + (x.detail === null ? '' : ': ' + JSON.stringify(x.detail).slice(0, 300)));
  process.exitCode = f.length ? 1 : 0;
}

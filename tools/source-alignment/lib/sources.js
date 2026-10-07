// JRS source alignment: access to the controlling sources. INTERNAL. READS ONLY. FAILS CLOSED.
//
// The three 3 October sources are local, untracked files (project_sources/), on the owner's
// direction of 2026-10-07: the repository is public, so their bytes are never committed. This
// module verifies each against its integrity receipt and gives line access for locators. Nothing
// here writes, reaches a network or returns source text to a caller that would commit it: the
// only values that leave this module for committed outputs are hashes and line numbers.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const PACKAGE_DIR = new URL('../', import.meta.url).pathname;           // tools/source-alignment/
export const ROOT = join(PACKAGE_DIR, '../../');
export const RECEIPT = 'tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json';
export const sha256 = (b) => createHash('sha256').update(b).digest('hex');

export function loadReceipt(root = ROOT) { return JSON.parse(readFileSync(join(root, RECEIPT), 'utf8')); }

// Every source a control may cite: the three local October 3 files and the committed repository sources.
export function sourceIndex(root = ROOT) {
  const r = loadReceipt(root);
  const local = r.sources.map((s) => ({ source_id: s.source_id, path: s.original_workspace_path, sha256: s.sha256, bytes: s.bytes, lines: s.lines, local: true, controlling_lines: s.controlling_lines }));
  const repo = r.repository_sources.map((s) => ({ source_id: s.source_id, path: s.path, sha256: s.sha256, local: false }));
  return Object.fromEntries(local.concat(repo).map((s) => [s.source_id, s]));
}

// Status of every source: present, hash-matched, and its lines (kept in memory only).
export function openSources(root = ROOT) {
  const idx = sourceIndex(root), out = {};
  for (const [id, s] of Object.entries(idx)) {
    const p = join(root, s.path);
    if (!existsSync(p)) { out[id] = { ...s, present: false, ok: false, problem: 'absent' }; continue; }
    const buf = readFileSync(p);
    const actual = sha256(buf);
    const text = buf.toString('utf8');
    const lines = text.split('\n'); if (text.endsWith('\n')) lines.pop();
    const sizeOk = s.bytes === undefined || s.bytes === buf.length;
    const countOk = s.lines === undefined || s.lines === lines.length;
    out[id] = { ...s, present: true, actual_sha256: actual, ok: actual === s.sha256 && sizeOk && countOk,
                problem: actual !== s.sha256 ? 'hash differs' : !sizeOk ? 'size differs' : !countOk ? 'line count differs' : null, _lines: lines };
  }
  return out;
}

export function lineHash(src, n) {
  if (!src || !src.present || !src._lines || n < 1 || n > src._lines.length) return null;
  return sha256(Buffer.from(src._lines[n - 1], 'utf8'));
}
export function lineCount(src) { return src && src._lines ? src._lines.length : 0; }
// Normalised lines long enough to identify source text, for the leak check. Kept in memory only.
export function identifyingLines(src, min = 50) {
  return (src && src._lines ? src._lines : []).map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length >= min);
}

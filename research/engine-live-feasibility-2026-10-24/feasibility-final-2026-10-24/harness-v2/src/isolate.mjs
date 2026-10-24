// Isolated temporary copy of the frozen Engine code for replay.
// Replay never imports from the live worktree. The copy is verified against the
// Phase 7 candidate manifest (and, for its two dependency directories, against
// the worktree bytes) before use, re-verified after use, then deleted.

import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO = '/home/user/jrsstandard.com';
const DIRS = ['lib/engine-evidence-graph-v0.3.1-candidate', 'lib/engine-evidence-contract', 'lib/engine-assurance'];
const PROMPT = 'research/evidence-graph-compiler-2026-10-10/prompt-contract/PROMPT_v0.3.0.txt';
const PHASE7_MANIFEST = 'research/engine-governance-phase8-2026-10-19/registry/manifests/phase7-candidate.sha256';
export const PACKAGE_SHA256 = '815c5d5671d0cfcaf62edca0a11938b920e37d058d3e8655ae9e4f9c735925c3';
export const PROMPT_SHA256 = '0ceda8887463a515d241751133c9b0d3bf3364f89b63fa6ac5dda6ac70c8eec2';

const sha = (b) => createHash('sha256').update(b).digest('hex');
function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) out.push(...walk(p)); else out.push(p); }
  return out;
}
function snapshot(root) {
  const m = {};
  for (const d of [...DIRS, PROMPT]) {
    const base = join(root, d);
    if (!existsSync(base)) continue;
    for (const f of (statSync(base).isDirectory() ? walk(base) : [base])) m[relative(root, f)] = sha(readFileSync(f));
  }
  return m;
}

export function createIsolatedCopy(scratchParent) {
  const manifestBytes = readFileSync(join(REPO, PHASE7_MANIFEST));
  if (sha(manifestBytes) !== PACKAGE_SHA256) throw new Error('phase7_manifest_hash_mismatch');
  const tmp = mkdtempSync(join(scratchParent, 'iso-'));
  for (const d of DIRS) cpSync(join(REPO, d), join(tmp, d), { recursive: true });
  cpSync(join(REPO, PROMPT), join(tmp, PROMPT));
  // Verify candidate files against the frozen manifest rows.
  let checked = 0;
  for (const line of manifestBytes.toString('utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [h, f] = [line.slice(0, 64), line.slice(66)];
    if (!f.startsWith(DIRS[0] + '/')) continue;
    if (sha(readFileSync(join(tmp, f))) !== h) throw new Error('isolated_copy_mismatch:' + f);
    checked += 1;
  }
  if (sha(readFileSync(join(tmp, PROMPT))) !== PROMPT_SHA256) throw new Error('prompt_hash_mismatch');
  const worktree = snapshot(REPO), copy = snapshot(tmp);
  for (const [k, v] of Object.entries(worktree)) if (copy[k] !== v) throw new Error('isolated_copy_differs_from_worktree:' + k);
  return { root: tmp, candidateFilesVerified: checked, filesCopied: Object.keys(copy).length, snapshotBefore: copy };
}

export function verifyAndDelete(iso) {
  const after = snapshot(iso.root);
  const changed = Object.keys(iso.snapshotBefore).filter((k) => after[k] !== iso.snapshotBefore[k]);
  rmSync(iso.root, { recursive: true, force: true });
  return { unchanged: changed.length === 0, changed, deleted: !existsSync(iso.root) };
}

export function loadPrompt(iso) {
  const text = readFileSync(join(iso.root, PROMPT), 'utf8');
  const i = text.indexOf('[SYSTEM]\n'), j = text.indexOf('[USER]\n');
  if (i < 0 || j < 0) throw new Error('prompt_structure_invalid');
  return { system: text.slice(i + 9, j).trim(), user: text.slice(j + 7).trim() };
}

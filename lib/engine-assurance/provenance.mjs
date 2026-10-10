// JRS ENGINE ASSURANCE: source identity of the candidate core.
//
// Re-reads the historical v1 handler from local git history and confirms that the
// prompt, condition keys, status normaliser, determination rule and parsing lines
// in candidate-core.mjs are byte-identical to it. Local git only; no remote.
//
// If git history is unavailable (a shallow or exported copy), the status is
// candidate_core_provenance_not_verified. That is reported, never assumed away.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CANDIDATE_SOURCE } from './candidate-core.mjs';

const CORE_PATH = fileURLToPath(new URL('./candidate-core.mjs', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function between(src, start, end) {
  const i = src.indexOf(start);
  if (i === -1) return null;
  const j = src.indexOf(end, i + start.length);
  return j === -1 ? null : src.slice(i, j + end.length);
}

export function checkCandidateProvenance() {
  const result = { status: 'candidate_core_provenance_not_verified', checks: [], repository_head: null, working_tree: 'unknown' };
  try {
    result.repository_head = git(['rev-parse', 'HEAD']).trim();
    result.working_tree = git(['status', '--porcelain']).trim() ? 'modified_uncommitted' : 'clean';
  } catch { /* reported as unknown */ }
  let blob, blobId;
  try {
    const ref = CANDIDATE_SOURCE.commit + ':' + CANDIDATE_SOURCE.repository_path;
    blobId = git(['rev-parse', ref]).trim();
    blob = git(['show', ref]);
  } catch {
    result.checks.push({ check: 'git_history_available', ok: false });
    return result;
  }
  const core = readFileSync(CORE_PATH, 'utf8');
  const pieces = {
    blob_id_matches_record: null,
    engine_version: "const ENGINE_VERSION = '0.1.0-validation';",
    condition_keys: between(blob, 'const CONDITION_KEYS = [', '];'),
    system_prompt: between(blob, 'const SYSTEM_PROMPT = `', '`;'),
    norm_status: between(blob, 'function normStatus(s) {', '\n}'),
    derive_determination: between(blob, 'function deriveDetermination(conditions) {', '\n}'),
    parse_lines: between(blob, '  const raw = (j && j.content', '    },\n  };\n'),
  };
  result.checks.push({ check: 'blob_id_matches_record', ok: blobId === CANDIDATE_SOURCE.blob });
  for (const [name, text] of Object.entries(pieces)) {
    if (name === 'blob_id_matches_record') continue;
    result.checks.push({ check: name, ok: !!text && blob.includes(text) && core.includes(text) });
  }
  if (result.checks.every((c) => c.ok)) result.status = 'candidate_core_matches_git_history';
  return result;
}

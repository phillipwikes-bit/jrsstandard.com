// JRS PHASE 8.1: isolated historical replay plan.
//
// Pure planning only; this module starts no process. The replay tool executes a plan
// in a temporary clone outside the repository: the baseline commit (the recorded tree
// of every tracked package) plus only the recorded manifests of the package under
// replay and its declared untracked dependencies. Later packages are never present.

import { parseManifestText, BASELINE_COMMIT } from './registry.mjs';

export const REPLAYS = Object.freeze({
  'phase4-change-control': { command: 'tests/engine-adaptive-reliability/run.mjs', untracked_dependencies: [] },
  'phase6-reliability': { command: 'tests/engine-reliability/run.mjs', untracked_dependencies: ['phase6-reliability'] },
  'phase7-candidate': { command: 'tests/engine-remediation-phase7/run.mjs', untracked_dependencies: ['phase6-reliability', 'phase7-candidate'] },
});

// manifests: { packageId: manifest text }; trackedCommand: whether the command file is in the baseline or in a dependency manifest.
export function planIsolatedReplay(pkg, manifests, trackedFiles) {
  const spec = REPLAYS[pkg];
  if (!spec) return { ok: false, refusal: 'no approved isolated replay for ' + pkg };
  const files = [];
  for (const dep of spec.untracked_dependencies) {
    const text = manifests[dep];
    if (typeof text !== 'string' || !text.length) return { ok: false, refusal: 'missing manifest: ' + dep };
    const rows = parseManifestText(text);
    if (rows.some((r) => r.malformed)) return { ok: false, refusal: 'malformed manifest: ' + dep };
    files.push(...rows.map((r) => ({ path: r.path, sha256: r.sha256, package: dep })));
  }
  const inFiles = files.some((f) => f.path === spec.command) || (trackedFiles || new Set()).has(spec.command);
  if (!inFiles) return { ok: false, refusal: 'approved test command missing: ' + spec.command };
  return { ok: true, package: pkg, baseline_commit: BASELINE_COMMIT, command: spec.command, untracked_dependencies: spec.untracked_dependencies, files, later_packages_excluded: true };
}

// A completed isolated run is uncontaminated only if its worktree held exactly the planned untracked files.
export function contaminationCheck(plan, untrackedInClone) {
  const planned = new Set(plan.files.map((f) => f.path));
  const extra = untrackedInClone.filter((f) => !planned.has(f));
  const missing = [...planned].filter((f) => !untrackedInClone.includes(f));
  return { clean: !extra.length && !missing.length, extra, missing };
}

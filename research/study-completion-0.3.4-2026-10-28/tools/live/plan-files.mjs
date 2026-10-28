// Study completion (0.3.4): the files a live run executes and how the plan hashes them. Pure: no I/O, no network.
// The sender is hashed with its dispatch flag line normalized, so the one permitted change after an authorization is
// signed (LIVE_DISPATCH_ENABLED false to true) leaves the signed plan hash valid. Any other change to any of these files
// changes the plan hash and voids an authorization signed against the earlier plan.
import { createHash } from 'node:crypto';

export const FILES = Object.freeze({
  sender: 'research/study-completion-0.3.4-2026-10-28/tools/live/sender-bound.mjs',
  authorization_verifier: 'research/study-completion-0.3.4-2026-10-28/tools/live/authorization-bound.mjs',
  runner: 'research/study-completion-0.3.4-2026-10-28/tools/live/runner.mjs',
  scorer: 'research/study-completion-0.3.4-2026-10-28/tools/live/score-live.mjs',
  command: 'research/study-completion-0.3.4-2026-10-28/tools/live/run-live.mjs',
  plan_files: 'research/study-completion-0.3.4-2026-10-28/tools/live/plan-files.mjs',
  child_inspector: 'research/study-completion-0.3.4-2026-10-28/tools/live/child-inspector.mjs',
  inspect_capture: 'research/study-completion-0.3.4-2026-10-28/tools/live/inspect-capture.mjs',
  guard: 'research/study-completion-0.3.4-2026-10-28/tools/guard.mjs',
  common: 'research/study-completion-0.3.4-2026-10-28/tools/common.mjs',
  adapter_frozen: 'research/engine-repair-0.3.4-2026-10-27/tools/transport/study-adapter.mjs',
  assembly_frozen: 'research/engine-repair-0.3.4-2026-10-27/tools/transport/prompt-assembly.mjs',
  compile_row_frozen: 'research/engine-repair-0.3.4-2026-10-27/tools/compile-row-v2.mjs',
});
export const FLAG_LINE = /^export const LIVE_DISPATCH_ENABLED = (?:true|false);$/m;
export function planFileSha(rel, text) {
  const t = rel === FILES.sender ? text.replace(FLAG_LINE, 'export const LIVE_DISPATCH_ENABLED = <FLAG>;') : text;
  return createHash('sha256').update(t).digest('hex');
}

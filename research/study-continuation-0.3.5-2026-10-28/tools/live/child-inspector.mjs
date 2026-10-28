// Study continuation (0.3.5), ported from study-completion-0.3.4-2026-10-28: compiles each capture in a separate child process (tools/live/inspect-capture.mjs) for the
// runner's stop rules. The dispatch process must not load the scoring chain: the frozen study's compile-row.mjs imports
// research-probes.mjs, which installs a network guard at import time and would block the run's own requests. The child
// installs the guard itself, never receives the credential (its environment drops every ANTHROPIC_ variable and the
// credential variable) and returns only derived fields.
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export function childInspector({ scratch, env, dropVariables = [] }) {
  const childEnv = Object.fromEntries(Object.entries(env || {}).filter(([k]) => !/^ANTHROPIC_/.test(k) && !dropVariables.includes(k)));
  return (captureText, q) => {
    const input = JSON.stringify({ capture_text: captureText, request_id: q.request_id || q.requestId, base_record_id: q.base_record_id || q.recordId, scratch });
    const r = spawnSync(process.execPath, [join(HERE, 'inspect-capture.mjs')], { input, env: childEnv, encoding: 'utf8', timeout: 120000, maxBuffer: 1 << 20 });
    if (r.status !== 0) return { contractOk: false, engineFailure: true, error: 'inspector_exit_' + r.status + ':' + String(r.stderr || '').slice(-200) };
    try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return { contractOk: false, engineFailure: true, error: 'inspector_output_unreadable' }; }
  };
}

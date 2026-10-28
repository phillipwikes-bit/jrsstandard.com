// Study continuation (0.3.5), ported from study-completion-0.3.4-2026-10-28: the live-run command. IT REFUSES IN THIS BUILD: LIVE_DISPATCH_ENABLED is false in
// tools/live/sender-bound.mjs, and this file checks it before it reads any file, environment value or credential.
// Enabling is one recorded change after a signed authorization exists: set that flag to true (protocol/
// LIVE_STUDY_PROTOCOL.md, section 13). The plan hashes the sender with that line normalized, so the signed plan stays
// valid; any other change voids it. Once enabled, this command, in order:
//   1. checks every file the plan names against its plan hash, and the record set and targeted texts against theirs;
//   2. loads the authorization (a file outside the repository) and refuses unless it verifies against the frozen plan;
//   3. refuses a run directory inside the repository or any git working tree;
//   4. runs orchestrate() (tools/live/runner.mjs): journal recovery first, then the authorized phases in order, each
//      capture compiled offline as it arrives in a guarded child process (tools/live/child-inspector.mjs), stopping on
//      any stop rule; the credential is read from the one variable the authorization names, inside the sender gate,
//      after the authorization verifies. This process never loads the scoring chain (see child-inspector.mjs).
// Usage: node tools/live/run-live.mjs --authorization <file outside the repository> --run-dir <private dir outside the repository> --scratch <dir>
import { LIVE_DISPATCH_ENABLED } from './sender-bound.mjs';

if (!LIVE_DISPATCH_ENABLED) {
  console.error('refused: live dispatch is disabled in this build. No file, environment value or credential was read and no request was sent. '
    + 'A live run needs a signed authorization covering the exact model, candidate, prompt, plan, record set, request and attempt caps, spend cap and retention, '
    + 'then the recorded enabling step in protocol/LIVE_STUDY_PROTOCOL.md.');
  process.exit(4);
}

// The fetch implementation is taken before any other module loads, so no import can replace it.
const fetchImpl = globalThis.fetch;
const { readFileSync, existsSync, mkdirSync } = await import('node:fs');
const { join, dirname, resolve } = await import('node:path');
const { fileURLToPath } = await import('node:url');
const { createHash } = await import('node:crypto');
const { FILES, planFileSha } = await import('./plan-files.mjs');
const { orchestrate, privateLocationProblems } = await import('./runner.mjs');
const { childInspector } = await import('./child-inspector.mjs');

const sha = (s) => createHash('sha256').update(s).digest('hex');
const canon = (v) => (v && typeof v === 'object' ? (Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}') : JSON.stringify(v));
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), ROOT = join(DIR, '..', '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const authPath = arg('--authorization'), runDir = arg('--run-dir'), scratch = arg('--scratch');
const stop = (m) => { console.error('stopped before any request: ' + m); process.exit(3); };
if (!authPath || !runDir || !scratch) stop('usage: run-live.mjs --authorization <file> --run-dir <dir> --scratch <dir>');
if (Object.prototype.hasOwnProperty.call(process.env, 'ANTHROPIC_BASE_URL')) stop('ANTHROPIC_BASE_URL is set; unset it (the sender never uses it, and the run refuses to start beside it)');

const plan = JSON.parse(readFileSync(join(DIR, 'protocol', 'LIVE_RUN_PLAN.json'), 'utf8'));
const { plan_sha256: claimed, ...rest } = plan;
if (sha(canon(rest)) !== claimed) stop('plan hash does not match its content');
for (const [k, f] of Object.entries(plan.transport.files)) if (planFileSha(f.path, readFileSync(join(ROOT, f.path), 'utf8')) !== f.sha256) stop('file differs from the plan: ' + k + ' ' + f.path);
if (Object.keys(FILES).some((k) => !plan.transport.files[k])) stop('the plan does not cover every executed file');
const set = JSON.parse(readFileSync(join(DIR, 'records', 'LIVE_RECORD_SET.json'), 'utf8'));
if (sha(canon(set.requests)) !== plan.record_set.requests_sha256) stop('record set differs from the plan');
const targetedText = readFileSync(join(DIR, 'records', 'TARGETED_TEXTS.jsonl'), 'utf8');
if (sha(targetedText) !== plan.record_set.targeted_texts_sha256) stop('targeted texts differ from the plan');
const targeted = new Map(targetedText.split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.request_id, o.text]; }));
const promptText = readFileSync(join(ROOT, plan.candidate.prompt_path), 'utf8');
if (sha(promptText) !== plan.candidate.prompt_sha256) stop('prompt differs from the plan');
if (!existsSync(authPath) || (resolve(authPath) + '/').startsWith(resolve(ROOT) + '/')) stop('the authorization must be a file outside the repository');
const loc = privateLocationProblems(runDir, ROOT); if (loc.length) stop(loc.join('; '));
const authorization = JSON.parse(readFileSync(authPath, 'utf8'));
if (resolve(authorization.retention_location || '') !== resolve(runDir)) stop('the run directory is not the retention location the authorization names');

mkdirSync(scratch, { recursive: true });
// Each capture is compiled in a guarded child process that never receives the credential (tools/live/child-inspector.mjs).
const inspect = childInspector({ scratch, env: process.env, dropVariables: [authorization.credential_environment_variable_name] });
const res = await orchestrate({ plan, set, promptText, targeted, authorization, runDir, repoRoot: ROOT, env: process.env, fetchImpl, inspect });
console.log(JSON.stringify({ stopped: res.stopped, phases: res.phases.map((p) => ({ phase: p.phase, stopped: p.stopped, tally: p.tally, gate: p.gate || null })), recovered: res.recovered, spent_usd: res.spent_usd, requests: res.requests, attempts: res.attempts }, null, 2));
process.exit(res.stopped ? 1 : 0);

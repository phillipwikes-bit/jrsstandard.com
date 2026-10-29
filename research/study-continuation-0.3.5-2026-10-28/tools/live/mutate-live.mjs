// Study continuation (0.3.5), ported from study-completion-0.3.4-2026-10-28: mutation tests for the live machinery. Each mutant changes one behaviour of the bound
// transport, verifier or runner; tools/live/test-live.mjs must then fail. Mutants run from a symlinked mirror in which
// only the mutated file is a real (changed) copy and out/ is scratch, so no file in the repository is ever modified.
// Writes out/LIVE_MUTATION_TESTS.json. Exits 1 if a mutant does not apply, survives, or the unmutated mirror fails.
// Usage: node tools/live/mutate-live.mjs <scratch>
import { attempts } from '../guard.mjs';
import { mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR, ROOT, RESEARCH, STATUS, writeJson } from '../common.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: mutate-live.mjs <scratch>'); process.exit(2); }
const SB = 'tools/live/sender-bound.mjs', AB = 'tools/live/authorization-bound.mjs', RN = 'tools/live/runner.mjs';
export const MUTANTS = [
  ['MV-01', SB, 'token estimate back to length / 3 (B4)', "export const estimateTokens = (text) => Buffer.byteLength(String(text), 'utf8');", 'export const estimateTokens = (text) => Math.ceil(String(text).length / 3);'],
  ['MV-02', SB, 'redirect fetch error treated as a network error (B5)', "/redirect/i.test(String(e && e.message) + ' ' + String(e && e.cause && e.cause.message)) ? 'redirect_refused' : 'network_error'", "'network_error'"],
  ['MV-03', SB, '3xx status not classified as a redirect (B5)', "  if (status >= 300 && status < 400) return { final: true, outcome: 'redirect_refused', retry: false };   // B5\n", ''],
  ['MV-04', SB, 'attempts before a resume not counted (B7)', 'for (let attempt = J.attemptsOf(requestId); attempt <= ctx.maxRetries; attempt++)', 'for (let attempt = 0; attempt <= ctx.maxRetries; attempt++)'],
  ['MV-05', SB, 'interrupted_unknown no longer blocks a resend (B8)', "if ((st === 'sent' || st === 'interrupted_unknown') && !allowAmbiguousResend)", "if (st === 'sent' && !allowAmbiguousResend)"],
  ['MV-06', SB, 'journal not written through (B10)', 'if (onAppend) onAppend(line); ', ''],
  ['MV-07', SB, 'network errors not counted (B9)', 'outcome: errKind, cost_usd: est, billing, at: ctx.now() }));', 'outcome: errKind, cost_usd: 0, billing, at: ctx.now() }));'],
  ['MV-08', SB, '504 not counted at the worst case (B3)', 'export const UNKNOWN_BILLING_STATUS = Object.freeze([504]);', 'export const UNKNOWN_BILLING_STATUS = Object.freeze([]);'],
  ['MV-09', SB, 'global attempt cap removed (B6)', 'if (Number.isInteger(ctx.maxAttempts) && J.attemptCount() >= ctx.maxAttempts)', 'if (false)'],
  ['MV-10', SB, 'destination host not checked', "  if (u.hostname !== DESTINATION.hostname) p.push('destination_host_not_allowed');\n", ''],
  ['MV-11', SB, 'credential value not checked in captures', "      for (const s of sentinels) if (text.includes(s)) throw new SenderRefusal('credential_value_in_capture');\n", ''],
  ['MV-12', SB, 'credential resolved before the authorization is verified', "      const problems = verifyAuthorization(authorization, request, now());\n      if (problems.length) throw new SenderRefusal(problems[0], problems);\n      const credential = credentialResolver(authorization.credential_environment_variable_name);",
    "      const credential = credentialResolver(authorization.credential_environment_variable_name);\n      const problems = verifyAuthorization(authorization, request, now());\n      if (problems.length) throw new SenderRefusal(problems[0], problems);"],
  ['MV-13', SB, 'build gate opened', 'return createGate(Object.assign({}, opts, { enabled: LIVE_DISPATCH_ENABLED }));', 'return createGate(Object.assign({}, opts, { enabled: true }));'],
  ['MV-14', SB, 'redirects followed', "body: payload, redirect: 'error', signal: ac.signal", "body: payload, redirect: 'follow', signal: ac.signal"],
  ['MV-15', SB, 'budget check removed', 'if (J.spentUsd() + est > ctx.budgetUsd)', 'if (false)'],
  ['MV-16', SB, '400 made retryable', 'export const RETRYABLE_STATUS = Object.freeze([429, 500, 529]);', 'export const RETRYABLE_STATUS = Object.freeze([400, 429, 500, 529]);'],
  ['MV-17', AB, 'draft identifiers accepted', "if (NEVER_VALID.includes(a.authorization_id) || /DRAFT/i.test(String(a.authorization_id || '')))", 'if (NEVER_VALID.includes(a.authorization_id))'],
  ['MV-18', AB, 'plan hash not compared', "      ['plan_sha256', 'plan_sha256'], ['record_set_sha256', 'record_set_sha256'], ['destination', 'destination']])", "      ['record_set_sha256', 'record_set_sha256'], ['destination', 'destination']])"],
  ['MV-19', AB, 'placeholder signature accepted', "|| /^(?:TBD|TODO|UNSIGNED|PENDING|N\\/A)/i.test(a.owner_signature.trim())", ''],
  ['MV-20', RN, 'redirect does not stop the run', "  if (o === 'redirect_refused') return 'SR-04';\n", ''],
  ['MV-21', RN, 'capture location inside the repository accepted', "  if (repoRoot && (abs + '/').startsWith(resolve(repoRoot) + '/')) p.push('capture_location_inside_repository');\n", ''],
  ['MV-22', RN, 'PRE gate ignores contract failures', 'valid >= 2 && engineFailures === 0', 'valid >= 0 && engineFailures === 0'],
  ['MV-26', RN, 'PRE gate judged only on requests sent by this process', "      if (journal.stateOf(q.requestId) !== 'captured') continue;", "      if (journal.stateOf(q.requestId) !== 'captured' || !rows.some((r) => r.request_id === q.requestId)) continue;"],
  ['MV-23', RN, 'ambiguous state on resume not stopped', "    if (st === 'sent' || st === 'interrupted_unknown') return { phase, stopped: 'SR-16:' + q.requestId, tally: t, rows };\n", ''],
  ['MV-24', RN, 'authorization not checked before the first request', "  if (pre.length) { out.stopped = 'SR-02:' + pre[0]; out.authorization_problems = pre; return out; }", ''],
  ['MV-25', RN, 'missing credential not reported as SR-01', "last.refused === 'credential_absent' ? 'SR-01' : 'SR-18:' + last.refused", "'SR-18:' + last.refused"],
];

// Mirror of the repository: every entry a link, except the path to the mutated file, whose directories are real and
// whose other entries are links; the continuation directory's out/ is a fresh scratch folder.
function mirror(root, mutatedRel, text) {
  rmSync(root, { recursive: true, force: true });
  const target = ['research', 'study-continuation-0.3.5-2026-10-28', ...mutatedRel.split('/')];
  const build = (real, fake, depth) => {
    mkdirSync(fake, { recursive: true });
    for (const n of readdirSync(real)) {
      if (n === '.git') continue;
      if (depth < target.length - 1 && n === target[depth]) { build(join(real, n), join(fake, n), depth + 1); continue; }
      if (depth === target.length - 1 && n === target[depth]) { writeFileSync(join(fake, n), text); continue; }
      if (depth === 2 && n === 'out') { mkdirSync(join(fake, n)); continue; }   // the continuation directory's out/
      symlinkSync(join(real, n), join(fake, n));
    }
  };
  build(ROOT, root, 0);
  return join(root, 'research', 'study-continuation-0.3.5-2026-10-28');
}
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_/.test(k)));
function runTests(md, scratch) {
  const r = spawnSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', join(md, 'tools', 'live', 'test-live.mjs'), scratch], { env, encoding: 'utf8', timeout: 900000 });
  const failed = (r.stdout || '').split('\n').filter((l) => l.startsWith('FAIL ')).map((l) => l.split(' ')[1]);
  return { status: r.status, failed, tail: (r.stderr || '').slice(-300) };
}

const rows = [];
const base = runTests(mirror(join(SCRATCH, 'm-base'), SB, readFileSync(join(DIR, SB), 'utf8')), join(SCRATCH, 's-base'));
for (const [id, file, what, from, to] of MUTANTS) {
  const orig = readFileSync(join(DIR, file), 'utf8');
  const n = orig.split(from).length - 1;
  if (n !== 1) { rows.push({ id, file, what, applied: false, occurrences: n }); continue; }
  const md = mirror(join(SCRATCH, 'm-' + id), file, orig.replace(from, () => to));
  const r = runTests(md, join(SCRATCH, 's-' + id));
  rows.push({ id, file, what, applied: true, killed: r.status !== 0 && r.failed.length > 0, failed_tests: r.failed, exit: r.status, stderr_tail: r.failed.length ? undefined : r.tail });
  console.log(id + ' ' + (r.status !== 0 && r.failed.length ? 'killed by ' + r.failed.join(',') : 'SURVIVED (exit ' + r.status + ')') + '  ' + what);
}
const bad = rows.filter((r) => !r.applied || !r.killed);
const out = { results_format: 'jrs-study-continuation-live-mutation-tests/1.0.0', ...STATUS, network_attempts: attempts.length,
  statement: 'Each mutant is one deliberate defect in the bound live machinery, run from a mirror; no repository file was modified.',
  unmutated_baseline: { exit: base.status, failed: base.failed }, totals: { mutants: rows.length, applied: rows.filter((r) => r.applied).length, killed: rows.filter((r) => r.killed).length, survived_or_not_applied: bad.length }, rows };
writeJson(join(DIR, 'out', 'LIVE_MUTATION_TESTS.json'), out);
console.log('live mutation tests: baseline exit ' + base.status + '; ' + out.totals.killed + ' of ' + rows.length + ' mutants killed; network attempts ' + attempts.length);
process.exit(base.status !== 0 || bad.length || attempts.length ? 1 : 0);

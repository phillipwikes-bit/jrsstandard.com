// Study continuation (0.3.5): writes CONTINUATION_FREEZE.json, the frozen identities of the continuation (candidate,
// prompt, corrected scorer, dataset, configuration, plan, protocol) and its parent, after checking each one. Fails
// closed: any check that does not hold exits 1 and the freeze is not trusted. Offline; sends nothing.
// Usage: node tools/freeze-continuation.mjs
import { attempts } from './guard.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';
import { DIR, ROOT, PKG4, COMPLETION, STATUS, sha, shaFile, canon, canonSha, readJson, writeJson, checker, finish } from './common.mjs';
import { isolate, V5, V5_MANIFEST_SHA256 } from './harness/engines.mjs';
import { FILES, planFileSha } from './live/plan-files.mjs';
import { LIVE_DISPATCH_ENABLED, SENDER_VERSION, MODEL, API_VERSION } from './live/sender-bound.mjs';
import { SCORER_VERSION } from './live/score-live-v2.mjs';
import { STUDY_NAME, NEVER_VALID } from './live/authorization-bound.mjs';

const c = checker();
const plan = readJson(join(DIR, 'protocol', 'LIVE_RUN_PLAN.json')), set = readJson(join(DIR, 'records', 'LIVE_RECORD_SET.json'));
const { plan_sha256: claimed, ...rest } = plan;
const prompt = join(DIR, 'candidate', 'prompt', 'PROMPT_research-0.3.5-1.txt');
const tests = readJson(join(DIR, 'out', 'CORRECTION_TESTS.json')), live = readJson(join(DIR, 'out', 'LIVE_MACHINERY_TESTS.json')), reh = readJson(join(DIR, 'out', 'ENABLE_REHEARSAL.json')), mut = readJson(join(DIR, 'out', 'LIVE_MUTATION_TESTS.json'));
const scratch = mkdtempSync(join(tmpdir(), 'freeze-')); let iso = null;
try { iso = isolate(V5, scratch); } catch (e) { c.check('candidate_copy_verifies_against_manifest', false, String(e.message)); }
if (iso) { c.check('candidate_copy_verifies_against_manifest', iso.files_verified === 46, iso.files_verified); iso.release(); }
rmSync(scratch, { recursive: true, force: true });
c.check('manifest_hash_pinned_in_harness', shaFile(join(DIR, 'CANDIDATE_0.3.5_MANIFEST_SHA256.txt')) === V5_MANIFEST_SHA256);
c.check('parent_manifest_unchanged', shaFile(join(PKG4, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')) === 'b454d4b858c81655b6ff56bde27a68c1ead9639305e2600a6fcf1746c8c304ad');
c.check('parent_prompt_unchanged', shaFile(join(PKG4, 'candidate', 'prompt', 'PROMPT_research-0.3.4-1.txt')) === '94429a1404c1c3cc80ce40d3ed41f1211b0473939fc8f07227ff41247ababec2');
c.check('original_results_unchanged', shaFile(join(COMPLETION, 'results', 'LIVE_RESULTS.json')) === '6d55ef2efe6272022b16aae9ecbe4d8cfc604612b27079ecf9e61bc2eb940daa');
c.check('original_plan_unchanged', readJson(join(COMPLETION, 'protocol', 'LIVE_RUN_PLAN.json')).plan_sha256 === 'f5dd8e92006c8af9539cc42e7b21747cda3cebe57740bbc35a63083a62dcbc03');
c.check('plan_hash_matches_content', canonSha(rest) === claimed);
c.check('plan_names_this_candidate_and_prompt', plan.candidate.manifest_sha256 === V5_MANIFEST_SHA256 && plan.candidate.prompt_sha256 === shaFile(prompt) && plan.record_set.requests_sha256 === set.requests_sha256);
c.check('every_executed_file_matches_the_plan', Object.entries(plan.transport.files).every(([, f]) => planFileSha(f.path, readFileSync(join(ROOT, f.path), 'utf8')) === f.sha256) && Object.keys(FILES).every((k) => plan.transport.files[k]));
c.check('record_set_hash_matches_content', canonSha(set.requests) === set.requests_sha256 && set.requests.length === 401);
c.check('dispatch_disabled', LIVE_DISPATCH_ENABLED === false);
c.check('old_authorization_never_valid', NEVER_VALID.includes('RUN-LIVE-AUTH-20261028-01'));
c.check('correction_tests_all_passed', tests.totals.failed === 0 && tests.totals.passed === tests.totals.tests, tests.totals);
c.check('live_machinery_tests_all_passed', live.totals.failed === 0, live.totals);
c.check('enable_rehearsal_all_passed', (reh.totals.passed === reh.totals.rehearsals && reh.totals.rehearsals === 9), reh.totals || null);
c.check('every_mutant_killed', mut.totals.killed === mut.totals.mutants && mut.unmutated_baseline.exit === 0, mut.totals);
c.check('no_network_attempts', attempts.length === 0);

const f = (p) => ({ path: p, sha256: shaFile(join(ROOT, p)) });
const D = 'research/study-continuation-0.3.5-2026-10-28/';
const freeze = { format: 'jrs-study-continuation-freeze/1.0.0', frozen_on: '2026-10-28', ...STATUS, engine_of_record: '0.3.1-candidate', dispatch_enabled: LIVE_DISPATCH_ENABLED,
  statement: 'Frozen for review and authorization. Not authorized; no provider request has been sent for this continuation. Not adopted.',
  parent: { candidate: '0.3.4-research-candidate', candidate_manifest_sha256: shaFile(join(PKG4, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')), prompt_sha256: shaFile(join(PKG4, 'candidate', 'prompt', 'PROMPT_research-0.3.4-1.txt')),
    run: 'RUN-LIVE-AUTH-20261028-01 (arm L1, stopped on SR-10 after 69 requests; unchanged)', plan_sha256: 'f5dd8e92006c8af9539cc42e7b21747cda3cebe57740bbc35a63083a62dcbc03',
    results: f('research/study-completion-0.3.4-2026-10-28/results/LIVE_RESULTS.json'), scorer_v1: f('research/study-completion-0.3.4-2026-10-28/tools/live/score-live.mjs') },
  changes: f(D + 'CHANGES_FROM_0.3.4.md'),
  candidate: { version: V5, compiler_version: '0.3.4-research-candidate (unchanged)', manifest: f(D + 'CANDIDATE_0.3.5_MANIFEST_SHA256.txt'), prompt: Object.assign(f(D + 'candidate/prompt/PROMPT_research-0.3.5-1.txt'), { prompt_version: plan.candidate.prompt_version }) },
  scorer: Object.assign(f(D + 'tools/live/score-live-v2.mjs'), { version: SCORER_VERSION }),
  dataset: { record_set: f(D + 'records/LIVE_RECORD_SET.json'), requests_sha256: set.requests_sha256, targeted_texts: f(D + 'records/TARGETED_TEXTS.jsonl'), by_phase: set.by_phase },
  configuration: { study: STUDY_NAME, model: MODEL, api_version: API_VERSION, sender_version: SENDER_VERSION, request: plan.request, transport: plan.transport.config, pacing: plan.transport.pacing, plan: Object.assign(f(D + 'protocol/LIVE_RUN_PLAN.json'), { plan_sha256: claimed }),
    proposed_authorizations: plan.proposed_authorizations, stop_rules: Object.keys(plan.stop_rules), authorization_draft: f(D + 'authorization/LIVE_AUTHORIZATION_DRAFT.json') },
  protocol: [f(D + 'protocol/CONTINUATION_PROTOCOL.md'), f(D + 'protocol/LIVE_RUN_PLAN.md')],
  tests: { correction: Object.assign(f(D + 'out/CORRECTION_TESTS.json'), tests.totals), live_machinery: Object.assign(f(D + 'out/LIVE_MACHINERY_TESTS.json'), live.totals), enable_rehearsal: f(D + 'out/ENABLE_REHEARSAL.json'), mutation: Object.assign(f(D + 'out/LIVE_MUTATION_TESTS.json'), mut.totals) },
  checks: c.checks };
freeze.freeze_sha256 = canonSha(freeze);
if (!c.failed().length) writeJson(join(DIR, 'CONTINUATION_FREEZE.json'), freeze);
finish('continuation freeze', c, 'freeze_sha256 ' + freeze.freeze_sha256.slice(0, 16) + '; plan ' + claimed.slice(0, 16) + '; network attempts ' + attempts.length);

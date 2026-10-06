// Local Engine candidate: mocked tests only. Added 2026-10-06.
// No provider is called. globalThis.fetch is trapped for the whole run, and the
// model is a mock function injected into runCandidate.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  runCandidate, checkScope, parseModelOutput, buildRequest,
  CONDITION_KEYS, FLAW_TYPES, MAX_CHARS,
} from '../../lib/engine-candidate/review-candidate.js';

let pass = 0, fail = 0;
const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const ROOT = new URL('../../', import.meta.url).pathname;
// Code only: the header comments name Supabase and providers to explain their removal.
const SRC = readFileSync(join(ROOT, 'lib/engine-candidate/review-candidate.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
const RECORD = readFileSync(join(ROOT, 'tests/engine-candidate/fixtures/SYNTHETIC-SAE-01.txt'), 'utf8');
const PROFILE = { record_type: 'supplier_access_exception', completion_status: 'completed', hr_related: false };
const MODEL = 'mock-model-0';

let networkCalls = 0;
globalThis.fetch = async () => { networkCalls++; throw new Error('network access is prohibited in candidate tests'); };

const cond = (status = 'review', note = 'The basis is stated only as a track record that is not in the record.') =>
  Object.fromEntries(CONDITION_KEYS.map((k) => [k, { status, note }]));
const reply = (obj, stop_reason = 'end_turn') => async () => ({ text: JSON.stringify(obj), stop_reason });
const good = {
  conditions: cond(),
  flaws: [
    { type: 'evidentiary_overreach', excerpt: 'Approved given the supplier’s track record.', explanation: 'The track record is asserted but not shown.' },
    { type: 'reasoning_elision', excerpt: 'section 4 (data retention) was blank', explanation: 'The draft does not say how the blank section was resolved before approval.' },
  ],
  revision_needed: 'State the evidence of the track record and how section 4 was addressed.',
};
const run = (callModel, input = { text: RECORD, profile: PROFILE }) => runCandidate(input, { callModel, model: MODEL, now: () => '2026-10-06T00:00:00Z' });

// ---- isolation ----------------------------------------------------------------
t('module has no fetch, no environment read, no Supabase and no provider URL',
  !/\bfetch\s*\(|process\.env|supabase|api\.anthropic|api\.openai|XMLHttpRequest|node:http|require\(/i.test(SRC));
t('runCandidate refuses to run without an injected model function',
  await runCandidate({ text: RECORD, profile: PROFILE }, { model: MODEL }).then(() => false, (e) => /callModel must be injected/.test(e.message)));
t('runCandidate refuses to run without a stated model identifier',
  await runCandidate({ text: RECORD, profile: PROFILE }, { callModel: reply(good) }).then(() => false, (e) => /model must be stated/.test(e.message)));
const apiFiles = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && apiFiles.push(p); } })(join(ROOT, 'api'));
t('no file under api/ imports the candidate', apiFiles.every((f) => !readFileSync(f, 'utf8').includes('engine-candidate')), `${apiFiles.length} files`);
const ignore = readFileSync(join(ROOT, '.vercelignore'), 'utf8').split('\n').map((l) => l.trim());
t('lib/ and tests/ are excluded from every Vercel deployment', ignore.includes('lib/') && ignore.includes('tests/'));

// ---- scope gate ---------------------------------------------------------------
const scoped = (profile, text = RECORD) => checkScope({ text, profile });
t('in-scope record passes the scope gate', scoped(PROFILE) === null);
t('wrong record type is refused', scoped({ ...PROFILE, record_type: 'hr_investigation' })?.reason === 'out_of_scope_record_type');
t('a draft not marked completed is refused', scoped({ ...PROFILE, completion_status: 'in_progress' })?.reason === 'draft_not_completed');
t('HR status must be declared false, not omitted', scoped({ record_type: 'supplier_access_exception', completion_status: 'completed' })?.reason === 'hr_status_not_declared_false');
t('HR-related draft is refused', scoped({ ...PROFILE, hr_related: true })?.reason === 'hr_status_not_declared_false');
for (const [domain, phrase] of [['employment', 'a disciplinary action followed'], ['housing', 'the tenant asked'], ['lending', 'the loan application was'],
  ['insurance', 'the insurance claim was'], ['medical', 'the patient file'], ['legal_outcome', 'after the verdict']]) {
  t(`excluded domain refused: ${domain}`, scoped(PROFILE, RECORD + '\n' + phrase + ' noted.')?.reason === 'excluded_domain_' + domain);
}
t('record under 40 characters is refused', scoped(PROFILE, 'SYNTHETIC short')?.reason === 'record_too_short');
const long = RECORD + ' x'.repeat(MAX_CHARS);
const longR = scoped(PROFILE, long);
t('record over the limit is refused, not truncated', longR?.reason === 'record_too_long' && /not truncated/.test(longR.detail));
let sawLong = false;
await run(async (req) => { sawLong = true; return { text: '{}', stop_reason: 'end_turn' }; }, { text: long, profile: PROFILE });
t('an over-limit record never reaches the model', sawLong === false);

// ---- request ------------------------------------------------------------------
const req = buildRequest(RECORD.trim(), MODEL);
t('request carries the whole record, unshortened', req.messages[0].content.endsWith(RECORD.trim()));
t('prompt forbids inferring emotional state, intent, payoff or clinical condition', /emotional state, intent, motive, hidden payoff or clinical condition/.test(req.system));
t('prompt forbids a score and an access decision', /Do not give a score/.test(req.system) && /Do not decide whether the access exception should be granted/.test(req.system));

// ---- examined result ------------------------------------------------------------
const ok = await run(reply(good));
t('valid reply is examined', ok.status === 'examined', ok.reason || '');
t('human review is always required and the output is marked unvalidated', ok.human_review_required === true && ok.validated === false);
t('all five conditions are returned', CONDITION_KEYS.every((k) => ['pass', 'review', 'gap'].includes(ok.conditions?.[k]?.status)));
t('both verbatim flaws are kept (curly apostrophe normalised)', ok.flaws?.length === 2, JSON.stringify(ok.extraction));
t('output records the model and candidate version', ok.model === MODEL && ok.candidate_version === '0.1.0-local.1');
const keys = JSON.stringify(ok);
t('no overall determination, no "ready" sign-off and no numeric score',
  !/"determination"|"ready"|"score"|"overall_consistency"|"drr"/i.test(keys));
t('no banned claim words in the output', !/compliant|certified|guaranteed|prevents|eliminates/i.test(keys));

// ---- extraction-failure reporting ---------------------------------------------
const fabricated = await run(reply({ ...good, flaws: [{ type: 'unsupported_content', excerpt: 'The supplier signed an NDA on 1 March 2026.', explanation: 'x' }] }));
t('excerpt not in the record is reported, not shown as a finding',
  fabricated.status === 'examined' && fabricated.flaws.length === 0 && fabricated.extraction.excerpt_not_in_record.length === 1);
const badType = await run(reply({ ...good, flaws: [{ type: 'bad_faith', excerpt: 'Access was granted on 4 March 2026', explanation: 'x' }] }));
t('flaw type outside the permitted set is rejected and reported', badType.flaws.length === 0 && badType.extraction.rejected_flaw_types[0] === 'bad_faith');
const missing = { ...good, conditions: cond() }; delete missing.conditions.temporal_reconstructability;
const miss = await run(reply(missing));
t('a missing condition makes the result incomplete, not partial',
  miss.status === 'incomplete' && miss.reason === 'model_output_incomplete' && miss.extraction.missing_conditions[0] === 'temporal_reconstructability' && !('conditions' in miss));
const inv = await run(reply({ ...good, conditions: { ...cond(), basis_identification: { status: 'ok', note: 'x' } } }));
t('an invalid status makes the result incomplete', inv.status === 'incomplete' && inv.extraction.invalid_statuses[0] === 'basis_identification');
const trunc = await run(reply(good, 'max_tokens'));
t('a truncated model reply is reported as truncated and not parsed', trunc.status === 'incomplete' && trunc.reason === 'model_output_truncated');
const prose = await run(async () => ({ text: 'I think this record is fine.', stop_reason: 'end_turn' }));
t('a non-JSON reply is reported, never guessed at', prose.status === 'incomplete' && prose.reason === 'model_output_not_json');
const thrown = await run(async () => { throw new Error('provider down; key sk-test-should-not-echo'); });
t('a failed model call is incomplete and does not echo the error', thrown.status === 'incomplete' && !JSON.stringify(thrown).includes('sk-test'));
const malformed = await run(async () => ({ stop_reason: 'end_turn' }));
t('a reply without text is incomplete', malformed.status === 'incomplete' && malformed.reason === 'model_reply_malformed');

// ---- prohibited inference -----------------------------------------------------
const inferred = await run(reply({
  ...good,
  conditions: { ...cond(), basis_identification: { status: 'gap', note: 'The lead was frustrated and wanted to hide the questionnaire.' } },
  flaws: [{ type: 'reasoning_elision', excerpt: 'Access was granted on 4 March 2026', explanation: 'The lead deliberately skipped security.' }],
}));
t('a note inferring emotional state or intent is withheld and reported',
  inferred.conditions.basis_identification.note === null && inferred.extraction.withheld_prohibited_inference.includes('conditions.basis_identification'));
t('a flaw explanation inferring intent is withheld', inferred.flaws.length === 0 && inferred.extraction.withheld_prohibited_inference.includes('flaws.0'));
t('the condition status is kept when only its note is withheld', inferred.conditions.basis_identification.status === 'gap');

// ---- direct parser check ----------------------------------------------------------
t('parser accepts every permitted flaw type', FLAW_TYPES.every((type) =>
  parseModelOutput(JSON.stringify({ conditions: cond(), flaws: [{ type, excerpt: 'Access was granted on 4 March 2026', explanation: 'x' }] }), RECORD).flaws.length === 1));

t('no network call was made during the whole run', networkCalls === 0);
console.log(`\n${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);

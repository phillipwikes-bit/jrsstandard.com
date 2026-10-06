// Local Engine candidate: integration tests, mocked only. Added 2026-10-06, expanded the same day.
// No provider is called: fetch is trapped by the harness and the model is a mock function.
import { readFileSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { t, done, fixture, net, ROOT, PROFILE, MODEL, NOW, cond, reply, spyModel, scoreAudit, CONDITION_KEYS } from './_harness.mjs';
import {
  runCandidate, checkScope, buildRequest, FLAW_TYPES, MAX_CHARS, SYSTEM_PROMPT, PROHIBITED_INFERENCE, EXCLUDED_DOMAINS,
} from '../../lib/engine-candidate/review-candidate.js';
import { allExplanationTexts, CATEGORIES, explainFlaw } from '../../lib/engine-candidate/explanations.js';

const DIR = join(ROOT, 'lib/engine-candidate');
const MODULES = readdirSync(DIR).filter((f) => f.endsWith('.js'));
// Code only: header comments name Supabase and providers to explain their removal.
const code = (f) => readFileSync(join(DIR, f), 'utf8').replace(/^\s*\/\/.*$/gm, '');
const RECORD = fixture('SYNTHETIC-SAE-01.txt');
const GAPS = fixture('SYNTHETIC-SAE-03-GAPS.txt');
const good = {
  conditions: cond(),
  flaws: [
    { type: 'evidentiary_overreach', excerpt: 'Approved given the supplier’s track record.', explanation: 'The track record is asserted but not shown.' },
    { type: 'reasoning_elision', excerpt: 'section 4 (data retention) was blank', explanation: 'The draft does not say how the blank section was resolved before approval.' },
  ],
  revision_needed: 'State the evidence of the track record and how section 4 was addressed.',
};
const run = (callModel, input = { text: RECORD, profile: PROFILE }, model = MODEL) => runCandidate(input, { callModel, model, now: NOW });

// ---- no network ----------------------------------------------------------------
const imports = MODULES.flatMap((f) => [...code(f).matchAll(/^\s*import\s[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1]));
t('candidate modules import only each other and node:crypto', imports.every((s) => s.startsWith('./') || s === 'node:crypto'), JSON.stringify([...new Set(imports)]));
t('no fetch, socket, HTTP client, environment read, provider URL or dynamic import in any module',
  MODULES.every((f) => !/\bfetch\s*\(|XMLHttpRequest|WebSocket|process\.env|api\.anthropic|api\.openai|supabase|\bimport\s*\(|require\(/i.test(code(f))), MODULES.join(', '));
t('runCandidate refuses to run without an injected model function',
  await runCandidate({ text: RECORD, profile: PROFILE }, { model: MODEL }).then(() => false, (e) => /callModel must be injected/.test(e.message)));
t('runCandidate refuses to run without a stated model identifier',
  await runCandidate({ text: RECORD, profile: PROFILE }, { callModel: reply(good) }).then(() => false, (e) => /model must be stated/.test(e.message)));

// ---- no persistence --------------------------------------------------------------
t('no file-system, browser-storage or database access in any module',
  MODULES.every((f) => !/node:fs|\bfs\b|writeFile|appendFile|createWriteStream|localStorage|sessionStorage|indexedDB|sqlite|postgres|\bdb\./i.test(code(f))));
const scratch = mkdtempSync(join(tmpdir(), 'jrs-candidate-'));
const before = execSync('git status --porcelain', { cwd: ROOT }).toString();
const cwd = process.cwd(); process.chdir(scratch);
await run(reply(good)); await run(reply(good), { text: GAPS, profile: PROFILE });
process.chdir(cwd);
t('a full run writes nothing to its working directory', readdirSync(scratch).length === 0);
t('a full run leaves the repository working tree unchanged', execSync('git status --porcelain', { cwd: ROOT }).toString() === before);

// ---- deployment boundary -----------------------------------------------------------
const apiFiles = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && apiFiles.push(p); } })(join(ROOT, 'api'));
t('no file under api/ imports the candidate', apiFiles.every((f) => !readFileSync(f, 'utf8').includes('engine-candidate')), `${apiFiles.length} files`);
const ignore = readFileSync(join(ROOT, '.vercelignore'), 'utf8').split('\n').map((l) => l.trim());
t('lib/ and tests/ are excluded from every Vercel deployment', ignore.includes('lib/') && ignore.includes('tests/'));

// ---- prohibited-domain and scope refusal ------------------------------------------------
const refusedBy = async (input, reason) => {
  const spy = spyModel(good);
  const r = await run(spy, input);
  return r.status === 'refused' && r.reason === reason && spy.calls.length === 0;
};
t('in-scope record passes the gate', checkScope({ text: RECORD, profile: PROFILE }).refusal === null);
t('wrong record type refused, model never called', await refusedBy({ text: RECORD, profile: { ...PROFILE, record_type: 'hr_investigation' } }, 'out_of_scope_record_type'));
t('draft not marked completed refused', await refusedBy({ text: RECORD, profile: { ...PROFILE, completion_status: 'in_progress' } }, 'draft_not_completed'));
t('HR status omitted refused', await refusedBy({ text: RECORD, profile: { record_type: 'supplier_access_exception', completion_status: 'completed' } }, 'hr_status_not_declared_false'));
t('HR-related draft refused', await refusedBy({ text: RECORD, profile: { ...PROFILE, hr_related: true } }, 'hr_status_not_declared_false'));
const domainPhrases = {
  employment: ['a disciplinary action followed', 'the job applicant asked', 'logged as an HR case'],
  housing: ['the tenant asked', 'the landlord replied'],
  lending: ['the loan application was', 'the borrower confirmed', 'a credit score of'],
  insurance: ['the insurance claim was', 'the claimant wrote'],
  medical: ['the patient file', 'a medication list'],
  legal_outcome: ['after the verdict', 'the conviction was'],
};
t('every excluded domain has test phrases', EXCLUDED_DOMAINS.every(([d]) => domainPhrases[d]));
for (const [domain, phrases] of Object.entries(domainPhrases)) {
  for (const phrase of phrases) {
    t(`excluded domain refused (${domain}): "${phrase}"`, await refusedBy({ text: RECORD + '\n' + phrase + ' noted.', profile: PROFILE }, 'excluded_domain_' + domain));
  }
}
t('record under 40 characters refused', await refusedBy({ text: 'SYNTHETIC short.', profile: PROFILE }, 'record_too_short'));
const long = RECORD.trim() + ' Filler.'.repeat(MAX_CHARS / 4);
t('record over the limit refused, not truncated, model never called', await refusedBy({ text: long, profile: PROFILE }, 'record_too_long'));
const longR = await run(reply(good), { text: long, profile: PROFILE });
t('the over-limit refusal says it was not truncated', /not truncated/.test(longR.detail));

// ---- partial and unreadable input refusal ---------------------------------------------------
t('partial record refused before the model', await refusedBy({ text: fixture('SYNTHETIC-SAE-02-PARTIAL.txt'), profile: PROFILE }, 'partial_input'));
const partial = await run(reply(good), { text: fixture('SYNTHETIC-SAE-02-PARTIAL.txt'), profile: PROFILE });
t('partial refusal lists each truncation finding, each with an explanation',
  partial.extraction_findings.length >= 2 && partial.extraction_findings.every((f) => f.kind === 'truncation' && f.origin === 'source_prep' && f.explanation?.question));
t('partial refusal has no contextual findings', partial.contextual_findings === null);
t('a refused result takes no disposition and cannot be signed off',
  partial.status === 'refused' && partial.human_review.sign_off.status === 'not_signed' && partial.human_review.disposition.history.length === 0);
t('unreadable input refused before the model', await refusedBy({ text: RECORD + '�', profile: PROFILE }, 'unreadable_input'));
t('non-text input refused before the model', await refusedBy({ text: { not: 'text' }, profile: PROFILE }, 'unreadable_input'));
t('a cut-off record is refused even when it is long enough and in scope',
  (await run(reply(good), { text: RECORD.trim() + ' The security office then asked whether', profile: PROFILE })).reason === 'partial_input');

// ---- request -------------------------------------------------------------------------------
const req = buildRequest(RECORD.trim(), MODEL);
t('request carries the whole record, unshortened', req.messages[0].content.endsWith(RECORD.trim()));
t('prompt forbids inferring emotional state, intent, motive, payoff or clinical condition', /emotional state, intent, motive, hidden payoff or clinical condition/.test(SYSTEM_PROMPT));
t('prompt forbids a score and an access decision', /Do not give a score/.test(SYSTEM_PROMPT) && /Do not decide whether the access exception should be granted/.test(SYSTEM_PROMPT));

// ---- examined result -------------------------------------------------------------------------
const ok = await run(reply(good));
t('valid reply is examined', ok.status === 'examined', ok.reason || '');
t('human review required and output marked unvalidated', ok.human_review.required === true && ok.validated === false);
t('all five conditions are kept in the contextual section', CONDITION_KEYS.every((k) => ['pass', 'review', 'gap'].includes(ok.contextual_findings.conditions[k].status)));
const flaws = ok.contextual_findings.findings.filter((f) => f.kind === 'flaw');
t('both verbatim flaws kept, curly apostrophe matched', flaws.length === 2);
t('each flaw carries its exact location in the record', flaws.every((f) => f.locations.length === 1 && RECORD.trim().slice(f.locations[0].start, f.locations[0].end).length === f.excerpt.length));
t('flagged conditions become contextual findings; pass conditions do not',
  ok.contextual_findings.findings.filter((f) => f.kind === 'condition').length === 5 &&
  (await run(reply({ ...good, conditions: cond('pass', 'Stated.') }))).contextual_findings.findings.every((f) => f.kind !== 'condition'));
t('extraction and contextual findings are separate lists with separate id series',
  ok.extraction_findings.every((f) => f.id.startsWith('X-')) && ok.contextual_findings.findings.every((f) => f.id.startsWith('C-')));
t('every contextual finding is pending human disposition', ok.contextual_findings.findings.every((f) => ok.human_review.disposition.items[f.id]?.status === 'pending'));
t('sign-off starts unsigned and separate from disposition', ok.human_review.sign_off.status === 'not_signed' && ok.human_review.disposition.status === 'pending');
t('result carries quotation locations from source preparation', Array.isArray(ok.source.quotations) && ok.source.quotations.length === 1 && ok.source.quotations[0].line > 1);
t('result never carries the record text itself', !('text' in ok.source) && !JSON.stringify(ok).includes('Northgate Fabrication Ltd for temporary read access'));

// ---- no score, no verdict ------------------------------------------------------------------
const audits = [ok, await run(reply(good), { text: GAPS, profile: PROFILE }), partial, longR];
t('no score, no DRR figure, no overall verdict and no "ready" in any result', audits.every((r) => scoreAudit(r).length === 0), JSON.stringify(audits.map(scoreAudit).flat().slice(0, 3)));
t('no banned claim words in any result', audits.every((r) => !/compliant|certified|guaranteed|prevents|eliminates/i.test(JSON.stringify(r))));

// ---- extraction findings from the model-output checks ---------------------------------------
const fabricated = await run(reply({ ...good, flaws: [{ type: 'unsupported_content', excerpt: 'The supplier signed an NDA on 1 March 2026.', explanation: 'x' }] }));
const xf = fabricated.extraction_findings.find((f) => f.code === 'excerpt_not_in_record');
t('a quotation not in the record becomes an extraction finding, not a contextual one', xf && !fabricated.contextual_findings.findings.some((f) => f.kind === 'flaw'));
t('model-output checks are informational and need no disposition', xf && xf.needs_disposition === false && !(xf.id in fabricated.human_review.disposition.items));
const badType = await run(reply({ ...good, flaws: [{ type: 'bad_faith', excerpt: 'Access was granted on 4 March 2026', explanation: 'x' }] }));
t('a flaw type outside the permitted set is rejected and recorded', badType.extraction_findings.some((f) => f.code === 'rejected_flaw_type' && f.value === 'bad_faith'));
const gapsRun = await run(reply({ ...good, flaws: [] }), { text: GAPS, profile: PROFILE });
t('source-preparation findings appear as extraction findings needing disposition',
  gapsRun.extraction_findings.filter((f) => f.origin === 'source_prep').length >= 5 &&
  gapsRun.extraction_findings.filter((f) => f.origin === 'source_prep').every((f) => gapsRun.human_review.disposition.items[f.id]?.status === 'pending'));

// ---- incomplete model output ---------------------------------------------------------------
const missing = { ...good, conditions: cond() }; delete missing.conditions.temporal_reconstructability;
const miss = await run(reply(missing));
t('a missing condition makes the result incomplete, not partial',
  miss.status === 'incomplete' && miss.reason === 'model_output_incomplete' && /temporal_reconstructability/.test(miss.detail) && miss.contextual_findings === null);
const inv = await run(reply({ ...good, conditions: { ...cond(), basis_identification: { status: 'ok', note: 'x' } } }));
t('an invalid status makes the result incomplete', inv.status === 'incomplete' && /basis_identification/.test(inv.detail));
t('a cut-off model reply is reported and not parsed', (await run(reply(good, 'max_tokens'))).reason === 'model_output_truncated');
t('a non-JSON reply is reported, never guessed at', (await run(async () => ({ text: 'I think this record is fine.', stop_reason: 'end_turn' }))).reason === 'model_output_not_json');
const thrown = await run(async () => { throw new Error('provider down; key sk-test-should-not-echo'); });
t('a failed model call is incomplete and does not echo the error', thrown.status === 'incomplete' && !JSON.stringify(thrown).includes('sk-test'));
t('a reply without text is incomplete', (await run(async () => ({ stop_reason: 'end_turn' }))).reason === 'model_reply_malformed');

// ---- prohibited inference: emotion, intent, motive, payoff, clinical -------------------------
const samples = {
  emotion: 'The lead was frustrated with the security office.',
  intent: 'The lead deliberately skipped the questionnaire.',
  motive: 'The approval was motivated by a wish to keep the supplier.',
  payoff: 'The lead stood to gain from the contract.',
  clinical: 'The writing suggests a depressive state.',
};
t('every inference group has a sample', Object.keys(PROHIBITED_INFERENCE).every((g) => samples[g]));
for (const [group, sentence] of Object.entries(samples)) {
  const r = await run(reply({
    ...good,
    conditions: { ...cond(), basis_identification: { status: 'gap', note: sentence } },
    flaws: [{ type: 'reasoning_elision', excerpt: 'Access was granted on 4 March 2026', explanation: sentence }],
    revision_needed: sentence,
  }));
  const withheld = r.extraction_findings.filter((f) => f.code === 'withheld_prohibited_inference');
  t(`${group}: condition note, flaw explanation and revision text all withheld`,
    r.contextual_findings.conditions.basis_identification.note === null && r.contextual_findings.revision_needed === null &&
    !r.contextual_findings.findings.some((f) => f.kind === 'flaw') && withheld.length === 3 && withheld.every((w) => w.groups.includes(group)));
  t(`${group}: the withheld words appear nowhere in the result`, !JSON.stringify(r).includes(sentence));
}
const kept = await run(reply({ ...good, conditions: { ...cond(), basis_identification: { status: 'gap', note: samples.intent } } }));
t('a condition status is kept when only its note is withheld', kept.contextual_findings.conditions.basis_identification.status === 'gap');
t('record-describing notes are not withheld', ok.contextual_findings.conditions.basis_identification.note !== null);

// ---- human-review explanations ---------------------------------------------------------------
const flagged = ok.contextual_findings.findings;
t('every flagged condition and flaw carries a human-review explanation with a question', flagged.every((f) => f.explanation && f.explanation.question && f.explanation.meaning));
const cats = new Set(flagged.map((f) => f.explanation.category).filter(Boolean));
for (const c of ['missing_logical_bridge', 'missing_identifiable_basis', 'chronology_gap', 'insufficient_evidence', 'unsupported_conclusion']) {
  t(`explanation category reached: ${c}`, cats.has(c));
}
t('the five explanation categories are exactly the five requested', Object.keys(CATEGORIES).sort().join() === 'chronology_gap,insufficient_evidence,missing_identifiable_basis,missing_logical_bridge,unsupported_conclusion');
const crc = flagged.find((f) => f.condition === 'cold_reviewer_clarity');
t('cold_reviewer_clarity gets an explanation but no category (D-2: no established correspondence)', crc.explanation.category === null && /no established Codebook correspondence/.test(crc.explanation.meaning));
t('every explanation states that no Codebook correspondence is asserted', flagged.concat(gapsRun.extraction_findings).every((f) => f.explanation?.codebook_correspondence === 'not_asserted'));
t('every permitted flaw type has an explanation with a question', FLAW_TYPES.every((type) => explainFlaw(type)?.question));
t('no explanation text itself describes a person', allExplanationTexts().every((s) => Object.values(PROHIBITED_INFERENCE).every((re) => !re.test(s))));
t('every source-preparation finding has an explanation', gapsRun.extraction_findings.every((f) => f.explanation && f.explanation.question));

t('no network call was made during the whole run', net.calls === 0);
done();

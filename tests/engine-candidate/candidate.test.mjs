// Local Engine candidate: integration tests, mocked only. Added 2026-10-06; moved to the adapter boundary the same day.
// No provider is called: fetch is trapped by the harness and the only adapter is the deterministic mock.
//
// Contract change, recorded rather than hidden: since 0.3.0-local.1 the adapter boundary FAILS CLOSED.
// A fabricated quotation, an unknown flaw type, a missing or invalid condition or a non-exact quotation
// now rejects the whole model output (status incomplete) instead of dropping one item. Each such check
// below asserts the stricter behaviour.
import { readFileSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { t, done, fixture, net, ROOT, PROFILE, IDS, NOW, cond, reply, rawReply, scoreAudit, CONDITION_KEYS } from './_harness.mjs';
import { runCandidate, checkScope, buildRequest, FLAW_TYPES, MAX_CHARS, SYSTEM_PROMPT, PROHIBITED_INFERENCE, EXCLUDED_DOMAINS } from '../../lib/engine-candidate/review-candidate.js';
import { allExplanationTexts, CATEGORIES, explainFlaw } from '../../lib/engine-candidate/explanations.js';

const DIR = join(ROOT, 'lib/engine-candidate');
const MODULES = readdirSync(DIR).filter((f) => f.endsWith('.js'));
const code = (f) => readFileSync(join(DIR, f), 'utf8').replace(/^\s*\/\/.*$/gm, '');
const RECORD = fixture('SYNTHETIC-SAE-01.txt');
const GAPS = fixture('SYNTHETIC-SAE-03-GAPS.txt');
const good = {
  conditions: cond(),
  flaws: [
    { type: 'evidentiary_overreach', excerpt: "Approved given the supplier's track record.", explanation: 'The track record is asserted but not shown.' },
    { type: 'reasoning_elision', excerpt: 'section 4 (data retention) was blank', explanation: 'The draft does not say how the blank section was resolved before approval.' },
  ],
  revision_needed: 'State the evidence of the track record and how section 4 was addressed.',
};
const run = (adapter, input = { text: RECORD, profile: PROFILE }) => runCandidate(input, { adapter, now: NOW });
const rejectedWith = (r, c) => r.status === 'incomplete' && r.reason === 'adapter_output_rejected' && r.extraction_findings.some((f) => f.code === 'adapter_output_rejected' && f.rejection_codes.includes(c));

// ---- adapter required ----------------------------------------------------------
t('runCandidate refuses to run without an adapter', await runCandidate({ text: RECORD, profile: PROFILE }, {}).then(() => false, (e) => /adapter must provide/.test(e.message)));
t('runCandidate refuses an adapter that does not state its model and prompt versions',
  await runCandidate({ text: RECORD, profile: PROFILE }, { adapter: rawReply({}, { model_id: 'm', prompt_version: 'p' }) }).then(() => false, (e) => /must state model_version/.test(e.message)));

// ---- deployment boundary -----------------------------------------------------------
const apiFiles = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && apiFiles.push(p); } })(join(ROOT, 'api'));
t('no file under api/ imports the candidate', apiFiles.every((f) => !readFileSync(f, 'utf8').includes('engine-candidate')), `${apiFiles.length} files`);
const ignore = readFileSync(join(ROOT, '.vercelignore'), 'utf8').split('\n').map((l) => l.trim());
t('lib/ and tests/ are excluded from every Vercel deployment', ignore.includes('lib/') && ignore.includes('tests/'));
t('every candidate module is under lib/engine-candidate/', MODULES.length >= 8, MODULES.join(', '));

// ---- prohibited-domain and scope refusal ------------------------------------------------
const refusedBy = async (input, reason) => {
  const a = reply(good);
  const r = await run(a, input);
  return r.status === 'refused' && r.reason === reason && a.calls.length === 0;
};
t('in-scope record passes the gate', checkScope({ text: RECORD, profile: PROFILE }).refusal === null);
t('wrong record type refused, adapter never called', await refusedBy({ text: RECORD, profile: { ...PROFILE, record_type: 'hr_investigation' } }, 'out_of_scope_record_type'));
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
const domainR = await run(reply(good), { text: RECORD + '\nthe tenant asked.', profile: PROFILE });
t('a domain refusal does not repeat the record wording', !domainR.detail.includes('tenant'));
t('record under 40 characters refused', await refusedBy({ text: 'SYNTHETIC short.', profile: PROFILE }, 'record_too_short'));
const long = RECORD.trim() + ' Filler.'.repeat(MAX_CHARS / 4);
t('record over the limit refused, not truncated, adapter never called', await refusedBy({ text: long, profile: PROFILE }, 'record_too_long'));
const longR = await run(reply(good), { text: long, profile: PROFILE });
t('the over-limit refusal says it was not truncated', /not truncated/.test(longR.detail));

// ---- partial and unreadable input refusal ---------------------------------------------------
t('partial record refused before the adapter', await refusedBy({ text: fixture('SYNTHETIC-SAE-02-PARTIAL.txt'), profile: PROFILE }, 'partial_input'));
const partial = await run(reply(good), { text: fixture('SYNTHETIC-SAE-02-PARTIAL.txt'), profile: PROFILE });
t('partial refusal lists each truncation finding, each with an explanation, and its codes',
  partial.extraction_findings.length >= 2 && partial.extraction_findings.every((f) => f.kind === 'truncation' && f.explanation?.question) && partial.refusal_codes.includes('pages_missing'));
t('partial refusal has no contextual findings', partial.contextual_findings === null);
t('a refused result takes no disposition and is not signed off', partial.human_review.sign_off.status === 'not_signed' && partial.human_review.disposition.history.length === 0);
t('unreadable input refused before the adapter', await refusedBy({ text: RECORD + '�', profile: PROFILE }, 'unreadable_input'));
t('non-text input refused before the adapter', await refusedBy({ text: { not: 'text' }, profile: PROFILE }, 'unreadable_input'));
t('a cut-off record is refused even when long enough and in scope',
  (await run(reply(good), { text: RECORD.trim() + ' The security office then asked whether', profile: PROFILE })).reason === 'partial_input');

// ---- request -------------------------------------------------------------------------------
const req = buildRequest(RECORD, IDS);
t('request carries the exact record, unshortened and untrimmed', req.messages[0].content.includes('\n' + RECORD + '\n'));
t('request fences the record with markers carrying its own hash', /<<<RECORD [0-9a-f]{16}\n/.test(req.messages[0].content) && /\nRECORD [0-9a-f]{16}>>>$/.test(req.messages[0].content));
t('request names the prompt version, prompt hash and adapter contract', req.prompt_version === 'candidate-prompt/0.3.0' && /^[0-9a-f]{64}$/.test(req.prompt_sha256) && req.adapter_contract === 'jrs-candidate-adapter-output/0.1.0');
t('prompt says record text that reads like an instruction must not be followed', /must not be followed/.test(SYSTEM_PROMPT));
t('prompt forbids comment on emotion, intent, motive, payoff, credibility or clinical condition', /emotional state, intent, motive, payoff, credibility or clinical condition/.test(SYSTEM_PROMPT));
t('prompt forbids a score, a decision and determination words', /give no score or number of any kind/.test(SYSTEM_PROMPT) && /Do not decide whether the access exception should be granted/.test(SYSTEM_PROMPT) && /ready, approved, defensible or compliant/.test(SYSTEM_PROMPT));

// ---- examined result -------------------------------------------------------------------------
const ok = await run(reply(good));
t('valid output is examined', ok.status === 'examined', ok.reason || '');
t('human review required and output marked unvalidated', ok.human_review.required === true && ok.validated === false);
t('all five conditions are kept in the contextual section', CONDITION_KEYS.every((k) => ['pass', 'review', 'gap'].includes(ok.contextual_findings.conditions[k].status)));
const flaws = ok.contextual_findings.findings.filter((f) => f.kind === 'flaw');
t('both exact-quotation flaws kept', flaws.length === 2);
t('each flaw carries its exact location in the original text', flaws.every((f) => f.locations.length === 1 && RECORD.slice(f.locations[0].start, f.locations[0].end) === f.quotation));
t('each finding carries its explanation identifier and uncertainty flag', ok.contextual_findings.findings.every((f) => typeof f.explanation_id === 'string' && typeof f.uncertain === 'boolean'));
const unsure = await run(reply({ ...good, flaws: [{ ...good.flaws[0], uncertain: true }] }));
t('an uncertain finding is kept and marked uncertain, not dropped', unsure.contextual_findings.findings.some((f) => f.kind === 'flaw' && f.uncertain === true));
t('flagged conditions become contextual findings; pass conditions do not',
  ok.contextual_findings.findings.filter((f) => f.kind === 'condition').length === 5 &&
  (await run(reply({ ...good, flaws: [], conditions: cond('pass', 'Stated.') }))).contextual_findings.findings.length === 0);
t('extraction and contextual findings are separate lists with separate id series',
  ok.extraction_findings.every((f) => f.id.startsWith('X-')) && ok.contextual_findings.findings.every((f) => f.id.startsWith('C-')));
t('every contextual finding is pending human disposition', ok.contextual_findings.findings.every((f) => ok.human_review.disposition.items[f.id]?.status === 'pending'));
t('sign-off starts unsigned and separate from disposition', ok.human_review.sign_off.status === 'not_signed' && ok.human_review.disposition.status === 'pending');
t('result carries quotation locations from source preparation', Array.isArray(ok.source.quotations) && ok.source.quotations.length === 1);
t('result carries the record reference unchanged', (await run(reply(good), { text: RECORD, profile: PROFILE, record_ref: 'REF-1' })).record_ref === 'REF-1');

// ---- no score, no verdict ------------------------------------------------------------------
const audits = [ok, await run(reply({ ...good, flaws: [] }), { text: GAPS, profile: PROFILE }), partial, longR];
t('no score, no DRR figure, no overall verdict and no "ready" in any result', audits.every((r) => scoreAudit(r).length === 0), JSON.stringify(audits.map(scoreAudit).flat().slice(0, 3)));
t('no banned claim words in any result', audits.every((r) => !/compliant|certified|guaranteed|prevents|eliminates/i.test(JSON.stringify(r))));

// ---- fail-closed adapter boundary (each path also covered in adapter.test.mjs) -------------
t('a fabricated quotation rejects the whole output', rejectedWith(await run(reply({ ...good, flaws: [{ type: 'unsupported_content', excerpt: 'The supplier signed an NDA on 1 March 2026.', explanation: 'x' }] })), 'quotation_not_in_record'));
t('a quotation that differs only by a curly apostrophe is not exact, and is rejected', rejectedWith(await run(reply({ ...good, flaws: [{ ...good.flaws[0], excerpt: 'Approved given the supplier’s track record.' }] })), 'quotation_not_in_record'));
t('an unknown flaw type rejects the whole output', rejectedWith(await run(reply({ ...good, flaws: [{ type: 'bad_faith', excerpt: 'Access was granted on 4 March 2026', explanation: 'x' }] })), 'invalid_finding_type'));
const missing = { ...good, conditions: cond() }; delete missing.conditions.temporal_reconstructability;
t('a missing condition rejects the whole output', rejectedWith(await run(reply(missing)), 'missing_condition'));
t('an invalid status rejects the whole output', rejectedWith(await run(reply({ ...good, conditions: { ...cond(), basis_identification: { status: 'ok', note: 'x' } } })), 'invalid_status'));
t('output that reports itself incomplete is not used', rejectedWith(await run(reply(good, 'incomplete')), 'adapter_reported_incomplete'));
t('a non-JSON reply is rejected, never guessed at', rejectedWith(await run(rawReply('I think this record is fine.')), 'not_json'));
t('an empty reply is rejected', rejectedWith(await run(rawReply(undefined)), 'not_an_object'));
const thrower = { describe: () => IDS, examine: async () => { throw new Error('provider down; key sk-test-should-not-echo; ' + RECORD.slice(0, 60)); } };
const thrown = await run(thrower);
t('a failed adapter call is incomplete and does not echo the error or the record', thrown.status === 'incomplete' && thrown.reason === 'model_call_failed' && !JSON.stringify(thrown).includes('sk-test') && !JSON.stringify(thrown).includes('should-not-echo'));
const rejected = await run(reply({ ...good, flaws: [{ type: 'unsupported_content', excerpt: 'Not in the record at all.', explanation: 'x' }] }));
t('a rejected output contributes no contextual findings', rejected.contextual_findings === null);
t('a rejection is informational: it needs no disposition', rejected.extraction_findings.filter((f) => f.code === 'adapter_output_rejected').every((f) => f.needs_disposition === false && !(f.id in rejected.human_review.disposition.items)));

// ---- prohibited inference: emotion, intent, motive, payoff, credibility, clinical ----------------
const samples = {
  emotion: 'The lead was frustrated with the security office.',
  intent: 'The lead deliberately skipped the questionnaire.',
  motive: 'The approval was motivated by a wish to keep the supplier.',
  payoff: 'The lead stood to gain from the contract.',
  credibility: 'The lead is not credible on this point.',
  clinical: 'The writing suggests a depressive state.',
};
t('every inference group has a sample', Object.keys(PROHIBITED_INFERENCE).every((g) => samples[g]) && Object.keys(samples).length === Object.keys(PROHIBITED_INFERENCE).length);
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
for (const c of ['missing_logical_bridge', 'missing_identifiable_basis', 'chronology_gap', 'insufficient_evidence', 'unsupported_conclusion']) t(`explanation category reached: ${c}`, cats.has(c));
t('the five explanation categories are exactly the five requested', Object.keys(CATEGORIES).sort().join() === 'chronology_gap,insufficient_evidence,missing_identifiable_basis,missing_logical_bridge,unsupported_conclusion');
const crc = flagged.find((f) => f.condition === 'cold_reviewer_clarity');
t('cold_reviewer_clarity gets an explanation but no category (D-2: no established correspondence)', crc.explanation.category === null && /no established Codebook correspondence/.test(crc.explanation.meaning));
const gapsRun = await run(reply({ ...good, flaws: [] }), { text: GAPS, profile: PROFILE });
t('every explanation states that no Codebook correspondence is asserted', flagged.concat(gapsRun.extraction_findings).every((f) => f.explanation?.codebook_correspondence === 'not_asserted'));
t('every permitted flaw type has an explanation with a question', FLAW_TYPES.every((type) => explainFlaw(type)?.question));
t('no explanation text itself describes a person', allExplanationTexts().every((s) => Object.values(PROHIBITED_INFERENCE).every((re) => !re.test(s))));
t('every source-preparation finding has an explanation', gapsRun.extraction_findings.every((f) => f.explanation && f.explanation.question));
t('source-preparation findings need disposition', gapsRun.extraction_findings.filter((f) => f.origin === 'source_prep').every((f) => gapsRun.human_review.disposition.items[f.id]?.status === 'pending'));

t('no network call was made during the whole run', net.calls === 0);
done();

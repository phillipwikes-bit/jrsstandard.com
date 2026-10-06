// Adversarial consistency and integrity harness: mocked tests. Added 2026-10-06.
// Failure codes that need a broken candidate to occur (input, identity or text mutation,
// omitted preparation findings) are proved by the mutation runner instead
// (tests/engine-candidate/mutation/run-mutations.mjs), which breaks a copy of the code.
import { t, done, fixture, net, PROFILE, IDS, NOW, cond, toAdapterOutput, reply, rawReply } from './_harness.mjs';
import { runConsistencyHarness, HARNESS_VERSION } from '../../lib/engine-candidate/harness.js';
import { runCandidate } from '../../lib/engine-candidate/review-candidate.js';
import { createMockAdapter } from '../../lib/engine-candidate/mock-adapter.js';

const RECORD = fixture('SYNTHETIC-SAE-01.txt');
const GAPS = fixture('SYNTHETIC-SAE-03-GAPS.txt');
const input = { text: RECORD, profile: PROFILE, record_ref: 'TEST-REF-7' };
const allPass = { conditions: cond('pass', 'Stated.'), flaws: [] };
const chronoGap = { conditions: { ...cond('pass', 'Stated.'), temporal_reconstructability: { status: 'gap', note: 'Order unclear.' } },
  flaws: [{ type: 'chronology_collapse', excerpt: 'Access was granted on 4 March 2026', explanation: 'Grant timing not explained.' }] };
const chronoReview = { ...chronoGap, conditions: { ...chronoGap.conditions, temporal_reconstructability: { status: 'review', note: 'Order unclear.' } } };
const H = (variants, inp = input) => runConsistencyHarness({ input: inp, now: NOW, variants: variants.map((a, i) => ({ variant_id: 'V' + i, adapter: a })) });

const same = await H([reply(chronoGap), reply(chronoGap)]);
t('identical variants are consistent', same.status === 'consistent' && same.failure_codes.length === 0 && same.disagreements.length === 0);
t('the harness record states it is a software control, not reliability evidence', /Not evidence of real-world reliability/.test(same.statement) && same.harness_version === HARNESS_VERSION);
t('the harness record carries the record reference and per-variant review ids', same.record_ref === 'TEST-REF-7' && same.variant_outcomes.every((o) => /^[0-9a-f]{24}$/.test(o.review_id)));
t('the harness record never carries record text', !JSON.stringify(same).includes('Northgate'));

const disagree = await H([reply(chronoGap), reply(chronoReview)]);
t('gap against review is a disagreement, not a contradiction', disagree.status === 'consistent' && disagree.disagreements.includes('temporal_reconstructability'));
const contra = await H([reply(allPass), reply(chronoGap)]);
t('pass against gap is a contradiction and fails closed', contra.status === 'review_incomplete' && contra.failure_codes.includes('contradictory_classification'));
const internal = await H([reply({ conditions: cond('pass', 'Stated.'), flaws: chronoGap.flaws })]);
t('a pass condition alongside a finding of its own category is an internal contradiction', internal.status === 'review_incomplete' && internal.failure_codes.includes('internal_contradiction'));
t('cold_reviewer_clarity has no category, so it cannot raise an internal contradiction',
  (await H([reply({ conditions: cond('pass', 'Stated.'), flaws: [{ type: 'extraction_omission', excerpt: 'Access was granted on 4 March 2026', explanation: 'x' }] })])).status === 'consistent');

const fabricated = await H([reply({ ...chronoGap, flaws: [{ type: 'unsupported_content', excerpt: 'Not in this record anywhere.', explanation: 'x' }] })]);
t('an unsupported quotation fails closed', fabricated.status === 'review_incomplete' && fabricated.failure_codes.includes('unsupported_quotation') && fabricated.failure_codes.includes('adapter_output_rejected'));
const noQuote = await H([reply({ ...chronoGap, flaws: [{ type: 'unsupported_content', excerpt: '', explanation: 'x' }] })]);
t('a finding with no quotation fails closed', noQuote.failure_codes.includes('quotation_absent'));
const malformed = await H([reply(chronoGap), rawReply('{"adapter_contract":')]);
t('one malformed variant makes the whole record review-incomplete', malformed.status === 'review_incomplete' && malformed.failure_codes.includes('adapter_output_rejected'));
const throwing = await H([{ describe: () => IDS, examine: async () => { throw new Error('down'); } }]);
t('a throwing adapter fails closed', throwing.status === 'review_incomplete' && throwing.failure_codes.includes('adapter_call_failed'));

let n = 0;
const drifting = createMockAdapter({ ...IDS, respond: () => toAdapterOutput(n++ % 2 ? chronoGap : chronoReview) });
const nd = await H([drifting]);
t('a variant that answers differently on a repeat run is nondeterministic and fails closed', nd.status === 'review_incomplete' && nd.failure_codes.includes('nondeterministic_output'));

const refusedInput = { text: fixture('SYNTHETIC-SAE-02-PARTIAL.txt'), profile: PROFILE, record_ref: 'TEST-REF-8' };
const spy = reply(allPass);
const ref = await H([spy, reply(chronoGap)], refusedInput);
t('a refused record is not examined, and no variant reaches the adapter', ref.status === 'not_examined' && spy.calls.length === 0);

const gapsRec = await H([reply({ conditions: cond('review', 'Partial.'), flaws: [] })], { text: GAPS, profile: PROFILE });
t('source-preparation findings are carried through in full (no prep failure omitted)', gapsRec.status === 'consistent' && !gapsRec.failure_codes.includes('prep_failure_omitted'));
t('the input object is left unchanged', JSON.stringify(input) === JSON.stringify({ text: RECORD, profile: PROFILE, record_ref: 'TEST-REF-7' }));

// ---- each integrity detector fires against a deliberately tampered candidate -------------------
// The harness checks whatever candidate it is given; these wrappers break one invariant each.
const tampered = (fn) => async (inp, opts) => fn(await runCandidate(inp, opts), inp);
const HT = (candidate, variants = [reply(chronoGap)], inp = input) => runConsistencyHarness({ input: inp, now: NOW, candidate, variants: variants.map((a, i) => ({ variant_id: 'T' + i, adapter: a })) });
const gapsInput = { text: GAPS, profile: PROFILE, record_ref: 'TEST-REF-9' };
const dropPrep = await HT(tampered((r) => ({ ...r, extraction_findings: r.extraction_findings.filter((f) => f.origin !== 'source_prep') })), [reply({ conditions: cond('review', 'Partial.'), flaws: [] })], gapsInput);
t('detects a candidate that silently drops source-preparation failures', dropPrep.status === 'review_incomplete' && dropPrep.failure_codes.includes('prep_failure_omitted'));
const badId = await HT(tampered((r) => ({ ...r, review_identity: { ...r.review_identity, candidate_version: '9.9.9' } })));
t('detects a changed review-version identity', badId.status === 'review_incomplete' && badId.failure_codes.includes('identity_mutated'));
const badRef = await HT(tampered((r) => ({ ...r, record_ref: 'OTHER' })));
t('detects a changed record identifier', badRef.status === 'review_incomplete' && badRef.failure_codes.includes('identifier_mutated'));
const badHash = await HT(tampered((r) => ({ ...r, source: { ...r.source, sha256: '0'.repeat(64) } })));
t('detects a result that does not hash the input text', badHash.status === 'review_incomplete' && badHash.failure_codes.includes('record_text_mutated'));
const mutInput = { ...input, profile: { ...PROFILE } };
const badInput = await HT(tampered((r, inp) => { inp.profile.extra = 1; return r; }), [reply(chronoGap)], mutInput);
t('detects a candidate that writes to its input', badInput.status === 'review_incomplete' && badInput.failure_codes.includes('input_mutated'));
const sneaky = async (inp, opts) => { await opts.adapter.examine({ messages: [{ content: 'x' }] }); return runCandidate(inp, opts); };
const leaked = await HT(sneaky, [reply(allPass)], refusedInput);
t('detects a candidate that sends a refused record to the adapter', leaked.status === 'review_incomplete' && leaked.failure_codes.includes('refused_but_adapter_called'));
const sentWrong = async (inp, opts) => runCandidate(inp, { ...opts, adapter: { describe: opts.adapter.describe, examine: (q) => opts.adapter.examine({ ...q, messages: [{ ...q.messages[0], content: q.messages[0].content.replace(/\s+/g, ' ') }] }) } });
const wrongText = await HT(sentWrong);
t('detects a candidate that sends altered text to the adapter', wrongText.status === 'review_incomplete' && wrongText.failure_codes.includes('record_text_mutated'));
t('the default candidate passes the same checks', (await HT(undefined)).status === 'consistent');

t('no network call was made', net.calls === 0);
done();

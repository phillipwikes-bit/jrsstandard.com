// Model-adapter boundary: one mocked test for every rejection path. Added 2026-10-06.
// No live provider exists; every adapter here is a mock.
import { t, done, net, IDS, CONDITION_KEYS } from './_harness.mjs';
import { validateAdapterOutput, assertAdapter, explanationIdFor, ADAPTER_CONTRACT, DETERMINATION } from '../../lib/engine-candidate/adapter.js';

const TEXT = 'CONSTRUCTED TEST RECORD. On 3 May 2026 the supplier requested access. The exception was approved on 4 May 2026 because the work was urgent.';
const base = () => ({
  adapter_contract: ADAPTER_CONTRACT, ...IDS, completion: 'complete',
  conditions: Object.fromEntries(CONDITION_KEYS.map((k) => [k, { status: 'review', explanation_id: explanationIdFor('condition', k), note: 'The record states this only in part.', uncertain: false }])),
  findings: [{ type: 'reasoning_elision', quotation: 'because the work was urgent', explanation_id: 'missing_logical_bridge', note: 'The step from urgency to approval is not stated.', uncertain: false }],
  revision_needed: 'State why urgency outweighed the missing step.',
});
const v = (o, text = TEXT) => validateAdapterOutput(o, text, IDS);
const rejects = (mutate, code, text) => { const o = base(); mutate(o); const r = v(o, text); return r.ok === false && r.codes.includes(code); };

t('a well-formed output is accepted', v(base()).ok === true);
t('a well-formed output given as a JSON string is accepted', v(JSON.stringify(base())).ok === true);

// ---- malformed or partial output -------------------------------------------------------
t('rejects: cut-off JSON (not_json)', v(JSON.stringify(base()).slice(0, 80)).codes?.includes('not_json'));
t('rejects: prose instead of JSON (not_json)', v('The record looks fine to me.').codes?.includes('not_json'));
t('rejects: nothing at all (not_an_object)', v(undefined).codes?.includes('not_an_object'));
t('rejects: an array (not_an_object)', v([base()]).codes?.includes('not_an_object'));
t('rejects: output that reports itself incomplete', rejects((o) => { o.completion = 'incomplete'; }, 'adapter_reported_incomplete'));
t('rejects: a missing or invented completion state', rejects((o) => { delete o.completion; }, 'invalid_completion') && rejects((o) => { o.completion = 'mostly'; }, 'invalid_completion'));
t('rejects: a missing conditions block', rejects((o) => { delete o.conditions; }, 'missing_condition'));
t('rejects: one condition missing', rejects((o) => { delete o.conditions.temporal_reconstructability; }, 'missing_condition'));
t('rejects: a missing findings list', rejects((o) => { delete o.findings; }, 'missing_findings'));
t('rejects: a finding that is not an object', rejects((o) => { o.findings.push('extra'); }, 'invalid_finding'));

// ---- identity ---------------------------------------------------------------------------
t('rejects: the wrong contract version', rejects((o) => { o.adapter_contract = 'other/1.0'; }, 'wrong_contract'));
for (const k of ['model_id', 'model_version', 'prompt_version']) {
  t(`rejects: missing ${k}`, rejects((o) => { delete o[k]; }, 'missing_identity'));
  t(`rejects: ${k} different from what the adapter declared`, rejects((o) => { o[k] = 'something-else'; }, 'identity_mismatch'));
}

// ---- free-form verdicts and scores -------------------------------------------------------
for (const k of ['verdict', 'summary', 'decision', 'determination', 'overall', 'recommendation']) t(`rejects: free-form top-level field "${k}"`, rejects((o) => { o[k] = 'text'; }, 'unknown_field'));
t('rejects: a score field', rejects((o) => { o.score = 4; }, 'unknown_field') && rejects((o) => { o.score = 4; }, 'numeric_value'));
t('rejects: a number hidden inside a note field', rejects((o) => { o.conditions.basis_identification.note = 3; }, 'numeric_value'));
t('rejects: a confidence number on a finding', rejects((o) => { o.findings[0].confidence = 0.9; }, 'unknown_field') && rejects((o) => { o.findings[0].confidence = 0.9; }, 'numeric_value'));
t('rejects: an extra field on a condition', rejects((o) => { o.conditions.basis_identification.verdict = 'ok'; }, 'unknown_field'));
t('rejects: a sixth condition', rejects((o) => { o.conditions.overall_quality = { status: 'pass', explanation_id: 'x', note: 'x', uncertain: false }; }, 'unknown_field'));

// ---- determination language ----------------------------------------------------------------
const words = ['The record is ready for sign-off.', 'The exception is approved.', 'This draft is defensible.', 'The record is compliant.', 'The record is certified.',
  'The record is acceptable.', 'The record should be approved.', 'Approve the exception.', 'The record is audit-proof.'];
for (const w of words) t(`rejects determination language in a condition note: "${w}"`, rejects((o) => { o.conditions.basis_identification.note = w; }, 'determination_language'));
t('rejects determination language in a finding note', rejects((o) => { o.findings[0].note = 'Otherwise the record is ready.'; }, 'determination_language'));
t('rejects determination language in revision_needed', rejects((o) => { o.revision_needed = 'Then it is defensible.'; }, 'determination_language'));
t('accepts a note that only describes what the record says was approved', v((() => { const o = base(); o.conditions.basis_identification.note = 'The record says the exception was approved on 4 May 2026 but not on what basis.'; return o; })()).ok === true);
t('quotations are exempt: record text may contain any word', v((() => { const o = base(); o.findings[0].quotation = 'The exception was approved on 4 May 2026'; return o; })()).ok === true);
t('the determination pattern does not fire on "already"', !DETERMINATION.test('The access was already granted.'));

// ---- conditions ----------------------------------------------------------------------------
t('rejects: an invalid status', rejects((o) => { o.conditions.basis_identification.status = 'ok'; }, 'invalid_status'));
t('rejects: a condition explanation id that does not match the condition', rejects((o) => { o.conditions.basis_identification.explanation_id = 'chronology_gap'; }, 'invalid_explanation_id'));
t('cold_reviewer_clarity takes its own key as explanation id, not a category', explanationIdFor('condition', 'cold_reviewer_clarity') === 'cold_reviewer_clarity');
t('rejects: a missing condition note', rejects((o) => { delete o.conditions.basis_identification.note; }, 'missing_note'));
t('rejects: uncertainty that is not true or false', rejects((o) => { o.conditions.basis_identification.uncertain = 'maybe'; }, 'invalid_uncertainty'));

// ---- findings and quotations ----------------------------------------------------------------
t('rejects: a finding type outside the permitted list', rejects((o) => { o.findings[0].type = 'bad_faith'; }, 'invalid_finding_type'));
t('rejects: a finding explanation id that does not match its type', rejects((o) => { o.findings[0].explanation_id = 'chronology_gap'; }, 'invalid_explanation_id'));
t('rejects: a finding with no quotation', rejects((o) => { delete o.findings[0].quotation; }, 'missing_quotation'));
t('rejects: a finding with an empty quotation', rejects((o) => { o.findings[0].quotation = '   '; }, 'missing_quotation'));
t('rejects: a quotation not in the record', rejects((o) => { o.findings[0].quotation = 'The supplier signed an NDA.'; }, 'quotation_not_in_record'));
t('rejects: a quotation that is not character-exact (case)', rejects((o) => { o.findings[0].quotation = 'Because the work was urgent'; }, 'quotation_not_in_record'));
t('rejects: a quotation that is not character-exact (whitespace)', rejects((o) => { o.findings[0].quotation = 'because  the work was urgent'; }, 'quotation_not_in_record'));
t('rejects: a finding with no note', rejects((o) => { delete o.findings[0].note; }, 'missing_note'));
t('rejects: a finding uncertainty that is not true or false', rejects((o) => { delete o.findings[0].uncertain; }, 'invalid_uncertainty'));
t('rejects: a revision that is not text', rejects((o) => { o.revision_needed = ['x']; }, 'invalid_revision'));

// ---- fail closed, every reason listed --------------------------------------------------------
const many = base(); many.verdict = 'approved'; many.findings[0].quotation = 'invented'; many.conditions.basis_identification.status = 'great';
const mr = v(many);
t('several faults are all listed, and none of the output is kept', mr.ok === false && ['unknown_field', 'quotation_not_in_record', 'invalid_status'].every((c) => mr.codes.includes(c)) && !('output' in mr));
t('rejection details name fields, never record text', mr.details.every((d) => !d.includes('supplier requested access')));

// ---- adapter shape ---------------------------------------------------------------------------
const thrown = (fn) => { try { fn(); return ''; } catch (e) { return e.message; } };
t('assertAdapter rejects a missing adapter', /must provide describe\(\) and examine\(\)/.test(thrown(() => assertAdapter(undefined))));
t('assertAdapter rejects an adapter without describe()', /must provide/.test(thrown(() => assertAdapter({ examine: async () => ({}) }))));
t('assertAdapter rejects an adapter that omits a version', /must state prompt_version/.test(thrown(() => assertAdapter({ examine: async () => ({}), describe: () => ({ model_id: 'm', model_version: '1' }) }))));

t('no network call was made', net.calls === 0);
done();

// Versioned result contract: version separation and human-disposition preservation. Mocked only. Added 2026-10-06.
import { t, done, fixture, net, PROFILE, IDS, NOW, cond, toAdapterOutput } from './_harness.mjs';
import { createMockAdapter } from '../../lib/engine-candidate/mock-adapter.js';
import { ADAPTER_CONTRACT } from '../../lib/engine-candidate/adapter.js';
import { runCandidate, CANDIDATE_VERSION, PROMPT_SHA256, PROMPT_VERSION } from '../../lib/engine-candidate/review-candidate.js';
import { recordDisposition, signOff, reviewIdentity, CONTRACT_VERSION } from '../../lib/engine-candidate/contract.js';
import { SOURCE_PREP_VERSION } from '../../lib/engine-candidate/source-prep.js';
import { EXPLANATION_SET_VERSION } from '../../lib/engine-candidate/explanations.js';

const RECORD = fixture('SYNTHETIC-SAE-01.txt');
const good = {
  conditions: { ...cond('pass', 'Stated.'), basis_identification: { status: 'gap', note: 'The track record is not in the record.' } },
  flaws: [{ type: 'evidentiary_overreach', excerpt: "Approved given the supplier's track record.", explanation: 'Asserted, not shown.' }],
  revision_needed: 'State the evidence of the track record.',
};
const adapterFor = (model_id = IDS.model_id) => { const ids = { ...IDS, model_id }; return createMockAdapter({ ...ids, respond: () => toAdapterOutput(good, ids) }); };
const run = (model = IDS.model_id, text = RECORD, now = NOW) => runCandidate({ text, profile: PROFILE }, { adapter: adapterFor(model), now });
const MODEL = IDS.model_id + '@' + IDS.model_version;
const freeze = (o) => JSON.stringify(o);

// ---- version identity ----------------------------------------------------------------
const a = await run();
const id = a.review_identity;
t('result declares its contract version', a.contract_version === CONTRACT_VERSION && id.contract_version === CONTRACT_VERSION);
t('review identity names every version that produced it',
  id.candidate_version === CANDIDATE_VERSION && id.source_prep_version === SOURCE_PREP_VERSION && id.explanation_set_version === EXPLANATION_SET_VERSION &&
  id.prompt_sha256 === PROMPT_SHA256 && id.prompt_version === PROMPT_VERSION && id.adapter_contract === ADAPTER_CONTRACT && id.model === MODEL && /d2da83c/.test(id.derived_from));
t('the same source and versions give the same review_id', (await run()).review_identity.review_id === id.review_id);
const bModel = await run('mock-model-1');
const bText = await run(IDS.model_id, RECORD.replace('four weeks', 'five weeks'));
t('a different model gives a different review_id', bModel.review_identity.review_id !== id.review_id);
t('a different source gives a different review_id', bText.review_identity.review_id !== id.review_id);
const versions = { candidate_version: CANDIDATE_VERSION, source_prep_version: SOURCE_PREP_VERSION, explanation_set_version: EXPLANATION_SET_VERSION,
                   prompt_sha256: PROMPT_SHA256, prompt_version: PROMPT_VERSION, adapter_contract: ADAPTER_CONTRACT, model: MODEL, derived_from: id.derived_from };
const sha = a.source.sha256;
t('changing any one version changes the review_id', ['candidate_version', 'source_prep_version', 'explanation_set_version', 'prompt_sha256', 'prompt_version', 'adapter_contract', 'model'].every((k) =>
  reviewIdentity({ ...versions, [k]: 'changed' }, sha).review_id !== reviewIdentity(versions, sha).review_id));
t('examined_at is outside the identity, so re-running later keeps the same review_id',
  (await run(IDS.model_id, RECORD, () => '2027-01-01T00:00:00Z')).review_identity.review_id === id.review_id);

// ---- disposition is bound to one review version ------------------------------------------
const fid = a.contextual_findings.findings[0].id;
const d = { review_id: id.review_id, finding_id: fid, decision: 'confirmed', reviewer: 'Reviewer A', at: '2026-10-06T10:00:00Z', note: 'Basis absent.' };
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message); } };
t('a disposition made on one review version cannot be applied to another', throws(() => recordDisposition(bModel, { ...d, review_id: id.review_id }), /review_version_mismatch/));
const a1 = recordDisposition(a, d);
t('a new version starts with every finding pending, untouched by dispositions on the old one',
  Object.values(bModel.human_review.disposition.items).every((i) => i.status === 'pending') && bModel.human_review.disposition.history.length === 0);

// ---- disposition preservation ---------------------------------------------------------------
const aBefore = freeze(a);
recordDisposition(a, d);
t('recording a disposition never changes the result it was given', freeze(a) === aBefore);
t('the disposition is recorded with reviewer, time and note', a1.human_review.disposition.items[fid].status === 'confirmed' &&
  a1.human_review.disposition.history[0].reviewer === 'Reviewer A' && a1.human_review.disposition.history[0].note === 'Basis absent.');
t('findings themselves are unchanged by a disposition', freeze(a1.contextual_findings) === freeze(a.contextual_findings) && freeze(a1.extraction_findings) === freeze(a.extraction_findings));
const a2 = recordDisposition(a1, { ...d, decision: 'needs_more_information', reviewer: 'Reviewer B', at: '2026-10-06T11:00:00Z', note: null });
t('changing a decision appends to the history and keeps the earlier entry', a2.human_review.disposition.history.length === 2 &&
  a2.human_review.disposition.history[0].decision === 'confirmed' && a2.human_review.disposition.history[1].replaces === 'confirmed');
t('an invalid decision is refused', throws(() => recordDisposition(a, { ...d, decision: 'approved' }), /invalid_disposition/));
t('a disposition needs a named reviewer and a time', throws(() => recordDisposition(a, { ...d, reviewer: ' ' }), /reviewer is required/) && throws(() => recordDisposition(a, { ...d, at: '' }), /at is required/));
t('an unknown finding is refused', throws(() => recordDisposition(a, { ...d, finding_id: 'C-999' }), /unknown_finding/));

// ---- sign-off is separate from disposition -----------------------------------------------------
const so = { review_id: id.review_id, reviewer: 'Reviewer A', at: '2026-10-06T12:00:00Z', statement: 'I reviewed every finding against the record.' };
const pendingIds = Object.keys(a2.human_review.disposition.items).filter((k) => a2.human_review.disposition.items[k].status === 'pending');
t('sign-off is refused while any finding is pending', pendingIds.length > 0 && throws(() => signOff(a2, so), /dispositions_pending/));
let all = a2;
for (const k of pendingIds) all = recordDisposition(all, { ...d, finding_id: k, decision: 'not_confirmed', at: '2026-10-06T11:30:00Z' });
t('disposition complete does not mean signed off', all.human_review.disposition.status === 'complete' && all.human_review.sign_off.status === 'not_signed');
const allBefore = freeze(all);
const signed = signOff(all, so);
t('sign-off never changes the result it was given', freeze(all) === allBefore);
t('sign-off is recorded with reviewer, time, statement and its stated meaning',
  signed.human_review.sign_off.status === 'signed' && signed.human_review.sign_off.reviewer === 'Reviewer A' && /not an access decision/.test(signed.human_review.sign_off.meaning));
t('sign-off keeps every disposition and the full history', freeze(signed.human_review.disposition) === freeze(all.human_review.disposition));
t('after sign-off, dispositions are closed', throws(() => recordDisposition(signed, { ...d, at: '2026-10-06T13:00:00Z' }), /result_signed_off/));
t('sign-off cannot be repeated', throws(() => signOff(signed, so), /already_signed_off/));
t('sign-off cannot be applied with another version’s review_id', throws(() => signOff(all, { ...so, review_id: bModel.review_identity.review_id }), /review_version_mismatch/));
t('sign-off needs a statement', throws(() => signOff(all, { ...so, statement: '' }), /statement is required/));
t('sign-off is still unvalidated output', signed.validated === false && signed.human_review.required === true);

// ---- refused results ---------------------------------------------------------------------------
const refused = await runCandidate({ text: RECORD + '\nthe tenant asked.', profile: PROFILE }, { adapter: adapterFor(), now: NOW });
t('a refused result takes no disposition', throws(() => recordDisposition(refused, { ...d, review_id: refused.review_identity.review_id }), /only an examined result/));
t('a refused result cannot be signed off', throws(() => signOff(refused, { ...so, review_id: refused.review_identity.review_id }), /only an examined result/));

t('no network call was made', net.calls === 0);
done();

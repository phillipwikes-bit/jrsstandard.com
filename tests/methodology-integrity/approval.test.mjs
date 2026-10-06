// Approved-mapping requirements, unsupported-mapping refusal, source-hash binding, and the
// resolver: a mapped label renders only from a complete approved record.
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { t, done, ROOT, ctx, validate, resolve, build, approvedFixture, clone, SOURCE_REGISTER, REGISTER } from './_helpers.mjs';

const v = (r) => validate.validateRecord(r, ctx);
const refused = (f, re) => { const r = approvedFixture(); f(r); const p = v(r); return p.some((x) => re.test(x)); };
t('a complete approved record passes every rule', v(approvedFixture()).length === 0, v(approvedFixture()).join(' | '));

// ---- approval requirements -----------------------------------------------------------------------
t('refused: approved without a source hash', refused((r) => { r.methodology_source_sha256 = null; }, /without a source hash|does not match/));
t('refused: approved without an owner approval date', refused((r) => { r.owner_approval.approval_date = null; }, /without an owner approval date/));
t('refused: approved with an impossible date', refused((r) => { r.owner_approval.approval_date = '2026-02-30'; }, /owner approval date/));
t('refused: approved status without owner approval', refused((r) => { r.owner_approval.approved = false; }, /without owner approval/));
t('refused: approved without an approver', refused((r) => { r.owner_approval.approver = null; }, /without an approver/));
t('refused: approved without an approval reference', refused((r) => { r.owner_approval.approval_reference = null; }, /without an approval reference/));
t('refused: an approval reference that is not a file in the repository', refused((r) => { r.owner_approval.approval_reference = 'docs/owner-approval-that-does-not-exist.md'; }, /not a file/));
t('refused: approved without a methodology source', refused((r) => { r.methodology_source_id = null; r.methodology_source_sha256 = null; }, /without a methodology source/));
t('refused: approved against a source that is not CANONICAL', refused((r) => { const s = SOURCE_REGISTER.sources.find((x) => x.id === 'SRC-CONDITIONS-JSON'); r.methodology_source_id = s.id; r.methodology_source_sha256 = s.sha256; }, /not CANONICAL/));
t('refused: approved against a term the source does not define', refused((r) => { r.authoritative_source_term = 'Cold Reviewer Clarity'; }, /does not define/));
t('refused: approved without an exact source location', refused((r) => { r.source_reference = null; }, /exact source reference/));
t('refused: approved with NO_CORRESPONDENCE_ASSERTED', refused((r) => { r.mapping_type = 'NO_CORRESPONDENCE_ASSERTED'; }, /no correspondence type/));

// ---- unapproved records ---------------------------------------------------------------------------
const unapproved = (f) => { const r = approvedFixture(); r.status = 'PROPOSED_NOT_APPROVED'; r.owner_approval = { approved: false, approver: null, approval_date: null, approval_reference: null };
  r.authoritative_source_term = null; r.source_reference = null; r.mapping_type = 'NO_CORRESPONDENCE_ASSERTED'; r.limitation = validate.NOTICE;
  r.proposal = { proposed_source_id: 'SRC-CODEBOOK', proposed_source_term: 'Basis Identification', reference: 'fixture', note: 'fixture' }; f(r); return v(r); };
t('an unapproved proposal with no correspondence asserted passes', unapproved(() => {}).length === 0, unapproved(() => {}).join(' | '));
t('refused: an unapproved record using EXACT_LABEL', unapproved((r) => { r.mapping_type = 'EXACT_LABEL'; }).some((p) => /requires an approved record/.test(p)));
t('refused: an unapproved record using DOCUMENTED_ALIAS', unapproved((r) => { r.mapping_type = 'DOCUMENTED_ALIAS'; }).some((p) => /requires an approved record/.test(p)));
t('refused: an unapproved record carrying an approval date', unapproved((r) => { r.owner_approval.approval_date = '2026-10-06'; }).some((p) => /approval fields set/.test(p)));
t('refused: an unapproved record naming an authoritative term (a hidden mapping)', unapproved((r) => { r.authoritative_source_term = 'Evidentiary Sufficiency'; }).some((p) => /names an authoritative term/.test(p)));
t('refused: an unapproved record without the unmapped notice', unapproved((r) => { r.limitation = 'Maybe the same thing.'; }).some((p) => /must state/.test(p)));
t('refused: a proposal record without its proposal', unapproved((r) => { r.proposal = null; }).some((p) => /without its proposal/.test(p)));
const twice = clone(REGISTER); twice.records.push({ ...clone(twice.records.find((r) => r.candidate_term === 'cold_reviewer_clarity' && r.status === 'UNMAPPED')), correspondence_id: 'MC-901' });
t('refused: a second current record for the same term', validate.validateRegister(twice, ctx).some((p) => /second current record/.test(p)));

// ---- source-hash binding --------------------------------------------------------------------------
const drifted = ctx.sources.map((s) => s.id === 'SRC-CODEBOOK' ? { ...s, sha256: 'f'.repeat(64) } : s);
t('source-hash binding: a changed Codebook hash refuses every record bound to it', validate.validateRegister(REGISTER, { ...ctx, sources: drifted }).filter((p) => /drift/.test(p)).length === REGISTER.records.filter((r) => r.methodology_source_id === 'SRC-CODEBOOK').length);
t('source-hash binding: an approved record against a drifted source is refused', validate.validateRecord(approvedFixture(), { ...ctx, sources: drifted }).some((p) => /drift/.test(p)));
// The builder re-hashes the files: a changed source refuses the build until it is reviewed again.
const tmp = mkdtempSync(join(tmpdir(), 'jrs-mi-src-'));
for (const s of SOURCE_REGISTER.sources.concat(SOURCE_REGISTER.correspondence_decision_records)) { mkdirSync(dirname(join(tmp, s.path)), { recursive: true }); copyFileSync(join(ROOT, s.path), join(tmp, s.path)); }
t('the builder accepts the sources exactly as reviewed', build.buildSourceRegister(tmp).problems.length === 0, build.buildSourceRegister(tmp).problems.join(' | '));
appendFileSync(join(tmp, 'codebook.html'), '\n<!-- edited -->\n');
t('the builder refuses a Codebook that changed since it was reviewed', build.buildSourceRegister(tmp).problems.some((p) => /SRC-CODEBOOK: codebook\.html has changed since it was reviewed/.test(p)));
writeFileSync(join(tmp, 'docs/enterprise-diligence/D-2_CODEBOOK_CORRESPONDENCE_MEMO.md'), 'replaced');
t('the builder refuses a decision record that changed since it was reviewed', build.buildSourceRegister(tmp).problems.some((p) => /DEC-D2/.test(p)));
rmSync(tmp, { recursive: true, force: true });

// ---- resolver: Node and the generated workspace snapshot apply the same rule ----------------------
const W = await import(ROOT + 'tools/local-reviewer-workspace/app/correspondence.js');
const ok = { ...approvedFixture(), source_version: '1.0', approval_date: '2026-10-06' };
const cases = [
  ['no record', [], false], ['a complete approved record', [ok], true],
  ['no source hash', [{ ...ok, methodology_source_sha256: null }], false], ['a malformed source hash', [{ ...ok, methodology_source_sha256: 'abc123' }], false], ['no approval date', [{ ...ok, approval_date: null }], false],
  ['not approved', [{ ...ok, status: 'PROPOSED_NOT_APPROVED' }], false], ['no source version', [{ ...ok, source_version: null }], false],
  ['no source term', [{ ...ok, authoritative_source_term: null }], false], ['two records for one term', [ok, ok], false], ['another term', [{ ...ok, candidate_term: 'other' }], false],
];
for (const [name, list, asserted] of cases) {
  const a = resolve.resolveCodebookLabel(list, 'CANDIDATE_KEY', 'fixture_key'), b = W.resolveCodebookLabel(list, 'CANDIDATE_KEY', 'fixture_key');
  t('resolver, ' + name + ': ' + (asserted ? 'renders the mapped label' : 'renders the unmapped notice') + ' (Node and workspace agree)',
    a.asserted === asserted && JSON.stringify(a) === JSON.stringify(b) && (asserted ? /source hash [0-9a-f]{12}, owner approval 2026-10-06/.test(a.text) : a.text === 'No Codebook correspondence asserted.'));
}
t('the workspace snapshot resolver is the Node resolver, verbatim', W.resolveCodebookLabel.toString() === resolve.resolveCodebookLabel.toString());
t('with the committed register, every candidate key renders the unmapped notice', ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability'].every((k) => W.codebookCorrespondenceText('CANDIDATE_KEY', k) === 'No Codebook correspondence asserted.'));
done();

// Scanner accuracy on synthetic lines, review binding, and the repository gate.
// The fixture lines below exist only in this file; tests/ is outside the scanner's scope.
import { createHash } from 'node:crypto';
import { t, done, ROOT, TOOL, scan } from './_helpers.mjs';

const one = (line, opts) => scan.scanText(line, 'fixture.md', opts)[0] || { disposition: 'NONE', classification: 'NONE' };
const expect = [
  // [line, classification, disposition]
  ['cold_reviewer_clarity is a JRS condition.', 'JRS_CONDITION_CLAIM', 'UNSUPPORTED_MAPPING'],
  ['The candidate key accountability_support is one of the JRS conditions.', 'JRS_CONDITION_CLAIM', 'UNSUPPORTED_MAPPING'],
  ['accountability_support maps to Evidentiary Sufficiency.', 'MAPPING_PHRASE', 'UNSUPPORTED_MAPPING'],
  ['reasoning_traceability is equivalent to Reconstructability.', 'MAPPING_PHRASE', 'UNSUPPORTED_MAPPING'],
  ['temporal_reconstructability corresponds to Chronology.', 'MAPPING_PHRASE', 'UNSUPPORTED_MAPPING'],
  ['basis_identification → Basis Identification', 'MAPPING_PHRASE', 'UNSUPPORTED_MAPPING'],
  ['The candidate implements Decision-Process Traceability.', 'IMPLEMENTS_CODEBOOK_TERM', 'UNSUPPORTED_MAPPING'],
  ['The Engine implements the Codebook.', 'IMPLEMENTS_CODEBOOK_TERM', 'UNSUPPORTED_MAPPING'],
  ['The JRS five conditions: basis_identification, cold_reviewer_clarity, accountability_support.', 'FIVE_CONDITIONS_FOR_KEYS', 'UNSUPPORTED_MAPPING'],
  ['The placeholder check is a JRS finding about the record.', 'SOURCE_PREP_AS_DETERMINATION', 'UNSUPPORTED_MAPPING'],
  ['Source-preparation results are contextual JRS determinations.', 'SOURCE_PREP_AS_DETERMINATION', 'UNSUPPORTED_MAPPING'],
  ['basis_identification has an exact Codebook correspondence.', 'CORRESPONDENCE_CLAIM', 'UNSUPPORTED_MAPPING'],
  ['| `cold_reviewer_clarity` | Evidentiary Sufficiency |', 'KEY_BESIDE_CODEBOOK_LABEL', 'REQUIRES_APPROVED_RECORD'],
  ['accountability_support (RC4)', 'KEY_BESIDE_CODEBOOK_LABEL', 'REQUIRES_APPROVED_RECORD'],
  // permitted forms
  ['cold_reviewer_clarity is not a JRS condition.', 'JRS_CONDITION_CLAIM', 'ALLOWED'],
  ['accountability_support beside Evidentiary Sufficiency: no correspondence asserted.', 'KEY_BESIDE_CODEBOOK_LABEL', 'ALLOWED'],
  ['A generator MUST NOT relabel engine keys as Codebook conditions.', 'JRS_CONDITION_CLAIM', 'ALLOWED'],
  ['D-2 rejects the reading "cold_reviewer_clarity is a JRS condition" (D-2_CODEBOOK_CORRESPONDENCE_MEMO.md).', 'JRS_CONDITION_CLAIM', 'ALLOWED'],
  ['Someone wrote "cold_reviewer_clarity is a JRS condition".', 'JRS_CONDITION_CLAIM', 'AMBIGUOUS_REVIEW_REQUIRED'],
  ['Historical: accountability_support maps to Decision-Process Traceability.', 'MAPPING_PHRASE', 'HISTORICAL_ONLY'],
  ['BD-04 declared reasoning_traceability equivalent to Reconstructability.', 'MAPPING_PHRASE', 'AMBIGUOUS_REVIEW_REQUIRED'],
];
for (const [line, cls, disp] of expect) { const f = one(line); t('scanner: "' + line.slice(0, 60) + '" is ' + cls + ' / ' + disp, f.classification === cls && f.disposition === disp, f.classification + ' / ' + f.disposition); }
const benign = ['The Codebook defines Chronology as RC 3.', 'This field maps to the request body.', 'The record cites the policy.', 'Evidentiary Sufficiency is the aggregate condition.', 'chronology_gap: the order of events cannot be rebuilt.'];
for (const line of benign) t('scanner: no finding on "' + line + '"', scan.scanText(line, 'fixture.md').length === 0);
t('scanner: a file-level SUPERSEDED marker makes later hits historical', scan.scanText('> SUPERSEDED 2026-09-20.\n\n| `basis_identification` | Basis Identification |', 'f.md')[0].disposition === 'HISTORICAL_ONLY');
t('scanner: a line citing an approved record id is ALLOWED', one('accountability_support maps to Evidentiary Sufficiency (MC-900).', { approvedIds: ['MC-900'] }).disposition === 'ALLOWED');
t('scanner: an unapproved record id permits nothing', one('accountability_support maps to Evidentiary Sufficiency (MC-900).', { approvedIds: [] }).disposition === 'UNSUPPORTED_MAPPING');
t('scanner: a negation after the mapping does not excuse it', one('accountability_support maps to Evidentiary Sufficiency, not Chronology.').disposition === 'UNSUPPORTED_MAPPING');
t('scanner: a wrapped prohibition across lines is negated', scan.scanText('A generator **MUST NOT**\nrelabel engine keys as Codebook conditions.', 'f.md')[0].disposition === 'ALLOWED');
t('scanner: every finding reports file, line, phrase, classification and disposition', ['file', 'line', 'phrase', 'classification', 'disposition'].every((k) => k in scan.scanText('x\ncold_reviewer_clarity is a JRS condition.', 'f.md')[0]) && scan.scanText('x\ncold_reviewer_clarity is a JRS condition.', 'f.md')[0].line === 2);
t('scanner: dispositions are exactly the five permitted', scan.DISPOSITIONS.join() === 'ALLOWED,REQUIRES_APPROVED_RECORD,UNSUPPORTED_MAPPING,HISTORICAL_ONLY,AMBIGUOUS_REVIEW_REQUIRED');

// ---- reviewed dispositions are bound to the exact line ------------------------------------------
const line = 'cold_reviewer_clarity is a JRS condition.';
const entry = { file: 'fixture.md', line_sha256: createHash('sha256').update(line).digest('hex'), disposition: 'HISTORICAL_ONLY', reason: 'fixture' };
t('review: an entry bound to the exact line applies', one(line, { reviewed: [entry] }).disposition === 'HISTORICAL_ONLY');
t('review: the same entry does not apply once the line changes', one(line + ' ', { reviewed: [entry] }).disposition === 'UNSUPPORTED_MAPPING');
t('review: an entry cannot turn a finding into REQUIRES_APPROVED_RECORD or anything not reviewable', one(line, { reviewed: [{ ...entry, disposition: 'APPROVED' }] }).disposition === 'UNSUPPORTED_MAPPING');
t('review: an acknowledged ambiguity stays AMBIGUOUS_REVIEW_REQUIRED and is marked acknowledged', (() => { const f = one(line, { reviewed: [{ ...entry, disposition: 'AMBIGUOUS_REVIEW_REQUIRED' }] }); return f.disposition === 'AMBIGUOUS_REVIEW_REQUIRED' && f.acknowledged === true; })());

// ---- the repository scope and gate --------------------------------------------------------------
const { runScan } = await import(TOOL + 'scan.mjs');
const r = runScan(ROOT, TOOL);
const files = new Set(r.findings.map((f) => f.file));
t('scope covers candidate, workspace, Manifest, protocol, research-summary and internal documentation files', ['candidate', 'workspace', 'methodology-integrity', 'manifest', 'protocol-and-internal-docs', 'research-summary', 'correspondence-records'].every((g) => r.scope.includes(g)) && r.files_scanned >= 50);
t('the gated scope has no unsupported, unapproved or unacknowledged ambiguous mapping', r.gate.failures === 0, r.findings.filter((f) => !r.report_only_groups.includes(f.group) && !['ALLOWED', 'HISTORICAL_ONLY'].includes(f.disposition) && !f.acknowledged).map((f) => f.file + ':' + f.line).join(', '));
t('every reviewed disposition still matches a line (none stale)', r.gate.stale_reviews.length === 0, r.gate.stale_reviews.join(', '));
t('the research crosswalk is reported as historical after its correction notice', r.findings.filter((f) => f.file === 'research/CONSTRUCT_VALIDITY_PACKAGE.md').every((f) => ['HISTORICAL_ONLY', 'ALLOWED'].includes(f.disposition)) && r.findings.filter((f) => f.file === 'research/CONSTRUCT_VALIDITY_PACKAGE.md' && f.disposition === 'HISTORICAL_ONLY').length >= 5);
t('the candidate comment on an exact correspondence is reported as an acknowledged ambiguity', r.findings.some((f) => f.file === 'lib/engine-candidate/explanations.js' && f.disposition === 'AMBIGUOUS_REVIEW_REQUIRED' && f.acknowledged));
t('owner decision records are reported, not gated', r.findings.some((f) => f.group === 'correspondence-records' && f.disposition === 'REQUIRES_APPROVED_RECORD'));
done();

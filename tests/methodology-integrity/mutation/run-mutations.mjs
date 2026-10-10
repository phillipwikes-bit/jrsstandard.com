// Mutation run for the methodology-integrity controls. Each mutation is applied, one at a time, to a
// throwaway overlay of the repository: lib/engine-candidate/, tools/local-reviewer-workspace/ and
// tools/methodology-integrity/ are copied, everything else is a symlink to the working tree. The
// suite, pointed at the overlay through MI_ROOT, must then FAIL. A mutation no suite catches is
// SURVIVED and fails the run. The working tree is never modified.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../../', import.meta.url).pathname;
const COPIED = ['lib/engine-candidate', 'tools/local-reviewer-workspace', 'tools/methodology-integrity'];
const EX = 'lib/engine-candidate/explanations.js', REC = 'tools/methodology-integrity/lib/records.js', SCAN = 'tools/methodology-integrity/lib/scan.js';
const VAL = 'tools/methodology-integrity/lib/validate.js', RES = 'tools/methodology-integrity/lib/resolve.js', BUILD = 'tools/methodology-integrity/build.mjs';
const WS = 'tools/local-reviewer-workspace/app/workspace.js', CORE = 'tools/local-reviewer-workspace/app/core.js', SNAP = 'tools/local-reviewer-workspace/app/correspondence.js';
const REG = 'tools/methodology-integrity/current-correspondence-register.json';

// Edit a committed register record in place, as a hand edit would.
const regEdit = (f) => (text) => { const reg = JSON.parse(text); f(reg.records.find((r) => r.candidate_term === 'basis_identification' && r.term_category === 'CANDIDATE_KEY')); return JSON.stringify(reg, null, 1) + '\n'; };
const approve = (r) => { r.status = 'APPROVED_CORRESPONDENCE'; r.mapping_type = 'EXACT_LABEL'; r.authoritative_source_term = 'Basis Identification'; r.methodology_source_id = 'SRC-CODEBOOK';
  r.source_reference = 'codebook.html, RC 2 heading and definition'; r.proposal = null; r.owner_approval = { approved: true, approver: 'MUTATION', approval_date: '2026-10-06', approval_reference: 'tools/methodology-integrity/README.md' }; };

// [id, control, file, exact text or edit function, replacement]
export const MUTATIONS = [
  ['M01', 'cold_reviewer_clarity labelled a JRS condition', EX, "label: 'Reviewer reconstruction (candidate-internal, unmapped)',", "label: 'Reviewer reconstruction: cold_reviewer_clarity is a JRS condition',"],
  ['M02', 'accountability_support mapped to Evidentiary Sufficiency without approval', REC, "rec({ term: 'accountability_support', category: 'CANDIDATE_KEY', status: 'UNMAPPED', at: KEY_AT,", "rec({ term: 'accountability_support', category: 'CANDIDATE_KEY', status: 'UNMAPPED', at: KEY_AT, source: 'SRC-CODEBOOK', authTerm: 'Evidentiary Sufficiency', type: 'DOCUMENTED_ALIAS',"],
  ['M03', 'accountability_support silently given the insufficient_evidence category', EX, "  accountability_support: null,", "  accountability_support: 'insufficient_evidence',"],
  ['M04', 'a candidate key silently mapped to a Codebook label', EX, "    label: 'Missing identifiable basis',", "    label: 'Basis Identification',"],
  ['M05', 'a source-prep check presented as a JRS finding', EX, "placeholder: ['Placeholder left in the record',", "placeholder: ['JRS finding: placeholder left in the record',"],
  ['M06', 'approved status without a source hash', REG, regEdit((r) => { approve(r); r.methodology_source_sha256 = null; })],
  ['M07', 'approved status without an owner approval date', REG, regEdit((r) => { approve(r); r.owner_approval.approval_date = null; })],
  ['M08', 'the scanner ignores a prohibited phrase ("equivalent to")', SCAN, "|\\bequivalent\\s+to\\b", ""],
  ['M09', 'the scanner ignores "is a JRS condition"', SCAN, "  ['JRS_CONDITION_CLAIM',", "  ['JRS_CONDITION_CLAIM_OFF',"],
  ['M10', 'a workspace finding card omits the unmapped notice', WS, "  row(dl, 'Codebook', C.codebookTextFor(f));\n", "\n"],
  ['M11', 'a workspace key status omits the unmapped notice', WS, " + '. ' + C.codebookCorrespondenceText(C.TERM_CATEGORY.condition, k));", ");"],
  ['M12', 'the workspace notice reverts to unregistered wording', CORE, "export const CODEBOOK_NOTICE = NO_CORRESPONDENCE + ' Candidate", "export const CODEBOOK_NOTICE = 'Codebook mapping pending.' + ' Candidate"],
  ['M13', 'an export adds "defensible"', CORE, "export const LIMITATION = 'This is a reviewer-created local disposition record.", "export const LIMITATION = 'This record is defensible. This is a reviewer-created local disposition record."],
  ['M14', 'an export adds "approved"', CORE, "    limitation: LIMITATION,\n", "    limitation: LIMITATION, status: 'approved',\n"],
  ['M15', 'an export adds "compliant"', CORE, "    review_date: session.review_date,\n", "    review_date: session.review_date, finding: 'compliant',\n"],
  ['M16', 'the validator lets an unapproved record use EXACT_LABEL', VAL, "if (APPROVAL_ONLY_TYPES.includes(r.mapping_type)) problems.push(", "if (false) problems.push("],
  ['M17', 'the validator ignores source-hash drift', VAL, "if (src && r.methodology_source_sha256 !== src.sha256) problems.push(", "if (false) problems.push("],
  ['M18', 'the validator accepts approval without a date', VAL, "if (!isRealDate(a.approval_date)) problems.push(", "if (false) problems.push("],
  ['M19', 'the builder ignores a changed source file', BUILD, "if (h !== reviewed) problems.push(", "if (false) problems.push("],
  ['M20', 'the resolver renders a label without a source hash', RES, "!/^[0-9a-f]{64}$/.test(r.methodology_source_sha256 || '') || ", ""],
  ['M21', 'the workspace snapshot renders an unapproved record', SNAP, "if (r.status !== 'APPROVED_CORRESPONDENCE' || ", "if ("],
  ['M22', 'the scanner treats any quotation as identified', SCAN, "if (IDENTIFIED.test(line)) {", "if (true) {"],
  ['M23', 'a reviewed disposition outlives an edit to its line', SCAN, "e.file === file && e.line_sha256 === lineSha", "e.file === file"],
];

const base = mkdtempSync(join(tmpdir(), 'jrs-mi-mutation-'));
const top = new Set(COPIED.map((p) => p.split('/')[0]));
for (const name of readdirSync(ROOT)) if (name !== '.git' && !top.has(name)) symlinkSync(join(ROOT, name), join(base, name));
for (const dir of top) {
  mkdirSync(join(base, dir));
  for (const name of readdirSync(join(ROOT, dir))) if (!COPIED.includes(dir + '/' + name)) symlinkSync(join(ROOT, dir, name), join(base, dir, name));
}
const fresh = () => { for (const p of COPIED) { rmSync(join(base, p), { recursive: true, force: true }); cpSync(join(ROOT, p), join(base, p), { recursive: true }); } };
// Returns the failing checks; an empty list means every suite passed.
const suite = () => {
  try { execFileSync(process.execPath, [join(ROOT, 'tests/methodology-integrity/run-all.mjs')], { env: { ...process.env, MI_ROOT: base, MI_MUTATION_CHILD: '1' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 }); return []; }
  catch (e) { return String(e.stdout || '').split('\n').filter((l) => /^FAIL  |: FAILED/.test(l)); }
};

let pass = 0, fail = 0;
const t = (n, ok) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); };
fresh();
t('baseline: the unmutated overlay passes every suite', suite().length === 0);
let caught = 0;
for (const [id, control, file, find, repl] of MUTATIONS) {
  fresh();
  const p = join(base, file), src = readFileSync(p, 'utf8');
  const next = typeof find === 'function' ? find(src) : src.includes(find) ? src.replace(find, repl) : null;
  if (next === null || next === src) { t(id + ' ' + control + ': mutation text not found (control moved?)', false); continue; }
  writeFileSync(p, next);
  const failing = suite(), ok = failing.length > 0;
  if (ok) caught++;
  t(id + ' ' + control + (ok ? ': caught' : ': SURVIVED'), ok);
  if (process.argv.includes('--verbose')) for (const l of failing.filter((x) => /^FAIL  /.test(x))) console.log('      ' + l.slice(6, 150));
}
rmSync(base, { recursive: true, force: true });
console.log(`\n${MUTATIONS.length} mutations, ${caught} caught, ${MUTATIONS.length - caught} survived`);
process.exit(fail ? 1 : 0);

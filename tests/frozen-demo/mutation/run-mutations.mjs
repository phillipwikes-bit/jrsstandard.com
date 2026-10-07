// Mutation run for the frozen demonstration package. The working tree is never modified.
//
// Each mutation is applied to a throwaway overlay in which tools/frozen-demo/ and the one file the
// mutation touches are copied, and everything else is a symlink to the working tree. The verifier
// from the overlay must then FAIL, and must fail in the section that owns the control, so a
// mutation caught only by an unrelated check (a changed hash, say) does not count for a control
// that should have fired on its own.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = new URL('../../../', import.meta.url).pathname;
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? pass++ : fail++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (!ok && d ? '\n      ' + d : '')); };

const PKG = 'tools/frozen-demo';
function overlay(copies) {
  const base = mkdtempSync(join(tmpdir(), 'jrs-fd-mutation-'));
  const link = (rel) => {
    for (const name of readdirSync(join(ROOT, rel))) {
      if (!rel && name === '.git') continue;
      const p = rel ? rel + '/' + name : name;
      if (copies.includes(p)) cpSync(join(ROOT, p), join(base, p), { recursive: true });
      else if (copies.some((c) => c.startsWith(p + '/'))) { mkdirSync(join(base, p)); link(p); }
      else symlinkSync(join(ROOT, p), join(base, p));
    }
  };
  link('');
  return base;
}
const J = (s) => JSON.parse(s), S = (o) => JSON.stringify(o, null, 1) + '\n';
const editJson = (fn) => (src) => { const o = J(src); fn(o); return S(o); };
const replace = (a, b) => (src) => { if (!src.includes(a)) throw new Error('mutation text not found: ' + a.slice(0, 40)); return src.split(a).join(b); };
const MAN = PKG + '/demo-manifest.json', EVI = PKG + '/demo-evidence-record.json', COR = PKG + '/corpus/v0.1.0/';

// [id, what it proves, file, edit, expected section(s), extra files to copy, extra file to create]
export const MUTATIONS = [
  ['M01', 'a synthetic record is edited', COR + 'FD-02.json', replace('for six weeks', 'for seven weeks'), ['B']],
  ['M02', 'a record hash is changed in the manifest', MAN, editJson((m) => { m.records[2].file_sha256 = m.records[2].file_sha256.replace(/^./, (c) => (c === 'a' ? 'b' : 'a')); }), ['B']],
  ['M03', 'a source hash is changed in a record', COR + 'FD-03.json', editJson((r) => { r.source_sha256 = '1'.repeat(63) + '2'; }), ['B']],
  ['M04', 'a real organisation is inserted', COR + 'FD-04.json', replace('Elmshade listed two devices', 'Microsoft listed two devices'), ['D']],
  ['M05', 'a real person is inserted', COR + 'FD-01.json', replace('Imra Tevalle, approved', 'John Smith, approved'), ['D']],
  ['M06', 'a real organisation is declared as a fictional entity', COR + 'FD-02.json', editJson((r) => { r.fictional_entities.organisations.push('Google'); r.text = r.text.replace('Brisenfold Logistics Ltd requested', 'Brisenfold Logistics Ltd (Google) requested'); }), ['D']],
  ['M07', 'a provider adapter is substituted for the approved mock', PKG + '/lib/replay.js', replace("from '../../../lib/engine-candidate/mock-adapter.js'", "from './provider-adapter.js'"), ['E'], [],
    [PKG + '/lib/provider-adapter.js', "// A stand-in provider adapter that returns the same scripted output.\nexport { createMockAdapter } from '../../../lib/engine-candidate/mock-adapter.js';\n"]],
  ['M08', 'the adapter identity is changed in the manifest', MAN, editJson((m) => { m.adapter.kind = 'live_provider'; m.adapter.module = 'lib/engine-candidate/provider-adapter.js'; }), ['E']],
  ['M09', 'the prompt version is changed', MAN, editJson((m) => { m.prompt_version = 'candidate-prompt/0.5.0'; m.versions.prompt_version = 'candidate-prompt/0.5.0'; }), ['E']],
  ['M10', 'the candidate version is changed', MAN, editJson((m) => { m.candidate_version = '0.6.0-local.1'; m.versions.candidate_version = '0.6.0-local.1'; }), ['E']],
  ['M11', 'a bound candidate module is changed', 'lib/engine-candidate/mock-adapter.js', replace('// LOCAL DEVELOPMENT ONLY.', '// LOCAL DEVELOPMENT ONLY (edited).'), ['E']],
  ['M12', 'a network pathway is added to the viewer', PKG + '/viewer/viewer.js', replace("$('check-btn').addEventListener", "fetch('/x');\n$('check-btn').addEventListener"), ['E']],
  ['M13', 'a synthetic label is removed from a record', COR + 'FD-03.json', editJson((r) => { r.synthetic = false; r.synthetic_label = 'Supplier-access record.'; }), ['H']],
  ['M14', 'a synthetic label is removed from the record text', COR + 'FD-04.json', editJson((r) => { r.text = r.text.replace('SYNTHETIC DEMONSTRATION RECORD FD-04. Fictional organisations, people, dates and facts. Not a real record.\n', ''); r.source_sha256 = ''; }), ['H']],
  ['M15', 'an expected finding is changed in a record', COR + 'FD-02.json', editJson((r) => { r.expected.candidate.finding_types = ['reasoning_elision']; }), ['F']],
  ['M16', 'an expected finding is changed in the manifest', MAN, editJson((m) => { m.records[3].expected_candidate.flagged_keys = { reasoning_traceability: 'review' }; }), ['F']],
  ['M17', 'an expected digest is changed', MAN, editJson((m) => { m.records[0].expected_digests.packet_digest = '0'.repeat(64); }), ['F']],
  ['M18', 'the refusal case is expected to reach the adapter', MAN, editJson((m) => { m.records[4].expected_candidate.adapter_called = true; m.records[4].expected_candidate.result_status = 'examined'; }), ['F']],
  ['M19', 'a limitation statement is removed from the manifest', MAN, editJson((m) => { delete m.known_limitations.no_semantic_correctness; }), ['K']],
  ['M20', 'a limitation is removed from the capability matrix', 'docs/architecture/FROZEN_DEMONSTRATION_CAPABILITY_MATRIX.md',
    replace('| No semantic correctness: an exact quotation shows where text sits in the record, not that it supports the finding. |', '| See the protocol. |'), ['K']],
  ['M21', 'a score is added', MAN, editJson((m) => { m.records[1].score = 4; }), ['G']],
  ['M22', 'an approved verdict is added', EVI, editJson((e) => { e.overall_verdict = 'APPR' + 'OVED'; }), ['G', 'K']],
  ['M23', 'a candidate key is asserted to map to a Codebook condition', MAN, editJson((m) => { m.notice += ' The basis_identification key maps to the JRS condition of identifiable basis.'; }), ['G']],
  ['M24', 'a case is reclassified as a holdout', MAN, editJson((m) => { m.records[1].holdout = true; m.records[1].classification = 'sealed_holdout_record'; }), ['B']],
  ['M25', 'the package is declared a holdout', MAN, editJson((m) => { m.holdout = true; }), ['A']],
  ['M26', 'a release gate is marked advanced in the evidence record', EVI, editJson((e) => { e.statements.release_gates_advanced = ['RG-1']; }), ['J']],
  ['M27', 'a release gate is marked PASS in the release-gate record', 'lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json', editJson((r) => { r.gates[0].status = 'PASS'; }), ['J']],
  ['M28', 'an owner release decision is recorded', EVI, editJson((e) => { e.statements.owner_release_decision_recorded = true; }), ['J']],
  ['M29', 'the evidence record claims the demonstration proves accuracy', EVI, editJson((e) => { e.what_the_replay_shows = 'The demonstration proves the candidate is accurate.'; }), ['J']],
  ['M30', 'the status is changed to a prohibited status', MAN, editJson((m) => { m.status = 'DEMO' + '_READY'; }), ['A', 'K']],
  ['M31', 'a public page links to the viewer', 'index.html', replace('</body>', '<a href="/tools/frozen-demo/viewer/">Demo</a></body>'), ['K']],
  ['M32', 'a public route names the viewer', 'api/review.js', (src) => src + '\n// see tools/frozen-demo/viewer\n', ['K']],
  ['M33', 'a generated output is edited', PKG + '/viewer/demo-data.js', replace('"status": "examined"', '"status": "examined "'), ['I']],
  ['M34', 'a record moves outside the supplier-access scope', COR + 'FD-01.json', editJson((r) => { r.scope.profile.hr_related = true; }), ['C']],
  ['M35', 'excluded-domain content is inserted', COR + 'FD-03.json', replace('a mould repair could not wait', 'a patient diagnosis could not wait'), ['C']],
  ['M36', 'real data is no longer prohibited', MAN, editJson((m) => { m.prohibitions.real_records = 'permitted'; }), ['A']],
];

async function verifyIn(base) {
  const V = await import(join(base, PKG, 'lib/verify.js') + '?' + Math.random());
  return V.verifyDemoPackage({ root: base + '/' });
}

{
  const base = overlay([PKG]);
  const v = await verifyIn(base);
  t('baseline: the unmutated overlay verifies', v.ok, v.problems.join(' | '));
  rmSync(base, { recursive: true, force: true });
}
let caught = 0;
for (const [id, what, file, edit, sections, , create] of MUTATIONS) {
  const base = overlay([...new Set([PKG, file])]);
  try {
    const p = join(base, file);
    writeFileSync(p, edit(readFileSync(p, 'utf8')));
    if (create) { mkdirSync(dirname(join(base, create[0])), { recursive: true }); writeFileSync(join(base, create[0]), create[1]); }
    const v = await verifyIn(base);
    const fired = v.problems.map((x) => x.split(':')[0]);
    const ok = !v.ok && sections.some((s) => fired.includes(s));
    if (ok) caught++;
    t(id + ' ' + what + (ok ? ': caught (section ' + sections.filter((s) => fired.includes(s)).join('+') + ')' : ': SURVIVED'), ok, v.problems.slice(0, 4).join(' | '));
  } catch (e) { t(id + ' ' + what + ': mutation could not be applied (' + e.message + ')', false); }
  finally { rmSync(base, { recursive: true, force: true }); }
}
console.log(`\n${MUTATIONS.length} mutations, ${caught} caught, ${MUTATIONS.length - caught} survived`);
console.log(`${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);

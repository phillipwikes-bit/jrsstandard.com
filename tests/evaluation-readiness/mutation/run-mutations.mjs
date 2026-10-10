// Mutation run for the evaluation-readiness package. The working tree is never modified.
//
// Each mutation is applied in a throwaway overlay: tools/evaluation-readiness/ and the one file the
// mutation touches are copied, everything else is a symlink to the working tree. The overlay's
// verifier must then FAIL in the section that owns the control (a failure elsewhere does not count),
// or, for a control the verifier does not exercise directly, the named test suite must fail.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../../', import.meta.url).pathname;
let pass = 0, fail = 0;
const t = (n, ok, d) => { ok ? pass++ : fail++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (!ok && d ? '\n      ' + d : '')); };
const PKG = 'tools/evaluation-readiness';
function overlay(copies) {
  const base = mkdtempSync(join(tmpdir(), 'jrs-er-mutation-'));
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
const J = (fn) => (src) => { const o = JSON.parse(src); fn(o); return JSON.stringify(o, null, 1) + '\n'; };
const R = (a, b) => (src) => { if (!src.includes(a)) throw new Error('mutation text not found: ' + a.slice(0, 60)); return src.split(a).join(b); };
const L = PKG + '/lib/', REG = PKG + '/readiness-registry.json', CON = PKG + '/readiness-contract.json', MAP = PKG + '/codebook-mapping.json', AUTH = PKG + '/authority-matrix.json';
const RGR = 'lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json';

// [id, brief item (or 'extra'), control exercised, file, edit, owning sections, file to create]
export const MUTATIONS = [
  ['M01', 1, 'intake refuses out-of-scope categories (INT-04)', L + 'intake.js', R("  else if (REFUSED_DOMAINS.includes(cat)) refuse('out_of_scope_record_category', 'INT-04', cat + ' is an excluded decision domain.');\n  else if (!ALLOWED_RECORD_CATEGORIES.includes(cat)) refuse('out_of_scope_record_category', 'INT-04', cat + ' is not an in-scope record category.');\n", ''), ['D']],
  ['M02', 1, 'run bindings refuse out-of-scope records (REG-04)', L + 'registry.js', R("if (filled(cat) && !ALLOWED_RECORD_CATEGORIES.includes(cat)) refuse('out_of_scope_record_category', 'REG-04', cat);", ''), ['B']],
  ['M03', 2, 'the registry stays PLANNING_ONLY', REG, J((o) => { o.status = 'VALI' + 'DATED'; }), ['B', 'K']],
  ['M04', 2, 'independent evidence stays NOT_PRESENT', CON, J((o) => { o.categories.INDEPENDENT_EVALUATION_EVIDENCE.state = 'VALI' + 'DATED'; }), ['A', 'K']],
  ['M05', 2, 'the authority snapshot keeps RG-1 BLOCKED', AUTH, J((o) => { o.gate_responsibilities[0].status_snapshot = 'RELEASE' + '_READY'; }), ['G', 'K']],
  ['M06', 2, 'no release gate is marked PASS', RGR, J((o) => { o.gates[3].status = 'PASS'; }), ['G']],
  ['M07', 2, 'every gate status stays exactly unchanged', RGR, J((o) => { o.gates[2].status = 'BLOCKED'; }), ['G']],
  ['M08', 3, 'run bindings require the Engine commit', L + 'registry.js', R("'engine.version', 'engine.commit', 'prompt.version'", "'engine.version', 'prompt.version'"), ['B']],
  ['M09', 3, 'intake requires a version binding (INT-07)', L + 'intake.js', R("  if (!vb || typeof vb !== 'object') refuse('version_binding_missing', 'INT-07', 'Bind the intake to the Engine, prompt, codebook and protocol versions.');\n  else ", '  if (vb && typeof vb === \'object\') '), ['D']],
  ['M10', 4, 'the mapping holds all five conditions', MAP, J((o) => { o.conditions.pop(); }), ['C']],
  ['M11', 4, 'every interpretation names a condition by ID (WS-04)', L + 'workspace.js', R("    if (!CONDITION_IDS.includes(item.condition_id)) refuse(", "    if (false) refuse("), ['E']],
  ['M12', 4, 'candidate output never names a condition (WS-05)', L + 'workspace.js', R("if ('condition_id' in item || 'condition' in item) refuse(", "if (false) refuse("), ['E']],
  ['M13', 5, 'no package artifact carries a record-text field (SCAN-04)', REG, J((o) => { o.example = { record_text: 'SYNTHETIC-MUTATION' }; }), ['H']],
  ['M14', 5, 'no tracked file carries the evaluation-source marker (SCAN-02)', 'docs/architecture/FROZEN_DEMONSTRATION_EVIDENCE_RECORD.md', (s) => s + '\nJRS-EVALUATION' + '-SOURCE\n', ['H']],
  ['M15', 6, 'intake refuses development and frozen-demo material (INT-09)', L + 'intake.js', R("    if (m && m.frozen_demo) refuse(", "    if (false) refuse("), ['D']],
  ['M16', 6, 'intake refuses development material (INT-09)', L + 'intake.js', R("    else if (m) refuse('development_material'", "    else if (false) refuse('development_material'"), ['D']],
  ['M17', 7, 'nothing is relabelled as independent evidence (contract)', CON, J((o) => { o.categories.INDEPENDENT_EVALUATION_EVIDENCE.items.push({ id: 'FD-01', description: 'frozen synthetic demonstration record' }); }), ['A']],
  ['M18', 7, 'intake refuses a synthetic item labelled independent (INT-10)', L + 'intake.js', R("if (synthetic && intake.evidence_class === 'INDEPENDENT_EVALUATION_EVIDENCE') refuse(", "if (false) refuse("), ['D']],
  ['M19', 7, 'run bindings refuse a synthetic item labelled independent (REG-06)', L + 'registry.js', R("if (syntheticMark && ec === 'INDEPENDENT_EVALUATION_EVIDENCE') refuse(", "if (false) refuse("), ['B']],
  ['M20', 8, 'one reviewer cannot produce agreement (WS-10)', L + 'workspace.js', R("  if (reviewers.size < 2) return { ok: false, codes: [{ code: 'single_reviewer_agreement'", "  if (false) return { ok: false, codes: [{ code: 'single_reviewer_agreement'"), ['E']],
  ['M21', 9, 'no DRR score before the freezes (WS-11)', L + 'workspace.js', R("  if (open.length) return { ok: false, codes: [{ code: 'drr_score_before_freeze'", "  if (false) return { ok: false, codes: [{ code: 'drr_score_before_freeze'"), ['E']],
  ['M22', 9, 'intake refuses a scoring request (INT-11)', L + 'intake.js', R("refuse(a === 'drr_score' || a === 'agreement_statistic' || a === 'classification' ? 'score_before_freeze' : 'model_review_or_transmission'", "refuse('model_review_or_transmission'"), ['D']],
  ['M23', 9, 'scoring stays NOT_PERMITTED in the mapping', MAP, J((o) => { o.scoring.drr_score = 'PERMITTED'; }), ['C']],
  ['M24', 10, 'material limitations are stated (contract)', CON, J((o) => { delete o.limitations.digest_not_independence; }), ['I']],
  ['M25', 10, 'the contamination protocol states its limit', 'docs/architecture/INPUT_CONTAMINATION_AND_DEVELOPMENT_MATERIAL_EXCLUSION_PROTOCOL.md', R('Digest matching does not establish independence', 'Digest matching is a strong control'), ['I']],
  ['M26', 11, 'counsel review is required', AUTH, J((o) => { delete o.roles.counsel; }), ['G']],
  ['M27', 11, 'Claude Code may not authorize', AUTH, J((o) => { o.roles.claude_code.may_not = o.roles.claude_code.may_not.filter((x) => !/authorize/.test(x)); }), ['G']],
  ['M28', 11, 'what stays prohibited is listed', AUTH, J((o) => { o.prohibited_until.pop(); }), ['G']],
  ['M29', 12, 'a real workspace needs an admitted intake (WS-00)', L + 'workspace.js', R("    if (!intakeDecision || intakeDecision.decision !== 'ADMITTED') return", "    if (false) return"), ['E']],
  ['M30', 12, 'intake stays closed (INT-00)', L + 'intake.js', R('export const INTAKE_OPEN = false;', 'export const INTAKE_OPEN = true;'), ['D']],
  ['M31', 13, 'no network or provider path', L + 'intake.js', R("export const INTAKE_VALIDATOR_VERSION", "export const probe = () => fetch('https://api.anthropic.com');\nexport const INTAKE_VALIDATOR_VERSION"), ['J']],
  ['M32', 13, 'no export path', L + 'ledger.js', R("export const LEDGER_VERSION", "import { writeFileSync } from 'node:fs';\nexport const dump = (l) => writeFileSync('/tmp/ledger.json', JSON.stringify(l));\nexport const LEDGER_VERSION"), ['J']],
  ['M33', 13, 'no public-serving path', PKG + '/validate-intake.mjs', R("import { validateIntake } from './lib/intake.js';", "import { validateIntake } from './lib/intake.js';\nimport { createServer } from 'node:http';\ncreateServer(() => {}).listen(8080);"), ['J']],
  ['M34', 14, 'no package artifact in a deployable path', 'index.html', (s) => s.replace('</body>', '<!-- tools/evaluation-readiness/readiness-registry.json --></body>'), ['J'], ['evaluation-readiness-registry.json', '{"marker":"jrs-evaluation-readiness"}\n']],
  ['M35', 14, '.vercelignore keeps tools/ excluded', '.vercelignore', R('\ntools/\n', '\n'), ['J']],
  ['M36', 'extra', 'the ledger refuses role substitution (LED-04)', L + 'ledger.js', R("    if (c.kind !== 'human') refuse('role_substitution'", "    if (false) refuse('role_substitution'"), ['F']],
  ['M37', 'extra', 'the ledger chain detects edits (LED-07)', L + 'ledger.js', R("  if ('entry_digest' in e && e.entry_digest !== entryDigest(e)) refuse(", "  if (false) refuse("), ['F']],
  ['M38', 'extra', 'no ledger entry advances a gate (LED-06)', L + 'ledger.js', R("['none', 'informs', 'required_for'].includes(g.effect)", "['none', 'informs', 'required_for', 'advances'].includes(g.effect)"), ['F']],
  ['M39', 'extra', 'the committed ledger is never edited', PKG + '/ledger/future-run-ledger.json', J((o) => { o.entries[0].limitation += ' (edited)'; }), ['F']],
  ['M40', 'extra', 'a planning manifest never classifies as complete (REG)', L + 'registry.js', R("if (binding.kind === 'planning' || missing.length)", "if (missing.length)"), ['B']],
  ['M41', 'extra', 'the inference screen (WS-07)', L + 'workspace.js', R("if (typeof item[k] === 'string' && inferenceGroups(item[k]).length) refuse(", "if (false) refuse("), ['E']],
  ['M42', 'extra', 'no record text in a workspace (WS-02)', L + 'workspace.js', R("    if (RECORD_TEXT_FIELDS.includes(k)) refuse('record_text_in_workspace'", "    if (false) refuse('record_text_in_workspace'"), ['E']],
  ['M43', 'extra', 'no gate conclusion in a workspace (WS-01)', L + 'workspace.js', R("  if (item.kind === 'GATE_CONCLUSION') refuse(", "  if (false) refuse("), ['E']],
  ['M44', 'extra', 'the repository scan finds reserved locations (SCAN-01)', L + 'scan.js', R("      add('SCAN-01', f,", "      void ('SCAN-01', f,"), ['suite:scan.test.mjs']],
  ['M45', 'extra', 'the codebook binding matches codebook.html v1.0', MAP, J((o) => { o.codebook_source.revision = '1.1'; }), ['C']],
];

async function verifyIn(base) {
  const V = await import(join(base, PKG, 'lib/verify.js') + '?' + Math.random());
  return V.verifyReadinessPackage({ root: base + '/' });
}
const suite = (base, file) => { try { execFileSync(process.execPath, [join(ROOT, 'tests/evaluation-readiness', file)], { env: { ...process.env, ER_ROOT: base, ER_MUTATION_CHILD: '1' }, stdio: 'ignore', timeout: 300000 }); return true; } catch { return false; } };

{
  const base = overlay([PKG]);
  const v = await verifyIn(base);
  t('baseline: the unmutated overlay verifies', v.ok, v.problems.join(' | '));
  t('baseline: the scan suite passes in the overlay', suite(base, 'scan.test.mjs'));
  rmSync(base, { recursive: true, force: true });
}
let caught = 0;
const covered = new Set();
for (const [id, brief, what, file, edit, sections, create] of MUTATIONS) {
  const base = overlay([...new Set([PKG, file])]);
  try {
    const p = join(base, file);
    writeFileSync(p, edit(readFileSync(p, 'utf8')));
    if (create) { mkdirSync(dirname(join(base, create[0])), { recursive: true }); writeFileSync(join(base, create[0]), create[1]); }
    let ok, where;
    if (sections[0].startsWith('suite:')) { ok = !suite(base, sections[0].slice(6)); where = sections[0]; }
    else {
      const v = await verifyIn(base);
      const fired = v.problems.map((x) => x.split(':')[0]);
      ok = !v.ok && sections.some((s) => fired.includes(s));
      where = 'section ' + sections.filter((s) => fired.includes(s)).join('+');
      if (!ok) where = 'SURVIVED; fired ' + JSON.stringify([...new Set(fired)]) + ' ' + v.problems.slice(0, 2).join(' | ');
    }
    if (ok) { caught++; covered.add(brief); }
    t(id + ' [' + (brief === 'extra' ? 'extra' : 'brief ' + brief) + '] ' + what + (ok ? ': caught (' + where + ')' : ''), ok, ok ? '' : where);
  } catch (e) { t(id + ' ' + what + ': mutation could not be applied (' + e.message + ')', false); }
  finally { rmSync(base, { recursive: true, force: true }); }
}
const missing = Array.from({ length: 14 }, (_, i) => i + 1).filter((n) => !covered.has(n));
t('every one of the 14 required mutation classes is exercised and caught', missing.length === 0, 'not covered: ' + missing.join(', '));
console.log(`\n${MUTATIONS.length} mutations, ${caught} caught, ${MUTATIONS.length - caught} survived`);
console.log(`${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);

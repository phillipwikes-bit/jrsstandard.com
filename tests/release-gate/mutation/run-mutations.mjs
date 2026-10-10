// Mutation run for the release-gate package: each fail-closed safeguard is removed, one at a
// time, from a throwaway copy of lib/release-gate/, and the suite (pointed at the copy through
// JRS_RG_LIB) must then FAIL. A mutation no suite catches is reported SURVIVED and fails the run.
// The working tree is never modified.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../../', import.meta.url).pathname;
const SRC = join(ROOT, 'lib/release-gate');
// [id, safeguard, file in lib/release-gate, exact text, replacement]
export const MUTATIONS = [
  ['R01', 'non-production classes can never pass', 'validator.js', "if (!EVIDENCE_CLASSES[e.evidence_class] || !EVIDENCE_CLASSES[e.evidence_class].production_evidence) err(", "if (false) err("],
  ['R02', 'each evidence item must be of a satisfying class', 'validator.js', "if (!sd.satisfied_by.includes(e.evidence_class)) err(sw,", "if (false) err(sw,"],
  ['R03', 'each evidence item must be of a satisfying kind', 'validator.js', "else if (!sd.kinds.includes(e.artifact_kind)) err(sw,", "else if (false) err(sw,"],
  ['R04', 'class and provenance must agree', 'validator.js', "|| cls.provenance !== e.provenance) err(", ") err("],
  ['R05', 'class and artifact kind must agree', 'validator.js', "|| !cls.kinds.includes(e.artifact_kind)) err(", ") err("],
  ['R06', 'a gate cannot pass ahead of its prerequisites', 'validator.js', "if (g.status === 'PASS') err('$.gates.' + def.id, 'PASS while prerequisite '", "if (false) err('$.gates.' + def.id, 'PASS while prerequisite '"],
  ['R07', 'owner authorization refused before prerequisites', 'validator.js', "if (g.owner_decision && g.owner_decision.decision === 'release_authorized') err('$.gates.' + def.id, 'owner release authorization refused", "if (false) err('$.gates.' + def.id, 'owner release authorization refused"],
  ['R08', 'gate Engine version must match the record', 'validator.js', "if (g.engine_version !== engine.engine_version) err(", "if (false) err("],
  ['R09', 'engine-specific evidence must name the Engine version', 'validator.js', "if (def.engine_specific && e.applies_to_engine_version !== engine.engine_version) err(", "if (false) err("],
  ['R10', 'independent reviewer required for PASS', 'validator.js', "if (!g.independent_reviewer) err(w, 'PASS needs an independent_reviewer');", "if (false) err(w, 'PASS needs an independent_reviewer');"],
  ['R11', 'independent reviewer cannot be the record author', 'validator.js', "if (who === record.record_author.trim().toLowerCase()) err(", "if (false) err("],
  ['R12', 'every required gate must be present', 'validator.js', "for (const id of GATE_IDS) if (!byId.has(id)) err(", "for (const id of []) if (!byId.has(id)) err("],
  ['R13', 'every defined sub-control must be present', 'validator.js', "for (const d of def.sub_controls) if (!scIds.includes(d.id)) err(", "for (const d of []) if (!scIds.includes(d.id)) err("],
  ['R14', 'PASS needs an actual result', 'validator.js', "if (blank(g.actual_result)) err(w, 'PASS needs actual_result');", ""],
  ['R15', 'PASS sub-control needs evidence', 'validator.js', "if (!usable.length) { err(sw, 'PASS needs evidence'); return; }", "if (!usable.length) return;"],
  ['R16', 'a PASS gate needs every sub-control passed', 'validator.js', "for (const s of scs) if (s.status !== 'PASS' && s.status !== 'NOT_APPLICABLE') err(", "for (const s of []) if (s.status !== 'PASS') err("],
  ['R17', 'no required gate may be NOT_APPLICABLE', 'validator.js', "if (g.status === 'NOT_APPLICABLE') err(w,", "if (false) err(w,"],
  ['R18', 'placeholder hashes refused', 'validator.js', "if (/^0{64}$|^(.)\\1{63}$/.test(e.sha256)) err(", "if (false) err("],
  ['R19', 'evidence cannot postdate the record', 'validator.js', "else if (realDate(record.as_of) && e.evidence_date > record.as_of) err(", "else if (false) err("],
  ['R20', 'open status must say what is missing', 'validator.js', "if (OPEN.includes(g.status) && !g.missing_dependencies.length) err(", "if (false) err("],
  ['R21', 'RG-1 PASS needs per-condition results', 'validator.js', "if (!Array.isArray(g.per_condition_results) || !g.per_condition_results.length) err(w, 'PASS needs per_condition_results with uncertainty');", "if (false) err(w, 'x');"],
  ['R22', 'release_authorized only on RG-4', 'validator.js', "if (d.decision === 'release_authorized' && g.gate_id !== 'RG-4') err(", "if (false) err("],
  ['R23', 'conclusion requires every gate to pass', 'validator.js', "const all = GATE_IDS.every(", "const all = GATE_IDS.some("],
  ['R24', 'unsupported schema version refused', 'validator.js', "if (!SUPPORTED_SCHEMA_VERSIONS.includes(record.schema_version)) return", "if (false) return"],
  ['R25', 'schema checker fails closed on unknown keywords', 'schema-check.js', "if (!KNOWN.has(k)) { errors.push(", "if (false) { errors.push("],
  ['R26', 'schema checker refuses unknown fields', 'schema-check.js', "else if (node.additionalProperties === false) errors.push(", "else if (false) errors.push("],
  ['R27', 'schema status vocabulary excludes readiness words', 'schema/release-gate-record.schema.json', '"enum": ["NOT_ASSESSED", "PENDING", "BLOCKED", "PASS", "FAIL", "NOT_APPLICABLE"]', '"enum": ["NOT_ASSESSED", "PENDING", "BLOCKED", "PASS", "FAIL", "NOT_APPLICABLE", "READY"]'],
  ['R28', 'schema forbids created authorizations', 'schema/release-gate-record.schema.json', '"production": { "type": "boolean", "const": false },', '"production": { "type": "boolean" },'],
  ['R29', 'report carries its limitations', 'report.js', "for (const l of record.package_limitations) L.push('- ' + l);", ""],
  ['R30', 'report carries the not-a-clearance statement', 'report.js', "L.push(NOT_A_CLEARANCE);", "L.push('');"],
  ['R31', 'report completeness check looks for limitations', 'report.js', "for (const l of record.package_limitations) if (!markdown.includes(l)) p.push(", "for (const l of []) if (!markdown.includes(l)) p.push("],
  ['R32', 'report refuses an invalid record', 'report.js', "if (!v.valid) throw new Error('refusing to render an invalid record:\\n' + v.errors.join('\\n'));", ""],
  ['R33', 'a policy document is not operator-control evidence', 'vocabulary.js', "kinds: ['access_review_export', 'rotation_record',", "kinds: ['policy_document', 'access_review_export', 'rotation_record',"],
  ['R34', 'mocked tests are not production evidence', 'vocabulary.js', "MOCKED_TEST:               { provenance: 'mocked',          kinds: ['test_output'], production_evidence: false },", "MOCKED_TEST:               { provenance: 'mocked',          kinds: ['test_output'], production_evidence: true },"],
];

const base = mkdtempSync(join(tmpdir(), 'jrs-rg-mutation-'));
const lib = join(base, 'release-gate') + '/';
const runSuite = () => {
  try { execFileSync(process.execPath, [join(ROOT, 'tests/release-gate/run-all.mjs'), '--quick'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, JRS_RG_LIB: lib, JRS_RG_MUTATION_CHILD: '1' } }); return { failed: false, suites: [] }; }
  catch (e) { return { failed: true, suites: String(e.stdout || '').split('\n').filter((l) => /: FAILED$/.test(l)).map((l) => l.split(':')[0]) }; }
};
let survived = 0;
try {
  cpSync(SRC, lib, { recursive: true });
  const baseline = runSuite();
  console.log(`${baseline.failed ? 'FAIL' : 'PASS'}  baseline: the unmutated copy passes${baseline.failed ? ' (' + baseline.suites.join(', ') + ')' : ''}`);
  if (baseline.failed) survived++;
  for (const [id, what, file, find, repl] of MUTATIONS) {
    rmSync(lib, { recursive: true, force: true }); cpSync(SRC, lib, { recursive: true });
    const p = join(lib, file), src = readFileSync(p, 'utf8'), count = src.split(find).length - 1;
    if (count !== 1) { survived++; console.log(`FAIL  ${id} ${what}: the mutation text occurs ${count} times, so it was not applied`); continue; }
    writeFileSync(p, src.replace(find, repl));
    const r = runSuite();
    if (!r.failed) survived++;
    console.log(`${r.failed ? 'PASS' : 'FAIL'}  ${id} ${what}: ${r.failed ? 'caught by ' + r.suites.join(', ') : 'SURVIVED'}`);
  }
} finally { rmSync(base, { recursive: true, force: true }); }
console.log(`\n${MUTATIONS.length} mutations, ${MUTATIONS.length - survived} caught, ${survived} survived`);
process.exit(survived ? 1 : 0);

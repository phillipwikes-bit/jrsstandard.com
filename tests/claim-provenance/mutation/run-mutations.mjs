// Mutation run for the claim-provenance controls, in two parts. The working tree is never modified.
//
// Part A, statement insertion: each prohibited statement is written into a synthetic public page
// (a throwaway directory, never a real page). The scanner must reject it, and the same statement,
// put into the permitted wording of the claim it abuses, must be rejected by the claim validator.
//
// Part B, control removal: each control is removed, one at a time, from a throwaway overlay in
// which tools/claim-provenance/ is copied and everything else is a symlink to the working tree.
// The suite, pointed at the overlay through CP_ROOT, must then FAIL.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { scanSynthetic, problems, claim } from '../_helpers.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
let pass = 0, fail = 0;
const t = (n, ok) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); };

// ---- Part A -------------------------------------------------------------------------------------------
// [id, statement, the claim whose permitted wording it would replace]
export const INSERTIONS = [
  ['A01 detection labelled reliability', 'On a constructed 24-record corpus, 16 reviewers showed 83.9% reliability.', 'CL-001'],
  ['A02 cross-model agreement labelled accuracy', 'Across 61 recorded runs the three models were 85.3 percent accurate, raw agreement 66.7 to 93.3 percent.', 'CL-005'],
  ['A03 constructed result presented as real-world', 'On a constructed 24-record corpus, 16 reviewers reached 83.9% accuracy on real records.', 'CL-001'],
  ['A04 Engine validation from JRS research', 'The Review Engine is validated by the 83.9% detection accuracy of our research.', 'CL-027'],
  ['A05 local mock presented as production evidence', 'Our Review Engine is in production use; a local run with a mock adapter over 15 constructed records confirms it.', 'CL-016'],
  ['A06 source grounding presented as semantic validation', 'The Review Engine findings are semantically correct because every quotation occurs exactly in the record; this is not semantic support.', 'CL-014'],
  ['A07 licensing-ready or sale-ready status', 'The JRS Review Engine is licensing-ready and sale-ready; no licensing pathway is closed.', 'CL-029'],
  ['A08 recorded limitation omitted', '16 reviewers reached 83.9% accuracy against a verified key (24 records).', 'CL-001'],
  ['A09 denominator removed', 'Raw agreement across three models ranged from 66.7 to 93.3 percent, mean 85.3 percent.', 'CL-005'],
  ['A10 denominator swapped between windows', 'Across 37 runs, raw agreement ranged from 66.7 to 93.3 percent, mean 85.3 percent.', 'CL-005'],
  ['A11 historical figure presented as current', 'Latest cross-model agreement: 86.7%.', 'CL-007'],
  ['A12 methodology presented as validated', 'JRS is a validated standard; the research does not establish general validation.', 'CL-028'],
];
for (const [id, s, cid] of INSERTIONS) {
  const r = scanSynthetic('<p>' + s + '</p>');
  const scanRejects = r.gate.unproposed > 0 && r.findings.some((f) => ['UNSUPPORTED', 'REQUIRES_REPAIR'].includes(f.disposition));
  const c = claim(cid); c.permitted_wording = s;
  const validatorRejects = problems(c).length > 0;
  t(id + ': scanner rejects' + (scanRejects ? '' : ' (FAILED)') + ', validator rejects' + (validatorRejects ? '' : ' (FAILED)'), scanRejects && validatorRejects);
}

// ---- Part B -------------------------------------------------------------------------------------------
const L = 'tools/claim-provenance/lib/', RU = L + 'rules.js', SC = L + 'scan.js', CL = L + 'claims.js', SCH = 'tools/claim-provenance/schema/claim-record.schema.json', B = 'tools/claim-provenance/build.mjs';
export const MUTATIONS = [
  ['M01', 'G01 detection labelled reliability', RU, "if (r.claim_topic === 'DETECTION' && asserts(", "if (false && asserts("],
  ['M02', 'G03 cross-model labelled accuracy', RU, "if (r.claim_topic === 'CROSS_MODEL' && asserts(", "if (false && asserts("],
  ['M03', 'G04 constructed presented as real-world', RU, "if (constructed && asserts(perm,", "if (false && asserts(perm,"],
  ['M04', 'G05 local evidence presented as production', RU, "if (LOCAL_CLASSES.includes(r.evidence_class) && (asserts(", "if (false && (asserts("],
  ['M05', 'G06 source grounding as semantic validation', RU, "if (r.evidence_class === 'SOURCE_GROUNDING_TEST' && (", "if (false && ("],
  ['M06', 'G07 Engine validation from research', RU, "&& r.status !== 'NOT_SUPPORTED') p.push(where + ': G07 Engine", "&& false) p.push(where + ': G07 Engine"],
  ['M07', 'G09 required denominator', RU, "&& q && q.denominator_required && !(", "&& false && !("],
  ['M08', 'G11 readiness in permitted wording', RU, "if (asserts(perm, READINESS)) p.push(", "if (false) p.push("],
  ['M09', 'G12 recorded limitation omitted', RU, "if (r.limitation_key && !perm.toLowerCase()", "if (false && !perm.toLowerCase()"],
  ['M10', 'G13 unreconciled source hash', RU, "if (ev.current_hash !== ev.reviewed_hash) p.push(", "if (false) p.push("],
  ['M11', 'claim with no evidence source', RU, "if (r.evidence_class === 'NONE' && !['NOT_SUPPORTED'", "if (false && !['NOT_SUPPORTED'"],
  ['M12', 'schema: SUPPORTED requires a source', SCH, '"source_path": { "type": "string", "minLength": 1 },\n          "source_hash"', '"source_hash"'],
  ['M13', 'scanner: unowned figure', SC, "else results.push({ kind: 'FIGURE', disposition: 'UNSUPPORTED'", "else results.push({ kind: 'FIGURE', disposition: 'PERMITTED'"],
  ['M14', 'scanner: missing qualifier', SC, "else if (missing.length && !limitationOnly) { d = 'REQUIRES_REPAIR';", "else if (false) { d = 'REQUIRES_REPAIR';"],
  ['M15', 'scanner: prohibited overstatement', SC, "else if (bad.length) { d = 'UNSUPPORTED';", "else if (false) { d = 'UNSUPPORTED';"],
  ['M16', 'scanner: status claims (readiness, validation, licensing)', SC, "if (!pat.test(text) || !SUBJECT.test(text)) continue;", "continue;"],
  ['M17', 'scanner: Engine transfer', SC, "disposition: negated ? 'PERMITTED' : 'UNSUPPORTED'", "disposition: 'PERMITTED'"],
  ['M18', 'scanner: historical figure presented as current', SC, "d = historical ? 'HISTORICAL' : 'REQUIRES_REPAIR';", "d = 'HISTORICAL';"],
  ['M19', 'scanner: restricted surfaces excluded', SC, "else if (keep(rel) && !RESTRICTED.has(rel)) out.push(rel);", "else if (keep(rel)) out.push(rel);"],
  ['M20', 'gate: an unproposed finding fails', SC, "const unproposed = gated.filter((f) => ['UNSUPPORTED', 'REQUIRES_REPAIR'].includes(f.disposition) && !f.proposed_replacement);", "const unproposed = [];"],
  ['M21', 'claims: the 37-run window qualifier', CL, "'13 August|15 August|29 June', 'sentence'", "'.', 'sentence'"],
  ['M23', 'scanner: source grounding presented as semantic validation', SC, "  ['SOURCE_GROUNDING_AS_SEMANTIC', /", "  ['SOURCE_GROUNDING_AS_SEMANTIC', /(?!)"],
  ['M24', 'scanner: a historical stub must be noindex', SC, "/<meta[^>]+noindex/i.test(text) && ", ""],
  ['M22', 'builder: a changed source is refused', B, "if (e.binding !== 'NONE' && current !== null && current !== e.reviewed_sha256) problem =", "if (false) problem ="],
];

const base = mkdtempSync(join(tmpdir(), 'jrs-cp-mutation-'));
for (const name of readdirSync(ROOT)) if (name !== '.git' && name !== 'tools') symlinkSync(join(ROOT, name), join(base, name));
mkdirSync(join(base, 'tools'));
for (const name of readdirSync(join(ROOT, 'tools'))) if (name !== 'claim-provenance') symlinkSync(join(ROOT, 'tools', name), join(base, 'tools', name));
const COPY = 'tools/claim-provenance';
const fresh = () => { rmSync(join(base, COPY), { recursive: true, force: true }); cpSync(join(ROOT, COPY), join(base, COPY), { recursive: true }); };
const suite = () => { try { execFileSync(process.execPath, [join(ROOT, 'tests/claim-provenance/run-all.mjs')], { env: { ...process.env, CP_ROOT: base, CP_MUTATION_CHILD: '1' }, stdio: 'ignore', timeout: 900000 }); return true; } catch { return false; } };
fresh();
t('baseline: the unmutated overlay passes every suite', suite());
let caught = 0;
for (const [id, control, file, find, repl] of MUTATIONS) {
  fresh();
  const p = join(base, file), src = readFileSync(p, 'utf8');
  if (!src.includes(find)) { t(id + ' ' + control + ': mutation text not found (control moved?)', false); continue; }
  writeFileSync(p, src.replace(find, repl));
  const ok = !suite(); if (ok) caught++;
  t(id + ' ' + control + (ok ? ': caught' : ': SURVIVED'), ok);
}
rmSync(base, { recursive: true, force: true });
console.log(`\n${INSERTIONS.length} insertions; ${MUTATIONS.length} mutations, ${caught} caught, ${MUTATIONS.length - caught} survived`);
process.exit(fail ? 1 : 0);

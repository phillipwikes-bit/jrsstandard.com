// Mutation run for the source-alignment safeguards. The working tree is never modified.
//
// Each safeguard is removed, one at a time, from a throwaway overlay in which
// tools/source-alignment/ is copied and everything else (the local sources included) is a symlink
// to the working tree. The verifier suite, pointed at the overlay through SA_ROOT, must then FAIL
// on the named case, which asserts the specific problem that safeguard reports. A general
// stale-output failure (section K) never counts: every case asserts its own section and message.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../../', import.meta.url).pathname;
let pass = 0, fail = 0;
const t = (n, ok) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); };

const V = 'tools/source-alignment/lib/verify.js', B = 'tools/source-alignment/lib/build.js';
// [id, safeguard, file, [[find, replace], ...], the verifier case that must then fail]
export const MUTATIONS = [
  ['M01', '1 fail closed when a source is absent', V, [["if (!s.present) fail('A'", "if (false) fail('A'"], ["else if (!s.ok) fail('A'", "else if (s.present && !s.ok) fail('A'"]], 'T03'],
  ['M02', '11 a modified source is refused', V, [["else if (!s.ok) fail('A'", "else if (false) fail('A'"]], 'T02'],
  ['M03', '1 the receipt hash must equal the handoff hash', V, [["if (r.sha256 !== HANDOFF_HASHES[id] || r.handoff_sha256 !== HANDOFF_HASHES[id]) fail(", "if (false) fail("]], 'T01'],
  ['M04', '2 a reproducible locator is required', V, [["{ fail('B', c.control_id + ' has no reproducible locator'); continue; }", "{ continue; }"]], 'T04'],
  ['M05', '2 each locator line hash is checked', V, [["if (lineHash(s, n) !== l.line_sha256[n - l.lines[0]])", "if (false)"]], 'T05'],
  ['M06', '3 an ALIGNED control needs repository evidence', V, [["&& !(c.evidence || []).length) fail('C'", "&& false) fail('C'"]], 'T06'],
  ['M07', '5 only the permitted evidence classes', V, [["if (!EVIDENCE_CLASSES.includes(e.class)) fail('C'", "if (false) fail('C'"]], 'T07'],
  ['M08', '4 no asserted Codebook correspondence', V, [["if (ASSERTED_MAPPING.test(s) && !NEGATION.test(s)) fail('D'", "if (false) fail('D'"]], 'T08'],
  ['M09', '6 the addendum copies every gate unchanged', V, [["for (const g of add.gates) if (g.status !== EXPECTED_GATES[g.gate_id] || g.status === 'PASS') fail(", "for (const g of add.gates) if (false) fail("]], 'T09'],
  ['M10', '6 the main record gates are unchanged', V, [["if (JSON.stringify(now) !== JSON.stringify(EXPECTED_GATES)) fail('E'", "if (false) fail('E'"]], 'T10'],
  ['M11', '6 the addendum advances nothing', V, [["if (add.advances_any_gate !== false || !Array.isArray(add.gates_changed) || add.gates_changed.length) fail(", "if (false) fail("]], 'T23'],
  ['M12', '6 the addendum is bound to the main record', V, [["if (add.binds.main_record_sha256 !== sha256(", "if (false && add.binds.main_record_sha256 !== sha256("]], 'T24'],
  ['M13', '7 no source text in a deployable file', V, [["for (const l of lines) if (l.length >= 60 && flat.includes(l)) {", "for (const l of lines) if (false) {"]], 'T11'],
  ['M14', '7 no controlled source path in a deployable file', V, [["if (/project_sources|controlled-sources", "if (false && /project_sources|controlled-sources"]], 'T12'],
  ['M15', '7 no six-word run of source text in an output', V, [["if (runs.has(w.slice(i, i + 6).join(' '))) { fail('F'", "if (false) { fail('F'"]], 'T13'],
  ['M16', '8 source-aligned needs a source control', V, [["if (i.source_aligned === true && (!Array.isArray(i.controls)", "if (false && (!Array.isArray(i.controls)"]], 'T14'],
  ['M17', '8 a still-present issue is never source-aligned', V, [["if (i.source_aligned === true && ['STILL_PRESENT'", "if (false && ['STILL_PRESENT'"]], 'T15'],
  ['M18', '9 a conflict is never silently converted', V, [["for (const c of ctl) if (byId[c] && byId[c].status !== 'CONFLICT' && x.resolution === null) fail(", "for (const c of ctl) if (false) fail("]], 'T16'],
  ['M19', '9 a conflict is never removed', V, [["if (!x) { fail('H', id + ' was removed from the conflict register'); continue; }", "if (!x) { continue; }"]], 'T17'],
  ['M20', '10 a human action is never completed by code', V, [["if (c.human_action && (c.human_action.completed !== false", "if (false && (c.human_action.completed !== false"]], 'T18'],
  ['M21', '10 a human-action control names the action', V, [["if (c.status === 'REQUIRES_HUMAN_ACTION' && !c.human_action) fail(", "if (false) fail("]], 'T19'],
  ['M22', '12 no unsupported validated or production-ready claim', V, [["if (UNSUPPORTED.test(s) && !NEGATION.test(s)) fail('J'", "if (false) fail('J'"]], 'T20'],
  ['M23', '12 no for-sale or licensed claim', V, [["|licensed|for sale|", "|"]], 'T21'],
  ['M24', 'the decision package keeps its sections', V, [["if (!d.includes(h)) fail('L'", "if (false) fail('L'"]], 'T22'],
  ['M25', 'the builder refuses unverified sources', B, [["if (bad.length) throw new Error('sources_not_verified: '", "if (false) throw new Error('sources_not_verified: '"]], 'B00'],
];

const base = mkdtempSync(join(tmpdir(), 'jrs-sa-mutation-'));
for (const name of readdirSync(ROOT)) if (name !== '.git' && name !== 'tools') symlinkSync(join(ROOT, name), join(base, name));
mkdirSync(join(base, 'tools'));
for (const name of readdirSync(join(ROOT, 'tools'))) if (name !== 'source-alignment') symlinkSync(join(ROOT, 'tools', name), join(base, 'tools', name));
const COPY = 'tools/source-alignment';
const fresh = () => { rmSync(join(base, COPY), { recursive: true, force: true }); cpSync(join(ROOT, COPY), join(base, COPY), { recursive: true }); };
// Returns the output of the verifier suite run against the overlay, and whether it passed.
const suite = (only) => {
  const env = { ...process.env, SA_ROOT: base, SA_MUTATION_CHILD: '1' }; if (only) env.SA_ONLY = only; else delete env.SA_ONLY;
  try { return { ok: true, out: execFileSync(process.execPath, [join(ROOT, 'tests/source-alignment/verifier.test.mjs')], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 900000 }) }; }
  catch (e) { return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') }; }
};
fresh();
t('baseline: the unmutated overlay passes every verifier case', suite().ok);
let caught = 0;
for (const [id, control, file, edits, target] of MUTATIONS) {
  fresh();
  const p = join(base, file); let src = readFileSync(p, 'utf8');
  const missing = edits.filter(([f]) => !src.includes(f));
  if (missing.length) { t(id + ' ' + control + ': mutation text not found (safeguard moved?)', false); continue; }
  for (const [f, r] of edits) src = src.replace(f, r);
  writeFileSync(p, src);
  const r = suite(target);
  const ok = !r.ok && new RegExp('^FAIL  ' + target + ' ', 'm').test(r.out);
  if (ok) caught++;
  t(id + ' ' + control + (ok ? ': caught by ' + target : ': SURVIVED (' + target + ' did not fail)'), ok);
}
rmSync(base, { recursive: true, force: true });
console.log(`\n${MUTATIONS.length} mutations, ${caught} caught, ${MUTATIONS.length - caught} survived`);
console.log(`${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);

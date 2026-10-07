// The verifier fails closed, in the section that owns each safeguard (work package F). Every case
// tampers with a throwaway overlay; the working tree and the local sources are never changed.
import { readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, ROOT, M, overlay, edit, create, drop, verifyIn, sections } from './_helpers.mjs';

const MX = 'tools/source-alignment/CONTROL_EXTRACTION_MATRIX.json', AU = 'tools/source-alignment/PUBLIC_POSITION_AUDIT.json', ADD = 'lib/release-gate/records/RG-SOURCE-ALIGNMENT-ADDENDUM_2026-10-07.json';
const DP = 'docs/architecture/SOURCE_ALIGNED_OWNER_DECISION_PACKAGE_2026-10-07.md', RC = 'tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json', RG = 'lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json';
const JE = (fn) => (s) => { const o = JSON.parse(s); fn(o); return JSON.stringify(o, null, 1) + '\n'; };
const ctl = (o, id) => o.controls.find((c) => c.control_id === id);
const S = M.sources.openSources(ROOT);
const aSourceLine = M.sources.identifyingLines(S.S02, 60)[3];
const aSourceRun = S.S01._lines[4].split(' ').slice(10, 18).join(' ');

const v0 = await verifyIn(ROOT);
t('the verifier passes on the committed package with the local sources present', v0.ok && v0.status === 'SOURCE_ALIGNMENT_CONSISTENT', v0.problems.slice(0, 5).join(' | '));
t('the verifier states that a pass validates nothing and closes no gate', /validates nothing, closes no release gate and authorizes nothing/.test(v0.statement));

// [case id, safeguard, files to copy, tamper, owning section, the specific problem it must report]
// SA_ONLY=T05,B00 runs a subset (the mutation run uses it to reach the case a mutation targets).
export const CASES = [
  ['T01', '1 a referenced source hash differs', [RC], (b) => edit(b, RC, JE((o) => { o.sources[1].sha256 = o.sources[1].sha256.replace(/^./, (c) => (c === 'a' ? 'b' : 'a')); })), 'A', /receipt hash differs from the 5 October handoff value/],
  ['T02', '11 a controlled source document is modified', ['project_sources'], (b) => edit(b, 'project_sources/02_JRS_Evidence_Ledger_Source_Aligned_2026-10-03.md', (s) => s + ' '), 'A', /does not match its receipt/],
  ['T03', '1 the controlled sources are absent (fail closed)', ['project_sources'], (b) => { for (const f of readdirSync(join(b, 'project_sources'))) unlinkSync(join(b, 'project_sources', f)); }, 'A', /is absent/],
  ['T04', '2 a source-control record lacks a reproducible locator', [MX], (b) => edit(b, MX, JE((o) => { ctl(o, 'SAC-03').locator.line_sha256 = []; })), 'B', /has no reproducible locator/],
  ['T05', '2 a locator no longer hashes to the cited line', [MX], (b) => edit(b, MX, JE((o) => { ctl(o, 'SAC-21').locator.line_sha256[0] = '0'.repeat(64); })), 'B', /does not hash to the cited line/],
  ['T06', '3 a control marked ALIGNED lacks repository evidence', [MX], (b) => edit(b, MX, JE((o) => { ctl(o, 'SAC-01').evidence = []; })), 'C', /without repository evidence/],
  ['T07', '5 a local or synthetic artifact is classified as independent evidence', [MX], (b) => edit(b, MX, JE((o) => { ctl(o, 'SAC-14').evidence[0].class = 'INDEPENDENT_EVALUATION_EVIDENCE'; })), 'C', /evidence class \S+ is not permitted/],
  ['T08', '4 a candidate key is asserted as a Codebook correspondence', [DP], (b) => edit(b, DP, (s) => s + '\nThe key basis_identification corresponds to the Codebook condition RC2.\n'), 'D', /asserts a candidate-key correspondence/],
  ['T09', '6 a release gate is advanced in the addendum', [ADD], (b) => edit(b, ADD, JE((o) => { o.gates[0].status = 'PASS'; })), 'E', /the addendum gives/],
  ['T10', '6 a release-gate status changes in the main record', [RG], (b) => edit(b, RG, JE((o) => { o.gates[2].status = 'BLOCKED'; })), 'E', /release-gate status in the main record changed/],
  ['T11', '7 source content appears in a public, deployable file', [], (b) => create(b, 'notes-public.html', '<p>' + aSourceLine + '</p>\n'), 'F', /public or deployable file containing source text/],
  ['T12', '7 a public page links to a controlled source path', ['index.html'], (b) => edit(b, 'index.html', (s) => s.replace('</body>', '<a href="/project_sources/01_JRS_Master_Asset_Register_Source_Aligned_2026-10-03.md">x</a></body>')), 'F', /names a controlled source path/],
  ['T13', '7 a package output reproduces a run of source text', [DP], (b) => edit(b, DP, (s) => s + '\nNote: ' + aSourceRun + '.\n'), 'F', /six-word run of source text/],
  ['T14', '8 a public claim is marked source-aligned with no source control', [AU], (b) => edit(b, AU, JE((o) => { const i = o.items.find((x) => x.id === 'PPA-10'); i.controls = []; })), 'G', /without a matching source control/],
  ['T15', '8 a still-present public issue is marked source-aligned', [AU], (b) => edit(b, AU, JE((o) => { o.items.find((x) => x.id === 'PPA-09').source_aligned = true; })), 'G', /but marked source-aligned/],
  ['T16', '9 a conflict is silently converted to aligned', [MX], (b) => edit(b, MX, JE((o) => { ctl(o, 'SAC-38').status = 'ALIGNED'; })), 'H', /was converted from CONFLICT/],
  ['T17', '9 a conflict is removed from the register', [MX], (b) => edit(b, MX, JE((o) => { o.conflicts = o.conflicts.filter((x) => x.id !== 'CF-SA-04'); })), 'H', /was removed from the conflict register/],
  ['T18', '10 a human-only action is represented as completed by code', [MX], (b) => edit(b, MX, JE((o) => { ctl(o, 'SAC-10').human_action.completed = true; })), 'I', /represents a human action as completed/],
  ['T19', '10 a human-action control names no person or act', [MX], (b) => edit(b, MX, JE((o) => { ctl(o, 'SAC-12').human_action = null; })), 'I', /requires human action but names none/],
  ['T20', '12 an output states an unsupported validated or production-ready claim', [DP], (b) => edit(b, DP, (s) => s + '\nThe Engine is validated and production-ready.\n'), 'J', /states an unsupported claim/],
  ['T21', '12 an output states that JRS is for sale or licensed', [DP], (b) => edit(b, DP, (s) => s + '\nThe asset is licensed and for sale.\n'), 'J', /states an unsupported claim/],
  ['T23', '6 the addendum claims to advance a gate', [ADD], (b) => edit(b, ADD, JE((o) => { o.advances_any_gate = true; })), 'E', /claims to advance or change a gate/],
  ['T24', '6 the addendum is no longer bound to the main record', [ADD], (b) => edit(b, ADD, JE((o) => { o.binds.main_record_sha256 = '0'.repeat(64); })), 'E', /not bound to the current main record/],
  ['T22', 'the owner decision package loses a required section', [DP], (b) => edit(b, DP, (s) => s.replace('## 3. Conflicts requiring an owner decision', '## 3. Notes')), 'L', /decision package section missing/],
];
const ONLY = process.env.SA_ONLY ? process.env.SA_ONLY.split(',') : null;
for (const [id, what, copies, tamper, section, expect] of CASES) {
  if (ONLY && !ONLY.includes(id)) continue;
  const b = overlay(copies);
  try {
    tamper(b);
    const v = await verifyIn(b);
    const hit = v.problems.some((p) => p.startsWith(section + ': ') && expect.test(p));
    t(id + ' fails closed in section ' + section + ': ' + what, !v.ok && hit, 'sections fired: ' + sections(v).join(',') + ' | ' + v.problems.slice(0, 3).join(' | '));
  } finally { drop(b); }
}

// The builder refuses to build without verified sources.
if (!ONLY || ONLY.includes('B00')) {
  const b = overlay(['project_sources']);
  try {
    for (const f of readdirSync(join(b, 'project_sources'))) unlinkSync(join(b, 'project_sources', f));
    const B = await import(join(b, 'tools/source-alignment/lib/build.js') + '?' + Math.random());
    let threw = false; try { B.buildAll(b); } catch (e) { threw = /sources_not_verified/.test(e.message); }
    t('B00 the builder refuses to build when the sources are absent', threw);
  } finally { drop(b); }
}
done();

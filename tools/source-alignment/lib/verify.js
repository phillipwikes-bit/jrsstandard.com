// JRS source alignment: verifier. INTERNAL. FAILS CLOSED.
//
//   A  sources: each of the three local files present, byte-identical to its receipt and to the handoff hash
//   B  locators: every control cites a reproducible line range whose line hashes match the source
//   C  evidence: an ALIGNED or PARTIALLY_ALIGNED control names evidence that exists; no evidence item
//      is classed as independent; no local or synthetic artifact is called independent evidence
//   D  Codebook: no candidate key is asserted as a Codebook correspondence; no correspondence record exists
//   E  release gates: the addendum copies every status unchanged, advances nothing and is bound to the main record
//   F  boundary: no source text (line or six-word run) in any package output, and no source path or text
//      in any public or deployable file
//   G  public audit: a claim marked source-aligned cites a control; a still-present issue is never marked aligned
//   H  conflicts: every recorded conflict stays a conflict; none is silently converted to aligned
//   I  human actions: none is represented as completed by code
//   J  claims: no package output states an unsupported validated, production-ready, licensed, for-sale or compliant claim
//   K  generated outputs equal a fresh build
//   L  documents: the owner decision package and the reports carry their required content
// A pass shows the reconciliation is internally consistent with the local sources. It validates
// nothing, closes no gate and authorizes nothing.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, RECEIPT, openSources, lineHash, identifyingLines } from './sources.js';
import { buildAll, OUT, STATUSES, MAIN_RECORD, MAIN_REPORT } from './build.js';
import { sha256 } from './sources.js';

export const VERIFIER_VERSION = 'jrs-source-alignment-verifier/0.1.0';
export const EXPECTED_GATES = Object.freeze({ 'RG-1': 'BLOCKED', 'RG-2': 'BLOCKED', 'RG-3': 'NOT_ASSESSED', 'RG-4': 'BLOCKED', 'RG-5': 'BLOCKED' });
export const HANDOFF_HASHES = Object.freeze({ S01: '0c64eaff74cae34b4c4fbe00c93ae80ac81007c59ecfe68d6f0a1f9ada795c5e', S02: '57e2ec50fc431381b65048f978175e779481bb174993448cd1b475a218dad0e0', S03: 'a8822d7f54012dd646d822ab2eaca1b00a77e4c7f2c81522c61e6d774573efe9' });
// Conflicts recorded on 2026-10-07 and the controls they hold. Each must stay a conflict until an owner record resolves it.
export const KNOWN_CONFLICTS = Object.freeze({ 'CF-SA-01': ['SAC-05'], 'CF-SA-02': ['SAC-16'], 'CF-SA-03': ['SAC-15'], 'CF-SA-04': ['SAC-38'], 'CF-SA-05': ['SAC-11'], 'CF-SA-06': ['SAC-29'] });
export const REQUIRED_TOPICS = Object.freeze(['public_controlled_boundary', 'version_bound_identity', 'source_prompt_config_binding', 'independent_human_dispositions', 'separation_of_extraction_and_evaluation',
  'no_psychological_or_intent_inference', 'no_premature_drr_scoring', 'extraction_failure_reporting', 'sealed_holdout_separation', 'no_release_from_local_progress', 'release_gates', 'research_distinction', 'protected_implementation', 'rights_provenance']);
export const EVIDENCE_CLASSES = Object.freeze(['SOURCE_CODE', 'LOCAL_TEST', 'SYNTHETIC_FIXTURE', 'REPOSITORY_RECORD', 'PUBLIC_PAGE', 'SOURCE_CITATION']);
export const DISPOSITIONS = Object.freeze(['ALREADY_CORRECTED', 'STILL_PRESENT', 'HISTORICAL_ONLY', 'NOT_ASSESSABLE_FROM_SOURCE_SET', 'REQUIRES_OWNER_OR_COUNSEL_REVIEW']);
export const DECISION_PACKAGE = 'docs/architecture/SOURCE_ALIGNED_OWNER_DECISION_PACKAGE_2026-10-07.md';
export const CONTROL_SET = 'docs/architecture/SOURCE_ALIGNED_CONTROL_SET_2026-10-03.md';
const CANDIDATE_KEYS = ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability'];
const CODEBOOK_LABELS = ['Reconstructability', 'Basis Identification', 'Chronology', 'Decision-Process Traceability', 'Evidentiary Sufficiency', 'RC1', 'RC2', 'RC3', 'RC4', 'RC5'];
const ASSERTED_MAPPING = new RegExp('\\b(' + CANDIDATE_KEYS.join('|') + ')\\b[^.\\n|]{0,40}\\b(?:corresponds? to|maps? to|mapped to|is equivalent to|equals)\\b[^.\\n|]{0,40}(' + CODEBOOK_LABELS.join('|') + ')', 'i');
const UNSUPPORTED = /\b(validated|production-ready|production ready|licensed|for sale|legally compliant|compliant|LICENSING_READY|SALE_READY|DEMO_READY|READY_FOR_PAID_EVALUATION|release-ready|approved for (?:release|use)|independently evaluated)\b/i;
const NEGATION = /\b(not|no|never|neither|nor|without|absent|none|cannot|is not|are not|does not|do not|remains? open|unless|until|before any|prohibit\w*|refus\w*|disclaim\w*)\b|NOT_|_NOT\b/i;
const PUBLIC_EXCLUDED_TOP = new Set(['.git', 'node_modules', 'tools', 'tests', 'lib', 'research', 'scripts', '.jrs', '.claude', 'supabase', 'templates', 'build', 'standard', 'schemas', 'cep-article-prep', 'project_sources', 'docs']);
const read = (root, p) => readFileSync(join(root, p), 'utf8');
const json = (root, p) => JSON.parse(read(root, p));
const exists = (root, p) => existsSync(join(root, p));
const sentences = (t) => t.replace(/\s+/g, ' ').split(/(?<=[.!?;|])\s+/);
function walk(root, rel = '') {
  return readdirSync(join(root, rel)).flatMap((n) => {
    const p = rel ? rel + '/' + n : n;
    if (!rel && PUBLIC_EXCLUDED_TOP.has(n)) return [];
    if (n.startsWith('.') && n !== '.vercelignore' && n !== '.well-known') return [];
    let st; try { st = statSync(join(root, p)); } catch (e) { return []; }
    // A nested repository is not part of this one and is never deployed from it.
    if (st.isDirectory() && existsSync(join(root, p, '.git'))) return [];
    return st.isDirectory() ? walk(root, p) : [p];
  });
}

export async function verifySourceAlignment({ root = ROOT } = {}) {
  const problems = [];
  const fail = (s, m) => problems.push(s + ': ' + m);

  // ---- A sources ----------------------------------------------------------------------------------------
  let receipt = null; try { receipt = json(root, RECEIPT); } catch (e) { return { ok: false, problems: ['A: integrity receipt missing or unreadable'], status: 'VERIFICATION_FAILED', statement: '' }; }
  if (receipt.classification !== 'NOT PUBLIC / NOT DEPLOYMENT INPUT / NOT COMMITTED') fail('A', 'receipt classification altered');
  const srcs = openSources(root);
  for (const id of ['S01', 'S02', 'S03']) {
    const s = srcs[id], r = receipt.sources.find((x) => x.source_id === id);
    if (!r || !s) { fail('A', id + ' missing from the receipt'); continue; }
    if (!s.present) fail('A', id + ' is absent: ' + s.path + ' (the October 3 files must be supplied for this session; fail closed)');
    else if (!s.ok) fail('A', id + ' does not match its receipt (' + s.problem + '); a controlled source changed');
    if (r.sha256 !== HANDOFF_HASHES[id] || r.handoff_sha256 !== HANDOFF_HASHES[id]) fail('A', id + ' receipt hash differs from the 5 October handoff value');
    if (r.byte_identical !== true) fail('A', id + ' receipt does not record byte identity');
    if (!/\(local, untracked\)$/.test(r.controlled_location || '')) fail('A', id + ' controlled location must be local and untracked');
  }
  for (const r of receipt.repository_sources) if (!exists(root, r.path) || sha256(readFileSync(join(root, r.path))) !== r.sha256) fail('A', r.source_id + ' (' + r.path + ') differs from its receipt hash');
  const sourcesOk = ['S01', 'S02', 'S03'].every((id) => srcs[id] && srcs[id].ok);

  // ---- B locators -----------------------------------------------------------------------------------------
  let matrix = null; try { matrix = json(root, OUT.matrix); } catch (e) { fail('B', 'control matrix missing'); }
  const controls = matrix ? matrix.controls : [];
  const byId = Object.fromEntries(controls.map((c) => [c.control_id, c]));
  for (const c of controls) {
    const locs = [c.locator].concat(c.also_at || []);
    for (const l of locs) {
      const s = srcs[l && l.source_id];
      if (!l || !s || !Array.isArray(l.lines) || l.lines.length !== 2 || !(l.lines[0] >= 1) || l.lines[1] < l.lines[0] || !Array.isArray(l.line_sha256) || l.line_sha256.length !== l.lines[1] - l.lines[0] + 1) { fail('B', c.control_id + ' has no reproducible locator'); continue; }
      if (s.present && s.ok) for (let n = l.lines[0]; n <= l.lines[1]; n++) if (lineHash(s, n) !== l.line_sha256[n - l.lines[0]]) { fail('B', c.control_id + ' locator ' + l.source_id + ' line ' + n + ' does not hash to the cited line'); break; }
    }
    if (c.source_sha256 !== (srcs[c.source_id] || {}).sha256) fail('B', c.control_id + ' source hash differs from the receipt (a source-derived control used without a matching source hash)');
    if (!STATUSES.includes(c.status)) fail('B', c.control_id + ' status ' + c.status + ' is outside the six classifications');
    if (typeof c.limitation !== 'string' || c.limitation.length < 10) fail('B', c.control_id + ' has no limitation');
  }
  if (matrix) {
    const totals = Object.fromEntries(STATUSES.map((s) => [s, controls.filter((c) => c.status === s).length]));
    if (JSON.stringify(totals) !== JSON.stringify(matrix.totals) || matrix.control_count !== controls.length) fail('B', 'matrix totals do not match its controls');
    for (const t of REQUIRED_TOPICS) if (!controls.some((c) => c.topic === t)) fail('B', 'required control topic missing: ' + t);
  }

  // ---- C evidence -----------------------------------------------------------------------------------------
  for (const c of controls) {
    if (['ALIGNED', 'PARTIALLY_ALIGNED'].includes(c.status) && !(c.evidence || []).length) fail('C', c.control_id + ' is ' + c.status + ' without repository evidence');
    for (const e of c.evidence || []) {
      if (!EVIDENCE_CLASSES.includes(e.class)) fail('C', c.control_id + ' evidence class ' + e.class + ' is not permitted (no local, synthetic or test artifact is independent evidence)');
      if (/^(tests\/|tools\/frozen-demo\/|tools\/evaluation-readiness\/lib\/probes)/.test(e.path) && !['LOCAL_TEST', 'SYNTHETIC_FIXTURE', 'SOURCE_CODE', 'REPOSITORY_RECORD'].includes(e.class)) fail('C', c.control_id + ' classes a local or synthetic artifact as ' + e.class);
      if (!exists(root, e.path)) { fail('C', c.control_id + ' evidence ' + e.path + ' does not exist'); continue; }
      if (!read(root, e.path).includes(e.contains)) fail('C', c.control_id + ' evidence ' + e.path + ' no longer contains the cited text');
    }
  }
  for (const p of [OUT.matrix, OUT.audit, OUT.addendum]) { try { if (/INDEPENDENT_EVALUATION_EVIDENCE|"evidence_class":\s*"INDEPENDENT/.test(read(root, p))) fail('C', p + ' classifies something as independent evaluation evidence'); } catch (e) {} }

  // ---- D Codebook correspondence ----------------------------------------------------------------------------------------
  const outputs = Object.values(OUT).concat([DECISION_PACKAGE, CONTROL_SET, 'tools/source-alignment/lib/controls.js', 'tools/source-alignment/lib/reconciliation.js']);
  for (const p of outputs) { if (!exists(root, p)) continue; const t = read(root, p); for (const s of sentences(t)) if (ASSERTED_MAPPING.test(s) && !NEGATION.test(s)) fail('D', p + ' asserts a candidate-key correspondence to a Codebook condition'); }
  try {
    if (!/export const CODEBOOK_CORRESPONDENCE_RECORD = null;/.test(read(root, 'lib/engine-candidate/explanations.js'))) fail('D', 'a Codebook correspondence record now exists; the reconciliation must be re-reviewed');
    if (/"approved":\s*true/.test(read(root, 'tools/methodology-integrity/current-correspondence-register.json'))) fail('D', 'a correspondence record is approved; D-2 and D-3 must be re-reviewed');
  } catch (e) { fail('D', 'correspondence sources unreadable'); }

  // ---- E release gates ----------------------------------------------------------------------------------------
  try {
    const rg = json(root, MAIN_RECORD), add = json(root, OUT.addendum);
    const now = Object.fromEntries(rg.gates.map((g) => [g.gate_id, g.status]));
    if (JSON.stringify(now) !== JSON.stringify(EXPECTED_GATES)) fail('E', 'a release-gate status in the main record changed: ' + JSON.stringify(now));
    if (rg.gates.some((g) => g.status === 'PASS' || g.sub_controls.some((s) => s.status === 'PASS'))) fail('E', 'a gate or sub-control is PASS');
    if (add.advances_any_gate !== false || !Array.isArray(add.gates_changed) || add.gates_changed.length) fail('E', 'the addendum claims to advance or change a gate');
    for (const g of add.gates) if (g.status !== EXPECTED_GATES[g.gate_id] || g.status === 'PASS') fail('E', 'the addendum gives ' + g.gate_id + ' a status other than its unchanged ' + EXPECTED_GATES[g.gate_id]);
    if (add.gates.length !== 5) fail('E', 'the addendum must cover all five gates');
    if (add.binds.main_record_sha256 !== sha256(readFileSync(join(root, MAIN_RECORD))) || add.binds.main_report_sha256 !== sha256(readFileSync(join(root, MAIN_REPORT)))) fail('E', 'the addendum is not bound to the current main record and report');
    if (!/does not advance any gate/.test(add.statement)) fail('E', 'the addendum no longer states that it advances no gate');
  } catch (e) { fail('E', 'release-gate record or addendum unreadable'); }

  // ---- F boundary: source text and source paths -------------------------------------------------------------------------
  if (sourcesOk) {
    const lines = new Set(), runs = new Set();
    for (const id of ['S01', 'S02', 'S03']) {
      for (const l of identifyingLines(srcs[id], 40)) lines.add(l);
      for (const l of srcs[id]._lines) { const w = l.replace(/\s+/g, ' ').trim().toLowerCase().split(' '); for (let i = 0; i + 6 <= w.length; i++) runs.add(w.slice(i, i + 6).join(' ')); }
    }
    const pkgFiles = outputs.concat([RECEIPT, 'tools/source-alignment/lib/build.js', 'tools/source-alignment/lib/sources.js', 'tools/source-alignment/lib/verify.js', 'tools/source-alignment/run.mjs', 'tools/source-alignment/verify.mjs']).filter((p) => exists(root, p));
    for (const p of pkgFiles) {
      const flat = read(root, p).replace(/\s+/g, ' ');
      for (const l of lines) if (flat.includes(l)) { fail('F', p + ' contains a line of source text'); break; }
      const w = flat.toLowerCase().split(' ');
      for (let i = 0; i + 6 <= w.length; i++) if (runs.has(w.slice(i, i + 6).join(' '))) { fail('F', p + ' reproduces a six-word run of source text ("' + w.slice(i, i + 3).join(' ') + ' …")'); break; }
    }
    for (const p of walk(root).filter((f) => !/\.md$/.test(f))) {
      let t; try { if (statSync(join(root, p)).size > 3_000_000) continue; t = read(root, p); } catch (e) { continue; }
      if (/project_sources|controlled-sources|Source_Aligned_2026-10-03|Blueprint_Aligned_2026-10-03/.test(t)) fail('F', p + ' is a public or deployable file that names a controlled source path');
      const flat = t.replace(/\s+/g, ' ');
      for (const l of lines) if (l.length >= 60 && flat.includes(l)) { fail('F', p + ' is a public or deployable file containing source text'); break; }
    }
  }

  // ---- G public audit -----------------------------------------------------------------------------------------
  try {
    const audit = json(root, OUT.audit);
    if (audit.documentation_only !== true || audit.pages_edited.length) fail('G', 'the public audit must be documentation only, with no page edited');
    for (const i of audit.items) {
      if (!DISPOSITIONS.includes(i.disposition)) fail('G', i.id + ' disposition ' + i.disposition + ' is not permitted');
      if (i.source_aligned === true && (!Array.isArray(i.controls) || !i.controls.length || i.controls.some((c) => !byId[c]))) fail('G', i.id + ' is marked source-aligned without a matching source control');
      if (i.source_aligned === true && ['STILL_PRESENT', 'NOT_ASSESSABLE_FROM_SOURCE_SET'].includes(i.disposition)) fail('G', i.id + ' is ' + i.disposition + ' but marked source-aligned');
      for (const c of i.controls || []) if (!byId[c]) fail('G', i.id + ' cites an unknown control ' + c);
      for (const [p, t] of i.present || []) if (!exists(root, p) || !read(root, p).includes(t)) fail('G', i.id + ' cites text no longer on ' + p);
    }
  } catch (e) { fail('G', 'public audit unreadable'); }

  // ---- H conflicts -----------------------------------------------------------------------------------------
  const conflicts = matrix ? matrix.conflicts : [];
  for (const [id, ctl] of Object.entries(KNOWN_CONFLICTS)) {
    const x = conflicts.find((k) => k.id === id);
    if (!x) { fail('H', id + ' was removed from the conflict register'); continue; }
    if (x.resolution !== null && !(x.resolution && x.resolution.by === 'owner' && x.resolution.decision_ref)) fail('H', id + ' is marked resolved without an owner decision record');
    for (const c of ctl) if (byId[c] && byId[c].status !== 'CONFLICT' && x.resolution === null) fail('H', c + ' (' + id + ') was converted from CONFLICT to ' + byId[c].status + ' with no recorded resolution');
  }
  for (const c of controls) for (const k of c.conflict_ids || []) {
    const x = conflicts.find((y) => y.id === k);
    if (!x) fail('H', c.control_id + ' cites an unknown conflict ' + k);
    else if (c.status === 'ALIGNED' && x.resolution === null) fail('H', c.control_id + ' is ALIGNED while its conflict ' + k + ' is unresolved');
  }

  // ---- I human actions -----------------------------------------------------------------------------------------
  for (const c of controls) {
    if (c.status === 'REQUIRES_HUMAN_ACTION' && !c.human_action) fail('I', c.control_id + ' requires human action but names none');
    if (c.human_action && (c.human_action.completed !== false || c.human_action.evidence_ref !== null)) fail('I', c.control_id + ' represents a human action as completed; only the named person can complete it');
  }

  // ---- J unsupported claims -----------------------------------------------------------------------------------------
  for (const p of outputs.filter((x) => exists(root, x) && /\.md$/.test(x))) {
    for (const s of sentences(read(root, p))) if (UNSUPPORTED.test(s) && !NEGATION.test(s)) fail('J', p + ' states an unsupported claim: "' + s.slice(0, 90) + '"');
  }

  // ---- K generated outputs -----------------------------------------------------------------------------------------
  if (sourcesOk) {
    try { const outs = buildAll(root); for (const [p, t] of Object.entries(outs)) if (!exists(root, p) || read(root, p) !== t) fail('K', p + ' is stale or missing; run node tools/source-alignment/run.mjs --write'); }
    catch (e) { fail('K', 'the build failed: ' + e.message); }
  }

  // ---- L documents -----------------------------------------------------------------------------------------
  if (!exists(root, DECISION_PACKAGE)) fail('L', 'owner decision package missing');
  else {
    const d = read(root, DECISION_PACKAGE);
    for (const h of ['## 1. What is now verified through source alignment', '## 2. What remains unverified', '## 3. Conflicts requiring an owner decision', '## 4. Items requiring counsel or another external human', '## 5. Items that need no action now', '## 6. Recommended status of PR #39'])
      if (!d.includes(h)) fail('L', 'decision package section missing: ' + h);
    for (const id of Object.keys(KNOWN_CONFLICTS)) if (!d.includes(id)) fail('L', 'decision package does not name ' + id);
    if (!/does not advance any release gate/.test(d)) fail('L', 'decision package must state that nothing advances a release gate');
  }
  if (exists(root, OUT.reconciliationMd)) { const r = read(root, OUT.reconciliationMd); for (const id of Object.keys(KNOWN_CONFLICTS)) if (!r.includes(id)) fail('L', 'reconciliation report does not name ' + id); }
  if (!exists(root, CONTROL_SET) || !/does not validate the Engine, close a release gate/.test(read(root, CONTROL_SET))) fail('L', 'control-set document must state that a source reference validates nothing and closes no gate');

  return { ok: problems.length === 0, verifier_version: VERIFIER_VERSION, status: problems.length ? 'VERIFICATION_FAILED' : 'SOURCE_ALIGNMENT_CONSISTENT', problems,
           statement: 'A pass shows the reconciliation is consistent with the three local October 3 sources and the repository. It validates nothing, closes no release gate and authorizes nothing.' };
}

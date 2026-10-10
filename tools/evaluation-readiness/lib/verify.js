// JRS controlled independent-evaluation readiness: package verifier. INTERNAL. FAILS CLOSED.
//
//   A  readiness contract: seven categories, independent evidence NOT_PRESENT, attestations unfilled
//   B  readiness registry: PLANNING_ONLY, intake closed, no freezes, full binding template, registry probes
//   C  codebook mapping: exactly RC1 to RC5 under their canonical names, bound to Codebook v1.0
//   D  intake validator: every refusal fires on its probe, and a well-formed probe is still not admitted
//   E  review workspaces: separation, condition mapping, blinding, no record text, no inference, no score
//   F  run ledger: committed chain verifies; role substitution and tampering are refused
//   G  authority matrix and release gates: every role present, every gate status exactly unchanged
//   H  repository scan: no evaluation source text in the worktree
//   I  limitations and documentation
//   J  isolation: no network, provider, export or serving path; nothing deployable; no public link
//   K  status vocabulary: no prohibited state anywhere in the package
// A pass means the controls behave as written on synthetic probes. It is not an evaluation, not
// evidence of independence, and it moves no release gate.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sha256 } from '../../../lib/engine-candidate/source-prep.js';
import * as VOC from './vocabulary.js';
import { classifyRun, REQUIRED_BINDING_FIELDS } from './registry.js';
import { validateIntake, INTAKE_OPEN } from './intake.js';
import { createEvaluationWorkspace, addItem, computeAgreement, computeDrrScore } from './workspace.js';
import { verifyLedger, appendEntry } from './ledger.js';
import { scanRepository } from './scan.js';
import * as P from './probes.js';

export const VERIFIER_VERSION = 'jrs-evaluation-readiness-verifier/0.1.0';
export const ROOT = join(VOC.PACKAGE_DIR, '../../');
export const PKG = 'tools/evaluation-readiness/';
// The release-gate statuses this package was built against. Any difference fails section G.
export const EXPECTED_GATES = Object.freeze({ 'RG-1': 'BLOCKED', 'RG-2': 'BLOCKED', 'RG-3': 'NOT_ASSESSED', 'RG-4': 'BLOCKED', 'RG-5': 'BLOCKED' });
export const RELEASE_GATE_RECORD = 'lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json';
export const CATEGORIES = Object.freeze({ CURRENT_IMPLEMENTATION: 'VERIFIED_IN_REPOSITORY', TARGET_ARCHITECTURE: 'TARGET_ONLY', SYNTHETIC_FIXTURE: 'DEVELOPMENT_ONLY',
  INDEPENDENT_EVALUATION_EVIDENCE: 'NOT_PRESENT', HUMAN_ATTESTATION: 'REQUIRED_UNFILLED', RELEASE_AUTHORIZATION: 'ABSENT', EXTERNAL_COUNSEL_DETERMINATION: 'ABSENT' });
export const REQUIRED_LIMITATIONS = Object.freeze(['not_an_evaluation', 'no_independent_evidence', 'digest_not_independence', 'no_validation', 'no_release_effect', 'no_counsel_or_owner_action', 'no_scoring', 'scope_limited']);
export const BRIEF_BINDING_FIELDS = Object.freeze(['engine.version', 'engine.commit', 'prompt.version', 'adapter.identity', 'codebook.revision', 'scope.record_category', 'rights.authorization_status',
  'input.input_digest', 'input.external_reference', 'reviewer.token', 'reviewer.role_version', 'reviewer.independence_status', 'reviewer.conflict_status', 'extraction_version',
  'interpretation_version', 'adjudication_protocol_version', 'output.output_identity', 'output.evidence_digest', 'gate_status_at_run', 'configuration_id']);
export const ASSIGNMENT_LABELS = Object.freeze({ Reconstructability: 'RC1', 'Identifiable basis': 'RC2', 'Chronology integrity': 'RC3', 'Reasoning traceability': 'RC4', Sufficiency: 'RC5' });
export const DOCS = Object.freeze({
  'CONTROLLED_INDEPENDENT_EVALUATION_READINESS_PROTOCOL.md': ['does not itself provide independent validation evidence', 'PLANNING_ONLY'],
  'EVALUATION_SCOPE_AND_REFUSAL_MATRIX.md': ['supplier_access_exception', 'employment', 'housing', 'lending', 'insurance', 'medical', 'legal_outcome'],
  'CODEBOOK_MAPPING_AND_INTERPRETATION_SEPARATION_PROTOCOL.md': ['RC1', 'RC5', 'INSUFFICIENT_BASIS_TO_ASSESS', 'no correspondence'],
  'INPUT_CONTAMINATION_AND_DEVELOPMENT_MATERIAL_EXCLUSION_PROTOCOL.md': ['does not establish independence', 'jrs-material-sha256/1'],
  'FUTURE_RUN_EVIDENCE_LEDGER_SPECIFICATION.md': ['append-only', 'role substitution'],
  'AUTHORITY_AND_RELEASE_GATE_RESPONSIBILITY_MATRIX.md': ['RG-1', 'RG-5', 'cannot be substituted'],
  'LEGACY_GUARD_FAILURE_TRIAGE_RECORD.md': ['164 checks, 37 failed, 1 skipped', 'not green'],
  'EVALUATION_READINESS_BASELINE_2026-10-07.md': ['CF-01', 'CF-06'],
});
const SKIP_DIRS = new Set(['.git', 'node_modules', '__pycache__']);
const NOT_PUBLIC = new Set(['tools', 'tests', 'lib', 'research', 'scripts', '.jrs', '.claude', 'supabase', 'templates', 'build', 'standard', 'schemas', 'cep-article-prep']);
// Network, provider, credential, export, serving and storage pathways, in any package code file.
const PATHWAY = /\bfetch\s*\(|XMLHttpRequest|WebSocket|node:(?:https?|net|dgram|tls|dns|child_process|http2)|api\.anthropic|api\.openai|@anthropic-ai|from ['"]openai['"]|_API_KEY|process\.env|writeFileSync|writeFile\(|createWriteStream|appendFileSync|createServer|\.listen\(|localStorage|sessionStorage|sendBeacon/;

const read = (root, p) => readFileSync(join(root, p), 'utf8');
const json = (root, p) => JSON.parse(read(root, p));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
function walkFiles(root, rel = '') {
  return readdirSync(join(root, rel)).flatMap((n) => {
    if (SKIP_DIRS.has(n)) return [];
    const p = rel ? rel + '/' + n : n;
    let st; try { st = statSync(join(root, p)); } catch (e) { return []; }
    return st.isDirectory() ? walkFiles(root, p) : [p];
  });
}
function strings(v, out = []) { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out)); return out; }
const hasCode = (r, code, control) => r && Array.isArray(r.codes) && r.codes.some((c) => c.code === code && (!control || c.control === control));

export async function verifyReadinessPackage({ root = ROOT } = {}) {
  const problems = [];
  const fail = (section, msg) => problems.push(section + ': ' + msg);
  const load = (p) => { try { return json(root, p); } catch (e) { fail('A', p + ' missing or not JSON'); return null; } };
  const contract = load(PKG + 'readiness-contract.json'), registry = load(PKG + 'readiness-registry.json'), mapping = load(PKG + 'codebook-mapping.json'), authority = load(PKG + 'authority-matrix.json');
  if (!contract || !registry || !mapping || !authority) return { ok: false, problems };

  // ---- A readiness contract -----------------------------------------------------------------------
  if (contract.package_status !== 'PLANNING_ONLY' || contract.relationship_to_release_gates !== 'none') fail('A', 'the contract must be PLANNING_ONLY with no release-gate relationship');
  if (!same(Object.keys(contract.categories || {}).sort(), Object.keys(CATEGORIES).sort())) fail('A', 'the contract must hold exactly the seven categories');
  for (const [k, st] of Object.entries(CATEGORIES)) if (!contract.categories[k] || contract.categories[k].state !== st) fail('A', k + ' must be ' + st);
  const ie = contract.categories.INDEPENDENT_EVALUATION_EVIDENCE || {};
  if (!Array.isArray(ie.items) || ie.items.length) fail('A', 'independent evaluation evidence must be NOT_PRESENT with no items (nothing may be relabelled as independent evidence)');
  for (const a of (contract.categories.HUMAN_ATTESTATION || {}).items || []) if (a.value !== null || !VOC.HUMAN_ROLES.includes(a.required_role)) fail('A', a.id + ' attestation must be unfilled and owned by a human role');
  if (((contract.categories.HUMAN_ATTESTATION || {}).items || []).length < 6) fail('A', 'the six required human attestations must be listed');
  if ((contract.categories.RELEASE_AUTHORIZATION || {}).owner_record_ref !== null) fail('A', 'release authorization must be absent');
  if ((contract.categories.EXTERNAL_COUNSEL_DETERMINATION || {}).determination_ref !== null) fail('A', 'counsel determination must be absent');
  for (const it of (contract.categories.CURRENT_IMPLEMENTATION || {}).items || []) for (const p of it.source_paths) if (!existsSync(join(root, p))) fail('A', it.id + ' names a source that does not exist: ' + p);
  const sf = ((contract.categories.SYNTHETIC_FIXTURE || {}).items || []).map((x) => x.location).join(' ');
  if (!/tests\/engine-candidate\//.test(sf) || !/tools\/frozen-demo\/corpus/.test(sf)) fail('A', 'every development set must be listed as a synthetic fixture');

  // ---- B readiness registry -----------------------------------------------------------------------
  if (registry.status !== 'PLANNING_ONLY') fail('B', 'the registry must be PLANNING_ONLY');
  if (registry.intake.state !== 'INTAKE_CLOSED' || registry.intake.opening_record_ref !== null) fail('B', 'intake must be closed with no opening record');
  for (const k of VOC.FREEZES) if (!registry.freezes[k] || registry.freezes[k].frozen !== false || registry.freezes[k].freeze_record_ref !== null) fail('B', 'the ' + k + ' freeze must be absent');
  if (!Array.isArray(registry.runs) || registry.runs.length) fail('B', 'the run list must be empty: no evaluation run exists');
  const get = (o, path) => path.split('.').reduce((v, k) => (v === null || v === undefined ? undefined : v[k]), o);
  for (const f of REQUIRED_BINDING_FIELDS) if (get(registry.run_binding_template, f) !== null) fail('B', 'the binding template must carry ' + f + ' as an unfilled field');
  for (const f of BRIEF_BINDING_FIELDS) if (!REQUIRED_BINDING_FIELDS.includes(f)) fail('B', 'a required version binding is no longer required: ' + f);
  if (REQUIRED_BINDING_FIELDS.length < 34) fail('B', 'the required binding list was shortened');
  for (const [id, what, variant, state, code] of P.REGISTRY_PROBES) {
    const r = classifyRun(P.registryProbeBinding(variant, registry.run_binding_template, EXPECTED_GATES), { currentGates: EXPECTED_GATES });
    if (r.state !== state || (code && !hasCode(r, code))) fail('B', id + ' ' + what + ': got ' + r.state + ' ' + JSON.stringify(r.codes.map((c) => c.code)));
  }

  // ---- C codebook mapping -------------------------------------------------------------------------
  let std = null; try { std = json(root, 'standard/jrs-conditions.json'); } catch (e) { fail('C', 'standard/jrs-conditions.json unreadable'); }
  const ids = (mapping.conditions || []).map((c) => c.condition_id);
  if (!same(ids, VOC.CONDITION_IDS)) fail('C', 'the mapping must hold exactly RC1 to RC5, in order (a condition mapping is missing or added)');
  if (std) for (const c of mapping.conditions || []) { const s = std.conditions.find((x) => x.id === c.condition_id); if (!s || s.name !== c.canonical_name) fail('C', c.condition_id + ' canonical name differs from standard/jrs-conditions.json'); }
  for (const [label, id] of Object.entries(ASSIGNMENT_LABELS)) if (VOC.resolveCondition(label, mapping) !== id) fail('C', 'assignment label "' + label + '" does not resolve to ' + id);
  for (const k of mapping.candidate_keys_not_conditions.keys) if (VOC.resolveCondition(k, mapping) !== null) fail('C', 'candidate key ' + k + ' resolves to a condition; no correspondence is asserted (D-2, D-3)');
  if (mapping.candidate_keys_not_conditions.correspondence !== 'not_asserted') fail('C', 'candidate-key correspondence must be not_asserted');
  if (VOC.resolveCondition('Clarity', mapping) !== null || VOC.resolveCondition('Defensibility', mapping) !== null) fail('C', 'an unmapped label resolves; substitute labels must be refused');
  const cb = mapping.codebook_source || {};
  if (cb.source_id !== 'SRC-CODEBOOK' || cb.revision !== '1.0' || !existsSync(join(root, cb.path || '-')) || sha256(read(root, cb.path)) !== cb.sha256) fail('C', 'the codebook binding does not match codebook.html v1.0 as reviewed');
  if (cb.freeze_for_evaluation !== 'NOT_FROZEN' || cb.freeze_record_ref !== null) fail('C', 'the codebook is not frozen for evaluation; the mapping may not say otherwise');
  if (!same(Object.keys(mapping.determinations || {}), VOC.DETERMINATIONS)) fail('C', 'the four determinations must be exactly those of the protocol');
  if (Object.values(mapping.scoring || {}).filter((v) => v === 'NOT_PERMITTED').length !== 3) fail('C', 'DRR scoring, agreement statistics and classification must be NOT_PERMITTED');

  // ---- D intake validator -------------------------------------------------------------------------
  if (INTAKE_OPEN !== false) fail('D', 'INTAKE_OPEN must be false; opening intake is an owner act, not a constant');
  const base = validateIntake(P.BASE_INTAKE, { registry });
  if (base.decision !== 'WELL_FORMED_NOT_ADMITTED' || !hasCode(base, 'intake_closed', 'INT-00')) fail('D', 'a well-formed synthetic declaration must be WELL_FORMED_NOT_ADMITTED (intake closed), got ' + base.decision + ' ' + JSON.stringify(base.codes.map((c) => c.code)));
  for (const [id, what, decl, code, control] of P.INTAKE_PROBES) {
    const r = validateIntake(decl, { registry });
    if (r.decision !== 'REFUSED' || !hasCode(r, code, control)) fail('D', id + ' ' + what + ': expected REFUSED by ' + control + ' (' + code + '), got ' + r.decision + ' ' + JSON.stringify(r.codes.map((c) => c.control + ':' + c.code)));
  }
  const open = validateIntake(P.BASE_INTAKE, { registry: { ...registry, intake: { state: 'INTAKE_OPEN', opening_record_ref: 'SYNTHETIC-OPENING' } } });
  if (open.decision === 'ADMITTED') fail('D', 'the validator admitted a record; no admission path may exist in this package');

  // ---- E review workspaces --------------------------------------------------------------------------
  const real = createEvaluationWorkspace({ mode: 'evaluation', intakeDecision: base });
  if (real.ok || !hasCode(real, 'intake_not_admitted', 'WS-00')) fail('E', 'a workspace for real records opened without an admitted intake (the intake validator was bypassed)');
  const ws0 = createEvaluationWorkspace({ mode: 'synthetic_probe' }).workspace;
  const step = (ws, w, item) => addItem(ws, w, item);
  const expectRefused = (r, code, control, what) => { if (r.ok || !hasCode(r, code, control)) fail('E', what + ': expected ' + control + ' ' + code + ', got ' + (r.ok ? 'accepted' : JSON.stringify(r.codes.map((c) => c.control + ':' + c.code)))); };
  expectRefused(step(ws0, 'extraction', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING')), 'wrong_workspace', 'WS-01', 'an interpretation filed in extraction');
  expectRefused(step(ws0, 'adjudication', { kind: 'GATE_CONCLUSION', item_id: 'G-1', author: { kind: 'human', role: 'owner', token: 'SYNTHETIC-OWNER' } }), 'gate_conclusion_outside_authority', 'WS-01', 'a gate conclusion');
  expectRefused(step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'Identifiable basis', 'INFORMATION_MISSING')), 'unmapped_condition', 'WS-04', 'a label stored in place of a condition ID');
  expectRefused(step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'basis_identification', 'INFORMATION_MISSING')), 'candidate_key_as_condition', 'WS-04', 'a candidate key used as a condition');
  expectRefused(step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING', { blind_to_candidate_output: false })), 'not_blind_to_candidate_output', 'WS-05', 'an interpretation that saw candidate output');
  expectRefused(step(ws0, 'comparison', P.candidate('K-1', 'basis_identification', { condition_id: 'RC2' })), 'candidate_key_mapped_to_condition', 'WS-05', 'a candidate key mapped to a condition');
  expectRefused(step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'AFFIRMATIVE_DEFECT', { location_refs: [] })), 'determination_without_location', 'WS-06', 'a defect without a location');
  expectRefused(step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING', { missing_element: '' })), 'missing_element_not_named', 'WS-06', 'absence not named');
  expectRefused(step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING', { note: 'the approver acted deliberately to hide it' })), 'prohibited_inference', 'WS-07', 'an inference about intent');
  expectRefused(step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING', { note: 'the supplier is liable for this' })), 'prohibited_inference', 'WS-07', 'a legal conclusion');
  expectRefused(step(ws0, 'extraction', P.fact('F-1', { quote: 'SYNTHETIC' })), 'record_text_in_workspace', 'WS-02', 'record text in an extraction');
  expectRefused(step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING', { author: { kind: 'code', role: 'independent_reviewer', token: 'SYNTHETIC-CODE' } })), 'author_not_permitted', 'WS-03', 'an interpretation generated by code');
  const ok1 = step(ws0, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING'));
  if (!ok1.ok) fail('E', 'a well-formed synthetic interpretation was refused: ' + JSON.stringify(ok1.codes));
  const one = ok1.ok ? ok1.workspace : ws0;
  const insufficient = step(one, 'interpretation', P.interp('I-2', 'SYNTHETIC-REVIEWER-A', 'RC3', 'INSUFFICIENT_BASIS_TO_ASSESS'));
  if (!insufficient.ok) fail('E', 'a reviewer could not record insufficient basis to assess');
  const frozenOne = createEvaluationWorkspace({ mode: 'synthetic_probe', freezes: P.SYNTHETIC_FREEZES }).workspace;
  const single = step(frozenOne, 'interpretation', P.interp('I-1', 'SYNTHETIC-REVIEWER-A', 'RC2', 'INFORMATION_MISSING'));
  if (!single.ok || !hasCode(computeAgreement(single.workspace), 'single_reviewer_agreement', 'WS-10')) fail('E', 'one reviewer produced an agreement result (WS-10 single-reviewer refusal missing)');
  const two = single.ok ? step(single.workspace, 'interpretation', P.interp('I-3', 'SYNTHETIC-REVIEWER-B', 'RC2', 'NO_DEFECT_OBSERVED')) : { ok: false };
  const twoUnfrozen = ok1.ok ? step(one, 'interpretation', P.interp('I-3', 'SYNTHETIC-REVIEWER-B', 'RC2', 'NO_DEFECT_OBSERVED')) : { ok: false };
  if (!twoUnfrozen.ok || !hasCode(computeAgreement(twoUnfrozen.workspace), 'agreement_before_freeze', 'WS-10')) fail('E', 'agreement was not refused before the freezes');
  if (!two.ok || computeAgreement(two.workspace).ok) fail('E', 'an agreement statistic was produced');
  if (!hasCode(computeDrrScore(one), 'drr_score_before_freeze', 'WS-11')) fail('E', 'a DRR score was not refused before the freezes');
  if (two.ok && computeDrrScore(two.workspace).ok) fail('E', 'a DRR score was produced');
  if (two.ok) {
    const dis = step(two.workspace, 'comparison', { kind: 'REVIEWER_DISAGREEMENT', item_id: 'D-1', author: { kind: 'code', role: 'comparison_tool', token: 'SYNTHETIC-TOOL' }, interpretation_ids: ['I-1', 'I-3'], location_refs: [] });
    if (!dis.ok) fail('E', 'a two-reviewer disagreement could not be recorded');
    else {
      expectRefused(step(dis.workspace, 'adjudication', { kind: 'ADJUDICATED_CONCLUSION', item_id: 'A-1', author: { kind: 'human', role: 'adjudicator', token: 'SYNTHETIC-REVIEWER-A' }, disagreement_id: 'D-1', condition_id: 'RC2', adjudication_protocol_version: 'SYNTHETIC-ADJ-0', location_refs: [] }), 'adjudicator_is_a_reviewer', 'WS-09', 'a reviewer adjudicating their own disagreement');
      const unfrozen = { ...dis.workspace, freezes: { ...dis.workspace.freezes, adjudication_protocol: { frozen: false, freeze_record_ref: null } } };
      expectRefused(step(unfrozen, 'adjudication', { kind: 'ADJUDICATED_CONCLUSION', item_id: 'A-1', author: { kind: 'human', role: 'adjudicator', token: 'SYNTHETIC-ADJUDICATOR' }, disagreement_id: 'D-1', condition_id: 'RC2', adjudication_protocol_version: 'SYNTHETIC-ADJ-0', location_refs: [] }), 'adjudication_protocol_not_frozen', 'WS-09', 'adjudication without a frozen protocol');
    }
  }
  expectRefused(step(ws0, 'comparison', { kind: 'REVIEWER_DISAGREEMENT', item_id: 'D-1', author: { kind: 'code', role: 'comparison_tool', token: 'SYNTHETIC-TOOL' }, interpretation_ids: ['I-1'], location_refs: [] }), 'disagreement_needs_two_reviewers', 'WS-08', 'a disagreement with one reviewer');

  // ---- F run ledger -------------------------------------------------------------------------------
  let ledger = null; try { ledger = json(root, PKG + 'ledger/future-run-ledger.json'); } catch (e) { fail('F', 'ledger missing'); }
  if (ledger) {
    const v = verifyLedger(ledger);
    if (!v.ok) fail('F', 'the committed ledger does not verify: ' + JSON.stringify(v.problems.slice(0, 3)));
    if (ledger.entries.some((e) => e.evidence_status === 'VERIFIED' && e.required_human_role)) fail('F', 'the ledger records human-role evidence as VERIFIED');
    const refusedBy = (entry, code, what) => { const r = appendEntry(ledger, entry); if (r.ok || !hasCode(r, code)) fail('F', what + ': expected ' + code + ', got ' + (r.ok ? 'appended' : JSON.stringify(r.codes.map((c) => c.code)))); };
    for (const t of ['owner_authorization', 'counsel_determination', 'independence_attestation', 'independent_qa_report', 'human_interpretation'])
      for (const kind of ['code', 'test_fixture', 'generated']) refusedBy(P.ledgerEntry({ artifact_type: t, created_by: { kind, identity: 'SYNTHETIC-PROBE' }, required_human_role: { owner_authorization: 'owner', counsel_determination: 'counsel', independence_attestation: 'independent_reviewer', independent_qa_report: 'independent_production_qa', human_interpretation: 'independent_reviewer' }[t] }), 'role_substitution', t + ' created by ' + kind);
    refusedBy(P.ledgerEntry({ limitation: '' }), 'limitation_missing', 'an entry with no limitation');
    refusedBy(P.ledgerEntry({ release_gate_relation: { gates: ['RG-1'], effect: 'advances' } }), 'gate_relation_malformed', 'an entry that advances a gate');
    refusedBy(P.ledgerEntry({ evidence_status: 'VERIFIED', required_human_role: 'owner' }), 'code_verifies_human_evidence', 'code marking human evidence VERIFIED');
    const ok = appendEntry(ledger, P.ledgerEntry());
    if (!ok.ok) fail('F', 'a well-formed synthetic code entry could not be appended');
    else {
      const t = JSON.parse(JSON.stringify(ok.ledger)); t.entries[0].limitation += ' (edited)';
      if (verifyLedger(t).ok) fail('F', 'an edited earlier entry was not detected (the chain is not append-only)');
      const d = JSON.parse(JSON.stringify(ok.ledger)); d.entries.splice(0, 1);
      if (verifyLedger(d).ok) fail('F', 'a removed entry was not detected');
    }
  }

  // ---- G authority matrix and release gates -------------------------------------------------------------
  let rg = null; try { rg = json(root, RELEASE_GATE_RECORD); } catch (e) { fail('G', 'release-gate record unreadable'); }
  if (rg) {
    const now = Object.fromEntries(rg.gates.map((g) => [g.gate_id, g.status]));
    if (!same(now, EXPECTED_GATES)) fail('G', 'a release-gate status changed: ' + JSON.stringify(now));
    if (rg.gates.some((g) => (g.sub_controls || []).some((s) => s.status === 'PASS'))) fail('G', 'a release-gate sub-control is PASS');
    if (Object.values(rg.authorizations_created || {}).some((v) => v !== false)) fail('G', 'the release-gate record creates an authorization');
  }
  if (!same(registry.gate_status_snapshot, EXPECTED_GATES)) fail('G', 'the registry gate snapshot differs from the unchanged gate statuses');
  const gr = authority.gate_responsibilities || [];
  if (!same(Object.fromEntries(gr.map((g) => [g.gate_id, g.status_snapshot])), EXPECTED_GATES)) fail('G', 'the authority matrix gate snapshot differs from the unchanged gate statuses');
  const R = authority.roles || {};
  const need = { claude_code: 'may_prepare', independent_reviewer: 'must', adjudicator: 'must', record_custodian: 'must', counsel: 'must_review', owner: 'must_authorize', independent_production_qa: 'must_verify' };
  for (const [role, key] of Object.entries(need)) if (!R[role] || !Array.isArray(R[role][key]) || !R[role][key].length) fail('G', 'authority requirement missing: ' + role + '.' + key);
  const mayNot = ((R.claude_code || {}).may_not || []).join(' | ');
  for (const w of ['attest', 'interpret', 'adjudicate', 'legal', 'authorize', 'verify production', 'release-gate status']) if (!mayNot.includes(w)) fail('G', 'Claude Code is no longer barred from: ' + w);
  for (const g of gr) if (!Array.isArray(g.responsible_roles) || !g.responsible_roles.length || g.responsible_roles.includes('claude_code') || !/never satisfy/.test(g.claude_code_may)) fail('G', g.gate_id + ' responsibility must sit with a human role');
  if (!/cannot be substituted by a code path, a test fixture or generated text/.test(authority.rule || '')) fail('G', 'the no-substitution rule is missing');
  if ((authority.prohibited_until || []).length < 5) fail('G', 'a prohibited-until entry was removed');

  // ---- H repository scan ----------------------------------------------------------------------------
  const files = walkFiles(root);
  const declared = (registry.runs || []).map((r) => get(r, 'input.input_digest')).filter(Boolean);
  const s = scanRepository(root, files, { declaredDigests: declared });
  for (const f of s.findings) fail('H', f.control + ' ' + f.file + ': ' + f.message);

  // ---- I limitations and documentation ----------------------------------------------------------------
  for (const k of REQUIRED_LIMITATIONS) if (typeof (contract.limitations || {})[k] !== 'string' || contract.limitations[k].length < 30) fail('I', 'material limitation missing: ' + k);
  for (const [doc, phrases] of Object.entries(DOCS)) {
    const p = 'docs/architecture/' + doc;
    if (!existsSync(join(root, p))) { fail('I', p + ' missing'); continue; }
    const t = read(root, p);
    for (const ph of phrases) if (!t.includes(ph)) fail('I', p + ' no longer states "' + ph + '"');
    if (!/Current implementation/.test(t) || !/Target/.test(t) || !/Absent/.test(t)) fail('I', p + ' must distinguish current implementation, target architecture and absent external evidence');
    if (/—/.test(t)) fail('I', p + ' uses an em dash');
  }

  // ---- J isolation and deployment ------------------------------------------------------------------------
  for (const f of files.filter((x) => x.startsWith(PKG) && /\.(m?js)$/.test(x))) if (!/lib\/verify\.js$/.test(f) && PATHWAY.test(strip(read(root, f)))) fail('J', f + ' contains a network, provider, export or serving pathway');
  let vi = ''; try { vi = read(root, '.vercelignore').split('\n').map((l) => l.trim()); } catch (e) { fail('J', '.vercelignore unreadable'); }
  for (const rule of ['tools/', 'tests/', '*.md']) if (!vi.includes(rule)) fail('J', '.vercelignore no longer excludes ' + rule);
  for (const f of files) {
    const top = f.split('/')[0];
    if (NOT_PUBLIC.has(top) || /\.md$/.test(f) || !/\.(html?|json|js|mjs|txt|xml|webmanifest|css)$/.test(f)) continue;
    let t; try { t = read(root, f); } catch (e) { continue; }
    if (t.includes(VOC.PACKAGE_MARKER) || t.includes('tools/evaluation-readiness') || t.includes(VOC.PACKAGE_ID)) fail('J', f + ' is deployable and carries or names a readiness-package artifact');
  }

  // ---- K status vocabulary -------------------------------------------------------------------------------
  for (const f of files.filter((x) => x.startsWith(PKG) && x.endsWith('.json'))) {
    let o; try { o = json(root, f); } catch (e) { fail('K', f + ' is not JSON'); continue; }
    for (const v of strings(o)) if (VOC.PROHIBITED_STATES.includes(v)) fail('K', f + ' carries the prohibited state ' + v);
  }
  for (const doc of Object.keys(DOCS)) {
    let t = ''; try { t = read(root, 'docs/architecture/' + doc); } catch (e) { continue; }
    if (/\b(?:JRS|the Engine|the package|this package|the candidate)\s+(?:is|has been)\s+(?:now\s+)?(?:validated|independently evaluated|release-ready|production-ready|reliable|cleared|approved|owner-authorized)\b/i.test(t)) fail('K', doc + ' asserts a validation, readiness or approval state');
  }

  return { ok: problems.length === 0, verifier_version: VERIFIER_VERSION, status: problems.length ? 'VERIFICATION_FAILED' : 'PLANNING_ONLY_CONTROLS_CONFIRMED', problems,
           statement: 'A pass confirms that the planning-only controls behave as written on synthetic probes. It is not an evaluation, not independent validation evidence and not a release step; every gate remains open.' };
}

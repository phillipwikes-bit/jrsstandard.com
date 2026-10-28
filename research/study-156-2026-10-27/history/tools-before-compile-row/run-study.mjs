// 156-record study runner. Offline only: the network guard is installed first, provider environment variables
// stop the run, and no transport exists. Every Engine version runs from an isolated, manifest-checked copy.
//
// Labels: dev-N runs the development partition only and needs no freeze. run-N runs every partition and refuses
// to start unless the freeze seal and the 0.3.3 candidate manifest verify.
// Arms (all offline; none is a model run):
//   A0   0.3.1 engine of record, deterministic, truthful study declaration           (refusal test)
//   A0b  0.3.2 candidate, same                                                        (refusal test)
//   A1   0.3.1, deterministic, COUNTERFACTUAL supplier-access declaration, findings only (lexical backstop test)
//   A2   0.3.3 + research profile, deterministic, truthful declaration              (structure, conflicts, controls)
//   A3-A5 0.3.3 + research profile, mock ORACLE / OVERCLAIM / UNDERCLAIM (heuristic quotations), eligible records only
//   A3R, A4R the same with rule-aligned quotations (ORACLE-R, OVERCLAIM-R): a ceiling, circular by design
//   A6   0.3.2 default profile, COUNTERFACTUAL supplier-access declaration, mock ORACLE (default prompt), eligible only
// Usage: node tools/run-study.mjs <dev-N|run-N> <scratch>
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolate, loadEngine } from './harness/engines.mjs';
import { verifySeals } from './verify-seal.mjs';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { classifyE1, e2, guards, controlMechanics } from './scoring.mjs';
import { PROFILE } from './research-probes.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const [LABEL, SCRATCH] = process.argv.slice(2);
if (!/^(dev|run)-\d+$/.test(LABEL || '') || !SCRATCH) { console.error('usage: run-study.mjs <dev-N|run-N> <scratch>'); process.exit(2); }
const SCORED = LABEL.startsWith('run-');
const OUT = join(PKG, 'out', LABEL);
if (existsSync(OUT)) { console.error('output exists; runs start clean: ' + OUT); process.exit(2); }

// ------------------------------------------------------------------ pre-run checks (any failure stops before execution)
const pre = [...V.checkNetworkMarkers(process.env, {})];
const corpus = verifySeals(['corpus']); if (!corpus.ok) pre.push(...corpus.problems);
if (SCORED) {
  const fz = verifySeals(['freeze']); if (!fz.ok) pre.push(...(fz.problems.length ? fz.problems : ['freeze_seal_missing']));
  if (!existsSync(join(PKG, 'CANDIDATE_0.3.3_MANIFEST_SHA256.txt'))) pre.push('candidate_0.3.3_manifest_missing');
}
mkdirSync(OUT, { recursive: true });
if (pre.length) { writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ stopped_before_execution: true, problems: pre }, null, 2)); console.error('stopped:', pre.join('; ')); process.exit(3); }

// ------------------------------------------------------------------ records
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const devIds = new Set(inv.entries.filter((e) => (e.cohort === 'synthetic_record' && e.partition === 'development') || (e.cohort === 'original_study_record' && e.scope_class === 'NOT_EXCLUDED')).map((e) => e.source_id));
const entries = inv.entries.filter((e) => SCORED || devIds.has(e.source_id));
const declare = (e) => {
  if (e.cohort === 'synthetic_record') return { record_type: 'study_decision_record', record_state: 'completed_record', content_origin: 'synthetic_study_record', hr_content: false, regulated_decision_content: false };
  const base = { record_type: 'study_decision_record', record_state: 'completed_record', content_origin: 'constructed_study_vignette' };
  if (e.scope_class === 'NOT_EXCLUDED') return Object.assign(base, { hr_content: false, regulated_decision_content: false });
  if (e.scope_class === 'EXCLUDED') return Object.assign(base, { hr_content: e.scope_domain === 'employment', regulated_decision_content: true });
  return Object.assign(base, { hr_content: /employment/.test(e.scope_domain || '') ? 'not_established' : false, regulated_decision_content: 'not_established' });
};
const SUPPLIER = { record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false };

// ------------------------------------------------------------------ engines
const isos = { '0.3.1-candidate': isolate('0.3.1-candidate', SCRATCH), '0.3.2-candidate': isolate('0.3.2-candidate', SCRATCH), '0.3.3-research-candidate': isolate('0.3.3-research-candidate', SCRATCH, { requireManifest: SCORED }) };
const E = {}; for (const [v, iso] of Object.entries(isos)) E[v] = await loadEngine(iso);
const RPV = E['0.3.3-research-candidate'].research.RESEARCH_PROMPT_VERSION;
const ARMS = [
  { id: 'A0', engine: '0.3.1-candidate', mode: 'local_deterministic', decl: 'truthful', profile: false, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: false, kind: 'default_refusal_test' },
  { id: 'A0b', engine: '0.3.2-candidate', mode: 'local_deterministic', decl: 'truthful', profile: false, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: false, kind: 'default_refusal_test' },
  { id: 'A1', engine: '0.3.1-candidate', mode: 'local_deterministic', decl: 'supplier_counterfactual', profile: false, outputs: ['condition_findings'], eligibleOnly: false, kind: 'lexical_backstop_test' },
  { id: 'A2', engine: '0.3.3-research-candidate', mode: 'local_deterministic', decl: 'truthful', profile: true, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: false, kind: 'research_no_candidate' },
  { id: 'A3', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: true, mock: 'ORACLE', kind: 'research_mock' },
  { id: 'A4', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: true, mock: 'OVERCLAIM', kind: 'research_mock' },
  { id: 'A5', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: true, mock: 'UNDERCLAIM', kind: 'research_mock' },
  { id: 'A3R', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: true, mock: 'ORACLE-R', kind: 'research_mock' },
  { id: 'A4R', engine: '0.3.3-research-candidate', mode: 'local_mocked', decl: 'truthful', profile: true, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: true, mock: 'OVERCLAIM-R', kind: 'research_mock' },
  { id: 'A6', engine: '0.3.2-candidate', mode: 'local_mocked', decl: 'supplier_counterfactual', profile: false, outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], eligibleOnly: true, mock: 'ORACLE-default', kind: 'default_counterfactual_mock' },
];
const mockIndex = JSON.parse(readFileSync(join(PKG, 'mocks', 'MOCK_INDEX.json'), 'utf8'));
const mockSha = Object.fromEntries(mockIndex.rows.map((r) => [r.policy + '/' + r.id, r.sha256]));
const clock = new Date().toISOString();
const rows = [];
const t0 = Date.now();
for (const e of entries) {
  const eligible = e.full_text_available && e.scope_class === 'NOT_EXCLUDED';
  if (!e.full_text_available) { for (const a of ARMS) rows.push({ arm: a.id, id: e.source_id, cohort: e.cohort, disposition: 'not_run:source_text_not_held' }); continue; }
  const text = readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
  if (sha(text) !== e.extracted_text_sha256) throw new Error('record_hash_mismatch:' + e.source_id);
  const ref = e.reference_findings[0].value;
  const designed = e.cohort === 'synthetic_record' ? JSON.parse(readFileSync(join(PKG, 'records', 'synthetic', 'CONSTRUCTION_REGISTER.json'), 'utf8')).records.find((r) => r.id === e.source_id).designed : null;
  for (const a of ARMS) {
    const base = { arm: a.id, id: e.source_id, cohort: e.cohort, partition: e.partition || (e.cohort === 'original_study_record' ? 'original' : null), family: e.links && e.links.family || null, type: e.links && e.links.type || null, reference: ref, scope_class: e.scope_class };
    if (a.eligibleOnly && !eligible) { rows.push(Object.assign(base, { disposition: 'not_run:scope_decision_SC1_required' })); continue; }
    const Ex = E[a.engine];
    const dv = a.profile ? Object.assign({}, Ex.declaredVersions, { prompt_version: RPV }) : Ex.declaredVersions;
    const submission = { submission_metadata: { submission_id: e.source_id }, scope_declaration: a.decl === 'truthful' ? declare(e) : SUPPLIER, declared_versions: dv, requested_outputs: a.outputs, record_text: text };
    let cand = null;
    if (a.mock) { const body = readFileSync(join(PKG, 'mocks', a.mock, e.source_id + '.json'), 'utf8'); if (sha(body) !== mockSha[a.mock + '/' + e.source_id]) throw new Error('mock_hash_mismatch:' + a.mock + '/' + e.source_id); cand = JSON.parse(body).envelope.content[0].text; }
    const t = process.hrtime.bigint();
    let g = null, err = null;
    try { g = Ex.compiler.compileEvidenceGraph({ submission, candidateResponseText: cand, executionMode: a.mode, clock, fixtureId: e.source_id, researchProfile: a.profile ? PROFILE : undefined }); }
    catch (x) { err = String(x && x.message).slice(0, 300); }
    const ms = Number(process.hrtime.bigint() - t) / 1e6;
    if (!g) { rows.push(Object.assign(base, { engine: a.engine, disposition: 'technical_failure', error: err, ms })); continue; }
    const mech = [...V.checkOffsets(g, text), ...V.checkLinkage(g), ...V.checkAmbiguity(g), ...V.checkMonotonic(g), ...V.checkReviewRoute(g), ...V.checkChronology(g), ...V.checkGraphValid(g, text, Ex.graphValidate.validateGraph)];
    const gd = a.profile ? guards(g) : [];
    let disposition;
    if (mech.length || gd.length) disposition = 'technical_failure';
    else if (g.intake.decision !== 'proceed') disposition = a.kind === 'lexical_backstop_test' ? (g.intake.decision === 'refuse' ? 'backstop_refused' : 'backstop_escalated')
      : (a.profile ? (eligible ? 'incorrect_refusal' : 'correct_refusal') : 'correct_refusal');
    else if (a.kind === 'lexical_backstop_test') disposition = 'backstop_passed';
    else if ((a.profile && !eligible) || (!a.profile && a.decl === 'truthful')) disposition = 'scope_leak';
    else if (a.mode === 'local_deterministic') disposition = 'not_assessed:no_candidate';
    else { const basis = g.findings.filter((f) => ['reconstructability', 'identifiable_basis', 'reasoning_traceability'].includes(f.condition_id)); disposition = basis.some((f) => f.status === 'not_assessed') ? 'partial' : 'substantive_mock'; }
    rows.push(Object.assign(base, { engine: a.engine, mode: a.mode, mock: a.mock || null, disposition, ms: Number(ms.toFixed(3)),
      intake: g.intake.decision, triggers: g.intake.triggers.map((x) => x.code + (x.category && x.category.startsWith('excluded_domain') ? ':' + x.category : '')),
      observed: (({ span_origins, ...o }) => o)(V.observe(g)), reasons: Object.fromEntries(g.findings.map((f) => [f.condition_id, f.reasons])), proposed: Object.fromEntries(g.findings.map((f) => [f.condition_id, f.proposed_status])),
      e1: classifyE1(g), e2: e2(g, designed), guards: gd, mechanical: mech, controls: controlMechanics(g, text), control_defects: g.cognitive_controls.map((c) => c.defect),
      graph_digest: V.graphDigest(g), candidate_sha256: cand ? sha(cand) : null }));
  }
}
const elapsed = Date.now() - t0;
const released = Object.fromEntries(Object.entries(isos).map(([v, iso]) => [v, iso.release()]));
const count = (f) => rows.filter(f).length;
const byArm = {}; for (const r of rows) { const k = r.arm; byArm[k] = byArm[k] || {}; byArm[k][r.disposition] = (byArm[k][r.disposition] || 0) + 1; }
const out = { results_format: 'jrs-study-156-run/1.0.0', label: LABEL, scored: SCORED, started_at_utc: clock, elapsed_ms: elapsed, release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  statement: 'Offline mechanical runs with mock candidate policies. No model, provider, credential or network was used. Agreement figures compare outputs with AI-authored or LLM-reproduced references; they are not accuracy.',
  engines: Object.fromEntries(Object.entries(isos).map(([v, iso]) => [v, { snapshot_sha256: iso.snapshot_sha256, manifest_sha256: iso.manifest_sha256, files_verified: iso.files_verified, released: released[v] }])),
  research_profile: PROFILE, corpus_seal: corpus.checked, network_attempts: attempts.length,
  totals: { rows: rows.length, records: entries.length, by_arm: byArm, technical_failures: count((r) => r.disposition === 'technical_failure'), scope_leaks: count((r) => r.disposition === 'scope_leak') },
  rows };
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals.by_arm), 'tech', out.totals.technical_failures, 'leaks', out.totals.scope_leaks, 'network', attempts.length, 'ms', elapsed);

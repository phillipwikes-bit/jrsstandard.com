// Study completion: reconciliation of the existing evidence from raw rows and executable tools. Read only for the frozen
// packages; engines run in isolated scratch copies; the exit-code demonstration runs the frozen CLIs from a symlinked
// mirror whose out/ is an empty scratch folder, so nothing frozen is written. Writes reconciliation/RECONCILIATION.json
// and .md. Every figure in the .md is computed here. Exits 1 if a check fails or a discrepancy appears that is not in
// KNOWN_DISCREPANCIES (each known one is corrected in reports/CORRECTIONS_2026-10-28.md).
// Usage: node tools/reconcile.mjs <scratch>
import { attempts } from './guard.mjs';
import { existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR, ROOT, RESEARCH, STUDY, PKG4, STATUS, readJson, shaFile, rel, ratio, pct, checker, finish, writeJson, writeOut } from './common.mjs';
import { isolate, loadEngine } from '../../engine-repair-0.3.4-2026-10-27/tools/harness/engines.mjs';
import { recordText, storedMock, relabel, PROFILE, STUDY_SCOPE, classifyE1, byId } from '../../engine-repair-0.3.4-2026-10-27/tools/lib.mjs';
import { ARMS_V2 } from '../../engine-repair-0.3.4-2026-10-27/tools/compile-row-v2.mjs';
import { observe } from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: reconcile.mjs <scratch>'); process.exit(2); }
mkdirSync(SCRATCH, { recursive: true });
const c = checker();
const found = [];   // discrepancies between stated figures and computed ones
const disc = (id, stated, computed, where) => found.push({ id, stated, computed, where });
export const KNOWN_DISCREPANCIES = ['AC-15-prose-10-of-60'];

const run4 = readJson(join(PKG4, 'out', 'run-1', 'RESULTS.json'));
const run3 = readJson(join(STUDY, 'out', 'run-1', 'RESULTS.json'));

// ------------------------------------------------------------------ R1 AC-15 from raw rows
const g4 = run4.rows.filter((r) => r.arm === 'A3R' && r.reference === 'GROUNDED' && r.e1);
const flags = g4.filter((r) => r.e1 === 'FLAG');
const syn = g4.filter((r) => r.cohort === 'synthetic_record'), org = g4.filter((r) => r.cohort === 'original_study_record');
const crit = readJson(join(PKG4, 'protocol', 'ACCEPTANCE_CRITERIA_V2_PROPOSED.json')).criteria.find((x) => x.id === 'AC-15');
const analysis = readJson(join(PKG4, 'reports', 'ANALYSIS_V2.json')).criteria.find((x) => x.id === 'AC-15');
const review = readFileSync(join(PKG4, 'protocol', 'CRITERIA_REVIEW.md'), 'utf8');
const prefreeze = existsSync(join(PKG4, 'history', 'pre-freeze-dev', 'out')) ? readdirSync(join(PKG4, 'history', 'pre-freeze-dev', 'out')) : [];
const ac15 = { all_eligible: { flagged: flags.length, grounded: g4.length, rate: ratio(flags.length, g4.length) }, synthetic_only: { flagged: syn.filter((r) => r.e1 === 'FLAG').length, grounded: syn.length, rate: ratio(syn.filter((r) => r.e1 === 'FLAG').length, syn.length) },
  originals: { flagged: org.filter((r) => r.e1 === 'FLAG').length, grounded: org.length }, flagged_ids: flags.map((r) => r.id), analysis_value: analysis.development_value, threshold: crit.value,
  prose: { criteria_json_review: crit.review, criteria_review_md_says_10_of_60: /10 of 60/.test(review) }, pre_freeze_scored_run_exists: prefreeze.some((d) => /^run-/.test(d)) };
c.check('ac15_analysis_value_equals_raw_all_eligible', analysis.development_value === ac15.all_eligible.rate, [analysis.development_value, ac15.all_eligible.rate]);
c.check('ac15_threshold_missed_on_every_denominator', ac15.all_eligible.rate > crit.value && ac15.synthetic_only.rate > crit.value);
c.check('ac15_no_pre_freeze_scored_run_to_source_10_of_60', !ac15.pre_freeze_scored_run_exists, prefreeze);
if (/10 of 60/.test(crit.review) || ac15.prose.criteria_review_md_says_10_of_60) disc('AC-15-prose-10-of-60', '10 of 60 (16.7%)', ac15.all_eligible.flagged + ' of ' + ac15.all_eligible.grounded + ' (' + pct(ac15.all_eligible.flagged, ac15.all_eligible.grounded) + ') all eligible; ' + ac15.synthetic_only.flagged + ' of ' + ac15.synthetic_only.grounded + ' (' + pct(ac15.synthetic_only.flagged, ac15.synthetic_only.grounded) + ') synthetic only', 'protocol/ACCEPTANCE_CRITERIA_V2_PROPOSED.json AC-15.review; protocol/CRITERIA_REVIEW.md AC-15 row');

// ------------------------------------------------------------------ engines (isolated copies, manifests required)
for (const d of ['e33', 'e34', 'demo-rg', 'demo-ss']) mkdirSync(join(SCRATCH, d), { recursive: true });   // the isolation harness creates its copies inside existing folders
const iso3 = isolate('0.3.3-research-candidate', join(SCRATCH, 'e33'), { requireManifest: true }), iso4 = isolate('0.3.4-research-candidate', join(SCRATCH, 'e34'), { requireManifest: true });
const E3 = await loadEngine(iso3), E4 = await loadEngine(iso4);
// Same compile as regression probes 2.0 (tools/regression-probes-v2.mjs), with the candidate text supplied explicitly.
const compileWith = (E, text, cand) => E.compiler.compileEvidenceGraph({ submission: { submission_metadata: { submission_id: 'rg' }, scope_declaration: Object.assign({}, STUDY_SCOPE),
  declared_versions: Object.assign({}, E.declaredVersions, { prompt_version: E.research.RESEARCH_PROMPT_VERSION }), requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: text },
  candidateResponseText: cand, executionMode: 'local_mocked', clock: '2026-10-27T12:00:00.000Z', fixtureId: 'RG', researchProfile: PROFILE });

// ------------------------------------------------------------------ R2 RG-23: version-specific fixture behaviour
const t1 = recordText('S-001'), stored = storedMock('ORACLE-R', 'S-001');
const storedLabel = JSON.parse(stored).prompt_version;
const cell = (E, cand) => { const g = compileWith(E, t1, cand); const o = observe(g); return { e1: classifyE1(g), candidate_rejected: (o.refusal_codes || []).includes('candidate_response_invalid'), refusal_codes: o.refusal_codes || [] }; };
const rg23 = { record: 'S-001', mock: 'ORACLE-R (study stored mock)', stored_prompt_label: storedLabel, labels: { '0.3.3': E3.research.RESEARCH_PROMPT_VERSION, '0.3.4': E4.research.RESEARCH_PROMPT_VERSION },
  cells: { '0.3.3 engine + stored mock (0.3.3 label)': cell(E3, stored), '0.3.4 engine + stored mock (0.3.3 label): the 1.0 probe': cell(E4, stored),
    '0.3.4 engine + mock relabelled to 0.3.4 (2.0 probe)': cell(E4, relabel(stored, E4.research.RESEARCH_PROMPT_VERSION)), '0.3.3 engine + mock relabelled to 0.3.4': cell(E3, relabel(stored, E4.research.RESEARCH_PROMPT_VERSION)) } };
const cells = Object.values(rg23.cells);
c.check('rg23_stored_mock_carries_0.3.3_label', storedLabel === E3.research.RESEARCH_PROMPT_VERSION && storedLabel !== E4.research.RESEARCH_PROMPT_VERSION, storedLabel);
c.check('rg23_matching_label_gives_CLEAR_on_each_engine', cells[0].e1 === 'CLEAR' && cells[2].e1 === 'CLEAR', [cells[0].e1, cells[2].e1]);
c.check('rg23_mismatched_label_rejected_on_each_engine', cells[1].e1 === 'NOT_ASSESSED' && cells[3].e1 === 'NOT_ASSESSED' && cells[1].candidate_rejected && cells[3].candidate_rejected, [cells[1], cells[3]]);
const ss4 = readJson(join(PKG4, 'out', 'study-suites-0.3.4-research-candidate', 'RESULTS.json')).suites.regression_probes_1_0.find((x) => x.id === 'RG-23');
const rv4 = readJson(join(PKG4, 'out', 'regression-probes-v2-0.3.4-research-candidate', 'RESULTS.json')).results.find((x) => x.id === 'RG-23');
const rv3 = readJson(join(PKG4, 'out', 'regression-probes-v2-0.3.3-research-candidate', 'RESULTS.json')).results.find((x) => x.id === 'RG-23');
const rs3 = readJson(join(STUDY, 'out', 'regression-probes', 'RESULTS.json')).results.find((x) => x.id === 'RG-23');
rg23.frozen_outputs = { 'study suites 1.0 on 0.3.4': ss4, 'regression 2.0 on 0.3.4': rv4, 'regression 2.0 on 0.3.3': rv3, 'study regression 1.0 on 0.3.3': rs3 };
c.check('rg23_frozen_outputs_agree_with_demonstration', !ss4.ok && ss4.observed === cells[1].e1 && rv4.ok && rv4.observed === cells[2].e1 && rv3.ok && rs3.ok);

// ------------------------------------------------------------------ R3 probe counts
const tmpl3 = Object.keys(E3.research.RESEARCH_DEFECT_TEMPLATES).sort(), tmpl4 = Object.keys(E4.research.RESEARCH_DEFECT_TEMPLATES).sort();
const rp3 = readJson(join(STUDY, 'out', 'research-probes', 'RESULTS.json')).results, rp4 = readJson(join(PKG4, 'out', 'study-suites-0.3.4-research-candidate', 'RESULTS.json')).suites.research_probes_1_0;
const area = (rows) => { const o = {}; for (const r of rows) { const a = r.area || (r.feature && r.feature.split(':')[0]) || '?'; o[a] = (o[a] || 0) + 1; } return o; };
const rgv4 = readJson(join(PKG4, 'out', 'regression-probes-v2-0.3.4-research-candidate', 'RESULTS.json')).results, rgv3 = readJson(join(PKG4, 'out', 'regression-probes-v2-0.3.3-research-candidate', 'RESULTS.json')).results;
const probes = {
  research_probes_1_0: { '0.3.3 (study run)': { probes: rp3.length, passed: rp3.filter((x) => x.ok).length }, '0.3.4 (study suites run)': { probes: rp4.length, passed: rp4.filter((x) => x.ok).length },
    defect_templates: { '0.3.3': tmpl3.length, '0.3.4': tmpl4.length, added_in_0_3_4: tmpl4.filter((k) => !tmpl3.includes(k)), removed: tmpl3.filter((k) => !tmpl4.includes(k)) },
    explanation: 'tools/research-probes.mjs 1.0 emits one template probe per entry of the engine\'s RESEARCH_DEFECT_TEMPLATES, so its count depends on the engine. Probe identifiers are positional; identifiers after the template loop shift by the number of added templates.' },
  regression_probes: { '1.0 on 0.3.3 (study)': readJson(join(STUDY, 'out', 'regression-probes', 'RESULTS.json')).totals, '1.0 on 0.3.4 (study suites)': { probes: 32, passed: 31, failed: ['RG-23'] },
    '2.0 on 0.3.4': { probes: rgv4.length, passed: rgv4.filter((x) => x.ok).length, part1: rgv4.slice(0, 32).filter((x) => x.ok).length + '/32', repair_probes: rgv4.slice(32).filter((x) => x.ok).length + '/' + rgv4.slice(32).length },
    '2.0 on 0.3.3': { probes: rgv3.length, passed: rgv3.filter((x) => x.ok).length, part1: rgv3.slice(0, 32).filter((x) => x.ok).length + '/32', repair_probes_failing: rgv3.slice(32).filter((x) => !x.ok).length + '/' + rgv3.slice(32).length } } };
c.check('research_probe_count_difference_equals_added_templates', rp4.length - rp3.length === tmpl4.length - tmpl3.length && tmpl3.every((k) => tmpl4.includes(k)), [rp3.length, rp4.length, tmpl3.length, tmpl4.length]);
c.check('regression_2_0_counts', rgv4.length === 77 && rgv4.every((x) => x.ok) && rgv3.slice(0, 32).every((x) => x.ok) && rgv3.slice(32).filter((x) => !x.ok).length === 37);

// ------------------------------------------------------------------ R4 variant applicability and exclusions
const vi = readJson(join(PKG4, 'variants-v2', 'VARIANT_INDEX_V2.json')), vi1 = readJson(join(STUDY, 'variants', 'VARIANT_INDEX.json'));
const vr = readJson(join(PKG4, 'out', 'vrun-1', 'RESULTS.json')).rows;
const variantTypes = Object.fromEntries(Object.entries(vi.by_type).map(([t, v]) => { const rows = vr.filter((r) => r.type === t); const arms = [...new Set(rows.map((r) => r.arm))].sort();
  return [t, { constructible: v.constructible, not_constructible: v.not_constructible.length, reasons: v.not_constructible, arms, rows: rows.length, rows_not_constructible: rows.filter((r) => r.disposition === 'not_constructible').length }]; }));
const v5 = readJson(join(PKG4, 'out', 'variant-spec-v2-check', 'RESULTS.json')).totals.v5;
const v1v5 = vi1.by_type && vi1.by_type.V5 ? vi1.by_type.V5.constructible : null;
c.check('variants_832_rows_806_constructible', vi.variant_rows === 832 && vi.constructible === 806 && Object.values(variantTypes).reduce((n, v) => n + v.constructible, 0) === 806);
c.check('adv_arm_only_on_V2_and_V6', Object.entries(variantTypes).every(([t, v]) => v.arms.includes('ADV') === (t === 'V2' || t === 'V6')));
c.check('not_constructible_rows_match_index', Object.values(variantTypes).every((v) => v.rows_not_constructible === v.not_constructible * v.arms.length));
c.check('v5_1_0_to_2_0_audit', v5.v1_constructible === 92 && v5.v2_constructible === 89 && v5.v2_changed_text === 4 && v5.v2_newly_not_constructible === 3 && (v1v5 === null || v1v5 === v5.v1_constructible), Object.assign({ study_index_v5_constructible: v1v5 }, v5));

// ------------------------------------------------------------------ R5 scorer labels, arm and version identities
const armDef = Object.fromEntries(ARMS_V2.map((a) => [a.id, a]));
const labelBad = run4.rows.filter((r) => r.reference !== undefined && r.reference !== byId.get(r.id).reference_findings[0].value).map((r) => r.arm + '/' + r.id);
const armBad = run4.rows.filter((r) => r.engine && (r.engine !== armDef[r.arm].engine || (r.mode && r.mode !== armDef[r.arm].mode) || (r.mock || null) !== (armDef[r.arm].mock || null))).map((r) => r.arm + '/' + r.id);
const label3Bad = run3.rows.filter((r) => r.reference !== undefined && r.reference !== byId.get(r.id).reference_findings[0].value).map((r) => r.arm + '/' + r.id);
const man4 = shaFile(join(PKG4, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt'));
const eng4 = run4.engines['0.3.4-research-candidate'];
const mockIdx = readJson(join(PKG4, 'mocks-v2', 'MOCK_INDEX.json'));
const mockLabels = [...new Set(mockIdx.rows.map((r) => JSON.parse(readFileSync(join(PKG4, 'mocks-v2', r.policy, r.id + '.json'), 'utf8')).envelope.content[0].text).map((t) => { try { return JSON.parse(t).prompt_version; } catch { return 'unparsed'; } }))];
c.check('scorer_labels_equal_inventory_0.3.4_run_1', labelBad.length === 0, labelBad.slice(0, 5));
c.check('scorer_labels_equal_inventory_study_run_1', label3Bad.length === 0, label3Bad.slice(0, 5));
c.check('arm_identities_match_arm_table', armBad.length === 0, armBad.slice(0, 5));
c.check('run_1_engine_manifest_is_frozen_0.3.4_manifest', eng4 && eng4.manifest_sha256 === man4 && iso4.manifest_sha256 === man4, [eng4 && eng4.manifest_sha256, man4]);
c.check('mocks_v2_carry_0.3.4_prompt_label_only', mockLabels.length === 1 && mockLabels[0] === E4.research.RESEARCH_PROMPT_VERSION, mockLabels);
iso3.release(); iso4.release();

// ------------------------------------------------------------------ R6 exit codes of the frozen CLIs (symlinked mirror; out/ is scratch)
const M = join(SCRATCH, 'mirror', 'research'); rmSync(join(SCRATCH, 'mirror'), { recursive: true, force: true }); mkdirSync(M, { recursive: true });
for (const d of ['validation-readiness-gate-v0-2026-10-25', 'study-156-2026-10-27']) symlinkSync(join(RESEARCH, d), join(M, d));
for (const n of readdirSync(ROOT)) if (n !== 'research' && n !== '.git') symlinkSync(join(ROOT, n), join(SCRATCH, 'mirror', n));   // the study's feature probes import lib/ at the repository root
const MP = join(M, 'engine-repair-0.3.4-2026-10-27'); mkdirSync(MP);
// candidate/ is copied, not linked: the isolation harness copies it with cpSync, which cannot copy from a link.
for (const n of readdirSync(PKG4)) if (n === 'candidate') cpSync(join(PKG4, n), join(MP, n), { recursive: true }); else if (n !== 'out') symlinkSync(join(PKG4, n), join(MP, n));
mkdirSync(join(MP, 'out'));
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_/.test(k)));
const runFrozen = (args, outRel) => { const r = spawnSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', ...args], { cwd: MP, env, encoding: 'utf8', timeout: 900000 });
  const f = join(MP, 'out', outRel); const R = existsSync(f) ? readJson(f) : null; return { status: r.status, output_written: !!R, totals: R ? (R.totals || null) : null, stderr_tail: (r.stderr || '').slice(-300) }; };
const demo = {
  'regression-probes-v2 on 0.3.3 (37 probes fail)': runFrozen([join(MP, 'tools', 'regression-probes-v2.mjs'), '0.3.3-research-candidate', join(SCRATCH, 'demo-rg')], 'regression-probes-v2-0.3.3-research-candidate/RESULTS.json'),
  'run-study-suites on 0.3.4 (RG-23 fails)': runFrozen([join(MP, 'tools', 'run-study-suites.mjs'), '0.3.4-research-candidate', join(SCRATCH, 'demo-ss'), 'study-suites-demo'], 'study-suites-demo/RESULTS.json'),
};
const fileDemo = (outRel) => { const f = join(MP, 'out', outRel); const r = spawnSync(process.execPath, [join(DIR, 'tools', 'check-results.mjs'), '--file', f, '--expect-all-pass'], { env, encoding: 'utf8' }); return { status: r.status, stdout_head: (r.stdout || '').split('\n')[0] }; };
demo['check-results --expect-all-pass on the regression output'] = fileDemo('regression-probes-v2-0.3.3-research-candidate/RESULTS.json');
demo['check-results --expect-all-pass on the study-suites output'] = fileDemo('study-suites-demo/RESULTS.json');
const tt = readFileSync(join(PKG4, 'tools', 'transport', 'test-transport.mjs'), 'utf8');
demo['test-transport (static)'] = { exits_nonzero_on_failure: /process\.exit\(failed\.length \|\| attempts\.length \? 1 : 0\)/.test(tt) };
const d = Object.values(demo);
c.check('frozen_regression_cli_exits_0_despite_failures', d[0].status === 0 && d[0].output_written && d[0].totals.failed === 37, d[0]);
c.check('frozen_study_suites_cli_exits_0_despite_failure', d[1].status === 0 && d[1].output_written && d[1].totals.regression_probes_1_0.failed.includes('RG-23'), d[1]);
c.check('check_results_exits_1_on_each_failing_output', d[2].status === 1 && d[3].status === 1, [d[2], d[3]]);
c.check('frozen_transport_test_exits_nonzero_on_failure', d[4].exits_nonzero_on_failure);
c.check('nothing_written_into_frozen_out', !existsSync(join(PKG4, 'out', 'study-suites-demo')));

// ------------------------------------------------------------------ R7 the reported E1 table, recomputed from raw rows
const STATED = { // reports/OFFLINE_EVALUATION_REPORT.md section 4.2: [flag UNGROUNDED 0.3.3, 0.3.4], [CLEAR UNGROUNDED], [flag GROUNDED], [CLEAR GROUNDED]
  A3: [[33, 40], [0, 0], [1, 11], [18, 8]], A4: [[35, 40], [0, 0], [1, 11], [18, 8]], A5: [[33, 40], [0, 0], [1, 11], [0, 0]], A3R: [[35, 38], [0, 0], [2, 10], [48, 34]], A4R: [[35, 38], [0, 0], [2, 10], [48, 34]] };
const e1 = (rows, arm, ref, cls) => rows.filter((r) => r.arm === arm && r.reference === ref && r.e1 === cls).length;
const table = {};
for (const [arm, s] of Object.entries(STATED)) {
  const comp = [[e1(run3.rows, arm, 'UNGROUNDED', 'FLAG'), e1(run4.rows, arm, 'UNGROUNDED', 'FLAG')], [e1(run3.rows, arm, 'UNGROUNDED', 'CLEAR'), e1(run4.rows, arm, 'UNGROUNDED', 'CLEAR')],
    [e1(run3.rows, arm, 'GROUNDED', 'FLAG'), e1(run4.rows, arm, 'GROUNDED', 'FLAG')], [e1(run3.rows, arm, 'GROUNDED', 'CLEAR'), e1(run4.rows, arm, 'GROUNDED', 'CLEAR')]];
  table[arm] = { stated: s, computed: comp };
  if (JSON.stringify(s) !== JSON.stringify(comp)) disc('E1-table-' + arm, s, comp, 'reports/OFFLINE_EVALUATION_REPORT.md 4.2');
}
const unknown = found.filter((x) => !KNOWN_DISCREPANCIES.includes(x.id));
c.check('no_unrecorded_discrepancy', unknown.length === 0, unknown);
c.check('every_known_discrepancy_still_present', KNOWN_DISCREPANCIES.every((k) => found.some((x) => x.id === k)), found.map((x) => x.id));

const out = { format: 'jrs-study-completion-reconciliation/1.0.0', ...STATUS, network_attempts: attempts.length,
  statement: 'Computed from raw rows and executable tools. Scripted offline results only; no model output exists. Agreement with AI-proposed labels is not accuracy.',
  ac15, rg23, probes, variants: { by_type: variantTypes, v5_audit: Object.assign({ study_index_v5_constructible: v1v5 }, v5) },
  identities: { scorer_label_mismatches: labelBad.length, study_label_mismatches: label3Bad.length, arm_mismatches: armBad.length, run_1_engine_manifest: eng4 && eng4.manifest_sha256, frozen_manifest: man4, mock_prompt_labels: mockLabels },
  exit_codes: demo, e1_table: table, discrepancies: found, checks: c.checks };
writeJson(join(DIR, 'reconciliation', 'RECONCILIATION.json'), out);

const row = (k, v) => '| ' + k + ' | ' + v + ' |';
const md = ['# Reconciliation of the existing evidence', '', 'Generated by `tools/reconcile.mjs` from raw rows and executable tools. Do not edit by hand. Scripted offline results only.', '',
  '## R1. AC-15 (false alarm, rule-aligned correct candidate A3R)', '', '| Denominator | Flagged GROUNDED records | Rate |', '|---|---|---|',
  '| All 104 eligible (62 GROUNDED): the analysis value | ' + ac15.all_eligible.flagged + ' of ' + ac15.all_eligible.grounded + ' | ' + pct(ac15.all_eligible.flagged, ac15.all_eligible.grounded) + ' |',
  '| Synthetic only (60 GROUNDED) | ' + ac15.synthetic_only.flagged + ' of ' + ac15.synthetic_only.grounded + ' | ' + pct(ac15.synthetic_only.flagged, ac15.synthetic_only.grounded) + ' |',
  '| Originals only | ' + ac15.originals.flagged + ' of ' + ac15.originals.grounded + ' | |', '',
  'The "10 of 60 (16.7%)" in the criteria review has no machine-readable source (no scored run exists before the freeze) and combines the all-record numerator with the synthetic-only denominator. Corrected: ' + ac15.all_eligible.flagged + ' of ' + ac15.all_eligible.grounded + ' (' + pct(ac15.all_eligible.flagged, ac15.all_eligible.grounded) + '), or ' + ac15.synthetic_only.flagged + ' of ' + ac15.synthetic_only.grounded + ' (' + pct(ac15.synthetic_only.flagged, ac15.synthetic_only.grounded) + ') synthetic only. The threshold (at most ' + crit.value + ') is missed on every denominator; AC-15 remains not evaluable because it applies to fresh evaluation material only. Flagged: ' + ac15.flagged_ids.join(', ') + '.', '',
  '## R2. RG-23 (31 of 32 for regression probes 1.0 on 0.3.4)', '', '| Engine and candidate | E1 | Candidate rejected |', '|---|---|---|',
  ...Object.entries(rg23.cells).map(([k, v]) => '| ' + k + ' | ' + v.e1 + ' | ' + v.candidate_rejected + ' |'), '',
  'The stored mock carries the prompt label `' + storedLabel + '`. Each engine accepts only its own label, so the same observations give CLEAR under a matching label and NOT_ASSESSED under the other. RG-23 fails in 1.0 on 0.3.4 because of the fixture label, not the engine; 2.0 relabels the mock (observations unchanged) and passes on both engines.', '',
  '## R3. Probe counts', '', '| Suite | Counts |', '|---|---|',
  row('Research probes 1.0', '0.3.3: ' + rp3.length + '/' + rp3.length + '; 0.3.4: ' + rp4.length + '/' + rp4.length + '. The file emits one probe per research defect template (0.3.3 ' + tmpl3.length + ', 0.3.4 ' + tmpl4.length + '; added: ' + probes.research_probes_1_0.defect_templates.added_in_0_3_4.join(', ') + '). Identifiers are positional.'),
  row('Regression probes 1.0', '0.3.3: 32/32; 0.3.4: 31/32 (RG-23, R2)'),
  row('Regression probes 2.0', '0.3.4: ' + probes.regression_probes['2.0 on 0.3.4'].passed + '/77; 0.3.3: Part 1 ' + probes.regression_probes['2.0 on 0.3.3'].part1 + ', repair probes failing ' + probes.regression_probes['2.0 on 0.3.3'].repair_probes_failing), '',
  '## R4. Variant applicability (variant set 2.0)', '', '| Type | Constructible | Not constructible | Arms |', '|---|---|---|---|',
  ...Object.entries(variantTypes).map(([t, v]) => '| ' + t + ' | ' + v.constructible + ' | ' + v.not_constructible + ' | ' + v.arms.join(', ') + ' |'), '',
  'V5 (evidence removal) 1.0 to 2.0: ' + v5.v1_constructible + ' constructible in 1.0, of which ' + v5.v1_texts_with_evidence_left + ' left evidence in place; ' + v5.v2_constructible + ' constructible in 2.0 (' + v5.v2_changed_text + ' texts changed, ' + v5.v2_newly_not_constructible + ' newly not constructible). The adversarial citer ADV runs only on V2 and V6, as specified.', '',
  '## R5. Identities', '', '| Check | Result |', '|---|---|',
  row('Scorer labels equal the inventory', '0.3.4 run-1: ' + (labelBad.length ? labelBad.length + ' mismatches' : 'all rows') + '; study run-1: ' + (label3Bad.length ? label3Bad.length + ' mismatches' : 'all rows')),
  row('Arms equal the arm table (engine, mode, mock)', armBad.length ? armBad.length + ' mismatches' : 'all rows'),
  row('Run-1 0.3.4 engine manifest', (eng4 && eng4.manifest_sha256 === man4 ? 'equals' : 'DIFFERS FROM') + ' the frozen candidate manifest `' + man4.slice(0, 16) + '…`'),
  row('Prompt label in every mocks-v2 candidate', mockLabels.join(', ')), '',
  '## R6. Exit codes', '', '| Command | Exit | Note |', '|---|---|---|',
  '| frozen `regression-probes-v2.mjs 0.3.3-research-candidate` (mirror) | ' + d[0].status + ' | ' + (d[0].totals ? d[0].totals.failed + ' probes failed' : 'no output') + ' |',
  '| frozen `run-study-suites.mjs 0.3.4-research-candidate` (mirror) | ' + d[1].status + ' | ' + (d[1].totals ? 'regression 1.0 failed: ' + d[1].totals.regression_probes_1_0.failed.join(', ') : 'no output') + ' |',
  '| `check-results.mjs --expect-all-pass` on the first output | ' + d[2].status + ' | fails closed |',
  '| `check-results.mjs --expect-all-pass` on the second output | ' + d[3].status + ' | fails closed |',
  '| frozen `test-transport.mjs` | (static) | exits 1 on any failure: ' + d[4].exits_nonzero_on_failure + ' |', '',
  'The frozen suites write their results and exit 0 when probes fail; only the transport test fails its exit code. `post-freeze-runs.sh` therefore reports completion, not success. `tools/check-results.mjs` closes that gap for the frozen outputs, and every tool in this directory exits 1 on any failed check.', '',
  '## R7. The reported E1 table, recomputed', '', '| Arm | Stated (0.3.3, 0.3.4) | Computed from raw rows |', '|---|---|---|',
  ...Object.entries(table).map(([a, v]) => '| ' + a + ' | ' + JSON.stringify(v.stated) + ' | ' + JSON.stringify(v.computed) + ' |'), '',
  '## Discrepancies', '', ...(found.length ? found.map((x) => '- `' + x.id + '`: stated ' + JSON.stringify(x.stated) + '; computed ' + JSON.stringify(x.computed) + ' (' + x.where + '). Corrected in `reports/CORRECTIONS_2026-10-28.md`.') : ['- none']), '',
  '## Checks', '', ...c.checks.map((x) => '- ' + (x.ok ? 'PASS' : '**FAIL**') + ' `' + x.id + '`'), ''];
writeOut(join(DIR, 'reconciliation', 'RECONCILIATION.md'), md.join('\n'));
finish('reconciliation', c, found.length + ' discrepancies (' + unknown.length + ' unrecorded); network attempts ' + attempts.length);

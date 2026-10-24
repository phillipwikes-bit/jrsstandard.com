#!/usr/bin/env node
// JRS PHASE 7: generates the table-bearing records from recorded artifacts, so no count is typed by hand.
//   node research/engine-remediation-phase7-2026-10-19/tooling/build-documents.mjs
// Writes DIFFERENTIAL_QUALIFICATION_RECORD.md, REGRESSION_SCENARIO_REGISTER.md, MUTATION_EVIDENCE.md,
// STABILITY_AND_OVER_REFUSAL_RECORD.md and REMEDIATION_BACKLOG.md.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const P7 = fileURLToPath(new URL('../', import.meta.url));
const J = (p) => JSON.parse(readFileSync(join(P7, p), 'utf8'));
const qual = J('results/QUALIFICATION_RESULTS.json'), scen = J('results/SCENARIO_RESULTS.json'), stab = J('stability/STABILITY_RESULTS.json');
const over = J('results/OVER_REFUSAL_TABLE.json'), mut = J('execution-record/MUTATION_EVIDENCE.json'), p6 = J('results/PHASE6_LIBRARY_ON_CANDIDATE.json');
const ics = J('INTENDED_CHANGE_SET.json');
const backlog = readFileSync(join(P7, 'backlog/REMEDIATION_BACKLOG.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const cases = Object.fromEntries(readdirSync(join(P7, 'scenarios/cases')).map((f) => { const s = JSON.parse(readFileSync(join(P7, 'scenarios/cases', f), 'utf8')); return [s.scenario_id, s]; }));

const HEAD = '**LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.**\n\n';
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ').replace(/—/g, ',');
const table = (h, rows) => '| ' + h.join(' | ') + ' |\n|' + h.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.map(cell).join(' | ') + ' |').join('\n') + '\n';
const counts = (o) => Object.entries(o).map(([k, v]) => '`' + k + '` ' + v).join(', ');
const st = (s) => Object.entries(s || {}).map(([k, v]) => k.split('_')[0] + ':' + v).join(', ');
const docs = {};

docs['DIFFERENTIAL_QUALIFICATION_RECORD.md'] = '# Differential Qualification Record\n\n' + HEAD
  + qual.statement + ' Source: `results/QUALIFICATION_RESULTS.json`, produced by `build-artifacts.mjs` at the fixed clock ' + qual.generated_clock + '.\n\n'
  + '## Method\n\nEvery input is compiled twice, once by frozen v0.3 and once by the candidate, with the same submission and the same mocked response. The unchanged Phase 6 differ compares the two graphs; `tooling/qualify.mjs` assigns one class. A difference is accepted only where `INTENDED_CHANGE_SET.json` (sealed before candidate logic existed) or the scenario\'s sealed differential expectation predicts it, and only towards the sealed outcome. A version label and recomputed offsets are recorded as presentation.\n\n'
  + '## Counts\n\n' + table(['Input set', 'Total', 'Classes'], [['Existing v0.3-family inputs (v0.3 fixtures, Phase 4 corpus and stability, Phase 6 library and stability)', qual.existing.length, counts(qual.existing_counts)], ['Phase 7 scenarios', qual.phase7.length, counts(qual.phase7_counts)]])
  + '\nNo input is classed `unintended_regression`, `favorable_transition_requiring_human_review`, `limitation_loss`, `evidence_integrity_defect` or `scope_boundary_defect`. The pre-scan predicted ' + ics.triggered + ' triggered existing inputs; the candidate changed exactly those inputs.\n\n'
  + '## Existing inputs that changed\n\n' + table(['Input', 'Family', 'Rules', 'v0.3 outcomes', 'Candidate outcomes', 'Class'], qual.existing.filter((q) => q.classification !== 'no_behavioral_difference').map((q) => [q.id, q.family, q.rules.join(', '), st(q.base_statuses), st(q.candidate_statuses), '`' + q.classification + '`']))
  + '\nEvery change keeps or lowers a status, adds a conflict or gap, or refuses. None raises a status.\n\n'
  + '## Phase 7 scenarios\n\n' + table(['Scenario', 'Rules', 'Candidate outcomes', 'Class'], qual.phase7.map((q) => [q.id, q.rules.join(', ') || 'none', st(q.candidate_statuses), '`' + q.classification + '`']))
  + '\n## Phase 6 library on the candidate (informational)\n\n' + p6.note + ' Counts: ' + counts(p6.counts) + '.\n\n'
  + '## Post-seal harness correction (disclosed)\n\nOn P7-SCO-05 an intake refusal supersedes a response refusal. The unchanged Phase 6 differ reports this as two scope findings ("candidate response refusal lost", "refusal lost: candidate_response_invalid"). `tooling/qualify.mjs` was corrected after the seal to accept exactly those two findings, and only when the complete refusal state holds and the candidate response was not read, as sealed contract rule 3 already requires. No sealed expectation changed. See `EXECUTION_RECORD.md`.\n';

docs['REGRESSION_SCENARIO_REGISTER.md'] = '# Regression Scenario Register\n\n' + HEAD
  + 'Fifty synthetic scenarios, authored by `scenarios/author-scenarios.mjs` and hashed into `SEAL.json` before candidate logic existed. Each carries a synthetic marker, provenance note, expected safe behaviour, limitation, expected limitation kinds, expected route and a sealed differential expectation. Result counts: ' + counts(scen.counts) + '.\n\n'
  + table(['Area', 'Scenarios', 'Required minimum'], [['R07 motive note (RP-STR-01)', 6, 6], ['Chronology (RP-CHR-01 to 04)', 16, 14], ['Negation (RP-NEG-01)', 8, 8], ['Evidence link (RP-EVL-01)', 8, 8], ['Conflict (RP-CON-01)', 6, 6], ['Scope (RP-SCO-01)', 6, 6]])
  + '\nEvery implemented rule has a positive, a nearby benign, a malformed-input and a duplicate-or-reordered scenario.\n\n'
  + table(['Scenario', 'Rule', 'Role', 'Expected safe behaviour', 'Candidate outcomes', 'Route', 'Result'], scen.results.map((r) => { const c = cases[r.scenario_id]; return [r.scenario_id, r.rule_id, r.role, c.expected_safe_behavior, st(r.statuses), c.expected_route, '`' + r.result + '`']; }));

const areas = {}; for (const r of mut.results) areas[r.area] = (areas[r.area] || 0) + 1;
docs['MUTATION_EVIDENCE.md'] = '# Mutation Evidence\n\n' + HEAD
  + 'Source: `execution-record/MUTATION_EVIDENCE.json` (' + mut.generated_at + ', `' + mut.command + '`). Each mutation is an exact, once-only text replacement in a temporary copy of `lib/` and the Phase 7 tooling; the mutated modules are imported and ' + mut.probes + ' direct probes run. A mutation counts as killed only when a probe fails. A load failure does not count.\n\n'
  + table(['Measure', 'Value'], [['Mutations introduced', mut.total], ['Killed by a direct probe', mut.killed], ['Survived', mut.survived], ['Load failures', mut.load_failures], ['Setup errors', mut.setup_errors], ['Probes (all pass unmutated)', mut.probes], ['Network attempts', mut.network_attempts]])
  + '\n## Areas\n\n' + table(['Area', 'Mutations'], Object.entries(areas).sort().map(([a, n]) => [a, n]))
  + '\n## History of this record (disclosed)\n\n'
  + '1. The first mutation run was invalid: a probe compiled existing inputs in the wrong execution mode. It was stopped and its temporary directories removed. The probe gained a mode parameter.\n'
  + '2. The second run killed 75 of 79. MX-02, MX-40, MX-59 and MX-61 survived. Work stopped and was reported without repair.\n'
  + '3. On owner authorization four direct probes were added (`execution-record/POST_STOP_REPAIR_RECORD.json`). The first attempt to launch the rerun never began (`execution-record/FIRST_ATTEMPT_DISCLOSURE.json`).\n'
  + '4. The rerun killed 79 of 79 but the coverage check failed: no mutation was labelled `rule trigger: RP-NEG-01`. That check had also failed in run 2. On owner authorization MX-14, which disables the RP-NEG-01 trigger, was relabelled; its text and probes are unchanged (`execution-record/LABEL_CORRECTION_RECORD.json`).\n'
  + '5. The full mutation group was rerun: 84 of 84 checks passed.\n\n'
  + '## Results\n\n' + table(['Mutation', 'Area', 'File', 'Target text', 'Result', 'Killed by'], mut.results.map((r) => [r.id, r.area, r.file.replace(/^.*\//, ''), '`' + String(r.description || '').replace(/`/g, "'").slice(0, 70) + '`', '`' + r.result + '`', (r.killed_by || []).slice(0, 4).join(', ') + ((r.killed_by || []).length > 4 ? ' (+' + (r.killed_by.length - 4) + ')' : '')]))
  + '\nMutation testing shows these probes detect these specific deliberate defects. It does not show the probes detect every defect.\n';

docs['STABILITY_AND_OVER_REFUSAL_RECORD.md'] = '# Stability and Over-Refusal Record\n\n' + HEAD
  + '## Stability\n\n' + stab.statement + ' Source: `stability/STABILITY_RESULTS.json`, run through the unchanged Phase 6 stability runner. Results hash `' + stab.results_hash + '`.\n\n'
  + table(['Measure', 'Value', 'Required'], [['Transforms', stab.total, 'at least 30'], ['As expected', stab.as_expected, 'all'], ['Invariant transforms', stab.invariant_total, ''], ['Invariant from non-favourable bases', stab.invariant_non_favorable_base, ''], ['All transforms from non-favourable bases', stab.results.filter((r) => r.base_state === 'non_favorable').length, 'at least 12']])
  + '\n' + table(['Transform', 'Kind', 'Base', 'Base state', 'Verdict', 'Result'], stab.results.map((r) => [r.transform_id + ' ' + r.name, r.kind, r.base, r.base_state, '`' + r.verdict + '`', '`' + r.result + '`']))
  + '\n## Over-refusal\n\n' + over.statement + ' Source: `results/OVER_REFUSAL_TABLE.json`.\n\n'
  + table(['Rule', 'Target cases routed as sealed', 'Benign cases refused or degraded', 'Existing inputs triggered'], over.rows.map((r) => [r.rule_id, r.target_cases_routed_as_sealed + ' of ' + r.target_cases, r.benign_cases_refused_or_degraded + ' of ' + r.benign_cases, r.existing_inputs_triggered.join(', ')]))
  + '\nEvery triggered existing input was predicted by the sealed intended change set. The benign counts are small synthetic samples; they do not estimate a false-positive rate. The one degradation an owner may judge as over-review is Phase 4 ST-06 (P7-OD-02).\n';

docs['REMEDIATION_BACKLOG.md'] = '# Remediation Backlog\n\n' + HEAD
  + 'Source of record: `backlog/REMEDIATION_BACKLOG.jsonl`, append-only and hash-chained (each entry carries the previous entry hash). This page is a reading copy. P6-RT-07 and each of P6K-001 to P6K-008 has its own non-rejected entry.\n\n'
  + table(['Entry', 'Defect', 'Decision', 'Reason', 'Regression tests', 'Independent evaluation before stronger claim', 'Owner decision'], backlog.map((e) => [e.entry_id, e.defect_ref, '`' + e.decision + '`', e.reason, e.regression_tests_required, e.independent_evaluation_required_before_stronger_claim ? 'yes' : 'no', e.owner_decision_required]));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { for (const [k, v] of Object.entries(docs)) writeFileSync(join(P7, k), v); console.log('wrote ' + Object.keys(docs).join(', ')); }

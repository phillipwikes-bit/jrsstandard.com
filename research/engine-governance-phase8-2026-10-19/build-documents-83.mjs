#!/usr/bin/env node
// JRS PHASE 8.3 classifier correction: writes PHASE8_3_CLASSIFIER_CORRECTION.md and adds one row to CHANGELOG.md.
// Earlier Phase 8 documents are not regenerated, so their historical text is unchanged.
//   node research/engine-governance-phase8-2026-10-19/build-documents-83.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUS_LINES } from '../../lib/engine-governance-phase8/registry.mjs';

const P8 = fileURLToPath(new URL('./', import.meta.url));
const J = (p) => (existsSync(join(P8, p)) ? JSON.parse(readFileSync(join(P8, p), 'utf8')) : null);
const c = J('execution-record/PHASE8_3_CLASSIFIER_CORRECTION_RECORD.json'), run = J('execution-record/WORKTREE_RUN_RECORD.json'), tr = J('execution-record/PHASE8_TEST_RESULTS.json'), mut = J('execution-record/MUTATION_EVIDENCE.json');
const pre = c.pre_correction_state;
const HEAD = '**' + STATUS_LINES.join('. ') + '.**\n\n';
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (hd, rows) => '| ' + hd.join(' | ') + ' |\n|' + hd.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.map(cell).join(' | ') + ' |').join('\n') + '\n';
const R = run && run.report;
const m83 = mut ? mut.results.filter((r) => +r.id.slice(3) >= 99 || r.id === 'MG-06' || r.id === 'MG-12') : [];
const fresh = !!(run && R && Date.parse(run.started_at) > Date.parse(pre.worktree_run.started_at));

let doc = '# Phase 8.3 Classifier Correction\n\n' + HEAD
  + '**A narrow owner-authorized correction to Phase 8 local governance, not a new engineering phase. No Engine, Phase 1 to 7, Phase 9 logic, public or deployment file changed. B-018 remains OPEN. NO_GO_NOT_VERIFIED is unchanged.**\n\n'
  + 'Authorization: ' + c.authorization + '.\n\n## Defect\n\n' + c.defect + '\n\n## Correction\n\n' + c.correction.map((x) => '- ' + x).join('\n') + '\n\n'
  + '## Classification of path and package states\n\n' + table(['Path or package state', 'Classification'], [
    ['Registered seed package (Phase 6, 7, 8) or earlier package', 'Existing historical treatment (CPC-01 to CPC-04 for the files they name)'],
    ['Valid admitted package, no files', 'Valid reservation; no item'],
    ['Valid admitted package with files and a verified manifest', '`declared_composition_condition` for each earlier check it declared'],
    ['Valid admitted package with files but no manifest', '`declared_incomplete_construction`'],
    ['Admitted package changed after its manifest', '`admitted_package_integrity_failure` (fails closed)'],
    ['Admitted package file outside its approved paths', '`package_outside_registry` (fails closed)'],
    ['Unregistered package path, or an unknown path imitating one', '`package_outside_registry` (fails closed)'],
    ['Invalid owner decision or admission record', '`missing_or_invalid_registry_reservation` (fails closed); a registry-level problem invalidates every admitted package'],
    ['Files older than the admission, or undetermined package state', '`files_before_admission` or `package_state_not_determined` (fails closed)'],
    ['Earlier check tripped by an admitted package that did not declare it', '`undeclared_affected_check` (fails closed)']])
  + '\n## Pre-correction state (preserved)\n\n' + table(['Item', 'Value'], [
    ['Phase 8 suite', pre.result + ' (' + pre.by_kind.direct + ' direct, ' + pre.by_kind.negative + ' negative, ' + pre.by_kind.mutation + ' mutation), recorded ' + pre.recorded_at],
    ['Mutations', pre.mutations],
    ['Isolated replay of that state', pre.isolated_replay],
    ['Phase 8 manifest', pre.historical_manifest.file + ' (' + pre.historical_manifest.files + ' files, ' + pre.historical_manifest.sha256 + ')'],
    ['Whole-worktree run with Phase 9 present', 'classification `' + pre.worktree_run.classification_verdict + '`: ' + pre.worktree_run.package_outside_registry + ' package_outside_registry, ' + pre.worktree_run.unexplained_conflict + ' unexplained_conflict; registry-derived composition `' + pre.worktree_run.composition_verdict + '`; Phase 8 self-run ' + pre.worktree_run.phase8_self_run],
    ['Preserved records', pre.preserved_records.map((r) => r.file).join(', ')]]);
if (fresh) {
  doc += '\n## Result after the correction\n\nWhole-worktree run ' + run.started_at + ' to ' + run.finished_at + '.\n\n' + table(['Kind', 'Result'], [
    ['1. Historical package results', R.historical_package_results.map((x) => x.package + ' ' + x.result).join('; ')],
    ['2. Isolated replay results', R.isolated_replay_results.map((x) => x.package + ' ' + (x.result || 'none')).join('; ')],
    ['3. Current-composition results', R.current_composition_results.map((x) => x.package + ' ' + (x.result || 'none')).join('; ')],
    ['4. Declared composition conditions', R.declared_composition_conditions.length + ': ' + R.declared_composition_conditions.map((x) => x.condition_id || x.classification).join(', ')],
    ['5. Undeclared failures', String(R.undeclared_failures.length)],
    ['6. Integrity failures', String(R.integrity_failures.length)],
    ['Compatibility classification', '`' + run.classification.verdict + '`'],
    ['Registry-derived composition', '`' + run.composition.verdict + '`'],
    ['Phase 8 in the current composition', run.phase8_composition ? run.phase8_composition.result + ', `' + run.phase8_composition.verdict + '`' : 'not recorded']]);
}
if (tr && Date.parse(tr.generated_at) > Date.parse(pre.recorded_at)) doc += '\n## Phase 8 suite after the correction\n\n' + tr.passed + ' of ' + (tr.passed + tr.failed) + ' checks passed (' + tr.by_kind.direct + ' direct, ' + tr.by_kind.negative + ' negative or adversarial, ' + tr.by_kind.mutation + ' mutation); recorded ' + tr.generated_at + '.\n';
if (mut && Date.parse(mut.generated_at) > Date.parse(pre.recorded_at)) doc += '\n## Mutations\n\n' + mut.killed + ' of ' + mut.total + ' caught by named probes; ' + mut.load_failures + ' load failures; ' + mut.setup_errors + ' setup errors. Added by this correction: MG-99 to MG-112. MG-06 and MG-12 were retargeted to the same logic in its corrected form because their original target text no longer exists; the defect each injects is unchanged.\n\n'
  + table(['Mutation', 'Area', 'Result', 'Caught by'], m83.map((r) => [r.id, r.area, r.result, (r.killed_by || []).slice(0, 3).join(', ')]));
doc += '\nNo release, deployment, independent evaluation, provider use or commercial readiness determination occurred. No commit, push, merge, pull-request action, B-018, tracker, source, branch or public change occurred.\n';
writeFileSync(join(P8, 'PHASE8_3_CLASSIFIER_CORRECTION.md'), doc.replace(/—/g, ','));

const ROW = '| 2026-10-21 | Phase 8.3 classifier correction: the compatibility-manifest classifier places admitted later-package paths through the later-package registry; six result kinds reported separately. Pre-correction state (' + pre.result + ', ' + pre.mutations + ') preserved. | PHASE8_3_CLASSIFIER_CORRECTION.md |';
const cl = readFileSync(join(P8, 'CHANGELOG.md'), 'utf8');
if (!cl.includes('Phase 8.3 classifier correction')) writeFileSync(join(P8, 'CHANGELOG.md'), cl.replace(/\n*$/, '\n') + ROW + '\n');
console.log('wrote PHASE8_3_CLASSIFIER_CORRECTION.md' + (fresh ? ' with the post-correction run' : ' (pre-run)'));

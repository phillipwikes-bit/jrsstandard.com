#!/usr/bin/env node
// JRS PHASE 8.3 classifier correction: writes execution-record/PHASE8_3_CLASSIFIER_CORRECTION_RECORD.json from the
// pre-correction state preserved in execution-record/phase8-3-pre-correction/ and registry/manifests/phase8-governance-8.2c-historical.sha256.
//   node research/engine-governance-phase8-2026-10-19/build-records-83.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUS_LINES, sha256 } from '../../lib/engine-governance-phase8/registry.mjs';

const P8 = fileURLToPath(new URL('./', import.meta.url));
const J = (p) => JSON.parse(readFileSync(join(P8, p), 'utf8'));
const pre = 'execution-record/phase8-3-pre-correction/';
const tr = J(pre + 'PHASE8_TEST_RESULTS.json'), mu = J(pre + 'MUTATION_EVIDENCE.json'), wr = J(pre + 'WORKTREE_RUN_RECORD.json');
const HM = 'registry/manifests/phase8-governance-8.2c-historical.sha256';
const count = (c) => wr.classification.items.filter((i) => i.classification === c).length;
const rec = { record_type: 'jrs-phase8-3-classifier-correction/1.0.0', status_lines: STATUS_LINES,
  statement: 'Narrow owner-authorized correction of the compatibility-manifest classifier so that it places paths of valid admitted later packages through the later-package registry. Not a new engineering phase. No Engine, Phase 1 to 7, Phase 9 logic, public or deployment file changed.',
  authorization: 'Owner authorization 2026-10-21: Phase 8 Registry-Aware Compatibility Classifier Correction',
  defect: 'tools/engine-governance-phase8-replay.mjs passed every untracked path to governance.classifyRun, which assigns packages with registry.packageOf over the static earlier-package list and the four CPC conditions only. Paths of a valid admitted later package (Phase 9) were therefore package_outside_registry, and CPC-01 to CPC-04 became unexplained_conflict because their declared triggering paths predate Phase 9. The overall verdict failed closed although the registry-derived composition declared every condition. The Phase 8 suite recomputed the classification over Phase 8-scope paths only, so it reported declared conditions only and disagreed with the recorded verdict.',
  correction: ['classifyRun accepts an optional registry-derived context (later-packages.laterCompatibilityContext). Without it the classification is unchanged.',
    'A path outside the statically registered packages is accepted only when it belongs to a valid admitted package in a declared state (manifest_verified, or incomplete_construction reported as declared_incomplete_construction). Invalid reservations, files before admission, undetermined states and integrity failures keep their fail-closed classes; any other path stays package_outside_registry. A registry-level validation problem invalidates every admitted package.',
    'A failing earlier check is attributed to an admitted package only when that package declared the check; otherwise undeclared_affected_check, which fails closed. CPC-01 to CPC-04 remain historical compatibility references for the files they name.',
    'The replay validates the registry before classifying, and records and prints six result kinds separately (historical, isolated replay, current composition, declared conditions, undeclared failures, integrity failures).',
    'The Phase 8 suite recomputes the classification over the whole worktree with the same registry context.'],
  pre_correction_state: { recorded_at: tr.generated_at, result: tr.passed + '/' + (tr.passed + tr.failed), by_kind: tr.by_kind, mutations: mu.killed + '/' + mu.total,
    historical_manifest: { file: HM, sha256: 'sha256:' + sha256(readFileSync(join(P8, HM))), files: readFileSync(join(P8, HM), 'utf8').split('\n').filter((l) => /^[0-9a-f]{64} {2}/.test(l)).length },
    preserved_records: ['PHASE8_TEST_RESULTS.json', 'MUTATION_EVIDENCE.json', 'WORKTREE_RUN_RECORD.json'].map((f) => ({ file: pre + f, sha256: 'sha256:' + sha256(readFileSync(join(P8, pre + f))) })),
    worktree_run: { started_at: wr.started_at, classification_verdict: wr.classification.verdict, composition_verdict: wr.composition.verdict, package_outside_registry: count('package_outside_registry'), unexplained_conflict: count('unexplained_conflict'),
      genuine_regression: count('genuine_regression'), phase8_self_run: wr.phase8_composition ? wr.phase8_composition.result : null, phase8_self_run_failed_checks: wr.phase8_composition ? wr.phase8_composition.failed_checks : [] },
    isolated_replay: J('execution-record/PHASE8_2_CORRECTED_ISOLATED_REPLAY.json').result } };
writeFileSync(join(P8, 'execution-record/PHASE8_3_CLASSIFIER_CORRECTION_RECORD.json'), JSON.stringify(rec, null, 2) + '\n');
console.log('pre-correction: ' + rec.pre_correction_state.result + ', mutations ' + rec.pre_correction_state.mutations + ', run ' + rec.pre_correction_state.worktree_run.classification_verdict + ' (' + rec.pre_correction_state.worktree_run.package_outside_registry + ' outside, ' + rec.pre_correction_state.worktree_run.unexplained_conflict + ' unexplained)');

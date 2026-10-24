#!/usr/bin/env node
// JRS PHASE 8.2 admission correction: generates CHANGELOG.md and PHASE8_2_ADMISSION_CORRECTION_HANDOFF.md,
// and the admission-correction section appended to PHASE8_2_EXECUTION_RECORD.md (run after build-documents-82.mjs).
//   node research/engine-governance-phase8-2026-10-19/build-documents-82c.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUS_LINES } from '../../lib/engine-governance-phase8/registry.mjs';

const P8 = fileURLToPath(new URL('./', import.meta.url));
const J = (p) => JSON.parse(readFileSync(join(P8, p), 'utf8'));
const c = J('execution-record/PHASE8_2_ADMISSION_CORRECTION_RECORD.json'), reg = J('governance/LATER_PACKAGE_REGISTRY.json'), run = J('execution-record/WORKTREE_RUN_RECORD.json'), mut = J('execution-record/MUTATION_EVIDENCE.json');
const tr = existsSync(join(P8, 'execution-record/PHASE8_TEST_RESULTS.json')) ? J('execution-record/PHASE8_TEST_RESULTS.json') : null;
const iso = existsSync(join(P8, 'execution-record/PHASE8_2_CORRECTED_ISOLATED_REPLAY.json')) ? J('execution-record/PHASE8_2_CORRECTED_ISOLATED_REPLAY.json') : null;
const h = c.phase8_2_historical_state;
const HEAD = '**' + STATUS_LINES.join('. ') + '.**\n\n';
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (hd, rows) => '| ' + hd.join(' | ') + ' |\n|' + hd.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.map(cell).join(' | ') + ' |').join('\n') + '\n';
const pc = run.phase8_composition;
const m82c = mut.results.filter((r) => +r.id.slice(3) >= 86);
const suite = tr ? tr.passed + ' of ' + (tr.passed + tr.failed) + ' checks passed (' + tr.by_kind.direct + ' direct, ' + tr.by_kind.negative + ' negative or adversarial, ' + tr.by_kind.mutation + ' mutation)' : 'see execution-record/PHASE8_TEST_RESULTS.json';
const docs = {};

const section = '\n## Admission correction (2026-10-20)\n\n' + c.statement + '\n\n' + c.framing_correction + '\n\n'
  + table(['Item', 'Was', 'Now'], c.corrections.map((x) => [x.item, x.was, x.now]))
  + '\nTemporary-copy simulation of every package state: ' + c.temporary_copy_simulation.results.map((x) => x.state + ' (' + x.phase8_failures + ' Phase 8 failures' + (x.expected ? '; expected' : '') + ')').join('; ') + '. ' + c.temporary_copy_simulation.first_simulation_findings + '\n';
const er = readFileSync(join(P8, 'PHASE8_2_EXECUTION_RECORD.md'), 'utf8').split('\n## Admission correction (2026-10-20)')[0].replace(/\n+$/, '\n');
docs['PHASE8_2_EXECUTION_RECORD.md'] = er + section;

docs['CHANGELOG.md'] = '# Phase 8 Changelog\n\n' + HEAD + 'Local governance package changes only. No entry alters an Engine conclusion, an evaluation status (none authorized or conducted) or the release status.\n\n'
  + table(['Date', 'Change', 'Record'], [
    ['2026-10-19', 'Phase 8: version registry, cross-package governance (CPC-01 to CPC-04), qualification record, execution-disabled evaluation protocol, change-impact model.', 'PHASE8_HANDOFF.md'],
    ['2026-10-19', 'Owner-authorized repair of three qualification probes after MG-14 survived.', 'execution-record/POST_STOP_REPAIR_RECORD.json'],
    ['2026-10-19', 'Harness safeguards rebuilt after the read-only audit finding.', 'execution-record/AUDIT_REMEDIATION_RECORD.json'],
    ['2026-10-20', 'Phase 8.1: later-package registry, dual-context results, isolated historical replay, admission gate, evaluation handoff freeze.', 'PHASE8_1_EXECUTION_RECORD.md'],
    ['2026-10-20', 'Phase 8.2: entry classes, derived counts, Phase 8 as a governed historical package, recorded Phase 9 owner reference.', 'PHASE8_2_GOVERNANCE_AMENDMENT.md'],
    ['2026-10-20', 'Phase 8.2 admission correction: permanent-absence checks reframed as historical-scope checks; pre-admission probes made registry-derived; admitted-package manifest binding and package-state model. Phase 8.2 historical result (' + h.result + ') preserved.', 'execution-record/PHASE8_2_ADMISSION_CORRECTION_RECORD.json']]);

docs['PHASE8_2_ADMISSION_CORRECTION_HANDOFF.md'] = '# Phase 8.2 Admission-Correction Handoff\n\n' + HEAD
  + '**This is a narrow correction to Phase 8.2 local governance, not a new phase. Phase 9 has not been admitted or implemented. No registry reservation, file or directory for Phase 9 exists. B-018 remains OPEN. NO_GO_NOT_VERIFIED is unchanged.**\n\n'
  + '## Checks and controls corrected\n\n' + table(['Item', 'Now'], c.corrections.map((x) => [x.item, x.now]))
  + '\n## Results\n\n' + table(['Item', 'Result'], [
    ['Historical Phase 8.2 result', h.result + ' (' + h.by_kind.direct + ' direct, ' + h.by_kind.negative + ' negative, ' + h.by_kind.mutation + ' mutation), mutations ' + h.mutations + ', completed ' + h.completed_at + '; preserved, time-bound'],
    ['Isolated replay of the Phase 8.2 state', h.isolated_replay.result + ' (' + h.isolated_replay.environment + ')'],
    ['Isolated replay of the corrected Phase 8', iso ? iso.result + ' (' + iso.environment + ')' : 'see execution-record'],
    ['Current-composition Phase 8 run', pc ? pc.result + ', verdict `' + pc.verdict + '`' : 'not recorded'],
    ['Six earlier suites, whole worktree', 'registry-derived composition `' + run.composition.verdict + '`, ' + run.composition.conditions.length + ' declared conditions, no undeclared failure'],
    ['Phase 8 suite after correction', suite],
    ['Mutations', mut.killed + ' of ' + mut.total + ' caught by named probes; ' + mut.load_failures + ' load failures; ' + m82c.length + ' added by this correction (MG-86 to MG-98)'],
    ['Registry', 'version ' + reg.registry_version + ', ' + Object.entries(reg.summary).map(([k, v]) => k.replace(/_/g, ' ') + ' ' + v).join(', ') + '; valid and hash-bound'],
    ['Earlier packages', 'byte-identical to their manifests']])
  + '\n## Package-state model\n\n' + table(['State', 'Treatment'], c.package_state_model.map((x) => [x.state, x.treatment]))
  + '\nVerified by direct probes for every state and by a temporary-copy simulation with the real planned Phase 9 entry: ' + c.temporary_copy_simulation.results.map((x) => x.state + ': ' + x.phase8_failures + ' Phase 8 failures').join('; ') + '.\n\n'
  + '## Can Phase 9 now be admitted safely?\n\nYes, as far as local governance can show. With the correction in place, admitting `phase9-human-evidence-adjudication` under `OWNER_WORK_ASSIGNMENT_2026-10-20_PHASE9_HUMAN_ADJUDICATION_LAYER` would create declared composition conditions EC-P4-TOOLS, EC-P6-OWNERSHIP, EC-P7-OWNERSHIP, EC-P7-TOOLS and EC-P8-SCOPE, and no undeclared failure, both before and after Phase 9 files exist. Admission itself remains a separate owner-authorized step and has not been performed.\n\n'
  + 'No release, deployment, independent evaluation, provider use or commercial readiness determination occurred. No commit, push, merge, pull-request action, B-018, tracker, source, branch or public change occurred.\n';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { for (const [k, v] of Object.entries(docs)) writeFileSync(join(P8, k), v.replace(/—/g, ',')); console.log('wrote ' + Object.keys(docs).length + ' admission-correction documents'); }

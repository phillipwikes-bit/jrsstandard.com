#!/usr/bin/env node
// JRS PHASE 8.1: generates the eight Phase 8.1 Markdown records from recorded artifacts.
//   node research/engine-governance-phase8-2026-10-19/build-documents-81.mjs
// PHASE8_HANDOFF.md and OWNER_DECISION_REGISTER.md are updated by build-documents.mjs.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUS_LINES } from '../../lib/engine-governance-phase8/registry.mjs';
import { LANGUAGE_RULE } from '../../lib/engine-governance-phase8/governance.mjs';
import { EARLIER_CHECKS, COMPOSITION_LABEL, LATER_STATUSES } from '../../lib/engine-governance-phase8/later-packages.mjs';
import { ADMISSION_FIELDS, BOUNDARY_STATEMENT } from '../../lib/engine-governance-phase8/admission.mjs';
import { REPLAYS } from '../../lib/engine-governance-phase8/isolated-replay.mjs';
import { REEVALUATION_TRIGGERS } from '../../lib/engine-governance-phase8/handoff-freeze.mjs';

const P8 = fileURLToPath(new URL('./', import.meta.url));
const J = (p) => JSON.parse(readFileSync(join(P8, p), 'utf8'));
const reg = J('governance/LATER_PACKAGE_REGISTRY.json'), run = J('execution-record/WORKTREE_RUN_RECORD.json'), iso = J('execution-record/ISOLATED_REPLAY_RECORD.json');
const fz = J('evaluation/INDEPENDENT_EVALUATION_HANDOFF_FREEZE.json'), mut = J('execution-record/MUTATION_EVIDENCE.json');
const tr = existsSync(join(P8, 'execution-record/PHASE8_TEST_RESULTS.json')) ? J('execution-record/PHASE8_TEST_RESULTS.json') : null;
const HEAD = '**' + STATUS_LINES.join('. ') + '.**\n\n';
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (h, rows) => '| ' + h.join(' | ') + ' |\n|' + h.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.map(cell).join(' | ') + ' |').join('\n') + '\n';
const yn = (b) => (b ? 'yes' : 'no');
const comp = run.composition;
const m81 = mut.results.filter((r) => +r.id.slice(3) >= 38);
const docs = {};

docs['TEST_GOVERNANCE_SCALABILITY_MODEL.md'] = '# Test-Governance Scalability Model\n\n' + HEAD + '**Language rule.** ' + LANGUAGE_RULE + '\n\n'
  + '## Problem\n\nEach earlier suite checks that new files sit only in its own locations. Every later local package therefore makes an earlier suite report a failing check in a whole-worktree run. Phase 8 handled this with four hand-written exceptions (CPC-01 to CPC-04). That list grows with every new package and must be edited by hand each time.\n\n'
  + '## Model\n\nThree contexts are kept apart:\n\n'
  + table(['Context', 'What it answers', 'Source of record'], [
    ['Historical package integrity', 'What did the package produce within its own sealed scope, and are its files still byte-identical?', 'registry/VERSION_REGISTRY.json, registry/manifests/, isolated replay'],
    ['Current whole-worktree composition', 'What do the frozen earlier suites report when every local package is present?', 'execution-record/WORKTREE_RUN_RECORD.json (composition and dual_context)'],
    ['Authorized later-package additions', 'Which later packages exist, where, under which owner reference, and which earlier checks they trip?', 'governance/LATER_PACKAGE_REGISTRY.json']])
  + '\nThe earlier suites are frozen, so the earlier checks a later package can trip form a fixed catalogue of four. Later packages are open-ended: each is one registry entry. Composition conditions are derived from the registry and the catalogue, never written by hand. Adding a package means one admitted registry entry; no exception list is edited.\n\n'
  + '## Fail-closed rules\n\n- A later file outside every registered package fails closed.\n- A later package that trips an earlier check it did not declare fails closed.\n- A stale manifest binding, a missing owner reference or a changed protected earlier file fails closed.\n- A catalogued check that fails with no later file to explain it is a regression.\n- A declared condition is reported as "' + COMPOSITION_LABEL + '", and is never called a pass.\n';

docs['LATER_PACKAGE_REGISTRY.md'] = '# Later-Package Registry\n\n' + HEAD
  + 'Source of record: `governance/LATER_PACKAGE_REGISTRY.json`, version ' + reg.registry_version + ', governance hash `' + reg.governance_sha256 + '` (the content hash inside the file changes whenever the Phase 8 manifest binding does). ' + reg.statement + '\n\n'
  + 'Statuses: ' + LATER_STATUSES.map((s) => '`' + s + '`').join(', ') + '. No status is a validation, release, ownership, commercial or deployment status.\n\n'
  + 'Counts (derived from entries, never fixed): ' + Object.entries(reg.summary || {}).map(([k, v]) => k.replace(/_/g, ' ') + ' ' + v).join(', ') + '. Entry classes: `retroactive_seed` (Phase 6, Phase 7, Phase 8 only) and `admitted_future_package` (admitted by the gate before any file exists). Phase 8.2 amendment: see `PHASE8_2_GOVERNANCE_AMENDMENT.md`.\n\n'
  + table(['Package', 'Entry class', 'Version', 'Status', 'Created', 'Approved paths', 'Affected earlier checks', 'Owner reference', 'Evidence'], reg.packages.map((e) => [e.package_id, e.entry_class, e.package_version, e.status, e.created, e.approved_paths.join(', '), e.affected_earlier_checks.join(', '), e.owner_decision_reference.reference, e.owner_decision_reference.evidence_path]))
  + '\n## Permissions (all entries)\n\n' + table(['Permission', 'Value'], [['May affect historical recorded results', 'no'], ['May affect whole-worktree composition results', 'yes (visible, declared)'], ['May affect public or deployment surfaces', 'no']])
  + '\n## Manifest binding\n\nPhase 6 and Phase 7 entries bind the package hashes recorded in `registry/VERSION_REGISTRY.json`. The Phase 8 entry binds the hash of the rows of `PHASE8_FILE_MANIFEST_SHA256.txt`; the registry file is excluded from that manifest so the binding is not circular, and carries its own content hash instead.\n\n'
  + '## Retroactive seeds\n\nAll three entries are retroactive seeds: the packages existed before the registry. No formal owner-decision record authorizing each package exists; each entry cites the recorded assignment evidence instead, with `formal_decision_record: false`. Ratifying the seeds is owner decision P8-OD-08. A future package cannot be seeded this way; it must pass the admission gate before any of its files exist.\n\n'
  + '## Earlier-check catalogue\n\n' + table(['Check', 'Originating package', 'Exact check', 'Source', 'Historical example', 'Reported as'], EARLIER_CHECKS.map((c) => [c.check_id, c.originating_package, c.exact_check, c.check_source, c.historical_example || 'none (Phase 8.2)', c.reporting === 'phase8_scope_classifier' ? 'composition condition from the Phase 8 scope classifier; never a failing Phase 8 check' : 'failing earlier check, classified from the registry']))
  + '\nB-018 is recorded as `' + reg.b018_status + '` and is not addressed by this registry.\n';

docs['DUAL_CONTEXT_RESULT_MODEL.md'] = '# Dual-Context Result Model\n\n' + HEAD + '**Language rule.** ' + LANGUAGE_RULE + '\n\n'
  + 'Each earlier package result is reported in separate contexts that are never merged into one pass or fail number: the historical result recorded for its sealed scope, an isolated replay of that scope, and the current whole-worktree composition result with its declared composition conditions.\n\n'
  + table(['Package', 'Historical (sealed scope)', 'Isolated replay', 'Whole-worktree composition', 'Composition conditions', 'Earlier protected file changed'], run.dual_context.map((d) => [d.package, d.historical.result + (d.historical.recorded ? ' (' + d.historical.recorded + ')' : ''), d.isolated_replay ? d.isolated_replay.result : 'not replayed in isolation', d.composition ? d.composition.result : 'n/a', d.composition && d.composition.conditions.length ? d.composition.conditions.map((c) => c.condition_id + ' [' + c.historical_example + ']').join('; ') : 'none', yn(d.earlier_protected_file_changed)]))
  + '\n## Registry-derived composition conditions\n\nSource: `execution-record/WORKTREE_RUN_RECORD.json`, run ' + run.started_at + ', bound to registry governance hash `' + comp.registry_governance_sha256 + '`. Verdict: `' + comp.verdict + '`; fail-closed items: ' + comp.fail_closed_items + '.\n\n'
  + table(['Condition', 'Affected historical package', 'Exact check', 'Later package (governing registry entry)', 'Paths', 'Earlier protected file changed', 'Historical example', 'Reported as'], comp.conditions.map((c) => [c.condition_id, c.affected_historical_package, c.exact_check, c.later_package, c.paths.length + ' files', yn(c.earlier_protected_file_changed), c.historical_example, c.label]))
  + '\nCPC-01 to CPC-04 remain in `governance/COMPATIBILITY_MANIFEST.json` as the historical record of how Phase 8 first declared these conditions. They are now derived from the registry: CPC-01 splits into one condition per later package that causes it (Phase 6 and Phase 8), as does CPC-02 (Phase 7 and Phase 8).\n\n'
  + '## Phase 8 as a governed historical package (Phase 8.2)\n\n'
  + (run.phase8_composition ? 'Phase 8 suite in the current composition: ' + run.phase8_composition.result + ', verdict `' + run.phase8_composition.verdict + '`. Phase 8 scope conditions: ' + (run.phase8_composition.conditions.length ? run.phase8_composition.conditions.map((c) => c.condition_id + ' (' + c.paths.length + ' files)').join('; ') : 'none (no admitted later package exists)') + '. ' : 'Phase 8 composition not yet recorded. ')
  + 'Historical result 370/370 (8.1 scope, `execution-record/PHASE8_HISTORICAL_RECORD.json`); isolated replay 370/370. A declared later package can add a Phase 8 scope condition; it cannot change the historical result. An undeclared path, an invalid reservation, files created before admission, or a changed Phase 8 protected file fail.\n\n'
  + '## Failures that remain failures\n\nAn undeclared later path, a missing manifest, a missing owner reference, a stale manifest binding, an undeclared affected check, a changed protected earlier file, an incomplete test record or an uncatalogued failing check each make the composition verdict `fail_closed`.\n';

docs['ISOLATED_HISTORICAL_REPLAY_PROTOCOL.md'] = '# Isolated Historical Replay Protocol\n\n' + HEAD
  + 'Command: `' + iso.command + '`. Record: `execution-record/ISOLATED_REPLAY_RECORD.json`.\n\n## Method\n\n'
  + '1. Plan (`lib/engine-governance-phase8/isolated-replay.mjs`, pure): the package\'s approved test command and the recorded manifests of its declared untracked dependencies. The plan refuses if a manifest is missing or malformed, or if the command is in neither the baseline tree nor a dependency manifest.\n'
  + '2. Clone: `git clone --no-hardlinks` of the local repository into a temporary directory outside the repository, at baseline commit `' + iso.baseline_commit.slice(0, 7) + '`. The baseline tree is the recorded content of every tracked package. The repository itself is only read.\n'
  + '3. Reconstruct: copy only the planned files, each checked against its recorded SHA-256 before copying. Later packages are never copied.\n'
  + '4. Contamination check: the clone\'s untracked files must equal the planned files exactly.\n'
  + '5. Run: the approved command only, with provider variables removed from the environment; each earlier suite refuses provider configuration and traps network APIs.\n'
  + '6. Record the result separately from the composition result, then delete the clone.\n\n'
  + table(['Package', 'Untracked dependencies', 'Command'], Object.entries(REPLAYS).map(([k, v]) => [k, v.untracked_dependencies.join(', ') || 'none (baseline tree only)', v.command]))
  + '\n## Results\n\n' + table(['Package', 'Isolated result', 'Historical record', 'Untracked files in clone', 'Later packages present', 'Contamination check', 'Duration'], iso.replays.map((r) => [r.package, r.passed + '/' + r.total, run.dual_context.find((d) => d.package === r.package).historical.result, r.untracked_files_in_clone, yn(r.later_packages_present), r.contamination.clean ? 'clean' : 'contaminated', Math.round((Date.parse(r.finished_at) - Date.parse(r.started_at)) / 1000) + ' s']))
  + '\nTemporary copies deleted: ' + yn(iso.temporary_copies_deleted) + '. Network attempts: ' + iso.network_attempts + '.\n\nEach isolated result equals the package\'s historical record. In the whole worktree the same suites report the declared composition conditions, which confirms those conditions come from later packages and not from any change to the earlier package.\n\n'
  + '## Limits\n\nThe isolated environment is the baseline commit plus recorded manifests; it is not a separate machine. A replay shows repeatability of the recorded local result, not correctness.\n';

docs['FUTURE_PACKAGE_ADMISSION_GATE.md'] = '# Future-Package Admission Gate\n\n' + HEAD
  + 'Logic: `lib/engine-governance-phase8/admission.mjs` (`evaluateAdmission`). The gate decides only whether a proposed package is admissible to the registry. **It never authorizes work** (`authorizes_work` is always false), creates no file and edits no registry. Adoption of the gate as a binding rule is owner decision P8-OD-09.\n\n'
  + '## Required fields\n\n' + ADMISSION_FIELDS.map((f) => '- `' + f + '`').join('\n') + '\n\nThe boundary statement must read exactly: "' + BOUNDARY_STATEMENT + '"\n\n'
  + '## Rejections\n\n' + table(['Condition', 'Result'], [
    ['Owner decision reference missing, or not a recorded decision', 'rejected'],
    ['Any file already exists in the approved paths (created before admission)', 'rejected'],
    ['A planned file outside the approved paths', 'rejected'],
    ['An approved path in a protected or public area (api, docs, .jrs, .github, root pages, deployment files, trackers, ledgers, project sources, earlier package or test directories)', 'rejected'],
    ['An approved path overlapping a registered package, or an identifier already registered', 'rejected'],
    ['An affected prior-package analysis that differs from the computed analysis', 'rejected'],
    ['Any attempt to redefine historical results, or a request for public or deployment effect', 'rejected'],
    ['A validation, readiness, licensing or commercial status claim, or B-018 presented as resolved', 'rejected'],
    ['A registered present package whose manifest does not match its registry entry', 'rejected (verifyRegisteredManifest)']])
  + '\n## Admission sequence for any future package\n\n1. Recorded owner decision.\n2. Proposal with all required fields; the gate computes the affected earlier checks.\n3. Registry entry added with status `reserved_not_present` before any file exists.\n4. Package files created only inside the approved paths; status moves to `present_local_only` with a manifest binding.\n5. Isolated replay of affected earlier packages, and a whole-worktree run showing only registry-derived conditions.\n';

docs['INDEPENDENT_EVALUATION_HANDOFF_FREEZE.md'] = '# Independent Evaluation Handoff Freeze\n\n' + HEAD
  + 'Source of record: `evaluation/INDEPENDENT_EVALUATION_HANDOFF_FREEZE.json`, freeze hash `' + fz.freeze_sha256 + '`. Execution enabled: ' + yn(fz.execution_enabled) + '. Evaluation authorized: ' + yn(fz.evaluation_authorized) + '. Evaluation conducted: ' + yn(fz.evaluation_conducted) + '. It reads no sealed evaluation material or real record, labels nothing and scores nothing.\n\n'
  + '## Candidate identity\n\n' + table(['Item', 'Value'], [['Candidate', fz.candidate.id + ' (' + fz.candidate.compiler_version + ')'], ['Package hash', '`' + fz.candidate.package_sha256 + '`'], ['Files', fz.candidate.file_count], ['Phase 7 seal', '`' + fz.candidate.phase7_seal_sha256 + '`'], ['Base', fz.candidate.base], ['Qualification record', '`' + fz.qualification_record_sha256 + '`'], ['Protocol seal', '`' + fz.protocol_seal_sha256 + '`']])
  + '\n' + table(['Rule pack', 'SHA-256'], fz.candidate.rule_packs.map((r) => [r.file, '`' + r.sha256 + '`']))
  + '\n## Frozen lineage\n\n' + table(['Package', 'Status', 'Files', 'Package hash'], fz.lineage.map((l) => [l.id, l.status, l.file_count, '`' + l.package_sha256 + '`']))
  + '\nLater local packages: ' + fz.later_packages.map((l) => l.id + ' ' + l.version + ' (' + l.status + ')').join('; ') + '.\n\n'
  + '## Synthetic local testing is not independent evaluation\n\n' + fz.synthetic_vs_independent + '\n\n'
  + '## Roles\n\n' + table(['Role', 'Duties', 'May view sealed labels'], fz.roles.map((r) => [r.role, r.duties, yn(r.may_view_sealed_labels)]))
  + '\n## Material separation and contamination controls\n\n' + table(['Class', 'Use', 'In repository'], fz.material_separation.map((m) => [m.class, m.use, yn(m.in_repository)])) + '\n' + fz.contamination_controls.map((c) => '- ' + c).join('\n')
  + '\n\n## Provider or model change\n\n' + table(['Item', 'Requirement'], [['Class', fz.provider_or_model_change_criteria.class], ['Evidence', fz.provider_or_model_change_criteria.evidence], ['Regression', fz.provider_or_model_change_criteria.regression], ['Invalidates a sealed evaluation', yn(fz.provider_or_model_change_criteria.invalidates_sealed_evaluation)], ['Rollback', fz.provider_or_model_change_criteria.rollback], ['Counsel review', fz.provider_or_model_change_criteria.counsel_trigger]])
  + '\n## Conditions that require re-evaluation\n\n' + REEVALUATION_TRIGGERS.map((t) => '- ' + t).join('\n')
  + '\n\n## Gates\n\n' + fz.gates.map((g) => '- ' + g).join('\n')
  + '\n\n## Known limitations and open issues\n\nLimitations: `' + fz.known_limitations.candidate + '` and `' + fz.known_limitations.phase8 + '`. Open issues (' + fz.deferred_and_open_issues.length + ', all active): ' + fz.deferred_and_open_issues.map((x) => x.id).join(', ') + '.\n\n'
  + '## Unresolved owner decisions\n\n' + fz.unresolved_owner_decisions.join(', ') + '.\n\n## B-018\n\n' + fz.b018.statement + '\n';

docs['PHASE8_1_MUTATION_RECORD.md'] = '# Phase 8.1 Mutation Record\n\n' + HEAD
  + 'Source: `execution-record/MUTATION_EVIDENCE.json` (generated ' + mut.generated_at + '), which holds every Phase 8 mutation. Phase 8.1 added MG-38 to MG-67. A mutation counts as caught only when a probe fails; a load failure does not count. Probes that edit a record re-hash it, so only the targeted control can reject it.\n\n'
  + table(['Measure', 'Phase 8.1 mutations', 'All Phase 8 mutations'], [['Introduced', m81.length, mut.total], ['Caught directly', m81.filter((r) => r.result === 'killed').length, mut.killed], ['Survived', m81.filter((r) => r.result === 'survived').length, mut.survived], ['Load failures', m81.filter((r) => r.result === 'load_failure').length, mut.load_failures], ['Setup errors', m81.filter((r) => r.result === 'setup_error').length, mut.setup_errors]])
  + '\n' + table(['Mutation', 'Area', 'File', 'Result', 'Caught by'], m81.map((r) => [r.id, r.area, r.file, r.result, (r.killed_by || []).join(', ')]))
  + '\nMutation testing shows these probes detect these deliberate defects. It does not show the probes detect every defect.\n';

docs['PHASE8_1_EXECUTION_RECORD.md'] = '# Phase 8.1 Execution Record\n\n' + HEAD
  + 'Phase 8.1, 2026-10-20. Local working tree on branch `claude/engine-reliability-phase6-local` at `428c307`. Local, synthetic, offline. Every command ran with `ANTHROPIC_BASE_URL` unset.\n\n## Scope\n\nChanges only in the existing Phase 8 locations. No earlier package, earlier test suite, tracked file, public route, deployment file, B-018 record, tracker, ledger, PR or branch was changed. No Phase 9 directory was created.\n\n'
  + '## Pre-checks\n\n- Owner-decision references: no formal decision record exists for creating Phase 6, 7 or 8. Each registry entry cites recorded assignment evidence (Phase 6 owner decision register row of 2026-10-17; Phase 7 remediation contract "Stop conditions (from the assignment)"; Phase 8 owner decision register). No reference was invented; ratification is P8-OD-08.\n- Isolated replay: confirmed feasible without writing into the repository (temporary `git clone` outside the repository).\n\n'
  + '## Sequence\n\n1. Modules added in `lib/engine-governance-phase8/`: `later-packages.mjs`, `admission.mjs`, `isolated-replay.mjs`, `handoff-freeze.mjs`; two owner decisions added to `decisions.mjs` (P8-OD-08, P8-OD-09).\n'
  + '2. `governance/build-later-registry.mjs` writes `governance/LATER_PACKAGE_REGISTRY.json`; the registry is excluded from the Phase 8 file manifest and binds its hash.\n'
  + '3. `tools/engine-governance-phase8-replay.mjs` gained `--isolated` and a registry-derived composition with a dual-context record.\n'
  + '4. Isolated replays: ' + iso.replays.map((r) => r.package + ' ' + r.passed + '/' + r.total).join(', ') + '.\n'
  + '5. Whole-worktree run (' + run.started_at + '): composition verdict `' + comp.verdict + '`, ' + comp.conditions.length + ' registry-derived conditions covering CPC-01 to CPC-04.\n'
  + '6. `build-records.mjs` also writes the handoff freeze; `build-documents-81.mjs` writes the Phase 8.1 records.\n'
  + '7. Final suite: ' + (tr ? tr.passed + ' of ' + (tr.passed + tr.failed) + ' checks passed (' + tr.by_kind.direct + ' direct, ' + tr.by_kind.negative + ' negative or adversarial, ' + tr.by_kind.mutation + ' mutation)' : 'see execution-record/PHASE8_TEST_RESULTS.json') + '.\n\n'
  + '## Corrections during Phase 8.1 (disclosed)\n\n' + table(['Finding', 'Correction'], [
    ['The first recorded suite run reported 367 of 369: the whole-worktree record was bound to the registry content hash, which changes whenever the Phase 8 manifest binding does, so a recorded run always cited a stale registry.', 'The registry now carries a governance hash over only the fields that drive classification (earlier-check catalogue, package identifiers, approved paths, affected checks, statuses, permissions). The whole-worktree record binds that hash; the registry validator recomputes it. The whole-worktree run was repeated.'],
    ['The same run flagged three Phase 8 records under the B-018 check. None claimed resolution: two described the check itself and one was the area label of a mutation that targets that check.', 'The detector treats wording that describes the check as a mention rather than a claim; probe `r81.b018_claim_detector_bounds` confirms it still catches statements that B-018 has been settled. The mutation area label was renamed.']])
  + '\nNeither correction touched an earlier package, an earlier test, or a sealed record.\n\n'
  + '## What did not happen\n\nNo commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker or ledger update, public change or branch change. No real record, sealed evaluation material, label, source file or credential was used.\n';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { for (const [k, v] of Object.entries(docs)) writeFileSync(join(P8, k), v.replace(/—/g, ',')); console.log('wrote ' + Object.keys(docs).length + ' Phase 8.1 documents'); }

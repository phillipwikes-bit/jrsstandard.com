#!/usr/bin/env node
// JRS PHASE 8: generates the eleven Phase 8 Markdown records from recorded Phase 8 artifacts.
//   node research/engine-governance-phase8-2026-10-19/build-documents.mjs
// Counts are read from records, never typed. PHASE8_FILE_MANIFEST_SHA256.txt is written by build-manifest.mjs.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGE_RULE } from '../../lib/engine-governance-phase8/governance.mjs';
import { STATUS_LINES } from '../../lib/engine-governance-phase8/registry.mjs';

const P8 = fileURLToPath(new URL('./', import.meta.url));
const J = (p) => JSON.parse(readFileSync(join(P8, p), 'utf8'));
const reg = J('registry/VERSION_REGISTRY.json'), cm = J('governance/COMPATIBILITY_MANIFEST.json'), run = J('execution-record/WORKTREE_RUN_RECORD.json');
const q = J('qualification/CANDIDATE_QUALIFICATION_RECORD.json'), pr = J('evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json'), ch = J('change-model/CHANGE_IMPACT_MODEL.json');
const od = J('decisions/OWNER_DECISIONS.json'), mut = J('execution-record/MUTATION_EVIDENCE.json'), rep = J('execution-record/POST_STOP_REPAIR_RECORD.json');
const tr = existsSync(join(P8, 'execution-record/PHASE8_TEST_RESULTS.json')) ? J('execution-record/PHASE8_TEST_RESULTS.json') : null;

const HEAD = '**' + STATUS_LINES.join('. ') + '.**\n\n';
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (h, rows) => '| ' + h.join(' | ') + ' |\n|' + h.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.map(cell).join(' | ') + ' |').join('\n') + '\n';
const yn = (b) => (b ? 'yes' : 'no');
const cls = run.classification;
const recRes = (id) => reg.packages.find((p) => p.id === id).latest_recorded_result;
const wt = (id) => (run.suites[id] ? run.suites[id].passed + '/' + run.suites[id].total : 'no suite');
const conds = (id) => (cls.suites[id] ? cls.suites[id].conditions.join(', ') : '') || 'none';
const suiteLine = tr ? tr.passed + ' of ' + (tr.passed + tr.failed) + ' checks passed (' + tr.by_kind.direct + ' direct, ' + tr.by_kind.negative + ' negative or adversarial, ' + tr.by_kind.mutation + ' mutation)' : 'see execution-record/PHASE8_TEST_RESULTS.json';
const docs = {};

const resultsTable = table(['Package', 'Historically recorded result (sealed package scope)', 'Recorded', 'Whole-worktree result (' + run.started_at.slice(0, 10) + ')', 'Declared conditions visible'],
  reg.packages.map((p) => [p.id, p.latest_recorded_result.result, p.latest_recorded_result.date || 'n/a', wt(p.id), p.id === 'v1-historical' ? 'n/a' : conds(p.id)]));

docs['VERSION_REGISTRY.md'] = '# Version Registry\n\n' + HEAD
  + 'Source of record: `registry/VERSION_REGISTRY.json` and one `sha256sum`-format manifest per package in `registry/manifests/`. Recorded ' + reg.recorded_at + ' at baseline commit `' + reg.baseline_commit.slice(0, 7) + '`, before any Phase 8 code existed. ' + reg.statement + '\n\n'
  + 'The manifests were written once and are never overwritten: `registry/build-registry.mjs` rebuilds them in memory and fails closed on any difference. A replay fails closed if a protected earlier package changes.\n\n'
  + table(['Package', 'Status', 'Owner review eligible', 'Files', 'Package SHA-256', 'Source paths'], reg.packages.map((p) => [p.id, p.status, yn(p.eligible_for_future_owner_review), p.file_count, '`' + p.package_sha256 + '`', p.source_paths.join(', ')]))
  + '\nThe package hash is the SHA-256 of the manifest text (one line per file: file SHA-256, two spaces, path; sorted by path). "Frozen" means fixed in git history at the baseline commit; it is not a quality statement.\n\n'
  + '## Test commands, recorded results and limitations\n\n' + table(['Package', 'Test command', 'Latest recorded result', 'Source', 'Known limitations'], reg.packages.map((p) => [p.id, '`' + p.test_command + '`', p.latest_recorded_result.result, p.latest_recorded_result.source, p.known_limitations]))
  + '\n## v1 historical reference\n\nThe frozen v1 handler is the git object `' + reg.packages[0].git_object.commit.slice(0, 7) + ':' + reg.packages[0].git_object.path + '` (blob `' + reg.packages[0].git_object.blob.slice(0, 12) + '`). Its content SHA-256 `' + reg.packages[0].git_object_content_sha256 + '` equals the in-repository copy in the v0.2 package. The public v1 route now returns a refusal-only response.\n\n'
  + '## Phase 7 manifest\n\nPhase 7 kept no complete file manifest of its own. The Phase 8 manifest covers all ' + reg.packages[6].file_count + ' Phase 7 files with SHA-256 and reproduces byte-for-byte on rebuild. Corroboration: the Phase 7 seal verifies (' + yn(reg.phase7_corroboration.seal_verifies) + '); the latest Phase 7 file modification is ' + reg.phase7_corroboration.latest_modification + ', before the final-handoff bound ' + reg.phase7_corroboration.final_handoff_write_bound + '. The Phase 6 manifest equals the snapshot Phase 7 took at its start.\n';

docs['CROSS_PACKAGE_TEST_GOVERNANCE.md'] = '# Cross-Package Test Governance\n\n' + HEAD + '**Language rule.** ' + LANGUAGE_RULE + '\n\n'
  + 'Each earlier suite checks that new files sit only in its own locations. Later packages add files elsewhere by design, so a whole-worktree run of an earlier suite reports those checks as failing. Phase 8 does not edit, skip, patch or weaken any earlier check. It declares each such condition in `governance/COMPATIBILITY_MANIFEST.json` (defined before any Phase 8 code), recomputes independently which later files trip each check, and classifies every failing check. A declared condition is never called a pass.\n\n'
  + '## Classes\n\n' + table(['Class', 'Meaning', 'Effect'], [
    ['declared_compatibility_condition', 'A failing check named in the manifest, tripped only by files of a registered later package inside the declared paths, with the protected earlier files unchanged', 'Visible; does not fail closed'],
    ['genuine_regression', 'A failing check not in the manifest and not about file location, or a declared check failing with no later file tripping it', 'Fail closed'],
    ['unexplained_conflict', 'A file-location check not in the manifest, or a declared check tripped by a file outside its declared paths', 'Fail closed'],
    ['missing_package', 'A registered package has no manifest or no verification result', 'Fail closed'],
    ['changed_protected_file', 'A protected file differs from, is missing from, or is added to its recorded manifest', 'Fail closed'],
    ['incomplete_test_record', 'A suite has no run record, or its counts, failed-check list or output hash are missing or inconsistent', 'Fail closed'],
    ['package_outside_registry', 'An untracked file belongs to no registered package', 'Fail closed'],
    ['condition_description_inconsistent', 'The manifest entry is incomplete or contradictory, or later files exist but the declared check did not report them', 'Fail closed'],
    ['unsupported_pass_claim', 'An earlier package described as passed without its recorded result or a complete fresh run', 'Refused']])
  + '\n## Declared conditions\n\n' + cm.conditions.map((c) => '### ' + c.condition_id + ': ' + c.name + '\n\n' + table(['Field', 'Value'], [
    ['Originating suite and exact check', '`' + c.originating_suite + '`: "' + c.exact_check + '" (' + c.check_source + ')'],
    ['Triggering later files or paths', c.triggering_paths.map((t) => t.path + ' (' + t.later_package + ', ' + t.cause.replace(/_/g, ' ') + ')').join('; ')],
    ['Protected earlier packages confirmed unchanged', c.protected_packages_confirmed_unchanged.join(', ') + ' (byte-identical to their manifests before and after the whole-worktree run)'],
    ['First observed', c.first_observed.map((o) => o.date + ' (' + o.cause.replace(/_/g, ' ') + ', ' + o.record + ')').join('; ')],
    ['Meaning', c.meaning], ['Why visible, and why the earlier recorded result is not rewritten', c.why_visible_not_rewritten], ['Owner decision before any redesign', c.owner_decision_before_redesign]])).join('\n')
  + '\n## Whole-worktree run\n\n`' + run.command + '`, ' + run.started_at + ' to ' + run.finished_at + '. Verdict: `' + cls.verdict + '`; fail-closed items: ' + cls.fail_closed_items + '. Packages unchanged by the run: ' + yn(run.packages_unchanged_by_run) + '. Network attempts: ' + run.network_attempts + '.\n\n' + resultsTable
  + '\nEvery earlier result is reported twice: as historically recorded for its sealed package scope, and as observed in the later whole-worktree run. The second does not replace the first.\n';

const comp = q.components;
docs['CANDIDATE_QUALIFICATION_RECORD.md'] = '# Candidate Qualification Record\n\n' + HEAD
  + 'Source of record: `qualification/CANDIDATE_QUALIFICATION_RECORD.json` (record hash `' + q.record_sha256 + '`). Candidate: ' + q.candidate + '. Base: ' + q.base + '.\n\n'
  + '**Kind of evidence: local engineering check.** ' + q.statement + ' Not established: ' + q.not_established.join('; ') + '.\n\n'
  + 'Each component copies recorded Phase 7 values. Its source file is named with a SHA-256 that equals the Phase 7 manifest. No score, percentage or grade is calculated.\n\n'
  + table(['Component', 'Recorded values', 'Source'], [
    ['Differential (existing inputs)', comp.differential.existing_inputs + ' inputs: ' + Object.entries(comp.differential.existing_counts).map(([k, v]) => k + ' ' + v).join(', '), comp.differential.source.path],
    ['Differential (Phase 7 scenarios)', comp.differential.phase7_scenarios + ' scenarios: ' + Object.entries(comp.differential.phase7_counts).map(([k, v]) => k + ' ' + v).join(', '), comp.differential.source.path],
    ['Sealed scenarios', comp.sealed_scenarios.total + ': ' + Object.entries(comp.sealed_scenarios.counts).map(([k, v]) => k + ' ' + v).join(', '), comp.sealed_scenarios.source.path],
    ['Stability transforms', comp.stability_transforms.total + ' total, ' + comp.stability_transforms.as_expected + ' as expected; ' + comp.stability_transforms.invariant_total + ' invariant, ' + comp.stability_transforms.invariant_non_favorable_base + ' of them from non-favourable bases', comp.stability_transforms.source.path],
    ['Mutation', comp.mutation.total + ' introduced, ' + comp.mutation.killed + ' killed directly, ' + comp.mutation.survived + ' survived, ' + comp.mutation.load_failures + ' load failures', comp.mutation.source.path],
    ['Determinism', comp.determinism.passes + ' runs, ' + comp.determinism.distinct_hashes + ' distinct hash (' + comp.determinism.hash + ')', comp.determinism.source.path],
    ['Over-refusal', comp.over_refusal.rows.map((r) => r.rule_id + ' benign ' + r.benign_cases_refused_or_degraded + ' of ' + r.benign_cases).join('; '), comp.over_refusal.source.path],
    ['Phase 7 suite (time-bound)', comp.phase7_suite.passed + ' passed, ' + comp.phase7_suite.failed + ' failed at ' + comp.phase7_suite.recorded_at, comp.phase7_suite.source.path],
    ['Phase 6 library on the candidate', Object.entries(comp.phase6_library_on_candidate.counts).map(([k, v]) => k + ' ' + v).join(', '), comp.phase6_library_on_candidate.source.path],
    ['Known limitations', 'by reference', comp.known_limitations.source.path], ['Owner decisions', 'by reference', comp.owner_decisions.source.path]])
  + '\n## Open issues\n\nEvery issue stays active until an owner decision or a separately authorized remediation record exists. Backlog entries marked "included" stay active because each still carries an owner decision.\n\n'
  + table(['Issue', 'Reference', 'Recorded decision', 'Status'], q.open_issues.map((i) => [i.issue_id, i.ref, i.recorded_decision || 'open question', i.status]));

docs['INDEPENDENT_EVALUATION_PROTOCOL.md'] = '# Independent Evaluation Protocol (execution-disabled)\n\n' + HEAD
  + 'Source of record: `evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json`, protocol ' + pr.protocol_id + ', seal `' + pr.seal_sha256 + '`. Execution enabled: ' + yn(pr.execution_enabled) + '. Authorization: ' + pr.authorization + '. Conducted: ' + yn(pr.conducted) + '. `executeProtocol()` always refuses.\n\n'
  + 'This protocol generates no material, recruits no one, contacts no one, reads no record and reaches no external system. It exists so that a future evaluation, if the owner authorizes one, does not have to be designed from scratch.\n\n'
  + '## Candidate under evaluation\n\n' + pr.candidate_under_evaluation.id + ' (' + pr.candidate_under_evaluation.compiler_version + '), base ' + pr.candidate_under_evaluation.base + '. ' + pr.candidate_under_evaluation.identity_rule + '\n\n'
  + '## Questions\n\n' + table(['Id', 'Area', 'Question'], pr.questions.map((x) => [x.id, x.area, x.question]))
  + '\n## Roles\n\n' + table(['Role', 'Duties', 'May view sealed labels', 'Must be independent of'], pr.roles.map((r) => [r.role, r.duties, yn(r.may_view_sealed_labels), (r.must_be_independent_of || []).join(', ') || 'n/a']))
  + '\n' + pr.separation_rules.map((s) => '- ' + s).join('\n') + '\n\n## Materials\n\n' + table(['Class', 'Use', 'In repository', 'Developer access'], pr.materials.map((m) => [m.class, m.use, yn(m.in_repository), m.developer_access === false ? 'no' : m.class === 'real_records' ? 'prohibited by default' : 'yes']))
  + '\n## Blinding and contamination controls\n\n' + pr.blinding_and_contamination.map((s) => '- ' + s).join('\n') + '\n\n## Measures\n\nDefined in `EVALUATION_MEASUREMENT_DICTIONARY.md`. None is calculated in this package.\n\n'
  + '## Stop conditions\n\n' + pr.stop_conditions.map((s) => '- ' + s).join('\n') + '\n\n## Decision gates\n\n' + table(['Gate', 'Name', 'Requires'], pr.gates.map((g) => [g.gate, g.name, g.requires]))
  + '\nAny change to the protocol is an `evaluation-protocol change` under the change-impact model: a new seal, and invalidation of any earlier freeze.\n';

docs['EVALUATION_MEASUREMENT_DICTIONARY.md'] = '# Evaluation Measurement Dictionary\n\n' + HEAD
  + 'Definitions only. No measure has been calculated, estimated or observed, and no figure here describes the Engine. Measures are calculated only at Gate E of an authorized evaluation, on sealed evaluation material, after adjudication.\n\n'
  + table(['Id', 'Measure', 'Definition', 'Unit', 'Calculated'], pr.measures.map((m) => [m.id, m.name, m.definition, m.unit, yn(m.calculated)]))
  + '\n## Conventions to fix at protocol freeze (Gate B)\n\n- Unit of analysis for each measure (quotation, condition, record).\n- The chance-corrected agreement statistic for M6.\n- How abstention (review_required, not_assessed) enters M3 and M4.\n- Confidence-interval method and minimum sample sizes.\n- Treatment of records refused at intake in each denominator.\n';

docs['CHANGE_IMPACT_AND_ROLLBACK_MODEL.md'] = '# Change Impact and Rollback Model\n\n' + HEAD + '**Conservative rule.** ' + ch.conservative_rule + '\n\n'
  + 'Source of record: `change-model/CHANGE_IMPACT_MODEL.json`; logic in `lib/engine-governance-phase8/change-impact.mjs`. A proposal declares a class; the model raises it to the strictest class implied by the sensitive surfaces it names (' + ch.sensitive_surfaces.join(', ') + ') and by the paths it touches. A change that touches any sensitive surface is never documentation-only or test-only. Adoption of this model as binding is owner decision P8-OD-06.\n\n'
  + table(['Class', 'Required evidence', 'Regression scope', 'New candidate version', 'Invalidates a sealed evaluation', 'Rollback', 'Owner decision', 'Counsel-review trigger'],
    ch.classes.map((c) => [c.id, c.evidence, c.regression, yn(c.new_candidate_version), yn(c.invalidates_sealed_evaluation), c.rollback, yn(c.owner_decision), c.counsel_trigger]))
  + '\nA model or provider change additionally requires an evaluation review before any statement about behaviour. Model identifiers are versioned infrastructure with a documented default and review date, not part of the JRS method.\n';

docs['KNOWN_LIMITATIONS_AND_OPEN_ISSUES.md'] = '# Known Limitations and Open Issues\n\n' + HEAD
  + '## Limitations of Phase 8\n\n'
  + '- The registry and manifests prove byte identity, not correctness. A file can be unchanged and still wrong.\n'
  + '- The Phase 7 manifest was first made in Phase 8. Its link to the Phase 7 handoff rests on the Phase 7 seal and file modification times, not on a manifest Phase 7 wrote itself.\n'
  + '- The governance layer re-implements the earlier file-location checks from their source. If an earlier check were changed, the re-implementation would no longer match; the suite then reports the condition as inconsistent rather than guessing.\n'
  + '- The whole-worktree run reflects the files present at the time of the run. A later file under a declared location would be absorbed into an existing condition; a file elsewhere fails closed.\n'
  + '- The claim guard is lexical. It catches listed phrasings, negated forms aside, and can miss a claim worded differently.\n'
  + '- The harness scanners are static and lexical. They do not detect a module name assembled at run time (for example `import(\'node:\' + x)`), `eval` or `Function` constructors, or computed access on a value received from another module. The process scanner covers only `lib/engine-governance-phase8/`; the replay tool is the one Phase 8 component that starts processes (the earlier suites), by design.\n'
  + '- The evaluation protocol is a draft for owner review. It has not been reviewed by counsel or by any prospective evaluator.\n'
  + '- The change-impact model is not binding until adopted (P8-OD-06). Its path patterns are a floor, not a complete map of impact.\n'
  + '- All checks are local engineering checks on synthetic material by the team that built them. Nothing here is an independent evaluation.\n\n'
  + '## Carried limitations\n\nThe v0.3.1 candidate limitations stand as recorded in `research/engine-remediation-phase7-2026-10-19/KNOWN_LIMITATIONS.md`. Earlier package limitations are listed in `VERSION_REGISTRY.md`.\n\n'
  + '## Open issues (all active)\n\n' + table(['Issue', 'Reference', 'Recorded decision'], q.open_issues.map((i) => [i.issue_id, i.ref, i.recorded_decision || 'open question']))
  + '\nDeclared compatibility conditions CPC-01 to CPC-04 remain open pending P8-OD-02. B-018 remains OPEN.\n';

docs['OWNER_DECISION_REGISTER.md'] = '# Owner Decision Register\n\n' + HEAD + od.statement + ' Source: `decisions/OWNER_DECISIONS.json`.\n\n## Phase 8 decisions\n\n'
  + table(['Decision', 'Question', 'Basis', 'Blocks', 'Carries', 'Status'], od.decisions.map((d) => [d.id, d.question, d.basis, d.blocks, d.carries.join(', ') || 'none', d.status]))
  + '\n## Phase 7 decisions carried (still open)\n\n' + table(['Decision', 'Question', 'Status'], od.phase7_decisions_carried.map((d) => [d.id, d.question, d.status]))
  + '\n## Recorded owner authorizations\n\n' + table(['Reference', 'Status', 'Scope', 'Not authorized', 'Reservation created'], (od.owner_authorizations || []).map((a) => [a.id, a.status, 'local package construction only', Object.entries(a.scope).filter(([k, v]) => v === false).map(([k]) => k.replace(/_/g, ' ')).join(', '), a.reservation_created ? 'yes' : 'no']))
  + '\nRecording an authorization creates no registry reservation. A future package still has to pass the admission gate before any of its files exist.\n'
  + '\n## Decisions taken during Phase 8\n\n' + table(['Date', 'Decision', 'Record'], [
    ['2026-10-19', 'Proceed with Phase 8 as specified, including the tools/ replay path; declare four compatibility conditions (CPC-01 to CPC-04) in a manifest defined before Phase 8 code; never label them a pass.', 'governance/COMPATIBILITY_MANIFEST.json'],
    ['2026-10-19', 'After MG-14 survived, repair three qualification probes to re-hash and assert specific reasons; rerun the full mutation group.', 'execution-record/POST_STOP_REPAIR_RECORD.json'],
    ['2026-10-19', 'After the read-only audit finding, rebuild the process-execution and provider safeguards in the test harness and correct the records.', 'execution-record/AUDIT_REMEDIATION_RECORD.json'],
    ['2026-10-20', 'Phase 8.2 governance amendment: generalize registry membership, add Phase 8 as a governed historical package, classify Phase 8 scope from the registry, record the Phase 9 owner reference (no reservation, no Phase 9 file).', 'PHASE8_2_EXECUTION_RECORD.md'],
    ['2026-10-20', 'Phase 8.1 governance repair: replace the finite compatibility list with a later-package registry, dual-context results, isolated historical replay, a future-package admission gate and an execution-disabled evaluation handoff freeze, inside the existing Phase 8 locations.', 'PHASE8_1_EXECUTION_RECORD.md']]);

docs['MUTATION_TEST_RECORD.md'] = '# Mutation Test Record\n\n' + HEAD
  + 'Source: `execution-record/MUTATION_EVIDENCE.json` (' + mut.generated_at + '). Each mutation is an exact, once-only replacement in a temporary copy of `lib/engine-governance-phase8/`; the mutated modules are imported and all ' + mut.probes + ' probes run. A mutation counts as caught only when a probe fails. A load failure does not count.\n\n'
  + table(['Measure', 'Value'], [['Mutations', mut.total], ['Caught by a direct probe', mut.killed], ['Survived', mut.survived], ['Load failures', mut.load_failures], ['Setup errors', mut.setup_errors]])
  + '\n## History (disclosed)\n\n1. First full run: 24 of 25 caught. MG-14 survived because `neg.local_tests_as_independent_rejected` kept a stale record hash, so validation rejected the record for the hash mismatch whether or not the targeted control existed. Work stopped and was reported without repair.\n'
  + '2. On owner authorization three qualification probes were repaired to re-hash after their deliberate edit and to assert their specific rejection reason with no hash mismatch present (' + rep.repaired_probes.map((x) => x.probe).join(', ') + '). The implementation was not changed.\n3. Rerun after that repair: 25 of 25 caught directly. No mutation was caught only through an unrelated hash mismatch. An earlier version of this record cited the mutation evidence generated at 2026-10-19T15:22:36.141Z. That instance was superseded by an equivalent final-run record generated at 2026-10-19T15:23:13.477Z with identical counts; the read-only audit identified the stale citation.\n'
  + '4. The read-only audit found that the harness correction had weakened the process-execution check (item below and `EXECUTION_RECORD.md`). On owner authorization the scanners were rebuilt in `tests/engine-governance-phase8/harness-scan.mjs` and twelve harness mutations (MG-26 to MG-37) were added. In their first run, three (MG-33, MG-34, MG-36) failed to load because their replacement text left an unbalanced parenthesis; none survived. Their definitions were corrected and the full group rerun.\n'
  + '5. This record cites the evidence instance present: ' + mut.killed + ' of ' + mut.total + ' caught directly, ' + mut.load_failures + ' load failures, generated ' + mut.generated_at + '.\n\n'
  + '## Results\n\n' + table(['Mutation', 'Area', 'File', 'Result', 'Caught by'], mut.results.map((r) => [r.id, r.area, r.file, r.result, (r.killed_by || []).join(', ')]))
  + '\nMutation testing shows these probes detect these deliberate defects. It does not show the probes detect every defect.\n';

docs['EXECUTION_RECORD.md'] = '# Execution Record\n\n' + HEAD
  + 'Phase 8, 2026-10-19. Local working tree on branch `claude/engine-reliability-phase6-local` at `428c307` (PR #40 head, frozen). ' + rep.execution_mode + '. Every command ran with `ANTHROPIC_BASE_URL` unset; every suite refuses provider configuration and traps network APIs.\n\n## Sequence\n\n'
  + '1. **Stop before writing.** The new Phase 8 files would trip two Phase 7 checks and extend the two known conditions. Reported before any file was created; the owner chose to proceed and declare four conditions.\n'
  + '2. **Compatibility manifest first.** `governance/COMPATIBILITY_MANIFEST.json` was written before any Phase 8 code.\n'
  + '3. **Registry.** `registry/build-registry.mjs` recorded manifests for the seven earlier packages (Phase 7: ' + reg.packages[6].file_count + ' files), verified reproducibility within the run and again with `--verify`, verified the Phase 7 seal, and confirmed the Phase 6 manifest equals the Phase 7 start snapshot.\n'
  + '4. **Governance, records, protocol, change model, decisions.** Modules in `lib/engine-governance-phase8/`; records written by `build-records.mjs`.\n'
  + '5. **Whole-worktree runs.** `tools/engine-governance-phase8-replay.mjs --record` ran the six earlier suites unchanged, twice: once while Phase 8 was partly built, and finally after every Phase 8 location existed (' + run.started_at + '). Both showed exactly CPC-01 to CPC-04.\n'
  + '6. **Mutation stop and repair.** See `MUTATION_TEST_RECORD.md` and `execution-record/POST_STOP_REPAIR_RECORD.json`.\n'
  + '7. **Documents and manifest.** `build-documents.mjs` and `build-manifest.mjs`.\n8. **Final suite.** `node tests/engine-governance-phase8/run.mjs --record`: ' + suiteLine + '.\n\n'
  + '## Corrections before the mutation stop (disclosed)\n\n' + table(['Change', 'Why'], [
    ['Qualification field guard narrowed to whole key segments', 'The first pattern matched "degraded" inside a recorded Phase 7 field name; caught when the records were first built.'],
    ['Change-model evidence path pattern narrowed', 'It matched "evidence" in the candidate directory name, so a rule-pack path escalated past the rule-pack class; caught by a probe in a trial run.'],
    ['Claim guard treats negation inside the matched phrase', '"Local tests do not establish" was flagged; caught by a probe in a trial run.']])
  + '\nThese were made before the first mutation run. None touched an earlier package.\n\n## Correction after the authorized probe repair (disclosed)\n\n'
  + 'The first full suite run after the mutation group passed reported 195 of 197. Both failures were false positives in two suite checks, not implementation defects: the provider-identifier check matched its own pattern text in the suite file, and the no-execution check matched ordinary regular-expression `.exec(` calls. Both checks were corrected in `tests/engine-governance-phase8/run.mjs` only (`execution-record/HARNESS_CORRECTION_RECORD.json`). The Phase 8 modules, probes and mutations did not change. This record then stated that the corrected checks "still forbid the same things". **That statement was inaccurate.**\n\n'
  + '## Audit finding and remediation (disclosed)\n\n'
  + 'A later read-only audit found that the corrected process-execution check no longer detected `cp.exec(...)` or `child_process.exec(...)`, which the original check had detected: excluding regular-expression `.exec(` calls also excluded every method-call form of `exec`. The audit also found that neither check named the violating file or rule, that the process check never detected `execFile`, `execFileSync`, `fork` or a destructured alias, and that the provider check never detected provider environment access, provider key names or a provider SDK import.\n\n'
  + 'On owner authorization both checks were rebuilt as static scanners in `tests/engine-governance-phase8/harness-scan.mjs`. The process scanner applies to `lib/engine-governance-phase8/` and permits only a named `execFileSync` import used with the literal `git`; it detects child_process imports (namespace, default, named, aliased, dynamic, require), member and bare calls of exec, execSync, execFile, execFileSync, spawn, spawnSync and fork, destructuring from a child_process binding, fetch and URLs, and still permits regular-expression `.exec(`. The provider scanner applies to every Phase 8 script and detects model identifiers, keys, key names, endpoints, environment access, SDK imports and string-concatenated forms. Every finding names the file and rule. Twenty-four direct probes and twelve mutations were added (`execution-record/AUDIT_REMEDIATION_RECORD.json`). The Phase 8 modules did not change.\n\n## What did not happen\n\nNo commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker or ledger update, public change or branch change. No real record, sealed evaluation material, source file or credential was used. No earlier package or earlier test was modified.\n';

docs['PHASE8_HANDOFF.md'] = '# Phase 8 Handoff: Candidate Preservation, Test Governance and Independent Evaluation Readiness\n\n' + HEAD
  + 'Release status: `NO_GO_NOT_VERIFIED`, unchanged. Date: 2026-10-19. All Phase 8 work is local and uncommitted.\n\n**Language rule.** ' + LANGUAGE_RULE + '\n\n'
  + '## 1. Package preservation\n\nAll seven earlier packages (' + reg.packages.map((p) => p.id + ' ' + p.file_count).join(', ') + ' files) are byte-identical to their recorded manifests, before and after the whole-worktree run. No tracked file differs from `428c307`.\n\n'
  + '## 2. Phase 7 manifest\n\nComplete (' + reg.packages[6].file_count + ' files, SHA-256 each), package hash `' + reg.packages[6].package_sha256 + '`, reproducible byte-for-byte. The Phase 7 seal verifies and no Phase 7 file was modified after its final handoff.\n\n'
  + '## 3. Cross-package governance\n\nVerdict `' + cls.verdict + '`: the only failing checks are CPC-01 to CPC-04, each tripped only by declared later files.\n\n' + resultsTable
  + '\n## 3a. Audit finding and remediation\n\nA read-only audit found that the first harness correction had weakened the process-execution check and that the record overstated it. Both safeguards were rebuilt as static scanners, the inaccurate statement is corrected in `EXECUTION_RECORD.md`, and the history is preserved there and in `MUTATION_TEST_RECORD.md`.\n'
  + '\n## 3b. Phase 8.1 test-governance scalability and handoff freeze\n\n'
  + 'The finite list CPC-01 to CPC-04 is now derived from a hash-bound later-package registry (`LATER_PACKAGE_REGISTRY.md`). Results are reported in separate contexts, never merged (`DUAL_CONTEXT_RESULT_MODEL.md`). Phase 4, Phase 6 and Phase 7 were replayed in isolation, giving their historical results (`ISOLATED_HISTORICAL_REPLAY_PROTOCOL.md`). Future packages pass an admission gate that never authorizes work (`FUTURE_PACKAGE_ADMISSION_GATE.md`). The independent-evaluation handoff is frozen and execution-disabled (`INDEPENDENT_EVALUATION_HANDOFF_FREEZE.md`). See `TEST_GOVERNANCE_SCALABILITY_MODEL.md` and `PHASE8_1_EXECUTION_RECORD.md`.\n'
  + '\n## 3c. Phase 8.2 governance amendment\n\nPhase 8.2 amends local governance only. It does not alter any Engine conclusion, any external evaluation status (none is authorized or conducted) or the release status. The registry distinguishes retroactive seeds from admitted future packages and derives its counts; Phase 8 is now a governed historical package (historical 370/370, isolated replay 370/370, current composition reported separately); Phase 8 scope is classified from the registry; the Phase 9 owner reference is recorded without creating a reservation. See `PHASE8_2_GOVERNANCE_AMENDMENT.md`.\n'
  + '\n## 4. Phase 8 tests\n\n' + suiteLine + '. Mutations: ' + mut.killed + ' of ' + mut.total + ' caught directly, ' + mut.load_failures + ' load failures.\n\n'
  + '## 5. Independent-evaluation readiness\n\nA sealed, execution-disabled protocol (`' + pr.protocol_id + '`) defines six question areas, six roles, four material classes, blinding and contamination controls, eight measures (none calculated), seven stop conditions and gates A to F. An evaluation could be authorized without rebuilding the protocol. None has been authorized or conducted.\n\n'
  + '## 6. Change control\n\nTen change classes each have an evidence, regression, rollback, versioning, evaluation-invalidation, owner-decision and counsel-review path.\n\n'
  + '## 7. Unresolved owner decisions\n\n' + od.decisions.map((d) => '- **' + d.id + '.** ' + d.question).join('\n') + '\n- Phase 7 decisions P7-OD-01 to P7-OD-08 remain open and are carried.\n\n'
  + '## 8. Confirmation\n\nNo commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker or ledger update, public change or branch change occurred in Phase 8.\n\n'
  + '## Records\n\n' + table(['Record', 'Description'], [['VERSION_REGISTRY.md', 'Packages, manifests, recorded results'], ['CROSS_PACKAGE_TEST_GOVERNANCE.md', 'Conditions and classification'], ['CANDIDATE_QUALIFICATION_RECORD.md', 'Unified local record'],
    ['INDEPENDENT_EVALUATION_PROTOCOL.md', 'Execution-disabled protocol'], ['EVALUATION_MEASUREMENT_DICTIONARY.md', 'Measure definitions'], ['CHANGE_IMPACT_AND_ROLLBACK_MODEL.md', 'Change classes'], ['KNOWN_LIMITATIONS_AND_OPEN_ISSUES.md', 'Limitations and active issues'],
    ['OWNER_DECISION_REGISTER.md', 'Open decisions'], ['EXECUTION_RECORD.md', 'Execution and disclosures'], ['MUTATION_TEST_RECORD.md', 'Mutation evidence'], ['PHASE8_FILE_MANIFEST_SHA256.txt', 'SHA-256 of every Phase 8 file']]);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { for (const [k, v] of Object.entries(docs)) writeFileSync(join(P8, k), v.replace(/—/g, ',')); console.log('wrote ' + Object.keys(docs).length + ' documents'); }

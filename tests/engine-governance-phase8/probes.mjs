// JRS PHASE 8: probes shared by the direct, negative and mutation groups.
// Each probe takes a module set M (the real Phase 8 modules, or a mutated copy) and returns true when the
// module behaves as specified. A probe that throws counts as failed.

import { readFileSync, mkdtempSync, cpSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { makeProbes81, MUTATIONS_81 } from './probes-81.mjs';
import { makeProbes82, MUTATIONS_82 } from './probes-82.mjs';
import { makeProbes83, MUTATIONS_83 } from './probes-83.mjs';

export function makeProbes(X) {
  const P = [];
  const p = (name, kind, run) => P.push({ name, kind, run });
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const cls = (M, run, ctxPatch = {}) => M.governance.classifyRun(run, Object.assign({}, X.ctx, ctxPatch));
  const has = (r, c) => r.items.some((i) => i.classification === c);
  const runWith = (pid, mutate) => { const r = clone(X.run); mutate(r.suites[pid]); return r; };

  // ------------------------------------------------ registry
  const pkg = (M, id) => M.registry.PACKAGES.find((x) => x.id === id);
  const tmpPkg = (M, id, act) => {
    const d = mkdtempSync(join(tmpdir(), 'p8-reg-'));
    try {
      const pk = pkg(M, id);
      for (const f of M.registry.listFiles(X.root, pk)) { cpSync(join(X.root, f), join(d, f), { recursive: true }); }
      act(d, pk);
      return M.registry.verifyPackage(d, pk, X.manifests[id], null);
    } finally { rmSync(d, { recursive: true, force: true }); }
  };
  p('reg.phase7_manifest_reproduces', 'direct', (M) => M.registry.buildManifest(X.root, pkg(M, 'phase7-candidate')).manifest_text === X.manifests['phase7-candidate']);
  p('reg.phase7_manifest_complete', 'direct', (M) => M.registry.buildManifest(X.root, pkg(M, 'phase7-candidate')).file_count === X.phase7FileCount && X.phase7FileCount === 147);
  p('reg.every_package_verifies', 'direct', (M) => M.registry.PACKAGES.every((pk) => M.registry.verifyPackage(X.root, pk, X.manifests[pk.id], null).ok));
  p('reg.package_hash_is_hash_of_manifest_text', 'direct', (M) => M.registry.buildManifest(X.root, pkg(M, 'phase6-reliability')).package_sha256 === 'sha256:' + M.registry.sha256(X.manifests['phase6-reliability']));
  p('reg.v1_git_object_matches', 'direct', (M) => M.registry.buildManifest(X.root, pkg(M, 'v1-historical')).git_object.blob_matches_record === true);
  p('reg.statuses_allowed', 'direct', (M) => M.registry.PACKAGES.every((pk) => M.registry.PACKAGE_STATUSES.includes(pk.status)) && pkg(M, 'phase7-candidate').status === 'candidate_only');
  p('reg.phase8_files_owned', 'direct', (M) => M.registry.packageOf('lib/engine-governance-phase8/registry.mjs') === 'phase8-governance' && M.registry.packageOf('tools/engine-governance-phase8-replay.mjs') === 'phase8-governance');
  p('neg.changed_protected_file_detected', 'negative', (M) => { const v = tmpPkg(M, 'phase7-candidate', (d) => writeFileSync(join(d, 'lib/engine-evidence-graph-v0.3.1-candidate/scope.mjs'), '// altered\n', { flag: 'a' })); return !v.ok && v.problems.includes('protected_file_changed') && v.changed.length === 1; });
  p('neg.missing_protected_file_detected', 'negative', (M) => { const v = tmpPkg(M, 'phase6-reliability', (d) => unlinkSync(join(d, 'tools/engine-reliability-replay.mjs'))); return !v.ok && v.problems.includes('protected_file_missing'); });
  p('neg.added_file_in_protected_package_detected', 'negative', (M) => { const v = tmpPkg(M, 'phase4-change-control', (d) => writeFileSync(join(d, 'lib/engine-change-control/extra.mjs'), 'x')); return !v.ok && v.problems.includes('unrecorded_file_in_protected_package'); });
  p('neg.missing_manifest_fails_closed', 'negative', (M) => { const v = M.registry.verifyPackage(X.root, pkg(M, 'v0.3-evidence-graph'), '', null); return !v.ok && v.problems.includes('missing_recorded_manifest'); });
  p('neg.malformed_manifest_line_detected', 'negative', (M) => !M.registry.verifyPackage(X.root, pkg(M, 'v0.2-evidence-contract'), X.manifests['v0.2-evidence-contract'] + 'not a hash line\n', null).ok);
  p('neg.recorded_package_hash_mismatch_detected', 'negative', (M) => M.registry.verifyPackage(X.root, pkg(M, 'v0.1-assurance'), X.manifests['v0.1-assurance'], 'sha256:' + '0'.repeat(64)).problems.includes('recorded_package_hash_mismatch'));

  // ------------------------------------------------ governance
  p('gov.manifest_valid', 'direct', (M) => M.governance.validateCompatibilityManifest(X.manifest).length === 0);
  p('gov.recorded_run_declared_conditions_only', 'direct', (M) => cls(M, X.run).verdict === 'declared_conditions_only');
  p('gov.all_four_conditions_detected', 'direct', (M) => { const r = cls(M, X.run); const ids = r.items.filter((i) => i.classification === 'declared_compatibility_condition').map((i) => i.condition_id).sort(); return JSON.stringify(ids) === JSON.stringify(['CPC-01', 'CPC-02', 'CPC-03', 'CPC-04']); });
  p('gov.conditions_never_called_pass', 'direct', (M) => { const r = cls(M, X.run); return !JSON.stringify(r).match(/"(?:classification|verdict|status)":"pass(?:ed)?"/); });
  p('gov.worktree_results_reported_separately', 'direct', (M) => { const r = cls(M, X.run); return r.suites['phase7-candidate'].worktree_result === X.run.suites['phase7-candidate'].passed + '/' + X.run.suites['phase7-candidate'].total && r.suites['phase7-candidate'].conditions.length === 2; });
  p('gov.recorded_phase7_result_preserved', 'direct', (M) => { const s = M.governance.earlierPackageStatement('phase7-candidate', { kind: 'recorded', result: '328/328', source: 'research/engine-remediation-phase7-2026-10-19/execution-record/TEST_RESULTS.json' }); return s.ok && /328\/328/.test(s.text) && /sealed package scope/.test(s.text); });
  p('gov.parse_suite_output', 'direct', (M) => { const r = M.governance.parseSuiteOutput('PASS  a\nFAIL  b\n        detail\nPASS  c\n\n3 checks: 2 passed, 1 failed, 0 skipped\n'); return r.complete && r.total === 3 && r.failed === 1 && r.failed_checks[0] === 'b'; });
  p('neg.undeclared_conflict_fails_closed', 'negative', (M) => { const r = cls(M, runWith('v0.3-evidence-graph', (s) => { s.failed += 1; s.passed -= 1; s.failed_checks.push('tools unchanged since 882e4f5'); })); return r.verdict === 'fail_closed' && has(r, 'unexplained_conflict'); });
  p('neg.genuine_regression_fails_closed', 'negative', (M) => { const r = cls(M, runWith('phase6-reliability', (s) => { s.failed += 1; s.passed -= 1; s.failed_checks.push('RT-07 compiles'); })); return r.verdict === 'fail_closed' && has(r, 'genuine_regression'); });
  p('neg.removed_condition_is_undeclared', 'negative', (M) => { const m = clone(X.manifest); m.conditions = m.conditions.filter((c) => c.condition_id !== 'CPC-03'); const r = cls(M, X.run, { manifest: m }); return r.verdict === 'fail_closed' && has(r, 'unexplained_conflict'); });
  p('neg.relabelled_check_detected', 'negative', (M) => { const m = clone(X.manifest); m.conditions[0].exact_check = 'tools reviewed'; const r = cls(M, X.run, { manifest: m }); return r.verdict === 'fail_closed' && has(r, 'unexplained_conflict') && has(r, 'condition_description_inconsistent'); });
  p('neg.condition_labelled_pass_rejected', 'negative', (M) => { const m = clone(X.manifest); m.conditions[1].status = 'pass'; return M.governance.validateCompatibilityManifest(m).some((x) => /labelled as a pass/.test(x)); });
  p('neg.missing_description_rejected', 'negative', (M) => { const m = clone(X.manifest); delete m.conditions[2].why_visible_not_rewritten; return M.governance.validateCompatibilityManifest(m).some((x) => /missing why_visible_not_rewritten/.test(x)); });
  p('neg.inconsistent_description_rejected', 'negative', (M) => { const m = clone(X.manifest); m.conditions[3].triggering_paths[0].later_package = 'phase7-candidate'; return M.governance.validateCompatibilityManifest(m).length > 0; });
  p('neg.language_rule_required', 'negative', (M) => { const m = clone(X.manifest); m.language_rule = 'Earlier results are passes.'; return M.governance.validateCompatibilityManifest(m).some((x) => /language rule/.test(x)); });
  p('neg.trigger_outside_declared_paths', 'negative', (M) => { const r = cls(M, X.run, { untracked: [...X.ctx.untracked, 'tools/unregistered-helper.mjs'] }); return r.verdict === 'fail_closed' && has(r, 'unexplained_conflict') && has(r, 'package_outside_registry'); });
  p('neg.package_outside_registry', 'negative', (M) => { const r = cls(M, X.run, { untracked: [...X.ctx.untracked, 'research/some-new-package/README.md'] }); return has(r, 'package_outside_registry') && r.verdict === 'fail_closed'; });
  p('neg.changed_protected_file_classified', 'negative', (M) => { const v = clone(X.ctx.verification); v[6] = { package: 'phase7-candidate', ok: false, problems: ['protected_file_changed'], changed: ['x'], missing: [], added: [], recorded_count: 147 }; const r = cls(M, X.run, { verification: v }); return has(r, 'changed_protected_file') && r.verdict === 'fail_closed'; });
  p('neg.missing_package_classified', 'negative', (M) => { const v = X.ctx.verification.filter((x) => x.package !== 'phase6-reliability'); return has(cls(M, X.run, { verification: v }), 'missing_package'); });
  p('neg.missing_test_record_fails_closed', 'negative', (M) => { const r = clone(X.run); delete r.suites['phase4-change-control']; const c = cls(M, r); return has(c, 'incomplete_test_record') && c.verdict === 'fail_closed'; });
  p('neg.inconsistent_test_counts_fail_closed', 'negative', (M) => { const c = cls(M, runWith('phase6-reliability', (s) => { s.failed = 0; })); return has(c, 'incomplete_test_record'); });
  p('neg.missing_output_hash_fails_closed', 'negative', (M) => has(cls(M, runWith('v0.1-assurance', (s) => { delete s.output_sha256; })), 'incomplete_test_record'));
  p('neg.hidden_condition_detected', 'negative', (M) => { const c = cls(M, runWith('phase7-candidate', (s) => { s.failed_checks = s.failed_checks.filter((n) => !/tools\//.test(n)); s.failed -= 1; s.passed += 1; })); return has(c, 'condition_description_inconsistent') && c.verdict === 'fail_closed'; });
  p('neg.pass_claim_with_failures_refused', 'negative', (M) => !M.governance.earlierPackageStatement('phase6-reliability', { kind: 'worktree', status: 'passed' }, X.run, null).ok);
  p('neg.pass_claim_without_basis_refused', 'negative', (M) => !M.governance.earlierPackageStatement('phase4-change-control', { status: 'passed' }, X.run, null).ok);
  p('neg.recorded_result_mismatch_refused', 'negative', (M) => !M.governance.earlierPackageStatement('phase7-candidate', { kind: 'recorded', result: '330/330', source: 'research/engine-remediation-phase7-2026-10-19/execution-record/TEST_RESULTS.json' }).ok);
  p('neg.condition_relabel_refused', 'negative', (M) => !M.governance.earlierPackageStatement('phase7-candidate', { kind: 'worktree', relabel: ['CPC-03'] }, X.run, null).ok);

  // ------------------------------------------------ qualification
  const qrec = (M) => M.qualification.buildQualificationRecord(X.root, X.manifests['phase7-candidate'], X.phase7Decisions);
  p('q.record_valid', 'direct', (M) => M.qualification.validateQualificationRecord(qrec(M)).length === 0);
  p('q.recorded_values_copied', 'direct', (M) => { const r = qrec(M).components; return r.mutation.killed === 79 && r.mutation.total === 79 && r.sealed_scenarios.total === 50 && r.stability_transforms.total === 32 && r.determinism.distinct_hashes === 1 && r.phase7_suite.passed === 328; });
  p('q.issues_active', 'direct', (M) => { const i = qrec(M).open_issues; return i.length === 22 && i.every((x) => x.status === 'active'); });
  p('q.local_check_distinct_from_independent', 'direct', (M) => { const r = qrec(M); return r.evidence_kind === 'local_engineering_check' && r.independent_evaluation === 'not_authorized_not_conducted'; });
  // Post-stop repair (MG-14): each qualification probe re-hashes after its edit so only the targeted control can reject it.
  const rehash = (M, r) => { delete r.record_sha256; r.record_sha256 = M.registry.hashOf(r); return r; };
  p('neg.score_field_rejected', 'negative', (M) => { const r = qrec(M); r.confidence_score = 0.9; rehash(M, r); const e = M.qualification.validateQualificationRecord(r); return e.includes('forbidden field: confidence_score') && !e.includes('record hash mismatch'); });
  p('neg.issue_closed_without_record_rejected', 'negative', (M) => { const r = qrec(M); r.open_issues[0].status = 'resolved'; rehash(M, r); const e = M.qualification.validateQualificationRecord(r); return e.includes(r.open_issues[0].issue_id + ': closed without an owner decision or remediation record') && !e.includes('record hash mismatch'); });
  p('neg.local_tests_as_independent_rejected', 'negative', (M) => { const r = qrec(M); r.independent_evaluation = 'conducted_locally'; rehash(M, r); const e = M.qualification.validateQualificationRecord(r); return e.includes('independent evaluation status altered') && !e.includes('record hash mismatch'); });
  p('neg.validation_claim_in_record_rejected', 'negative', (M) => { const r = qrec(M); r.components.mutation.note = 'The candidate is independently validated.'; return M.qualification.validateQualificationRecord(r).some((x) => /unsupported claim/.test(x)); });
  p('neg.source_hash_mismatch_rejected', 'negative', (M) => { const r = qrec(M); r.components.stability_transforms.source.sha256 = '0'.repeat(64); return M.qualification.validateQualificationRecord(r).some((x) => /Phase 7 manifest/.test(x)); });

  // ------------------------------------------------ protocol
  p('ev.protocol_valid', 'direct', (M) => M.protocol.validateProtocol(M.protocol.PROTOCOL).length === 0);
  p('ev.execution_refused', 'direct', (M) => { try { M.protocol.executeProtocol(); return false; } catch (e) { return /REFUSED/.test(e.message); } });
  p('ev.sealed_file_matches', 'direct', (M) => M.protocol.sealProtocol().seal_sha256 === X.protocolSeal);
  p('neg.execution_enabled_rejected', 'negative', (M) => M.protocol.validateProtocol(Object.assign({}, M.protocol.PROTOCOL, { execution_enabled: true })).includes('execution enabled'));
  p('neg.missing_sealed_material_separation', 'negative', (M) => { const pr = clone(M.protocol.PROTOCOL); pr.materials.find((m) => m.class === 'sealed_evaluation_material').developer_access = true; return M.protocol.validateProtocol(pr).includes('sealed evaluation material not separated'); });
  p('neg.sealed_material_in_repository_rejected', 'negative', (M) => { const pr = clone(M.protocol.PROTOCOL); pr.materials.find((m) => m.class === 'sealed_evaluation_material').in_repository = true; return M.protocol.validateProtocol(pr).length > 0; });
  p('neg.post_freeze_change_rule_required', 'negative', (M) => { const pr = clone(M.protocol.PROTOCOL); pr.blinding_and_contamination = pr.blinding_and_contamination.filter((s) => !/after the protocol freeze/.test(s)); return M.protocol.validateProtocol(pr).includes('post-freeze change not prohibited'); });
  p('neg.post_freeze_rule_change_invalidates', 'negative', (M) => { const f = { candidate_package_sha256: 'a', rule_packs_sha256: 'b', prompt_sha256: 'c', model_identifier: 'none', environment: 'node', protocol_seal: 's' }; return /rule_packs/.test(M.protocol.freezeInvalidated(f, Object.assign({}, f, { rule_packs_sha256: 'b2' })) || '') && /prompt/.test(M.protocol.freezeInvalidated(f, Object.assign({}, f, { prompt_sha256: 'c2' })) || '') && M.protocol.freezeInvalidated(f, f) === null; });
  p('neg.measure_with_value_rejected', 'negative', (M) => { const pr = clone(M.protocol.PROTOCOL); pr.measures[0].value = 0.97; return M.protocol.validateProtocol(pr).some((x) => /measure has a value/.test(x)); });
  p('neg.operator_label_access_rejected', 'negative', (M) => { const pr = clone(M.protocol.PROTOCOL); pr.roles.find((r) => r.role === 'technical_operator').may_view_sealed_labels = true; return M.protocol.validateProtocol(pr).includes('operator may view sealed labels'); });
  p('neg.missing_stop_condition_rejected', 'negative', (M) => { const pr = clone(M.protocol.PROTOCOL); pr.stop_conditions = pr.stop_conditions.filter((s) => s !== 'counsel objection'); return M.protocol.validateProtocol(pr).length > 0; });
  p('neg.labeler_independence_required', 'negative', (M) => { const pr = clone(M.protocol.PROTOCOL); pr.roles.find((r) => r.role === 'independent_labeler').must_be_independent_of = ['owner']; return M.protocol.validateProtocol(pr).length > 0; });

  // ------------------------------------------------ change model
  const prop = (o) => Object.assign({ rollback_plan: 'restore prior version', owner_decision_ref: 'P8-OD-06', counsel_review_ref: 'CR-1', evaluation_review: true }, o);
  p('ch.ten_classes_complete', 'direct', (M) => M.change.CHANGE_CLASSES.length === 10 && M.change.CHANGE_CLASSES.every((c) => ['evidence', 'regression', 'new_candidate_version', 'invalidates_sealed_evaluation', 'rollback', 'owner_decision', 'counsel_trigger'].every((k) => c[k] !== undefined && c[k] !== '')));
  p('ch.documentation_change_neutral', 'direct', (M) => { const r = M.change.classifyProposal(prop({ declared_class: 'documentation-only', touches: ['research/x/README.md'] })); return r.effective_class === 'documentation-only' && r.neutral === true && r.problems.length === 0; });
  p('neg.sensitive_surface_never_neutral', 'negative', (M) => { const r = M.change.classifyProposal(prop({ declared_class: 'documentation-only', surfaces: ['review_route'] })); return r.effective_class === 'status-routing change' && !r.neutral && r.problems.length > 0; });
  p('neg.rule_pack_path_escalates_test_only', 'negative', (M) => M.change.classifyProposal(prop({ declared_class: 'test-only', touches: ['lib/engine-evidence-graph-v0.3.1-candidate/rule-packs/RPK-NEG.json'] })).effective_class === 'rule-pack change');
  p('neg.refusal_boundary_escalates', 'negative', (M) => M.change.classifyProposal(prop({ declared_class: 'test-only', surfaces: ['refusal_boundary'] })).effective_class === 'intake-boundary change');
  p('neg.model_change_without_evaluation_review', 'negative', (M) => { const r = M.change.classifyProposal(prop({ declared_class: 'model/provider change', evaluation_review: false })); return r.problems.includes('model or provider change requires evaluation review') && r.requirements.invalidates_sealed_evaluation === true; });
  p('neg.missing_rollback_rejected', 'negative', (M) => M.change.classifyProposal(prop({ declared_class: 'prompt change', rollback_plan: '' })).problems.includes('rollback plan required'));
  p('neg.public_claim_without_counsel_rejected', 'negative', (M) => M.change.classifyProposal(prop({ declared_class: 'public-claim change', counsel_review_ref: '' })).problems.includes('counsel review required'));

  // ------------------------------------------------ decisions and claims
  p('od.register_valid', 'direct', (M) => M.decisions.validateDecisionRegister(M.decisions.PHASE8_DECISIONS).length === 0);
  p('od.required_questions_present', 'direct', (M) => { const t = JSON.stringify(M.decisions.PHASE8_DECISIONS); return /separately scoped Engine fix/.test(t) && /cross-package compatibility conditions/.test(t) && /private location/.test(t) && /independent evaluation is authorized/.test(t); });
  p('neg.incomplete_decision_rejected', 'negative', (M) => { const d = clone(M.decisions.PHASE8_DECISIONS); delete d[2].blocks; return M.decisions.validateDecisionRegister(d).some((x) => /missing blocks/.test(x)); });
  p('neg.decision_closed_without_record', 'negative', (M) => { const d = clone(M.decisions.PHASE8_DECISIONS); d[0].status = 'decided'; return M.decisions.validateDecisionRegister(d).length > 0; });
  p('neg.dropped_phase7_decision_detected', 'negative', (M) => { const d = clone(M.decisions.PHASE8_DECISIONS); d[3].carries = []; return M.decisions.validateDecisionRegister(d).some((x) => /P7-OD-07/.test(x)); });
  p('neg.readiness_claim_detected', 'negative', (M) => M.claims.scanClaims('The Engine is ready for sale to buyers.').length > 0 && M.claims.scanClaims('The Engine is production-ready.').length > 0);
  p('neg.local_validation_claim_detected', 'negative', (M) => M.claims.scanClaims('The local tests demonstrate that the Engine works.').length > 0 && M.claims.scanClaims('Independent evaluation confirmed the rules.').length > 0);
  p('neg.organization_claim_detected', 'negative', (M) => M.claims.scanClaims('Reviewed with KPMG.').length > 0);
  p('cl.negated_claims_allowed', 'direct', (M) => M.claims.scanClaims('The Engine is not ready for release. Local tests do not establish accuracy.').length === 0);
  // ------------------------------------------------ harness scanners (post-audit remediation; source text only, nothing is executed)
  const rev = (x) => [...x].reverse().join('');
  const LIBF = 'lib/engine-governance-phase8/zz-planted.mjs', TF = 'tests/engine-governance-phase8/zz-planted.mjs';
  const exp = (found, file, rules) => rules.every((r) => found.some((x) => x.rule === r && x.file === file)) && found.every((x) => x.file === file);
  const ex = (M, src) => M.scan.scanExecution(src, LIBF);
  const pv = (M, src) => M.scan.scanProvider(src, TF);
  p('h.exec_regex_exec_permitted', 'direct', (M) => ex(M, "export const r = (s) => /a/.exec(s);\nconst g = new RegExp('x', 'g'); let m; while ((m = g.exec('y')) !== null) break;").length === 0);
  p('h.exec_git_execfilesync_permitted', 'direct', (M) => ex(M, "import { execFileSync } from 'node:child_process';\nexport const h = () => execFileSync('git', ['rev-parse', 'HEAD']);").length === 0);
  p('h.exec_real_phase8_modules_clean', 'direct', (M) => X.libSources.every(([f, src]) => M.scan.scanExecution(src, f).length === 0));
  p('h.exec_child_process_member_detected', 'negative', (M) => exp(ex(M, "export const r = () => child_process.exec('ls');"), LIBF, ['EXEC-MODULE-MEMBER']));
  p('h.exec_aliased_cp_exec_detected', 'negative', (M) => exp(ex(M, "import cp from 'node:child_process';\nexport const r = () => cp.exec('ls');"), LIBF, ['EXEC-DEFAULT-IMPORT', 'EXEC-HOLDER-ACCESS']));
  p('h.exec_namespace_cp_exec_detected', 'negative', (M) => exp(ex(M, "import * as cp from 'child_process';\nexport const r = () => cp.exec('ls');"), LIBF, ['EXEC-NAMESPACE-IMPORT', 'EXEC-HOLDER-ACCESS']));
  p('h.exec_bare_imported_exec_detected', 'negative', (M) => exp(ex(M, "import { exec } from 'node:child_process';\nexport const r = () => exec('ls');"), LIBF, ['EXEC-NAMED-IMPORT', 'EXEC-BARE-CALL']));
  p('h.exec_execfile_detected', 'negative', (M) => exp(ex(M, "import { execFile } from 'node:child_process';\nexport const r = () => execFile('ls');"), LIBF, ['EXEC-NAMED-IMPORT', 'EXEC-BARE-CALL']));
  p('h.exec_execfilesync_non_git_detected', 'negative', (M) => exp(ex(M, "import { execFileSync } from 'node:child_process';\nexport const r = () => execFileSync('ls', ['-l']);"), LIBF, ['EXEC-NON-GIT-EXECFILESYNC']));
  p('h.exec_spawn_detected', 'negative', (M) => exp(ex(M, "import { spawn } from 'node:child_process';\nexport const r = () => spawn('ls');"), LIBF, ['EXEC-NAMED-IMPORT', 'EXEC-BARE-CALL']));
  p('h.exec_spawnsync_detected', 'negative', (M) => exp(ex(M, "import { spawnSync } from 'node:child_process';\nexport const r = () => spawnSync('ls');"), LIBF, ['EXEC-NAMED-IMPORT', 'EXEC-BARE-CALL']));
  p('h.exec_fork_detected', 'negative', (M) => exp(ex(M, "import { fork } from 'node:child_process';\nexport const r = () => fork('w.mjs');"), LIBF, ['EXEC-NAMED-IMPORT', 'EXEC-BARE-CALL']));
  p('h.exec_destructured_alias_detected', 'negative', (M) => exp(ex(M, "import * as cp from 'node:child_process';\nconst { exec: run } = cp;\nexport const r = () => run('ls');"), LIBF, ['EXEC-DESTRUCTURE']));
  p('h.exec_dynamic_aliased_import_detected', 'negative', (M) => exp(ex(M, "const { spawn: go } = await import('node:child_process');\nexport const r = () => go('ls');"), LIBF, ['EXEC-ALIASED-IMPORT', 'EXEC-DYNAMIC-IMPORT']));
  p('h.exec_require_detected', 'negative', (M) => exp(ex(M, "const cp = require('child_process');\nexport const r = () => cp.exec('ls');"), LIBF, ['EXEC-REQUIRE', 'EXEC-HOLDER-ACCESS']));
  p('h.exec_bun_spawn_detected', 'negative', (M) => exp(ex(M, "export const r = () => Bun.spawn(['ls']);"), LIBF, ['EXEC-MEMBER-CALL']));
  p('h.prov_model_identifier_detected', 'negative', (M) => exp(pv(M, "export const m = '" + rev('1001025-5-4-ukiah-edualc') + "';"), TF, ['PROV-MODEL-ID']));
  p('h.prov_endpoint_detected', 'negative', (M) => exp(pv(M, "export const u = 'https://" + rev('moc.ciporhtna.ipa') + "/v1/messages';"), TF, ['PROV-ENDPOINT']));
  p('h.prov_env_key_access_detected', 'negative', (M) => exp(pv(M, 'export const k = process.env.' + rev('YEK_IPA_CIPORHTNA') + ';'), TF, ['PROV-ENV-ACCESS', 'PROV-KEY-NAME']));
  p('h.prov_env_bracket_access_detected', 'negative', (M) => exp(pv(M, "export const b = process.env['" + rev('LRU_ESAB_CIPORHTNA') + "'];"), TF, ['PROV-ENV-ACCESS']));
  p('h.prov_sdk_import_detected', 'negative', (M) => exp(pv(M, "import Client from '" + rev('kds/ia-ciporhtna@') + "';\nexport const c = Client;"), TF, ['PROV-SDK-IMPORT']));
  p('h.prov_split_identifier_detected', 'negative', (M) => { const f = pv(M, "export const m = '" + rev('iah-edualc') + "' + '" + rev('5-4-uk') + "';"); return exp(f, TF, ['PROV-SPLIT:PROV-MODEL-ID']) && !f.some((x) => x.rule === 'PROV-MODEL-ID'); });
  p('h.prov_benign_comment_permitted', 'direct', (M) => pv(M, '// Engine notes: no provider is called here; any model identifier is configured outside this package.\n// Run with env -u ' + rev('LRU_ESAB_CIPORHTNA') + ' node x.mjs\nexport const n = 1;').length === 0);
  p('h.prov_scanner_and_suite_do_not_self_match', 'direct', (M) => X.harnessSources.every(([f, src]) => M.scan.scanProvider(src, f).length === 0 && M.scan.scanExecution(src, f).every((x) => !/^PROV/.test(x.rule))));
  for (const q of makeProbes81(X)) P.push(q);
  for (const q of makeProbes82(X)) P.push(q);
  for (const q of makeProbes83(X)) P.push(q);
  return P;
}

// [id, file (relative to lib/engine-governance-phase8/), find, replace]
export const MUTATIONS = [
  ['MG-01', 'registry.mjs', "if (changed.length) problems.push('protected_file_changed');", '', 'protected-file alteration'],
  ['MG-02', 'registry.mjs', "if (missing.length) problems.push('protected_file_missing');", '', 'protected-file alteration'],
  ['MG-03', 'registry.mjs', "if (added.length) problems.push('unrecorded_file_in_protected_package');", '', 'protected-file alteration'],
  ['MG-04', 'registry.mjs', "return { package: pkg.id, ok: false, problems: ['missing_recorded_manifest']", "return { package: pkg.id, ok: true, problems: []", 'missing record'],
  ['MG-05', 'registry.mjs', "const text = files.map((f) => f.sha256 + '  ' + f.path).join('\\n')", "const text = files.slice(1).map((f) => f.sha256 + '  ' + f.path).join('\\n')", 'Phase 7 manifest integrity'],
  // Phase 8.3: MG-06 and MG-12 retargeted to the same logic in its corrected form (the original text no longer exists); the defect each injects is unchanged.
  ['MG-06', 'governance.mjs', "add(/new file|unchanged since|file under|Phase \\d+ file|locations/i.test(name) ? 'unexplained_conflict' : 'genuine_regression', { package: pid, suite, check: name }); continue;", "continue;", 'undeclared conflict'],
  ['MG-07', 'governance.mjs', "else if (outside.length) add('unexplained_conflict'", "else if (false) add('unexplained_conflict'", 'undeclared conflict'],
  ['MG-08', 'governance.mjs', "if (off.length && !r.failed_checks.includes(c.exact_check)) add('condition_description_inconsistent'", "if (false) add('condition_description_inconsistent'", 'hidden condition'],
  ['MG-09', 'governance.mjs', "if (JSON.stringify(c).match(/\"(?:status|classification|result|label)\"\\s*:\\s*\"pass(?:ed)?\"/i)) p.push(tag + ': condition labelled as a pass');", '', 'relabelled condition'],
  ['MG-10', 'governance.mjs', "if (!recordComplete(r)) { add('incomplete_test_record'", "if (!r) { add('incomplete_test_record'", 'missing test record'],
  ['MG-11', 'governance.mjs', "if (/^pass(ed)?$/i.test(claim.status || '') && r.failed > 0) return { ok: false, reason: 'cannot call a run with failing checks passed' };", '', 'unsupported pass claim'],
  ['MG-12', 'governance.mjs', "for (const f of ctx.untracked || []) {\n    const o = packageOf(f);", "for (const f of []) {\n    const o = packageOf(f);", 'package outside registry'],
  ['MG-13', 'governance.mjs', "if (cm.language_rule !== LANGUAGE_RULE) p.push('language rule missing or altered');", '', 'conflict description'],
  ['MG-14', 'qualification.mjs', "if (rec.independent_evaluation !== 'not_authorized_not_conducted') p.push('independent evaluation status altered');", '', 'local test as independent evaluation'],
  ['MG-15', 'qualification.mjs', "if (FORBIDDEN_KEYS.test(k)) p.push('forbidden field: ' + path + k);", '', 'score or readiness field'],
  ['MG-16', 'qualification.mjs', "status: 'active', resolution_record: null });\n  for (const d of phase7Decisions)", "status: e.decision === 'included' ? 'resolved' : 'active', resolution_record: null });\n  for (const d of phase7Decisions)", 'unresolved issue treated as closed'],
  ['MG-17', 'evaluation-protocol.mjs', "if (!sealed || sealed.in_repository !== false || sealed.developer_access !== false || sealed.copy_into_repository !== 'prohibited') e.push('sealed evaluation material not separated');", '', 'sealed material separation'],
  ['MG-18', 'evaluation-protocol.mjs', "if (!/No prompt, rule pack, model or code change after the protocol freeze/i.test(bc)) e.push('post-freeze change not prohibited');", '', 'post-freeze change'],
  ['MG-19', 'evaluation-protocol.mjs', "for (const k of ['candidate_package_sha256', 'rule_packs_sha256', 'prompt_sha256', 'model_identifier', 'environment', 'protocol_seal'])", "for (const k of ['candidate_package_sha256', 'model_identifier', 'environment', 'protocol_seal'])", 'post-freeze change'],
  ['MG-20', 'evaluation-protocol.mjs', "if (p.execution_enabled !== false) e.push('execution enabled');", '', 'execution disabled'],
  ['MG-21', 'change-impact.mjs', "if (c.requires_evaluation_review && proposal.evaluation_review !== true) out.problems.push('model or provider change requires evaluation review');", '', 'model or provider change'],
  ['MG-22', 'change-impact.mjs', "for (const s of surfaces) if (strictness(SURFACE_FLOOR[s]) > strictness(effective)) effective = SURFACE_FLOOR[s];", '', 'conservative rule'],
  ['MG-23', 'decisions.mjs', "for (const k of DECISION_FIELDS) if (!d || d[k] === undefined", "for (const k of DECISION_FIELDS.slice(0, 2)) if (!d || d[k] === undefined", 'incomplete owner decision'],
  ['MG-24', 'claims.mjs', "['readiness_claim', /\\b(?:ready for (?:release|production|deployment|sale|licens\\w*|use|customers|acquisition)|release[- ]ready|deployment[- ]ready|market[- ]ready|enterprise[- ]ready)\\b/i],", '', 'readiness or commercial claim'],
  ['MG-25', 'claims.mjs', "['local_tests_as_validation', /\\blocal (?:tests?|checks?|suite)\\b[^.]{0,40}\\b(?:establish|establishes|prove|proves|demonstrate|demonstrates|validate|validates|confirm|confirms)\\b/i],", '', 'local test as independent evaluation'],
  ['MG-26', 'tests/engine-governance-phase8/harness-scan.mjs', "  ['EXEC-MODULE-MEMBER', new RegExp('\\\\b' + j('child', '_process') + '\\\\s*\\\\.\\\\s*(?:' + FN_ALT + ')\\\\b')],\n", '', 'process execution: child_process member'],
  ['MG-27', 'tests/engine-governance-phase8/harness-scan.mjs', "hit('EXEC-HOLDER-ACCESS');", ';', 'process execution: aliased cp.exec'],
  ['MG-28', 'tests/engine-governance-phase8/harness-scan.mjs', "if (!/^execFileSync$/.test(n))", 'if (false)', 'process execution: named import'],
  ['MG-29', 'tests/engine-governance-phase8/harness-scan.mjs', "hit('EXEC-DESTRUCTURE');", ';', 'process execution: destructured alias'],
  ['MG-30', 'tests/engine-governance-phase8/harness-scan.mjs', "if (!/^['\"]git['\"]$/.test(m[1].trim()))", 'if (false)', 'process execution: non-git execFileSync'],
  ['MG-31', 'tests/engine-governance-phase8/harness-scan.mjs', "new RegExp('(?<![.\\\\w$])(?:exec|execSync|execFile|spawn|spawnSync|fork)\\\\s*\\\\(')", "new RegExp('(?:exec|execSync|execFile|spawn|spawnSync|fork)\\\\s*\\\\(')", 'process execution: regex .exec false positive'],
  ['MG-32', 'tests/engine-governance-phase8/harness-scan.mjs', "  ['EXEC-MEMBER-CALL', new RegExp('\\\\.\\\\s*(?:execSync|execFile|execFileSync|spawn|spawnSync|fork)\\\\s*\\\\(')],\n", '', 'process execution: member call'],
  ['MG-33', 'tests/engine-governance-phase8/harness-scan.mjs', "  ['PROV-ENV-ACCESS', j(", "  ['PROV-ENV-ACCESS', '(?!)' || j(", 'provider: environment access'],
  ['MG-34', 'tests/engine-governance-phase8/harness-scan.mjs', "  ['PROV-SDK-IMPORT', j(", "  ['PROV-SDK-IMPORT', '(?!)' || j(", 'provider: SDK import'],
  ['MG-35', 'tests/engine-governance-phase8/harness-scan.mjs', "if (joined !== s)", 'if (false)', 'provider: split identifier'],
  ['MG-36', 'tests/engine-governance-phase8/harness-scan.mjs', "  ['PROV-ENDPOINT', j(", "  ['PROV-ENDPOINT', '(?!)' || j(", 'provider: endpoint'],
  ['MG-37', 'tests/engine-governance-phase8/harness-scan.mjs', "for (const [rule, re] of PROVIDER) if (re.test(s)) f.push({ file, rule });", "for (const [rule, re] of PROVIDER) if (re.test(s)) f.push({ file: 'unknown', rule });", 'provider: violating file reported'],
].concat(MUTATIONS_81, MUTATIONS_82, MUTATIONS_83);

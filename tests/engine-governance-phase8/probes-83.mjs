// JRS PHASE 8.3: probes and mutations for the registry-aware compatibility classifier.
// Synthetic contexts are built in memory from the real registry and worktree; nothing is written.

export function makeProbes83(X) {
  const P = [];
  const p = (name, kind, run) => P.push({ name, kind, run });
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const P9 = 'phase9-human-evidence-adjudication';
  const e9 = X.laterRegistry.packages.find((e) => e.package_id === P9);
  const P9_FILES = e9 ? X.allUntracked.filter((f) => e9.approved_paths.some((a) => (a.endsWith('/') ? f.startsWith(a) : f === a))) : [];
  const FAILS = { 'phase4-change-control': ['tools unchanged since 5d5374b'], 'phase6-reliability': ['every new file is inside the four Phase 6 locations'],
    'phase7-candidate': ['every new file is a Phase 6 file or inside the three Phase 7 locations', 'no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page'] };
  const mkRun = (fails = FAILS) => ({ suites: Object.fromEntries(['v0.1-assurance', 'v0.2-evidence-contract', 'v0.3-evidence-graph', 'phase4-change-control', 'phase6-reliability', 'phase7-candidate']
    .map((k) => { const f = fails[k] || []; return [k, { complete: true, total: 10, passed: 10 - f.length, failed: f.length, failed_checks: f, output_sha256: 'sha256:' + '0'.repeat(64) }]; })) });
  const U_ALL = X.allUntracked, U_P8 = X.ctx.untracked;
  const states = (o) => Object.assign({}, X.regCtx.packageStates, o);
  const later = (M, untracked, o = {}) => M.later.laterCompatibilityContext(untracked, Object.assign({ registry: X.laterRegistry, registryProblems: [], packageStates: X.regCtx.packageStates, mtimeOf: X.mtimeOf }, o));
  const cls = (M, untracked, o = {}, run = mkRun(), ctxPatch = {}) => M.governance.classifyRun(run, Object.assign({}, X.ctx, { untracked, later: later(M, untracked, o) }, ctxPatch));
  const has = (r, c, pred = () => true) => r.items.some((i) => i.classification === c && pred(i));
  const isP9 = (f) => P9_FILES.includes(f);
  const rehash = (M, r) => { r.summary = M.later.registrySummary(r); r.governance_sha256 = M.later.governanceHash(r); delete r.registry_sha256; r.registry_sha256 = M.registry.hashOf(r); return r; };
  const vctx = () => Object.assign({}, X.regCtx, { filesByPackage: Object.fromEntries(X.laterRegistry.packages.map((e) => [e.package_id, U_ALL.filter((f) => M_owns(e, f))])) });
  const M_owns = (e, f) => (e.approved_paths || []).some((a) => (a.endsWith('/') ? f.startsWith(a) : f === a));
  const selfRun = process.env.JRS_PHASE8_SELF_RUN === '1';

  // ------------------------------------------------ direct
  p('p83.phase9_files_present_for_probes', 'direct', () => !!e9 && P9_FILES.length > 0 && P9_FILES.includes('tools/engine-human-review-phase9-replay.mjs'));
  p('p83.valid_phase9_with_manifest_declared', 'direct', (M) => { const r = cls(M, U_ALL); return r.verdict === 'declared_conditions_only' && ['EC-P4-TOOLS', 'EC-P6-OWNERSHIP', 'EC-P7-OWNERSHIP', 'EC-P7-TOOLS'].every((c) => has(r, 'declared_composition_condition', (i) => i.condition_id === 'DCC-' + c + '-' + P9)); });
  p('p83.no_phase9_package_outside_registry', 'direct', (M) => !cls(M, U_ALL).items.some((i) => i.classification === 'package_outside_registry' && isP9(i.file)));
  p('p83.no_phase9_unexplained_conflict', 'direct', (M) => !cls(M, U_ALL).items.some((i) => i.classification === 'unexplained_conflict'));
  p('p83.admission_before_files_valid', 'direct', (M) => { const r = cls(M, U_P8, { packageStates: states({ [P9]: { state: 'no_files', problems: [] } }) }); return r.verdict === 'declared_conditions_only' && !has(r, 'declared_composition_condition'); });
  p('p83.no_manifest_declared_incomplete', 'direct', (M) => { const r = cls(M, U_ALL, { packageStates: states({ [P9]: { state: 'incomplete_construction', problems: [] } }) }); return r.verdict === 'declared_conditions_only' && has(r, 'declared_incomplete_construction', (i) => i.later_package === P9 && /not release-capable/.test(i.note)); });
  p('p83.cpc_kept_as_historical_references', 'direct', (M) => { const r = cls(M, U_ALL); return JSON.stringify(r.suites['phase4-change-control'].conditions) === '["CPC-01"]' && JSON.stringify(r.suites['phase6-reliability'].conditions) === '["CPC-02"]' && JSON.stringify([...r.suites['phase7-candidate'].conditions].sort()) === '["CPC-03","CPC-04"]'; });
  p('p83.composition_conditions_listed_separately', 'direct', (M) => { const r = cls(M, U_ALL); return JSON.stringify(r.suites['phase4-change-control'].composition_conditions) === JSON.stringify(['DCC-EC-P4-TOOLS-' + P9]) && JSON.stringify([...r.suites['phase7-candidate'].composition_conditions].sort()) === JSON.stringify(['DCC-EC-P7-OWNERSHIP-' + P9, 'DCC-EC-P7-TOOLS-' + P9]); });
  p('p83.without_registry_context_unchanged', 'direct', (M) => { const r = M.governance.classifyRun(mkRun(), Object.assign({}, X.ctx, { untracked: U_ALL })); return r.verdict === 'fail_closed' && r.items.filter((i) => i.classification === 'package_outside_registry').length === P9_FILES.length; });
  p('p83.historical_results_preserved', 'direct', () => !!X.p83 && X.p8hist.historical_result.result === '370/370' && X.p82hist.result === '435/435' && X.p83.pre_correction_state.result === '474/474' && X.p83.pre_correction_state.mutations === '98/98'
    && X.p83.pre_correction_state.historical_manifest.sha256 === X.p83PreManifestHash && X.p83.pre_correction_state.isolated_replay === '474/474' && X.p83.pre_correction_state.preserved_records.every((r) => r.sha256 === X.p83PreRecordHashes[r.file]));
  p('p83.pre_correction_failure_recorded', 'direct', () => !!X.p83 && X.p83.pre_correction_state.worktree_run.classification_verdict === 'fail_closed' && X.p83.pre_correction_state.worktree_run.package_outside_registry > 0 && X.p83.pre_correction_state.worktree_run.unexplained_conflict === 4 && X.p83.pre_correction_state.worktree_run.composition_verdict === 'declared_composition_conditions_only');
  p('p83.condition_label_not_defect', 'direct', (M) => { const r = cls(M, U_ALL); return r.items.filter((i) => i.classification === 'declared_composition_condition').every((i) => i.label === M.later.COMPOSITION_LABEL) && M.later.COMPOSITION_LABEL === 'declared composition condition, not a historical-package defect'; });
  p('p83.report_six_kinds_separate', 'direct', (M) => { const rec = { classification: { items: [{ classification: 'declared_compatibility_condition', condition_id: 'CPC-01', package: 'phase4-change-control' }, { classification: 'declared_composition_condition', condition_id: 'DCC-EC-P4-TOOLS-x', later_package: 'x' }, { classification: 'package_outside_registry', file: 'y' }, { classification: 'admitted_package_integrity_failure', path: 'z', later_package: 'x' }] },
      composition: { items: [] }, dual_context: [{ package: 'phase4-change-control', historical: { result: '269/269' }, isolated_replay: { result: '269/269' }, composition: { result: '268/269' } }] };
    const R = M.later.buildCompatibilityReport(rec); return ['historical_package_results', 'isolated_replay_results', 'current_composition_results', 'declared_composition_conditions', 'undeclared_failures', 'integrity_failures'].every((k) => Array.isArray(R[k]))
      && R.historical_package_results[0].result === '269/269' && R.isolated_replay_results[0].result === '269/269' && R.current_composition_results[0].result === '268/269' && R.declared_composition_conditions.length === 2 && R.undeclared_failures.length === 1 && R.integrity_failures.length === 1 && R.historical_defect_count_from_declared_conditions === 0; });
  p('p83.check_ids_and_rules_mapped', 'direct', (M) => { const l = later(M, U_ALL); return ['EC-P4-TOOLS', 'EC-P6-OWNERSHIP', 'EC-P7-OWNERSHIP', 'EC-P7-TOOLS'].every((id) => Object.values(l.checkIds).includes(id) && M.governance.OFFENDING_RULES[l.ruleOf[id]]) && JSON.stringify(l.declares[P9]) === JSON.stringify(e9.affected_earlier_checks); });
  p('p83.seed_package_files_not_reclassified', 'direct', (M) => { const l = later(M, U_ALL); return U_P8.every((f) => !(f in l.files)) && P9_FILES.every((f) => l.files[f] && l.files[f].classification === 'accepted'); });
  p('p83.phase9_only_composition_declared', 'direct', (M) => { const r = cls(M, P9_FILES); return r.verdict === 'declared_conditions_only' && Object.values(r.suites).every((s) => s.conditions.length === 0) && has(r, 'declared_composition_condition', (i) => i.condition_id === 'DCC-EC-P7-TOOLS-' + P9); });
  p('p83.recorded_run_declared_only' + (selfRun ? '_self_run' : ''), 'direct', () => !!X.runRec && X.runRec.classification && X.runRec.composition.verdict === 'declared_composition_conditions_only' && !X.runRec.classification.items.some((i) => ['package_outside_registry', 'unexplained_conflict'].includes(i.classification))
    && (selfRun || (X.runRec.classification.verdict === 'declared_conditions_only' && !!X.runRec.report && X.runRec.report.undeclared_failures.length === 0 && X.runRec.report.integrity_failures.length === 0)));

  // ------------------------------------------------ adversarial
  p('n83.changed_after_manifest_integrity_failure', 'negative', (M) => { const r = cls(M, U_ALL, { packageStates: states({ [P9]: { state: 'integrity_failure', problems: ['changed after manifest: ' + P9_FILES[0]] } }) });
    return r.verdict === 'fail_closed' && has(r, 'admitted_package_integrity_failure', (i) => isP9(i.path)) && !has(r, 'declared_composition_condition'); });
  p('n83.outside_approved_path_fails', 'negative', (M) => { const f = 'lib/engine-human-review-phase9-extra/x.mjs'; const r = cls(M, [...U_ALL, f]); return r.verdict === 'fail_closed' && has(r, 'package_outside_registry', (i) => i.file === f); });
  p('n83.phase10_like_path_fails', 'negative', (M) => { const f = 'research/engine-phase10-2026-11-01/README.md'; const r = cls(M, [...U_ALL, f]); return r.verdict === 'fail_closed' && has(r, 'package_outside_registry', (i) => i.file === f); });
  p('n83.imitation_paths_fail', 'negative', (M) => { const fs = ['tools/engine-human-review-phase9-replay.mjs.bak', 'research/engine-human-review-phase9-2026-10-20-copy/a.md']; const r = cls(M, [...U_ALL, ...fs]); return r.verdict === 'fail_closed' && fs.every((f) => has(r, 'package_outside_registry', (i) => i.file === f)); });
  p('n83.invalid_owner_decision_fails', 'negative', (M) => { const r = cls(M, U_ALL, { registryProblems: [P9 + ': admission record missing, not admissible, or not tied to a recorded owner decision'] }); return r.verdict === 'fail_closed' && has(r, 'missing_or_invalid_registry_reservation', (i) => isP9(i.path)); });
  p('n83.missing_owner_evidence_fails', 'negative', (M) => { const probs = M.later.validateLaterRegistry(X.laterRegistry, Object.assign(vctx(), { evidenceExists: () => false })); const r = cls(M, U_ALL, { registryProblems: probs }); return probs.some((x) => x.startsWith(P9 + ':')) && r.verdict === 'fail_closed' && has(r, 'missing_or_invalid_registry_reservation'); });
  p('n83.altered_admission_unhashed_fails', 'negative', (M) => { const reg = clone(X.laterRegistry); reg.packages.find((e) => e.package_id === P9).admission_record.proposal_sha256 = 'sha256:' + 'f'.repeat(64); const probs = M.later.validateLaterRegistry(reg, vctx());
    // Only the registry hash catches this edit, so only the registry-level rule can reject it.
    const r = cls(M, U_ALL, { registry: reg, registryProblems: probs }); return JSON.stringify(probs) === '["registry hash mismatch"]' && r.verdict === 'fail_closed' && P9_FILES.every((f) => has(r, 'missing_or_invalid_registry_reservation', (i) => i.path === f)); });
  p('n83.altered_admission_rehashed_fails', 'negative', (M) => { const reg = clone(X.laterRegistry); reg.packages.find((e) => e.package_id === P9).admission_record.owner_decision_reference = 'FORGED-REFERENCE'; rehash(M, reg); const probs = M.later.validateLaterRegistry(reg, vctx());
    const r = cls(M, U_ALL, { registry: reg, registryProblems: probs }); return probs.some((x) => x.startsWith(P9 + ': admission record')) && r.verdict === 'fail_closed' && has(r, 'missing_or_invalid_registry_reservation'); });
  p('n83.undeclared_affected_check_fails', 'negative', (M) => { const reg = clone(X.laterRegistry); const e = reg.packages.find((x) => x.package_id === P9); e.affected_earlier_checks = e.affected_earlier_checks.filter((c) => c !== 'EC-P4-TOOLS'); rehash(M, reg);
    const r = cls(M, U_ALL, { registry: reg }); return r.verdict === 'fail_closed' && has(r, 'undeclared_affected_check', (i) => i.later_package === P9 && i.check === 'tools unchanged since 5d5374b'); });
  p('n83.files_before_admission_fail', 'negative', (M) => { const r = cls(M, U_ALL, { mtimeOf: () => Date.parse('2026-10-01T00:00:00Z') }); return r.verdict === 'fail_closed' && has(r, 'files_before_admission', (i) => isP9(i.path)); });
  p('n83.state_not_determined_fails', 'negative', (M) => { const r = cls(M, U_ALL, { packageStates: {} }); return r.verdict === 'fail_closed' && has(r, 'package_state_not_determined', (i) => isP9(i.path)); });
  p('n83.registry_missing_fails', 'negative', (M) => { const r = cls(M, U_ALL, { registry: null }); return r.verdict === 'fail_closed' && P9_FILES.every((f) => r.items.some((i) => ['package_outside_registry', 'missing_or_invalid_registry_reservation'].includes(i.classification) && (i.file === f || i.path === f))); });
  p('n83.changed_protected_file_still_fails', 'negative', (M) => { const v = clone(X.ctx.verification); v[1] = Object.assign({}, v[1], { ok: false, problems: ['changed'], changed: ['lib/engine-assurance/x.mjs'] }); const r = cls(M, U_ALL, {}, mkRun(), { verification: v }); return r.verdict === 'fail_closed' && has(r, 'changed_protected_file'); });
  p('n83.genuine_regression_still_fails', 'negative', (M) => { const r = cls(M, U_ALL, {}, mkRun(Object.assign({}, FAILS, { 'v0.1-assurance': ['fixture replay matches the recorded result'] }))); return r.verdict === 'fail_closed' && has(r, 'genuine_regression', (i) => i.package === 'v0.1-assurance'); });
  p('n83.unplaced_file_on_unmanifested_check_unexplained', 'negative', (M) => { const man = clone(X.ctx.manifest); man.conditions = man.conditions.filter((c) => c.condition_id !== 'CPC-04');
    const r = cls(M, U_ALL, {}, mkRun(), { manifest: man }); return r.verdict === 'fail_closed' && has(r, 'unexplained_conflict', (i) => i.check === 'no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page'); });
  return P;
}

// [id, file relative to lib/engine-governance-phase8/, find, replace, area]
export const MUTATIONS_83 = [
  ['MG-99', 'governance.mjs', "if (!a) { add('package_outside_registry', { file: f }); continue; }", 'if (!a) continue;', 'unregistered later path'],
  ['MG-100', 'governance.mjs', "if (a.classification === 'accepted') continue;", 'if (a.classification) continue;', 'only accepted paths pass'],
  ['MG-101', 'governance.mjs', "return a && (a.classification === 'accepted' || a.classification === 'declared_incomplete_construction') ? a : null; };", 'return a ? a : null; };', 'only declared states attributed'],
  ['MG-102', 'governance.mjs', "if (!a || !checkId || !(later.declares[a.package_id] || []).includes(checkId)) { add('undeclared_affected_check'", "if (!a || !checkId) { add('undeclared_affected_check'", 'affected check must be declared'],
  ['MG-103', 'governance.mjs', "incomplete.add(a.package_id); add('declared_incomplete_construction', {", "incomplete.add(a.package_id); void ({", 'incomplete construction reported'],
  ['MG-104', 'governance.mjs', "const legacyOff = off.filter((f) => !placed(f)), laterOff = off.filter((f) => placed(f));", 'const legacyOff = off, laterOff = [];', 'registry attribution of later files'],
  ['MG-105', 'governance.mjs', "export const DECLARED_CLASSES = Object.freeze(['declared_compatibility_condition', 'declared_composition_condition', 'declared_incomplete_construction']);", "export const DECLARED_CLASSES = Object.freeze(['declared_compatibility_condition', 'declared_composition_condition', 'declared_incomplete_construction', 'undeclared_affected_check']);", 'fail-closed class set'],
  ['MG-106', 'governance.mjs', "composition_conditions: composition };", 'composition_conditions: [] };', 'composition conditions listed'],
  ['MG-107', 'governance.mjs', "if (offL.length && offL.every((f) => placed(f))) {", 'if (offL.length) {', 'unmanifested check needs placed files'],
  ['MG-108', 'governance.mjs', "later_files: fs.length, label: later.label };", "later_files: fs.length, label: 'pass' };", 'condition label'],
  ['MG-109', 'later-packages.mjs', "const registryInvalid = !reg || problems.some((m) => !ids.some((id) => m.startsWith(id + ':')));", 'const registryInvalid = false;', 'registry-level problem invalidates admissions'],
  ['MG-110', 'later-packages.mjs', "for (const i of scope.items) if (i.path && i.classification !== 'undeclared_future_path') files[i.path] =", 'for (const i of scope.items) if (false) files[i.path] =', 'failure states carried per file'],
  ['MG-111', 'later-packages.mjs', "  const integrity = all.filter((i) => INTEGRITY_CLASSES.includes(i.classification));", '  const integrity = [];', 'integrity failures reported separately'],
  ['MG-112', 'later-packages.mjs', "classification: c.construction_state === 'incomplete_construction' ? 'declared_incomplete_construction' : 'accepted',", "classification: 'accepted',", 'incomplete construction distinguished'],
];

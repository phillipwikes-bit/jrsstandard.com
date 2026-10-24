// JRS PHASE 8.1: probes and mutations for the later-package registry, dual-context results,
// isolated replay planning, the admission gate and the evaluation handoff freeze.
// Each adversarial probe re-hashes any record it edits, so only the targeted control can reject it.

export function makeProbes81(X) {
  const P = [];
  const p = (name, kind, run) => P.push({ name, kind, run });
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const rehashReg = (M, r) => { delete r.registry_sha256; r.registry_sha256 = M.registry.hashOf(r); return r; };
  const rehashFreeze = (M, f) => { delete f.freeze_sha256; f.freeze_sha256 = M.registry.hashOf(f); return f; };
  const vreg = (M, r) => M.later.validateLaterRegistry(r, X.regCtx);
  const reg = () => clone(X.laterRegistry);
  const entry = (r, id) => r.packages.find((e) => e.package_id === id);
  const comp = (M, patch = {}) => M.later.deriveComposition(X.run, Object.assign({ registry: X.laterRegistry, untracked: X.ctx.untracked, phase6Files: X.ctx.phase6Files, verification: X.ctx.verification }, patch));
  const has = (r, c) => r.items.some((i) => i.classification === c);
  const BOUNDARY = 'This package cannot modify public, deployment or earlier protected paths without separate authorization.';
  const proposal = (o = {}) => Object.assign({ package_id: 'future-example', package_version: '0.1.0', owner_decision_reference: 'TEST-OD-01', purpose: 'Synthetic admission-gate fixture.',
    approved_paths: ['research/future-example-2026-11-01/'], planned_manifest: ['research/future-example-2026-11-01/README.md'], affected_prior_analysis: ['EC-P6-OWNERSHIP', 'EC-P7-OWNERSHIP', 'EC-P8-SCOPE'],
    regression_plan: 'Run every earlier suite in isolation and in the whole worktree.', rollback_plan: 'Delete the package directory; no earlier file is touched.', boundary_statement: BOUNDARY,
    permissions: { may_affect_historical_results: false, may_affect_composition_results: true, may_affect_public_or_deployment: false } }, o);
  const actx = (o = {}) => Object.assign({ registry: X.laterRegistry, existingFiles: X.ctx.untracked, decidedReferences: new Set(['TEST-OD-01']), phase6Files: X.ctx.phase6Files }, o);
  const adm = (M, prop, c) => M.admission.evaluateAdmission(prop, c || actx());
  const freeze = (M) => M.freeze.buildHandoffFreeze(X.freezeInputs);

  // ------------------------------------------------ registry (direct)
  p('r81.registry_valid', 'direct', (M) => vreg(M, X.laterRegistry).length === 0);
  p('r81.seeds_phase6_phase7_phase8', 'direct', (M) => JSON.stringify(X.laterRegistry.packages.filter((e) => e.entry_class === 'retroactive_seed').map((e) => e.package_id)) === '["phase6-reliability","phase7-candidate","phase8-governance"]');
  p('r81.phase6_affects_phase4_tools_only', 'direct', (M) => JSON.stringify(M.later.affectedChecksFor('phase6-reliability', entry(X.laterRegistry, 'phase6-reliability').approved_paths, X.ctx.phase6Files)) === '["EC-P4-TOOLS"]');
  p('r81.phase7_affects_phase6_ownership_only', 'direct', (M) => JSON.stringify(M.later.affectedChecksFor('phase7-candidate', entry(X.laterRegistry, 'phase7-candidate').approved_paths, X.ctx.phase6Files)) === '["EC-P6-OWNERSHIP"]');
  p('r81.phase8_affects_four_checks', 'direct', (M) => M.later.affectedChecksFor('phase8-governance', entry(X.laterRegistry, 'phase8-governance').approved_paths, X.ctx.phase6Files).length === 4);
  p('r81.statuses_recorded', 'direct', (M) => entry(X.laterRegistry, 'phase6-reliability').status === 'preserved_local_only' && entry(X.laterRegistry, 'phase7-candidate').status === 'preserved_local_only' && entry(X.laterRegistry, 'phase8-governance').status === 'present_local_only');
  p('r81.permissions_never_historical_or_public', 'direct', (M) => X.laterRegistry.packages.every((e) => e.permissions.may_affect_historical_results === false && e.permissions.may_affect_public_or_deployment === false && e.permissions.may_affect_composition_results === true));
  p('r81.manifest_hashes_bound', 'direct', (M) => X.laterRegistry.packages.filter((e) => e.entry_class === 'retroactive_seed').every((e) => e.manifest_binding.package_sha256 === X.regCtx.manifestHashes[e.package_id]));
  p('r81.owner_references_cite_recorded_evidence', 'direct', (M) => X.laterRegistry.packages.filter((e) => e.entry_class === 'retroactive_seed').every((e) => X.regCtx.evidenceExists(e.owner_decision_reference.evidence_path) && e.owner_decision_reference.formal_decision_record === false && e.seeded_retroactively === true));
  p('r81.b018_claim_detector_bounds', 'direct', (M) => M.later.claimsB018Resolved('B-018 is resolved.') && M.later.claimsB018Resolved('B-018 has been reconciled and closed.') && !M.later.claimsB018Resolved('A check rejects any record that presents B-018 as resolved.') && !M.later.claimsB018Resolved('B-018 remains open and is not resolved.'));
  p('r81.b018_recorded_open', 'direct', (M) => X.laterRegistry.b018_status === 'OPEN' && !M.later.claimsB018Resolved(JSON.stringify(X.laterRegistry)));
  p('r81.earlier_check_catalogue_maps_cpc', 'direct', (M) => JSON.stringify(M.later.EARLIER_CHECKS.filter((c) => c.historical_example !== null).map((c) => c.historical_example)) === '["CPC-01","CPC-02","CPC-03","CPC-04"]' && M.later.EARLIER_CHECKS.filter((c) => c.historical_example === null).map((c) => c.check_id).join() === 'EC-P8-SCOPE');

  // ------------------------------------------------ composition and dual context (direct)
  p('c81.recorded_run_declared_only', 'direct', (M) => comp(M).verdict === 'declared_composition_conditions_only');
  p('c81.conditions_registry_derived_cover_cpc', 'direct', (M) => JSON.stringify([...new Set(comp(M).conditions.map((c) => c.historical_example))].sort()) === '["CPC-01","CPC-02","CPC-03","CPC-04"]');
  p('c81.condition_fields_complete', 'direct', (M) => comp(M).conditions.every((c) => c.affected_historical_package && c.later_package && c.paths.length && c.governing_registry_entry === c.later_package && c.earlier_protected_file_changed === false));
  p('c81.condition_label_exact', 'direct', (M) => comp(M).conditions.every((c) => c.label === 'declared composition condition, not a historical-package defect'));
  p('c81.phase4_condition_attributed_to_two_packages', 'direct', (M) => JSON.stringify(comp(M).conditions.filter((c) => c.check_id === 'EC-P4-TOOLS').map((c) => c.later_package).sort()) === '["phase6-reliability","phase8-governance"]');
  p('c81.dual_context_never_merged', 'direct', (M) => { const d = M.later.dualContext(X.versionRegistry, X.run, comp(M), X.isoRecord); return d.length === 6 && d.every((x) => x.historical && 'composition' in x && !('result' in x) && !('passed' in x)); });
  p('c81.dual_context_phase7', 'direct', (M) => { const d = M.later.dualContext(X.versionRegistry, X.run, comp(M), X.isoRecord).find((x) => x.package === 'phase7-candidate'); return d.historical.result === '328/328' && d.composition.result === '326/328' && d.composition.conditions.length === 2 && d.earlier_protected_file_changed === false; });
  p('c81.dual_context_isolated_phase4', 'direct', (M) => { const d = M.later.dualContext(X.versionRegistry, X.run, comp(M), X.isoRecord).find((x) => x.package === 'phase4-change-control'); return !!d.isolated_replay && d.isolated_replay.result === '269/269' && d.composition.result === '268/269'; });

  // ------------------------------------------------ isolated replay (direct)
  p('i81.plan_phase4_baseline_only', 'direct', (M) => { const pl = M.iso.planIsolatedReplay('phase4-change-control', X.manifests, X.trackedBaseline); return pl.ok && pl.files.length === 0 && pl.baseline_commit === M.registry.BASELINE_COMMIT; });
  p('i81.plan_phase6_own_manifest_only', 'direct', (M) => { const pl = M.iso.planIsolatedReplay('phase6-reliability', X.manifests, X.trackedBaseline); return pl.ok && pl.files.length === 139 && pl.files.every((f) => f.package === 'phase6-reliability'); });
  p('i81.plan_phase7_excludes_later_packages', 'direct', (M) => { const pl = M.iso.planIsolatedReplay('phase7-candidate', X.manifests, X.trackedBaseline); return pl.ok && pl.files.length === 286 && !pl.files.some((f) => /governance-phase8/.test(f.path)); });
  p('i81.record_uncontaminated_and_cleaned', 'direct', (M) => !!X.isoRecord && X.isoRecord.temporary_copies_deleted === true && X.isoRecord.network_attempts === 0 && X.isoRecord.replays.length === 3 && X.isoRecord.replays.every((r) => r.contamination && r.contamination.clean && r.later_packages_present === false));
  p('i81.isolated_results_equal_historical', 'direct', (M) => !!X.isoRecord && ['phase4-change-control', 'phase6-reliability', 'phase7-candidate'].every((id) => { const r = X.isoRecord.replays.find((x) => x.package === id); return r && r.passed + '/' + r.total === X.versionRegistry.packages.find((x) => x.id === id).latest_recorded_result.result; }));

  // ------------------------------------------------ admission (direct)
  p('a81.well_formed_proposal_admissible', 'direct', (M) => adm(M, proposal()).admissible === true);
  p('a81.admission_never_authorizes_work', 'direct', (M) => adm(M, proposal()).authorizes_work === false && adm(M, proposal({ owner_decision_reference: '' })).authorizes_work === false);
  p('a81.computed_analysis_for_research_only_package', 'direct', (M) => JSON.stringify(adm(M, proposal()).computed_affected_checks) === '["EC-P6-OWNERSHIP","EC-P7-OWNERSHIP","EC-P8-SCOPE"]');
  p('a81.registered_manifest_verifies', 'direct', (M) => M.admission.verifyRegisteredManifest(entry(X.laterRegistry, 'phase7-candidate'), X.regCtx.manifestHashes['phase7-candidate']).length === 0);

  // ------------------------------------------------ handoff freeze and decisions (direct)
  p('f81.freeze_valid', 'direct', (M) => M.freeze.validateHandoffFreeze(freeze(M)).length === 0);
  p('f81.freeze_file_matches_build', 'direct', (M) => !!X.freezeFile && X.freezeFile.freeze_sha256 === freeze(M).freeze_sha256);
  p('f81.freeze_execution_disabled', 'direct', (M) => { const f = freeze(M); return f.execution_enabled === false && f.evaluation_authorized === false && f.evaluation_conducted === false; });
  p('f81.freeze_b018_open', 'direct', (M) => freeze(M).b018.status === 'OPEN');
  p('f81.freeze_roles_and_candidate', 'direct', (M) => { const f = freeze(M); return f.roles.length === 6 && f.candidate.package_sha256 === X.versionRegistry.packages[6].package_sha256 && f.lineage.length === 7; });
  p('f81.decisions_p8od08_p8od09_open', 'direct', (M) => ['P8-OD-08', 'P8-OD-09'].every((id) => M.decisions.PHASE8_DECISIONS.some((d) => d.id === id && d.status === 'open')));

  // ------------------------------------------------ adversarial
  p('n81.undeclared_future_path_fails_closed', 'negative', (M) => { const r = comp(M, { untracked: [...X.ctx.untracked, 'research/phase9-unregistered/README.md'] }); return r.verdict === 'fail_closed' && r.items.some((i) => i.classification === 'undeclared_later_path' && i.path === 'research/phase9-unregistered/README.md' && !i.check); });
  p('n81.undeclared_affected_check_fails_closed', 'negative', (M) => { const r = reg(); entry(r, 'phase8-governance').affected_earlier_checks = ['EC-P4-TOOLS', 'EC-P6-OWNERSHIP', 'EC-P7-OWNERSHIP']; const c = comp(M, { registry: r }); return c.verdict === 'fail_closed' && has(c, 'undeclared_affected_check'); });
  p('n81.changed_protected_file_remains_failure', 'negative', (M) => { const v = clone(X.ctx.verification); v[4] = { package: 'phase4-change-control', ok: false, problems: ['protected_file_changed'] }; const c = comp(M, { verification: v }); return c.verdict === 'fail_closed' && c.items.some((i) => i.classification === 'changed_protected_file' && i.package === 'phase4-change-control'); });
  p('n81.condition_flags_protected_change', 'negative', (M) => { const v = clone(X.ctx.verification); v[4] = { package: 'phase4-change-control', ok: false, problems: ['protected_file_changed'] }; return comp(M, { verification: v }).conditions.filter((c) => c.affected_historical_package === 'phase4-change-control').every((c) => c.earlier_protected_file_changed === true); });
  p('n81.declared_check_without_later_file_is_regression', 'negative', (M) => { const c = comp(M, { untracked: [] }); return c.verdict === 'fail_closed' && c.items.some((i) => i.classification === 'genuine_regression_or_unexplained' && /no later file/.test(i.detail || '')); });
  p('n81.uncatalogued_failing_check_is_regression', 'negative', (M) => { const run = clone(X.run); const s = run.suites['phase6-reliability']; s.failed += 1; s.passed -= 1; s.failed_checks.push('RT-07 compiles'); return M.later.deriveComposition(run, { registry: X.laterRegistry, untracked: X.ctx.untracked, phase6Files: X.ctx.phase6Files, verification: X.ctx.verification }).items.some((i) => i.classification === 'genuine_regression_or_unexplained' && i.check === 'RT-07 compiles'); });
  p('n81.registry_missing_owner_reference', 'negative', (M) => { const r = reg(); entry(r, 'phase7-candidate').owner_decision_reference = { reference: '', evidence_path: '' }; rehashReg(M, r); return vreg(M, r).includes('phase7-candidate: owner decision reference missing or without recorded evidence'); });
  p('n81.registry_b018_closed_rejected', 'negative', (M) => { const r = reg(); r.b018_status = 'CLOSED'; rehashReg(M, r); return vreg(M, r).includes('B-018 status must be recorded as OPEN'); });
  p('n81.registry_b018_resolved_text_rejected', 'negative', (M) => { const r = reg(); r.statement = 'This registry records that B-018 is resolved.'; rehashReg(M, r); return vreg(M, r).includes('a registry record presents B-018 as resolved'); });
  p('n81.registry_historical_permission_rejected', 'negative', (M) => { const r = reg(); entry(r, 'phase6-reliability').permissions = Object.assign({}, entry(r, 'phase6-reliability').permissions, { may_affect_historical_results: true }); rehashReg(M, r); return vreg(M, r).includes('phase6-reliability: may not affect historical results'); });
  p('n81.registry_public_permission_rejected', 'negative', (M) => { const r = reg(); entry(r, 'phase7-candidate').permissions = Object.assign({}, entry(r, 'phase7-candidate').permissions, { may_affect_public_or_deployment: true }); rehashReg(M, r); return vreg(M, r).includes('phase7-candidate: may not affect public or deployment surfaces'); });
  p('n81.registry_forbidden_path_rejected', 'negative', (M) => { const r = reg(); entry(r, 'phase8-governance').approved_paths.push('api/'); rehashReg(M, r); return vreg(M, r).some((x) => x === 'phase8-governance: approved path in a protected or public area: api/'); });
  p('n81.registry_affected_checks_understated', 'negative', (M) => { const r = reg(); entry(r, 'phase6-reliability').affected_earlier_checks = []; rehashReg(M, r); return vreg(M, r).includes('phase6-reliability: affected earlier checks do not match the computed analysis'); });
  p('n81.registry_stale_manifest_rejected', 'negative', (M) => { const r = reg(); entry(r, 'phase7-candidate').manifest_binding.package_sha256 = 'sha256:' + '1'.repeat(64); rehashReg(M, r); return vreg(M, r).includes('phase7-candidate: manifest hash does not match the package'); });
  p('n81.registry_reserved_with_files_rejected', 'negative', (M) => { const r = reg(); entry(r, 'phase6-reliability').status = 'reserved_not_present'; rehashReg(M, r); return vreg(M, r).includes('phase6-reliability: files present for a reserved_not_present package'); });
  p('n81.registry_unadmitted_entry_rejected', 'negative', (M) => { const r = reg(); entry(r, 'phase8-governance').seeded_retroactively = false; rehashReg(M, r); return vreg(M, r).includes('phase8-governance: neither an admission record nor a recorded retroactive seed'); });
  p('n81.registry_historical_override_rejected', 'negative', (M) => { const r = reg(); entry(r, 'phase7-candidate').historical_result_override = '330/330'; rehashReg(M, r); return vreg(M, r).includes('phase7-candidate: attempts to record or redefine a historical result'); });
  p('n81.self_admission_after_file_creation_rejected', 'negative', (M) => adm(M, proposal(), actx({ existingFiles: [...X.ctx.untracked, 'research/future-example-2026-11-01/README.md'] })).problems.some((x) => /^files created before admission/.test(x)));
  p('n81.missing_owner_reference_fails_admission', 'negative', (M) => adm(M, proposal({ owner_decision_reference: '' })).problems.includes('missing owner_decision_reference'));
  p('n81.unrecorded_owner_reference_fails_admission', 'negative', (M) => adm(M, proposal({ owner_decision_reference: 'OD-INVENTED-99' })).problems.includes('owner decision reference is not a recorded decision'));
  p('n81.readiness_claim_fails_admission', 'negative', (M) => adm(M, proposal({ purpose: 'Make the Engine release-ready.' })).problems.includes('claims a validation, readiness, licensing or commercial status'));
  p('n81.commercial_claim_fails_admission', 'negative', (M) => adm(M, proposal({ purpose: 'Package is licensed and commercially ready.' })).problems.includes('claims a validation, readiness, licensing or commercial status'));
  p('n81.planned_file_outside_paths_rejected', 'negative', (M) => adm(M, proposal({ planned_manifest: ['research/future-example-2026-11-01/README.md', 'lib/elsewhere/x.mjs'] })).problems.includes('planned file outside the approved paths: lib/elsewhere/x.mjs'));
  p('n81.historical_redefinition_rejected', 'negative', (M) => adm(M, proposal({ historical_result_overrides: { 'phase7-candidate': '330/330' } })).problems.includes('attempts to redefine historical results'));
  p('n81.incomplete_prior_analysis_rejected', 'negative', (M) => adm(M, proposal({ affected_prior_analysis: ['EC-P6-OWNERSHIP', 'EC-P7-OWNERSHIP'] })).problems.some((x) => /^affected prior-package analysis does not match/.test(x)));
  p('n81.forbidden_root_rejected_at_admission', 'negative', (M) => adm(M, proposal({ approved_paths: ['docs/future/'], planned_manifest: ['docs/future/a.md'], affected_prior_analysis: M.later.affectedChecksFor('future-example', ['docs/future/'], X.ctx.phase6Files) })).problems.includes('approved path in a protected or public area: docs/future/'));
  p('n81.manifest_mismatch_detected', 'negative', (M) => M.admission.verifyRegisteredManifest(entry(X.laterRegistry, 'phase7-candidate'), 'sha256:' + '2'.repeat(64)).includes('manifest does not match the registry entry'));
  p('n81.isolated_plan_refuses_missing_manifest', 'negative', (M) => { const m = Object.assign({}, X.manifests, { 'phase6-reliability': '' }); const pl = M.iso.planIsolatedReplay('phase7-candidate', m, X.trackedBaseline); return !pl.ok && pl.refusal === 'missing manifest: phase6-reliability'; });
  p('n81.isolated_plan_refuses_missing_command', 'negative', (M) => { const pl = M.iso.planIsolatedReplay('phase4-change-control', X.manifests, new Set()); return !pl.ok && /approved test command missing/.test(pl.refusal); });
  p('n81.isolated_contamination_detected', 'negative', (M) => { const pl = M.iso.planIsolatedReplay('phase6-reliability', X.manifests, X.trackedBaseline); const c = M.iso.contaminationCheck(pl, [...pl.files.map((f) => f.path), 'lib/engine-governance-phase8/registry.mjs']); return !c.clean && c.extra.length === 1; });
  p('n81.freeze_execution_enabled_rejected', 'negative', (M) => { const f = freeze(M); f.execution_enabled = true; rehashFreeze(M, f); return M.freeze.validateHandoffFreeze(f).includes('execution, authorization or conduct state altered'); });
  p('n81.freeze_b018_resolved_rejected', 'negative', (M) => { const f = freeze(M); f.b018 = { status: 'OPEN', statement: 'B-018 has been reconciled and closed.' }; rehashFreeze(M, f); return M.freeze.validateHandoffFreeze(f).includes('B-018 not recorded as open'); });
  p('n81.freeze_labels_rejected', 'negative', (M) => { const f = freeze(M); f.labels = []; rehashFreeze(M, f); return M.freeze.validateHandoffFreeze(f).includes('freeze carries labels, scores or results'); });
  p('n81.freeze_closed_issue_rejected', 'negative', (M) => { const f = freeze(M); f.deferred_and_open_issues[0].status = 'resolved'; rehashFreeze(M, f); return M.freeze.validateHandoffFreeze(f).includes('deferred or open issues missing or closed'); });
  return P;
}

// [id, file relative to lib/engine-governance-phase8/, find, replace, area]
export const MUTATIONS_81 = [
  ['MG-38', 'later-packages.mjs', "for (const f of ctx.untracked || []) if (!live.some((e) => ownsLater(e, f))) add('undeclared_later_path', { path: f });", '', 'undeclared later path'],
  ['MG-39', 'later-packages.mjs', "if (!(e.affected_earlier_checks || []).includes(c.check_id)) { add('undeclared_affected_check'", "if (false) { add('undeclared_affected_check'", 'undeclared affected check'],
  ['MG-40', 'later-packages.mjs', "for (const v of ctx.verification || []) if (!v.ok) add('changed_protected_file', { package: v.package, detail: v.problems.join(',') });", '', 'changed protected file'],
  ['MG-41', 'later-packages.mjs', "export const COMPOSITION_LABEL = 'declared composition condition, not a historical-package defect';", "export const COMPOSITION_LABEL = 'compatibility pass';", 'composition label'],
  ['MG-42', 'later-packages.mjs', "earlier_protected_file_changed: (ctx.verification || []).some((v) => v.package === pid && !v.ok)", 'earlier_protected_file_changed: false', 'protected change flag'],
  ['MG-43', 'later-packages.mjs', "if (reg.b018_status !== 'OPEN') p.push('B-018 status must be recorded as OPEN');", '', 'B-018 open'],
  ['MG-44', 'later-packages.mjs', "while ((m = re.exec(s)) !== null) if (!NEGATED.test(m[0])) return true;", 'while ((m = re.exec(s)) !== null) if (false) return true;', 'B-018 resolution wording'],
  ['MG-45', 'later-packages.mjs', "if (!ref.reference || !ref.evidence_path || (ctx.evidenceExists && !ctx.evidenceExists(ref.evidence_path))) p.push(tag + ': owner decision reference missing or without recorded evidence');", '', 'owner reference'],
  ['MG-46', 'later-packages.mjs', "if (perm.may_affect_historical_results !== false) p.push(tag + ': may not affect historical results');", '', 'historical permission'],
  ['MG-47', 'later-packages.mjs', "if (perm.may_affect_public_or_deployment !== false) p.push(tag + ': may not affect public or deployment surfaces');", '', 'public permission'],
  ['MG-48', 'later-packages.mjs', "for (const ap of e.approved_paths || []) if (FORBIDDEN_ROOTS.some((r) => r.test(ap) || r.test(ap + 'x'))) p.push(tag + ': approved path in a protected or public area: ' + ap);", '', 'forbidden path in registry'],
  ['MG-49', 'later-packages.mjs', "if (JSON.stringify([...(e.affected_earlier_checks || [])].sort()) !== JSON.stringify(computed.sort())) p.push(tag + ': affected earlier checks do not match the computed analysis');", '', 'affected checks in registry'],
  ['MG-50', 'later-packages.mjs', "if (!mh || !ctx.manifestHashes || mh !== ctx.manifestHashes[e.package_id]) p.push(tag + ': manifest hash does not match the package');", '', 'stale manifest'],
  ['MG-51', 'later-packages.mjs', "if (!off.length) { add('genuine_regression_or_unexplained', { package: pid, suite, check: name, detail: 'no later file trips this check' }); continue; }", '', 'declared check without later file'],
  ['MG-52', 'later-packages.mjs', "if (!c) { add('genuine_regression_or_unexplained', { package: pid, suite, check: name }); continue; }", 'if (!c) continue;', 'uncatalogued failing check'],
  ['MG-53', 'admission.mjs', "if (existing.length) p.push('files created before admission: ' + existing.slice(0, 3).join(', '));", '', 'self-admission after file creation'],
  ['MG-54', 'admission.mjs', "if (ref && !(ctx.decidedReferences && ctx.decidedReferences.has(ref))) p.push('owner decision reference is not a recorded decision');", '', 'unrecorded owner reference'],
  ['MG-55', 'admission.mjs', "if (STATUS_CLAIM.test(text) || scanClaims(text).length)", 'if (scanClaims(text).length)', 'licensing or commercial claim'],
  ['MG-56', 'admission.mjs', "for (const f of proposal.planned_manifest || []) if (!ownsLater(self, f)) p.push('planned file outside the approved paths: ' + f);", '', 'planned file outside paths'],
  ['MG-57', 'admission.mjs', "if (JSON.stringify([...(proposal.affected_prior_analysis || [])].sort()) !== JSON.stringify(computed.sort())) p.push(", 'if (false) p.push(', 'prior-package analysis'],
  ['MG-58', 'admission.mjs', "if (perm.may_affect_historical_results === true || proposal.historical_result_overrides || proposal.redefine_historical_results) p.push('attempts to redefine historical results');", '', 'historical redefinition'],
  ['MG-59', 'admission.mjs', "return { admissible: p.length === 0, authorizes_work: false, problems: p, computed_affected_checks: computed };", 'return { admissible: p.length === 0, authorizes_work: p.length === 0, problems: p, computed_affected_checks: computed };', 'admission never authorizes work'],
  ['MG-60', 'admission.mjs', "return entry.manifest_binding.package_sha256 === computedPackageSha256 ? [] : ['manifest does not match the registry entry'];", 'return [];', 'manifest mismatch'],
  ['MG-61', 'isolated-replay.mjs', "if (typeof text !== 'string' || !text.length) return { ok: false, refusal: 'missing manifest: ' + dep };", 'if (typeof text !== \'string\' || !text.length) continue;', 'isolated replay missing manifest'],
  ['MG-62', 'isolated-replay.mjs', "return { clean: !extra.length && !missing.length, extra, missing };", 'return { clean: !missing.length, extra, missing };', 'isolated replay contamination'],
  ['MG-63', 'isolated-replay.mjs', "if (!inFiles) return { ok: false, refusal: 'approved test command missing: ' + spec.command };", '', 'isolated replay missing command'],
  ['MG-64', 'handoff-freeze.mjs', "if (f.execution_enabled !== false || f.evaluation_authorized !== false || f.evaluation_conducted !== false) e.push('execution, authorization or conduct state altered');", '', 'freeze execution disabled'],
  ['MG-65', 'handoff-freeze.mjs', "if (!f.b018 || f.b018.status !== 'OPEN' || claimsB018Resolved(JSON.stringify(f))) e.push('B-018 not recorded as open');", "if (!f.b018 || f.b018.status !== 'OPEN') e.push('B-018 not recorded as open');", 'freeze B-018'],
  ['MG-66', 'handoff-freeze.mjs', "if (/\"(?:score|labels?|holdout_results?|predictions?)\"\\s*:/i.test(JSON.stringify(f))) e.push('freeze carries labels, scores or results');", '', 'freeze labels or scores'],
  ['MG-67', 'handoff-freeze.mjs', "if (!(f.deferred_and_open_issues || []).length || f.deferred_and_open_issues.some((x) => x.status !== 'active')) e.push('deferred or open issues missing or closed');", '', 'freeze open issues'],
];

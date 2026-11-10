// Direct probes of lib/engine-change-control (0.4.1-local). Each probe isolates one rule so a
// mutation removing that rule makes at least one probe fail. libRoot is the directory holding
// engine-change-control (the repository lib/ or a mutant copy). Observed-change records are
// generated here from the library under test, so the record code itself is exercised.

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const clone = (x) => JSON.parse(JSON.stringify(x));

export async function runProbes(libRoot, ctx) {
  const imp = (f) => import(pathToFileURL(join(libRoot, 'engine-change-control', f)).href + '?v=' + Math.random());
  const K = await imp('knowledge-base.mjs'), PC = await imp('proposal-compiler.mjs'), IA = await imp('impact-analyzer.mjs'), RS = await imp('regression-selector.mjs');
  const DL = await imp('drift-ledger.mjs'), GS = await imp('gate-simulator.mjs'), CP = await imp('corpus-protocol.mjs'), ST = await imp('stability.mjs'), CR = await imp('corpus-replay.mjs');
  const OC = await imp('observed-change.mjs'), ID = await imp('identity.mjs'), V = await imp('vocab.mjs');
  const out = [];
  const probe = async (id, fn) => { let ok = false; try { ok = (await fn()) === true; } catch { ok = false; } out.push({ id, ok }); };
  const entry = ctx.entry, kbList = ctx.kbEntries;
  const C = ctx.compile, cases = ctx.obsCases, CLOCK = ctx.clock;

  // ---- knowledge base
  const bad = (patch) => K.validateKnowledgeEntry(Object.assign(clone(entry), patch)).length > 0;
  await probe('kb.valid_entry_accepted', () => K.validateKnowledgeEntry(clone(entry)).length === 0);
  await probe('kb.forbidden_word_rejected', () => bad({ observed_behavior: 'This behaviour is validated.' }));
  await probe('kb.forbidden_underscore_word_rejected', () => bad({ proposed_control: 'mark release_ready' }));
  await probe('kb.bad_status_rejected', () => bad({ status: 'approved' }));
  await probe('kb.unknown_status_rejected', () => bad({ status: 'finished' }));
  await probe('kb.bad_source_rejected', () => bad({ source_type: 'customer_record' }));
  await probe('kb.bad_failure_class_rejected', () => bad({ failure_class: 'accuracy' }));
  await probe('kb.human_decision_must_be_true', () => bad({ human_decision_required: false }));
  await probe('kb.undeclared_field_rejected', () => bad({ accuracy: 0.97 }));
  await probe('kb.missing_field_rejected', () => { const e = clone(entry); delete e.limitation; return K.validateKnowledgeEntry(e).length > 0; });
  await probe('kb.tamper_detected', () => { let t = K.appendKnowledgeEntry('', clone(entry)); t = K.appendKnowledgeEntry(t, Object.assign(clone(entry), { knowledge_id: 'RKB-902' }));
    return K.validateKnowledgeBase(t.replace('"observed_behavior":"', '"observed_behavior":"edited ')).length > 0; });
  await probe('kb.chain_link_checked', () => { let t = K.appendKnowledgeEntry('', clone(entry)); t = K.appendKnowledgeEntry(t, Object.assign(clone(entry), { knowledge_id: 'RKB-902' }));
    const lines = t.split('\n').filter(Boolean); return K.validateKnowledgeBase(lines[1] + '\n' + lines[0] + '\n').length > 0; });
  await probe('kb.duplicate_rejected', () => { const t = K.appendKnowledgeEntry('', clone(entry)); try { K.appendKnowledgeEntry(t, clone(entry)); return false; } catch { return true; } });

  // ---- observed-change records produced by the library under test
  const rec = {};
  for (const [name, r] of Object.entries(ctx.obsRequests)) { try { rec[name] = await OC.observeChange(r, cases, C, CLOCK); } catch { rec[name] = null; } }
  const good = ctx.goodRequest, nonb = ctx.nonBehaviouralRequest;
  const compile = (r, o) => PC.compileChangeProposal(r, kbList, { observedChange: o === undefined ? null : o });
  const state = (r, o) => compile(r, o).proposal.authorization_state;
  const hasCode = (r, code, o) => compile(r, o).proposal.rejection_reasons.some((x) => x.code === code);
  const rej = (patch, code) => { const r = Object.assign(clone(good), patch); if (patch.change) r.change = Object.assign(clone(good.change), patch.change);
    const c = compile(r, rec.good); return c.proposal.authorization_state === 'rejected_by_compiler' && c.proposal.rejection_reasons.some((x) => x.code === code); };
  const rehash = (o, edit) => { const x = clone(o); edit(x); delete x.record_sha256; x.record_sha256 = ID.sha(ID.canon(x)); return x; };

  await probe('pc.good_with_record_awaits_review', () => { const c = compile(clone(good), rec.good); return c.ok && c.proposal.authorization_state === 'awaiting_human_review' && c.proposal.human_review_required === true; });
  await probe('pc.non_behavioural_awaits_without_record', () => state(clone(nonb)) === 'awaiting_human_review');
  await probe('pc.deterministic_id', () => compile(clone(good), rec.good).proposal.proposal_id === compile(clone(good), rec.good).proposal.proposal_id);
  await probe('pc.behavioural_without_record_blocked', () => state(clone(good)) === 'blocked_missing_observed_change');
  await probe('pc.record_tampered_blocked', () => { const x = clone(rec.good); x.summary.rows = x.summary.rows + 999; return state(clone(good), x) === 'blocked_missing_observed_change'; });
  await probe('pc.record_other_request_blocked', () => state(clone(ctx.obsRequests.favourable), rec.good) === 'blocked_missing_observed_change');
  // Isolating: same patch, different request text, so only the request binding can catch it.
  await probe('pc.record_bound_to_request_text', () => state(Object.assign(clone(good), { summary: good.summary + ' (reworded)' }), rec.good) === 'blocked_missing_observed_change');
  await probe('pc.record_incomplete_identity_blocked', () => state(clone(good), rehash(rec.good, (x) => { delete x.identity.test_command; })) === 'blocked_missing_observed_change');
  await probe('pc.record_disposition_set_blocked', () => state(clone(good), rehash(rec.good, (x) => { x.human_disposition = 'accepted'; })) === 'blocked_missing_observed_change');
  await probe('pc.record_compile_failure_blocked', () => rec.breaks && rec.breaks.candidate_compile_failures.length > 0 && state(clone(ctx.obsRequests.breaks), rec.breaks) === 'blocked_missing_observed_change');
  await probe('pc.engine_target_makes_behavioural', () => state(Object.assign(clone(nonb), { targets: ['lib/engine-evidence-graph/contract.mjs'] })) === 'blocked_missing_observed_change');
  await probe('pc.observed_favourable_blocks_pending', () => state(clone(ctx.obsRequests.favourable), rec.favourable) === 'blocked_pending_human_disposition');
  await probe('pc.observed_refusal_removed_rejects', () => hasCode(clone(ctx.obsRequests.unrefuse), 'observed_refusal_removed', rec.unrefuse));
  await probe('pc.observed_excluded_unrefused_rejects', () => hasCode(clone(ctx.obsRequests.unrefuse), 'observed_excluded_domain_unrefused', rec.unrefuse));
  await probe('pc.observed_limitation_removed_rejects', () => hasCode(clone(ctx.obsRequests.limitation), 'observed_limitation_removed', rec.limitation));
  await probe('pc.expected_drift_rejected', () => rej({ expected_drift: [{ fixture_id: 'GC-001' }] }, 'self_declared_drift_not_accepted'));
  await probe('pc.human_disposition_rejected', () => rej({ human_disposition: 'accepted' }, 'human_disposition_not_settable'));
  // declared refusals still apply
  await probe('pc.scope_broaden_rejected', () => rej({ change: { scope_delta: 'broaden' } }, 'scope_expansion_into_regulated_domain'));
  await probe('pc.scope_text_widening_rejected', () => rej({ summary: 'Support hiring decisions for HR teams.' }, 'scope_expansion_into_regulated_domain'));
  await probe('pc.refusal_text_not_widening', () => !compile(Object.assign(clone(good), { summary: 'Add refusal patterns for reworded termination wording.' }), rec.good).proposal.rejection_reasons.length);
  await probe('pc.refusal_narrow_rejected', () => rej({ change: { refusal_delta: 'narrow' } }, 'refusal_boundary_removed'));
  await probe('pc.refusal_remove_rejected', () => rej({ change: { refusal_delta: 'remove' } }, 'refusal_boundary_removed'));
  await probe('pc.evidence_lower_rejected', () => rej({ change: { evidence_delta: 'lower' } }, 'evidence_requirement_lowered'));
  await probe('pc.limitation_remove_rejected', () => rej({ change: { limitation_delta: 'remove' } }, 'limitation_removed_or_weakened'));
  await probe('pc.limitation_weaken_rejected', () => rej({ change: { limitation_delta: 'weaken' } }, 'limitation_removed_or_weakened'));
  await probe('pc.no_test_plan_rejected', () => rej({ test_plan: { regression: [], mutation: [] } }, 'behavioural_change_without_test_plan'));
  await probe('pc.flag_without_test_plan_rejected', () => { const r = Object.assign(clone(nonb), { change: Object.assign(clone(nonb.change), { alters_threshold: true }), test_plan: { regression: ['x'], mutation: [] } });
    return compile(r).proposal.rejection_reasons.some((x) => x.code === 'behavioural_change_without_test_plan'); });
  await probe('pc.rollback_missing_rejected', () => rej({ rollback: '  ' }, 'rollback_missing'));
  await probe('pc.compat_missing_rejected', () => rej({ compatibility_analysis: '' }, 'compatibility_analysis_missing'));
  await probe('pc.synthetic_independent_rejected', () => rej({ fixture_origin: 'synthetic_engineering', claimed_independent: true }, 'synthetic_fixture_treated_as_independent'));
  await probe('pc.label_status_independent_rejected', () => rej({ fixture_label_status: 'adjudicated_reference' }, 'synthetic_fixture_treated_as_independent'));
  await probe('pc.self_authorization_rejected', () => rej({ requested_authorization_state: 'authorized' }, 'self_authorization_attempt'));
  await probe('pc.unknown_trigger_rejected', () => rej({ triggering_knowledge_ids: ['RKB-999'] }, 'unknown_trigger'));
  await probe('pc.unknown_change_type_rejected', () => rej({ proposed_change_type: 'apply_now' }, 'unknown_change_type'));
  await probe('pc.forbidden_wording_rejected', () => rej({ summary: 'Mark this change approved.' }, 'forbidden_status_wording'));
  // paths
  const path = (t) => PC.normalizeTarget(t);
  await probe('pc.path_dotdot_root_rejected', () => path('../api/review.js').code === 'target_path_invalid');
  await probe('pc.path_inner_traversal_protected', () => path('lib/../api/review.js').code === 'production_or_public_target');
  await probe('pc.path_repeated_separators_protected', () => path('api//review.js').code === 'production_or_public_target');
  await probe('pc.path_windows_separators_protected', () => path('lib\\..\\api\\review.js').code === 'production_or_public_target');
  await probe('pc.path_absolute_rejected', () => path('/srv/repo/lib/engine-evidence-graph/scope.mjs').code === 'target_path_invalid' && path('C:\\repo\\lib\\x.mjs').code === 'target_path_invalid');
  await probe('pc.path_encoded_rejected', () => path('lib/%2e%2e/api/review.js').code === 'target_path_invalid');
  await probe('pc.path_valid_allowed', () => { const n = path('lib//engine-evidence-graph/./scope.mjs'); return n.ok && n.normalized === 'lib/engine-evidence-graph/scope.mjs'; });
  await probe('pc.path_outside_workspace', () => path('README.md').code === 'target_outside_change_control_workspace');
  await probe('pc.protected_target_rejected', () => rej({ targets: ['api/review.js'] }, 'production_or_public_target'));
  await probe('pc.traversal_target_rejected_in_proposal', () => rej({ targets: ['lib/../api/review.js'] }, 'production_or_public_target'));
  // free text and claims
  await probe('pc.claim_in_summary_rejected', () => rej({ claims: ['The corpus shows the Engine is accurate.'] }, 'external_result_claimed_from_local_material'));
  await probe('pc.claim_in_rollback_rejected', () => rej({ rollback: 'Rollback unnecessary: the change is independently validated.' }, 'external_result_claimed_from_local_material'));
  await probe('pc.claim_in_compat_rejected', () => rej({ compatibility_analysis: 'Fully compliant with v0.3.' }, 'external_result_claimed_from_local_material'));
  await probe('pc.claim_in_notes_rejected', () => rej({ implementation_notes: 'Certified by the build.' }, 'external_result_claimed_from_local_material'));
  await probe('pc.loose_negation_rejected', () => rej({ claims: ['The Engine is not only fast but validated.'] }, 'external_result_claimed_from_local_material'));
  await probe('pc.qualified_negation_allowed', () => !compile(Object.assign(clone(nonb), { documentation_notes: 'This change is not validated, not independently verified and not authorized for release; it is not production-ready.' })).proposal.rejection_reasons.length);
  await probe('pc.every_claim_term_caught', () => ['validated', 'independent', 'verified', 'certified', 'authorized', 'production-ready', 'release-ready', 'license-ready', 'sale-ready', 'compliant', 'guaranteed']
    .every((w) => V.findUnqualifiedClaim('The change is ' + w + ' here.') !== null));
  // release gate
  await probe('pc.release_target_rejected', () => rej({ targets: ['lib/engine-evidence-graph/evaluation/factory.mjs'] }, 'release_gate_advancement_not_authorized'));
  await probe('pc.release_component_rejected', () => rej({ affected_engine_components: ['evaluation_factory'] }, 'release_gate_advancement_not_authorized'));
  await probe('pc.release_text_rejected', () => rej({ documentation_notes: 'Then set the release gate result to open.' }, 'release_gate_advancement_not_authorized'));

  // ---- impact analyzer
  const ZERO = { rows: 1, fixtures_changed: 1, favourable_transitions: 0, refusals_removed: 0, limitations_removed: 0, proof_edges: 0, excluded_domain_unrefused: 0, conflict_review_lost: 0, relabelled_independent: 0, fixtures_missing: 0, refusals_added: 0 };
  const base = clone(compile(clone(good), rec.good).proposal);
  const prop = (o = {}) => { const p = clone(base); Object.assign(p.change, o.change || {}); if (o.type) p.proposed_change_type = o.type; if (o.comps) p.affected_engine_components = o.comps;
    p.behavioural = o.behavioural === undefined ? true : o.behavioural; p.observed_change = o.ob === undefined ? (p.behavioural ? clone(ZERO) : null) : o.ob; return p; };
  const atLeast = (cls) => cls !== 'no_behavioral_change' && cls !== 'not_assessed';
  const NB = { behavioural: false, type: 'documentation_correction', change: { alters_rule: false, refusal_delta: 'none' } };
  await probe('ia.favourable_requires_review', () => { const i = IA.analyzeChangeImpact(prop({ ...NB, change: { ...NB.change, favorability_delta: 'raise' } })); return atLeast(i.impact_class) && i.human_review_required && i.condition_can_become_more_favorable; });
  await probe('ia.refusal_alter_flagged', () => { const i = IA.analyzeChangeImpact(prop({ ...NB, change: { ...NB.change, refusal_delta: 'narrow' } })); return atLeast(i.impact_class) && i.refusal_behavior === 'narrower'; });
  await probe('ia.limitation_weaken_flagged', () => { const i = IA.analyzeChangeImpact(prop({ ...NB, change: { ...NB.change, limitation_delta: 'weaken' } })); return atLeast(i.impact_class) && i.limitation_removed_or_weakened; });
  await probe('ia.scope_class', () => IA.analyzeChangeImpact(prop({ change: { scope_delta: 'broaden' } })).impact_class === 'scope_boundary_change');
  await probe('ia.evidence_class', () => IA.analyzeChangeImpact(prop({ change: { evidence_delta: 'lower' } })).impact_class === 'evidence_standard_change');
  await probe('ia.release_class', () => IA.analyzeChangeImpact(prop({ comps: ['evaluation_factory'] })).impact_class === 'release_control_change');
  await probe('ia.docs_only_no_behaviour', () => { const i = IA.analyzeChangeImpact(prop({ ...NB, comps: ['documentation'] })); return i.impact_class === 'no_behavioral_change' && !i.new_version_identity_required; });
  await probe('ia.behaviour_needs_version', () => IA.analyzeChangeImpact(prop({})).new_version_identity_required === true);
  await probe('ia.malformed_not_assessed', () => IA.analyzeChangeImpact({ proposal_id: 'x' }).impact_class === 'not_assessed');
  await probe('ia.prior_versions_frozen', () => /^no/.test(IA.analyzeChangeImpact(prop({})).historical_outputs_change['v0.2']));
  await probe('ia.observed_favourable_escalates', () => IA.analyzeChangeImpact(prop({ ob: Object.assign(clone(ZERO), { favourable_transitions: 1 }) })).impact_class === 'evidence_standard_change');
  await probe('ia.observed_scope_escalates', () => IA.analyzeChangeImpact(prop({ ob: Object.assign(clone(ZERO), { excluded_domain_unrefused: 1 }) })).impact_class === 'scope_boundary_change');
  await probe('ia.behavioural_without_observation_not_assessed', () => IA.analyzeChangeImpact(prop({ ob: null })).impact_class === 'not_assessed');

  // ---- regression selector
  const plan = (o) => { const p = prop(o); return RS.selectRegressionTests(p, IA.analyzeChangeImpact(p)); };
  const keys = (o) => (o && typeof o === 'object' ? Object.keys(o).concat(...Object.values(o).map(keys)) : []);
  await probe('rs.no_safety_decision_field', () => !keys(plan({})).some((k) => /safe|approv|clear|green|ready/i.test(k)));
  await probe('rs.statement_present', () => /does not decide that a change is safe/.test(plan({}).statement));
  await probe('rs.behavioural_full_suite', () => plan({}).full_suite_mandatory === true);
  await probe('rs.refusal_selects_refusal_test', () => plan({ ...NB, comps: ['documentation'], change: { ...NB.change, refusal_delta: 'broaden' } }).selected.some((t) => t.test === 'refusal'));
  await probe('rs.gap_when_no_fixture', () => { const p = prop({}); p.required_fixtures = []; return RS.selectRegressionTests(p, IA.analyzeChangeImpact(p)).coverage_gaps.some((g) => /no new synthetic fixture/.test(g)); });
  await probe('rs.excluded_reasoned', () => plan({ comps: ['scope'] }).excluded.every((x) => x.reason && x.reason.length > 10));

  // ---- drift ledger
  const G = ctx.graphs;
  const bset = (ids) => ({ version: 'b', graphs: Object.fromEntries(ids.map((i) => [i, clone(G[i])])), labels: {} });
  const fails = (code, edit, ids = ['GC-001']) => { const b = bset(ids), c = bset(ids); edit(c); const L = DL.buildDriftLedger(b, c); return L.fail && L.violations.some((v) => v.code === code); };
  const setStatus = (g, cid, st) => { g.findings.find((f) => f.condition_id === cid).status = st; };
  const FAV = 'favourable_transition_unsafe_until_human_disposition';
  await probe('dl.identical_runs_no_rows', () => { const L = DL.buildDriftLedger(bset(['GC-001', 'GC-004']), bset(['GC-001', 'GC-004'])); return !L.fail && L.rows.length === 0; });
  await probe('dl.review_to_supported_unsafe', () => fails(FAV, (c) => setStatus(c.graphs['GC-004'], 'chronology_integrity', 'supported'), ['GC-004']));
  await probe('dl.review_to_gap_unsafe', () => fails(FAV, (c) => setStatus(c.graphs['GC-004'], 'chronology_integrity', 'gap'), ['GC-004']));
  await probe('dl.gap_to_supported_unsafe', () => fails(FAV, (c) => setStatus(c.graphs['GC-018'], 'chronology_integrity', 'supported'), ['GC-018']));
  await probe('dl.not_assessed_to_supported_unsafe', () => fails(FAV, (c) => setStatus(c.graphs['GC-008'], 'identifiable_basis', 'supported'), ['GC-008']));
  await probe('dl.not_assessed_to_gap_unsafe', () => fails(FAV, (c) => setStatus(c.graphs['GC-008'], 'identifiable_basis', 'gap'), ['GC-008']));
  await probe('dl.lowering_not_unsafe', () => { const b = bset(['GC-001']), c = bset(['GC-001']); setStatus(c.graphs['GC-001'], 'identifiable_basis', 'review_required'); const L = DL.buildDriftLedger(b, c); return !L.violations.some((v) => v.code === FAV) && L.rows.length > 0; });
  await probe('dl.proposer_documentation_ignored', () => { const b = bset(['GC-004']), c = bset(['GC-004']); setStatus(c.graphs['GC-004'], 'chronology_integrity', 'supported');
    const L = DL.buildDriftLedger(b, c, [{ authorization_state: 'awaiting_human_review', required_regression_tests: ['drift'], expected_drift: [{ fixture_id: 'GC-004', condition_id: 'chronology_integrity', from: 'review_required', to: 'supported' }] }]);
    return L.violations.some((v) => v.code === FAV); });
  await probe('dl.disposition_never_recorded', () => { const b = bset(['GC-004']), c = bset(['GC-004']); setStatus(c.graphs['GC-004'], 'chronology_integrity', 'supported'); const L = DL.buildDriftLedger(b, c); return L.rows.length > 0 && L.rows.every((r) => r.human_disposition === 'not_recorded'); });
  await probe('dl.refusal_disappear_fails', () => fails('refusal_disappeared', (c) => { c.graphs['GC-008'].refusals = []; }, ['GC-008']));
  await probe('dl.excluded_domain_fails', () => fails('excluded_domain_no_longer_refused', (c) => { c.graphs['GC-008'].intake = { decision: 'proceed', triggers: [] }; }, ['GC-008']));
  await probe('dl.limitation_disappear_fails', () => fails('limitation_disappeared', (c) => { const n = c.graphs['GC-001'].nodes.find((x) => x.id === 'lim:sufficiency'); n.text = 'Presence only.'; }));
  await probe('dl.edge_proof_fails', () => fails('edge_meaning_implies_proof', (c) => { c.graphs['GC-001'].edges.find((e) => e.type === 'TEXTUALLY_SUPPORTS').meaning = 'The quoted text proves the finding.'; }));
  await probe('dl.contradiction_review_fails', () => fails('contradiction_not_routed_to_review', (c) => { c.graphs['GC-004'].edges = c.graphs['GC-004'].edges.filter((e) => !(e.from.startsWith('conf:') && e.type === 'ROUTES_TO_REVIEW')); }, ['GC-004']));
  await probe('dl.independent_label_fails', () => { const b = bset(['GC-001']), c = bset(['GC-001']); c.labels = { 'GC-001': 'independent_adjudicated_label' }; return DL.buildDriftLedger(b, c).violations.some((v) => v.code === 'synthetic_fixture_relabelled_independent'); });
  await probe('dl.engineering_label_ok', () => { const b = bset(['GC-001']), c = bset(['GC-001']); c.labels = { 'GC-001': 'engineering_authored_expected_result_not_adjudicated' }; return !DL.buildDriftLedger(b, c).fail; });
  await probe('dl.missing_fixture_fails', () => { const b = bset(['GC-001', 'GC-004']), c = bset(['GC-001']); return DL.buildDriftLedger(b, c).violations.some((v) => v.code === 'fixture_missing_from_run'); });
  await probe('dl.withdrawn_under_refusal_not_limitation_loss', () => { const b = bset(['GC-001']), c = { version: 'c', graphs: { 'GC-001': clone(G['GC-008']) }, labels: {} }; return !DL.buildDriftLedger(b, c).violations.some((v) => v.code === 'limitation_disappeared'); });

  // ---- gate simulator
  const sim = GS.simulateGate({ version_identity: { present: true }, counsel_review: { present: true }, owner_release_authorization: { present: true }, independent_holdout: { present: true } });
  await probe('gs.external_never_present', () => ['counsel_review', 'independent_holdout', 'independent_labeling', 'adjudication', 'production_qa'].every((k) => sim.categories[k].state === 'external_evidence_required'));
  await probe('gs.owner_not_authorized', () => sim.categories.owner_release_authorization.state === 'not_authorized');
  await probe('gs.statement', () => sim.statement === 'Presence of a local artifact does not satisfy an external release gate.');
  await probe('gs.no_score_fields', () => !keys(sim).some((k) => /score|green|recommend|ready|readiness|pass/i.test(k)));
  await probe('gs.missing_artifact_reported', () => GS.simulateGate({ drift_record: { present: false } }).categories.drift_record.state === 'missing_local_artifact');
  await probe('gs.unassessed_reported', () => GS.simulateGate({}).categories.version_identity.state === 'not_assessed');
  await probe('gs.eighteen_categories', () => Object.keys(sim.categories).length === 18);

  // ---- corpus admission
  const meta = clone(ctx.fixtureMeta);
  const adm = (patch) => CP.admitFixture(Object.assign(clone(meta), patch), { knowledgeIds: new Set(['RKB-001']), coverageGaps: new Set(['CG-01']), existingIds: new Set() }).length > 0;
  await probe('cp.valid_admitted', () => CP.admitFixture(clone(meta), { knowledgeIds: new Set(['RKB-001']), coverageGaps: new Set(['CG-01']), existingIds: new Set() }).length === 0);
  await probe('cp.non_synthetic_rejected', () => adm({ authoring_source: 'customer_supplied' }));
  await probe('cp.untraced_trigger_rejected', () => adm({ trigger: 'RKB-777' }));
  await probe('cp.altered_independence_rejected', () => adm({ independence_statement: 'Independent reference material.' }));
  await probe('cp.excluded_without_refusal_rejected', () => adm({ scope_classification: 'excluded_domain', expected_refusal: 'none' }));
  await probe('cp.duplicate_id_rejected', () => CP.admitFixture(clone(meta), { knowledgeIds: new Set(['RKB-001']), coverageGaps: new Set(), existingIds: new Set([meta.fixture_id]) }).length > 0);

  // ---- stability evaluator (including lower-baseline bases)
  const spec = { id: 'S', kind: 'invariant', expected_graph_change: { non_section_types_same: true } };
  await probe('sm.same_graph_as_expected', () => ST.evaluateTransform(spec, G['GC-001'], clone(G['GC-001'])).result === 'as_expected');
  await probe('sm.invariant_status_change_detected', () => { const g = clone(G['GC-001']); setStatus(g, 'identifiable_basis', 'review_required'); return ST.evaluateTransform(spec, G['GC-001'], g).result === 'mismatch'; });
  await probe('sm.lower_base_improvement_detected', () => { const g = clone(G['GC-018']); setStatus(g, 'chronology_integrity', 'supported'); return ST.evaluateTransform(spec, G['GC-018'], g).result === 'mismatch'; });
  await probe('sm.favourable_reported', () => { const g = clone(G['GC-018']); setStatus(g, 'chronology_integrity', 'supported'); return ST.evaluateTransform(spec, G['GC-018'], g).favourable_transitions.length === 1; });
  await probe('sm.invariant_new_refusal_detected', () => { const g = clone(G['GC-001']); g.refusals.push({ code: 'quote_absent', boundary: '' }); return ST.evaluateTransform(spec, G['GC-001'], g).result === 'mismatch'; });
  await probe('sm.limitation_missing_detected', () => { const g = clone(G['GC-001']); g.nodes.find((n) => n.id === 'lim:sufficiency').text = 'Textual presence only: x'; return ST.evaluateTransform(spec, G['GC-001'], g).result === 'mismatch'; });
  await probe('sm.review_route_missing_detected', () => { const g = clone(G['GC-001']); g.edges = g.edges.filter((e) => !(e.from === 'find:reconstructability' && e.type === 'ROUTES_TO_REVIEW')); return ST.evaluateTransform(spec, G['GC-001'], g).result === 'mismatch'; });
  await probe('sm.conflict_change_detected', () => ST.evaluateTransform({ id: 'S', kind: 'changed' }, G['GC-001'], clone(G['GC-004'])).result === 'mismatch');

  // ---- corpus replay comparison (including executable expectations)
  const x = ctx.expected001, x17 = ctx.expected017, g17 = G['AR-017'];
  await probe('cr.exact_match_passes', () => CR.compareCase(G['GC-001'], clone(x)).length === 0 && CR.compareCase(g17, clone(x17)).length === 0);
  await probe('cr.status_mismatch_reported', () => { const e = clone(x); e.statuses.identifiable_basis = 'gap'; return CR.compareCase(G['GC-001'], e).length > 0; });
  await probe('cr.null_expectation_skipped', () => { const e = clone(x); e.refusal_codes = null; e.cc_defects = null; return CR.compareCase(G['GC-001'], e).length === 0; });
  await probe('cr.unsafe_direction_detected', () => { const e = clone(x); e.statuses.identifiable_basis = 'review_required'; return CR.unsafeDirection(G['GC-001'], e).length === 1; });
  await probe('cr.refused_became_proceed_unsafe', () => { const e = clone(x); e.gate_decision = 'refuse'; return CR.unsafeDirection(G['GC-001'], e).some((u) => /became proceed/.test(u)); });
  await probe('cr.limitation_kind_checked', () => { const e = clone(x17); e.limitations.reconstructability = ['presence']; return CR.compareCase(g17, e).some((m) => /^limitations\./.test(m)); });
  await probe('cr.conflict_node_count_checked', () => { const e = clone(x17); e.graph.conflict_nodes = 0; return CR.compareCase(g17, e).some((m) => /graph\.conflict_nodes/.test(m)); });
  await probe('cr.textual_support_count_checked', () => { const e = clone(x17); e.graph.textually_supports_edges = 6; return CR.compareCase(g17, e).some((m) => /graph\.textually_supports_edges/.test(m)); });
  await probe('cr.limitation_kinds_classified', () => JSON.stringify(CR.limitationKinds(g17.nodes.find((n) => n.id === 'lim:reconstructability').text)) === '["conflict","presence"]');

  // ---- run identity
  const okId = ID.runIdentity({ fixtures: [{ fixture_id: 'A', fixture_hash: 'sha256:' + '1'.repeat(64) }], command: 'c', mode: 'local_isolated_copy', clock: CLOCK });
  const idBad = (edit) => { const i = clone(okId); edit(i); return ID.validateRunIdentity(i).length > 0; };
  await probe('id.complete_valid', () => ID.validateRunIdentity(clone(okId)).length === 0);
  await probe('id.missing_field_incomplete', () => ['change_control_sha256', 'baseline_sha256', 'patch_sha256', 'fixture_set_sha256', 'test_command', 'run_id', 'execution_mode', 'clock'].every((k) => idBad((i) => { delete i[k]; })));
  await probe('id.synthetic_marker_required', () => idBad((i) => { i.synthetic_local_only = false; }));
  // Isolating: the marker is flipped and the run id recomputed to match, so only the marker check can catch it.
  await probe('id.synthetic_marker_isolated', () => idBad((i) => { i.synthetic_local_only = false; i.run_id = 'arr_' + ID.sha(ID.canon(Object.assign({}, i, { run_id: undefined, fixtures: undefined }))).slice(7, 31); }));
  await probe('id.run_id_bound', () => idBad((i) => { i.clock = 'other'; }));
  await probe('id.fixture_set_bound', () => idBad((i) => { i.fixtures = [{ fixture_id: 'B', fixture_hash: 'sha256:' + '2'.repeat(64) }]; }));
  await probe('id.mode_restricted', () => idBad((i) => { i.execution_mode = 'production'; }));
  await probe('id.records_carry_identity', () => rec.good && ID.validateRunIdentity(rec.good.identity).length === 0 && rec.good.identity.patch_sha256 === ID.sha(ID.canon(good.isolated_patch)));
  return out;
}

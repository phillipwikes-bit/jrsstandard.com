// JRS PHASE 9: named direct probes and the mutation catalogue.
//
// A probe takes a module set M (the real Phase 9 modules, or a mutated copy) and the shared
// fixtures X, and returns true when the behaviour it names holds. The suite runs every probe on the
// real modules as a direct test. Mutation testing applies one exact-once source change to a copy of
// the modules; the mutation is caught only when a named probe returns false. A mutated copy that
// fails to load is a load failure, which is never counted as a catch.

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const tryThrows = (f) => { try { f(); return false; } catch (e) { return /REFUSED/.test(String(e.message)); } };
const clone = (v) => JSON.parse(JSON.stringify(v));

export function makeProbes(M, X) {
  const { contract: K, dossier: D, controls: CC, decision: DM, protocol: P, rehearsal: R, stability: ST } = M;
  const byId = (id) => X.cases.find((c) => c.packet_id === id);
  const expOf = (id) => X.expectations.find((e) => e.packet_id === id);
  const g = (id) => R.compileCase(byId(id));
  const dossierFor = (id) => { const c = byId(id); return R.blindedPacket(c, g(id)).dossier; };
  const rehash = (d) => { const { dossier_sha256, ...rest } = d; d.dossier_sha256 = D.hashOf(rest); return d; };
  const entry = (o) => Object.assign({ source: 'human', outcome: 'does_not_support_finding', rationale: 'The quoted words concern a different supplier.', reviewer_placeholder: 'REVIEWER-PLACEHOLDER-1', cited_evidence: ['O3'], escalated: false }, o);
  const ids = X.cases.map((c) => c.packet_id);

  return {
    // Textual presence cannot produce a semantic-support determination.
    presence_not_support: () => {
      if (K.EVIDENCE_LAYERS.find((l) => l.layer === 'semantic_support').determined_by !== 'Human reviewer only') return false;
      if (!/not semantic support/.test(K.PRESENCE_STATEMENT)) return false;
      return ['R9-QNS-01', 'R9-QNS-02', 'R9-QNS-03', 'R9-QNS-08'].every((id) => { const d = dossierFor(id);
        return d.engine_result.status === 'supported' && d.quotations.some((q) => q.verified) && d.presence_statement === K.PRESENCE_STATEMENT && d.reviewer_response.outcome === null; });
    },
    derive_outcome_refuses: () => tryThrows(() => DM.deriveOutcome(dossierFor('R9-QNS-01'))),
    // No reviewer outcome can be auto-filled.
    dossier_response_unfilled: () => ids.every((id) => { const r = dossierFor(id).reviewer_response; return r.outcome === null && r.rationale === null && r.cited_evidence === null && r.confidence === null && r.reviewer_placeholder === null; }),
    validate_flags_prefill: () => { const d = dossierFor('R9-QNS-01'); d.reviewer_response.outcome = 'supports_finding'; rehash(d); return D.validateDossier(d).includes('reviewer response pre-filled'); },
    entry_rejects_system_source: () => ['engine', 'auto', 'model', 'system', undefined].every((s) => DM.validateReviewerEntry(entry({ source: s })).length > 0) && DM.validateReviewerEntry(entry({})).length === 0,
    entry_requires_cited_words: () => DM.validateReviewerEntry(entry({ outcome: 'supports_finding', cited_evidence: [] })).includes('supports_finding without cited words'),
    entry_requires_escalation: () => DM.validateReviewerEntry(entry({ outcome: 'ambiguous', escalated: false })).includes('escalating outcome not escalated'),
    entry_requires_placeholder: () => DM.validateReviewerEntry(entry({ reviewer_placeholder: 'Jane Example' })).includes('reviewer identity must be a placeholder'),
    // Disagreement cannot modify Engine output.
    disagreement_preserves_engine: () => { const graph = g('R9-QNS-01'); const before = JSON.stringify(graph); const d = R.blindedPacket(byId('R9-QNS-01'), graph).dossier;
      const lr = P.createLearningRecord(d, entry({}), graph);
      return JSON.stringify(graph) === before && lr.applied === false && lr.status === 'candidate_only' && lr.engine_graph_sha256 === graph.identity.graph_sha256 && lr.disagreement === true; },
    learning_requires_exact_graph: () => tryThrows(() => P.createLearningRecord(dossierFor('R9-QNS-01'), entry({}), g('R9-QNS-02'))),
    apply_to_engine_refuses: () => tryThrows(() => P.applyToEngine(g('R9-QNS-01'))),
    // Incomplete evidence routes to escalation.
    incomplete_escalates: () => { const a = dossierFor('R9-SUF-03'), b = dossierFor('R9-SUF-04'), c = dossierFor('R9-CON-01');
      return a.escalation.required && same(a.escalation.triggers.map((t) => t.id), ['ET1', 'ET3']) && b.escalation.required && same(b.escalation.triggers.map((t) => t.id), ['ET1', 'ET3'])
        && c.escalation.required && same(c.escalation.triggers.map((t) => t.id), ['ET2']) && a.escalation.abstention_available === true; },
    escalation_rule_direct: () => same(D.escalationFor('x', 'supported', [{ verified: false }], [], false), ['ET1']) && same(D.escalationFor('x', 'supported', [{ verified: true }], [{ affects: ['x'] }], false), ['ET2'])
      && same(D.escalationFor('x', 'not_assessed', [{ verified: true }], [], false), ['ET3']) && same(D.escalationFor('x', 'supported', [{ verified: true }], [], false), []),
    validate_flags_escalation_drift: () => { const d = dossierFor('R9-CON-01'); d.escalation = { required: false, triggers: [], abstention_available: true }; rehash(d); return D.validateDossier(d).includes('escalation does not follow the Engine output'); },
    // The dossier cannot improve an Engine outcome.
    dossier_matches_engine: () => ids.every((id) => { const graph = g(id); const d = R.blindedPacket(byId(id), graph).dossier; return D.dossierNotMoreFavourable(d, graph) && d.engine_result.status === graph.findings.find((f) => f.condition_id === d.condition.condition_id).status; }),
    not_more_favourable_detects: () => { const graph = g('R9-NEG-01'); const d = R.blindedPacket(byId('R9-NEG-01'), graph).dossier; d.engine_result.status = 'supported'; return D.dossierNotMoreFavourable(d, graph) === false; },
    // Each control can be independently disabled and detected.
    controls_disable_detected: () => CC.CONTROL_IDS.length === 8 && CC.CONTROL_IDS.every((id) => CC.validateControls(CC.CONTROLS, CC.CONTROL_IDS.filter((x) => x !== id)).includes('control disabled: ' + id))
      && CC.validateControls().length === 0,
    controls_removal_detected: () => CC.CONTROL_IDS.every((id) => CC.validateControls(CC.CONTROLS.filter((c) => c.id !== id)).includes('control missing: ' + id)),
    controls_directive_detected: () => { const cs = clone(CC.CONTROLS); cs[0].prompt = 'The quotation clearly supports the finding, so mark it as supported?'; return CC.validateControls(cs).includes('control directs a result: ' + cs[0].id); },
    controls_question_required: () => { const cs = clone(CC.CONTROLS); cs[2].prompt = 'Check the negation.'; return CC.validateControls(cs).includes('control is not phrased as a question: ' + cs[2].id); },
    dossier_lists_controls: () => same(dossierFor('R9-QNS-01').cognitive_controls, CC.CONTROL_IDS) && D.validateDossier(Object.assign(dossierFor('R9-QNS-01'))).length === 0,
    // Sealed expectations reject post-seal alteration.
    seal_verifies: () => R.verifySeal(X.seal, X.cases, X.expectations).length === 0,
    seal_rejects_expectation_change: () => { const e = clone(X.expectations); e[0].expected_class = e[0].expected_class === 'supports_finding' ? 'ambiguous' : 'supports_finding'; return R.verifySeal(X.seal, X.cases, e).includes('sealed expectations altered after sealing'); },
    seal_rejects_case_change: () => { const c = clone(X.cases); c[3].record_text += 'x'; return R.verifySeal(X.seal, c, X.expectations).some((p) => p.startsWith('case altered after sealing')); },
    seal_rejects_record_change: () => { const s = clone(X.seal); s.case_count = 49; return R.verifySeal(s, X.cases, X.expectations).includes('seal record altered'); },
    // Validation of the dossier contract.
    validate_flags_proof: () => { const d = dossierFor('R9-QNS-02'); d.engine_result.statement = 'The quotation proves the finding.'; rehash(d); return D.validateDossier(d).includes('dossier asserts that a quotation proves the finding'); },
    validate_flags_approval: () => { const d = dossierFor('R9-QNS-02'); d.recommendation = 'grant'; rehash(d); return D.validateDossier(d).some((p) => /approval, recommendation or legal conclusion/.test(p)); },
    validate_flags_hash: () => { const d = dossierFor('R9-QNS-02'); d.engine_result.reasons = []; return D.validateDossier(d).includes('dossier hash mismatch'); },
    validate_flags_offsets: () => { const d = dossierFor('R9-QNS-02'); d.quotations[0].start = null; rehash(d); return D.validateDossier(d).includes('verified quotation without offsets or section'); },
    validate_flags_presence: () => { const d = dossierFor('R9-QNS-02'); d.presence_statement = 'The quotation supports the finding.'; rehash(d); return D.validateDossier(d).includes('presence-is-not-support statement missing or altered'); },
    validate_flags_outcomes: () => { const d = dossierFor('R9-QNS-02'); d.admissible_outcomes = d.admissible_outcomes.slice(0, 2); rehash(d); return D.validateDossier(d).includes('admissible outcomes altered'); },
    validate_flags_abstention: () => { const d = dossierFor('R9-QNS-02'); d.escalation.abstention_available = false; rehash(d); return D.validateDossier(d).includes('abstention unavailable'); },
    dossiers_valid: () => ids.every((id) => D.validateDossier(dossierFor(id)).length === 0) && dossierFor('R9-SUF-03').admissible_outcomes.length === 7 && dossierFor('R9-SUF-03').escalation.abstention_available === true,
    synthetic_only: () => tryThrows(() => D.buildDossiers(g('R9-QNS-01'), { record_id: 'x', synthetic: false })) && tryThrows(() => D.buildDossiers(g('R9-QNS-01'), {})),
    // Decision model.
    decision_model_valid: () => DM.validateDecisionModel().length === 0 && DM.DECISION_MODEL.length === 7 && same(DM.DECISION_MODEL.map((m) => m.outcome), K.OUTCOMES),
    decision_model_detects_collapse: () => DM.validateDecisionModel(DM.DECISION_MODEL.slice(1)).includes('outcome set altered'),
    // Protocols are execution-disabled.
    protocol_disabled: () => P.EXECUTION_ENABLED === false && P.DUAL_REVIEW_PROTOCOL.execution_enabled === false && tryThrows(() => P.runDualReview()),
    adjudication_rule: () => P.needsAdjudication(entry({}), entry({})) === false && P.needsAdjudication(entry({}), entry({ outcome: 'supports_finding' })) === true
      && P.needsAdjudication(entry({ outcome: 'ambiguous', escalated: true }), entry({ outcome: 'ambiguous', escalated: true })) === true && tryThrows(() => P.needsAdjudication(entry({ source: 'engine' }), entry({}))),
    measures_not_measurable: () => P.MEASUREMENT_PLAN.length === 8 && P.MEASUREMENT_PLAN.every((m) => m.status === 'not_measurable_locally' && m.value === null) && tryThrows(() => P.computeMeasure('RM-02')),
    // Rehearsal schema and blinding.
    route_rule: () => R.routeAppropriateness('supports_finding', 'supported', true) === 'appropriate' && R.routeAppropriateness('supports_finding', 'review_required', true) === 'conservative_over_review'
      && R.routeAppropriateness('does_not_support_finding', 'supported', true) === 'favourable_status_reliant_on_human_review' && R.routeAppropriateness('ambiguous', 'review_required', true) === 'appropriate'
      && R.routeAppropriateness('supports_finding', 'supported', false) === 'inappropriate_not_routed',
    case_marking: () => X.cases.every((c) => R.validateCase(c).length === 0) && R.validateCase(Object.assign(clone(X.cases[0]), { holdout_eligible: true })).includes('not marked holdout-ineligible')
      && R.validateCase(Object.assign(clone(X.cases[0]), { synthetic: false })).includes('not marked synthetic'),
    packets_blinded: () => ids.every((id) => { const p = R.blindedPacket(byId(id), g(id)); return R.checkBlinding(p).length === 0 && p.packet_id !== id && !('category' in p) && !JSON.stringify(p).includes(id); }),
    blinding_detects_leak: () => { const p = R.blindedPacket(byId('R9-QNS-01'), g('R9-QNS-01')); return R.checkBlinding(Object.assign(clone(p), { category: 'x' })).length > 0 && R.checkBlinding(Object.assign(clone(p), { note: 'R9-QNS-01' })).length > 0; },
    evaluator_matches_first_run: () => { const out = R.evaluateAll(X.cases, X.expectations); return out.results_sha256 === X.firstRun.results_sha256 && out.as_sealed === X.firstRun.as_sealed; },
    evaluator_detects_escalation_mismatch: () => { const e = clone(expOf('R9-CON-01')); e.expected_escalation_triggers = []; return R.evaluateCase(byId('R9-CON-01'), e).checks.escalation_as_sealed !== 'pass'; },
    evaluator_detects_route_mismatch: () => { const e = clone(expOf('R9-QNS-01')); e.expected_route_appropriateness = 'appropriate'; return R.evaluateCase(byId('R9-QNS-01'), e).checks.route_appropriateness_as_sealed !== 'pass'; },
    // Stability: a change that lowers the review burden is detected.
    stability_detects_favourable: () => { const base = byId('R9-CON-01'); const t = { id: 'probe', name: 'remove the conflicting line', base: 'R9-CON-01', make: (c) => Object.assign(c, { record_text: c.record_text.replace('Control note: Weekly review of access logs has not started.\n', '') }) };
      const out = ST.runStability([t], { 'R9-CON-01': base }); return out.results[0].result === 'unexpected' && out.results[0].mismatches.some((m) => m.startsWith('more favourable human-review class')); },
    stability_invariant_holds: () => { const out = ST.runStability(X.transforms, X.bases); return out.total >= 30 && out.as_expected === out.total && out.more_favourable === 0; },
  };
}

// id, file, exact from-string, replacement, probes expected to catch it.
export const MUTATIONS = Object.freeze([
  ['MU-01', 'dossier.mjs', "reviewer_response: { outcome: null,", "reviewer_response: { outcome: f.status === 'supported' ? 'supports_finding' : null,", ['dossier_response_unfilled', 'presence_not_support']],
  ['MU-02', 'dossier.mjs', "if (!quotes.some((q) => q.verified)) t.push('ET1');", "", ['incomplete_escalates', 'escalation_rule_direct']],
  ['MU-03', 'dossier.mjs', "if (conflicts.some((c) => (c.affects || []).includes(condition))) t.push('ET2');", "", ['incomplete_escalates', 'escalation_rule_direct']],
  ['MU-04', 'dossier.mjs', "if (refused || status === 'not_assessed') t.push('ET3');", "", ['incomplete_escalates', 'escalation_rule_direct']],
  ['MU-05', 'dossier.mjs', "engine_result: { status: f.status,", "engine_result: { status: f.status === 'review_required' ? 'supported' : f.status,", ['dossier_matches_engine']],
  ['MU-06', 'dossier.mjs', "presence_statement: PRESENCE_STATEMENT,", "presence_statement: 'The quotation supports the finding.',", ['presence_not_support', 'dossiers_valid']],
  ['MU-07', 'dossier.mjs', "p.push('reviewer response pre-filled');", "void 0;", ['validate_flags_prefill']],
  ['MU-08', 'dossier.mjs', "p.push('dossier asserts that a quotation proves the finding');", "void 0;", ['validate_flags_proof']],
  ['MU-09', 'dossier.mjs', "p.push('dossier converts the Engine result into an approval, recommendation or legal conclusion');", "void 0;", ['validate_flags_approval']],
  ['MU-10', 'dossier.mjs', "if (dossier_sha256 !== hashOf(rest)) p.push('dossier hash mismatch');", "", ['validate_flags_hash']],
  ['MU-11', 'dossier.mjs', "if (!ctx || ctx.synthetic !== true) throw new Error('REFUSED: dossiers are built only from synthetic material in this package');", "", ['synthetic_only']],
  ['MU-12', 'dossier.mjs', "return !!f && d.engine_result.status === f.status &&", "return true || !!f && d.engine_result.status === f.status &&", ['not_more_favourable_detects']],
  ['MU-13', 'dossier.mjs', "p.push('verified quotation without offsets or section');", "void 0;", ['validate_flags_offsets']],
  ['MU-14', 'dossier.mjs', "abstention_available: true },", "abstention_available: triggers.length === 0 },", ['incomplete_escalates', 'dossiers_valid']],
  ['MU-15', 'dossier.mjs', "cognitive_controls: [...CONTROL_IDS],", "cognitive_controls: CONTROL_IDS.slice(1),", ['dossier_lists_controls', 'dossiers_valid']],
  ['MU-16', 'dossier.mjs', "admissible_outcomes: [...OUTCOMES],", "admissible_outcomes: OUTCOMES.slice(0, 2),", ['dossiers_valid']],
  ['MU-17', 'controls.mjs', "if (!enabled.includes(id)) p.push('control disabled: ' + id);", "", ['controls_disable_detected']],
  ['MU-18', 'controls.mjs', "export const isNeutral = (text) => !DIRECTIVE.test(String(text)) && !CLINICAL.test(String(text));", "export const isNeutral = (text) => true;", ['controls_directive_detected']],
  ['MU-19', 'controls.mjs', "if (!/\\?$/.test(c.prompt.trim())) p.push('control is not phrased as a question: ' + id);", "", ['controls_question_required']],
  ['MU-20', 'decision-model.mjs', "export function deriveOutcome() { throw new Error(", "export function deriveOutcome() { return 'supports_finding'; throw new Error(", ['derive_outcome_refuses']],
  ['MU-21', 'decision-model.mjs', "if (!e || e.source !== 'human') p.push('entry not completed by a human reviewer');", "", ['entry_rejects_system_source']],
  ['MU-22', 'decision-model.mjs', "p.push('supports_finding without cited words');", "void 0;", ['entry_requires_cited_words']],
  ['MU-23', 'decision-model.mjs', "p.push('escalating outcome not escalated');", "void 0;", ['entry_requires_escalation']],
  ['MU-24', 'decision-model.mjs', "p.push('reviewer identity must be a placeholder');", "void 0;", ['entry_requires_placeholder']],
  ['MU-25', 'protocol.mjs', "export function applyToEngine() { refuse('applying a learning record to the Engine'); }", "export function applyToEngine(g) { return g; }", ['apply_to_engine_refuses']],
  ['MU-26', 'protocol.mjs', "if (!graph || graph.identity.graph_sha256 !== dossier.engine.graph_sha256) throw", "if (!graph) throw", ['learning_requires_exact_graph']],
  ['MU-27', 'protocol.mjs', "status: 'candidate_only', applied: false,", "status: 'candidate_only', applied: true,", ['disagreement_preserves_engine']],
  ['MU-28', 'protocol.mjs', "return a.outcome !== b.outcome || ESCALATING_OUTCOMES.includes(a.outcome) || ESCALATING_OUTCOMES.includes(b.outcome);", "return a.outcome !== b.outcome;", ['adjudication_rule']],
  ['MU-29', 'protocol.mjs', "export function computeMeasure() { refuse('calculating a reliability measure'); }", "export function computeMeasure() { return 0; }", ['measures_not_measurable']],
  ['MU-30', 'protocol.mjs', "export const EXECUTION_ENABLED = false;", "export const EXECUTION_ENABLED = true;", ['protocol_disabled']],
  ['MU-31', 'protocol.mjs', "status: 'not_measurable_locally', value: null,", "status: 'not_measurable_locally', value: 0,", ['measures_not_measurable']],
  ['MU-32', 'rehearsal-schema.mjs', "p.push('sealed expectations altered after sealing');", "void 0;", ['seal_rejects_expectation_change']],
  ['MU-33', 'rehearsal-schema.mjs', "p.push('case altered after sealing: ' + c.packet_id);", "void 0;", ['seal_rejects_case_change']],
  ['MU-34', 'rehearsal-schema.mjs', "return engineFavourable ? 'favourable_status_reliant_on_human_review' : 'appropriate';", "return 'appropriate';", ['route_rule', 'evaluator_matches_first_run']],
  ['MU-35', 'rehearsal-schema.mjs', "if (c.holdout_eligible !== false) p.push('not marked holdout-ineligible');", "", ['case_marking']],
  ['MU-36', 'rehearsal.mjs', "material: 'synthetic_engineering_fixture', holdout_eligible: false, dossier: d };", "material: 'synthetic_engineering_fixture', holdout_eligible: false, category: c.category, dossier: d };", ['packets_blinded']],
  ['MU-37', 'rehearsal.mjs', "return { packet_id: blindedId(c.packet_id),", "return { packet_id: c.packet_id,", ['packets_blinded']],
  ['MU-38', 'rehearsal.mjs', "add('escalation_as_sealed', JSON.stringify(triggers) === JSON.stringify(exp.expected_escalation_triggers),", "add('escalation_as_sealed', true,", ['evaluator_detects_escalation_mismatch', 'evaluator_matches_first_run']],
  ['MU-39', 'stability.mjs', "if (v1.rank > v0.rank) P.push(", "if (false) P.push(", ['stability_detects_favourable']],
  ['MU-40', 'rehearsal.mjs', "if (LEAK_IDS.test(j)) p.push('packet exposes the unblinded packet identifier');", "", ['blinding_detects_leak']],
]);

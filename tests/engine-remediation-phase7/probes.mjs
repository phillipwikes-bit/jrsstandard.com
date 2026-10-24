// JRS PHASE 7: direct probes and mutations for the v0.3.1 candidate, its rule
// packs, the version mapping and the qualification harness.
//
// M (module namespaces, real or mutated): compile (candidate compiler), packs
// (rule-packs.mjs), runners (tooling/candidate.mjs), qualify (tooling/qualify.mjs).
// X (fixed context, never mutated): the frozen v0.3 compiler, precomputed
// expectations, the sealed scenarios, the real evaluator and the real pack seal.

const clone = (x) => JSON.parse(JSON.stringify(x));
const S = (g) => Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status]));

export function makeProbes(X) {
  const P = [];
  const p = (name, run) => P.push({ name, run });
  const cand = (M, sub, resp, id = 'probe', packs, mode = 'local_mocked') => M.runners.makeRunners(X.v03, M.compile).candidate(sub, resp, mode, id, packs);
  const g = (M, sub, resp, packs) => { const r = cand(M, sub, resp, 'probe', packs); if (r.error) throw new Error(r.error); return r.graph; };
  const base = () => clone(X.baseSubmission);
  const rec = (text) => Object.assign(base(), { record_text: text });
  const conflicts = (gr) => gr.conflicts.map((k) => k.kind).sort();

  // ---------------------------------------------------------------- every sealed Phase 7 scenario
  for (const s of X.scenarios) p('p7.' + s.scenario_id, (M) => { const r = cand(M, X.submissionFor(s), s.candidate_response_text, s.scenario_id, undefined, s.execution_mode); return !r.error && X.evaluateP7(r.graph, s).result === 'as_expected'; });

  // ---------------------------------------------------------------- every existing input, by family, against the sealed expectation
  for (const fam of X.families) p('existing.' + fam, (M) => X.existing.filter((e) => e.family === fam).every((e) => {
    const r = cand(M, e.submission, e.response, e.id, undefined, e.mode);
    if (r.error) return false;
    if (X.universal(r.graph).length) return false;
    if (e.expect.mode === 'base_error') return e.expect.check(r.graph);
    if (e.expect.mode === 'unchanged') return JSON.stringify(X.snapshot(r.graph)) === JSON.stringify(e.expect.snapshot);
    if (JSON.stringify(S(r.graph)) !== JSON.stringify(e.expect.statuses)) return false;
    const gained = conflicts(r.graph).filter((k) => !e.expect.base_conflicts.includes(k));
    if (JSON.stringify(gained) !== JSON.stringify([...e.expect.conflicts_gained].sort())) return false;
    return e.expect.gate !== 'refuse' || X.completeRefusal(r.graph);
  }));

  // ---------------------------------------------------------------- direct rule probes
  const B = X.baseRecord, DEC = X.lines.DEC, AUTH = X.lines.AUTH, CHRON = X.lines.CHRON, REVOKE = X.lines.REVOKE, CTRL = X.lines.CTRL, EXPIRY = X.lines.EXPIRY;
  const once = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('probe target'); return s.replace(a, b); };
  p('d.chr01_action_section_excluded', (M) => !conflicts(g(M, rec(once(B, REVOKE + '\n', REVOKE + '\nFollow-up: Risk assessment refresh completed 2026-04-15.\n')), X.baseResponse)).includes('assessment_after_decision'));
  p('d.chr01_same_day_not_conflict', (M) => !conflicts(g(M, rec(once(B, '2026-03-05 risk assessment', '2026-03-09 risk assessment')), X.baseResponse)).includes('assessment_after_decision'));
  p('d.con_on_state_requires_implemented', (M) => !conflicts(g(M, rec(once(once(B, CTRL, 'Compensating controls: Weekly review of access logs is described in RA-2026-0311 section 5.'), CTRL ? 'Expiry and renewal:' : '', 'Control note: Weekly review of access logs has not started.\nExpiry and renewal:')), X.baseResponse)).includes('control_state_conflict'));
  p('d.con_single_conflict_when_k4', (M) => { const t = once(B, CTRL + '\n', CTRL + '\nControl note: Multi-factor authentication is not yet enabled for supplier accounts.\nControl status: Weekly review of access logs has not started.\n');
    return JSON.stringify(conflicts(g(M, rec(t), X.baseResponse))) === JSON.stringify(['control_state_conflict']); });
  p('d.invalid_dates_ignored', (M) => { const t = once(once(B, 'dated 2026-03-09', 'dated 2026-02-30'), '2026-03-09 board decision', '2026-02-30 board decision'); const gr = g(M, rec(t), X.baseResponse.replace('dated 2026-03-09', 'dated 2026-02-30').replace('2026-03-09 board decision', '2026-02-30 board decision'));
    return gr.cognitive_controls.some((c) => c.defect === 'no_dated_decision') && !conflicts(gr).includes('impossible_sequence'); });
  p('d.renewal_date_not_expiry', (M) => !conflicts(g(M, rec(once(B, EXPIRY, 'Expiry and renewal: Expires 2026-06-07. Renewal by 2026-05-30 requires a new request with an updated risk assessment.')), X.baseResponse)).includes('expiry_date_conflict'));
  p('d.candidate_base_unchanged', (M) => JSON.stringify(X.snapshot(g(M, base(), X.baseResponse))) === JSON.stringify(X.baseSnapshot));

  // Post-stop, owner-authorized test-coverage repairs (2026-10-19): MX-02, MX-40, MX-59, MX-61.
  p('d.chr01_non_risk_assessment_outside_followup_not_conflict', (M) => !conflicts(g(M, rec(once(B, REVOKE + '\n', REVOKE + '\nNote: Access review completed 2026-04-15.\n')), X.baseResponse)).includes('assessment_after_decision'));
  p('d.expiry_between_request_and_decision_is_impossible_sequence', (M) => conflicts(g(M, rec(once(B, 'Expires 2026-06-07.', 'Expires 2026-03-07.')), X.baseResponse)).includes('impossible_sequence'));
  p('d.sufficiency_outcome_reason_and_limitation', (M) => { const gr = g(M, base(), X.baseResponse); const f = gr.findings.find((x) => x.condition_id === 'sufficiency'); const lim = X.snapshot(gr).lims.sufficiency;
    return f.status === 'review_required' && f.reasons.includes('sufficiency_not_determinable_by_engine') && lim.includes('presence') && lim.includes('sufficiency'); });
  // ---------------------------------------------------------------- candidate output validation
  const respWith = (mut) => { const r = JSON.parse(X.baseResponse); mut(r); return JSON.stringify(r, null, 2); };
  const invalidWith = (M, mut, reason) => { const gr = g(M, base(), respWith(mut)); return gr.candidate.valid === false && (!reason || gr.candidate.reason === reason) && Object.values(S(gr)).every((s) => s === 'not_assessed'); };
  p('d.untrusted_field_reason', (M) => invalidWith(M, (r) => { r.observations[0].start_offset = 3; }, 'candidate_supplied_untrusted_field'));
  p('d.duplicate_observation_ids', (M) => invalidWith(M, (r) => { r.observations[1].observation_id = 'O1'; }, 'observation_id_invalid_or_duplicate'));
  p('d.max_observations', (M) => invalidWith(M, (r) => { for (let i = 0; i < 20; i++) r.observations.push(Object.assign({}, r.observations[0], { observation_id: 'X' + i })); }, 'too_many_observations'));
  p('d.contract_version_checked', (M) => invalidWith(M, (r) => { r.contract_version = 'other'; }, 'contract_version_mismatch'));
  p('d.status_vocabulary', (M) => invalidWith(M, (r) => { r.observations[0].proposed_status = 'approved'; }, 'invalid_proposed_status'));

  // ---------------------------------------------------------------- rule-pack validation
  const packs = () => clone(X.packs);
  const resign = (k) => { k.signature = { method: 'sha256-canonical-content-seal', content_sha256: X.contentSeal(k) }; return k; };
  const rejected = (M, set) => { const v = M.packs.validateRulePacks(set); return v.ok === false && v.active.size === 0 && v.problems.length > 0; };
  const refusesWith = (M, set) => { const gr = g(M, base(), X.baseResponse, set); return gr.intake.decision === 'refuse' && gr.refusals.some((r) => r.code === 'rule_pack_rejected') && gr.rule_packs.active_rules.length === 0; };
  p('rp.valid_set_accepted', (M) => { const v = M.packs.validateRulePacks(packs()); return v.ok && v.active.size === 9; });
  p('rp.tampered_rejected', (M) => { const s = packs(); s[0].rules[0].limitation = 'edited after signing'; return rejected(M, s); });
  p('rp.unsigned_rejected', (M) => { const s = packs(); delete s[1].signature; return rejected(M, s); });
  p('rp.invalid_signature_method_or_value_rejected', (M) => { const a = packs(); a[1].signature.method = 'none'; const b = packs(); b[1].signature.content_sha256 = 12345;
    return rejected(M, a) && rejected(M, b); });
  p('rp.version_mismatch_rejected', (M) => { const s = packs(); s[2].candidate_version = '0.3.2-candidate'; resign(s[2]); return rejected(M, s); });
  p('rp.duplicate_pack_id_rejected', (M) => { const s = packs(); const i = s.findIndex((k) => k.pack_id === 'RPK-NEG'); s[i].pack_id = 'RPK-CHR'; resign(s[i]); return rejected(M, s); });
  p('rp.duplicate_rule_rejected', (M) => { const s = packs(); const extra = clone(s.find((k) => k.pack_id === 'RPK-CHR')); extra.pack_id = 'RPK-EXTRA'; extra.rules = [extra.rules[0]]; s.push(resign(extra)); return rejected(M, s); });
  p('rp.incomplete_rejected', (M) => { const s = packs(); delete s[0].rules[0].limitation; resign(s[0]); return rejected(M, s); });
  p('rp.unknown_rule_rejected', (M) => { const s = packs(); s[0].rules[0].rule_id = 'RP-XYZ-99'; resign(s[0]); return rejected(M, s); });
  p('rp.unsafe_outcome_rejected', (M) => { const s = packs(); s[0].rules[0].expected_safe_outcome = 'auto_release'; resign(s[0]); return rejected(M, s); });
  p('rp.designation_field_rejected', (M) => { const s = packs(); s[0].rules[0].auto_approve = true; resign(s[0]); return rejected(M, s); });
  p('rp.rejected_set_activates_nothing', (M) => { const s = packs(); s[0].rules[0].limitation = 'edited'; const v = M.packs.validateRulePacks(s); return v.active.size === 0 && v.identity.length === 0; });
  p('rp.empty_set_refuses', (M) => refusesWith(M, []));
  p('rp.compile_refuses_on_invalid_set', (M) => { const s = packs(); s[0].rules[0].limitation = 'edited'; return refusesWith(M, s); });

  // ---------------------------------------------------------------- qualification harness
  const Q = (M, base1, cand1, spec) => M.qualify.qualifyOne('probe', { graph: base1, error: null }, { graph: cand1, error: null }, spec);
  const G0 = () => clone(X.gc001.base), G1 = () => clone(X.gc001.cand);
  p('q.unchanged_accepted', (M) => Q(M, G0(), G1(), { mode: 'unchanged' }).classification === 'no_behavioral_difference');
  p('q.unchanged_difference_flagged', (M) => { const c = G1(); c.findings[0].status = 'review_required'; c.nodes.find((n) => n.id === 'find:' + c.findings[0].condition_id).status = 'review_required';
    return Q(M, G0(), c, { mode: 'unchanged' }).classification !== 'no_behavioral_difference'; });
  p('q.intended_accepted', (M) => Q(M, clone(X.chr01.base), clone(X.chr01.cand), { mode: 'intended', rules: ['RP-CHR-01'], statuses: S(X.chr01.cand), conflicts_gained: ['assessment_after_decision'] }).classification === 'intended_safe_degradation');
  p('q.bad_findings_flagged', (M) => { const c = clone(X.chr01.cand); c.edges = c.edges.filter((e) => !(e.type === 'LIMITS' && e.to === 'find:reconstructability'));
    return Q(M, clone(X.chr01.base), c, { mode: 'intended', rules: ['RP-CHR-01'], statuses: S(X.chr01.cand), conflicts_gained: ['assessment_after_decision'] }).classification !== 'intended_safe_degradation'; });
  p('q.statuses_checked', (M) => Q(M, G0(), G1(), { mode: 'intended', rules: ['RP-CHR-01'], statuses: Object.assign(S(X.gc001.cand), { chronology_integrity: 'review_required' }), conflicts_gained: [] }).classification !== 'intended_safe_degradation');
  p('q.conflicts_checked', (M) => Q(M, G0(), G1(), { mode: 'intended', rules: ['RP-CHR-01'], statuses: S(X.gc001.cand), conflicts_gained: ['assessment_after_decision'] }).classification !== 'intended_safe_degradation');
  p('q.complete_refusal_required', (M) => Q(M, G0(), G1(), { mode: 'intended', rules: ['RP-SCO-01'], statuses: S(X.gc001.cand), conflicts_gained: [] }).classification !== 'intended_refusal');
  p('q.base_error_requires_mode', (M) => M.qualify.qualifyOne('probe', { graph: null, error: 'x' }, { graph: G1(), error: null }, { mode: 'unchanged' }).classification === 'unintended_regression');
  p('q.candidate_error_flagged', (M) => M.qualify.qualifyOne('probe', { graph: G0(), error: null }, { graph: null, error: 'x' }, { mode: 'unchanged' }).classification === 'unintended_regression');
  p('q.version_mapping_exact', (M) => { const s = base(); s.declared_versions.compiler_version = '0.2.0-local'; return M.runners.forCandidate(s).declared_versions.compiler_version === '0.2.0-local'
    && M.runners.forCandidate(base()).declared_versions.compiler_version === '0.3.1-candidate'; });
  return P;
}

// [id, repo-relative file, exact text, replacement, area]. Each text must occur exactly once in its file.
const CD = 'lib/engine-evidence-graph-v0.3.1-candidate/';
const TL = 'research/engine-remediation-phase7-2026-10-19/tooling/';
export const MUTATIONS = [
  ['MX-01', CD + 'contradictions.mjs', "if (rules.has('RP-CHR-01') && fd) {", 'if (false && fd) {', 'rule trigger: RP-CHR-01'],
  ['MX-02', CD + 'contradictions.mjs', "/\\brisk assessment\\b/i.test(e.text) && ", '', 'rule trigger: RP-CHR-01'],
  ['MX-03', CD + 'contradictions.mjs', "roleOf(e.section) !== 'action' && ", '', 'rule trigger: RP-CHR-01'],
  ['MX-04', CD + 'contradictions.mjs', 'e.date > fd.date', 'e.date >= fd.date', 'date parsing and date-role logic'],
  ['MX-05', CD + 'contradictions.mjs', "if (rules.has('RP-CHR-02')) {", 'if (false) {', 'rule trigger: RP-CHR-02'],
  ['MX-06', CD + 'contradictions.mjs', "if (ex.length > 1) add('expiry_date_conflict'", "if (ex.length > 2) add('expiry_date_conflict'", 'rule trigger: RP-CHR-02'],
  ['MX-07', CD + 'contradictions.mjs', ".map((e) => [e.date, e])).values()];\n    if (ex.length", ".map((e) => [e.start, e])).values()];\n    if (ex.length", 'rule trigger: RP-CHR-02'],
  ['MX-08', CD + 'conditions.mjs', "if (rules.has('RP-CHR-03') && !events.some((e) => e.role === 'decision'))", 'if (false)', 'rule trigger: RP-CHR-03'],
  ['MX-09', CD + 'conditions.mjs', "!events.some((e) => e.role === 'decision')) r.visible_gaps.push('no_dated_decision')", "!events.some((e) => e.role === 'request')) r.visible_gaps.push('no_dated_decision')", 'rule trigger: RP-CHR-03'],
  ['MX-10', CD + 'contradictions.mjs', "if (rules.has('RP-CHR-04') && fd && fe) {", 'if (false) {', 'rule trigger: RP-CHR-04'],
  ['MX-11', CD + 'contradictions.mjs', 'if (Math.abs(days - n) > 1)', 'if (Math.abs(days - n) > 0)', 'rule trigger: RP-CHR-04'],
  ['MX-12', CD + 'contradictions.mjs', 'if (Math.abs(days - n) > 1)', 'if (Math.abs(days - n) > 100)', 'rule trigger: RP-CHR-04'],
  ['MX-13', CD + 'contradictions.mjs', 'const DURATION = /\\bfor (\\d{1,4}) days?\\b/i;', 'const DURATION = /\\bfor (\\d{1,4}) weeks?\\b/i;', 'date parsing and date-role logic'],
  ['MX-14', CD + 'conditions.mjs', "rules.has('RP-NEG-01') && e.assertion_type === 'stated_rationale'", "false && e.assertion_type === 'stated_rationale'", 'rule trigger: RP-NEG-01'],
  ['MX-15', CD + 'conditions.mjs', '(?:[A-Za-z]+\\s+){0,2}?', '(?:[A-Za-z]+\\s+){0,0}?', 'negation handling'],
  ['MX-16', CD + 'conditions.mjs', '(?:not|no|never|without)\\s+', '(?:not|never|without)\\s+', 'negation handling'],
  ['MX-17', CD + 'conditions.mjs', '(?:need|needs|needed|require|requires|required|because|based on)\\b/i', '(?:require|requires|required|based on)\\b/i', 'negation handling'],
  ['MX-18', CD + 'conditions.mjs', "e.assertion_type) && !negated(e));", 'e.assertion_type));', 'negation handling'],
  ['MX-19', CD + 'compiler.mjs', "else if (rules.has('RP-EVL-01') && LINKED_SECTION_ROLES[c]", 'else if (false && LINKED_SECTION_ROLES[c]', 'rule trigger: RP-EVL-01'],
  ['MX-20', CD + 'compiler.mjs', "identifiable_basis: ['authority', 'basis'],", "identifiable_basis: ['authority', 'basis', 'controls'],", 'rule trigger: RP-EVL-01'],
  ['MX-21', CD + 'compiler.mjs', "'decision', 'expiry'], reasoning_traceability", "'decision', 'expiry', 'action'], reasoning_traceability", 'rule trigger: RP-EVL-01'],
  ['MX-22', CD + 'compiler.mjs', "reasoning_traceability: ['basis'] });", "reasoning_traceability: ['basis', 'expiry', 'risk'] });", 'rule trigger: RP-EVL-01'],
  ['MX-23', CD + 'compiler.mjs', "chronology_integrity: ['chronology', 'request', 'authority', 'decision', 'expiry']", "chronology_integrity: ['chronology', 'request', 'decision', 'expiry']", 'rule trigger: RP-EVL-01'],
  ['MX-24', CD + 'compiler.mjs', 'span_id: sp, section: r.location.section });', 'span_id: sp, section: null });', 'rule trigger: RP-EVL-01'],
  ['MX-25', CD + 'contradictions.mjs', "if (rules.has('RP-CON-01') && !controlConflict) {", 'if (false) {', 'rule trigger: RP-CON-01'],
  ['MX-26', CD + 'contradictions.mjs', 'review of (?:the )?(?:access )?logs|', '', 'rule trigger: RP-CON-01'],
  ['MX-27', CD + 'contradictions.mjs', 'const NOT_STARTED = /\\b(?:has not started|not started|has not begun|not begun)\\b/i;', 'const NOT_STARTED = /\\b(?:never started)\\b/i;', 'rule trigger: RP-CON-01'],
  ['MX-28', CD + 'contradictions.mjs', 'LOG_CONCEPT.test(c.text) && IMPLEMENTED.test(c.text) && !offState(c)', 'LOG_CONCEPT.test(c.text) && !offState(c)', 'rule trigger: RP-CON-01'],
  ['MX-29', CD + 'contradictions.mjs', "&& !controlConflict) {", '&& true) {', 'contradiction detection'],
  ['MX-30', CD + 'scope.mjs', "(rules.has('RP-SCO-01') ? [...REGULATED, ['employment', REWORDED_EMPLOYMENT]] : REGULATED)", 'REGULATED', 'rule trigger: RP-SCO-01'],
  ['MX-31', CD + 'scope.mjs', '(?![-\\s]+(?:queue|queues|scheduler|runner|title|description|code|reference|log|logs))', '', 'rule trigger: RP-SCO-01'],
  ['MX-32', CD + 'scope.mjs', '(?:keeps?|lose|loses|lost)\\s+', '(?:keeps?|lost)\\s+', 'rule trigger: RP-SCO-01'],
  ['MX-33', CD + 'assertions.mjs', "? 'attributed_purpose' : cat", "? 'motive' : cat", 'rule trigger: RP-STR-01'],
  ['MX-34', CD + 'assertions.mjs', "rules && rules.has('RP-STR-01')", "rules && rules.has('RP-STR-99')", 'rule trigger: RP-STR-01'],
  ['MX-35', CD + 'record.mjs', 'if (validDate(m[1], m[2], m[3])) out.push(', 'out.push(', 'date parsing and date-role logic'],
  ['MX-36', CD + 'record.mjs', "(s.role === 'expiry' && !/\\brenew/i.test(c.text))", "(s.role === 'expiry')", 'date parsing and date-role logic'],
  ['MX-37', CD + 'record.mjs', "else if (/\\b(?:assessment|completed)\\b/i.test(c.text)) role = 'assessment';", "else if (/\\b(?:evaluation)\\b/i.test(c.text)) role = 'assessment';", 'date parsing and date-role logic'],
  ['MX-38', CD + 'contradictions.mjs', "const first = (role) => events.filter((e) => e.role === role).sort((a, b) => a.start - b.start)[0];", "const first = (role) => events.filter((e) => e.role === role).sort((a, b) => b.start - a.start)[0];", 'date parsing and date-role logic'],
  ['MX-39', CD + 'contradictions.mjs', "if (distinct.length > 1) add('decision_date_conflict'", "if (distinct.length > 2) add('decision_date_conflict'", 'contradiction detection'],
  ['MX-40', CD + 'contradictions.mjs', "const pairs = [['request', 'decision'], ['decision', 'expiry'], ['request', 'expiry'], ['assessment', 'expiry']];", "const pairs = [['request', 'decision'], ['request', 'expiry'], ['assessment', 'expiry']];", 'contradiction detection'],
  ['MX-41', CD + 'contradictions.mjs', "if (ap && pe) add('authority_state_conflict'", "if (false) add('authority_state_conflict'", 'contradiction detection'],
  ['MX-42', CD + 'contradictions.mjs', "if (lo && op) add('risk_state_conflict'", "if (false) add('risk_state_conflict'", 'contradiction detection'],
  ['MX-43', CD + 'contradictions.mjs', 'if (value(vals[i]) !== value(vals[j])) {', 'if (false) {', 'contradiction detection'],
  ['MX-44', CD + 'response.mjs', "if (Object.keys(o).some((k) => UNTRUSTED_FIELDS.includes(k))) return fail(", 'if (false) return fail(', 'candidate output validation'],
  ['MX-45', CD + 'response.mjs', ' || ids.has(o.observation_id)) return fail(', ') return fail(', 'candidate output validation'],
  ['MX-46', CD + 'response.mjs', 'if (v.observations.length > MAX_OBSERVATIONS) return fail(', 'if (false) return fail(', 'candidate output validation'],
  ['MX-47', CD + 'response.mjs', 'if (v.contract_version !== CONTRACT_VERSION) return fail(', 'if (false) return fail(', 'candidate output validation'],
  ['MX-48', CD + 'response.mjs', 'if (!STATUSES.includes(o.proposed_status)) return fail(', 'if (false) return fail(', 'candidate output validation'],
  ['MX-49', CD + 'scope.mjs', "if (m) { seen.add(domain); add('excluded_domain_content', 'refuse',", "if (m) { seen.add(domain); add('excluded_domain_content', 'escalate',", 'refusal preservation'],
  ['MX-50', CD + 'compiler.mjs', "if (intake.decision !== 'proceed') {", "if (intake.decision === 'refuse') {", 'refusal preservation'],
  ['MX-51', CD + 'compiler.mjs', "if (status === 'not_assessed') refusal(reasons[0]", "if (false) refusal(reasons[0]", 'refusal preservation'],
  ['MX-52', CD + 'scope.mjs', "if (rulePackProblems.length) add('rule_pack_rejected'", "if (false) add('rule_pack_rejected'", 'refusal preservation'],
  ['MX-53', CD + 'scope.mjs', 'if (dv[k] !== v) add(', 'if (false) add(', 'version and hash mismatches'],
  ['MX-54', CD + 'scope.mjs', "if (fi !== undefined && (!fi || typeof fi !== 'object' || fi.fixture_hash !== computedFixtureHash)) add(", 'if (false) add(', 'version and hash mismatches'],
  ['MX-55', CD + 'compiler.mjs', 'const lims = [LIMITATIONS.presence];', 'const lims = [];', 'limitation preservation'],
  ['MX-56', CD + 'compiler.mjs', 'if (conflictAffects[c].length) lims.push(LIMITATIONS.conflict);', '', 'limitation preservation'],
  ['MX-57', CD + 'compiler.mjs', "if (risk.record_instruction_risk === 'detected') lims.push(LIMITATIONS.instruction);", '', 'limitation preservation'],
  ['MX-58', CD + 'compiler.mjs', "    edge('ROUTES_TO_REVIEW', 'find:' + c, 'review');\n  };", '  };', 'limitation preservation'],
  ['MX-59', CD + 'compiler.mjs', "if (c === 'sufficiency') { status = 'review_required';", "if (false) { status = 'review_required';", 'limitation preservation'],
  ['MX-60', CD + 'rule-packs.mjs', 'else if (k.signature.content_sha256 !== contentSeal(k)) p.push(', 'else if (false) p.push(', 'rule-pack validation'],
  ['MX-61', CD + 'rule-packs.mjs', "typeof k.signature.content_sha256 !== 'string') p.push(at + ': unsigned');", "typeof k.signature.content_sha256 !== 'string') p.length;", 'rule-pack validation'],
  ['MX-62', CD + 'rule-packs.mjs', 'if (k.candidate_version !== COMPILER_VERSION) p.push(', 'if (false) p.push(', 'version and hash mismatches'],
  ['MX-63', CD + 'rule-packs.mjs', "if (packIds.has(k.pack_id)) p.push(", 'if (false) p.push(', 'rule-pack validation'],
  ['MX-64', CD + 'rule-packs.mjs', 'if (ruleIds.has(rid)) p.push(', 'if (false) p.push(', 'rule-pack validation'],
  ['MX-65', CD + 'rule-packs.mjs', 'for (const f of RULE_FIELDS) if (', 'for (const f of []) if (', 'rule-pack validation'],
  ['MX-66', CD + 'rule-packs.mjs', 'if (!IMPLEMENTED_RULES.includes(rid)) p.push(', 'if (false) p.push(', 'rule-pack validation'],
  ['MX-67', CD + 'rule-packs.mjs', 'if (!SAFE_OUTCOMES.includes(r.expected_safe_outcome)) p.push(', 'if (false) p.push(', 'rule-pack validation'],
  ['MX-68', CD + 'rule-packs.mjs', 'for (const f of Object.keys(r)) {', 'for (const f of []) {', 'rule-pack validation'],
  ['MX-69', CD + 'rule-packs.mjs', 'active: ok ? ruleIds : new Set()', 'active: ruleIds', 'rule-pack validation'],
  ['MX-70', CD + 'rule-packs.mjs', "return { ok: false, problems: ['no rule packs supplied']", "return { ok: true, problems: []", 'rule-pack validation'],
  ['MX-71', TL + 'qualify.mjs', "classification: INV.includes(diff.verdict) ? 'no_behavioral_difference' : failureClass(diff.findings)", "classification: 'no_behavioral_difference'", 'baseline comparison'],
  ['MX-72', TL + 'qualify.mjs', 'const bad = diff.findings.filter((f) => f.fail_closed || !OK_CLASSES.includes(f.class));', 'const bad = [];', 'baseline comparison'],
  ['MX-73', TL + 'qualify.mjs', 'if (spec.statuses && JSON.stringify(out.candidate_statuses) !== JSON.stringify(spec.statuses)) P.push(', 'if (false) P.push(', 'baseline comparison'],
  ['MX-74', TL + 'qualify.mjs', 'if (spec.conflicts_gained && JSON.stringify(', 'if (false && JSON.stringify(', 'baseline comparison'],
  ['MX-75', TL + 'qualify.mjs', "if (!completeRefusal(cand.graph)) P.push(", 'if (false) P.push(', 'baseline comparison'],
  ['MX-76', TL + 'qualify.mjs', "if (spec.mode !== 'base_error') return Object.assign(out, { classification: 'unintended_regression'", "if (false) return Object.assign(out, { classification: 'unintended_regression'", 'baseline comparison'],
  ['MX-77', TL + 'qualify.mjs', "if (cand.error) return Object.assign(out, { classification: 'unintended_regression'", "if (false) return Object.assign(out, { classification: 'unintended_regression'", 'baseline comparison'],
  ['MX-78', TL + 'qualify.mjs', "const VERSION = { from: '0.3.0-local', to: '0.3.1-candidate' };", "const VERSION = { from: '0.3.0-local', to: '9.9.9' };", 'version and hash mismatches'],
  ['MX-79', TL + 'candidate.mjs', 's.declared_versions.compiler_version === FROM) s.declared_versions', 'true) s.declared_versions', 'version and hash mismatches'],
];

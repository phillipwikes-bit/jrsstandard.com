// JRS ENGINE RELIABILITY 0.6.0-local: direct probes.
//
// Each probe exercises one control of the reliability framework through the
// module namespaces it is given (M), so the same probes run against the real
// modules and against every mutated copy. A probe returns true when the control
// holds. Graphs come from the frozen v0.3 compiler and are cloned before any
// probe damages them.

const clone = (x) => JSON.parse(JSON.stringify(x));
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };

export function makeProbes(ctx) {
  const G = ctx.graphs, SC = ctx.scenarios, LIMS = ctx.limitations;
  const rec = (M, g, id = 'S') => M.baseline.recordFromGraph(g, { scenarioId: id, pkg: 'phase6-library' });
  const fix = (M, r) => Object.assign(r, M.differ.recomputeHashes(r));
  const cls = (r) => r.findings.map((f) => f.class);
  const fc = (r) => r.verdict === 'fail_closed';
  const mod = (M, g, change, ctxArg) => { const a = rec(M, g), b = clone(a); change(b); fix(M, b); return M.differ.compareRecords(a, b, ctxArg); };
  const smallManifest = (M) => M.baseline.buildManifest([rec(M, G.GC001, 'A'), rec(M, G.XD01, 'B'), rec(M, G.RT01, 'C')], { generatedClock: 'X', sources: {} });
  const remHash = (M, m) => { m.manifest_hash = M.canonical.hashOf(Object.assign({}, m, { manifest_hash: undefined })); return m; };
  const entry = (n, extra = {}) => Object.assign({ entry_id: 'P6K-' + String(n).padStart(3, '0'), date: '2026-10-17', origin: 'probe origin ' + n, engine_layer: 'reliability_framework',
    risk_category: 'comparison_integrity', scenarios: ['proposed: probe scenario'], expected_behavior: 'Probe expected behaviour ' + n, limitation: 'Probe limitation text, synthetic and local only.',
    state: 'open', required_regression_suite: 'probe suite', future_independent_evaluation_required: false }, extra);
  const chain = (M, n) => { let t = ''; for (let i = 1; i <= n; i++) t = M.register.appendEntry(t, entry(i)); return t; };
  const lines = (t) => t.trim().split('\n');
  const U = (M, g) => M.library.universalInvariants(g);
  const P = [];
  const p = (name, run) => P.push({ name, run });

  // ---------------------------------------------------------------- differ
  p('d.identical_no_difference', (M) => { const a = rec(M, G.GC001); const r = M.differ.compareRecords(a, clone(a)); return r.verdict === 'no_behavioral_difference' && r.findings.length === 0; });
  p('d.never_applies', (M) => { const a = rec(M, G.GC001); return M.differ.compareRecords(a, clone(a)).applies_changes === false && mod(M, G.GC001, (b) => { b.conditions.reconstructability.status = 'review_required'; }).applies_changes === false; });
  p('d.inputs_not_mutated', (M) => { const a = rec(M, G.GC001), b = clone(a); b.conditions.reconstructability.status = 'review_required'; fix(M, b); const before = JSON.stringify([a, b]); deepFreeze(a); deepFreeze(b);
    const r = M.differ.compareRecords(a, b, { explanation: {} }); return typeof r.verdict === 'string' && JSON.stringify([a, b]) === before; });
  p('d.limitation_kind_loss_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { b.conditions.reasoning_traceability.limitation_kinds = []; }); return fc(r) && cls(r).includes('limitation_removed_or_weakened'); });
  p('d.limitation_absent_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { b.conditions.sufficiency.limitation_present = false; }); return fc(r) && cls(r).includes('limitation_removed_or_weakened'); });
  p('d.review_route_removed_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { b.conditions.identifiable_basis.review_routed = false; }); return fc(r) && cls(r).includes('limitation_removed_or_weakened'); });
  p('d.refusal_loss_fails_closed', (M) => { const r = mod(M, G.XD01, (b) => { b.refusal_codes = []; }); return fc(r) && cls(r).includes('scope_boundary_defect'); });
  p('d.quote_refusal_loss_fails_closed', (M) => { const r = mod(M, G.EQ07, (b) => { b.refusal_codes = b.refusal_codes.filter((c) => c !== 'quote_ambiguous'); }); return fc(r) && cls(r).includes('quote_or_span_integrity_defect'); });
  p('d.low_to_favorable_fails_closed', (M) => { const r = mod(M, G.RT01, (b) => { b.conditions.reasoning_traceability.status = 'supported'; b.conditions.reasoning_traceability.evidence_trail = 1; });
    return fc(r) && r.findings.some((f) => f.class === 'favorable_transition_requiring_human_review' && f.fail_closed); });
  p('d.gap_to_supported_routes_review', (M) => { const r = mod(M, G.SU02, (b) => { b.conditions.sufficiency.status = 'supported'; });
    return r.verdict === 'human_review_required' && cls(r).includes('favorable_transition_requiring_human_review'); });
  p('d.supported_without_trail_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { b.conditions.identifiable_basis.evidence_trail = 0; }); return fc(r); });
  p('d.offset_change_unexplained_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { b.quotes.O1.start += 1; }); return fc(r) && cls(r).includes('quote_or_span_integrity_defect'); });
  p('d.offset_change_explained_presentation', (M) => mod(M, G.GC001, (b) => { b.quotes.O1.start += 1; b.quotes.O1.end += 1; }, { explanation: { offsets_recomputed: 'probe' } }).verdict === 'presentation_only');
  p('d.quote_text_change_unexplained_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { b.quotes.O2.text_sha = 'sha256:' + '2'.repeat(64); }); return fc(r) && cls(r).includes('quote_or_span_integrity_defect'); });
  p('d.quote_text_change_explained_presentation', (M) => mod(M, G.GC001, (b) => { b.quotes.O2.text_sha = 'sha256:' + '2'.repeat(64); }, { explanation: { quote_changes: 'probe' } }).verdict === 'presentation_only');
  p('d.quote_becomes_usable_unexplained_fails_closed', (M) => { const r = mod(M, G.EQ07, (b) => { b.quotes.O1.status = 'verified_unique'; }); return fc(r) && cls(r).includes('quote_or_span_integrity_defect'); });
  p('d.degradation_unexplained_review', (M) => { const r = mod(M, G.GC001, (b) => { b.conditions.reconstructability.status = 'review_required'; });
    return r.verdict === 'human_review_required' && cls(r).includes('unexpected_behavioral_change') && !cls(r).includes('expected_safe_degradation'); });
  p('d.degradation_explained_expected', (M) => { const r = mod(M, G.GC001, (b) => { b.conditions.reconstructability.status = 'review_required'; }, { explanation: { expected_degradation: ['reconstructability'] } });
    return cls(r).includes('expected_safe_degradation') && !cls(r).includes('unexpected_behavioral_change'); });
  p('d.refusal_gained_classified', (M) => { const ch = (b) => { b.refusal_codes = [...b.refusal_codes, 'quote_absent'].sort(); };
    return cls(mod(M, G.GC001, ch, { explanation: { expected_refusal: true } })).includes('expected_refusal') && cls(mod(M, G.GC001, ch)).includes('unexpected_behavioral_change') && !cls(mod(M, G.GC001, ch)).includes('expected_refusal'); });
  p('d.gate_refuse_to_proceed_scope_defect', (M) => { const r = mod(M, G.XD01, (b) => { b.gate = 'proceed'; }); return fc(r) && cls(r).includes('scope_boundary_defect'); });
  p('d.instruction_detection_lost_scope_defect', (M) => { const r = mod(M, G.IN01, (b) => { b.instruction_risk = 'not_detected'; }); return fc(r) && cls(r).includes('scope_boundary_defect'); });
  p('d.candidate_refusal_lost_scope_defect', (M) => { const r = mod(M, G.IN03, (b) => { b.candidate_valid = true; }); return fc(r) && cls(r).includes('scope_boundary_defect'); });
  p('d.version_mismatch_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { b.package_version = '9.9.9-local'; }); return fc(r) && cls(r).includes('unknown_comparison_state'); });
  p('d.version_change_recorded_allowed', (M) => { const a = rec(M, G.GC001); const r = mod(M, G.GC001, (b) => { b.package_version = '9.9.9-local'; }, { expected_version_change: { from: a.package_version, to: '9.9.9-local' } });
    return !cls(r).includes('unknown_comparison_state'); });
  p('d.package_mismatch_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { b.package = 'other-package'; }); return fc(r) && cls(r).includes('unknown_comparison_state'); });
  p('d.malformed_input_fails_closed', (M) => { const a = rec(M, G.GC001); const bad = Object.assign(clone(a), { conditions: [] });
    return [M.differ.compareRecords(null, a), M.differ.compareRecords(a, bad), M.differ.compareRecords(a, 'x')].every((r) => fc(r) && cls(r).includes('unknown_comparison_state')); });
  p('d.missing_condition_fails_closed', (M) => { const r = mod(M, G.GC001, (b) => { delete b.conditions.sufficiency; }); return fc(r) && cls(r).includes('unknown_comparison_state'); });
  p('d.tampered_hash_fails_closed', (M) => { const a = rec(M, G.GC001), b = clone(a); b.behaviour_hash = 'sha256:' + '1'.repeat(64); const r = M.differ.compareRecords(a, b);
    return fc(r) && r.findings.some((f) => f.class === 'unknown_comparison_state' && /hashes do not match/.test(f.detail)); });
  p('d.release_status_change_scope_defect', (M) => { const r = mod(M, G.GC001, (b) => { b.release_status = 'GO'; }); return fc(r) && cls(r).includes('scope_boundary_defect'); });
  p('d.structure_change_classified', (M) => { const ch = (b) => { b.structure.node_types.conflict = (b.structure.node_types.conflict || 0) + 1; };
    return cls(mod(M, G.GC001, ch)).includes('unexpected_behavioral_change') && mod(M, G.GC001, ch, { explanation: { structure_change: 'probe' } }).verdict === 'presentation_only'; });
  p('d.manifest_identical_no_difference', (M) => { const m = smallManifest(M); return M.differ.compareManifests(m, clone(m)).verdict === 'no_behavioral_difference'; });
  p('d.manifest_incomplete_fails_closed', (M) => { const m = smallManifest(M), b = clone(m); b.records.pop(); remHash(M, b); const r = M.differ.compareManifests(m, b);
    return r.verdict === 'fail_closed' && r.findings.some((f) => f.class === 'unknown_comparison_state' && /missing/.test(f.detail)); });
  p('d.manifest_hash_tamper_fails_closed', (M) => { const m = smallManifest(M), b = clone(m); b.counts.total = 999; return M.differ.compareManifests(m, b).verdict === 'fail_closed'; });
  p('d.manifest_format_checked', (M) => { const m = smallManifest(M), b = clone(m); b.baseline_format_version = 'other'; remHash(M, b); return M.differ.compareManifests(m, b).verdict === 'fail_closed'; });
  p('d.manifest_drift_detected', (M) => { const m = smallManifest(M), b = clone(m); const r0 = b.records.find((r) => r.scenario_id === 'C'); r0.conditions.reasoning_traceability.status = 'supported'; r0.conditions.reasoning_traceability.evidence_trail = 1;
    fix(M, r0); remHash(M, b); return M.differ.compareManifests(m, b).verdict === 'fail_closed'; });

  // ---------------------------------------------------------------- register
  p('r.valid_chain', (M) => M.register.validateRegister(chain(M, 3)).length === 0);
  p('r.edited_entry_detected', (M) => { const L = lines(chain(M, 3)); const e = JSON.parse(L[1]); e.expected_behavior = 'edited'; L[1] = JSON.stringify(e); return M.register.validateRegister(L.join('\n') + '\n').some((x) => /entry hash/.test(x)); });
  p('r.rewritten_entry_breaks_chain', (M) => { const L = lines(chain(M, 3)); const e = JSON.parse(L[1]); e.expected_behavior = 'rewritten'; e.entry_hash = M.register.entryHash(e); L[1] = JSON.stringify(e);
    return M.register.validateRegister(L.join('\n') + '\n').some((x) => /chain broken/.test(x)); });
  p('r.deleted_entry_breaks_chain', (M) => { const L = lines(chain(M, 3)); L.splice(1, 1); return M.register.validateRegister(L.join('\n') + '\n').some((x) => /chain broken/.test(x)); });
  p('r.reordered_entries_break_chain', (M) => { const L = lines(chain(M, 3)); [L[1], L[2]] = [L[2], L[1]]; return M.register.validateRegister(L.join('\n') + '\n').length > 0; });
  p('r.append_only_detects_rewrite', (M) => { const before = chain(M, 2); let alt = M.register.appendEntry('', entry(1, { expected_behavior: 'Different first entry' })); alt = M.register.appendEntry(alt, entry(2)); alt = M.register.appendEntry(alt, entry(3));
    return M.register.validateRegister(alt).length === 0 && M.register.isAppendOnly(before, alt) === false && M.register.isAppendOnly(before, M.register.appendEntry(before, entry(3))) === true; });
  p('r.personal_data_refused', (M) => { try { M.register.appendEntry('', entry(1, { origin: 'contact someone@example.org' })); return false; } catch { return true; } });
  p('r.forbidden_status_word_refused', (M) => { try { M.register.appendEntry('', entry(1, { expected_behavior: 'The result is validated.' })); return false; } catch { return true; } });
  p('r.duplicate_id_detected', (M) => { const t = chain(M, 1); const first = JSON.parse(lines(t)[0]); const dup = Object.assign({}, first, { origin: 'second', prev_hash: first.entry_hash }); delete dup.entry_hash; dup.entry_hash = M.register.entryHash(dup);
    return M.register.validateRegister(t + JSON.stringify(dup) + '\n').some((x) => /duplicate entry_id/.test(x)); });
  p('r.supersedes_must_be_earlier', (M) => { try { M.register.appendEntry(chain(M, 1), entry(2, { supersedes: 'P6K-099' })); return false; } catch { return true; } });

  // ---------------------------------------------------------------- library: provenance, seal, evaluation
  const sp02 = () => clone(SC['P6-SP-02']);
  p('l.marker_required', (M) => { const s = sp02(); s.record_text = 'Draft. ' + s.record_text; return M.library.validateScenario(s).some((x) => /synthetic-material marker/.test(x)); });
  p('l.provenance_required', (M) => { const s = sp02(); s.provenance_note = 'Copied from a case file.'; return M.library.validateScenario(s).some((x) => /provenance/.test(x)); });
  p('l.category_prefix_required', (M) => { const s = sp02(); s.scenario_id = 'P6-EQ-99'; return M.library.validateScenario(s).some((x) => /prefix/.test(x)); });
  p('l.known_failure_needs_prediction', (M) => { const s = sp02(); delete s.predicted_failure; return M.library.validateScenario(s).some((x) => /predicted_failure/.test(x)); });
  p('l.personal_data_refused', (M) => { const s = sp02(); s.record_text += 'Contact: someone@example.org\n'; return M.library.validateScenario(s).some((x) => /personal/.test(x)); });
  p('l.real_scenario_admitted', (M) => M.library.validateScenario(sp02()).length === 0);
  p('l.seal_detects_expectation_edit', (M) => { const s = sp02(); const seal = M.library.sealExpectations([s], 't', 'e'); const s2 = clone(s); s2.expected.ceilings.identifiable_basis = 'supported';
    return M.library.verifySeal([s], seal, 'e').length === 0 && M.library.verifySeal([s2], seal, 'e').length > 0; });
  p('l.seal_detects_record_edit', (M) => { const s = sp02(); const seal = M.library.sealExpectations([s], 't', 'e'); const s2 = clone(s); s2.record_text += 'x'; return M.library.verifySeal([s2], seal, 'e').length > 0; });
  p('l.seal_detects_evaluator_change', (M) => { const s = sp02(); const seal = M.library.sealExpectations([s], 't', 'e'); return M.library.verifySeal([s], seal, 'other').length > 0; });
  p('l.ceiling_enforced', (M) => { const s = sp02(); s.expectation_kind = 'invariant'; delete s.predicted_failure; delete s.knowledge_ref; return M.library.evaluateScenario(G.SP02, s).result === 'unexpected'; });
  p('l.known_failure_reproduced', (M) => M.library.evaluateScenario(G.SP02, sp02()).result === 'known_open_failure_reproduced');
  p('l.known_failure_prediction_checked', (M) => { const s = sp02(); s.predicted_failure = [{ condition: 'identifiable_basis', status: 'gap' }]; return M.library.evaluateScenario(G.SP02, s).result === 'unexpected'; });
  p('l.known_failure_not_reproduced_routed', (M) => M.library.evaluateScenario(G.SP01, sp02()).result === 'known_open_failure_not_reproduced');
  p('l.expected_gate_checked', (M) => { const s = clone(SC['P6-XD-01']); const ok = M.library.evaluateScenario(G.XD01, s).result === 'as_expected'; s.expected.gate = 'proceed'; return ok && M.library.evaluateScenario(G.XD01, s).result === 'unexpected'; });
  p('l.universal_limitation_required', (M) => { const g = clone(G.GC001); g.edges = g.edges.filter((e) => !(e.type === 'LIMITS' && e.to === 'find:reconstructability')); return U(M, g).some((x) => /^U2/.test(x)); });
  // Post-stop, owner-authorized test-coverage repair (2026-10-19, MU-51): a finding carrying two limitations, not one removed.
  p('l.universal_duplicate_limitation_detected', (M) => { const g = clone(G.GC001); const lim = g.nodes.find((n) => n.id === 'lim:reconstructability');
    g.nodes.push(Object.assign({}, lim, { id: 'lim:reconstructability-duplicate' })); g.nodes.sort((a, b) => (a.id < b.id ? -1 : 1));
    g.edges.push({ id: 'LIMITS:lim:reconstructability-duplicate->find:reconstructability', type: 'LIMITS', from: 'lim:reconstructability-duplicate', to: 'find:reconstructability', meaning: 'duplicate' });
    return U(M, g).some((x) => /^U2 reconstructability does not carry exactly one limitation/.test(x)); });
  p('l.universal_review_route_required', (M) => { const g = clone(G.GC001); g.edges = g.edges.filter((e) => !(e.type === 'ROUTES_TO_REVIEW' && e.from === 'find:reconstructability')); return U(M, g).some((x) => /^U3/.test(x)); });
  p('l.universal_no_assessment_after_refusal', (M) => { const g = clone(G.XD01); g.findings[0].status = 'review_required'; return U(M, g).some((x) => /^U5/.test(x)); });
  p('l.universal_sufficiency_never_supported', (M) => { const g = clone(G.GC001); g.findings.find((f) => f.condition_id === 'sufficiency').status = 'supported'; return U(M, g).some((x) => /^U4/.test(x)); });
  p('l.universal_instruction_limitation', (M) => { const g = clone(G.IN01); g.nodes.find((n) => n.id === 'lim:reconstructability').text = LIMS.presence; return U(M, g).some((x) => /^U9/.test(x)); });
  p('l.universal_evidence_trail', (M) => { const g = clone(G.GC001); g.edges = g.edges.filter((e) => !(e.type === 'RELATES_TO' && e.from === 'find:identifiable_basis' && e.to.startsWith('as:'))); return U(M, g).some((x) => /^U6/.test(x)); });
  p('l.universal_clean_graph_has_none', (M) => U(M, G.GC001).length === 0 && U(M, G.XD01).length === 0);

  // ---------------------------------------------------------------- baseline
  p('b.limitation_kinds_v03', (M) => JSON.stringify(M.baseline.limitationKindsV03(LIMS.presence + ' ' + LIMS.sufficiency)) === JSON.stringify(['presence', 'sufficiency']));
  p('b.behaviour_hash_excludes_offsets', (M) => { const a = rec(M, G.GC001); const g = clone(G.GC001); const ev = g.nodes.find((n) => n.id === 'ev:O1'); ev.start += 5; ev.end += 5; const b = rec(M, g);
    return a.behaviour_hash === b.behaviour_hash && a.offset_hash !== b.offset_hash; });
  p('b.evidence_trail_counted', (M) => rec(M, G.GC001).conditions.reconstructability.evidence_trail === 2);
  p('b.refusal_class', (M) => M.baseline.classifyRecord(rec(M, G.XD01)).baseline_class === 'intentional_refusal');
  p('b.known_failure_precedence', (M) => M.baseline.classifyRecord(rec(M, G.XD01, 'S'), { S: 'documented' }).baseline_class === 'known_open_failure');
  p('b.not_assessed_class', (M) => M.baseline.classifyRecord(rec(M, G.DET)).baseline_class === 'not_assessed');
  p('b.unsupported_class', (M) => M.baseline.classifyRecord(rec(M, G.EQ07)).baseline_class === 'unsupported_or_ambiguous');
  p('b.expected_class', (M) => M.baseline.classifyRecord(rec(M, G.GC001)).baseline_class === 'expected_behavior');
  p('b.manifest_hash_tamper_detected', (M) => { const m = smallManifest(M), t = clone(m); t.records[0].gate = 'refuse'; return M.baseline.manifestHashValid(m) && !M.baseline.manifestHashValid(t); });

  // ---------------------------------------------------------------- stability
  const INV = ['no_behavioral_difference', 'presentation_only'];
  p('s.invariant_requires_invariant_verdict', (M) => M.stability.validateTransform({ id: 'T', name: 'n', kind: 'invariant', base: 'GC-001', base_state: 'favorable', make: () => ({}), expected: { verdict_in: ['human_review_required'] } }).length > 0);
  p('s.damage_cannot_be_invariant', (M) => M.stability.validateTransform({ id: 'T', name: 'n', kind: 'invariant', base: 'GC-001', base_state: 'favorable', damage: (g) => g, expected: { verdict_in: INV } }).length > 0);
  p('s.invariant_degradation_flagged', (M) => { const t = { id: 'T', name: 'controls removed but declared invariant', kind: 'invariant', base: 'GC-001', base_state: 'favorable',
    make: (b) => ({ record: b.record.replace(ctx.ctrlLine + '\n', '') }), explanation: { offsets_recomputed: 'probe' }, expected: { verdict_in: INV } };
    return M.stability.runTransforms([t], { 'GC-001': ctx.gcBase }, ctx.compile).results[0].result === 'unexpected'; });
  p('s.real_invariant_passes', (M) => { const t = { id: 'T', name: 'blank lines', kind: 'invariant', base: 'GC-001', base_state: 'favorable', make: (b) => ({ record: b.record.replace(/\n/g, '\n\n') }),
    explanation: { offsets_recomputed: 'probe' }, expected: { verdict_in: INV } }; return M.stability.runTransforms([t], { 'GC-001': ctx.gcBase }, ctx.compile).results[0].result === 'as_expected'; });
  return P;
}

// ---------------------------------------------------------------- mutations
// [id, file under lib/engine-reliability, exact text, replacement, area]. Each text must occur exactly once.
export const MUTATIONS = [
  ['MU-01', 'differ.mjs', "else if (x.limitation_kinds.some((k) => !y.limitation_kinds.includes(k)))", 'else if (false)', 'limitation removal detection'],
  ['MU-02', 'differ.mjs', 'if (x.limitation_present && !y.limitation_present)', 'if (false)', 'limitation removal detection'],
  ['MU-03', 'differ.mjs', 'if (x.review_routed === true && y.review_routed !== true)', 'if (false)', 'limitation removal detection'],
  ['MU-04', 'differ.mjs', 'for (const code of a.refusal_codes) if (!b.refusal_codes.includes(code))', 'for (const code of []) if (true)', 'refusal-loss detection'],
  ['MU-05', 'differ.mjs', "add(QUOTE_CODES.test(code) ? 'quote_or_span_integrity_defect' : 'scope_boundary_defect', 'refusal lost: '", "add(QUOTE_CODES.test(code) ? 'unexpected_behavioral_change' : 'scope_boundary_defect', 'refusal lost: '", 'refusal-loss detection'],
  ['MU-06', 'differ.mjs', "if (stop(a.gate) && !stop(b.gate)) add('scope_boundary_defect'", "if (stop(a.gate) && !stop(b.gate)) add('unexpected_behavioral_change'", 'refusal-loss detection'],
  ['MU-07', 'differ.mjs', "if (a.candidate_valid === false && b.candidate_valid !== false) add('scope_boundary_defect'", "if (a.candidate_valid === false && b.candidate_valid !== false) add('unexpected_behavioral_change'", 'refusal-loss detection'],
  ['MU-08', 'differ.mjs', "if (a.instruction_risk === 'detected' && b.instruction_risk !== 'detected') add('scope_boundary_defect'", "if (a.instruction_risk === 'detected' && b.instruction_risk !== 'detected') add('expected_safe_degradation'", 'refusal-loss detection'],
  ['MU-09', 'differ.mjs', 'if (LOW_STATES.includes(x.status)) addFC(', 'if (false) addFC(', 'favorable-transition detection'],
  ['MU-10', 'differ.mjs', 'if (rb > ra) {', 'if (false) {', 'favorable-transition detection'],
  ['MU-11', 'differ.mjs', 'y.evidence_trail < 1) addFC', 'y.evidence_trail < 0) addFC', 'favorable-transition detection'],
  ['MU-12', 'differ.mjs', "else add('favorable_transition_requiring_human_review', c + ' ' + x.status", "else add('presentation_only', c + ' ' + x.status", 'favorable-transition detection'],
  ['MU-13', 'differ.mjs', "add(ex.offsets_recomputed || ex.quote_changes ? 'presentation_only' : 'quote_or_span_integrity_defect', 'quotation ' + k + ' offsets '", "add('presentation_only', 'quotation ' + k + ' offsets '", 'quote and offset integrity'],
  ['MU-14', 'differ.mjs', "add(ex.quote_changes ? 'presentation_only' : 'quote_or_span_integrity_defect', 'quotation ' + k + ' text changed'", "add('presentation_only', 'quotation ' + k + ' text changed'", 'quote and offset integrity'],
  ['MU-15', 'differ.mjs', "else addFC('quote_or_span_integrity_defect', 'quotation ' + k + ' became usable", "else add('presentation_only', 'quotation ' + k + ' became usable", 'quote and offset integrity'],
  ['MU-16', 'differ.mjs', "if (hb.behaviour_hash !== b.behaviour_hash || hb.offset_hash !== b.offset_hash) add(", 'if (false) add(', 'hash integrity'],
  ['MU-17', 'differ.mjs', "if (!ok) add('unknown_comparison_state', 'version mismatch", "if (false) add('unknown_comparison_state', 'version mismatch", 'version mismatch'],
  ['MU-18', 'differ.mjs', 'if (a.package !== b.package) add(', 'if (false) add(', 'version mismatch'],
  ['MU-19', 'differ.mjs', 'if (pa.length || pb.length) {', 'if (false) {', 'malformed comparison inputs'],
  ['MU-20', 'differ.mjs', "if (!x || !y) { add('unknown_comparison_state', 'condition '", "if (!x || !y) { continue; add('unknown_comparison_state', 'condition '", 'malformed comparison inputs'],
  ['MU-22', 'differ.mjs', "if (findings.some((f) => f.fail_closed)) return 'fail_closed';", '', 'differential classifications'],
  ['MU-23', 'differ.mjs', 'fail_closed: FAIL_CLOSED_CLASSES.includes(cls), route:', 'fail_closed: false, route:', 'differential classifications'],
  ['MU-24', 'differ.mjs', "add(has(ex.expected_degradation, c) ? 'expected_safe_degradation' : 'unexpected_behavioral_change', c + ' ' + x.status + ' -> ' + y.status)", "add('expected_safe_degradation', c + ' ' + x.status + ' -> ' + y.status)", 'differential classifications'],
  ['MU-25', 'differ.mjs', "add(has(ex.expected_refusal, code) || ex.expected_refusal === true ? 'expected_refusal' : 'unexpected_behavioral_change', 'refusal gained: '", "add('expected_refusal', 'refusal gained: '", 'differential classifications'],
  ['MU-26', 'differ.mjs', "add(ex.structure_change ? 'presentation_only' : 'unexpected_behavioral_change', 'graph or envelope structure changed'", "add('presentation_only', 'graph or envelope structure changed'", 'differential classifications'],
  ['MU-27', 'differ.mjs', 'if (b.release_status !== a.release_status || (b.release_status && b.release_status !== RELEASE_STATUS)) add(', 'if (false) add(', 'differential classifications'],
  ['MU-28', 'differ.mjs', "return { scenario_id: id, findings: [], verdict: 'no_behavioral_difference', applies_changes: false };", "return { scenario_id: id, findings: [], verdict: 'no_behavioral_difference', applies_changes: true };", 'differential classifications'],
  ['MU-29', 'differ.mjs', 'const ex = ctx.explanation || {};', 'const ex = ctx.explanation || {}; a.scenario_id = a.scenario_id;', 'differential classifications'],
  ['MU-30', 'differ.mjs', "for (const k of ia.keys()) if (!ib.has(k)) top.push(", 'for (const k of ia.keys()) if (false) top.push(', 'malformed comparison inputs'],
  ['MU-31', 'differ.mjs', "if (!manifestHashValid(m)) return side + ' manifest hash does not match its content';", '', 'hash integrity'],
  ['MU-32', 'differ.mjs', 'if (m.baseline_format_version !== BASELINE_FORMAT_VERSION) return', 'if (false) return', 'version mismatch'],
  ['MU-33', 'register.mjs', "if (e.prev_hash !== prev) p.push(", 'if (false) p.push(', 'hash-chain integrity'],
  ['MU-34', 'register.mjs', "if (e.entry_hash !== entryHash(e)) p.push(", 'if (false) p.push(', 'hash-chain integrity'],
  ['MU-35', 'register.mjs', 'return String(after).startsWith(String(before)) &&', 'return true &&', 'hash-chain integrity'],
  ['MU-36', 'register.mjs', 'for (const re of PERSONAL) if (re.test(text)) p.push(', 'for (const re of []) if (re.test(text)) p.push(', 'scenario provenance'],
  ['MU-37', 'register.mjs', "if (ids.has(e.entry_id)) p.push(", 'if (false) p.push(', 'hash-chain integrity'],
  ['MU-38', 'register.mjs', 'const w = findForbiddenStatusWord(text); if (w) p.push(', 'const w = null; if (w) p.push(', 'scenario provenance'],
  ['MU-39', 'register.mjs', "if (e.supersedes && !ids.has(e.supersedes)) p.push(", 'if (false) p.push(', 'hash-chain integrity'],
  ['MU-40', 'library.mjs', "if (typeof s.record_text !== 'string' || !s.record_text.startsWith(SYNTHETIC_MARKER)) p.push(", 'if (false) p.push(', 'scenario provenance'],
  ['MU-41', 'library.mjs', 'if (s.provenance_note !== PROVENANCE_NOTE) p.push(', 'if (false) p.push(', 'scenario provenance'],
  ['MU-42', 'library.mjs', "if (!Array.isArray(s.predicted_failure) || !s.predicted_failure.length) p.push(", 'if (false) p.push(', 'scenario provenance'],
  ['MU-43', 'library.mjs', "else if (!new RegExp('^P6-' + cat.prefix + '-\\\\d{2}$').test(String(s.scenario_id))) p.push(", 'else if (false) p.push(', 'scenario provenance'],
  ['MU-44', 'library.mjs', "for (const re of PERSONAL) if (typeof s.record_text === 'string' && re.test(s.record_text)) p.push(", 'for (const re of []) if (true) p.push(', 'scenario provenance'],
  ['MU-45', 'library.mjs', 'expected: s.expected, predicted_failure:', 'expected: null, predicted_failure:', 'scenario provenance'],
  ['MU-46', 'library.mjs', 'record_sha: hashOf(s.record_text),', 'record_sha: null,', 'scenario provenance'],
  ['MU-47', 'library.mjs', "if (evaluatorSha !== undefined && seal.evaluator_sha256 !== evaluatorSha) p.push(", 'if (false) p.push(', 'scenario provenance'],
  ['MU-48', 'library.mjs', "if (!(RANK[statusOf(g, c)] <= RANK[s])) P.push(", 'if (false) P.push(', 'favorable-transition detection'],
  ['MU-49', 'library.mjs', "result = predictedObserved(g, s.predicted_failure) ? 'known_open_failure_reproduced' : 'unexpected';", "result = 'known_open_failure_reproduced';", 'differential classifications'],
  ['MU-50', 'library.mjs', "else if (!mismatches.length) result = 'known_open_failure_not_reproduced';", "else if (!mismatches.length) result = 'known_open_failure_reproduced';", 'differential classifications'],
  ['MU-51', 'library.mjs', "if (!f.limitation_present || f.limitation_count !== 1) V.push('U2 '", "if (false) V.push('U2 '", 'limitation removal detection'],
  ['MU-52', 'library.mjs', "if (!f.review_routed) V.push('U3 '", "if (false) V.push('U3 '", 'limitation removal detection'],
  ['MU-53', 'library.mjs', "if (g.intake.decision !== 'proceed' && Object.values(rec.conditions).some((f) => f.status !== 'not_assessed')) V.push(", 'if (false) V.push(', 'refusal-loss detection'],
  ['MU-54', 'library.mjs', "if (rec.conditions.sufficiency && rec.conditions.sufficiency.status === 'supported') V.push(", 'if (false) V.push(', 'favorable-transition detection'],
  ['MU-55', 'library.mjs', "if (g.record_instruction_risk === 'detected' && f.status !== 'not_assessed' && !f.limitation_kinds.includes('instruction')) V.push(", 'if (false) V.push(', 'limitation removal detection'],
  ['MU-56', 'library.mjs', "if (['supported', 'gap'].includes(f.status) && f.evidence_trail < 1) V.push(", 'if (false) V.push(', 'favorable-transition detection'],
  ['MU-57', 'library.mjs', "if (x.gate !== undefined && g.intake.decision !== x.gate) P.push(", 'if (false) P.push(', 'refusal-loss detection'],
  ['MU-58', 'baseline.mjs', "export function limitationKindsV03(text) { return V03_KINDS.filter(([, t]) => String(text || '').includes(t)).map(([k]) => k).sort(); }", 'export function limitationKindsV03(text) { return []; }', 'limitation removal detection'],
  ['MU-59', 'baseline.mjs', "for (const q of Object.values(behaviour.quotes || {})) { delete q.start; delete q.end; }\n  rec.behaviour_hash", "rec.behaviour_hash", 'quote and offset integrity'],
  ['MU-60', 'baseline.mjs', "e.to.startsWith('as:')).length", "e.to.startsWith('zz:')).length", 'favorable-transition detection'],
  ['MU-61', 'baseline.mjs', 'if (knownOpenFailures[rec.scenario_id]) return', 'if (false) return', 'differential classifications'],
  ['MU-62', 'baseline.mjs', "if (['refuse', 'escalate'].includes(rec.gate)) return", 'if (false) return', 'differential classifications'],
  ['MU-63', 'stability.mjs', "if (t.kind === 'invariant' && !(t.expected.verdict_in && t.expected.verdict_in.every((v) => INVARIANT_VERDICTS.includes(v)))) p.push(", 'if (false) p.push(', 'differential classifications'],
  ['MU-64', 'stability.mjs', "if (t.kind === 'invariant' && t.damage) p.push(", 'if (false) p.push(', 'differential classifications'],
  ['MU-65', 'stability.mjs', "if (x.verdict_in && !x.verdict_in.includes(diff.verdict)) P.push(", 'if (false) P.push(', 'differential classifications'],
];

// JRS ENGINE RELIABILITY: Phase 6 synthetic regression library.
//
// Scenario admission, the expectation seal, and evaluation against the frozen
// v0.3 compiler. Expectations state the safe behaviour and are sealed by hash
// before the first execution; evaluation compares, it never edits. An authoring
// defect is recorded separately (AUTHORING_DEFECTS.json) with its date, reason
// and before/after expectation, and the seal is re-issued only alongside that
// record.
//
// Result vocabulary: as_expected, known_open_failure_reproduced,
// known_open_failure_not_reproduced (routed to a person), unexpected.

import { LIBRARY_FORMAT_VERSION, SYNTHETIC_MARKER, PROVENANCE_NOTE, SCENARIO_CATEGORIES, EXPECTATION_KINDS, RANK, RELEASE_STATUS, findForbiddenStatusWord } from './vocab.mjs';
import { hashOf } from './canonical.mjs';
import { recordFromGraph } from './baseline.mjs';

export const SCENARIO_FIELDS = Object.freeze(['library_format_version', 'scenario_id', 'category', 'synthetic_marker', 'provenance_note', 'expectation_kind',
  'expected_safe_behavior', 'limitation', 'record_text', 'candidate_response_text', 'execution_mode', 'expected']);
const PERSONAL = [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, /\+\d{1,3}[ -]?\(?\d{2,4}\)?[ -]?\d{3,4}[ -]?\d{3,4}\b/, /\b\d{3}-\d{2}-\d{4}\b/, /\b(?:Mr|Mrs|Ms|Dr)\.\s+[A-Z][a-z]+/];
const EXPECTED_KEYS = ['gate', 'candidate_valid', 'instruction_risk', 'statuses', 'ceilings', 'refusal_codes_include', 'refusal_codes_exclude', 'quote_statuses', 'quote_reasons',
  'conflicts_include', 'conflicts_exclude', 'conflicts_exact', 'cc_include', 'cc_exact', 'limitation_kinds_include'];

export function validateScenario(s, seenIds = new Set()) {
  const p = [];
  if (!s || typeof s !== 'object') return ['scenario is not an object'];
  for (const k of SCENARIO_FIELDS) if (s[k] === undefined) p.push('missing ' + k);
  if (s.library_format_version !== LIBRARY_FORMAT_VERSION) p.push('library_format_version mismatch');
  const cat = SCENARIO_CATEGORIES[s.category];
  if (!cat) p.push('unknown category ' + s.category);
  else if (!new RegExp('^P6-' + cat.prefix + '-\\d{2}$').test(String(s.scenario_id))) p.push('scenario_id does not match its category prefix');
  if (seenIds.has(s.scenario_id)) p.push('duplicate scenario_id');
  if (s.synthetic_marker !== SYNTHETIC_MARKER) p.push('synthetic_marker altered');
  if (typeof s.record_text !== 'string' || !s.record_text.startsWith(SYNTHETIC_MARKER)) p.push('record does not begin with the synthetic-material marker');
  if (s.provenance_note !== PROVENANCE_NOTE) p.push('provenance note altered');
  if (!EXPECTATION_KINDS.includes(s.expectation_kind)) p.push('unknown expectation_kind');
  if (typeof s.expected_safe_behavior !== 'string' || s.expected_safe_behavior.length < 20) p.push('expected_safe_behavior missing or too short');
  if (typeof s.limitation !== 'string' || s.limitation.length < 20) p.push('limitation missing or too short');
  for (const f of ['expected_safe_behavior', 'limitation']) { const w = findForbiddenStatusWord(s[f]); if (w) p.push(f + ' uses forbidden status word ' + w); }
  if (!['local_mocked', 'local_deterministic'].includes(s.execution_mode)) p.push('execution_mode not local');
  if (!s.expected || typeof s.expected !== 'object') p.push('expected missing');
  else for (const k of Object.keys(s.expected)) if (!EXPECTED_KEYS.includes(k)) p.push('unknown expectation key ' + k);
  if (s.expectation_kind === 'known_open_failure') {
    if (!Array.isArray(s.predicted_failure) || !s.predicted_failure.length) p.push('known_open_failure without predicted_failure');
    if (typeof s.knowledge_ref !== 'string' || !/^P6K-\d{3}$/.test(s.knowledge_ref)) p.push('known_open_failure without knowledge_ref');
  } else if (s.predicted_failure !== undefined) p.push('predicted_failure only allowed on known_open_failure');
  for (const re of PERSONAL) if (typeof s.record_text === 'string' && re.test(s.record_text)) p.push('record contains personal-data-like text (' + re.source.slice(0, 20) + ')');
  return p;
}

// The seal covers everything that states what should happen.
const sealPart = (s) => ({ scenario_id: s.scenario_id, expectation_kind: s.expectation_kind, expected: s.expected, predicted_failure: s.predicted_failure || null,
  expected_safe_behavior: s.expected_safe_behavior, record_sha: hashOf(s.record_text), response_sha: hashOf(s.candidate_response_text), submission_overrides: s.submission_overrides || null });
export function sealExpectations(scenarios, sealedAt, evaluatorSha) {
  const per = Object.fromEntries(scenarios.map((s) => [s.scenario_id, hashOf(sealPart(s))]));
  return { sealed_at: sealedAt, scenario_count: scenarios.length, evaluator_sha256: evaluatorSha, per_scenario: per, seal_hash: hashOf({ per, evaluatorSha }),
    statement: 'Expectations, scenario inputs and predicted open failures were hashed before the first execution. A later change to any of them breaks this seal.' };
}
export function verifySeal(scenarios, seal, evaluatorSha) {
  const p = [];
  if (!seal || !seal.per_scenario) return ['seal missing'];
  if (evaluatorSha !== undefined && seal.evaluator_sha256 !== evaluatorSha) p.push('evaluator changed since the seal');
  const ids = scenarios.map((s) => s.scenario_id);
  for (const id of Object.keys(seal.per_scenario)) if (!ids.includes(id)) p.push('sealed scenario missing: ' + id);
  for (const s of scenarios) { const h = seal.per_scenario[s.scenario_id]; if (!h) p.push('scenario not sealed: ' + s.scenario_id); else if (h !== hashOf(sealPart(s))) p.push('seal mismatch: ' + s.scenario_id); }
  if (seal.seal_hash !== hashOf({ per: seal.per_scenario, evaluatorSha: seal.evaluator_sha256 })) p.push('seal hash mismatch');
  return p;
}

export function submissionFor(s) {
  const sub = { submission_metadata: { submission_id: s.scenario_id },
    scope_declaration: { record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false },
    declared_versions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.0-local', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' },
    requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: s.record_text };
  const o = s.submission_overrides || {};
  if (o.scope_declaration) Object.assign(sub.scope_declaration, o.scope_declaration);
  if (o.requested_outputs) sub.requested_outputs = [...o.requested_outputs];
  return sub;
}

// ---------------------------------------------------------------- evaluation
const statusOf = (g, c) => (g.findings.find((f) => f.condition_id === c) || {}).status;
const pqOf = (g, o) => g.nodes.find((n) => n.id === 'pq:' + o);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function checkExpectation(g, x) {
  const P = [];
  const refusals = [...new Set(g.refusals.map((r) => r.code))].sort(), conflicts = g.conflicts.map((k) => k.kind).sort(), cc = [...new Set(g.cognitive_controls.map((c) => c.defect))].sort();
  if (x.gate !== undefined && g.intake.decision !== x.gate) P.push('gate: expected ' + x.gate + ', got ' + g.intake.decision);
  if (x.candidate_valid !== undefined && g.candidate.valid !== x.candidate_valid) P.push('candidate_valid: expected ' + x.candidate_valid + ', got ' + g.candidate.valid);
  if (x.instruction_risk !== undefined && g.record_instruction_risk !== x.instruction_risk) P.push('instruction_risk: expected ' + x.instruction_risk + ', got ' + g.record_instruction_risk);
  for (const [c, s] of Object.entries(x.statuses || {})) if (statusOf(g, c) !== s) P.push('status ' + c + ': expected ' + s + ', got ' + statusOf(g, c));
  for (const [c, s] of Object.entries(x.ceilings || {})) if (!(RANK[statusOf(g, c)] <= RANK[s])) P.push('ceiling ' + c + ': at most ' + s + ', got ' + statusOf(g, c));
  for (const r of x.refusal_codes_include || []) if (!refusals.includes(r)) P.push('missing refusal ' + r + ' (got ' + refusals.join(',') + ')');
  for (const r of x.refusal_codes_exclude || []) if (refusals.includes(r)) P.push('unexpected refusal ' + r);
  for (const [o, s] of Object.entries(x.quote_statuses || {})) { const n = pqOf(g, o); if (!n || n.quote_resolution_status !== s) P.push('quote ' + o + ': expected ' + s + ', got ' + (n && n.quote_resolution_status)); }
  for (const [o, s] of Object.entries(x.quote_reasons || {})) { const n = pqOf(g, o); if (!n || n.reason !== s) P.push('quote reason ' + o + ': expected ' + s + ', got ' + (n && n.reason)); }
  for (const k of x.conflicts_include || []) if (!conflicts.includes(k)) P.push('missing conflict ' + k + ' (got ' + conflicts.join(',') + ')');
  for (const k of x.conflicts_exclude || []) if (conflicts.includes(k)) P.push('unexpected conflict ' + k);
  if (x.conflicts_exact !== undefined && !same(conflicts, [...x.conflicts_exact].sort())) P.push('conflicts: expected ' + JSON.stringify(x.conflicts_exact) + ', got ' + JSON.stringify(conflicts));
  for (const d of x.cc_include || []) if (!cc.includes(d)) P.push('missing Cognitive Control defect ' + d + ' (got ' + cc.join(',') + ')');
  if (x.cc_exact !== undefined && !same(cc, [...x.cc_exact].sort())) P.push('cc defects: expected ' + JSON.stringify(x.cc_exact) + ', got ' + JSON.stringify(cc));
  for (const [c, kinds] of Object.entries(x.limitation_kinds_include || {})) {
    const lim = g.nodes.find((n) => n.id === 'lim:' + c); const text = lim ? lim.text : '';
    const rec = recordFromGraph(g, { scenarioId: 'x', pkg: 'phase6-library' });
    for (const k of kinds) if (!rec.conditions[c] || !rec.conditions[c].limitation_kinds.includes(k)) P.push('limitation ' + c + ' lacks kind ' + k + (text ? '' : ' (no limitation)'));
  }
  return P;
}

// Invariants applied to every scenario, whatever its expectation kind.
export function universalInvariants(g) {
  const V = [];
  const rec = recordFromGraph(g, { scenarioId: 'x', pkg: 'phase6-library' });
  if (g.release_status !== RELEASE_STATUS) V.push('U1 release status is ' + g.release_status);
  for (const [c, f] of Object.entries(rec.conditions)) {
    if (!f.limitation_present || f.limitation_count !== 1) V.push('U2 ' + c + ' does not carry exactly one limitation');
    else if (f.status !== 'not_assessed' && !f.limitation_kinds.includes('presence')) V.push('U2 ' + c + ' assessed without the presence limitation');
    if (f.status === 'not_assessed' && !g.edges.some((e) => e.type === 'REFUSES' && e.to === 'find:' + c)) V.push('U2 ' + c + ' not_assessed without a refusal recorded against it');
    if (!f.review_routed) V.push('U3 ' + c + ' not routed to human review');
    if (['supported', 'gap'].includes(f.status) && f.evidence_trail < 1) V.push('U6 ' + c + ' is ' + f.status + ' without a deterministic evidence trail');
    if (g.record_instruction_risk === 'detected' && f.status !== 'not_assessed' && !f.limitation_kinds.includes('instruction')) V.push('U9 ' + c + ' lacks the instruction-risk limitation');
  }
  if (rec.conditions.sufficiency && rec.conditions.sufficiency.status === 'supported') V.push('U4 sufficiency reported as supported');
  if (g.intake.decision !== 'proceed' && Object.values(rec.conditions).some((f) => f.status !== 'not_assessed')) V.push('U5 a condition was assessed after a ' + g.intake.decision);
  if (g.controls_withheld.length) V.push('U7 Cognitive Controls withheld: ' + g.controls_withheld.map((w) => w.defect).join(','));
  for (const c of g.cognitive_controls) if (!(typeof c.correct === 'string' && c.correct.trim().endsWith('?') && c.scope === 'documentation_control_only' && c.route === 'human_review')) V.push('U7 control ' + c.control_id + ' is not a neutral record-completion question routed to review');
  if (g.identity.provider_calls !== 0 || g.identity.network_calls !== 0) V.push('U8 provider or network call recorded');
  return V;
}

export function predictedObserved(g, predicted) {
  const conflicts = g.conflicts.map((k) => k.kind), refusals = g.refusals.map((r) => r.code);
  return predicted.every((p) => {
    if (p.condition) return statusOf(g, p.condition) === p.status;
    if (p.gate) return g.intake.decision === p.gate;
    if (p.conflict_absent) return !conflicts.includes(p.conflict_absent);
    if (p.refusal_absent) return !refusals.includes(p.refusal_absent);
    return false;
  });
}

export function evaluateScenario(g, s) {
  const mismatches = checkExpectation(g, s.expected), violations = universalInvariants(g);
  let result;
  if (violations.length) result = 'unexpected';
  else if (s.expectation_kind !== 'known_open_failure') result = mismatches.length ? 'unexpected' : 'as_expected';
  else if (!mismatches.length) result = 'known_open_failure_not_reproduced';
  else result = predictedObserved(g, s.predicted_failure) ? 'known_open_failure_reproduced' : 'unexpected';
  return { scenario_id: s.scenario_id, category: s.category, expectation_kind: s.expectation_kind, result, mismatches, universal_violations: violations,
    statuses: Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status])), gate: g.intake.decision, graph_sha256: g.identity.graph_sha256 };
}

export function runLibrary(scenarios, compile, clock = '2026-10-17T00:00:00Z') {
  const results = [], records = [], graphs = {};
  for (const s of scenarios) {
    let g;
    try { g = compile({ submission: submissionFor(s), candidateResponseText: s.candidate_response_text, executionMode: s.execution_mode, clock, fixtureId: s.scenario_id }); }
    catch (e) { results.push({ scenario_id: s.scenario_id, category: s.category, expectation_kind: s.expectation_kind, result: 'unexpected', mismatches: ['compile error: ' + String(e.message).slice(0, 300)], universal_violations: [] }); continue; }
    graphs[s.scenario_id] = g;
    const r = evaluateScenario(g, s);
    results.push(r);
    records.push(recordFromGraph(g, { scenarioId: s.scenario_id, pkg: 'phase6-library', category: s.category, replayResult: r.result }));
  }
  const counts = Object.fromEntries(['as_expected', 'known_open_failure_reproduced', 'known_open_failure_not_reproduced', 'unexpected'].map((k) => [k, results.filter((r) => r.result === k).length]));
  return { results, records, graphs, counts, results_hash: hashOf(results) };
}

// JRS ENGINE RELIABILITY: behaviour records and the baseline manifest.
//
// A behaviour record is a normalised, deterministic description of what one
// Engine candidate produced for one synthetic scenario: gate, condition-level
// outcomes, refusals, quotation states, limitation kinds, Cognitive Control
// defects, human-review routing and a structural summary, plus hashes.
// Adapters read the frozen output of each prior package; none of them changes
// that output or the package that produced it.
//
// The baseline class describes the shape of a result. It never says a result
// is right: "expected_behavior" means only that no refusal, open failure,
// unassessed state, ambiguity or conflict was recorded for that scenario.

import { LIMITATIONS } from '../engine-evidence-graph/contract.mjs';
import { RECORD_FORMAT_VERSION, BASELINE_FORMAT_VERSION, RELEASE_STATUS, STATEMENT, PACKAGES, BASELINE_CLASSES } from './vocab.mjs';
import { canonical, sha, hashOf } from './canonical.mjs';

const USABLE_V03 = ['verified_unique', 'verified_disambiguated'];
const sortU = (a) => [...new Set(a)].sort();
const count = (list) => { const o = {}; for (const x of list) o[x] = (o[x] || 0) + 1; return Object.fromEntries(Object.entries(o).sort()); };

// Limitation kinds. v0.3 text is matched against its canonical limitation sentences exactly;
// earlier packages are matched against the stable phrases their own limitation text uses.
const V03_KINDS = [['presence', LIMITATIONS.presence], ['sufficiency', LIMITATIONS.sufficiency], ['conflict', LIMITATIONS.conflict],
  ['instruction', LIMITATIONS.instruction], ['refusal', LIMITATIONS.refusal]];
export function limitationKindsV03(text) { return V03_KINDS.filter(([, t]) => String(text || '').includes(t)).map(([k]) => k).sort(); }
const LEGACY_KINDS = [['presence', /record presence only/i], ['sufficiency', /sufficien/i], ['refusal', /\bnot assessed\b/i], ['instruction', /instruction/i], ['conflict', /\bconflict/i]];
export function limitationKindsLegacy(text) { return LEGACY_KINDS.filter(([, re]) => re.test(String(text || ''))).map(([k]) => k).sort(); }

function finish(rec, raw) {
  rec.record_format_version = RECORD_FORMAT_VERSION;
  rec.raw_output_hash = raw;
  // The behaviour hash covers every behavioural field and excludes offsets, which are kept separately.
  const behaviour = JSON.parse(JSON.stringify(rec));
  delete behaviour.raw_output_hash; delete behaviour.behaviour_hash; delete behaviour.baseline_class; delete behaviour.class_basis; delete behaviour.replay_result;
  for (const q of Object.values(behaviour.quotes || {})) { delete q.start; delete q.end; }
  rec.behaviour_hash = hashOf(behaviour);
  rec.offset_hash = hashOf(Object.fromEntries(Object.entries(rec.quotes || {}).map(([k, q]) => [k, [q.start, q.end]])));
  return rec;
}

// ---------------------------------------------------------------- v0.3 graph (GC, AR, ST and Phase 6 scenarios)
export function recordFromGraph(g, { scenarioId, pkg, category = null, replayResult = null }) {
  const findings = Object.fromEntries(g.findings.map((f) => [f.condition_id, f]));
  const conditions = {};
  for (const [cid, f] of Object.entries(findings)) {
    const limEdges = g.edges.filter((e) => e.type === 'LIMITS' && e.to === 'find:' + cid);
    const lim = limEdges.length ? g.nodes.find((n) => n.id === limEdges[0].from) : null;
    conditions[cid] = {
      status: f.status, proposed_status: f.proposed_status, reasons: [...f.reasons],
      limitation_present: !!(lim && lim.text), limitation_count: limEdges.length,
      limitation_kinds: lim ? limitationKindsV03(lim.text) : [], limitation_sha: lim ? sha(lim.text) : null,
      evidence_trail: g.edges.filter((e) => e.type === 'RELATES_TO' && e.from === 'find:' + cid && e.to.startsWith('as:')).length,
      review_routed: g.edges.some((e) => e.type === 'ROUTES_TO_REVIEW' && e.from === 'find:' + cid),
    };
  }
  const quotes = {};
  for (const n of g.nodes.filter((x) => x.type === 'proposed_quote')) {
    const ev = g.nodes.find((x) => x.id === 'ev:' + n.observation_id);
    quotes[n.observation_id] = { condition_id: n.condition_id, status: n.quote_resolution_status, reason: n.reason, text_sha: n.quote === null ? null : sha(n.quote),
      start: ev ? ev.start : null, end: ev ? ev.end : null };
  }
  const SKIP_N = ['record_section', 'record_span'], SKIP_E = ['CONTAINS'];
  const rec = {
    scenario_id: scenarioId, package: pkg, package_version: g.compiler_version, scenario_category: category, release_status: g.release_status,
    gate: g.intake.decision, candidate_valid: g.candidate.valid, instruction_risk: g.record_instruction_risk,
    conditions, refusal_codes: sortU(g.refusals.map((r) => r.code)), quotes,
    evidence_quote_status: count(Object.values(quotes).map((q) => q.status)),
    conflicts: g.conflicts.map((k) => k.kind).sort(), cc_defects: sortU(g.cognitive_controls.map((c) => c.defect)), controls_withheld: g.controls_withheld.length,
    human_review_route: g.human_review_route ? g.human_review_route.route : null,
    structure: { node_types: count(g.nodes.filter((n) => !SKIP_N.includes(n.type)).map((n) => n.type)), edge_types: count(g.edges.filter((e) => !SKIP_E.includes(e.type)).map((e) => e.type)) },
    provider_calls: g.identity.provider_calls, network_calls: g.identity.network_calls,
    replay_result: replayResult,
  };
  return finish(rec, g.identity.graph_sha256);
}

// ---------------------------------------------------------------- v0.1 assurance envelope
export function recordFromEnvelope(env, { scenarioId, category = null, replayResult = null, normalizedHash = null }) {
  const conditions = {}, quotes = {};
  for (const f of env.findings.condition_findings) {
    conditions[f.condition_id] = { status: f.outcome, proposed_status: f.candidate_status === undefined ? null : f.candidate_status, reasons: [f.outcome_basis],
      limitation_present: typeof f.limitation === 'string' && f.limitation.length > 0, limitation_count: f.limitation ? 1 : 0,
      limitation_kinds: limitationKindsLegacy(f.limitation), limitation_sha: f.limitation ? sha(f.limitation) : null,
      evidence_trail: f.source_spans.length, review_routed: env.human_review_required === true };
    f.source_spans.forEach((s, i) => { quotes[f.condition_id + '#' + (i + 1)] = { condition_id: f.condition_id, status: s.verification, reason: null, text_sha: sha(s.quote), start: s.start, end: s.end }; });
  }
  const rec = {
    scenario_id: scenarioId, package: 'v0.1-assurance', package_version: PACKAGES['v0.1-assurance'].version, scenario_category: category, release_status: env.release_status,
    gate: env.gate.decision, candidate_valid: null, instruction_risk: null,
    conditions, refusal_codes: sortU(env.refusals.map((r) => r.code)), quotes, evidence_quote_status: count(Object.values(quotes).map((q) => q.status)),
    conflicts: null, cc_defects: sortU(env.findings.record_controls.map((c) => c.control_id + ':' + c.detect.pattern_id)), controls_withheld: 0,
    human_review_route: env.human_review_required === true ? 'human_review_required' : null,
    structure: { envelope: { findings: env.findings.condition_findings.length, refusals: env.refusals.length, record_controls: env.findings.record_controls.length,
      limitations: env.limitations.length, manifest_produced: !!(env.manifest_reference && env.manifest_reference.produced) } },
    provider_calls: env.provider_invocations, network_calls: 0, replay_result: replayResult,
  };
  return finish(rec, normalizedHash);
}

// ---------------------------------------------------------------- v0.2 evidence contract result
export function recordFromContract(r, { scenarioId, category = null, replayResult = null }) {
  const conditions = {}, quotes = {};
  for (const c of r.conditions) {
    conditions[c.condition_id] = { status: c.status, proposed_status: c.candidate_status === undefined ? null : c.candidate_status, reasons: [...(c.routing_reasons || [])],
      limitation_present: typeof c.limitation === 'string' && c.limitation.length > 0, limitation_count: c.limitation ? 1 : 0,
      limitation_kinds: limitationKindsLegacy(c.limitation), limitation_sha: c.limitation ? sha(c.limitation) : null,
      evidence_trail: c.evidence_items.length, review_routed: !!(r.human_review && r.human_review.required === true) };
    for (const e of c.evidence_items) quotes[c.condition_id + ':' + e.evidence_id] = { condition_id: c.condition_id, status: e.presence_verified ? 'presence_verified' : 'not_verified', reason: null, text_sha: sha(e.exact_quote), start: e.start_offset, end: e.end_offset };
    for (const [i, e] of (c.rejected_evidence || []).entries()) quotes[c.condition_id + ':rejected' + (i + 1)] = { condition_id: c.condition_id, status: 'rejected', reason: e.reason || e.failure || null, text_sha: e.exact_quote ? sha(e.exact_quote) : null, start: null, end: null };
  }
  const rec = {
    scenario_id: scenarioId, package: 'v0.2-evidence-contract', package_version: r.engine_candidate_version, scenario_category: category, release_status: r.release_status,
    gate: r.intake.gate_decision, candidate_valid: r.candidate_response_validation.response_status === 'valid', instruction_risk: r.record_instruction_risk,
    conditions, refusal_codes: sortU(r.refusals.map((x) => x.code)), quotes, evidence_quote_status: count(Object.values(quotes).map((q) => q.status)),
    conflicts: null, cc_defects: sortU(r.conditions.flatMap((c) => c.cognitive_controls.map((z) => z.control_id + ':' + z.pattern_id))), controls_withheld: (r.remediation_withheld || []).length,
    human_review_route: r.human_review ? r.human_review.route : null,
    structure: { result: { conditions: r.conditions.length, refusals: r.refusals.length, long_record_status: r.long_record ? r.long_record.length_status : null, v1_comparison: !!r.v1_comparison } },
    provider_calls: 0, network_calls: 0, replay_result: replayResult,
  };
  return finish(rec, r.hashes.result_normalized);
}

export function recordFromBridge(b, { scenarioId, replayResult = null }) {
  const conditions = {};
  for (const c of b.conditions) conditions[c.v1_key] = { status: c.effective_v02_status, proposed_status: c.v1_status_in_v02_terms, reasons: [...c.reasons],
    limitation_present: typeof b.statement === 'string' && b.statement.length > 0, limitation_count: b.statement ? 1 : 0, limitation_kinds: limitationKindsLegacy(b.statement),
    limitation_sha: b.statement ? sha(b.statement) : null, evidence_trail: 0, review_routed: null };
  const rec = {
    scenario_id: scenarioId, package: 'v0.2-evidence-contract', package_version: b.bridge_version, scenario_category: 'bridge_case', release_status: RELEASE_STATUS,
    gate: null, candidate_valid: b.parse.status === 'parsed' ? true : b.parse.status ? false : null, instruction_risk: null,
    conditions, refusal_codes: [], quotes: {}, evidence_quote_status: {}, conflicts: null, cc_defects: sortU(b.record_flags || []), controls_withheld: 0,
    human_review_route: null, structure: { bridge: { parse_status: b.parse.status, migration: b.migration, determination_conflict: !!(b.determination && b.determination.conflict) } },
    provider_calls: 0, network_calls: 0, replay_result: replayResult,
  };
  return finish(rec, hashOf({ original: b.original_output.sha256, conditions: b.conditions }));
}

export function recordFromLongRecord(plan, { scenarioId, replayResult = null, gate = null }) {
  const rec = {
    scenario_id: scenarioId, package: 'v0.2-evidence-contract', package_version: plan.plan_version, scenario_category: 'long_record_case', release_status: RELEASE_STATUS,
    gate, candidate_valid: null, instruction_risk: null, conditions: {}, refusal_codes: [], quotes: {}, evidence_quote_status: {}, conflicts: null, cc_defects: [], controls_withheld: 0,
    human_review_route: plan.human_review_points.length ? 'human_review_points' : null,
    structure: { long_record: { length_status: plan.length_status, segments: plan.segments.length, analysis_performed: plan.analysis_performed, findings_combined: plan.findings_combined,
      human_review_points: plan.human_review_points.map((p) => p.point) } },
    limitation_text_sha: plan.limitation ? sha(typeof plan.limitation === 'string' ? plan.limitation : canonical(plan.limitation)) : null,
    provider_calls: 0, network_calls: 0, replay_result: replayResult,
  };
  return finish(rec, hashOf(plan));
}

// ---------------------------------------------------------------- classification
export function classifyRecord(rec, knownOpenFailures = {}) {
  const conds = Object.entries(rec.conditions || {});
  if (knownOpenFailures[rec.scenario_id]) return { baseline_class: 'known_open_failure', class_basis: knownOpenFailures[rec.scenario_id] };
  if (rec.replay_result === 'fail' || rec.replay_result === 'mismatch') return { baseline_class: 'known_open_failure', class_basis: 'own frozen expectation not met on this run (' + rec.replay_result + ')' };
  if (['refuse', 'escalate'].includes(rec.gate)) return { baseline_class: 'intentional_refusal', class_basis: 'gate ' + rec.gate };
  if (rec.candidate_valid === false) return { baseline_class: 'intentional_refusal', class_basis: 'candidate response refused by the strict contract' };
  if ((rec.refusal_codes || []).includes('execution_mode_not_authorized')) return { baseline_class: 'intentional_refusal', class_basis: 'execution mode not authorized' };
  if (!conds.length || conds.every(([, c]) => c.status === 'not_assessed')) return { baseline_class: 'not_assessed', class_basis: conds.length ? 'every condition not_assessed' : 'no condition-level output (structure only)' };
  const reasons = [];
  for (const [cid, c] of conds) if (cid !== 'sufficiency' && c.status === 'review_required') reasons.push(cid + ' review_required');
  for (const [k, q] of Object.entries(rec.quotes || {})) if (['ambiguous', 'absent', 'malformed', 'rejected', 'not_verified'].includes(q.status)) reasons.push('quote ' + k + ' ' + q.status);
  if (rec.conflicts && rec.conflicts.length) reasons.push('conflicts ' + rec.conflicts.join(','));
  if (rec.instruction_risk === 'detected') reasons.push('instruction risk detected');
  if (reasons.length) return { baseline_class: 'unsupported_or_ambiguous', class_basis: reasons.join('; ') };
  return { baseline_class: 'expected_behavior', class_basis: 'no refusal, open failure, unassessed state, ambiguity, conflict or instruction risk recorded; this is not a statement that the result is right' };
}

export function buildManifest(records, { generatedClock, sources, knownOpenFailures = {}, codeIdentity = {} }) {
  const out = records.map((r) => Object.assign({}, r, classifyRecord(r, knownOpenFailures))).sort((a, b) => (a.package + '|' + a.scenario_id < b.package + '|' + b.scenario_id ? -1 : 1));
  const byPackage = {}, byClass = Object.fromEntries(BASELINE_CLASSES.map((c) => [c, 0]));
  for (const r of out) { byPackage[r.package] = (byPackage[r.package] || 0) + 1; byClass[r.baseline_class]++; }
  const m = {
    baseline_format_version: BASELINE_FORMAT_VERSION, release_status: RELEASE_STATUS, statement: STATEMENT, generated_clock: generatedClock,
    label_policy: 'No outcome is labelled correct, accurate, approved or validated. Classes describe result shape only.',
    sources, code_identity: codeIdentity, known_open_failure_sources: knownOpenFailures,
    counts: { total: out.length, by_package: byPackage, by_class: byClass }, records: out,
  };
  m.manifest_hash = hashOf(Object.assign({}, m, { manifest_hash: undefined }));
  return m;
}

export function manifestHashValid(m) { return !!m && m.manifest_hash === hashOf(Object.assign({}, m, { manifest_hash: undefined })); }

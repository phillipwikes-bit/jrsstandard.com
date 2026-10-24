// JRS ENGINE RELIABILITY: differential replay and change-impact router.
//
// Compares two behaviour records (or two baseline manifests, or two v0.3
// graphs) and classifies every difference. It identifies a change; it never
// applies one, never edits either input, never approves a difference and never
// moves a result to a more favourable state. Inputs are read only.
//
// Verdicts: no_behavioral_difference, presentation_only, human_review_required,
// fail_closed. A comparison fails closed when a finding loses its limitation or
// its review route, a refusal disappears, an unsupported, ambiguous or
// not-assessed state becomes favourable, a quotation or offset changes without
// a recorded explanation, a condition becomes supported or a gap without a
// deterministic evidence trail, or an input is incomplete or version-mismatched.
//
// "Explanations" are recorded context supplied by a person or by a stability
// transform's own specification. An explanation can classify a change as
// expected; it can never remove a fail-closed result for a refusal loss, a
// limitation loss, a favourable transition from a low state or a scope breach.

import { RECORD_FORMAT_VERSION, BASELINE_FORMAT_VERSION, RANK, LOW_STATES, FAIL_CLOSED_CLASSES, RELEASE_STATUS } from './vocab.mjs';
import { manifestHashValid, recordFromGraph } from './baseline.mjs';
import { hashOf } from './canonical.mjs';

const USABLE = ['verified_unique', 'verified_disambiguated', 'presence_verified', 'exact_match_record_presence_only'];
const SCOPE_CODES = /^(?:excluded_domain_content|regulated_domain_content|invalid_scope_declaration|missing_scope_declaration|non_synthetic_record_not_authorized|record_exceeds_local_size_limit|record_too_short|record_text_missing|incomplete_record|prohibited_output_requested|unsupported_output_requested|missing_requested_outputs|unrecognised_submission_field|execution_mode_not_authorized|candidate_response_invalid|fixture_hash_mismatch|\w+_version_mismatch|missing_version_declaration)$/;
const QUOTE_CODES = /^(?:quote_\w+|assertion_rejected|no_traceable_record_anchor|candidate_evidence_\w+)$/;
const REQUIRED = ['record_format_version', 'scenario_id', 'package', 'package_version', 'conditions', 'refusal_codes', 'quotes', 'behaviour_hash', 'offset_hash'];
const has = (list, x) => list === true || (Array.isArray(list) && list.includes(x));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Hashes are recomputed from content; a stored hash is never trusted on its own.
export function recomputeHashes(r) {
  const behaviour = JSON.parse(JSON.stringify(r));
  for (const k of ['raw_output_hash', 'behaviour_hash', 'offset_hash', 'baseline_class', 'class_basis', 'replay_result']) delete behaviour[k];
  for (const q of Object.values(behaviour.quotes || {})) { delete q.start; delete q.end; }
  return { behaviour_hash: hashOf(behaviour), offset_hash: hashOf(Object.fromEntries(Object.entries(r.quotes || {}).map(([k, q]) => [k, [q.start, q.end]]))) };
}

function verdictOf(findings) {
  if (findings.some((f) => f.fail_closed)) return 'fail_closed';
  if (findings.some((f) => f.class !== 'presentation_only')) return 'human_review_required';
  return findings.length ? 'presentation_only' : 'no_behavioral_difference';
}

export function validateRecordInput(r) {
  const p = [];
  if (!r || typeof r !== 'object' || Array.isArray(r)) return ['record is not an object'];
  for (const k of REQUIRED) if (r[k] === undefined || r[k] === null) p.push('missing ' + k);
  if (r.record_format_version !== undefined && r.record_format_version !== RECORD_FORMAT_VERSION) p.push('record format version ' + r.record_format_version);
  if (r.conditions && (typeof r.conditions !== 'object' || Array.isArray(r.conditions))) p.push('conditions is not an object');
  if (r.refusal_codes && !Array.isArray(r.refusal_codes)) p.push('refusal_codes is not a list');
  if (r.quotes && (typeof r.quotes !== 'object' || Array.isArray(r.quotes))) p.push('quotes is not an object');
  for (const [c, f] of Object.entries(r.conditions && typeof r.conditions === 'object' ? r.conditions : {})) if (!f || typeof f !== 'object' || !(f.status in RANK)) p.push('condition ' + c + ' has no recognised status');
  return p;
}

export function compareRecords(a, b, ctx = {}) {
  const F = [];
  const add = (cls, detail) => F.push({ class: cls, detail, fail_closed: FAIL_CLOSED_CLASSES.includes(cls), route: FAIL_CLOSED_CLASSES.includes(cls) ? 'fail_closed' : 'human_review' });
  const addFC = (cls, detail) => F.push({ class: cls, detail, fail_closed: true, route: 'fail_closed' });
  const pa = validateRecordInput(a), pb = validateRecordInput(b);
  const id = (a && a.scenario_id) || (b && b.scenario_id) || null;
  if (pa.length || pb.length) { add('unknown_comparison_state', 'incomplete or malformed input: ' + [...pa.map((x) => 'before ' + x), ...pb.map((x) => 'after ' + x)].join('; ')); return { scenario_id: id, findings: F, verdict: verdictOf(F), applies_changes: false }; }
  if (a.scenario_id !== b.scenario_id) add('unknown_comparison_state', 'scenario mismatch ' + a.scenario_id + ' / ' + b.scenario_id);
  if (a.package !== b.package) add('unknown_comparison_state', 'package mismatch ' + a.package + ' / ' + b.package);
  if (a.package_version !== b.package_version) {
    const ok = ctx.expected_version_change && ctx.expected_version_change.from === a.package_version && ctx.expected_version_change.to === b.package_version;
    if (!ok) add('unknown_comparison_state', 'version mismatch ' + a.package_version + ' / ' + b.package_version + ' without a recorded version change');
  }
  const ha = recomputeHashes(a), hb = recomputeHashes(b);
  if (ha.behaviour_hash !== a.behaviour_hash || ha.offset_hash !== a.offset_hash) add('unknown_comparison_state', 'before record hashes do not match its content');
  if (hb.behaviour_hash !== b.behaviour_hash || hb.offset_hash !== b.offset_hash) add('unknown_comparison_state', 'after record hashes do not match its content');
  if (F.length) return { scenario_id: id, findings: F, verdict: verdictOf(F), applies_changes: false };
  if (ha.behaviour_hash === hb.behaviour_hash && ha.offset_hash === hb.offset_hash) return { scenario_id: id, findings: [], verdict: 'no_behavioral_difference', applies_changes: false };
  const ex = ctx.explanation || {};

  // Release status and isolation.
  if (b.release_status !== a.release_status || (b.release_status && b.release_status !== RELEASE_STATUS)) add('scope_boundary_defect', 'release status ' + a.release_status + ' -> ' + b.release_status);
  if ((b.provider_calls || 0) > 0 || (b.network_calls || 0) > 0) add('scope_boundary_defect', 'provider or network call recorded in the after state');
  // Gate.
  const stop = (x) => x === 'refuse' || x === 'escalate';
  if (a.gate !== b.gate) {
    if (stop(a.gate) && !stop(b.gate)) add('scope_boundary_defect', 'gate ' + a.gate + ' -> ' + b.gate);
    else if (!stop(a.gate) && stop(b.gate)) add(ex.expected_refusal ? 'expected_refusal' : 'unexpected_behavioral_change', 'gate ' + a.gate + ' -> ' + b.gate);
    else add('unexpected_behavioral_change', 'gate ' + a.gate + ' -> ' + b.gate);
  }
  if (a.instruction_risk === 'detected' && b.instruction_risk !== 'detected') add('scope_boundary_defect', 'instruction risk no longer detected');
  else if (a.instruction_risk !== b.instruction_risk) add(ex.expected_degradation ? 'expected_safe_degradation' : 'unexpected_behavioral_change', 'instruction risk ' + a.instruction_risk + ' -> ' + b.instruction_risk);
  if (a.candidate_valid === false && b.candidate_valid !== false) add('scope_boundary_defect', 'candidate response refusal lost (' + a.candidate_valid + ' -> ' + b.candidate_valid + ')');
  else if (a.candidate_valid !== b.candidate_valid) add(ex.expected_refusal ? 'expected_refusal' : 'unexpected_behavioral_change', 'candidate_valid ' + a.candidate_valid + ' -> ' + b.candidate_valid);
  // Refusals.
  for (const code of a.refusal_codes) if (!b.refusal_codes.includes(code)) add(QUOTE_CODES.test(code) ? 'quote_or_span_integrity_defect' : 'scope_boundary_defect', 'refusal lost: ' + code);
  for (const code of b.refusal_codes) if (!a.refusal_codes.includes(code)) add(has(ex.expected_refusal, code) || ex.expected_refusal === true ? 'expected_refusal' : 'unexpected_behavioral_change', 'refusal gained: ' + code);
  // Conditions.
  const cids = [...new Set([...Object.keys(a.conditions), ...Object.keys(b.conditions)])].sort();
  for (const c of cids) {
    const x = a.conditions[c], y = b.conditions[c];
    if (!x || !y) { add('unknown_comparison_state', 'condition ' + c + ' present on one side only'); continue; }
    const ra = RANK[x.status], rb = RANK[y.status];
    if (rb > ra) {
      if (LOW_STATES.includes(x.status)) addFC('favorable_transition_requiring_human_review', c + ' ' + x.status + ' -> ' + y.status + ' (unsupported, ambiguous or not-assessed state became favourable)');
      else add('favorable_transition_requiring_human_review', c + ' ' + x.status + ' -> ' + y.status);
    } else if (rb < ra) add(has(ex.expected_degradation, c) ? 'expected_safe_degradation' : 'unexpected_behavioral_change', c + ' ' + x.status + ' -> ' + y.status);
    if (['supported', 'gap'].includes(y.status) && typeof y.evidence_trail === 'number' && y.evidence_trail < 1) addFC('favorable_transition_requiring_human_review', c + ' is ' + y.status + ' without a deterministic evidence trail');
    if (x.limitation_present && !y.limitation_present) add('limitation_removed_or_weakened', c + ' lost its limitation');
    else if (x.limitation_kinds.some((k) => !y.limitation_kinds.includes(k))) add('limitation_removed_or_weakened', c + ' limitation lost kind(s) ' + x.limitation_kinds.filter((k) => !y.limitation_kinds.includes(k)).join(','));
    else if (x.limitation_count === 1 && y.limitation_count !== 1) add(y.limitation_count === 0 ? 'limitation_removed_or_weakened' : 'unexpected_behavioral_change', c + ' limitation count ' + x.limitation_count + ' -> ' + y.limitation_count);
    else if (x.limitation_sha !== y.limitation_sha) add(y.limitation_kinds.length > x.limitation_kinds.length && has(ex.expected_degradation, c) ? 'expected_safe_degradation' : 'unexpected_behavioral_change', c + ' limitation text changed (kinds ' + x.limitation_kinds.join(',') + ' -> ' + y.limitation_kinds.join(',') + ')');
    if (x.review_routed === true && y.review_routed !== true) add('limitation_removed_or_weakened', c + ' human-review route removed');
    if (rb === ra && !eq(x.reasons, y.reasons)) add(has(ex.expected_degradation, c) ? 'expected_safe_degradation' : 'unexpected_behavioral_change', c + ' reasons changed');
    if (x.proposed_status !== y.proposed_status && !ex.quote_changes) add('unexpected_behavioral_change', c + ' proposed status ' + x.proposed_status + ' -> ' + y.proposed_status);
  }
  // Quotations and offsets.
  const keys = [...new Set([...Object.keys(a.quotes), ...Object.keys(b.quotes)])].sort();
  for (const k of keys) {
    const x = a.quotes[k], y = b.quotes[k];
    if (!x || !y) { add(ex.quote_changes ? 'presentation_only' : 'quote_or_span_integrity_defect', 'quotation ' + k + (x ? ' removed' : ' added') + (ex.quote_changes ? ' (explained: ' + ex.quote_changes + ')' : ' without a recorded explanation')); continue; }
    const ua = USABLE.includes(x.status), ub = USABLE.includes(y.status);
    if (ua && !ub) add(has(ex.expected_degradation, x.condition_id) || has(ex.expected_degradation, k) ? 'expected_safe_degradation' : 'unexpected_behavioral_change', 'quotation ' + k + ' ' + x.status + ' -> ' + y.status);
    else if (!ua && ub) { if (ex.quote_changes) add('favorable_transition_requiring_human_review', 'quotation ' + k + ' ' + x.status + ' -> ' + y.status); else addFC('quote_or_span_integrity_defect', 'quotation ' + k + ' became usable (' + x.status + ' -> ' + y.status + ') without a recorded explanation'); }
    else if (x.status !== y.status || x.reason !== y.reason) add('unexpected_behavioral_change', 'quotation ' + k + ' ' + x.status + '/' + x.reason + ' -> ' + y.status + '/' + y.reason);
    if (x.text_sha !== y.text_sha) add(ex.quote_changes ? 'presentation_only' : 'quote_or_span_integrity_defect', 'quotation ' + k + ' text changed' + (ex.quote_changes ? ' (explained: ' + ex.quote_changes + ')' : ' without a recorded explanation'));
    if (x.start !== y.start || x.end !== y.end) add(ex.offsets_recomputed || ex.quote_changes ? 'presentation_only' : 'quote_or_span_integrity_defect', 'quotation ' + k + ' offsets ' + x.start + '-' + x.end + ' -> ' + y.start + '-' + y.end + (ex.offsets_recomputed || ex.quote_changes ? ' (explained)' : ' without a recorded explanation'));
  }
  // Conflicts, Cognitive Controls, structure.
  const ca = a.conflicts || [], cb = b.conflicts || [];
  for (const k of ca) if (!cb.includes(k)) add('unexpected_behavioral_change', 'conflict lost: ' + k);
  for (const k of cb) if (!ca.includes(k)) add(ex.expected_degradation ? 'expected_safe_degradation' : 'unexpected_behavioral_change', 'conflict gained: ' + k);
  const da = a.cc_defects || [], db = b.cc_defects || [];
  for (const d of da) if (!db.includes(d)) add('unexpected_behavioral_change', 'Cognitive Control defect lost: ' + d);
  for (const d of db) if (!da.includes(d)) add(ex.expected_degradation ? 'expected_safe_degradation' : 'unexpected_behavioral_change', 'Cognitive Control defect gained: ' + d);
  if ((b.controls_withheld || 0) > (a.controls_withheld || 0)) add('unexpected_behavioral_change', 'Cognitive Controls withheld ' + a.controls_withheld + ' -> ' + b.controls_withheld);
  if (!eq(a.structure, b.structure)) add(ex.structure_change ? 'presentation_only' : 'unexpected_behavioral_change', 'graph or envelope structure changed' + (ex.structure_change ? ' (explained: ' + ex.structure_change + ')' : ' without a recorded explanation'));
  if (!F.length) add('presentation_only', 'behaviour hash changed with no behavioural field changed');
  return { scenario_id: id, findings: F, verdict: verdictOf(F), applies_changes: false };
}

export function compareGraphs(ga, gb, ctx = {}, scenarioId = 'graph') {
  let a, b;
  try { a = recordFromGraph(ga, { scenarioId, pkg: ctx.pkg || 'phase6-library' }); } catch (e) { a = null; }
  try { b = recordFromGraph(gb, { scenarioId, pkg: ctx.pkg || 'phase6-library' }); } catch (e) { b = null; }
  return compareRecords(a, b, ctx);
}

export function compareManifests(A, B, ctx = {}) {
  const top = [];
  const check = (m, side) => {
    if (!m || typeof m !== 'object') return side + ' manifest missing';
    if (m.baseline_format_version !== BASELINE_FORMAT_VERSION) return side + ' manifest format ' + m.baseline_format_version;
    if (!Array.isArray(m.records)) return side + ' manifest has no records';
    if (!manifestHashValid(m)) return side + ' manifest hash does not match its content';
    return null;
  };
  for (const [m, s] of [[A, 'before'], [B, 'after']]) { const p = check(m, s); if (p) top.push({ class: 'unknown_comparison_state', detail: p, fail_closed: true, route: 'fail_closed' }); }
  if (top.length) return { verdict: 'fail_closed', findings: top, scenarios: [], counts: {}, compared: 0, applies_changes: false };
  const ia = new Map(A.records.map((r) => [r.package + '|' + r.scenario_id, r])), ib = new Map(B.records.map((r) => [r.package + '|' + r.scenario_id, r]));
  if (ia.size !== A.records.length || ib.size !== B.records.length) top.push({ class: 'unknown_comparison_state', detail: 'duplicate scenario identifiers in a manifest', fail_closed: true, route: 'fail_closed' });
  for (const k of ia.keys()) if (!ib.has(k)) top.push({ class: 'unknown_comparison_state', detail: 'scenario ' + k + ' missing from the after manifest', fail_closed: true, route: 'fail_closed' });
  for (const k of ib.keys()) if (!ia.has(k)) top.push({ class: 'unknown_comparison_state', detail: 'scenario ' + k + ' missing from the before manifest', fail_closed: true, route: 'fail_closed' });
  const scenarios = [];
  for (const [k, ra] of ia) {
    const rb = ib.get(k); if (!rb) continue;
    const r = compareRecords(ra, rb, (ctx.per_scenario && ctx.per_scenario[ra.scenario_id]) || ctx.default || {});
    if (r.findings.length) scenarios.push(r);
  }
  const all = [...top, ...scenarios.flatMap((s) => s.findings)];
  const counts = {}; for (const f of all) counts[f.class] = (counts[f.class] || 0) + 1;
  return { verdict: verdictOf(all), findings: top, scenarios, counts, compared: ia.size, applies_changes: false };
}

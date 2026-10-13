// JRS ADAPTIVE RELIABILITY: the Change Proposal Compiler (0.4.1-local).
//
// Turns Reliability Knowledge Base entries plus a requested change into a
// structured proposal, or refuses or blocks it. A compiled proposal is never an
// approved change.
//
// What the compiler does NOT trust: requester-declared risk. Descriptor fields
// (scope_delta, evidence_delta, limitation_delta, favorability_delta) can only
// add refusals; they can never lower a classification. For any behavioural
// proposal (by change type, behaviour flag, or a target inside the Engine) the
// compiler requires an observed-change record produced by running the request's
// isolated patch against the synthetic fixtures (observed-change.mjs), bound to
// this exact request and to the current packages by hash. Without one, the
// proposal is blocked_missing_observed_change.
//
// Authorization states: awaiting_human_review, blocked_missing_observed_change,
// blocked_pending_human_disposition, rejected_by_compiler. None is an approval.
// human_disposition is always "not_recorded": only a person records one, outside this system.

import { posix } from 'node:path';
import { createHash } from 'node:crypto';
import { CHANGE_TYPES, BEHAVIOURAL_CHANGE_TYPES, COMPONENTS, CONDITIONS, PROTECTED_TARGETS, REGULATED_DOMAINS, findUnqualifiedStatusWord, findUnqualifiedClaim,
  CHANGE_CONTROL_VERSION, PERMITTED_TARGET_ROOTS, ENGINE_TARGET_ROOTS, RELEASE_TARGETS, RELEASE_ADVANCEMENT } from './vocab.mjs';
import { verifyObservedChange } from './observed-change.mjs';
import { changeControlHash, baselineHash } from './identity.mjs';

const DELTAS = { scope_delta: ['none', 'narrow', 'broaden'], refusal_delta: ['none', 'broaden', 'narrow', 'remove'], evidence_delta: ['none', 'raise', 'lower'],
  limitation_delta: ['none', 'add', 'weaken', 'remove'], favorability_delta: ['none', 'lower_only', 'raise'] };
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((y) => [y, x[y]])) : x));

export const AUTHORIZATION_STATES = Object.freeze(['awaiting_human_review', 'blocked_missing_observed_change', 'blocked_pending_human_disposition', 'rejected_by_compiler']);
export const REJECTION_CODES = Object.freeze(['unknown_trigger', 'unknown_change_type', 'unknown_component', 'malformed_change_descriptor',
  'scope_expansion_into_regulated_domain', 'refusal_boundary_removed', 'evidence_requirement_lowered', 'limitation_removed_or_weakened',
  'behavioural_change_without_test_plan', 'external_result_claimed_from_local_material', 'production_or_public_target', 'target_path_invalid',
  'target_outside_change_control_workspace', 'rollback_missing', 'compatibility_analysis_missing', 'synthetic_fixture_treated_as_independent',
  'self_authorization_attempt', 'forbidden_status_wording', 'release_gate_advancement_not_authorized', 'self_declared_drift_not_accepted',
  'human_disposition_not_settable', 'observed_refusal_removed', 'observed_limitation_removed', 'observed_proof_edge', 'observed_excluded_domain_unrefused',
  'observed_conflict_review_lost', 'observed_independent_relabel']);

// Free-text fields scanned for claims and wording. Any other string field is scanned too.
export const FREE_TEXT_FIELDS = Object.freeze(['summary', 'claims', 'rollback', 'compatibility_analysis', 'rationale', 'limitation', 'implementation_notes', 'documentation_notes']);
const SCOPE_WIDENING = /\b(?:extend|expand|include|cover|add|accept|assess|allow|support|evaluate|review|handle|process|score|analy[sz]e|apply)\w*\b[^.;]{0,50}\b(?:employment|employee|hiring|hire|promotion|disciplin\w*|terminat\w*|dismiss\w*|housing|tenan\w*|lending|loan|credit|insurance|medical|clinical|patient|legal outcome|court|HR)\b/i;
const BEHAVIOUR_FLAGS = ['alters_prompt', 'alters_rule', 'alters_threshold', 'alters_version'];

// Normalises a proposed target path and classifies it. Never touches the file system.
export function normalizeTarget(t) {
  if (typeof t !== 'string' || !t.length || t.includes('\0')) return { ok: false, code: 'target_path_invalid', detail: 'not a path' };
  let decoded = t;
  try { decoded = decodeURIComponent(t); } catch { return { ok: false, code: 'target_path_invalid', detail: 'malformed percent-encoding' }; }
  if (decoded !== t) return { ok: false, code: 'target_path_invalid', detail: 'percent-encoded path not accepted: ' + t };
  const unified = t.replace(/\\/g, '/');
  if (unified.startsWith('/') || /^[A-Za-z]:/.test(unified) || unified.startsWith('~')) return { ok: false, code: 'target_path_invalid', detail: 'absolute path: ' + t };
  const n = posix.normalize(unified).replace(/^\.\/+/, '');
  if (n === '..' || n.startsWith('../') || n === '.' || n === '') return { ok: false, code: 'target_path_invalid', detail: 'escapes the repository: ' + t };
  if (PROTECTED_TARGETS.some((re) => re.test(n))) return { ok: false, code: 'production_or_public_target', detail: t + ' normalises to ' + n, normalized: n };
  if (!PERMITTED_TARGET_ROOTS.some((r) => n.startsWith(r))) return { ok: false, code: 'target_outside_change_control_workspace', detail: n, normalized: n };
  return { ok: true, normalized: n };
}

function textFields(r) {
  const out = [];
  for (const [k, v] of Object.entries(r)) {
    if (['isolated_patch', 'change', 'test_plan', 'triggering_knowledge_ids', 'affected_engine_components', 'targets', 'scope_additions'].includes(k)) continue;
    if (typeof v === 'string') out.push([k, v]); else if (Array.isArray(v)) v.forEach((x, i) => { if (typeof x === 'string') out.push([k + '[' + i + ']', x]); });
  }
  return out;
}

export function compileChangeProposal(request, knowledgeEntries, { observedChange = null } = {}) {
  const r = request || {}, ch = r.change || {}, rej = [];
  const add = (code, detail) => rej.push({ code, detail });
  const kb = new Map((knowledgeEntries || []).map((e) => [e.knowledge_id, e]));
  const triggers = Array.isArray(r.triggering_knowledge_ids) ? r.triggering_knowledge_ids : [];
  if (!triggers.length) add('unknown_trigger', 'no triggering knowledge entry');
  for (const t of triggers) if (!kb.has(t)) add('unknown_trigger', t);
  if (!CHANGE_TYPES.includes(r.proposed_change_type)) add('unknown_change_type', String(r.proposed_change_type));
  const comps = Array.isArray(r.affected_engine_components) ? r.affected_engine_components : [];
  if (!comps.length) add('unknown_component', 'no component named');
  for (const c of comps) if (!(c in COMPONENTS)) add('unknown_component', c);
  for (const [k, allowed] of Object.entries(DELTAS)) if (!allowed.includes(ch[k] === undefined ? 'none' : ch[k])) add('malformed_change_descriptor', k + '=' + ch[k]);
  if ('expected_drift' in r || 'observed_change' in r) add('self_declared_drift_not_accepted', 'drift is observed from the isolated patch, never declared');
  if ('human_disposition' in r) add('human_disposition_not_settable', 'only a person records a disposition, outside this system');

  // Targets: normalised before any protected-path comparison.
  const targets = Array.isArray(r.targets) ? r.targets : [];
  const normalized = [];
  for (const t of targets) { const n = normalizeTarget(t); if (!n.ok) add(n.code, n.detail); if (n.normalized) normalized.push(n.normalized); }

  // Free text: every string field is scanned for status wording, unqualified claims and scope widening.
  const texts = textFields(r);
  for (const [k, v] of texts) {
    const w = findUnqualifiedStatusWord(v); if (w) add('forbidden_status_wording', k + ': ' + w);
    const c = findUnqualifiedClaim(v); if (c) add('external_result_claimed_from_local_material', k + ': ' + c);
    const wm = SCOPE_WIDENING.exec(v);
    if (wm && !/refus|exclu|reject|block|deny|out[- ]of[- ]scope/i.test(wm[0])) add('scope_expansion_into_regulated_domain', k + ': ' + wm[0]);
    const ra = RELEASE_ADVANCEMENT.exec(v); if (ra) add('release_gate_advancement_not_authorized', k + ': ' + ra[0]);
  }
  // Declared descriptors can only add refusals.
  if (ch.scope_delta === 'broaden' || (r.scope_additions || []).some((d) => REGULATED_DOMAINS.includes(d))) add('scope_expansion_into_regulated_domain', 'declared');
  if (ch.refusal_delta === 'narrow' || ch.refusal_delta === 'remove') add('refusal_boundary_removed', 'refusal_delta=' + ch.refusal_delta);
  if (ch.evidence_delta === 'lower') add('evidence_requirement_lowered', 'evidence_delta=lower');
  if (ch.limitation_delta === 'weaken' || ch.limitation_delta === 'remove') add('limitation_removed_or_weakened', 'limitation_delta=' + ch.limitation_delta);
  if (comps.includes('evaluation_factory') || normalized.some((n) => RELEASE_TARGETS.some((re) => re.test(n)))) add('release_gate_advancement_not_authorized', 'targets the evaluation factory, registry or gate simulator');

  // Behavioural is derived from the change type, flags and targets, not from a declaration that nothing changes.
  const behavioural = BEHAVIOURAL_CHANGE_TYPES.includes(r.proposed_change_type) || BEHAVIOUR_FLAGS.some((f) => ch[f] === true)
    || normalized.some((n) => ENGINE_TARGET_ROOTS.some((root) => n.startsWith(root)));
  const tp = r.test_plan || {};
  const plan = { regression: tp.regression || [], mutation: tp.mutation || [], fixtures: tp.fixtures || [] };
  if (behavioural && (!plan.regression.length || !plan.mutation.length)) add('behavioural_change_without_test_plan', 'regression and mutation tests are both required');
  if (!r.rollback || !String(r.rollback).trim()) add('rollback_missing', 'no rollback statement');
  if (!r.compatibility_analysis || !String(r.compatibility_analysis).trim()) add('compatibility_analysis_missing', 'no compatibility analysis');
  if (r.fixture_origin === 'synthetic_engineering' && r.claimed_independent === true) add('synthetic_fixture_treated_as_independent', 'synthetic fixture claimed as independent');
  if (/independent|adjudicated|holdout|external/i.test(String(r.fixture_label_status || ''))) add('synthetic_fixture_treated_as_independent', 'label status ' + r.fixture_label_status);
  if (r.requested_authorization_state && r.requested_authorization_state !== 'awaiting_human_review') add('self_authorization_attempt', r.requested_authorization_state);

  // Observed change: required for behavioural proposals; classifies risk from what actually happened.
  let observed = null, observedProblems = [];
  if (behavioural) {
    observedProblems = observedChange ? verifyObservedChange(observedChange, r, { change_control_sha256: changeControlHash(), baseline_sha256: baselineHash() }) : ['no observed-change record'];
    if (!observedProblems.length) {
      observed = observedChange.summary;
      if (observed.refusals_removed) add('observed_refusal_removed', observed.refusals_removed + ' refusal(s) disappeared');
      if (observed.limitations_removed) add('observed_limitation_removed', observed.limitations_removed + ' limitation(s) removed or weakened');
      if (observed.proof_edges) add('observed_proof_edge', observed.proof_edges + ' edge(s) imply proof');
      if (observed.excluded_domain_unrefused) add('observed_excluded_domain_unrefused', observed.excluded_domain_unrefused + ' excluded-domain fixture(s) no longer refused');
      if (observed.conflict_review_lost) add('observed_conflict_review_lost', observed.conflict_review_lost + ' conflict(s) no longer routed to review');
      if (observed.relabelled_independent) add('observed_independent_relabel', 'fixture relabelled independent');
    }
  }

  const conds = [...new Set(triggers.flatMap((t) => (kb.get(t) || {}).affected_conditions || []).filter((c) => CONDITIONS.includes(c)))].sort();
  const body = { triggering_knowledge_ids: [...triggers].sort(), proposed_change_type: r.proposed_change_type, affected_engine_components: [...comps].sort(), summary: r.summary || '',
    targets: normalized.sort(), change: Object.fromEntries(Object.keys(DELTAS).map((k) => [k, ch[k] || 'none']).concat(BEHAVIOUR_FLAGS.map((f) => [f, ch[f] === true]))),
    patch_sha256: r.isolated_patch ? 'sha256:' + sha(canon(r.isolated_patch)) : 'none' };
  const proposal = {
    proposal_id: 'CP-' + sha(canon(body)).slice(0, 10), compiler_version: CHANGE_CONTROL_VERSION, ...body, affected_conditions: conds,
    behavioural, compatibility_impact: r.compatibility_analysis || null,
    risk_of_change: behavioural ? 'Alters local Engine behaviour; risk is classified from the observed-change record, not from declarations.' : 'No change to Engine behaviour is requested.',
    rollback_requirement: r.rollback || null,
    required_regression_tests: [...plan.regression].sort(), required_mutation_tests: [...plan.mutation].sort(), required_fixtures: [...plan.fixtures].sort(),
    version_increment_required: behavioural, human_review_required: true,
    observed_change: observed ? Object.assign({ record_sha256: observedChange.record_sha256, run_id: observedChange.identity.run_id }, observed) : null,
    observed_change_problems: observedProblems, human_disposition: 'not_recorded',
    claim_boundary: 'A proposal is not an approved change. A passing test is not an accuracy claim. A larger synthetic corpus is not independent validation.',
    limitations: ['Prepared from local synthetic observations only.', 'Not applied to any Engine version.', 'Automated checks identify specified local risks; reworded or unrecognised bypass attempts may remain possible.',
      'Requires a recorded human decision before any implementation outside an isolated test copy.'],
  };
  let state = 'awaiting_human_review';
  if (rej.length) state = 'rejected_by_compiler';
  else if (behavioural && observedProblems.length) state = 'blocked_missing_observed_change';
  else if (observed && observed.favourable_transitions > 0) state = 'blocked_pending_human_disposition';
  return { ok: state === 'awaiting_human_review', proposal: Object.assign(proposal, { authorization_state: state, rejection_reasons: rej }) };
}

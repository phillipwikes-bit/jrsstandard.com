// JRS PHASE 8: change-impact and rollback model for future Engine proposals.
//
// Conservative rule: no later change may be treated as neutral when it can alter a
// refusal boundary, evidence requirement, condition status, limitation or review
// route. A proposal that touches any of those surfaces is classed by the strictest
// class that covers them, whatever class the proposer declared.

export const CONSERVATIVE_RULE = 'No later change may be treated as neutral when it can alter a refusal boundary, evidence requirement, condition status, limitation, or review route.';
export const SENSITIVE_SURFACES = Object.freeze(['refusal_boundary', 'evidence_requirement', 'condition_status', 'limitation', 'review_route']);

// Ordered from least to most demanding. Later entries are stricter.
export const CHANGE_CLASSES = Object.freeze([
  { id: 'documentation-only', evidence: 'Diff showing only documents changed; claim guard clean.', regression: 'Document checks of the affected package.', new_candidate_version: false, invalidates_sealed_evaluation: false, rollback: 'Revert the document.', owner_decision: false, counsel_trigger: 'Any change to rights, attribution, public or commercial language.' },
  { id: 'test-only', evidence: 'Diff showing only tests changed; mutation run of the affected suite with every mutation caught directly.', regression: 'Full suite of the affected package plus its mutation group.', new_candidate_version: false, invalidates_sealed_evaluation: false, rollback: 'Revert the test; earlier recorded result stays as recorded.', owner_decision: true, counsel_trigger: 'None unless the test encodes a scope or legal boundary.' },
  { id: 'rule-pack change', evidence: 'Sealed positive, nearby benign, malformed and reordered scenarios per changed rule, sealed before the change; differential against the current candidate.', regression: 'All existing inputs, all sealed scenarios, stability transforms, over-refusal table, mutation group.', new_candidate_version: true, invalidates_sealed_evaluation: true, rollback: 'Restore the prior signed pack set; packs are versioned and content-sealed.', owner_decision: true, counsel_trigger: 'Rules touching excluded domains or employment content.' },
  { id: 'intake-boundary change', evidence: 'Benign controls showing no in-scope record is refused; excluded-domain scenarios showing refusal holds.', regression: 'All refusal and scope scenarios across packages; differential on every existing input.', new_candidate_version: true, invalidates_sealed_evaluation: true, rollback: 'Restore the previous intake module and its version.', owner_decision: true, counsel_trigger: 'Always (scope of excluded domains).' },
  { id: 'evidence-validation change', evidence: 'Quote-resolution and offset scenarios, including unrelated-quotation cases.', regression: 'All existing inputs, Phase 6 library, Phase 7 scenarios, stability transforms.', new_candidate_version: true, invalidates_sealed_evaluation: true, rollback: 'Restore the previous validation module and version.', owner_decision: true, counsel_trigger: 'None unless evidence language reaches public text.' },
  { id: 'status-routing change', evidence: 'Sealed expectation for every affected condition; no favourable transition without explicit owner authorization.', regression: 'All existing inputs and scenarios; differential classification with fail-closed classes.', new_candidate_version: true, invalidates_sealed_evaluation: true, rollback: 'Restore previous routing and version.', owner_decision: true, counsel_trigger: 'If any status becomes more favourable.' },
  { id: 'prompt change', evidence: 'Prompt diff, prompt version increment, response-contract compatibility check.', regression: 'All contract and graph fixtures; differential on mocked responses.', new_candidate_version: true, invalidates_sealed_evaluation: true, rollback: 'Restore the previous prompt version.', owner_decision: true, counsel_trigger: 'If instructions about excluded domains or legal conclusions change.' },
  { id: 'evaluation-protocol change', evidence: 'Protocol diff and new seal; reason recorded.', regression: 'Protocol validation; Phase 8 governance suite.', new_candidate_version: false, invalidates_sealed_evaluation: true, rollback: 'Restore the previous sealed protocol.', owner_decision: true, counsel_trigger: 'Any change to material classes, roles or authorization.' },
  { id: 'model/provider change', evidence: 'Identifier, version, review date and reason recorded; offline fixtures re-run; a new sealed evaluation is required before any statement about behaviour.', regression: 'Everything above plus a new protocol freeze.', new_candidate_version: true, invalidates_sealed_evaluation: true, rollback: 'Restore the previous identifier; never silently fall back.', owner_decision: true, counsel_trigger: 'Always (data handling and provider terms).', requires_evaluation_review: true },
  { id: 'public-claim change', evidence: 'Claim, evidence, limitation, rights and regulatory implication recorded; publication review.', regression: 'Claim guard on all public text; zero-drift guards.', new_candidate_version: false, invalidates_sealed_evaluation: false, rollback: 'Restore previous public text and re-verify production bytes.', owner_decision: true, counsel_trigger: 'Always.' },
]);
export const CLASS_IDS = CHANGE_CLASSES.map((c) => c.id);
const strictness = (id) => CLASS_IDS.indexOf(id);

// The least strict class that may carry each sensitive surface.
const SURFACE_FLOOR = Object.freeze({ refusal_boundary: 'intake-boundary change', evidence_requirement: 'evidence-validation change', condition_status: 'status-routing change', limitation: 'status-routing change', review_route: 'status-routing change' });
const NEUTRAL = ['documentation-only', 'test-only'];

// proposal: { declared_class, touches: [paths or surface ids], surfaces: [SENSITIVE_SURFACES], evidence: {...}, evaluation_review: bool, owner_decision_ref, rollback_plan }
export function classifyProposal(proposal) {
  const out = { problems: [] };
  if (!proposal || !CLASS_IDS.includes(proposal.declared_class)) return { problems: ['unknown or missing declared class'], effective_class: null };
  const surfaces = (proposal.surfaces || []).filter((s) => SENSITIVE_SURFACES.includes(s));
  let effective = proposal.declared_class;
  for (const s of surfaces) if (strictness(SURFACE_FLOOR[s]) > strictness(effective)) effective = SURFACE_FLOOR[s];
  const touches = proposal.touches || [];
  const pathFloor = [[/rule-packs?\//, 'rule-pack change'], [/scope\.mjs|intake/, 'intake-boundary change'], [/quote-resolution|span-verify|evidence\.mjs|graph-validate|result-validate/, 'evidence-validation change'], [/conditions\.mjs|contradictions\.mjs|routing/, 'status-routing change'], [/prompt/, 'prompt change'], [/model|provider/, 'model/provider change'], [/\.html$|^api\/|public/, 'public-claim change']];
  for (const t of touches) for (const [re, cls] of pathFloor) if (re.test(t) && strictness(cls) > strictness(effective)) effective = cls;
  if (effective !== proposal.declared_class) out.problems.push('declared class understated; effective class is ' + effective);
  if (NEUTRAL.includes(effective) && surfaces.length) out.problems.push('a change touching a sensitive surface cannot be neutral');
  const c = CHANGE_CLASSES.find((x) => x.id === effective);
  if (c.owner_decision && !proposal.owner_decision_ref) out.problems.push('owner decision reference required');
  if (!proposal.rollback_plan) out.problems.push('rollback plan required');
  if (c.requires_evaluation_review && proposal.evaluation_review !== true) out.problems.push('model or provider change requires evaluation review');
  if (/always/i.test(c.counsel_trigger) && !proposal.counsel_review_ref) out.problems.push('counsel review required');
  return Object.assign(out, { effective_class: effective, requirements: c, neutral: NEUTRAL.includes(effective) && !surfaces.length });
}

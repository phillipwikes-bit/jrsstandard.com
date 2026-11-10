// JRS ADAPTIVE RELIABILITY: deterministic regression selection.
//
// Given a proposal and its impact analysis, names the minimum local test set and
// why each test is in it. It identifies evidence a human needs before deciding.
// It never decides that a change is safe; the output carries no such field.

import { SAFETY_STATEMENT } from './vocab.mjs';

export const TEST_CATALOG = Object.freeze([
  { id: 'baseline_fixtures', command: 'node tools/engine-evidence-graph-replay.mjs --no-write', protects: 'unintended change to any v0.3 fixture outcome',
    covers: ['*'] },
  { id: 'v0.1_compatibility', command: 'node tests/engine-assurance/run.mjs', protects: 'accidental edits to the frozen v0.1 assurance package', covers: ['codebook_mapping', 'prompt_contract'] },
  { id: 'v0.2_contract', command: 'node tests/engine-evidence-contract/run.mjs', protects: 'accidental edits to the frozen v0.2 contract and its bridge', covers: ['codebook_mapping', 'prompt_contract', 'controls'] },
  { id: 'v0.3_graph', command: 'node tests/engine-evidence-graph/run.mjs', protects: 'graph rule, traversal, identity and edge-meaning regressions', covers: ['*'] },
  { id: 'refusal', command: 'node tests/engine-adaptive-reliability/run.mjs --only refusal', protects: 'an excluded-domain or instruction record that stops being refused or quarantined',
    covers: ['scope', 'response', 'compiler', 'prompt_contract'] },
  { id: 'mutation', command: 'node tests/engine-adaptive-reliability/run.mjs --only mutation', protects: 'a guard that can be removed without any test failing', covers: ['*'] },
  { id: 'stability', command: 'node tests/engine-adaptive-reliability/run.mjs --only stability', protects: 'irrelevant record edits changing outcomes, or meaningful edits leaving no trace',
    covers: ['quote_resolution', 'contradictions', 'conditions', 'scope', 'compiler', 'assertions'] },
  { id: 'drift', command: 'node tests/engine-adaptive-reliability/run.mjs --only drift', protects: 'an unexplained or unsafe output change between versions', covers: ['*'] },
  { id: 'claim_guard', command: 'node tests/engine-adaptive-reliability/run.mjs --only claims', protects: 'proof, validation or readiness language entering outputs or documents',
    covers: ['assertions', 'graph_validate', 'controls', 'documentation', 'compiler'] },
  { id: 'workbench_rendering', command: 'node tests/engine-adaptive-reliability/run.mjs --only console', protects: 'a static page gaining scripts, forms, network access or approval controls',
    covers: ['documentation', 'controls', 'compiler'] },
  { id: 'evaluation_separation', command: 'node tests/engine-evidence-graph/run.mjs (section F)', protects: 'local or synthetic material passing a separation check',
    covers: ['evaluation_factory', 'fixtures'] },
]);

export function selectRegressionTests(proposal, impact) {
  const comps = (proposal && proposal.affected_engine_components) || [];
  const behavioural = impact && impact.impact_class !== 'no_behavioral_change';
  const selected = [], excluded = [];
  for (const t of TEST_CATALOG) {
    const hit = t.covers.includes('*') ? (behavioural || comps.includes('fixtures') || comps.includes('tests')) : comps.some((c) => t.covers.includes(c));
    let why = null;
    if (hit) why = t.covers.includes('*') ? 'applies to every behavioural or fixture change' : 'covers affected component(s): ' + comps.filter((c) => t.covers.includes(c)).join(', ');
    if (!why && impact && impact.refusal_behavior !== 'unchanged' && t.id === 'refusal') why = 'refusal behaviour would become ' + impact.refusal_behavior;
    if (!why && impact && impact.condition_can_become_more_favorable && ['drift', 'stability'].includes(t.id)) why = 'a condition could become more favourable';
    if (!why && impact && impact.limitation_removed_or_weakened && t.id === 'claim_guard') why = 'a limitation could be weakened';
    if (!why && proposal && proposal.proposed_change_type === 'documentation_correction' && t.id === 'claim_guard') why = 'documentation text is checked for unsupported claims';
    if (why) selected.push({ test: t.id, command: t.command, reason: why, protects_against: t.protects });
    else excluded.push({ test: t.id, reason: 'no affected component is covered by this test class and no impact flag requires it' });
  }
  // Coverage gaps: a component with no specific test class, or a behavioural change with no new fixture.
  const gaps = [];
  for (const c of comps) if (!TEST_CATALOG.some((t) => !t.covers.includes('*') && t.covers.includes(c)) && !['fixtures', 'tests'].includes(c)) gaps.push('no component-specific test class for ' + c);
  if (behavioural && !((proposal.required_fixtures || []).length)) gaps.push('behavioural change names no new synthetic fixture');
  if (behavioural && !((proposal.required_mutation_tests || []).length)) gaps.push('behavioural change names no mutation test');
  return {
    proposal_id: proposal && proposal.proposal_id, selected, excluded,
    insufficient_coverage: gaps.length > 0, coverage_gaps: gaps,
    full_suite_mandatory: Boolean(behavioural),
    full_suite_reason: behavioural ? 'any behavioural change requires every suite listed in REGRESSION_SELECTION_POLICY.md before a human decision' : 'not required for a fixture, test or documentation-only change; the owner may still require it',
    statement: SAFETY_STATEMENT,
  };
}

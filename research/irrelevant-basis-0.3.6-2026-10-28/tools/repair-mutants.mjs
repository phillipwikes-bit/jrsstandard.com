// Deliberately weakened copies of the 0.3.6 repair. Each must be caught by at least one behavioural test in
// tools/test-repair.mjs (a mutant is applied to a scratch copy of candidate/; the package itself is never changed).
const RP = 'lib/engine-evidence-graph-v0.3.4-research-candidate/research-profile.mjs', CO = 'lib/engine-evidence-graph-v0.3.4-research-candidate/compiler.mjs';
export const MUTANTS = Object.freeze([
  { id: 'RM-01', file: RP, what: 'an unassessed stated link counts as support again', from: "const supports = (a) => !v14 || a.relevance === 'human_assessed_relevant';", to: "const supports = (a) => !v14 || a.relevance !== 'human_assessed_irrelevant';" },
  { id: 'RM-02', file: RP, what: 'a person\'s "not relevant" assessment is ignored', from: '    if (a && !a.relevant) {', to: '    if (false) {' },
  { id: 'RM-03', file: RP, what: 'an assessor that is not a person is accepted', from: "    if (a.assessor_kind !== 'human') p.push(at + 'assessor_kind must be human');", to: '' },
  { id: 'RM-04', file: RP, what: 'an assessor named like a model is accepted', from: "    else if (NON_HUMAN_NAME.test(a.assessor_name)) p.push(at + 'assessor_name names a model or system, not a person');", to: '' },
  { id: 'RM-05', file: RP, what: 'the identifiable-basis support gate is removed (stated link supports again for that condition only)', from: 'r.requirement_visible = !!strongSupport.length && !unsupportedConclusion && cited.some(anchorText);', to: 'r.requirement_visible = !!strong.length && !unsupportedConclusion && cited.length > 0;' },
  { id: 'RM-06', file: CO, what: 'the compiler never applies the assessments', from: '    if (research) applyRelevanceAssessments(units, research.assessments, research.rules);', to: '' },
  { id: 'RM-07', file: RP, what: 'the unresolved-relevance reason is dropped for identifiable basis', from: "    if (relevanceUnresolved && !r.visible_gaps.length) r.review_reasons.unshift('stated_link_relevance_unresolved');\n    r.requirement_visible = !!strongSupport.length && !unsupportedConclusion", to: '    r.requirement_visible = !!strongSupport.length && !unsupportedConclusion' },
  { id: 'RM-08', file: RP, what: 'an assessment matches any sentence (statement identity not checked)', from: "by.get(createHash('sha256').update(u.text).digest('hex')) || null;", to: "(by.size ? [...by.values()][0] : null);" },
]);

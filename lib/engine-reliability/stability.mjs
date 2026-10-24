// JRS ENGINE RELIABILITY: metamorphic stability runner.
//
// A transform takes a base scenario (record, candidate response, submission)
// and produces a changed input, or takes the base output and produces a
// deliberately damaged copy. The base and transformed outputs are compared by
// the differential router, and the transformed output is also checked against
// the transform's own sealed expectation and the universal invariants.
//
// Invariant transforms must produce no behavioural difference (offsets may
// move, with that recorded). At least half of them start from a non-favourable
// baseline, so the set cannot show only that favourable results stay
// favourable. Results describe this synthetic context only.

import { compareRecords } from './differ.mjs';
import { recordFromGraph } from './baseline.mjs';
import { checkExpectation, universalInvariants, predictedObserved, submissionFor } from './library.mjs';
import { hashOf } from './canonical.mjs';

export const STABILITY_STATEMENT = 'Synthetic metamorphic checks in a limited local context. Not a robustness, reliability, accuracy or validation result.';
export const INVARIANT_VERDICTS = Object.freeze(['no_behavioral_difference', 'presentation_only']);

export function validateTransform(t) {
  const p = [];
  for (const k of ['id', 'name', 'kind', 'base', 'base_state', 'expected']) if (t[k] === undefined) p.push('missing ' + k);
  if (!['invariant', 'changed'].includes(t.kind)) p.push('kind must be invariant or changed');
  if (!['favorable', 'non_favorable'].includes(t.base_state)) p.push('base_state must be favorable or non_favorable');
  if (!t.make && !t.damage) p.push('transform needs make (input) or damage (output)');
  if (t.make && t.damage) p.push('transform has both make and damage');
  if (t.kind === 'invariant' && t.damage) p.push('an output-damage transform cannot be invariant');
  if (t.kind === 'invariant' && !(t.expected.verdict_in && t.expected.verdict_in.every((v) => INVARIANT_VERDICTS.includes(v)))) p.push('invariant transform must expect only no_behavioral_difference or presentation_only');
  if (t.known_open_failure && !(t.known_open_failure.knowledge_ref && Array.isArray(t.known_open_failure.predicted_failure))) p.push('known_open_failure needs knowledge_ref and predicted_failure');
  return p;
}

export function runTransforms(transforms, bases, compile, clock = '2026-10-17T00:00:00Z') {
  const results = [];
  const run = (scenario, id, record, response) => compile({ submission: Object.assign(submissionFor(scenario), { record_text: record }), candidateResponseText: response,
    executionMode: scenario.execution_mode, clock, fixtureId: id });
  const baseGraphs = {};
  for (const t of transforms) {
    const b = bases[t.base];
    const problems = validateTransform(t);
    if (!b) problems.push('base scenario not found: ' + t.base);
    if (problems.length) { results.push({ transform_id: t.id, kind: t.kind, result: 'unexpected', mismatches: problems }); continue; }
    let g0, g1;
    try { g0 = baseGraphs[t.base] || (baseGraphs[t.base] = run(b, 'BASE:' + t.base, b.record_text, b.candidate_response_text)); }
    catch (e) { results.push({ transform_id: t.id, kind: t.kind, result: 'unexpected', mismatches: ['base compile error: ' + String(e.message).slice(0, 200)] }); continue; }
    try {
      if (t.make) { const m = t.make({ record: b.record_text, response: b.candidate_response_text }); g1 = run(b, 'BASE:' + t.base, m.record !== undefined ? m.record : b.record_text, m.response !== undefined ? m.response : b.candidate_response_text); }
      else g1 = t.damage(JSON.parse(JSON.stringify(g0)));
    } catch (e) { results.push({ transform_id: t.id, kind: t.kind, result: 'unexpected', mismatches: ['transform compile error: ' + String(e.message).slice(0, 200)] }); continue; }
    const ra = recordFromGraph(g0, { scenarioId: t.base, pkg: 'phase6-stability' }), rb = recordFromGraph(g1, { scenarioId: t.base, pkg: 'phase6-stability' });
    const diff = compareRecords(ra, rb, { explanation: t.explanation || {} });
    const classes = [...new Set(diff.findings.map((f) => f.class))].sort();
    const P = [];
    const x = t.expected;
    if (x.verdict_in && !x.verdict_in.includes(diff.verdict)) P.push('verdict: expected one of ' + x.verdict_in.join('|') + ', got ' + diff.verdict);
    for (const c of x.classes_include || []) if (!classes.includes(c)) P.push('missing difference class ' + c + ' (got ' + classes.join(',') + ')');
    for (const c of x.classes_exclude || []) if (classes.includes(c)) P.push('unexpected difference class ' + c);
    if (x.graph) P.push(...checkExpectation(g1, x.graph));
    const violations = t.make ? universalInvariants(g1) : [];
    const favourable = diff.findings.filter((f) => f.class === 'favorable_transition_requiring_human_review').map((f) => f.detail);
    if (t.kind === 'invariant' && favourable.length) P.push('favourable transition on an invariant transform: ' + favourable.join('; '));
    let result;
    if (violations.length) result = 'unexpected';
    else if (!t.known_open_failure) result = P.length ? 'unexpected' : 'as_expected';
    else if (!P.length) result = 'known_open_failure_not_reproduced';
    else result = predictedObserved(g1, t.known_open_failure.predicted_failure) ? 'known_open_failure_reproduced' : 'unexpected';
    results.push({ transform_id: t.id, name: t.name, kind: t.kind, base: t.base, base_state: t.base_state, result, mismatches: P, universal_violations: violations,
      verdict: diff.verdict, classes, base_statuses: Object.fromEntries(g0.findings.map((f) => [f.condition_id, f.status])),
      statuses: Object.fromEntries(g1.findings.map((f) => [f.condition_id, f.status])), favourable_transitions: favourable });
  }
  const inv = results.filter((r) => r.kind === 'invariant');
  return { statement: STABILITY_STATEMENT, results, total: results.length, as_expected: results.filter((r) => r.result === 'as_expected').length,
    invariant_total: inv.length, invariant_non_favorable_base: inv.filter((r) => r.base_state === 'non_favorable').length, results_hash: hashOf(results) };
}

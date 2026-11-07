// JRS ADAPTIVE RELIABILITY: Metamorphic Stability Laboratory evaluator.
//
// Compares the graph for a transformed synthetic record against its base graph
// and against expectations written before the run. "Invariant" means the
// transformation should not change outcomes; "changed" means it should change
// them in a stated, traceable way. Results describe this synthetic context only.

export const STABILITY_STATEMENT = 'Synthetic metamorphic checks in a limited local context. Not a robustness, reliability, accuracy or validation result.';

const RANK = { not_assessed: 0, review_required: 1, gap: 2, supported: 3 };
const statusesOf = (g) => Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status]));
const typeCounts = (g, skip = []) => { const t = {}; for (const n of g.nodes) if (!skip.includes(n.type)) t[n.type] = (t[n.type] || 0) + 1; return t; };

export function evaluateTransform(spec, baseGraph, graph) {
  const p = [];
  const want = Object.assign({}, statusesOf(baseGraph), (spec.expected_changed && spec.expected_changed.statuses) || {});
  const got = statusesOf(graph);
  for (const [c, s] of Object.entries(want)) if (got[c] !== s) p.push('status ' + c + ': expected ' + s + ', got ' + got[c]);
  // Favourable transitions relative to the base: never allowed on an invariant transform, and on a changed
  // transform only where the expectation names that exact outcome.
  const base0 = statusesOf(baseGraph), favourable = [];
  for (const [c, to] of Object.entries(got)) if (RANK[to] > RANK[base0[c]]) favourable.push(c + ' ' + base0[c] + ' to ' + to);
  for (const f of favourable) { const c = f.split(' ')[0]; const allowed = spec.kind === 'changed' && spec.expected_changed && spec.expected_changed.statuses && spec.expected_changed.statuses[c] === got[c];
    if (!allowed) p.push('unapproved favourable transition: ' + f); }
  if (spec.expected_gate && graph.intake.decision !== spec.expected_gate) p.push('gate: expected ' + spec.expected_gate + ', got ' + graph.intake.decision);
  if (spec.expected_risk && graph.record_instruction_risk !== spec.expected_risk) p.push('instruction risk: expected ' + spec.expected_risk + ', got ' + graph.record_instruction_risk);
  const refusals = [...new Set(graph.refusals.map((r) => r.code))];
  for (const r of spec.expected_refusals || []) if (!refusals.includes(r)) p.push('missing refusal ' + r + ' (got ' + refusals.join(',') + ')');
  if (spec.kind === 'invariant') { const extra = refusals.filter((r) => !baseGraph.refusals.some((b) => b.code === r)); if (extra.length) p.push('new refusal on an invariant transform: ' + extra.join(',')); }
  const conflicts = graph.conflicts.map((c) => c.kind).sort();
  const wantConf = spec.expected_conflicts || baseGraph.conflicts.map((c) => c.kind).sort();
  if (JSON.stringify(conflicts) !== JSON.stringify(wantConf)) p.push('conflicts: expected ' + JSON.stringify(wantConf) + ', got ' + JSON.stringify(conflicts));
  for (const [o, s] of Object.entries(spec.expected_quote_statuses || {})) { const n = graph.nodes.find((x) => x.id === 'pq:' + o); if (!n || n.quote_resolution_status !== s) p.push('quote ' + o + ': expected ' + s + ', got ' + (n && n.quote_resolution_status)); }
  for (const [o, sec] of Object.entries(spec.expected_quote_sections || {})) { const n = graph.nodes.find((x) => x.id === 'pq:' + o); const got2 = n && n.candidate_locations && n.candidate_locations[0] && n.candidate_locations[0].section; if (got2 !== sec) p.push('quote ' + o + ' section: expected ' + sec + ', got ' + got2); }
  const defects = new Set(graph.cognitive_controls.map((c) => c.defect));
  for (const d of spec.expected_controls_include || []) if (!defects.has(d)) p.push('missing Cognitive Control defect ' + d);
  for (const d of spec.expected_controls_exclude || []) if (defects.has(d)) p.push('unexpected Cognitive Control defect ' + d);
  // Graph change.
  const gc = spec.expected_graph_change || {};
  if (gc.non_section_types_same) { const a = JSON.stringify(typeCounts(baseGraph, ['record_section', 'record_span'])), b = JSON.stringify(typeCounts(graph, ['record_section', 'record_span'])); if (a !== b) p.push('node types changed on an invariant transform: ' + a + ' to ' + b); }
  for (const [t, d] of Object.entries(gc.type_delta || {})) { const x = (typeCounts(graph)[t] || 0) - (typeCounts(baseGraph)[t] || 0); if (x !== d) p.push('node type ' + t + ': expected delta ' + d + ', got ' + x); }
  // Limitation and review route.
  for (const f of graph.findings) {
    const lim = graph.nodes.find((n) => n.id === 'lim:' + f.condition_id);
    if (f.status !== 'not_assessed' && !(lim && /Textual presence only/.test(lim.text))) p.push('presence limitation missing for ' + f.condition_id);
    if (f.condition_id === 'sufficiency' && f.status !== 'not_assessed' && !(lim && /visible documentation gaps only/.test(lim.text))) p.push('sufficiency limitation missing');
    if (!graph.edges.some((e) => e.from === 'find:' + f.condition_id && e.type === 'ROUTES_TO_REVIEW')) p.push(f.condition_id + ' not routed to human review');
  }
  if (spec.expected_limitation === 'refusal_boundary' && !graph.refusals.some((r) => /No assessment of the record/.test(r.boundary || ''))) p.push('refusal boundary statement missing');
  return { transform_id: spec.id, kind: spec.kind, result: p.length ? 'mismatch' : 'as_expected', mismatches: p, base_statuses: statusesOf(baseGraph), statuses: got, favourable_transitions: favourable,
    graph_sha256_changed: baseGraph.identity.graph_sha256 !== graph.identity.graph_sha256 };
}

const SUB = (id, record) => ({ submission_metadata: { submission_id: id }, scope_declaration: { record_type: 'supplier_access_exception_draft', record_state: 'completed_draft',
  content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false },
  declared_versions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.0-local', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' },
  requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: record });

// compile: the v0.3 compileEvidenceGraph (or an isolated copy of it).
export function runStabilityLab(transforms, bases, compile, clock = '2026-10-13T00:00:00Z') {
  const run = (id, record, response) => compile({ submission: SUB(id, record), candidateResponseText: response, executionMode: 'local_mocked', clock, fixtureId: id });
  const baseGraphs = Object.fromEntries(Object.entries(bases).map(([k, b]) => [k, run(k, b.record, b.response)]));
  const results = [];
  for (const t of transforms) {
    const b = bases[t.base], m = t.make(b);
    let g; try { g = run(t.id, m.record !== undefined ? m.record : b.record, m.response !== undefined ? m.response : b.response); }
    catch (e) { results.push({ transform_id: t.id, kind: t.kind, result: 'mismatch', mismatches: ['compile error: ' + e.message.slice(0, 300)] }); continue; }
    results.push(Object.assign({ name: t.name, base: t.base, lower_baseline: t.lower_baseline || null, expected_review: t.expected_review }, evaluateTransform(t, baseGraphs[t.base], g)));
  }
  return { statement: STABILITY_STATEMENT, results, as_expected: results.filter((r) => r.result === 'as_expected').length, total: results.length };
}

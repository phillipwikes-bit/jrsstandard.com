// JRS ADAPTIVE RELIABILITY: replay of a synthetic corpus against a compiler.
//
// Same comparison as the v0.3 replay, except that a null expectation field is
// not compared. Returns per-case mismatches; it never edits an expectation.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIMITATIONS } from '../engine-evidence-graph/contract.mjs';

export function loadCase(dir, id) {
  const sub = JSON.parse(readFileSync(join(dir, id + '.submission.json'), 'utf8'));
  if (typeof sub.record_text === 'string' && sub.record_text.startsWith('@file:')) sub.record_text = readFileSync(join(dir, sub.record_text.slice(6)), 'utf8');
  let response = null; try { response = readFileSync(join(dir, id + '.candidate-response.txt'), 'utf8'); } catch { /* deterministic case */ }
  return { submission: sub, response, expected: JSON.parse(readFileSync(join(dir, id + '.expected.json'), 'utf8')) };
}

export function compareCase(g, x) {
  const P = [];
  const cmp = (label, got, want) => { if (want !== null && want !== undefined && JSON.stringify(got) !== JSON.stringify(want)) P.push(label + ': expected ' + JSON.stringify(want) + ', got ' + JSON.stringify(got)); };
  cmp('gate', g.intake.decision, x.gate_decision);
  cmp('instruction_risk', g.record_instruction_risk, x.record_instruction_risk);
  cmp('candidate_valid', g.candidate.valid, x.candidate_valid);
  cmp('statuses', Object.fromEntries(g.findings.map((y) => [y.condition_id, y.status])), x.statuses);
  for (const [cid, list] of Object.entries(x.reasons_include || {})) {
    const got = g.findings.find((y) => y.condition_id === cid).reasons;
    for (const want of list) if (!got.some((r) => r.startsWith(want))) P.push(cid + ': missing reason ' + want + ' (got ' + JSON.stringify(got) + ')');
  }
  cmp('conflict_kinds', g.conflicts.map((k) => k.kind).sort(), x.conflict_kinds);
  cmp('refusal_codes', [...new Set(g.refusals.map((r) => r.code))].sort(), x.refusal_codes);
  for (const [oid, st] of Object.entries(x.quote_statuses || {})) { const n = g.nodes.find((y) => y.id === 'pq:' + oid); cmp('quote.' + oid, n && n.quote_resolution_status, st); }
  cmp('cc_defects', [...new Set(g.cognitive_controls.map((y) => y.defect))].sort(), x.cc_defects);
  if (g.controls_withheld.length) P.push('controls withheld: ' + JSON.stringify(g.controls_withheld));
  // Executable limitation expectations: the exact set of limitation kinds on each finding.
  for (const [cid, kinds] of Object.entries(x.limitations || {})) {
    const lim = g.nodes.find((n) => n.id === 'lim:' + cid);
    cmp('limitations.' + cid, lim ? limitationKinds(lim.text) : null, [...kinds].sort());
  }
  // Executable graph expectations.
  if (x.graph) {
    cmp('graph.conflict_nodes', g.nodes.filter((n) => n.type === 'conflict').length, x.graph.conflict_nodes);
    cmp('graph.textually_supports_edges', g.edges.filter((e) => e.type === 'TEXTUALLY_SUPPORTS').length, x.graph.textually_supports_edges);
    if (x.graph.one_limitation_per_finding) cmp('graph.one_limitation_per_finding', g.findings.every((f) => g.edges.filter((e) => e.type === 'LIMITS' && e.to === 'find:' + f.condition_id).length === 1), true);
    if (x.graph.review_route_per_finding) cmp('graph.review_route_per_finding', g.findings.every((f) => g.edges.some((e) => e.type === 'ROUTES_TO_REVIEW' && e.from === 'find:' + f.condition_id)), true);
  }
  return P;
}

const KIND_TEXT = [['presence', LIMITATIONS.presence], ['sufficiency', LIMITATIONS.sufficiency], ['conflict', LIMITATIONS.conflict], ['instruction', LIMITATIONS.instruction], ['refusal', LIMITATIONS.refusal]];
export function limitationKinds(text) { return KIND_TEXT.filter(([, t]) => t && String(text).includes(t)).map(([k]) => k).sort(); }

const RANK = { not_assessed: 0, review_required: 1, gap: 2, supported: 3 };
// Unsafe when any condition is more favourable than the expected safe result, or a refusal/escalation became a proceed.
export function unsafeDirection(g, x) {
  const out = [];
  if (x.gate_decision !== 'proceed' && g.intake.decision === 'proceed') out.push('gate ' + x.gate_decision + ' became proceed');
  for (const f of g.findings) if (x.statuses[f.condition_id] && RANK[f.status] > RANK[x.statuses[f.condition_id]]) out.push(f.condition_id + ' ' + x.statuses[f.condition_id] + ' became ' + f.status);
  if (x.record_instruction_risk === 'detected' && g.record_instruction_risk !== 'detected') out.push('instruction risk not detected');
  return out;
}

export function replayCorpus(dir, ids, compile, clock = '2026-10-13T00:00:00Z') {
  const results = [], graphs = {};
  for (const id of ids) {
    const c = loadCase(dir, id);
    let g; try { g = compile({ submission: c.submission, candidateResponseText: c.response, executionMode: c.expected.execution_mode, clock, fixtureId: id }); }
    catch (e) { results.push({ id, result: 'fail', mismatches: ['compile error: ' + e.message.slice(0, 400)], unsafe: [] }); continue; }
    graphs[id] = g;
    const m = compareCase(g, c.expected);
    results.push({ id, result: m.length ? 'fail' : 'pass', mismatches: m, unsafe: m.length ? unsafeDirection(g, c.expected) : [],
      statuses: Object.fromEntries(g.findings.map((y) => [y.condition_id, y.status])), graph_sha256: g.identity.graph_sha256 });
  }
  return { results, graphs };
}

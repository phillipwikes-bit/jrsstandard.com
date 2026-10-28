// 0.3.4 repair package: cognitive-control mechanics (assignment section 6).
//
// Per graph, on the 104 substantive study records (exposed development material), under three arms of the study's
// definitions (A2 no candidate; A3R rule-aligned oracle built on the engine under test; A4 heuristic over-claimer):
//   redundancy        the same defect repeated within one graph (the study's measure, CF-01)
//   consolidation     one control per defect, every affected condition listed (0.3.4 related_conditions)
//   passages          controls with at least one record passage; every passage resolves to exact record text
//   missing evidence  absence defects carry missing_evidence = true and detect is marked as an absence
//   field kinds       observed or absent / inferred concern / requested clarification / template suggestion
//   grounding         every control's defect is traceable to a finding reason, a conflict or a quarantine in the
//                     same graph (no control states something the graph does not)
//   contradiction     the study's two checks (no-dates control with dated events; no-conclusion with support)
//   neutrality        controls withheld by the 0.2 neutrality check
//   burden            words across detect, reflect, correct and learn
//   correctness       the study's measures: flaw controls on flawed vs clean records; signature recall by type
// What this cannot show: whether a person finds the controls useful. Template presence and these structural checks
// do not establish benefit to a reviewer (NOT TESTED; it needs the reviewer-benefit protocol).
// Usage: node tests/controls-suite.mjs <engine-version> <scratch>   (writes out/controls-<version>/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { isolate, loadEngine, PKG } from '../tools/harness/engines.mjs';
import { substantive, recordText, designedOf, referenceOf, armsFor, graph, byId, controlMechanics } from '../tools/lib.mjs';
import { mockCandidate } from '../../study-156-2026-10-27/tools/mock-candidates.mjs';
import { alignedCandidate } from '../../study-156-2026-10-27/tools/mock-aligned.mjs';

const FLAW = new Set(['no_identifiable_basis_evidence', 'conclusion_without_identifiable_basis', 'conclusion_without_stated_basis', 'conclusion_restated_as_basis', 'authority_reference_without_linked_facts', 'no_locatable_conclusion', 'same_event_date_conflict', 'decision_outcome_conflict']);
const SIGNATURE = { U: 'no_identifiable_basis_evidence', A: 'authority_reference_without_linked_facts', C: 'conclusion_restated_as_basis', M: 'conclusion_without_identifiable_basis', S: 'same_event_date_conflict' };
const ABSENCE = new Set(['no_identifiable_basis_evidence', 'no_locatable_conclusion', 'no_explicit_dates', 'conclusion_without_stated_basis', 'conclusion_without_identifiable_basis', 'authority_reference_without_linked_facts']);

export async function runControls(E) {
  const versions = { contractVersion: E.contract.CONTRACT_VERSION, promptVersion: E.research.RESEARCH_PROMPT_VERSION };
  const rows = [];
  for (const e of substantive) {
    const id = e.source_id, text = recordText(id), d = designedOf(id), ref = referenceOf(id), refE1 = d ? d.e1 : ref;
    const type = e.links ? e.links.type : null;
    const reference = { e1: refE1, chronology_conflict: !!(d && d.q3 === 'same_event_two_dates') };
    for (const arm of ['A2', 'A3R', 'A4']) {
      const cand = arm === 'A2' ? null : arm === 'A3R' ? alignedCandidate(text, E.research, reference, 'ORACLE-R', versions) : mockCandidate(text, reference, 'OVERCLAIM', versions);
      const g = graph(E, { text, id, cand });
      const cs = g.cognitive_controls || [];
      const m = controlMechanics(g, text);
      const reasonsText = JSON.stringify(g.findings.map((f) => f.reasons));
      const conflictKinds = g.conflicts.map((k) => k.kind);
      // In the graph: the defect appears in a finding reason, a conflict, a quarantine, a quotation refusal or a
      // certainty span. In the rules: the rules alone raise it for this record (it may not be visible in the graph).
      const inGraph = (c) => reasonsText.includes(c.defect) || conflictKinds.includes(c.defect) || (c.defect === 'instruction_text_in_record' && g.record_instruction_risk === 'detected')
        || c.defect === 'certainty_language' || (['ambiguous_quotation', 'absent_quotation'].includes(c.defect) && g.refusals.some((r) => /^quote_/.test(r.code)));
      const grounded = (c) => inGraph(c) || ruleGap(E, text, c.defect);
      rows.push({ id, arm, reference: refE1, type, partition: e.partition || 'original',
        controls: cs.length, defects: cs.map((c) => c.defect), redundant_same_defect: m.redundant_same_defect, words: m.words, withheld: (g.controls_withheld || []).length,
        span_linked: cs.filter((c) => (c.span_ids || []).length).length, span_links_valid: m.span_links_valid, contradictions: m.contradictions,
        consolidated: cs.every((c) => Array.isArray(c.related_conditions) && c.related_conditions.length >= 1),
        missing_evidence_correct: cs.every((c) => c.missing_evidence === undefined ? null : c.missing_evidence === ABSENCE.has(c.defect)),
        field_kinds_present: cs.every((c) => c.field_kinds && c.field_kinds.reflect === 'inferred_concern' && c.field_kinds.correct === 'requested_clarification'),
        not_visible_in_graph: cs.filter((c) => !inGraph(c)).map((c) => c.defect), ungrounded_controls: cs.filter((c) => !grounded(c)).map((c) => c.defect) });
    }
  }
  return rows;
}
// The rules alone (no candidate) raise this defect for the record.
function ruleGap(E, text, code) {
  const R = E.research; const u = R.sentenceUnits(text); const c = R.evaluateResearchConditions(text, E.record.sectionsOf(text), u, R.researchEvents(text, u), {}, new Set(R.RESEARCH_RULES));
  return Object.values(c).some((r) => r.visible_gaps.includes(code) || r.review_reasons.includes(code));
}
function summarize(rows) {
  const s = { graphs: rows.length, controls: 0, redundant_same_defect: 0, graphs_with_redundancy: 0, words: 0, withheld: 0, span_linked: 0, span_links_valid_graphs: 0, contradictions: 0,
    consolidated_graphs: 0, missing_evidence_correct_graphs: 0, field_kinds_graphs: 0, ungrounded_controls: 0, not_visible_in_graph: 0, flaw_controls: 0, flaw_controls_valid: 0, flaw_controls_false: 0, clean_records: 0, controls_on_clean: 0, signature_recall: {} };
  for (const r of rows) {
    s.controls += r.controls; s.redundant_same_defect += r.redundant_same_defect; if (r.redundant_same_defect) s.graphs_with_redundancy++; s.words += r.words; s.withheld += r.withheld; s.span_linked += r.span_linked;
    if (r.span_links_valid) s.span_links_valid_graphs++; s.contradictions += r.contradictions.length; if (r.consolidated) s.consolidated_graphs++; if (r.missing_evidence_correct === true) s.missing_evidence_correct_graphs++;
    if (r.field_kinds_present) s.field_kinds_graphs++; s.ungrounded_controls += r.ungrounded_controls.length; s.not_visible_in_graph += r.not_visible_in_graph.length;
    for (const d of r.defects) if (FLAW.has(d)) { s.flaw_controls++; if (r.reference === 'UNGROUNDED' || (d === 'same_event_date_conflict' && r.type === 'S')) s.flaw_controls_valid++; else s.flaw_controls_false++; }
    if (r.reference === 'GROUNDED' && r.type !== 'S') { s.clean_records++; s.controls_on_clean += r.defects.length; }
  }
  for (const [t, d] of Object.entries(SIGNATURE)) { const rs = rows.filter((r) => r.type === t); if (rs.length) s.signature_recall[t] = { defect: d, present: rs.filter((r) => r.defects.includes(d)).length, records: rs.length }; }
  s.span_linked_fraction = s.controls ? +(s.span_linked / s.controls).toFixed(3) : null;
  s.words_per_graph = +(s.words / rows.length).toFixed(1);
  s.controls_per_clean_record = s.clean_records ? +(s.controls_on_clean / s.clean_records).toFixed(2) : null;
  return s;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const [version, scratch] = process.argv.slice(2);
  if (!version || !scratch) { console.error('usage: controls-suite.mjs <engine-version> <scratch>'); process.exit(2); }
  const OUT = join(PKG, 'out', 'controls-' + version);
  if (existsSync(OUT)) { console.error('exists: ' + OUT); process.exit(2); }
  const pre = V.checkNetworkMarkers(process.env, {}); if (pre.length) { console.error('stopped:', pre.join('; ')); process.exit(3); }
  mkdirSync(scratch, { recursive: true });
  const iso = isolate(version, scratch, { requireManifest: version !== '0.3.4-research-candidate' || existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')) });
  const E = await loadEngine(iso);
  const rows = await runControls(E);
  const rel = iso.release();
  const summary = {};
  for (const arm of ['A2', 'A3R', 'A4']) for (const p of ['development', 'evaluation', 'original']) { const rs = rows.filter((r) => r.arm === arm && r.partition === p); if (rs.length) summary[arm + '/' + p] = summarize(rs); }
  const out = { results_format: 'jrs-0.3.4-controls-results/1.0.0', engine: { version, manifest_sha256: iso.manifest_sha256, released: rel },
    statement: 'Mechanical measures only. Usefulness to a human reviewer is NOT TESTED and is not inferred from these measures.', network_attempts: attempts.length, summary, rows };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
  for (const [k, s] of Object.entries(summary)) console.log(k.padEnd(18), JSON.stringify({ g: s.graphs, controls: s.controls, redundant: s.redundant_same_defect, span_linked_fraction: s.span_linked_fraction, valid_span_graphs: s.span_links_valid_graphs, contradictions: s.contradictions, ungrounded: s.ungrounded_controls, not_in_graph: s.not_visible_in_graph, withheld: s.withheld, words_per_graph: s.words_per_graph, flaw_valid_false: s.flaw_controls_valid + '/' + s.flaw_controls_false, per_clean: s.controls_per_clean_record, sig: Object.fromEntries(Object.entries(s.signature_recall).map(([t, x]) => [t, x.present + '/' + x.records])) }));
  console.log('network', attempts.length);
}

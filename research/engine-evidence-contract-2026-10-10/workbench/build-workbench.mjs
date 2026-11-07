#!/usr/bin/env node
// JRS EVIDENCE CONTRACT 0.2.0: offline Evaluation Workbench (static renderer).
//
//   env -u ANTHROPIC_BASE_URL node research/engine-evidence-contract-2026-10-10/workbench/build-workbench.mjs [--clock ISO]
//
// Renders synthetic fixture runs to static HTML and plain-text reports in
// workbench/rendered/. There is no server, no listener, no upload, no form, no
// script in the output, and no external resource: every page is self-contained
// text and inline CSS. The network trap is active for the whole build.
//
// A reviewer reads each page in this fixed order:
//   1 scope and intake, 2 version and run identity, 3 original synthetic record,
//   4 candidate response, 5 offset-verified evidence highlighted against the record,
//   6 condition-level results, 7 Cognitive Controls, 8 refusals and limitations,
//   9 comparison with historical v1 output, 10 human-review acknowledgment placeholder.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectProviderConfiguration, installNetworkTrap } from '../../../lib/engine-assurance/network-guard.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const FIX = join(HERE, '../fixtures/cases');
export const WORKBENCH_CASES = Object.freeze([
  ['EC-001', 'Supported documentation conditions with verified textual evidence'],
  ['EC-002', 'Chronology gap requiring human review'],
  ['EC-003', 'Out-of-scope employment-related record, refused'],
  ['EC-012', 'Embedded instructions quarantined; favourable statuses routed to review'],
  ['EC-027', 'Comparison with historical v1 output'],
]);

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function highlight(record, conditions) {
  const marks = [];
  for (const c of conditions) for (const e of c.evidence_items) marks.push({ s: e.start_offset, e: e.end_offset, label: c.condition_id + ':' + e.evidence_id });
  const cuts = [...new Set([0, record.length, ...marks.flatMap((m) => [m.s, m.e])])].sort((a, b) => a - b);
  let html = '';
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1];
    const labels = marks.filter((m) => m.s <= a && m.e >= b).map((m) => m.label);
    const t = esc(record.slice(a, b));
    html += labels.length ? '<mark title="' + esc(labels.join(', ')) + '">' + t + '<sup>' + esc(labels.join(' ')) + '</sup></mark>' : t;
  }
  return html;
}

const CSS = `:root{--bg:#050505;--surface:#121212;--surface2:#1A1A1A;--accent:#BE9447;--muted:#B3B3B3;--text:#F2F2F2;--rule:#2A2A2A;--stop-text:#E88080;--review-text:#D4A055;--ready-text:#5DBF82}
body{background:var(--bg);color:var(--text);font:15px/1.55 Inter,system-ui,sans-serif;margin:0;padding:24px 16px}main{max-width:1000px;margin:0 auto}
h1{font:600 22px Georgia,serif;color:var(--accent)}h2{font:600 15px 'JetBrains Mono',monospace;color:var(--accent);border-top:1px solid var(--rule);padding-top:14px;margin-top:26px}
.banner{background:var(--surface2);border-left:3px solid var(--stop-text);padding:10px 14px;color:var(--muted)}pre{background:var(--surface);padding:12px;white-space:pre-wrap;word-break:break-word;font:12.5px/1.5 'JetBrains Mono',monospace;max-height:420px;overflow:auto}
table{border-collapse:collapse;width:100%;font-size:13.5px}td,th{border:1px solid var(--rule);padding:6px 8px;vertical-align:top;text-align:left}th{background:var(--surface2);color:var(--muted)}
mark{background:#3a2f17;color:var(--text)}sup{color:var(--accent);font-size:10px;margin-left:2px}.s-supported{color:var(--ready-text)}.s-gap,.s-review_required{color:var(--review-text)}.s-not_assessed{color:var(--stop-text)}
.ack{border:1px dashed var(--muted);padding:12px;color:var(--muted)}code{font-family:'JetBrains Mono',monospace;font-size:12.5px}`;

export function renderCase(id, title, c, r) {
  const rows = (pairs) => '<table>' + pairs.map(([k, v]) => '<tr><th>' + esc(k) + '</th><td>' + v + '</td></tr>').join('') + '</table>';
  const cond = r.conditions.map((x) => '<tr><td><code>' + esc(x.condition_id) + '</code></td><td class="s-' + esc(x.status) + '">' + esc(x.status) + '</td><td>' + esc(x.candidate_status)
    + '</td><td>' + esc(x.finding_summary) + '</td><td>' + x.evidence_items.map((e) => '<code>' + esc(e.evidence_id) + '</code> [' + e.start_offset + ',' + e.end_offset + ') ' + esc(e.record_section) + ' / ' + esc(e.assertion_type)).join('<br>')
    + '</td><td>' + esc(x.evidence_assessment) + '</td><td>' + x.routing_reasons.map(esc).join('<br>') + '</td></tr>').join('');
  const cc = r.conditions.flatMap((x) => x.cognitive_controls);
  const parts = [
    ['1. Scope and intake', rows([['Gate decision', esc(r.intake.gate_decision)], ['Scope declaration', '<code>' + esc(JSON.stringify(r.intake.compartments.scope_declaration)) + '</code>'],
      ['Requested outputs', esc(JSON.stringify(r.intake.compartments.requested_outputs))], ['Record instruction risk', esc(r.record_instruction_risk)], ['Execution boundary', esc(r.execution_boundary)],
      ['Long-record status', esc(r.long_record ? r.long_record.length_status + ' (' + r.long_record.length_chars + ' of ' + r.long_record.limit_chars + ' characters)' : 'n/a')]])],
    ['2. Version and run identity', rows([['Contract', esc(r.contract_version)], ['Engine candidate', esc(r.engine_candidate_version)], ['Historical reference', esc(r.historical_reference_id)],
      ['Release status', esc(r.release_status)], ['Run', esc(r.run.run_id + ' at ' + r.run.run_timestamp + ', ' + r.run.execution_mode + ', provider ' + r.run.provider_mode + ', provider calls ' + r.run.provider_calls)],
      ['Record SHA-256', '<code>' + esc(r.hashes.record) + '</code>'], ['Normalised result SHA-256', '<code>' + esc(r.hashes.result_normalized) + '</code>']])],
    ['3. Original synthetic record', '<pre>' + esc(c.submission.record_text) + '</pre>'],
    ['4. Candidate response (fixed mock, not model output)', c.response == null ? '<p>No candidate response in this mode.</p>' : '<pre>' + esc(c.response) + '</pre><p>Read: ' + esc(r.candidate_response_validation.response_status) + '. ' + esc(r.candidate_response_validation.response_reasons.join(', ')) + '</p>'],
    ['5. Offset-verified evidence highlighted against the record', '<p>Highlights show only offset-verified quotations. A highlight shows presence, not support.</p><pre>' + highlight(c.submission.record_text, r.conditions) + '</pre>'],
    ['6. Condition-level results', '<table><tr><th>Condition</th><th>Status</th><th>Candidate status</th><th>Summary</th><th>Verified evidence</th><th>Assessment</th><th>Routing reasons</th></tr>' + cond + '</table>'],
    ['7. Cognitive Controls (documentation controls only)', cc.length ? '<table><tr><th>Control</th><th>Detect</th><th>Reflect</th><th>Correct (question)</th><th>Learn</th></tr>' + cc.map((x) => '<tr><td>' + esc(x.control_id + ' ' + x.pattern_id + ' / ' + x.related_condition) + '</td><td>' + esc(x.detect.summary) + '</td><td>' + esc(x.reflect) + '</td><td>' + esc(x.correct) + '</td><td>' + esc(x.learn) + '</td></tr>').join('') + '</table>' : '<p>No record control fired, or controls were not run because intake stopped.</p>'],
    ['8. Refusals and limitations', (r.refusals.length ? '<table><tr><th>Stage</th><th>Code</th><th>Disposition</th><th>Boundary</th></tr>' + r.refusals.map((x) => '<tr><td>' + esc(x.stage) + '</td><td><code>' + esc(x.code) + '</code></td><td>' + esc(x.disposition) + '</td><td>' + esc(x.boundary) + '</td></tr>').join('') + '</table>' : '<p>No refusal.</p>')
      + '<ul>' + r.limitations.map((l) => '<li>' + esc(l.id + ' ' + l.statement) + '</li>').join('') + '<li>' + esc(r.instruction_quarantine.limitation) + '</li></ul>'
      + (r.instruction_quarantine.quarantined_instruction_spans.length ? '<p>Quarantined instruction spans (preserved as record text, not executed): ' + r.instruction_quarantine.quarantined_instruction_spans.map((s) => '<code>' + esc(s.pattern_id + ' [' + s.start + ',' + s.end + ')') + '</code>').join(' ') + '</p>' : '')],
    ['9. Comparison with historical v1 output', r.v1_comparison ? '<p>' + esc(r.v1_comparison.statement) + '</p><table><tr><th>Condition</th><th>v1 key</th><th>v1 original</th><th>v1 under v0.2 (effective)</th><th>Mapping</th><th>v0.2 status</th></tr>'
      + r.v1_comparison.rows.map((x) => '<tr><td>' + esc(x.condition_id) + '</td><td>' + esc(x.v1_key) + '</td><td>' + esc(x.v1_original_status) + '</td><td>' + esc(x.v1_effective_v02_status) + '</td><td>' + esc(x.mapping) + '</td><td>' + esc(x.v02_status) + '</td></tr>').join('') + '</table>' : '<p>No historical v1 output supplied for this case.</p>'],
    ['10. Human-review acknowledgment (placeholder)', '<div class="ack">Reviewer: not recorded. Date: not recorded. Decision on each routed condition: not recorded.<br>This workbench records nothing. Acknowledgment would be captured in a separately authorised process.</div>'],
  ];
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Workbench ' + esc(id) + '</title><style>' + CSS + '</style></head><body><main>'
    + '<h1>Evaluation Workbench: ' + esc(id) + '</h1><p>' + esc(title) + '</p><div class="banner">Synthetic, engineering-authored fixture. Local engineering candidate ' + esc(r.engine_candidate_version)
    + '; release status ' + esc(r.release_status) + '. Nothing on this page establishes accuracy, semantic support, validation, or readiness. Human review is required.</div>'
    + parts.map(([h, b]) => '<h2>' + esc(h) + '</h2>' + b).join('') + '</main></body></html>\n';
}

export function renderText(id, title, c, r) {
  const L = ['WORKBENCH ' + id + ': ' + title, 'Synthetic fixture; candidate ' + r.engine_candidate_version + '; ' + r.release_status, ''];
  L.push('1 INTAKE  gate=' + r.intake.gate_decision + ' instruction_risk=' + r.record_instruction_risk + ' boundary=' + r.execution_boundary);
  L.push('2 IDENTITY  ' + r.contract_version + ' / ' + r.historical_reference_id + ' / run ' + r.run.run_id);
  L.push('3 RECORD  ' + r.intake.compartments.record_content.chars + ' chars ' + r.hashes.record);
  L.push('4 CANDIDATE RESPONSE  ' + r.candidate_response_validation.response_status);
  for (const x of r.conditions) {
    L.push('5/6 ' + x.condition_id.padEnd(24) + x.status.padEnd(16) + 'candidate=' + x.candidate_status);
    for (const e of x.evidence_items) L.push('      ' + e.evidence_id + ' [' + e.start_offset + ',' + e.end_offset + ') "' + e.exact_quote.slice(0, 70) + (e.exact_quote.length > 70 ? '...' : '') + '"');
    for (const rr of x.routing_reasons) L.push('      reason: ' + rr);
  }
  for (const x of r.conditions.flatMap((y) => y.cognitive_controls)) L.push('7 ' + x.control_id + ' ' + x.pattern_id + '  correct: ' + x.correct);
  for (const x of r.refusals) L.push('8 ' + x.stage + ' ' + x.code + ' (' + x.disposition + ')');
  if (r.v1_comparison) for (const x of r.v1_comparison.rows) L.push('9 ' + x.condition_id + ': v1 ' + x.v1_original_status + ' -> effective ' + x.v1_effective_v02_status + ' (' + x.mapping + '); v0.2 ' + x.v02_status);
  L.push('10 HUMAN REVIEW ACKNOWLEDGMENT: not recorded (placeholder)');
  return L.join('\n') + '\n';
}

export async function buildWorkbench({ clock = '2026-10-10T00:00:00Z', outDir = join(HERE, 'rendered'), env = process.env, write = true } = {}) {
  if (detectProviderConfiguration(env).length) throw new Error('REFUSED: provider configuration present');
  const trap = installNetworkTrap();
  try {
    const { runEvidenceContract } = await import('../../../lib/engine-evidence-contract/run.mjs');
    const { loadContractCase } = await import('../../../tools/engine-evidence-contract-replay.mjs');
    const pages = {};
    for (const [id, title] of WORKBENCH_CASES) {
      const c = loadContractCase(FIX, id);
      const r = runEvidenceContract({ submission: c.submission, candidateResponseText: c.response, executionMode: c.expected.execution_mode, clock, v1Output: c.v1, fixtureId: id });
      pages[id] = { html: renderCase(id, title, c, r), text: renderText(id, title, c, r) };
    }
    const index = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Evaluation Workbench</title><style>' + CSS + '</style></head><body><main><h1>Evaluation Workbench (local, synthetic)</h1>'
      + '<div class="banner">Static pages rendered from synthetic fixtures. No server, no uploads, no scripts, no external resources.</div><ul>'
      + WORKBENCH_CASES.map(([id, t]) => '<li><a href="' + id + '.html">' + esc(id) + '</a>: ' + esc(t) + '</li>').join('') + '</ul></main></body></html>\n';
    if (write) {
      mkdirSync(outDir, { recursive: true });
      for (const [id, p] of Object.entries(pages)) { writeFileSync(join(outDir, id + '.html'), p.html); writeFileSync(join(outDir, id + '.txt'), p.text); }
      writeFileSync(join(outDir, 'index.html'), index);
    }
    if (trap.count()) throw new Error('network attempt trapped during workbench build');
    return { pages, index, trapped: trap.count() };
  } finally { trap.restore(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2); const i = a.indexOf('--clock');
  const res = await buildWorkbench({ clock: i < 0 ? undefined : a[i + 1] });
  console.log('rendered ' + Object.keys(res.pages).length + ' cases to workbench/rendered/ (static HTML and text); network attempts trapped: ' + res.trapped);
}

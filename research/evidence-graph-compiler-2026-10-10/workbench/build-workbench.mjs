#!/usr/bin/env node
// JRS EVIDENCE GRAPH 0.3.0: static, offline Evidence Graph Workbench.
//
//   env -u ANTHROPIC_BASE_URL node research/evidence-graph-compiler-2026-10-10/workbench/build-workbench.mjs
//
// Renders synthetic fixture runs to self-contained static HTML and text. No server,
// listener, script, form, file intake, storage, analytics or external resource. The
// network trap is active for the whole build.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectProviderConfiguration, installNetworkTrap } from '../../../lib/engine-assurance/network-guard.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
export const EXAMPLES = Object.freeze([
  ['GC-001', 'Cleanly structured supplier-access exception record', 'EC-001'],
  ['GC-002', 'Missing authority source', null],
  ['GC-003', 'Missing compensating control', null],
  ['GC-004', 'Contradictory chronology', 'EC-002'],
  ['GC-006', 'Duplicate quotation ambiguity', null],
  ['GC-008', 'Out-of-scope employment content, refused', 'EC-003'],
]);
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CSS = `:root{--bg:#050505;--surface:#121212;--surface2:#1A1A1A;--accent:#BE9447;--muted:#B3B3B3;--text:#F2F2F2;--rule:#2A2A2A;--stop-text:#E88080;--review-text:#D4A055;--ready-text:#5DBF82}
*{box-sizing:border-box}body{background:var(--bg);color:var(--text);font:15px/1.55 Inter,system-ui,sans-serif;margin:0;padding:20px 16px}main{max-width:1060px;margin:0 auto}
h1{font:600 21px Georgia,serif;color:var(--accent);margin:0 0 6px}h2{font:600 14px 'JetBrains Mono',monospace;color:var(--accent);border-top:1px solid var(--rule);padding-top:12px;margin-top:22px}
.banner{background:var(--surface2);border-left:3px solid var(--stop-text);padding:10px 14px;color:var(--muted)}pre{background:var(--surface);padding:12px;white-space:pre-wrap;word-break:break-word;font:12.5px/1.5 'JetBrains Mono',monospace}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid var(--rule);padding:5px 7px;vertical-align:top;text-align:left;word-break:break-word}th{background:var(--surface2);color:var(--muted)}
mark{background:#3a2f17;color:var(--text)}sup{color:var(--accent);font-size:10px}.s-supported{color:var(--ready-text)}.s-gap,.s-review_required{color:var(--review-text)}.s-not_assessed{color:var(--stop-text)}code{font-family:'JetBrains Mono',monospace;font-size:12px}
.ack{border:1px dashed var(--muted);padding:10px;color:var(--muted)}`;

function highlight(record, g) {
  const ev = g.nodes.filter((n) => n.type === 'verified_evidence');
  const cuts = [...new Set([0, record.length, ...ev.flatMap((e) => [e.start, e.end])])].sort((a, b) => a - b);
  let h = '';
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1], labs = ev.filter((e) => e.start <= a && e.end >= b).map((e) => e.id);
    h += labs.length ? '<mark>' + esc(record.slice(a, b)) + '<sup>' + esc(labs.join(' ')) + '</sup></mark>' : esc(record.slice(a, b));
  }
  return h;
}
const table = (head, rows) => '<div class="tw"><table><tr>' + head.map((x) => '<th>' + esc(x) + '</th>').join('') + '</tr>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table></div>';

export function renderPage(id, title, c, g, v02, factoryStatus) {
  const rec = c.submission.record_text;
  const sec = g.nodes.filter((n) => n.type === 'record_section');
  const pq = g.nodes.filter((n) => n.type === 'proposed_quote');
  const parts = [
    ['1. Run identity and limitation banner', table(['Item', 'Value'], [['Contract', esc(g.contract_version)], ['Compiler', esc(g.compiler_version + ' (' + g.identity.compiler_sha256.slice(0, 23) + '...)')],
      ['Prompt contract', esc(g.prompt_version)], ['Codebook', esc(g.codebook_version)], ['Run', esc(g.identity.run_id + ' at ' + g.identity.run_timestamp + ', ' + g.identity.execution_mode)],
      ['Record SHA-256', '<code>' + esc(g.identity.record_sha256) + '</code>'], ['Fixture hash', '<code>' + esc(g.identity.fixture_hash) + '</code>'],
      ['Provider calls / network calls', '0 / 0'], ['Release status', esc(g.release_status)], ['Intake', esc(g.intake.decision)], ['Instruction risk', esc(g.record_instruction_risk + '; execution boundary ' + g.execution_boundary)]])],
    ['2. Original synthetic record', '<pre>' + esc(rec) + '</pre>'],
    ['3. Exact highlighted evidence spans', '<p>Highlights mark compiler-verified quotations only. A highlight shows textual presence, not proof.</p><pre>' + highlight(rec, g) + '</pre>'],
    ['4. Section map', sec.length ? table(['Section', 'Label', 'Role', 'Characters', 'Bytes (UTF-8)'], sec.map((s) => [esc(s.id), esc(s.label), esc(s.role), s.start + '-' + s.end, s.utf8_start + '-' + s.utf8_end])) : '<p>Not built: intake stopped.</p>'],
    ['5. Proposed quotations (candidate mock, quote-only)', pq.length ? table(['Observation', 'Condition', 'Proposed', 'Type', 'Quotation'], pq.map((n) => [esc(n.observation_id), esc(n.condition_id), esc(n.proposed_status), esc(n.assertion_type), esc(n.quote)])) : '<p>No candidate quotation was read.</p>'],
    ['6. Quote-resolution result (computed locally)', pq.length ? table(['Observation', 'Status', 'Reason', 'Occurrences', 'Candidate locations'], pq.map((n) => [esc(n.observation_id), esc(n.quote_resolution_status), esc(n.reason), String(n.occurrence_count), esc(n.candidate_locations.map((l) => l.start + '-' + l.end + ' ' + l.section).join('; '))])) : '<p>None.</p>'],
    ['7. Graph nodes and edges', '<p>' + g.nodes.length + ' nodes, ' + g.edges.length + ' edges. TEXTUALLY_SUPPORTS means only that the quoted text is present and associated with a bounded assertion type.</p>'
      + table(['Node', 'Type'], g.nodes.filter((n) => n.type !== 'record_span' || n.origins.includes('candidate_quote')).map((n) => [esc(n.id), esc(n.type)]))
      + table(['Edge', 'Type'], g.edges.filter((e) => !['CONTAINS'].includes(e.type)).map((e) => [esc(e.from + ' -> ' + e.to), esc(e.type)]))],
    ['8. Condition results', table(['Condition', 'Status', 'Proposed', 'Reasons', 'Explanation'], g.findings.map((f) => ['<code>' + esc(f.condition_id) + '</code>', '<span class="s-' + esc(f.status) + '">' + esc(f.status) + '</span>', esc(f.proposed_status), f.reasons.map(esc).join('<br>'), esc(f.explanation)]))],
    ['9. Contradiction nodes', g.conflicts.length ? table(['Conflict', 'Kind', 'Summary', 'Affects'], g.conflicts.map((k) => [esc(k.id), esc(k.kind), esc(k.summary), esc(k.affects.join(', '))])) + '<p>' + esc(g.nodes.find((n) => n.type === 'conflict').statement) + '</p>' : '<p>No visible contradiction detected.</p>'],
    ['10. Cognitive Controls (documentation controls only)', g.cognitive_controls.length ? table(['Defect', 'Detect', 'Reflect', 'Correct (question)', 'Learn'], g.cognitive_controls.map((x) => [esc(x.defect + ' / ' + x.related_condition), esc(x.detect), esc(x.reflect), esc(x.correct), esc(x.learn)])) : '<p>No graph defect produced a control, or intake stopped.</p>'],
    ['11. Refusals and limitations', (g.refusals.length ? table(['Refusal', 'Disposition', 'Boundary'], g.refusals.map((r) => [esc(r.code), esc(r.disposition), esc(r.boundary)])) : '<p>No refusal.</p>')
      + '<ul>' + [...new Set(g.nodes.filter((n) => n.type === 'limitation').map((n) => n.text))].map((t) => '<li>' + esc(t) + '</li>').join('') + '<li>' + esc(g.instruction_quarantine.limitation) + '</li></ul>'],
    ['12. Human-review route', '<p>' + esc(g.human_review_route.route) + ': ' + esc(g.human_review_route.statement) + '</p><div class="ack">Reviewer: not recorded. Disposition: not recorded. This workbench records nothing.</div>'],
    ['13. v0.2 comparison', v02 ? '<p>Same synthetic record, v0.2 contract with its own mock response (' + esc(v02.case) + '). Differences describe two contracts; they are not accuracy evidence for either.</p>'
      + table(['Condition', 'v0.2 status', 'v0.3 status'], g.findings.map((f) => [esc(f.condition_id), esc(v02.statuses[f.condition_id]), esc(f.status)])) : '<p>No v0.2 case uses this record.</p>'],
    ['14. Sealed-evaluation factory status', '<p>Registry status: <code>' + esc(factoryStatus) + '</code>. No evaluation has been authorized or conducted. No holdout, independent label or adjudication exists in this repository.</p>'],
  ];
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Evidence Graph Workbench ' + esc(id) + '</title><style>' + CSS + '</style></head><body><main>'
    + '<h1>Evidence Graph Workbench: ' + esc(id) + '</h1><p>' + esc(title) + '</p><div class="banner">Synthetic, engineering-authored fixture. Local candidate ' + esc(g.contract_version) + '; release status ' + esc(g.release_status)
    + '. Nothing on this page establishes accuracy, semantic validity, validation, or readiness. Human review is required.</div>'
    + parts.map(([h, b]) => '<h2>' + esc(h) + '</h2>' + b).join('') + '</main></body></html>\n';
}

export async function buildWorkbench({ clock = '2026-10-10T00:00:00Z', env = process.env, write = true } = {}) {
  if (detectProviderConfiguration(env).length) throw new Error('REFUSED: provider configuration present');
  const trap = installNetworkTrap();
  try {
    const { compileEvidenceGraph } = await import('../../../lib/engine-evidence-graph/compiler.mjs');
    const { loadGraphCase } = await import('../../../tools/engine-evidence-graph-replay.mjs');
    const { runEvidenceContract } = await import('../../../lib/engine-evidence-contract/run.mjs');
    const { loadContractCase } = await import('../../../tools/engine-evidence-contract-replay.mjs');
    const reg = readFileSync(join(HERE, '../sealed-evaluation-factory/REGISTRY.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const factoryStatus = reg.length ? reg[reg.length - 1].current_status : 'no_registry_entry';
    const pages = {};
    for (const [id, title, v02id] of EXAMPLES) {
      const c = loadGraphCase(join(HERE, '../fixtures/cases'), id);
      const g = compileEvidenceGraph({ submission: c.submission, candidateResponseText: c.response, executionMode: c.expected.execution_mode, clock, fixtureId: id });
      let v02 = null;
      if (v02id) {
        const e = loadContractCase(join(REPO, 'research/engine-evidence-contract-2026-10-10/fixtures/cases'), v02id);
        if (e.submission.record_text !== c.submission.record_text) throw new Error('v0.2 comparison record differs for ' + id);
        const r = runEvidenceContract({ submission: e.submission, candidateResponseText: e.response, executionMode: e.expected.execution_mode, clock, v1Output: e.v1, fixtureId: v02id });
        v02 = { case: v02id, statuses: Object.fromEntries(r.conditions.map((x) => [x.condition_id, x.status])) };
      }
      pages[id] = renderPage(id, title, c, g, v02, factoryStatus);
    }
    const index = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Evidence Graph Workbench</title><style>' + CSS + '</style></head><body><main><h1>Evidence Graph Workbench (local, synthetic)</h1><div class="banner">Static pages from synthetic fixtures. No server, file intake, scripts or external resources.</div><ul>'
      + EXAMPLES.map(([id, t]) => '<li><a href="' + id + '.html">' + esc(id) + '</a>: ' + esc(t) + '</li>').join('') + '</ul></main></body></html>\n';
    if (write) { mkdirSync(join(HERE, 'rendered'), { recursive: true }); for (const [id, h] of Object.entries(pages)) writeFileSync(join(HERE, 'rendered', id + '.html'), h); writeFileSync(join(HERE, 'rendered', 'index.html'), index); }
    if (trap.count()) throw new Error('network attempt trapped during workbench build');
    return { pages, index, trapped: trap.count() };
  } finally { trap.restore(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await buildWorkbench();
  console.log('rendered ' + Object.keys(r.pages).length + ' examples to workbench/rendered/; network attempts trapped: ' + r.trapped);
}

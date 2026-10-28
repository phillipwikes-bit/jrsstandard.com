#!/usr/bin/env node
// JRS ENGINE RELIABILITY 0.6.0-local: static local review workbench.
//
//   node research/engine-reliability-phase6-2026-10-17/workbench/build-workbench.mjs
//
// Generates read-only HTML pages from the recorded Phase 6 artifacts. Pages
// carry no script, form, input, upload, authentication, external font or
// network URL. They are opened from the file system and are not deployed
// (research/ is excluded by .vercelignore).

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const PKG = join(HERE, '..');
const J = (p) => JSON.parse(readFileSync(join(PKG, p), 'utf8'));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const manifest = J('baseline/PHASE6_BASELINE_MANIFEST.json');
const lib = J('regression-library/LIBRARY_RESULTS.json');
const stab = J('stability-laboratory/STABILITY_RESULTS.json');
const mut = existsSync(join(PKG, 'execution-record/MUTATION_EVIDENCE.json')) ? J('execution-record/MUTATION_EVIDENCE.json') : null;
const register = readFileSync(join(PKG, 'knowledge-register/KNOWLEDGE_REGISTER.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const scen = Object.fromEntries(readdirSync(join(PKG, 'regression-library/scenarios')).map((f) => { const s = JSON.parse(readFileSync(join(PKG, 'regression-library/scenarios', f), 'utf8')); return [s.scenario_id, s]; }));
const { DECISIONS } = await import('./decisions.mjs');

export const PAGES = [['index', 'Overview'], ['baseline', 'Baseline manifest'], ['scenarios', 'Scenario categories'], ['classifications', 'Change classifications'],
  ['open-failures', 'Open failures'], ['mutations', 'Mutation evidence'], ['stability', 'Stability evidence'], ['limitations', 'Limitations'], ['decisions', 'Owner decisions']];

const CSS = `:root{--bg:#050505;--surface:#121212;--surface2:#1A1A1A;--accent:#BE9447;--accent-dim:#7A5E28;--muted:#B3B3B3;--muted-soft:#8A8A8A;--text:#F2F2F2;--rule:#2A2A2A;--stop:#8B2020;--stop-text:#E88080;--review-text:#D4A055;--ready-text:#5DBF82}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;font-size:15px;line-height:1.5}
.banner{background:var(--stop);color:var(--text);padding:10px 16px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.04em}
.banner p{margin:2px 0}header,main,nav,footer{padding:0 16px;max-width:1100px;margin:0 auto}h1{font-family:'Bodoni Moda',Georgia,serif;font-weight:500;color:var(--accent);margin:18px 0 6px}
h2{font-size:17px;color:var(--accent);border-bottom:1px solid var(--rule);padding-bottom:4px;margin-top:26px}nav ul{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-wrap:wrap;gap:6px}
nav a{display:inline-block;padding:4px 8px;border:1px solid var(--rule);color:var(--muted);text-decoration:none;font-size:13px}nav a[aria-current]{color:var(--accent);border-color:var(--accent-dim)}
.wrap{overflow-x:auto;max-width:100%}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid var(--rule);padding:5px 7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
th{background:var(--surface2);color:var(--muted);font-weight:600}td{background:var(--surface)}code{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;overflow-wrap:anywhere}
.stop{color:var(--stop-text)}.review{color:var(--review-text)}.ready{color:var(--ready-text)}.muted{color:var(--muted-soft)}p,li{max-width:80ch;overflow-wrap:anywhere}footer{color:var(--muted-soft);font-size:12px;padding-bottom:24px}`;

function page(id, title, body) {
  const nav = PAGES.map(([p, t]) => '<li><a href="' + p + '.html"' + (p === id ? ' aria-current="page"' : '') + '>' + esc(t) + '</a></li>').join('');
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow">'
    + '<title>Phase 6 Workbench: ' + esc(title) + '</title><style>' + CSS + '</style></head><body>'
    + '<div class="banner" role="note"><p>LOCAL ENGINEERING MATERIAL ONLY</p><p>NOT INDEPENDENTLY EVALUATED</p><p>NO RELEASE, DEPLOYMENT, OR COMMERCIAL READINESS DETERMINATION</p></div>'
    + '<header><h1>' + esc(title) + '</h1><p class="muted">JRS Engine reliability framework 0.6.0-local. Synthetic, engineering-authored material run offline. Release status ' + esc(manifest.release_status) + '.</p></header>'
    + '<nav aria-label="Workbench pages"><ul>' + nav + '</ul></nav><main>' + body + '</main>'
    + '<footer><p>Static, read-only page generated from recorded Phase 6 artifacts. Nothing on this page was independently evaluated.</p></footer></body></html>\n';
}
const table = (head, rows) => '<div class="wrap"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>'
  + rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const tone = (r) => (/unexpected|survived|fail_closed|stop/.test(r) ? 'stop' : /known_open|review|degradation|refusal/.test(r) ? 'review' : 'ready');
const tag = (r) => '<span class="' + tone(r) + '">' + esc(r) + '</span>';
const statuses = (s) => esc(Object.entries(s || {}).map(([k, v]) => k.split('_')[0] + ':' + v).join(', '));

const out = {};
out.index = page('index', 'Overview', '<h2>What this workbench shows</h2><p>Recorded results of the Phase 6 local reliability framework: a deterministic baseline of every earlier synthetic scenario, a sealed regression library of new synthetic scenarios, a differential router that classifies behaviour differences and fails closed, metamorphic stability checks, mutation evidence and an append-only knowledge register. Every count below describes local synthetic material only.</p>'
  + table(['Item', 'Recorded value'], [
    ['Baseline records', esc(manifest.counts.total) + ' across ' + Object.keys(manifest.counts.by_package).length + ' prior packages'],
    ['Baseline manifest hash', '<code>' + esc(manifest.manifest_hash) + '</code>'],
    ['Regression scenarios', esc(Object.keys(scen).length) + ' (' + Object.entries(lib.counts).map(([k, v]) => esc(k) + ' ' + v).join(', ') + ')'],
    ['Stability transforms', esc(stab.total) + ' (' + stab.as_expected + ' as expected; ' + stab.invariant_total + ' invariant, ' + stab.invariant_non_favorable_base + ' from a non-favourable base)'],
    ['Mutations', mut ? esc(mut.total + ' introduced, ' + mut.killed + ' killed, ' + mut.survived + ' survived, ' + mut.load_failures + ' load failures') : 'not recorded'],
    ['Knowledge register', esc(register.length) + ' hash-chained entries'],
    ['Release status', esc(manifest.release_status)]]));
out.baseline = page('baseline', 'Baseline manifest', '<h2>Classes by package</h2>' + table(['Package', ...Object.keys(manifest.counts.by_class)],
  Object.keys(manifest.counts.by_package).map((p) => [esc(p), ...Object.keys(manifest.counts.by_class).map((c) => esc(manifest.records.filter((r) => r.package === p && r.baseline_class === c).length))]))
  + '<p>' + esc(manifest.label_policy) + '</p><h2>Every baseline record</h2>' + table(['Scenario', 'Package', 'Gate', 'Condition outcomes', 'Refusals', 'Class'],
    manifest.records.map((r) => [esc(r.scenario_id), esc(r.package), esc(r.gate), statuses(Object.fromEntries(Object.entries(r.conditions).map(([k, v]) => [k, v.status]))), esc(r.refusal_codes.join(', ')), tag(r.baseline_class)])));
const cats = [...new Set(Object.values(scen).map((s) => s.category))];
out.scenarios = page('scenarios', 'Scenario categories', '<p>Expected safe behaviour was written and sealed before the compiler ran on any scenario. Results are local synthetic results, not adjudicated labels.</p>'
  + cats.map((c) => '<h2 id="' + esc(c.replace(/_/g, '-')) + '">' + esc(c.replace(/_/g, ' ')) + '</h2>' + table(['Scenario', 'Kind', 'Expected safe behaviour', 'Result'],
    lib.results.filter((r) => r.category === c).map((r) => [esc(r.scenario_id), esc(r.expectation_kind), esc(scen[r.scenario_id].expected_safe_behavior), tag(r.result)]))).join(''));
const CLASS_TEXT = { presentation_only: 'Offsets, quotation text or structure changed with a recorded explanation; no condition, refusal or limitation changed.', expected_safe_degradation: 'A less favourable state that the comparison context declared expected.',
  expected_refusal: 'A refusal gained that the comparison context declared expected.', unexpected_behavioral_change: 'A behavioural change with no recorded explanation; routed to a person.',
  favorable_transition_requiring_human_review: 'A more favourable state; fails closed when it starts from not_assessed or review_required or lacks an evidence trail.',
  limitation_removed_or_weakened: 'A limitation, limitation kind or review route was lost. Fails closed.', quote_or_span_integrity_defect: 'A quotation, offset or quotation refusal changed without a recorded explanation. Fails closed.',
  scope_boundary_defect: 'A refusal, gate, instruction-risk detection, candidate refusal or release status was lost or changed. Fails closed.', unknown_comparison_state: 'Input incomplete, malformed, tampered or version-mismatched. Fails closed.' };
out.classifications = page('classifications', 'Change classifications', '<h2>Classes</h2>' + table(['Class', 'Meaning'], Object.entries(CLASS_TEXT).map(([k, v]) => ['<code>' + esc(k) + '</code>', esc(v)]))
  + '<h2>Verdicts recorded by the stability laboratory</h2>' + table(['Transform', 'Verdict', 'Classes'], stab.results.map((r) => [esc(r.transform_id), tag(r.verdict), esc((r.classes || []).join(', '))]))
  + '<p>The router identifies changes. It never applies one and never approves one.</p>');
out['open-failures'] = page('open-failures', 'Open failures', '<h2>Unexpected result</h2>' + table(['Scenario', 'Mismatch'], lib.results.filter((r) => r.result === 'unexpected').map((r) => [esc(r.scenario_id), esc(r.mismatches.join('; '))]))
  + '<h2>Register entries</h2>' + table(['Entry', 'State', 'Layer', 'Scenarios', 'Observed'], register.map((e) => [esc(e.entry_id), tag(e.state), esc(e.engine_layer), esc(e.scenarios.join(', ')), esc(e.observed || e.expected_behavior)]))
  + '<h2>Documented open failures carried into the baseline</h2>' + table(['Scenario', 'Source'], Object.entries(manifest.known_open_failure_sources).map(([k, v]) => [esc(k), esc(v)])));
out.mutations = page('mutations', 'Mutation evidence', mut ? '<p>' + esc(mut.total) + ' deliberate defects were introduced into copies of the framework. A load failure does not count as killed.</p>'
  + table(['Mutation', 'Area', 'File', 'Result', 'Killed by'], mut.results.map((r) => [esc(r.id), esc(r.area), esc(r.file), tag(r.result), esc((r.killed_by || []).join(', '))])) : '<p>Not recorded.</p>');
out.stability = page('stability', 'Stability evidence', '<p>' + esc(stab.statement) + '</p>' + table(['Transform', 'Kind', 'Base', 'Base state', 'Base outcomes', 'Transformed outcomes', 'Result'],
  stab.results.map((r) => [esc(r.transform_id + ' ' + (r.name || '')), esc(r.kind), esc(r.base), esc(r.base_state), statuses(r.base_statuses), statuses(r.statuses), tag(r.result)])));
out.limitations = page('limitations', 'Limitations', '<ul>' + [
  'Every scenario, expectation, transform and probe was written by the same engineering session that wrote the framework. Agreement shows code doing what its author intended, not that the intent is right.',
  'Nothing here was run on a real record, a holdout or a live model. Candidate responses are fixed synthetic text.',
  'The compiler checks textual presence and lexical markers. The library documents several places where that reaches a favourable reading without semantic support.',
  'The expectation seals are hashes recorded by the same session. They show that nothing changed after sealing within this working tree; they are not an independent attestation.',
  'Performance figures are local engineering budgets on one container, not production performance.',
  'No result on these pages advances a release gate or changes the release status ' + manifest.release_status + '.'].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>');
out.decisions = page('decisions', 'Owner decisions', table(['Decision', 'Question', 'Basis'], DECISIONS.map((d) => [esc(d.id), esc(d.question), esc(d.basis)])));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const [k, v] of Object.entries(out)) writeFileSync(join(HERE, k + '.html'), v);
  console.log('wrote ' + Object.keys(out).length + ' pages');
}

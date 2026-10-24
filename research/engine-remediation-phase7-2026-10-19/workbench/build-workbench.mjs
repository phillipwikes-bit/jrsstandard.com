#!/usr/bin/env node
// JRS PHASE 7: static read-only workbench (no script, form, upload, authentication, external font or network URL).
//   node research/engine-remediation-phase7-2026-10-19/workbench/build-workbench.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const P7 = join(HERE, '..');
const J = (p) => JSON.parse(readFileSync(join(P7, p), 'utf8'));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const scen = J('results/SCENARIO_RESULTS.json'), qual = J('results/QUALIFICATION_RESULTS.json'), stab = J('stability/STABILITY_RESULTS.json'), over = J('results/OVER_REFUSAL_TABLE.json');
const reg = J('RULE_PACK_REGISTER.json'), ics = J('INTENDED_CHANGE_SET.json');
const mut = existsSync(join(P7, 'execution-record/MUTATION_EVIDENCE.json')) ? J('execution-record/MUTATION_EVIDENCE.json') : null;
const backlog = readFileSync(join(P7, 'backlog/REMEDIATION_BACKLOG.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const { DECISIONS } = await import('./decisions.mjs');

export const PAGES = [['index', 'Overview'], ['rule-packs', 'Rule packs'], ['qualification', 'Differential qualification'], ['scenarios', 'Regression scenarios'], ['stability', 'Stability'],
  ['over-refusal', 'Over-refusal review'], ['mutations', 'Mutation evidence'], ['backlog', 'Remediation backlog'], ['decisions', 'Owner decisions']];
const CSS = `:root{--bg:#050505;--surface:#121212;--surface2:#1A1A1A;--accent:#BE9447;--accent-dim:#7A5E28;--muted:#B3B3B3;--muted-soft:#8A8A8A;--text:#F2F2F2;--rule:#2A2A2A;--stop:#8B2020;--stop-text:#E88080;--review-text:#D4A055;--ready-text:#5DBF82}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;font-size:15px;line-height:1.5}
.banner{background:var(--stop);color:var(--text);padding:10px 16px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.04em}.banner p{margin:2px 0}
header,main,nav,footer{padding:0 16px;max-width:1100px;margin:0 auto}h1{font-family:'Bodoni Moda',Georgia,serif;font-weight:500;color:var(--accent);margin:18px 0 6px}
h2{font-size:17px;color:var(--accent);border-bottom:1px solid var(--rule);padding-bottom:4px;margin-top:26px}nav ul{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-wrap:wrap;gap:6px}
nav a{display:inline-block;padding:4px 8px;border:1px solid var(--rule);color:var(--muted);text-decoration:none;font-size:13px}nav a[aria-current]{color:var(--accent);border-color:var(--accent-dim)}
.wrap{overflow-x:auto;max-width:100%}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid var(--rule);padding:5px 7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
th{background:var(--surface2);color:var(--muted);font-weight:600}td{background:var(--surface)}code{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;overflow-wrap:anywhere}
.stop{color:var(--stop-text)}.review{color:var(--review-text)}.ready{color:var(--ready-text)}.muted{color:var(--muted-soft)}p,li{max-width:80ch;overflow-wrap:anywhere}footer{color:var(--muted-soft);font-size:12px;padding-bottom:24px}`;
function page(id, title, body) {
  const nav = PAGES.map(([p, t]) => '<li><a href="' + p + '.html"' + (p === id ? ' aria-current="page"' : '') + '>' + esc(t) + '</a></li>').join('');
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Phase 7 Workbench: ' + esc(title) + '</title><style>' + CSS + '</style></head><body>'
    + '<div class="banner" role="note"><p>LOCAL ENGINEERING CANDIDATE ONLY</p><p>NOT INDEPENDENTLY EVALUATED</p><p>NO RELEASE OR DEPLOYMENT AUTHORIZATION</p></div>'
    + '<header><h1>' + esc(title) + '</h1><p class="muted">JRS Engine v0.3.1-candidate against frozen v0.3. Synthetic material run offline. Release status NO_GO_NOT_VERIFIED.</p></header>'
    + '<nav aria-label="Workbench pages"><ul>' + nav + '</ul></nav><main>' + body + '</main><footer><p>Static, read-only page generated from recorded Phase 7 artifacts.</p></footer></body></html>\n';
}
const table = (head, rows) => '<div class="wrap"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const tone = (r) => (/unintended|survived|limitation_loss|evidence_integrity|scope_boundary|unexpected|rejected/.test(r) ? 'stop' : /intended|degradation|refusal|review|deferred|DEFERRED/.test(r) ? 'review' : 'ready');
const tag = (r) => '<span class="' + tone(r) + '">' + esc(r) + '</span>';
const st = (s) => esc(Object.entries(s || {}).map(([k, v]) => k.split('_')[0] + ':' + v).join(', '));
const counts = (o) => Object.entries(o).map(([k, v]) => esc(k) + ' ' + v).join(', ');
const out = {};
out.index = page('index', 'Overview', '<p>A separately versioned local candidate addresses the Phase 6 defects through nine narrow rules in six signed rule packs. Every rule can only keep or lower a status, or refuse. Frozen v0.3 is unchanged.</p>' + table(['Item', 'Recorded value'], [
  ['Existing inputs compared', esc(qual.existing.length) + ' (' + counts(qual.existing_counts) + ')'], ['Phase 7 scenarios', esc(scen.results.length) + ' (' + counts(scen.counts) + '); differential ' + counts(qual.phase7_counts)],
  ['Stability transforms', esc(stab.total) + ' (' + stab.as_expected + ' as expected)'], ['Mutations', mut ? esc(mut.total + ' introduced, ' + mut.killed + ' killed, ' + mut.survived + ' survived, ' + mut.load_failures + ' load failures') : 'not recorded'],
  ['Rule packs', esc(reg.packs.length + ' packs, ' + reg.packs.reduce((a, p) => a + p.rules.length, 0) + ' rules')], ['Backlog', esc(backlog.length) + ' hash-chained entries'], ['Release status', 'NO_GO_NOT_VERIFIED']]));
out['rule-packs'] = page('rule-packs', 'Rule packs', reg.packs.map((p) => '<h2>' + esc(p.pack_id + ' ' + p.pack_version) + '</h2><p>' + esc(p.purpose) + '</p><p class="muted">Content seal <code>' + esc(p.content_sha256) + '</code></p>'
  + table(['Rule', 'Trigger', 'Safe outcome', 'Limitation', 'False-positive risk'], p.rules.map((r) => [esc(r.rule_id), esc(r.trigger), esc(r.expected_safe_outcome), esc(r.limitation), esc(r.false_positive_risk)]))).join(''));
out.qualification = page('qualification', 'Differential qualification', '<p>' + esc(qual.statement) + '</p><h2>Existing inputs that changed (sealed in advance)</h2>'
  + table(['Input', 'Family', 'Rules', 'v0.3 outcomes', 'Candidate outcomes', 'Classification'], qual.existing.filter((q) => q.classification !== 'no_behavioral_difference').map((q) => [esc(q.id), esc(q.family), esc(q.rules.join(', ')), st(q.base_statuses), st(q.candidate_statuses), tag(q.classification)]))
  + '<h2>Phase 7 scenarios</h2>' + table(['Scenario', 'Rules', 'Candidate outcomes', 'Classification'], qual.phase7.map((q) => [esc(q.id), esc(q.rules.join(', ')), st(q.candidate_statuses), tag(q.classification)]))
  + '<p>All other ' + esc(qual.existing_counts.no_behavioral_difference) + ' existing inputs show no behavioural difference. Intended changes were predicted for ' + esc(ics.triggered) + ' inputs before the candidate logic existed.</p>');
out.scenarios = page('scenarios', 'Regression scenarios', table(['Scenario', 'Rule', 'Role', 'Outcomes', 'Result'], scen.results.map((r) => [esc(r.scenario_id), esc(r.rule_id), esc(r.role), st(r.statuses), tag(r.result)])));
out.stability = page('stability', 'Stability', table(['Transform', 'Kind', 'Base', 'Base state', 'Verdict', 'Result'], stab.results.map((r) => [esc(r.transform_id + ' ' + r.name), esc(r.kind), esc(r.base), esc(r.base_state), tag(r.verdict), tag(r.result)])));
out['over-refusal'] = page('over-refusal', 'Over-refusal review', '<p>' + esc(over.statement) + '</p>' + table(['Rule', 'Target cases as sealed', 'Benign cases refused or degraded', 'Existing inputs triggered'],
  over.rows.map((r) => [esc(r.rule_id), esc(r.target_cases_routed_as_sealed + ' of ' + r.target_cases), esc(r.benign_cases_refused_or_degraded + ' of ' + r.benign_cases), esc(r.existing_inputs_triggered.join(', '))])));
out.mutations = page('mutations', 'Mutation evidence', mut ? table(['Mutation', 'Area', 'File', 'Result', 'Killed by'], mut.results.map((r) => [esc(r.id), esc(r.area), esc(r.file.replace(/^.*\//, '')), tag(r.result), esc((r.killed_by || []).slice(0, 6).join(', ') + ((r.killed_by || []).length > 6 ? ' (+' + (r.killed_by.length - 6) + ')' : ''))])) : '<p>Not recorded.</p>');
out.backlog = page('backlog', 'Remediation backlog', table(['Entry', 'Defect', 'Decision', 'Reason', 'Owner decision'], backlog.map((e) => [esc(e.entry_id), esc(e.defect_ref), tag(e.decision), esc(e.reason), esc(e.owner_decision_required)])));
out.decisions = page('decisions', 'Owner decisions', table(['Decision', 'Question', 'Basis'], DECISIONS.map((d) => [esc(d.id), esc(d.question), esc(d.basis)])));
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { for (const [k, v] of Object.entries(out)) writeFileSync(join(HERE, k + '.html'), v); console.log('wrote ' + Object.keys(out).length + ' pages'); }

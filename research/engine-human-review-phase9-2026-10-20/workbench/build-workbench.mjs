#!/usr/bin/env node
// JRS PHASE 9: static workbench, built from the Phase 9 modules and the first evaluator run.
//
//   env -u ANTHROPIC_BASE_URL node research/engine-human-review-phase9-2026-10-20/workbench/build-workbench.mjs
//
// Output is one static HTML page: no script, form, input, upload, authentication or network URL.

import { detectProviderConfiguration, installNetworkTrap } from '../../../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();
const { readFileSync, writeFileSync, readdirSync } = await import('node:fs');
const { join } = await import('node:path');
const { fileURLToPath } = await import('node:url');
const K = await import('../../../lib/engine-human-review-phase9/contract.mjs');
const DM = await import('../../../lib/engine-human-review-phase9/decision-model.mjs');
const CC = await import('../../../lib/engine-human-review-phase9/controls.mjs');
const P = await import('../../../lib/engine-human-review-phase9/protocol.mjs');
const R = await import('../../../lib/engine-human-review-phase9/rehearsal.mjs');

const HERE = fileURLToPath(new URL('./', import.meta.url));
const RES = join(HERE, '..');
const cases = readdirSync(join(RES, 'rehearsal/cases')).sort().map((f) => JSON.parse(readFileSync(join(RES, 'rehearsal/cases', f), 'utf8')));
const disclosed = JSON.parse(readFileSync(join(RES, 'rehearsal/DISCLOSED_DIFFERENCES.json'), 'utf8')).differences;
const first = JSON.parse(readFileSync(join(RES, 'rehearsal/FIRST_EVALUATOR_RUN.json'), 'utf8'));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const EXAMPLES = ['R9-QNS-02', 'R9-NEG-01', 'R9-CHR-02', 'R9-CON-01', 'R9-SIN-02', 'R9-SUF-04'];

const example = (id) => {
  const c = cases.find((x) => x.packet_id === id), p = R.blindedPacket(c, R.compileCase(c)), d = p.dossier;
  const q = d.quotations.map((x) => '<li><span class="mono">' + esc(x.observation_id) + '</span> ' + esc(x.verification_state) + (x.section ? ', section ' + esc(x.section) + ', offsets ' + x.start + ' to ' + x.end : '') + '<blockquote>' + esc(x.quotation) + '</blockquote></li>').join('');
  return '<article class="example"><h3 class="mono">' + esc(p.packet_id) + ' &middot; ' + esc(d.condition.name) + '</h3>'
    + '<p><span class="label">Engine status</span> <span class="mono">' + esc(d.engine_result.status) + '</span> &middot; routed to review: ' + (d.engine_result.routed_to_review ? 'yes' : 'no') + '</p>'
    + (q ? '<ul class="quotes">' + q + '</ul>' : '<p class="muted">No quotation in this packet.</p>')
    + (d.conflict_indicators.length ? '<p><span class="label">Conflict indicator</span> ' + esc(d.conflict_indicators.map((x) => x.summary).join(' ')) + '</p>' : '')
    + (d.refusal ? '<p><span class="label">Refusal</span> <span class="mono">' + esc(d.refusal.codes.join(', ')) + '</span></p>' : '')
    + '<p class="presence">' + esc(d.presence_statement) + '</p>'
    + '<p><span class="label">Reviewer question</span> ' + esc(d.reviewer_question) + '</p>'
    + '<p><span class="label">Escalation</span> ' + (d.escalation.required ? esc(d.escalation.triggers.map((t) => t.id + ': ' + t.text).join(' ')) : 'no trigger from the Engine output; abstention remains available') + '</p>'
    + '<p><span class="label">Reviewer outcome</span> <span class="empty">not filled; completed by a human reviewer only</span></p></article>';
};

const qns = cases.find((x) => x.packet_id === 'R9-QNS-01'), gq = R.compileCase(qns), dq = R.blindedPacket(qns, gq).dossier;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Phase 9 human evidence workbench</title>
<style>
:root{--bg:#050505;--surface:#121212;--surface2:#1A1A1A;--accent:#BE9447;--accent-dim:#7A5E28;--muted:#B3B3B3;--muted-soft:#8A8A8A;--text:#F2F2F2;--rule:#2A2A2A;--stop:#8B2020;--stop-text:#E88080;--review-text:#D4A055;--ready-text:#5DBF82}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;line-height:1.55;overflow-wrap:anywhere}
main{max-width:1040px;margin:0 auto;padding:24px 16px 64px}h1,h2{font-family:'Bodoni Moda',Georgia,serif;font-weight:500}h1{font-size:1.9rem;margin:0 0 8px}h2{font-size:1.35rem;border-top:1px solid var(--rule);padding-top:20px;margin-top:32px}
h3{font-size:.95rem;margin:0 0 8px;color:var(--accent)}.mono,.label,code{font-family:'JetBrains Mono',ui-monospace,monospace}.label{font-size:.75rem;color:var(--muted-soft);text-transform:uppercase;letter-spacing:.06em;margin-right:6px}
.banner{background:var(--surface);border:1px solid var(--stop);color:var(--stop-text);padding:12px 14px;margin:16px 0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.85rem}
.muted{color:var(--muted)}table{width:100%;border-collapse:collapse;font-size:.88rem;table-layout:fixed}th,td{border-bottom:1px solid var(--rule);padding:8px 6px;text-align:left;vertical-align:top}th{color:var(--muted-soft);font-weight:500}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px}.example,.card{background:var(--surface);border:1px solid var(--rule);padding:14px}
blockquote{margin:6px 0;padding:6px 10px;border-left:2px solid var(--accent-dim);background:var(--surface2);color:var(--muted)}.quotes{padding-left:18px;margin:6px 0}.presence{color:var(--review-text);font-size:.9rem}.empty{color:var(--muted-soft);font-style:italic}
.stop{color:var(--stop-text)}
@media (max-width:640px){table,thead,tbody,tr,th,td{display:block}thead{display:none}td{border:none;padding:4px 0}tr{border-bottom:1px solid var(--rule);padding:8px 0}}
</style></head><body><main>
<h1>Human evidence adjudication workbench</h1>
<p class="muted">Phase 9, local engineering only. Built from synthetic material derived from the fictional GC-001 record.</p>
<div class="banner">${K.PHASE9_STATEMENTS.map(esc).join(' &middot; ')}<br>Release status: NO_GO_NOT_VERIFIED &middot; Blocker B-018: OPEN</div>

<h2 id="boundary">The dossier boundary</h2>
<p>${esc(K.PRESENCE_STATEMENT)}</p><p>${esc(K.ENGINE_RESULT_STATEMENT)} ${esc(K.BOUNDARY_STATEMENT)}</p>
<table><thead><tr><th>Layer</th><th>Determined by</th><th>Meaning</th></tr></thead><tbody>
${K.EVIDENCE_LAYERS.map((l) => '<tr><td class="mono">' + esc(l.layer) + '</td><td>' + esc(l.determined_by) + '</td><td>' + esc(l.meaning) + '</td></tr>').join('\n')}
</tbody></table>

<h2 id="decision-model">Decision model</h2>
<p class="muted">Seven outcomes. The package never selects, infers or fills one in.</p>
<table><thead><tr><th>Outcome</th><th>Minimum basis</th><th>Prohibited reasoning</th><th>Escalation</th></tr></thead><tbody>
${DM.DECISION_MODEL.map((m) => '<tr><td class="mono">' + esc(m.outcome) + '</td><td>' + esc(m.minimum_basis) + '</td><td>' + esc(m.prohibited_reasoning) + '</td><td>' + esc(m.escalation_rule) + '</td></tr>').join('\n')}
</tbody></table>
<p class="muted">Reviewers are never asked to decide: ${K.PROHIBITED_QUESTIONS.map(esc).join('; ')}.</p>

<h2 id="controls">Cognitive Controls</h2>
<p class="muted">Structured review safeguards. Each names a review risk and asks a neutral question; none directs a result. No clinical or diagnostic claim is made.</p>
<div class="grid">${CC.CONTROLS.map((c) => '<div class="card"><h3 class="mono">' + esc(c.id) + ' &middot; ' + esc(c.name) + '</h3><p><span class="label">Review risk</span>' + esc(c.review_risk) + '</p><p>' + esc(c.prompt) + '</p></div>').join('')}</div>

<h2 id="examples">Six blinded examples</h2>
<p class="muted">Each packet is shown as a reviewer would receive it: an opaque identifier, the Engine status, the located quotation and an empty outcome. Categories and expectations are not shown.</p>
<div class="grid">${EXAMPLES.map(example).join('\n')}</div>

<h2 id="disagreement">Disagreement example</h2>
<div class="card"><p>Packet <span class="mono">${esc(dq.record.record_id)}</span>: the Engine status for identifiable basis is <span class="mono">${esc(dq.engine_result.status)}</span>. The quoted authority line names a board and minutes, and the same line says the board did not consider the request.</p>
<p>If a human reviewer were to record <span class="mono">does_not_support_finding</span>, the disagreement protocol would: keep the Engine output unchanged and refer to it by its graph hash (<span class="mono">${esc(gq.identity.graph_sha256.slice(0, 23))}&hellip;</span>); create a candidate learning record with status <span class="mono">candidate_only</span> and <span class="mono">applied: false</span>; and require ${esc(P.DISAGREEMENT_PROTOCOL.change_path.replace(/^Any Engine change requires /, ''))}</p>
<p class="muted">No reviewer entry exists in this package. This example describes what the protocol would do; it records no outcome.</p></div>

<h2 id="limitations">Limitations and escalation</h2>
<ul>
<li>Escalation triggers come from the Engine output only: ${Object.entries(K.ESCALATION_TRIGGERS).map(([k, v]) => '<span class="mono">' + k + '</span> ' + esc(v)).join(' ')}</li>
<li>The rehearsal set is synthetic and engineering-authored by the team that built the layer. It is holdout-ineligible. Expectations are authoring judgments, not labels.</li>
<li>First evaluator run: ${first.as_sealed} of ${first.total} packets matched the seal. ${disclosed.map((d) => 'One differed (' + esc(d.check) + '): ' + esc(d.consequence)).join(' ')}</li>
<li>Every reliability measure is defined and marked not measurable locally. Nothing in this workbench is a performance figure.</li>
<li>The dual-review protocol is execution-disabled. No reviewer, label or outcome exists.</li>
</ul>

<h2 id="decisions">Unresolved owner decisions</h2>
<ul>
<li>Whether, when and by whom a dual human review may be run, with which reviewers and on which material.</li>
<li>Whether the low-versus-unresolved risk detection gap should become a governed Engine change proposal.</li>
<li>Agreement thresholds, if any, for the planned measures. None is set.</li>
<li>Whether any of this material may be disclosed outside the repository.</li>
</ul>
<p class="stop">Blocker B-018: OPEN. Release status: NO_GO_NOT_VERIFIED. No release, deployment or commercial readiness determination.</p>
</main></body></html>
`;
writeFileSync(join(HERE, 'index.html'), html);
console.log('workbench written; network attempts ' + trap.attempts.length);

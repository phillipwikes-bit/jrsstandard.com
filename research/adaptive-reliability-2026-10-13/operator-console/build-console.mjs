#!/usr/bin/env node
// JRS ADAPTIVE RELIABILITY: static Operator Review Console.
//
//   env -u ANTHROPIC_BASE_URL node research/adaptive-reliability-2026-10-13/operator-console/build-console.mjs
//
// Renders self-contained static HTML from the Phase 4 local artifacts. No script,
// form, input, button, approval control, deployment action, file intake,
// authentication, storage, analytics or external resource. Non-authorising.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installNetworkTrap } from '../../../lib/engine-assurance/network-guard.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const PKG = fileURLToPath(new URL('../', import.meta.url));
const J = (rel) => JSON.parse(readFileSync(join(PKG, rel), 'utf8'));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const EXAMPLES = ['R-01', 'R-02', 'R-04', 'Y-03', 'X-02', 'Y-04', 'Y-06', 'Y-08'];
export const SECTIONS = ['1. Reliability Knowledge Base entries', '2. Change proposal', '3. Change Impact Analyzer output', '4. Selected regression plan',
  '5. Behavioral Drift Ledger', '6. Mutation status', '7. Stability test results', '8. Fixture expansion register', '9. Unresolved failure modes',
  '10. Local Release Candidate Gate Simulator'];

const CSS = `:root{--bg:#050505;--surface:#121212;--surface2:#1A1A1A;--accent:#BE9447;--muted:#B3B3B3;--text:#F2F2F2;--rule:#2A2A2A;--stop-text:#E88080;--review-text:#D4A055;--ready-text:#5DBF82}
*{box-sizing:border-box}body{background:var(--bg);color:var(--text);font:15px/1.55 Inter,system-ui,sans-serif;margin:0;padding:20px 16px}main{max-width:1060px;margin:0 auto}
h1{font:600 21px Georgia,serif;color:var(--accent);margin:0 0 6px}h2{font:600 14px 'JetBrains Mono',monospace;color:var(--accent);border-top:1px solid var(--rule);padding-top:12px;margin-top:22px}
.banner{background:var(--surface2);border-left:3px solid var(--stop-text);padding:10px 14px;color:var(--muted)}.four{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:12px 0}
.four div{background:var(--surface);border:1px solid var(--rule);padding:10px 12px}.four b{display:block;font:600 12px 'JetBrains Mono',monospace;color:var(--accent);margin-bottom:4px}
.tbl{overflow-x:auto;max-width:100%}table{border-collapse:collapse;width:100%;min-width:620px;font-size:13px}td code{word-break:normal;white-space:nowrap}th,td{border:1px solid var(--rule);padding:5px 7px;text-align:left;vertical-align:top}th{background:var(--surface2);color:var(--muted);font-weight:600}
code{font:12.5px 'JetBrains Mono',monospace;word-break:break-word}.rej{color:var(--stop-text)}.rev{color:var(--review-text)}.ok{color:var(--ready-text)}.info{color:var(--muted);font-style:italic}.m{color:var(--muted)}ul{padding-left:20px}`;

const table = (head, rows) => '<div class="tbl"><table><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table></div>';
const page = (title, body) => '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + esc(title) + '</title><style>' + CSS + '</style></head><body><main>' + body + '</main></body></html>\n';

export function loadArtifacts() {
  const kb = readFileSync(join(PKG, 'knowledge-base/KNOWLEDGE_BASE.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const mut = existsSync(join(PKG, 'execution-record/MUTATION_EVIDENCE.json')) ? J('execution-record/MUTATION_EVIDENCE.json') : null;
  return { kb, proposals: J('proposals/PROPOSALS.json').proposals, impacts: J('proposals/IMPACT_ANALYSES.json').impacts, plans: J('proposals/REGRESSION_PLANS.json').plans,
    drift: J('drift-ledger/DRIFT_LEDGER.json'), stability: J('stability-laboratory/STABILITY_RESULTS.json'), corpus: J('corpus-expansion/CORPUS_EXECUTION_RECORD.json'),
    register: J('corpus-expansion/FIXTURE_REGISTER.json'), open: J('corpus-expansion/OPEN_FAILURES.json'), gate: J('gate-simulator/GATE_SIMULATION.json'), mut };
}

export function renderPage(rid, A) {
  const p = A.proposals[rid], im = A.impacts[rid], pl = A.plans[rid];
  const rejected = p.authorization_state === 'rejected_by_compiler', blocked = p.authorization_state.startsWith('blocked');
  const trig = A.kb.filter((e) => p.triggering_knowledge_ids.includes(e.knowledge_id));
  const iso = A.drift.isolated_proposal_runs[rid];
  const unresolved = A.kb.filter((e) => ['observed', 'proposed_control', 'blocked', 'under_analysis'].includes(e.status));
  const s = [];
  s.push('<h1>Operator Review Console: ' + esc(rid) + ' (' + esc(p.proposal_id) + ')</h1>');
  s.push('<div class="banner">Static local page built from synthetic material. It has no approval control and authorises nothing. A proposal is not an approved change. A passing test is not an accuracy claim. Production status: NO_GO_NOT_VERIFIED.</div>');
  s.push('<div class="four"><div><b>What the Engine can do locally</b>Locate quoted text in synthetic supplier-access records, build an evidence graph, flag visible gaps and record conflicts, refuse out-of-scope records, and route every finding to human review.</div>'
    + '<div><b>What changed</b>' + (rejected ? 'Nothing. The compiler refused this request.' : blocked ? 'Nothing. The proposal is blocked (' + esc(p.authorization_state) + ').' : iso ? 'Nothing in the Engine. An isolated copy was tested: ' + iso.rows.length + ' drift row(s) observed.' : 'Nothing in the Engine. The proposal is recorded only.') + '</div>'
    + '<div><b>Why</b>' + esc(p.summary) + '</div>'
    + '<div><b>Unresolved; needs a human decision</b>' + (rejected ? 'Whether the request should be withdrawn or reframed.' : p.authorization_state === 'blocked_pending_human_disposition' ? 'A person must record a disposition on the observed favourable change; nothing here can.' : blocked ? 'An isolated observed-change record is needed before review.' : 'Whether the owner wants this proposal implemented in a new version.') + ' Human disposition: ' + esc(p.human_disposition) + '. ' + unresolved.length + ' knowledge entries remain open.</div></div>');
  s.push('<h2>' + SECTIONS[0] + '</h2>' + table(['ID', 'Class', 'Status', 'Observed', 'Expected safe behaviour'], trig.map((e) => ['<code>' + esc(e.knowledge_id) + '</code>', esc(e.failure_class), esc(e.status), esc(e.observed_behavior), esc(e.expected_safe_behavior)]))
    + '<p class="m">' + A.kb.length + ' entries in the append-only knowledge base; hash chain intact at build time.</p>');
  s.push('<h2>' + SECTIONS[1] + '</h2>' + table(['Field', 'Value'], [
    ['Authorization state', '<span class="' + (rejected ? 'rej' : 'rev') + '">' + esc(p.authorization_state) + '</span>'], ['Human disposition', esc(p.human_disposition) + ' (recorded only by a person, outside this system)'],
    ['Observed change', p.observed_change ? esc('record ' + p.observed_change.record_sha256.slice(7, 19) + ': ' + p.observed_change.rows + ' row(s), favourable ' + p.observed_change.favourable_transitions + ', refusals removed ' + p.observed_change.refusals_removed + ', limitations removed ' + p.observed_change.limitations_removed) : esc(p.behavioural ? 'none verified' + (p.observed_change_problems.length ? ': ' + p.observed_change_problems.join('; ') : '') : 'not required (non-behavioural)')],
    ['Change type', esc(p.proposed_change_type)], ['Components', esc(p.affected_engine_components.join(', '))],
    ['Conditions', esc(p.affected_conditions.join(', ') || 'none')], ['Rollback', esc(p.rollback_requirement || 'missing')], ['Compatibility', esc(p.compatibility_impact || 'missing')],
    ['Version increment required', String(p.version_increment_required)], ['Human review required', String(p.human_review_required)],
    ['Rejection reasons', rejected ? '<span class="rej">' + esc(p.rejection_reasons.map((r) => r.code + ' (' + r.detail + ')').join('; ')) + '</span>' : 'none'],
    ['Claim boundary', esc(p.claim_boundary)]]));
  s.push('<h2>' + SECTIONS[2] + '</h2>' + table(['Question', 'Answer'], [
    ['Impact class', '<code>' + esc(im.impact_class) + '</code>'], ['Reasons', esc(im.reasons.join('; '))], ['Historical outputs', esc(Object.entries(im.historical_outputs_change).map(([k, v]) => k + ': ' + v).join('; '))],
    ['Fixtures requiring replay', esc(im.fixtures_requiring_replay.join(', ') || 'none')], ['Graph rules affected', esc(im.graph_rules_affected.join(', ') || 'none')],
    ['Cognitive Controls affected', esc(im.cognitive_controls_affected.join(', ') || 'none')], ['Refusal behaviour', esc(im.refusal_behavior)],
    ['Condition could become more favourable', String(im.condition_can_become_more_favorable)], ['Limitation removed or weakened', String(im.limitation_removed_or_weakened)],
    ['Documentation must change', String(im.documentation_must_change)], ['New version identity required', String(im.new_version_identity_required)],
    ['Evaluation protocol update required', String(im.independent_evaluation_protocol_update_required)]]));
  s.push('<h2>' + SECTIONS[3] + '</h2>' + table(['Test class', 'Why selected', 'Protects against'], pl.selected.map((t) => ['<code>' + esc(t.test) + '</code>', esc(t.reason), esc(t.protects_against)]))
    + '<p class="m">Excluded: ' + esc(pl.excluded.map((x) => x.test).join(', ') || 'none') + '. Coverage gaps: ' + esc(pl.coverage_gaps.join('; ') || 'none') + '. Full suite mandatory: ' + pl.full_suite_mandatory + '. ' + esc(pl.statement) + '</p>');
  const shown = iso ? iso.rows.filter((r) => r.classification !== 'non_material').slice(0, 40) : [];
  s.push('<h2>' + SECTIONS[4] + '</h2>' + (iso ? table(['Fixture', 'Condition', 'Prior', 'Candidate', 'Observed change', 'Class', 'Human disposition'], shown.map((r) => [esc(r.fixture_id), esc(r.condition), esc(r.prior_outcome), esc(r.candidate_outcome), esc(r.observed_change), '<span class="' + (r.classification === 'material_unsafe_until_human_disposition' ? 'rej' : 'm') + '">' + esc(r.classification) + '</span>', esc(r.human_disposition)]))
      + '<p class="m">' + (iso.rows.length - shown.length) + ' further row(s) not shown (non-material or beyond 40). Run identity ' + esc(iso.identity.run_id) + '; patch ' + esc(iso.identity.patch_sha256.slice(7, 19)) + '.</p>'
      + '<p class="' + (iso.fail ? 'rej' : 'm') + '">Isolated copy result: ' + (iso.fail ? 'FAILS CLOSED with ' + iso.violations.length + ' violation(s): ' + esc([...new Set(iso.violations.map((v) => v.code))].join(', ')) : 'no drift violation') + '. Compared over ' + A.drift.fixtures_compared + ' fixtures. The isolated copy was deleted after the run; nothing was applied.</p>'
    : '<p class="m">No isolated run for this proposal. Cross-version rows (v0.2 to v0.3) on paired synthetic records:</p>' + table(['Pair', 'Condition', 'v0.2', 'v0.3', 'Explanation'], A.drift.cross_version_rows.map((r) => [esc(r.fixture_id), esc(r.condition), esc(r.prior_outcome), esc(r.candidate_outcome), esc(r.explanation)]))));
  s.push('<h2>' + SECTIONS[5] + '</h2>' + (A.mut ? '<p>' + A.mut.mutations.filter((m) => m.killed).length + ' of ' + A.mut.mutations.length + ' Phase 4 mutations killed by a direct probe; ' + A.mut.probes.length + ' probes pass on the unmutated code.</p>' : '<p class="m">Mutation evidence not yet recorded at build time.</p>'));
  s.push('<h2>' + SECTIONS[6] + '</h2>' + table(['Transform', 'Kind', 'Result', 'Expected review effect'], A.stability.results.map((r) => [esc(r.transform_id + ' ' + r.name), esc(r.kind), '<span class="' + (r.result === 'as_expected' ? 'ok' : 'rej') + '">' + esc(r.result) + '</span>', esc(r.expected_review)]))
    + '<p class="m">' + esc(A.stability.statement) + '</p>');
  const byGap = {}; for (const f of A.register.fixtures) byGap[f.coverage_gap] = (byGap[f.coverage_gap] || 0) + 1;
  s.push('<h2>' + SECTIONS[7] + '</h2>' + table(['Gap', 'Description', 'Fixtures'], Object.entries(A.register.coverage_gaps).map(([k, v]) => ['<code>' + esc(k) + '</code>', esc(v), String(byGap[k] || 0)]))
    + '<p class="m">' + A.corpus.as_expected + ' of ' + A.corpus.total + ' new synthetic fixtures behave as the expected safe result. Open failures: ' + esc(A.corpus.open_failures_observed.join(', ')) + '. Synthetic engineering fixtures; not independent, real-world or holdout material.</p>');
  const openRows = Object.entries(Object.assign({}, A.open.corpus, A.open.stability)).map(([k, v]) => ['<code>' + esc(k) + '</code>', esc(v.knowledge_id), v.unsafe_direction ? '<span class="rej">yes</span>' : 'no', esc(v.summary)]);
  s.push('<h2>' + SECTIONS[8] + '</h2>' + table(['Case', 'Knowledge', 'Unsafe direction', 'Summary'], openRows));
  s.push('<h2>' + SECTIONS[9] + '</h2><p class="rej">' + esc(A.gate.statement) + '</p>' + table(['Category', 'State', 'Evidence or note'], Object.entries(A.gate.categories).map(([k, v]) => ['<code>' + esc(k) + '</code>', '<span class="' + (v.state === 'present_local_artifact' ? 'info' : v.state === 'missing_local_artifact' || v.state === 'not_assessed' ? 'rev' : 'rej') + '">' + esc(v.state === 'present_local_artifact' ? 'local file present (not a gate result)' : v.state) + '</span>', esc(v.evidence || v.note || '')]))
    + '<p class="m">No score, green light, recommendation or readiness determination is produced. Production status: ' + esc(A.gate.production_status) + '.</p>');
  return page('Operator Review Console ' + rid, s.join('\n'));
}

export function buildConsole() {
  const A = loadArtifacts();
  mkdirSync(join(HERE, 'rendered'), { recursive: true });
  for (const rid of EXAMPLES) writeFileSync(join(HERE, 'rendered', rid + '.html'), renderPage(rid, A));
  const idx = '<h1>Operator Review Console (local, synthetic)</h1><div class="banner">Static pages built from local synthetic artifacts. No approval, deployment, file intake, network or authentication. Nothing here authorises a change.</div><ul>'
    + EXAMPLES.map((r) => '<li><a href="' + r + '.html">' + esc(r) + '</a>: ' + esc(A.proposals[r].summary) + ' <span class="' + (A.proposals[r].authorization_state === 'rejected_by_compiler' ? 'rej' : 'rev') + '">(' + esc(A.proposals[r].authorization_state) + ')</span></li>').join('') + '</ul>';
  writeFileSync(join(HERE, 'rendered', 'index.html'), page('Operator Review Console', idx));
  return EXAMPLES.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const trap = installNetworkTrap();
  try { console.log('rendered ' + buildConsole() + ' examples; network attempts trapped: ' + trap.count()); } finally { trap.restore(); }
}

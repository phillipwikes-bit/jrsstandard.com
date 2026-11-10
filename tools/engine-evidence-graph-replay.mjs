#!/usr/bin/env node
// JRS EVIDENCE GRAPH 0.3.0: offline replay of the synthetic fixture pack.
//
//   env -u ANTHROPIC_BASE_URL node tools/engine-evidence-graph-replay.mjs [--clock ISO] [--no-write]
//
// Refuses to start with a provider credential or endpoint configured (exit 3);
// traps every Node network API for the run. Writes
// research/evidence-graph-compiler-2026-10-10/execution-record/EXECUTION_RECORD.json
// unless --no-write. Exit 0 only if every case matches and nothing was trapped.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { detectProviderConfiguration, installNetworkTrap } from '../lib/engine-assurance/network-guard.mjs';

const REPO = fileURLToPath(new URL('../', import.meta.url));
const PKG = join(REPO, 'research/evidence-graph-compiler-2026-10-10');
const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');

export function loadGraphCase(dir, id) {
  const sub = JSON.parse(readFileSync(join(dir, id + '.submission.json'), 'utf8'));
  if (typeof sub.record_text === 'string' && sub.record_text.startsWith('@file:')) sub.record_text = readFileSync(join(dir, sub.record_text.slice(6)), 'utf8');
  let response = null; try { response = readFileSync(join(dir, id + '.candidate-response.txt'), 'utf8'); } catch { /* deterministic case */ }
  return { submission: sub, response, expected: JSON.parse(readFileSync(join(dir, id + '.expected.json'), 'utf8')) };
}

export async function replayEvidenceGraph(options = {}) {
  const env = options.env || process.env;
  const fixtures = options.fixturesDir || join(PKG, 'fixtures');
  const clock = options.clock || null;
  if (detectProviderConfiguration(env).length) return { exitCode: 3, refused: true, message: 'REFUSED: provider configuration present; nothing was executed.' };
  const trap = installNetworkTrap();
  try {
    const { compileEvidenceGraph } = await import('../lib/engine-evidence-graph/compiler.mjs');
    const { canonical } = await import('../lib/engine-evidence-graph/graph-validate.mjs');
    const reg = JSON.parse(readFileSync(join(fixtures, 'FIXTURE_REGISTER.json'), 'utf8'));
    const results = [], graphs = {};
    for (const f of reg.fixtures) {
      const c = loadGraphCase(join(fixtures, 'cases'), f.id), x = c.expected, P = [];
      const cmp = (label, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) P.push(label + ': expected ' + JSON.stringify(want) + ', got ' + JSON.stringify(got)); };
      let g;
      try { g = compileEvidenceGraph({ submission: c.submission, candidateResponseText: c.response, executionMode: x.execution_mode, clock: clock || undefined, fixtureId: f.id }); }
      catch (e) { results.push({ id: f.id, category: f.category, result: 'fail', mismatches: ['compile error: ' + e.message.slice(0, 900)] }); continue; }
      graphs[f.id] = g;
      cmp('gate', g.intake.decision, x.gate_decision);
      cmp('instruction_risk', g.record_instruction_risk, x.record_instruction_risk);
      if (x.candidate_valid !== null) cmp('candidate_valid', g.candidate.valid, x.candidate_valid);
      cmp('statuses', Object.fromEntries(g.findings.map((y) => [y.condition_id, y.status])), x.statuses);
      for (const [cid, list] of Object.entries(x.reasons_include)) {
        const got = g.findings.find((y) => y.condition_id === cid).reasons;
        for (const want of list) if (!got.some((r) => r.startsWith(want))) P.push(cid + ': missing reason ' + want + ' (got ' + JSON.stringify(got) + ')');
      }
      cmp('conflict_kinds', g.conflicts.map((k) => k.kind).sort(), x.conflict_kinds);
      cmp('refusal_codes', [...new Set(g.refusals.map((r) => r.code))].sort(), x.refusal_codes);
      for (const [oid, st] of Object.entries(x.quote_statuses)) { const n = g.nodes.find((y) => y.id === 'pq:' + oid); cmp('quote.' + oid, n && n.quote_resolution_status, st); }
      if (x.cc_defects !== null) cmp('cc_defects', [...new Set(g.cognitive_controls.map((y) => y.defect))].sort(), x.cc_defects);
      if (g.controls_withheld.length) P.push('controls withheld: ' + JSON.stringify(g.controls_withheld));
      results.push({ id: f.id, category: f.category, result: P.length ? 'fail' : 'pass', mismatches: P,
        statuses: Object.fromEntries(g.findings.map((y) => [y.condition_id, y.status])), nodes: g.nodes.length, edges: g.edges.length,
        hashes: { fixture: g.identity.fixture_hash, expected: sha(canonical(x)), graph: g.identity.graph_sha256 } });
    }
    const passed = results.filter((r) => r.result === 'pass').length;
    const record = {
      record_type: 'jrs-evidence-graph-execution-record/0.3.0', generated_at: clock || new Date().toISOString(),
      command: 'node tools/engine-evidence-graph-replay.mjs' + (clock ? ' --clock ' + clock : ''),
      environment: { node: process.version, platform: process.platform + '-' + process.arch },
      network: { trap_installed: true, trapped_attempts: trap.count(), provider_calls: 0, external_records: 0 },
      summary: { total: results.length, passed, failed: results.length - passed, skipped: 0 },
      cases: results,
      status_statement: 'This package is a local Evidence Graph Compiler and sealed evaluation-preparation system. It does not establish independent accuracy, semantic validity, adjudicated performance, operational reliability, production readiness, security effectiveness, legal compliance, licensing readiness, or sale readiness.',
    };
    if (options.write !== false) { mkdirSync(join(PKG, 'execution-record'), { recursive: true }); writeFileSync(join(PKG, 'execution-record/EXECUTION_RECORD.json'), JSON.stringify(record, null, 2) + '\n'); }
    return { exitCode: record.summary.failed || trap.count() ? 1 : 0, record, graphs };
  } finally { trap.restore(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2); const i = a.indexOf('--clock');
  const res = await replayEvidenceGraph({ clock: i < 0 ? null : a[i + 1], write: !a.includes('--no-write') });
  if (res.refused) { console.error(res.message); process.exit(3); }
  for (const c of res.record.cases) console.log((c.result === 'pass' ? 'PASS  ' : 'FAIL  ') + c.id + (c.mismatches.length ? '\n        ' + c.mismatches.join('\n        ') : ''));
  const s = res.record.summary;
  console.log('\n' + s.total + ' cases: ' + s.passed + ' passed, ' + s.failed + ' failed, ' + s.skipped + ' skipped; network attempts trapped: ' + res.record.network.trapped_attempts);
  process.exit(res.exitCode);
}

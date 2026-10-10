#!/usr/bin/env node
// JRS EVIDENCE CONTRACT 0.2.0: offline replay of the synthetic fixture pack.
//
//   env -u ANTHROPIC_BASE_URL node tools/engine-evidence-contract-replay.mjs [--clock ISO] [--no-write]
//
// Runs every contract case, bridge case and long-record case against its
// frozen, engineering-authored expected result. Refuses to start when a
// provider credential or endpoint is configured (exit 3) and traps every Node
// network API for the whole run. Writes research/engine-evidence-contract-2026-10-10/
// execution-record/ unless --no-write. Exit 0 only when every case matches,
// no network attempt was trapped, and every result passed its own validation.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { detectProviderConfiguration, installNetworkTrap } from '../lib/engine-assurance/network-guard.mjs';

const REPO = fileURLToPath(new URL('../', import.meta.url));
const PKG = join(REPO, 'research/engine-evidence-contract-2026-10-10');
const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');

export function loadContractCase(dir, id) {
  const sub = JSON.parse(readFileSync(join(dir, id + '.submission.json'), 'utf8'));
  if (typeof sub.record_text === 'string' && sub.record_text.startsWith('@file:')) sub.record_text = readFileSync(join(dir, sub.record_text.slice(6)), 'utf8');
  const opt = (f) => { try { return readFileSync(join(dir, id + f), 'utf8'); } catch { return null; } };
  return { submission: sub, response: opt('.candidate-response.txt'), v1: opt('.v1-output.txt'), expected: JSON.parse(readFileSync(join(dir, id + '.expected.json'), 'utf8')) };
}

export async function replayEvidenceContract(options = {}) {
  const env = options.env || process.env;
  const fixtures = options.fixturesDir || join(PKG, 'fixtures');
  const clock = options.clock || null;
  const providerConfig = detectProviderConfiguration(env);
  if (providerConfig.length) return { exitCode: 3, refused: true, message: 'REFUSED: provider configuration present (' + providerConfig.map((p) => p.name).join(', ') + '). Nothing was executed.' };
  const trap = installNetworkTrap();
  try {
    const { runEvidenceContract } = await import('../lib/engine-evidence-contract/run.mjs');
    const { canonical } = await import('../lib/engine-evidence-contract/result-validate.mjs');
    const { bridgeV1Output } = await import('../lib/engine-evidence-contract/bridge.mjs');
    const { longRecordPlan } = await import('../lib/engine-evidence-contract/long-record.mjs');
    const { runIntakeGate, separateSubmission } = await import('../lib/engine-evidence-contract/boundary.mjs');
    const { scanUnsupportedClaims } = await import('../lib/engine-assurance/content-guard.mjs');

    const reg = JSON.parse(readFileSync(join(fixtures, 'FIXTURE_REGISTER.json'), 'utf8'));
    const results = [], outputs = {};
    const cmp = (problems, label, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(label + ': expected ' + JSON.stringify(want) + ', got ' + JSON.stringify(got)); };

    for (const f of reg.fixtures.filter((x) => x.kind === 'contract_case')) {
      const problems = [];
      const dir = join(fixtures, 'cases');
      const c = loadContractCase(dir, f.id);
      const x = c.expected;
      let r;
      try { r = runEvidenceContract({ submission: c.submission, candidateResponseText: c.response, executionMode: x.execution_mode, clock: clock || undefined, v1Output: c.v1, fixtureId: f.id }); }
      catch (e) { results.push({ id: f.id, kind: f.kind, result: 'fail', mismatches: ['run error: ' + e.message] }); continue; }
      outputs[f.id] = r;
      cmp(problems, 'gate_decision', r.intake.gate_decision, x.gate_decision);
      cmp(problems, 'record_instruction_risk', r.record_instruction_risk, x.record_instruction_risk);
      cmp(problems, 'response_status', r.candidate_response_validation.response_status, x.response_status);
      cmp(problems, 'refusal_codes', r.refusals.map((y) => y.code).sort(), [...x.refusal_codes].sort());
      if (x.remediation !== null) cmp(problems, 'remediation', r.conditions.flatMap((y) => y.cognitive_controls.map((z) => z.control_id + ':' + z.pattern_id)).sort(), [...x.remediation].sort());
      if (x.long_record_status) cmp(problems, 'long_record_status', r.long_record.length_status, x.long_record_status);
      cmp(problems, 'comparison_present', !!r.v1_comparison, x.comparison_present);
      if (x.comparison_v1_effective) for (const [id, st] of Object.entries(x.comparison_v1_effective)) cmp(problems, 'v1_effective.' + id, r.v1_comparison.rows.find((y) => y.condition_id === id).v1_effective_v02_status, st);
      if (x.parse_notes) cmp(problems, 'parse_notes', r.candidate_response_validation.parse_notes, x.parse_notes);
      for (const [id, want] of Object.entries(x.conditions)) {
        const got = r.conditions.find((y) => y.condition_id === id);
        cmp(problems, id + '.status', got.status, want.status);
        for (const reason of want.reasons_include) if (!got.routing_reasons.some((y) => y.startsWith(reason))) problems.push(id + ': missing routing reason ' + reason + ' (got ' + JSON.stringify(got.routing_reasons) + ')');
        if (want.evidence_quotes !== null) cmp(problems, id + '.evidence_quotes', got.evidence_items.map((y) => y.exact_quote).sort(), [...want.evidence_quotes].sort());
      }
      results.push({ id: f.id, kind: f.kind, category: f.category, result: problems.length ? 'fail' : 'pass', mismatches: problems,
        statuses: Object.fromEntries(r.conditions.map((y) => [y.condition_id, y.status])), gate: r.intake.gate_decision,
        hashes: { record: r.hashes.record, candidate_response: r.hashes.candidate_response, expected: sha(canonical(x)), result_normalized: r.hashes.result_normalized } });
    }
    // Cross-case expectation: key order does not change the conditions.
    for (const f of reg.fixtures.filter((x) => x.kind === 'contract_case')) {
      const x = loadContractCase(join(fixtures, 'cases'), f.id).expected;
      if (x.same_normalized_conditions_as && outputs[f.id] && outputs[x.same_normalized_conditions_as]) {
        const same = canonical(outputs[f.id].conditions) === canonical(outputs[x.same_normalized_conditions_as].conditions);
        const row = results.find((y) => y.id === f.id);
        if (!same) { row.result = 'fail'; row.mismatches.push('conditions differ from ' + x.same_normalized_conditions_as); }
      }
    }
    for (const f of reg.fixtures.filter((x) => x.kind === 'bridge_case')) {
      const dir = join(fixtures, 'bridge');
      const meta = JSON.parse(readFileSync(join(dir, f.id + '.case.json'), 'utf8'));
      const expected = JSON.parse(readFileSync(join(dir, f.id + '.expected.json'), 'utf8'));
      const record = readFileSync(join(dir, meta.record), 'utf8');
      const v1 = meta.v1_form === 'raw_provider_text' ? readFileSync(join(dir, f.id + '.v1-output.txt'), 'utf8') : JSON.parse(readFileSync(join(dir, f.id + '.v1-stored-result.json'), 'utf8'));
      const b = bridgeV1Output({ v1Output: v1, record, scopeRefused: meta.scope_refused, scopeReason: meta.scope_refused ? 'regulated_domain_content' : null });
      const problems = [];
      cmp(problems, 'parse_status', b.parse.status, expected.parse_status);
      cmp(problems, 'determination_conflict', !!(b.determination && b.determination.conflict), expected.determination_conflict);
      cmp(problems, 'record_flags', b.record_flags, expected.record_flags);
      cmp(problems, 'verbatim_preserved', b.original_output.verbatim === (typeof v1 === 'string' ? v1 : JSON.stringify(v1)), true);
      cmp(problems, 'migration', b.migration, 'prohibited_no_v02_evidence_created');
      for (const [k, want] of Object.entries(expected.conditions)) {
        const got = b.conditions.find((y) => y.v1_key === k);
        cmp(problems, k + '.mapping', got.mapping, want.mapping);
        cmp(problems, k + '.effective_v02_status', got.effective_v02_status, want.effective_v02_status);
        for (const reason of want.reasons_include) if (!got.reasons.some((y) => y.startsWith(reason))) problems.push(k + ': missing reason ' + reason + ' (got ' + JSON.stringify(got.reasons) + ')');
        if (['supported', 'gap'].includes(got.effective_v02_status)) problems.push(k + ': INVARIANT bridged condition became ' + got.effective_v02_status);
      }
      outputs[f.id] = b;
      results.push({ id: f.id, kind: f.kind, result: problems.length ? 'fail' : 'pass', mismatches: problems, hashes: { original_output: b.original_output.sha256, expected: sha(canonical(expected)) } });
    }
    for (const f of reg.fixtures.filter((x) => x.kind === 'long_record_case')) {
      const dir = join(fixtures, 'long-record');
      const record = readFileSync(join(dir, f.id + '.record.txt'), 'utf8');
      const x = JSON.parse(readFileSync(join(dir, f.id + '.expected.json'), 'utf8'));
      const plan = longRecordPlan(record);
      const sub = JSON.parse(readFileSync(join(fixtures, 'cases', 'EC-001.submission.json'), 'utf8')); sub.record_text = record;
      const s = separateSubmission(sub, null, {});
      const gate = runIntakeGate(record, s.compartments, s.unknown_submission_fields);
      const problems = [];
      if (x.length_chars) cmp(problems, 'length_chars', plan.length_chars, x.length_chars);
      cmp(problems, 'length_status', plan.length_status, x.length_status);
      cmp(problems, 'gate_decision', gate.decision, x.gate_decision);
      if (plan.segments.length < x.min_segments) problems.push('segments: expected at least ' + x.min_segments + ', got ' + plan.segments.length);
      cmp(problems, 'human_review_points', plan.human_review_points.map((y) => y.point), x.human_review_points);
      cmp(problems, 'no_analysis', [plan.analysis_performed, plan.segmented_analysis_authorized, plan.findings_combined], [false, false, false]);
      for (const sg of plan.segments) if (sg.length_chars > plan.limit_chars || record.slice(sg.start_offset, sg.end_offset).length !== sg.length_chars) problems.push(sg.segment_id + ': segment exceeds limit or offsets inconsistent');
      if (plan.segments.length && (plan.segments[0].start_offset !== 0 || plan.segments.at(-1).end_offset !== record.length
        || plan.segments.some((sg, i) => i && sg.start_offset !== plan.segments[i - 1].end_offset))) problems.push('segments do not tile the record with original offsets');
      outputs[f.id] = plan;
      results.push({ id: f.id, kind: f.kind, result: problems.length ? 'fail' : 'pass', mismatches: problems, segments: plan.segments.length, hashes: { record: sha(record), expected: sha(canonical(x)) } });
    }

    const passed = results.filter((x) => x.result === 'pass').length;
    const record = {
      record_type: 'jrs-evidence-contract-execution-record/0.2.0',
      generated_at: clock || new Date().toISOString(),
      command: 'node tools/engine-evidence-contract-replay.mjs' + (clock ? ' --clock ' + clock : ''),
      environment: { node: process.version, platform: process.platform + '-' + process.arch },
      network: { trap_installed: true, trapped_attempts: trap.count(), provider_calls: 0 },
      code_executed: readdirSync(join(REPO, 'lib/engine-evidence-contract')).filter((n) => n.endsWith('.mjs')).sort()
        .map((n) => ({ path: 'lib/engine-evidence-contract/' + n, sha256: sha(readFileSync(join(REPO, 'lib/engine-evidence-contract', n), 'utf8')) })),
      summary: { total: results.length, passed, failed: results.length - passed, skipped: 0,
        by_kind: Object.fromEntries(['contract_case', 'bridge_case', 'long_record_case'].map((k) => [k, results.filter((x) => x.kind === k).length])) },
      cases: results,
      status_statement: 'This package is a local engineering candidate and evaluation-preparation workbench. It does not establish independent accuracy, semantic-support validity, operational reliability, production readiness, security effectiveness, legal compliance, licensing readiness, or sale readiness.',
    };
    const guard = scanUnsupportedClaims(JSON.stringify(record.summary) + record.status_statement);
    record.content_guard_findings = guard.length;
    if (options.write !== false) {
      const out = join(PKG, 'execution-record');
      mkdirSync(out, { recursive: true });
      writeFileSync(join(out, 'EXECUTION_RECORD.json'), JSON.stringify(record, null, 2) + '\n');
    }
    return { exitCode: record.summary.failed || trap.count() || guard.length ? 1 : 0, record, outputs };
  } finally { trap.restore(); }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = process.argv.slice(2); const v = (k) => { const i = a.indexOf(k); return i < 0 ? null : a[i + 1]; };
  const res = await replayEvidenceContract({ clock: v('--clock'), write: !a.includes('--no-write') });
  if (res.refused) { console.error(res.message); process.exit(3); }
  for (const c of res.record.cases) console.log((c.result === 'pass' ? 'PASS  ' : 'FAIL  ') + c.id + (c.mismatches.length ? '\n        ' + c.mismatches.join('\n        ') : ''));
  const s = res.record.summary;
  console.log('\n' + s.total + ' cases (' + s.by_kind.contract_case + ' contract, ' + s.by_kind.bridge_case + ' bridge, ' + s.by_kind.long_record_case + ' long-record): '
    + s.passed + ' passed, ' + s.failed + ' failed, ' + s.skipped + ' skipped; network attempts trapped: ' + res.record.network.trapped_attempts);
  process.exit(res.exitCode);
}

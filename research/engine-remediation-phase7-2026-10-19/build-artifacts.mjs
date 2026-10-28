#!/usr/bin/env node
// JRS PHASE 7: builds the local qualification artifacts (writes only inside this package).
//   env -u ANTHROPIC_BASE_URL node research/engine-remediation-phase7-2026-10-19/build-artifacts.mjs
// Refuses to start with provider configuration; traps every network API; verifies the seal first.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectProviderConfiguration, installNetworkTrap } from '../../lib/engine-assurance/network-guard.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const REPO = fileURLToPath(new URL('../../', import.meta.url));
export const CLOCK = '2026-10-19T00:00:00Z';
const J = (p) => JSON.parse(readFileSync(join(HERE, p), 'utf8'));

export async function runAll() {
  const { compileEvidenceGraph: v03 } = await import('../../lib/engine-evidence-graph/compiler.mjs');
  const { compileEvidenceGraph: cand } = await import('../../lib/engine-evidence-graph-v0.3.1-candidate/compiler.mjs');
  const C = await import('./tooling/candidate.mjs'), I = await import('./tooling/inputs.mjs'), SS = await import('./tooling/scenario-schema.mjs'), Q = await import('./tooling/qualify.mjs');
  const ST = await import('../../lib/engine-reliability/stability.mjs'), L6 = await import('../../lib/engine-reliability/library.mjs'), CAN = await import('../../lib/engine-reliability/canonical.mjs');
  const T7 = await import('./stability/transforms.mjs');
  const run = C.makeRunners(v03, cand, CLOCK);
  const ICS = J('INTENDED_CHANGE_SET.json');
  const p6dir = join(REPO, 'research/engine-reliability-phase6-2026-10-17/regression-library/scenarios');
  const p6 = Object.fromEntries(readdirSync(p6dir).map((f) => { const s = JSON.parse(readFileSync(join(p6dir, f), 'utf8')); return [s.scenario_id, s]; }));
  // Phase 7 scenarios.
  const scen = I.phase7Inputs();
  const scenarioResults = scen.map((s) => { const r = run.candidate(SS.submissionFor(s), s.candidate_response_text, s.execution_mode, s.scenario_id);
    return r.graph ? SS.evaluateP7(r.graph, s) : { scenario_id: s.scenario_id, rule_id: s.rule_id, role: s.role, result: 'unexpected', mismatches: ['candidate error: ' + r.error] }; });
  // Differential qualification.
  const existing = await I.existingInputs();
  const qExisting = existing.map((i) => { const ch = ICS.changes.find((c) => c.id === i.id);
    const spec = !ch ? { mode: 'unchanged' } : ch.base_error ? { mode: 'base_error', rules: ch.rules, check: Q.phase6Check(p6[i.id]) } : { mode: 'intended', rules: ch.rules, statuses: ch.statuses, conflicts_gained: ch.conflicts_gained };
    return Object.assign({ family: i.family }, Q.qualifyOne(i.id, run.base(i.submission, i.response, i.mode, i.id), run.candidate(i.submission, i.response, i.mode, i.id), spec)); });
  const qP7 = scen.map((s) => { const sub = SS.submissionFor(s);
    const spec = s.differential.mode === 'unchanged' ? { mode: 'unchanged' } : s.differential.mode === 'base_error' ? { mode: 'base_error', rules: s.differential.rules, check: (g) => SS.evaluateP7(g, s).result === 'as_expected' }
      : { mode: 'intended', rules: s.differential.rules, statuses: s.expected.statuses };
    return Object.assign({ family: 'phase7-scenario' }, Q.qualifyOne(s.scenario_id, run.base(sub, s.candidate_response_text, s.execution_mode, s.scenario_id), run.candidate(sub, s.candidate_response_text, s.execution_mode, s.scenario_id), spec)); });
  // Stability.
  const stab = ST.runTransforms(T7.TRANSFORMS, T7.BASES, run.candidateCompile, CLOCK);
  // Phase 6 library and transforms on the candidate (informational; Phase 6 expectations describe v0.3).
  const p6lib = Object.values(p6).sort((a, b) => (a.scenario_id < b.scenario_id ? -1 : 1)).map((s) => { const r = run.candidate(L6.submissionFor(s), s.candidate_response_text, s.execution_mode, s.scenario_id);
    return r.graph ? L6.evaluateScenario(r.graph, s) : { scenario_id: s.scenario_id, result: 'unexpected', mismatches: ['candidate error: ' + r.error] }; });
  const strip = (x) => JSON.parse(JSON.stringify(x, (k, v) => (k === 'graph_sha256' ? undefined : v)));
  return { scenarioResults, qExisting, qP7, stab, p6lib, hash: CAN.hashOf(strip({ scenarioResults, qExisting, qP7, stab: stab.results, p6lib })) };
}

const count = (rows, key) => rows.reduce((a, r) => { a[r[key]] = (a[r[key]] || 0) + 1; return a; }, {});

export function overRefusal(scenarioResults, scenarios, qP7, ICS) {
  const rules = [...new Set(scenarios.map((s) => s.rule_id))];
  return rules.map((rule) => {
    const mine = scenarios.filter((s) => s.rule_id === rule);
    const target = mine.filter((s) => s.differential.mode !== 'unchanged'), benign = mine.filter((s) => s.role === 'benign');
    const ok = (s) => scenarioResults.find((r) => r.scenario_id === s.scenario_id).result === 'as_expected';
    const unchanged = (s) => qP7.find((q) => q.id === s.scenario_id).classification === 'no_behavioral_difference';
    const existingHits = ICS.changes.filter((c) => c.rules.includes(rule)).map((c) => c.id);
    return { rule_id: rule, target_cases: target.length, target_cases_routed_as_sealed: target.filter(ok).length, benign_cases: benign.length,
      benign_cases_refused_or_degraded: benign.filter((s) => !ok(s) || !unchanged(s)).length, existing_inputs_triggered: existingHits };
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
  const trap = installNetworkTrap();
  const { verifySeal } = await import('./tooling/verify-seal.mjs');
  const sealProblems = verifySeal();
  const r = await runAll();
  const I = await import('./tooling/inputs.mjs');
  const scenarios = I.phase7Inputs();
  const ICS = J('INTENDED_CHANGE_SET.json');
  const out = {};
  out['results/SCENARIO_RESULTS.json'] = { generated_clock: CLOCK, seal_problems: sealProblems, counts: count(r.scenarioResults, 'result'), results: r.scenarioResults };
  out['results/QUALIFICATION_RESULTS.json'] = { generated_clock: CLOCK, existing_counts: count(r.qExisting, 'classification'), phase7_counts: count(r.qP7, 'classification'), existing: r.qExisting, phase7: r.qP7,
    statement: 'Frozen v0.3 against the v0.3.1 candidate on identical synthetic inputs. Local deterministic behaviour only.' };
  out['stability/STABILITY_RESULTS.json'] = Object.assign({ generated_clock: CLOCK }, r.stab);
  out['results/PHASE6_LIBRARY_ON_CANDIDATE.json'] = { note: 'Phase 6 sealed expectations describe safe behaviour; Phase 6 known open failures that the candidate now handles appear as known_open_failure_not_reproduced. Informational; Phase 6 artifacts are unchanged.',
    counts: count(r.p6lib, 'result'), results: r.p6lib };
  out['results/OVER_REFUSAL_TABLE.json'] = { statement: 'Local engineering observations on synthetic target and nearby benign cases. Not accuracy or performance measures.', rows: overRefusal(r.scenarioResults, scenarios, r.qP7, ICS) };
  const B = await import('./tooling/backlog.mjs'); const { ENTRIES } = await import('./backlog/entries.mjs');
  const bpath = join(HERE, 'backlog/REMEDIATION_BACKLOG.jsonl'); const before = existsSync(bpath) ? readFileSync(bpath, 'utf8') : '';
  let text = before; const have = new Set(B.parse(before).map((e) => e.entry_id)); for (const e of ENTRIES) if (!have.has(e.entry_id)) text = B.append(text, e);
  if (!B.appendOnly(before, text)) throw new Error('backlog append-only check failed');
  out['backlog/REMEDIATION_BACKLOG.jsonl'] = text;
  for (const [p, v] of Object.entries(out)) { mkdirSync(join(HERE, p, '..'), { recursive: true }); writeFileSync(join(HERE, p), typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); }
  console.log('seal problems ' + sealProblems.length + '; scenarios ' + JSON.stringify(out['results/SCENARIO_RESULTS.json'].counts) + '; existing ' + JSON.stringify(out['results/QUALIFICATION_RESULTS.json'].existing_counts)
    + '; phase7 ' + JSON.stringify(out['results/QUALIFICATION_RESULTS.json'].phase7_counts) + '; stability ' + r.stab.as_expected + '/' + r.stab.total + '; phase6 on candidate ' + JSON.stringify(out['results/PHASE6_LIBRARY_ON_CANDIDATE.json'].counts)
    + '; backlog ' + B.parse(text).length + '; hash ' + r.hash + '; network ' + trap.count());
  trap.restore();
}

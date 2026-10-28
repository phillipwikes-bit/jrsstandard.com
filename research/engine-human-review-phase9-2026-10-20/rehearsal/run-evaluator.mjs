#!/usr/bin/env node
// JRS PHASE 9: rehearsal evaluator.
//
//   env -u ANTHROPIC_BASE_URL node research/engine-human-review-phase9-2026-10-20/rehearsal/run-evaluator.mjs [--record]
//
// Offline: refuses provider configuration and traps every network API. Verifies the seal first and
// stops if it fails. The first run is recorded once in FIRST_EVALUATOR_RUN.json and never rewritten.
// The evaluator produces no human outcome.

import { detectProviderConfiguration, installNetworkTrap } from '../../../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();
const { readFileSync, readdirSync, writeFileSync, existsSync } = await import('node:fs');
const { join } = await import('node:path');
const { fileURLToPath } = await import('node:url');
const R = await import('../../../lib/engine-human-review-phase9/rehearsal.mjs');

const HERE = fileURLToPath(new URL('./', import.meta.url));
export const loadSet = () => ({
  cases: readdirSync(join(HERE, 'cases')).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(HERE, 'cases', f), 'utf8'))),
  expectations: JSON.parse(readFileSync(join(HERE, 'EXPECTATIONS.json'), 'utf8')).expectations,
  seal: existsSync(join(HERE, 'SEAL.json')) ? JSON.parse(readFileSync(join(HERE, 'SEAL.json'), 'utf8')) : null,
});
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { cases, expectations, seal } = loadSet();
  if (!seal) { console.error('STOP: the rehearsal set is not sealed'); process.exit(4); }
  const sp = R.verifySeal(seal, cases, expectations);
  if (sp.length) { console.error('STOP: seal verification failed\n' + sp.join('\n')); process.exit(5); }
  const out = R.evaluateAll(cases, expectations);
  const summary = { evaluated_at: new Date().toISOString(), seal_sha256: seal.seal_sha256, total: out.total, as_sealed: out.as_sealed, results_sha256: out.results_sha256, network_attempts: trap.attempts.length };
  if (process.argv.includes('--record')) {
    if (!existsSync(join(HERE, 'FIRST_EVALUATOR_RUN.json'))) writeFileSync(join(HERE, 'FIRST_EVALUATOR_RUN.json'), JSON.stringify(Object.assign({ statements: out.statements }, summary, { results: out.results }), null, 2) + '\n');
    writeFileSync(join(HERE, 'REHEARSAL_RESULTS.json'), JSON.stringify(Object.assign({ statements: out.statements }, summary, { results: out.results }), null, 2) + '\n');
  }
  for (const r of out.results) if (r.result !== 'as_sealed') console.log(r.packet_id + ' ' + JSON.stringify(Object.fromEntries(Object.entries(r.checks).filter(([, v]) => v !== 'pass'))));
  console.log(out.as_sealed + '/' + out.total + ' as sealed; network attempts ' + trap.attempts.length);
  if (trap.attempts.length) process.exit(6);
}

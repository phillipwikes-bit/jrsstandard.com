#!/usr/bin/env node
// JRS PHASE 9: replay of the human evidence adjudication layer (read-only).
//
//   env -u ANTHROPIC_BASE_URL node tools/engine-human-review-phase9-replay.mjs
//
// Verifies the rehearsal seal, re-runs the evaluator and the stability transforms, and compares the
// evaluator results with the first recorded evaluator run. Writes nothing. Offline: refuses provider
// configuration and traps every network API. Produces no human outcome.

import { detectProviderConfiguration, installNetworkTrap } from '../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();
const { readFileSync, readdirSync } = await import('node:fs');
const { join } = await import('node:path');
const { fileURLToPath } = await import('node:url');
const R = await import('../lib/engine-human-review-phase9/rehearsal.mjs');
const S = await import('../lib/engine-human-review-phase9/stability.mjs');
const T = await import('../research/engine-human-review-phase9-2026-10-20/stability/transforms.mjs');

const RES = fileURLToPath(new URL('../research/engine-human-review-phase9-2026-10-20/', import.meta.url));
const J = (p) => JSON.parse(readFileSync(join(RES, p), 'utf8'));
const cases = readdirSync(join(RES, 'rehearsal/cases')).sort().map((f) => JSON.parse(readFileSync(join(RES, 'rehearsal/cases', f), 'utf8')));
const expectations = J('rehearsal/EXPECTATIONS.json').expectations, seal = J('rehearsal/SEAL.json'), first = J('rehearsal/FIRST_EVALUATOR_RUN.json');
const sp = R.verifySeal(seal, cases, expectations);
if (sp.length) { console.error('STOP: seal verification failed\n' + sp.join('\n')); process.exit(5); }
const ev = R.evaluateAll(cases, expectations), st = S.runStability(T.TRANSFORMS, T.BASES);
const out = { statements: ev.statements, seal_sha256: seal.seal_sha256, packets: ev.total, as_sealed: ev.as_sealed, differs: ev.results.filter((r) => r.result !== 'as_sealed').map((r) => r.packet_id),
  results_identical_to_first_run: ev.results_sha256 === first.results_sha256, stability: { total: st.total, as_expected: st.as_expected, from_unfavourable_or_escalation: st.from_unfavourable_or_escalation, more_favourable: st.more_favourable },
  network_attempts: trap.attempts.length };
console.log(JSON.stringify(out, null, 2));
process.exit(out.results_identical_to_first_run && st.more_favourable === 0 && st.as_expected === st.total && !trap.attempts.length ? 0 : 1);

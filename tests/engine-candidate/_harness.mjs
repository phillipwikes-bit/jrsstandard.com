// Shared harness for the local Engine candidate tests. Mocked only.
// Importing this file traps fetch for the whole process, so any network
// attempt by the code under test fails loudly and is counted.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const fixture = (name) => readFileSync(join(ROOT, 'tests/engine-candidate/fixtures', name), 'utf8');
export const PROFILE = { record_type: 'supplier_access_exception', completion_status: 'completed', hr_related: false };
export const MODEL = 'mock-model-0';
export const NOW = () => '2026-10-06T00:00:00Z';

export const net = { calls: 0 };
globalThis.fetch = async () => { net.calls++; throw new Error('network access is prohibited in candidate tests'); };

let pass = 0, fail = 0;
export const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
export const done = () => { console.log(`\n${pass + fail} checks, ${fail} failed`); process.exit(fail ? 1 : 0); };

export const CONDITION_KEYS = ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability'];
export const cond = (status = 'review', note = 'The basis is stated only as a track record that is not in the record.') =>
  Object.fromEntries(CONDITION_KEYS.map((k) => [k, { status, note }]));
export const reply = (obj, stop_reason = 'end_turn') => async () => ({ text: JSON.stringify(obj), stop_reason });

// A model mock that records whether it was called.
export function spyModel(obj) {
  const spy = async (req) => { spy.calls.push(req); return { text: JSON.stringify(obj), stop_reason: 'end_turn' }; };
  spy.calls = [];
  return spy;
}

// Every number in a result must sit under a positional or size key. Anything
// else would be a score in disguise.
const NUMERIC_OK = new Set(['start', 'end', 'line', 'column', 'chars', 'lines']);
const FORBIDDEN_KEYS = /^(score|scores|drr|drr_score|determination|ready|verdict|overall|overall_consistency|rating|grade|percent|percentage|confidence|probability)$/i;
export function scoreAudit(obj, path = '') {
  const problems = [];
  if (Array.isArray(obj)) obj.forEach((v, i) => problems.push(...scoreAudit(v, `${path}[${i}]`)));
  else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (FORBIDDEN_KEYS.test(k)) problems.push(`forbidden key ${path}.${k}`);
      if (typeof v === 'number' && !NUMERIC_OK.has(k)) problems.push(`number at ${path}.${k}`);
      if (v === 'ready') problems.push(`"ready" value at ${path}.${k}`);
      problems.push(...scoreAudit(v, `${path}.${k}`));
    }
  }
  return problems;
}

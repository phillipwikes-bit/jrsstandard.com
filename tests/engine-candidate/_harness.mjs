// Shared harness for the local Engine candidate tests. Mocked only.
// Importing this file traps fetch for the whole process, so any network
// attempt by the code under test fails loudly and is counted.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createMockAdapter } from '../../lib/engine-candidate/mock-adapter.js';
import { explanationIdFor, ADAPTER_CONTRACT } from '../../lib/engine-candidate/adapter.js';
import { PROMPT_VERSION } from '../../lib/engine-candidate/review-candidate.js';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const fixture = (name) => readFileSync(join(ROOT, 'tests/engine-candidate/fixtures', name), 'utf8');
export const PROFILE = { record_type: 'supplier_access_exception', completion_status: 'completed', hr_related: false };
export const IDS = { model_id: 'mock-model-0', model_version: '0', prompt_version: PROMPT_VERSION };
export const NOW = () => '2026-10-06T00:00:00Z';

export const net = { calls: 0 };
globalThis.fetch = async () => { net.calls++; throw new Error('network access is prohibited in candidate tests'); };

let pass = 0, fail = 0;
export const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
export const done = () => { console.log(`\n${pass + fail} checks, ${fail} failed`); process.exit(fail ? 1 : 0); };

export const CONDITION_KEYS = ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability'];
export const cond = (status = 'review', note = 'The basis is stated only as a track record that is not in the record.') =>
  Object.fromEntries(CONDITION_KEYS.map((k) => [k, { status, note }]));

// Compact test shape -> adapter contract. flaws: [{ type, excerpt, explanation, uncertain? }].
export function toAdapterOutput(legacy, ids = IDS, completion = 'complete') {
  return {
    adapter_contract: ADAPTER_CONTRACT, ...ids, completion,
    conditions: Object.fromEntries(Object.entries(legacy.conditions).map(([k, c]) => [k,
      { status: c.status, explanation_id: explanationIdFor('condition', k), note: c.note, uncertain: !!c.uncertain }])),
    findings: (legacy.flaws || []).map((f) => ({ type: f.type, quotation: f.excerpt, explanation_id: explanationIdFor('flaw', f.type) || 'unknown',
      note: f.explanation, uncertain: !!f.uncertain })),
    revision_needed: legacy.revision_needed === undefined ? null : legacy.revision_needed,
  };
}

// A deterministic mock adapter answering with the given test-shape response. It records its calls.
export const reply = (legacy, completion) => createMockAdapter({ ...IDS, respond: () => toAdapterOutput(legacy, IDS, completion) });
// A mock adapter returning exactly the value given (string, object or nothing).
export const rawReply = (value, ids = IDS) => createMockAdapter({ ...ids, respond: () => value });
export const spyModel = reply;

// Every number in a result must sit under a positional or size key. Anything
// else would be a score in disguise.
const NUMERIC_OK = new Set(['start', 'end', 'line', 'column', 'chars', 'lines']);
const FORBIDDEN_KEYS = /^(score|scores|drr|drr_score|determination|ready|verdict|overall|overall_consistency|rating|grade|percent|percentage|confidence|probability|accuracy|reliability)$/i;
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

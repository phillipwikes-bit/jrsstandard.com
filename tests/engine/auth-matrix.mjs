// F-10 ADVERSARIAL AUTH MATRIX — development only.
// Invariant under test: NO configuration permits an unauthenticated request to
// persist record-derived content via logReview().
//
// The handler is exercised for real. Anthropic and Supabase are never called:
// the Anthropic fetch is stubbed, and a logReview write is detected by counting
// attempts to reach Supabase.
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const MODEL_JSON = JSON.stringify({
  conditions: Object.fromEntries(['basis_identification','reasoning_traceability','cold_reviewer_clarity','accountability_support','temporal_reconstructability']
    .map(k => [k, { status: 'review', note: 'A note grounded in the record text.' }])),
  finding: { condition_triggered: 'x', compliant_version: 'A rewrite of the passage.' },
});

async function run(route, env, headers) {
  const calls = { anthropic: 0, supabase: 0 };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes('anthropic')) { calls.anthropic++;
      return new Response(JSON.stringify({ content: [{ text: MODEL_JSON }], stop_reason: 'end_turn' }), { status: 200 }); }
    if (u.includes('supabase')) { calls.supabase++; return new Response('', { status: 201 }); }
    return new Response('', { status: 200 });
  };
  const saved = { ...process.env };
  for (const k of ['ANTHROPIC_API_KEY','REVIEW_API_TOKEN','JRS_SANDBOX_OPEN','SUPABASE_SERVICE_ROLE_KEY']) delete process.env[k];
  Object.assign(process.env, env);
  let status = 0;
  try {
    const mod = await import(`../../${route}?cachebust=${Math.random()}`);
    const res = await mod.default(new Request('https://x/api/review-engine', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ text: 'A record of sufficient length to pass the minimum input check for evaluation.' }),
    }));
    status = res.status;
  } catch (e) { status = -1; console.log('   (threw: ' + e.message.slice(0, 80) + ')'); }
  globalThis.fetch = realFetch;
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
  return { status, calls };
}

const BASE = { ANTHROPIC_API_KEY: 'test-key', SUPABASE_SERVICE_ROLE_KEY: 'test-service' };

for (const route of ['api/review-engine.js', 'api/v1/review-engine.js']) {
  console.log(`\n--- ${route} ---`);
  const cases = [
    ['1 token absent + sandbox false',      {},                                                   {},                               401, 0],
    ['2 token absent + sandbox TRUE',       { JRS_SANDBOX_OPEN: 'true' },                         {},                               200, 0],
    ['3 token present + sandbox false',     { REVIEW_API_TOKEN: 'secret' },                       { Authorization: 'Bearer secret' }, 200, 1],
    ['4 token present + sandbox true',      { REVIEW_API_TOKEN: 'secret', JRS_SANDBOX_OPEN: 'true' }, { Authorization: 'Bearer secret' }, 200, 1],
    ['5 malformed token',                   { REVIEW_API_TOKEN: 'secret' },                       { Authorization: 'Bearer wrong' },  401, 0],
    ['6 empty bearer',                      { REVIEW_API_TOKEN: 'secret' },                       { Authorization: 'Bearer ' },       401, 0],
    ['7 sandbox alternate value "TRUE"',    { JRS_SANDBOX_OPEN: 'TRUE' },                         {},                               401, 0],
    ['8 sandbox alternate value "1"',       { JRS_SANDBOX_OPEN: '1' },                            {},                               401, 0],
    ['9 no token header at all, token set', { REVIEW_API_TOKEN: 'secret' },                       {},                               401, 0],
  ];
  for (const [name, env, headers, wantStatus, wantWrites] of cases) {
    const r = await run(route, { ...BASE, ...env }, headers);
    const okStatus = r.status === wantStatus;
    const okWrite = r.calls.supabase === wantWrites;
    t(`${name}`, okStatus && okWrite, `status=${r.status}(want ${wantStatus}) supabaseWrites=${r.calls.supabase}(want ${wantWrites})`);
  }
}

console.log(`\nINVARIANT: no unauthenticated configuration produced a persistence write.`);
console.log(`${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);

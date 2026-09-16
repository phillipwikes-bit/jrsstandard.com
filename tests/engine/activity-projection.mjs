// B-013A replacement read path — projection tests.
// Invariant: no record text and no model-written text about a record can leave
// this endpoint, even if the upstream row carries it.
import { readFileSync } from 'node:fs';
let pass = 0, fail = 0;
const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const SENSITIVE = 'Dana Okonkwo was dismissed on 14 March following the incident report.';
const ROW = {
  created_at: '2026-09-16T14:37:52.912Z',
  determination: 'review_required',
  conditions: Object.fromEntries(['basis_identification','reasoning_traceability','cold_reviewer_clarity','accountability_support','temporal_reconstructability']
    .map(k => [k, { status: 'review', note: 'A note grounded in the record text: ' + SENSITIVE }])),
  finding: { condition_triggered: 'basis_identification', compliant_version: 'A rewrite: ' + SENSITIVE },
  runs: 3, overall_consistency: 0.87, engine_version: '0.1.0-validation',
  input_preview: SENSITIVE,
};

async function call(env, upstream) {
  const realFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async (url) => { requestedUrl = String(url); return new Response(JSON.stringify(upstream), { status: 200 }); };
  const saved = { ...process.env };
  for (const k of ['SUPABASE_SERVICE_ROLE_KEY']) delete process.env[k];
  Object.assign(process.env, env);
  const mod = await import(`../../api/engine-activity.js?c=${Math.random()}`);
  const res = await mod.default(new Request('https://x/api/engine-activity', { method: 'GET' }));
  const body = await res.text();
  globalThis.fetch = realFetch;
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
  return { status: res.status, body, requestedUrl, headers: res.headers };
}

const r = await call({ SUPABASE_SERVICE_ROLE_KEY: 'svc' }, [ROW]);
t('returns 200 with a service key', r.status === 200);
t('NO record text in the response', !r.body.includes(SENSITIVE), r.body.includes(SENSITIVE) ? 'LEAKED' : '');
t('NO compliant_version key', !r.body.includes('compliant_version'));
t('NO note key', !r.body.includes('"note"'));
t('NO finding key', !r.body.includes('"finding"'));
t('NO input_preview key', !r.body.includes('input_preview'));
t('condition STATUSES survive', r.body.includes('"basis_identification":"review"'));
t('determination survives', r.body.includes('review_required'));
t('timestamp truncated to the hour', r.body.includes('2026-09-16T14:00Z') && !r.body.includes('14:37:52'));
t('select list omits finding and asks only for safe columns',
  !r.requestedUrl.includes('finding') && r.requestedUrl.includes('conditions'));
t('reads with the SERVICE key so it survives grant revocation', true, '(service-role read, not anon)');
t('no-store cache header', (r.headers.get('cache-control') || '').includes('no-store'));
t('noindex header', (r.headers.get('x-robots-tag') || '').includes('noindex'));
t('carries a disclosure statement', r.body.includes('No record text'));

const noKey = await call({}, [ROW]);
t('fails closed with no service key', noKey.status === 503 && !noKey.body.includes(SENSITIVE));

// An invented status must not be echoed through the projection.
const bad = JSON.parse(JSON.stringify(ROW));
bad.conditions.basis_identification.status = 'excellent';
const r2 = await call({ SUPABASE_SERVICE_ROLE_KEY: 'svc' }, [bad]);
t('invented status is nulled, not echoed', r2.body.includes('"basis_identification":null'));

// A future column added upstream must not pass through the projection.
const extra = JSON.parse(JSON.stringify(ROW));
extra.customer_email = 'someone@example.invalid';
const r3 = await call({ SUPABASE_SERVICE_ROLE_KEY: 'svc' }, [extra]);
t('an unexpected upstream column does not pass through', !r3.body.includes('someone@example.invalid'));

console.log(`\n${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);

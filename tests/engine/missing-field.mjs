// Engine 0.3.0 `missing` list and `anchor_profile` — development only.
// The handler is exercised for real; Anthropic is stubbed and Supabase is never configured.
// Invariants: missing holds only listed keys, in list order, without repeats; an absent or malformed
// list yields []; missing never changes a condition or the determination; anchor_profile is
// deterministic and present on every successful response, in both routes.
import { readFileSync } from 'node:fs';
let pass = 0, fail = 0;
// Minimal structural validator for the parts of an OpenAPI document this test relies on: type, const, enum,
// required, properties, additionalProperties:false, items, $ref. No dependency is installed for it.
// The response is checked against the PROPOSED 0.3.0 contract. openapi.json itself is frozen under B-016
// (.jrs/registries/RELEASE_REGISTER.json) and still describes 0.1.0; it is changed only on the owner's
// authorization, together with any release of 0.3.0 (blocker B-024).
const SPEC = JSON.parse(readFileSync(new URL('../../research/engine-v0.3/openapi.proposed-0.3.0.json', import.meta.url), 'utf8'));
function conforms(v, s, path = '$', errs = []) {
  if (s.$ref) s = s.$ref.split('/').slice(1).reduce((o, k) => o[k], SPEC);
  const ty = Array.isArray(v) ? 'array' : v === null ? 'null' : Number.isInteger(v) ? 'integer' : typeof v;
  if (s.type && !(s.type === ty || (s.type === 'number' && ty === 'integer'))) errs.push(`${path}: type ${ty} not ${s.type}`);
  if ('const' in s && v !== s.const) errs.push(`${path}: ${v} is not const ${s.const}`);
  if (s.enum && !s.enum.includes(v)) errs.push(`${path}: ${v} not in enum`);
  if (ty === 'object' && v) {
    for (const k of s.required || []) if (!(k in v)) errs.push(`${path}.${k}: required`);
    for (const [k, val] of Object.entries(v)) {
      if (s.properties && s.properties[k]) conforms(val, s.properties[k], `${path}.${k}`, errs);
      else if (s.additionalProperties === false) errs.push(`${path}.${k}: not allowed`);
      else if (s.additionalProperties && typeof s.additionalProperties === 'object') conforms(val, s.additionalProperties, `${path}.${k}`, errs);
    }
  }
  if (ty === 'array' && s.items) v.forEach((x, i) => conforms(x, s.items, `${path}[${i}]`, errs));
  return errs;
}
const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
const KEYS = ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability'];
const RECORD = 'On March 3, 2018, S1 stated that Complainant was late (ROI at 125; 130). RMO2 averred that "the decision was made in April" and CW1 testified that she was never told.';

function modelJson(status, missing) {
  const o = { conditions: Object.fromEntries(KEYS.map(k => [k, { status, note: 'n' }])), remediation_note: 'r', finding: { ai_function: 'summarization', condition_triggered: 'x', compliant_version: 'y' } };
  if (missing !== undefined) o.missing = missing;
  return JSON.stringify(o);
}

async function call(route, missing, status = 'pass', runs = 1) {
  globalThis.fetch = async (url) => String(url).includes('anthropic')
    ? new Response(JSON.stringify({ content: [{ text: modelJson(status, missing) }] }), { status: 200 })
    : new Response('', { status: 500 });
  for (const k of ['REVIEW_API_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY']) delete process.env[k];
  Object.assign(process.env, { ANTHROPIC_API_KEY: 'test-not-a-key', JRS_SANDBOX_OPEN: 'true' });
  const mod = await import(`../../${route}?cachebust=${Math.random()}`);
  const res = await mod.default(new Request('https://x/api/review-engine', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.' + Math.floor(Math.random() * 250) },
    body: JSON.stringify({ text: RECORD, runs }),
  }));
  return { status: res.status, body: await res.json() };
}

for (const route of ['api/review-engine.js', 'api/v1/review-engine.js']) {
  let r = await call(route, ['attributions', 'record_citations', 'dates', 'nonsense', 'dates']);
  t(`${route}: 200`, r.status === 200, String(r.status));
  t(`${route}: engine_version is 0.3.0-validation`, r.body.engine_version === '0.3.0-validation');
  t(`${route}: missing keeps listed keys in list order, drops unknown and repeats`,
    JSON.stringify(r.body.result.missing) === JSON.stringify(['dates', 'record_citations', 'attributions']), JSON.stringify(r.body.result.missing));
  t(`${route}: missing does not change the determination`, r.body.result.determination === 'ready');
  const errs = conforms(r.body, SPEC.components.schemas.ReviewResponse);
  t(`${route}: response conforms to the proposed 0.3.0 contract`, errs.length === 0, errs.slice(0, 3).join('; '));
  const p = r.body.anchor_profile || {};
  t(`${route}: anchor_profile counts are deterministic`, p.dates === 1 && p.record_citations === 2 && p.attributed_speakers === 3 && p.quotations === 1, JSON.stringify(p));
  r = await call(route, undefined, 'gap');
  t(`${route}: absent missing list yields []`, Array.isArray(r.body.result.missing) && r.body.result.missing.length === 0);
  t(`${route}: determination still follows conditions`, r.body.result.determination === 'gap_identified');
  r = await call(route, 'dates');
  t(`${route}: a non-array missing yields []`, r.status === 200 && r.body.result.missing.length === 0);
  r = await call(route, ['criteria'], 'review', 3);
  t(`${route}: variance runs_detail carries missing`, r.body.variance && r.body.variance.runs_detail.every(d => JSON.stringify(d.missing) === '["criteria"]'));
  const errs3 = conforms(r.body, SPEC.components.schemas.ReviewResponse);
  t(`${route}: a runs=3 response conforms to the proposed 0.3.0 contract`, errs3.length === 0, errs3.slice(0, 3).join('; '));
}
console.log(`\n${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);

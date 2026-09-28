// Synthetic provider response, real v1 handler, actual adapter and offline
// validator. No remote call, customer record, production key or database write.
import handler from '../../api/v1/review-engine.js';
import legacyHandler from '../../api/review-engine.js';
import { manifestFromEngineResponse } from '../../api/_manifest/from-engine.js';
import { validateManifest } from '../../tools/validate-manifest.js';
import { readFileSync } from 'node:fs';

const schema = JSON.parse(readFileSync(new URL('../../schemas/jrs-decision-reconstruction-manifest.schema.json', import.meta.url)));
const keys = ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability'];
const modelResult = {
  conditions: Object.fromEntries(keys.map((key) => [key, { status: 'review', note: 'The synthetic record does not identify a source for the stated conclusion.' }])),
  remediation_note: 'Identify the source for the conclusion.',
  finding: { ai_function: 'analysis', condition_triggered: 'basis_identification', compliant_version: 'Record the source before finalization.' },
};
const record = 'Synthetic evaluation record: A reviewer noted a proposed finding on 4 March but did not identify which document supported it.';
let modelCalls = 0, databaseCalls = 0;
const originalFetch = globalThis.fetch;
const saved = { ...process.env };
const pass = [];
function assert(name, condition) { pass.push(name); if (!condition) throw new Error('FAIL ' + name); }
try {
  process.env.ANTHROPIC_API_KEY = 'local-test-placeholder';
  process.env.REVIEW_API_TOKEN = 'local-test-token';
  process.env.JRS_SANDBOX_OPEN = 'false';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  globalThis.fetch = async (url) => {
    if (String(url).includes('api.anthropic.com')) {
      modelCalls++;
      return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(modelResult) }] }), { status: 200 });
    }
    databaseCalls++;
    throw new Error('Unexpected outbound request');
  };
  const res = await handler(new Request('https://local.invalid/api/v1/review-engine', {
    method: 'POST', headers: { Authorization: 'Bearer local-test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: record, include_manifest: true }),
  }));
  assert('handler succeeded', res.status === 200);
  const response = await res.json();
  assert('API emits manifest on explicit authorized request', !!response.manifest);
  assert('API request correlation', res.headers.get('X-Request-Id') === response.request_id);
  assert('API manifest schema and integrity', validateManifest(response.manifest, schema).valid);
  assert('API preserves Engine conditions', keys.every((key) => response.manifest.conditions[key].status === response.result.conditions[key].status));
  assert('API manifest omits raw record', !JSON.stringify(response.manifest).includes(record));
  const linked = await manifestFromEngineResponse(response, record, { context: { identifier: 'synthetic-001' } });
  assert('request correlation', linked.request_id === response.request_id);
  assert('schema and integrity', validateManifest(linked.manifest, schema).valid);
  assert('no invented Codebook mapping', linked.manifest.condition_vocabulary === 'review_engine_keys');
  assert('all conditions unchanged', keys.every((key) => linked.manifest.conditions[key].status === response.result.conditions[key].status));
  assert('human review mandatory', linked.manifest.human_review.required === true);
  assert('raw record excluded', !JSON.stringify(linked).includes(record));
  assert('only mocked model invoked', modelCalls === 1 && databaseCalls === 0);
  const defaultRes = await handler(new Request('https://local.invalid/api/v1/review-engine', {
    method: 'POST', headers: { Authorization: 'Bearer local-test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: record }),
  }));
  assert('existing API default response unchanged', defaultRes.status === 200 && !(await defaultRes.json()).manifest);
  const legacyRes = await legacyHandler(new Request('https://local.invalid/api/review-engine', {
    method: 'POST', headers: { Authorization: 'Bearer local-test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: record, include_manifest: true }),
  }));
  assert('legacy route mirrors the explicit option', legacyRes.status === 200 && validateManifest((await legacyRes.json()).manifest, schema).valid);
  const altered = structuredClone(linked.manifest); altered.routing.value = 'ready';
  assert('tampered result rejected', !validateManifest(altered, schema).valid);
  const tooLong = record + 'x'.repeat(8100);
  const longResult = await manifestFromEngineResponse(response, tooLong);
  assert('truncation and full-source hash recorded', longResult.manifest.input.truncated && !!longResult.manifest.input.source_hash && longResult.manifest.warnings[0].code === 'input_truncated');
  assert('long manifest valid', validateManifest(longResult.manifest, schema).valid);
  const longResponse = await handler(new Request('https://local.invalid/api/v1/review-engine', {
    method: 'POST', headers: { Authorization: 'Bearer local-test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: tooLong, include_manifest: true }),
  }));
  const longBody = await longResponse.json();
  assert('live handler records actual truncation', longBody.manifest.input.truncated && longBody.manifest.input.source_hash && validateManifest(longBody.manifest, schema).valid);
  delete process.env.REVIEW_API_TOKEN;
  process.env.JRS_SANDBOX_OPEN = 'true';
  const denied = await handler(new Request('https://local.invalid/api/v1/review-engine', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: record, include_manifest: true }),
  }));
  assert('open sandbox cannot request manifest', denied.status === 401);
  process.env.REVIEW_API_TOKEN = 'local-test-token';
  process.env.JRS_SANDBOX_OPEN = 'false';
  modelResult.conditions.basis_identification.status = 'excellent';
  const malformed = await handler(new Request('https://local.invalid/api/v1/review-engine', {
    method: 'POST', headers: { Authorization: 'Bearer local-test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: record, include_manifest: true }),
  }));
  assert('malformed provider result fails closed', malformed.status === 502 && !(await malformed.json()).manifest);
  modelResult.conditions.basis_identification.status = 'review';
  const bad = structuredClone(response); bad.result.conditions.basis_identification.status = 'excellent';
  await assertRejects('invalid status rejected', bad, record);
  const missing = structuredClone(response); delete missing.result.conditions.temporal_reconstructability;
  await assertRejects('missing condition rejected', missing, record);
  const conflict = structuredClone(response); conflict.result.determination = 'ready';
  await assertRejects('conflicting route rejected', conflict, record);
  await assertRejects('unapproved Codebook relabel rejected', response, record, { conditionVocabulary: 'jrs_codebook_1.0' });
  console.log(`${pass.length} engine-to-Manifest checks passed; model and storage were mocked. Deployed API, accuracy and operational validation remain untested.`);
} finally {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
  Object.assign(process.env, saved);
}

async function assertRejects(name, response, text, options) {
  let rejected = false;
  try { await manifestFromEngineResponse(response, text, options); }
  catch { rejected = true; }
  assert(name, rejected);
}

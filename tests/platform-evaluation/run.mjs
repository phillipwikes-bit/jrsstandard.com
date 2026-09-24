// JRS PLATFORM INTEGRATION EVALUATION 001
// Constructed workflow and synthetic record only. No network call and no customer data.
import { buildManifest, ENGINE_CONDITION_KEYS } from '../../lib/manifest/build.js';
import { validateManifest } from '../../tools/validate-manifest.js';
import { readFileSync } from 'node:fs';

const schema = JSON.parse(readFileSync(
  new URL('../../schemas/jrs-decision-reconstruction-manifest.schema.json', import.meta.url),
  'utf8'
));

const record = [
  'Constructed case PE-001. On 4 March the report was submitted after the 17:00 deadline.',
  'The shared-drive timestamp is identified as the source. On 6 March the manager documented',
  'a review meeting. The record proposes secondary review before finalization.'
].join(' ');

const response = {
  request_id: 'pe001-0000-4000-8000-000000000001',
  api_version: 'v1',
  engine: 'JRS Review Engine',
  engine_version: '0.1.0-validation',
  model: 'constructed-evaluation-model',
  evidence_stage: 'operational_validation',
  runs: 1,
  result: {
    determination: 'review_required',
    conditions: Object.fromEntries(ENGINE_CONDITION_KEYS.map((key, index) => [key, {
      status: index === 4 ? 'pass' : 'review',
      note: index === 4
        ? 'The dated sequence can be followed from the constructed record.'
        : 'The constructed record requires a more specific source or reasoning connection.'
    }]))
  }
};

let passed = 0;
let failed = 0;
const checks = [];
function check(name, ok, evidence) {
  checks.push({ name, result: ok ? 'pass' : 'fail', evidence });
  ok ? passed++ : failed++;
}

const manifest = await buildManifest({
  engineResult: response,
  sourceText: record,
  jrsVersion: '1.0',
  codebookVersion: '1.0',
  engine: {
    name: response.engine,
    version: response.engine_version,
    model: response.model,
    api_version: response.api_version
  },
  context: {
    identifier: 'constructed-platform-record-PE-001',
    decision_type: 'constructed documentation review',
    evaluated_by: 'JRS Platform Evaluation 001 harness'
  },
  manifestId: '00000000-0000-4000-8000-000000000001',
  createdAt: '2026-09-22T18:00:00.000Z'
});

const validation = validateManifest(manifest, schema);
const platformEntry = {
  platform_record_id: 'constructed-platform-record-PE-001',
  api_request_id: response.request_id,
  review_route: 'human_secondary_review',
  manifest
};
const stored = JSON.stringify(platformEntry);

check('Schema conformance', validation.valid, validation.valid ? 'Manifest v1.0 accepted' : validation.errors.join('; '));
check('Five-condition preservation', Object.keys(manifest.conditions).length === 5, `${Object.keys(manifest.conditions).length} conditions stored`);
check('Request correlation', platformEntry.api_request_id === response.request_id, response.request_id);
check('Input correspondence', /^sha256:[a-f0-9]{64}$/.test(manifest.input.hash), manifest.input.hash);
check('Version pinning', manifest.jrs_version === '1.0' && manifest.codebook_version === '1.0' && manifest.engine.version === '0.1.0-validation', 'JRS 1.0; Codebook 1.0; engine 0.1.0-validation');
check('Vocabulary declaration', manifest.condition_vocabulary === 'review_engine_keys' && manifest.routing.vocabulary === 'engine_determination', 'No silent Codebook or routing translation');
check('Human-review preservation', manifest.human_review.required === true && platformEntry.review_route === 'human_secondary_review', 'Human secondary review retained');
check('Content classification', manifest.content_class === 'derived_record_content', manifest.content_class);
check('Raw-record exclusion', !stored.includes(record), 'Platform evidence entry contains the hash and derived notes, not the raw record');
check('Integrity self-check', validation.integrity.startsWith('SELF-CONSISTENT'), validation.integrity);

const tampered = structuredClone(manifest);
tampered.routing.value = 'ready';
const tamperResult = validateManifest(tampered, schema);
check('Tamper detection', !tamperResult.valid && tamperResult.errors.some((e) => e.includes('manifest_hash')), 'Changed routing value produced a hash mismatch');

let mappingRefused = false;
try {
  await buildManifest({
    engineResult: response,
    sourceText: record,
    jrsVersion: '1.0',
    codebookVersion: '1.0',
    engine: { name: response.engine, version: response.engine_version, model: response.model, api_version: response.api_version },
    conditionVocabulary: 'jrs_codebook_1.0'
  });
} catch (error) {
  mappingRefused = /owner-declared mapping/.test(String(error.message));
}
check('Unsupported mapping refusal', mappingRefused, 'Generator refused unestablished Codebook relabeling');

const result = {
  evaluation_id: 'JRS-PE-001',
  evaluation_type: 'internal constructed platform-integration evaluation',
  executed_at: '2026-09-22T18:00:00.000Z',
  data_class: 'synthetic constructed record only',
  network_calls: 0,
  customer_or_third_party: false,
  summary: { checks: checks.length, passed, failed },
  checks,
  conclusions: {
    established: [
      'A documented adapter path can convert a constructed current-state engine response into a conforming Manifest.',
      'The resulting artifact can be stored beside a platform audit entry with request correlation and without embedding the raw record.',
      'The offline validator detects controlled tampering and the generator refuses unsupported vocabulary conversion.',
      'The documented test can be executed from the repository without oral founder instruction.'
    ],
    not_established: [
      'Live API availability, latency, production scale, security certification, customer deployment, or third-party integration.',
      'Accuracy, reliability, organizational effectiveness, legal sufficiency, compliance, or market adoption.',
      'Automatic Manifest delivery by the current public API.',
      'Conveyability of every potential JRS asset or commercial right.'
    ]
  }
};

console.log(JSON.stringify(result, null, 2));
if (failed) process.exit(1);

#!/usr/bin/env node
// Controlled synthetic live evaluation. Explicitly requires a credential.
// Writes derived record content locally with owner-only permissions. This is
// not a production deployment or a validation of Engine accuracy.
import { readFile, mkdir, open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateManifest } from './validate-manifest.js';
import { hashInput } from '../lib/manifest/hash.js';

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? null : args[index + 1]; };
const recordPath = value('--record');
const outputDir = value('--out');
const endpoint = value('--endpoint') || 'https://www.jrsstandard.com/api/v1/review-engine';
if (!recordPath || !outputDir || args.includes('--help')) {
  console.error('Usage: REVIEW_API_TOKEN=... node tools/run-live-manifest-evaluation.mjs --record synthetic.txt --out .local-evaluations/run-001');
  process.exit(2);
}
const target = new URL(endpoint);
if (target.protocol !== 'https:' || target.host !== 'www.jrsstandard.com' || target.pathname !== '/api/v1/review-engine') {
  throw new Error('Only the designated HTTPS v1 Engine endpoint is permitted');
}
if (!process.env.REVIEW_API_TOKEN) throw new Error('REVIEW_API_TOKEN is required; no anonymous evaluations');
const record = await readFile(resolve(recordPath), 'utf8');
if (!record.includes('SYNTHETIC') || record.trim().length < 40) {
  throw new Error('Only an explicitly marked synthetic record of at least 40 characters is permitted');
}
const schema = JSON.parse(await readFile(new URL('../schemas/jrs-decision-reconstruction-manifest.schema.json', import.meta.url), 'utf8'));
const response = await fetch(target, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.REVIEW_API_TOKEN}` },
  body: JSON.stringify({ text: record, runs: 1, include_manifest: true }),
  signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`Engine HTTP ${response.status}; no artifact saved`);
const engineResult = await response.json();
if (response.headers.get('x-request-id') !== engineResult.request_id || !engineResult.manifest) {
  throw new Error('Request ID in header and body differ');
}
const manifest = engineResult.manifest;
const validation = validateManifest(manifest, schema);
if (!validation.valid) throw new Error('Manifest validation failed: ' + validation.errors.join('; '));
if (manifest.input.truncated && !manifest.input.source_hash) throw new Error('Truncated input lacks source hash');
const expectedInput = await hashInput(record.trim());
if (JSON.stringify(manifest.input) !== JSON.stringify(expectedInput)) {
  throw new Error('Returned Manifest does not correspond to submitted text');
}
if (Object.keys(engineResult.result?.conditions || {}).some((key) =>
  manifest.conditions[key]?.status !== engineResult.result.conditions[key].status)
  || manifest.routing.value !== engineResult.result?.determination) {
  throw new Error('Manifest conflicts with returned Engine result');
}
const folder = resolve(outputDir);
await mkdir(folder, { recursive: true, mode: 0o700 });
const evidence = {
  evaluation_type: 'single authorized live synthetic Engine-to-Manifest run',
  observed_at: new Date().toISOString(),
  endpoint: target.origin + target.pathname,
  request_id: engineResult.request_id,
  manifest_hash: manifest.integrity.manifest_hash,
  input_hash: manifest.input.hash,
  schema_valid: true,
  integrity: validation.integrity,
  limitations: ['One run only.', 'No independent accuracy key.', 'No customer environment or workflow.', 'Hash self-consistency is not authentication.'],
};
async function save(name, object) {
  const file = await open(resolve(folder, name), 'wx', 0o600);
  try { await file.writeFile(JSON.stringify(object, null, 2) + '\n'); }
  finally { await file.close(); }
}
const { manifest: omitted, ...responseWithoutManifest } = engineResult;
await save('engine-response.json', responseWithoutManifest);
await save('manifest.json', manifest);
await save('evidence.json', evidence);
console.log(JSON.stringify({ output: folder, request_id: engineResult.request_id, schema_valid: true,
  integrity: validation.integrity, limitations: evidence.limitations }, null, 2));

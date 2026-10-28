// Mutation check for the live-transport boundary: each mutation removes one refusal
// control in a temporary copy and reruns the boundary tests. A mutation no test
// detects would mean the boundary can be bypassed. Real files are never modified.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HARNESS = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2];
const B = 'src/live-boundary.mjs';
const M = [
  ['B01', 'Gate 1 check removed', B, "if (!gate1 || gate1.status !== 'CLEARED' || gate1.observed_sha256 !== gate1.expected_sha256)", 'if (false)', ['LT-01']],
  ['B02', 'Dispatch lock released', B, 'export const LIVE_DISPATCH_ENABLED = false;', 'export const LIVE_DISPATCH_ENABLED = true;', ['LT-13']],
  ['B03', 'Model check removed', B, 'if (requested.model_identifier !== authorization.model_identifier)', 'if (false)', ['LT-05']],
  ['B04', 'Provider check removed', B, 'if (requested.provider_name !== authorization.provider_name)', 'if (false)', ['LT-04']],
  ['B05', 'Credential sentinel check removed', B, "for (const s of sentinels) if (text.includes(s)) throw new BoundaryRefusal('credential_value_in_output');", '', ['LT-12']],
  ['B06', 'Offline-mode check removed', B, "if (mode !== 'live_authorized')", 'if (false)', ['LT-11']],
  ['B07', 'Request cap check removed', B, "if (!(Number.isInteger(authorization.maximum_requests) && authorization.maximum_requests >= 1 && authorization.maximum_requests <= MAX_REQUESTS_CAP))", 'if (false)', ['LT-06']],
  ['B08', 'Duplicate record check removed', B, 'if (seenRecordIds && seenRecordIds.has(requested.synthetic_record_id))', 'if (false)', ['LT-10']],
  ['B09', 'Expiry check removed', B, 'if (!Number.isFinite(exp) || Date.parse(nowUtc) >= exp)', 'if (false)', ['LT-03']],
  ['B10', 'Brand check removed from adapter', 'src/adapter.mjs', "if (transport.kind === 'live_provider' && !isBoundaryTransport(transport))", 'if (false)', ['LT-15']],
  ['B11', 'Synthetic classification check removed', B, "if (requested.material_classification !== 'synthetic_development_material')", 'if (false)', ['LT-09']],
  ['B12', 'Required-field check removed', B, "if (v === undefined || v === null || v === '' || v === false) refusals.push('authorization_field_absent:' + f);", '', ['LT-07', 'LT-08']],
  ['B13', 'Mock response labeled as live', 'src/adapter.mjs', "mock: Object.freeze({ response_origin: 'mock_transport_fixture'", "mock: Object.freeze({ response_origin: 'live_provider_captured'", ['LT-14']],
];
const results = [];
for (const [id, desc, file, from, to, expect] of M) {
  const tmp = mkdtempSync(join(HARNESS, '..', '..', 'mut-'));
  const h = join(tmp, 'a', 'harness');
  cpSync(join(HARNESS, 'src'), join(h, 'src'), { recursive: true });
  cpSync(join(HARNESS, 'fixtures'), join(h, 'fixtures'), { recursive: true });
  const p = join(h, file);
  const t = readFileSync(p, 'utf8');
  const applied = t.includes(from);
  writeFileSync(p, t.split(from).join(to));
  let failed = [];
  try {
    execFileSync(process.execPath, [join(h, 'src', 'run-live-boundary-tests.mjs'), join(tmp, 'r.json')], { stdio: 'pipe', env: {} });
    failed = JSON.parse(readFileSync(join(tmp, 'r.json'), 'utf8')).tests.filter((x) => x.result !== 'pass').map((x) => x.id);
  } catch (e) { failed = ['RUN_ERROR:' + String(e.message).slice(0, 120)]; }
  results.push({ id, description: desc, applied, expected_failures: expect, observed_failures: failed, detected: applied && expect.every((x) => failed.includes(x)) });
  rmSync(tmp, { recursive: true, force: true });
  if (existsSync(tmp)) throw new Error('mutation_tmp_not_deleted');
}
writeFileSync(OUT, JSON.stringify({ mutations: results, all_detected: results.every((r) => r.detected) }, null, 2));
for (const r of results) console.log(r.id, r.detected ? 'detected' : 'NOT DETECTED', JSON.stringify(r.observed_failures));

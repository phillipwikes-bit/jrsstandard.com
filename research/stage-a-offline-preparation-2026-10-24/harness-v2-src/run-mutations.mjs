// Mutation check: proves the 21 tests can fail. Each mutation disables one
// control (or weakens one fixture) in a temporary copy of the harness, reruns the
// suite, and records which tests failed. A mutation that no test detects is a
// gap in the suite. The real harness files are never modified.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HARNESS = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2];
const M = [
  ['M01', 'Remove V9 quotation-state rule', 'src/adapter.mjs', "if (o.quote === null && o.proposed_status !== 'not_assessed')", 'if (false)', ['T12', 'T13', 'T14']],
  ['M02', 'Remove A-DUP request_id check', 'src/adapter.mjs', "if (seenRequestIds.has(request_id)) return { reject: 'duplicate_request_id' };", '', ['T17']],
  ['M03', 'Remove V5 size limit', 'src/adapter.mjs', "if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES)", 'if (false)', ['T09']],
  ['M04', 'Remove V6 empty-body check', 'src/adapter.mjs', "if (text.trim() === '')", 'if (false)', ['T02', 'T03']],
  ['M05', 'Remove V3 length stop check', 'src/adapter.mjs', "if (env.stop_reason === 'max_tokens')", 'if (false)', ['T05']],
  ['M06', 'Pair check skips graph hash', 'src/adapter.mjs', "if (sha256(graphText) !== rec.graph_sha256)", 'if (false)', ['T20']],
  ['M07', 'Pair check skips binding digest', 'src/adapter.mjs', "if (rebuilt !== rec.binding_digest)", 'if (false)', ['T21']],
  ['M08', 'Timeout treated as provider error', 'src/adapter.mjs', "e.code === 'transport_timeout' ? 'transport_timeout' : 'provider_error'", "'provider_error'", ['T18']],
  ['M09', 'Fixture weakened: exact quotation restored in FX-10', 'fixtures/mock-responses.json', 'found that the index lists invoice numbers only.', 'found that the index lists invoice numbers and filing dates only.', ['T10']],
  ['M10', 'Mock transport attempts a network call', 'src/transport.mjs', "calls.push({ request_id: request.request_id });", "calls.push({ request_id: request.request_id }); try { fetch('mutation-probe'); } catch {}", ['ALL']],
];
const results = [];
for (const [id, desc, file, from, to, expect] of M) {
  const tmp = mkdtempSync(join(HARNESS, '..', '..', 'mut-'));
  const h = join(tmp, 'a', 'harness');             // same depth as the real harness, so its isolated copy stays inside tmp
  cpSync(join(HARNESS, 'src'), join(h, 'src'), { recursive: true });
  cpSync(join(HARNESS, 'fixtures'), join(h, 'fixtures'), { recursive: true });
  const p = join(h, file);
  const t = readFileSync(p, 'utf8');
  const applied = t.includes(from);
  writeFileSync(p, t.split(from).join(to));
  let failed = [];
  try {
    execFileSync(process.execPath, [join(h, 'src', 'run-tests.mjs'), join(tmp, 'r.json')], { stdio: 'pipe', env: {} });
    const r = JSON.parse(readFileSync(join(tmp, 'r.json'), 'utf8'));
    failed = r.tests.filter((x) => x.result !== 'pass').map((x) => x.id);
  } catch (e) { failed = ['RUN_ERROR:' + String(e.message).slice(0, 120)]; }
  const detected = expect[0] === 'ALL' ? failed.length === 21 : expect.every((x) => failed.includes(x));
  results.push({ id, description: desc, applied, expected_failures: expect, observed_failures: failed, detected: applied && detected });
  rmSync(tmp, { recursive: true, force: true });
  if (existsSync(tmp)) throw new Error('mutation_tmp_not_deleted');
}
writeFileSync(OUT, JSON.stringify({ mutations: results, all_detected: results.every((r) => r.detected) }, null, 2));
for (const r of results) console.log(r.id, r.detected ? 'detected' : 'NOT DETECTED', JSON.stringify(r.observed_failures));

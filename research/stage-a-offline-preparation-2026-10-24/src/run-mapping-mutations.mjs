// Mutation check for the Stage A mapping suite: each mutation disables one control in a
// temporary copy of the package and reruns the suite. Real files are never modified.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2];
const MAP = 'src/anthropic-mapping.mjs';
const AD = 'harness-v2-src/adapter.mjs';
const M = [
  ['MM01', 'Model-match check disabled', MAP, "if (b.model !== expectedModel) throw new MappingRejection('model_identifier_mismatch');", '', ['MT-09']],
  ['MM02', 'Duplicate provider-request check disabled', MAP, "if (seenProviderRequestIds.has(id)) throw new MappingRejection('duplicate_provider_request_id');", '', ['MT-11']],
  ['MM03', 'Duplicate request_id check disabled (adapter A-DUP)', AD, "if (seenRequestIds.has(request_id)) return { reject: 'duplicate_request_id' };", '', ['MT-12']],
  ['MM04', 'Null-quotation control disabled (adapter V9)', AD, "if (o.quote === null && o.proposed_status !== 'not_assessed')", 'if (false)', ['MT-23', 'MT-24', 'MT-25']],
  ['MM05', 'Pair verification: graph hash check disabled', AD, 'if (sha256(graphText) !== rec.graph_sha256)', 'if (false)', ['MT-29']],
  ['MM06', 'Pair verification: response hash check disabled', AD, 'if (sha256(responseText) !== rec.captured_response_sha256)', 'if (false)', ['MT-30']],
  ['MM07', 'Pair verification: model check disabled', AD, 'if (envelope.model !== rec.model_identifier)', 'if (false)', ['MT-31']],
  ['MM08', 'Pair verification: request identifier check disabled', AD, 'if (stem(rec.graph_file) !== rec.request_id || stem(rec.captured_response_file) !== rec.request_id)', 'if (false)', ['MT-32']],
  ['MM09', 'Missing provider request identifier allowed', MAP, "if (typeof id !== 'string' || !id.trim()) throw new MappingRejection('provider_request_id_missing');", '', ['MT-10']],
  ['MM10', 'Multiple text blocks allowed', MAP, "if (b.content.length > 1) throw new MappingRejection('multiple_text_blocks');", '', ['MT-05']],
  ['MM11', 'Unsupported block types allowed', MAP, "if (unsupported) throw new MappingRejection('unsupported_content_block_type');", '', ['MT-07']],
  ['MM12', 'Missing body allowed', MAP, "if (!captured || typeof captured !== 'object' || captured.body === undefined || captured.body === null) throw new MappingRejection('missing_response_body');", '', ['MT-03']],
];
const results = [];
for (const [id, desc, file, from, to, expect] of M) {
  const tmp = mkdtempSync(join(PKG, '..', 'mut-'));
  const h = join(tmp, 'a');
  for (const p of ['src', 'harness-v2-src', 'harness-v2-fixtures']) cpSync(join(PKG, p), join(h, p), { recursive: true });
  const p = join(h, file);
  const t = readFileSync(p, 'utf8');
  const applied = t.includes(from);
  writeFileSync(p, t.split(from).join(to));
  let failed = [];
  try {
    execFileSync(process.execPath, [join(h, 'src', 'run-mapping-tests.mjs'), join(tmp, 'r.json')], { stdio: 'pipe', env: {} });
    failed = JSON.parse(readFileSync(join(tmp, 'r.json'), 'utf8')).tests.filter((x) => x.result !== 'pass').map((x) => x.id);
  } catch (e) { failed = ['RUN_ERROR:' + String(e.message).slice(0, 160)]; }
  results.push({ id, description: desc, applied, expected_failures: expect, observed_failures: failed, detected: applied && expect.every((x) => failed.includes(x)) });
  rmSync(tmp, { recursive: true, force: true });
  if (existsSync(tmp)) throw new Error('mutation_tmp_not_deleted');
}
writeFileSync(OUT, JSON.stringify({ mutations: results, all_detected: results.every((r) => r.detected) }, null, 2));
for (const r of results) console.log(r.id, r.detected ? 'detected' : 'NOT DETECTED', r.applied ? '' : '(NOT APPLIED)', JSON.stringify(r.observed_failures));

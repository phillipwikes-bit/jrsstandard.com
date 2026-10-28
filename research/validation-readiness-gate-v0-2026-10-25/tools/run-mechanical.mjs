// Runs the mechanical evaluation twice from clean output directories (separate processes)
// and compares the runs under the pre-specified determinism criterion.
// Usage: node tools/run-mechanical.mjs <scratch-parent>
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { canonical } from './controls.mjs';
const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRATCH = process.argv[2];
const sha = (b) => createHash('sha256').update(b).digest('hex');
const runs = [];
for (const label of ['run-1', 'run-2']) {
  const env = Object.assign({}, process.env); delete env.ANTHROPIC_BASE_URL;
  const p = spawnSync(process.execPath, [join(PKG, 'tools', 'evaluate.mjs'), label, SCRATCH], { env, encoding: 'utf8' });
  console.log(label, 'exit', p.status, (p.stdout || '').trim(), (p.stderr || '').trim().slice(0, 400));
  if (p.status !== 0) process.exit(p.status || 1);
  runs.push(JSON.parse(readFileSync(join(PKG, 'out', label, 'RESULTS.json'), 'utf8')));
}
const [a, b] = runs;
const byId = (r) => Object.fromEntries(r.results.map((x) => [x.case_id, x]));
const A = byId(a), B = byId(b);
const cases = [];
for (const id of Object.keys(A).sort()) {
  const x = A[id], y = B[id];
  const rawGraph = (run, rid) => { const p = join(PKG, 'out', run, rid, 'REQ-' + rid + '.graph.json'); return existsSync(p) ? sha(readFileSync(p)) : null; };
  const g1 = rawGraph('run-1', id), g2 = rawGraph('run-2', id);
  const differences = [];
  if (!y) differences.push('missing_in_run_2');
  else {
    if (canonical(x.adapter) !== canonical(y.adapter)) differences.push('adapter_outcome');
    if (x.graph_digest !== y.graph_digest) differences.push('normalized_graph_digest');
    if (canonical(x.observed) !== canonical(y.observed)) differences.push('observed_behaviour');
    if (x.case_digest !== y.case_digest) differences.push('case_digest');
  }
  cases.push({ case_id: id, identical_under_criterion: differences.length === 0, differences, case_digest_run_1: x.case_digest, case_digest_run_2: y && y.case_digest,
    normalized_graph_digest: x.graph_digest, raw_graph_sha256_run_1: g1, raw_graph_sha256_run_2: g2, raw_graph_bytes_identical: g1 !== null && g1 === g2 });
}
const out = { comparison_format: 'jrs-v0-determinism/1.0.0', criterion: 'EVALUATION_METHOD_PRESPECIFIED.md section 3',
  run_1: { started_at_utc: a.started_at_utc, summary: a.summary }, run_2: { started_at_utc: b.started_at_utc, summary: b.summary },
  totals: { cases: cases.length, identical_under_criterion: cases.filter((c) => c.identical_under_criterion).length, determinism_failures: cases.filter((c) => !c.identical_under_criterion).map((c) => c.case_id),
    replayed_cases_with_raw_graph_byte_differences: cases.filter((c) => c.raw_graph_sha256_run_1 && !c.raw_graph_bytes_identical).length,
    raw_difference_explanation: 'Timestamp-driven: the adapter passes capture time as the compiler clock; run_id, run_timestamp and identity.graph_sha256 carry it. Normalized digests are compared instead, as pre-specified.' },
  summaries_identical: canonical(a.summary) === canonical(b.summary), cases };
writeFileSync(join(PKG, 'DETERMINISM_COMPARISON.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out.totals), 'summaries_identical', out.summaries_identical);

#!/usr/bin/env node
// Stress harness (Increment E-1). Usage:
//   node tests/ds-n1/eval-stress.mjs --split dev [--no-write]
//   node tests/ds-n1/eval-stress.mjs --split holdout
// Holdout controls: refuses to run while lib/ds-n1 has uncommitted changes, and
// refuses to run a second time once a holdout result file exists, so the
// holdout cannot be iterated against. Every run is written, pass or fail.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { openReview, deriveState, buildReport, CANDIDATE, STATUS } from '../../lib/ds-n1/index.mjs';
import { canonical } from '../../lib/ds-n1/text.mjs';

const here = new URL('./', import.meta.url);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const args = process.argv.slice(2);
const split = args.includes('--split') ? args[args.indexOf('--split') + 1] : null;
const write = !args.includes('--no-write');
if (!['dev', 'holdout'].includes(split)) { console.error('--split dev|holdout is required'); process.exit(2); }
const AT = '2026-11-03T00:00:00Z';

let commit = 'NOT ESTABLISHED', dirty = null;
try {
  commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  dirty = execSync('git status --porcelain -- lib/ds-n1', { encoding: 'utf8' }).trim().length > 0;
} catch {}
const resDir = new URL('results/', here);
mkdirSync(resDir, { recursive: true });
const prior = readdirSync(resDir);
if (split === 'holdout') {
  if (dirty !== false) { console.error('REFUSED: holdout requires committed engine source (lib/ds-n1 clean).'); process.exit(3); }
  if (prior.some((f) => /^STRESS-HOLDOUT-\d{3}\.json$/.test(f))) { console.error('REFUSED: the holdout has already been run for this increment; results stand as recorded.'); process.exit(3); }
}

const expRaw = readFileSync(new URL('stress-expectations.json', here), 'utf8');
const exp = JSON.parse(expRaw);
const manRaw = readFileSync(new URL('fixtures/stress/MANIFEST.json', here), 'utf8');
const man = JSON.parse(manRaw);

const rows = [];
let falseReady = 0, falseHold = 0, agree = 0, repeatOk = 0, n = 0;
for (const fx of man.fixtures.filter((f) => f.split === split)) {
  const body = readFileSync(new URL(`fixtures/stress/${fx.id}.json`, here), 'utf8');
  const e = exp.fixtures[fx.id];
  if (!e || e.split !== split) throw new Error(`expectation missing or split mismatch for ${fx.id}`);
  n++;
  const outs = [];
  let st;
  for (let i = 0; i < 3; i++) {
    const s = openReview(JSON.parse(body), { at: AT });
    outs.push(canonical(buildReport(s, { generated_at: AT })));
    if (!i) st = deriveState(s);
  }
  const ready = st.status === STATUS.READY;
  const fr = e.must_not_be_ready && ready;
  const fh = !e.must_not_be_ready && !ready;
  if (fr) falseReady++;
  if (fh) falseHold++;
  if (st.status === e.expected_status) agree++;
  if (outs.every((o) => o === outs[0])) repeatOk++;
  rows.push({
    id: fx.id, mutation: fx.mutation, fixture_digest_ok: sha(body) === fx.sha256,
    reference_status: e.expected_status, observed_status: st.status,
    critical_false_ready: fr, false_hold: fh,
    observed_codes: [...new Set(st.findings.filter((f) => f.status !== 'SUPERSEDED').map((f) => f.code))].sort(),
  });
}
const result = {
  run_schema: 'ds-n1.stress-run/1.0', split, executed_at: new Date().toISOString(),
  application: { candidate_id: CANDIDATE.candidate_id, version: CANDIDATE.version, rule_version: CANDIDATE.rule_version },
  source_commit: commit, engine_source_dirty: dirty, model: 'none', provider: 'none',
  dataset: { id: man.fixture_set, manifest_sha256: sha(manRaw), records: n },
  expectations: { id: exp.expectation_set, sha256: sha(expRaw), label_type: exp.label_type },
  executions_per_record: 3, retries: 0, exclusions: [],
  summary: {
    records: n, critical_false_ready: falseReady, false_hold: falseHold,
    reference_status_agreement: `${agree}/${n}`, repeatable: `${repeatOk}/${n}`,
    acceptance: falseReady === 0 ? 'PASS on the mandatory criterion (0 critical false-ready); other figures descriptive' : 'FAIL: critical false-ready present',
  },
  limitations: ['Developer-authored records and reference labels; not independent.', 'Small constructed set; figures are counts, not rates with any population meaning.'],
  records: rows,
};
console.log(JSON.stringify(result.summary, null, 2));
for (const r of rows) console.log(`${r.id} ref=${r.reference_status} obs=${r.observed_status}${r.critical_false_ready ? ' CRITICAL-FALSE-READY' : ''}${r.false_hold ? ' FALSE-HOLD' : ''} [${r.observed_codes.join(',')}]`);
if (write) {
  const prefix = `STRESS-${split.toUpperCase()}-`;
  const k = prior.filter((f) => f.startsWith(prefix)).length + 1;
  const name = `${prefix}${String(k).padStart(3, '0')}.json`;
  writeFileSync(new URL(name, resDir), JSON.stringify(result, null, 2) + '\n');
  console.log('written', 'tests/ds-n1/results/' + name);
}
process.exit(falseReady ? 1 : 0);

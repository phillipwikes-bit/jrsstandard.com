#!/usr/bin/env node
// DS-N1 evaluation harness. Scores the engine against the PRE-REGISTERED
// expectations in expectations.json. It never edits expectations, never
// retries a failure, and writes every run (including failing runs) to
// tests/ds-n1/results/ under a new sequential name so first-observed results
// are preserved.
//
// Usage: node tests/ds-n1/eval.mjs [--label text] [--no-write]
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { openReview, buildReport, deriveState, CANDIDATE, STATUS } from '../../lib/ds-n1/index.mjs';
import { canonical } from '../../lib/ds-n1/text.mjs';

const here = new URL('./', import.meta.url);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const args = process.argv.slice(2);
const label = args.includes('--label') ? args[args.indexOf('--label') + 1] : '';
const write = !args.includes('--no-write');
const AT = '2026-11-03T00:00:00Z';
const RUNS = 3;

const expRaw = readFileSync(new URL('expectations.json', here), 'utf8');
const exp = JSON.parse(expRaw);
const manRaw = readFileSync(new URL('fixtures/MANIFEST.json', here), 'utf8');
const man = JSON.parse(manRaw);

let commit = 'NOT ESTABLISHED', dirty = null;
try { commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); dirty = execSync('git status --porcelain -- lib/ds-n1 tests/ds-n1', { encoding: 'utf8' }).trim().length > 0; } catch {}

const rows = [];
let criticalFalseReady = 0, statusAgree = 0, codesOk = 0, controlsClean = 0, controls = 0, repeatOk = 0, missing = 0;
for (const fx of man.fixtures) {
  const body = readFileSync(new URL(`fixtures/${fx.id}.json`, here), 'utf8');
  const digestOk = sha(body) === fx.sha256;
  const e = exp.fixtures[fx.id];
  if (!e) { missing++; rows.push({ id: fx.id, error: 'NO_PRE_REGISTERED_EXPECTATION' }); continue; }
  const outs = [];
  let state;
  for (let i = 0; i < RUNS; i++) {
    const s = openReview(JSON.parse(body), { at: AT });
    outs.push(canonical(buildReport(s, { generated_at: AT })));
    if (i === 0) state = deriveState(s);
  }
  const repeatable = outs.every((o) => o === outs[0]);
  const active = (state.findings || []).filter((f) => f.status !== 'SUPERSEDED');
  const codes = [...new Set(active.map((f) => f.code))].sort();
  const missingCodes = e.required_codes.filter((c) => !codes.includes(c));
  const ready = state.status === STATUS.READY;
  if (e.must_not_be_ready && ready) criticalFalseReady++;
  if (state.status === e.expected_status) statusAgree++;
  if (!missingCodes.length) codesOk++;
  if (fx.id.startsWith('P')) { controls++; if (!active.length) controlsClean++; }
  if (repeatable) repeatOk++;
  rows.push({
    id: fx.id, mutation: fx.mutation, fixture_digest_ok: digestOk,
    expected_status: e.expected_status, observed_status: state.status,
    status_match: state.status === e.expected_status,
    required_codes: e.required_codes, observed_codes: codes, missing_codes: missingCodes,
    critical_false_ready: e.must_not_be_ready && ready,
    repeatable, report_sha256: sha(outs[0]),
  });
}

const n = man.fixtures.length;
const result = {
  run_schema: 'ds-n1.eval-run/1.0',
  label,
  executed_at: new Date().toISOString(),
  application: { candidate_id: CANDIDATE.candidate_id, version: CANDIDATE.version, rule_version: CANDIDATE.rule_version },
  source_commit: commit, working_tree_dirty_in_scope: dirty,
  model: 'none (zero model calls)', provider: 'none', codebook_version: 'NOT APPLICABLE: provisional RC1-RC5 grouping, no Codebook correspondence',
  environment: { node: process.version, platform: process.platform },
  dataset: { id: man.fixture_set, manifest_sha256: sha(manRaw), unique_records: n, classification: man.classification },
  expectations: { id: exp.expectation_set, sha256: sha(expRaw) },
  executions_per_record: RUNS, retries: 0, exclusions: [],
  summary: {
    records: n,
    critical_false_ready: criticalFalseReady,
    status_agreement: `${statusAgree}/${n}`,
    required_codes_present: `${codesOk}/${n}`,
    controls_with_zero_findings: `${controlsClean}/${controls}`,
    repeatable_records: `${repeatOk}/${n}`,
    missing_expectations: missing,
    acceptance: criticalFalseReady === 0 && statusAgree === n && codesOk === n && controlsClean === controls && repeatOk === n && !missing ? 'PASS (developer fixtures only)' : 'FAIL',
  },
  limitations: [
    'Developer-authored fictional fixtures and developer-authored expectations; no creator review, no independent labels.',
    'Each defect fixture isolates one mutation; real records combine defects and paraphrase. Results do not estimate field performance.',
    'Human burden and reconstructability by an independent reviewer are NOT measured by this harness.',
  ],
  records: rows,
};

console.log(JSON.stringify(result.summary, null, 2));
for (const r of rows) if (!r.status_match || r.missing_codes?.length || r.critical_false_ready || !r.repeatable) console.log('MISMATCH', JSON.stringify(r));
if (write) {
  const dir = new URL('results/', here);
  mkdirSync(dir, { recursive: true });
  const k = readdirSync(dir).filter((f) => /^RUN-\d{3}\.json$/.test(f)).length + 1;
  const name = `RUN-${String(k).padStart(3, '0')}.json`;
  writeFileSync(new URL(name, dir), JSON.stringify(result, null, 2) + '\n');
  console.log('written', `tests/ds-n1/results/${name}`);
}
process.exit(result.summary.acceptance.startsWith('PASS') ? 0 : 1);

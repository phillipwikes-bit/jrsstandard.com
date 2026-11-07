#!/usr/bin/env node
// Increment H harness: checks each isolation fixture against its specification
// (status, exact sole finding code, and decisiveness under suppression).
// Every run is written, pass or fail. Usage: node tests/ds-n1/eval-isolation.mjs [--no-write]
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { openReview, deriveState, CANDIDATE, STATUS } from '../../lib/ds-n1/index.mjs';

const here = new URL('./', import.meta.url);
const write = !process.argv.includes('--no-write');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const expRaw = readFileSync(new URL('isolation-expectations.json', here), 'utf8');
const exp = JSON.parse(expRaw);
const manRaw = readFileSync(new URL('fixtures/isolation/MANIFEST.json', here), 'utf8');
const man = JSON.parse(manRaw);
const AT = '2026-11-03T00:00:00Z';
const rows = [];
for (const fx of man.fixtures) {
  const body = readFileSync(new URL(`fixtures/isolation/${fx.id}.json`, here), 'utf8');
  const e = exp.fixtures[fx.id];
  const s = openReview(JSON.parse(body), { at: AT });
  const st = deriveState(s);
  const codes = [...new Set(st.findings.filter((f) => f.status !== 'SUPERSEDED').map((f) => f.code))].sort();
  const suppressed = deriveState(s, { suppress: [e.rule] }).status;
  const statusOk = st.status === e.expected_status;
  const isolated = JSON.stringify(codes) === JSON.stringify(e.expected_codes);
  const decisive = suppressed === STATUS.READY;
  rows.push({ id: fx.id, rule: e.rule, fixture_digest_ok: sha(body) === fx.sha256, expected_status: e.expected_status, observed_status: st.status, observed_codes: codes, status_ok: statusOk, isolated, status_if_rule_suppressed: suppressed, decisive, pass: statusOk && isolated && decisive });
}
let commit = 'NOT ESTABLISHED', dirty = null;
try { commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); dirty = execSync('git status --porcelain -- lib/ds-n1', { encoding: 'utf8' }).trim().length > 0; } catch {}
const passed = rows.filter((r) => r.pass).length;
const result = {
  run_schema: 'ds-n1.isolation-run/1.0', executed_at: new Date().toISOString(),
  application: { version: CANDIDATE.version, rule_version: CANDIDATE.rule_version }, source_commit: commit, engine_source_dirty: dirty,
  dataset: { manifest_sha256: sha(manRaw), records: rows.length }, expectations_sha256: sha(expRaw),
  summary: { cases: rows.length, passed, failed: rows.length - passed, acceptance: passed === rows.length ? 'PASS (specification tests, developer-authored)' : 'FAIL' },
  records: rows,
};
for (const r of rows) console.log(`${r.pass ? 'ok  ' : 'FAIL'} ${r.id} ${r.rule.padEnd(26)} status ${r.observed_status}${r.status_ok ? '' : ' (expected ' + r.expected_status + ')'} | codes [${r.observed_codes.join(',')}]${r.isolated ? '' : ' NOT ISOLATED'} | suppressed -> ${r.status_if_rule_suppressed}${r.decisive ? '' : ' NOT DECISIVE'}`);
console.log(JSON.stringify(result.summary));
if (write) {
  const dir = new URL('results/', here); mkdirSync(dir, { recursive: true });
  const k = readdirSync(dir).filter((f) => /^ISOLATION-\d{3}\.json$/.test(f)).length + 1;
  const name = `ISOLATION-${String(k).padStart(3, '0')}.json`;
  writeFileSync(new URL(name, dir), JSON.stringify(result, null, 2) + '\n');
  console.log('written tests/ds-n1/results/' + name);
}
process.exit(passed === rows.length ? 0 : 1);

#!/usr/bin/env node
// HOLDOUT-2 harness. Refuses unless ALL of:
//   --owner-authorisation "<reference to the owner's recorded decision>"
//   lib/ds-n1 has no uncommitted changes
//   no HOLDOUT2-*.json result exists (run once only)
// Usage: node tests/ds-n1/eval-holdout2.mjs --owner-authorisation "PR #119 comment <id>"
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const here = new URL('./', import.meta.url);
const args = process.argv.slice(2);
const auth = args.includes('--owner-authorisation') ? args[args.indexOf('--owner-authorisation') + 1] : '';
if (!auth || !auth.trim()) { console.error('REFUSED: holdout-2 is sealed. Pass --owner-authorisation with a reference to the owner\'s recorded decision.'); process.exit(3); }
const dirty = execSync('git status --porcelain -- lib/ds-n1', { encoding: 'utf8' }).trim().length > 0;
if (dirty) { console.error('REFUSED: engine source has uncommitted changes.'); process.exit(3); }
const resDir = new URL('results/', here);
mkdirSync(resDir, { recursive: true });
if (readdirSync(resDir).some((f) => /^HOLDOUT2-\d{3}\.json$/.test(f))) { console.error('REFUSED: holdout-2 has already been run; results stand as recorded.'); process.exit(3); }

// Engine imported only after every refusal check has passed.
const { openReview, deriveState, CANDIDATE, STATUS } = await import('../../lib/ds-n1/index.mjs');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const expRaw = readFileSync(new URL('holdout2-expectations.json', here), 'utf8');
const exp = JSON.parse(expRaw);
const manRaw = readFileSync(new URL('fixtures/holdout2/MANIFEST.json', here), 'utf8');
const man = JSON.parse(manRaw);
const rows = [];
let falseReady = 0, falseHold = 0, agree = 0;
for (const fx of man.fixtures) {
  const body = readFileSync(new URL(`fixtures/holdout2/${fx.id}.json`, here), 'utf8');
  const e = exp.fixtures[fx.id];
  const st = deriveState(openReview(JSON.parse(body), { at: '2026-11-03T00:00:00Z' }));
  const ready = st.status === STATUS.READY;
  if (e.must_not_be_ready && ready) falseReady++;
  if (!e.must_not_be_ready && !ready) falseHold++;
  if (st.status === e.expected_status) agree++;
  rows.push({ id: fx.id, fixture_digest_ok: sha(body) === fx.sha256, reference_status: e.expected_status, observed_status: st.status, critical_false_ready: e.must_not_be_ready && ready, false_hold: !e.must_not_be_ready && !ready, observed_codes: [...new Set(st.findings.filter((f) => f.status !== 'SUPERSEDED').map((f) => f.code))].sort() });
}
const result = {
  run_schema: 'ds-n1.holdout2-run/1.0', executed_at: new Date().toISOString(), owner_authorisation: auth,
  application: { version: CANDIDATE.version, rule_version: CANDIDATE.rule_version },
  source_commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
  dataset: { manifest_sha256: sha(manRaw), records: rows.length }, expectations_sha256: sha(expRaw),
  summary: { critical_false_ready: falseReady, false_hold: falseHold, reference_status_agreement: `${agree}/${rows.length}`, acceptance: falseReady === 0 ? 'PASS on mandatory criterion' : 'FAIL: critical false-ready present' },
  limitation: 'Developer-authored cases and labels; a sequencing control, not independent evidence.',
  records: rows,
};
const name = 'HOLDOUT2-001.json';
writeFileSync(new URL(name, resDir), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result.summary, null, 2));
console.log('written tests/ds-n1/results/' + name);
process.exit(falseReady ? 1 : 0);

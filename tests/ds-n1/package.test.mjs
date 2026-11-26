// DS-N1 technical package: allowlist, manifest, standalone tests, tamper detection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildBundle, allowlist } from '../../lib/ds-n1/package/build-bundle.mjs';
import { verifyBundle } from '../../lib/ds-n1/package/verify-bundle.mjs';

const fresh = () => join(mkdtempSync(join(tmpdir(), 'ds-n1-pkg-')), 'out');

test('the allowlist holds the engine and excludes sealed sets, results and other projects', () => {
  const list = allowlist();
  assert.ok(list.includes('lib/ds-n1/assess.mjs'));
  assert.ok(list.includes('tests/ds-n1/fixtures-partner/MEMO-D01.json'));
  for (const p of list) {
    assert.doesNotMatch(p, /holdout2|isolation|stress|results|labelling|owner\/|api\/|research\//, p);
  }
});

test('a built package verifies, states its status, and runs its own tests', () => {
  const out = fresh();
  const m = buildBundle(out, { generatedAt: '2026-11-18T12:00:00Z' });
  assert.equal(m.runtime_dependencies.length, 0);
  assert.match(m.status.validation, /NOT ESTABLISHED/);
  assert.match(m.status.rights, /NOT ESTABLISHED/);
  assert.ok(m.record_classes.includes('ai_drafted_legal_memo'));
  assert.deepEqual(verifyBundle(out), { ok: true, files: m.files.length, problems: [] });
  const tests = m.files.map((f) => f.path).filter((p) => p.endsWith('.test.mjs') && !p.endsWith('package.test.mjs'));
  // Run as an independent process. Newer Node versions skip a test run started
  // inside another one (NODE_TEST_CONTEXT is inherited) and still exit 0, so the
  // variable is removed and the run must report tests actually passing
  // (2026-11-26 audit).
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd: out, encoding: 'utf8', env });
  const all = r.stdout + r.stderr;
  assert.equal(r.status, 0, all.slice(-2000));
  assert.doesNotMatch(all, /skipp?ing running files|recursive/i, 'the bundle test run was skipped');
  const pass = Number((all.match(/^# pass (\d+)/m) || [])[1] || 0), fail = Number((all.match(/^# fail (\d+)/m) || [])[1] || -1);
  assert.ok(pass >= 200, `bundle tests that passed: ${pass}`);
  assert.equal(fail, 0, all.slice(-2000));
});

test('an edited, removed or added file is detected', () => {
  const out = fresh();
  buildBundle(out);
  appendFileSync(join(out, 'lib/ds-n1/assess.mjs'), '\n// edit');
  writeFileSync(join(out, 'extra.txt'), 'x');
  const r = verifyBundle(out);
  assert.equal(r.ok, false);
  assert.ok(r.problems.some((p) => p.code === 'HASH_MISMATCH' && p.path === 'lib/ds-n1/assess.mjs'));
  assert.ok(r.problems.some((p) => p.code === 'UNLISTED_FILE' && p.path === 'extra.txt'));
});

test('the builder refuses a non-empty or in-repository output directory', () => {
  const out = fresh();
  buildBundle(out);
  assert.throws(() => buildBundle(out), /must be empty/);
  assert.throws(() => buildBundle(new URL('../../tmp-bundle-test/', import.meta.url).pathname), /outside the repository/);
  assert.ok(!existsSync(new URL('../../tmp-bundle-test/', import.meta.url)));
});

test('the diligence report is generated live, states limits, and makes no accuracy claim', async () => {
  const { buildDiligenceReport } = await import('../../lib/ds-n1/package/diligence-report.mjs');
  const html = buildDiligenceReport();
  assert.ok(!html.includes('[object Object]'));
  assert.match(html, /Detection templates<\/th><td>\d+ \(/);
  assert.match(html, /wrongly marked READY<\/th><td>0 of \d+/);
  assert.match(html, /Signed audit log verifies<\/th><td>Yes/);
  assert.match(html, /Edited log entry detected<\/th><td>Yes/);
  assert.match(html, /Not established/);
  assert.match(html, /No scored practitioner comparison/);
  for (const w of ['guaranteed', 'compliant', 'eliminates', 'industry standard', 'court-proof']) assert.ok(!html.toLowerCase().includes(w), w);
  const withP = buildDiligenceReport({ practitioner: { raised: 7, matched: 3, partial: 1, missed: 3, records: 1, reviewers: 1, full_match_rate: { rate: 3 / 7, low: 0.158, high: 0.75 }, caveat: 'Not an accuracy result.' } });
  assert.match(withP, /7 practitioner-raised issues.*3 matched, 1 partly matched, 3 missed.*43%.*16 to 75%/s);
});

test('the bundle carries what its own tests and diligence report need', () => {
  const list = allowlist();
  for (const f of ['tests/ds-n1/expectations.json', 'tests/ds-n1/practitioner/build-review-packet.mjs', 'tests/ds-n1/practitioner/PROTOCOL.md', 'lib/ds-n1/package/diligence-report.mjs', 'lib/ds-n1/enterprise/store.mjs']) {
    assert.ok(list.includes(f), f);
  }
});

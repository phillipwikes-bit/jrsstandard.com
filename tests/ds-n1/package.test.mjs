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
  const r = spawnSync(process.execPath, ['--test', ...tests], { cwd: out, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.slice(-2000) + r.stderr.slice(-2000));
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

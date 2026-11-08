import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildExport, verifyExport, VERDICT } from '../lib/ds-n1/index.mjs';
import { runLocalReview } from '../owner/incomeos/ds-local-review.mjs';
import '../owner/incomeos/ds-program.js';
const base = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(base, 'ds-n1/fixtures/D06.json'), 'utf8'));
const at = '2026-11-05T13:30:00Z';
test('fictional DS-N1 review produces a consistent evidence export', () => {
  const program = globalThis.IncomeOSDSProgram.newProgram('2026-11-05');
  const result = runLocalReview(program, fixture, [], at);
  assert.equal(result.accepted, true);
  assert.equal(result.scope, 'DEVELOPMENT_ONLY_CONSTRUCTED_FICTIONAL');
  assert.equal(result.customerAccess, false);
  const bundle = buildExport(result.session, { generated_at: at });
  assert.equal(verifyExport(bundle).verdict, VERDICT.CONSISTENT);
});

test('CLI executes the fictional reviewer, writes a verifiable export once, and rejects reuse', async () => {
  const { mkdtempSync, writeFileSync, readFileSync: read, rmSync, statSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { resolve } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const dir = mkdtempSync(resolve(tmpdir(), 'incomeos-dsn1-cli-'));
  try {
    const programPath = resolve(dir, 'programme.json');
    const fixturePath = resolve(dir, 'fictional.json');
    const exportPath = resolve(dir, 'evidence.json');
    writeFileSync(programPath, JSON.stringify(globalThis.IncomeOSDSProgram.newProgram('2026-11-05')));
    writeFileSync(fixturePath, JSON.stringify(fixture));
    const entry = resolve(base, '../owner/incomeos/ds-local-review.mjs');
    const args = [entry, fixturePath, programPath, '', exportPath];
    // Empty action argument is interpreted as no actions by the CLI.
    const first = spawnSync(process.execPath, args, { encoding:'utf8' });
    assert.equal(first.status, 0, first.stderr);
    assert.equal(JSON.parse(first.stdout).accepted, true);
    assert.equal(JSON.parse(first.stdout).scope, 'DEVELOPMENT_ONLY_CONSTRUCTED_FICTIONAL');
    assert.equal(verifyExport(JSON.parse(read(exportPath, 'utf8'))).verdict, VERDICT.CONSISTENT);
    if (process.platform !== 'win32') assert.equal(statSync(exportPath).mode & 0o777, 0o600);
    const second = spawnSync(process.execPath, args, { encoding:'utf8' });
    assert.notEqual(second.status, 0, 'exclusive-create must reject existing evidence export');
    assert.match(second.stderr, /EEXIST/);
    const untrusted = { ...fixture, data_classification: 'confidential' };
    writeFileSync(fixturePath, JSON.stringify(untrusted));
    const denied = spawnSync(process.execPath, [entry, fixturePath, programPath], { encoding:'utf8' });
    assert.notEqual(denied.status, 0);
    assert.match(denied.stderr, /Fictional records only/);
  } finally {
    rmSync(dir, { recursive:true, force:true });
  }
});

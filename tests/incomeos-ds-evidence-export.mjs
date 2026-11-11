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

test('CLI replays recorded human reviewer actions into a verifiable export and refuses re-dated or anonymous actions', async () => {
  const { mkdtempSync, writeFileSync, readFileSync: read, rmSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { resolve } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { startSyntheticReview, reviewerSnapshot } = await import('../owner/incomeos/ds-runtime-bridge.mjs');
  const dir = mkdtempSync(resolve(tmpdir(), 'incomeos-dsn1-cli-actions-'));
  try {
    const program = globalThis.IncomeOSDSProgram.newProgram('2026-11-05');
    const finding = reviewerSnapshot(program, startSyntheticReview(program, fixture, at).session)
      .findings.find(x => x.code === 'UNSUPPORTED_CLAIM');
    assert.ok(finding);
    const reviewer = { reviewer_id:'rev-test-01', name:'Fictional Test Reviewer' };
    const recorded = [
      { type:'request_evidence', finding_id:finding.finding_id, at:'2026-11-05T13:31:00Z', reviewer,
        request:'Please provide the missing source record before treating the claim as supported.' },
      { type:'final_disposition', disposition:'returned_to_author', at:'2026-11-05T13:35:00Z', reviewer,
        note:'Returned: the claim has no supporting source in the fictional record.' },
    ];
    const programPath = resolve(dir, 'programme.json');
    const fixturePath = resolve(dir, 'fictional.json');
    const actionsPath = resolve(dir, 'actions.json');
    writeFileSync(programPath, JSON.stringify(program));
    writeFileSync(fixturePath, JSON.stringify(fixture));
    const entry = resolve(base, '../owner/incomeos/ds-local-review.mjs');
    let n = 0;
    const run = actions => {
      const exportPath = resolve(dir, 'evidence-' + (++n) + '.json');
      writeFileSync(actionsPath, JSON.stringify(actions));
      const out = spawnSync(process.execPath, [entry, fixturePath, programPath, actionsPath, exportPath], { encoding:'utf8' });
      return { ...out, exportPath };
    };

    const ok = run({ opened_at:at, actions:recorded });
    assert.equal(ok.status, 0, ok.stderr);
    const summary = JSON.parse(ok.stdout);
    assert.equal(summary.eventCount, 3);
    assert.equal(summary.disposition, 'returned_to_author');
    assert.notEqual(summary.status, 'READY');
    assert.doesNotMatch(ok.stdout, /Fictional Test Reviewer|missing source record/, 'summary must not echo review content');
    const bundle = JSON.parse(read(ok.exportPath, 'utf8'));
    assert.equal(verifyExport(bundle).verdict, VERDICT.CONSISTENT);
    assert.equal(bundle.events[0].at, at, 'review opening time is the operator-recorded one');
    // Human actions are retained verbatim: same order, time, reviewer and words.
    assert.deepEqual(bundle.events.slice(1).map(e => [e.type, e.at, e.reviewer.reviewer_id]),
      recorded.map(a => [a.type, a.at, reviewer.reviewer_id]));
    assert.equal(bundle.events[1].request, recorded[0].request);
    assert.equal(bundle.events[2].disposition, 'returned_to_author');
    assert.equal(bundle.events[2].note, recorded[1].note);
    assert.ok(Date.parse(bundle.report.generated_at) >= Date.parse(recorded[1].at));
    // An edited retained disposition is detected by the internal consistency check.
    const edited = structuredClone(bundle);
    edited.events[2].disposition = 'accepted_for_finalization';
    assert.notEqual(verifyExport(edited).verdict, VERDICT.CONSISTENT);

    // The array form opens the review at run time, so it cannot carry earlier actions.
    const refusals = [
      [recorded, /TIMESTAMP_REGRESSION/],
      [{ opened_at:'2026-11-05T13:32:00Z', actions:recorded }, /TIMESTAMP_REGRESSION/],
      [{ opened_at:'2999-01-01T00:00:00Z', actions:[] }, /later than this run/],
      [{ opened_at:at, actions:[{ ...recorded[0], at:'2999-01-01T00:00:00Z' }] }, /later than this run/],
      [{ opened_at:'2026-11-05 13:30', actions:recorded }, /ISO-8601/],
      [{ actions:recorded }, /ISO-8601/],
      [{ opened_at:at, actions:recorded, generated_at:at }, /Unsupported human-actions field/],
      [{ opened_at:at, actions:'none' }, /must be an array/],
      [{ opened_at:at, actions:[{ ...recorded[0], reviewer:undefined }] }, /REVIEWER_REQUIRED/],
      [{ opened_at:at, actions:[{ type:'final_disposition', disposition:'accepted_for_finalization', at:'2026-11-05T13:31:00Z', reviewer, note:'Accept.' }] }, /NOT_READY/],
    ];
    for (const [actions, reason] of refusals) {
      const denied = run(actions);
      assert.notEqual(denied.status, 0, 'expected refusal: ' + reason);
      assert.match(denied.stderr, reason);
      assert.equal(existsSync(denied.exportPath), false, 'a refused review must not leave an export: ' + reason);
    }
  } finally {
    rmSync(dir, { recursive:true, force:true });
  }
});

// Practitioner trial kit (2026-11-19). Constructed records only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPrediction, comparePoints, aggregate, wilson, CATEGORIES } from '../../lib/ds-n1/practitioner-trial.mjs';
import { TEMPLATES } from '../../lib/ds-n1/detection-templates.mjs';

const rec = JSON.parse(readFileSync(new URL('./fixtures-partner/AUTH-D01.json', import.meta.url), 'utf8'));
const opts = { engineCommit: 'test', recordedAt: '2026-11-19T00:00:00Z' };

test('every category names real templates, and no template is in two categories', () => {
  const seen = new Set();
  for (const ts of Object.values(CATEGORIES)) for (const t of ts) {
    assert.ok(TEMPLATES[t], t);
    assert.ok(!seen.has(t), `${t} twice`);
    seen.add(t);
  }
});

test('a prediction freezes the record hash, engine commit and categories', () => {
  const p = buildPrediction(rec, opts);
  assert.equal(p.record_id, rec.record_id);
  assert.match(p.record_sha256, /^[0-9a-f]{64}$/);
  assert.equal(p.engine_commit, 'test');
  assert.ok(p.categories.length > 0);
  assert.throws(() => buildPrediction(rec, {}), /required/);
});

test('points are scored MATCH, PARTIAL or MISS, and DS-only categories are listed', () => {
  const p = buildPrediction(rec, opts);
  const hit = p.categories[0];
  const coded = { record_id: rec.record_id, reviewer: 'R1', points: [
    { category: hit, text: 'found by both' },
    { category: 'stop_redress', text: 'no way to stop it', partial: true },
    { category: 'other', text: 'something no category covers' },
  ] };
  const c = comparePoints(p, coded, rec);
  assert.equal(c.rows[0].result, 'MATCH');
  assert.equal(c.rows[2].result, 'MISS');
  assert.equal(c.raised, 3);
  assert.ok(!c.ds_only.includes(hit));
  const changed = structuredClone(rec); changed.text += ' Edited.';
  assert.throws(() => comparePoints(p, coded, changed), /record changed/);
  assert.throws(() => comparePoints(p, { ...coded, record_id: 'X' }), /coded points are for/);
  assert.throws(() => comparePoints(p, { ...coded, points: [{ category: 'nope', text: '' }] }), /unknown category/);
});

test('totals count partial matches separately and report a Wilson interval', () => {
  const w = wilson(3, 7);
  assert.ok(Math.abs(w.low - 0.1582) < 0.001 && Math.abs(w.high - 0.7495) < 0.001, JSON.stringify(w));
  assert.equal(wilson(0, 0).rate, null);
  const t = aggregate([
    { record_id: 'A', reviewer: 'R1', raised: 4, matched: 2, partial: 1, missed: 1, ds_only: [] },
    { record_id: 'B', reviewer: 'R2', raised: 3, matched: 1, partial: 0, missed: 2, ds_only: ['x'] },
  ]);
  assert.deepEqual([t.records, t.reviewers, t.raised, t.matched, t.partial, t.missed, t.ds_only], [2, 2, 7, 3, 1, 3, 1]);
  assert.equal(t.full_match_rate.k, 3);
  assert.match(t.caveat, /Not an accuracy result/);
});

test('the review packet shows the record and documents, and nothing of DS-N1 output', async () => {
  const { mkdtempSync, writeFileSync: w, readFileSync: rd } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const dir = mkdtempSync(join(tmpdir(), 'packet-'));
  const recPath = join(dir, 'rec.json');
  w(recPath, JSON.stringify(rec));
  const script = new URL('./practitioner/build-review-packet.mjs', import.meta.url).pathname;
  execFileSync(process.execPath, [script, recPath, dir]);
  const html = rd(join(dir, `${rec.record_id}.packet.html`), 'utf8');
  const txt = rd(join(dir, `${rec.record_id}.packet.txt`), 'utf8');
  for (const s of rec.sources) assert.ok(txt.includes(s.title), s.title);
  assert.ok(html.includes('fictional'));
  for (const leak of ['HOLD', 'READY', 'finding', 'template', 'UNSUPPORTED', 'claim_id']) {
    assert.ok(!html.includes(leak) && !txt.includes(leak), `packet must not reveal ${leak}`);
  }
  assert.ok(!/<script/i.test(html));
  assert.throws(() => execFileSync(process.execPath, [script, recPath, dir], { stdio: 'pipe' }), 'never overwrites');
  const real = join(dir, 'real.json'); w(real, JSON.stringify({ ...rec, data_classification: 'real' }));
  assert.throws(() => execFileSync(process.execPath, [script, real, join(dir, 'x')], { stdio: 'pipe' }), 'refuses real records');
});

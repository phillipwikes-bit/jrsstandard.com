// The Record Check Benchmark scorer must not reward missing, empty or malformed
// answers (2026-11-26 external audit reproduced all three).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const scorer = fileURLToPath(new URL('./score.mjs', import.meta.url));
const key = (t) => JSON.parse(readFileSync(new URL(`./data/track-${t}.key.json`, import.meta.url), 'utf8'));
const score = (answers) => { const f = join(mkdtempSync(join(tmpdir(), 'bm-')), 'a.json'); writeFileSync(f, JSON.stringify(answers)); return JSON.parse(execFileSync(process.execPath, [scorer, f], { encoding: 'utf8' })); };
test('an empty answer section earns nothing', () => {
  const s = score({ tool: 'empty', A: {}, E: {}, F: {} });
  assert.equal(s.A.unchanged_records_passed.k, 0);
  assert.equal(s.E.unchanged_records_passed.k, 0);
  assert.equal(s.F.good_drafts_without_serious_flag.k, 0);
  assert.equal(s.coverage.A.valid_answers, 0);
});
test('an empty string never names a dropped date or speaker', () => {
  const A = Object.fromEntries(Object.keys(key('a')).map((id) => [id, { flagged: false, dropped_dates: [''], dropped_speakers: ['  '] }]));
  const s = score({ tool: 'empty strings', A });
  assert.equal(s.A.dropped_dates_named.k, 0);
  assert.equal(s.A.dropped_speakers_named.k, 0);
});
test('a malformed answer is invalid, not favourable', () => {
  const A = Object.fromEntries(Object.keys(key('a')).map((id) => [id, { flagged: 'no' }]));
  const s = score({ tool: 'malformed', A });
  assert.equal(s.A.unchanged_records_passed.k, 0);
  assert.equal(s.coverage.A.missing_or_invalid, Object.keys(key('a')).length);
});
test('dates must match exactly; a prefix is not a match', () => {
  const K = key('a');
  const A = Object.fromEntries(Object.entries(K).map(([id, t]) => [id, { flagged: t.altered, dropped_dates: (t.dropped_dates || []).map((d) => d.slice(0, 4)), dropped_speakers: [] }]));
  assert.equal(score({ tool: 'years only', A }).A.dropped_dates_named.k, 0);
});

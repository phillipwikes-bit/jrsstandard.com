#!/usr/bin/env node
// Compares a returned label sheet with (a) the developer's labels and (b) the
// DS-N1 engine. Reports raw counts and agreement; it does not decide which
// party is right, does not alter any expectation file, and with one labeller
// and a few dozen constructed cases it supports no performance claim.
// Usage: node tests/ds-n1/score-labels.mjs path/to/filled-sheet.json
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';

const here = new URL('./', import.meta.url);
const file = process.argv[2];
if (!file) { console.error('Usage: node tests/ds-n1/score-labels.mjs filled-sheet.json'); process.exit(2); }
const sheet = JSON.parse(readFileSync(resolve(file), 'utf8'));
const key = JSON.parse(readFileSync(new URL('labelling/KEY_DO_NOT_SHARE.json', here), 'utf8'));
if (sheet.packet !== key.packet) throw new Error(`sheet is for packet ${sheet.packet}, key is ${key.packet}`);
const base = JSON.parse(readFileSync(new URL('expectations.json', here), 'utf8')).fixtures;
const stress = JSON.parse(readFileSync(new URL('stress-expectations.json', here), 'utf8')).fixtures;
const MAP = { READY: 'READY_FOR_HUMAN_FINALIZATION', REVIEW_REQUIRED: 'REVIEW_REQUIRED', HOLD: 'HOLD', INCOMPLETE: 'INCOMPLETE' };

const rows = [];
let labelled = 0, agreeDev = 0, agreeEngine = 0, humanReadyEngineNot = 0, engineReadyHumanNot = 0;
for (const k of key.cases) {
  const lab = sheet.cases[k.code];
  const human = lab && MAP[String(lab.status || '').trim().toUpperCase()];
  const dev = (k.set === 'base' ? base : stress)[k.id].expected_status;
  const rec = JSON.parse(readFileSync(new URL(k.set === 'base' ? `fixtures/${k.id}.json` : `fixtures/stress/${k.id}.json`, here), 'utf8'));
  const engine = deriveState(openReview(rec, { at: '2026-11-03T00:00:00Z' })).status;
  if (!human) { rows.push({ code: k.code, human: 'UNLABELLED' }); continue; }
  labelled++;
  if (human === dev) agreeDev++;
  if (human === engine) agreeEngine++;
  if (human === MAP.READY && engine !== MAP.READY) humanReadyEngineNot++;
  if (engine === MAP.READY && human !== MAP.READY) engineReadyHumanNot++;
  rows.push({ code: k.code, fixture: `${k.set}:${k.id}`, human, developer: dev, engine, note: lab.note || '' });
}
console.log(JSON.stringify({
  labeller: sheet.labeller, labelled: `${labelled}/${key.cases.length}`,
  human_vs_developer_agreement: `${agreeDev}/${labelled}`,
  human_vs_engine_agreement: `${agreeEngine}/${labelled}`,
  engine_ready_where_human_did_not: engineReadyHumanNot,
  engine_not_ready_where_human_ready: humanReadyEngineNot,
  limitation: 'Single labeller, constructed cases, raw agreement only; no chance correction and no validation claim.',
  disagreements: rows.filter((r) => r.human !== 'UNLABELLED' && (r.human !== r.developer || r.human !== r.engine)),
}, null, 2));

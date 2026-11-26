#!/usr/bin/env node
// Freeze DS-N1's output on a record BEFORE a practitioner sees it.
// Usage: node tests/ds-n1/practitioner/preregister.mjs record.json out-prediction.json
// Keep the record and prediction OUT of this public repository while the
// record may still be used for a blind review.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildPrediction } from '../../../lib/ds-n1/practitioner-trial.mjs';

const [recPath, outPath] = process.argv.slice(2);
if (!recPath || !outPath) { console.error('Usage: preregister.mjs record.json out-prediction.json'); process.exit(2); }
if (existsSync(outPath)) { console.error(`${outPath} exists; a prediction is never overwritten`); process.exit(1); }
const here = new URL('../../../', import.meta.url).pathname;
const dirty = execSync('git status --porcelain -- lib', { cwd: here }).toString().trim();
if (dirty) { console.error('lib/ has uncommitted changes; commit before recording a prediction'); process.exit(1); }
const engineCommit = execSync('git rev-parse HEAD', { cwd: here }).toString().trim();
const pred = buildPrediction(JSON.parse(readFileSync(recPath, 'utf8')), { engineCommit, recordedAt: new Date().toISOString() });
const body = JSON.stringify(pred, null, 2) + '\n';
writeFileSync(outPath, body, { flag: 'wx' });
console.log(`${pred.record_id}: ${pred.status}; categories ${pred.categories.join(', ') || '(none)'}`);
console.log(`prediction sha256 ${createHash('sha256').update(body).digest('hex')} (note this hash before sending the record)`);

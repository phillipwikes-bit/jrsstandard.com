// Source-preparation confirmation run on the independent constructed confirmation corpus.
//   node tests/engine-candidate/confirmation/run.mjs            compare with expectations and the divergence record
//   node tests/engine-candidate/confirmation/run.mjs --table    also print every case
//   node tests/engine-candidate/confirmation/run.mjs --log "<label>"   append this run to RUN_LOG.json
//
// The corpus (v0.1.0/cases.json) was committed before any fix to source-prep.js (759ea86). Its
// mismatches are recorded in v0.1.0/DIVERGENCES.json as found and are not tuned away on this set.
// CONSTRUCTED CONFIRMATION MATERIAL: never a sealed holdout and never a real-world validation set.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { compareSet, checkRecord, report, SOURCE_PREP_VERSION } from '../shared/setcompare.mjs';

const dir = new URL('v0.1.0/', import.meta.url);
const set = JSON.parse(readFileSync(new URL('cases.json', dir), 'utf8'));
const recPath = new URL('DIVERGENCES.json', dir);
const record = existsSync(recPath) ? JSON.parse(readFileSync(recPath, 'utf8')) : { divergences: {} };
const { observed, tally } = compareSet(set.cases);
const ok = report('Confirmation corpus', set, observed, tally, checkRecord(observed, record), process.argv.includes('--table'));
const li = process.argv.indexOf('--log');
if (li !== -1) {
  const logPath = new URL('RUN_LOG.json', dir);
  const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')) : { _note: 'Append-only log of confirmation runs. Tallies over constructed cases, never rates.', runs: [] };
  log.runs.push({ label: process.argv[li + 1], source_prep_version: SOURCE_PREP_VERSION, cases: observed.length,
    matched: observed.filter((o) => o.match).length,
    by_kind: Object.fromEntries([...new Set(observed.map((o) => o.kind))].map((k) => [k, `${observed.filter((o) => o.kind === k && o.match).length}/${observed.filter((o) => o.kind === k).length}`])),
    mismatches: observed.filter((o) => !o.match).map((o) => ({ id: o.id, category: o.category, kind: o.kind, diffs: o.diffs })) });
  writeFileSync(logPath, JSON.stringify(log, null, 1) + '\n');
  console.log('appended to RUN_LOG.json');
}
process.exit(ok ? 0 : 1);

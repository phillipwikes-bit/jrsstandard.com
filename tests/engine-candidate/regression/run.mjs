// Source-preparation regression and characterisation run. Constructed records only; no model, no network.
//   node tests/engine-candidate/regression/run.mjs           compare with expectations and the divergence record
//   node tests/engine-candidate/regression/run.mjs --table   also print every case
//
// Expectations (cases.json) were committed before the first run (fd6a58a). Where the checker disagrees
// with them, the disagreement is recorded in KNOWN_DIVERGENCES.json, not hidden and not "fixed" by
// editing the expectation. A divergence later resolved stays in that file as history, marked
// resolved_in, and must keep matching. This run fails on any new, changed, vanished or returned
// divergence, so the record always matches the code.
import { readFileSync } from 'node:fs';
import { compareSet, checkRecord, report } from '../shared/setcompare.mjs';

const here = (f) => new URL(f, import.meta.url);
const set = JSON.parse(readFileSync(here('cases.json'), 'utf8'));
const record = JSON.parse(readFileSync(here('KNOWN_DIVERGENCES.json'), 'utf8'));
const { observed, tally } = compareSet(set.cases);
const ok = report('Regression set', set, observed, tally, checkRecord(observed, record), process.argv.includes('--table'));
if (process.argv.includes('--json')) console.log(JSON.stringify({ observed, tally }, null, 1));
process.exit(ok ? 0 : 1);

// Source-preparation regression and characterisation run. Constructed records only; no model, no network.
//   node tests/engine-candidate/regression/run.mjs           compare with expectations and known divergences
//   node tests/engine-candidate/regression/run.mjs --table   also print every case
//
// Expectations (cases.json) were committed before the first run (fd6a58a). Where the checker disagrees
// with them, the disagreement is recorded in KNOWN_DIVERGENCES.json, not hidden and not "fixed" by
// editing the expectation. This run fails on any NEW divergence and on any recorded divergence that
// no longer occurs, so the record always matches the code.
import { readFileSync } from 'node:fs';
import { prepareSource } from '../../../lib/engine-candidate/source-prep.js';

const here = (f) => new URL(f, import.meta.url);
const set = JSON.parse(readFileSync(here('cases.json'), 'utf8'));
const known = JSON.parse(readFileSync(here('KNOWN_DIVERGENCES.json'), 'utf8'));
const table = process.argv.includes('--table');

const tally = {}; // code -> { expected_found, missed, false_alarm }
const bump = (code, k) => { tally[code] = tally[code] || { expected_found: 0, missed: 0, false_alarm: 0 }; tally[code][k]++; };
const observed = [];
for (const c of set.cases) {
  const r = prepareSource(c.text);
  const codes = [...new Set(r.findings.map((f) => f.code))].sort();
  const missingEls = r.findings.filter((f) => f.code === 'profile_element_not_found').map((f) => f.element).sort();
  const got = { refusal: r.refusal ? r.refusal.reason : null, codes, elements_missing: missingEls, quotations: r.quotations.length };
  const e = c.expect;
  for (const code of new Set([...e.codes, ...codes])) {
    if (code === 'profile_element_not_found') continue;
    bump(code, e.codes.includes(code) && codes.includes(code) ? 'expected_found' : e.codes.includes(code) ? 'missed' : 'false_alarm');
  }
  for (const el of new Set([...e.elements_missing, ...missingEls])) {
    const k = 'profile_element:' + el;
    bump(k, e.elements_missing.includes(el) && missingEls.includes(el) ? 'expected_found' : e.elements_missing.includes(el) ? 'missed' : 'false_alarm');
  }
  const refusalKey = 'refusal:' + (e.refusal || got.refusal || 'none');
  if (e.refusal || got.refusal) bump(refusalKey, e.refusal === got.refusal ? 'expected_found' : e.refusal ? 'missed' : 'false_alarm');
  const diffs = [];
  if (e.refusal !== got.refusal) diffs.push(`refusal expected ${e.refusal} got ${got.refusal}`);
  if (JSON.stringify(e.codes) !== JSON.stringify(codes)) diffs.push(`codes expected [${e.codes}] got [${codes}]`);
  if (JSON.stringify(e.elements_missing) !== JSON.stringify(missingEls)) diffs.push(`elements_missing expected [${e.elements_missing}] got [${missingEls}]`);
  if (e.quotations !== got.quotations) diffs.push(`quotations expected ${e.quotations} got ${got.quotations}`);
  observed.push({ id: c.id, hard: c.hard_case, purpose: c.purpose, match: diffs.length === 0, diffs });
}

const knownIds = new Set(Object.keys(known.divergences || {}));
const newDiv = observed.filter((o) => !o.match && !knownIds.has(o.id));
const gone = [...knownIds].filter((id) => observed.find((o) => o.id === id)?.match);
const changed = observed.filter((o) => !o.match && knownIds.has(o.id) && JSON.stringify(known.divergences[o.id].diffs) !== JSON.stringify(o.diffs));

if (table) for (const o of observed) console.log(`${o.match ? 'MATCH' : 'DIVERGE'}  ${o.id}${o.hard ? ' (hard)' : ''}  ${o.purpose}${o.diffs.length ? '\n         ' + o.diffs.join('\n         ') : ''}`);
const plain = observed.filter((o) => !o.hard), hard = observed.filter((o) => o.hard);
console.log(`\n${set.cases.length} cases: ${observed.filter((o) => o.match).length} match expectations, ${observed.filter((o) => !o.match).length} diverge`);
console.log(`  ordinary cases ${plain.filter((o) => o.match).length}/${plain.length}; hard cases ${hard.filter((o) => o.match).length}/${hard.length}`);
console.log('\nper check: expected and found / missed / false alarm');
for (const [k, v] of Object.entries(tally).sort()) console.log(`  ${k.padEnd(44)} ${v.expected_found} / ${v.missed} / ${v.false_alarm}`);
for (const o of newDiv) console.log(`NEW DIVERGENCE ${o.id}: ${o.diffs.join('; ')}`);
for (const o of changed) console.log(`CHANGED DIVERGENCE ${o.id}: now ${o.diffs.join('; ')}`);
for (const id of gone) console.log(`RECORDED DIVERGENCE NO LONGER OCCURS ${id}: update KNOWN_DIVERGENCES.json with the evidence`);
const ok = !newDiv.length && !gone.length && !changed.length;
console.log(`\n${ok ? 'PASS' : 'FAIL'}  observed behaviour ${ok ? 'matches' : 'does not match'} the recorded expectations and divergences`);
if (process.argv.includes('--json')) console.log(JSON.stringify({ observed, tally }, null, 1));
process.exit(ok ? 0 : 1);

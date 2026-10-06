// Shared comparison for constructed source-preparation case sets (regression and confirmation).
// Compares what source-prep.js reports with expectations written in advance, and checks the
// observed divergences against a divergence record. Counts are tallies over hand-written cases,
// never rates, and never evidence about real records.
import { prepareSource, SOURCE_PREP_VERSION } from '../../../lib/engine-candidate/source-prep.js';

export { SOURCE_PREP_VERSION };

export function observeCase(c) {
  const r = prepareSource(c.text);
  const codes = [...new Set(r.findings.map((f) => f.code))].sort();
  const missingEls = r.findings.filter((f) => f.code === 'profile_element_not_found').map((f) => f.element).sort();
  const got = { refusal: r.refusal ? r.refusal.reason : null, codes, elements_missing: missingEls, quotations: r.quotations.length };
  const e = c.expect, diffs = [];
  if (e.refusal !== got.refusal) diffs.push(`refusal expected ${e.refusal} got ${got.refusal}`);
  if (JSON.stringify(e.codes) !== JSON.stringify(codes)) diffs.push(`codes expected [${e.codes}] got [${codes}]`);
  if (JSON.stringify(e.elements_missing) !== JSON.stringify(missingEls)) diffs.push(`elements_missing expected [${e.elements_missing}] got [${missingEls}]`);
  if (e.quotations !== got.quotations) diffs.push(`quotations expected ${e.quotations} got ${got.quotations}`);
  return { got, diffs };
}

export function compareSet(cases) {
  const tally = {};
  const bump = (code, k) => { tally[code] = tally[code] || { expected_found: 0, missed: 0, false_alarm: 0 }; tally[code][k]++; };
  const observed = cases.map((c) => {
    const { got, diffs } = observeCase(c), e = c.expect;
    for (const code of new Set([...e.codes, ...got.codes])) {
      if (code === 'profile_element_not_found') continue;
      bump(code, e.codes.includes(code) && got.codes.includes(code) ? 'expected_found' : e.codes.includes(code) ? 'missed' : 'false_alarm');
    }
    for (const el of new Set([...e.elements_missing, ...got.elements_missing])) {
      bump('profile_element:' + el, e.elements_missing.includes(el) && got.elements_missing.includes(el) ? 'expected_found' : e.elements_missing.includes(el) ? 'missed' : 'false_alarm');
    }
    if (e.refusal || got.refusal) bump('refusal:' + (e.refusal || got.refusal), e.refusal === got.refusal ? 'expected_found' : e.refusal ? 'missed' : 'false_alarm');
    return { id: c.id, hard: !!c.hard_case || c.kind === 'hard', kind: c.kind || (c.hard_case ? 'hard' : 'ordinary'), category: c.category || null,
             purpose: c.purpose, match: diffs.length === 0, diffs };
  });
  return { observed, tally };
}

// A divergence with resolved_in is historical: it must now match. Any other divergence must recur exactly.
export function checkRecord(observed, record) {
  const div = (record && record.divergences) || {};
  const open = Object.keys(div).filter((id) => !div[id].resolved_in);
  const resolved = Object.keys(div).filter((id) => div[id].resolved_in);
  const byId = Object.fromEntries(observed.map((o) => [o.id, o]));
  return {
    newDiv: observed.filter((o) => !o.match && !(o.id in div)),
    gone: open.filter((id) => byId[id]?.match),
    changed: open.filter((id) => byId[id] && !byId[id].match && JSON.stringify(div[id].diffs) !== JSON.stringify(byId[id].diffs)),
    reopened: resolved.filter((id) => byId[id] && !byId[id].match),
  };
}

export function report(name, set, observed, tally, chk, table) {
  if (table) for (const o of observed) console.log(`${o.match ? 'MATCH' : 'DIVERGE'}  ${o.id} (${o.kind})  ${o.purpose}${o.diffs.length ? '\n         ' + o.diffs.join('\n         ') : ''}`);
  const kinds = [...new Set(observed.map((o) => o.kind))];
  console.log(`\n${name}, ${set.cases.length} cases, ${SOURCE_PREP_VERSION}: ${observed.filter((o) => o.match).length} match expectations, ${observed.filter((o) => !o.match).length} diverge`);
  console.log('  ' + kinds.map((k) => `${k} ${observed.filter((o) => o.kind === k && o.match).length}/${observed.filter((o) => o.kind === k).length}`).join('; '));
  console.log('\nper check: expected and found / missed / false alarm (tallies over constructed cases, not rates)');
  for (const [k, v] of Object.entries(tally).sort()) console.log(`  ${k.padEnd(44)} ${v.expected_found} / ${v.missed} / ${v.false_alarm}`);
  for (const o of chk.newDiv) console.log(`NEW DIVERGENCE ${o.id}: ${o.diffs.join('; ')}`);
  for (const id of chk.changed) console.log(`CHANGED DIVERGENCE ${id}: now ${observed.find((o) => o.id === id).diffs.join('; ')}`);
  for (const id of chk.gone) console.log(`RECORDED DIVERGENCE NO LONGER OCCURS ${id}: record its resolution, with the evidence`);
  for (const id of chk.reopened) console.log(`RESOLVED DIVERGENCE HAS RETURNED ${id}: ${observed.find((o) => o.id === id).diffs.join('; ')}`);
  const ok = !chk.newDiv.length && !chk.gone.length && !chk.changed.length && !chk.reopened.length;
  console.log(`\n${ok ? 'PASS' : 'FAIL'}  observed behaviour ${ok ? 'matches' : 'does not match'} the recorded expectations and divergences`);
  return ok;
}

// 0.3.4 repair package: development inspection (not a scored run). Compiles named records, or the V2/V6 variants
// of the ungrounded records, under 0.3.3 and 0.3.4 with the study's stored mocks, and prints E1 side by side.
// Offline only. Usage: node tools/dev-inspect.mjs <scratch> [ids...|--vf01]
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { isolate, loadEngine } from './harness/engines.mjs';
import { armsFor, MOCK_OF_ARM, recordText, designedOf, storedMock, storedVariantMock, variants, relabel, score, substantive } from './lib.mjs';

const [SCRATCH, ...ids] = process.argv.slice(2);
const i3 = isolate('0.3.3-research-candidate', SCRATCH), i4 = isolate('0.3.4-research-candidate', SCRATCH, { requireManifest: false });
const E3 = await loadEngine(i3), E4 = await loadEngine(i4);
const A3 = armsFor('0.3.3-research-candidate'), A4 = armsFor('0.3.4-research-candidate');
const arms = ['A3', 'A4', 'A5', 'A3R', 'A4R'];
const line = (label, f) => console.log(label.padEnd(14), arms.map((a) => a + ':' + f(a)).join(' '));
if (ids[0] === '--vf01') {
  const tally = {};
  for (const v of variants.filter((x) => (x.type === 'V2' || x.type === 'V6') && x.constructible && x.base_reference === 'UNGROUNDED')) {
    for (const a of ['A3', 'A4', 'A3R', 'A4R']) { const m = storedVariantMock(MOCK_OF_ARM[a], v.variant_id);
      const r3 = score(E3, A3.find((x) => x.id === a), { text: v.text, id: v.base_id, cand: m, fixtureId: v.variant_id });
      const r4 = score(E4, A4.find((x) => x.id === a), { text: v.text, id: v.base_id, cand: relabel(m, E4.research.RESEARCH_PROMPT_VERSION), fixtureId: v.variant_id });
      const k = v.type + '/' + v.partition + '/' + a; tally[k] = tally[k] || { n: 0, clear033: 0, clear034: 0, flag034: 0 }; tally[k].n++; if (r3.e1 === 'CLEAR') tally[k].clear033++; if (r4.e1 === 'CLEAR') tally[k].clear034++; if (r4.e1 === 'FLAG') tally[k].flag034++; }
  }
  console.log(JSON.stringify(tally, null, 0));
} else {
  const list = ids.length ? ids : substantive.map((e) => e.source_id);
  for (const id of list) {
    const t = recordText(id), d = designedOf(id);
    const e3 = {}, e4 = {};
    for (const a of arms) { const m = storedMock(MOCK_OF_ARM[a], id);
      e3[a] = score(E3, A3.find((x) => x.id === a), { text: t, id, cand: m, designed: d }).e1;
      const r = score(E4, A4.find((x) => x.id === a), { text: t, id, cand: relabel(m, E4.research.RESEARCH_PROMPT_VERSION), designed: d }); e4[a] = r.e1 + (r.disposition === 'technical_failure' ? '!TF:' + JSON.stringify(r.mechanical.concat(r.guards)).slice(0, 200) + (r.error || '') : ''); }
    console.log(id.padEnd(6), (d ? d.e1 : '?').padEnd(11), arms.map((a) => a + ' ' + e3[a].slice(0, 4) + '>' + e4[a].slice(0, 4) + (e4[a].includes('!TF') ? e4[a].slice(4) : '')).join(' | '));
  }
}
console.log('network', attempts.length, 'released', JSON.stringify(i3.release()), JSON.stringify(i4.release()));

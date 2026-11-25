#!/usr/bin/env node
// Runs the EU AI Act lens on the sealed set tests/ds-n1/eu-ai-act-eval/ and
// compares each check with the answer key. Usage: node tests/ds-n1/eval-eu-ai-act.mjs [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { euAiActLens, EU_LENS_VERSION } from '../../lib/ds-n1/eu-ai-act.mjs';

const dir = new URL('./eu-ai-act-eval/', import.meta.url);
const raw = (f) => readFileSync(new URL(f, dir));
const sealed = Object.fromEntries(readFileSync(new URL('SEALED.sha256', dir), 'utf8').trim().split('\n').map((l) => l.split(/\s+/).reverse()));
for (const f of ['records.json', 'answer-key.json']) if (createHash('sha256').update(raw(f)).digest('hex') !== sealed[f]) throw new Error(`${f} does not match its sealed hash`);
const set = JSON.parse(raw('records.json'));
const key = JSON.parse(raw('answer-key.json'));

export function wilson(k, n, z = 1.96) {
  if (!n) return null;
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.round(((c - h) / d) * 1000) / 1000, Math.round(((c + h) / d) * 1000) / 1000];
}
const CODE = { SHOWN_SUPPORTED: 'S', STATED_UNSUPPORTED: 'U', NOT_SHOWN: 'N', NOT_APPLICABLE: 'NA' };

const rows = [];
for (const r of set.records) {
  const { record } = extractRecord({ record_id: r.id, title: r.title, record_class: 'ai_action_authorization', text: r.text, sources: r.sources.map((s) => ({ ...s, version: 'v1' })) });
  const lens = euAiActLens(record);
  for (const c of lens.checks) {
    const truth = key.truth[r.id][c.id];
    let got = CODE[c.status];
    if (c.flag === 'below_six_months') got += '-SHORT';
    rows.push({ record: r.id, check: c.id, truth, got, agree: truth === got });
  }
}
const n = rows.length, agree = rows.filter((x) => x.agree).length;
// The costly error: crediting a point as backed up when the record does not show it, or shows it without support.
const overCredit = rows.filter((x) => x.got === 'S' && x.truth !== 'S');
const missedSupported = rows.filter((x) => x.truth === 'S' && x.got !== 'S');
const out = {
  set: set.set, lens: EU_LENS_VERSION, note: set.note,
  agreement: { k: agree, n, wilson95: wilson(agree, n) },
  wrongly_credited_as_shown_and_supported: { k: overCredit.length, n: rows.filter((x) => x.truth !== 'S').length, cases: overCredit.map((x) => `${x.record}.${x.check}: truth ${x.truth}`) },
  supported_points_not_credited: { k: missedSupported.length, n: rows.filter((x) => x.truth === 'S').length, cases: missedSupported.map((x) => `${x.record}.${x.check}: got ${x.got}`) },
  disagreements: rows.filter((x) => !x.agree).map((x) => `${x.record}.${x.check}: truth ${x.truth}, lens ${x.got}`),
};
console.log(JSON.stringify(out, null, 2));
if (process.argv.includes('--write')) writeFileSync(new URL('../EU_AI_ACT_EVAL.json', dir), JSON.stringify(out, null, 2) + '\n');

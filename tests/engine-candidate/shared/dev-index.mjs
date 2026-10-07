// Loads every development text from a FIXED list of development locations, and nothing else.
// It takes no path argument, so it cannot be pointed at a sealed holdout or any other folder,
// and it only reads.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = new URL('../', import.meta.url).pathname;          // tests/engine-candidate/
export const DEVELOPMENT_LOCATIONS = Object.freeze([
  'fixtures/',
  'regression/cases.json',
  'corpus/v0.1.0/records/',
  'confirmation/v0.1.0/cases.json',
  '../../tools/frozen-demo/corpus/v0.1.0/',
]);

export function loadDevelopmentTexts() {
  const out = [];
  for (const f of readdirSync(join(BASE, 'fixtures')).sort()) out.push({ name: 'fixtures/' + f, text: readFileSync(join(BASE, 'fixtures', f), 'utf8') });
  for (const c of JSON.parse(readFileSync(join(BASE, 'regression/cases.json'), 'utf8')).cases) out.push({ name: 'regression/' + c.id, text: c.text });
  const idx = JSON.parse(readFileSync(join(BASE, 'corpus/v0.1.0/INDEX.json'), 'utf8'));
  for (const id of idx.records) out.push({ name: 'corpus/v0.1.0/' + id, text: JSON.parse(readFileSync(join(BASE, 'corpus/v0.1.0/records', id + '.json'), 'utf8')).text });
  for (const c of JSON.parse(readFileSync(join(BASE, 'confirmation/v0.1.0/cases.json'), 'utf8')).cases) out.push({ name: 'confirmation/v0.1.0/' + c.id, text: c.text });
  // The frozen synthetic demonstration corpus (added 2026-10-07) is development material too.
  const FD = join(BASE, '../../tools/frozen-demo/corpus/v0.1.0/');
  for (const e of JSON.parse(readFileSync(FD + 'INDEX.json', 'utf8')).records) out.push({ name: 'frozen-demo/v0.1.0/' + e.record_id, text: JSON.parse(readFileSync(FD + e.record_id + '.json', 'utf8')).text });
  return out;
}

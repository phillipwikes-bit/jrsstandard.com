// 156-record study: balanced allocation for the reviewer-benefit protocol (protocol/REVIEWER_BENEFIT_PROTOCOL.md).
// 60 evaluation records, three conditions, 20 records each. Condition = (family index + type index) mod 3, so every
// family and every construction type is spread over the three conditions; presentation order is a seeded shuffle.
// No participant is recruited or contacted by this script or by the study. NOT RUN.
// Usage: node tools/build-benefit-allocation.mjs   (writes sealed/BENEFIT_ALLOCATION.json and forms/BENEFIT_SESSION_SHEET.csv)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES } from './synthetic-spec.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const f of ['sealed/BENEFIT_ALLOCATION.json', 'forms/BENEFIT_SESSION_SHEET.csv']) if (existsSync(join(PKG, f))) { console.error(f + ' exists'); process.exit(2); }
const SEED = 1561027;
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const key = JSON.parse(readFileSync(join(PKG, 'sealed', 'BLIND_KEY.json'), 'utf8')).rows;
const CONDITIONS = ['H_record_only', 'E_engine_without_controls', 'EC_engine_with_controls'];
const fams = ['F05', 'F06', 'F07', 'F08', 'F09', 'F10'];
const rows = inv.entries.filter((e) => e.cohort === 'synthetic_record' && e.partition === 'evaluation').map((e) => {
  const c = CONDITIONS[(fams.indexOf(e.links.family) + TYPES.indexOf(e.links.type)) % 3];
  return { source_id: e.source_id, blind_id: key.find((k) => k.source_id === e.source_id).blind_id, family: e.links.family, type: e.links.type, condition: c };
});
for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
rows.forEach((r, i) => { r.order = i + 1; });
const balance = {}; for (const r of rows) { balance[r.condition] = balance[r.condition] || { records: 0, families: {}, types: {} }; const b = balance[r.condition]; b.records++; b.families[r.family] = (b.families[r.family] || 0) + 1; b.types[r.type] = (b.types[r.type] || 0) + 1; }
writeFileSync(join(PKG, 'sealed', 'BENEFIT_ALLOCATION.json'), JSON.stringify({ format: 'jrs-study-156-benefit-allocation/1.0.0', seed: SEED, status: 'NOT RUN. No participant recruited or contacted.', conditions: CONDITIONS, balance, rows }, null, 2) + '\n', { flag: 'wx' });
const csv = ['order,blind_id,condition,e1_label,confidence_1_to_5,minutes,controls_read,usefulness_1_to_5,notes', ...rows.map((r) => [r.order, r.blind_id, r.condition, '', '', '', '', '', ''].join(','))];
writeFileSync(join(PKG, 'forms', 'BENEFIT_SESSION_SHEET.csv'), csv.join('\n') + '\n', { flag: 'wx' });
console.log(JSON.stringify(Object.fromEntries(Object.entries(balance).map(([k, v]) => [k, v.records]))));

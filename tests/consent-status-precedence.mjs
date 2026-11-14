// Regression for the historical coauthor-form-count conflation.
// Deliberately preserve dated 0-of-3 facts and old evidence; test the controlling interpretation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root, p), 'utf8');

const ledger = read('docs/enterprise-diligence/EVIDENCE_LEDGER.md');
for (const [id, name, date] of [
  ['E-002', 'Tanvi Pokhriyal', '2026-08-22'],
  ['E-003', 'Stacyann Young', '2026-08-27']
]) {
  const line = ledger.split('\n').find(x => x.startsWith('| ' + id + ' |'));
  assert.ok(line, id + ': evidence line must exist');
  for (const value of [name, date, 'Consent executed', 'true']) {
    assert.ok(line.includes(value), id + ': missing ' + value);
  }
}
const e005 = ledger.split('\n').find(x => x.startsWith('| E-005 |'));
assert.ok(e005 && e005.includes('confirmed 0') && e005.includes('contributor instrument instead'),
  'E-005 must distinguish the coauthor-only count from other contributor consents');

const paths = [
  'CLAUDE.md',
  'docs/enterprise-diligence/JRS_MASTER_ASSET_EVIDENCE_AND_CHAIN_OF_TITLE_REGISTER.md',
  'docs/enterprise-diligence/CHAIN_OF_TITLE_STATUS.md',
  'docs/enterprise-diligence/ASSET_PERSON_EVIDENCE_CROSS_REFERENCE.md',
  'docs/enterprise-diligence/RIGHTS_AND_AGREEMENTS_EVIDENCE_REGISTER.md',
  'docs/enterprise-diligence/ASSET_AND_CHAIN_OF_TITLE_EVIDENCE_COMPLETION_UPDATE.md',
  'docs/enterprise-diligence/ASSET_AND_CHAIN_OF_TITLE_REGISTER.md',
  'docs/enterprise-diligence/EVIDENCE_LEDGER.md',
  'docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md'
];

for (const path of paths) {
  const document = read(path);
  const start = '<!-- CONSENT_STATUS_PRECEDENCE_2026_10_30_START -->';
  const end = '<!-- CONSENT_STATUS_PRECEDENCE_2026_10_30_END -->';
  const a = document.indexOf(start), b = document.indexOf(end);
  assert.ok(a >= 0 && b > a, path + ': current controlling interpretation is missing');
  const current = document.slice(a + start.length, b);
  for (const needle of ['Tanvi Pokhriyal', 'Stacyann Young', 'E-002', 'E-003', '2026-08-22', '2026-08-27', '0 of 3', 'Ubayet Hossain']) {
    assert.ok(current.includes(needle), path + ': missing controlling fact ' + needle);
  }
  assert.ok(/(contributor consent|contributor-consent)/i.test(current), path + ': contributor-consent scope missing');
  assert.ok(/(only|alone)/i.test(current), path + ': distinct coauthor count not qualified');
  assert.ok(/(assignment|commercial)/i.test(current), path + ': rights boundary missing');
  assert.ok(!/\b(?:Tanvi|Stacyann)\s+(?:has no consent|did not consent|lacks consent)\b/i.test(current),
    path + ': false consent claim in controlling block');
}
console.log('PASS: contributor consent E-002/E-003 recognized; E-005 scoped to coauthor form; nine controlling documents consistent.');

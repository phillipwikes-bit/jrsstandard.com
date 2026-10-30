import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

// The exact user-approved public product name is "Decision Spellchecker".
// This is deliberately a display-copy check. Do not rename historical paths,
// data category codes, versioned research, or original filenames.
const pages=[
  'index.html',
  'contact.html',
  'privacy-notice.html',
  'programme-status-9872fb93cc94.html'
];
let passed=0;
for(const filename of pages) {
  const source=readFileSync(filename,'utf8');
  assert.ok(source.includes('Decision Spellchecker'),filename+' is missing the canonical name');
  const unqualified=source.match(/(?<!Decision )\bSpellchecker\b/g);
  assert.equal(unqualified,null,filename+' contains a standalone product name');
  passed++;
}
const contact=readFileSync('contact.html','utf8');
assert.ok(contact.includes('Prospective Decision Spellchecker interest'));
assert.ok(contact.includes('value="commercial"')); // preserve schema/metrics key
passed++;
const dash=readFileSync('programme-status-9872fb93cc94.html','utf8');
assert.ok(dash.includes("commercial:'Prospective Decision Spellchecker'"));
assert.ok(dash.includes('/api/site-inquiry-stats'));
passed++;
const impl=readFileSync('docs/implementation/SPELLCHECKER_SITE_PHASE1_EXECUTION_2026-10-30.md','utf8');
const ops=readFileSync('docs/operations/SPELLCHECKER_SITE_OWNER_ACCESS_AND_INQUIRY_CUTOVER_2026-10-30.md','utf8');
assert.ok(impl.startsWith('# Decision Spellchecker / JRS'));
assert.ok(ops.startsWith('# Decision Spellchecker / JRS'));
assert.ok(ops.includes('Commercial software identity: **Decision Spellchecker**'));
passed++;
const rule='docs/implementation/DECISION_SPELLCHECKER_PRODUCT_NAMING_STANDARD_2026-10-30.md';
assert.ok(existsSync(rule));
const text=readFileSync(rule,'utf8');
assert.ok(text.startsWith('# Decision Spellchecker:'));
assert.ok(text.includes('Justification Review Standard (JRS)'));
assert.ok(text.includes('not** an approval to merge'));
passed++;
console.log('PASS '+passed+' Decision Spellchecker naming and provenance checks');

// Limited semantic and documentary accessibility preflight.
// A passing test is NOT a WCAG/PDF-UA certification or screen-reader acceptance.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
for (const file of ['editions.html', 'organization.html']) {
  const html = read(file);
  const articleHeading = [...html.matchAll(/<article><h([1-6])>/g)].map(m => Number(m[1]));
  assert.deepEqual(articleHeading, [2, 2, 2, 2], file + ': cards must be second-level headings');
  const levels = [...html.matchAll(/<h([1-6])(?:\s[^>]*)?>/g)].map(m => Number(m[1]));
  assert.equal(levels.filter(n => n === 1).length, 1, file + ': one page heading');
  for (let i = 1; i < levels.length; i++) {
    assert.ok(levels[i] - levels[i-1] <= 1, file + ': skipped heading level at index ' + i);
  }
  assert.match(html, /href="#main-content"/);
  assert.match(html, /<main id="main-content"/);
  assert.match(html, /src="\/assets\/jrs-mobile-navigation\.js"/);
  assert.match(html, /src="\/assets\/jrs-engagement\.js"/);
}
const css = read('assets/jrs-a-pathways.css');
assert.match(css, /\.jrs-guide-grid article h2\{/);
assert.match(css, /prefers-reduced-motion/);
const edition = read('editions.html');
assert.match(edition, /Published PDF tagging and reading order have not been independently certified/);
assert.match(edition, /href="contact\.html\?category=accessibility"/);
const resourceIndex = read('resources.html');
assert.match(resourceIndex, /Accessibility of PDF publications:/);
assert.match(resourceIndex, /href="contact\.html\?category=accessibility"/);
assert.match(resourceIndex, /not a verified equivalent of the Standard PDF/);
const contact = read('contact.html');
const inquiry = read('api/site-inquiry.js');
assert.match(contact, /<option value="accessibility">/);
assert.match(contact, /categories\.includes\(requested\)/);
assert.ok(inquiry.includes("'accessibility'"), 'accessibility request category must reach the existing form');
const manifest = JSON.parse(read('docs/JRS_Published_PDF_Identity_Manifest.json'));
assert.equal(manifest.assets.length, 9);
const absent = [];
for (const {file} of manifest.assets) {
  const pdf = readFileSync(new URL('../' + file, import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-');
  // A raw marker check is a triage aid, not a validator of PDF semantics.
  const structureTreeMarker = pdf.includes(Buffer.from('/StructTreeRoot'));
  if (!structureTreeMarker) absent.push(file);
  console.log('PDF_STRUCTURE_PREFLIGHT ' + JSON.stringify({
    file, structureTreeMarker, status: structureTreeMarker ? 'MANUAL_REVIEW_REQUIRED' : 'TAG_TREE_NOT_DETECTED'
  }));
}
console.log('PASS: two public guide pages have logical heading order, navigation, focus targets and accessible-format contact routing.');
console.log('PDF ACCESSIBILITY NOT CERTIFIED: ' + absent.length +
  ' of ' + manifest.assets.length + ' published PDFs lack a detected structure-tree marker. ' +
  'Tag presence alone would not establish correct reading order or WCAG conformance.');
console.log('NOT ASSESSED: VoiceOver, PDF/UA, every WCAG criterion, full-site independent QA and protected-preview authentication.');

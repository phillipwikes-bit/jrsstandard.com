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
const catalogScript = read('assets/jrs-resource-catalog.js');
assert.match(catalogScript, /focusedEntry&&focusedEntry\.hidden\)query\.focus\(\)/,
  'filter changes must recover keyboard focus when an active resource is hidden');
assert.match(catalogScript, /count\.textContent=shown\+/,
  'filtered resource count must remain exposed to assistive technology');
const resourceIndex = read('resources.html');
assert.match(resourceIndex, /Accessibility of PDF publications:/);
assert.match(resourceIndex, /href="contact\.html\?category=accessibility"/);
assert.match(resourceIndex, /not a verified equivalent of the Standard PDF/);
const researchSummary = read('research-summary.html');
assert.match(researchSummary, /PDF accessibility and editions/);
assert.match(researchSummary, /href="contact\.html\?category=accessibility"/);
assert.match(researchSummary, /have not been independently verified for tagged reading order/);
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

const trainingCompletion = read('training.html');
assert.match(trainingCompletion, /<canvas id="cert-canvas" aria-hidden="true"/);
assert.match(trainingCompletion, /id="cert-accessible-summary" role="status" aria-live="polite" hidden/);
assert.match(trainingCompletion, /summary\.textContent = 'JRS Reviewer Training, record of completion/);
assert.match(trainingCompletion, /addEventListener\('input', invalidateCert\)/);
assert.match(trainingCompletion, /requestedName\) return;/);
const interactionCoverage = read('tests/jrs-interaction-a11y-browser.html');
assert.match(interactionCoverage, /id:'training-completion-text'/);
assert.match(interactionCoverage, /'wcag22a'/);
for(const required of ['filter-reset-restored','menu-escape-focus-restored','module-collapse-restored','dialog-escape-focus-restored']){
  assert.ok(interactionCoverage.includes(required),'dynamic-state keyboard dismissal assurance missing: '+required);
}
assert.match(read('tests/jrs-browser-gate-check.py'), /missing keyboard focus\/dismissal evidence/);

const trainingPalette = read('assets/jrs-institutional-reference.css');
const contrastActionSelector = /#cert-section button\[onclick="generateCert\(\)"\]\{[\s\S]*?background:#173d5b!important;color:#fff!important/;
assert.match(trainingPalette, contrastActionSelector,
  'the previously hidden completion action must have an explicit high-contrast appearance');

// Expanded 24-route axe scan identified links distinguishable only by color
// on the reference and governance pages. Prevent recurrence in the source.
{
 const reference=read('reference/index.html');
 const governance=read('compliance.html');
 assert.match(reference,/body\.jrs-institutional main \.note a\[href\]\{text-decoration:underline!important/,
  'reference note must visibly underline its inline Standard link');
 assert.match(governance,/body\.jrs-institutional main p a\[href\]:not\(\.btn\)\{text-decoration:underline!important/,
  'governance prose links must be recognizable without relying on color');
 assert.match(reference,/href="\/jrsstandard\.html">jrsstandard\.html<\/a>/,
  'reference must retain original Standard route');
 for(const href of ['codebook.html','research.html'])
  assert.ok(governance.includes('href="'+href+'"'),'governance must retain linked methodology evidence: '+href);
 console.log('PASS: prose links are underlined without changing publication routes or navigation styles.');
}


// Additional 34-route axe coverage identified breadcrumb and control contrast
// failures previously outside the sampled pages. Lock the scoped repairs.
{
 const shared=read('assets/jrs-institutional-reference.css');
 assert.match(shared,/body\.jrs-institutional main \.crumb a\[href\]\{[\s\S]*?text-decoration:underline!important/,
  'reference breadcrumbs require persistent non-colour link identification');
 const reviewer=read('reviewer/index.html');
 assert.match(reviewer,/body\.jrs-institutional main a\.cta:not\(\.ghost\)\{background:#173d5b!important;color:#fff!important\}/,
  'reviewer training primary CTA requires verified navy/white contrast');
 const security=read('security.html');
 assert.match(security,/class="jrs-technical-summary"/,
  'security technical note requires a stable, visible disclosure control');
 assert.match(security,/body\.jrs-institutional main \.jrs-technical-summary\{color:#173d5b!important;font-weight:700\}/,
  'security disclosure summary requires institutional high contrast');
 const finding=read('finding.html');
 assert.match(finding,/body\.jrs-institutional main #resp-btn\{background:#173d5b!important;color:#fff!important/,
  'research response button requires institutional high contrast');
 assert.match(finding,/id="resp-btn" class="respbtn" onclick="submitResponse\(\)"/,
  'original response handler and control must remain unchanged');
 console.log('PASS: expanded accessibility issue controls retained on reference, reviewer, security and finding pages.');
}


// Full 60-route audit: keyboard access to horizontally scrollable specification
// tables, non-color email links, and accessible public dead-end navigation.
{
 const manifest=read('manifest.html');
 for(const label of ['Public and controlled-development positions table','Specification components table']){
  assert.ok(manifest.includes('role="region" aria-label="'+label+'" tabindex="0"'),
   'manifest table scroll region must be keyboard reachable with a unique name: '+label);
 }
 const privacy=read('privacy.html');
 assert.match(privacy,/\.legal p a\{color:var\(--accent\);text-decoration:underline!important/,
  'privacy email links need non-color identification');
 const shared=read('assets/jrs-institutional-reference.css');
 assert.match(shared,/body\.jrs-institutional\.jrs-error-route footer\.site-footer a\[href\]\{[\s\S]*?color:#173d5b!important;background:transparent!important;[\s\S]*?text-decoration:underline!important/,
  'retired and not-found footer navigation must remove legacy gold link backgrounds and remain underlined');
 assert.match(shared,/body\.jrs-institutional\.jrs-error-route footer\.site-footer a\[href="index\.html"\]\{[\s\S]*?min-width:44px!important/,
  'retired Home link needs a minimum 44px width without expanding entire footer');
 const people=read('people.html');
 assert.match(people,/This page has moved\./,
  'retired people route must remain non-disclosing');
 assert.doesNotMatch(people,/href="\/people\/|mailto:[^" ]+@/,
  'retired people route must not reveal identities or private contacts');
 console.log('PASS: accessible manifest table scrolling, email link identification, and error-page navigation.');
}

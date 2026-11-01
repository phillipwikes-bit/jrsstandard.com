// JRS institutional reference release gate.
// Source-only assertions. Not a substitute for rendered accessibility testing.
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path),'utf8');
const theme='assets/jrs-institutional-reference.css';
assert.ok(existsSync(join(root,theme)),'institutional stylesheet must exist');
const css=read(theme);
for(const token of [
 'body.jrs-institutional','--jrs-ink:','--jrs-navy:',
 '.jr-hero-grid','.jr-paths','.jr-five','.jr-publications',
 'focus-visible','@media(max-width:650px)','prefers-reduced-motion','@media print'
])assert.ok(css.includes(token),'missing institutional reference system token: '+token);
let braces=0;
for(const c of css){if(c==='{')braces++;if(c==='}')braces--;assert.ok(braces>=0,'unbalanced CSS closing brace');}
assert.equal(braces,0,'unbalanced CSS blocks');

const pages=[
 'index.html','resources.html','research.html','investigator-guides.html',
 'manifest.html','about.html','contact.html','jrsstandard.html','training.html',
 'check.html','simulations.html','decision-reconstruction-risk.html',
 'research-summary.html','methodology.html','evidence-ledger.html','questions.html',
 'research-register.html','privacy.html','terms.html','codebook.html'
];
for(const p of pages){
 const h=read(p);
 assert.ok(h.includes('<body class="jrs-institutional'),p+' missing opt-in publication theme');
 assert.ok(h.includes('<link rel="stylesheet" href="/assets/jrs-institutional-reference.css">'),
   p+' missing theme link');
 assert.ok(h.includes('viewport'),p+' missing mobile viewport');
 assert.doesNotMatch(h,/id="pa-input"|fetch\(['"]\/api\/review['"]/i,
   p+' must not expose retired public assessor');
}

// Complete the system across the public sitemap and reference corpus.
const additionalPages=[
 'implementation-scenarios.html',
 'operational-boundaries.html',
 'reference/index.html',
 'reference/ai-assisted-record-failure-modes/index.html',
 'reference/ai-verification-controls/index.html',
 'reference/decision-context-loss/index.html',
 'reference/deployment-models/index.html',
 'reference/documentation-risk-tiers/index.html',
 'reference/escalation-triggers/index.html',
 'reference/field-conditions/index.html',
 'reference/implementation-maturity-levels/index.html',
 'reference/later-review-failure-cascades/index.html',
 'reference/missing-chronology/index.html',
 'reference/record-survivability/index.html',
 'reference/reviewer-responsibility-boundaries/index.html',
 'reference/reviewer-worksheet/index.html',
 'reference/second-line-review-model/index.html',
 'reference/traveler-test/index.html',
 'reference/unsupported-generalization/index.html',
 'reviewer/index.html',
 'ai-governance-record.html',
 'compliance.html',
 'datasets.html',
 'finding.html',
 'results.html',
 'why-good-decisions-fail.html',
 'privacy-notice.html',
];
for(const p of additionalPages){
 const h=read(p);
 assert.ok(h.includes('<body class="jrs-institutional'),p+' missing institutional body opt-in');
 assert.ok(h.includes('<link rel="stylesheet" href="/assets/jrs-institutional-reference.css">'),p+' missing shared theme');
 assert.ok(h.includes('viewport'),p+' missing responsive viewport');
}

// A stray build/tool warning before DOCTYPE forces the Standard into quirks mode.
for(const page of [...pages,...additionalPages]){
 const source=read(page).trimStart();
 assert.ok(/^<!doctype html>/i.test(source),
   page+' must begin with a real HTML doctype, without generated tool output or diagnostic banners');
 assert.ok(!source.includes('Warning: truncated output'),
   page+' must not contain connector output truncation markers');
}

const main=read('index.html');
for(const token of [
 '01 · Start here','02 · Use the method','03 · Examine the evidence','04 · Learn and practice',
 'Can the record explain the decision after its author is gone?',
 'Evidence must remain distinguishable from assurance.',
 'href="jrsstandard.html"','href="resources.html"','href="training.html"','href="research.html"',
 'href="investigator-guides.html"','href="manifest.html"'
])assert.ok(main.includes(token),'homepage missing core reference route/copy '+token);
for(const p of ['resources.html','investigator-guides.html','training.html']){
 const h=read(p);
 assert.ok(h.includes('investigator-guides.html'),p+' must link guide library');
}
assert.ok(read('training.html').includes('id="practice-guidance"'),
 'training must retain manual, non-submission practice guidance');
// Mobile Standard navigation must be collapsible, not a permanent 14-item list.
assert.ok(css.includes('JRS mobile navigation corrections, 2026-11-01') &&
 css.includes('.primary-nav-inner.nav-open') &&
 css.includes('jrs-nav-ready'),
 'mobile publication style must retain compact site nav and collapsible Standard sections');
const standard=read('jrsstandard.html');
assert.ok(standard.includes('toggleMobileNav()') &&
 standard.includes('id="primary-nav-items"') &&
 standard.includes('aria-expanded="false"'),
 'Standard mobile menu control and expanded state must remain wired');
assert.ok(standard.includes('showSection('),'Standard section interactions must remain intact');
assert.ok(standard.includes('<details>')&&standard.includes('jrs-publication-note-detail')&&
 standard.includes('Publication versions:')&&standard.includes('Archived implementation-kit inventory:'),
 'Version and retired-kit disclosures must remain available in accessible details');
assert.ok(!standard.includes('Available on the Operational References page.'),
 'Standard may not advertise unavailable retired implementation-kit assets');
for(const p of ['index.html','resources.html','research.html','investigator-guides.html',
 'jrsstandard.html','training.html']){
 assert.ok(read(p).includes('<!-- JRS SITE NAV v1 :: CANONICAL BLOCK.'),
   p+' missing canonical reference navigation');
}
for(const path of [
 'api/_owner-auth.js','programme-status-9872fb93cc94.html',
 'JRS_Investigator_Field_Guide_Employment.pdf',
 'JRS_Investigator_Field_Guide_FairHousing.pdf',
 'JRS_Investigator_Field_Guide_International.pdf'
])assert.ok(existsSync(join(root,path)),'preserve protected access or document '+path);
console.log('PASS: institutional reference system present on '+(pages.length+additionalPages.length)+
 ' pages, core paths and privacy boundaries preserved.');


// Structural remediation, 2026-11-01: no wrapped site nav with JS, prompt first actions, preserved editions.
const mobileNav=read('assets/jrs-mobile-navigation.js');
for(const token of ['aria-controls','aria-expanded','jrs-nav-ready','Escape','data-open','jrs-global-nav-toggle'])
 assert.ok(mobileNav.includes(token),'accessible global nav missing '+token);
for(const p of [...pages,...additionalPages]){
 assert.ok(read(p).includes('/assets/jrs-mobile-navigation.js'),p+' missing shared mobile navigation');
}
assert.ok(css.includes('nav.jrs-sitenav:not([data-open="true"])')&&
 css.includes('jrs-standard-entry-actions')&&css.includes('jrs-resource-primary-actions'),
 'responsive navigation and first-action CSS missing');
assert.ok(read('index.html').indexOf('class="jr-actions"')<
 read('index.html').indexOf('class="jr-intro"'),'homepage action should precede long intro');
assert.ok(read('resources.html').indexOf('jrs-resource-primary-actions')<
 read('resources.html').indexOf('class="access-note"'),'resources must expose tool before disclosures');
assert.ok(read('jrsstandard.html').includes('jrs-standard-entry-actions')&&
 read('jrsstandard.html').includes('jrs-standard-orientation')&&
 read('jrsstandard.html').includes('jrs-standard-page'),
 'Standard must show content and actions before optional orientation');
assert.ok(read('training.html').indexOf('jrs-training-lead')<
 read('training.html').indexOf('class="hero-sub"'),
 'training modules must be accessible ahead of long explanation');

assert.ok(css.includes('jrs-standard-page .util-bar{display:none!important}'),
 'Standard must not show a third competing navigation toolbar');
assert.ok(read('training.html').includes('jrs-training-context') &&
 read('training.html').includes('aria-label="JRS home"'),
 'training must retain explanation while enabling a compact header and home link');

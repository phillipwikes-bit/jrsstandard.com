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
const standard=read('jrsstandard.html');
assert.ok(standard.includes('showSection('),'Standard section interactions must remain intact');
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
console.log('PASS: institutional reference system present on '+pages.length+
 ' pages, core paths and privacy boundaries preserved.');

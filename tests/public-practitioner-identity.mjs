// Public JRS professional-reference quality gate. Source-level verification.
// This is not a browser, WCAG 2.2 certification, or a live privacy assessment.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const visible=s=>s.replace(/<!--[\s\S]*?-->/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
const mainPages=['index.html','jrsstandard.html','resources.html','about.html','research.html',
 'research-register.html','research-summary.html','investigator-guides.html','training.html',
 'simulations.html','codebook.html','enterprise.html','operational-boundaries.html'];
for(const path of mainPages){
 const source=read(path),html=visible(source);
 assert.doesNotMatch(html,/Review Engine|Open AI-Assisted Record Reviewer|licensed JRS Review Engine API/i,
  'public practitioner page still advertises a development product: '+path);
 assert.doesNotMatch(html,/href=["']review-engine\.html/i,'promotional Engine link in '+path);
 assert.ok(html.includes('<main') || /id=[\"']main-content[\"'][^>]*role=[\"']main[\"']/.test(html) || /role=[\"']main[\"'][^>]*id=[\"']main-content[\"']/.test(html) || html.includes('id=\"main-content\"'), 'public page missing a content landmark: '+path);
}
const home=read('index.html');
for(const route of ['01 · Start here','02 · Use the method','03 · Examine the evidence','04 · Learn and practice'])
 assert.ok(home.includes(route),'missing practitioner path '+route);
for(const dest of ['jrsstandard.html','resources.html','research.html','training.html'])
 assert.ok(home.includes('href="'+dest+'"'),'homepage missing route '+dest);
assert.ok(!home.includes('Review Engine'),'homepage must be method-first, including source and meta');
const training=read('training.html');
for(const anchor of ['id="training-modules"','id="simulator"','id="practice-guidance"'])
 assert.ok(training.includes(anchor),'training missing destination '+anchor);
for(const bad of ['id="pa-input"','record-review-workspace','runAssessment(','/api/review'])
 assert.ok(!training.includes(bad),'unavailable record-upload interface remains: '+bad);
assert.ok(training.includes('Practice with constructed records'));
assert.ok(read('api/review.js').includes('unavailable(req, res)'),'unreleased API boundary altered');
const simulations=read('simulations.html');
assert.ok(simulations.includes('Open the manual review check'));
assert.ok(!simulations.includes('Open AI-Assisted Record Reviewer'));
for(const path of ['investigator-guides.html','resources.html']){
 const s=read(path);
 assert.ok(s.includes('research.html'),'research limit navigation lost: '+path);
}
for(const f of ['JRS_Investigator_Field_Guide_Employment.pdf',
 'JRS_Investigator_Field_Guide_FairHousing.pdf','JRS_Investigator_Field_Guide_International.pdf'])
 assert.ok(read('investigator-guides.html').includes(f),'PDF reference removed: '+f);
assert.match(read('contact.html'),/https:\/\/formspree\.io\/f\/mreddwdg/,'contact delivery changed');
assert.ok(read('research.html').includes('href="evidence-ledger.html"'),'research evidence trace lost');
assert.ok(read('resources.html').includes('href="manifest.html"'),'technical schema trace lost');
const redirects=JSON.parse(read('vercel.json')).redirects;
for(const direct of ['/manifest.html','/security.html','/platform-evaluation-001.html']){
 assert.ok(!redirects.some(r=>r.source===direct),'public reference incorrectly redirected: '+direct);
}
for(const r of redirects){
 assert.doesNotMatch(String(r.destination),/review-engine\.html/,'obsolete route promotes unavailable software: '+r.source);
}
assert.equal(redirects.find(r=>r.source==='/openapi')?.destination,'/manifest.html');
assert.equal(redirects.find(r=>r.source==='/submit-record.html')?.destination,'/resources.html');
assert.equal(redirects.find(r=>r.source==='/sandbox')?.destination,'/resources.html');
assert.ok(read('manifest.html').includes('jrs-decision-reconstruction-manifest-v1.0.1.schema.json'),
 'technical specification did not survive as direct public reference');
assert.ok(existsSync(new URL('../review-engine.html',import.meta.url)),'archival technical evidence removed');
assert.match(read('review-engine.html'),/name="robots" content="noindex,nofollow,noarchive"/);
assert.doesNotMatch(read('sitemap.xml'),/\/(?:review-engine|pilot|platform-evaluation-001)\.html/);
for(const path of ['security.html','engagement.html']){
 assert.match(read(path),/name="robots" content="noindex,nofollow"/,'historical page indexed: '+path);
}
assert.ok(read('security.html').includes('Archive, not an active interface.'));
const css=read('assets/jrs-professional-accessibility.css');
for(const token of ['min-height:44px','font-size:16px!important','prefers-reduced-motion','JRS practitioner readability v2026.11'])
 assert.ok(css.includes(token),'shared accessibility/readability rule missing '+token);
console.log('PASS: JRS method-first navigation, active-tool scope, source integrity, archival boundaries and readable styling.');

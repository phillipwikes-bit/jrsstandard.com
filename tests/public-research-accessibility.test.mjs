import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const hub=read('research.html'),full=read('research-register.html'),home=read('index.html');
const css=read('assets/jrs-professional-accessibility.css');
const keyboard=read('assets/jrs-keyboard-controls.js');
const asset=read('api/asset-stats.js');
const dashboard=read('programme-status-9872fb93cc94.html');
const guides=read('investigator-guides.html');
const contact=read('contact.html');
test('research hub separates four professional research tasks',()=>{
 for(const t of ['Findings and limitations','Study methods','Evidence and provenance','Open questions'])assert.ok(hub.includes(t),t);
 for(const p of ['research-summary.html','methodology.html','evidence-ledger.html','questions.html'])assert.ok(hub.includes('href="'+p+'"'),p);
});
test('research evidence and limits remain explicit',()=>{
 for(const s of ['83.9%','36 experts','16 experts','58 reviewers','384 graded reads','constructed','not been established'])assert.ok(hub.includes(s),s);
 assert.ok(hub.includes('95% participant-level CI 72.7% to 95.1%'));
});
test('old research register remains accessible and preserves reliability caveat',()=>{
 assert.ok(full.includes('Gwet'));assert.ok(full.includes('Detailed research register.'));
 assert.ok(full.includes('cross-vendor'));
 assert.ok(hub.includes('href="research-register.html"'));
});
test('research category events are constrained and do not collect person data',()=>{
 for(const tag of ['findings','methods','provenance','open-questions','full-register','aggregate-datasets','participation-results'])assert.ok(hub.includes('data-research-category="'+tag+'"'));
 assert.ok(hub.includes("src:'research-hub'"));
 assert.ok(!/meta:\s*\{[^}]*email/i.test(hub));
});
test('dashboard aggregation counts category selections only',()=>{
 assert.ok(asset.includes('research_navigation:'));
 assert.ok(asset.includes("p.src!=='research-hub'"));
 assert.ok(asset.includes("p.origin!=='/research.html'"));
 assert.ok(asset.includes('researchCategoryTotal++'));
 assert.ok(asset.includes("Not page views, unique visitors"));
});
test('public release does not include modified owner-private dashboard page',()=>{
 assert.ok(!dashboard.includes('id="research-engagement"'));
});
test('home offers four clear routes and preserves access to free guides',()=>{
 for(const s of ['01 · Start here','02 · Use the method','03 · Examine the evidence','04 · Technical reference','Open the three field guides']){
  assert.ok(home.includes(s), 'missing path or free-guide access: ' + s);
 }
 for(const link of ['jrsstandard.html','resources.html','research.html','review-engine.html','investigator-guides.html']){
  assert.ok(home.includes('href="'+link+'"'), 'missing public link: ' + link);
 }
});
test('shared accessibility style addresses nav, focus and motion',()=>{
 assert.match(css,/:focus-visible/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/font-size:16px!important/);
});
test('keyboard shim activates existing nonnative cards on enter and space',()=>{
 assert.match(keyboard,/setAttribute\('role','button'\)/);
 assert.match(keyboard,/setAttribute\('tabindex','0'\)/);
 assert.match(keyboard,/el\.click\(\)/);
});
test('shared CSS installed on leading public pages',()=>{
 for(const p of ['index.html','investigator-guides.html','resources.html','research.html','training.html','jrsstandard.html','contact.html']){
  assert.ok(read(p).includes('jrs-professional-accessibility.css'),p);
 }
});
test('public expert designation and direct PDFs retained',()=>{
 assert.ok(guides.includes('36</span> independent experts'));
 for(const f of ['JRS_Investigator_Field_Guide_Employment.pdf','JRS_Investigator_Field_Guide_FairHousing.pdf','JRS_Investigator_Field_Guide_International.pdf'])assert.ok(guides.includes(f));
});
test('existing Formspree contact delivery remains installed',()=>{
 assert.ok(contact.includes('https://formspree.io/f/mreddwdg'));
 assert.ok(contact.includes('id="jrs-inquiry"'));
 assert.ok(read('api/site-inquiry.js').includes('https://formspree.io/f/mreddwdg'));
});

test('research evidence links do not redirect back to the overview',()=>{
 const c=JSON.parse(read('vercel.json'));
 for(const p of ['/research-summary.html','/evidence-ledger.html','/datasets.html']){
  assert.ok(!c.redirects.some(x=>x.source===p),p);
 }
 assert.equal(c.redirects.find(x=>x.source==='/evidence-ledger')?.destination,'/evidence-ledger.html');
 assert.equal(c.redirects.find(x=>x.source==='/datasets')?.destination,'/datasets.html');
});

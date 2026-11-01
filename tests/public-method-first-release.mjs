// Method-first public site release gate.
// Source-based regression; does not certify deployed behavior, user accessibility, or privacy.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=p=>readFileSync(join(root,p),'utf8');
const allowedArchives=new Set([
  'review-engine.html', // Deliberately retained as historical, non-indexed route.
  'programme-status-9872fb93cc94.html' // Preexisting private dashboard; separate P0 security release.
]);
const archivalPrefixes=['research/deliverables_'];
function walk(base){
  return readdirSync(join(root,base)).flatMap(name=>{
    const path=base?base+'/'+name:name;
    const st=statSync(join(root,path));
    if(st.isDirectory()){
      if(['.git','node_modules'].includes(name))return [];
      return walk(path);
    }
    return path.endsWith('.html')?[path]:[];
  });
}
const allPages=walk('');
const publicPages=allPages.filter(p=>!allowedArchives.has(p)&&!archivalPrefixes.some(a=>p.startsWith(a)));
assert.ok(publicPages.length>=60, 'scan must cover site-wide HTML pages and reference library');
const promotionPattern=/(?:Review Engine|review-engine\.html|Open AI-Assisted Record Reviewer|Paste & Assess)/i;
const violating=publicPages.filter(p=>promotionPattern.test(read(p).replace(/<!--[\s\S]*?-->/g,'')));
assert.deepEqual(violating,[], 'no public page may promote the retired Engine product or direct to its URL');

const home=read('index.html'),resources=read('resources.html'),training=read('training.html');
for(const label of ['01 · Start here','02 · Use the method','03 · Examine the evidence','04 · Learn and practice']){
  assert.ok(home.includes(label),'missing method-first route '+label);
}
assert.ok(home.includes('href="training.html"'));
assert.ok(resources.includes('href="manifest.html"'));
assert.ok(!home.includes('Review Engine'));
assert.ok(resources.includes('href="manifest.html"'), 'resources must link the actual public schema');
assert.ok(resources.includes('href="investigator-guides.html"'));
assert.ok(resources.includes('/api/dl?e=standard&amp;src=resources'));
assert.ok(resources.includes('/api/dl?e=card&amp;src=resources'));
assert.ok(resources.includes('href="training.html"'));
assert.ok(resources.includes('href="research.html"'));

assert.ok(training.includes('id="practice-guidance"'), 'training must provide a non-submission practice route');
assert.ok(training.includes('Practice with constructed records'));
for(const pattern of [/id="pa-input"/i,/runAssessment\(/i,/fetch\(['"]\/api\/review['"]/i]){
  assert.doesNotMatch(training,pattern,'public training must not accept text for automated assessment');
}
assert.doesNotMatch(read('simulations.html'),/Open AI-Assisted Record Reviewer/i);
const scriptNodes=[...training.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let checked=0;
for(const [,attrs,body] of scriptNodes){
  if(!body.trim()||/type\s*=\s*["']application\/(?:ld\+json|json)["']/i.test(attrs))continue;
  if(/type\s*=\s*["']module["']/i.test(attrs))continue;
  new vm.Script(body,{filename:'training.html script #'+checked});
  checked++;
}
assert.ok(checked>0,'training JavaScript compile checks not executed');

const vercel=JSON.parse(read('vercel.json'));
assert.ok(!vercel.redirects.some(x=>x.source==='/manifest.html'),'Manifest schema page must not redirect');
assert.ok(!vercel.redirects.some(x=>x.destination==='/review-engine.html'),'legacy routing must not promote Engine page');
const sitemap=read('sitemap.xml');
assert.doesNotMatch(sitemap,/review-engine\.html|platform-evaluation-001\.html/);
const history=read('review-engine.html');
assert.match(history,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(history,/Historical route/);
assert.match(history,/No online record processing/);
assert.ok(existsSync(join(root,'jrs-decision-reconstruction-manifest-v1.0.1.schema.json')));
assert.ok(read('contact.html').includes('https://formspree.io/f/mreddwdg'));
const research=read('research.html');
for(const p of ['research-summary.html','methodology.html','evidence-ledger.html','questions.html','research-register.html']){
  assert.ok(research.includes('href="'+p+'"'),'research provenance lost: '+p);
}
const guide=read('investigator-guides.html');
for(const f of ['JRS_Investigator_Field_Guide_Employment.pdf','JRS_Investigator_Field_Guide_FairHousing.pdf','JRS_Investigator_Field_Guide_International.pdf'])assert.ok(guide.includes(f));
console.log('PASS: '+publicPages.length+' public pages screened, '+checked+' training scripts parsed; no Engine promotion, no record-entry assessor, Manifest route restored, evidence/download/contact preserved.');

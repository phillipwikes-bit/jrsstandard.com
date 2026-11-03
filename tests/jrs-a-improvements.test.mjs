// Exact-source practitioner access, edition boundary, privacy and route regression.
// This source test is not human accessibility certification or hosted telemetry proof.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('index.html'),resources=read('resources.html'),training=read('training.html');
const ed=read('editions.html'),org=read('organization.html'),css=read('assets/jrs-a-pathways.css');
const js=read('assets/jrs-engagement.js'),routes=JSON.parse(read('vercel.json')).redirects;
for(const path of ['index.html','resources.html','training.html','jrsstandard.html','editions.html','organization.html']){
  assert.ok(read(path).includes('href="/assets/jrs-a-pathways.css"'),path+' missing shared styles');
}
for(const href of ['check.html?src=quick','investigator-guides.html','training.html#training-modules','resources.html#resource-catalog','editions.html','organization.html'])
  assert.ok(home.includes('href="'+href+'"'),'missing direct task '+href);
assert.match(home,/id="task-chooser"/);
assert.match(home,/aria-label="Choose a practitioner task"/);
assert.ok(home.indexOf('id="task-chooser"')<home.indexOf('id="professional-paths"'));
assert.ok(home.includes('href="check.html?src=home">Open seven-point record check</a>'));
assert.equal((resources.match(/<article class="jrs-resource-entry"/g)||[]).length,16);
for(const v of ['Version 2.0 (2026)','Version 1.0 (May 2026)','Version 1.1 (July 2026)'])
  assert.ok(ed.includes(v),'missing publication identity '+v);
for(const p of [ed,org]){
  for(const token of ['lang="en"','id="main-content"','href="#main-content"','aria-label="Site"','<h1','<meta name="viewport"','<link rel="canonical"'])
    assert.ok(p.includes(token),'missing public accessibility marker '+token);
  assert.ok(!p.includes('<form'),'new informational page may not contain a form');
  assert.ok(!p.includes('https://formspree.io'),'no new contact collection');
}
assert.match(ed,/not a certified transcription/i);
assert.match(ed,/Do not silently replace/i);
assert.match(org,/No public record submission/i);
assert.match(org,/not research enrollment/i);
assert.ok(org.includes('href="contact.html?category=organization"'));
assert.ok(routes.some(x=>x.source==='/enterprise'&&x.destination==='/organization.html'));
assert.ok(routes.some(x=>x.source==='/enterprise.html'&&x.destination==='/organization.html'));
assert.ok(!routes.some(x=>x.destination==='/review-engine.html'));
assert.ok(read('sitemap.xml').includes('/editions.html'));
assert.ok(read('sitemap.xml').includes('/organization.html'));
assert.ok(read('contact.html').includes('value="organization"'));
assert.ok(read('api/site-inquiry.js').includes("'organization'"));
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/focus-visible/);
assert.match(css,/grid-template-columns:1fr/);
for(const p of ['index.html','resources.html','training.html','editions.html','organization.html'])
  assert.ok(read(p).includes('src="/assets/jrs-engagement.js"'),p+' missing public telemetry');
for(const p of ['contact.html','programme-status-9872fb93cc94.html','owner-login.html'])
  assert.ok(!read(p).includes('jrs-engagement.js'),p+' private or contact PII must be excluded');
assert.doesNotMatch(js,/fetch\(|sendBeacon\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/);
for(const evt of ['tool_open','guide_open','training_entry','training_start','edition_compare','organization_info'])
  assert.ok(js.includes("'"+evt+"'"),'missing allowlisted event '+evt);
assert.ok(js.includes('source_surface')&&js.includes('resource_id'));
assert.match(read('privacy-notice.html'),/fixed resource identifiers and public page categories/);
new vm.Script(js,{filename:'assets/jrs-engagement.js'});
// Synthetic cross-origin refusal and event-only telemetry payload check.
function harness(pathname){
  const calls=[],events=[];
  const document={addEventListener:(name,fn)=>{(events[name]??=[]).push(fn)}};
  vm.runInNewContext(js,{document,window:{gtag:(...args)=>calls.push(args)},location:{pathname,href:'https://www.jrsstandard.com'+pathname},URL,Set});
  return {calls,click:node=>events.click.forEach(fn=>fn({target:{closest:q=>q==='a[href]'?node:null}}))};
}
let h=harness('/index.html');
h.click({dataset:{},getAttribute:()=>'/check.html?src=quick'});
assert.equal(h.calls.length,1);
assert.equal(h.calls[0][1],'jrs_tool_open');
assert.equal(h.calls[0][2].resource_id,'record_check');
assert.equal(h.calls[0][2].source_surface,'home');
h.click({dataset:{},getAttribute:()=> 'https://external.example/offer'});
assert.equal(h.calls.length,1,'cross-origin links must not create custom events');
assert.equal(Object.keys(h.calls[0][2]).sort().join(','),'resource_id,source_surface');
let t=harness('/training.html');
let expanded='true';
t.click({dataset:{},getAttribute:()=>'/training.html'});
assert.equal(t.calls[0][1],'jrs_training_entry');
assert.equal(t.calls[0][2].resource_id,'reviewer_training');
// UI training-module opening is tested in the hosted visual suite.
console.log('PASS public practitioner routes, source labels, organizational boundaries, GA4 payload allowlist and owner isolation.');

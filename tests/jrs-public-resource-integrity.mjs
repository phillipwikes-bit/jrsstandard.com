// Public JRS resource and evidence-alignment regression. Source-level, not a visual audit.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=p=>readFileSync(join(root,p),'utf8');
const pages=['index.html','resources.html','research.html','investigator-guides.html',
'manifest.html','about.html','contact.html','jrsstandard.html','training.html',
'check.html','simulations.html','decision-reconstruction-risk.html',
'research-summary.html','methodology.html','evidence-ledger.html','questions.html',
'research-register.html','privacy.html','terms.html','codebook.html',
'implementation-scenarios.html','operational-boundaries.html','reference/index.html',
'reference/ai-assisted-record-failure-modes/index.html',
'reference/ai-verification-controls/index.html','reference/decision-context-loss/index.html',
'reference/deployment-models/index.html','reference/documentation-risk-tiers/index.html',
'reference/escalation-triggers/index.html','reference/field-conditions/index.html',
'reference/implementation-maturity-levels/index.html',
'reference/later-review-failure-cascades/index.html','reference/missing-chronology/index.html',
'reference/record-survivability/index.html','reference/reviewer-responsibility-boundaries/index.html',
'reference/reviewer-worksheet/index.html','reference/second-line-review-model/index.html',
'reference/traveler-test/index.html','reference/unsupported-generalization/index.html',
'reviewer/index.html','ai-governance-record.html','compliance.html','datasets.html',
'finding.html','results.html','why-good-decisions-fail.html','privacy-notice.html'];
const redirs=new Map(JSON.parse(read('vercel.json')).redirects.map(x=>[x.source,x.destination]));
const docs={employment:'JRS_Investigator_Field_Guide_Employment.pdf',
fairhousing:'JRS_Investigator_Field_Guide_FairHousing.pdf',
international:'JRS_Investigator_Field_Guide_International.pdf',
standard:'JRS-Standard.pdf',card:'JRS_Rapid_Review_Card.pdf',
drr:'DRR_Article.pdf',paper:'JRS_Research_Paper.pdf',
accuracy:'JRS_Reliability_Accuracy.pdf'};
const aliases={eeo:'employment',housing:'fairhousing',fh:'fairhousing',
intl:'international',int:'international',std:'standard',jrs:'standard',
rapidcard:'card',rrc:'card',reviewcard:'card',drrarticle:'drr',
researchpaper:'paper',reliability:'accuracy'};
const kits=new Set(['JRS_Investigator_Field_Guide.pdf','JRS_Rapid_Review_Card.pdf',
'JRS-Reference-9d4f2a7c.pdf']);
const errors=[];let links=0,tracked=0,targets=0,fragments=0;
const fail=(p,m)=>errors.push(p+': '+m);
function fileAt(path){
 const rel=decodeURIComponent(path).replace(/^\//,'');
 const options=!rel?['index.html']:rel.endsWith('/')?[rel+'index.html']:
 /\.[a-z0-9]+$/i.test(rel)?[rel]:[rel,rel+'.html',rel+'/index.html'];
 for(const f of options){const full=resolve(root,f);
  if(full.startsWith(root+'/')&&existsSync(full)&&statSync(full).isFile())return f}
 return null;
}
function redirect(path){
 const seen=new Set();let p=path;
 while(redirs.has(p)&&!seen.has(p)){seen.add(p);
  p=new URL(redirs.get(p),'https://www.jrsstandard.com').pathname}
 return p;
}
for(const p of pages){
 assert.ok(existsSync(join(root,p)),'missing public page '+p);
 const html=read(p),base='https://www.jrsstandard.com/'+p;
 for(const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(['"])(.*?)\1/gi)){
  const href=m[2].replace(/&amp;/g,'&').trim();
  if(!href||/^(mailto:|tel:|sms:|javascript:|data:)/i.test(href)||/encodeURIComponent|\s\+\s/.test(href))continue;
  let u;try{u=new URL(href,base)}catch{fail(p,'malformed href '+href);continue}
  if(u.origin!=='https://www.jrsstandard.com')continue;
  links++;
  if(u.pathname.startsWith('/api/')){
   if(u.pathname!=='/api/dl')continue;
   const e=u.searchParams.get('e'),f=u.searchParams.get('f');
   if(!e&&!f){fail(p,'download without edition or filename '+href);continue}
   if(e){const id=aliases[e.toLowerCase()]||e.toLowerCase();
     if(!docs[id])fail(p,'unrecognized download '+e);
     else if(!fileAt('/'+docs[id]))fail(p,'missing PDF '+docs[id]);}
   else if(!kits.has(f))fail(p,'unrecognized kit PDF '+f);
   else if(!fileAt('/'+f))fail(p,'missing kit '+f);
   tracked++;continue;
  }
  const f=fileAt(redirect(u.pathname));targets++;
  if(!f){fail(p,'broken internal href '+href);continue}
  if(u.hash&&f.endsWith('.html')){
   fragments++;
   const id=decodeURIComponent(u.hash.slice(1)),html2=read(f);
   if(id&&!html2.includes('id="'+id+'"')&&!html2.includes("id='"+id+"'")
    &&!html2.includes('name="'+id+'"')&&!html2.includes("name='"+id+"'")){
     fail(p,'missing anchor '+u.hash+' on '+f);
   }
  }
 }
}
for(const pdf of new Set([...Object.values(docs),...kits])){
 const f=fileAt('/'+pdf);
 if(!f){fail('download-inventory','missing '+pdf);continue}
 const buf=readFileSync(join(root,f));
 if(buf.length<1000||buf.subarray(0,5).toString('ascii')!=='%PDF-')
  fail('download-inventory','invalid PDF '+pdf);
}
for(const f of ['jrs-decision-reconstruction-manifest-v1.0.1.schema.json',
'jrs-decision-reconstruction-manifest-v1.0.schema.json',
'jrs-decision-reconstruction-manifest-example-v1.0.json']){
 if(!fileAt('/'+f))fail('Manifest','missing '+f);
 else try{JSON.parse(read(f))}catch{fail('Manifest','invalid JSON '+f)}
}
assert.ok(read('index.html').includes('Version 2.0'),'homepage must identify actual PDF version');
assert.ok(read('jrsstandard.html').includes('online methodology identifies v1.0'),
 'HTML methodology and PDF are separately versioned');
assert.ok(read('training.html').includes('View three current guides'),
 'training must direct users to discipline-specific editions');
assert.ok(read('research.html').includes('<strong>36 reviewers</strong>'),
 'completion sample label must be reviewers rather than experts');
assert.ok(read('investigator-guides.html').includes('36</span> reviewers completed'),
 'guide population must match source evidence ledger');
assert.ok(read('manifest.html').includes('not established as compatible with that edition'),
 'Manifest must disclose incompatible-version uncertainty');
assert.ok(read('training.html').includes('id="en-transfer"') &&
 read('training.html').includes('privacy-notice.html#training-enrollment'),
 'training must have optional separate transfer consent and working privacy route');
assert.ok(!read('training.html').includes('encodeURIComponent(email);'),
 'training must not leak enrollment PII through URL query strings');
assert.ok(read('privacy-notice.html').includes('id="training-enrollment"'),
 'privacy notice must explicitly describe enrollment data flow');
if(errors.length){
 console.error('FAIL: '+errors.length+' issues across '+pages.length+
 ' pages, '+links+' links, '+tracked+' downloads and '+fragments+' fragments.');
 for(const x of errors.slice(0,110))console.error(' - '+x);
 process.exitCode=1;
}else console.log('PASS: '+pages.length+' public pages; '+links+' internal links; '+
 targets+' local targets; '+tracked+' tracked downloads; '+fragments+
 ' section anchors; document inventories and research/version crosswalks.');

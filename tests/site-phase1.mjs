import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const pages=["index.html","resources.html","research.html","enterprise.html","contact.html","about.html","review-engine.html","manifest.html","decision-reconstruction-risk.html","codebook.html","investigator-guides.html","engagement.html","terms.html","simulations.html","implementation-scenarios.html"];
const navTargets=['index.html','jrsstandard.html','resources.html','research.html','training.html','enterprise.html','contact.html'];
let checked=0;
function check(label,fn){try{fn();checked++;console.log('PASS '+label)}catch(e){console.error('FAIL '+label+': '+e.message);process.exitCode=1}}
for(const page of pages){
 const s=readFileSync(page,'utf8');
 const m=s.match(/<nav class="jrs-sitenav"[^>]*>([\s\S]*?)<\/nav>/);
 check(page+' main nav exists',()=>assert.ok(m));
 if(m){
   for(const target of navTargets)check(page+' includes '+target,()=>assert.ok(m[1].includes('href="'+target+'"')));
   check(page+' has no old enterprise/technical nav promotion',()=>assert.ok(!/>Enterprise<|>Review Engine<|>Manifest</.test(m[1])));
 }
 check(page+' no direct record-intake offer',()=>assert.ok(!/submit (a|your) (case|record) for (an )?engine evaluation/i.test(s)));
}
for(const target of navTargets)check('nav target exists '+target,()=>assert.ok(existsSync(target)));
const home=readFileSync('index.html','utf8');
check('homepage explicitly differentiates Decision Spellchecker',()=>assert.match(home,/Decision Spellchecker is a separate/));
check('homepage free resource pathway',()=>assert.ok(home.includes('Apply the method without buying software')));
check('homepage remains method and research centered',()=>assert.ok(home.includes('Five review conditions')));
const org=readFileSync('enterprise.html','utf8');
const api=readFileSync('api/enterprise-inquiry.js','utf8');
check('organizational form retains working API route',()=>assert.ok(org.includes("fetch('/api/enterprise-inquiry'")));
for(const v of ['other','evaluation'])check('inquiry topic matches server allowlist: '+v,()=>assert.ok(api.includes("'"+v+"'")&&org.includes('value="'+v+'"')));
const contact=readFileSync('contact.html','utf8');
check('contact has distinct routes',()=>{for(const t of ['Organizational use','Research collaboration','Training and resources','Prospective Decision Spellchecker interest'])assert.ok(contact.includes(t))});
check('contact disallows confidential records',()=>assert.ok(contact.includes('Do not transmit identifiable case records')));
check('contact does not claim operational Gmail delivery',()=>assert.ok(contact.includes('not yet been confirmed as operational')));
check('dashboard never gains GA4 from this change',()=>assert.ok(!readFileSync('programme-status-9872fb93cc94.html','utf8').includes('googletagmanager.com/gtag/js')));
const routes=JSON.parse(readFileSync('vercel.json','utf8'));
check('existing enterprise compatibility redirect preserved',()=>assert.ok(routes.redirects.some(x=>x.source==='/enterprise')));
console.log('Site phase 1 checks: '+checked+' passes'+(process.exitCode?' (failed check recorded)':''));

// The demonstration is educational, fictional and method-only.
// This test is source-level and does not certify accessibility or hosted rendering.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=['index.html','jrsstandard.html','training.html','resources.html','research.html'];
for(const p of pages){
 const html=read(p);
 assert.equal(html.split('href="/assets/jrs-practitioner-journey.css"').length-1,1,p+' shared styles');
 assert.ok(html.includes('class="jrs-sitenav"'),p+' global navigation preserved');
}
const home=read('index.html');
assert.equal((home.match(/data-jrs-example-phase="/g)||[]).length,3);
for(const stage of ['before','review','verified'])
 assert.ok(home.includes('data-jrs-example-phase="'+stage+'"'),'Missing worked stage: '+stage);
for(const phrase of ['fictional supplier-access','only if the underlying sources','invented solely','not an automated assessment','rather than inventing support'])
 assert.ok(home.toLowerCase().includes(phrase.toLowerCase()),'Missing example boundary: '+phrase);
for(const source of ['research-summary.html','methodology.html','evidence-ledger.html','questions.html'])
 assert.ok(home.includes('href="'+source+'"'),'Missing research destination: '+source);
for(const detail of ['384 graded judgments','83.9%','72.7%','95.1%','104 analyzed determinations','0.739','0.623','criterion not met','Field effectiveness not established'])
 assert.ok(home.includes(detail),'Missing distinct evidence disclosure: '+detail);
const research=read('research.html');
for(const detail of ['Separate reviewer-agreement sample','104 determinations','10 multi-rater records','0.739','0.623','criterion was <strong>not met</strong>','not additional observations'])
 assert.ok(research.includes(detail),'Missing reliability explanation: '+detail);
for(const path of ['jrsstandard.html','training.html','resources.html'])
 assert.ok(read(path).includes('href="index.html#worked-record"'),path+' must expose worked example');
const resources=read('resources.html');
assert.equal((resources.match(/<article class="jrs-resource-entry"/g)||[]).length,16,'Keep 16 free resources');
const styles=read('assets/jrs-practitioner-journey.css');
for(const value of ['repeat(3,minmax(0,1fr))','@media(max-width:900px)','grid-template-columns:1fr','focus-visible'])
 assert.ok(styles.includes(value),'Missing responsive/keyboard safeguard: '+value);
assert.ok(!home.includes('upload your case record'),'No new upload instructions');
console.log('PASS: fictional 3-stage example, separated detection/reliability/field boundaries, source links and shared responsive public styling.');

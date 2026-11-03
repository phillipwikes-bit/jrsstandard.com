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
assert.ok(home.includes("Organizations do not need to purchase or replace a software platform to begin examining whether their decision records preserve sufficient evidence, chronology and reasoning for later independent review."),
 'Primary no-platform-purchase proposition must be preserved verbatim');
// The first visitor action opens the actual ungated, non-scoring reading aid.
// Avoid routing the primary task through another catalog page.
assert.ok(home.includes('<a class="jr-action-main" href="check.html?src=home">Open seven-point record check</a>'),'Primary action must open the free record check');
assert.match(home, /href="#worked-record">[^<]*fictional[^<]*<\/a>/i,
 'Worked example remains one direct practitioner action, regardless of incidental link wording');
assert.match(home, /href="resources\.html(?:#resource-catalog)?">[^<]*(?:free|resource)[^<]*<\/a>/i,
 'Free practitioner resources remain directly accessible, without purchasing software');
assert.ok(read('resources.html').includes('href="check.html?src=resources">Open seven-point record check</a>'));
const check=read('check.html');
assert.ok(check.includes('No registration, no upload')||check.includes('no account, no upload'),'Check must remain ungated and upload-free');
assert.ok(check.includes('does not score your record'),'Do not frame the free aid as an automated risk score');
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


// The homepage's fast-task entry uses ?src=quick. Its arrival must not be
// silently grouped as 'other' in the path-only, bounded check-view telemetry.
// Source labels are finite categories, not arbitrary URL query data.
{
 const quickHref='href="check.html?src=quick"';
 assert.ok(home.includes(quickHref),'Homepage fast-task check entry must remain present');
 const allowlist=check.match(/src\s*=\s*\/\^\(([^)]+)\)\$\/\.test\(sourceCandidate\)/);
 assert.ok(allowlist,'Check-view telemetry must retain a bounded source allowlist');
 const accepted=new RegExp('^(?:'+allowlist[1]+')$');
 for(const category of ['home','quick','resources','training'])
  assert.ok(accepted.test(category),'First-party check-view source must be attributable: '+category);
 for(const untrusted of ['quick%26person%3DA','quick&person=A','someone@example.com','case-123',''])
  assert.ok(!accepted.test(untrusted),'Arbitrary URL source must not enter telemetry: '+untrusted);
 assert.match(check,/origin_url:\s*window\.location\.pathname/,
   'Check-view logging must retain a path-only page source');
 console.log('PASS: homepage quick check entry is attributed without accepting arbitrary source identifiers.');
}

// Current homepage serves free reviewer resources and two resource-first initiatives.
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
// The approved first action opens the free resource library. The non-scoring
// manual record check must remain a direct second action, not a gated flow.
const resourceAction='<a class="jr-action-main" href="resources.html">Browse free JRS resources</a>';
const recordCheckAction='<a class="jr-action-alt" href="check.html?src=home">Open seven-point record check</a>';
assert.ok(home.includes(resourceAction),'Primary action must open the ungated free resource library');
assert.ok(home.includes(recordCheckAction),'Record check must remain directly available from the homepage');
assert.ok(home.indexOf(resourceAction)<home.indexOf(recordCheckAction),
 'Resource library must precede the record check under the approved homepage ordering');
assert.ok(home.includes('href="right-to-know-why.html#free-resources"'), 'Public-interest initiative must lead to free resources');
assert.ok(home.includes('href="decisions-you-can-defend.html#free-resources"'), 'Professional initiative must lead to free resources');
assert.ok(!home.includes('href="#worked-record"'), 'Retired worked-example homepage entry must remain absent');
assert.match(home, /href="resources\.html(?:#resource-catalog)?">[^<]*(?:free|resource)[^<]*<\/a>/i,
 'Free practitioner resources remain directly accessible, without purchasing software');
assert.ok(read('resources.html').includes('href="check.html?src=resources">Open seven-point record check</a>'));
const check=read('check.html');
assert.ok(check.includes('No registration, no upload')||check.includes('no account, no upload'),'Check must remain ungated and upload-free');
assert.ok(check.includes('does not score your record'),'Do not frame the free aid as an automated risk score');
assert.ok(!home.includes('data-jrs-example-phase="'), 'No constructed case demonstrations in homepage pathways');
for(const page of ['right-to-know-why.html','decisions-you-can-defend.html'])
 assert.ok(read(page).includes('id="free-resources"'), page+' must supply a direct free-resource section');
for(const source of ['research-summary.html','methodology.html','evidence-ledger.html','questions.html'])
 assert.ok(home.includes('href="'+source+'"'),'Missing research destination: '+source);
for(const detail of ['384 graded judgments','83.9%','72.7%','95.1%','104 analyzed determinations','0.739','0.623','criterion not met','Field effectiveness not established'])
 assert.ok(home.includes(detail),'Missing distinct evidence disclosure: '+detail);
const research=read('research.html');
for(const detail of ['Separate reviewer-agreement sample','104 determinations','10 multi-rater records','0.739','0.623','criterion was <strong>not met</strong>','not additional observations'])
 assert.ok(research.includes(detail),'Missing reliability explanation: '+detail);
assert.ok(read('resources.html').includes('href="investigator-guides.html"'), 'Resource directory must retain free field guides');
const resources=read('resources.html');
assert.equal((resources.match(/<article class="jrs-resource-entry"/g)||[]).length,16,'Keep 16 free resources');
const styles=read('assets/jrs-practitioner-journey.css');
for(const value of ['repeat(3,minmax(0,1fr))','@media(max-width:900px)','grid-template-columns:1fr','focus-visible'])
 assert.ok(styles.includes(value),'Missing responsive/keyboard safeguard: '+value);
assert.ok(!home.includes('upload your case record'),'No new upload instructions');
console.log('PASS: free resource-first initiative pathways, ungated record check, separated research limitations and responsive public styling.');

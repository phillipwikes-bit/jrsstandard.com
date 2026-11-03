// Competitor-informed first-use UX controls.
// Review method clarity only; no performance, legal or certification claims.
// The published PDFs, review engine and dashboard remain unchanged.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const home=read('index.html');
const fit=read('workflow-fit.html');
const resources=read('resources.html');
assert.match(home,/<h1 id="jrs-main-heading">Can the record explain the decision after its author is gone\?<\/h1>/);
assert.match(home,/href="workflow-fit\.html#jrs-first-use-title"/);
assert.match(home,/href="check\.html\?src=home"/);
assert.match(home,/href="resources\.html#resource-catalog"/);
assert.match(fit,/<section class="jrs-first-use" aria-labelledby="jrs-first-use-title">/);
assert.match(fit,/<h2 id="jrs-first-use-title">Review one draft within the workflow you already use\.<\/h2>/);
const step=fit.match(/<ol class="jrs-first-use-steps">([\s\S]*?)<\/ol>/);
assert.ok(step,'three-step procedure exists');
assert.equal((step[1].match(/<li>/g)||[]).length,3,'three reviewer steps, no extra sales or software actions');
for(const phrase of ['Identify the record and its sources','Check the five documentation conditions',
 'Document the disposition locally','reconstructability, identifiable basis, chronology, reasoning trace and sufficiency',
 'Do not submit records or identifying case details to this website']){
 assert.ok(step[1].includes(phrase),'first-use wording missing: '+phrase);
}
assert.match(step[1],/href="check\.html\?src=workflow-fit"/);
assert.match(fit,/Review boundary:<\/strong> The method does not determine legal correctness/);
assert.match(fit,/Errors or gaps discovered after a record is filed may require a documented amendment/);
assert.ok(!fit.includes('There is no practical intervention point after that.'),
 'unqualified assertion about post-filing correction must remain absent');
assert.match(fit,/field performance across these settings has not been established/);
assert.ok(fit.indexOf('jrs-first-use-title')<fit.indexOf('>The Insertion Point</h2>'),
 'practical first-use steps should appear before lengthy explanation');
assert.match(fit,/@media\(max-width:700px\).*jrs-first-use-steps\{grid-template-columns:1fr/);
assert.match(fit,/@media\(forced-colors:active\)/);
assert.equal((resources.match(/class="jrs-resource-entry"/g)||[]).length,16,
 'resource directory must preserve all published entries');
assert.match(resources,/href="contact\.html\?category=accessibility"/);
const nav=home.match(/<nav class="jrs-sitenav" aria-label="Site">([\s\S]*?)<\/nav>/);
assert.ok(nav,'canonical site navigation remains');
assert.equal((nav[1].match(/<a href=/g)||[]).length,7,'no global navigation bloat');
console.log('PASS: competitor-informed reviewer journey, original task links, edition and privacy boundaries remain intact.');

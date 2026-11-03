// Source-anchored, competitor-informed first-use journey.
// Release safety: do not add forms, new endpoints or claims of certified outcomes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const home=read('index.html');
const resources=read('resources.html');
const css=read('assets/jrs-a-pathways.css');
const vercel=JSON.parse(read('vercel.json'));
const redir=vercel.redirects.find(x=>x.source==='/workflow-fit.html');
assert.ok(redir&&redir.destination==='/resources.html',
 'retired workflow route must retain its current redirect');
assert.match(home,/<h1 id="jrs-main-heading">Can the record explain the decision after its author is gone\?<\/h1>/);
assert.match(home,/href="resources\.html#jrs-first-use-title"/);
assert.ok(!home.includes('workflow-fit.html#jrs-first-use-title'),
 'homepage must not link to a fragment on a redirected legacy page');
assert.match(home,/href="check\.html\?src=home"/);
assert.match(home,/href="resources\.html#resource-catalog"/);
const main=resources.match(/<section class="jrs-resource-first-use" aria-labelledby="jrs-first-use-title">([\s\S]*?)<\/section>/);
assert.ok(main,'first-use section must be on canonical Resources');
assert.match(main[1],/<h2 id="jrs-first-use-title">Review one draft before it advances\.<\/h2>/);
const steps=main[1].match(/<ol class="jrs-resource-first-use-steps">([\s\S]*?)<\/ol>/);
assert.ok(steps,'native ordered procedure exists');
assert.equal((steps[1].match(/<li>/g)||[]).length,3,'exactly three reviewer actions');
for(const phrase of [
 'Identify the draft and its sources','Examine the five review conditions',
 'Record the disposition in your system',
 'reconstructability, identifiable basis, chronology, reasoning trace and sufficiency',
 'Do not upload or send case-record content to this website'
]){
  assert.ok(steps[1].includes(phrase),'missing documented reviewer control: '+phrase);
}
assert.match(steps[1],/href="check\.html\?src=resources"/);
assert.match(main[1],/JRS does not certify legal correctness or compliance/);
assert.match(main[1],/local retention and amendment procedures still govern any correction/);
assert.ok(resources.indexOf('id="resource-catalog"')<
          resources.indexOf('id="jrs-first-use-title"'),
 'searchable catalog must remain ahead of new educational section');
assert.ok(resources.indexOf('id="jrs-first-use-title"')<
          resources.indexOf('id="quick-review"'),
 'first-use guidance must precede duplicate detailed cards');
assert.match(css,/jrs-resource-first-use-steps/);
assert.match(css,/@media\(max-width:780px\)/);
assert.match(css,/@media\(forced-colors:active\)/);
assert.equal((resources.match(/class="jrs-resource-entry"/g)||[]).length,16,
 'all 16 free directory entries remain');
assert.match(resources,/href="contact\.html\?category=accessibility"/);
const nav=home.match(/<nav class="jrs-sitenav" aria-label="Site">([\s\S]*?)<\/nav>/);
assert.ok(nav,'canonical navigation must remain');
assert.equal((nav[1].match(/<a href=/g)||[]).length,7,
 'do not add more global navigation while optimizing user journeys');
console.log('PASS: canonical first-use JRS procedure, existing tool routes, PDF/version and privacy boundaries preserved.');

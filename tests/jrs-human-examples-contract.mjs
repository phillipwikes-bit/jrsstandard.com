// JRS text-first decision examples and ethical influence contract (source-level).
// Not a substitute for a mobile browser, assistive-technology or hosted check.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=path=>readFileSync(join(root,path),'utf8');
const home=read('index.html');
const rights=read('right-to-know-why.html');
const pro=read('decisions-you-can-defend.html');
const research=read('research.html');
const css=read('assets/jrs-human-examples.css');
const types=['hiring','termination','benefits','medical','ai'];
const ids=source=>[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const [name,source] of [['home',home],['rights',rights],['professional',pro],['research',research]]){
 assert.ok(/^\s*<!doctype html>/i.test(source), name+' needs standards-mode doctype');
 assert.equal(ids(source).length,new Set(ids(source)).size,name+' duplicate IDs');
 assert.equal((source.match(/<section\b/g)||[]).length,(source.match(/<\/section>/g)||[]).length,name+' section imbalance');
 assert.ok(source.includes('/assets/jrs-human-examples.css'),name+' missing shared stylesheet');
}
assert.ok(home.indexOf('id="everyday-decisions"')<home.indexOf('id="public-initiatives"'), 'fictional decision examples must precede both campaigns');
assert.ok(home.includes('A decision can change someone\'s life. Can the record explain why?'));
assert.equal((home.match(/<details class="jrs-scenario"/g)||[]).length,5,'exactly five text-first scenarios');
assert.equal((home.match(/<details class="jrs-scenario"[^>]* open>/g)||[]).length,1,'one default open scenario');
assert.equal((home.match(/<details\b/g)||[]).length,(home.match(/<\/details>/g)||[]).length,'home disclosures balanced');
for(const type of types){
 assert.ok(home.includes('id="scenario-'+type+'"'),type+' anchor missing');
 assert.ok(!existsSync(join(root,'assets/jrs-scenario-'+type+'.svg')),
  'retired abstract illustration must be removed: '+type);
}
for(const [name,page] of [['homepage',home],['public campaign',rights],['professional campaign',pro]]){
 assert.doesNotMatch(page,/jrs-scenario-(?:hiring|termination|benefits|medical|ai)\.svg/,
  name+' must not reference retired illustrations');
 assert.doesNotMatch(page,/<figure class="jrs-story-art"/,
  name+' must not render retired abstract art');
}
for(const text of ['What is missing? (DRR)','Why could it matter?','What would JRS flag?',
 'The decision may be right. It may be wrong.',
 'JRS does not supply missing evidence',
 'JRS does not determine medical necessity']){
 assert.ok(home.includes(text),'missing limit or demonstration: '+text);
}
assert.ok(home.includes('right-to-know-why.html#constructed-example'));
assert.ok(home.includes('decisions-you-can-defend.html#constructed-example'));
for(const page of [rights,pro]){
 assert.ok(page.includes('index.html#everyday-decisions'),'campaign examples must link to all scenarios');
 assert.ok(!page.includes('jrs-scenario-hiring.svg'),'campaign must not show discarded illustration');
 assert.ok(page.includes('id="constructed-example"'),'campaign original anchor must remain');
 assert.ok(page.includes('id="support-the-principle"'),'original optional support remains');
 assert.ok(page.includes('method="post" action="/api/support?'),'original POST-only support route must remain');
 assert.ok(page.includes('src="/assets/jrs-engagement.js" defer'),'existing engagement script retained');
 assert.equal((page.match(/<details\b/g)||[]).length,(page.match(/<\/details>/g)||[]).length,'self-check nested details balanced');
}
assert.ok(rights.includes('does not establish discrimination'));
assert.ok(pro.includes('JRS does not determine whether the termination was discriminatory'), 'professional constructed termination exercise must preserve limits');
assert.ok(research.includes('Different Minds. Fewer Blind Spots. Stronger Evidence.'));
assert.ok(research.includes('The pre-registered two-part criterion was <strong>not met</strong>'));
assert.ok(research.includes('Separate reviewer-agreement sample'));
assert.ok(research.includes('16 independent international experts from 11 countries'));
assert.ok(research.includes('384 graded reads'));
assert.ok(research.includes('Verified use and endorsement'));
assert.ok(research.includes('Not established here:'));
for(const cssToken of [
 '.jrs-story-top{display:block}',
 '@media(max-width:760px)',
 '@media(max-width:380px)',
 'min-height:54px',
 'summary:focus-visible',
 'prefers-reduced-motion',
 'JRS homepage editorial legibility repair, 2026-11-08.'
])assert.ok(css.includes(cssToken),'responsive/accessible CSS lost: '+cssToken);
for(const token of ['fetch(', 'sendBeacon(', 'localStorage', 'sessionStorage'])assert.ok(!css.includes(token),'CSS must not contain tracking '+token);
console.log('PASS: five fictional text-first scenarios, mobile CSS, two original campaign routes, POST support, research limits and source integrity.');

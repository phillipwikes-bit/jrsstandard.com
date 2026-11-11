// Legacy test path retained for CI compatibility. It now prevents regression
// to example-led campaign pages and checks current resource-first boundaries.
// Historical research may accurately describe constructed-record studies.
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
const ids=source=>[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const [name,source] of [['home',home],['rights',rights],['professional',pro],['research',research]]){
 assert.ok(/^\s*<!doctype html>/i.test(source),name+' needs standards-mode doctype');
 assert.equal(ids(source).length,new Set(ids(source)).size,name+' duplicate IDs');
 assert.equal((source.match(/<section\b/g)||[]).length,(source.match(/<\/section>/g)||[]).length,name+' section imbalance');
}
assert.ok(home.includes('id="public-initiatives"'),'homepage must retain both initiatives');
assert.ok(home.includes('right-to-know-why.html#free-resources'));
assert.ok(home.includes('decisions-you-can-defend.html#free-resources'));
assert.ok(!home.includes('id="everyday-decisions"'));
assert.ok(!home.includes('id="worked-record"'));
for(const [name,page] of [['rights',rights],['professional',pro]]){
 assert.ok(page.includes('id="free-resources"'),name+' must offer resources first');
 assert.ok(page.includes('id="support-the-principle"'),name+' must keep optional support separate');
 assert.ok(page.indexOf('id="free-resources"')<page.indexOf('id="support-the-principle"'),name+' support must be secondary');
 assert.ok(page.includes('method="post" action="/api/support?'),name+' support must be POST only');
 assert.ok(page.includes('src="/assets/jrs-engagement.js" defer'),name+' analytics boundaries must remain');
 assert.doesNotMatch(page,/constructed-example|jrs-reconstruction|fictional|\bexercise\b|scenario-hiring|TR-204|H-118|#everyday-decisions/i,name+' must not restore case exercises');
 assert.doesNotMatch(page,/<details\b/,name+' must not gate reading behind disclosure');
}
assert.ok(rights.includes('href="resources.html"'));
assert.ok(rights.includes('href="decision-reconstruction-risk.html"'));
assert.ok(pro.includes('href="investigator-guides.html"'));
assert.ok(pro.includes('href="training.html#training-modules"'));
assert.ok(pro.includes('href="check.html"'));
assert.ok(existsSync(join(root,'resources.html')));
assert.ok(research.includes('The pre-registered two-part criterion was <strong>not met</strong>'));
assert.ok(research.includes('Separate reviewer-agreement sample'));
assert.ok(research.includes('16 independent international experts from 11 countries'));
assert.ok(research.includes('384 graded reads'));
assert.ok(research.includes('Verified use and endorsement'));
assert.ok(research.includes('Not established here:'));
console.log('PASS: resource-first JRS initiatives, original research limits, optional POST support and removal of case-exercise dependencies.');

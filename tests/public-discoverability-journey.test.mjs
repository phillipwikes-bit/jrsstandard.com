// Source-only public discoverability checks; not hosted indexing, conversion or accessibility certification.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=(p)=>readFileSync(join(root,p),'utf8');
const pages=[['worked-example-ai-record.html','worked-example'],['institutional-briefing.html','institutional-briefing'],['terminology.html','terminology']];
const urls=[...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
assert.equal(new Set(urls).size,urls.length,'sitemap cannot repeat canonicals');
assert.ok(existsSync(join(root,'og-card.png')),'existing social image asset missing');
const share=read('assets/jrs-share.js');
new vm.Script(share,{filename:'assets/jrs-share.js'});
assert.ok(share.includes('location.hostname')&&share.includes('isProduction'),'protected preview check required');
for(const forbidden of ['fetch(', 'sendBeacon(', 'XMLHttpRequest', 'gtag(', 'localStorage','sessionStorage']){
  assert.ok(!share.includes(forbidden),'unexpected sharing data operation: '+forbidden);
}
for(const [file,source] of pages){
  const html=read(file);
  const canonical='https://www.jrsstandard.com/'+file;
  assert.ok(urls.includes(canonical),'missing indexed canonical: '+file);
  assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'));
  assert.ok(html.includes('<meta property="og:image" content="https://jrsstandard.com/og-card.png">'));
  assert.ok(html.includes('content="index,follow"'));
  assert.ok(html.includes('data-jrs-share="native" disabled')&&html.includes('data-jrs-share="copy" disabled'));
  assert.ok(html.includes('src="/assets/jrs-share.js"'));
  assert.ok(html.includes('href="/check.html?src='+source+'"'));
  assert.ok(html.includes('href="/resources.html?src='+source+'"'));
  assert.ok(!html.includes('gtag('),'new page must not add GA4 tags: '+file);
}
const casePage=read('worked-example-ai-record.html');
assert.ok(casePage.includes('<details><summary>Reveal the source-checking answer</summary>'));
assert.ok(casePage.includes('That does not establish that the events never occurred'));
assert.ok(casePage.includes('entirely fictional and non-scoring'));
assert.ok(read('institutional-briefing.html').includes('href="/training.html?src=institutional-briefing#training-modules"'));
const reference=read('reference/ai-assisted-record-failure-modes/index.html');
assert.ok(reference.includes('How should an investigator respond when an AI-drafted report has no verifiable source?'));
assert.ok(reference.includes('href="/check.html?src=ai-failure-modes"'));
assert.ok(reference.includes('href="/worked-example-ai-record.html#record-challenge"'));
assert.ok(read('resources.html').includes('16 resources listed.'));
console.log('PASS: canonical shareable references, static source-labelled practitioner links, evidence-first guidance and unchanged tracking boundaries.');

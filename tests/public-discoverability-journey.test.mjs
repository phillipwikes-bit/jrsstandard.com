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
for(const forbidden of ['fetch(', 'sendBeacon(', 'XMLHttpRequest', "gtag('config'", 'googletagmanager.com', 'localStorage','sessionStorage']){
  assert.ok(!share.includes(forbidden),'unexpected independent sharing data operation: '+forbidden);
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

// Canonical site identity and visible breadcrumb navigation.
const home=read('index.html');
const homeJson=[...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const site=homeJson.find(o=>o['@type']==='WebSite');
assert.ok(site,'home page needs machine-readable site name');
assert.equal(site.name,'JRS™ Justification Review Standard');
assert.equal(site.alternateName,'JRS');
assert.equal(site.url,'https://www.jrsstandard.com/');
assert.ok(home.includes('<meta property="og:site_name" content="JRS™ Justification Review Standard">'));
for(const [file] of pages){
  const html=read(file);
  const data=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const breadcrumb=data.find(o=>o['@type']==='BreadcrumbList');
  assert.ok(breadcrumb,'missing BreadcrumbList on '+file);
  assert.deepEqual(breadcrumb.itemListElement.map(i=>i.position),[1,2,3]);
  assert.deepEqual(breadcrumb.itemListElement.map(i=>i.item),[
    'https://www.jrsstandard.com/',
    'https://www.jrsstandard.com/resources.html',
    'https://www.jrsstandard.com/'+file
  ]);
  assert.ok(html.includes('<nav class="jrs-breadcrumb" aria-label="Breadcrumb">'));
  assert.ok(html.includes('<a href="/resources.html">Free resources</a>'));
  assert.ok(html.includes('aria-current="page"'));
}
console.log('PASS: WebSite site name and three visible, canonical breadcrumb paths.');

const engagement=read('assets/jrs-engagement.js');
new vm.Script(engagement,{filename:'assets/jrs-engagement.js'});
assert.ok(engagement.includes("window.gtag('event','select_content'"),'GA4 select_content must be explicit on existing tagged pages');
for(const item of ["worked_example","institutional_briefing","jrs_drr_terms"]){
  assert.ok(engagement.includes("'"+item+"'"),'missing fixed public reference id: '+item);
}
assert.ok(engagement.includes("surface!=='home'&&surface!=='resources'"),'reference selection must be restricted to existing tagged surfaces');
const resourcesPage=read('resources.html');
assert.ok(resourcesPage.includes('jrs-resource-share-actions'),'Resources sharing surface missing');
assert.ok(resourcesPage.includes('data-jrs-share="native" disabled')&&resourcesPage.includes('data-jrs-share="copy" disabled'));
assert.ok(resourcesPage.includes('src="/assets/jrs-share.js" defer'),'sharing script missing on already tagged Resources');
assert.ok(resourcesPage.includes('gtag/js?id=G-NVYHJ7BJ92'),'pre-existing GA4 tag not preserved on Resources');
assert.ok(share.includes("recordConfirmedAction('share','native_share_sheet')"),'native share must be recorded only after awaited share');
assert.ok(share.includes("recordConfirmedAction('jrs_link_copied','clipboard')"),'copy must be reported only after successful write');
assert.ok(share.includes("typeof window.gtag!=='function'"),'share must be GA4-optional');
assert.ok(!share.includes('ga4MeasurementId'),'share script must not initialize a new GA4 connection');
const privacy=read('privacy-notice.html');
for(const term of ['select_content','jrs_link_copied','share sheet','supplementary reference pages']){
  assert.ok(privacy.includes(term),'privacy notice must describe '+term);
}
console.log('PASS: existing-tag GA4 reference selections, voluntary share/copy events, privacy scope and no new tracking tag.');

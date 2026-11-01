// JRS public resource-directory accessibility, integrity and download contract.
// Source checks are not a substitute for a hosted API or PDF accessibility audit.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=p=>readFileSync(join(root,p),'utf8');
const html=read('resources.html');
const js=read('assets/jrs-resource-catalog.js');
const css=read('assets/jrs-institutional-reference.css');
const homepage=read('index.html');
assert.ok(homepage.includes('href="resources.html">Use a free review tool</a>'),
 'homepage primary action must lead to visible Resources first-use actions');
assert.ok(homepage.includes('href="resources.html#resource-catalog">Browse tools</a>'),
 'homepage Browse tools must reach searchable directory');
assert.ok(!homepage.includes('resources.html#quick-review'),
 'homepage must not bypass the searchable directory');
assert.ok(css.includes('.jrs-resource-entry:focus-within') &&
 css.includes('font-size:16px!important') &&
 css.includes('font-size:15px!important'),
 'catalog card reading size and keyboard focus treatment must remain');
const dl=read('api/dl.js');
const expected={
  standard:'JRS-Standard.pdf',
  card:'JRS_Rapid_Review_Card.pdf',
  employment:'JRS_Investigator_Field_Guide_Employment.pdf',
  fairhousing:'JRS_Investigator_Field_Guide_FairHousing.pdf',
  international:'JRS_Investigator_Field_Guide_International.pdf',
};
const allowedFile='JRS-Reference-9d4f2a7c.pdf';
const categories=new Set(['PDF','Web','Interactive']);
const roles=new Set(['investigation','hr','legal','audit','research','training']);
const match=Array.from(html.matchAll(/<article class="jrs-resource-entry"([^>]*)>([\s\S]*?)<\/article>/g));
assert.equal(match.length,16,'catalog must contain exactly 16 verified initial resources');
assert.ok(html.indexOf('jrs-resource-primary-actions') < html.indexOf('id="resource-catalog"'),
  'primary review-tool action must precede the complete resource directory');
assert.ok(html.indexOf('id="resource-catalog"') < html.indexOf('id="quick-review"'),
  'searchable resource directory must precede duplicate quick-use cards');
assert.ok(html.indexOf('id="resource-catalog"') < html.indexOf('class="jrs-resource-secondary"'),
  'resource discovery must precede longer role-specific orientation');

assert.ok(html.includes('id="resource-catalog"') && html.includes('aria-labelledby="jrs-catalog-heading"'));
for(const id of ['jrs-resource-query','jrs-resource-role','jrs-resource-format']){
 assert.ok(html.includes('for="'+id+'"'),'missing explicit label for '+id);
 assert.ok(html.includes('id="'+id+'"'),'missing search control '+id);
}
assert.ok(html.includes('id="jrs-resource-search" role="search" hidden'),
 'filter form should be hidden until progressive enhancement is ready');
assert.ok(html.includes('id="jrs-resource-count"')&&html.includes('aria-live="polite"'),
 'visible and announced result count required');
assert.ok(html.includes('id="jrs-resource-empty" hidden'),
 'no-match state must be hidden until applicable');
assert.ok(html.includes('src="/assets/jrs-resource-catalog.js" defer'));
assert.ok(js.includes('form.hidden=false') && js.includes('item.node.hidden=!visible') &&
 js.includes('query.addEventListener(\'input\'') && js.includes('clear.addEventListener(\'click\''),
 'search, filtering and clearing must be implemented');
for(const forbidden of ['fetch(', 'XMLHttpRequest', 'sendBeacon(', 'localStorage','sessionStorage']){
 assert.ok(!js.includes(forbidden),'resource search must not transmit or persist search terms: '+forbidden);
}
assert.ok(css.includes('jrs-resource-entry[hidden]') &&
 css.includes('.jrs-resource-search-field label') &&
 css.includes('@media(max-width:760px)'),'accessible responsive rendering missing');

let pdfs=0,interactive=0,web=0;
const hrefs=new Set();
for(const [all,attrs,content] of match){
 const format=attrs.match(/data-format="([^"]+)"/)?.[1];
 const rs=attrs.match(/data-roles="([^"]+)"/)?.[1]?.split(' ');
 const key=attrs.match(/data-keywords="([^"]+)"/)?.[1];
 assert.ok(categories.has(format),'unsupported directory format '+format);
 assert.ok(rs?.length>0 && rs.every(x=>roles.has(x)),'invalid roles');
 assert.ok(key?.length>4,'missing searchable keywords');
 const a=content.match(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
 const title=content.match(/<h3>([\s\S]*?)<\/h3>/);
 const description=content.match(/<p>([\s\S]*?)<\/p>/);
 assert.ok(a && title && description,'entry needs descriptive link, title and summary');
 assert.ok(!hrefs.has(a[1]),'duplicate catalog target '+a[1]);
 hrefs.add(a[1]);
 const link=a[1].replace(/&amp;/g,'&');
 const u=new URL(link,'https://www.jrsstandard.com/resources.html');
 if(format==='PDF'){
   pdfs++;
   assert.equal(u.pathname,'/api/dl','PDF must use tracked public download route');
   assert.equal(u.searchParams.get('src'),'resources','new downloads must have source tag');
   const edition=u.searchParams.get('e');
   const target=edition?expected[edition]:u.searchParams.get('f');
   assert.ok(target && (Object.values(expected).includes(target)||target===allowedFile),
     'unrecognized public download '+link);
   const bytes=readFileSync(join(root,target));
   assert.ok(bytes.length>1000&&bytes.subarray(0,5).toString()==='%PDF-',
      'invalid publication file '+target);
   assert.ok(dl.includes(target),'download route not supported by API '+target);
 }else{
   if(format==='Interactive')interactive++; else web++;
   assert.equal(u.origin,'https://www.jrsstandard.com','unrecognized external catalog route');
   const pathname=u.pathname.replace(/^\//,'');
   const file=pathname.endsWith('/')?pathname+'index.html':pathname;
   assert.ok(existsSync(join(root,file)) && statSync(join(root,file)).isFile(),
      'missing public catalog page '+pathname);
 }
 assert.ok(!/KIT-(?:A1|A2|A3|B1|C1|D1|E1|E1A)/.test(all),
   'retired implementation kits must not appear as available downloads');
}
assert.equal(pdfs,6);assert.equal(web,9);assert.equal(interactive,1);
assert.ok(html.includes('has not been established as compatible with the separately versioned PDF') &&
 html.includes('Version 1.1 (July 2026)') && html.includes('Version 2.0 (2026)'),
 'edition labeling must remain in searchable resource directory');
console.log('PASS: 16 accessible, progressively enhanced catalog entries; 6 tracked PDF assets; 10 web/interactive targets; no personal-query transmission.');

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
assert.ok(homepage.includes('class="jr-action-main" href="resources.html">Browse free JRS resources</a>'),
 'homepage primary action must open the ungated resource library');
assert.ok(homepage.includes('class="jr-action-alt" href="check.html?src=home">Open seven-point record check</a>'),
 'homepage must retain a direct, non-scoring record check');
assert.ok(homepage.includes('href="resources.html#resource-catalog"><strong>Find a reference or PDF</strong>'),
 'the homepage must retain an explicit direct link to the searchable practitioner directory');
const guides=read('investigator-guides.html');
for(const [path,page] of [['resources.html',html],['investigator-guides.html',guides]]) {
 assert.ok(page.includes('Accessible-format requests.'),path+' must disclose alternative-format request route');
 assert.ok(page.includes('have not been independently certified as accessible'),path+' must not imply PDF accessibility certification');
 assert.ok(page.includes('href="contact.html"'),path+' must provide a reachable assistance path');
 assert.ok(page.includes('confidential')||page.includes('case record'),path+' must prohibit sensitive record submission');
}
assert.ok(html.includes('different editions and must not be treated as interchangeable'),
 'alternative formats must preserve Standard web/PDF edition distinctions');
// Investigator guide actions must identify an edition in both the
// visible link text and accessible link name. The same original files must
// remain freely downloadable, and visitors must encounter the access notice
// before the first download controls.
const guidePairs=[
 ['employment','Employment / EEO','JRS_Investigator_Field_Guide_Employment.pdf'],
 ['fairhousing','Fair Housing','JRS_Investigator_Field_Guide_FairHousing.pdf'],
 ['international','International','JRS_Investigator_Field_Guide_International.pdf']
];
const quickStart=guides.indexOf('<nav class="jrs-guide-quick-actions"');
const cardsStart=guides.indexOf('<div class="cards">',quickStart);
const firstCardDownload=guides.indexOf('class="dl dl-direct"',cardsStart);
assert.ok(quickStart>0&&cardsStart>quickStart&&firstCardDownload>cardsStart,
 'the three direct-download guide controls must be present');
const quick=guides.slice(quickStart,cardsStart);
assert.ok(quick.includes('class="jrs-guide-quick-access" role="note"') &&
 quick.includes('have not been independently verified for tagged reading order') &&
 quick.includes('href="contact.html?category=accessibility"') &&
 quick.includes('Do not include confidential case records.'),
 'quick-downloads require an immediately available, non-certifying access notice');
for(const [edition,title,file] of guidePairs){
 const accessible='aria-label="Download '+title+' Investigator Guide PDF, Version 1.1"';
 const direct='href="/'+file+'" download="'+file+'" '+accessible;
 assert.ok(quick.includes('data-ed="'+edition+'" '+direct),
  edition+': quick action must preserve direct file download and name the edition');
 assert.ok(guides.includes('class="dl dl-direct" data-ed="'+edition+'" '+direct),
  edition+': primary download must preserve direct file download and name the edition');
 assert.ok(guides.includes('<h2 class="gcard-title">'+title+' Edition</h2>'),
  edition+': guide card title must be a document heading');
 assert.ok(guides.includes('>'+('Download '+title+' PDF')+' &#8595;</a>'),
  edition+': primary download text must identify the guide');
}
assert.equal((guides.match(/class="dl dl-direct"/g)||[]).length,3,
 'three distinct investigator download actions expected');
assert.ok(!guides.includes('>Download PDF &#8595;</a>'),
 'generic, indistinguishable main guide download labels must not return');

const check=read('check.html');
assert.ok(check.includes('does not score your record') &&
 (check.includes('no registration, no account, no upload') || check.includes('There is no registration, no account, no upload')),
 'the linked record check must remain non-scoring, public and upload-free');
assert.ok(homepage.includes('<span>Search 16 resources by responsibility and format</span></a>'),
 'homepage searchable directory task must describe the 16-resource catalog');
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
assert.ok(html.includes('does not establish equivalence or technical compatibility between the separately versioned publications') &&
 /former machine-readable schema files are not part of the current public release/i.test(html) &&
 html.includes('Version 1.1 (July 2026)') && html.includes('Version 2.0 (2026)'),
 'resource directory must retain the active edition labels and retired Manifest boundary');

// Training has two separately reachable Reviewer Reference download surfaces.
// The same PDF must keep one edition date, honest accessibility status, and
// specific download names even when the reader enters at #toolkit.
const training=read('training.html');
const deskStart=training.indexOf('<details class="jrs-training-desk-reference">');
const toolkitStart=training.indexOf('<div id="toolkit"');
const surveyStart=training.indexOf('<div class="survey-outer" id="participation-survey">');
assert.ok(deskStart>0&&toolkitStart>deskStart&&surveyStart>toolkitStart,
 'training desk-reference or toolkit sections missing');
const desk=training.slice(deskStart,toolkitStart);
const kit=training.slice(toolkitStart,surveyStart);
assert.ok(desk.includes('Version 1.0, May 2026') &&
 kit.includes('REF &nbsp;|&nbsp; V1.0 &nbsp;|&nbsp; May 2026') &&
 !kit.includes('REF &nbsp;|&nbsp; V1.0 &nbsp;|&nbsp; June 2026'),
 'the identical Reviewer Reference PDF must have one edition date');
for(const label of [
 'Download Reviewer Reference PDF (v1.0)',
 'Download Rapid Review Card PDF',
 'Download Standard PDF (v2.0)'
]){
 assert.ok(kit.includes('>'+label+'</a>'),
  'toolkit PDF download action must name its actual publication: '+label);
}
assert.ok(!kit.includes('class="btn-download">Download PDF</a>'),
 'toolkit must not restore ambiguous PDF download actions');
for(const [name,section] of [['desk reference',desk],['toolkit',kit]]){
 assert.ok(section.includes('is untagged and has not passed a screen-reader accessibility review') &&
  section.includes('href="contact.html?category=accessibility"') &&
  section.includes('Request an alternative format'),
  name+': disclose known tagging issue and provide a clear request path');
}
assert.ok(kit.includes('other linked PDFs have not been independently verified') &&
 kit.includes('A request does not establish that an accessible replacement is available.') &&
 kit.includes('Do not submit confidential case records.'),
 'toolkit accessibility disclosure must not imply certification, replacement availability or intake');

// Publication-accessibility guard for the 16 Reviewer Reference HTML chapters.
// A request path is not an accessibility certificate or PDF edition substitute.
const auditSource=read('tests/jrs-sitewide-mobile-browser-audit.html');
const routeMatch=auditSource.match(/const paths=(\[[^\n;]*\]);/);
assert.ok(routeMatch,'the reference route inventory must remain auditable');
const referencePages=JSON.parse(routeMatch[1]).filter(path=>
 path.startsWith('reference/')&&path!=='reference/index.html');
assert.equal(referencePages.length,16,'expected 16 Reviewer Reference chapters');
for(const pagePath of referencePages){
 const page=read(pagePath);
 const pdfLink=page.indexOf('href="/api/dl?f=JRS-Reference-9d4f2a7c.pdf');
 assert.match(page,
  /href="\/api\/dl\?f=JRS-Reference-9d4f2a7c\.pdf&amp;src=[^"]+">Download Reviewer Reference PDF \(v1\.0\)<\/a>/,
  pagePath+': visible PDF download must name the distinct Reviewer Reference edition');
 const formatNote=page.indexOf('class="note jrs-pdf-access" role="note"');
 assert.ok(pdfLink>0&&formatNote>pdfLink&&formatNote-pdfLink<1100,
  pagePath+': PDF access notice must follow the actual download');
 assert.equal((page.match(/class="note jrs-pdf-access"/g)||[]).length,1,
  pagePath+': expected one visible alternative-format notice');
 assert.ok(page.includes('Version 1.0, May 2026')&&
  page.includes('is untagged and has not passed a screen-reader accessibility review')&&
  page.includes('not a verified substitute for the PDF'),
  pagePath+': preserve edition and accessibility disclosures');
 assert.ok(page.includes('href="/contact.html?category=accessibility"'),
  pagePath+': provide an open request for an alternative format');
 assert.ok(page.includes('Continue with related reviewer references or use the free seven-point record check within an authorized workflow.') &&
  page.includes('No public pilot enrollment or case-record upload is offered.'),
  pagePath+': retain resource-first reading guidance and case-record boundary');
 assert.ok(!page.includes('practice with free constructed examples'),
  pagePath+': do not restore outdated practice-first call to action');
}
console.log('PASS: all 16 Reviewer Reference PDF entries disclose untagged status and provide an accessible-format request.');

console.log('PASS: 16 accessible, progressively enhanced catalog entries; 6 tracked PDF assets; 10 web/interactive targets; no personal-query transmission.');

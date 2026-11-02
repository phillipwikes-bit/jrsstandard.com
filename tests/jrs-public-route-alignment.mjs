// Public legacy-route visual-token contract. Source-level only: hosted visual QA remains required.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const theme='assets/jrs-public-route-alignment.css';
assert.ok(existsSync(new URL('../'+theme,import.meta.url)));
const css=read(theme);
const pages=[
 '404.html','access.html','recheck.html','reviewer/evaluation.html',
 'reviewer/completion.html','security.html','review-engine.html',
 'ai-records-arm-b.html','coauthor.html','honor.html','people.html'
];
assert.match(css,/body\.jrs-public-route-aligned/);
for(const t of ['#f5f7f8','#193148','#162f46','#7f5e26','Inter,','Georgia,','focus-visible','@media(max-width:650px)']){
 assert.ok(css.includes(t),'Missing institutional palette/typography token '+t);
}
let braces=0;for(const c of css){if(c==='{')braces++;if(c==='}')braces--;assert.ok(braces>=0,'Extra closing CSS brace');}
assert.equal(braces,0,'CSS must be balanced');
for(const p of pages){
 const html=read(p);
 assert.match(html,/<body class="jrs-public-route-aligned">/,p+' must opt in to shared public-route palette');
 assert.equal((html.match(/\/assets\/jrs-public-route-alignment\.css/g)||[]).length,1,p+' should load the shared stylesheet once');
 assert.ok(html.indexOf('/assets/jrs-public-route-alignment.css')<html.indexOf('</head>'),p+' stylesheet must load inside head');
 const head=html.slice(0,html.indexOf('</head>'));
 const lastStyle=head.lastIndexOf('</style>');
 if(lastStyle>=0)assert.ok(head.indexOf('/assets/jrs-public-route-alignment.css')>lastStyle,
  p+' head-level legacy styles must precede alignment override');
 assert.match(html,/<meta[^>]*viewport/,p+' responsive viewport must remain');
 assert.match(html,/<!doctype html>/i,p+' must keep a standards-mode doctype');
}
for(const p of ['index.html','resources.html','jrsstandard.html','training.html','investigator-guides.html']){
 const html=read(p);
 assert.match(html,/<body class="jrs-institutional/,p+' must retain first-party publication theme');
 assert.ok(html.includes('/assets/jrs-institutional-reference.css'),p+' must retain central institutional stylesheet');
}
for(const p of ['owner-login.html','programme-status-9872fb93cc94.html','vp-7c1f9a4e8d2b6035.htm']){
 assert.ok(!read(p).includes('/assets/jrs-public-route-alignment.css'),p+' excluded: protected or vendor-specific route');
}
for(const p of ['JRS-Standard.pdf','JRS_Rapid_Review_Card.pdf','JRS_Investigator_Field_Guide_Employment.pdf',
 'JRS_Investigator_Field_Guide_FairHousing.pdf','JRS_Investigator_Field_Guide_International.pdf',
 'JRS-Reference-9d4f2a7c.pdf']){
 const v=readFileSync(new URL('../'+p,import.meta.url));
 assert.ok(v.length>1000&&v.subarray(0,5).toString()==='%PDF-',p+' must preserve original publication bytes');
}
console.log('PASS: institutional public legacy palette applied to 11 routes; Standard and training theme preserved; six original PDFs retained.');

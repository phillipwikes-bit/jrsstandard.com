// Public JRS resource and evidence-alignment regression. Source-level, not a visual audit.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=p=>readFileSync(join(root,p),'utf8');
// Share the complete, independently guarded 68-route public inventory with
// responsive tests and exact-head hosted verification. Do not silently exclude
// initiative, researcher, access, archived or error-handling pages.
const audit=read('tests/jrs-sitewide-mobile-browser-audit.html');
const routeMatch=audit.match(/const paths=(\[[^\n;]*\]);/);
assert.ok(routeMatch,'audited public route inventory must be available');
const pages=JSON.parse(routeMatch[1]);
assert.equal(pages.length,68,'link integrity must cover all 68 public routes');
assert.equal(new Set(pages).size,68,'duplicate route in public inventory');

const redirs=new Map(JSON.parse(read('vercel.json')).redirects.map(x=>[x.source,x.destination]));
const docs={employment:'JRS_Investigator_Field_Guide_Employment.pdf',
fairhousing:'JRS_Investigator_Field_Guide_FairHousing.pdf',
international:'JRS_Investigator_Field_Guide_International.pdf',
standard:'JRS-Standard.pdf',card:'JRS_Rapid_Review_Card.pdf',
drr:'DRR_Article.pdf',paper:'JRS_Research_Paper.pdf',
accuracy:'JRS_Reliability_Accuracy.pdf'};
const aliases={eeo:'employment',housing:'fairhousing',fh:'fairhousing',
intl:'international',int:'international',std:'standard',jrs:'standard',
rapidcard:'card',rrc:'card',reviewcard:'card',drrarticle:'drr',
researchpaper:'paper',reliability:'accuracy'};
const kits=new Set(['JRS_Investigator_Field_Guide.pdf','JRS_Rapid_Review_Card.pdf',
'JRS-Reference-9d4f2a7c.pdf']);
const errors=[];let links=0,tracked=0,targets=0,fragments=0;
const fail=(p,m)=>errors.push(p+': '+m);
function fileAt(path){
 const rel=decodeURIComponent(path).replace(/^\//,'');
 const options=!rel?['index.html']:rel.endsWith('/')?[rel+'index.html']:
 /\.[a-z0-9]+$/i.test(rel)?[rel]:[rel,rel+'.html',rel+'/index.html'];
 for(const f of options){const full=resolve(root,f);
  if(full.startsWith(root+'/')&&existsSync(full)&&statSync(full).isFile())return f}
 return null;
}
function redirect(path){
 const seen=new Set();let p=path;
 while(redirs.has(p)&&!seen.has(p)){seen.add(p);
  p=new URL(redirs.get(p),'https://www.jrsstandard.com').pathname}
 return p;
}
for(const p of pages){
 assert.ok(existsSync(join(root,p)),'missing public page '+p);
 const html=read(p),base='https://www.jrsstandard.com/'+p;
 for(const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(['"])(.*?)\1/gi)){
  const href=m[2].replace(/&amp;/g,'&').trim();
  if(!href||/^(mailto:|tel:|sms:|javascript:|data:)/i.test(href)||/encodeURIComponent|\s\+\s/.test(href))continue;
  let u;try{u=new URL(href,base)}catch{fail(p,'malformed href '+href);continue}
  if(u.origin!=='https://www.jrsstandard.com')continue;
  links++;
  if(u.pathname.startsWith('/api/')){
   if(u.pathname!=='/api/dl')continue;
   const e=u.searchParams.get('e'),f=u.searchParams.get('f');
   if(!e&&!f){fail(p,'download without edition or filename '+href);continue}
   if(e){const id=aliases[e.toLowerCase()]||e.toLowerCase();
     if(!docs[id])fail(p,'unrecognized download '+e);
     else if(!fileAt('/'+docs[id]))fail(p,'missing PDF '+docs[id]);}
   else if(!kits.has(f))fail(p,'unrecognized kit PDF '+f);
   else if(!fileAt('/'+f))fail(p,'missing kit '+f);
   tracked++;continue;
  }
  const f=fileAt(redirect(u.pathname));targets++;
  if(!f){fail(p,'broken internal href '+href);continue}
  if(u.hash&&f.endsWith('.html')){
   fragments++;
   const id=decodeURIComponent(u.hash.slice(1)),html2=read(f);
   if(id&&!html2.includes('id="'+id+'"')&&!html2.includes("id='"+id+"'")
    &&!html2.includes('name="'+id+'"')&&!html2.includes("name='"+id+"'")){
     fail(p,'missing anchor '+u.hash+' on '+f);
   }
  }
 }
}
for(const pdf of new Set([...Object.values(docs),...kits])){
 const f=fileAt('/'+pdf);
 if(!f){fail('download-inventory','missing '+pdf);continue}
 const buf=readFileSync(join(root,f));
 if(buf.length<1000||buf.subarray(0,5).toString('ascii')!=='%PDF-')
  fail('download-inventory','invalid PDF '+pdf);
}
// Published schema/example files were deliberately retired from public use.
// Verify both source absence and the explicit denial of their old URLs.
const retiredManifestFiles=[
 'jrs-decision-reconstruction-manifest-v1.0.1.schema.json',
 'jrs-decision-reconstruction-manifest-v1.0.schema.json',
 'jrs-decision-reconstruction-manifest-example-v1.0.json'
];
const denyRoutes=new Map(JSON.parse(read('vercel.json')).rewrites.map(x=>[x.source,x.destination]));
for(const file of retiredManifestFiles){
 assert.ok(!fileAt('/'+file),'retired Manifest asset restored to public source: '+file);
 assert.equal(denyRoutes.get('/'+file),'/api/not-found',
  'retired Manifest asset must remain routed to /api/not-found: '+file);
}
assert.ok(read('index.html').includes('Version 2.0'),'homepage must identify actual PDF version');
assert.ok(read('jrsstandard.html').includes('online methodology identifies v1.0'),
 'HTML methodology and PDF are separately versioned');
assert.ok(read('training.html').includes('View three current guides'),
 'training must direct users to discipline-specific editions');
assert.ok(read('research.html').includes('<strong>36 reviewers</strong>'),
 'completion sample label must be reviewers rather than experts');
assert.ok(read('investigator-guides.html').includes('36</span> reviewers completed'),
 'guide population must match source evidence ledger');
assert.ok(read('manifest.html').includes('This reference page does not establish their equivalence or technical compatibility.') &&
 read('manifest.html').includes('It does not offer a machine-readable service, record submission, assessment output, or production artifact.'),
 'Manifest reference must preserve version uncertainty and non-operational status');
assert.ok(read('resources.html').includes('The former machine-readable schema files are not part of the current public release.') &&
 !read('resources.html').includes('The current Manifest schema 1.0.1 accepts') &&
 !read('resources.html').includes('Review the public schema'),
 'Resources must not advertise a retired machine-readable Manifest specification');
assert.ok(read('training.html').includes('id="en-transfer"') &&
 read('training.html').includes('privacy-notice.html#training-enrollment'),
 'training must have optional separate transfer consent and working privacy route');
assert.ok(!read('training.html').includes('encodeURIComponent(email);'),
 'training must not leak enrollment PII through URL query strings');
assert.ok(read('privacy-notice.html').includes('id="training-enrollment"'),
 'privacy notice must explicitly describe enrollment data flow');
// Cross-document active-resource and optional registration controls.
const htmlStandard=read('jrsstandard.html'),htmlTraining=read('training.html');
for(const id of ['KIT-A1','KIT-A2','KIT-A3','KIT-B1','KIT-C1','KIT-D1','KIT-E1','KIT-E1A']){
 assert.ok(htmlStandard.includes('>'+id+'</div>'),'retired kit inventory identifier absent '+id);
 const active=new RegExp('>'+id+'<\\/div>[\\s\\S]{0,420}>Active<\\/div>');
 assert.ok(!active.test(htmlStandard),'retired standalone PDF incorrectly marked active '+id);
}
assert.ok(htmlStandard.includes('Archived implementation-kit inventory'),
 'retired materials require explicit publication-availability legend');
for(const edition of ["edition:'employment'","edition:'fairhousing'","edition:'international'"]){
 assert.ok(htmlTraining.includes(edition),'training role guide missing current edition '+edition);
}
assert.ok(htmlTraining.includes("k.edition?'/api/dl?e='"),
 'training role link generator must use edition-based download routing');
assert.ok(!htmlTraining.includes("href:'JRS_Investigator_Field_Guide.pdf'"),
 'training must not offer historical combined guide as current edition');
assert.ok(htmlTraining.includes('The historical KIT-A1 PDF is not a current public download'),
 'training must disclose kit retirement in workflow instructions');
const privacyNow=read('privacy-notice.html');
assert.ok(!privacyNow.includes('<code>pilot_contacts</code>'),
 'public privacy notice must not disclose internal data table identifiers');
assert.ok(privacyNow.includes('It does not authorize unrelated marketing or project updates'),
 'training contact consent must not be treated as marketing consent');
assert.ok(htmlTraining.includes('id="en-transfer"'),
 'successor transfer choice must remain optional and distinct');


// Alternative-format requests must follow the existing privacy-controlled
// contact path. Source checks do not certify PDF accessibility or delivery.
const contact=read('contact.html'),guides=read('investigator-guides.html');
for(const page of [read('index.html'),read('jrsstandard.html'),read('training.html'),read('resources.html'),guides]){
 assert.ok(page.includes('href="contact.html?category=accessibility"'),'Accessible-format link must preselect contact category');
}
assert.ok(contact.includes('<option value="accessibility">Accessibility, alternative document formats, or corrections</option>'),
 'Contact form must identify the appropriate alternative-format category');
assert.ok(contact.includes("if(categories.includes(requested))f.elements.category.value=requested;"),
 'Contact form must apply a permitted query category without automatic submission');
assert.ok(contact.includes('document title, edition and format needed'),
 'Alternative-format guidance must state the minimum information to identify the requested edition');
assert.ok(contact.includes('not a representation that any PDF has passed an accessibility audit'),
 'Do not imply PDF accessibility certification');
assert.ok(contact.includes('id="contact-consent"')&&contact.includes('name="consent"'),
 'Contact response still requires a distinct consent decision');
assert.ok(read('api/site-inquiry.js').includes("'accessibility'"),
 'The existing contact handler must recognize accessibility inquiries');
assert.ok(!contact.includes('upload a case record'), 'The contact route must not solicit private case records');

// Public evidence exports must identify source and temporal coverage.
const aggregatePage=read('datasets.html'),publicResearch=read('research-summary.html');
const publicChronology=read('evidence-ledger.html');
const fallback=JSON.parse(read('results.json'));
assert.ok(aggregatePage.includes("DATA_SOURCE='dated historical snapshot'") &&
 aggregatePage.includes('Archived fallback, not current research data'),
 'public aggregate exports must explicitly label use of dated fallback data');
assert.ok(aggregatePage.includes('2026-06-03') &&
 fallback.updated==='2026-06-03' && fallback.participants===1,
 'public fallback snapshot date and scope must agree with the notice');
assert.ok(aggregatePage.includes('not the current evidence base for the 16-expert detection result'),
 'challenge aggregates must be separated from method-validation datasets');
assert.ok(publicResearch.includes('Public Challenge Aggregates') &&
 publicResearch.includes('Public Programme Chronology'),
 'research hub must distinguish aggregate exports from controlled evidence ledger');
assert.ok(publicChronology.includes('not the authoritative internal evidence register'),
 'public chronology must disclose that it is not the complete evidence ledger');

// Direct readers to the three current, discipline-specific investigator
// field guides; keep the former combined overview identifiable as historical.
const methodology=read('jrsstandard.html');
assert.ok(!methodology.includes('href="/api/dl?f=JRS_Investigator_Field_Guide.pdf'),
 'online method must not promote the historical combined guide as a current download');
for(const label of [
 'Open current v1.1 guides',
 'Choose current guides',
 'Open current investigator guides (v1.1)'
]){
 assert.ok(methodology.includes('href="investigator-guides.html"') &&
  methodology.includes('>'+label+'</a>'),
  'current guide navigation missing: '+label);
}
assert.ok(methodology.includes('JRS Investigator Guide (Combined Overview, historical)') &&
 methodology.includes('001-INV &middot; Earlier combined edition'),
 'historical combined overview must remain distinguishable from the current supplements');

// A retained security reference is not an active enterprise data-intake form.
// The legacy /api/enterprise-inquiry endpoint has returned 410 since retirement.
const archivedSecurity=read('security.html');
assert.ok(archivedSecurity.includes('Archive, not an active interface.') &&
 archivedSecurity.includes('href="contact.html?category=organization"'),
 'security reference must retain a clear archive boundary and non-sensitive contact path');
assert.ok(!archivedSecurity.includes('/api/enterprise-inquiry') &&
 !archivedSecurity.includes('form[data-cap]') &&
 !archivedSecurity.includes('You will get the schema, the tier'),
 'retired enterprise capture or unsupported submission promise reintroduced');
assert.ok(read('api/enterprise-inquiry.js').includes('status:410'),
 'legacy enterprise endpoint must remain unavailable');

if(errors.length){
 console.error('FAIL: '+errors.length+' issues across '+pages.length+
 ' pages, '+links+' links, '+tracked+' downloads and '+fragments+' fragments.');
 for(const x of errors.slice(0,110))console.error(' - '+x);
 process.exitCode=1;
}else console.log('PASS: '+pages.length+' public pages; '+links+' internal links; '+
 targets+' local targets; '+tracked+' tracked downloads; '+fragments+
 ' section anchors; document inventories and research/version crosswalks.');

// JRS two-initiative resource-first acceptance contract.
// Source checks do not establish hosted access, email delivery, adoption or influence effectiveness.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, join} from 'node:path';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=path=>readFileSync(join(root,path),'utf8');
const rights=read('right-to-know-why.html');
const professional=read('decisions-you-can-defend.html');
const home=read('index.html');
const resources=read('resources.html');
const privacy=read('privacy-notice.html');
const engagement=read('assets/jrs-engagement.js');
const sitemap=read('sitemap.xml');
const config=JSON.parse(read('vercel.json'));
const campaigns=[['public interest',rights],['professional',professional]];

test('public site introduces both initiatives as free-resource paths, not as case demonstrations',()=>{
 assert.match(home,/The Right to Know Why/);
 assert.match(home,/Decisions You Can Defend/);
 assert.match(home,/right-to-know-why\.html#free-resources/);
 assert.match(home,/decisions-you-can-defend\.html#free-resources/);
 assert.doesNotMatch(home,/id="everyday-decisions"|id="worked-record"|#constructed-example|#everyday-decisions/);
 assert.match(resources,/id="professional-communities"/);
 assert.match(resources,/href="investigator-guides\.html"/);
 assert.match(resources,/href="training\.html#training-modules"/);
 assert.doesNotMatch(resources,/#everyday-decisions|#worked-record/);
});

test('homepage provides a solid Safari header treatment and no simulation-led CTA',()=>{
 const css=read('assets/jrs-institutional-reference.css');
 assert.ok(home.includes('<meta name="theme-color" content="#f5f7f8">'));
 assert.ok(home.includes('.site-header{background:#162f46;backdrop-filter:none;-webkit-backdrop-filter:none}'));
 assert.ok(css.includes('html{background:#f5f7f8}'));
 assert.ok(css.includes('backdrop-filter:none!important;-webkit-backdrop-filter:none!important'));
 assert.doesNotMatch(home,/See five fictional decision examples|Reviewer training and simulations|\.site-header\{background:rgba\(7,7,6,\.88\);backdrop-filter:blur\(12px\)/);
 // Source checks do not establish physical iPhone Safari or scrolling acceptance.
});

test('iOS 27 Safari solid status chrome appears at initial paint on homepage and both initiatives',()=>{
 const css=read('assets/jrs-institutional-reference.css');
 assert.match(css,/@supports\s*\(-webkit-touch-callout:\s*none\)/);
 assert.match(css,/\.jrs-ios-status-surface\s*\{[\s\S]*?position:fixed!important;top:0!important;left:0!important;/);
 assert.match(css,/height:10px!important/);
 assert.match(css,/background:#f5f7f8!important/);
 assert.match(css,/-webkit-backdrop-filter:none!important/);
 // Add normal-flow spacing under the iPhone status-bar region without changing its blur fix.
 assert.match(css,/body\.jrs-institutional\s*\{\s*padding-top:14px!important;/);
 for(const [page,html] of [['index.html',home],['right-to-know-why.html',rights],['decisions-you-can-defend.html',professional]]){
  assert.match(html,/<body class="jrs-institutional[^"]*">\s*<div class="jrs-ios-status-surface" aria-hidden="true"><\/div>/,page+' must have a first-paint real element');
  assert.ok(html.includes('jrs-institutional-reference.css'),page+' must load matching CSS');
 }
 // A source test cannot certify Safari or installed Home Screen rendering.
});

test('all principal institutional entry routes have a solid first-paint iOS top edge',()=>{
 const css=read('assets/jrs-institutional-reference.css');
 assert.match(css,/html:has\\(> body\\.jrs-institutional\\):not\\(:has\\(> body > \\.jrs-ios-status-surface\\)\\)::before/);
 assert.match(css,/body\\.jrs-institutional\\s*\\{\\s*padding-top:14px!important;/);
 for(const page of ["resources.html","training.html","investigator-guides.html","check.html","about.html","research.html","contact.html","jrsstandard.html","organization.html","practitioner-questions.html","decision-reconstruction-risk.html","reference/index.html","cite-jrs.html"]){
  const html=read(page);
  assert.match(html,/<body\\b[^>]*>\\s*<div class="jrs-ios-status-surface" aria-hidden="true"><\\/div>/,page);
  assert.match(html,/<meta name="theme-color" content="#f5f7f8">/,page);
 }
 // Source-level protection only: Safari status-bar behavior must be tested on-device.
});

test('campaigns are included in complete rendered mobile audit',()=>{
 const source=read('tests/jrs-sitewide-mobile-browser-audit.html');
 const match=source.match(/const paths=(\[[^\n;]*\]);/);
 assert.ok(match,'audited route array missing');
 const paths=JSON.parse(match[1]);
 for(const page of ['right-to-know-why.html','decisions-you-can-defend.html'])
  assert.equal(paths.filter(path=>path===page).length,1,page+' must have one browser route');
});

test('resource-first public entry routes do not promote historical simulations',()=>{
 for(const page of ['index.html','resources.html','about.html','organization.html']){
  const s=read(page);
  assert.doesNotMatch(s,/href="simulations\.html"/,page);
 }
 assert.match(resources,/ai-drafted-record-source-verification\.html/);
 assert.match(resources,/Which tool\?/);
 assert.match(home,/The seven-point check is a quick screen/);
 assert.equal((resources.match(/class="jrs-resource-entry"/g)||[]).length,16);
});

test('exercise archives are preserved but excluded from public sitemap and indexing',()=>{
 for(const p of ['simulations.html','implementation-scenarios.html']){
  const s=read(p);
  assert.match(s,/name="robots" content="noindex,follow"/,p);
  assert.match(s,/Historical archive\./,p);
  assert.ok(!sitemap.includes('/'+p),'archived sitemap route '+p);
 }
 for(const redirect of ['/bench-admin','/bench-review','/org-pilot','/review-status','/submit-validation','/vp-7c1f9a4e8d2b6035'])
  assert.ok(!config.redirects.some(r=>r.source===redirect),'stale redirect '+redirect);
});

test('mobile audit covers newly published indexed references',()=>{
 const s=read('tests/jrs-sitewide-mobile-browser-audit.html');
 const match=s.match(/const paths=(\[[^\n;]*\]);/);
 assert.ok(match);
 const paths=JSON.parse(match[1]);
 assert.equal(paths.length,68);
 assert.equal(new Set(paths).size,68);
 for(const p of ['editions.html','organization.html','practitioner-questions.html','cite-jrs.html','field-evidence-status.html',
 'investigation-report-evidence-check.html','ai-drafted-record-source-verification.html','decision-record-chronology-review.html','supplier-access-exception-documentation.html'])
  assert.ok(paths.includes(p),'missing mobile audit route '+p);
});

test('current contact receipt never asserts successful owner mailbox delivery',()=>{
 const c=read('contact.html');
 assert.match(c,/Service acceptance does not establish that an email notification reached/);
 assert.match(c,/Inquiry accepted by Formspree/);
 assert.doesNotMatch(c,/mailto:phillipwikes@gmail\.com/);
});

test('public-interest campaign gives resources and defines DRR without claiming new legal rights',()=>{
 assert.match(rights,/The Right to Know Why/);
 assert.match(rights,/id="free-resources"/);
 assert.match(rights,/Decision Reconstruction Risk \(DRR\)/);
 assert.match(rights,/href="resources\.html"/);
 assert.match(rights,/href="decision-reconstruction-risk\.html"/);
 assert.match(rights,/href="research-summary\.html"/);
 assert.match(rights,/not a newly created legal right/i);
});

test('professional campaign provides concrete practitioner materials without an exercise gate',()=>{
 assert.match(professional,/Decisions You Can Defend/);
 assert.match(professional,/id="free-resources"/);
 for(const href of ['investigator-guides.html','check.html','training.html#training-modules','resources.html#resource-catalog'])
  assert.ok(professional.includes('href="'+href+'"'),'missing resource '+href);
 assert.match(professional,/Decision Reconstruction Risk \(DRR\)/);
 assert.match(professional,/operational validation/i);
});

test('no initiative reconstructs fictional cases or links to removed scenario anchors',()=>{
 for(const [label,source] of campaigns){
  assert.doesNotMatch(source,/constructed-example|jrs-reconstruction-step|H-118|TR-204|scenario-hiring|fictional (case|decision|record)|exercise/i,label);
  assert.doesNotMatch(source,/<details\b/i,label);
  assert.ok(source.indexOf('id="free-resources"')<source.indexOf('id="support-the-principle"'),label);
  assert.doesNotMatch(source,/jrs-scenario-(?:hiring|termination|benefits|medical|ai)\.svg/,label);
 }
});

test('founder authority is truthful, independent and limited',()=>{
 for(const [label,source] of campaigns){
  assert.match(source,/Phillip Wikes/,label);
  assert.match(source,/former Lead Civil Rights Officer at the Maryland Commission on Civil Rights/,label);
  assert.match(source,/government endorsement|agency approval|agency adoption/i,label);
  assert.doesNotMatch(source,/official Maryland Commission standard|government certified/i,label);
 }
});

test('resources are free and optional support does not gate access',()=>{
 for(const [label,source] of campaigns){
  assert.match(source,/No payment|No cost|no payment|no purchase/i,label);
  assert.match(source,/no (?:required |mandatory )?(?:account|registration|reply|support)/i,label);
  assert.match(source,/method="post" action="\/api\/support\?c=(?:rtkw|defend)&amp;src=campaign_page&amp;next=confirmation"/,label);
  assert.match(source,/not (?:proof|an institutional|a government|an agency)|not proof of/i,label);
 }
 for(const path of ['investigator-guides.html','training.html','check.html','decision-reconstruction-risk.html'])
  assert.ok(existsSync(join(root,path)),'missing '+path);
});

test('passive campaign navigation is never written as support',()=>{
 const expected={'/right-to-know-why':'/right-to-know-why.html','/rtkw':'/right-to-know-why.html',
 '/decisions-you-can-defend':'/decisions-you-can-defend.html','/defend':'/decisions-you-can-defend.html'};
 for(const [source,target] of Object.entries(expected)){
  const rows=config.redirects.filter(r=>r.source===source);
  assert.equal(rows.length,1,'ambiguous route '+source);
  assert.equal(rows[0].destination,target,'redirect changed '+source);
 }
});

test('retired public email builder remains absent',()=>{
 assert.equal(existsSync(join(root,'outreach-email-builder.html')),false);
 for(const [label,source] of [['rights',rights],['professional',professional],['privacy',privacy],['sitemap',sitemap],['analytics',engagement]])
  assert.doesNotMatch(source,/outreach-email-builder|draft_builder_open|jrs_draft_builder_open/i,label);
 for(const source of ['/outreach-email-builder','/outreach-email-builder.html']){
  const rows=config.redirects.filter(r=>r.source===source);
  assert.equal(rows.length,1);
  assert.equal(rows[0].destination,'/resources.html');
 }
});

test('ethical influence claims must never invent validation, scarcity or endorsements',()=>{
 for(const [label,source] of campaigns){
  assert.doesNotMatch(source,/scientifically proven by Cialdini|Cialdini-certified|adopted by leading agencies|limited seats|limited time/i,label);
  assert.match(source,/operational validation/i,label);
 }
 assert.match(privacy,/Aggregate endorsement totals must not be described as unique people/i);
});

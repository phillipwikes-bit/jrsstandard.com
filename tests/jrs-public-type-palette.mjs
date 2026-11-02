// Source-level guard for presentation alignment across JRS's public routes.
// Does not assert screen-reader certification, rendered PDF styling, or form outcomes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const bridge=load('assets/jrs-legacy-public-alignment.css');
const shared=load('assets/jrs-institutional-reference.css');
const legacy=[
 'access.html','reviewer/evaluation.html','reviewer/completion.html',
 'recheck.html','security.html','review-engine.html'
];
for(const path of legacy){
 const html=load(path);
 assert.match(html,/<body class="jrs-institutional jrs-legacy-public(?: jrs-technical-route)?">/,path+': required opt-in missing');
 assert.ok(html.includes('href="/assets/jrs-institutional-reference.css"'),path+': shared theme missing');
 assert.ok(html.includes('href="/assets/jrs-legacy-public-alignment.css"'),path+': legacy bridge missing');
 assert.equal((html.match(/href="\/assets\/jrs-legacy-public-alignment.css"/g)||[]).length,1,path+': duplicate theme');
 assert.ok(html.indexOf('/assets/jrs-legacy-public-alignment.css')<html.indexOf('</head>'),path+': theme outside head');
}
for(const path of ['index.html','resources.html','research.html','jrsstandard.html','training.html','investigator-guides.html']){
 const html=load(path);
 assert.match(html,/<body class="[^"]*jrs-institutional/,path+': institutional theme regressed');
 assert.ok(html.includes('/assets/jrs-institutional-reference.css'),path+': shared stylesheet removed');
}
const references=[
 'reference/index.html','reference/ai-assisted-record-failure-modes/index.html',
 'reference/ai-verification-controls/index.html','reference/decision-context-loss/index.html',
 'reference/deployment-models/index.html','reference/documentation-risk-tiers/index.html',
 'reference/escalation-triggers/index.html','reference/field-conditions/index.html',
 'reference/implementation-maturity-levels/index.html','reference/later-review-failure-cascades/index.html',
 'reference/missing-chronology/index.html','reference/record-survivability/index.html',
 'reference/reviewer-responsibility-boundaries/index.html','reference/reviewer-worksheet/index.html',
 'reference/second-line-review-model/index.html','reference/traveler-test/index.html',
 'reference/unsupported-generalization/index.html'
];
for(const path of references){
 const html=load(path);
 assert.match(html,/<body class="[^"]*jrs-institutional/,path+': reference theme missing');
 assert.ok(html.includes('/assets/jrs-institutional-reference.css'),path+': reference shared CSS missing');
}
for(const fragment of ['#f5f7f8','#193148','#193e58','#fff','font:400 16px','min-height:44px','focus-visible','prefers-reduced-motion']){
 assert.ok(bridge.includes(fragment),'missing legacy theme token or behavior: '+fragment);
}
assert.ok(shared.includes('--jrs-navy:#17364f'),'shared institutional palette changed');
assert.ok(shared.includes('font-family:Inter'),'shared institutional type changed');
const protectedLogin=load('owner-login.html');
assert.ok(!protectedLogin.includes('jrs-legacy-public-alignment.css') &&
 !protectedLogin.includes('class="jrs-institutional jrs-legacy-public"'),
 'private owner sign-in must not be restyled by the public legacy bridge');
const engine=load('review-engine.html');
assert.ok(engine.includes('Public technical status information has moved.') &&
 engine.includes('resources.html'),'historical Review Engine closure route changed');
const standard=load('jrsstandard.html'),training=load('training.html');
assert.ok(standard.includes('jrs-standard-page') && training.includes('jrs-training-page'),
 'Standard or Training body style scope changed');
const resource=load('resources.html');
assert.ok(resource.includes('Version 2.0 (2026)') && resource.includes('Version 1.1 (July 2026)'),
 'published edition boundaries must remain identified');
const pdfFiles=[
 'JRS-Standard.pdf','JRS_Rapid_Review_Card.pdf',
 'JRS_Investigator_Field_Guide_Employment.pdf',
 'JRS_Investigator_Field_Guide_FairHousing.pdf',
 'JRS_Investigator_Field_Guide_International.pdf',
 'JRS-Reference-9d4f2a7c.pdf',
 'JRS_Reliability_Accuracy.pdf','JRS_Research_Paper.pdf',
 'JRS_Investigator_Field_Guide.pdf'
];
for(const path of pdfFiles){
 const bytes=readFileSync(new URL('../'+path,import.meta.url));
 assert.ok(bytes.length>1000 && bytes.subarray(0,5).toString()==='%PDF-',path+': invalid published PDF');
}
// Training's locally generated certificate must follow the current public
// institutional palette and must not describe itself as an internal distribution.
// The educational-only boundary and PNG download must remain intact.
const cert=training.slice(training.indexOf('function generateCert() {'),
 training.indexOf('function downloadCert() {'));
assert.ok(cert.length>1500,'training certificate drawing function missing');
for(const token of ["'#F5F7F8'","'#FFFFFF'","'#17364F'","'#193148'","Georgia,serif",
 'Inter,system-ui,sans-serif',"RECORD OF COMPLETION","all six learning modules",
 'Not professional certification','© 2026 Phillip Wikes']){
 assert.ok(cert.includes(token),'training PNG presentation/identity changed: '+token);
}
assert.ok(!cert.includes('INTERNAL DISTRIBUTION')&&!cert.includes("ctx.fillStyle = '#0A0A0A'"),
 'legacy black-and-gold certificate is not aligned with current website');
assert.ok(training.includes("a.download = 'JRS-Completion-'")&&training.includes(".png';"),
 'training completion must remain a locally downloadable PNG');
const researchSummary=load('research-summary.html');
assert.ok(researchSummary.includes('/api/dl?e=accuracy&amp;src=research-summary')&&
 researchSummary.includes('/api/dl?e=paper&amp;src=research-summary'),
 'research PDF routes missing');
assert.ok(standard.includes('/api/dl?f=JRS_Investigator_Field_Guide.pdf&amp;src=jrsstandard'),
 'legacy general investigator guide route missing');
console.log('PASS: 6 legacy routes, 6 principal pages, 17 reference pages, 9 linked PDF assets and locally generated training completion PNG guarded. PDF harmonization remains a separate controlled publication task.');

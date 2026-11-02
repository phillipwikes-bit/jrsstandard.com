// Synthetic, non-PII checks for the Issue 3.6 private owner programme map.
// Does not read participant data or exercise an outbound communication.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {GROUPS,participantGroup,permissionState} from '../api/_owner-record-groups.js';

assert.equal(participantGroup('guide-register',{}),GROUPS.public);
assert.equal(participantGroup('support-register',{}),GROUPS.public);
assert.equal(participantGroup('training-enroll',{}),GROUPS.training);
assert.equal(participantGroup('training-complete',{}),GROUPS.training);
assert.equal(participantGroup('pilot',{}),GROUPS.research);
assert.equal(participantGroup('contributor-confirm',{}),GROUPS.research);
assert.equal(participantGroup('reviewer-cert',{}),GROUPS.research);
assert.equal(participantGroup('org-pilot',{}),GROUPS.organizations);
assert.equal(participantGroup('enterprise-inquiry',{}),GROUPS.commercial);
assert.equal(participantGroup('checkout-fallback',{}),GROUPS.commercial);
assert.equal(participantGroup('site-inquiry',{category:'commercial'}),GROUPS.commercial);
assert.equal(participantGroup('site-inquiry',{category:'research'}),GROUPS.research);
assert.equal(participantGroup('site-inquiry',{category:'training'}),GROUPS.training);
assert.equal(participantGroup('site-inquiry',{category:'organization'}),GROUPS.organizations);
assert.equal(participantGroup('site-inquiry',{category:'general'}),GROUPS.enquiries);
assert.equal(participantGroup('site-inquiry',{category:'other'}),GROUPS.enquiries);
assert.equal(participantGroup('new-unknown-stream',{}),GROUPS.other);
assert.equal(participantGroup('site-inquiry',null),GROUPS.enquiries);

assert.equal(permissionState({},['consent_contact','consent_to_contact']),'not-recorded');
assert.equal(permissionState({consent_contact:false},['consent_contact','consent_to_contact']),'recorded-no');
assert.equal(permissionState({consent_to_contact:true},['consent_contact','consent_to_contact']),'recorded-yes');
assert.equal(permissionState({consent_contact:false,consent_to_contact:true},['consent_contact','consent_to_contact']),'conflicting');
assert.equal(permissionState({consent_contact:true,consent_to_contact:false},['consent_contact','consent_to_contact']),'conflicting');
assert.equal(permissionState({consent_named:false,consent_named_org:true},['consent_named','consent_named_org']),'conflicting');
assert.equal(permissionState({consent_transfer:'true'},['consent_transfer']),'not-recorded');
assert.equal(permissionState({consent_public_list:0},['consent_public_list']),'not-recorded');
assert.equal(permissionState({consent_public_list:false},['consent_public_list']),'recorded-no');

const people=readFileSync(new URL('../api/people-9dd1ecdf6f8cdfd4.js',import.meta.url),'utf8');
assert.match(people,/const denied=await ownerAccess\(req\)/);
assert.match(people,/activity_family: participantGroup\(src,p\)/);
assert.match(people,/consent_contact_state: contactPermission/);
assert.match(people,/publication_scope: publicScope/);
assert.match(people,/consent_to_contact === true/);
assert.match(people,/fetchAllUrl\(/);
assert.ok(!/\.delete\(\)|method:\s*['"]DELETE/.test(people));

const html=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
for(const id of ['programme-map','resource-downloads','training-adoption',
  'everyone-on-the-record','ppl-tbl','ppl-csv','ppl-group','ppl-contact',
  'private-contact-detail','contacts-and-commercial','tier-two-portfolio',
  'buyer-evidence-snapshot','sale-dossier','owner-release-readiness']){
  assert.ok(html.includes('id="'+id+'"'),'missing owner section: '+id);
}
assert.ok(html.includes('Issue 3.6 proposed'));
assert.ok(html.includes('Owner adoption not recorded'));
assert.ok(html.includes('Not recorded'));
assert.ok(html.includes('pplConsentText('));
assert.ok(html.includes('p.activity_family'));
assert.ok(html.includes('p.consent_contact_state'));
assert.ok(html.includes('Conflicting, review required'));
assert.ok(html.includes('p.publication_scope'));
assert.ok(html.includes('consent_organization_named_state'));
assert.ok(html.includes('window.confirm('));
assert.ok(html.includes('jrs-private-participant-register.csv'));
assert.ok(html.includes('jrs-private-participant-register.csv'));
assert.ok(html.includes('window.confirm('));
assert.ok(!html.includes('googletagmanager.com/gtag/js'));
assert.equal((html.match(/id="buyer-requests"/g)||[]).length,1);
const scriptMatches=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.ok(scriptMatches.length>=4);
for(const [i,m] of scriptMatches.entries())new Script(m[1],{filename:'owner-inline-'+i+'.js'});
console.log('PASS Issue 3.6 owner programme groups, unknown consent, protected-source continuity and inline JS syntax');

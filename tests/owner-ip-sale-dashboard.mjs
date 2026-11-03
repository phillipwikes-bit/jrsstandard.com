// Private owner dashboard: buyer diligence view, dated claims and access boundaries.
// Structural / synthetic regression; no owner data, browser auth or external calls.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const html=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const idset=new Set(ids);
assert.equal(idset.size,ids.length,'duplicate HTML IDs');
const begin=html.indexOf('<section id="ip-sale-intelligence"');
const end=html.indexOf('  <!-- Issue 3.6 organizational alignment.',begin);
const panel=html.slice(begin,end);
assert.ok(begin>0&&end>begin,'buyer overview must precede programme map');
assert.ok(begin<html.indexOf('id="programme-map"'),'IP briefing must be above programme metrics');
for(const id of ['ip-sale-intelligence','ipx-heading','ipx-assets','ipx-buyer-checks',
 'buyer-evidence-snapshot','tier-two-portfolio','owner-release-readiness',
 'sale-dossier','resource-downloads','training-adoption','contacts-and-commercial']){
 assert.ok(idset.has(id),'missing cross-reference '+id);
}
for(const href of [...panel.matchAll(/href="#([^"]+)"/g)].map(m=>m[1])){
 assert.ok(idset.has(href),'broken diligence anchor '+href);
}
assert.ok(html.includes('<title>JRS | Private IP Diligence and Programme Status</title>'));
assert.ok(html.includes('id="jrs-owner-ip-sale-visual"'));
assert.ok(html.includes('.ipx-intro{display:grid'));
assert.ok(html.includes('@media(max-width:600px)'));
assert.ok(html.includes('grid-template-columns:1fr'));
assert.ok(html.includes('.wrap,.hd-in{max-width:1120px}'));
assert.ok(html.includes('id="owner-auth-cover"'));
assert.ok(html.indexOf('id="owner-auth-cover"')<begin);
assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
assert.match(html,/<meta name="referrer" content="no-referrer">/);
assert.ok(!html.includes('googletagmanager.com/gtag/js'),'owner page must not carry GA');
assert.ok(!panel.includes('<script'),'no executable additions in static buyer panel');
assert.ok(!/https?:\/\//.test(panel),'no external endpoints or buyer links added');
assert.ok(!/mailto:/.test(panel),'no contact data in acquisition briefing');
assert.ok(!panel.includes('participant.email'),'no private records in acquisition briefing');
assert.ok(!panel.includes('window.open'),'no uncontrolled outbound content');
assert.match(panel,/SALE_READY: NOT ESTABLISHED/);
assert.match(panel,/grant-specific review/);
assert.match(panel,/Commercial reuse and contributor rights/);
assert.match(panel,/38-item register/);
assert.match(panel,/16 detection reviewers/);
assert.match(panel,/384 graded reads/);
assert.match(panel,/reported 83\.9% detection/);
assert.match(panel,/36-person full-set completer/);
assert.match(panel,/16 countries/);
assert.match(panel,/33 executed structured consent records/);
assert.match(panel,/not a fresh count of users, transactions or present-day rights/);
assert.match(panel,/not<\/strong> meet its preregistered two-part criterion/);
assert.match(panel,/Study publication and successor-publication scope/);
assert.match(panel,/no blanket commercial assignment/);
assert.match(panel,/neither fetches nor exports personal records/);
assert.match(panel,/not a prospectus, acquisition offer, financial valuation/);
assert.match(panel,/author(?:ity|ization) to sell/i);
assert.match(html,/Historical Sale Dossier \(13 August 2026\)/);
assert.match(html,/id="current-formspree-export" disabled/);
assert.match(html,/id="owner-signout"/);
assert.match(html,/id="buyer-requests"/);
assert.equal((html.match(/id="buyer-requests"/g)||[]).length,1);
assert.match(html,/id="release-readiness-verification"/);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length>=4);
for(const [i,s] of scripts.entries())new Script(s[1],{filename:'owner-inline-'+i+'.js'});
console.log('PASS private IP acquisition dashboard: dated evidence, scope warnings, layout, navigation, access barriers and inline JS');

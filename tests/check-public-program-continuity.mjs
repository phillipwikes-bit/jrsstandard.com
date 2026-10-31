#!/usr/bin/env node
// Public-interest renovation safeguard, 2026-10-31.
// Run: node tests/check-public-program-continuity.mjs
// Source integrity tests are necessary, not proof of live collection.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const read = file => fs.readFileSync(file);
const text = file => read(file).toString('utf8');
const baseline = JSON.parse(text('tests/public-program-baseline.json'));
let checks = 0;
function verify(label, test) { test(); console.log('PASS ' + label); checks++; }
const fileSha = file => {
 const data = read(file);
 const hdr = Buffer.from('blob ' + data.length + '\0');
 return createHash('sha1').update(hdr).update(data).digest('hex');
};
// A controlled change is permitted only when it names the frozen original,
// expected new blob, exact scope and the outstanding owner release decision.
// The immutable original 24-file baseline is not rewritten by this draft.
const exception=JSON.parse(text('tests/public-program-controlled-exceptions.json'));
verify('source exception is narrow, documented and not release-approved',()=>{
 assert.equal(exception.status,'PROPOSED_NOT_RELEASE_APPROVED');
 assert.equal(exception.owner_approval,'NOT_PROVIDED');
 assert.equal(exception.production_status,'HOLD');
 assert.deepEqual(Object.keys(exception.entries).sort(),["api/access-stats.js","api/asset-stats.js","api/enroll-stats.js","api/gate-stats.js","api/geo-stats.js","api/orgpilot-stats.js","api/support-stats.js","api/support.js"]);
 for(const [path,x] of Object.entries(exception.entries)){
  assert.equal(baseline.files[path],x.before_blob_sha);
  assert.notEqual(x.before_blob_sha,x.candidate_blob_sha);
  assert.equal(x.database_migration,false);
  assert.equal(x.history_rewrite,false);
 }
});
for (const [file, sha] of Object.entries(baseline.files)) {
 verify('frozen source identity or exact draft exception '+file,()=>{
  const allow=exception.entries[file];
  assert.equal(fileSha(file),allow?allow.candidate_blob_sha:sha,
    'Unrecorded change to existing data writer, statistics reader or owner dashboard');
 });
}
const canonical = '/programme-status-9872fb93cc94.html';
const alias = '/programme--9872fb93cc94.html';
const config = JSON.parse(text('vercel.json'));
verify('legacy URL redirects to authentic dashboard', () =>
 assert(config.redirects.some(r => r.source === alias && r.destination === canonical && r.permanent === false)));
verify('both dashboard paths intercepted by server authentication', () => {
 assert(config.proxy.matcher.includes(canonical));
 assert(config.proxy.matcher.includes(alias));
 const source = text('proxy.js');
 assert(source.includes('ownerAccess(request)'));
 assert(source.includes('if (!OWNER_PATHS.has(pathname)) return next();'));
 assert(source.includes(canonical));
 assert(source.includes(alias));
});
for (const path of [canonical, alias]) {
 verify('private/no-store/noindex response policy ' + path, () => {
  const group = config.headers.find(row => row.source === path);
  assert(group);
  const by = Object.fromEntries(group.headers.map(h => [h.key.toLowerCase(),h.value.toLowerCase()]));
  assert(by['cache-control']?.includes('private'));
  assert(by['cache-control']?.includes('no-store'));
  assert(by['x-robots-tag']?.includes('noindex'));
  assert.equal(by['referrer-policy'], 'no-referrer');
 });
}
verify('owner dashboard still gates its session and excludes Google Analytics beacon', () => {
 const source = text(canonical.slice(1));
 assert(source.includes("fetch('/api/owner-session'"));
 assert(!source.includes('googletagmanager.com/gtag/js'));
});
const api = [
 '/api/access-stats','/api/asset-stats','/api/contributor-stats','/api/enroll-admin',
 '/api/enroll-stats','/api/gate-stats','/api/geo-stats','/api/leads-4b7e2c9af106d385',
 '/api/orgpilot-stats','/api/owner-progress','/api/owner-release-readiness',
 '/api/owner-session','/api/panel-stats','/api/people-9dd1ecdf6f8cdfd4',
 '/api/site-inquiry-stats','/api/support-contacts','/api/support-stats'
];
verify('owner dashboard retains all 17 reporting and owner URLs', () => {
 const s=text(canonical.slice(1));
 for (const p of api) assert(s.includes(p), 'dashboard API missing: ' + p);
});
verify('existing download and support writers remain distinct', () => {
 const dl=text('api/dl.js'), support=text('api/support.js');
 for (const token of ['guide_downloads','interaction_events','guide-dl','pdf-dl','kit-dl'])
  assert(dl.includes(token), 'download source lost: '+token);
 for (const token of ['rtkw','defend','interaction_events'])
  assert(support.includes(token), 'initiative support source lost: '+token);
});
for (const page of ['drr.html','right-to-know-why.html','decisions-you-can-defend.html']) {
 verify('public initiative page present and free ' + page, () => {
  const s = text(page);
  assert(s.includes('Explore free resources'));
  assert(s.includes('href="resources.html"'));
  assert(s.includes('href="research.html"'));
  assert(!s.includes('href="/api/site-inquiry?'));
 });
}
console.log('PASS: ' + checks + ' source-level continuity checks. Live environment, database history, and actual devices still require acceptance.');

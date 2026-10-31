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
for (const [file, sha] of Object.entries(baseline.files)) {
 verify('pre-renovation source identity ' + file, () => {
  assert.equal(fileSha(file), sha, 'Measurement, reader or owner dashboard changed without baseline review');
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

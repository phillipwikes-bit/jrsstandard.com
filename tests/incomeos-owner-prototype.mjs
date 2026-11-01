// IncomeOS owner-only source QA. It checks source integrity, not private deployment access.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

const root = resolve('owner/incomeos');
const read = (f) => readFileSync(resolve(root, f), 'utf8');
const page = read('index.html');
const styles = read('incomeos.css');
const js = read('incomeos.js');
const feed = JSON.parse(read('opportunities.json'));
const manifest = JSON.parse(read('manifest.webmanifest'));
const icon = read('icon.svg');
const instructions = read('README.md');

new Script(js, { filename: 'owner/incomeos/incomeos.js' });
assert.match(page, /<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(page, /<meta name="referrer" content="no-referrer">/);
assert.match(page, /id="view-research"/);
assert.match(page, /id="view-assets"/);
assert.match(page, /id="view-ledger"/);
assert.match(page, /id="view-compound"/);
assert.match(page, /id="view-about"/);
assert.match(page, /type="date"/);
assert.match(page, /incomeos\.js/);

// The feed URL is referenced by the script, not the HTML.
assert.match(js, /fetch\("\.\/opportunities\.json"/);
assert.doesNotMatch(page, /(?:Review Engine|review-engine\.html|Open AI-Assisted Record Reviewer|Paste & Assess)/i);
assert.doesNotMatch(page, /<script[^>]+src="https?:/i);
assert.doesNotMatch(page, /<form[^>]+action=/i);
assert.doesNotMatch(js, /\bfetch\(\s*["']https?:/i);
assert.doesNotMatch(js, /XMLHttpRequest|sendBeacon|WebSocket/);
assert.match(instructions, /STAGING ONLY/);
assert.match(instructions, /DO NOT MERGE/);
assert.match(instructions, /server-side/);
assert.match(styles, /@media\(max-width:350px\)/);
assert.equal(manifest.start_url, '/owner/incomeos/');
assert.equal(manifest.scope, '/owner/incomeos/');
assert.match(icon, /^<svg/);
assert.equal(feed.asOf, '2026-11-01');
assert.ok(feed.studies.length >= 4);
assert.ok(feed.assets.length >= 4);
const ids = new Set();
for (const item of [...feed.studies, ...feed.assets]) {
  assert.ok(/^[a-z0-9-]{4,90}$/.test(item.id), 'stable public record ID required');
  assert.ok(!ids.has(item.id), 'IDs must be unique');
  ids.add(item.id);
  assert.ok(item.reviewed === feed.asOf, 'Source review date must match snapshot');
  assert.ok(item.title.length > 3);
  for (const url of [item.sourceUrl, item.url ?? item.opportunityUrl]) {
    assert.ok(url?.startsWith('https://'), 'Source routes must use HTTPS');
    const u = new URL(url);
    assert.ok(!u.username && !u.password, 'Never place a credential in URLs');
    assert.ok(!/localhost|127\.0\.0\.1/.test(u.hostname), 'No local route');
  }
}
for (const s of feed.studies) {
  assert.ok(s.paymentUsd > 0 && s.minutes > 0, 'Paid study and time must be positive');
  assert.ok(s.eligibility.length > 0);
  assert.ok(s.status.toLowerCase().includes('unconfirmed'), 'Do not assert seats available');
  assert.ok(/\d{4}-\d{2}-\d{2}/.test(s.eventEnd));
  assert.ok(s.url.includes('/r/') || s.url.includes('next='), 'Specific screener or study-specific registration required');
  assert.ok(!s.url.endsWith('/register'), 'Reject generic registration links');
}
for (const a of feed.assets) {
  assert.ok(a.capitalUsd > 0, 'Asset price or entry threshold required');
  assert.ok(a.risks.length >= 2, 'Material risks required');
  assert.match(a.status, /unconfirmed|not verified/i);
  if (a.historicalUsd !== null) assert.ok(a.historicalUsd >= 0 && a.historicalMonths > 0);
}
console.log('IncomeOS source QA passed: 5 views, ' + feed.studies.length + ' studies, ' + feed.assets.length + ' asset candidates, syntax and privacy checks.');

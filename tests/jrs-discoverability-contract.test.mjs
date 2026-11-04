import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const host = 'https://www.jrsstandard.com';
const xml = read('sitemap.xml');
const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const bibliography = JSON.parse(read('jrs-sources.json'));
const guide = read('llms.txt');

test('robots advertises exactly the canonical sitemap host', () => {
  assert.match(read('robots.txt'), /^Sitemap: https:\/\/www\.jrsstandard\.com\/sitemap\.xml$/m);
});

test('sitemap uses a single host and unique, absolute HTTPS URLs', () => {
  assert.ok(locations.length > 20);
  assert.equal(locations.length, new Set(locations).size);
  for (const value of locations) {
    assert.equal(new URL(value).origin, host);
    assert.ok(!new URL(value).search && !new URL(value).hash);
  }
});

test('online methodology is discoverable and self-canonical, not canonically folded into homepage', () => {
  assert.ok(locations.includes(host + '/jrsstandard.html'));
  const method = read('jrsstandard.html');
  assert.match(method, /<link rel="canonical" href="https:\/\/www\.jrsstandard\.com\/jrsstandard\.html"/);
  assert.match(method, /<meta property="og:url" content="https:\/\/www\.jrsstandard\.com\/jrsstandard\.html"/);
});

test('privacy sitemap points at final document, not the redirect source', () => {
  assert.ok(locations.includes(host + '/privacy-notice.html'));
  assert.ok(!locations.includes(host + '/privacy.html'));
});

test('machine-readable index routes to official sitemap HTML pages with stable unique IDs', () => {
  assert.equal(bibliography.format_version, '1.0');
  assert.equal(bibliography.review_conditions.length, 5);
  assert.equal(new Set(bibliography.review_conditions.map(c => c.name)).size, 5);
  assert.equal(new Set(bibliography.sources.map(s => s.id)).size, bibliography.sources.length);
  for (const source of bibliography.sources) {
    assert.ok(locations.includes(source.url), source.url + ' missing from sitemap');
    assert.match(guide, new RegExp(source.url.replaceAll('.', '\\.')));
  }
  assert.match(guide, /Do not submit confidential or identifiable records/);
  assert.match(bibliography.public_access_boundary, /No public automated record processing/);
});

// Public sitemap GA4 source-coverage guard.
// This checks source placement only. It cannot establish consent compliance,
// analytics receipt, visitor counts, or Google Search Console performance.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (relative) => readFileSync(join(root, relative), 'utf8');
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(urls.length, 53, 'current public sitemap excludes two historical simulations');
assert.equal(new Set(urls).size, urls.length, 'sitemap URLs must be unique');

const redirects = new Set(JSON.parse(read('vercel.json')).redirects.map(rule => rule.source));
const id = 'G-NVYHJ7BJ92';
const absent = [];
const invalid = [];
for (const value of urls) {
  const url = new URL(value);
  assert.equal(url.origin, 'https://www.jrsstandard.com', 'sitemap origin');
  const route = url.pathname;
  if (redirects.has(route)) invalid.push(route + ' is a redirect source');
  const relative = route === '/' ? 'index.html' : route.endsWith('.html') ? route.slice(1) : route.replace(/^\/|\/$/g, '') + '/index.html';
  if (!existsSync(join(root, relative))) { invalid.push(route + ' has no repository page'); continue; }
  const html = read(relative);
  if (!html.includes('googletagmanager.com/gtag/js?id=' + id) || !html.includes(id)) {
    absent.push(route);
  }
  const canonical = [...html.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/gi)].map(match => match[1]);
  if (canonical.length !== 1 || new URL(canonical[0]).pathname !== route.replace(/\/$/, '') && !(route === '/' && new URL(canonical[0]).pathname === '/')) {
    invalid.push(route + ' has a missing or mismatched canonical');
  }
}
assert.deepEqual(invalid, [], 'public sitemap pages must exist, avoid redirects and self-canonicalize');
assert.deepEqual(absent, [], 'all indexed public pages should carry the existing GA4 ID');
const privatePage = read('programme-status-9872fb93cc94.html');
assert.ok(!privatePage.includes('googletagmanager.com/gtag/js?id=' + id), 'owner-private surface must remain without a GA4 loader');
console.log('PASS: '+urls.length+' current public sitemap pages have source-level GA4 placement, self-canonicals and no redirected sitemap entries; owner page is untracked.');

// Source-level search-crawl readiness preflight, not a Google indexing report.
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.jrsstandard.com';
const read = file => readFileSync(join(root, file), 'utf8');
const sitemap = read('sitemap.xml');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const unique = new Set(locations);
const redirectSources = new Set(JSON.parse(read('vercel.json')).redirects.map(rule => rule.source));
const publicTitles = new Map();
const publicDescriptions = new Map();

assert.ok(locations.length > 40, 'Unexpectedly small public sitemap');
assert.equal(unique.size, locations.length, 'Duplicate sitemap locations');
assert.match(read('robots.txt'), /Sitemap:\s*https:\/\/www\.jrsstandard\.com\/sitemap\.xml/);

function canonical(html) {
  const links = [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)];
  assert.ok(links.length <= 1, 'Multiple canonical declarations');
  return links[0]?.[0].match(/\bhref=["']([^"']+)["']/i)?.[1] || null;
}
function noindex(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].some(m =>
    /\bname=["']robots["']/i.test(m[0]) &&
    /\bcontent=["'][^"']*\bnoindex\b/i.test(m[0])
  );
}
function uniqueSearchText(index, value, location, label) {
  const normalized = value.replace(/\s+/g, ' ').trim().toLowerCase();
  assert.ok(normalized, `Missing ${label}: ${location}`);
  assert.equal(index.has(normalized), false,
    `Duplicate ${label} on ${location} and ${index.get(normalized)}`);
  index.set(normalized, location);
}
function checkSearchMetadata(html, location) {
  const titleTags = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  assert.equal(titleTags.length, 1, `Expected one page title: ${location}`);
  uniqueSearchText(publicTitles, titleTags[0][1], location, 'page title');

  const descriptions = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => /\bname=["']description["']/i.test(tag));
  assert.equal(descriptions.length, 1, `Expected one meta description: ${location}`);
  const content = descriptions[0].match(/\bcontent=["']([^"']*)["']/i)?.[1] || '';
  uniqueSearchText(publicDescriptions, content, location, 'meta description');
  assert.match(html, /<h1\b/i, `Missing primary page heading: ${location}`);
}
function publicHtmlFiles(directory = root) {
  const files = [];
  for (const item of readdirSync(directory, {withFileTypes: true})) {
    if (item.isDirectory()) {
      if (['.git', 'node_modules', 'tests'].includes(item.name)) continue;
      files.push(...publicHtmlFiles(join(directory, item.name)));
    } else if (item.name.endsWith('.html')) {
      files.push(relative(root, join(directory, item.name)).replaceAll('\\', '/'));
    }
  }
  return files;
}
function fileFor(location) {
  const url = new URL(location);
  const path = url.pathname.slice(1);
  if (!path) return 'index.html';
  return path.endsWith('.html') ? path : `${path.replace(/\/$/, '')}/index.html`;
}

let covered = 0;
for (const location of locations) {
  const url = new URL(location);
  assert.equal(url.origin, origin, `Wrong sitemap origin: ${location}`);
  assert.equal(url.search + url.hash, '', `Sitemap must use canonical bare URLs: ${location}`);
  assert.equal(redirectSources.has(url.pathname), false, `Redirected URL in sitemap: ${location}`);
  const path = fileFor(location);
  assert.ok(existsSync(join(root, path)), `Sitemap destination missing from source: ${location}`);
  const html = read(path);
  assert.equal(noindex(html), false, `Noindex destination in sitemap: ${location}`);
  assert.equal(canonical(html), location, `Sitemap/canonical disagreement: ${location}`);
  checkSearchMetadata(html, location);
  covered++;
}

for (const file of publicHtmlFiles()) {
  const html = read(file);
  const preferred = canonical(html);
  // Archive/source fixtures without a canonical are not search landing pages.
  if (!preferred || noindex(html)) continue;
  if (!preferred.startsWith(`${origin}/`)) continue;
  if (redirectSources.has(new URL(preferred).pathname)) continue;
  assert.ok(unique.has(preferred), `Indexable canonical page omitted from sitemap: ${file} (${preferred})`);
}

for (const campaign of ['right-to-know-why.html', 'decisions-you-can-defend.html']) {
  assert.ok(unique.has(`${origin}/${campaign}`), `Missing initiative page: ${campaign}`);
}
console.log(`PASS: ${covered} sitemap locations have matching public canonicals, unique titles and descriptions, and primary headings; no indexable canonical JRS pages omitted.`);
